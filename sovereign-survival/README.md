# SOVEREIGN SURVIVAL v1.5 — REALM EXPEDITIONS

**Play:** https://zevromxr-hub.github.io/nexus-application-gateway/sovereign-survival/

The arenas now contain **real, optional combat objectives**, not static location cards. Every wave generates an expedition with its own geometry, interaction, completion state and Renown reward. The HUD tells you what matters, and in-world waypoints show you where to go. Objectives award bonus Renown after the survival run eventually ends; leaving/restarting early does not bank unfinished rewards.

## Four interactive realms

| Realm | Active objective | What the player does |
| --- | --- | --- |
| **Shattered Citadel** (Waves 1–2, recurring every 8 waves) | **Wardstone Defense** | Protect a real destructible Wardstone. Siege attackers target it but can still damage a nearby player. Survive and clear the wave with the stone intact to claim victory. |
| **Ashen Rift** (Waves 3–4) | **Rift Purge** | Two portals have health bars; your normal projectiles can auto-target and destroy them. Living portals periodically summon additional enemies (with a safe spawn cap). |
| **Moonlit Ruins** (Waves 5–6) | **Moonlight Ritual** | Stay within a marked shrine radius for about five seconds. Completing the ritual heals the player and grants a **35-second Moonlight Blessing** that improves movement and attack damage. |
| **Void Throne** (Waves 7–8) | **Void Seals** | Stand near two marked sigils to activate them. Each completes after a short charge. Active seals protect the Wave 8 Void Tyrant until awakened. Watch the timed central safe circle: outside it, the throne periodically deals damage. |

Expedition objectives are optional for wave progression; failing one never soft-locks the game. Quests reset each wave. Completed expeditions award score and a bonus Renown allocation; failed objectives award no expedition bonus.

## Boss encounters and phases

The **Void Monarch** remains on Waves 4, 12, 20, etc. The **Void Tyrant** makes its first appearance on Wave 8, returning on Waves 16, 24, etc. The Tyrant has a distinct purple armored silhouette and more health. Both bosses aim ranged attacks along visible locked telegraphs, then become enraged at about **55% health**, releasing five-projectile volleys at faster intervals. The Tyrant additionally creates a real damaging radial attack on entering its second phase; clearing the Void Seals removes its extra armor before the fight.

## Rare forgeable blueprints

- **Wardlight Crest** — first complete **2 realm expeditions** across finished runs, then forge for **135 Renown**. Grants +15 maximum HP and +8% base movement speed.
- **Tyrant Heart** — first defeat **2 realm bosses** across finished runs, then forge for **190 Renown**. Restores 5 additional HP after each enemy defeat.

Both are permanently owned once forged, and count toward the existing **two equipped relic slots**. Older purchased relics, champion choices and balance remain untouched. The Hall of Legends now also tracks completed expeditions. Existing saves safely default the new expedition count to zero.

## Play, performance and privacy

All real effects are drawn with the existing Canvas2D engine, with a reduced-complexity Eco path and simple world-marker rendering. PC still uses WASD, Shift and Q; iPhone retains the joystick, DASH and POWER rune. All new graphics and gameplay files are cached inside the standalone `sovereign-survival/` service-worker scope, not the PROXIMUS Asset Alchemist media vault. Do not uninstall your Home Screen app or clear website data to update.

**POWERED BY ZEVRO | PROXIMUS ARCHIVES**

---

# SOVEREIGN SURVIVAL v1.4 — CHAMPION AWAKENING

**Play:** https://zevromxr-hub.github.io/nexus-application-gateway/sovereign-survival/

v1.4 expands the real, deterministic combat engine. The three playable champions no longer simply have different statistics: each now has an active signature combat ability. Upgraded weapons also evolve to behave differently in battle.

## Playable champion abilities

| Champion | Active power | Combat behavior | Cooldown |
| --- | --- | --- | --- |
| Void Warden | **Astral Nova** ✧ | Violet radial blast damages and knocks nearby enemies back | 9 s |
| Frost Sentinel | **Glacial Bulwark** ❄ | Freeze nearby enemies for 2.1 seconds and become invulnerable for 2.35 seconds | 13 s |
| Ember Reaver | **Infernal Cleave** ⚔ | Directional fiery slash applies immediate damage plus burning ticks | 8 s |

Use **Q** on PC. On iPhone, tap the dedicated **POWER** rune near the dash control. The compact ability HUD displays the selected skill, cooldown and readiness. All powers work offline and are implemented directly in the game's deterministic combat simulation.

## Weapon evolutions

