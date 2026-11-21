# NEXUS | AZEROTH — Site Simplification & Documentation Standard

**Audit baseline:** November 21, 2026 · v24.0.1 documentation maintenance, following Atlas Intelligence v24.0.0  
**Status:** Owner requested a future site-wide usefulness audit; this document is a **plan, not authorization to delete** features, records, or routes.

## Principle: one destination for each player task

The website should let a player answer *What do I want to do?* without traversing a chain of planning-only panels or external research sites. Keep the actual working function; consolidate duplicate interfaces and preserve their underlying source, account boundaries, and saved records. The real in-app World Atlas and its iPhone native fullscreen viewer are current primary experiences, not the older illustrative Atlas charts.

## Inventory snapshot (repository-level, not a runtime usability verdict)

The repository tree contains **22 top-level Azeroth HTML pages** and hundreds of supporting scripts/assets. These page paths include the main entry/command center, Character Nexus, World Atlas, Talent Forge within the companion, player onboarding/handbook, the guided assistant, progression and character intelligence, private media, and legacy planning workspaces. Counts and page files alone do not establish which tools players use. No analytics, user survey, or real-player feature-by-feature acceptance was reviewed to label a tool “useless.”

### Candidate overlap clusters to investigate

| Cluster | Existing experiences to compare | Hypothesis / non-destructive direction |
|---|---|---|
| World exploration and maps | v16 illustrated Atlas, v18 cartography/lens, v22 waypoint notebook, v22.1 real maps, v23+ Atlas discovery | Make one real World Atlas front door. Place manual notebook and historical field research under compact Advanced controls; retire duplicate surface code only once all saved mission/route/waypoint actions pass regression. |
| Item research and farming | Item Codex, Universal Item Atlas, Loot Hunter, Farming Operations, Character Targets and v24 Atlas Intelligence | One in-app “Find / Inspect / Save / Track” flow; retain distinct data semantics and explicit user actions, and carefully map historical saved goals before any screen is retired. |
| Goal and adventure planning | War Room, Expedition Console, Adventure Operations, Living Intelligence Director, route planner | Clarify which tool uniquely serves active play. Merge overlapping checklists and summary screens; keep an Advanced Planner only where a useful outcome survives. |
| Character research | Character Nexus, public Armory, Character Intelligence, progression research, dashboards | Reuse a common selected-character context, separate public Blizzard data from manual records, and eliminate duplicated lookup forms only after the independent API workflows are checked. |
| Assistance and documentation | Player Handbook, Player Guide, guided Assistant, release notes, tester checklist | Use a canonical current knowledge library and manifest; ensure both miniature and full Assistant use it. Remove stale instructions, not useful tutorials or test evidence. |
| Entertainment and optional visuals | Cinematic entrances, personal music/video controls, optional visual effects, Private Video Vault | Preserve purposeful entertainment and private encrypted content. Test startup cost, battery/thermal impact, discoverability, and device constraints before hiding optional effects or retiring a studio. |

These are **audit candidates**, not assertions that any one feature is broken, unused, or removable.

## What the audit must actually measure

1. **User action → completed result:** number of taps/screens to get a valid game map, item source, checklist, profile, export, or media playback. Identify dead ends, vague buttons, redundant steps, unnecessary outbound links and fake-looking visual-only results.
2. **Functionality and evidence:** classify each feature as verified live source data, curated reference, user-authored manual record, decorative example, or unsupported. Never promote one category to another.
3. **Platform quality:** exercise every primary action on desktop Chromium and emulated WebKit, then obtain owner/real iPhone acceptance for fullscreen, touch, scrolling, readable feedback, media performance and storage persistence.
4. **Dependencies and persisted state:** inventory localStorage/IndexedDB records, file imports/exports, Worker endpoints, Battle.net scopes, release automation, backup/restoration, deep links, and navigation references before changing any feature.
5. **UX efficiency:** identify which experience can become a single searchable map, contextual detail card, advanced disclosure, or one-action handoff rather than a new permanent navigation tab.
6. **Value decision:** mark each capability **Keep / Merge / Move to Advanced / Deprecate / Remove** with evidence. Require explicit owner approval before irreversible removal.

## Safe deprecation protocol

- Create a rollback commit and backup/export path; document what cannot be backed up automatically, including separate encrypted Private Video Vault handling.
- Design the replacement action and test it with real sample tasks. Preserve legacy saved data and previous import schemas. Migration must be reversible or explicitly opt-in.
- Redirect or update internal links, shortcut names, help articles, release notes, Command Center search and tester instructions. Never leave navigation pointing at a removed page.
- Retain compatibility for bookmarked routes and workflows until the owner confirms replacements work on PC and iPhone.
- Remove duplicate UI first, then eliminate redundant JS/CSS and asset downloads after dependency audits. “Hidden” alone does not equal code retirement.
- Verify no OAuth credential handling, account consent, manual ownership state, saved missions/routes, waypoint libraries or encrypted media changes inadvertently.
- Publish a clear release note describing **what remains, what moved, what was retired, and whether users must act**.
- Escalate all data-loss, security, login and source-accuracy regressions instead of treating an advisory CI green check as a complete acceptance.

## Documentation and Assistant release contract — effective for all subsequent changes

**A functional release is not considered documentation-complete unless:**

1. **Source of truth:** `version.json`, `releases/index.json`, the release-specific `releases/vX.Y.Z.json`, and `CHANGELOG.md` agree on the current version and delivered behavior.
2. **Player guidance:** `player-handbook.html` describes the primary user path, iPhone/PC differences, data limits, and any moved/retired tools. `player-guide.js` and `player-test-checklist.html` reflect the same feature.
3. **Assistant:** `azeroth-assistant-knowledge.json` is the canonical curated answer set. The full assistant and floating mini assistant must consume the same file. `assistant-journey-v7.9.9.js` plans reflect current paths. The assistant may read the public release metadata but must not claim to be generative AI or automatically know private player data.
4. **Navigation:** release notes, relevant cross-studio deep links and legacy shortcuts are revised as needed. Actual links should be tested, not invented.
5. **Acceptance:** add/extend regression tests for the change, use available browser checks, and retain an explicit pending status for real-device / live-Blizzard validation where applicable.

**Guiding rule:** no “released” feature without an accurate help entry, and no documented feature presented as available when the actual code does not offer it.

## Current baseline — Atlas v24

The current in-map actions include sourced zone-map markers, selected boss/instance lineups, a limited curated item acquisition library, on-demand Blizzard item-name/ID search via the existing read-only gateway, manual wishlist/farm/checklist actions, map macro copying, and native modal fullscreen on iPhone. External sources remain optional references. This is not a complete loot database, real-time gathering map, verified item-ownership sync, or a dungeon interior mapper.

## First implementation priority when the owner requests the site-wide cleanup

Start with the **World Atlas legacy layering** and **Item research/farming overlap**. Inventory every user action and persisted record, produce a proposed navigation model and delete/merge candidates, test representative paths on PC and iPhone, then implement the smallest reversible consolidation. Only afterward consider the broader War Room / planning / optional visual modules.
