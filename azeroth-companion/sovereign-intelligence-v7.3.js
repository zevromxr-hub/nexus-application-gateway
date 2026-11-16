/* NEXUS v7.3 — Source-Backed Character Intelligence.
 * Read-only; no extra API calls, auth access, auto writes, or simulated DPS.
 * Receives sanitized public character/equipment data from existing Armory.
 */
(()=>{'use strict';
const armory=document.querySelector('[data-section="armory"]'),equipment=document.getElementById('cxEquipment');
if(!armory||!equipment||document.getElementById('nxCharacterIntelligence'))return;
const box=document.createElement('section');box.id='nxCharacterIntelligence';box.className='nx-character-intel panel';
box.innerHTML='<div class="nx-intel-head"><div><span class="wow-kicker">NEXUS / SOVEREIGN INTELLIGENCE</span><h3>Character Intelligence</h3><p>Source-backed equipment overview from the most recent public Blizzard Armory lookup. No hidden account access or simulated combat ratings.</p></div><span class="nx-intel-chip">BLIZZARD-RETURNED DATA</span></div>'+
'<div id="nxIntelStatus" class="nx-intel-status" role="status" aria-live="polite">Load a character using Live Armory to see its equipment intelligence.</div>'+
'<div id="nxIntelMetrics" class="nx-intel-metrics" hidden></div>'+
'<div id="nxIntelDetails" class="nx-intel-details" hidden><div class="nx-intel-tools"><label>Review order<select id="nxIntelOrder"><option value="slot">Equipment slot</option><option value="level-asc">Item level · lowest first</option><option value="level-desc">Item level · highest first</option></select></label><button type="button" id="nxIntelOpenCodex">OPEN ITEM CODEX</button></div><div id="nxIntelList" class="nx-intel-list"></div><p class="nx-intel-explain">Item levels and differences are descriptive comparisons of source-returned equipment. They are not a recommended upgrade order, a DPS simulation, a complete slot audit, or proof of item ownership. Actual game eligibility and value may depend on class, specialization, effects, and content.</p></div>';
equipment.after(box);
const el=id=>document.getElementById(id);
let current=null;
const make=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(className)n.className=className;return n};
function integer(x){const n=Number(x);return Number.isSafeInteger(n)&&n>0?n:null}
function render(){
 if(!current)return;
 const items=current.items;
 const reliable=items.filter(x=>Number.isFinite(x.level)&&x.level>0);
 const levels=reliable.map(x=>x.level),low=levels.length?Math.min(...levels):null,high=levels.length?Math.max(...levels):null;
 const metrics=el('nxIntelMetrics');metrics.replaceChildren();
 const addMetric=(name,value,detail)=>{
  const part=make('div',undefined,'nx-intel-metric');
  part.append(make('strong',value),make('span',name),make('small',detail));metrics.append(part);
 };
 addMetric('Equipped records',items.length,'Returned by public Blizzard equipment API');
 addMetric('With item level',reliable.length,items.length-reliable.length+' without usable item level');
 addMetric('Returned level range',low===null?'Not available':low===high?String(low):low+'–'+high,'Range, not a performance score');
 addMetric('Character average item level',current.averageItemLevel??'Not available','Blizzard profile value; may not match equipped-only levels');
 metrics.hidden=false;
 const list=el('nxIntelList');list.replaceChildren();
 const order=el('nxIntelOrder').value;
 const sorted=items.slice().sort((a,b)=>{
  if(order==='level-asc')return(a.level??Infinity)-(b.level??Infinity)||a.slot.localeCompare(b.slot);
  if(order==='level-desc')return(b.level??-Infinity)-(a.level??-Infinity)||a.slot.localeCompare(b.slot);
  return a.slot.localeCompare(b.slot)||a.name.localeCompare(b.name);
 });
 if(!items.length){
  list.append(make('p',current.equipmentAvailable?'No equipped item records were returned for this character.':'Equipment could not be loaded. Character profile information is still available.','nx-intel-empty'));
 }
 for(const item of sorted){
  const row=make('div',undefined,'nx-intel-item'),data=make('div');
  data.append(make('strong',item.name),make('span',item.slot+' · '+(item.level===null?'Item level unavailable':'Item level '+item.level)));
  if(integer(item.id))data.append(make('small','Blizzard item ID: '+item.id));
  row.append(data);
  if(integer(item.id)){
   const btn=make('button','INSPECT ITEM');btn.type='button';
   btn.addEventListener('click',()=>{
    // Delegate to the existing Item Codex handler, preserving its API/error flow.
    const source=document.createElement('button');source.type='button';
    source.dataset.cxopen=String(item.id);source.dataset.cxregion=current.region;
    source.hidden=true;document.body.append(source);source.click();source.remove();
   });row.append(btn);
  }
  list.append(row);
 }
 el('nxIntelDetails').hidden=false;
 const label=[current.character,current.className,current.spec].filter(Boolean).join(' · ');
 const date=new Date(current.fetchedAt);
 el('nxIntelStatus').textContent=label+' · '+current.region.toUpperCase()+' · '+(Number.isFinite(date.getTime())?'Lookup: '+date.toLocaleString():'Latest public lookup')+(current.equipmentAvailable?' · Equipment available':' · Equipment unavailable');
}
el('nxIntelOrder').addEventListener('change',render);
el('nxIntelOpenCodex').addEventListener('click',()=>document.querySelector('.nav [data-view="codex"]')?.click());
document.addEventListener('nexus:armory-intelligence-ready',event=>{
 const data=event.detail||{};
 if(!['us','eu','kr','tw'].includes(data.region)||!Array.isArray(data.items))return;
 current={
  region:data.region,character:String(data.character||''),className:String(data.className||''),spec:String(data.spec||''),
  averageItemLevel:Number.isFinite(Number(data.averageItemLevel))&&data.averageItemLevel!==null?Number(data.averageItemLevel):null,
  equipmentAvailable:!!data.equipmentAvailable,
  fetchedAt:data.fetchedAt,
  items:data.items.slice(0,64).map(x=>({
   id:integer(x.id),name:String(x.name||'Unnamed item').slice(0,140),slot:String(x.slot||'Unspecified slot').slice(0,80),
   level:Number.isFinite(Number(x.level))&&x.level!==null&&Number(x.level)>0?Number(x.level):null
  }))
 };
 render();
});
})();
