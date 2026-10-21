# Install and troubleshooting

## Requirements
- Claude Desktop for macOS or Windows (recent version). **You do not need to install Node.js**; Claude Desktop bundles its own.
- A Google account.
- A Google OAuth Client ID and Secret from your own project: see [BRING-YOUR-OWN-CLIENT.md](BRING-YOUR-OWN-CLIENT.md).

## Install
1. Download `forms-connector-<version>.mcpb` from the Releases page. Optionally verify it against the published `.sha256` file:
   - macOS: `shasum -a 256 forms-connector-<version>.mcpb`
   - Windows (PowerShell): `Get-FileHash forms-connector-<version>.mcpb -Algorithm SHA256`
2. Drag the file into the Claude Desktop window, or use **Settings → Extensions → Advanced settings → Install Extension…**.
3. Review the prompt, then paste your Client ID and Client Secret.
4. Ask Claude something like: *"Create a Google Form called 'Team lunch' with a multiple-choice question about dates."* The first request opens a browser tab for Google sign-in.

## Updating
Extensions installed from a file are updated manually: download the new `.mcpb` and install it the same way. Your settings and sign-in are kept.

## Signing out / resetting
Delete the token file and sign in again at the next request:
- macOS: `~/.google-forms-mcp/token.json`
- Windows: `%USERPROFILE%\.google-forms-mcp\token.json`

To fully revoke access, also remove the app at <https://myaccount.google.com/permissions>.

## Troubleshooting
- **Google sign-in problems** (access blocked, redirect mismatch, invalid client): see the table in [BRING-YOUR-OWN-CLIENT.md](BRING-YOUR-OWN-CLIENT.md#troubleshooting).
- **A request hangs.** The first request waits up to 3 minutes for you to finish signing in. Look for a browser tab, and for an approval prompt inside Claude Desktop.
- **You're asked to sign in again every week.** Expected while your Google Cloud project is in Testing mode. See the BYOC guide.
- **The extension won't start.** Update Claude Desktop, restart it, and check the logs:
  - macOS: `~/Library/Logs/Claude/`
  - Windows: `%APPDATA%\Claude\logs`
  When reporting an issue, **remove your Client Secret and any tokens** from pasted logs.

## Uninstall
Remove it under **Settings → Extensions**, then delete the token file above.
