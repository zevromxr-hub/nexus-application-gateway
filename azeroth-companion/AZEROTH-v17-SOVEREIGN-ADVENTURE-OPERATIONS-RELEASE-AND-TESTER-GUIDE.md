# NEXUS | AZEROTH COMPANION — v17.0.0
## SOVEREIGN ADVENTURE OPERATIONS — OWNER RELEASE & FUTURE PLAYER ACCEPTANCE

**Release date:** 2026-11-17  
**Branch rollback:** backup/azeroth-v16-5-before-sovereign-adventure-v17-2026-11-17  
**Primary page:** https://zevarchives.com/azeroth-companion/adventure-operations.html  
**Status:** Owner-approved release once merged; tester acceptance pending. Simulated browser checks do not substitute for an actual iPhone, live Battle.net verification, or an in-game WoW character.

### What is new
- A separate illustrated **Sovereign Adventure Operations** studio links existing World Atlas destinations, Expedition Console manual checklists, local character profiles, saved native Forge drafts and Item Atlas references.
- Players can add up to **18** original Atlas missions to one ordered session, rearrange them, optionally assign a personal time estimate, and attach objective-specific local notes. Mission sources are never copied into a parallel new mission system.
- **Session field command** supports a session title, optional day, optional character context and private notes.
- **Source-aware cards** show existing manual checklist checks, local character/draft/item link labels and an explicit warning when a linked record is absent.
- **Portable session export** includes a bounded whitelisted v17 session and a labeled manually generated briefing; plaintext clipboard copy is optional.
- **Import previews** inspect the v17 format and show mission/link counts before an explicit confirmation. Import changes the v17 session only.
- **Cross-tab collision guards** reject overwriting a v17 session if its storage changed elsewhere after the page loaded.
- The new room is accessible from Command Center, Atlas, Expedition Console, Character Nexus and the original Companion studio navigation, and appears in Universal Command Search.
- Visual style preserves the original panoramic fantasy imagery and dark violet/gold/blue design, with mobile-responsive controls, safe-area support from the existing shell, keyboard focus visibility and reduced-motion styling.

### Safety boundaries
The ONLY new write key is **nexus_adventure_operations_v17**. It is whitelisted by the existing read-only Save Protection export. No v16 mission statuses, v16.5 preparation checklists, Talent Forge allocation, character records, Item Atlas data, Cloudflare Worker, Blizzard OAuth, cookies, or account-verified inventory fields are edited or migrated.

Time estimates are **your own inputs**, never real travel time or a timed feature. Checked steps are **manual planning actions**, not item ownership, DPS, combat readiness, quest completion or in-game unlock verification. This is a private planning tool; cross-origin automatic synchronization is not available.

### Test inventory
1. Unit regression: invalid/duplicate entry IDs, 18-entry cap, invalid dates, time bounds, notes truncation, safe whitelist exports.
2. Source provenance: connected character/draft/item labels, missing Atlas source fallback, manual progress calculation and no fabricated stats.
3. Browser: desktop Chromium and emulated iPhone WebKit — library → add two goals → reorder → estimate → notes → save → export → import → reload.
4. Preservation: assert exact original v16 Atlas, v16.5 prep, character and Forge storage strings remain unchanged.
5. Responsive and accessibility: mobile overflow checks, keyboard focus, reduced-motion CSS and sensible unavailable-link messaging.
6. Origin and authentication: test on GitHub Pages and ZevArchives; verify current Blizzard OAuth and Cloudflare routes still work. **Requires owner/players.**
7. Real devices: physical iPhone Home Screen app, desktop browser graphics, site transitions, import/export file-picker behavior. **Pending.**
8. Player acceptance: real character, actual equipment and talent APIs, manually linked Item Atlas items and account session persistence. **Pending.**
9. Discord: the owner-approved v17 manifest should send one announcement through the existing GitHub release workflow; verify Discord message/ID separately. **Pending until release.**
10. Backup: export Save Protection before testing import/reset; ensure only v17 storage changes. **Manual acceptance pending.**

### Restoration / rollback
Return to **backup/azeroth-v16-5-before-sovereign-adventure-v17-2026-11-17** if the new operations studio proves incompatible. The original local saves and v16.5 pages remain unchanged on this branch. Do not clear Safari site data or local storage as a rollback method.

### Non-goals
No character location tracking, external tracker scraping, automatic game progress, injected Blizzard credentials, real combat scoring, raid eligibility, group matchmaking, server storage, or account-state verification bypass. Owner publication approval is separate from tester pass/fail reports and must not mislabel unfinished testing.
