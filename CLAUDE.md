# CLAUDE.md

Context for Claude Code working in this repository.

## What this is
A local MCP server packaged as a Claude Desktop extension (`.mcpb`) that lets Claude create/edit Google Forms and read responses. Open source (MIT). Distribution model: **bring your own OAuth client (BYOC)**: each user creates their own Google Cloud project and OAuth client, pasting the ID/secret into the extension settings. No hosted component.

## Commands
```bash
npm ci
npm run typecheck   # tsc --noEmit
npm test            # node:test unit tests in tests/ (Node 22.18+ runs the .ts directly)
npm run bundle      # esbuild -> server/index.js only
npm run build       # typecheck + tests + bundle + `mcpb validate` + `mcpb pack` -> dist/*.mcpb + .sha256
```
`server/` and `dist/` are build output (gitignored). Bump the version in **both** `package.json` and `manifest.json`; the build fails if they differ.

## Architecture
- `src/index.ts`: `McpServer` (stdio), OAuth, Forms API calls, and the 11 tool registrations: `create_form`, `get_form`, `add_question`, `add_questions`, `update_question`, `delete_item`, `move_item`, `update_form_info`, `update_form_settings`, `set_accepting_responses`, `list_responses`. Importing it starts the server, so keep testable logic out of it.
- Pure, unit-tested modules: `src/questions.ts` (tool args -> Forms API items, grading, `applyItemChanges`, `findItem`), `src/responses.ts` (responses keyed by question text), `src/token.ts` (expiry, `singleFlight`), `src/errors.ts` (friendly API errors).
- Tools that change an item look it up by `itemId` from `get_form`, then resolve it to an index at call time.
- OAuth: installed-app flow, PKCE (S256) + `state`, loopback HTTP listener on `127.0.0.1:<random port>` (exact Host check, GET /callback only, stray requests ignored), 3-minute timeout. Concurrent calls share one sign-in (`singleFlight`). Token endpoint call includes the client secret (Google requires it for Desktop clients).
- Token storage: `~/.google-forms-mcp/token.json` (dir 0700, file 0600). Refresh on expiry; falls back to interactive sign-in if the refresh token is revoked/expired.
- Forms API accessed with plain `fetch`, no `googleapis` dependency (keeps the bundle small).
- Bundled by esbuild into one ESM file, so the extension ships with no `node_modules`. Claude Desktop provides the Node runtime (macOS/Windows).
- Config arrives via env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, from the manifest's `user_config`.

## Decisions already made (don't relitigate without reason)
- **Local, not remote.** We never hold users' Google tokens. Keeps privacy/security simple.
- **BYOC for now.** A shared, Google-verified OAuth client would make install one-click for non-programmers but requires Google OAuth verification (production project, homepage, privacy policy, authorized domain, scope justification, demo video) and creates shared API quota/abuse concerns. Revisit later.
- **Narrow scopes only:** `forms.body`, `forms.responses.readonly`. No Drive scope, so there is deliberately no "list my forms" tool.
- **Never commit credentials.** If a shared client is ever added, inject its secret at release-build time (CI secret), not in source.
- Anthropic's connector directory has deprecated MCPB listings (check current docs); direct distribution via GitHub Releases is the plan.

## Status
- v0.2.0 released (GitHub Releases, with checksum and build-provenance attestation). All 11 tools verified live against the real Forms API; 35 unit tests; CI = build + CodeQL, both required on `main`.
- Forms API limits to remember: no response-validation fields; no listing of existing forms or file-upload questions without a Drive scope; `grade: {}` in a response means "wrong", since Google omits false/0 fields.
- Unverified: Windows (browser launch via `cmd /c start`, token-file permissions).

## Workflow
- `main` is protected: change via PR; `build` and `analyze` must pass. Bump the version in `package.json` and `manifest.json`, move `CHANGELOG.md`'s Unreleased section under the new version, then push a `v*` tag to publish.

## Good next tasks
1. Windows verification of the browser-launch path and token-file permissions.
2. Add an icon and screenshots to the manifest and README.
3. Possible features: grid questions, email-collection setting, per-answer feedback on quiz questions, image items.
4. Decide on the shared-client/verification path (see Decisions).

## Testing end to end
Needs a real Google OAuth Desktop client (see `docs/BRING-YOUR-OWN-CLIENT.md`) and your account as a test user. `npm run build`, install `dist/*.mcpb` in Claude Desktop, enter the credentials, then ask Claude to create a form. Logs: `~/Library/Logs/Claude/` (macOS) or `%APPDATA%\Claude\logs` (Windows). Redact secrets from anything you paste.
