# NEXUS | AZEROTH COMPANION — v22.0.0 LIVING INTELLIGENCE
## SOURCE-LABELED CARTOGRAPHY, PUBLIC BLIZZARD EQUIPMENT & ADVENTURE DIRECTOR

Owner-approved release: November 20, 2026. Physical-iPhone and live-game acceptance pending.
Primary: https://zevarchives.com/azeroth-companion/living-intelligence.html
Atlas: https://zevarchives.com/azeroth-companion/world-atlas.html#nx22Atlas
Gear: https://zevarchives.com/azeroth-companion/character-intelligence.html
Rollback: backup/azeroth-v21-before-living-intelligence-v22-2026-11-20

### 1. World Atlas: actual zone coordinate notebook, not fake official map graphics
- Previous fantasy continent illustration remains illustrative/not to scale. It is not game geography; earlier art pins must not be advertised as precise in-game positions.
- Zone Waypoint Laboratory has a separate 0–100 X/Y coordinate grid tied to the selected zone and in-game UI Map ID. Players may enter their own marker label, source note, category and coordinates, then save a local pin.
- Curated UI Map IDs: Hallowfall 2215, Azj-Kahet 2255, Ringing Deeps 2214, Isle of Dorn 2248, Valdrakken 2112, Waking Shores 2022, Azure Span 2024. Sources: https://www.wowhead.com/guide/list-of-zone-map-id-number-for-navigation-in-wow-and-tomtom-19501 and https://warcraft.wiki.gg/wiki/UiMapID. Coordinate convention: https://warcraft.wiki.gg/wiki/Coordinates. IDs can change in patches or floors.
- Players can optionally select a PNG/JPEG/WebP/GIF image they have rights to use as a map preview. The file is NOT uploaded or saved: object URLs exist only this visit, then are revoked. The image must align exactly to the full zone's coordinate grid or pin positions will not match.
- Copy In-Game Macro produces a real WoW macro using C_Map.CanSetUserWaypointOnMap and C_Map.SetUserWaypoint(UiMapPoint.CreateFromCoordinates(mapID,x/100,y/100)). The player manually runs it in WoW; unsupported maps may reject the waypoint. Source: https://warcraft.wiki.gg/wiki/API:C_Map.SetUserWaypoint and https://warcraft.wiki.gg/wiki/UiMapPoint.
- Records are bounded at 160 under nexus_atlas_waypoints_v22. Export/import JSON is explicit, additive and validated. Older Atlas v16 goals and v18.1 routes never change.

### 2. Character Nexus: public API research, not invented inventory
- Existing Character Intelligence already requests public character profile and equipped gear using the NEXUS Cloudflare API Worker when the player enters region/realm/name. V22 does not add new API requests or change Worker authentication.
- After the existing successful fetch, the v22 panel reports the returned equipment slot count, item-level coverage and fetch timestamp. Unreturned slots are unknown, not empty. Item level alone does not establish which gear is better for a specialization.
- An optional Save Research Snapshot button stores at most 12 sanitized public character reports in nexus_character_research_snapshots_v22 (region, realm, character, public class/spec/level, reported equipped item level, returned slot/ID/name/level and fetch timestamp). No OAuth tokens, cookies, secrets or full raw profile are saved. Delete Snapshot affects only this new key.
- Character Nexus shows the user these dated reports, clearly labeled as public research. Director matches a manually saved local character to a captured report by character name and realm where available. These reports may be unavailable, incomplete or stale.
- Original two-character gear comparison, existing export and public API requests remain intact.

### 3. Living Intelligence Director: connected and working
- New page living-intelligence.html reads original v16 Atlas manual objectives, v17 saved Adventure Operations session entries, v22 manual coordinate pins and explicitly saved public gear reports. No older key is written.
- Choose a local character or All, activity focus (Balanced / Exploration / Equipment / Collecting), and 30/60/90/120/180/240 minute budget.
- Algorithm prioritizes active objectives and items already chosen in Adventure Operations, reuses explicit v17 time estimates, and links relevant saved zone pins. Times are estimates for planning only, never live travel durations or promises.
- The summary offers direct links to existing World Atlas, Talent Forge, Character Intelligence and Adventure Operations. Personal completion checkbox state, budget and mode persist only when the user acts, under nexus_living_director_v22.
- Copy a readable source-labeled briefing or export JSON without overwriting original Adventure Operations sessions.

### Data privacy and compatibility
- Three isolated v22 localStorage keys are included in the regular planning Save Protection JSON. The separate AES-encrypted Private Video Vault video records/passwords remain excluded and can be backed up only as ciphertext in that Vault.
- No third-party runtime, scraped map tiles, autolocation, background account sync, extra OAuth scope or Cloudflare binding is introduced.
- Main Azeroth app retains the same number of startup JS/CSS requests, reusing its existing performance bundle for Unity search. The NEXUS Gateway, native Command Center search and PWA now offer the Director.
- All original game plans, builds, character records, routes, progress checklists, account verification, media and encrypted Vault remain preserved. User browser storage may be evicted; back up relevant archives.

### Owner/tester acceptance checklist
1. On PC and real iPhone, open World Atlas coordinate lab. Hallowfall pre-fills UI Map ID 2215. Enter X=52.45 Y=80.25 as SYNTHETIC test values, save, and see a pin only on the separate zone grid.
2. Test a personally owned zone map image preview; clear the preview and confirm the stored coordinate remains. Confirm image never uploads.
3. Copy a waypoint macro and test manually in WoW, verifying the game's Map ID and whether the map allows waypoints. Game behavior may change after patches.
4. Export waypoints JSON, remove only the synthetic marker and re-import. Confirm original Atlas goals and routes remain byte-for-byte identical.
5. Fetch a real public Retail character from the existing Worker via Character Intelligence; inspect real reported gear slots/time; choose Save Snapshot, then reload and delete if desired.
6. Open Character Nexus; distinguish optional dated Blizzard reports from manually saved characters and builds.
7. In Director, select a manual character and a 90-minute Equipment focus. Confirm explicit Adventure Operations time estimates, active goals and available zone coordinates appear.
8. Mark an agenda step complete and confirm old Atlas and Adventure Operations records are unchanged.
9. Copy/export a source-labeled briefing and verify no credentials, private videos or unsupported gameplay claims.
10. Test installed iPhone PWA, mobile layout, keyboard controls, old Talent Forge, Save Protection and Private Vault separately.
11. Verify dedicated automated v22 desktop/iPhone checks, deployed Pages version 22.0.0, and Discord release delivery.

Actual official map artwork and precise automatic location tracking are not part of v22. Those would require properly licensed sources and, for live location, a separate authorized in-game integration. No fabricated map accuracy.
