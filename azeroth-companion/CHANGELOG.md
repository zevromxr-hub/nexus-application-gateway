# NEXUS | AZEROTH COMPANION — RELEASE HISTORY

## v3.4.0 · 2026-11-14 — Progress Command

- Added **Progress Command**: one responsive, read-only view across Item Atlas, Character Targets, Loot Hunter and Farming Operations.
- Summarizes items manually marked owned, open/completed targets, Loot Hunter goals, and Farming Operations session attempts without altering or conflating their underlying sources.
- Shows per-character open priorities and manual session totals; filters open objectives and links back to the originating studios.
- Highlights assignments whose item no longer exists in Atlas, open targets for items manually marked owned, and overlapping Atlas/Loot Hunter records as **review suggestions**, never automatic corrections.
- Supports an aggregate JSON **read-only progress summary** export (counts, character totals, discrepancy counts). No Blizzard tokens or account profile payloads.
- Preserves all v3.3 modules, prior data formats and account privacy boundaries.
- **No Cloudflare update needed**: v3.4 uses existing browser-local storage and does not change Blizzard endpoints.

## v3.3.0 · 2026-11-14 — Character Progression (Cloudflare deployment required)

- **My Azeroth Equipped Gear:** signed-in players can select their own account-listed character and request Blizzard-reported currently equipped gear using a protected, first-party Cloudflare endpoint. The Worker verifies the character belongs to the authorized Battle.net account before retrieving gear. This is **not** full inventory, banks, bags, or real-time ownership.
- **Character Targets:** a separate browser-local planner for assigning Item Atlas records to characters imported from Farming Operations or added manually. Includes high/normal/later priorities, manual completion, notes and its own JSON export/import.
- No transfer of Blizzard access tokens, account listings, or equipment data from the Worker portal to public GitHub Pages. Character Targets are manually managed and never claim Blizzard-confirmed ownership.
- **Armory Command Bridge repair:** fixed old v2.8 section selector initialization so the existing Armory → Loot Hunter workflow can load.
- Existing v3.2 Item Atlas, v3.1 Collection Intelligence, saved browser-local records, and all previous modules are preserved.

**Deployment gate:** update the Cloudflare Worker first (see `backend/CHARACTER-PROGRESSION-v3.3-DEPLOY.md`), then merge the v3.3 GitHub PR. The new endpoint is `/api/me/equipment?realm=...&name=...`. No new encrypted secrets or Blizzard scopes are necessary. Real-account gear and player UI tests are deferred to the saved Player Testing Guide.

## v3.2.0 · 2026-11-14 — Universal Item Atlas (Backend-Gated)

- Introduced **Universal Item Atlas** for official Blizzard item-name search, numeric item-ID lookup, and personal tracking.
- Name search supports bounded pages (up to 50 pages of 20); Blizzard's underlying search index can cap results. Searches are not a complete enumeration of all obtainable or historical WoW items.
- Players can save an officially resolved item with status **Wishlist**, **Farming**, **I own this (manual)**, or **Archived**. This does not assert account ownership.
- Up to 5,000 manually saved item records per browser with notes, filtering, and independent JSON export/import.
- Item records link to Item Codex; old personal wishlist and Loot Hunter progress remain preserved.
- Existing authenticated Collection Intelligence stays isolated on Cloudflare; no account data or tokens are copied to the public tracker.
- **Deployment gate:** publish v3.2 Worker before merging public release. No new encrypted secrets or Battle.net permissions.

## v3.1.0 · 2026-11-14 — Collection Intelligence (Deployment-Gated)

- Added **Collection Intelligence** to the first-party Cloudflare **My Azeroth** portal.
- Compare the authorized Blizzard account's full returned mount collection with a small curated list: **Invincible** and **Ashes of Al'ar**, through exact normalized mount-name matching.
- Show **Reported Owned** only for a name present in the Blizzard response; show **Not Confirmed** for an absent name. If Blizzard's collection endpoint fails or omits a usable collection, report **Unavailable / Unknown**, never missing.
- No access tokens, personal ownership records or account information are copied into GitHub Pages, localStorage or another user's browser.
- Existing login, public Armory, Talent Forge, Loot Hunter and Farming Operations remain unchanged.

**Deployment gate:** Update the single-file Cloudflare Worker source before merging the website release. The new endpoint is `/api/me/collection-intelligence` and requires an existing secure My Azeroth session. No new Cloudflare secrets or Blizzard scopes are required. Confirm actual results with World of Warcraft players; see the Player Testing Guide.

