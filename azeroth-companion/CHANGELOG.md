# NEXUS | AZEROTH COMPANION — RELEASE HISTORY

## v5.0.0 · 2026-11-15 — Sovereign Command Experience

- **Unified website milestone:** A new guided Sovereign Command panel directly on Home offers three ways to start: New Player, Returning Player, and Playing with Friends. Each displays three contextual links into existing studios instead of adding competing tools.
- **Improved first-run and returning workflows:** Players can follow a sensible learning and planning route while preserving the existing personalized Quick Deck, recent tools, full tool search, website tour and latest-release notice. Journey choice is browser-local.
- **Website readability:** Appearance Settings now offers Standard, Comfortable and Large text sizing plus a cinematic or quiet homepage atmosphere. These settings change the website shell only and preserve existing studio styling and data.
- **Accessible experience:** Added keyboard Skip to main content, current-page titles, screen-reader navigation announcements and current-view indicators. A Return to Top control appears on longer pages, with phone safe-area styling.
- **Personal-data clarity:** The homepage distinguishes local planning records from the separate secure Blizzard account portal. Journey actions are ordinary navigation shortcuts, never account verification or automatic ownership checks.
- **Preserved infrastructure:** All prior studios, secure Cloudflare Worker, v4.8 view-aware startup, v4.9 responsive optimizations, Backups, Discord release metadata and per-browser appearance settings remain untouched. No additional API requests or OAuth permissions.
- **Versioned builds and tests:** Still exactly two CSS and two JS requests. The original source manifest includes the new v5 shell files, the compiled assets are versioned to v5.0, and desktop Chromium/mobile WebKit tests exercise journeys, settings, navigation and accessibility.
- **Documentation:** The standalone `SOVEREIGN-COMMAND-v5-GUIDE.md` explains usage, device testing, privacy boundaries and source maintenance.

**Testing scope:** Automated browser checks do not certify physical iPhone Safari performance or private Blizzard-account availability. A real player should verify their own optional account flow separately. No Cloudflare deployment required.


## v4.9.0 · 2026-11-15 — Website Stability & Experience Refinement

- **Smoother navigation:** Sidebar class-change notifications and iPhone tool-search group refreshes are now coalesced per animation frame, avoiding redundant website shell calculations when many buttons change together.
- **Stable Quick Deck:** The shortcut editor reuses its checkbox DOM rather than rebuilding it after every toggle. Keyboard focus and editor scroll position remain intact. The six-shortcut cap and existing local preferences are preserved.
- **Less repeated painting:** The recent-tools shelf no longer rerenders when its contents have not changed. Breadcrumbs skip repeated writes for the same active view, and duplicate hero navigation writes have been removed.
- **Long-list responsiveness:** Browsers supporting CSS `content-visibility:auto` defer painting offscreen records in selected long lists; those without support render them normally. Homepage card layout work is isolated from nearby elements. This changes presentation work only, not stored data.
- **Compatible functionality:** All v4.8 on-demand loading, original studio sources, Character Dominion, Battle.net verification, Cloudflare Worker, site preferences and local planning data remain preserved.
- **Regression protection:** New source validation plus browser interaction tests cover stable Quick Deck checkbox identity, rapid repeated navigation, long-list scrolling/click targets, and mobile WebKit. The existing four-asset bundle and startup/device checks remain required.

**Scope and limitations:** No studio data format, OAuth permissions, API endpoints or Cloudflare deployment changes. Actual physical iPhone FPS/CPU speedups remain unmeasured; this release reduces known redundant interface operations and uses progressive rendering when supported.


## v4.8.0 · 2026-11-15 — Intelligent Startup Engine

- **View-aware startup coordination:** The existing app router now announces which studio was opened, letting optional tasks initialize only when relevant. The event carries a view ID, not Blizzard account data or a login claim.
- **Fewer background lookups:** Blizzard Talent Forge index, Loot Hunter curated source reference, and separate Information Guide/Release Center version-manifest calls now run when opened rather than during the initial Home load. The website update center still loads the current release manifest at startup.
- **Deferred hidden-view calculations:** Character Dominion, Unified Character Dashboard, Progress Command, Item Atlas, Player Field Lab and War Room group now compute their heavier browser-local summaries on first visit. Shared planning dashboards refresh on subsequent visits so manual changes remain visible.
- **Preserved functionality:** All existing studios, navigation, data keys, Sovereign Data Vault, account verification, Cloudflare Worker, accessibility controls and v4.6 responsiveness remain. No additional OAuth scopes or new dependencies.
- **Cache-safe asset build:** Still two CSS and two JavaScript requests. Existing v4.7 styles are preserved, while the script bundles are versioned to v4.8 and checked against the original editable source files for byte-for-byte parity.
- **Real browser tests:** Added automated desktop Chromium and phone-sized WebKit tests for idle startup behavior and post-navigation loading, alongside the existing desktop/mobile audit and static checks.
- **Maintenance guide:** Explains deferred versus eager work and how to rebuild the compiled scripts for future changes without requiring local Node for end users.

