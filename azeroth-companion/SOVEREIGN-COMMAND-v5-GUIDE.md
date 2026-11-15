# NEXUS | AZEROTH — SOVEREIGN COMMAND EXPERIENCE
Release: **v5.0.0**

## Purpose
A unified website experience for first-time players, returning visitors,
and friends planning World of Warcraft activities. **This release does not
change any underlying game studio, Blizzard integration, permission, or saved
player record.**

## Getting started on Home
Under the cinematic welcome, choose one of three guided journeys:

- **New Player:** Read the Information & Player Guide, create an optional
  local character, and browse items in Item Atlas.
- **Returning Player:** Open Character Dominion, review manual progress,
  and protect browser-local records with Sovereign Data Vault.
- **Playing with Friends:** Open War Room, explore dungeon planning, and
  review the group-play instructions in the Player Guide.

Each journey offers shortcuts to existing studios. Only installed tool
links are displayed. Journey selection is saved to the current browser,
not synchronized to Blizzard or between devices. The **Find Any Tool**
button opens the existing Command Launcher; it does not duplicate search.

## Appearance and accessibility
Open **Appearance Settings** in the website header. Under
**v5 Experience & readability**, choose:

- Website text comfort: Standard, Comfortable, or Large.
- Homepage atmosphere: Cinematic or Quiet and focused.

These settings affect the surrounding website shell, not studio controls,
gameplay values, Battle.net account identity, or downloaded media.

Keyboard users can use **Skip to main content**, the existing **Ctrl+K
(or Command+K)** Command Launcher, Escape to close overlays, and focus
indicators around controls. The browser page title and screen-reader
announcement change when the active studio changes. A Return to Top
control appears on sufficiently long pages.

## Data clarity
- Manual characters, goals and session notes are stored locally in the
  player's browser unless explicitly exported.
- Account authentication and private Blizzard information remain on the
  dedicated secure Cloudflare Worker portal.
- Public Armory research is separate from authenticated ownership and
  never proves that a player owns an item or character.
- The site's release banner uses the existing published manifests.
- No telemetry, new API access, or new personal-data synchronization is
  added by Sovereign Command.

## Architecture and maintenance
The release retains exactly two stylesheet and two deferred JavaScript
network resources. The original 26 CSS and 27 JavaScript source files
remain editable; the source compiler ensures bundled outputs are exactly
reconstructed from them. The new additions are:

- `sovereign-command-v5.css`
- `sovereign-command-v5.js`
- `styles-experience-v5.0.css` (compiled)
- `scripts-experience-v5.0.js` (compiled)

The existing `styles-core-v4.7.css` and `scripts-core-v4.8.js`
remain unchanged.

If the site-shell source is updated in a future release, use the GitHub
Node environment or Node 22 to rebuild:

```sh
node azeroth-companion/scripts/lean-launch.mjs --write
node azeroth-companion/scripts/lean-launch.mjs --check
node azeroth-companion/tests/validate.mjs
```

The user and their friends do not need Node to use the site. No Cloudflare
Worker deployment is required.

## Acceptance testing
The GitHub Actions browser suite tests desktop Chromium and phone-sized
WebKit. Physical iPhone Safari, real Battle.net sign-in, and personal
character-data workflows still require real-device/player acceptance.
See `QA-DEVICE-ACCEPTANCE.md` and `STARTUP-ENGINE-MAINTENANCE.md`.

Powered by ZevRo Development | NEXUS
