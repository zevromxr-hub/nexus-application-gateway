# NEXUS | AZEROTH COMPANION — RELEASE HISTORY

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