**Scope and limitations:** This reduces unnecessary startup network and computation; JavaScript sources still download and parse eagerly. Real physical-device performance measurements are still required before claiming specific speedups. No Cloudflare deployment required.


## v4.7.0 · 2026-11-15 — Lean Launch: Performance-Focused Website Delivery

- **Four bundled resources:** The site now loads the existing 25 CSS sources as two ordered stylesheets and the existing 26 deferred JavaScript sources as two ordered script bundles. This reduces stylesheet/script network requests from **51 to four** without removing studios or altering their logic.
- **Original source retained:** Every individual source file remains in the repository, editable and available for independent module review. Bundle source order and CSS cascade order are maintained, with the exact manifest recorded in HTML.
- **Deterministic build safety:** New zero-dependency `scripts/lean-launch.mjs` checks that compiled assets match original sources byte-for-byte and that combined JavaScript parses. Stale bundles fail CI before release; rebuild with `--write` when future studio/source work happens.
- **Browser performance measurements:** Existing desktop Chromium and mobile Chromium/WebKit audits now enforce a two-CSS/two-JavaScript network budget and log browser navigation timings for comparison. Timings are diagnostic and not advertised as guarantees.
- **Compatibility:** The Assassin Dominion look, v4.6 responsive reliability fixes, all past studios, planning data keys, Battle.net verification, Cloudflare Worker and GitHub-to-Discord release system remain unchanged.
- **Maintenance documentation:** Instructions explain how future updates regenerate the combined resources using GitHub Actions or Node 22 without requiring players to install anything.

**Limitations:** Bundling primarily reduces network request overhead; the combined source bytes and studio initialization work remain. Real iPhone Safari and real-player acceptance testing are still needed before making device-specific speed claims. No Cloudflare editing required.


## v4.6.0 · 2026-11-15 — Device Reliability: Mobile & Desktop Experience Audit

- **Quick Deck focus recovery:** Favorite checkboxes now keep their keyboard focus after re-render, improving desktop accessibility and device interactions. Shortcuts for removed studio views no longer silently occupy the six-shortcut quota.
- **Mobile search and responsive navigation:** The grouped All Tools menu now resets visibility after re-opening. Resizing from phone to desktop clears the mobile-only filter, avoiding unexpectedly hidden sidebar categories or studios.
- **Browser-level regression:** A dedicated GitHub Actions workflow now exercises the hosted source via localhost in Chromium desktop and phone-sized Chromium/WebKit. Checks cover site initialization, error-free scripting, responsive overflow, Quick Deck, appearance persistence, modal dismissal, live release metadata, tool navigation and drawer search.
- **Physical-device test plan:** A separate checklist covers iPhone Safari and desktop behaviors that browser emulation cannot certify, including safe areas, real touch controls and manually verified connection awareness.
- **Security and compatibility:** Website-shell changes only. Existing studios, planning records, Blizzard sign-in, secure Cloudflare Worker, v4.4 appearance options, v4.5 personal quick links and Discord release flow are preserved.
- **Testing transparency:** Automated source and browser tests can catch regressions, but are not a benchmark of actual phone hardware, Blizzard account API access or live network latency.

**No Cloudflare deployment or customer software installation required.**


## v4.5.0 · 2026-11-15 — Sovereign Portal: Personalized Website Experience

- **My Quick Deck:** Customize up to six direct links to existing studios on Home. Shortcuts can be added, removed or restored without affecting any studio data. Favorites are saved locally to this device.
- **Website orientation:** Optional five-step tour introduces the redesigned home, navigation, private Battle.net connection boundaries, personal shortcuts and Sovereign Data Vault. First-time users see a small dismissible invitation rather than a blocking modal.
- **Page context:** Non-intrusive breadcrumb and Return Home control appear when viewing studios, giving desktop and iPhone users a reliable way back to their starting point.
- **Offline awareness:** When a device reports no connection, the site displays a clear note that public Blizzard research and release updates may not be available. No API health or continuous network monitoring is claimed.
- **Usability and accessibility:** Responsive quick-deck cards, keyboard-friendly tour, mobile safe-area support, focus states and reduced-motion styling.
- **Stability and privacy:** Preserves all existing studio scripts, saved character/collection/farming records, Cloudflare Worker, Battle.net connection, v4.4 appearance settings and Discord notification workflow. The new preference key stores website-only shortcut IDs and tour dismissal.
- **Release tests:** Extended the existing v4.4 website-shell suite and introduced v4.5 checks for shortcut limits, navigation integration, privacy, motion and accessibility.

