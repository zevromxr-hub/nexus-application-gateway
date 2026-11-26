# PROXIMUS | SOVEREIGN SURVIVAL
## Genesis v1.0.0 — Standalone fantasy arena survival

**Play:** https://zevromxr-hub.github.io/nexus-application-gateway/sovereign-survival/

A complete original, playable single-player 2D fantasy arena game, built for responsive iPhone touch and desktop keyboard/mouse in a standalone PWA. No external game engines, trackers, advertisements, game assets or user-account server are required.

### What you can play
- Real-time movement, auto-targeted arcane blades and a cooldown-based invulnerable dash.
- Enemies with three distinct combat behaviors: Wraiths, Stalkers and Brutes, plus the Void Monarch boss every four waves.
- Endless increasing wave sizes and enemy health/speed scaling, soul energy pickup, level-up pauses with 3 randomized power options from 8 upgrade paths, multi-projectile builds, defensive upgrades and lifesteal.
- Score, kills, combos, time, level, progress, player health, dash cooldown, boss health, minimap-like directional arrows, ending stats and restart.
- Responsive dark-fantasy Canvas2D artwork, world and enemy culling, iPhone-oriented low-effects default and original optionally enabled synthesized audio.
- Device-local best score, best wave and run counts, storing no identities, personal files or media.

### Controls
**PC:** WASD/arrow keys move; Shift dashes; Space/P/Escape pause/resume; mouse press/drag aims attacks in a chosen direction; otherwise auto-targets the closest enemy within range. Choose upgrades with 1, 2, 3 or click.

**iPhone / touch:** Drag the left thumb joystick to move; tap DASH on the right; auto-targeting handles attacking. Touch an upgrade card to choose a power. Pause with the top-right in-game button.

### Install
From Safari: open the game URL, Share → Add to Home Screen → enable **Open as Web App** when presented. The manifest requests standalone mode and the service worker caches static game source for offline sessions after a successful load. Browser support and device storage limits vary. You can keep your existing Proximus Asset Alchemist Home Screen installation; you do not need to uninstall or migrate any media.

### Safety and architecture
- Distinct `sovereign-survival/` source, manifest, service-worker scope and localStorage key from PROXIMUS Asset Alchemist. **Never reads, overwrites or deletes videos, posters, thumbnail databases or OPFS media.**
- No remote networking used by gameplay. The single-player game can be played offline after its shell is cached.
- Tests cover seeded waves, combat and collisions, XP and upgrades, dashing, boss attacks, gameover, project layout, and browser flow in emulated desktop Chromium and iPhone WebKit.
- Does not claim live multiplayer, cross-device sync, downloadable native executables or long campaign content. Those are potential later releases.

### Roadmap (not yet implemented)
- v1.1: deeper arenas, handcrafted enemy behavior, boss telegraphs, stronger combat effects and balancing.
- v1.5: character choices, equipment and persistent unlockable perks.
- v2.0: campaign/biomes, quest progression and challenge modes.
- v3+: optional backend for validated leaderboards and cooperative play.

**POWERED BY ZEVRO | PROXIMUS ARCHIVES**
