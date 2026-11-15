/* NEXUS | AZEROTH v5.6 — accessible source-media controls and research guidance.
 * GET-only Blizzard media; no inferred item ownership, spell effects or build legality.
 */
(()=>{
'use strict';
if(document.getElementById('nxVisualIntel'))return;
const forge=document.getElementById('talentForge'),atlas=document.getElementById('itemAtlas'),armory=document.getElementById('connectedArmory');
if(!forge&&!atlas&&!document.getElementById('cxItemResult'))return;
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regions=new Set(['us','eu','kr','tw']),cache=new Map(),queued=new Set(),queue=[];let concurrent=0,requestCount=0;
const key=(region,id)=>region+':'+id;
const validId=id=>/^[1-9][0-9]{0,9}$/.test(String(id));
const origin=img=>{try{const url=new URL(img);return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.endsWith('.worldofwarcraft.com')?url.href:null}catch(_){return null}};
function mediaTask(region,id,done){
 const k=key(region,id);
 if(cache.has(k)){done(cache.get(k));return}
 if(queued.has(k)){const entry=queue.find(t=>t.k===k);if(entry)entry.callbacks.push(done);else{
  const tick=()=>{if(cache.has(k))done(cache.get(k));else requestAnimationFrame(tick)};tick();
 }return}
 queued.add(k);queue.push({k,region,id,callbacks:[done]});drain();
}
function drain(){
 while(concurrent<3&&queue.length){
  const job=queue.shift();concurrent++;requestCount++;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
  fetch(API+'/api/media/'+job.region+'/'+job.id,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:controller.signal})
   .then(r=>r.ok?r.json():null).then(payload=>{
    const assets=Array.isArray(payload?.data?.assets)?payload.data.assets:[];
    return origin(assets.find(x=>x?.key==='icon')?.url)||'';
   }).catch(()=> '').then(url=>{
    cache.set(job.k,url);if(cache.size>250)cache.delete(cache.keys().next().value);
    for(const cb of job.callbacks)cb(url);
   }).finally(()=>{clearTimeout(timeout);queued.delete(job.k);concurrent--;drain()});
 }
}
let savedSize=64;
try{const v=Number(localStorage.getItem('nexus_azeroth_media_scale_v56'));if([48,64,80,96].includes(v))savedSize=v}catch(_){}
function applySize(v){savedSize=v;document.documentElement.style.setProperty('--nx-official-icon-size',v+'px');document.documentElement.dataset.nxIconSize=String(v);try{localStorage.setItem('nexus_azeroth_media_scale_v56',String(v))}catch(_){}}
applySize(savedSize);
const tools=document.createElement('section');tools.id='nxVisualIntel';tools.className='panel nx-media-guide';tools.innerHTML='<div class="nx-guide-top"><div><span class="wow-kicker">NEXUS / VISUAL INTELLIGENCE</span><h3>Artwork & Research Controls</h3><p>Enlarge official Blizzard spell and item artwork without changing your talent allocations, item records, or saved builds. Images are visual references—not item ownership evidence.</p></div><label class="nx-size-field">Artwork size<select id="nxOfficialIconSize" aria-label="Official skill and item artwork size"><option value="48">Compact · 48 px</option><option value="64">Comfortable · 64 px</option><option value="80">Large · 80 px</option><option value="96">Extra large · 96 px</option></select></label></div>'+
'<div class="nx-guide-grid"><article><strong>Talent Atlas</strong><p>Drag the tree to explore; tap + or − to edit a manual rank. INSPECT displays official spell and talent IDs with descriptions for each returned rank. Displayed images come from Blizzard spell-media records.</p></article><article><strong>Build Intelligence</strong><p>Source links show reported relationships between nodes. Amber notes mean review suggested, not that Blizzard rejected the allocation. Compare two local builds to see rank and choice changes—no DPS estimate.</p></article><article><strong>Gear & Item Atlas</strong><p>Search by official item ID, inspect Blizzard's item record, then track personal goals separately. Larger item artwork appears for visible researched results when the Blizzard item-media endpoint supplies an icon.</p></article><article><strong>Saved Builds & Safety</strong><p>Use SAVE to preserve a local draft and EXPORT JSON for a portable backup. Plans are not applied to WoW; no equipment ownership or game-valid import code is claimed.</p></article></div>';
const target=forge||atlas;target?.parentNode?.insertBefore(tools,target);
const selector=tools.querySelector('select');selector.value=String(savedSize);
selector.addEventListener('change',()=>{const v=Number(selector.value);if([48,64,80,96].includes(v))applySize(v)});
const icons=new WeakMap(),observed=new WeakSet();let io=null;
function iconSlot(host,id,region){
 if(!host||!validId(id)||!regions.has(region)||host.querySelector('.nx-item-art'))return;
 const slot=document.createElement('span');slot.className='nx-item-art';slot.setAttribute('aria-label','Official item artwork, if provided by Blizzard');slot.setAttribute('role','img');
 slot.textContent='◇';host.prepend(slot);
 const load=()=>mediaTask(region,id,url=>{
  if(!slot.isConnected||!url)return;
  const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  img.onerror=()=>{slot.textContent='◇'};slot.replaceChildren(img);
 });
 if(typeof IntersectionObserver==='function'){
  if(!io)io=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){io.unobserve(e.target);e.target._nxMediaLoad?.();delete e.target._nxMediaLoad}}},{rootMargin:'120px'});
  slot._nxMediaLoad=load;io.observe(slot);
 }else load();
}
function decorate(){
 // A bounded visible list prevents an expensive request per catalog entry on iPhone.
 const atlasResults=document.querySelectorAll('#atlasSearchResults .atlas-entry,#atlasIdResult .atlas-entry,#atlasBoard .atlas-entry');
 let i=0;
 for(const row of atlasResults){
  if(i++>=28)break;
  const b=row.querySelector('[data-atlas-inspect]');if(b)iconSlot(row,b.dataset.atlasInspect,b.dataset.atlasRegion);
 }
 let n=0;
 for(const row of document.querySelectorAll('#cxEquipment .cx-saved')){
  if(n++>=36)break;
  const btn=row.querySelector('[data-cxopen]');if(btn)iconSlot(row,btn.dataset.cxopen,btn.dataset.cxregion);
 }
 for(const card of document.querySelectorAll('#cxItemResult .cx-item')){
  const match=card.querySelector('[data-cxsave]');if(match)iconSlot(card,match.dataset.cxsave,match.dataset.cxregion);
 }
}
let scheduled=false;const mutation=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()})});
for(const id of ['atlasSearchResults','atlasIdResult','atlasBoard','cxEquipment','cxItemResult']){
 const host=document.getElementById(id);if(host)mutation.observe(host,{childList:true});
}
decorate();
})();
