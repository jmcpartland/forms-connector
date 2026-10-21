# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup
```bash
npm ci
npm test           # unit tests (Node 22.18+)
npm run build      # typecheck + tests + bundle + validate + pack
```
Install `dist/*.mcpb` into Claude Desktop to test end to end. You'll need your own Google OAuth client (see docs/BRING-YOUR-OWN-CLIENT.md).

## Rules
- **Never commit credentials**: no client IDs/secrets, tokens, or `.env` files, and no secrets in test output or screenshots.
- **Keep scopes minimal.** Adding a scope needs a clear justification in the PR.
- **Tool changes:** update `manifest.json` (`tools`), set accurate MCP annotations (`readOnlyHint`, `destructiveHint`), and update the README table.
- Keep `package.json` and `manifest.json` versions in sync (the build checks this).
- Prefer no new runtime dependencies. The bundle ships to users.
- Add or update unit tests for logic you change, and add a line to `CHANGELOG.md`.
- Be kind; see CODE_OF_CONDUCT.md.
