/* NEXUS | AZEROTH 7.9 — Acquisition & Specialization Intelligence.
 * Curated acquisition source is loot-sources.json, not Blizzard's API.
 * Saved goal progress and talent allocations remain read-only in this module.
 */
(()=>{'use strict';
const lootSection=document.querySelector('[data-section="loot"]');
const talentSection=document.querySelector('[data-section="talents"]');
if(!lootSection||!talentSection||document.getElementById('nxAcquisitionIntel'))return;
const K='nexus_azeroth_loot_hunter_v1';
const $=id=>document.getElementById(id);
const node=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);if(cls)e.className=cls;return e};
const validId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&Number(v)<=9999999999?Number(v):null;
const readGoals=()=>{try{const v=JSON.parse(localStorage.getItem(K)||'null');return Array.isArray(v)?v.slice(0,200).filter(x=>x&&validId(x.id)):[]}catch(_){return[]}};
const safeUrl=x=>typeof x==='string'&&/^https:\/\/(www\.)?(wowhead\.com|warcraft\.wiki\.gg)\//i.test(x)?x:null;
let catalog=[],loaded=false,loading=false;
const acquisition=document.createElement('section');acquisition.id='nxAcquisitionIntel';acquisition.className='nx-acquisition panel';
acquisition.innerHTML='<div class="nx-ai-head"><div><span class="wow-kicker">NEXUS / ACQUISITION RESEARCH</span><h3>Acquisition Intelligence</h3><p>Review your tracked item goals against the companion’s curated reference library. Documented historical sources are not live Blizzard drop tables.</p></div><span class="nx-ai-label">SOURCE TRANSPARENCY</span></div>'+
'<div class="nx-ai-metrics" id="nxAiMetrics"></div>'+
'<div class="nx-ai-controls"><label>Source availability<select id="nxAiFilter"><option value="all">All personal goals</option><option value="documented">Curated source available</option><option value="missing">Source not documented here</option><option value="open">Still farming (manual)</option><option value="done">Completed (manual)</option></select></label><label>Search tracked goals<input id="nxAiSearch" type="search" maxlength="100" placeholder="Name or official ID"></label><button type="button" id="nxAiRefresh">REFRESH GOALS</button></div>'+
'<p id="nxAiStatus" role="status" aria-live="polite">Open Loot Hunter to review locally saved goals.</p><div id="nxAiList" class="nx-ai-list" role="list"></div><div id="nxAiMore" class="nx-ai-more"></div>'+
'<p class="nx-ai-disclaimer">Reference library: limited, manually curated historical collectibles. All drop conditions, weekly lockouts, availability and eligibility should be rechecked with the linked guide and in game. No invented source, drop chance, or automatic ownership claim is shown.</p>';
lootSection.append(acquisition);
const spec=document.createElement('section');spec.id='nxSpecResearch';spec.className='nx-spec-research panel';
spec.innerHTML='<div class="nx-ai-head"><div><span class="wow-kicker">NEXUS / SPECIALIZATION RESEARCH</span><h3>Specialization Intelligence</h3><p>Explore Blizzard-returned node IDs, categories, rank counts and source descriptions for the tree currently loaded in Talent Forge. All point allocations remain manual.</p></div><span class="nx-ai-label">SOURCE-BASED TALENTS</span></div>'+
'<div id="nxSpecStatus" role="status" aria-live="polite">Load a specialization tree in Talent Forge, then select Refresh.</div>'+
'<div class="nx-ai-metrics" id="nxSpecMetrics"></div>'+
'<div class="nx-ai-controls"><label>Talent category<select id="nxSpecCategory"><option value="all">All categories</option><option value="class">Class</option><option value="spec">Specialization</option><option value="hero">Hero</option></select></label><label>Allocation status<select id="nxSpecStatusFilter"><option value="all">All returned talents</option><option value="planned">Planned points only</option><option value="unplanned">Unallocated</option></select></label><label>Search official talent<input id="nxSpecFind" type="search" maxlength="100" placeholder="Talent name, node ID or spell ID"></label><button id="nxSpecRefresh" type="button">REFRESH SOURCE DATA</button></div>'+
'<div id="nxSpecList" class="nx-spec-list" role="list"></div><div id="nxSpecMore" class="nx-ai-more"></div>'+
'<p class="nx-ai-disclaimer">Nodes shown are a research view of the currently loaded tree. A reported link is not a confirmed prerequisite. These ranks are a local working draft, not proof of a valid in-game build, its optimal performance, or the loaded Armory character’s active talent choices.</p>';
talentSection.append(spec);
let goalLimit=12,talentLimit=18,specData=null,requestGeneration=0;
function metric(container,label,value){
 const box=node('div',undefined,'nx-ai-metric');box.append(node('strong',value),node('small',label));container.append(box);
}
function renderGoals(){
 const goals=readGoals(),known=new Map(catalog.map(c=>[Number(c.id),c]));
 const metrics=$('nxAiMetrics');metrics.replaceChildren();
 metric(metrics,'Personal farming goals',goals.length);
 metric(metrics,'Curated source matches',goals.filter(g=>known.has(Number(g.id))).length);
 metric(metrics,'No curated source',goals.filter(g=>!known.has(Number(g.id))).length);
 metric(metrics,'Manual attempts logged',goals.reduce((sum,g)=>sum+Math.max(0,Number(g.attempts)||0),0));
 const q=$('nxAiSearch').value.trim().toLowerCase(),filter=$('nxAiFilter').value;
 const subset=goals.filter(g=>{
  const source=known.get(Number(g.id));
  if(q&&!((String(g.name||'')+' '+g.id+' '+String(source?.area||'')).toLowerCase().includes(q)))return false;
  if(filter==='documented'&&!source||filter==='missing'&&source||filter==='open'&&g.done||filter==='done'&&!g.done)return false;
  return true;
 });
 const list=$('nxAiList');list.replaceChildren();const fragment=document.createDocumentFragment();
 for(const goal of subset.slice(0,goalLimit)){
  const source=known.get(Number(goal.id));
  const row=node('article',undefined,'nx-ai-item');row.setAttribute('role','listitem');
  const top=node('div',undefined,'nx-ai-item-top');
  top.append(node('strong',String(goal.name||'Item #'+goal.id).slice(0,140)),node('span','#'+goal.id+' · '+(goal.done?'Completed manually':'Open goal')+' · '+Math.max(0,Number(goal.attempts)||0)+' manual attempts'));
  row.append(top);
  if(source){
   row.append(node('p',String(source.source||'Source not described').slice(0,500)));
   row.append(node('small',String(source.area||'Unspecified area').slice(0,120)+' · '+String(source.difficulty||'Difficulty not documented').slice(0,100)));
   if(Array.isArray(source.steps)&&source.steps.length){
    const details=node('details'),summary=node('summary','VIEW DOCUMENTED ACQUISITION STEPS');
    const ol=node('ol');for(const step of source.steps.slice(0,12))ol.append(node('li',String(step).slice(0,350)));
    details.append(summary,ol);row.append(details);
   }
   const url=safeUrl(source.guide);if(url){
    const link=node('a','OPEN SOURCE GUIDE');link.href=url;link.target='_blank';link.rel='noopener noreferrer';row.append(link);
   }
  }else row.append(node('p',loaded?'Source not documented in the companion’s limited curated guide library. Inspect the ID and verify the acquisition path independently.':'Reference library has not loaded. Source status is unknown.','nx-ai-unknown'));
  if(goal.notes)row.append(node('p','Your notes: '+String(goal.notes).slice(0,220),'nx-ai-note'));
  const action=node('button','OPEN IN LOOT HUNTER');action.type='button';action.addEventListener('click',()=>{
   document.querySelector('.nav [data-view="loot"]')?.click();
   $('lootFilter').value='all';$('lootFilter').dispatchEvent(new Event('change'));
   const target=$('lootBoard')?.querySelector('[data-loot-inspect="'+goal.id+'"]');target?.scrollIntoView({block:'center',behavior:'smooth'});
  });row.append(action);fragment.append(row);
 }
 if(!subset.length)fragment.append(node('p','No saved goals match the selected filter. Add a manual item goal through Loot Hunter to begin.','nx-ai-empty'));
 list.append(fragment);const more=$('nxAiMore');more.replaceChildren();more.append(node('span','Showing '+Math.min(goalLimit,subset.length)+' of '+subset.length+' saved goals'));
 if(subset.length>goalLimit){const b=node('button','SHOW NEXT '+Math.min(12,subset.length-goalLimit));b.type='button';b.addEventListener('click',()=>{goalLimit+=12;renderGoals()});more.append(b)}
 $('nxAiStatus').textContent=loaded?'Reference file loaded: '+catalog.length+' documented examples. This is not a complete WoW acquisition database.':loading?'Loading the companion’s curated source reference…':'Curated source file unavailable; player goals remain accessible.';
}
async function loadCatalog(){
 if(loading)return;
 loading=true;renderGoals();const req=++requestGeneration;
 try{
  const response=await fetch('./loot-sources.json',{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw Error('Reference unavailable');
  const data=await response.json();
  if(req!==requestGeneration)return;
  catalog=Array.isArray(data.items)?data.items.slice(0,100).filter(x=>validId(x.id)&&safeUrl(x.guide)&&Array.isArray(x.steps)):[];
  loaded=true;
 }catch(_){catalog=[];loaded=false}
 finally{loading=false;renderGoals()}
}
function readTree(){
 const fn=window.NexusTalentSourceBridge?.snapshot;
 try{return typeof fn==='function'?fn():null}catch(_){return null}
}
function renderTalent(){
 const s=specData,metrics=$('nxSpecMetrics');metrics.replaceChildren();
 if(!s?.ready||!Array.isArray(s.catalog)){
  $('nxSpecStatus').textContent='No official talent tree loaded yet. Load one in Talent Forge, then select Refresh Source Data.';
  $('nxSpecList').replaceChildren();$('nxSpecMore').replaceChildren();return;
 }
 const nodes=s.catalog.filter(n=>validId(n.id)).slice(0,750);
 const planned=n=>{const x=Number(s.allocations?.[String(n.id)]||0);return Number.isSafeInteger(x)&&x>0?x:0};
 metric(metrics,'Source-returned nodes',nodes.length);
 metric(metrics,'Planned points',nodes.reduce((sum,n)=>sum+planned(n),0));
 metric(metrics,'Selected nodes',nodes.filter(n=>planned(n)>0).length);
 metric(metrics,'Saved drafts in current tree',Array.isArray(s.savedDrafts)?s.savedDrafts.length:0);
 const cat=$('nxSpecCategory').value,status=$('nxSpecStatusFilter').value,q=$('nxSpecFind').value.trim().toLowerCase();
 const filtered=nodes.filter(n=>{
  const p=planned(n);
  if(cat!=='all'&&n.category!==cat)return false;
  if(status==='planned'&&!p||status==='unplanned'&&p)return false;
  return !q||(String(n.name||'')+' '+n.id+' '+(n.spellId||'')+' '+(n.talentId||'')).toLowerCase().includes(q);
 });
 const list=$('nxSpecList');list.replaceChildren();const fragment=document.createDocumentFragment();
 for(const n of filtered.slice(0,talentLimit)){
  const p=planned(n),row=node('article',undefined,'nx-spec-item');row.setAttribute('role','listitem');
  row.append(node('strong',String(n.name||'Talent').slice(0,140)));
  row.append(node('small',String(n.category||'Unknown')+' tree · Blizzard node #'+n.id+' · Planned '+p+' / '+(Number.isSafeInteger(n.max)?n.max:'?')+' ranks'));
  const ids=[n.spellId?'Spell #'+n.spellId:null,n.talentId?'Talent #'+n.talentId:null].filter(Boolean);
  if(ids.length)row.append(node('small',ids.join(' · ')));
  row.append(node('p',n.summary?String(n.summary).slice(0,600):'No Blizzard source description supplied for this node. Use the existing skill inspector for more detail.'));
  fragment.append(row);
 }
 if(!filtered.length)fragment.append(node('p','No talent nodes match these filters.','nx-ai-empty'));
 list.append(fragment);
 const more=$('nxSpecMore');more.replaceChildren();more.append(node('span','Showing '+Math.min(talentLimit,filtered.length)+' of '+filtered.length+' matching source nodes'));
 if(filtered.length>talentLimit){const b=node('button','SHOW NEXT '+Math.min(18,filtered.length-talentLimit));b.type='button';b.addEventListener('click',()=>{talentLimit+=18;renderTalent()});more.append(b)}
 $('nxSpecStatus').textContent='Current tree identity: '+String(s.identity||'Unknown specialization').slice(0,120)+' · '+String(s.region||'us').toUpperCase()+'. Refresh after switching specialization or changing planned ranks.';
}
$('nxAiFilter').addEventListener('change',()=>{goalLimit=12;renderGoals()});
$('nxAiSearch').addEventListener('input',()=>{goalLimit=12;renderGoals()});
$('nxAiRefresh').addEventListener('click',()=>{goalLimit=12;loadCatalog()});
$('nxSpecCategory').addEventListener('change',()=>{talentLimit=18;renderTalent()});
$('nxSpecStatusFilter').addEventListener('change',()=>{talentLimit=18;renderTalent()});
$('nxSpecFind').addEventListener('input',()=>{talentLimit=18;renderTalent()});
$('nxSpecRefresh').addEventListener('click',()=>{talentLimit=18;specData=readTree();renderTalent()});
window.addEventListener('nexus:loot-updated',renderGoals);
window.addEventListener('storage',ev=>{if(ev.key===K)renderGoals()});
document.addEventListener('nexus:view-activated',ev=>{
 if(ev.detail?.view==='loot'&&!loaded&&!loading)loadCatalog();
 if(ev.detail?.view==='talents'){specData=readTree();renderTalent()}
});
renderGoals();renderTalent();
})();