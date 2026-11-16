/* NEXUS | AZEROTH v7.4 — Gear & Talent Mastery.
 * No new requests or storage writes. Uses sanitized public Armory events,
 * existing item Codex links, and a read-only Talent Forge source snapshot.
 */
(()=>{'use strict';
const armory=document.getElementById('nxCharacterIntelligence'),forge=document.getElementById('talentForge');
if(!armory||document.getElementById('nxMasteryPanel'))return;
const panel=document.createElement('section');panel.id='nxMasteryPanel';panel.className='nx-mastery-panel panel';
panel.innerHTML='<div class="nx-mastery-head"><div><span class="wow-kicker">NEXUS / EQUIPMENT RESEARCH</span><h3>Sovereign Gear Mastery</h3><p>Compare any two equipped items from a public character lookup. Review actual recorded levels, slots and official IDs without fictional upgrades or damage scores.</p></div><span class="nx-mastery-tag">RESEARCH ONLY</span></div>'+
'<p id="nxMasteryStatus" role="status">Load a public character through Live Armory to compare source-returned equipment.</p>'+
'<div class="nx-mastery-picker"><label>Equipment A<select id="nxMasteryA" disabled><option value="">Load equipment first</option></select></label><label>Equipment B<select id="nxMasteryB" disabled><option value="">Load equipment first</option></select></label></div>'+
'<div class="nx-mastery-compare" id="nxMasteryComparison" aria-live="polite">Select two returned items to review their recorded properties.</div>'+
'<div class="nx-mastery-actions"><button type="button" id="nxMasteryOpenA" disabled>INSPECT A IN ITEM CODEX</button><button type="button" id="nxMasteryOpenB" disabled>INSPECT B IN ITEM CODEX</button><button type="button" id="nxMasteryOpenForge">OPEN TALENT FORGE</button></div>'+
'<div class="nx-mastery-talent" id="nxMasteryTalent"><h4>Talent Forge connection</h4><p id="nxMasteryTalentContext">Talent Forge is an independent research workspace. Load an official specialization tree there to review your manually planned talent ranks.</p><button type="button" id="nxMasteryRefreshTalent">REFRESH TALENT SUMMARY</button></div>'+
'<p class="nx-mastery-disclaimer">The comparison uses item data returned by Blizzard’s public equipment response. Higher item level alone does not establish an upgrade. Two different slots cannot be considered direct replacements. Talent Forge context is a separate manual draft; it is not confirmed as this character’s in-game talents.</p>';
armory.after(panel);
const el=id=>document.getElementById(id);
const validId=n=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<=9999999999?Number(n):null;
const numericLevel=n=>Number.isFinite(Number(n))&&n!==null&&Number(n)>0?Number(n):null;
const make=(tag,text,cl)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=String(text);if(cl)node.className=cl;return node};
let source=null;
function itemAt(id){return source?.items[Number(id)]||null}
function clearOptions(select,items){
 select.replaceChildren();
 if(!items.length){select.append(new Option('No equipped records',''));select.disabled=true;return}
 select.append(new Option('Choose an item',''));
 items.forEach((item,index)=>select.append(new Option(item.slot+' — '+item.name, String(index))));
 select.disabled=false;
}
function inspect(item){
 const id=validId(item?.id);
 if(!id||!source)return;
 const trigger=document.createElement('button');
 trigger.type='button';trigger.hidden=true;trigger.dataset.cxopen=String(id);
 trigger.dataset.cxregion=source.region;
 document.body.append(trigger);trigger.click();trigger.remove();
}
function compare(){
 const a=itemAt(el('nxMasteryA').value),b=itemAt(el('nxMasteryB').value),box=el('nxMasteryComparison');
 el('nxMasteryOpenA').disabled=!validId(a?.id);el('nxMasteryOpenB').disabled=!validId(b?.id);
 box.replaceChildren();
 if(!a||!b){box.append(make('p','Choose two equipped records to compare source-backed details.'));return}
 const table=make('div',undefined,'nx-mastery-matrix');
 for(const [name,va,vb] of [
  ['Equipment',a.name,b.name],
  ['Slot',a.slot,b.slot],
  ['Official item ID',validId(a.id)??'Unavailable',validId(b.id)??'Unavailable'],
  ['Returned item level',numericLevel(a.level)??'Unavailable',numericLevel(b.level)??'Unavailable']
 ]){
  const row=make('div',undefined,'nx-mastery-row');
  row.append(make('strong',name),make('span',va),make('span',vb));table.append(row);
 }
 box.append(table);
 const la=numericLevel(a.level),lb=numericLevel(b.level);
 if(la!==null&&lb!==null){
  const diff=lb-la;
  box.append(make('p','Recorded item-level difference (B − A): '+(diff>0?'+':'')+diff+'. '+(a.slot===b.slot?'Both records report the same equipment slot.':'These records report different slots; do not interpret this difference as a replacement recommendation.'),'nx-mastery-note'));
 }else box.append(make('p','The source response did not provide usable levels for both items, so no numeric comparison is available.','nx-mastery-note'));
}
function talentSummary(){
 const out=el('nxMasteryTalentContext');
 const snapshot=window.NexusTalentSourceBridge?.snapshot;
 if(typeof snapshot!=='function'){out.textContent='Talent Forge source bridge is unavailable. You can still open the existing planner.';return}
 let s;
 try{s=snapshot()}catch(_){s=null}
 if(!s?.ready||!Array.isArray(s.catalog)){out.textContent='Load a specialization in Talent Forge to review a separately planned build. No in-game talent allocation is assumed.';return}
 const assigned=s.allocations||{};
 const sums={class:0,spec:0,hero:0};let nodes=0;
 for(const n of s.catalog){
  const raw=Number(assigned[String(n.id)]||0);
  const ranks=Number.isSafeInteger(raw)&&raw>0?raw:0;
  if(!ranks)continue;
  nodes++;
  if(Object.prototype.hasOwnProperty.call(sums,n.category))sums[n.category]+=ranks;
 }
 out.textContent='Separate Talent Forge draft: '+nodes+' selected nodes · Class '+sums.class+' points · Specialization '+sums.spec+' points · Hero '+sums.hero+' points. These are manually planned allocations, not confirmed in-game talents for '+(source?.character||'the Armory character')+'.';
}
function navTalent(){
 const button=document.querySelector('.nav [data-view="talents"]');
 button?.click();
 if(button)window.scrollTo({top:0,behavior:'instant'});
}
function refresh(event){
 const d=event.detail||{};
 if(!['us','eu','kr','tw'].includes(d.region)||!Array.isArray(d.items))return;
 source={region:d.region,character:String(d.character||'').slice(0,80),items:d.items.slice(0,64).map(x=>({
  name:String(x.name||'Unnamed item').slice(0,140),slot:String(x.slot||'Unspecified slot').slice(0,80),
  id:validId(x.id),level:numericLevel(x.level)
 }))};
 clearOptions(el('nxMasteryA'),source.items);
 clearOptions(el('nxMasteryB'),source.items);
 if(source.items.length>=2){el('nxMasteryA').value='0';el('nxMasteryB').value='1'}
 el('nxMasteryStatus').textContent=source.character+' · '+source.items.length+' records in latest public equipment lookup · region '+d.region.toUpperCase()+'.';
 compare();talentSummary();
}
document.addEventListener('nexus:armory-intelligence-ready',refresh);
el('nxMasteryA').addEventListener('change',compare);
el('nxMasteryB').addEventListener('change',compare);
el('nxMasteryOpenA').addEventListener('click',()=>inspect(itemAt(el('nxMasteryA').value)));
el('nxMasteryOpenB').addEventListener('click',()=>inspect(itemAt(el('nxMasteryB').value)));
el('nxMasteryOpenForge').addEventListener('click',navTalent);
el('nxMasteryRefreshTalent').addEventListener('click',talentSummary);
document.addEventListener('nexus:view-activated',e=>{if(e.detail?.view==='armory')talentSummary()});
})();
