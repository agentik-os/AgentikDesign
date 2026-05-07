/**
 * GET /api/cli-auth/callback?code=USERCODE — browser-side approval.
 *
 * Auth required (Clerk). Confirms the user wants to bind the CLI's userCode
 * to their account. On success the next CLI poll returns the API token.
 *
 * Renders a minimal success/error HTML page rather than a JSON body so the
 * user can be told "you can close this tab now" in plain language.
 */
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";
import { getConvexAuth } from "../../_lib/convex-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlPage(opts: {
  ok: boolean;
  title: string;
  body: string;
  status?: number;
}): Response {
  const colour = opts.ok ? "#10b981" : "#ef4444";
  const heading = opts.ok ? "✓ " + opts.title : "✗ " + opts.title;
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${opts.title}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: #0b0b0c; color: #f4f4f5; display: grid; place-items: center; min-height: 100vh; margin: 0; }
  .card { max-width: 28rem; padding: 2rem; border: 1px solid #27272a; border-radius: 0.75rem; background: #18181b; }
  h1 { color: ${colour}; margin: 0 0 0.5rem; font-size: 1.25rem; }
  p { margin: 0.5rem 0; color: #a1a1aa; line-height: 1.5; }
  code { background: #27272a; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.875em; }
</style></head><body><div class="card"><h1>${heading}</h1>${opts.body}</div></body></html>`,
    {
      status: opts.status ?? 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function GET(request: Request) {
  const auth = await getConvexAuth();
  if (auth instanceof Response) {
    // Redirect to sign-in, preserving the userCode so we come back here.
    const url = new URL(request.url);
    const signIn = new URL("/sign-in", url.origin);
    signIn.searchParams.set("redirect_url", url.pathname + url.search);
    return Response.redirect(signIn.toString(), 302);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return htmlPage({
      ok: false,
      title: "Missing code",
      body: "<p>The verification link is missing the <code>code</code> parameter. Open the link your CLI printed.</p>",
      status: 400,
    });
  }

  try {
    const res = await fetchMutation(
      api.cliAuth.approveDeviceRequest,
      { userCode: code },
      { token: auth.token },
    );
    const note = res.alreadyApproved
      ? "<p>This code was already approved. Your CLI should already have a token.</p>"
      : "<p>Your CLI will pick up the token on its next poll. You can close this tab.</p>";
    return htmlPage({ ok: true, title: "CLI authorised", body: note });
  } catch (err) {
    const message = String((err as Error)?.message ?? err);
    return htmlPage({
      ok: false,
      title: "Authorisation failed",
      body: `<p>${message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c)}</p><p>You can re-run the CLI to get a fresh code.</p>`,
      status: 400,
    });
  }
}