**Notes:** This release updates website presentation and onboarding only. It does not implement account sync, game tracking, automatic offline support or additional studios. Real-device iPhone Safari and desktop acceptance testing remains recommended.


## v4.4.0 · 2026-11-15 — Sovereign Experience Engine

- **Cinematic home:** A redesigned welcome with meaningful entry points, clearer tool discovery, latest-release highlight and a recent-tools section. The old character/task/collection overview counters are preserved inside Home rather than displayed above every studio.
- **Smarter navigation:** Desktop sidebar grouped into Home & Discovery, Character & Builds, Items & Collections, Planning & Operations, and Data & Utilities, with optional collapsed groups. Existing studio buttons and iPhone All Tools search are reused, not replaced.
- **Appearance settings:** Site-wide shell accent choices (Assassin Gold, Dominion Violet, Astral Cyan), background intensity, compact navigation, higher contrast and reduced motion. All settings use an independent local preference key and do not change gameplay data.
- **Update center:** A header notification presents the latest verified website release number, highlights and recent release records by reading the existing published version and index manifests. Users can mark a version read on this device; no new backend or Discord webhook is necessary.
- **iPhone & PC experience:** Responsive home cards, keyboard-friendly modal dialogs, safe-area spacing, reduced-motion support and lightweight hover effects without new large assets.
- **Compatibility:** All v4.3 studios, Character Dominion, My Azeroth, Battle.net verification, Cloudflare Worker and existing saved player data remain unchanged. The website shell can be reverted independently.
- **Validation:** Added static regression checks proving no private OAuth endpoints or saved studio stores are accessed by the new shell.

**Notes:** This is a website experience release, not a new game studio. Local preference data and recent-navigation shortcuts do not synchronize automatically across browsers. Complete offline functionality is not claimed; live mobile/browser acceptance testing remains necessary.


## v4.3.0 · 2026-11-15 — Character Dominion: Unified Objectives & Armory Handoff

- **Character Dominion:** Choose any manually saved character to view high-priority objectives, completed targets and recent logged farming attempts in one responsive view. Counters and objectives remain based on local planning records.
- **Next objective:** Highlight the next open target by manual high/normal/later priority. Add a new goal from an existing Item Atlas record and mark goals complete or reopen them without changing underlying storage formats. Atlas records marked owned while their targets remain open are flagged for manual review, not silently corrected.
- **Public Armory research:** Open Live Armory with a chosen saved character prefilled. Once the player requests a public Blizzard profile, a small in-memory summary can appear in Character Dominion. This is not private account data, full inventory or proof of account ownership.
- **Direct portal handoff:** The secure My Azeroth character link now opens the corresponding Public Armory and provides an adjacent, explicit Save Character to My Planners button. Saving requires confirmation; URL data alone never proves a Blizzard session. The character query is removed from the address bar on arrival.
- **Reliable same-tab updates:** Existing Character Targets, Farming Operations and Item Atlas emit or consume local-only refresh events so the views stay in sync when a character or goal is saved.
- **Documentation and testing:** Added a Character Dominion entry in Information & Guide, corrected the Player Field Lab's outdated hardcoded report version, and expanded release regression tests.
- **Preservation:** No Cloudflare deployment, OAuth permission, database migration or change to current Battle.net verification is necessary. Existing v4.2 tools and records are preserved.

**Scope:** Manual planner intelligence and opt-in public Retail API lookups only; authenticated private WoW character and collection data stays on the Cloudflare-hosted My Azeroth portal. Real WoW account and iPhone acceptance testing remain necessary.


## v4.2.0 · 2026-11-15 — Player Field Lab & Planning Readiness

