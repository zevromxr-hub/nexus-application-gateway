# NEXUS | AZEROTH COMPANION
## v14.0 — SOVEREIGN BUILD ARCHITECT
### Owner Release Authority and Tester Backlog

**Release policy:** The owner decides when to approve and announce a development update. Automated device or gameplay acceptance can remain pending; release approval never means those tests passed. Never disable security or pretend external verification occurred.

**Rollback branch:** backup/azeroth-v13.2-before-build-architect-v14-2026-11-17

### New v14 capabilities
- **Forge Focus Mode:** Displays inbound and outbound source-reported node relationships up to 3 steps from the selected source talent. These are reported graph links, not verified full in-game prerequisites.
- **Build Comparison 3.0:** Compare the current manual plan, existing native Forge drafts or v13 independent checkpoints within the same identity. Show changes in ranks and choice indices; cannot assert power, DPS, meta or legality.
- **Personal Library:** Favorites, planning-purpose tags and user-owned notes linked to existing saved drafts. The only new persistent write is user-selected Save Notes into nexus_build_architect_library_v14. Original native talent drafts are not modified.
- **Source Integrity Review:** Flags absent source node IDs, stored ranks above current source maximums, and mismatched tree identities. No automatic save edits, migrations or game validity claims.
- **Local exports:** Comparison JSON, source review JSON, annotation JSON.
- **Visual:** Preserves the approved cinematic Reforged artwork, Blizzard icon media, dark violet/gold style, native controls and Classic Forge fallback.

### Discord and approval
1. Ordinary code commits and staging changes do not independently authorize an official Discord release.
2. An explicit owner-approved release manifest in releases/v14.0.0.json with owner_approved=true triggers the release announcer when its release-index and version metadata also agree.
3. Announcements display **Owner approved** and the actual **Tester acceptance pending**, not invented technical verification.
4. The normal release sender checks the live published version and a confirmed Discord message ID. The manual workflow mode send-owner-approved allows an explicit owner bypass of **Pages timing**, but not owner approval, manifest integrity, webhook validation, Discord message acknowledgment, or duplicate prevention.
5. Advisory test results stay available in GitHub Actions logs and screenshots. A pending/failing test does not prohibit an owner-approved update.
6. Never claim delivery unless Discord returns a message ID and the version-specific delivery marker can be recorded.

### Tester backlog for later
- iPhone Safari: talent card icons, selected-node tray, touch targets, horizontal scrolling, virtual keyboard, Build Architect controls, and home-screen presentation.
- Desktop: 3-column Reforged geometry, A/B comparison, rank choices, focus trace, safe JSON export, and compatibility diagnostics.
- Real Blizzard data: specialization accuracy, source-reported node links, missing source fields, icon spell IDs and choice mapping after game patches.
- Saved-data regressions: original Forge undo/redo, draft saving/loading, v13 checkpoints, v14 annotations, local backup, and cross-browser/device behavior.
- Battle.net and Cloudflare: secure verification, proper session expiry, public character research, and no new exposure of private tokens.
- Discord: custom-domain preview, duplicate prevention, message ID receipt, and rate-limits.
- Historical test baselines: update assertions written for pre-v12 artwork or pre-v13 script counts while preserving meaningful screenshots and functional coverage.

### Validation and rollback
Run: node azeroth-companion/tests/talent-build-architect-v14.test.mjs

This local/source test covers graph traversal, rank-and-choice diffs, identity safety and source-integrity warnings. It does not substitute for a live Blizzard response or a user's physical iPhone acceptance.

If the new v14 panel malfunctions, select Classic Forge View. The old v13.2 repository baseline is preserved on the rollback branch. Never clear player browser data as a troubleshooting step.
