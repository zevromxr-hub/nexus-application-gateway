# NEXUS | AZEROTH COMPANION — v18.1.0
## SOVEREIGN ROUTE ARCHITECT · SOURCE-SAFE VISUAL EXPEDITION ITINERARIES

Release date: 2026-11-17
Atlas: https://zevarchives.com/azeroth-companion/world-atlas.html
Rollback branch: \`backup/azeroth-v18-before-route-command-v181-2026-11-17\`
Approval: **Owner-approved**. Actual physical iPhone and connected WoW player acceptance: **pending**.

### What is genuinely new
The existing v18 World Atlas page now contains a Sovereign Route Architect inside the same navigation surface. The planner supports six private, named routes with up to twelve unique destinations per route. All saved stop IDs are validated against the existing curated World Atlas zone list: capital cities, hubs and research zones. Users can add locations from the drop-down or directly from the currently selected v18 map pin, reorder steps, mark them visited **manually**, write private research notes and use built-in Capital Survey, Dragon Isles or Khaz Algar research templates. Region grouping is a convenience-only reordering command, not a real travel optimizer.

Map charts show the route stop numbers on the corresponding known zone pin. A dashed connection is shown **only between adjacent ordered stops inside the currently displayed research region**. This line is only to visualize the user's chosen sequence. The Atlas does not know accurate in-game coordinates, distances, fastest travel routes, transport links, directions, quest completion, instance accessibility or character position; it must never claim otherwise.

The route board shows existing source-backed manual Atlas mission counts by destination, with links back to the original Atlas location, the original Expedition Intelligence workspace and the separate v17 Adventure Operations studio. It does not silently add goals to v17 sessions. Users deliberately manage that session from the original studio.

### Persistence and privacy
New isolated browser-local key: \`nexus_atlas_routes_v181\`. The exact normalized JSON format is \`nexus.atlas-routes/1\`.
- Names max 70 characters, route notes max 500, stop notes max 200, six routes, twelve unique curated destinations per route.
- Explicit actions only write this new key. The original \`nexus_world_atlas_goals_v16\`, \`nexus_adventure_intelligence_v165\`, \`nexus_adventure_operations_v17\`, character profile, Forge, inventory and Blizzard OAuth keys remain unchanged by route features.
- Cross-tab writes are protected by a raw-storage compare-before-save guard. When another tab changes route data, reload and review the newer state.
- Route backups use \`nexus.atlas-routes-backup/1\` and require valid format, preview and explicit confirmation to replace only the v18.1 library.
- Full Save Protection reads and exports the new route key as well as original v16/v16.5/v17 data.
- No new backend, tracking, external network map tiles, browser geolocation or forced verification.

### Required regression and manual tester checks
1. [ ] Source-unit tests for six routes, twelve stops, deduplication, unknown zone rejection, safe notes and IDs, owner data isolation.
2. [ ] Desktop Chromium: map pins, creation, selected-pin insertion, dropdown stop insertion, reorder, visited marker, notes, template, local reload and backup.
3. [ ] iPhone-like WebKit: touch response, safe horizontal scrolling and responsive layout, no JavaScript errors.
4. [ ] Existing v18 map imagery, regional icons and native v16 Atlas mission forms still work without alteration.
5. [ ] Existing v16.5 bookmarks, v17 Operations session, original personal missions, Forge and item records are byte-for-byte unchanged after route editing.
6. [ ] Route sharing/backup: exported JSON has only isolated manual itinerary content, import requires preview and confirmation.
7. [ ] Test real iPhone Safari and Home Screen plus a real player's WoW account when available — **not automatically certified by synthetic tests**.
8. [ ] Check production GitHub Pages published version and Discord announcer delivery after the reviewed branch is merged.

Do not convert a passing automated synthetic browser run into a claim that real in-game pathfinding or physical-device compatibility has been verified.
