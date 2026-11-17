# NEXUS | AZEROTH COMPANION — v13.1
## REFORGED PRECISION & MOBILE POLISH
### Scope, safety and device acceptance

**Version:** 13.1.0 staging · **Rollback branch:** `backup/azeroth-v13-before-reforged-mobile-polish-v13-1-2026-11-17`

**What changed**
- Refined Reforged's live canvas with larger source-backed icons and talent labels; increased tappable +/− controls and inspector control sizes.
- Added **Compact Map**, **Focus Selected**, and **Reset View** buttons. The compact mode is visual only and does not alter rank maps or saved drafts.
- Added an optional **Highlight differences** switch. With a saved draft or v13 historical checkpoint selected, the interface calculates changed node count and manually increased/decreased ranks for Blizzard-returned nodes. Unchanged cards dim but remain interactive. No DPS, strength, prerequisite, meta or game-validity claims are made.
- On iPhone and tablet, tapping a genuine source node opens a dismissal-ready, safe-area-aware selected-talent toolbar showing its official name, source ID, current manual rank count, native +/− delegates and a **Details** jump.
- Reforged's visual text search now filters only Reforged's mirror. It no longer triggers the hidden original Forge's search/redraw with each keystroke. Original Forge search remains available in Classic Forge View.
- Uses existing original-art images, source spell-icon URLs, and CSS. No new images, remote assets, network requests or animation engines.

**Original functionality preserved**
- `window.NexusTalentSourceBridge.snapshot()` provides the source data; the native Forge remains sole authority for editing ranks, undo, redo, save/load, import/export and recovery.
- Existing local data keys, original API Worker, connected account verification, Music Studio and all other research views are unmodified by v13.1.
- The v13.1 JavaScript does not call `localStorage.setItem` or `fetch`. It only reads (when necessary) the existing v13 checkpoints to summarize comparisons.
- The Classic Forge toggle remains available.

**Source-level validation completed**
- The v13.1 JavaScript passed parsing; the v13.1 CSS passed brace-balance checks.
- A simulated DOM test with source-backed sample data successfully exercised the initial empty comparison, computed a real rank difference, enabled comparison focus, opened a selected-node mobile toolbar, toggled compact mode, closed the toolbar and confirmed **zero persistent-storage writes**.
- Browser markup, script load order, original source bundle references, version labels and rollback branch should also be audited after wiring.

**Device acceptance required** (not verified remotely)
1. On an iPhone in Safari, open `https://zevarchives.com/azeroth-companion/?enter=1&view=talents`. Confirm the v13.1 page loads, rank buttons are usable, the node map pans horizontally and no fixed toolbar obscures controls permanently.
2. Load a Blizzard specialization; select nodes in Class, Specialization and Hero. Check real icon visibility, node labels, and inspector descriptions.
3. Tap an official node on iPhone. Confirm the selected-node toolbar appears, increases/decreases using the original planner, closes on ×, and Details jumps to the full inspector.
4. Select a saved draft in Compare With. Check the calculated changed-node and rank counts and that the optional highlight switch dims only unchanged talent cards.
5. Type in the Reforged search. Verify the new grid filters without needlessly changing the hidden original Forge search.
6. Toggle Compact Map, Focus Selected and Reset View. Check that the map remains scrollable and rank controls are reachable in both orientations.
7. Use Undo, Redo, Save Build, native loading, version checkpoints and JSON export. Toggle Classic Forge View and verify original controls are intact.
8. Verify mobile reduced-motion preferences, no animation stuttering, no overflow of the viewport, and existing account verification / other studios functioning.

**If anything fails**
Use **Classic Forge View** first. The v13.1 changes are limited to `talent-forge-reforged-v13.js`, new `talent-forge-reforged-polish-v13.1.js/.css`, and HTML asset references/version notes. Full pre-change repository state is captured in the v13 rollback branch above. Do not delete browser data to troubleshoot.
