# NEXUS | AZEROTH COMPANION
## v15.0 — SOVEREIGN CHARACTER NEXUS
### Owner-approved capability, safety, portability and tester acceptance

**Rollback:** \`backup/azeroth-v14-before-character-nexus-v15-2026-11-17\`
**Release authority:** Owner approved / tester acceptance pending. Failed or incomplete device/game checks remain truthful advisory findings rather than gates to GitHub development or Discord announcements.

### Source of truth and what actually works
1. **Selected manual character:** Retains the original v11 My Character selector and browser-local data from \`nexus_azeroth_companion_genesis_v1\`. The additional v15 dossier updates from the selected profile and never asserts Blizzard account ownership.
2. **Public Blizzard research (explicit):** Uses the *existing* Cloudflare gateway endpoints \`/api/character/{region}/{realm}/{character}\` and \`/api/equipment/{region}/{realm}/{character}\`. Users supply or save a public region/realm/name identifier, then click Load Public Blizzard Data. Requests omit credentials and show genuine source failures and partial results. Public profile/equipment data is in memory only, not converted to a local "verified inventory".
3. **Equipment connection:** Displays official returned item slots, item IDs and levels alongside separately labeled manual Item Atlas statuses. Matches exact IDs only; a mismatch does not mean an item is an upgrade, owned, missing from inventory, or best-in-slot.
4. **Character-linked Forge:** Explicit button launches the original native Reforged Talent Forge with a fresh, same-origin session-only character hint. Only a unique exact name match in the official specialization index may preselect a spec; users still choose Load Official Tree. No ranks, saved drafts or account data are automatically modified or imported.
5. **Adventure command:** Reuses local v11 quests and core tasks. Add Objective switches to the original functional Adventure Log; existing task/quest records remain the only manual planning store.
6. **Portable build package:** Export a whitelisted file \`nexus.character-nexus-package/1\` including the character's manual display fields, only explicitly linked drafts (max 12), and optional personal notes/goals/Item Atlas targets. It excludes cookies, tokens, sessions and unrelated player data; the export consent warns users that names/realms/notes can still be personal.
7. **Safe guest imports:** A JSON package is read with size cap, whitelisted, validated and previewed before user acceptance. Imported packages are stored in a separate guest shelf (max 10). Export guest draft as native Talent Forge JSON for manual import; never overwrite original characters, drafts, links, or rank allocations.
8. **Manual iPhone-to-PC portability:** Export a package from one device, transfer it privately, and import on the other. **No automatic cross-device cloud synchronization** is asserted. True cloud sync requires secure backend storage and explicit identity/authorization design and is not part of v15.

### Keys and boundaries
v15 may write only:
- \`nexus_character_research_links_v15\` when a user explicitly selects Save Research Link
- \`nexus_character_nexus_imports_v15\` when a user explicitly accepts/removes a guest package
- \`nexus_character_nexus_forge_launch_v15\` in sessionStorage, consumed once for a user-directed Forge handoff

v15 reads (does not rewrite) existing manual character, talent, link, quest, item tracker and v14 note records. Original secure Blizzard session and credential handling stays unchanged.

### Source checks and optional testers
Run \`node azeroth-companion/tests/character-nexus-v15.test.mjs\`. This tests public-data parsers, source/manual equipment ID comparison, character associations, safe portable-package sanitization, malformed package rejection, separate import keys, existing Forge wiring, and backup-whitelist coverage. Tests are not substitutes for live credentials, user-device checks or in-game validation.

The existing \`player-test-checklist.html\` has 12 v15-specific scenarios covering Safari, public data, Forge selection, manual item statuses, Adventure Log, safe export/import, no fake sync, account regression and Discord delivery.

### Backups and rollback
The Save Protection Center now includes v13 checkpoints, v14 library notes and v15 research links/guest packages as read-only whitelisted exports. It does **not** backup cookies or accounts and does **not** silently import restored records. Preserve the exported file privately. Roll back frontend source to the named v14 branch if necessary; do not delete users' local saved data as a troubleshooting step.

### Discord
Release metadata requires owner approval, a consistent release index, and the current release manifest. The Discord embed must say **Owner approved** and **Tester acceptance pending**. An official Discord message is confirmed only when the webhook returns a message ID and the delivery marker is saved.

**Future v15.x scope, not implemented:** encrypted server-side cross-device sync, account-attested ownership, live server-stored inventory history or game-legal talent import strings. These require additional backend/Blizzard API permissions and must not be simulated by localStorage.
