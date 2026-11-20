/* NEXUS | AZEROTH v22 — BLIZZARD CHARACTER RESEARCH INTELLIGENCE
 * Does not call Blizzard itself. It only consumes the pre-existing successful
 * public equipment/profile API results from Character Intelligence. A snapshot
 * enters local storage ONLY when the user explicitly clicks Save Research.
 * Captures are clearly dated, can become stale, and are not actual inventory.
 */
(()=>{'use strict';
const core=window.NexusLivingIntelligenceV22;
if(!core)return;
const $=id=>document.getElementById(id),el=(tag,cls,v)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(v!==undefined)x.textContent=String(v);return x};
const read=()=>{try{const raw=localStorage.getItem(core.KEYS.research);return core.cleanResearch(raw?JSON.parse(raw):null)}catch(_){return []}};
const write=rows=>{try{localStorage.setItem(core.KEYS.research,JSON.stringify(core.cleanResearch(rows)));return true}catch(_){return false}};
function badge(name,value){const x=el('div','nx22-gear-stat');x.append(el('small','',name),el('strong','',String(value)));return x}
function profileLabel(c){return [c.selector.name,c.selector.realm,c.selector.region.toUpperCase()].join(' · ')}
const engine=document.getElementById('form');
if(engine){
 let fresh={A:null,B:null};
 const section=el('section','nx22-character-research panel');section.id='nx22CharacterResearch';
 section.setAttribute('aria-labelledby','nx22CharacterTitle');
 section.innerHTML='<span class="nx22-eyebrow">LIVING INTELLIGENCE / VERIFIED RESEARCH · V22</span>'+
 '<h2 id="nx22CharacterTitle">KNOW WHAT THE API ACTUALLY REPORTED.</h2>'+
 '<p>Compare published equipment facts across characters and optionally keep a time-stamped research snapshot for your Adventure Director. A snapshot is not automatic account sync or proof of future item ownership.</p>'+
 '<div id="nx22GearSummary" class="nx22-gear-summary"><p>Load Character A using the existing Blizzard API form above to unlock source-backed equipment insights.</p></div>'+
 '<div id="nx22SaveResearchActions" class="nx22-gear-actions"></div>'+
 '<h3>YOUR SAVED PUBLIC RESEARCH</h3><div id="nx22ResearchLibrary" class="nx22-research-library"></div>'+
 '<p id="nx22ResearchStatus" class="nx22-hint" role="status">No private Battle.net tokens or full profile payloads are saved by v22.</p>'+
 '<div class="nx22-info-links"><a href="./living-intelligence.html">OPEN PERSONAL ADVENTURE DIRECTOR ↗</a><a href="./player-experience.html">CHARACTER NEXUS ↗</a></div>';
 const compare=document.getElementById('compare');if(compare)compare.after(section);else engine.after(section);
 const render=()=>{
  const host=$('nx22GearSummary'),actions=$('nx22SaveResearchActions');
  host.replaceChildren();actions.replaceChildren();
  for(const [letter,reported] of Object.entries(fresh)){
   if(!reported)continue;
   const stats=core.slotSummary(reported);
   if(!stats)continue;
   const box=el('article','nx22-gear-report');box.append(el('h3','',profileLabel(reported)));
   const metrics=el('div','nx22-gear-metrics');
   metrics.append(badge('REPORTED EQUIPMENT SLOTS',stats.reportedSlots),
    badge('REPORTED EQUIPPED ITEM LEVEL',stats.reportedEquippedItemLevel??'NOT RETURNED'),
    badge('ILVL RANGE',stats.reportedMin!==null?stats.reportedMin+'–'+stats.reportedMax:'NOT RETURNED'),
    badge('RESEARCH TIMESTAMP',new Date(stats.fetchedAt).toLocaleString()));
   box.append(metrics);
   const notes=el('p','nx22-hint','Equipment summary is based on the API response fetched now. Unreported slots and missing item levels mean unknown, not empty or unequipped.');
   box.append(notes);host.append(box);
   const save=el('button','nx22-primary','SAVE CHARACTER '+letter+' RESEARCH SNAPSHOT');
   save.type='button';save.addEventListener('click',()=>{
    const current=read();
    try{
     const result=core.upsertResearch(current,reported);
     if(!write(result))throw Error('Browser local storage is unavailable.');
     $('nx22ResearchStatus').textContent='Saved a dated public API research snapshot by explicit choice. It may become stale; future refreshes do not overwrite it automatically.';
     listSaved();
    }catch(err){$('nx22ResearchStatus').textContent=err.message||'Cannot save snapshot'}
   });actions.append(save);
  }
  if(!fresh.A&&!fresh.B)host.append(el('p','', 'Fetch a public Blizzard character profile and equipment using the existing form. The report will appear here automatically, without a second API request.'));
  listSaved();
 };
 function listSaved(){
  const list=$('nx22ResearchLibrary');list.replaceChildren();const rows=read();
  if(!rows.length){list.append(el('p','nx22-empty','No optional Blizzard public-gear snapshots saved on this device.'));return}
  for(const rec of rows){
   const entry=el('article','nx22-stored-report'),info=el('div','nx22-stored-body');
   info.append(el('strong','',profileLabel(rec)),
    el('span','','Captured '+new Date(rec.fetchedAt).toLocaleString()+' · '+rec.items.length+' returned items · '+(rec.character.equippedItemLevel||'unknown')+' reported equipped ilvl'));
   const btn=el('button','nx22-secondary','DELETE SNAPSHOT');
   btn.type='button';btn.addEventListener('click',()=>{
    if(!confirm('Delete only this locally saved public character research snapshot? Original character profiles and builds are unchanged.'))return;
    const key=r=>[r.selector.region,r.selector.realm,r.selector.name].join('/');
    const result=rows.filter(r=>key(r)!==key(rec));if(write(result))listSaved();
   });
   entry.append(info,btn);list.append(entry);
  }
 }
 window.addEventListener('nexus:v22-character-report',event=>{
  const details=event.detail||{};
  fresh={A:core.normalizeResearch(details.A),B:core.normalizeResearch(details.B)};
  render();
 });
 window.addEventListener('storage',e=>{if(e.key===core.KEYS.research)listSaved()});
 render();
}
const nexus=document.getElementById('px11Station');
if(nexus&&!document.getElementById('nx22NexusGear')){
 const box=el('section','nx22-nexus-gear');box.id='nx22NexusGear';
 box.innerHTML='<span class="nx22-eyebrow">LIVE RESEARCH INTEGRATION / V22</span>'+
 '<h2>PUBLIC EQUIPMENT INTELLIGENCE.</h2>'+
 '<p>The original Character Nexus is based on browser-local manual profiles. You can now explicitly save public Blizzard gear reports from Character Intelligence for separate, dated research.</p>'+
 '<div id="nx22NexusGearList"></div>'+
 '<div class="nx22-info-links"><a href="./character-intelligence.html">OPEN BLIZZARD GEAR RESEARCH ↗</a>'+
 '<a href="./living-intelligence.html">PREPARE AN ADVENTURE ↗</a></div>';
 nexus.parentElement?.append(box);
 const render=()=>{
  const host=$('nx22NexusGearList');host.replaceChildren();
  const rows=read();
  if(!rows.length){host.append(el('p','nx22-hint','No public-gear snapshots captured yet. This is not an indication that you own no equipment.'));return}
  for(const r of rows.slice(0,5)){
   const line=el('div','nx22-mini-gear');
   line.append(el('strong','',r.character.name+' · '+r.character.className+' · '+r.character.spec),
    el('span','','Blizzard API snapshot · '+new Date(r.fetchedAt).toLocaleDateString()+
     ' · '+r.items.length+' equipped items reported · equipped ilvl '+(r.character.equippedItemLevel||'not returned')));
   host.append(line);
  }
 };
 window.addEventListener('storage',e=>{if(e.key===core.KEYS.research)render()});
 render();
}
})();