- **Player Field Lab:** Added a dedicated acceptance-testing section for players and friends with 12 tests for navigation, first-time onboarding, secure Battle.net verification, WoW character data, item and talent tools, mobile behavior, storage, and backups.
- **Private feedback:** Per-test outcome and optional notes are stored locally in this browser. Export a privacy-conscious text report by copying or downloading it. Personal notes and device category are optional; nothing is posted directly to Discord or any external service.
- **Planning Readiness:** Read-only summary of local character profiles, open item targets, farming sessions, manually marked Atlas-owned records, and open Loot Hunter goals. These counts do not represent Blizzard-confirmed equipment, ownership or gameplay progress.
- **Useful integrations:** Quick links to Character Dashboard, Character Targets, Loot Hunter/Farming Operations, and Sovereign Data Vault; direct shortcut from the Information & Player Guide.
- **Safe handling:** Clearing the Player Field Lab removes only its test results. Battle.net sessions, saved player goals, and other studios remain untouched.
- **Validation:** Added regression coverage for source boundaries, report opt-ins, local planning data, navigation and responsive UI.

**Compatibility and privacy:** No changes to the Cloudflare Worker, Blizzard scopes, account credentials, or existing player storage keys. Friends can test using their own accounts. The v4.1 Information & Player Guide remains available.


## v4.1.0 · 2026-11-15 — Player Information Center & Compatibility Guide

- **Dedicated information tab:** A searchable guide is now integrated directly into the main Azeroth interface on both PC and iPhone.
- **Getting started:** Nine checklist-based steps explain navigating the site, optional Battle.net sign-in, character research, item tracking, group planning and safe backups.
- **Feature reference:** Searchable descriptions and direct navigation for the existing studios, including which data is manually entered and which information Blizzard reports.
- **Real gameplay benefits:** Examples for dungeon/raid preparation, shared party plans, mount and item farming, gear/talent research and transferring saved plans between devices.
- **Compatibility transparency:** Separate current companion release metadata from the latest known official Retail patch reference (Midnight **12.1.5** as of November 15, 2026). Retail is the primary modern Blizzard API target, but version-by-version client support is not certified. Classic, PTR and beta connected data are not represented as supported.
- **Live release center:** The guide fetches the current published companion manifest and recent version history; it does not claim to detect the installed WoW client patch.
- **FAQ, security and roadmap:** Explains the account connection, short-lived verification, missing WoW data, manual versus reported ownership, local-only backup transfer and future development as exploration rather than promises.
- **Regression tests:** New checks preserve truthful patch framing, safe release metadata, guide routing and authentication privacy.

No new OAuth scopes, Cloudflare secrets, game modification or account access are introduced; v4.0 tools and stored records are preserved.


## v4.0.0 · 2026-11-15 — Sovereign Core: Reliability & Unified Experience

- **Sovereign Data Vault:** Generate one privacy-conscious JSON backup covering all supported browser-local planning modules. Inspect included records and selectively restore with explicit confirmation; missing or invalid sections are excluded. Encrypted Battle.net sessions, access tokens and private collections are never placed into backup files.
- **Connected Character Center:** From the first-party My Azeroth portal, players can open a Blizzard-reported character in public Armory. They may then explicitly add its selector to local Character Targets and Farming Operations. Imported URL values are **not** independently verified account ownership; the authenticated character listing always remains on the secure Cloudflare origin.
- **Verified source recovery:** Added a separately maintained reference Cloudflare Worker incorporating the validated v3.8.1 verification handoff. This GitHub source is not deployed automatically and contains no OAuth secrets; the currently tested Worker stays unchanged.
- **Reliability:** Gracefully handle damaged cross-tab Farming Operations records, refresh the dashboard after local character import, and correct initial My Azeroth account text synchronization.
- **Accessibility:** Avoid repeatedly announcing the 1-second verification timer to assistive technologies; preserve responsive iPhone and desktop layouts.
- **Navigation:** Group command-launcher discovery into meaningful categories and preserve favorites, recents, and original tools.
- **Release regression suite:** Add v4.0 syntax and integration checks for Data Vault, character handoff, existing authentication boundaries, and recovery Worker.

**Compatibility:** Existing v3.9 data and modules remain unchanged. A Cloudflare update is **not** required for the v4.0 web app; Worker source is archived as a recovery reference. No automatic cross-device cloud sync or OAuth identity export is claimed.


## v3.9.0 · 2026-11-15 — Assassin Dominion & Verified Connected Player

- **Interface v3.4.1:** Fixed desktop sidebar scrolling and redesigned iPhone navigation with bottom tabs, an all-tools drawer and responsive controls.
- **Assassin Dominion v3.5:** Added a darker visual identity, custom hooded-assassin artwork and iPhone Home Screen app icons.
- **Command Launcher v3.6:** Added fast tool search, pinned favorites, recent tools and Ctrl/Cmd+K support.
- **Unified Character Dashboard v3.7:** Combined manually saved character targets, loot goals, farming history and shortcuts into one dashboard without claiming Blizzard-verified item ownership.
- **Battle.net Verification v3.8–v3.8.1:** Added short-lived account verification proofs and corrected the flow for valid Battle.net accounts without WoW characters.
- **Connected Player v3.9:** Displays verified account region, last verification, expiration countdown and easy recheck. Short-lived receipts can be revalidated on refresh; no permanent green status or OAuth tokens stored in GitHub Pages.
- **Release notifications:** Synced the version manifest and release validation to v3.9.0 so new validated versioned releases can reach the configured Discord webhook.

