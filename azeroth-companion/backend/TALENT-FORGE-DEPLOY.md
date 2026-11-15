# NEXUS | Azeroth Companion — Talent Forge v2.3 Worker upgrade

Talent Forge requires a one-time replacement of the `nexus-azeroth-api` Cloudflare Worker.

## Deploy

1. Open [the updated Worker source](./worker.js) on GitHub and select **Raw**.
2. In Cloudflare, open Workers & Pages → **nexus-azeroth-api** → **Edit code**.
3. Choose **Active / Latest**, replace the existing `worker.js` source and click **Deploy**.
4. Keep the existing encrypted Cloudflare secrets `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET` unchanged.
5. Verify these URLs:
   - `https://nexus-azeroth-api.zevromxr.workers.dev/health` — should return version `2.3.0`.
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/talent-index/us` — should include Blizzard's `spec_talent_trees`.
   - Choose an actual tree ID / specialization ID from that index and test `/api/talent-tree/us/{treeId}/{specId}` — should return `class_talent_nodes` and `spec_talent_nodes`.
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/search/us?q=Thunderfury` should still function.

Do **not** paste or expose credentials in GitHub, screenshots or chats.

## Behavior and limitations

- Official Blizzard game data: talent-tree index and specialization talent-node data
- Saved choices, rank allocations and build names: browser-local planning records
- Hero talent trees display if provided by Blizzard for the selected specialization
- No simulation of required point thresholds, prerequisites, level unlocks, special hero path restriction, class tuning or game-valid loadout code
- Not a replacement for the in-game talent system; Blizzard's talent endpoints may omit or change entries between patches, and some specialization trees have historically returned incomplete data
- No server-side user accounts or cloud sync
- Public-read-only Workers must have dedicated abuse controls, API quotas, and monitoring configured before large-scale promotion

Deploy the Worker **before merging the corresponding GitHub UI release**, so the public application does not announce a feature that cannot connect yet.