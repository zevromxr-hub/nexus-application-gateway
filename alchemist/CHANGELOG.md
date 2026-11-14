# PROXIMUS | ASSET ALCHEMIST — Change Releases

## v3.5.0 — Entertainment Overdrive: Convergence Foundation & Cinema Atmosphere Sync (2026-11-13)

- Created the unified Entertainment Overdrive launch hub within Companion Center; no new top-level studios or retired studio restoration.
- Released a shared versioned scene format, five built-in scenes, 20 custom-scene capacity, portable JSON backup/import and Project Hub manifest handoff.
- Added optional, responsive Cinema Atmosphere Sync to Video Vault and Media Theater, using throttled local-frame average color plus safe static fallback.
- Added adaptive rendering modes, reduced-motion handling, and quality presets designed for PC and iPhone browsers.
- Preserved the 18 active spaces, v3.4 UI behavior, saved personal media, Project Hub, Token Foundry, existing offline cache strategy, rollback manifests and GitHub-to-Discord release automation.
- **Staged, not yet implemented:** Sonic Dimension (v3.5.1), Arcade Nexus expansion (v3.5.2), Infinite Realms (v3.5.3), unified Creator Overdrive (v3.5.4), convergence completion (v3.5.5).

## v3.4.0 — Adaptive Companion: Device Intelligence & Studio Cleanup (2026-11-13)

### Six studios retired safely
- Removed Image Studio, Asset Packager, Production Lab, Asset Audit, Layer Forge and Motion Graphics from active navigation, dashboard search and app initialization.
- Confirmed no active feature imports the three legacy production modules; removed image-tools.js, pro-tools.js and creator-tools.js from the live GitHub source tree, with original code preserved in the v3.3.0 Git history.
- The prior eight studio deprecations remain unchanged, leaving 18 focused companion spaces.
- Existing personal projects, videos, browser collections and Token Foundry records are left untouched.

### Shared Collected Exports retained in Project Hub
- Relocated the collected ZIP export interface into expandable **Project Hub → Collected Exports**, keeping all saved output files, download controls, ZIP generation, tags and source routing.
- Redirected old Packager links/bookmarks to Project Hub with the exports panel expanded.
- Removed unused handoff destinations from Project Hub menus rather than navigating users to retired tools.

### Device-aware iPhone and PC presentation
- Added automatic detection based on viewport width, phone/touch capabilities and orientation changes; updates layout without reloading studio state.
- Added user-accessible Layout dropdown: Automatic, Desktop/PC, Mobile/iPhone; overrides remain in this browser's preferences.
- Desktop mode hides the iPhone bottom dock, including when the PC window is narrow. Mobile mode offers a touch-friendly dock and Studio Navigator even in landscape.
- Added cross-device CSS overflow safeguards for top navigation actions, panels, media, small screens, safe areas and inputs. Included layout preferences in Sync Bridge and Recovery backups.

### Preserved
- Video Vault, Animation Forge, Media Theater, Life Command, Reactor IV, project library, themes, existing local storage, secure Token Foundry, prior release history, the unchanged GitHub gateway and the Discord release announcer.


## v3.3.0 — Cinematic Life Command (2026-11-13)

### New flagship: Life Command (Studio 32)
- Private daily dashboard with tasks, habits, deadlines, categories, priorities, notes and recurring daily/weekly/monthly schedules.
- Habit streaks, completed/overdue filters, important-date calendar exports and portable JSON backup/import.
- Added iPhone dock and Companion Center daily-summary shortcuts. Synced through existing manual workspace settings backup, not external cloud storage.

### Animation Forge
- New Mobile, Balanced, Smooth and Cinematic GIF quality profiles; live frame-count/memory preflight.
- Playhead-selected start/end trim controls, optional exact duplicate-frame optimization and a Video Vault → GIF short-clip pipeline.

