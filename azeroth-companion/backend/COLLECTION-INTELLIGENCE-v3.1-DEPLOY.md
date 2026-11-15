# NEXUS | AZEROTH COMPANION — v3.1 Collection Intelligence update

## Current status
This is a **deployment-gated** update to the existing **My Azeroth** Battle.net account portal. Keep the existing v3.0 live until the v3.1 Worker is deployed and verified. No new Battle.net client, permission scope, or Cloudflare secrets are required.

## One-time Cloudflare code update

1. Open the **v3.1 source**, [worker-v3-single.js](./worker-v3-single.js), click **Raw**, and copy the complete file.
2. In Cloudflare Dashboard → Workers & Pages → **nexus-azeroth-api** → **Edit code**, replace the Worker source and select **Deploy**.
3. Keep all three existing encrypted settings unchanged: `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`, and `AZEROTH_SESSION_SECRET`. Do not paste their values into code, GitHub, chat, or screenshots.
4. Verify `https://nexus-azeroth-api.zevromxr.workers.dev/health` returns `version: 3.1.0` with `credentialsConfigured: true` and `personalPortalConfigured: true`.
5. Open `https://nexus-azeroth-api.zevromxr.workers.dev/account`, sign in through Blizzard, and find **Collection Intelligence**. You should see **Invincible** and **Ashes of Al'ar** results, or a clear error/unknown result if Blizzard's collection endpoint cannot supply data.
6. Confirm the old private **My Characters**, **My Collections**, **Disconnect**, and public API routes still work.
7. **Only after deployment succeeds**, merge the v3.1 pull request into main. This will publish GitHub Pages and post a Discord release announcement automatically.

## Ownership logic and careful interpretation

The Worker calls Blizzard's authorized `/profile/user/wow/collections/mounts` using the `wow.profile` account token in the existing encrypted first-party session. It compares Blizzard's returned mount **names** against a deliberately small source-name catalog:

| Mount name in Blizzard collection | Related collectible item | Item ID |
|---|---|---|
| Invincible | Invincible's Reins | 50818 |
| Ashes of Al'ar | Ashes of Al'ar | 32458 |

An exact normalized name match means **Reported Owned by Blizzard** for the named mount, not necessarily that the item itself remains in inventory. When not found, status is **Not Confirmed**, which does **not** prove it is missing. If the API has no usable mount array, ownership is **Unknown/Unavailable**. This does not sync ownership into public GitHub Pages or automatically complete Loot Hunter goals.

No private account data is retained in an application database or localStorage; the encrypted session remains on the Worker domain. Collection data is never sent to the public companion.

## Tester coverage

See **NEXUS / Azeroth Companion / Player Testing Guide.docx** in the user's ChatGPT Library. Ask players with known mount ownership to check the two results, characters and collections on PC and iPhone Safari, and report only non-secret screenshots or error text. Please do not share passwords, authorization codes, cookies, OAuth tokens or Cloudflare secret values.

## Rollback
Cloudflare's previously deployed v3.0 Worker can be restored if the v3.1 deployment breaks authorization or public item/talent routes. Do not merge the GitHub UI release when the Worker update fails.
