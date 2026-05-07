/**
 * GET /api/auth/[provider]/callback — OAuth redirect target
 *
 * For Google, exchanges the authorization code for tokens, then calls the
 * Convex `providerCredentials.upsert` mutation under the current Clerk user.
 *
 * For anthropic/openai, this endpoint is unreachable in the normal flow
 * (start route bounces to /settings) but we still respond gracefully.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchMutation } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ provider: string }> };

const STATE_COOKIE = "byok_oauth_state";
const PKCE_COOKIE = "byok_oauth_pkce";

function originFromRequest(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

function settingsRedirect(
  request: Request,
  provider: string,
  params: Record<string, string>,
): NextResponse {
  const target = new URL("/settings", originFromRequest(request));
  target.searchParams.set("provider", provider);
  for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  return NextResponse.redirect(target, { status: 302 });
}

export async function GET(request: Request, { params }: Params) {
  const { provider } = await params;

  if (provider !== "google") {
    return settingsRedirect(request, provider, {
      error: "no_oauth_available",
      message: `${provider} OAuth callback is not implemented.`,
    });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return settingsRedirect(request, provider, {
      error: "provider_error",
      message: error,
    });
  }
  if (!code || !state) {
    return settingsRedirect(request, provider, {
      error: "missing_params",
      message: "Authorization code or state missing from callback.",
    });
  }

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  const codeVerifier = jar.get(PKCE_COOKIE)?.value;
  // Best-effort cleanup
  jar.delete(STATE_COOKIE);
  jar.delete(PKCE_COOKIE);

  if (!expectedState || expectedState !== state) {
    return settingsRedirect(request, provider, {
      error: "state_mismatch",
      message: "OAuth state cookie missing or did not match.",
    });
  }
  if (!codeVerifier) {
    return settingsRedirect(request, provider, {
      error: "pkce_missing",
      message: "PKCE verifier cookie missing.",
    });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return settingsRedirect(request, provider, {
      error: "server_config_missing",
      message: "Google OAuth client credentials not configured.",
    });
  }

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ??
    `${originFromRequest(request)}/api/auth/google/callback`;

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
    });
  } catch (err) {
    return settingsRedirect(request, provider, {
      error: "token_exchange_failed",
      message: String((err as Error)?.message ?? err),
    });
  }

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text().catch(() => "");
    return settingsRedirect(request, provider, {
      error: "token_exchange_failed",
      message: `Google returned ${tokenResponse.status}: ${text.slice(0, 200)}`,
    });
  }

  const tokens = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };

  if (!tokens.access_token) {
    return settingsRedirect(request, provider, {
      error: "no_access_token",
      message: "Google response did not contain an access_token.",
    });
  }

  // We need the Clerk-issued Convex JWT to write under the right user
  const { getToken } = await auth();
  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) {
    return settingsRedirect(request, provider, {
      error: "unauthorized",
      message: "You must be signed in to connect a provider.",
    });
  }

  try {
    await fetchMutation(
      api.providerCredentials.upsert,
      {
        provider: "google",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt:
          typeof tokens.expires_in === "number"
            ? Date.now() + tokens.expires_in * 1000
            : undefined,
        label: "Google (OAuth)",
        metadata: tokens.scope ? { scope: tokens.scope } : undefined,
      },
      { token: convexToken },
    );
  } catch (err) {
    return settingsRedirect(request, provider, {
      error: "store_failed",
      message: String((err as Error)?.message ?? err),
    });
  }

  return settingsRedirect(request, provider, {
    status: "connected",
  });
}
