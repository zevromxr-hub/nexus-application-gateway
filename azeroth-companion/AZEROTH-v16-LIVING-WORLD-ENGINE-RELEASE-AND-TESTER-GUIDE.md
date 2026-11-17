# NEXUS | AZEROTH COMPANION
## v16.0 — LIVING WORLD ENGINE / THE WAR ROOM & WORLD ATLAS
### Owner-approved release design, data contracts, safeguards and optional tester backlog

**Rollback:** \`backup/azeroth-v15-before-living-world-engine-v16-2026-11-17\`

### What is actually implemented
1. **The Living War Room** is an additive section in the existing \`command-center.html\`. It keeps the v10 animated hero, the five illustrated Chambers, the manual Chronicle, the founder identity, music and other studios intact. The War Room reuses locally hosted art, reads the selected manual character, saved talent drafts, Item Atlas research and manually saved exploration goals. Its “next move” is selected from the user's recorded objectives, not invented Blizzard quest data.
2. **Command Search 2.0** is an additional browser-local command dialog reachable from the War Room and Cmd/Ctrl+Shift+K. It indexes known studio destinations, curated atlas zones, local characters, native saved Talent Forge drafts, manual Atlas objectives and manual Item Atlas records. Queries are never sent to a server. The old Command Center search remains present and fully functional.
3. **Living World Atlas** at \`world-atlas.html\` features a hand-drawn **schematic conceptual world map**, eight curated in-game region groups and at least twenty research destinations. Every map pin is interactive and filters an actual curated zone list; the map does **not** represent precise Blizzard coordinates, live dungeon rotations, unlocked content, current patch availability, or live player location. No new external data APIs or art sources are required. Names are curated examples and warrant review against the player's current game version.
4. **Adventure Operations** lets players create their own local objectives attached to a curated zone, and optionally a locally saved character, existing saved manual talent draft and tracked Item Atlas record. Status choices are Planned / In Progress / Manually Completed, with delete confirmation, exportable JSON and a 120-objective cap. Missions are **not automatically validated, synchronized, tracked in-game or reported as actual achievements**.
5. **Studio Intelligence Network** connects the War Room to the World Atlas, Talent Forge, Character Nexus, Armory, Oracle, progression research and collection tools through real links. The existing \`player-experience.html\` gains a read-only World Atlas bridge for the selected character; the original Companion sidebar also links to the Atlas.
6. **Cinematic enhancement** retains the approved gold/violet/deep-blue design, reuses the original NEXUS panorama and studio artwork, adds high-contrast interactive portals and location focus, and follows mobile/reduced-motion accessibility preferences. No autoplay, new heavy canvas animation, audio changes, proprietary art upload or external design dependency.
7. **Safe continuity:** \`save-protection.html\` now includes the extra Atlas mission key in its existing read-only backup export. All original v10 through v15 record keys, character data, OAuth, Blizzard Workers, Talent Forge allocation engine and Discord owner-approval controls remain unchanged.

### Specific v16 local browser storage
- NEW: \`nexus_world_atlas_goals_v16\` — only explicit saving, status change and user-confirmed deletion of Atlas missions may write this.
- EXISTING: \`nexus_player_focus_v11\` — the War Room writes this pre-existing character preference **only when the user explicitly selects an existing local character**; original Player Experience owns it.
- Everything else is read-only. No browser tokens, account identifiers, authentication secrets or connected Blizzard account data are collected by the World Engine.
- The World Atlas mission exports may include personal names or notes, so players should review JSON contents before sharing. Device-to-device mission transfer is a **manual export only** at v16; an automatic import, secure sync service or live account merge is not implemented.

### Deferred tester acceptance (does not block owner release)
- **iPhone Safari / Home Screen:** War Room map & portal layout, long region labels, landscape and portrait atlas scrolling, keyboard search and mission form, tap sizes, safe-area margins, animations and reduced-motion preference.
- **PC browsers:** All eight conceptual map regions and curated zone links, Command Search 2.0 hotkey, standard legacy search, layout responsiveness, no overlapping controls.
- **Data correctness:** Verify curated destination names and region association for current retail/legacy game contexts. No implied dungeon/raid entrance, travel times, source coordinates or event rotation.
- **Mission integrity:** Create multiple notes/characters/build/item links; change status; export, delete, refresh and check that original Native Forge drafts, quests and item records remain unchanged.
- **Connected character:** Choose a character in the War Room, open Character Nexus, check filtered World Atlas goals, return to War Room and verify local focus behavior.
- **Regressions:** Battle.net verification, Blizzard public Armory, Forge +/− and undo/redo, v14 Build Architect, v15 portable guest packages, HYPER MUSIC, founder bubble, and save backups.
- **Release:** The ZevArchives custom domain and Discord embed should display v16, say owner approved with tester acceptance pending, and be delivered only once per release version with a confirmed Discord message ID.

### Test coverage
- \`node azeroth-companion/tests/living-world-engine-v16.test.mjs\` — curated region and zone IDs, bounded mission values, local search, JS/CSS parsing, navigation and backup source assertions.
- \`node azeroth-companion/tests/living-world-engine-v16.browser.mjs\` — synthetic local records across desktop Chromium and iPhone-style WebKit, War Room, search, map, goal save/status change, connected Character Nexus and native draft preservation.
- These tests are advisory under your explicit **owner-controlled release policy**. Results stay truthful. Automated tests do not establish physical iPhone acceptance, game validity, player account ownership or current Blizzard API availability.

### Deferred later features — not claimed
Real geographic zone boundaries/gameplay coordinates, live seasonal events or achievements, automatic character positioning, Blizzard-authenticated activity tracking, automated game-legal build pathways, automatic cross-device sync and guaranteed cloud backups. These require additional permission, data sources or backend design.

### Release process
Version metadata, approved release index and owner manifest must agree. Discord receives an **Owner approved / Tester acceptance pending** announcement via your pre-existing webhook and duplicate-protection workflow. The GitHub Pages publication and webhook response are operational checks, not automatic gameplay verification. No false success is claimed if deployment or Discord acknowledgment is still pending.
