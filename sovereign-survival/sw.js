/* SOVEREIGN SURVIVAL Character Ascension — static application shell only, never personal content. */
const CACHE='proximus-sovereign-survival-treasury-v2.1';
const SHELL=['./','./index.html','./style.css','./warbound-v1.1.css','./nightfall-v1.2.css','./armory-v1.3.css','./awakening-v1.4.css','./expeditions-v1.5.css','./legacy-v1.6.css','./ascension-v1.7.css','./vanguard-v1.8.css','./touchfix-v1.8.1.css','./dominion-v1.9.css','./eternal-v2.0.css','./treasury-v2.1.css','./treasury.js','./treasury.js?v=2.1.0','./legacy.js','./legacy.js?v=2.1.0','./progression.js','./warbound-scene.svg','./game.js','./game.js?v=2.1.0','./core.js','./core.js?v=2.1.0','./renderer.js','./renderer.js?v=2.1.0','./progression.js?v=2.1.0','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('proximus-sovereign-survival-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  if(request.mode==='navigate'){
   try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok)await cache.put('./index.html',response.clone());
    return response;
   }catch{
    return await cache.match('./index.html')||Response.error();
   }
  }
  const saved=await cache.match(request);
  if(saved)return saved;
  try{
   const response=await fetch(request);
   if(response.ok&&response.type==='basic')await cache.put(request,response.clone());
   return response;
  }catch{return Response.error()}
 })());
});
