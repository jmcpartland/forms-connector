# CLAUDE.md

Context for Claude Code working in this repository.

## What this is
A local MCP server packaged as a Claude Desktop extension (`.mcpb`) that lets Claude create/edit Google Forms and read responses. Open source (MIT). Distribution model: **bring your own OAuth client (BYOC)**: each user creates their own Google Cloud project and OAuth client, pasting the ID/secret into the extension settings. No hosted component.

## Commands
```bash
npm ci
npm run typecheck   # tsc --noEmit
npm run bundle      # esbuild -> server/index.js only
npm run build       # typecheck + bundle + `mcpb validate` + `mcpb pack` -> dist/*.mcpb + .sha256
```
`server/` and `dist/` are build output (gitignored). Bump the version in **both** `package.json` and `manifest.json`; the build fails if they differ.

## Architecture (single file: `src/index.ts`)
- `McpServer` (stdio) with four tools: `create_form`, `get_form`, `add_question`, `list_responses`.
- OAuth: installed-app flow, PKCE (S256) + `state`, loopback HTTP listener on `127.0.0.1:<random port>`, 3-minute timeout. Token endpoint call includes the client secret (Google requires it for Desktop clients).
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
- v0.1.0 verified end to end by hand (sign-in, `create_form`, `add_question` for all six question types). No automated tests yet.
- Placeholders to fill: `<COPYRIGHT HOLDER>` in `LICENSE`; `author.name` in `manifest.json`; add `repository`/`homepage` to the manifest once the GitHub repo exists; `PRIVACY.md` is a draft.

## Good next tasks
1. Tests: unit-test the pure parts (question-type → Forms API payload mapping, token expiry logic) by extracting them from `index.ts`; mock `fetch`.
2. `update_form_info` tool (title/description via `batchUpdate` `updateFormInfo`) and tools to update/delete/move questions.
3. Hardening: clear error when sign-in times out; handle `403 accessNotConfigured` with a pointer to the BYOC guide; avoid concurrent sign-in windows when several tool calls arrive at once.
4. Windows verification of the browser-launch path (`cmd /c start`) and token-file permissions.
5. Add an icon and screenshots; add `repository`, `homepage` and privacy-policy fields to the manifest.
6. Decide on the shared-client/verification path (see Decisions).

## Testing end to end
Needs a real Google OAuth Desktop client (see `docs/BRING-YOUR-OWN-CLIENT.md`) and your account as a test user. `npm run build`, install `dist/*.mcpb` in Claude Desktop, enter the credentials, then ask Claude to create a form. Logs: `~/Library/Logs/Claude/` (macOS) or `%APPDATA%\Claude\logs` (Windows). Redact secrets from anything you paste.
