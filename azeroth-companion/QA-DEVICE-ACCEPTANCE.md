# NEXUS | AZEROTH — Browser & Device Acceptance Checklist
Release focus: **v4.6 Device Reliability** (website shell, no studio changes)

## Automated coverage
The GitHub Actions workflow `azeroth-device-audit.yml` loads a locally served
copy of Azeroth in desktop Chromium and phone-sized Chromium / WebKit. It checks
the home shell, responsive horizontal overflow, JavaScript exceptions, Quick Deck
keyboard focus and persistence, appearance settings, update center, tour,
All Tools search, navigation and phone-to-desktop resizing.

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
