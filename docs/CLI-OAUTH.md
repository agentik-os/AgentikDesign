# CLI OAuth — Device Code Flow

The local Claude Code CLI (and any other automation) authenticates against
AgentikDesign with an RFC 8628-style device-code flow. No client secret is
required; possession of the `device_code` is the secret.

## The four hops

1. `claude login` (or any CLI) → `POST /api/cli-auth/start`
   → `{ device_code, user_code, verification_uri, expires_in, interval }`
2. CLI prints `verification_uri` + `user_code`, opens the browser to it.
3. Browser hits `GET /api/cli-auth/callback?code=USERCODE` — Clerk sign-in
   gates the route, then approves the request and mints an `apiTokens` row.
4. CLI polls `POST /api/cli-auth/poll` `{ device_code }` every ~5 s until
   `{ status: "approved", token }` comes back. Token is stored at
   `~/.claude/credentials/agentik-design.json`.

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/cli-auth/start` | none | Bootstrap, returns `device_code`/`user_code` |
| GET | `/api/cli-auth/callback?code=` | Clerk | Browser-side approval page |
| POST | `/api/cli-auth/poll` | none | Returns `pending\|approved\|expired\|not_found` |
| GET | `/api/account` | Clerk | User profile + plan + 30d usage |
| GET | `/api/billing` | Clerk | Plan summary |
| POST | `/api/billing/portal` | Clerk | Stripe customer-portal URL |

Tokens live ~10 min before expiry. Approval is one-shot per `user_code`.
