# NEXUS | AZEROTH COMPANION — v2.1 Cloudflare Setup

## Why this update is separate

The existing GitHub Pages v2.0 site calls `nexus-azeroth-api.zevromxr.workers.dev`.
It already supports item IDs, public character profiles and equipment.
Version 2.1 adds optional name search and Blizzard item icon media endpoints.
**GitHub updates cannot replace the separate Cloudflare Worker automatically.**

## One-time manual deployment

1. Open **Cloudflare → Workers & Pages → nexus-azeroth-api → Edit code**.
2. Ensure the dropdown selects the **Active / Latest** Worker.
3. Open the repository file [backend/worker.js](./worker.js), click **Raw**, copy all of it.
4. Replace the contents of Cloudflare's `worker.js` editor with this code.
5. Click **Deploy**; check that the deployment succeeds.
6. Confirm that both existing Worker secrets remain under **Settings → Variables and Secrets**:
   `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET`.
7. Test these addresses (no keys or secrets should be visible):
   - `https://nexus-azeroth-api.zevromxr.workers.dev/health` → `version: "2.1.0"`
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/item/us/19019` → Thunderfury item data
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/search/us?q=Thunderfury` → item search results
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/media/us/19019` → item icon asset(s)

**Never copy the Blizzard client secret into GitHub, scripts, logs or chat.** The Worker retrieves credentials from encrypted Cloudflare secrets at runtime.

## Known limits

- No complete loot-source descriptions or in-game talent import encoder.
- The item search uses Blizzard’s official paginated search; results may differ by locale/region and API patch.
- No authenticated Battle.net account linking.
- Data is for Retail, not Classic.
- The Worker does not currently have durable per-user throttling. For wider public launch, add a Cloudflare rate-limit rule or dedicated rate-limiting binding, monitoring and stronger abuse protections.
- Blizzard data and media should be displayed with proper attribution and handled according to Blizzard’s developer terms. Respect retention constraints.

## Release sequence

Deploy/test the Worker **first**, then merge the v2.1 GitHub pull request. Doing so prevents Discord announcing a feature that the live backend does not yet support.
