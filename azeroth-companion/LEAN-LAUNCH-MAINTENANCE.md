# NEXUS | AZEROTH — Lean Launch assets
Release baseline: **v4.7.0**, updated for **v4.8.0 Intelligent Startup**

## What changed
The v4.6 website requested 25 stylesheet files and 26 deferred JavaScript
files on each cold page load. v4.7 preserves all 51 original sources but
delivers them in **two CSS + two deferred JavaScript files**:

| Compiled asset | Original sources | Purpose |
|---|---:|---|
| `styles-core-v4.7.css` | 13 CSS | Earlier studio layout and navigation styles |
| `styles-experience-v4.7.css` | 12 CSS | Visual themes, additional studios and website shell |
| `scripts-core-v4.8.js` | 13 JS | Original data, item and character module scripts |
| `scripts-experience-v4.8.js` | 13 JS | Talents, later studios, account UI and site shell |

**This reduces the number of site stylesheet/JavaScript network requests
from 51 to four.** It does not guarantee the page is 12× faster, reduce
the source bytes automatically, eliminate startup calculations, certify
physical iPhone performance, or change how Blizzard APIs work.

## Source of truth and future maintenance
The original per-studio `.css` and `.js` files remain fully editable and
are still the source of truth. The compiled resources are generated copies.
The HTML `data-sources` attributes document the exact original execution
and cascade order.

After any change to those files, GitHub Actions will reject stale bundles.
Use the GitHub Actions Node environment or any Node 22 environment to rebuild:

```sh
node azeroth-companion/scripts/lean-launch.mjs --write
node azeroth-companion/scripts/lean-launch.mjs --check
node azeroth-companion/tests/validate.mjs
```

Commit the rebuilt output together with the updated source. Do not
hand-edit the bundled copies. End users do **not** need Node to open the website.

## What CI verifies
- Exact byte-for-byte reconstruction from the 51 original source files.
- Valid compiled JavaScript syntax and preserved original source order.
- Exactly two active CSS and two active JavaScript resources.
- Functional desktop Chromium, mobile Chromium and mobile WebKit tests,
  with the Cloudflare Worker stubbed as unavailable because local test
  origins are not authorized to access private account services.
- No new permissions, account connections, browser storage migrations,
  or studio feature changes.

## Acceptance and limitations
This is a website delivery optimization. The application still initializes
the full set of studios at startup, so actual interactive performance depends
on device CPU, network, browser and data volume. Measure load times in real
iPhone Safari as well as desktop before claiming specific speed gains.

See `QA-DEVICE-ACCEPTANCE.md` for the physical-device checklist.
All sensitive Battle.net authentication remains on the secure Cloudflare origin.

Powered by ZevRo Development | NEXUS
