# NEXUS | AZEROTH COMPANION v3.2 — Universal Item Atlas

## Owner deployment gate

Keep public v3.1 live until the Cloudflare Worker is upgraded and checked. The v3.2 website is staged in a GitHub pull request and should **not** be merged before the Worker update. Existing encrypted variables and OAuth redirect URI do not change.

### Update the existing Cloudflare Worker (no command-line tools)

1. Open [the v3.2 complete, single-file Worker source](./worker-v3-single.js) on GitHub and click **Raw**.
2. Copy all the source code.
3. In Cloudflare Dashboard → Workers & Pages → `nexus-azeroth-api` → **Edit code**, replace the current Worker script and select **Deploy**.
4. Leave **BLIZZARD_CLIENT_ID**, **BLIZZARD_CLIENT_SECRET**, **AZEROTH_SESSION_SECRET** and Blizzard's OAuth redirect URI unchanged.
5. Open `https://nexus-azeroth-api.zevromxr.workers.dev/health` and check that `version` is **3.2.0**, `credentialsConfigured` is true, and `personalPortalConfigured` is true.
6. Test public item lookup: `https://nexus-azeroth-api.zevromxr.workers.dev/api/item/us/19019`.
7. Test the first and second page (may be empty for narrow queries):
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/search/us?q=sword&page=1`
   - `https://nexus-azeroth-api.zevromxr.workers.dev/api/search/us?q=sword&page=2`
8. Confirm `/account` still allows Battle.net sign-in and Collection Intelligence, and the old talent index still loads:
   `https://nexus-azeroth-api.zevromxr.workers.dev/api/talent-index/us`
9. After the Worker passes those checks, merge the GitHub v3.2 pull request. That publishes the new Item Atlas interface through GitHub Pages and triggers the Discord release announcement.

**No secrets in GitHub, chat, screenshots or public URLs.**

## What “all WoW items” means here

- Users can **search available Retail game item records** by name with bounded pagination, or look up a specific Blizzard item ID.
- The official search is **not guaranteed to enumerate every historical, removed, seasonal, unobtainable or otherwise excluded item**. Search results may be capped at 1,000 per query. The v3.2 UI permits up to 50 pages of 20 per search.
- The atlas stores **up to 5,000 user-selected, manually tracked records per browser**; it does **not** download the entire WoW database, and the tracker is not the Blizzard account inventory.
- Trackable user-selected statuses: **Wishlist**, **Farming**, **I own this (manual)**, **Archived**; item notes, filtering, backups and Item Codex inspection are included.
- If a user marks an item owned, that is their statement. No universal official Blizzard API proves ownership of all inventory and historical items. The private **My Azeroth** Collection Intelligence checks only the separately supported account collection records.
- Item Atlas records stay local. On iPhone and PC, export/import the Item Atlas JSON backup to transfer data. Other studio storage is unchanged.

## User acceptance and rollback

The living **NEXUS / Azeroth Companion / Player Testing Guide.docx** in the owner's ChatGPT Library now includes test set E (10 checks) for Item Atlas. Share this guide with real World of Warcraft players when ready.

If Blizzard API pagination or authentication regresses, restore the previous Cloudflare Worker deployment and keep the website at v3.1 until fixed. Do not merge a broken release.