### Video Vault and Media Theater
- Scene timestamp bookmarks, local VTT subtitles, variable playback speed, display title editing, PNG snapshots, metadata catalog export.
- Video Vault clip handoff to Animation Forge, plus 10/30-second seek and A-B segment repeat inside Media Theater.

### Preserved
- All previous 23 active spaces, 8 archived inactive studios, browser-local video database, Token Foundry, original Discord announcement workflow and prior release records.


## v3.2.1 — Automated Discord Release Announcer (2026-11-13)

- Implemented a hosted GitHub Actions → Discord webhook workflow for future PROXIMUS releases.
- Releases are announced only following successful main-branch validation and a genuine version increment, after checking the published GitHub Pages version.
- Announcements use professional branded embeds with actual changelog highlights, release version, app link and release notes.
- Discord webhook URL must be saved as the encrypted repository secret DISCORD_RELEASE_WEBHOOK; no credentials are embedded in public files or logs.
- Added regression tests, a safe dry-run preview, and a manual Send current release option for first-time Discord setup and recovery.
- All existing Companion Edition features, 23 active studios, personal media and Token Foundry remain unchanged.


## v3.2.0 — Companion Edition: Entertainment & Everyday Utility (2026-11-13)

### Eight legacy production studios retired
- Removed Batch Forge, Icon Foundry, Sprite Atlas, Texture Lab, Color Lab, Audio Forge, Motion Lab and 3D Inspector from the active user interface and runtime initialization.
- Original source code and v3.1.0 rollback history retained. No user-created projects, saved video files, media, or Token Foundry records are deleted.
- Retired last-opened studio preferences safely redirect to Companion Center.

### New Companion Center
- Continue Watching shelf, saved video/favorite counts, entertainment-first studio categories and one-tap access to local Video Vault.
- Added private saved HTTPS shortcuts (up to 12), with safe link handling and simple deletion.
- Added locally autosaved Pocket Notes with TXT share/export and workspace-settings backup.
- Enhanced direct navigation to Media Theater, Reactor IV, Arcade Chamber, Workflow Desk and Animation Forge.

### Video Vault + Media Theater
- Added ±10/30-second seek controls, optional next-video playback and a compact cross-studio video mini-player.
- Added direct Video Vault → Media Theater playback handoff using stored media without duplicating large files.
- Added exclusive audio focus to pause one entertainment player when the other starts.

### Stability
- Kept the remaining 23 spaces, existing iPhone navigation, personal media and vault databases, previous release cache and full regression coverage.


## v3.1.0 — Cinematic Continuity & Video Vault (2026-11-13)

### New Studio 31 — Video Vault
- Added actual binary video storage on the current browser/device using IndexedDB, with separate lightweight video metadata and original Blob store.
- Added a locally saved library with search, favorites, collections, watch/resume positions, generated poster previews, playback, original file export and storage estimates.
- Added optional persistent-storage request and clear warnings that clearing website data or browser storage eviction can remove saved copies.
- Connected the existing Media Theater session queue, topbar and Command Center to Video Vault.
- Preserved browser-local privacy and excluded large video files from ordinary small workspace sync ZIP exports.

### Smoother GIF output
- Added 15, 20 and 24 FPS options (120-frame upper bound) to Animation Forge.
- Added centisecond-accurate distributed per-frame delay durations for better pacing.
- Added best-effort video frame presentation synchronization after seeking on supported browsers.
- Added optional MOV/M4V source support with device-dependent codec decoding.

### Mobile studio navigation
- Added an iPhone-friendly bottom dock, recent-history Back/Forward, searchable studio drawer and saved favorite pins.
- Added safe-area and touch-friendly layouts with careful left-edge back gesture and desktop navigation unchanged.


## v3.0.2 — GIF Playback & Standards Compliance Patch (2026-11-13)

- Fixed GIF exports that appeared blank, truncated or corrupted in standard image viewers.
- Corrected the GIF89a LZW encoder's dictionary width transition to match independently verified native GIF decoding.
- Updated the Safari fallback reader to decode standard-compliant LZW streams.
- Added independent Pillow-verified GIF binary fixture with exact output hash, nonempty pixel and animated-frame tests across common resolutions and transparency.
- Preserved v3.0.1 dimension metadata fix, all 30 studios, Token Foundry and other application features.


