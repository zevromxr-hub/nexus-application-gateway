# NEXUS | AZEROTH COMPANION — Cloudflare spell-media minimal patch

## Critical: preserve the live Worker

The site is hosted on GitHub Pages, but `nexus-azeroth-api.zevromxr.workers.dev` is a separately deployed Cloudflare Worker. A GitHub merge **does not** deploy it.

**Do not replace the live Worker using the GitHub `worker.js` file, `wrangler.toml`, or the bundled v5.4 reference unless you have first verified they contain every existing auth route and local change.** GitHub's `backend/worker.js` is an older stripped-down API source; the live Worker may have since diverged.

1. In the Cloudflare dashboard, open Workers & Pages → `nexus-azeroth-api` → Edit code.
2. Copy the currently deployed script to a private local backup first. Keep Cloudflare's rollback available.
3. Locate the existing public API dispatcher, which should already handle `type==='media'`, `type==='talent-tree'`, etc. The **minimal additive patch** to the existing v4-shaped dispatcher is:

```diff
- if((type==='item'||type==='media')&&p.length===4&&goodId.test(arg)){
-   path=type==='media'?'/data/wow/media/item/'+arg:'/data/wow/item/'+arg;namespace='static';
+ if((type==='item'||type==='media'||type==='spell-media')&&p.length===4&&goodId.test(arg)){
+   path=type==='spell-media'?'/data/wow/media/spell/'+arg:type==='media'?'/data/wow/media/item/'+arg:'/data/wow/item/'+arg;namespace='static';
  }
```

And later in the **response serialization** block:

```diff
- if(type==='media'){
+ if(type==='media'||type==='spell-media'){
    data={id:Number(arg),assets:(Array.isArray(data.assets)?data.assets:[])
      .filter(a=>a&&a.key&&typeof a.value==='string'&&/^https:\/\//.test(a.value))
      .slice(0,10).map(a=>({key:a.key,url:a.value}))};
  }
```

The second patch matters: the frontend expects `assets[].url`, not Blizzard's raw `assets[].value`. Do **not** change the public response contract for existing item media. `goodId` must remain positive digits (max 10) and the supported region allowlist must stay intact.

4. Ensure the public route uses the preexisting OAuth app **server-side** credentials, the `static-{region}` namespace, the previous API's CORS policy and error format. Do not change `/auth/*`, `/account`, `/api/me/*`, encryption secrets, cookies, OAuth scopes, or client credentials.
5. Press Deploy. If verification fails, roll back through Cloudflare Deployments.

## Verification — use non-secret URLs only

Open these in a browser after deployment:

- Health: https://nexus-azeroth-api.zevromxr.workers.dev/health
- Existing item: https://nexus-azeroth-api.zevromxr.workers.dev/api/item/us/19019
- Existing item image: https://nexus-azeroth-api.zevromxr.workers.dev/api/media/us/19019
- Talent tree index: https://nexus-azeroth-api.zevromxr.workers.dev/api/talent-index/us
- New spell image: https://nexus-azeroth-api.zevromxr.workers.dev/api/spell-media/us/116
- Battle.net portal: https://nexus-azeroth-api.zevromxr.workers.dev/account

The new spell result should return `success:true`, `data.id:116`, and `data.assets` containing an entry with `key:"icon"` and an HTTPS `url`, **if Blizzard currently provides spell media for that ID**. Check another actual spell ID from the current talent tree if one is absent.

Then verify private sign-in and logout in the same browser. Never post authentication cookies, client secrets, authorization codes, or token-bearing URLs in GitHub issues or chat.

## Reference code

`backend/worker-v5.4-spell-media-reference.js` demonstrates the complete mapped route but is **not proven to match the currently deployed Worker**. Only use it as a safe reference to the two additive changes, unless a full diff proves replacing the live Worker is appropriate.

## Frontend

v5.4.1 removes repeated DOM writes for a missing icon so the browser no longer needlessly reprocesses tree mutations. It remains a client-side fix; it cannot enable server-side spell media by itself.
