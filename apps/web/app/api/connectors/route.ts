/**
 * GET /api/connectors — list provider connectors + auth status for current user.
 *
 * Returns the static catalog of supported providers (Anthropic / OpenAI /
 * Google) regardless of auth state, with a `status` field reflecting
 * whether the signed-in user has a stored credential. Signed-out callers
 * still get the catalog (every entry status='disconnected') so the UI
 * can render the connector list without an auth round-trip.
 */
import { fetchQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConnectorCatalogEntry {
  id: string;
  name: string;
  provider: "oauth" | "api-key";
  authUrl: string;
}

const CONNECTORS: ConnectorCatalogEntry[] = [
  { id: "anthropic", name: "Claude", provider: "oauth", authUrl: "/api/auth/anthropic/start" },
  { id: "openai", name: "OpenAI", provider: "api-key", authUrl: "/api/auth/openai/start" },
  { id: "google", name: "Gemini", provider: "oauth", authUrl: "/api/auth/google/start" },
];

export async function GET() {
  // Always return the catalog. If the user is signed in, decorate each
  // entry with `status: 'connected'` when a matching credential exists.
  let credentials: Array<{ provider: string; updatedAt?: number }> = [];
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (token) {
      const rows = await fetchQuery(api.providerCredentials.list, {}, { token });
      credentials = Array.isArray(rows) ? rows : [];
    }
  } catch {
    // Auth or Convex unreachable — fall back to catalog with all
    // disconnected. The UI must still render.
    credentials = [];
  }

  const credByProvider = new Map(credentials.map((c) => [c.provider, c]));
  const connectors = CONNECTORS.map((entry) => {
    const cred = credByProvider.get(entry.id);
    return {
      id: entry.id,
      name: entry.name,
      provider: entry.provider,
      authUrl: entry.authUrl,
      status: cred ? ("connected" as const) : ("disconnected" as const),
      lastConnectedAt: cred?.updatedAt ?? null,
    };
  });

  return Response.json({ connectors });
}
