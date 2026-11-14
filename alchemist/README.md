# PROXIMUS | ASSET ALCHEMIST v3.5.0
**ENTERTAINMENT OVERDRIVE — 18 active companion spaces · Shared scenes & Cinema Atmosphere Sync**

Official app: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## NEW IN v3.5.0 — ENTERTAINMENT OVERDRIVE FOUNDATION

**The five flagship systems are a staged roadmap, not five completed releases.** This release implements the shared Convergence scene foundation and Cinema Overdrive atmosphere upgrades. Existing Reactor IV, Arcade Chamber and Animation Forge continue to function now; the larger Sonic Dimension, Arcade Nexus, Infinite Realms and Creator Overdrive systems are planned for v3.5.1–v3.5.4.

### Unified entertainment hub
The Companion Center now displays a single responsive Entertainment Overdrive launch area. It opens existing Video Vault, Reactor IV, Arcade Chamber and Animation Forge without new top-level studios. Infinite Realms is clearly labeled planned, not playable in v3.5.0.

### Convergence scene settings
Five built-in scene colors, a color picker for up to 20 custom named scene presets, Auto/Efficiency/Overdrive quality controls and JSON export/import live in the Companion Center. Select a scene to apply its palette to Media Theater. Save a scene manifest in Project Hub → Collected Exports. Imported JSON contains only settings, not audio or video bytes. New settings use their own localStorage key and do not rewrite old profiles, token records, media or game scores.

### Cinema Overdrive / Atmosphere Sync
Open Video Vault and enable Atmosphere Sync next to the video player. A throttled tiny-canvas sampler calculates an average color from *locally playable* video frames and adds a background glow to the existing Video Vault and Media Theater stages. When video is paused, protected, unsupported, hidden or cross-origin, a static scene color remains available. This is not a DRM bypass, downloader or streaming-player integration. The original media and existing PiP/fullscreen/playback functions remain unchanged.

### Compatibility and roadmap
- PC/iPhone adaptive layout selector and 18 active companion spaces retained.
- Auto quality uses viewport and pointer properties; mobile Efficiency and enhanced Overdrive can be selected manually. Reduced-motion preference takes precedence.
- Nothing migrates, clears or duplicates saved IndexedDB videos. Browser storage is still device-local; export scene settings and keep your original media files elsewhere.
- v3.5.1 Sonic Dimension; v3.5.2 Arcade Nexus; v3.5.3 Infinite Realms; v3.5.4 Creator Overdrive; v3.5.5 convergence polish, each requiring independent implementation and validation.
- Existing GitHub Pages deployment, service-worker release cache, offline core, rollback history, and Discord release announcer are retained.

POWERED BY ZEVRO | PROXIMUS

---
# PROXIMUS | ASSET ALCHEMIST v3.4.0
**ADAPTIVE COMPANION — 18 active spaces · Entertainment, Media & Everyday Utility**

Official app: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## NEW IN v3.4.0 — ADAPTIVE COMPANION EDITION

The active application is now focused on **18 companion spaces**. Six additional production studios were retired at the user's request: Image Studio, Asset Packager, Production Lab, Asset Audit, Layer Forge and Motion Graphics. They no longer appear in desktop or iPhone navigation, dashboard search or startup initialization. The previous eight deprecated studios stay retired.

**Source cleanup:** Three unused source files (image-tools.js, pro-tools.js and creator-tools.js) were deleted from the live GitHub source tree after confirming the remaining active modules do not import them. The complete original source is still recoverable from the previous **v3.3.0 commit** (f7c5bb31120160b13c5b4bc53911d808441ac6a8), and previous release manifests are retained. No personal media, SQLite databases, localStorage, IndexedDB video stores, project snapshots or Token Foundry data were cleared or migrated.

**Shared asset exports preserved:** The Asset Packager standalone screen is retired, but the actual collected export engine remains enabled. All generated files, per-asset downloads, tags, portable ZIP exports, saved project snapshots and compatible studio handoffs are available under **Project Hub → Collected Exports**. The Exports button goes there directly. Old saved "pack" URLs or last-view settings automatically redirect to this section. Removing the production UI does **not** remove accumulated outputs.

### Intelligent iPhone and PC layout

New **Layout** control in the top toolbar:
- **Auto (default)** uses phone user-agent hints, viewport dimensions, coarse-pointer/hover capabilities and responsive CSS to choose the appropriate navigation mode. It recalculates on screen rotation and resize.
- **Desktop / PC** presents desktop navigation and hides the iPhone bottom dock, even in a narrow PC browser window. Small windows retain compact, scrollable nav and single-column content.
- **Mobile / iPhone** opens the touch-optimized bottom dock, searchable Studio Navigator and swipe-capable mobile experience, including when landscape orientation widens the screen.
- The preference is browser-local and included in the manual Sync Bridge / Recovery Center settings backups. The user can switch without losing the current open studio or local project data.
- Overflow fixes protect topbar action buttons, long filenames, media stages, forms, card grids and two-column studio interfaces from being cut off on small displays.

