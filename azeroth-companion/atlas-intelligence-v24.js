/* NEXUS | Azeroth v24 — Atlas Intelligence.
   All user data writes are explicit, original Item Atlas/Loot Hunter schemas.
   Blizzard credentials never enter this browser; official item data comes via
   the existing public Cloudflare read-only game-data gateway.
   This is a curated source index, not an exhaustive boss loot or node database. */
(()=>{'use strict';
const root=document.getElementById('nx221RealAtlas'),bridge=window.NexusRealMapDiscoveryV223;
if(!root||!bridge)return;
const $=id=>document.getElementById(id);
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const atlasKey='nexus_azeroth_item_atlas_v1',farmKey='nexus_azeroth_loot_hunter_v1';
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const validId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&Number(id)<=9999999999&&/^[1-9]\d{0,9}$/.test(String(id));
const readArray=key=>{try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data:[]}catch(_){return []}};
const clean=(s,n=140)=>String(s||'').replace(/[\x00-\x1f]/g,' ').slice(0,n);
const known=[ // graceful fallback if the same-origin curated guide file is unavailable
 {id:19019,name:'Thunderfury, Blessed Blade of the Windseeker',kind:'Legendary quest reward',area:'Molten Core / Silithus',source:'Bindings of the Windseeker and legacy quest chain',steps:['Acquire bindings from Garr and Baron Geddon in Molten Core','Complete the associated quest chain and required materials','Finish the Thunderaan encounter and turn in the quest']},
 {id:50818,name:"Invincible's Reins",kind:'Legacy raid mount',area:'Icecrown Citadel',source:'The Lich King · 25-player Heroic',steps:['Choose the required legacy raid difficulty','Defeat The Lich King','Check for the mount and log your attempt']},
 {id:32458,name:"Ashes of Al'ar",kind:'Legacy raid mount',area:'The Eye / Tempest Keep',source:"Kael'thas Sunstrider",steps:["Enter The Eye","Defeat Kael'thas Sunstrider","Check for the mount and log your attempt"]},
 {id:49623,name:'Shadowmourne',kind:'Legendary quest reward',area:'Icecrown Citadel',source:'Ashen Verdict quest chain',steps:['Start the Ashen Verdict legendary quest chain','Complete required infusion and materials steps','Finish the chain and claim the reward']}
];
const officialCache=new Map();
let guides=known,searchRun=0;
const extraEntries=[];
const panel=$('nx230Detail'),more=root.querySelector('.nx230-more'),q=$('nx221Search');
if(!panel||!more||!q)return;
const status=make('p','nx240-status','');
status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const searchBox=make('div','nx240-official');
const officialButton=make('button','nx240-official-button','SEARCH OFFICIAL BLIZZARD ITEMS');officialButton.type='button';
const officialStatus=make('p','nx240-official-status','Find item names or IDs with the search box above, then search the existing official item gateway.');
const officialResults=make('div','nx240-official-results');
const remoteMode=make('div','nx240-remote-config');
const region=make('select','nx240-region');region.setAttribute('aria-label','Blizzard item data region');
for(const [id,name] of [['us','US'],['eu','EU'],['kr','KR'],['tw','TW']]){const option=make('option','',name);option.value=id;region.append(option)}
remoteMode.append(region,officialButton);
searchBox.append(remoteMode,officialStatus,officialResults);
more.before(searchBox);
const sourceDrawer=make('details','nx240-source-drawer');
sourceDrawer.append(make('summary','','SOURCE REFERENCES · OPTIONAL'));
const outgoing=more.querySelector('a.nx230-full');
if(outgoing){sourceDrawer.append(outgoing);more.append(sourceDrawer)}
const note=more.querySelector('.nx230-trust');if(note)note.textContent='Direct map, item research and personal tracking are available here. Verified in-page catalog is curated; item rewards and farming nodes are not complete.';
const flash=s=>{status.textContent=s};
q.after(status);
function guideEntry(g){
 return {id:'local-guide-'+g.id,kind:'Item',name:g.name,itemId:g.id,details:g.kind+' · '+g.source+' · '+g.area,
 source:g.guide||g.wowhead||'https://www.wowhead.com/item='+g.id,group:'loot',area:g.area,guideId:g.id};
}
function syncGuides(){
 for(const g of guides){
  if(!validId(g.id))continue;
  if(extraEntries.some(e=>e.itemId===Number(g.id)))continue;
  if([19019,50818,32458,49623].includes(Number(g.id)))continue; // already represented by v23
  extraEntries.push(guideEntry(g));
 }
 window.NexusWorldDiscoveryV23?.refresh?.();
}
fetch('./loot-sources.json',{cache:'force-cache'}).then(r=>r.ok?r.json():Promise.reject(Error('unavailable'))).then(data=>{
 if(!Array.isArray(data?.items))return;
 guides=data.items.filter(x=>x&&validId(x.id)&&Array.isArray(x.steps)).slice(0,80);
 syncGuides();
}).catch(()=>{guides=known});
function guideFor(p){return guides.find(g=>Number(g.id)===Number(p.itemId||p.guideId))||null}
function saveArray(key,next,max){
 if(JSON.stringify(next).length>max)throw Error('Local storage size limit reached');
 localStorage.setItem(key,JSON.stringify(next));
}
function saveItem(p){
 const id=Number(p.itemId),name=clean(p.name);if(!validId(id))return flash('Only Blizzard item IDs can be added to your Item Atlas.');
 try{
  const saved=readArray(atlasKey);
  if(saved.some(x=>Number(x.id)===id&&x.region===region.value))return flash(name+' is already in your Item Atlas.');
  if(saved.length>=5000)throw Error('Your saved Item Atlas is at capacity');
  saved.unshift({id,region:region.value,name,status:'wishlist',notes:clean(p.details||'',400),updated:new Date().toISOString()});
  saveArray(atlasKey,saved,3000000);
  window.dispatchEvent(new Event('nexus:item-atlas-changed'));
  flash('Saved '+name+' to your Item Atlas wishlist on this device.');
 }catch(e){flash('Could not save Item Atlas item: '+e.message)}
}
function trackFarm(p){
 const id=Number(p.itemId);if(!validId(id))return flash('Choose an item with a confirmed Blizzard ID.');
 try{
  const goals=readArray(farmKey);
  if(goals.some(x=>Number(x.id)===id))return flash('Already on your Loot Hunter farm board.');
  if(goals.length>=200)throw Error('Farm board reached its 200-goal capacity');
  goals.unshift({id,name:clean(p.name),notes:clean(p.details||'',400),attempts:0,done:false,steps:[]});
  saveArray(farmKey,goals,250000);
  window.dispatchEvent(new CustomEvent('nexus:loot-updated',{detail:{count:goals.length}}));
  window.NexusWorldDiscoveryV23?.selectObject?.(p);
  flash('Added '+p.name+' to your existing Loot Hunter farm board. Progress is manual and stored on this device.');
 }catch(e){flash('Could not add farming goal: '+e.message)}
}
function logAttempt(p){
 const id=Number(p.itemId),goals=readArray(farmKey),g=goals.find(x=>Number(x.id)===id);
 if(!g)return flash('Add this item to your farm board first.');
 try{g.attempts=Math.min(1000000,Math.max(0,Number(g.attempts)||0)+1);saveArray(farmKey,goals,250000);flash('Attempt '+g.attempts+' recorded for '+p.name+'. This is a manual log.');window.dispatchEvent(new Event('nexus:loot-updated'))}
 catch(e){flash('Could not log attempt: '+e.message)}
}
function button(text,action){
 const b=make('button','nx240-action',text);b.type='button';b.addEventListener('click',action);return b;
}
function section(title){
 const s=make('section','nx240-section');s.append(make('strong','nx240-label',title));return s;
}
function mapJump(zone,pin,label){
 const b=button(label||'SHOW ENTRANCE ON MAP',()=>{
  const ok=bridge.open(zone,pin);if(ok){$('nx221Selected').hidden=false;$('nx221MapViewport')?.scrollIntoView({behavior:'smooth',block:'center'});}
  else flash('This entrance is not in the current in-page map collection.');
 });return b;
}
function decorate(p,detail,actions){
 if(!p||!detail)return;
 const existing=detail.querySelector('.nx240-enhanced');if(existing)existing.remove();
 const host=make('div','nx240-enhanced');
 const guide=guideFor(p);
 const main=section(p.kind==='Item'?'ACQUISITION INTELLIGENCE':p.kind==='Boss'?'ENCOUNTER INTELLIGENCE':p.kind==='Dungeon'||p.kind==='Raid'?'INSTANCE INTELLIGENCE':'LOCATION INTELLIGENCE');
 if(p.kind==='Item'){
  main.append(make('p','nx240-fact',guide?'HOW TO GET IT: '+guide.source+' · '+guide.area:(p.details||'Item record from official search. Source may not be in our curated index.')));
  if(guide?.difficulty)main.append(make('p','nx240-fact','Difficulty / acquisition: '+guide.difficulty));
  if(guide?.steps?.length){
   const steps=make('ol','nx240-steps');
   for(const s of guide.steps.slice(0,12))steps.append(make('li','',s));
   main.append(steps);
  }
  const controls=make('div','nx240-actions');
  if(validId(p.itemId)){controls.append(button('SAVE TO ITEM ATLAS',()=>saveItem(p)),button('ADD FARM GOAL',()=>trackFarm(p)));
   if(readArray(farmKey).some(x=>Number(x.id)===Number(p.itemId)))controls.append(button('+ LOG ATTEMPT',()=>logAttempt(p)));
  }
  main.append(controls);
  if(guide)main.append(make('p','nx240-fine','Acquisition information is curated from the existing Loot Hunter guide. Confirm current patch requirements in-game.'));
 }else if(['Boss','Dungeon','Raid'].includes(p.kind)){
  const parent=p.kind==='Boss'?(p.parent||'instance'):p.name;
  const all=window.NexusWorldDiscoveryV23?.catalog?.()||[];
  const relevant=all.filter(x=>x.kind==='Boss'&&x.parent===parent);
  main.append(make('p','nx240-fact',p.kind==='Boss'?'Instance: '+parent+'. Indoor encounter positions are not represented as outdoor coordinates.':'Documented encounter lineup · '+relevant.length+' indexed bosses'));
  if(relevant.length){
   const list=make('div','nx240-boss-list');
   for(const boss of relevant){
    list.append(button(boss.name,()=>{
     window.NexusWorldDiscoveryV23?.selectEntry?.(boss.id);
    }));
   }main.append(list);
  }
  const drops=all.filter(x=>x.kind==='Item'&&x.zone===p.zone&&x.bosses?.some(b=>p.kind==='Boss'?b===p.name:relevant.some(r=>r.name===b)));
  if(drops.length){const loot=section('DOCUMENTED SAMPLE LOOT');for(const item of drops)loot.append(button(item.name,()=>window.NexusWorldDiscoveryV23?.selectEntry?.(item.id)));main.append(loot)}
  if(p.zone&&p.pin)main.append(mapJump(p.zone,p.pin,'SHOW OUTDOOR ENTRANCE'));
 }else if(p.zone&&p.pin){
  const z=bridge.catalog.find(z=>z.id===p.zone);
  const here=z?.points.find(x=>x.id===p.pin);
  if(here){
   main.append(make('p','nx240-fact',z.name+' · X '+here.x.toFixed(1)+' / Y '+here.y.toFixed(1)+' · UI Map '+z.mapId));
   main.append(mapJump(p.zone,p.pin,'FOCUS THIS MAP MARKER'));
   const nearby=z.points.map(x=>({...x,dist:Math.hypot(x.x-here.x,x.y-here.y)})).filter(x=>x.id!==here.id).sort((a,b)=>a.dist-b.dist).slice(0,4);
   if(nearby.length){const near=section('OTHER DOCUMENTED PLACES IN THIS ZONE');
    for(const x of nearby)near.append(button(x.title+' · '+x.x.toFixed(1)+', '+x.y.toFixed(1),()=>bridge.open(z.id,x.id)));
    main.append(near);
    main.append(make('p','nx240-fine','Nearby means coordinate proximity on this zone map; not travel time or a recommended farming route.'));
   }
  }
 }
 host.append(main);
 detail.append(host);
 // External research actions are still available, but deliberately collapsed.
 const sourceLinks=[...actions.querySelectorAll('a[target="_blank"]')];
 if(sourceLinks.length){
  const disclosure=make('details','nx240-card-sources');disclosure.append(make('summary','','VIEW ORIGINAL SOURCES · OPTIONAL'));
  for(const link of sourceLinks)disclosure.append(link);
  detail.append(disclosure);
 }
}
function attachOfficial(){
 const buttonStatus=s=>{officialStatus.textContent=s};
 const request=async path=>{
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),13000);
  try{
   const res=await fetch(API+path,{credentials:'omit',cache:'no-store',signal:ctrl.signal});
   const body=await res.json();
   if(!res.ok||body.success===false)throw Error(body.message||'Official item service unavailable');
   return body.data;
  }finally{clearTimeout(timeout)}
 };
 async function inspect(id){
  if(!validId(id))return buttonStatus('Invalid item ID.');
  buttonStatus('Loading Blizzard item #'+id+'…');
  try{
   const record=await request('/api/item/'+region.value+'/'+id);
   if(!validId(record?.id))throw Error('Blizzard did not return an item');
   const value={id:'blizzard-item-'+region.value+'-'+record.id,name:clean(record.name||'Item #'+record.id),
    kind:'Item',itemId:Number(record.id),group:'loot',details:'Official Blizzard item #'+record.id+
    (record.quality?' · '+clean(record.quality,35):'')+(record.level?' · Level '+record.level:'')+
    '. Acquisition source is not verified by the item API.'};
   officialCache.set(value.id,value);
   extraEntries.push(value);
   window.NexusWorldDiscoveryV23?.selectObject?.(value);
   buttonStatus('Official Blizzard item record loaded here. Source/loot is shown only when supported by our curated guide.');
  }catch(e){buttonStatus('Item lookup unavailable: '+clean(e.message,160))}
 }
 officialButton.addEventListener('click',async()=>{
  const term=q.value.trim(),run=++searchRun;officialResults.replaceChildren();
  if(!term||term.length>70)return buttonStatus('Type an item name or numeric Blizzard item ID in the search box above.');
  if(validId(term))return inspect(term);
  if(term.length<2)return buttonStatus('Enter at least two characters.');
  buttonStatus('Searching the existing Blizzard item service…');
  try{
   const data=await request('/api/search/'+region.value+'?q='+encodeURIComponent(term)+'&page=1');
   if(run!==searchRun)return;
   const rows=Array.isArray(data?.items)?data.items.filter(x=>validId(x.id)).slice(0,20):[];
   for(const p of rows){
    const r=make('div','nx240-official-row');
    const text=make('span','',clean(p.name||'Item #'+p.id)+' · #'+p.id+(p.quality?' · '+clean(p.quality,40):''));
    r.append(text,button('INSPECT HERE',()=>inspect(p.id)));officialResults.append(r);
   }
   buttonStatus(rows.length+' Blizzard item result(s), page 1. Select INSPECT HERE to view item data and track it inside Azeroth. These records do not inherently establish loot sources.');
  }catch(e){if(run===searchRun)buttonStatus('Blizzard search unavailable: '+clean(e.message,150)+'. Local map and acquisition guides remain usable.')}
 });
}
attachOfficial();
window.NexusAtlasIntelligenceV24=Object.freeze({decorate,extraEntries,status:flash,guideCount:()=>guides.length});
})();