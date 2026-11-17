# NEXUS | AZEROTH COMPANION — v18.0.0
## WORLD ATLAS OVERDRIVE · CARTOGRAPHY, ICON MARKERS & SMART LOCAL MAP INTELLIGENCE

Release date: November 17, 2026  
Rollback: \`backup/azeroth-v17-before-world-atlas-v18-2026-11-17\`  
Main site: https://zevarchives.com/azeroth-companion/  
Atlas: https://zevarchives.com/azeroth-companion/world-atlas.html  
Owner release approval: **Approved**; tester acceptance: **Pending**.

### Map and visual design
- New original NEXUS fantasy cartography SVG \`assets/nexus-atlas-cartography-v18.svg\`, locally served from GitHub Pages. It has detailed continent relief, map grid/compass, sea and mountain styling, labels, an inset for off-Azeroth Outland and no external map-tile or font dependencies.
- The world plate maintains the existing eight selectable region pins; selecting a region opens a new interactive small-area chart with its actual curated zone names. All 25 destinations have manually laid-out **illustrative** positions and recognizable source-independent SVG crown, compass or mountain icons.
- Pins are **not** world-map coordinate data. No official Blizzard map textures, player location, navigation routes or exact zone boundaries are claimed. Players can open the external Warcraft Wiki Maps reference: https://warcraft.wiki.gg/wiki/Maps (community reference, not an official map API).
- Optional **Preview Own Map** lets a player select a local PNG/JPEG/WebP under 8 MB in that browser tab only. It does not upload, persist, replace default published art, or auto-align the existing illustrative pins. Reset revokes temporary blob URLs and restores the NEXUS cartography.

### Functional map intelligence
- Map overlay filter: all, any local mission, in-progress, planned, manually completed, bookmarked, included in the v17 session, capitals, hubs and zones.
- Region pins show existing manual mission counts; region charts show status rings, bookmark stars, mission counts and v17 session markers.
- Selecting a destination presents source-labeled manual counts, native *Create mission here* and bookmark actions, existing local character/Forge/Item Atlas references and links into Expedition Console, Adventure Operations and World Atlas.
- The original Atlas goal form, deletion/status controls, saved records, source IDs and unrelated companion data are preserved untouched. No duplicate mission collection or new persistent key is created.

### Performance and safety
- Pure local JS data helper for fixed 25 zone layouts; inline SVG icons; one local original SVG plate. No new dependency or API request.
- Performance mode (automatically suggested on narrow screens / reduced-motion browsers, manually selectable) reduces shadows and transitions; desktop retains premium effects. iPhone compact layouts remain keyboard/touch accessible.
- No new account calls, OAuth endpoints, external map tiles or location permission. Original Blitz OAuth/Cloudflare Worker, native Forge, authentication session, inventory and save data unchanged. Source excerpts are local and manually entered only.
- Existing planning record keys: \`nexus_world_atlas_goals_v16\`, \`nexus_adventure_intelligence_v165\`, \`nexus_adventure_operations_v17\`. The map reads these; for bookmarks it delegates any deliberate user tap to the existing trusted v16.5 bookmark button, never writes directly.
- A rollback is a Git branch restore, NOT deleting browser data. Save Protection backups should be exported before manual owner testing.

### Automated regression and tester checklist
1. [ ] Source test: every original known destination has a bounded v18 map position and icon, status filter counts are valid, and no new local writes/network calls exist.
2. [ ] Desktop Chromium: eight clickable regions, original continent plate loads, mission/capital/bookmark/session overlays and zone details work.
3. [ ] Simulated iPhone WebKit: region charts and filters do not overflow, touch targets respond, lite mode behaves.
4. [ ] Original v16 mission form and status changes still work; v16.5 bookmarks still persist and inform regional markers.
5. [ ] One-tap zone handoff to original mission form, Expedition Console and v17 Adventure Operations works.
6. [ ] Select a local map PNG/JPEG/WebP, then reset; verify the preview never persists or changes a stored record.
7. [ ] Public source and private manual data remain labeled separately; no fabricated live game position/achievements or actual travel timing.
8. [ ] Test physical iPhone Safari and Add to Home Screen. **Pending owner/real-device acceptance.**
9. [ ] Test genuine Blizzard linked character/Forge/Item research for real users, on actual game build. **Pending.**
10. [ ] Confirm the v18 Discord release message and GitHub Pages published SHA using workflow records after owner-approved merge.

Only completed tests may be recorded as passed. Advisory GitHub workflows remain non-blocking and source failures must not be silently treated as verified.
