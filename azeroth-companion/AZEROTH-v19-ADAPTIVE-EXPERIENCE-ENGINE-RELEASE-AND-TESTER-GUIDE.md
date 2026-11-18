# NEXUS | AZEROTH COMPANION — v19.0.0
## ADAPTIVE EXPERIENCE ENGINE · SHARED PREMIUM VISUAL SYSTEM

Owner-approved additive release, 2026-11-17. Real phone hardware / linked WoW character / local Windows launcher validation pending.
Rollback: \`backup/azeroth-v18-2-before-adaptive-visual-v19-2026-11-17\`.

### This update intentionally implements ONLY the presentation/performance work
The user selected visual-engine idea #5. It does not introduce a shared player database, cloud synchronization, verified gameplay state or new utility studio. The existing app's data, navigation, auth, music player and other independent creative tools are retained.

### Compatible application surfaces
The shared visual controller is available in:
- PROXIMUS Sovereign Gateway (\`hub/index.html\`) — decorative star paint suspends when Quiet is active
- Asset Alchemist (\`alchemist/index.html\`) — visual controller is independent of the existing desktop/mobile layout override and local media
- Azeroth main companion — same shared presentation logic **bundled inside existing** \`performance-overdrive-v7.5.js\` / \`studio-art-direction-v9.2.css\`, preserving total startup asset request count
- Azeroth Command Center, Character Nexus, World Atlas, v17 Adventure Operations, Expedition Intelligence, Living Azeroth — references compact shared CSS/JS.

The main \`/index.html\`, Sonic Reactor launcher and Character Foundry launch gateway are **not modified**. Their Content Security Policy, optional custom protocol behavior and user gesture safeguards are intentionally preserved.

### Four presentation choices
- **AUTO**: Balanced on normal desktop screens; Quiet when a narrow touch viewport, Save-Data, or operating system Reduce Motion is detected
- **CINEMATIC**: richer decorative depth, optional composited hero light and restrained hover elevations on capable desktop browsers
- **BALANCED**: premium borders and visual hierarchy without extra atmosphere movement
- **QUIET**: low-shadow, low-transition presentation and suspension of gateway particle painting; readable content, existing interactions and media are maintained

Even if Cinematic is chosen, OS reduced-motion disables optional decorative animations. No automatic audio, video playback, modal popups, analytics, API calls or account changes are introduced. The visual mode menu is a standard keyboard-accessible \`details\` disclosure, includes visible status text, keyboard Escape, tap-outside to close and 40–45px touch-friendly controls.

Only new preference key: \`nexus_visual_presentation_v19\`, a single plain string restricted to \`auto|cinematic|balanced|quiet\`. This is not a personal-data store. All older keys remain and are unaffected.

### Performance boundaries
- Shared CSS and JS are each small and self-contained. No framework, font download, remote imagery or map tile dependencies.
- Main Azeroth's JS/CSS startup **request count does not change**; the shared engine is bundled into assets already being requested, with deliberate cache bust \`v=1900\`.
- The visual controller reacts to media query changes and the existing browser preference. No scroll/pointer-frame tracking, no background polling or changes to media buffering.
- Gateway particle code skips painting while Quiet is active; reduced-motion users never enter the existing particle loop.
- Non-visible illustrative gateway cards can use native \`content-visibility:auto\` where browsers support it. There are no claims of quantified real-device FPS, Core Web Vitals, memory savings or load timings without measurements.
- Product-specific colors remain: PROXIMUS violet, Azeroth gold/cyan, creator teal/violet.

### Acceptance and tester checklist
1. [ ] AUTO selects Balanced on desktop Chromium and Quiet on iPhone-like WebKit, respecting Reduce Motion.
2. [ ] Cinematic/Quiet controls are visible and usable by keyboard and touch; explicit choice persists across same-origin supported sites.
3. [ ] Small-screen menu opens without global horizontal overflow or hiding player controls.
4. [ ] Starting from synthetic local goals/Forge/character/routes and hub favorites, all original storage bytes remain unchanged after changing modes.
5. [ ] Existing local media player, account login, Talent Forge planner, Azeroth v18.2 field guide, v18.1 routes and v17 operations remain functional.
6. [ ] Asset Alchemist's existing PC/iPhone layout override still works; the visual engine does not replace it.
7. [ ] Main companion preserves exact original CSS and JS file-request counts.
8. [ ] Physical iPhone Home Screen/PWA, Windows bridge and connected Blizzard user tests remain **pending** until people actually run them.

Source: \`shared/nexus-experience-v19.js\` and \`.css\`. Main companion copies are checked for exact equality by \`visual-experience-v19.test.mjs\`. The browser audit runs synthetic desktop Chromium and iPhone-style WebKit.
