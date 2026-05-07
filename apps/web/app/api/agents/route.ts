/**
 * GET /api/agents — list available coding agents for the current runtime.
 *
 * In cloud BYOK mode, we can't probe a local PATH, so we return a
 * curated catalog: cloud-byok agents that work over HTTP using the
 * caller's stored provider credential, plus cli-only agents that the
 * UI surfaces as "requires local install" with a `download` reason.
 */
import { fetchQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AgentCatalogEntry {
  id: string;
  name: string;
  kind: "cloud-byok" | "cli-only";
  description: string;
  requiresProvider?: "anthropic" | "openai" | "google" | "mcp";
}

const AGENTS: AgentCatalogEntry[] = [
  // Cloud BYOK — usable directly in the deployed app once the matching
  // provider credential is connected.
  {
    id: "claude-byok",
    name: "Claude (BYOK)",
    kind: "cloud-byok",
    description: "Anthropic Claude via your own API key or OAuth credential.",
    requiresProvider: "anthropic",
  },
  {
    id: "openai-byok",
    name: "OpenAI (BYOK)",
    kind: "cloud-byok",
    description: "OpenAI GPT models via your own API key.",
    requiresProvider: "openai",
  },
  {
    id: "gemini-byok",
    name: "Gemini (BYOK)",
    kind: "cloud-byok",
    description: "Google Gemini via your own API key or OAuth credential.",
    requiresProvider: "google",
  },
  // CLI-only — require local installation; surfaced as unavailable in
  // the cloud build with a reason the UI can render verbatim.
  {
    id: "claude-code",
    name: "Claude Code",
    kind: "cli-only",
    description: "Anthropic's official CLI for Claude.",
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    kind: "cli-only",
    description: "OpenAI's local Codex agent runtime.",
  },
  {
    id: "cursor-agent",
    name: "Cursor Agent",
    kind: "cli-only",
    description: "Cursor's headless agent CLI.",
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    kind: "cli-only",
    description: "Google's local Gemini CLI.",
  },
  {
    id: "opencode",
    name: "OpenCode",
    kind: "cli-only",
    description: "OpenCode local agent runtime.",
  },
  {
    id: "qwen",
    name: "Qwen Coder",
    kind: "cli-only",
    description: "Alibaba's Qwen Coder CLI.",
  },
  {
    id: "qoder-cli",
    name: "Qoder CLI",
    kind: "cli-only",
    description: "Qoder local agent CLI.",
  },
  {
    id: "copilot-cli",
    name: "GitHub Copilot CLI",
    kind: "cli-only",
    description: "GitHub Copilot local CLI.",
  },
];

const CLI_ONLY_REASON =
  "Requires local installation — see download page";

export async function GET() {
  // Resolve which providers the current user has credentials for so we
  // can flag cloud-byok agents as available.
  let credentials: Array<{ provider: string }> = [];
  try {
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" });
    if (token) {
      const rows = await fetchQuery(api.providerCredentials.list, {}, { token });
      credentials = Array.isArray(rows) ? rows : [];
    }
  } catch {
    credentials = [];
  }
  const connectedProviders = new Set(credentials.map((c) => c.provider));

  const agents = AGENTS.map((entry) => {
    if (entry.kind === "cli-only") {
      return {
        id: entry.id,
        name: entry.name,
        kind: entry.kind,
        description: entry.description,
        available: false,
        reason: CLI_ONLY_REASON,
      };
    }
    const requires = entry.requiresProvider;
    const available = requires ? connectedProviders.has(requires) : true;
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      description: entry.description,
      requiresProvider: requires,
      available,
      reason: available
        ? undefined
        : `Connect your ${requires} provider to enable this agent`,
    };
  });

  return Response.json({ agents });
}
