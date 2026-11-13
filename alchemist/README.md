# PROXIMUS | ASSET ALCHEMIST v3.1.0

**CINEMATIC CONTINUITY & VIDEO VAULT — 31 studios · PC + iPhone**

Official application: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## NEW STUDIO 31 — VIDEO VAULT

Video Vault is a permanent-in-app *device-local* library for videos you personally import from your PC or iPhone.

**Start:** Open **Videos** in the top bar, iPhone navigation dock or studio list. Choose **Import new videos** or the file-picker area, select MP4/MOV/M4V/WebM/OGV video files from Files or Photos, and wait for "Saved" in Video Vault.

The video bytes are copied into **this browser's IndexedDB**, under a dedicated video store. Filenames and small poster previews live in a separate metadata store, so showing hundreds of video cards does not load every full video file into memory. Videos remain visible after page reload, closing the app, and ordinary return visits, as long as browser storage is retained.

- Watch and resume from the stored position. Native inline iPhone playback and full-screen controls.
- Favorite videos, search titles and collections, organize each entry into a collection, browse latest watched or added.
- Save current video queue from **Media Theater → Save queue videos to Vault**.
- Save/share original imported video copies back to device Files, where supported.
- Optional picture-in-picture and generated cover snapshots (captured during first playback).
- Storage estimate, capacity warnings and optional request for persistent storage.
- Up to 500 library entries; individual files up to 450 MB on iPhone/iPad or 750 MB on PC, subject to browser quota.

**Important storage expectations:** The Video Vault is NOT an online media server and does not sync iPhone and PC files. Device/browser storage may be lost if you clear website data, delete the web app or the OS/browser evicts data. The storage API can request persistence, but it can be denied. Keep original videos in Files/Photos or your PC. The existing Sync Bridge workspace ZIP deliberately does not include these large Video Vault files.

iPhone .MOV playback works when its video codec is supported by the browser. Unsupported codecs remain saved locally and can be exported.

## SMOOTHER ANIMATION FORGE GIF EXPORTS

Regular MP4/MOV/M4V/WebM → GIF conversion now provides **15 FPS (smoother), 20 FPS (fluid)** and **24 FPS (cinematic)** in addition to the previous 6/8/12 FPS choices.

GIF89a records per-frame delays in 10-millisecond units; v3.1 distributes the rounding over the sequence so playback duration and pacing match the chosen frame rate more accurately. Supported browsers also get a best-effort presented-frame synchronization after video seeks to reduce duplicate frames.

To avoid mobile memory exhaustion, a GIF has a **120-frame maximum** and existing frame-pixel budgets still apply. At ordinary 1× playback: 15 FPS supports up to 8 seconds, 20 FPS up to 6 seconds, 24 FPS up to 5 seconds. For a fluid short GIF, start with **20 FPS and a 3–5 second clip**. A 24 FPS or larger export can still be heavy for older iPhones.

## NEW — IPHONE NAVIGATION

A touch-friendly navigation dock appears on screen widths up to 760px with direct shortcuts to Home and Videos, Back/Forward studio history and a searchable All Studios drawer. Pin frequently used studios, see Recent visits and browse without losing the current local project state. The dock respects iPhone bottom safe-area spacing, and offers a careful left-edge back gesture that ignores media/interactive surfaces.

Desktop navigation remains unchanged. If JavaScript fails before the dock initializes, the original horizontal mobile studio navigation remains available.

## PRESERVED

All previous 30 studios, your original Token Foundry, Sovereign Reactor IV, Visual Identity, Master Thumbnail Publisher, existing PWA/GitHub Pages URL and Discord launchers remain present. No customer credentials or tokens are included in Video Vault.

POWERED BY ZEVRO | PROXIMUS
