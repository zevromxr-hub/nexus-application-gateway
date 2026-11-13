# PROXIMUS | ASSET ALCHEMIST v3.0.2
**OMNIVERSE IDENTITY & REACTOR IV — 30 studios · PC + iPhone**

Official application: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## PATCH v3.0.2 — BLANK GIF EXPORT CORRECTION

Fixed the actual GIF89a encoder: an off-by-one dictionary code-width change produced invalid LZW compressed data. This could create GIFs that appeared blank or only displayed the first few rows in standard image viewers, although the application reported success. The Safari fallback decoder has been aligned with standards-compliant streams too.

GIF exports now include an independent, externally decoded golden fixture test at **480 × 270**, as well as several frame sizes and transparent colors. The existing **v3.0.1** dimensions/decoded-frame fix remains included. All 30 studios remain available.

**Try:** Animation Forge → Regular animated GIF → Automatic dimensions → import video → Create regular GIF. After deployment, use Check Updates to load v3.0.2.


## PATCH v3.0.1 — ANIMATION FORGE GIF FRAME PRECISION

**Fixed:** Regular MP4/WebM → GIF conversions no longer lose browser ImageData width, height or pixel buffers before encoding. The prior bug incorrectly displayed "Frame sizes do not match GIF dimensions" even with automatic dimensions selected.

This fix also covers animated GIF resizing and GIF icon packs. No exact-width requirement is imposed on normal GIFs. Select **Regular animated GIF** + **Automatic · source proportions** for hands-free sizing, or Custom to choose your output dimensions.

All 30 studios remain available and all personal data stays local. Use **Check Updates** after GitHub Pages finishes publishing the new release.


## NEW STUDIO 30 — MASTER VISUAL IDENTITY

The master design controller applies a cohesive appearance to the entire local Asset Alchemist browser UI.

- Choose Sovereign Violet, Solar Dominion, Abyssal Cyan, Crimson Ember, Emerald Ascendant, or Frost Sentinel.
- Edit six safe custom hex-color channels: primary, secondary, emissive glow, background base, panel surface, and borders.
- Tune glow, interface sizing, border geometry, and motion intensity. Exempt any selected studio's local appearance from the global theme.
- Optional time-of-day switching between two color universes, activated when the application is in use or regains focus.
- Choose whether to show the existing master GIF/video thumbnail everywhere. The identity preference never deletes uploaded media.
- Continue to use Media Publisher's existing GIF/MP4/WebM master thumbnail and full-screen background publisher; dedicated buttons open them directly.
- Link currently chosen identity colors to Sovereign Reactor IV *only if enabled*.
- Save up to twelve named appearances, import/export portable visual identity JSON, or transfer all media bytes with Sync Bridge.

This feature changes browser-local cosmetics, not server permissions, GitHub source, customer licensing, or another user's appearance.

## SOVEREIGN REACTOR IV — AUDIO-REACTIVE CINEMATIC STUDIO

Reactor IV extends the existing working Web Audio visualization with:
- Five original effect compositions: Dominion Impact, Celestial Radiance, Hyperspace Reactor, Frost Precision, and Abyssal Singularity.
- A visual frequency routing matrix mapping sub-bass to atmosphere, bass to shockwaves, mids to emissive wing effects, and treble to particles.
- Independent controls for each frequency band and for shockwave/particle intensity.
- Custom animated GIF/video/image layers with clipped masks: halo, wings, kinetic equalizer bars, and eclipse.
- Flash, fade, and cinematic sweep scene transitions, four custom ordered scenes, timed or beat-triggered switching.
- Real detected-beat timeline markers and portable effect JSON backups.
- Optional Visual Identity system color synchronization.
- All pre-existing microphone, local audio file, desktop tab-audio capture, custom backdrop, GIF export, PNG, and supported silent video capture continue to work.

Note: iPhone webpages still cannot directly read protected system audio playing inside another app. Use local audio files or a permissioned microphone to drive music reactions. Audio-reactive measurements represent actual input, not generated guesses.

## PC/iPhone and offline reliability

The existing 29 studios and Token Foundry are retained. Custom Identity preferences are included in Sync Bridge workspace ZIP transfer and ordinary Recovery Center settings backups. Uploaded GIFs, videos, and other binary assets remain in their original local IndexedDB stores and require an archive that includes media.

The application's original GitHub Pages site, Discord button, PWA installation route, Check Updates flow and rollback support remain unchanged.

POWERED BY ZEVRO | PROXIMUS
