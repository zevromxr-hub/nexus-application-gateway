# PROXIMUS | ASSET ALCHEMIST — Changelog

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
