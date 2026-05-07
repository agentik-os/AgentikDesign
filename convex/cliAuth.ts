/**
 * CLI device-code OAuth flow.
 *
 * Pattern (RFC 8628-inspired, simplified):
 *   1. CLI calls `createDeviceRequest` → gets { deviceCode, userCode, ... }
 *   2. CLI prints the userCode + verification URL, then polls `pollDeviceRequest`
 *      with the deviceCode every few seconds.
 *   3. User opens the verification URL in a browser, signs in via Clerk, and
 *      hits the callback → `approveDeviceRequest` runs server-side, mints an
 *      `apiTokens` row, stores the plaintext token on the request.
 *   4. Next poll returns `approved` + the token. CLI stores it and stops polling.
 *
 * Notes (Karpathy: simplicity first):
 *   - Token is plaintext on disk in the request row. We rely on the 10-minute
 *     expiry + the deviceCode being a 32-byte secret only the originating CLI
 *     knows. Hashing-at-rest is a future improvement, not a bootstrap blocker.
 *   - Plaintext also lives in `apiTokens.token` (mirrors `providerCredentials.accessToken`).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const REQUEST_TTL_MS = 10 * 60 * 1000; // 10 min
// Unambiguous alphabet — no 0/O, 1/I/L
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomHex(byteLen: number): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomUserCode(len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => USER_CODE_ALPHABET[b % USER_CODE_ALPHABET.length])
    .join("");
}

function newApiToken(): string {
  return `ad_${randomHex(32)}`;
}

export const createDeviceRequest = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const deviceCode = randomHex(32);
    const userCode = randomUserCode(8);
    const expiresAt = now + REQUEST_TTL_MS;

    await ctx.db.insert("cliAuthRequests", {
      deviceCode,
      userCode,
      status: "pending",
      createdAt: now,
      expiresAt,
    });

    return {
      deviceCode,
      userCode,
      expiresAt,
      expiresIn: Math.floor(REQUEST_TTL_MS / 1000),
      interval: 5, // suggested polling interval in seconds
    };
  },
});

export const approveDeviceRequest = mutation({
  args: { userCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userCode = args.userCode.trim().toUpperCase();
    const request = await ctx.db
      .query("cliAuthRequests")
      .withIndex("byUserCode", (q) => q.eq("userCode", userCode))
      .unique();

    if (!request) throw new Error("Unknown user code");
    const now = Date.now();
    if (now > request.expiresAt) {
      if (request.status === "pending") {
        await ctx.db.patch(request._id, { status: "expired" });
      }
      throw new Error("User code expired");
    }
    if (request.status === "consumed") {
      throw new Error("Already used");
    }
    if (request.status === "approved") {
      // Idempotent re-approve: treat as success, do not mint a second token.
      return { ok: true, alreadyApproved: true };
    }

    const token = newApiToken();
    const tokenId = await ctx.db.insert("apiTokens", {
      userId: identity.subject,
      token,
      name: "claude-code-cli",
      createdAt: now,
    });

    await ctx.db.patch(request._id, {
      status: "approved",
      userId: identity.subject,
      issuedToken: token,
      tokenId,
    });

    return { ok: true, alreadyApproved: false };
  },
});

export const pollDeviceRequest = query({
  args: { deviceCode: v.string() },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("cliAuthRequests")
      .withIndex("byDeviceCode", (q) => q.eq("deviceCode", args.deviceCode))
      .unique();

    if (!request) {
      return { status: "not_found" as const };
    }

    // Note: queries are deterministic, so we can't mutate state here.
    // We compare against expiresAt and report "expired" — the next mutation
    // (approveDeviceRequest) will persist that transition.
    if (Date.now() > request.expiresAt && request.status === "pending") {
      return { status: "expired" as const };
    }

    if (request.status === "approved") {
      return {
        status: "approved" as const,
        token: request.issuedToken ?? null,
      };
    }

    return { status: request.status };
  },
});

/**
 * Look up an apiToken by its plaintext value. Internal helper for any future
 * bearer-auth middleware that wants to validate a CLI token.
 */
export const findApiToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("apiTokens")
      .withIndex("byToken", (q) => q.eq("token", args.token))
      .unique();
    if (!row) return null;
    if (row.revokedAt) return null;
    return { userId: row.userId, name: row.name, createdAt: row.createdAt };
  },
});
