/* PROXIMUS Asset Alchemist v2.0.0 — controlled offline application cache.
 * Browser source only. Never caches a user's imported files. */
const CACHE='proximus-alchemist-v2.0.0';
const ASSETS=['./','./index.html','./style.css','./app.js','./core.js','./image-tools.js','./media-tools.js','./pro-tools.js','./version.json','./icon.svg','./manifest.webmanifest'];
const SCOPE=new URL('./',self.location.href).pathname;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nexus-alchemist-')||k.startsWith('proximus-alchemist-')).filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;
 const key=new Request(url.origin+url.pathname,{method:'GET'});
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(req,{cache:'no-store'});
   if(response.ok&&response.type==='basic')await cache.put(key,response.clone());
   return response;
  }catch(err){
   const cached=await cache.match(key);
   if(cached)return cached;
   if(req.mode==='navigate'){const home=await cache.match(new Request(new URL('index.html',self.location.href).href));if(home)return home;}
   throw err;
  }
 })());
});