## v3.0.0 · 2026-11-14 — My Azeroth (Release Candidate)

- **Personal Battle.net sign-in:** separate first-party Cloudflare Worker account portal with Blizzard OAuth authorization-code consent and `wow.profile` scope.
- **Secure sessions:** encrypted, short-lived first-party cookies; protected Blizzard account information never goes to GitHub Pages or localStorage.
- **Personal characters:** discover characters Blizzard reports for the signed-in account and jump into the existing public Live Armory.
- **My collections:** read-only totals and examples for mounts and pets when Blizzard supplies them.
- **Privacy by design:** explicit disclosures, session disconnect, no account database, and no password collection.
- **Preservation:** all v2.9 features, public Armory, Talent Forge, farming plans and saved browser-local records remain untouched.

**Deployment gate:** Do not merge or announce this release until the new Cloudflare Worker module is deployed with `AZEROTH_SESSION_SECRET` and the exact Battle.net OAuth callback is registered. See `backend/BATTLENET-PORTAL-DEPLOY.md`. The public v2.9 app remains stable until that verification.

## v2.9.0 · 2026-11-14 — Character Farming Operations

- **Character-specific farm planning:** assign existing Loot Hunter goals to any combination of manually added characters, with optional import of saved public Armory shortcuts.
- **Manual session ledger:** track date, character, item, attempt count (1–100 per session), and optional personal note for each farming run.
- **Useful filters and metrics:** view assigned goals by character, obtained/open status, recorded sessions and session attempts.
- **Dedicated backup:** independently export or import assignment and session data without replacing existing Loot Hunter goals, item wishlists or progress.
- **Compatibility:** retains all v2.8 Armory Command Bridge, Talent Forge, prior modules, and existing Cloudflare API configuration.

**Important:** The new session ledger is separate from Loot Hunter's legacy total attempts. Session records do not automatically increase the global Loot Hunter attempt counter. Farming progress and character assignments are manual and browser-local; they are not validated against in-game drops, saved instance lockouts, or account activity.

## v2.8.0 · 2026-11-14 — Armory Command Bridge

- **Connected gear planning:** one-click TRACK GOAL action for live equipped items, official Blizzard Item Codex results, searchable item records, saved wishlist and inspection history.
- **Shared progress:** all tracking actions write through the existing Loot Hunter goal logic, preserving manual attempts, completion and notes. Duplicate item IDs do not create duplicate farm goals.
- **Public character shortcuts:** save and reload previously retrieved public ASCII character profiles in the same local browser; no Blizzard account authorization or credentials are stored.
- **Armory and Loot Hunter dashboard:** view existing wishlist items, open farming goals and items not yet tracked.
- **Mobile-conscious layout:** compact responsive controls for desktop and iPhone.
- **Preservation:** all earlier studios including the v2.7.1 Talent Tree fix, existing data formats, and the Cloudflare Worker remain unchanged.

Saved shortcuts and farm goals are browser-local, and a TRACK GOAL button does not assert that a target is actually obtainable from a particular boss or that the character owns the item.

## v2.7.1 · 2026-11-14 — Tree Layout Reliability Patch

- **Fixed reported PC issue:** selecting Tree mode no longer automatically switches the entire talent view to compact cards when Blizzard returns overlapping, missing or out-of-range display coordinates.
- **Collision-safe placement:** unique talent nodes are assigned separate visual cells, keeping valid unique Blizzard coordinates unchanged where possible.
- **Transparent adjustment labels:** repositioned nodes show `POSITION ADJUSTED` while original Blizzard row/column metadata remains visible.
- **Regression coverage:** tests cover duplicate coordinates, absent positions and unique visual placement.
- **No migration:** Talent Forge drafts and local storage, path diagnostics, other Warcraft tools and Cloudflare Worker remain untouched.

The adjusted tree is a visual planner, not Blizzard's canonical layout. Missing source metadata and talent path eligibility are not inferred.

## v2.7.0 · 2026-11-14 — Talent Path Intelligence

