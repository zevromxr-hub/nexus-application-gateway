# SOVEREIGN SURVIVAL v1.2 — NIGHTFALL COMBAT

**Play:** https://zevromxr-hub.github.io/nexus-application-gateway/sovereign-survival/

A substantive action-game update to the Warbound full-screen fantasy survival game.

### New combat features
- **Hexer (Wave 3+):** ranged sorcerer; retreats and circles the player while preparing pink aimed projectiles. Its attack direction is locked during a visible warning, allowing skilled dodges.
- **Ravager (Wave 5+):** aggressive enemy that pauses for a clear linear warning before a fast charge.
- **Elites (Wave 3+):** rare enhanced enemies marked with a glowing gold crown and ring. They have stronger stats and award double score and XP.
- **Runic rifts:** dangerous circles appear on odd waves beginning at Wave 3. Their bright warnings precede real damaging pulses; dodge out of the marked radius or use invulnerable dash timing.
- **Void Monarch:** the triple bolt attack is now aimed at a locked position before the warning resolves, rather than unexpectedly tracking the moving player.
- **Four arena realms:** Shattered Citadel (Waves 1–2), Ashen Rift (3–4), Moonlit Ruins (5–6), and Void Throne (7–8), repeating in later waves.
- New damage numbers, attack arcs, enemy flash, differentiated projectiles, and death sparks.
- The Warden's Codex now identifies all six enemy archetypes and explains the boss, elites, and rift warnings.
- Hall of Legends keeps lifetime totals for elite and boss defeats, without losing earlier game records.

### Controls
On PC: WASD/arrows move, Shift dash, Space/P/Escape pause, 1/2/3 upgrades, mouse hold to aim when desired. On iPhone: use the left joystick and right dash rune; attacks automatically target nearby enemies. Keep moving, collect soul energy, and watch the marked attack lanes.

### Privacy and compatibility
The game remains a standalone offline-ready PWA. It saves only scores and counts to the original `proximus-sovereign-survival-v1` key in its own origin storage, safely defaulting new counters for players upgrading from v1.1. No access to or updates of PROXIMUS Asset Alchemist's personal movie/video files, posters or OPFS storage. Do not delete the existing Home Screen app or clear site data to update.

### Tests
Deterministic engine tests include Hexer locked aim, Ravager windup and charge, rift timing and invulnerability, elites, boss attacks, arena progression, original upgrades and loss. Browser runs check gameplay and legacy records on emulated iPhone WebKit and desktop Chromium. Physical iPhone gameplay testing is still recommended.

**POWERED BY ZEVRO | PROXIMUS ARCHIVES**

---

# SOVEREIGN SURVIVAL — v1.1.0 WARBOUND INTERFACE

**Play:** https://zevromxr-hub.github.io/nexus-application-gateway/sovereign-survival/

The first visual transformation of the standalone original arcade game. It is now presented as a **dark-fantasy game**, not a dashboard with side widgets.

## New in v1.1
- Cinematic title menu with handcrafted full-width fantasy character artwork, game sigil and four main actions: **Enter the Citadel**, **Hall of Legends**, **How to Play**, and **Game Settings**.
- True full-viewport battlefield and a smaller, game-style combat HUD. The original arena, eight upgrades, projectiles and wave progression remain intact.
- A dedicated **Warden's Codex** opened from the pause menu, with player stats, upgrades, and boss objectives. It no longer occupies a permanent sidebar.
- Dramatic ascension cards, pause screen and defeat results. Visual boss attack warning pulses, damage/dash feedback, and adaptive pixel budget for battery-friendly iPhone gameplay.
- Standalone iPhone/PWA install and local high scores remain preserved. No video data, PROXIMUS playlists, databases, or media files are accessed.

## Main menu
**Enter the Citadel:** start a fresh game. **Hall of Legends:** inspect personal best score, best wave, runs and total defeats stored on-device. **How to Play:** the combat, movement and dash guide. **Game Settings:** toggle generated sound effects, visual quality, and browser-supported fullscreen.

**During combat:** PC: WASD/arrow keys to move, Shift to dash, Space/P/Escape to pause, and 1/2/3 to pick an upgrade. Touch: drag the left virtual joystick and tap the right dash rune. Tap Pause to open the Warden's Codex, game settings, restart or return to the title screen.

### Performance and privacy
The fullscreen background illustration is a **single static SVG** and introduces no extra video playback or continuous shader loop. Rendering resolution is capped according to screen pixels and the selected quality mode. Sound remains opt-in. The same independent `proximus-sovereign-survival-v1` record key is preserved; scores are not reset by v1.1. The PWA's new service-worker cache is scoped strictly to `sovereign-survival/`.

**Do not uninstall either existing Home Screen app just to update it.** Keep copies of any media stored in other apps. v1.1 does not edit the Asset Alchemist or its local video library.

---

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
