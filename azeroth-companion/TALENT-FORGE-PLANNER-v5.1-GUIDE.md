# NEXUS | AZEROTH — TALENT FORGE PLANNER
Release: **v5.1.0 — Sovereign Build Architect**

## What this planner does
Talent Forge remains a browser-based **manual research and build-planning tool**.
Official Retail talent nodes, names, returned rank arrays, choice descriptions,
and limited source-reported node links are retrieved from the existing Blizzard
API-backed Cloudflare Worker. This release does **not** replace official game
rules or generate an in-game talent import code.

The new **Build Architect Workspace** includes:

- **Build purpose:** General, Raid, Mythic+, PvP, Solo and Open World.
- **Role and approach:** Damage/Tank/Healer and Balanced/Burst/Sustain/
  Utility/Survival preferences. These are player annotations, never automatic
  class restrictions or meta rankings.
- **Optional personal point targets:** Separate Class, Specialization and Hero
  targets. Zero disables a target. These are **not Blizzard point caps**.
- **Structured review:** Counts planned ranks per category; flags unknown
  nodes, ranks beyond source-reported rank arrays, unsupported choice values,
  points exceeding the player's own targets and allocations spanning multiple
  returned hero trees. The existing Talent Path Intelligence remains a source-
  relationship diagnostic **not proof of invalid in-game prerequisites**.
- **Build notes:** Rotation ideas, encounter reminders, reasons for selections,
  and questions to check in-game (up to 1800 characters).
- **Saved drafts and comparisons:** Existing manual rank and choice controls,
  undo/redo, JSON export/import, same-specialization comparisons and the
  40-entry local library are preserved. Existing saved drafts can now be
  duplicated safely, without changing the original.
- **Build brief:** Copy a human-readable planning summary including allocated
  talent names and planned ranks (where the browser allows clipboard access).
- **Unsaved draft recovery:** Rank, choice, note and target changes are backed
  up locally after a short pause. When revisiting the same specialization,
  the player must explicitly **Restore** or **Discard** the prior working copy;
  the program does not silently replace the loaded saved draft.

## Using the Forge
1. Open the website, select **Talent Forge**, choose your region and an
   official specialization, and press **LOAD TALENT TREE**.
2. Select a build purpose and role, optionally set custom target reminders,
   and add explanatory build notes.
3. Allocate rank and choice nodes using the existing Class, Specialization and
   Hero tabs. Use Undo/Redo, node search, official position view and Talent
   Path Intelligence to inspect choices.
4. Watch the **Build allocation review**. Any advisory is a research note,
   **not a Blizzard loadout-validity result**.
5. Use **SAVE BUILD** for local access, **DUPLICATE** for variations and
   **EXPORT BUILD JSON** for a portable copy. You can compare saved drafts
   for the same specialization.
6. Verify the final allocation using the **in-game World of Warcraft talent
   interface** before playing. Do not paste the exported JSON into the game:
   it is a NEXUS planning draft, not a Blizzard talent import string.

## Security and compatibility
- No new OAuth scopes, Cloudflare changes, Blizzard account permissions or
  gameplay account data are used. The planner cannot read a player's private
  current talent loadout or prove ownership of a character.
- Saved records remain under the existing
  `nexus_azeroth_talent_forge_v1` localStorage key in the original
  `nexus-azeroth-talent-draft-v1` format. Optional `planner` metadata is
  backwards compatible with prior saved drafts and exported JSON.
- Unsaved recovery uses the separate browser-local
  `nexus_azeroth_talent_planner_autorecover_v51` key, capped at eight recent
  specializations. It does not synchronize between devices.
- Imported draft JSON must pass strict identity, filename-size, node-count,
  integer rank and choice-value checks, followed by filtering against the
  currently loaded official node IDs and source-reported rank limits.
- Exported JSON and copied summaries may contain personal notes the player
  wrote. Review them before sharing.
- Data recovery requires browser localStorage to remain intact. Clearing
  site data or using another device can remove unsaved records; export a
  JSON backup for important plans.
- The Forge remains an **unofficial fan-made research planner**, not
  affiliated with or endorsed by Blizzard Entertainment.

## Developer maintenance
Source files:
- `talent-planner-core.js` — pure metadata, import and diagnostic helpers.
- `talent-forge.js` — existing studio plus Build Architect Workspace.
- `talent-forge.css` — mobile and desktop responsive planner UI.

Compiled releases keep exactly two CSS and two JavaScript resources:
`styles-core-v5.1.css` and `scripts-experience-v5.1.js` replace the
corresponding older bundles; the other two are unchanged.

GitHub's Node 22 environment can regenerate and verify bundles:

```sh
node azeroth-companion/scripts/lean-launch.mjs --write
node azeroth-companion/scripts/lean-launch.mjs --check
node azeroth-companion/tests/validate.mjs
```

Automated tests use explicitly **synthetic talent fixtures**, not live
Blizzard player records or official validity checks. Real character owners
should complete independent in-game acceptance testing.

Powered by ZevRo Development | NEXUS
