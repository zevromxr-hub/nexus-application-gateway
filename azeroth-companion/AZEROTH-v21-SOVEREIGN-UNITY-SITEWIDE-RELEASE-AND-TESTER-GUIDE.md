# NEXUS | AZEROTH COMPANION — v21.0.0 SOVEREIGN UNITY
## ALL-STUDIO EXPERIENCE, MOBILE ACCESS, WORKFLOW INTELLIGENCE & PRESERVATION

Owner-approved release: November 18, 2026. Real-device and live WoW player acceptance remain pending.
Primary: https://zevarchives.com/azeroth-companion/command-center.html
Rollback: backup/azeroth-v20-1-before-sovereign-unity-v21-2026-11-18

### Product value
Azeroth already contains functional studios: Talent Forge, World Atlas, Character Nexus, Armory, Adventure Operations, Oracle, Private Video Vault, Save Protection and others. V21 makes these discoverable as one product. This is an additive information architecture, premium visual and performance release—not a claim that WoW gameplay or private account information is now verified live.

### NEXUS COMMAND
- A compact NEXUS COMMAND launcher appears on each of the 21 Azeroth web pages, including guides and the Private Vault.
- Search 19 real studio destinations, grouped by Command, Character, Adventure, Personal, Explore and NEXUS. Links into the full companion use existing ?enter=1&view= routing.
- Search can also locate titles of manually saved Atlas goals and open curated zone research. Search never makes an external request.
- Pin up to six favorite studios. The eight Recent destinations contain only public studio IDs, not personal data.
- Follow four practical three-step paths: Prepare an Adventure, Build Your Character, Plan a Collection, Organize Your Media.
- Personal continuity shows only browser-local source-labeled counts of characters, builds, routes and manual missions, plus a Resume Research link. It never queries login tokens, inspects gold, claims in-game gear ownership or invents quest completion.
- The Command Center adds a visual four-path bridge reusing local original artwork and source-backed manual goal counts; the main companion has a small Unity launch strip.

### Mobile and keyboard support
- On iPhone, tap the small bottom-left launcher. A full-height responsive command dialog with internal scrolling avoids a permanent navigation bar.
- Escape closes the dialog. On pages other than Command Center, Ctrl+K (PC) or Command+K (Mac) opens NEXUS COMMAND; the Command Center's own native shortcut is preserved.
- Accessible focus, touch targets and reduced-motion behavior are designed for desktop and iPhone. V19 Auto/Cinematic/Balanced/Quiet remains separate.

### Performance, data and security
- First-party sources are nexus-unity-v21-core.js (pure bounded directory/search), nexus-unity-v21.js (UI), and scoped nexus-unity-v21.css. No external library, font, map tiles, analytics, tracking or network calls.
- On the full Azeroth main page, exact v21 sources are bundled before the existing v19 engine inside the already-loaded performance and art assets. **No additional main-page JS/CSS requests** are introduced; versioned URLs invalidate stale assets.
- Indexing is on demand, using bounded JSON reads and source change events; no continuous animation loop, browser polling or large new image assets.
- New optional key nexus_azeroth_unity_v21 contains only a format marker, pinned studio IDs and recent studio IDs, validated against the 19 known destinations.
- Private Video Vault is a special scope: Unity does not read other saved records or Unity preferences while on the Vault page. Its password, IndexedDB AES encryption, local password reset, no-network CSP and separate encrypted backups remain untouched.
- Existing Battle.net authorization, verification, Cloudflare Worker/backend code, saved profiles/builds/routes/goals, music and other studios are unchanged. No data migration or permission changes.
- PWA start_url and scope are unchanged; webmanifest offers four optional supported shortcuts to Command Center, Atlas, Character Nexus and the Private Vault.

### Owner / tester acceptance checklist
1. Confirm the Command Center's four-path visual bridge and full original navigation/chambers remain available.
2. Search Talent Forge, World Atlas, Private Video Vault and a manually saved Atlas goal in Unity. Confirm source labels say manual/local, not verified gameplay.
3. Pin World Atlas, navigate/reload and verify pinned and recent studio IDs persist, without storing quest titles or player details.
4. Try all four Guided Journeys and confirm every link points to an existing real studio.
5. Open the main companion ?enter=1; verify original Talent Forge and all other screens work and Unity adds zero CSS/JS network requests.
6. On real iPhone Safari and installed Home Screen mode: open/close full-height Unity, check safe-area position, no horizontal overflow and no overlap with critical buttons.
7. Ctrl+K opens Unity on Atlas but still activates the existing native palette on Command Center. Escape closes active dialog.
8. On Private Vault, confirm Unity navigation never reads encrypted video contents or account information. Test Vault encryption/reset separately per v20.1 guide.
9. Confirm Save Protection export still works and never includes private Vault ciphertext or key material.
10. Verify installed-app shortcuts where supported, deployed GitHub Pages version and Discord release delivery. Real accounts/devices remain pending.

Automated browser checks use only synthetic local test records. Never claim they establish real game account ownership or official map coordinates.