# NEXUS | AZEROTH COMPANION — v12.0 VISUAL UNIFICATION
## SOVEREIGN WORLD ATLAS — design and rollout map

**Objective:** Make the existing 17-page Azeroth Companion feel like a single immersive product. Reuse current art, preserve all navigation, data, authentication, research, media and existing templates, and prefer visible, functional refinement to excessive effects.

**Production assets verified in the repository**
- `assets/citadel-hero-hd-v9.1.1.webp` — existing 1600×900 cinematic panorama, for full-width cover surfaces.
- `assets/zevro-wide-banner-v9.2.webp` — existing 2172×724 wide panorama, for low-height illustrated headers.
- `assets/sovereign-throne-v9.1.webp` — original Sovereign-themed portrait, max ~300px display width.
- `assets/talent-forge-v9.1.webp` — original talent/arcane portrait, max ~300px.
- `assets/living-armory-v9.1.webp` — original armory portrait, max ~300px.
- `assets/adventure-journal-v9.1.webp` — original expedition portrait, max ~300px.
- `assets/azeroth-oracle-v9.1.webp` — original Oracle portrait, max ~300px.
- `assets/assassin-background.webp` — founder portrait, retain existing Developer Identity scene.
- `assets/radiant-warrior-background.webp` — original radiant warrior for preservation/security page accents.

**Page-to-art atlas**

| Page | Visual role | Cover / framed art | Principle |
| --- | --- | --- | --- |
| `index.html` | Original application / six workspaces | Wide ZevRo panorama + Sovereign, Armory, Talent, Adventure, Vault accents per active section | Never change JS-owned controls or panels |
| `command-center.html` | Main cinematic gateway | Citadel HD + original five chamber thumbnails | Keep the existing distinctive hero |
| `citadel-entry.html` | Alternate gateway | Citadel HD + original five chamber thumbnails | Retain current preview, pins and mode settings |
| `living-azeroth.html` | Alternate cinematic gallery | Citadel HD + original five portraits | Keep native-resolution gallery layouts |
| `player-experience.html` | Character personal dossier | Citadel HD + Living Armory portrait | Keep saved data read-only |
| `sovereign-ascension.html` | Regal player command | Citadel HD + Sovereign throne portrait | Warm metallic framing |
| `character-intelligence.html` | Item and character comparisons | Citadel HD + Living Armory portrait | Cold steel / frost-cyan lighting |
| `progression-intelligence.html` | Journeys and progression | Citadel HD + Adventure Journal portrait | Expedition amber / frosty distance |
| `azeroth-assistant.html` | Guided knowledge | Citadel HD + Oracle portrait | Celestial emerald/cyan lighting |
| `addon-nexus.html` | Mod/addon research | Citadel HD + Talent Forge arcane portrait | Violet arcane research |
| `developer.html` | Founder identity | Existing Assassin Dominion backdrop and crest | Preserve existing snow and cinematic personality |
| `save-protection.html` | Data preservation | Citadel HD + Radiant Warrior inset | Protected archive motif, keep form usable |
| `getting-started.html` | New-player guide | Citadel HD + Sovereign portrait | Heroic welcome, clear text |
| `player-handbook.html` | Encyclopedia and player help | Citadel HD + Oracle portrait | Guided knowledge / teal accent |
| `player-test-checklist.html` | Testing and acceptance | Citadel HD + Adventure portrait | Expedition checklist motif, controls unchanged |
| `privacy.html` | Privacy and data guidance | Citadel HD + Radiant Warrior inset | Protected archive motif, subdued |
| `release-notes.html` | Changes / release records | 2172px ZevRo wide panorama + Sovereign portrait | Regal record-keeping |

**Technical constraints**
1. A single, isolated `visual-unification-v12.css` is linked last. It styles only known `body[data-nx12-page]` values, not unrelated product pages, iframe embeddings, or user-generated content.
2. Existing JavaScript, forms, user-data keys, server endpoints, Cloudflare, Battle.net, and music playback remain unchanged.
3. HD landscape images are reused as environment art; original slim portraits never scale beyond approximately 300px.
4. Guide/utility pages receive a contained art cover around their existing title and introduction; informational copy is preserved verbatim.
5. The original app gets a page-specific framed header per active section instead of random thumbnails inside data tables.
6. Reduced motion, print and mobile performance are respected. No new particle engine or remote asset is introduced.
7. One baseline rollback branch before changes: `backup/azeroth-v11-before-visual-unification-v12-2026-11-17`.
8. `version.json` remains in staging until live-device and player acceptance; Discord/public release manifest is not auto-published.

**Follow-on refinement plan (post initial v12 pass)**
- Audit first-viewport screenshots on 390px iPhone, 768px tablet and 1440px desktop; adjust any overlap.
- Gradually replace illustrative chapter art only when new purpose-specific high-resolution originals are available.
- Introduce consistent artwork-driven empty states into dynamically generated studio interfaces only after verifying their JS/data contracts.
- Check image decoding, cache, CLS, GPU effects and mobile scrolling with a real browser.
