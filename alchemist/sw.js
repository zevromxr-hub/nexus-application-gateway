/* NEXUS Asset Alchemist v1.0 — scoped offline cache. No private files cached. */
const CACHE='nexus-alchemist-v1.0.0';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.js','./image-tools.js','./media-tools.js','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nexus-alchemist-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin||!url.pathname.includes('/alchemist/'))return;
 event.respondWith(fetch(event.request).then(resp=>{if(resp.ok){const clone=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,clone)).catch(()=>{})}return resp}).catch(()=>caches.match(event.request)));
});