Three existing temporary skill upgrade paths now awaken an automatic additional effect when reaching Rank 3 **within the current run**:

- **Bloodsteel Edge → Sovereign Blades:** every second volley includes an additional wide close-range slash that hits nearby opponents.
- **Arcane Barrage → Celestial Storm:** an original blade impact splits into two smaller projectiles. Child projectiles do not split again.
- **Runic Ward → Immortal Aegis:** negate one incoming hit, then wait 15 seconds for the shield to recharge.

These evolutions add to the normal rank bonuses. They are not purchased through Renown: they must be earned by collecting soul energy and selecting upgrades during each run. The Warden's Codex now displays their progress.

## Combat and visual effects

The canvas displays unique radial blasts, fiery arcs, crystalline freeze patterns, temporary barriers, burning enemies, split projectiles, Aegis protection and a new Void Monarch entrance effect. Effects use the existing Canvas2D loop with reduced complexity in Eco / Auto mobile mode and respect reduced-motion settings where practical.

## Preserve your account-free progress

The v1.4 update keeps both existing save keys: `proximus-sovereign-survival-v1` (high scores, kills and waves) and `proximus-sovereign-survival-armory-v1` (Renown, characters, forged/equipped relics). Character and relic bonuses still affect actual gameplay; completed runs still award Renown.

The service worker is scoped strictly to `sovereign-survival/`. No updates to PROXIMUS Asset Alchemist's personal videos, OPFS, local media, or creative studios. Do not uninstall the existing PWA or clear website data.

**POWERED BY ZEVRO | PROXIMUS ARCHIVES**

---

# SOVEREIGN SURVIVAL v1.3.0 — ASCENSION ARMORY

**Play:** https://zevromxr-hub.github.io/nexus-application-gateway/sovereign-survival/

Sovereign Survival now has a genuine, offline **meta-progression loop**. Your completed battles earn Renown, which you can spend on permanent relics that modify the next run. Class unlocks give you a reason to push deeper into the enemy waves.

## Champions

| Champion | How to unlock | What changes |
| --- | --- | --- |
| **Void Warden** ✧ | Free from the start | Balanced HP, damage, movement and attack rate |
| **Frost Sentinel** ❄ | 40 total defeats from completed runs | +30 maximum health, 10% damage reduction, 8% slower movement |
| **Ember Reaver** ⚔ | Reach Wave 4 in a completed run | +25% base damage, 10% faster attacks, -20 maximum health |

Choose your champion from **Ascension Armory** in the main menu before starting a run. Their different silhouettes and armor colors appear directly in combat.

## Relic Forge

Each relic is unlocked through a one-time Renown purchase. You can equip **up to two** at a time and change them freely between runs.

| Relic | Cost | In-game passive |
| --- | ---: | --- |
| **Nightglass Edge** | 45 Renown | +20% starting damage |
| **Moonwell Sigil** | 65 Renown | +25 maximum health |
| **Phantom Spurs** | 80 Renown | +13% base movement speed |
| **Soul Chalice** | 110 Renown | Restore +2 health after each enemy defeat |

A full loadout applies automatically as soon as a new game begins. Relics are distinct from temporary level-up powers: the latter still reset every run.

## Renown and rewards

Renown is earned only when a run **ends in defeat**. Its amount depends on score, waves reached, enemies defeated, elite kills and boss victories. Renown is displayed in the Game Over results and stored on this device. Restarting/abandoning an active run yields no Renown, so choose when to leave.

The **Hall of Legends** also shows lifetime Renown earned, while your prior best score, best wave, run count and defeats are preserved.

## Mobile, storage and privacy

The Armory is designed for PC and iPhone, scrolling within its own game screen. No new account, service, engine, remote sprite sheet or always-on animation is required. Champion and relic selections live in a dedicated `proximus-sovereign-survival-armory-v1` localStorage record while high scores remain in the existing `proximus-sovereign-survival-v1` record. No access to PROXIMUS Asset Alchemist's video data or OPFS storage.

Do not uninstall your existing Home Screen installations or clear website data in order to update. Once online, the standalone PWA caches the new Armory resources for future offline use.

## Verification

Engine tests validate class unlocks, stats, relic purchase affordability, double-purchase prevention, equipment slot limit, run rewards, saving/reloading and older save compatibility. Browser tests exercise the actual Armory and start a modified class+relic run in emulated iPhone WebKit and desktop Chromium. The pre-existing game and PROXIMUS media regression suites also run.

**POWERED BY ZEVRO | PROXIMUS ARCHIVES**

---

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
