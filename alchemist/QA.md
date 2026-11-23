## v3.7.0 — Cinematic Local Media iPhone/PC acceptance

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