**Notes:** v3.5–v3.9 website upgrades are consolidated into this single release record. The first-party Cloudflare verification Worker must be deployed separately for live authentication. Azeroth remains an unofficial fan companion; account ownership and saved manual goals are distinct.


## v3.4.0 · 2026-11-14 — Progress Command

- Added **Progress Command**: one responsive, read-only view across Item Atlas, Character Targets, Loot Hunter and Farming Operations.
- Summarizes items manually marked owned, open/completed targets, Loot Hunter goals, and Farming Operations session attempts without altering or conflating their underlying sources.
- Shows per-character open priorities and manual session totals; filters open objectives and links back to the originating studios.
- Highlights assignments whose item no longer exists in Atlas, open targets for items manually marked owned, and overlapping Atlas/Loot Hunter records as **review suggestions**, never automatic corrections.
- Supports an aggregate JSON **read-only progress summary** export (counts, character totals, discrepancy counts). No Blizzard tokens or account profile payloads.
- Preserves all v3.3 modules, prior data formats and account privacy boundaries.
- **No Cloudflare update needed**: v3.4 uses existing browser-local storage and does not change Blizzard endpoints.

## v3.3.0 · 2026-11-14 — Character Progression (Cloudflare deployment required)

- **My Azeroth Equipped Gear:** signed-in players can select their own account-listed character and request Blizzard-reported currently equipped gear using a protected, first-party Cloudflare endpoint. The Worker verifies the character belongs to the authorized Battle.net account before retrieving gear. This is **not** full inventory, banks, bags, or real-time ownership.
- **Character Targets:** a separate browser-local planner for assigning Item Atlas records to characters imported from Farming Operations or added manually. Includes high/normal/later priorities, manual completion, notes and its own JSON export/import.
- No transfer of Blizzard access tokens, account listings, or equipment data from the Worker portal to public GitHub Pages. Character Targets are manually managed and never claim Blizzard-confirmed ownership.
- **Armory Command Bridge repair:** fixed old v2.8 section selector initialization so the existing Armory → Loot Hunter workflow can load.
- Existing v3.2 Item Atlas, v3.1 Collection Intelligence, saved browser-local records, and all previous modules are preserved.

**Deployment gate:** update the Cloudflare Worker first (see `backend/CHARACTER-PROGRESSION-v3.3-DEPLOY.md`), then merge the v3.3 GitHub PR. The new endpoint is `/api/me/equipment?realm=...&name=...`. No new encrypted secrets or Blizzard scopes are necessary. Real-account gear and player UI tests are deferred to the saved Player Testing Guide.

## v3.2.0 · 2026-11-14 — Universal Item Atlas (Backend-Gated)

- Introduced **Universal Item Atlas** for official Blizzard item-name search, numeric item-ID lookup, and personal tracking.
- Name search supports bounded pages (up to 50 pages of 20); Blizzard's underlying search index can cap results. Searches are not a complete enumeration of all obtainable or historical WoW items.
- Players can save an officially resolved item with status **Wishlist**, **Farming**, **I own this (manual)**, or **Archived**. This does not assert account ownership.
- Up to 5,000 manually saved item records per browser with notes, filtering, and independent JSON export/import.
- Item records link to Item Codex; old personal wishlist and Loot Hunter progress remain preserved.
- Existing authenticated Collection Intelligence stays isolated on Cloudflare; no account data or tokens are copied to the public tracker.
- **Deployment gate:** publish v3.2 Worker before merging public release. No new encrypted secrets or Battle.net permissions.

## v3.1.0 · 2026-11-14 — Collection Intelligence (Deployment-Gated)

- Added **Collection Intelligence** to the first-party Cloudflare **My Azeroth** portal.
- Compare the authorized Blizzard account's full returned mount collection with a small curated list: **Invincible** and **Ashes of Al'ar**, through exact normalized mount-name matching.
- Show **Reported Owned** only for a name present in the Blizzard response; show **Not Confirmed** for an absent name. If Blizzard's collection endpoint fails or omits a usable collection, report **Unavailable / Unknown**, never missing.
- No access tokens, personal ownership records or account information are copied into GitHub Pages, localStorage or another user's browser.
- Existing login, public Armory, Talent Forge, Loot Hunter and Farming Operations remain unchanged.

