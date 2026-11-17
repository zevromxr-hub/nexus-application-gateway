# NEXUS | AZEROTH — Browser & Device Acceptance Checklist
Release focus: **v9.0.0 Living Azeroth Cinematic Experience (staging; v7.9.4 Blizzard data pending real-player tests)**

## New required v9.0 acceptance
1. Load the original companion homepage and new Living Azeroth five-chamber entrance on desktop Chromium, mobile WebKit and physical iPhone Safari where available. Verify the premium local WebP art loads (no geometric castle fallback), the five portals present full illustrations rather than symbol-only tiles, readable contrast, functional destination links, and no horizontal scrolling.
2. Choose Cinematic, Balanced and Performance modes; confirm only the new visual preference key is written, and OS Reduced Motion disables drifting particles.
3. Open original Talent Forge and allocate/undo ranks. Selected node glow and read-only inspector must reflect the existing node ID and rank, never modify the rank directly.
4. Load Character Intelligence with an actual public Retail character. The visual equipment ring must show only returned equipped slots and link to real item research. Simulate an unavailable response and verify no fabricated entries appear.
5. Use Adventure Journal illustrated Mythic+, raids and reputations chapters; confirm original tabs, errors, export and missing-data disclaimers remain intact.
6. Use Oracle full page and mini panel from original companion, ask documented and unsupported questions, and test assistive technology and keyboard navigation.
7. Verify original Connected header remains clickable, Founder and HYPER MUSIC bubbles are clear of overlays, and original local data survives refresh.
8. Check pages, Gateway, handbook, developer checklist, release history and Discord draft all say v9.0 staging. Do not send stable announcement without accepted browser and real-character tests.

## Previous required v8.0 acceptance
1. Open Sovereign Ascension on desktop at 1024, 1280 and 1920px and on physical iPhone Safari if available; inspect overflow, safe areas, controls and readable text.
2. Verify Read My Local Plans is opt-in and does not mutate legacy storage; load known manual characters, talents, collections and goals and compare displayed counts.
3. Compare two saved Talent Forge builds with known allocated node IDs; verify point totals, specialization mismatches and export behavior.
4. Test public Blizzard profile/equipment lookup using real authorized public character data; validate timestamps and source badges. Cancel midway and check errors are non-destructive.
5. Verify mission generation across five goals and assistant explanation for loaded, empty, and partial source snapshots, including JSON export/import preview.
6. Revisit Connected, Hyper Music, Founder and mobile assistant launcher and confirm they remain accessible and non-overlapping.
7. Ensure existing local drafts, saved items, backup restore workflows and Blizzard account verification still work.
8. Confirm release metadata, guides, Gateway and Discord draft agree on 8.0.0 staging. Do not announce stable until these checks pass.

## Previous required v7.9.9 acceptance
1. Check the Connected button/status on desktop at 1024, 1280 and 1920px widths; the assistant launcher now sits in its own row below the Connected header; verify that neither control overlaps or blocks clicks. Test at 125% and 200% browser zoom.
2. Confirm assistant avatar is still distinct from lower-right Founder and HYPER MUSIC controls and fits common viewport heights without obscuring essential controls.
3. In the full assistant, generate each of the six Mission Architect action plans; verify 24 total instructions and first-party links are accurate and actionable.
4. In the mini assistant, verify Mission Architect scrolls, generates plans and opens studio links separately without trapping the user or unexpectedly navigating the main companion.
5. Copy plan text and export JSON; confirm no OAuth credentials, account cookies, stored player builds or personal identifiers are embedded by default.
6. Check mobile Safari (real device if available) and responsive browser simulations for header assistant positioning, popup sizing, scrolling and available touch controls.
7. Close and reopen assistant, refresh site, verify no change to Battle.net verification, local Talent Forge drafts, the Founder bubble, music and active progression reports.
8. Check Getting Started, Handbook, developer checklist, Release Center, Gateway and Discord preview for version 7.9.9. Official stable announcement remains gated on real-player regression tests.

## Previous required v7.9.8 acceptance
1. On desktop, verify the assistant avatar is in the upper-right corner with its own distinctive image and label, away from lower-right Founder and Hyper Music.
2. Click the avatar, ask a question in the mini panel, select an answer link, then close via × or Escape; keyboard focus should return to the launcher.
3. Switch among Overview, Build Architect and other supported sections, then reopen the avatar; suggested questions should reflect the current section when documented.
4. On iPhone Safari and mobile viewport simulations, verify the launcher sits in normal site header flow and does not cover the music player, Founder shortcut or other inputs.
5. Open and close the mobile bottom panel, use its Full Page link, check scrolling and orientation changes, and confirm it fits the device safe area.
6. Confirm the standalone assistant still works, the old sidebar link is removed, and no local plans, account sessions or auth tokens are changed.
7. Verify all 27 documented assistant topics, unsupported answer fallback, and direct navigation links.
8. Repeat prior required Mythic+, raids, reputations, combined reports and Battle.net regression tests before stable Discord announcement.

## Previous required v7.9.7 acceptance
1. On PC and iPhone-sized browsers, open ZevRo | Azeroth Assistant and confirm its input, send button and topic chips are visible and usable.
2. Ask about talent builds, account verification, Mythic+, raid encounters, reputation and inventory limits; verify accurate documented answers with relevant studio links.
3. Select New Questions and a topic filter; confirm suggestions are derived from the local curated answer library.
4. Ask an unsupported or patch-specific gameplay question. The assistant must clearly admit no reliable curated answer instead of guessing.
5. Verify submitting a question does not send data to a generative AI server, Blizzard, Discord or any new backend endpoint. Only the static documented answer library should be fetched.
6. Select Clear Conversation, then confirm Talent Forge drafts, saved goals and Battle.net verification remain untouched.
7. Test keyboard use, screen-reader status text, long questions and mobile viewport overflow.
8. Check current version, Gateway, Player Handbook, Getting Started, Developer Test Requests and release center against v7.9.7 staging.

## Previous required v7.9.6 acceptance
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
