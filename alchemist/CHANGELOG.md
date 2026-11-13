# PROXIMUS | ASSET ALCHEMIST — Changelog

## v2.2.0 — Motion & GIF Dominion Edition (2026-11-12)

### New
- **Animation Forge (Studio 15)** accepts local MP4, WebM, or animated GIF. It can convert supported clips to real animated \`GIF89a\` files with 6/8/12 fps, clip trimming, resizing, contain/cover, background fill, optional transparency, and simple ordered dithering.
- Animation Forge can produce a PNG keyframe, save an animated GIF into the persistent Pack Vault, and create an animated GIF icon ZIP (32, 64, 128, 256 px) with separate static PNG fallbacks.
- **Icon Foundry upgraded:** imported GIF master artwork is supported for static PNG icons or the new dedicated animated GIF icon export. Animated GIF output is real multi-frame data, not a video file renamed \`.gif\`.
- **Original LZW GIF encoder** with a deterministic palette and actual NETSCAPE looping extension, compatible file-header output, and frame delays. Added independent GIF decode round-trip source tests.

### Preserved
- All previous 14 studios, persistent vault, static hosting, versioned cache, and Discord's existing "OPEN ASSET ALCHEMIST" GitHub Pages link.
- No external encoder service, remote upload, application installer, or unrelated gateway changes.

### Compatibility and honest limits
- Video decoding is browser-dependent: MP4/H.264 and WebM/VP8/VP9 are common; codecs not understood by the browser will fail with an explanation.
- Animated GIF re-encoding uses Chromium's built-in ImageDecoder; current Chrome, Edge or Opera recommended.
- GIF has a maximum of 256 palette colors and no audio. Clips are capped at 8 seconds, 96 frames, and 512 px longest dimension to manage browser memory.
- Animated \`.gif\` icon files can animate only where the target platform permits GIFs. Windows taskbar/executable \`.ico\` files cannot animate.
- Browser source processing has no cloud upload. Output GIF files can be much larger than MP4/WebM for comparable animation.


## v2.1.0 — Dominion Workflow Edition (2026-11-12)

### New
- **Layer Forge (Studio 13):** multi-layer canvas editor, local image imports, editable text layers, pointer-driven positioning, layer order, opacity, rotation, scaling, five blend modes, transparent backgrounds, and output presets up to 4K.
- Portable Layer Forge JSON projects can embed imported image bytes for later restoration; imports are validated and limited to safe known image formats.
- **Motion Graphics (Studio 14):** original procedural orbital particles, glowing portals, editable title/subtitle, five color themes, speed and energy controls, and local still PNG capture.
- Actual 1280×720 silent WebM exports (3–8 seconds) via browser MediaRecorder, with optional custom image background and integration with Asset Packager.

### Compatibility and quality
- All 12 existing Proximus creative studios, pack vault, in-browser privacy, production audit and recipe tooling preserved.
- GitHub Pages URL \`/nexus-application-gateway/alchemist/\` and the **OPEN ASSET ALCHEMIST** Discord button destination remain unchanged.
- Independent root Sonic Reactor II gateway, desktop protocol handlers, and Character Foundry pages remain untouched.
- Additional asset module added to the offline cache; new source and ID checks cover 14 studios.

### Known limits
- WebM recording requires a browser that supports canvas capture and MediaRecorder (Chromium recommended). Exports are silent and visual-only, not audio muxed.
- Large portable JSON projects can use substantial memory because image pixels are embedded as base64. Keep regular file backups.
- Layer Forge currently uses a flat composition canvas and per-layer transforms; it is not a full PSD editor.
- GIF imports use the still frame rather than retaining GIF animation.


## v2.0.0 — Supreme Creator Edition (2026-11-12)

### New
- **Production Lab** with Discord banner, wide banner, video thumbnail, square, cover, 1080p/4K wallpaper, and vertical layouts.
- Five distinct procedural material themes, editable titles/subtitles, seed-based art, optional user image backdrops, PNG/WebP exports, and reusable JSON recipes.
- **Asset Audit** for file-header identification, SHA-256 integrity checking, duplicate detection, suspicious extension mismatches, and basic PNG/GIF/WebP/WAV/GLB metadata.
- JSON and CSV audit exports plus Add to Pack action.
- **Persistent Pack Vault** using local IndexedDB, automatic background saving, recovery after refresh, and storage information.
- In-app **version checker**, release manifest, explicit changelog, and updated offline cache.
- GitHub Actions static checks and self-contained version consistency tests.

### Improved
- Full **PROXIMUS** visual branding, footer, output naming, and release documentation.
- Original ten creative workbenches preserved.
- Previous URLs, GitHub repository path, compatible launcher protocols and existing browser preferences remain unchanged.
- The application stays static-hosted and processes source files only in the browser.

### Known limits
- Browser storage can be evicted or disabled: download ZIP backups.
- Production backgrounds are procedural, not AI generated.
- Motion Lab remains visual-only WebM; Audio Forge remains WAV-only.
- Audit is not an antivirus or malware scanner.
- The 3D inspector reads structure and does not yet sculpt meshes.

## v1.0.0 — Genesis
Initial 10-studio NEXUS-era release. Superseded by Proximus v2.0.0; archive retained in Git history.

**POWERED BY ZEVRO | PROXIMUS**
