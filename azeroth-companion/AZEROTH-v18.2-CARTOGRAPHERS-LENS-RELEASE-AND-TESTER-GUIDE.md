# NEXUS | AZEROTH COMPANION — v18.2.0
## CARTOGRAPHER'S LENS · PREMIUM REGION FIELD GUIDE & PERFORMANCE

Date: 2026-11-17. Owner publication approved; physical-device and real-player acceptance pending.
Atlas: https://zevarchives.com/azeroth-companion/world-atlas.html
Rollback branch: \`backup/azeroth-v18-1-before-cartographer-v18-2-2026-11-17\`

### Primary improvements
- **Eight original regional panoramas:** compact locally hosted SVG landscape studies, one for each existing Atlas region. Assets are individual, under 15 KB each, independently drawn for this application and have no external image, font or script requests. Panoramas evoke regional climates and are not official Blizzard zone maps or accurate landscapes.
- **The eight-region rail:** accessible horizontal region navigator showing curated locations and counts of personal manual missions, with visual selection. The original v16 native region strip and v18 illustrated continent plate remain present.
- **Detailed region field guide:** editorial descriptions and three clearly labeled research focus suggestions, avoiding unsupported claims about live quests, NPC locations, coordinates or expansion eligibility.
- **Destination finder:** local instant search across the 25 curated destination names, region names and original research descriptions. Selecting a result reveals the native v18 map pin; no new server calls.
- **Destination dossier:** source-labeled local mission counts, in-progress goals, bookmarks, v17 Adventure Operations session links and v18.1 saved route stop references; link into the original Expedition Console and original mission planner without writing to previous app keys.
- **Pin Focus:** visually reduces unselected labels on crowded charts; real button names remain in the accessibility tree. iPhone-sized/reduced-motion users start in compact mode, with a one-tap toggle.
- **External reference maps:** https://warcraft.wiki.gg/wiki/Maps and https://www.wowhead.com/maps are offered as reference-only links. They are not scraped, embedded or hotlinked. The original NEXUS map remains non-geographic.

### Performance approach
- The Lens uses one bounded index built over the existing browser-local mission, bookmark, v17 session and v18.1 route data, only recomputing when source values change.
- Multiple source/events are batched into a single \`requestAnimationFrame\` repaint, not a cascade of full renders.
- Only the selected region's original panorama receives a dynamic image URL, loaded with \`loading="lazy"\` and \`decoding="async"\`; no heavyweight map library or external tiles.
- An offscreen content-visibility optimization for the separate large route editor is used only where supported.
- Mobile/reduced-motion styling avoids extra transitions and GPU-heavy effects; no fictitious FPS or network-speed metric is claimed.
- All v18 map filtering, v18.1 route entries and v16.5 bookmarks remain functional.

### Safety and acceptance
- The v18.2 core and UI are **read-only**: no \`localStorage.setItem\`, \`localStorage.clear\`, \`fetch\`, OAuth, Worker changes, account retrieval or geolocation access.
- All existing private keys remain, including \`nexus_world_atlas_goals_v16\`, \`nexus_adventure_intelligence_v165\`, \`nexus_adventure_operations_v17\`, \`nexus_atlas_routes_v181\`, Forge drafts, manual items and character profiles.
- No v18.2 persistence key is introduced. Original Save Protection exports continue to cover prior stored records; visual mode defaults are local to the page and reset on reload.
- Owner-approved release does not imply real iPhone hardware and linked live WoW game progress tests have passed.

### Manual owner and tester checklist
1. [ ] Confirm eight region tiles show correct names and selected tile changes region and field guide.
2. [ ] Confirm exact same v18 world plate, world pins, zone icons, manual mission counts and filter choices remain available.
3. [ ] Search for Azj-Kahet, select it, and confirm the selected region and native mission planner switch to Khaz Algar.
4. [ ] Compare source-backed manual mission counts, v18.1 route stops and v17 session markers, without false account claims.
5. [ ] Verify Focus Pins on/off both in desktop and iPhone Home Screen mode and ensure screen readers retain full zone names.
6. [ ] Check region image load; ensure original vector asset uses no remote imagery.
7. [ ] Verify source-unit tests and synthetic desktop Chromium/iPhone WebKit browser checks; do not label genuine device/gameplay tests complete from synthetic runs.
8. [ ] Verify GitHub Pages deployment to commit and Discord announcement status for version 18.2.0.