**Deployment gate:** Update the single-file Cloudflare Worker source before merging the website release. The new endpoint is `/api/me/collection-intelligence` and requires an existing secure My Azeroth session. No new Cloudflare secrets or Blizzard scopes are required. Confirm actual results with World of Warcraft players; see the Player Testing Guide.

## v3.0.0 · 2026-11-14 — My Azeroth (Release Candidate)

- **Personal Battle.net sign-in:** separate first-party Cloudflare Worker account portal with Blizzard OAuth authorization-code consent and `wow.profile` scope.
- **Secure sessions:** encrypted, short-lived first-party cookies; protected Blizzard account information never goes to GitHub Pages or localStorage.
- **Personal characters:** discover characters Blizzard reports for the signed-in account and jump into the existing public Live Armory.
- **My collections:** read-only totals and examples for mounts and pets when Blizzard supplies them.
- **Privacy by design:** explicit disclosures, session disconnect, no account database, and no password collection.
- **Preservation:** all v2.9 features, public Armory, Talent Forge, farming plans and saved browser-local records remain untouched.

**Deployment gate:** Do not merge or announce this release until the new Cloudflare Worker module is deployed with `AZEROTH_SESSION_SECRET` and the exact Battle.net OAuth callback is registered. See `backend/BATTLENET-PORTAL-DEPLOY.md`. The public v2.9 app remains stable until that verification.

## v2.9.0 · 2026-11-14 — Character Farming Operations

- **Character-specific farm planning:** assign existing Loot Hunter goals to any combination of manually added characters, with optional import of saved public Armory shortcuts.
- **Manual session ledger:** track date, character, item, attempt count (1–100 per session), and optional personal note for each farming run.
- **Useful filters and metrics:** view assigned goals by character, obtained/open status, recorded sessions and session attempts.
- **Dedicated backup:** independently export or import assignment and session data without replacing existing Loot Hunter goals, item wishlists or progress.
- **Compatibility:** retains all v2.8 Armory Command Bridge, Talent Forge, prior modules, and existing Cloudflare API configuration.

**Important:** The new session ledger is separate from Loot Hunter's legacy total attempts. Session records do not automatically increase the global Loot Hunter attempt counter. Farming progress and character assignments are manual and browser-local; they are not validated against in-game drops, saved instance lockouts, or account activity.

## v2.8.0 · 2026-11-14 — Armory Command Bridge

- **Connected gear planning:** one-click TRACK GOAL action for live equipped items, official Blizzard Item Codex results, searchable item records, saved wishlist and inspection history.
- **Shared progress:** all tracking actions write through the existing Loot Hunter goal logic, preserving manual attempts, completion and notes. Duplicate item IDs do not create duplicate farm goals.
- **Public character shortcuts:** save and reload previously retrieved public ASCII character profiles in the same local browser; no Blizzard account authorization or credentials are stored.
- **Armory and Loot Hunter dashboard:** view existing wishlist items, open farming goals and items not yet tracked.
- **Mobile-conscious layout:** compact responsive controls for desktop and iPhone.
- **Preservation:** all earlier studios including the v2.7.1 Talent Tree fix, existing data formats, and the Cloudflare Worker remain unchanged.

Saved shortcuts and farm goals are browser-local, and a TRACK GOAL button does not assert that a target is actually obtainable from a particular boss or that the character owns the item.

## v2.7.1 · 2026-11-14 — Tree Layout Reliability Patch

- **Fixed reported PC issue:** selecting Tree mode no longer automatically switches the entire talent view to compact cards when Blizzard returns overlapping, missing or out-of-range display coordinates.
- **Collision-safe placement:** unique talent nodes are assigned separate visual cells, keeping valid unique Blizzard coordinates unchanged where possible.
- **Transparent adjustment labels:** repositioned nodes show `POSITION ADJUSTED` while original Blizzard row/column metadata remains visible.
- **Regression coverage:** tests cover duplicate coordinates, absent positions and unique visual placement.
- **No migration:** Talent Forge drafts and local storage, path diagnostics, other Warcraft tools and Cloudflare Worker remain untouched.

The adjusted tree is a visual planner, not Blizzard's canonical layout. Missing source metadata and talent path eligibility are not inferred.

## v2.7.0 · 2026-11-14 — Talent Path Intelligence

