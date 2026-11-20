/* NEXUS | Azeroth v22.3 — discovery within the existing map sidebar.
   Only curated sourced coordinates get pins. Loot/gear queries go to a clearly
   labeled external database; never invent drops, drop rates, spawn points or routes. */
(()=>{'use strict';
const bridge=window.NexusRealMapDiscoveryV223,root=document.getElementById('nx221RealAtlas');
if(!bridge||!root)return;
const $=id=>document.getElementById(id),input=$('nx221Search'),results=$('nx221PlacesList'),types=$('nx221Types');
if(!input||!results||!types)return;
const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const group=(p)=>p.kind==='Dungeon'||p.kind==='Raid'||p.kind==='Delve'?'instances':p.title.toLowerCase().includes('abundance:')?'gathering':p.kind==='Flight'||/portal|rootway/i.test(p.title)?'travel':'other';
const all=bridge.catalog.flatMap(z=>z.points.map(p=>({...p,zoneId:z.id,zoneName:z.name,era:z.era,source:z.source,group:group(p)})));
let category='all',query='',active=false;
const wrapper=make('div','nx223-discovery');
wrapper.setAttribute('aria-label','Atlas discovery filters');
const filters=make('div','nx223-filters');
const choices=[['all','All'],['instances','Dungeons & raids'],['gathering','Gathering'],['travel','Travel'],['other','Places']];
const status=make('p','nx223-status','Search all '+bridge.catalog.length+' available zone maps.');
status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const external=make('a','nx223-external','RESEARCH ITEMS & LOOT ↗');
external.href='https://www.wowhead.com/';external.target='_blank';external.rel='noopener noreferrer';
wrapper.append(filters,status,external);
input.before(wrapper);
input.placeholder='Search any zone, dungeon, raid or activity…';
input.setAttribute('aria-label','Search all available WoW zone maps, instances, gathering and travel');
const terms={instances:['dungeon','dungeons','raid','raids','delve','delves','boss','bosses','instance','instances'],
 gathering:['herb','herbalism','mining','ore','skin','skinning','gather','gathering','farming','farm'],
 travel:['portal','flight','transport','travel','route'],other:['city','landmark','quest','quests','place']};
function matches(p,q){
 const hay=(p.title+' '+p.zoneName+' '+p.era+' '+p.kind+' '+p.group).toLowerCase();
 const tokens=q.split(/\s+/).filter(Boolean);
 return tokens.every(t=>hay.includes(t)||Object.entries(terms).some(([g,words])=>g===p.group&&words.includes(t)));
}
function draw(){
 filters.replaceChildren();
 for(const [id,label] of choices){
  const b=make('button','nx223-filter',label);b.type='button';
  b.setAttribute('aria-pressed',String(id===category));
  b.addEventListener('click',()=>{category=id;draw()});
  filters.append(b);
 }
 active=Boolean(query)||category!=='all';
 types.hidden=active;
 if(!active){status.textContent='Search all '+bridge.catalog.length+' zone maps. Select a location or use the map’s original filters below.';external.textContent='RESEARCH ITEMS & LOOT ↗';external.href='https://www.wowhead.com/';bridge.reset();return}
 results.replaceChildren();
 const found=all.filter(p=>(category==='all'||p.group===category)&&matches(p,query)).slice(0,60);
 $('nx221Count').textContent=found.length+(found.length===60?'+':'')+' MATCHES';
 status.textContent=found.length+(found.length===60?'+':'')+' matching sourced map markers across '+bridge.catalog.length+' maps. Results are a curated sample, not every game location.';
 const linkQ=query||({instances:'dungeon raid loot',gathering:'herbalism mining farming',travel:'flight master portal',other:'world locations'}[category]||'items loot');
 external.href='https://www.wowhead.com/search?q='+encodeURIComponent(linkQ);
 external.textContent=query?'FIND “'+query.slice(0,42)+'” IN ITEM / LOOT DATABASE ↗':'OPEN COMPLETE RESEARCH DATABASE ↗';
 for(const p of found){
  const b=make('button','nx223-result');b.type='button';
  const row=make('span','nx223-result-line');
  row.append(make('strong','',p.title),make('small','',p.kind));
  b.append(row,make('span','nx223-result-meta',p.zoneName+' · X '+p.x.toFixed(1)+' / Y '+p.y.toFixed(1)));
  b.addEventListener('click',()=>{
   query='';category='all';input.value='';
   bridge.open(p.zoneId,p.id);
   types.hidden=false;status.textContent='Showing '+p.title+' on the '+p.zoneName+' game map. Select COPY GAME PIN to use its coordinates in WoW.';
   drawFiltersOnly();
   $('nx221Selected')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  results.append(b);
 }
 if(!found.length){
  results.append(make('p','nx223-empty','No verified markers in our current map catalog. Search the external database for more items, bosses and sources; nothing has been invented here.'));
 }
}
function drawFiltersOnly(){
 filters.replaceChildren();
 for(const [id,label] of choices){
  const b=make('button','nx223-filter',label);b.type='button';b.setAttribute('aria-pressed',String(id===category));
  b.addEventListener('click',()=>{category=id;draw()});filters.append(b);
 }
}
input.addEventListener('input',e=>{e.stopImmediatePropagation();query=input.value.trim().toLowerCase().slice(0,80);draw()},{capture:true});
input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';query='';category='all';draw()}});
const requested=new URLSearchParams(location.search).get('find');
if(requested&&requested.length<=80){input.value=requested;query=requested.toLowerCase();draw()}else drawFiltersOnly();
if(!requested)status.textContent='Explore '+all.length+' curated markers across '+bridge.catalog.length+' sourced maps. Search across zones or filter by activity.';
})();