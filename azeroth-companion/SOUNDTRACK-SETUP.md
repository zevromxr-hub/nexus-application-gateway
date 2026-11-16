# NEXUS | AZEROTH COMPANION — Site Welcome Soundtrack

## Owner setup (v7.7.2)

Azeroth Companion can use an optional **site-hosted welcome track** while preserving the original private music library. Only upload audio you own or are licensed to distribute publicly.

### Upload the MP3

1. Open your repository `zevromxr-hub/nexus-application-gateway`.
2. Navigate to `azeroth-companion/assets/`.
3. Select **Add file → Upload files**.
4. Upload an MP3 named exactly **`nexus-intro.mp3`** (lowercase). A modestly compressed MP3 is recommended for cellular users; aim for less than 10 MB.
5. Commit the file to the published branch.
6. Open the companion and allow the published files to refresh. The feature auto-detects the uploaded audio file.

The site reads the non-secret configuration `azeroth-companion/site-soundtrack.json`. To change the filename, edit that file's `file` value, keeping it under `./assets/`. Supported configured formats: MP3, M4A, OGG (MP3 is the best cross-browser choice). To disable the track without deleting it, set `enabled` to `false`.

**No GitHub access token belongs in the website.** Files are uploaded through your own repository management interface, never through public visitor-facing forms.

### Expected behavior

- **Desktop:** the existing `nxMusicAudio` element attempts to play the welcome track on page load if the browser allows audible autoplay. If the browser blocks autoplay, a **PLAY WELCOME THEME** shortcut appears next to the two existing desktop identity/music shortcuts. One click starts it.
- **iPhone / mobile:** the soundtrack does **not** attempt unmuted autoplay; users see **TAP TO PLAY WELCOME THEME** inside the main website header after the audio asset is available.
- The original **HYPER MUSIC** button still opens the existing private player. The hosted track also plays through that same player, including its pause/play and volume interface.
- Manual local track selection can replace the hosted introduction at any time. The hosted introduction doesn't write to IndexedDB, replace the private library or automatically clear music.
- If the file is not uploaded yet or cannot be found, the site does not display a broken welcome-music button.
- Audible autoplay is subject to browser policies. No website code can guarantee sound starts unprompted on every desktop/mobile browser.

### Later test checklist

- Verify the desktop HYPER MUSIC button is above the Founder bubble in the right corner, with no overlap.
- Verify both existing shortcuts remain in their top-of-site mobile layout.
- After uploading the track, verify desktop autoplay or one-click fallback.
- Verify mobile one-tap playback and existing private track playback, pause, next, close, saved playlists, and post-refresh behavior.
- Test a missing/misnamed MP3 and slow connectivity, as well as browser restrictions and local/mobile playback.
