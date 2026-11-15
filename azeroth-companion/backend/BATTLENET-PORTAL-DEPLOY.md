# NEXUS | AZEROTH COMPANION v3.0 — Secure Personal Battle.net Portal

## What this update does

Adds an optional first-party **My Azeroth** account portal to the existing Cloudflare Worker, using Blizzard's OAuth 2.0 authorization-code flow with the `wow.profile` scope. The portal accesses only the currently signed-in account's character index and mount/pet collections. Public lookup and all existing v2.9 studios remain intact.

**Do not merge the v3 frontend release into public `main` until the backend is deployed and verified.** This branch is a staging integration until the owner finishes the configuration below.

## Required owner-only setup

1. In the [Battle.net Developer Portal](https://develop.battle.net/access/clients), edit the client already used by your `nexus-azeroth-api` Worker (or create a dedicated OAuth client if Blizzard requires different allowed permissions).
2. Register the exact **HTTPS redirect URI**:

   `https://nexus-azeroth-api.zevromxr.workers.dev/auth/callback`

   It must match the redirect URI in the OAuth request and code exchange, character for character.
3. Leave the existing Cloudflare Worker encrypted secrets `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET` as they are unless you changed Blizzard clients; never paste credentials into GitHub, the app, Discord, or chat.
4. Create a new **32+ character high-entropy encrypted Worker secret** named `AZEROTH_SESSION_SECRET`. Generate a random value locally, not a memorable password. Treat changing this value as a sign-out of all sessions.
5. **Preferred — Cloudflare Dashboard:** open [`worker-v3-single.js`](./worker-v3-single.js), select **Raw**, copy all its contents, open Workers & Pages → `nexus-azeroth-api` → **Edit code**, replace the old Worker code, and deploy. This is the single-file, self-contained version of the two source modules. Do **not** paste your actual secrets into the code. Alternatively, use Wrangler below to deploy the two source modules together.

## Simpler deployment through the Cloudflare dashboard

1. Add the new encrypted `AZEROTH_SESSION_SECRET` binding and register the exact callback URI above.
2. Open [`worker-v3-single.js`](./worker-v3-single.js) on GitHub (choose **Raw**).
3. Copy its complete contents into the editor for your existing `nexus-azeroth-api` Worker and select **Deploy**.
4. Test `/health`, the original item/talent routes and `/account` as listed below **before merging the v3 GitHub PR**.

**Generating a session secret:** If Node.js is installed, run this locally on your PC, copy the result into the Cloudflare encrypted secret prompt, then close the terminal. Never share the generated value in chat or GitHub:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

## Alternative: Wrangler deployment from Windows PC

Prerequisites: install current Node.js, have the repo checked out, and ensure you can sign into your existing Cloudflare account.

From the repository root:

```powershell
npx wrangler login
npx wrangler secret put AZEROTH_SESSION_SECRET --config azeroth-companion/backend/wrangler.toml
npx wrangler deploy --config azeroth-companion/backend/wrangler.toml
```

The secret can alternatively be added in Cloudflare Dashboard → Workers & Pages → `nexus-azeroth-api` → Settings → Variables and Secrets. Select encrypted/secret, **not plaintext**. Do not commit a `.dev.vars` file.

Before deploying, check that the Wrangler `name` exactly matches the existing Worker and that the Cloudflare account/environment selected is correct. Deployment **replaces the Worker implementation**, so keep the v2.9 Worker code or a Cloudflare rollback available.

## Verification (no credentials in URLs)

1. `https://nexus-azeroth-api.zevromxr.workers.dev/health` → `version: 3.0.0`, `personalPortalConfigured: true`, and existing `credentialsConfigured: true`.
2. `https://nexus-azeroth-api.zevromxr.workers.dev/api/item/us/19019` → the original item lookup still responds.
3. `https://nexus-azeroth-api.zevromxr.workers.dev/api/talent-index/us` → the original talent index still responds.
4. `https://nexus-azeroth-api.zevromxr.workers.dev/account` → personal portal loads.
5. Press **Connect Battle.net**, select the Battle.net region, approve `wow.profile` on Blizzard's domain, and verify redirect back to `/account`. The callback should never show an access token.
6. Verify owned character list, mount/pet totals, a public Armory deep link, Disconnect, and that `/api/me/status` returns HTTP 401 after disconnect.
7. Test PC and iPhone Safari, including Home Screen navigation. If Safari opens the portal in a separate browser context, the sign-in session may not be shared; sign in within the same browser context.

If Blizzard declines the callback or returns a permissions error, confirm that the redirect URI and OAuth client match and that the correct account region was chosen. Blizzard may not return any characters or collections for some users and regions.

## Security and privacy design

- The Worker performs the code exchange server-side. GitHub Pages never receives access tokens, authorization codes, user-specific response bodies, or session cookies.
- OAuth state is a cryptographically random nonce in a short-lived encrypted HttpOnly, Secure, SameSite=Lax cookie; the callback rejects missing/mismatched/expired state.
- Session access tokens are encrypted with AES-GCM using a Worker-only secret and stored in a first-party HttpOnly, Secure, SameSite=Lax cookie with maximum one-hour lifetime. No database or third-party cookie requirement.
- Protected APIs are same-origin only (no public `Access-Control-Allow-Origin` headers). Public read-only legacy APIs keep their existing CORS response.
- The personal dashboard has a restrictive Content Security Policy, uses DOM text nodes for Blizzard content (no untrusted HTML interpolation), does not log account tokens or handle refresh tokens, and has a manual disconnect.
- Account collections are returned only in reduced count/sample form; character lists expose limited profile fields.
- Existing browser-local Talent Forge, Loot Hunter and character plans are not synced to Battle.net and remain separate. Disconnecting the private session does not erase existing public companion browser-local data.
- The portal cannot modify an account, game inventory, characters or talents.
- No global revocation list exists with stateless cookies: disconnect clears the cookie in the current browser, and Blizzard account settings can revoke app authorization. The cookie automatically expires within one hour.
- Deploy Cloudflare rate limiting / WAF rules to protect `/auth/start`, `/auth/callback` and `/api/me/*` prior to broad public promotion; review Cloudflare request logging settings and Blizzard developer terms. Do not add an untrusted OAuth proxy.

## Useful links

- Blizzard OAuth docs: https://develop.battle.net/documentation/guides/using-oauth
- Worker root: https://nexus-azeroth-api.zevromxr.workers.dev
- Public companion: https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/

**Rollout:** Keep this pull request unmerged while you deploy and test the Worker. Once all backend tests pass, the frontend release can be merged and the usual Discord announcement will trigger automatically.
