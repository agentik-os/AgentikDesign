/**
 * GET /api/auth/[provider]/start — begin OAuth flow for a provider
 *
 * Supported providers:
 *   - google     → real OAuth 2.0 redirect (PKCE-light, state cookie)
 *   - anthropic  → no public OAuth → bounce to /settings with helpful error
 *   - openai     → no public OAuth → bounce to /settings with helpful error
 */
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ provider: string }> };

const STATE_COOKIE = "byok_oauth_state";
const PKCE_COOKIE = "byok_oauth_pkce";
const COOKIE_MAX_AGE = 60 * 10; // 10 minutes

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function originFromRequest(request: Request): string {
  const url = new URL(request.url);
  // Honor x-forwarded-* when proxied (Vercel sets these)
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

export async function GET(request: Request, { params }: Params) {
  const { provider } = await params;

  if (provider === "anthropic" || provider === "openai") {
    const url = new URL(request.url);
    const target = new URL("/settings", originFromRequest(request));
    target.searchParams.set("provider", provider);
    target.searchParams.set("error", "no_oauth_available");
    target.searchParams.set(
      "message",
      `${provider} does not provide a public OAuth flow. Add an API key manually in Settings → Providers.`,
    );
    // Optional: respect ?return_to= for the originating page
    const returnTo = url.searchParams.get("return_to");
    if (returnTo) target.searchParams.set("return_to", returnTo);
    return NextResponse.redirect(target, { status: 302 });
  }

  if (provider !== "google") {
    return Response.json({ error: "unsupported_provider" }, { status: 400 });
  }

  // ---- Google OAuth 2.0 (Authorization Code + PKCE) ----
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    const target = new URL("/settings", originFromRequest(request));
    target.searchParams.set("provider", "google");
    target.searchParams.set("error", "client_id_missing");
    target.searchParams.set(
      "message",
      "GOOGLE_OAUTH_CLIENT_ID is not set on the server. Configure it in Vercel env.",
    );
    return NextResponse.redirect(target, { status: 302 });
  }

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${originFromRequest(request)}/api/auth/google/callback`;

  const scope =
    process.env.GOOGLE_OAUTH_SCOPE ??
    [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/generative-language.tuning",
    ].join(" ");

  // PKCE
  const codeVerifier = base64urlEncode(randomBytes(32));
  const codeChallenge = base64urlEncode(
    createHash("sha256").update(codeVerifier).digest(),
  );
  const state = base64urlEncode(randomBytes(16));

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  // Stash state + PKCE verifier in HttpOnly cookies for the callback
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  jar.set(PKCE_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return NextResponse.redirect(authUrl, { status: 302 });
}
