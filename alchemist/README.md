# NEXUS | ASSET ALCHEMIST v1.0.0

**Powered by ZevRo | NEXUS**

## Website
https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

This is a static Progressive Web App hosted on GitHub Pages. It runs directly in Chrome, Edge, or Opera GX and never requires a Windows EXE, Python, a subscription, or a Desktop Bridge.

## Main workbenches
1. IMAGE STUDIO: Resize, crop/contain/cover, rotate, flip, enhance, hue, blur, grayscale, sepia, chroma key, typography overlay, PNG/JPEG/WebP export. Includes five procedural wallpaper generators: Nebula, Eclipse, Aurora, Embers, and Frost.
2. BATCH FORGE: Convert up to 120 images to WebP/PNG/JPEG with long-side resize, grayscale and ZIP export.
3. ICON FOUNDRY: Export PNG icons in sizes 16–1024 and a JSON manifest.
4. SPRITE ATLAS: Atlas PNG with layout, padding, transparency and machine-readable JSON coordinates.
5. TEXTURE LAB: Height, tangent-space normal and mask maps from image pixels (approximations).
6. COLOR LAB: K-means dominant color extraction, CSS/SVG/PNG gradient exports and WCAG contrast calculation.
7. AUDIO FORGE: Trim, gain, peak normalize, fades, reverse, preview and download 16-bit PCM WAV (up to five-minute selections).
8. MOTION LAB: MP4/WebM/GIF input; preview, snapshots, trimmed visual-only WebM recording up to 20 seconds.
9. 3D INSPECTOR: Inspect GLB/glTF structure, meshes, materials, skin joints, animations and morph targets. Export JSON report.
10. ASSET PACKAGER: Collect output from other studios and export one ZIP with SHA-256 manifest.

## Privacy, storage, and performance
- No local input files are uploaded to the website, GitHub or Discord.
- Tiny interface preferences reside in browser localStorage.
- The current asset pack exists only in browser memory, so download it before refreshing or closing the page.
- ZIP uses stored entries rather than extra compression; max 350 MB and 500 files.
- Large image processing and video capture depend on browser and device resources.
- PWA service worker caches the application source for offline reuse after first online visit; imported media is NOT cached.

## Known limits
- GIF images can be used as still frames or recorded into WebM, but direct animated GIF output is not implemented.
- Motion Lab produces muted WebM, not MP4 or video with sound.
- Audio Forge produces WAV, not MP3.
- 3D Inspector analyzes file structure but does not render/edit full 3D geometry.
- Normal maps and color-key transparency are approximate, not physically based editing tools.
- Imported third-party content must be used according to its license.

## Discord Link Button
Label: OPEN ASSET ALCHEMIST
URL: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

This opens in the browser. A Windows protocol handler is not needed.

## Safe deployment
All files reside in the /alchemist/ folder. Existing Reactor, Foundry and Sovereign Hub gateways remain unchanged.
