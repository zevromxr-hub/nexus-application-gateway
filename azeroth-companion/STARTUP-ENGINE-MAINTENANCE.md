# NEXUS | AZEROTH — Intelligent Startup Engine (v4.8)

## Goal
Improve initial usefulness and reduce unnecessary work on slower phones while
preserving all existing studios, their storage keys, secure account flows, and
the Assassin Dominion presentation.

This is **view-aware initialization, not code splitting**. Both v4.8 JavaScript
bundles are still downloaded and parsed; the app defers selected OPTIONAL work
until the player navigates to the relevant tool.

## What now runs only on first visit
- **Talent Forge:** Remote Blizzard specialization/talent index request.
- **Loot Hunter:** Optional curated `loot-sources.json` reference catalog.
- **Release Center:** Its additional version/release manifest requests.
- **Information & Guide:** Its separate version/release manifest requests.

The website home/update header still requests the release manifest. Personal
Battle.net verification, including short-lived proof checks, is unchanged.

## What now computes on demand
The original studio DOM and navigation controls remain available. Large
cross-studio planning summaries and local item tables are populated when the
player opens Character Dominion, Unified Character Dashboard, Progress
Command, Player Field Lab, or Item Atlas. War Room group views similarly
render when selected. Dashboards refresh when revisited so newly saved local
records are not lost.

## Technical integration
The existing inline router emits a local `nexus:view-activated` event after
marking the selected view active. A small `window.NexusStartup.whenView()`
helper supports one-shot work and work that should run on every visit.

This event is **not** proof of authentication or character ownership and does
not transmit player data. It only coordinates when existing browser-local code
runs.

## Build and compatibility
- Styles remain compiled as `styles-core-v4.7.css` and
  `styles-experience-v4.7.css`; their sources and cascade order are unchanged.
- JavaScript is now compiled as `scripts-core-v4.8.js` and
  `scripts-experience-v4.8.js` to avoid stale browser caches.
- All 26 original JS source files stay editable.
- The deterministic Lean Launch generator compares the four compiled resources
  with the exact original source and fails release validation if out of sync.

After future code edits, rebuild with GitHub Actions' Node 22 environment or
any Node 22 environment:

```sh
node azeroth-companion/scripts/lean-launch.mjs --write
node azeroth-companion/scripts/lean-launch.mjs --check
node azeroth-companion/tests/validate.mjs
```

Players do NOT need Node installed. No Cloudflare redeployment is required.

## Automated tests
The GitHub device audit still covers responsive desktop Chromium and
phone-sized Chromium/WebKit, preference persistence, navigation, modal and
shortcut behavior. The new startup audit checks that optional API/catalog
requests and hidden progress summaries are absent on Home, then verifies they
work when their respective views are opened.

The remote Cloudflare Worker is stubbed as unavailable ONLY inside localhost
browser tests to protect its approved-origin policy; no fake Blizzard player
data or authenticated responses are supplied.

## Limitations
The initial JavaScript bundle size is not yet smaller, and basic studio
navigation/DOM shells still initialize immediately. This release primarily
reduces first-page remote requests and unnecessary hidden-view calculations;
it does not certify a specific speed improvement on real iPhone hardware or
promise offline Blizzard access.

Powered by ZevRo Development | NEXUS
