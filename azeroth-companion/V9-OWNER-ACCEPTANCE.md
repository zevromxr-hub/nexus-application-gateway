# NEXUS | AZEROTH COMPANION v9.0.0 — LIVING AZEROTH

**Release status:** Staging / visual acceptance pending. Not approved for automatic Discord announcement.

**Preserved rollback:** `rollback/azeroth-v8.0-before-living-v9`. Previous v7.9.9 baseline also remains in `rollback/azeroth-v7.9.9-before-v8`.

**Primary preview:** `azeroth-companion/living-azeroth.html`

## Five cinematic systems

| System | Presentation | Data authority |
| --- | --- | --- |
| Living Azeroth homepage | Original illustrated citadel and five destination chambers, optional effects | Direct navigation only; no new account fetches |
| Talent Forge laboratory | Node highlighting, allocated glow and read-only rank inspector | Existing Talent Forge node IDs, rank controls and Blizzard-returned talent text |
| Living Armory | Selectable equipment slots, illustrated silhouette and item inspector | Existing Character Intelligence Blizzard public equipment responses |
| Adventure Journal | Illustrated Mythic+, Raid and Reputation chapter selection | Existing Progression Intelligence tabs and Blizzard response cards |
| ZevRo | Azeroth Oracle | Original illustrated advisor, guided answer states and compact/full screen support | Existing curated knowledge, with transparent unsupported questions |

## Visual performance and accessibility

The new `nexus_visual_mode_v9` preference can be set to Cinematic, Balanced or Performance. It does not modify legacy keys, account sessions, or saved gameplay plans. Honor operating-system Reduced Motion, keyboard navigation, reasonable text contrast and mobile safe areas. The new SVG artwork is original and does not claim to depict an actual Blizzard character, equipped item, or achievement.

## Acceptance gates before stable v9

- Main website and `living-azeroth.html`: all five portals, fantasy artwork, responsive navigation and readable contrast on desktop and physical iPhone
- Talent Forge: known node ID, rank allocation, Undo/Redo, saved builds, click inspector, icons and imports preserved
- Armory: known public Blizzard character; visual slots match returned equipment, no invented missing items or account ownership claims
- Progression: known Mythic+, raid, reputations and partial/no-data response; original tabs and exports remain correct
- Oracle: documented question, unsupported question, full screen and bubble, keyboard focus, clear limits, no new AI backend
- Performance: all three modes, refresh persistence, mobile overflow, Reduced Motion suppression
- Security and preservation: Connected Battle.net account flow, local plans, Founder, HYPER MUSIC and existing Cloudflare Worker
- Repository checks: `tests/validate.mjs`, device browser audits for Chromium/WebKit, and GitHub Pages publish result
- Documentation: Getting Started, Player Handbook, Developer Test Requests, QA, Gateway, changelog, and Release Center

**Automatic tests do not establish physical iPhone or real WoW character acceptance.** Do not mark these gates passed without evidence.

## Release management

Official release version in `version.json` is currently `9.0.0` with `channel: staging`. The published releases index must remain at the last official accepted version until the gates above are complete.

The Discord message is prepared at `releases/drafts/v9.0.0.json`. Publishing `releases/v9.0.0.json` and updating `releases/index.json` are reserved for a verified stable release.

## Rollback

Restore only after reviewing the current commits and user-data implications. Use `rollback/azeroth-v8.0-before-living-v9` as the original v8.0 reference. Do not reset the branch blindly, delete the existing original studio files, or redeploy a Cloudflare Worker from an outdated GitHub backup.

POWERED BY ZEVRO | NEXUS