## v3.0.1 — Animation Forge GIF Frame Precision Patch (2026-11-13)

- Fixed false "Frame sizes do not match GIF dimensions" errors when creating regular GIFs from MP4/WebM.
- Explicitly preserved the decoded ImageData pixel buffer, width, height and frame timing before GIF89a encoding.
- Applied the same correction to GIF resize and animated icon conversion.
- Added repeatable regression tests for browser-style ImageData objects with prototype getters, automatic sizing, independent custom width/height, and actual GIF89a encoding.
- Preserved the existing 30 studios, Token Foundry, Master Visual Identity, Sovereign Reactor IV and cross-device workflows.


## v3.0.0 — Omniverse Identity & Reactor IV (2026-11-13)

### New Studio 30 — Master Visual Identity
- Added six original global interface palettes, live six-channel color editing, glow, scaling, geometry and motion options.
- Added optional day/night automatic appearance switching and per-studio appearance exceptions.
- Integrated existing Master Thumbnail GIF/video visibility and Media Publisher controls into a unified identity dashboard.
- Added optional live color linkage with Sovereign Reactor IV.
- Added named visual identity profiles and portable JSON import/export; expanded Sync Bridge and Recovery Center preference backups.

### Sovereign Reactor IV
- Added five effect preset compositions and independent frequency-to-effect routing for sub, bass, mids and treble.
- Added original real-bass shockwaves, midrange emissive wings and treble sparkle effects.
- Added secondary media masks: halo, wings, equalizer bars and eclipse iris.
- Added four custom scene slots, real kick-triggered switching and flash/fade/sweep transitions.
- Added true detected-beat markers to audio history and portable effect settings import/export.
- Preserved preexisting Reactor audio inputs, animated backgrounds and creative exports.


## v2.9.0 — Sovereign Workspace & Media Dominion (2026-11-13)

### Media Publisher — Master Thumbnail Engine
- Added a global Master Thumbnail setting for applying one GIF/MP4/WebM across all studio thumbnail positions, the home hero and Command Center cards.
- Added master-first and individual-thumbnail-first priority modes, saved fit settings and adaptive live/poster video playback for PC and iPhone.
- Added direct Master Thumbnail media handoff from Media Theater, Project Hub and Asset Packager.

### New studio 28 — Sovereign Command Center
- Added a customizable live dashboard with searchable studio cards, animated thumbnail support, favorites, recent asset activity, quick navigation and interface layout preferences.

### New studio 29 — Sync Bridge
- Added a complete portable workspace ZIP with saved projects, real media files, Master Thumbnail settings, Reactor layers, collected assets and personal preferences.
- Added import preview, selective export, merge-or-replace restore and iPhone/PC Save/Share workflows.

### Sovereign Reactor III
- Added a second independent animated media layer with configurable opacity and blending.
- Added timed Scene Director, rolling bass/mid/treble history and adaptive low-power rendering.

### Recovery & Release Guard
- Added online release-file checks, a local-cache inspection, exportable diagnostic reports and saved-build fallback controls.
- Added offline cache retention of the latest and preceding app releases for safer updates.


## v2.8.0 — Token Foundry & Owner Vault Edition (2026-11-13)

### New studio 27: Token Foundry
- Added live cryptographically secure token generation with editable prefixes, token types and 128/192/256-bit random codes.
- Added encrypted owner vault setup, unlock and on-device inventory management with AES-256-GCM encryption.
- Added token labels, product assignments, recipient notes, expiration dates and redemption limits.
- Added masked inventory previews, search, status filters and owner activity records.
- Added local code validation, redemption recording, individual and bulk disabling and revocation.
- Added encrypted JSON vault backups, CSV owner inventories, TXT code lists and new-batch exports.
- Added direct encrypted vault restore to transfer a token collection between iPhone and PC.
- Added a search-engine noindex preference for the PROXIMUS application page.