- **Source-aware path dashboard:** displays manually planned talents, source-linked nodes with ranks on both ends, zero-rank upstream review flags, and references not resolved within the current talent category.
- **Upstream path explorer:** selecting RELATIONS inspects upstream talent nodes through Blizzard-reported `locked_by` references; traversal is cycle-safe and depth-limited.
- **Review-only filter:** optionally focus the tree on planned talents whose source-reported incoming link has no manually planned ranks at the other end.
- **Faithful data separation:** no invented dependency edges, prerequisites or item information. An apparent missing upstream allocation is a review prompt, not proof a talent is locked or invalid in-game.
- **Persistence:** all existing v2.3–v2.6 talent drafts retain their previous JSON format and local storage key. Prior Warcraft studios remain available.

**Important limits:** Blizzard API talent data may be incomplete or contain cross-category references. This release does not validate actual talent budgets, prerequisites, levels, hero paths or in-game loadout import strings. No Cloudflare Worker changes are required.

## v2.6.0 · 2026-11-14 — Talent Connections

- **Reported talent links:** display connections based on the `locked_by` node IDs in Blizzard's response, where these are provided.
- **Node inspector:** click RELATIONS on a talent to see which visible nodes it reports as locked by, which other nodes report a link to it, and whether any references cannot be resolved.
- **Visual tree paths:** draw optional lines across the Blizzard position-aware talent grid, with highlighted relationships around the selected talent.
- **Honest data reporting:** unresolved or absent relationships are explicitly described as unknown. No guessed prerequisite, rank, level, required-point, or hero-unlock rules.
- **Preservation:** v2.3–v2.5 saved drafts and local storage stay compatible; existing Warcraft tools and Cloudflare API remain unchanged.

**Scope:** The relationship display is not a WoW game-valid build verifier. Certain Blizzard talent-tree records may omit connections or reference nodes outside the current class/spec/hero category. No new Worker deployment is required.

## v2.5.0 · 2026-11-14 — Talent Intelligence

- **Hero tree selector:** independently display the separate hero talent groups returned by Blizzard for a loaded specialization, without losing other hero tree data.
- **Saved draft comparison:** compare the active ranks with a previously saved draft of the same specialization; highlight increases and decreases and summarize planned changes.
- **Source-aware nodes:** display Blizzard's `default_points` when supplied, while avoiding invented point totals or talent rules.
- **Layout resilience:** if real nodes omit position data, share a location, or exceed supported bounds, switch to compact cards instead of overlapping in the visual tree.
- **Safer asynchronous browsing:** prevent stale talent-index responses from replacing another region's list.
- **Preservation:** existing v2.3/v2.4 JSON draft format and local storage key, all prior Warcraft studios, and Cloudflare gateway endpoints remain unchanged.

**Important:** The updated Forge does not validate Blizzard's actual prerequisites, character levels, talent point limits, or import codes. Build comparisons are informational, not recommendations or game-legal simulations. This is a GitHub-only frontend release; no Cloudflare Worker replacement is required.

## v2.4.0 · 2026-11-14 — Talent Forge Overdrive

- **Position-aware visual layout:** arranged official Blizzard talent nodes according to supplied display rows and columns, with horizontal scrolling for wide talent layouts.
- **Focused research tools:** node search, compact cards, and optional shorter descriptions.
- **Draft history:** undo and redo recent rank and choice edits. Existing saved builds retain their exact v2.3 storage format.
- **Planning reminder:** choose a personal point threshold and receive a warning if the draft exceeds it. The threshold is not a real Blizzard point cap or prerequisites check.
- **Compatibility:** saved talent drafts, JSON transfers, other Warcraft studios, and existing encrypted Cloudflare Worker secrets are preserved.

**Limitations:** positional information may be missing for some talent nodes, causing overlap or unstructured placement. Point allocations are planning drafts, not verified legal in-game talents or importable talent codes. No Cloudflare Worker replacement is required for this frontend-only upgrade.

## v2.3.0 · 2026-11-14 — Talent Forge

- **Blizzard talent exploration:** retrieve Retail specialization talent trees and browse their class, spec, and hero nodes when supplied by the official API.
- **Interactive draft builder:** plan rank investments and choice nodes against the retrieved talent reference data.
- **Saved drafts:** name and store up to 40 independent planning builds in browser storage, with JSON export/import.
- **Secure integration:** uses the existing Cloudflare Blizzard gateway; no client credentials or OAuth tokens in public website code.
- **Preservation:** retained existing item-name search, Loot Hunter, character Armory, Party Architect, progression studios, and saved profiles.

**Limitations:** Talent allocations are manually planned and not validated against Blizzard's current in-game prerequisite, level, hero-path, or point-budget rules. JSON drafts are not in-game import strings. Talent availability depends on Blizzard's API completeness and the installed v2.3 Worker.

