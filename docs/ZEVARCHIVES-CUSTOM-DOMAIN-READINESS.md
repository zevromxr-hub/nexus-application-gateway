# NEXUS | ZevArchives.com — Domain Migration Readiness (NOT DEPLOYED)

## Current state (November 2026)
- `zevarchives.com` purchased and verified successfully in the `zevromxr-hub` GitHub user's Pages settings.
- Current public site: `https://zevromxr-hub.github.io/nexus-application-gateway/`.
- Planned custom-domain project site: `https://zevarchives.com/`.
- Project paths will be `/azeroth-companion/`, `/hub/`, `/alchemist/`, and `/character-foundry/` **without** the former `/nexus-application-gateway/` prefix.
- The repository root `index.html` currently hosts the original Sonic Reactor II desktop launcher. Do **not** silently replace it with a new homepage without preserving the desktop launch behavior.
- This branch only stages source compatibility and tests. No GitHub Pages custom domain, DNS A/CNAME, Cloudflare Worker deployment, or OAuth setting has been modified.

## Why a direct switch was unsafe
The most recent single-file Worker source (`backend/worker-v7.9.4-single.js`) contained strict CORS and account-status receipt checks for `https://zevromxr-hub.github.io` only. Those checks would reject a new-domain browser. The site's locally saved plans/preferences and sessionStorage belong to the **old browser origin** and do not automatically migrate.

## Staged compatibility changes
- Worker accepts exactly two public browser origins: the existing `https://zevromxr-hub.github.io` and the new `https://zevarchives.com`; unknown origins are explicitly rejected.
- Worker CORS uses the matched origin **per request**, never reflecting an arbitrary request Origin and never sharing mutable per-request state.
- Account receipt `aud` must match the allowed origin's exact companion URL; signed receipts from one origin cannot be replayed through the other.
- `/account/verify-companion?site=zevarchives` creates a signed receipt returning to the custom-domain companion. The existing route without that parameter still returns to the original site.
- The public `verified-connection.js` automatically requests the new return target only if `location.origin==='https://zevarchives.com'`. The old site's behavior remains unchanged.
- No Blizzard secrets, API keys, localStorage migrations, account cookies or customer records were changed.
- `tests/zevarchives-domain-readiness.test.mjs` probes the Worker source in an isolated Node runtime without Blizzard API requests or secrets. Its tests are included in GitHub Release Validation.

## Remaining blockers before changing the live address
1. **Confirm the live Cloudflare Worker version**. GitHub contains multiple preserved Worker references; editing GitHub does NOT redeploy Cloudflare Workers. The live Worker must be backed up and compared with this staged v7.9.4 source. Never overwrite deployed secrets.
2. The secure `/account` portal contains an older default **VERIFY & RETURN** link, which still targets the legacy origin after a login; a seamless portal-to-custom-domain return requires additional live flow testing and potentially a persistent explicit site-selection mechanism. The staged homepage's CHECK CONNECTION link is new-domain aware, but full login UX is not yet acceptance-tested.
3. Test real Battle.net sign-in, the verified receipt, public item/talent/character API requests, browser back navigation, and mobile Safari on the new host. Keep both origins authorized during transition.
4. On the existing GitHub URL, export saved personal builds/settings through the existing Data & Backup tools before the switch. Import after the branded site is live. `localStorage` cannot be copied between origins by just changing DNS.
5. Audit published external URLs (Discord announcements, deep links, app shortcuts), optional Google Search indexing, and Cloudflare Worker routes.
6. Confirm the repository's GitHub Pages deployment source and custom-domain setting in **Settings → Pages**; those account-level controls are not available as direct write actions through the current GitHub connector.
7. Do not enable HTTPS enforcement until GitHub has issued a certificate for the new domain.

## Eventual owner-controlled cutover (NOT NOW)
A. Preserve a rollback of `main` and the current Worker deployment.
B. Merge a separately tested/approved compatibility PR; then update the Worker through Cloudflare's editor only after reviewing the active version and preserving its encrypted secrets. Test the old host remains functional.
C. In repository **Settings → Pages → Custom domain**, save `zevarchives.com`.
D. In Cloudflare DNS for `zevarchives.com`, add the four GitHub Pages apex A records (one record per address): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Leave them **DNS only** initially. Optionally set `www` CNAME to `zevromxr-hub.github.io` (DNS only) to support the www variant. Retain the TXT verification record.
E. Check DNS propagation and GitHub Pages certificate, then enable **Enforce HTTPS** when available.
F. Test `https://zevarchives.com/azeroth-companion/` and other project routes. Recheck account status with a fresh new-domain receipt. Test old-URL redirect behavior; preserve legacy and do not prematurely remove old links.
G. Restore backups on new origin where needed. Publish updated links only after successful acceptance.

GitHub documentation:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

**POWERED BY ZEVRO | NEXUS**
