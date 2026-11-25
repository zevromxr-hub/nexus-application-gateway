## v4.0.0 — Immersive Dominion release checklist

- [ ] On iPhone Home Screen and desktop browser, open PROXIMUS Home → Customize My Realm and choose all five scenes. Check global header, studio navigation, premiere poster, cinema cards and details.
- [ ] Change atmosphere intensity, glass readability and background visibility. Confirm your uploaded GIF/video/image background stays selected and visible, with text remaining legible.
- [ ] Choose Adaptive animation on iPhone and confirm continuous decorative motion is disabled; turn off animations and check reduced-motion settings. Video playback and personal animated assets must not be reset.
- [ ] Reload the installed app; confirm your personal scene choice persists in local settings.
- [ ] In Living Cinema, choose a real locally saved movie, tap Save for Later and open My Watchlist. Toggle Watchlist Only, refresh, and confirm the selection persists without changing original video bytes.
- [ ] Tap Surprise Me with multiple saved movies and verify real movie details open without autoplay. If library empty, verify useful import guidance.
- [ ] Open Check Library Health and verify accurate movie counts plus conditional browser storage/quota information. Request persistence only if supported; confirm no videos are modified or removed.
- [ ] Check existing high-quality posters, GIF/video covers, Home Screen icon controls, Media Publisher settings, bookmarks, subtitles, picture-in-picture and 18 studios.
- [ ] Test narrow iPhone portrait/landscape and desktop panels, with no horizontal overflow or obscured buttons.
- [ ] Keep your existing Home Screen app installed; uninstalling or clearing website data can delete isolated local videos. This release has no migration requiring reinstalls.

Automated browser suites cover emulated iPhone WebKit and desktop Chromium, not a physical device. Personal user videos never enter CI.

## v3.9.0 — Living Cinema iPhone / PC acceptance

- [ ] Keep the current Home Screen app installed. Open PROXIMUS Home → Explore My Cinema; confirm the new Discovery shelves load real previously saved videos, with no placeholder movies.
- [ ] For an empty Vault, verify that Add Movies opens the original local import picker and the normal large-file / Play from Files options still work.
- [ ] With multiple saved videos, verify Continue Watching, Favorites, Recently Added and your own Collections, with accessible horizontal scrolling on iPhone and mouse/touch on PC.
- [ ] Search by movie name and collection; select a cover to open its real details. Tap Play to launch the original movie player, including saved resume position.
- [ ] In Movie Details, star a test movie and change its Collection. Refresh the app and confirm these settings persist without affecting the original video file.
- [ ] Use Sovereign Cinema toolbar to Play/Pause, skip ±10s, scrub, enter Cinema Focus and full screen; attempt PiP only if the device/browser supports it.
- [ ] Open Poster Forge for a saved movie. Import PNG/JPEG/WebP or a GIF still, change framing/zoom and optional title color, export JPEG and save the poster.
- [ ] With that same saved video already playing, capture its current video frame. With a different video or unsaved Files preview active, verify capture is blocked rather than being attached to the wrong movie.
- [ ] On returning to the homepage, the feature and poster gallery should use the new saved art. Existing original animated covers should remain available and unchanged in Video Vault.
- [ ] Verify iPhone landscape/portrait, touch controls, captions, video audio, native fullscreen and focus behavior. Check user-selected background visibility, reduced-motion and power guard.
- [ ] Verify all 18 studios, version v3.9.0, previous cached rollback versions and all existing media/backups are still available.

**Important:** Browser/WebKit emulation is not equivalent to a physical iPhone test. Do not uninstall your current installed web app merely to update its icon. Safari and standalone-app local storage may be isolated.

## v3.8.0 — Cinematic Dominion iPhone & PC acceptance

- [ ] On an existing installed PROXIMUS Home Screen app, open without uninstalling. Confirm the new cinematic premiere is visible in Command Center and the underlying saved local videos still appear in Video Vault.
- [ ] If Video Vault is empty, verify the premiere provides an Open Video Vault action and visually useful links to personal artwork and Sonic Theater; no fake demo movies appear.
- [ ] Import one local video and create a poster, then return Home: the saved title should appear as the feature with the same playback history.
- [ ] Save a personal GIF/MP4 video cover to that movie. Return Home and confirm the feature uses its high-quality still where available, without automatically playing the original animated cover.
- [ ] Populate multiple videos: shuffle the spotlight, use a mini poster in the gallery to launch a real video, and verify the existing player can pause/resume and retains playback progress.
- [ ] Toggle Cinematic atmosphere off/on, refresh and verify the same preference remains. Reduced Motion should prevent decorative movement while preserving controls.
- [ ] Check iPhone narrow layout, native Home Screen dock, safe-area controls, album covers, backdrop brightness and no sideways clipping. Check desktop rail layout at normal and narrow browser widths.
- [ ] Move between Video Vault, Sonic Theater, Animation Forge and Command Center; ensure large introduction collapses away from Home and existing tools stay accessible.
- [ ] Confirm personal media, collections, bookmarks, custom icon crop, current Home Screen icon, original photos/videos and backups are not modified.
- [ ] Verify v3.8.0 release label, v3.7.1 cached rollback availability where retained, and no orphaned cover cleanup regression.
- [ ] Report actual iPhone/Safari hardware issues separately from automated emulated WebKit/Chromium checks.

**Storage safety:** Existing installed Home Screen data can be isolated from Safari. Do not delete the installed app merely to refresh the icon; keep original media copies in Files/Photos.

## v3.7.1 — Artwork Integrity & Sovereign Polish iPhone/PC acceptance

