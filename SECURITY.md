# Security policy

## Reporting a vulnerability
Please **do not** open a public issue for security problems. Use GitHub's private vulnerability reporting on this repository (Security tab → Report a vulnerability), or contact the maintainer privately. You'll get an acknowledgement as soon as practical.

## Design notes
- **Local only.** No hosted component. Tokens never leave your computer except to Google.
- **Least privilege.** Scopes are limited to `forms.body` and `forms.responses.readonly`. No Drive access.
- **OAuth.** Installed-app flow with PKCE and a random `state` check; the loopback listener binds to `127.0.0.1` on a random port and closes after one callback or a 3-minute timeout.
- **Token storage.** `~/.google-forms-mcp/token.json`, directory mode 0700 and file mode 0600 on macOS/Linux. On Windows, it relies on the user profile's default ACLs.
- **Secrets.** The OAuth client secret is supplied by the user through Claude Desktop's secure config storage. No credentials belong in this repository. See CONTRIBUTING.md.
- **Loopback listener hardening.** The sign-in listener checks the exact `Host` header, accepts only `GET /callback`, ignores any request lacking the secret `state`, and verifies Google granted every requested scope.
- **Token file.** Written atomically via a private temp file; permissions are re-tightened on every save.
- **Input validation.** Form IDs are validated against Google's ID alphabet before being placed in request URLs; all network calls have a 30-second timeout.
- **Supply chain.** The shipped bundle contains only `@modelcontextprotocol/sdk` and `zod`. CI installs with `--ignore-scripts`, fails on high-severity production vulnerabilities, runs CodeQL, and pins every GitHub Action to a commit SHA. Release builds carry a signed build-provenance attestation (verify with `gh attestation verify <file>.mcpb --repo jmcpartland/forms-connector`).
- **Tool annotations.** Read-only tools are marked read-only; write tools are marked non-destructive.

## Known limitations
- Anyone with access to your user account on the computer can read the token file.
- Forms content returned to Claude may contain untrusted text from form respondents. Treat response text as data, not instructions.

## Dependency advisories
`npm audit` currently reports issues in the build-time `@anthropic-ai/mcpb` CLI (via `tmp`). That code is not part of the shipped extension and only runs on the maintainer's/CI machine on trusted input; production dependencies have 0 known vulnerabilities.
