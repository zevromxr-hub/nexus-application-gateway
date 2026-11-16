/* NEXUS v7.8 — Warcraft Research Board.
 * Public Armory item IDs + existing user-entered goals; no new network APIs.
 * TRACK GOAL is the only write path, via the existing Loot Hunter event.
 */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav');
const anchor=document.getElementById('nxMasteryPanel')||document.getElementById('nxCharacterIntelligence');
if(!anchor||!nav||document.getElementById('nxWarcraftResearch'))return;
const K={atlas:'nexus_azeroth_item_atlas_v1',loot:'nexus_azeroth_loot_hunter_v1',targets:'nexus_azeroth_character_targets_v1'};
const valid=n=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<=9999999999?Number(n):null;
const dom=(tag,value,cls)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=String(value);if(cls)x.className=cls;return x};
const e=id=>document.getElementById(id);
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}};
const board=document.createElement('section');board.id='nxWarcraftResearch';board.className='nx-warcraft-research panel';
board.innerHTML='<header class="nx-wr-header"><div><span class="wow-kicker">NEXUS / WARCRAFT RESEARCH</span><h3>Equipment Research Board</h3><p>Compare public equipped-item records with your saved Item Atlas, Loot Hunter and character objectives. Tracking and ownership remain personal planning.</p></div><span class="nx-wr-tag">SOURCE + MANUAL GOALS</span></header>'+
'<p id="nxWrStatus" role="status">Load a character in Live Armory to review returned equipment.</p>'+
'<div id="nxWrMetrics" class="nx-wr-metrics" hidden></div>'+
'<div class="nx-wr-controls"><label>Personal tracking filter<select id="nxWrFilter"><option value="all">All equipped records</option><option value="atlas">Saved in Item Atlas</option><option value="loot">Tracked in Loot Hunter</option><option value="target">Assigned to this character</option><option value="none">Not personally tracked</option></select></label><label>Find equipped item<input id="nxWrSearch" type="search" maxlength="100" placeholder="Item name, slot, or ID"></label><button type="button" id="nxWrRefresh">REFRESH GOALS</button></div>'+
'<div id="nxWrList" class="nx-wr-list" role="list"></div><div id="nxWrMore" class="nx-wr-more"></div>'+
'<section class="nx-wr-talent"><div><h4>Talent Forge Handoff</h4><p id="nxWrTalent">Load a specialization in Talent Forge to review your manually planned ranks.</p></div><button id="nxWrTalentRefresh" type="button">REFRESH DRAFT</button><button id="nxWrGoTalent" type="button">OPEN TALENT FORGE</button></section>'+
'<p class="nx-wr-foot">This view does not certify item ownership, talent legality, equipment upgrades or combat performance. Public equipment and locally entered plans are distinct sources, and Blizzard responses can lag behind the game.</p>';
anchor.after(board);
let current=null,visible=16;
function records(){
 const a=read(K.atlas),l=read(K.loot),t=read(K.targets);
 return {atlas:Array.isArray(a)?a.slice(0,5000):[],loot:Array.isArray(l)?l.slice(0,200):[],targets:Array.isArray(t?.targets)?t.targets.slice(0,1500):[]};
}
function links(item,data){
 const key=current.region+'/'+current.realm+'/'+current.name;
 return {
  atlas:data.atlas.find(x=>x&&Number(x.id)===item.id&&x.region===current.region),
  loot:data.loot.find(x=>x&&Number(x.id)===item.id),
  target:data.targets.find(x=>x&&Number(x.itemId)===item.id&&x.region===current.region&&x.character===key)
 };
}
function inspect(item){
 if(!valid(item.id))return;
 const tab=nav.querySelector('[data-view="codex"]'),form=e('cxItemForm');
 if(!tab||!form){e('nxWrStatus').textContent='Item Codex is not available.';return}
 tab.click();e('cxItemId').value=item.id;e('cxItemRegion').value=current.region;form.requestSubmit();
}
function track(item){
 if(!valid(item.id))return;
 if(records().loot.some(x=>Number(x?.id)===item.id)){e('nxWrStatus').textContent='Item is already on Loot Hunter.';return}
 window.dispatchEvent(new CustomEvent('nexus:loot-track',{detail:{id:item.id,name:item.name,region:current.region,note:'Tracked manually from public Armory research.'}}));
 e('nxWrStatus').textContent=records().loot.some(x=>Number(x?.id)===item.id)?'Goal added to Loot Hunter.':'Could not confirm a saved goal. Check Loot Hunter.';
 render();
}
function render(){
 if(!current)return;
 const data=records(),annotated=current.items.map(item=>({item,flags:links(item,data)}));
 const counts=[['Equipped records',annotated.length],['In Item Atlas',annotated.filter(x=>x.flags.atlas).length],['Loot Hunter goals',annotated.filter(x=>x.flags.loot).length],['Character objectives',annotated.filter(x=>x.flags.target).length]];
 const metrics=e('nxWrMetrics');metrics.replaceChildren();
 for(const [name,n] of counts){const box=dom('div',undefined,'nx-wr-stat');box.append(dom('strong',n),dom('span',name));metrics.append(box)}
 metrics.hidden=false;
 const filter=e('nxWrFilter').value,q=e('nxWrSearch').value.trim().toLowerCase();
 const shown=annotated.filter(({item,flags})=>{
  if(q&&!(item.name+' '+item.slot+' '+(item.id||'')).toLowerCase().includes(q))return false;
  if(filter==='atlas'&&!flags.atlas||filter==='loot'&&!flags.loot||filter==='target'&&!flags.target)return false;
  if(filter==='none'&&(flags.atlas||flags.loot||flags.target))return false;
  return true;
 });
 const list=e('nxWrList');list.replaceChildren();const fragment=document.createDocumentFragment();
 for(const {item,flags} of shown.slice(0,visible)){
  const row=dom('div',undefined,'nx-wr-row');row.setAttribute('role','listitem');
  const info=dom('div',undefined,'nx-wr-info');
  info.append(dom('strong',item.name),dom('small',item.slot+' · '+(item.level==null?'Level unavailable':'Item level '+item.level)+(item.id?' · Item #'+item.id:'')));
  const tags=dom('div',undefined,'nx-wr-tags');
  if(flags.atlas)tags.append(dom('span','Atlas: '+String(flags.atlas.status||'saved').slice(0,25)));
  if(flags.loot)tags.append(dom('span',flags.loot.done?'Loot: manually completed':'Loot: tracked'));
  if(flags.target)tags.append(dom('span',flags.target.done?'Target: manually done':'Target: open'));
  if(!tags.children.length)tags.append(dom('span','Not tracked'));
  info.append(tags);
  const actions=dom('div',undefined,'nx-wr-actions');
  if(valid(item.id)){
   const inspectButton=dom('button','INSPECT ITEM');inspectButton.type='button';inspectButton.addEventListener('click',()=>inspect(item));actions.append(inspectButton);
   const trackButton=dom('button',flags.loot?'TRACKED':'TRACK GOAL');trackButton.type='button';trackButton.disabled=!!flags.loot;trackButton.addEventListener('click',()=>track(item));actions.append(trackButton);
  }
  row.append(info,actions);fragment.append(row);
 }
 if(!shown.length)fragment.append(dom('p','No returned records match this filter. This does not establish that the character has no equipment.','nx-wr-empty'));
 list.append(fragment);
 const more=e('nxWrMore');more.replaceChildren();
 more.append(dom('span','Showing '+Math.min(visible,shown.length)+' of '+shown.length+' matching records'));
 if(shown.length>visible){const next=dom('button','SHOW NEXT '+Math.min(16,shown.length-visible));next.type='button';next.addEventListener('click',()=>{visible+=16;render()});more.append(next)}
}
function reviewTalent(){
 const out=e('nxWrTalent');
 const fn=window.NexusTalentSourceBridge?.snapshot;let value=null;
 try{if(typeof fn==='function')value=fn()}catch(_){}
 if(!value?.ready||!Array.isArray(value.catalog)){out.textContent='Load an official tree in Talent Forge to review a separate manually planned build.';return}
 let nodes=0,points=0;
 for(const node of value.catalog){
  const n=Number(value.allocations?.[String(node.id)]||0);
  if(Number.isSafeInteger(n)&&n>0){nodes++;points+=n}
 }
 out.textContent=nodes+' manually selected nodes · '+points+' planned rank points · '+value.catalog.length+' source-returned talent nodes. This is not confirmation of the Armory character’s in-game talent choices.';
}
document.addEventListener('nexus:armory-intelligence-ready',event=>{
 const d=event.detail||{};
 if(!['us','eu','kr','tw'].includes(d.region)||!Array.isArray(d.items))return;
 current={region:d.region,realm:String(d.realm||'').slice(0,80),name:String(d.name||'').slice(0,50),
  items:d.items.slice(0,64).map(x=>({id:valid(x.id),name:String(x.name||'Unnamed item').slice(0,140),slot:String(x.slot||'Unspecified slot').slice(0,80),level:x.level===null||!Number.isFinite(Number(x.level))?null:Number(x.level)}))};
 visible=16;e('nxWrFilter').value='all';e('nxWrSearch').value='';
 e('nxWrStatus').textContent=String(d.character||d.name||'Character').slice(0,80)+' · '+current.items.length+' equipped records · '+current.region.toUpperCase()+'. Personal tracker status is separate.';
 render();reviewTalent();
});
e('nxWrFilter').addEventListener('change',()=>{visible=16;render()});
e('nxWrSearch').addEventListener('input',()=>{visible=16;render()});
e('nxWrRefresh').addEventListener('click',()=>{if(current)render();else e('nxWrStatus').textContent='Load a character first.'});
e('nxWrTalentRefresh').addEventListener('click',reviewTalent);
e('nxWrGoTalent').addEventListener('click',()=>nav.querySelector('[data-view="talents"]')?.click());
for(const evt of ['nexus:item-atlas-changed','nexus:character-targets-changed','nexus:loot-updated'])window.addEventListener(evt,()=>{if(current)render()});
window.addEventListener('storage',evt=>{if(current&&Object.values(K).includes(evt.key))render()});
})();