/* NEXUS | AZEROTH v6.6 — Sovereign Intelligence & Navigation.
 * Read-only: never writes allocations or storage, and uses existing FIT and rank controls.
 */
(()=>{'use strict';
const tree=document.getElementById('tfTree'),bar=document.getElementById('tfCanvasTools'),bridge=window.NexusTalentSourceBridge;
if(!tree||!bar||!bridge||document.getElementById('nxRouteNavigator'))return;
const actions=bar.querySelector('.tf-canvas-actions')||bar;
const nav=document.createElement('details');nav.id='nxRouteNavigator';nav.className='nx-route-navigator';
nav.innerHTML='<summary>✦ PATH NAVIGATOR <small>Find, focus and inspect · optional</small></summary>'+
'<div class="nx-route-body"><div class="nx-route-controls"><label>Find talent<input id="nxRouteSearch" type="search" maxlength="90" placeholder="Search talents or Blizzard node IDs" autocomplete="off"></label>'+
'<label>Talent<select id="nxRouteTalent" aria-label="Select a talent"><option value="">Load a tree first</option></select></label>'+
'<button type="button" id="nxRouteCenter">CENTER NODE</button><button type="button" id="nxRouteFit">FIT TREE</button><button type="button" id="nxRouteClear">CLEAR FOCUS</button></div>'+
'<div id="nxRouteStatus" role="status" class="nx-route-status">Select a talent to inspect its source-linked relationships.</div>'+
'<div class="nx-route-actions"><button type="button" id="nxRouteUp">UPSTREAM</button><button type="button" id="nxRouteDown">DOWNSTREAM</button><button type="button" id="nxRouteBoth">BOTH DIRECTIONS</button><button type="button" id="nxRouteAll">SHOW ALL</button></div>'+
'<div id="nxRouteDescription" class="nx-route-description" aria-live="polite" hidden></div></div>';
bar.after(nav);
const el=id=>document.getElementById(id);
let chosen='',focus='all',lastIdentity='',lastQuery='',pending=false,selectedSignature='';
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
const get=()=>{try{return bridge.snapshot()}catch(_){return null}};
const card=id=>[...tree.querySelectorAll('[data-tf-node]')].find(n=>n.dataset.tfNode===String(id));
function neighbors(start,links,direction){
 const seen=new Set(),queue=[Number(start)];
 while(queue.length&&seen.size<300){
  const n=queue.shift();
  for(const edge of links){
   const next=direction==='up'&&Number(edge.to)===n?Number(edge.from):direction==='down'&&Number(edge.from)===n?Number(edge.to):null;
   if(next===null||!Number.isFinite(next)||seen.has(next)||next===Number(start))continue;
   seen.add(next);queue.push(next);
  }
 }
 return seen;
}
function update(){
 pending=false;const s=get(),cards=[...tree.querySelectorAll('[data-tf-node]')],select=el('nxRouteTalent');
 if(!s?.ready||!cards.length){
  el('nxRouteStatus').textContent='Load a Blizzard talent tree to explore paths.';
  return;
 }
 const visible=new Set(cards.map(n=>String(n.dataset.tfNode)));
 const list=(s.catalog||[]).filter(n=>visible.has(String(n.id)));
 const identity=s.identity+'|'+s.active+'|'+cards.length+'|'+list.map(n=>n.id).join(',');
 const term=el('nxRouteSearch').value.trim().toLowerCase();
 if(identity!==lastIdentity||term!==lastQuery){
  lastIdentity=identity;lastQuery=term;
  const before=chosen;
  select.replaceChildren();
  const empty=document.createElement('option');empty.value='';empty.textContent='Select a talent';select.append(empty);
  const matching=list.filter(n=>!term||String(n.id).includes(term)||String(n.name||'').toLowerCase().includes(term)).slice(0,180);
  for(const n of matching){const opt=document.createElement('option');opt.value=String(n.id);opt.textContent=n.name+' · #'+n.id;select.append(opt)}
  if(!visible.has(before)){chosen='';focus='all'}
  select.value=matching.some(n=>String(n.id)===chosen)?chosen:'';
 }
 const edges=(s.linkEdges||[]).filter(e=>Number.isSafeInteger(Number(e.from))&&Number.isSafeInteger(Number(e.to)));
 const up=chosen?neighbors(chosen,edges,'up'):new Set();
 const down=chosen?neighbors(chosen,edges,'down'):new Set();
 const selected=chosen?(s.catalog||[]).find(n=>String(n.id)===chosen):null;
 for(const n of cards){
  const id=Number(n.dataset.tfNode);
  const emphasize=focus==='all'||!chosen||id===Number(chosen)||(focus==='up'&&up.has(id))||(focus==='down'&&down.has(id))||(focus==='both'&&(up.has(id)||down.has(id)));
  n.classList.toggle('nx-route-muted',!emphasize);
  n.classList.toggle('nx-route-target',!!chosen&&id===Number(chosen));
  n.classList.toggle('nx-route-before',!!chosen&&up.has(id));
  n.classList.toggle('nx-route-after',!!chosen&&down.has(id));
 }
 const planned=selected?Number(s.allocations?.[chosen]||0):0;
 el('nxRouteStatus').textContent=selected?selected.name+' · '+planned+'/'+(selected.max||1)+' planned ranks · '+up.size+' upstream / '+down.size+' downstream source references. Links are advisory, not guaranteed unlock requirements.':'Select a talent to highlight connected branches. No points are changed.';
 const description=el('nxRouteDescription');
 if(selected){
  const detail=(s.nodes||[]).find(n=>String(n.id)===chosen);
  const rank=detail?.ranks?.[Math.max(0,Math.min((detail.ranks?.length||1)-1,Math.max(1,planned)-1))];
  const choice=rank?.choices?.[detail?.choice||0]||rank?.choices?.[0];
  description.hidden=false;
  description.replaceChildren();
  const heading=document.createElement('strong');heading.textContent=selected.name+' · Official node #'+chosen;description.append(heading);
  const p=document.createElement('p');p.textContent=choice?.description||selected.summary||'Blizzard did not return a description for this rank.';description.append(p);
  const note=document.createElement('small');note.textContent='Spell ID '+(choice?.spellId??selected.spellId??'not returned')+' · Talent ID '+(choice?.talentId??selected.talentId??'not returned')+' · For full rank previews, use the existing Talent Inspector.';description.append(note);
 }else{description.hidden=true;description.replaceChildren()}
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(update)}
function center(){
 const n=card(chosen);if(!n)return;
 const viewport=tree.getBoundingClientRect(),rect=n.getBoundingClientRect();
 const x=rect.left+rect.width/2-viewport.left-viewport.width/2;
 const y=rect.top+rect.height/2-viewport.top-viewport.height/2;
 tree.scrollBy({left:x,top:y,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function choose(value){chosen=String(value||'');if(chosen)focus='both';schedule();}
el('nxRouteTalent').addEventListener('change',e=>{choose(e.target.value);center()});
el('nxRouteSearch').addEventListener('input',schedule);
el('nxRouteCenter').addEventListener('click',center);
el('nxRouteFit').addEventListener('click',()=>bar.querySelector('[data-canvas="fit"]')?.click());
el('nxRouteClear').addEventListener('click',()=>{chosen='';focus='all';el('nxRouteSearch').value='';lastQuery='~';schedule()});
for(const [id,value]of [['nxRouteUp','up'],['nxRouteDown','down'],['nxRouteBoth','both'],['nxRouteAll','all']]){
 el(id).addEventListener('click',()=>{focus=value;schedule()});
}
tree.addEventListener('click',e=>{
 if(!nav.open)return;
 const n=e.target.closest('[data-tf-node]');
 if(n){chosen=n.dataset.tfNode;focus='both';schedule()}
});
new MutationObserver(schedule).observe(tree,{childList:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-tf-tab],#tfUndo,#tfRedo,#tfLoad,#tfClear'))setTimeout(schedule,0)});
document.addEventListener('change',e=>{if(e.target.closest('#tfHeroTree,#tfLayout,#tfSpec,#tfRegion'))setTimeout(schedule,0)});
document.addEventListener('nexus:view-activated',schedule);
schedule();
})();