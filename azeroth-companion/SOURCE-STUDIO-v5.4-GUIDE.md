# NEXUS | AZEROTH COMPANION — v5.4 Source Studio

## Website
The existing GitHub Pages site contains two side-by-side comparisons under Talent Forge's source intelligence area:

- Talent A vs Talent B: official node/talent/spell IDs, available rank descriptions, manual point allocations.
- Item A vs Item B: official item IDs, returned item fields and per-stat numeric deltas only when BOTH records include valid numeric values.

Comparisons are research aids, **not** real combat simulations, build-validation engines, or gearing recommendations.

## Blizzard spell icons — optional Worker update

Spell images are *not* available from GitHub Pages alone. The optional `GET /api/spell-media/{region}/{spellId}` route must first exist on the active Cloudflare Worker. Otherwise the website displays a graceful unavailable status and keeps comparisons functional.

A complete additive Worker reference for v5.4 is:

`azeroth-companion/backend/worker-v5.4-spell-media-reference.js`

Before deploying:

1. Back up **the live Cloudflare Worker script**, including any subsequent hand edits. Do **not** overwrite newer functionality with this reference without comparing it first.
2. Locate its **existing authenticated API route dispatcher**, which already handles `/api/media/{region}/{itemId}`, `/api/talent-tree`, and the personal Battle.net account portal. Add only the new region-validated `/api/spell-media/{region}/{positive numeric spellId}` mapping to `/data/wow/media/spell/{spellId}`. Use the same existing private Blizzard OAuth app credentials and static namespace, the same output filtering as `/api/media`, and the same CORS/error handling.
3. If and ONLY if the live script matches the v4 reference and contains no newer changes, the bundled v5.4 reference can serve as a full replacement. **Never** put Blizzard secrets or OAuth tokens into GitHub Pages code.
4. Deploy through the existing Cloudflare Worker workflow and check `/health`. Then check a *verified* spell ID through `/api/spell-media/us/{spellId}`. A successful response has `success:true` and a Blizzard-returned `data.assets` array containing an `icon` key and HTTPS `url`.
5. Open Talent Forge, load a specialization, and scroll some talent nodes into view. Icons load lazily, at most three concurrent requests. If a specific spell is unavailable, the decorative glyph remains.

The Worker cannot be deployed from the GitHub Pages release. The public website is safe to deploy independently; no existing authentication routes need changing for the comparison features.

## Testing and integrity

- Browser tests use **synthetic** mock Blizzard data only; they do not validate live API availability or real game loadout legality.
- Current builds, recovery keys, saved draft JSON format, talent rank controls, hero-tree selection, and v5.3 canvas pan/zoom must remain unchanged.
- Both new sources are included in the pre-existing **two CSS + two JS compiled bundles** through `scripts/lean-launch.mjs`.
- All available official imagery may be missing or occasionally mismapped by the upstream API; the exact returned spell IDs are always available in the source panel when Blizzard supplies them.