A phone or desktop can still have unusual display metrics (e.g., iPad Stage Manager, desktop mobile emulation). Manual overrides are available for these cases. Features that depend on browser APIs such as native video fullscreen or local media decoding continue to depend on iOS/Windows browser support, not the layout setting.

### Preserved

Animation Forge GIF engine, Video Vault saved movies and resume positions, Life Command routines and JSON/.ics export, Media Theater, Reactor IV, Master Visual Identity, Automation Lab, Arcade Chamber, Workflow Desk, Project Hub, encrypted Token Foundry, all remaining utilities and GitHub Pages deployment paths remain intact.

**Automatic release announcements** continue using the existing GitHub Actions encrypted Discord webhook secret. A new v3.4.0 changelog is used for the release embed after successful validation and actual website deployment.

POWERED BY ZEVRO | PROXIMUS


## New Studio 32 — Life Command

Life Command is a standalone, private organizer designed as the new flagship everyday-utility feature inside PROXIMUS.

Create **tasks, recurring routines, important dates, renewals and personal to-dos**. Manage each with custom category, priority, due date, private note and status. Repeating routines can run **daily, weekly or monthly**, with monthly day-of-month handling for leap years and shorter months. Daily habits track completion streaks. The board includes searches, category/kind filters, completed or overdue views, upcoming dates and a clear personal dashboard.

The Companion Center shows your upcoming entries and recent completion count, and the iPhone navigation dock opens Life Command directly. Changes save only in the current browser's localStorage (no uploads). Existing Sync Bridge/Recovery settings backups now include your Life Command records. You can also **share or save a JSON backup**, import/merge/replace another backup, and export dated records as an **.ics calendar** for calendar applications.

**Important:** Life Command does not send server notifications or guaranteed alarms when the website is closed. For real device alarms, import an .ics file into a calendar app and configure its native alerts. Clearing website data can remove local plans; export backups regularly.

## Animation Forge — cinematic GIF upgrades

- Four real output profiles: **Mobile** (compact), **Balanced**, **Smooth** (20 FPS) and **Cinematic** (24 FPS), plus fully manual controls.
- See your estimated frame count, uncompressed frame memory and clip playback duration before encoding.
- Set trim start/end from the source video's current playhead instead of entering timestamps manually.
- Optionally combine exactly identical frames while keeping their total timing.
- Open a saved Video Vault video directly in Animation Forge. The converter preselects a short clip starting from your playback position.
- Existing corrected GIF89a/LZW encoding, 120-frame maximum, native file export and iPhone sharing remain unchanged.

GIF visual smoothness still depends on the source framerate, codec and iPhone/browser decoder. High-quality output remains subject to memory constraints and silent GIF format limitations.

## Video Vault — private personal cinema upgrades

- Save named **scene bookmarks** at exact playback positions (up to 60 per video), reopen those moments in one tap and remove bookmarks individually.
- Change the display title of a saved video without altering its original filename/bytes.
- Set playback speed from 0.5× to 2×.
- Load a local **.vtt captions file** for the current playback session (session-only; subtitles are not permanently stored).
- Save the current video frame as a PNG.
- Transfer a stored video into Animation Forge for a quick GIF, without adding another permanent Vault copy.
- Export a searchable JSON catalog of saved video metadata and bookmarks. **This does not back up original video bytes.**
- Preserve existing favorites, collections, local IndexedDB videos, resume playback, storage controls and Media Theater handoff.

## Media Theater — repeat your favorite moments

- Back 10 seconds or forward 30 seconds using dedicated buttons.
- Mark an **A** start and **B** end point during a local song or video; replay only that interval until you clear the A/B loop or change tracks.
- Preserve playback controls, album visualization, audio-reactive features, Video Vault integration and native screenshots.

## Existing data, safety and platform compatibility

All 23 prior active spaces plus Life Command are preserved (24 focused spaces). The eight previously deprecated studios remain archived and are not reactivated. Token Foundry, Master Thumbnail Publisher, Reactor IV, the GitHub Pages application URL, Discord webhook secret, encrypted access codes and original application gateway are untouched.

Personal media/organizer records stay device- and browser-local. Back up anything important; PROXIMUS is not cloud synchronization or a background push service.

**Automatic Discord release announcements** remain enabled for successful new published main-branch versions as long as the encrypted GitHub Actions webhook secret is valid.

POWERED BY ZEVRO | PROXIMUS

---
## Previous release notes

