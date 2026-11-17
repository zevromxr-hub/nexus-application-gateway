# NEXUS | AZEROTH — Browser & Device Acceptance Checklist
Release focus: **v7.9.6 Character Progress Report (staging; v7.9.4 Blizzard data pending real-player tests)**

## New required v7.9.6 acceptance
1. With a public Retail character, run Build Character Progress Report and confirm Mythic+, raids and reputations are requested sequentially, not in a burst.
2. Check that a single API error does not destroy successful categories and that missing fields are not presented as confirmed zero progress.
3. Verify Copy Summary provides only public character research, and Export Combined JSON produces a readable snapshot.
4. Cancel a report in flight and ensure the page stays usable, cancellation is represented accurately, and a subsequent report is possible.
5. Test PC and mobile layouts including the combined-report controls, scroll and button overlap, without modifying existing saved plans.
6. Confirm individual Mythic+, Raid and Reputation tabs continue functioning.
7. Retain volunteer checks for real Blizzard API data and Battle.net session regressions before stable Discord announcement.

## Previous required v7.9.5 acceptance
1. From Character Intelligence, enter a valid public character and choose Mythic+, Raids, or Reputations. Confirm all three carry the correct region, realm slug, and character name and select the requested progression tab without triggering an automatic API fetch.
2. From Progression Intelligence, use Compare This Character; confirm Character A is prefilled and Character B remains optional, with no automatic Blizzard lookup.
3. Use Copy Research Link and inspect it: only public region, realm, character, and optional selected tab may appear. No cookies, passwords, Blizzard access token, or session proof.
4. Try malformed/empty character inputs and confirm the shortcuts show an error rather than navigating to an invalid URL.
5. Verify on both desktop and phone viewport sizes. No controls should clip or cover form submission buttons.
6. Reload the companion and confirm prior local Talent Forge drafts, item goals and backups are unaffected. Do not delete browser storage.
7. Verify v7.9.4 Mythic+, raid, and reputation API responses against a real player's visible character data when available; these results are **not yet confirmed**.
8. Open Player Handbook, Getting Started, Developer Test Requests, public Release Center and Gateway; confirm consistent v7.9.5 staging language. Official Discord announcement must remain gated until tests are complete.

**Testing limitations:** Syntax and source consistency are not equivalent to real WoW account tests. Desktop/mobile simulations cannot certify physical Safari compatibility or live Blizzard data. All checks remain voluntary and should use the in-site Developer Test Requests report without sharing sensitive account information.

Earlier baseline: **v4.6 Device Reliability** (website shell)

## Automated coverage
The GitHub Actions workflow `azeroth-device-audit.yml` loads a locally served
copy of Azeroth in desktop Chromium and phone-sized Chromium / WebKit. It checks
the home shell, responsive horizontal overflow, JavaScript exceptions, Quick Deck
keyboard focus and persistence, appearance settings, update center, tour,
All Tools search, navigation and phone-to-desktop resizing. **Live Cloudflare
API requests are stubbed as unavailable during localhost tests**, since the
Worker rightly restricts requests from unapproved browser origins. The test
never invents character information, account sessions or successful API calls.

This is **not a physical iPhone Safari test**, a Lighthouse performance score,
a private Battle.net test, or proof that Blizzard endpoints are available.

## Manual test — iPhone Safari
1. Open the live Azeroth URL and refresh to the current version.
2. On Home, swipe to the bottom: no horizontal scrolling, clipped buttons,
   overlapping floating bars or clipped safe-area controls.
3. Open All Tools; search `Atlas`. Clear the search and find Character
   Dominion. Close and reopen All Tools; verify everything is visible again.
4. Customize My Quick Deck. Add/remove a shortcut, select Done, refresh,
   and confirm your choice persists. Verify the checkbox editor is usable.
5. Try the website tour and dismiss it using the × button. Start it again
   from the header question-mark button.
6. Open the appearance settings, change accent and background intensity,
   refresh, and confirm preferences remain saved.
7. Open Update Center; compare the displayed version with
   `azeroth-companion/version.json`.
8. Open Character Dominion or any other existing studio, use Return Home,
   and confirm your local planning data is still present.
9. Turn airplane mode on. The offline notice should appear; turn it off
   and confirm it clears. An online indicator is not an API-health promise.

## Manual test — desktop
1. Repeat the main checks at narrow (1024px) and wide (1440px+) windows.
2. Collapse a sidebar category, navigate by Command Launcher, then return.
3. Resize from narrow/mobile drawer layout to desktop while mobile search
   is active; no desktop sidebar tools should remain hidden.
4. Use keyboard Tab/Shift+Tab through appearance dialog and tour;
   Escape should close the dialog and restore focus.
5. Check that visual-effects-reduced OS settings remove unnecessary motion.

## Safety checks
- Do not share Blizzard session tokens, cookies, account IDs or screenshots
  containing sensitive account details in bug reports.
- Back up local planning records with Sovereign Data Vault before experimenting
  with browser clearing, switching devices, or data imports.
- The Cloudflare Worker is a separate deployment. This release does not modify it.
- Existing studios and planning storage keys must remain unchanged.

## Reporting a problem
Use Player Field Lab to record the affected device/browser, short reproduction
steps, expected outcome, actual outcome, and the current Azeroth version.
Do not include Blizzard credentials or private account data. Player Field Lab
reports are not sent to Discord automatically.

Powered by ZevRo Development | NEXUS
