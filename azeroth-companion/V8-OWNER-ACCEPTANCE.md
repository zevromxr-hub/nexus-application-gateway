# NEXUS | AZEROTH COMPANION v8.0.0 — Owner Acceptance & Rollback

**Status:** DEVELOPMENT PREVIEW / STAGING, not an accepted stable or announced Discord release.  
**Rollback branch:** `rollback/azeroth-v7.9.9-before-v8`  
**Preserved commit:** `aeb88128b76bb4cb8fe5247518852c4c057460b1`  
**Cloudflare Worker:** No new Worker deployment required for this frontend-only v8 release.

## Scope delivered

1. Sovereign Dashboard: browser-local read-only preview and explicit public character/equipment lookup.
2. Unified Character Data schema: `nexus.azeroth.sovereign-snapshot/1`, distinguishes manual data, imported claims and Blizzard API results.
3. Talent Forge Ascension: saved-build ID/rank comparison; does not certify talents or game-optimized choices.
4. Mission & Progression Operations: five guided objectives with linked steps and user-initiated JSON exports.
5. ZevRo | Azeroth Assistant Intelligence 2.0: explicit evidence explanation; not a generative AI model, no automatic account read.
6. Responsive Sovereign UI, reduced-motion support, safe import preview, local downloads and request cancellation.
7. Updated Gateway, Player Handbook, Getting Started, Developer Test Requests, Device QA, CHANGELOG and release announcement draft.

## Privacy & preservation rules

- Existing `nexus_azeroth_*` storage keys and data formats are left unchanged.
- `Review My Local Plans` reads the selected browser's known manual records **only after a click**. It does not write them.
- A user-exported Sovereign JSON file is imported only as an isolated preview; imported public records are marked **not live verified**.
- Public Blizzard character API calls occur only after an explicit Load action. The tool does not request or reveal private access tokens.
- Live bags, bank and character currency balances are not available through this web API integration and cannot be inferred.
- Browser local data cannot be assumed to sync to another device. Players should use the existing Sovereign Data Vault.

## Automated / source checks

- Validate syntax of `sovereign-data-v8.js` and `sovereign-ascension-v8.js`.
- Simulate local characters, two Talent Forge records, local goals, and public equipment; verify source labels and saved record independence.
- Verify both rank difference directions, correct node IDs, specialization mismatches, invalid realm rejection, and imported-data trust downgrade.
- Check historical application bundles, account verification modules, founder/music launchers and assistant remain referenced in `index.html`.
- Run the existing `azeroth-companion/tests/validate.mjs` GitHub Actions pipeline for the complete repository where available. Manual inspection is not proof that CI executed or passed.

## Human acceptance gates (MUST PASS before stable)

- **Desktop:** 1024/1280/1920px wide; narrow desktop; keyboard nav; 125%-200% zoom; confirm Connected and assistant launcher do not overlap.
- **iPhone Safari:** Device viewport safe areas, scrolling, form input sizing, file export/import, music and assistant overlay.
- **Actual public WoW character:** Profile, equipment slot IDs/item level, errors and empty data; optional real Mythic+ raid reputation checks in Progression Intelligence.
- **Existing Blizzard authentication:** Private portal sign-in, Verify & Return, session expiry; no saved-data deletion.
- **Old saved plans:** Existing Talent Forge drafts/undo, Collection goals, Data Vault backup, imported snapshots and cross-browser limitations.
- **Trust labels:** Manual goal is not an unlock, imported profile is not live verified, unavailable public API response is not zero progress.
- **Guides and update information:** Gateway label, in-app version, Getting Started, Player Handbook, Device QA, Developer Test Requests and Release Center all consistent.

## Stable release & Discord announcement process

After tests are actually accepted:
1. Promote `version.json` channel from `staging` to `stable` and update its change notes.
2. Add a correct v8.0.0 entry to `releases/index.json`.
3. Create the official `releases/v8.0.0.json` manifest using the approved draft at `releases/drafts/v8.0.0.json`.
4. Only then let the existing GitHub Actions guarded Discord workflow act; confirm deployment and webhook delivery independently. Never announce a draft or claim a webhook send without verification.

## Rollback

The v7.9.9 base is preserved at:
`https://github.com/zevromxr-hub/nexus-application-gateway/tree/rollback/azeroth-v7.9.9-before-v8`

Do not force-reset or overwrite the current branch casually; use normal Git review and a tested restore procedure. Changes to the Cloudflare Worker are not involved in this v8 release.

POWERED BY ZEVRO | NEXUS
