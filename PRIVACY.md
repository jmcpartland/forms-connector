# Privacy

*Keep this accurate as the code changes.*

Forms Connector runs locally on your computer. The project's maintainers operate **no servers** for it and receive **no data** from it: no analytics, no telemetry, no crash reports.

**What the extension accesses.** After you sign in, it calls the Google Forms API on your behalf, only when you ask Claude to use it. It can create and edit forms in your Google account and read their responses. It requests only these scopes: `forms.body` and `forms.responses.readonly`.

**Where data goes.**
- The extension sends requests directly from your computer to Google (`forms.googleapis.com`, `oauth2.googleapis.com`).
- Results (for example form questions or responses you ask Claude to read) are returned to Claude Desktop, and from there are handled under Anthropic's terms and privacy policy for your Claude plan.

**What is stored.** Your Google sign-in token is stored on your computer at `~/.google-forms-mcp/token.json` (owner-only permissions). Your OAuth Client ID and Secret are stored by Claude Desktop in your operating system's secure storage. Delete the token file or uninstall the extension to remove them. You can also revoke access at <https://myaccount.google.com/permissions>.

**Google user data.** Data obtained through Google APIs is used only to carry out your requests. It is not sold, shared with third parties by this project, or used for advertising or model training by this project.