## v3.2.1 — Discord Release Announcer
**COMPANION EDITION — 23 focused spaces · entertainment and usefulness · iPhone + PC**

Open: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## NEW IN v3.2.1 — AUTOMATED DISCORD RELEASE ANNOUNCER

PROXIMUS now includes a GitHub-hosted release notification system. GitHub Actions posts an official Discord embed only when the **Release Validation** workflow succeeds on the main branch and the actual application version has increased. The announcer waits until the matching version appears on the live GitHub Pages site before sending a post.

Each embed contains the release version, new features taken directly from the current alchemist release JSON, the PROXIMUS application link, release notes and the footer **POWERED BY ZEVRO | PROXIMUS**.

**One-time private setup:** In the repository, open **Settings → Secrets and variables → Actions → New repository secret**. Name the secret DISCORD_RELEASE_WEBHOOK and paste the Discord channel's webhook URL there. Do not put it in project source, commits, issues, workflow input boxes or a chat message. Regenerate any webhook that has been shared.

**Test or catch up after setup:** Open **Actions → PROXIMUS — Discord Release Announcer → Run workflow**, select send-current on branch main, and run it once. The default dry-run choice previews the formatted announcement without sending a message. This manual option is provided for first-time setup and recovering a missed post; using it repeatedly may post duplicates.

Without the encrypted secret, the action reports a configuration warning and sends **nothing**. The GitHub integration cannot configure the secret automatically, so the repository owner must complete the one-time step.

This automation does not require your home PC to remain running. It never reads personal Video Vault files, Token Foundry data or Discord bot credentials.


## Decluttered safely — eight retired studios

As requested, the following studios no longer appear in navigation, command search, home cards or mobile Studio Navigator, and they are no longer initialized on startup:

- Batch Forge
- Icon Foundry
- Sprite Atlas
- Texture Lab
- Color Lab
- Audio Forge
- Motion Lab
- 3D Inspector

These are *deprecated* from this release, not destructively deleted from the repository. Their JS source files remain present. The previous **v3.1.0 release** is preserved in Release Center, GitHub version history, and the offline fallback cache when previously installed. No IndexedDB databases, stored media, generated assets, theme settings, project library or Token Foundry vault records are deleted or migrated.

Old browser "last opened studio" settings automatically redirect to the Companion Center if the previous studio was retired. Old pinned entries are ignored without deleting other favorites.

## Upgraded Companion Center

Home is now organized around everyday life rather than a wall of 31 tools:
- Continue Watching shows your recent locally saved Video Vault titles and lets you resume with one tap.
- Saved video, in-progress and favorites counters.
- "Play something" from favorite/saved video selections; opens the real local Video Vault player.
- **12 personal HTTPS links** for websites, streaming destinations and helpful resources. These open the relevant websites in their own new tabs, not embedded or bypassed within PROXIMUS.
- **Pocket Notes**: a compact expandable personal scratchpad autosaved locally; export TXT through iPhone Share/Save or desktop download.
- Fast access to Media Theater, Reactor IV, Video Vault, mini games, Workflow Desk and Animation Forge.
- Category-based browse: Entertainment, Everyday usefulness, Creative tools, Manage & protect, or All. Search still searches all active spaces.
- All 23 focused spaces remain available, with no changes to their saved project data.

Shortcuts, Pocket Notes and auto-play-next preferences participate in the existing selective settings backups, while the full large videos remain in their original device-local Video Vault.

## Video Vault & Media Theater enhancements

- Skip **10 seconds backward** or **30 seconds forward**, while keeping resume positions.
- Optional **Automatically play next** in your current library view (it stops at the last item).
- A compact mini-player when you navigate away from a playing saved video.
- Open a selected saved video directly in **Media Theater** without duplicating its already-stored Blob.
- Starting playback in one entertainment player pauses the other to prevent two unrelated audio tracks playing together.
- Continue Watching on the Companion Center works from actual locally saved metadata; no video bytes are uploaded or sent to a remote server.

**Storage caution:** These videos live on this particular browser/device. Clearing website data or iOS reclaiming storage can remove them. Keep your original files in Files/Photos or your PC. There is no automatic cross-device video sync.

## Preserved

Version 3.1.0's Video Vault storage engine, mobile navigation, 15–24 FPS Animation Forge GIF support, all important creator tools, Sovereign Reactor IV, Visual Identity, Media Publisher, Project Hub, Workflow Desk, QR & Branding, Automation Lab, Recovery Center, and the encrypted Token Foundry are preserved.

The GitHub Pages URL and Discord launcher paths remain unchanged. The PWA app icon/name and service-worker fallback remain versioned in place. This release has no change to existing token/authentication or account behavior.

POWERED BY ZEVRO | PROXIMUS
