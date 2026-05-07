/**
 * GET /api/connectors/status — connector health/status panel data.
 *
 * Mirrors `/api/connectors` but is the endpoint the dashboard sidebar polls
 * for the connector status indicator. Returns the catalog with a `status`
 * field per provider. Signed-out users get the catalog with all entries
 * `disconnected` (the UI must still render).
 */
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getOptionalConvexAuth } from "../../_lib/convex-auth";

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
  let credentials: Array<{ provider: string; updatedAt?: number }> = [];
  const auth = await getOptionalConvexAuth();
  if (auth) {
    try {
      const rows = await fetchQuery(
        api.providerCredentials.list,
        {},
        { token: auth.token },
      );
      credentials = Array.isArray(rows) ? rows : [];
    } catch {
      credentials = [];
    }
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