- **Source-aware path dashboard:** displays manually planned talents, source-linked nodes with ranks on both ends, zero-rank upstream review flags, and references not resolved within the current talent category.
- **Upstream path explorer:** selecting RELATIONS inspects upstream talent nodes through Blizzard-reported `locked_by` references; traversal is cycle-safe and depth-limited.
- **Review-only filter:** optionally focus the tree on planned talents whose source-reported incoming link has no manually planned ranks at the other end.
- **Faithful data separation:** no invented dependency edges, prerequisites or item information. An apparent missing upstream allocation is a review prompt, not proof a talent is locked or invalid in-game.
- **Persistence:** all existing v2.3–v2.6 talent drafts retain their previous JSON format and local storage key. Prior Warcraft studios remain available.

**Important limits:** Blizzard API talent data may be incomplete or contain cross-category references. This release does not validate actual talent budgets, prerequisites, levels, hero paths or in-game loadout import strings. No Cloudflare Worker changes are required.

## v2.6.0 · 2026-11-14 — Talent Connections

- **Reported talent links:** display connections based on the `locked_by` node IDs in Blizzard's response, where these are provided.
- **Node inspector:** click RELATIONS on a talent to see which visible nodes it reports as locked by, which other nodes report a link to it, and whether any references cannot be resolved.
- **Visual tree paths:** draw optional lines across the Blizzard position-aware talent grid, with highlighted relationships around the selected talent.
- **Honest data reporting:** unresolved or absent relationships are explicitly described as unknown. No guessed prerequisite, rank, level, required-point, or hero-unlock rules.
- **Preservation:** v2.3–v2.5 saved drafts and local storage stay compatible; existing Warcraft tools and Cloudflare API remain unchanged.

**Scope:** The relationship display is not a WoW game-valid build verifier. Certain Blizzard talent-tree records may omit connections or reference nodes outside the current class/spec/hero category. No new Worker deployment is required.

## v2.5.0 · 2026-11-14 — Talent Intelligence

- **Hero tree selector:** independently display the separate hero talent groups returned by Blizzard for a loaded specialization, without losing other hero tree data.
- **Saved draft comparison:** compare the active ranks with a previously saved draft of the same specialization; highlight increases and decreases and summarize planned changes.
- **Source-aware nodes:** display Blizzard's `default_points` when supplied, while avoiding invented point totals or talent rules.
- **Layout resilience:** if real nodes omit position data, share a location, or exceed supported bounds, switch to compact cards instead of overlapping in the visual tree.
- **Safer asynchronous browsing:** prevent stale talent-index responses from replacing another region's list.
- **Preservation:** existing v2.3/v2.4 JSON draft format and local storage key, all prior Warcraft studios, and Cloudflare gateway endpoints remain unchanged.

**Important:** The updated Forge does not validate Blizzard's actual prerequisites, character levels, talent point limits, or import codes. Build comparisons are informational, not recommendations or game-legal simulations. This is a GitHub-only frontend release; no Cloudflare Worker replacement is required.

## v2.4.0 · 2026-11-14 — Talent Forge Overdrive

- **Position-aware visual layout:** arranged official Blizzard talent nodes according to supplied display rows and columns, with horizontal scrolling for wide talent layouts.
- **Focused research tools:** node search, compact cards, and optional shorter descriptions.
- **Draft history:** undo and redo recent rank and choice edits. Existing saved builds retain their exact v2.3 storage format.
- **Planning reminder:** choose a personal point threshold and receive a warning if the draft exceeds it. The threshold is not a real Blizzard point cap or prerequisites check.
- **Compatibility:** saved talent drafts, JSON transfers, other Warcraft studios, and existing encrypted Cloudflare Worker secrets are preserved.

**Limitations:** positional information may be missing for some talent nodes, causing overlap or unstructured placement. Point allocations are planning drafts, not verified legal in-game talents or importable talent codes. No Cloudflare Worker replacement is required for this frontend-only upgrade.

## v2.3.0 · 2026-11-14 — Talent Forge

- **Blizzard talent exploration:** retrieve Retail specialization talent trees and browse their class, spec, and hero nodes when supplied by the official API.
- **Interactive draft builder:** plan rank investments and choice nodes against the retrieved talent reference data.
- **Saved drafts:** name and store up to 40 independent planning builds in browser storage, with JSON export/import.
- **Secure integration:** uses the existing Cloudflare Blizzard gateway; no client credentials or OAuth tokens in public website code.
- **Preservation:** retained existing item-name search, Loot Hunter, character Armory, Party Architect, progression studios, and saved profiles.

