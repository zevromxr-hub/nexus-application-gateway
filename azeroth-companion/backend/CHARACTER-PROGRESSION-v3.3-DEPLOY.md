# NEXUS | AZEROTH COMPANION v3.3 — Character Progression deployment

## Deployment gate

v3.3 must be staged until the owner updates the existing `nexus-azeroth-api` Cloudflare Worker. The GitHub Pages v3.2 app remains intact until the new Worker passes preliminary checks.

### Update Cloudflare (same workflow as v3.2)

1. Open [the **v3.3 self-contained Worker source**](./worker-v3-single.js) and select **Raw**.
2. Copy the entire file. In Cloudflare → Workers & Pages → **nexus-azeroth-api** → **Edit code**, replace the current Worker code and select **Deploy**.
3. **Keep the existing encrypted bindings unchanged:** `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`, and `AZEROTH_SESSION_SECRET`. No new variables or scopes are necessary. Never paste their values into source code or chat.
4. Verify the health endpoint: https://nexus-azeroth-api.zevromxr.workers.dev/health should include `"version":"3.3.0"`, `"credentialsConfigured":true`, and `"personalPortalConfigured":true`.
5. Verify that https://nexus-azeroth-api.zevromxr.workers.dev/account still shows My Azeroth and lets a player sign in. A player who owns an actual character can select **Equipped Gear Intelligence**, choose an account-listed character, and click **LOAD EQUIPMENT**. The selected character should show Blizzard-reported equipped items or a clear unavailability message.
6. Check older item and talent API calls still work and that **My Collections** and **Collection Intelligence** remain accessible.
7. Once the Worker deployment is confirmed, merge the v3.3 GitHub PR. The normal release workflow will publish GitHub Pages and announce the update to Discord.

## Privacy / correctness

The new API is `GET /api/me/equipment?realm={realmSlug}&name={characterName}`. It requires the existing encrypted HttpOnly first-party session and checks the character against the signed-in Blizzard account index **before** reading the equipment endpoint. A character not listed on that account receives HTTP 403. It sends back only reduced slot, item ID, name and level fields, not Blizzard tokens or full inventory records.

Blizzard may not supply a usable record for every character; missing results do **not** prove an empty gear inventory. The displayed gear is currently equipped items only, not bags, bank contents, warband stash, collections, or real-time state.

The public **Character Targets** studio reads saved items from **Item Atlas** and character shortcuts from **Farming Operations**, and stores its manual assignments in a **separate** local browser key `nexus_azeroth_character_targets_v1`. Statuses and task completion are self-reported. It does not copy the signed-in account list or equipped items from My Azeroth into GitHub Pages. There is no automatic account sync across devices.

## Test guide

The ChatGPT Library's **NEXUS / Azeroth Companion / Player Testing Guide.docx** contains real-player tests for character-account matching, equipment slot display, empty/error handling, and manual character target workflows. Do not share OAuth tokens, authorization codes, cookies, passwords or encrypted Cloudflare secrets.

## Rollback

If the new Worker fails, use Cloudflare deployments to restore the last working v3.2 Worker release. Keep this v3.3 pull request unmerged until the backend is stable.