## v2.2.0 · 2026-11-14 — Loot Hunter

- **Acquisition guide explorer:** four documented legacy collectible/legendary acquisition routes with per-item source links, explicitly distinguished from Blizzard's official game data.
- **Farm tracker:** user-managed attempts, obtained status, notes, and acquisition checklist.
- **Wishlist import:** turn existing Item Codex wishlist entries into farming goals; items without verified acquisition guides are marked unverified.
- **Item Codex integration:** inspect any farm goal using the existing real Blizzard item-ID API.
- **Portability:** export and import the independent Loot Hunter JSON plan, without touching prior character, build, collection or planner data.

Guides may become outdated as game versions change. Players should check each linked source and confirm in-game requirements, availability and raid lockout rules. Progress is manual, not connected to Blizzard account activity.

## v2.1.0 · 2026-11-14 — Item Discovery

- **Official item name search:** search Blizzard's current Retail item database by name rather than numeric ID alone.
- **Clickable search results:** open results directly inside the detailed Item Codex.
- **Item imagery:** show Blizzard item icons whenever the game's media endpoint provides them.
- **Backwards compatible:** existing Armory, equipment inspector, item-ID lookups, wishlist, character plans and every prior studio remain available.
- **Secure gateway:** compatible with the separately deployed v2.1 Cloudflare Worker; Blizzard credentials stay in encrypted Cloudflare secrets.
- **Versioned release:** independent changelog and automatic Discord announcements after validation.

**Limits:** Search results depend on Blizzard's index and regional locale. Item acquisition locations, fully validated talent builds, authenticated account linking, cross-device account saves and production-grade abuse mitigation are not included.

## v2.0.0 · 2026-11-14 — Connected Armory & Item Codex

- **Live Character Armory:** official Retail character profiles retrieved by region, realm slug and character name.
- **Equipment Inspector:** show equipped item names, levels and item IDs, with direct item lookup.
- **Blizzard Item Codex:** live item ID lookups with preview stats, effects and item requirements where supplied.
- **Saved items:** personal wishlist and recent item history, stored locally with the existing independent save sets preserved.
- **Resilience:** API timeouts and missing data produce clear errors; no invented items or current-patch meta advice.
- **Integration:** securely connects to the previously deployed Cloudflare gateway without browser-side Blizzard credentials.

**Important limits:** This version does not provide name-based item searching, verified loot source locations, OAuth login, talent validation, or item icon images. These will require backend/data catalog upgrades. Read-only public character data can lag behind in-game updates. The Cloudflare Worker must remain deployed and reachable for connected features to work.

## v1.2.0 · 2026-11-14 — Party Architect / Player Utility Expansion

- Build five-player groups using current class and specialization options, including Devourer Demon Hunter.
- Check expected 1 tank / 1 healer / 3 damage party distribution and common class utility examples.
- Export, import or copy party compositions to coordinate with teammates.
- Track per-character dungeon, raid and world activity counts with fully adjustable goals and manual reset.
- Pull selectable character names from the existing Genesis character roster without rewriting old saves.
- Add a curated quick-reference portal to official Blizzard pages and external Warcraft resources.
- Deliver desktop/iPhone-specific responsive panels without changing prior modules.

**Notes:** These tools assist planning and are not automatic WoW API or combat integrations. Activity targets are user-defined, not validated Great Vault thresholds. All existing v1.0 and v1.1 data is retained.

## v1.1.0 · 2026-11-14 — Warcraft Overdrive

- **War Room:** weekly objectives and saved raid encounter plans.
- **Dungeon Routes:** ordered route steps and copy-to-clipboard sharing.
- **Profession Profit Lab:** material-cost and fee-adjusted estimated profitability using manual prices.
- **Gear Analyzer:** user-defined stat-weight comparison, saved locally.
- **Release Center:** version manifest, history, check for updates and game-specific release notes.
- **Warcraft presentation:** expanded responsive gold/teal UI and dedicated studio navigation.
- **Advanced data:** JSON backup/import for the new game-specific studios. The existing v1.0 profiles, builds, collections and checklists are preserved.

No Blizzard login, live data, combat automation or current-game performance claims. The app is an unofficial companion.

## v1.0.0 · 2026-11-14 — Genesis

Character profiles, saved builds, progression checklists, collection tracking, local JSON export/import and responsive foundation.
