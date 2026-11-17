# NEXUS | AZEROTH COMPANION
## v16.5.0 — ADVENTURE INTELLIGENCE / WORLD ATLAS OVERDRIVE
### Owner-approved production feature scope and pending real-device acceptance

**Rollback:** \`backup/azeroth-v16-before-adventure-intelligence-v16-5-2026-11-17\`
**Owner status:** Approval for implementation and Discord release; tester acceptance remains pending, not falsely passed.

### What was added and where
1. **Expedition Console** (\`expedition-console.html\`): A cinematic gold/violet mission preparation workspace with a queue of the user's already saved World Atlas missions. It reads existing manual characters, saved Talent Forge drafts and Item Atlas IDs, and never invents live Blizzard data.
2. **Mission preparation intelligence**: Per-mission preparation templates for Explore, Build prep, Equipment research, Collection, Dungeon prep, Raid prep and Other. Every step can be checked manually, removed, supplemented with a personal step (up to 20), or reset with confirmation. A progress percentage means **manual checklist completion only**, never actual game eligibility, encounter readiness, DPS, boss access, gear ownership or in-game completion.
3. **Priority and personal field notes**: Pin missions and set High/Normal/Low priority, filter missions by character or status, search local mission titles/destinations, save up to 1,100 characters of private notes, and revisit them across browser reloads. None of these actions modify v16 Atlas goal data.
4. **Source and link integrity**: Each selected mission shows its optional character, draft and tracked item reference as manual browser-local information. If a linked record is missing, the interface says so. The source labels distinguish a found local record from any claim about verified Blizzard ownership.
5. **Portable Expedition Brief**: Explicit JSON export of the selected mission's whitelisted title/destination, manual preparation steps, notes, goal status and available link labels. Includes no credentials, cookies or game sessions. Copy Preparation Checklist is conditional on browser clipboard permission; JSON export remains available when clipboard access is blocked. Users must review names/notes before sharing.
6. **World Atlas Ascension**: A new Explorer's War Table visually shows personal mission counts by curated region, bookmarked research destinations and the next personal expedition. Direct **Prepare Mission** links appear on existing v16 goals. The original illustrated v16 map, zone search, mission editor, background art and existing data are untouched. Map count badges are **manual user goal totals**, not multiplayer or world activity.
7. **Living War Room Expedition Pulse**: A compact upgrade to the existing War Room that shows the next locally planned expedition and manually checked progress, plus bookmarked destination shortcuts and a link into the Expedition Console. Reuses the exact original dark galaxy/gold/violet visual identity.
8. **Connected navigation**: The original Companion sidebar, Command Center, Character Nexus and World Atlas now link to the Expedition Console. Both local command-search indexes include it. The existing original Azeroth Companion app, native Talent Forge, v15 guest-build exchange, game-data fetch architecture and music retain their original modules.

### Storage isolation and information security
- **Only new key:** \`nexus_adventure_intelligence_v165\`. Contains versioned bounded checklist records keyed by existing Atlas goal IDs plus optional bookmarked curated zone IDs. The new Expedition Console writes it only after explicit checklist, priority, pinned, notes or reset interactions. The Atlas overwrites this same new key only for explicit bookmark add/remove.
- **Legacy data read-only in the new modules:** \`nexus_world_atlas_goals_v16\`, \`nexus_azeroth_companion_genesis_v1\`, \`nexus_azeroth_talent_forge_v1\`, \`nexus_azeroth_item_atlas_v1\`, \`nexus_player_focus_v11\`.
- Save Protection includes the new versioned key in its existing private **read-only** export. It does not introduce account backups or automatically restore/synchronize records.
- No new Blizzard API requests, OAuth flows, Cloudflare Worker edits, third-party packages, remote art hosts, game position tracking or fake live world activity.
- Personal data remains browser-local; transfer requires voluntary exported files. Private notes and names should not be posted publicly without review.

### Operational limits and important qualifications
- Mission queue contains **only existing v16 World Atlas manual goals**. Create a goal in the original v16 Atlas first.
- User priority is a manual preference. The “next mission” uses pinned/priority/current goal status and does not recommend official player power or loot probability.
- Templates are **preparation prompts**, not current Blizzard encounter strategies or official class guides.
- If a linked character, Forge draft or item target is deleted, the console shows a missing-link warning; it does not reconstruct personal records from a Blizzard server.
- Bookmarks max 45, preparation steps max 20, records max 120, and export payloads are bounded; storage errors must not erase original data.
- Original source-reported ranks/spell icons, Talent Forge saved drafts, Battle.net verification, Discord webhooks, Cloudflare routing and custom-domain setup are untouched.

### Testing
Source regression:
\`node azeroth-companion/tests/adventure-intelligence-v16.5.test.mjs\`

Synthetic browser regression:
\`node azeroth-companion/tests/adventure-intelligence-v16.5.browser.mjs\`

These are wired into the existing **advisory** GitHub Actions validation/device workflows, along with previous v16 checks. The browser test follows War Room → World Atlas → Expedition Console → Character Nexus with fake local character/build/item records, iPhone-style WebKit and desktop Chromium. It verifies isolation, bookmark persistence, checklist status and original Forge draft preservation.

Live iPhone, real Blizzard character data and genuine in-game acceptance remain **pending** and must not be reported as verified solely because synthetic tests pass.

### Rollback and release delivery
The named backup branch captures the v16 baseline prior to v16.5. Rollback of frontend source must not clear user browser storage. The owner-approved Discord release is triggered by an authorized manifest under \`releases/v16.5.0.json\` after public version metadata and index match. A successful Discord run is not proof of delivery until the webhook confirms a message ID and the duplicate-prevention marker is saved.

### Future v17.0
The next separate phase is Sovereign Experience: more extensive cinematic UI optimization, deeper device-specific design and strengthened local continuity/recovery. This is **not** claimed to be implemented in v16.5.
