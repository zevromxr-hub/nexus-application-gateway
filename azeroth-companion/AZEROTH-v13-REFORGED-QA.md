# NEXUS | AZEROTH COMPANION
## v13.0 — SOVEREIGN TALENT FORGE: REFORGED
### Staging acceptance and rollback guide

This release adds the Reforged workshop as an **additive interface** to the original Talent Forge engine. The classic interface remains mounted and can be toggled from the Forge hero; previous v12 source is available in `backup/azeroth-v12-before-sovereign-talent-forge-v13-2026-11-17`.

### What the new interface actually does
- **Real tree source:** `window.NexusTalentSourceBridge.snapshot()` supplies official talent nodes, categories, choice/rank descriptions, node IDs, source-reported relationships and optional spell icons already loaded through the original engine.
- **Native rank editing:** + and − call the original `[data-tf-inc]`/`[data-tf-dec]` buttons. Nothing bypasses native undo, pending recovery or draft restrictions.
- **Native save/undo/export/load:** Reforged controls delegate to the original `tfSave`, `tfExport`, `tfUndo`, `tfRedo`, `tfLoad`, `tfSaved`, selectors and planner metadata.
- **Visual comparisons:** The current manual rank map is compared to an original saved draft or a separately saved version checkpoint for the same tree identity. Colors indicate planned rank differences, NOT relative performance or game legalities.
- **History:** Only `nexus_forge_reforged_checkpoints_v13` is written by the new JavaScript. Up to 24 local checkpoint copies can be exported as manual Talent Forge JSON drafts or deliberately removed.
- **Characters:** Existing character links from v11 are displayed read-only alongside saved drafts.
- **Images:** Reuses the already hosted `assets/zevro-wide-banner-v9.2.webp` and `assets/talent-forge-v9.1.webp`; dynamically displayed talent icons are reused only where the original source already supplied an image.
- **Screen sizes:** Three-column on wide desktop, two-column on smaller desktop, stacked with scrollable official node map on mobile.
- **Fallback:** Select **CLASSIC FORGE VIEW** to reveal all original controls immediately. This does not modify saved data.

### Player acceptance tests (not automated by source inspection)
1. On iPhone Safari and a desktop browser visit `https://zevarchives.com/azeroth-companion/?enter=1&view=talents`. Confirm Reforged v13 hero, setup, canvas and inspector appear.
2. Choose region and specialization; select **Load Official Tree**. If the Blizzard Worker is unavailable, confirm the status is explicit and **no fake tree** appears.
3. Switch Class / Specialization / Hero. Confirm displayed node IDs/names match the original Forge's source.
4. Select any node and inspect descriptions and ranks. Increase then decrease the rank: both the Reforged canvas and the original saved plan should reflect the same amount.
5. Use Undo and Redo. Confirm original draft state returns correctly. Test with a pending autosave recovery—no edits should bypass the native recovery decision.
6. Save a named draft. Confirm it appears in the original library. Reopen it from Reforged and verify allocations.
7. Select that draft in Compare With. Confirm additional/reduced ranks are highlighted on real nodes; do not interpret highlights as build validity.
8. Save an independent v13 checkpoint and export its JSON. Confirm removing a checkpoint does not remove the original draft.
9. Toggle **Classic Forge View** and back. Confirm original controls, player features, layout, and saved data remain intact.
10. Verify iPhone landscape/portrait and desktop widths: no clipped rank buttons, unreachable scroll controls or persistent hanging animations.
11. Verify Battle.net verification, music, other studios, and Save Protection Center remain unaffected.
12. Export Talent Forge and original companion backups before clearing browser data, changing domains or switching devices.

### Internal source checks completed
- Reforged JavaScript compiled using JS parsing; the CSS braces are balanced.
- New page assets are linked directly from `azeroth-companion/index.html` with cache-busting `?v=1300`.
- Existing application scripts and entry routing are preserved.
- Reforged itself performs no network requests and no original storage-key writes.
- Existing Codex/Blizzard API responses, actual iPhone rendering, and real-user actions remain **unverified** without live device or browser acceptance.

### Limitations
The Forge is a research-oriented manual planning tool, not a game-valid build validator, official recommendation engine, simulation, or export-string generator. Source-reported node links may not be sufficient to infer actual in-game prerequisites. Personal data and drafts are browser-local; domain changes or browser profile changes do not automatically sync them.
