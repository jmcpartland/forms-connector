# Bring Your Own Client (BYOC)

Forms Connector signs in to Google using an **OAuth client** that *you* create in your own free Google Cloud project. Why:

- Your data and sign-in token stay between you and Google. This project never sees them.
- No shared quota with other users, and no dependence on anyone else's Google approval.

Takes about 10 minutes. Console menu names change occasionally; the idea stays the same.

## 1. Create a project
1. Go to <https://console.cloud.google.com/projectcreate>.
2. Name it anything (for example "Forms Connector") and click **Create**.
3. Make sure the new project is selected in the top bar.

## 2. Enable the Forms API
1. Open **APIs & Services → Library**.
2. Search for **Google Forms API** and click **Enable**.

## 3. Set up the consent screen
1. Open **Google Auth Platform** (older consoles: **APIs & Services → OAuth consent screen**).
2. Click **Get started** and fill in:
   - **App name**: anything you like (avoid using "Google" in the name).
   - **User support email** and **Developer contact email**: your own address.
   - **Audience**: **External**.
3. Open **Audience** and confirm **Publishing status** is **Testing**.
4. Under **Test users**, click **Add users** and add **the exact Google address(es) that will sign in**. Only these accounts can sign in while the app is in Testing mode. Save.

## 4. Create the OAuth client
1. Open **Clients → Create client** (older consoles: **Credentials → Create credentials → OAuth client ID**).
2. **Application type: Desktop app.** (Other types will fail with `redirect_uri_mismatch`.)
3. Give it a name and click **Create**.
4. If Google asks **"Use this client for an AI-powered agent?"**, choose **Yes**, since Claude acts on your behalf. This can't be changed after creation. If sign-in or API calls are later rejected, create a second client with the other choice.
5. Copy the **Client ID** and **Client secret**.

## 5. Enter them in the extension
After installing the `.mcpb`, paste the Client ID and Client secret into the extension's settings in Claude Desktop. The secret is stored in your operating system's secure storage.

> Keep the secret out of screenshots, issues and chats. If it leaks, open the client in Google Cloud, add a new secret, disable the old one, and update the extension settings.

## 6. First sign-in
Ask Claude to create a form. A browser tab opens:
- Choose the Google account you added as a test user.
- Google may show **"Google hasn't verified this app"**. That is expected for your own personal project. Choose **Continue** (or **Advanced → Go to … (unsafe)**).
- Approve the two permissions: *manage your forms* and *view form responses*.
- When the tab says "Google Forms connected", close it. Claude finishes the request.

## Good to know
- **Weekly sign-in.** While your project's status is *Testing*, Google expires refresh tokens after about 7 days, so you'll be asked to sign in again roughly weekly.
- **Avoiding the weekly sign-in.** You can set **Publishing status** to **In production**. Without Google verification, this still shows the "unverified app" warning, which you click through once. This is a trade-off for personal use only. Don't distribute your client to other people.
- **Cost.** The Forms API is free to use within quota.

## Troubleshooting
| Symptom | Fix |
| --- | --- |
| "Access blocked: … has not completed the Google verification process" | The signing-in account isn't a **Test user**. Add it under Audience → Test users. |
| `redirect_uri_mismatch` | The client type isn't **Desktop app**. Create a new client of that type. |
| `invalid_client` / "client was not found" | Client ID or secret mistyped, or from a different project. Re-copy both. |
| Forms API error mentioning "has not been used" or "disabled" | Enable the Google Forms API in the **same project** as the client (step 2). |
| Request hangs for minutes | A sign-in tab is waiting in your browser, or Claude Desktop is waiting for tool approval. Check both. |