- [ ] Open installed PROXIMUS on iPhone **without deleting it**; confirm v3.7.1 loads and original videos, favorites, resume positions and collections still work.
- [ ] On Video Vault, scroll through several customized GIF and short MP4 covers. Verify art appears as cards enter view and muted video previews pause when leaving the view or opening another studio.
- [ ] Return to a previously viewed thumbnail: its original cover should appear again after any memory-release while keeping all original movie data.
- [ ] Delete a test video only after exporting or verifying a separate original. Confirm its matching custom artwork is cleaned without affecting another video's artwork or any other saved video.
- [ ] Try **Clean unused art**. Confirm it requires approval, reports the count, and never deletes original movies. Canceling must leave the unused artwork unchanged.
- [ ] Export a personal Media Publisher backup and verify it restores safely. A failed replacement import must leave previous saved background/thumb records unchanged.
- [ ] Choose a personal GIF/video background and attempt Save/Remove in Media. Confirm the background stays visible if browser storage rejects deletion; successful deletion removes only the selected media slot.
- [ ] Confirm Animation Forge, Video Vault, Life Command and later studios all stay within the main application layout after navigating from Command Center on PC and iPhone.
- [ ] On desktop, use wide browser windows and Video Vault collections; delete a disposable test video and confirm card actions never slide underneath or become blocked by the fixed sidebar.
- [ ] Verify Command Center and Video Vault theme colors, card contrast, iPhone touch controls, visible focus, no clipped buttons, no overly bright backgrounds, and reduced-motion accessibility.
- [ ] Confirm Home Screen Icon Studio still imports/exports 180×180 and 512×512 PNG and can reuse your saved master art.
- [ ] Verify the original Cinema, Animation Forge, Sonic Theater, Media Theater and offline/rollback behavior still function.
- [ ] Report device, Safari versus Home Screen mode, current release version, file format and exact reproduction steps.

## v3.7.0 — Cinematic Local Media & Icon Studio iPhone/PC acceptance

- [ ] Keep the original PROXIMUS Home Screen web app installed throughout icon testing. Safari Shortcuts can have a different IndexedDB/OPFS library; verify exported copies of local videos before any app deletion/reinstallation.
- [ ] Open Media → Personal Home Screen Icon on iPhone Safari and installed web app. Import a photo/GIF and verify the crop, zoom and 180/512 PNG export.
- [ ] Use an existing saved Master GIF, then an MP4 if available, as icon artwork; check the preview uses a still frame without affecting original Master art.
- [ ] Verify icon preview settings survive reload. Export does not upload media and does not change an existing iPhone Home Screen icon.
- [ ] In Apple Shortcuts, open the copied PROXIMUS URL, Add to Home Screen and choose the downloaded PNG. Confirm it launches the expected URL in Safari. Do not label this a native standalone PWA icon replacement.
- [ ] Preserve the existing web-app icon for the installed standalone shortcut until the owner separately publishes a new site-wide touch-icon file and reinstalls as needed.

- [ ] In existing iPhone Home Screen shortcut and directly in Safari, verify PROXIMUS v3.7.0 after updating without deleting the app or its website data.
- [ ] In Media Publisher, upload a local high-quality GIF or MP4 background, choose **Cinematic Pop**, and confirm it remains more visible behind readable panels. Revisit the page to verify the preference persists.
- [ ] Apply local GIF/video master artwork and verify the Command Center, the studio header thumbnail, and other dashboard thumbnails use the right artwork. Change the master priority to individual-first and verify an independent studio cover still works.
- [ ] Switch Balanced, Cinema Live and Still video-preview settings; on iPhone confirm no runaway autoplay, audio, thermal load or broken scrolling. Pause/reset as needed.
- [ ] Open Video Vault with existing saved videos; verify video playback, collections, favorite markers, bookmarks, resume position and original download/export still work.
- [ ] On a saved video, choose **✧ GIF/Video Cover**; test animated GIF and a short supported local MP4/MOV converted to MP4/WebM, then remove only the cover. Unsupported video codecs must not delete originals.
- [ ] While playing a saved video, seek to a frame and choose **Set sharp cover from current frame**. Confirm the new high-quality cover appears on its library card.
- [ ] Switch studios and return to Video Vault. Verify animated covers and personal background survive navigation and iPhone reload in the same browser profile.
- [ ] Verify that large-video imports and the existing no-copy Files preview still work. Browser quotas and Safari decoding constraints remain independently applicable.
- [ ] Test original Animation Forge GIF exports, Media Theater and Reactor audio/video without visual overlays covering player controls.
- [ ] Validate new user documentation, release manifest, Service Worker offline install, and old-version rollback without clearing saved personal media.
- [ ] Report device, browser, exact file format, card behavior, visibility setting and whether the issue reproduces on Safari vs the Home Screen install.

# NEXUS Asset Alchemist v1.0 — Development Verification

### Checks completed
- Connected GitHub write and read access verified on main branch.
- All ten studios and 132 HTML element IDs exist, with no missing JavaScript selectors.
- All source modules compile syntactically in V8 after import/export transformation.
- Combined startup smoke test with simulated DOM: 88 event handlers registered and initial navigation completed.
- Seeded Eclipse background generator exercised with a simulated canvas; produced a 1920×1080 output target and successful UI message.
- In-memory ZIP test: valid local-file headers, central-directory and EOCD signatures, correct entry count and filenames.
- Color contrast sample: black versus white = 21.00:1.
- Existing three gateway pages verified unchanged by SHA.

### Limits of testing
Actual browser image/video/audio outputs, downloads, PWA installation and GPU performance were not fully exercised in a live Windows session. Public GitHub Pages deployment has not been independently fetched; repository writes have been verified.

### Architecture
GitHub Pages static HTML/CSS/ES modules, pure client-side processing, same-origin offline caching, and local ZIP file export. No application backend, cloud processing, authentication, or Desktop Bridge.