**Limitations:** Talent allocations are manually planned and not validated against Blizzard's current in-game prerequisite, level, hero-path, or point-budget rules. JSON drafts are not in-game import strings. Talent availability depends on Blizzard's API completeness and the installed v2.3 Worker.

## v2.2.0 · 2026-11-14 — Loot Hunter

- **Acquisition guide explorer:** four documented legacy collectible/legendary acquisition routes with per-item source links, explicitly distinguished from Blizzard's official game data.
- **Farm tracker:** user-managed attempts, obtained status, notes, and acquisition checklist.
- **Wishlist import:** turn existing Item Codex wishlist entries into farming goals; items without verified acquisition guides are marked unverified.
- **Item Codex integration:** inspect any farm goal using the existing real Blizzard item-ID API.
- **Portability:** export and import the independent Loot Hunter JSON plan, without touching prior character, build, collection or planner data.

Guides may become outdated as game versions change. Players should check each linked source and confirm in-game requirements, availability and raid lockout rules. Progress is manual, not connected to Blizzard account activity.

## v2.1.0 · 2026-11-14 — Item Discovery

- **Official item name search:** search Blizzard's current Retail item database by name rather than numeric ID alone.
- **Clickable search results:** open results directly inside the detailed Item Codex.
- **Item imagery:** show Blizzard item icons whenever the game's media endpoint provides them.
- **Backwards compatible:** existing Armory, equipment inspector, item-ID lookups, wishlist, character plans and every prior studio remain available.
- **Secure gateway:** compatible with the separately deployed v2.1 Cloudflare Worker; Blizzard credentials stay in encrypted Cloudflare secrets.
- **Versioned release:** independent changelog and automatic Discord announcements after validation.

**Limits:** Search results depend on Blizzard's index and regional locale. Item acquisition locations, fully validated talent builds, authenticated account linking, cross-device account saves and production-grade abuse mitigation are not included.

## v2.0.0 · 2026-11-14 — Connected Armory & Item Codex

- **Live Character Armory:** official Retail character profiles retrieved by region, realm slug and character name.
- **Equipment Inspector:** show equipped item names, levels and item IDs, with direct item lookup.
- **Blizzard Item Codex:** live item ID lookups with preview stats, effects and item requirements where supplied.
- **Saved items:** personal wishlist and recent item history, stored locally with the existing independent save sets preserved.
- **Resilience:** API timeouts and missing data produce clear errors; no invented items or current-patch meta advice.
- **Integration:** securely connects to the previously deployed Cloudflare gateway without browser-side Blizzard credentials.

**Important limits:** This version does not provide name-based item searching, verified loot source locations, OAuth login, talent validation, or item icon images. These will require backend/data catalog upgrades. Read-only public character data can lag behind in-game updates. The Cloudflare Worker must remain deployed and reachable for connected features to work.

## v1.2.0 · 2026-11-14 — Party Architect / Player Utility Expansion

- Build five-player groups using current class and specialization options, including Devourer Demon Hunter.
- Check expected 1 tank / 1 healer / 3 damage party distribution and common class utility examples.
- Export, import or copy party compositions to coordinate with teammates.
- Track per-character dungeon, raid and world activity counts with fully adjustable goals and manual reset.
- Pull selectable character names from the existing Genesis character roster without rewriting old saves.
- Add a curated quick-reference portal to official Blizzard pages and external Warcraft resources.
- Deliver desktop/iPhone-specific responsive panels without changing prior modules.

**Notes:** These tools assist planning and are not automatic WoW API or combat integrations. Activity targets are user-defined, not validated Great Vault thresholds. All existing v1.0 and v1.1 data is retained.

## v1.1.0 · 2026-11-14 — Warcraft Overdrive

- **War Room:** weekly objectives and saved raid encounter plans.
- **Dungeon Routes:** ordered route steps and copy-to-clipboard sharing.
- **Profession Profit Lab:** material-cost and fee-adjusted estimated profitability using manual prices.
- **Gear Analyzer:** user-defined stat-weight comparison, saved locally.
- **Release Center:** version manifest, history, check for updates and game-specific release notes.
- **Warcraft presentation:** expanded responsive gold/teal UI and dedicated studio navigation.
- **Advanced data:** JSON backup/import for the new game-specific studios. The existing v1.0 profiles, builds, collections and checklists are preserved.

No Blizzard login, live data, combat automation or current-game performance claims. The app is an unofficial companion.

## v1.0.0 · 2026-11-14 — Genesis

Character profiles, saved builds, progression checklists, collection tracking, local JSON export/import and responsive foundation.
