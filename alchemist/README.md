# PROXIMUS | ASSET ALCHEMIST v3.2.0
**COMPANION EDITION — 23 focused spaces · entertainment and usefulness · iPhone + PC**

Open: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

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
