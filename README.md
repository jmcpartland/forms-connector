# Forms Connector

Let Claude create and edit **Google Forms** and read their responses.

Forms Connector is a small, local extension for **Claude Desktop** (macOS and Windows). It runs on your own computer, signs in to *your* Google account, and talks directly to the Google Forms API. Nothing is sent to any server run by this project.

> **Status: early (v0.2).** Works end to end in testing. Expect rough edges.
> Not affiliated with, endorsed by, or sponsored by Google or Anthropic.

## What Claude can do with it

| Tool | What it does |
| --- | --- |
| `create_form` | Create a new form with a title and optional description |
| `get_form` | Read a form's title, description, questions and item IDs |
| `add_question` | Add a question or section: short text, paragraph, multiple choice, checkboxes, dropdown, 1–N scale, date, time. Supports descriptions, shuffled choices, an "Other" choice, and quiz correct answers and points |
| `add_questions` | Add many questions and sections in one call |
| `update_question` | Edit an existing question or section (text, options, required, grading) |
| `delete_item` | Delete a question or section |
| `move_item` | Reorder a question or section |
| `update_form_info` | Change a form's title or description |
| `update_form_settings` | Turn quiz mode on or off |
| `set_accepting_responses` | Open or close a form to responses |
| `list_responses` | Read submitted responses, with answers keyed by question text (or raw, keyed by question ID) |

Not supported yet: listing your existing forms (the Forms API can't do this without Drive access), file-upload and grid questions, changing a question's type in place (delete and re-add it instead), and response validation rules (the Forms API doesn't expose them).

## Install (about 10 minutes, one time)

You need Claude Desktop and a Google account. Because this is a free open-source project, **you bring your own Google "client"**, which is a free credential from your own Google Cloud project. It's the most privacy-friendly option, and it means there's no shared quota and no shared account.

1. Follow the **[Bring Your Own Client guide](docs/BRING-YOUR-OWN-CLIENT.md)** to get a Client ID and Client Secret.
2. Download `forms-connector-<version>.mcpb` from the [Releases](../../releases) page.
3. Open Claude Desktop and drag the file into the window (or **Settings → Extensions → Advanced settings → Install Extension…**).
4. Paste your Client ID and Client Secret when asked.
5. In a chat, ask Claude to create a form. A browser tab opens for Google sign-in the first time.

More detail and troubleshooting: **[docs/INSTALL.md](docs/INSTALL.md)**.

## How it works

- Claude Desktop starts the extension as a local process and talks to it over MCP (stdio).
- On first use the extension opens your browser for Google's standard sign-in (OAuth with PKCE, redirecting to `127.0.0.1`).
- The token is saved on your computer at `~/.google-forms-mcp/token.json` with owner-only permissions. Delete it to sign out.
- Requested scopes are deliberately narrow: `forms.body` (create/edit forms) and `forms.responses.readonly` (read responses). No Drive access.
- Claude Desktop includes its own Node.js runtime, so you do not need to install Node.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Build from source

Requires Node.js 22.18+ to run the tests (the shipped extension itself runs on Claude Desktop's bundled Node).

```bash
npm ci
npm run build        # typecheck, bundle, validate manifest, pack
```

The result is `dist/forms-connector-<version>.mcpb` plus a `.sha256` file. Install it as described above.

Quick local checks:

```bash
npm run typecheck    # TypeScript only
npm test             # unit tests (Node 22.18+ runs the .ts tests directly)
npm run bundle       # bundle to server/index.js without packing
```

Project layout:

```
src/index.ts       MCP server, OAuth flow, Forms API calls
src/questions.ts   Question-type -> Forms API payload mapping
src/token.ts       Token expiry and single-flight helpers
src/errors.ts      Friendly Forms API error messages
tests/             Unit tests (node:test)
manifest.json      Extension manifest (MCPB)
scripts/build.mjs  Bundle + validate + pack + checksum
docs/              User guides
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request, and [CHANGELOG.md](CHANGELOG.md) for release notes.

## Disclaimer

Forms Connector is an independent project. It is not affiliated with, endorsed by, or sponsored by Google LLC or Anthropic. "Google Forms" is a trademark of Google LLC; "Claude" is a trademark of Anthropic.

## License

[MIT](LICENSE)