## v2.7.0 — Sovereign Reactor Finale (2026-11-13)

### New studio 26: Sovereign Reactor
- Added a dedicated audio-reactive entertainment studio for PC and iPhone, powered by real Web Audio frequency analysis.
- Added local audio playback, microphone listening and optional permissioned desktop tab-audio capture.
- Added five cosmic visual themes and six original Reactor visualization styles.
- Added bass/kick impact detection, beat-driven color shifting, adjustable sensitivity and particle effects.
- Added custom GIF, MP4, WebM and still-image visualizer backgrounds with local saving and placement controls.
- Added full-screen Cinema Mode, three rendering-quality profiles, stardust/snow and editable on-stage signature.
- Added full-resolution PNG artwork export, true animated GIF loop export and device share/save actions.
- Added short silent visualizer video recording with local playback controls and Asset Packager exports.
- Added persistent style presets with JSON import/export and project handoff.
- Linked Media Theater and Asset Packager to the new Reactor for direct audio and background transfers.


## v2.6.0 — Sovereign Utility Engine (2026-11-13)

### New studios
- **Project Hub (20):** Saved project snapshots, portable asset ZIP import/export, favorite studio dashboard and cross-studio handoff.
- **Automation Lab (21):** Batch creative workflows, creator export presets, saved recipes and image/icon ZIP generation.
- **Capture Studio (22):** Camera and photo import, color/contrast controls, crop-fit, rotation, watermarks and mobile sharing.
- **Document Forge (23):** Multi-photo PDF generation, page ordering, print layouts and optional footer.
- **QR & Branding (24):** Locally generated QR codes, SVG/PNG exports and branded QR cards.
- **Recovery Center (25):** Local storage diagnostics, preferences backup/restore, cache controls and update access.

### Enhanced workspaces
- Added iPhone GIF share/save, direct GIF previews, actual PNG frame extraction ZIPs, reverse/speed control and animated caption overlays to Animation Forge.
- Added search, labels and direct send-to-studio asset routing to Asset Packager.
- Added Media Theater mini-player, saved favorites and two more visualizers.
- Added Arcade Chamber player profiles, themes and unlockable achievements.
- Added unified cross-device project packages with the same original GitHub Pages/Discord link and release update system.

## v2.5.0 — Creator & Productivity Expansion (2026-11-13)
- Added Release Center with searchable release records, newest-first changes and GitHub source links.
- Added Creator Story covering the developer's journey, goals and projects.
- Added Workflow Desk notes, checklist, focus timer and portable backups.
- Added Utility Forge for text/JSON transformation, secure strings and batch renaming.

## v2.4.0 — Entertainment Expansion (2026-11-12)
- Added Media Theater with local music/video/GIF playlists, cinema controls and live visualizers.
- Added Arcade Chamber with Comet Catch, Pulse Reflex and Memory Matrix.
- Added local best scores, arcade exports and Media Theater artwork exports.

## v2.3.0 — Media Fusion Edition (2026-11-12)
- Added distinct regular GIF and animated icon workflows with flexible sizing.
- Added animated GIF/MP4/WebM backgrounds and thumbnails with browser-local media settings.
- Added browser-local GIF decoding and direct media handoff between studios.

## v2.2.0 — Motion & GIF Dominion Edition (2026-11-12)
- Added Animation Forge and genuine GIF89a encoding from MP4, WebM and GIF inputs.
- Added animated icon packs, PNG alternatives and Icon Foundry GIF support.

## v2.1.0 — Dominion Workflow Edition (2026-11-12)
- Added Layer Forge, Motion Graphics and reusable creative project exports.

## v2.0.0 — Supreme Creator Edition (2026-11-12)
- Added Production Lab, Asset Audit, persistent Asset Packager and release checking.

## v1.0.0 — Genesis Edition
- Introduced the original ten creative studios and browser-based Asset Alchemist workspace.
