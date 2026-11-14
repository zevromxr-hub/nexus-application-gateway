/* PROXIMUS Asset Alchemist v3.5.2 — controlled offline application cache.
 * Browser source only. Never caches a user's imported files. */
const CACHE='proximus-alchemist-v3.5.2';
const ASSETS=['./','./index.html','./style.css','./overdrive.css','./app.js','./overdrive-core.js','./entertainment-overdrive.js','./sonic-dimension.js','./sonic-dimension.css','./cinema-clarity.css','./cinema-clarity.js','./music-library-core.js','./music-library.js','./arcade-daily.js','./core.js','./media-tools.js','./layout-adapter-core.js','./layout-adapter.js','./animation-tools.js','./media-suite-core.js','./life-command-core.js','./life-command.js','./video-vault-core.js','./video-vault.js','./mobile-navigation.js','./gif-codec.js','./gif-reader.js','./media-publisher.js','./visual-identity-core.js','./visual-identity.js','./reactor-iv.js','./companion-core.js','./command-center.js','./workspace-sync.js','./release-guard.js','./media-theater.js','./reactor-dsp.js','./reactor-studio.js','./token-crypto.js','./token-foundry.js','./arcade-chamber.js','./release-center.js','./workflow-desk.js','./utility-forge.js','./portable-kit.js','./project-hub.js','./automation-lab.js','./capture-studio.js','./document-forge.js','./qr-studio.js','./recovery-center.js','./version.json','./releases/v3.5.2.json','./releases/v3.5.1.json','./releases/v3.5.0.json','./releases/v3.4.0.json','./releases/v3.3.0.json','./releases/v3.2.1.json','./releases/v3.2.0.json','./releases/v3.1.0.json','./releases/v3.0.2.json','./releases/v3.0.1.json','./releases/v3.0.0.json','./releases/index.json','./releases/v2.9.0.json','./releases/v2.8.0.json','./releases/v2.7.0.json','./releases/v2.6.0.json','./releases/v2.5.0.json','./releases/v2.4.0.json','./releases/v2.3.0.json','./releases/v2.2.0.json','./releases/v2.1.0.json','./releases/v2.0.0.json','./releases/v1.0.0.json','./icon.svg','./manifest.webmanifest'];

const SCOPE=new URL('./',self.location.href).pathname;
const CONTROL='proximus-alchemist-cache-control';
const CONTROL_URL=new URL('cache-selection',self.location.href).href;
const isBuild=name=>/^proximus-alchemist-v\d+\.\d+\.\d+$/.test(name);
const compareBuild=(a,b)=>{
 const x=a.replace('proximus-alchemist-v','').split('.').map(Number);
 const y=b.replace('proximus-alchemist-v','').split('.').map(Number);
 for(let i=0;i<3;i++)if(x[i]!==y[i])return y[i]-x[i];
 return 0;
};
async function buildNames(){return (await caches.keys()).filter(isBuild).sort(compareBuild);}
let activePromise=null;
function chosenBuild(){
 if(activePromise)return activePromise;
 activePromise=(async()=>{
  const store=await caches.open(CONTROL),record=await store.match(CONTROL_URL),name=record?await record.text():CACHE;
  return (await buildNames()).includes(name)?name:CACHE;
 })();
 return activePromise;
}
self.addEventListener('install',event=>{
 // All required release files must be fetched before the new worker activates.
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await buildNames(),keep=new Set([CACHE,...names.slice(0,2)]);
  const keys=await caches.keys();
  for(const key of keys)if((isBuild(key)||key.startsWith('nexus-alchemist-'))&&!keep.has(key))await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 const data=event.data||{},reply=value=>event.ports[0]?.postMessage(value);
 event.waitUntil((async()=>{
  try{
   const names=await buildNames();
   if(data.type==='PROXIMUS_LIST_CACHES'){
    reply({ok:true,names,active:await chosenBuild(),latest:CACHE});return;
   }
   if(data.type==='PROXIMUS_RESTORE_CACHE'){
    if(!names.includes(data.name)||data.name===CACHE)throw Error('Select a previously cached version.');
    const archive=await caches.open(data.name);
    if(!await archive.match(new URL('index.html',self.location.href).href))
     throw Error('Selected fallback is incomplete.');
    const control=await caches.open(CONTROL);
    await control.put(CONTROL_URL,new Response(data.name,{headers:{'Content-Type':'text/plain'}}));
    activePromise=Promise.resolve(data.name);
    reply({ok:true,active:data.name});return;
   }
   if(data.type==='PROXIMUS_USE_LATEST'){
    const control=await caches.open(CONTROL);await control.delete(CONTROL_URL);
    activePromise=Promise.resolve(CACHE);
    reply({ok:true,active:CACHE});return;
   }
   reply({ok:false,error:'Unsupported cache command'});
  }catch(error){reply({ok:false,error:String(error.message||error)});}
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(SCOPE))return;
 const key=new Request(url.origin+url.pathname,{method:'GET'});
 event.respondWith((async()=>{
  const active=await chosenBuild();
  const cache=await caches.open(active);
  // An explicit fallback always serves its complete archived build first.
  if(active!==CACHE){
   const archived=await cache.match(key);
   if(archived)return archived;
   if(req.mode==='navigate'){
    const home=await cache.match(new Request(new URL('index.html',self.location.href).href));
    if(home)return home;
   }
  }
  try{
   const response=await fetch(req,{cache:'no-store'});
   if(response.ok&&response.type==='basic'&&active===CACHE)await cache.put(key,response.clone());
   return response;
  }catch(err){
   const cached=await cache.match(key);
   if(cached)return cached;
   if(req.mode==='navigate'){
    const home=await cache.match(new Request(new URL('index.html',self.location.href).href));
    if(home)return home;
   }
   throw err;
  }
 })());
});
