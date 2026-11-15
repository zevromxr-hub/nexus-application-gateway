/* NEXUS | AZEROTH v5.7 — Talent Command.
 * Source-driven navigator, real node-id search, non-destructive what-if preview,
 * safe handoff to original increment/decrement controls, and readable path briefing.
 */
(()=>{
'use strict';
const forge=document.getElementById('talentForge'),tree=document.getElementById('tfTree');
const bridge=window.NexusTalentSourceBridge,core=window.NexusTalentCommandCore;
if(!forge||!tree||!bridge||!core||document.getElementById('tfCommand'))return;
const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const el=id=>document.getElementById(id);
const box=document.createElement('section');box.id='tfCommand';box.className='panel tf-command';
box.innerHTML='<header class="tf-cmd-head"><div><span class="wow-kicker">NEXUS / TALENT FORGE v5.7</span><h3>Talent Command Center</h3><p>Explore the full Blizzard-returned talent catalog, jump directly to real tree nodes and preview individual allocation changes before committing them through the existing undo-safe planner.</p></div><span class="tf-cmd-tag">SOURCE-DRIVEN PLANNER</span></header>'+
'<div id="tfCmdStats" class="tf-cmd-stats" role="status" aria-live="polite">Load a specialization to activate Talent Command.</div>'+
'<label class="tf-cmd-path-toggle"><input type="checkbox" id="tfCmdPathFocus"> Focus selected source connections on the actual talent tree (visual only)</label>'+

'<div class="tf-cmd-layout"><div class="tf-cmd-pane"><div class="tf-cmd-fields"><label>Find any talent<input id="tfCmdSearch" type="search" maxlength="90" placeholder="Name, description or real node ID"></label><label>Talent pool<select id="tfCmdCategory"><option value="all">All returned pools</option><option value="class">Class</option><option value="spec">Specialization</option><option value="hero">Hero</option></select></label><label>Show<select id="tfCmdFilter"><option value="all">Every returned node</option><option value="selected">Allocated talents</option><option value="linked">Source-linked talents</option><option value="review">Review-linked talents</option><option value="unselected">Unallocated talents</option></select></label></div><p id="tfCmdListStatus" class="hint" aria-live="polite">Select a specialization to explore.</p><div id="tfCmdList" class="tf-cmd-list" role="listbox" aria-label="Blizzard talent results"></div></div>'+
'<div class="tf-cmd-pane tf-cmd-detail"><h4>Skill Spotlight</h4><div id="tfCmdSpotlight" aria-live="polite" role="status">Select a talent from the navigator to see its real IDs, planned ranks and connected-source path.</div><div id="tfCmdActions" class="tf-cmd-actions"><button type="button" id="tfCmdJump" disabled>LOCATE IN TREE</button><button type="button" id="tfCmdInspect" disabled>OFFICIAL RANK DETAILS</button></div><div class="tf-cmd-preview"><h4>Point Sandbox</h4><p>Preview one point at a time without changing the draft. APPLY uses Talent Forge’s existing rank controls, undo history and recovery checks.</p><div class="tf-cmd-actions"><button type="button" id="tfCmdMinus" disabled>PREVIEW −1</button><button type="button" id="tfCmdPlus" disabled>PREVIEW +1</button><button type="button" id="tfCmdApply" disabled>APPLY PREVIEW</button></div><div id="tfCmdPreview" role="status" aria-live="polite">Choose a talent before previewing an allocation change.</div></div></div></div>'+
'<details class="tf-cmd-guide"><summary>How to use the upgraded talent trees safely</summary><p><strong>Find:</strong> Search across class, specialization and hero nodes by Blizzard-returned name, ID or rank tooltip. <strong>Locate:</strong> Switches to that pool, resets conflicting filters and shows the original interactive node. <strong>Inspect:</strong> Opens the existing full Blizzard rank/choice inspector. <strong>Preview:</strong> Computes an isolated one-point scenario. <strong>Apply:</strong> delegates to the existing +/− buttons, preserving undo and unsaved-draft recovery.</p><p>Path links originate from the current Blizzard talent-tree response. They do not establish minimum player level, talent tiers, all prerequisite alternatives, hero-path eligibility or a legal in-game build. There are no auto-generated talent recommendations or game import codes.</p></details>';
const workspace=tree.closest('.tf-toolbar')||forge.querySelector('section[data-section="talents"]');
workspace?.before(box);
const controls=['tfCmdSearch','tfCmdCategory','tfCmdFilter','tfCmdJump','tfCmdInspect','tfCmdMinus','tfCmdPlus','tfCmdApply'];
const get=()=>bridge.snapshot(),index=new Map();
let selected=null,identity='',preview=null,scheduled=false,listSig='',nodeSig='',latestSnapshot=null;
function name(n){return n?.name||'Node #'+n?.id}
function showEmpty(){
 el('tfCmdStats').textContent='Load a Blizzard specialization to browse talent records.';
 el('tfCmdList').innerHTML='<div class="empty">No talent records loaded.</div>';
 el('tfCmdListStatus').textContent='Choose a specialization first.';
 el('tfCmdSpotlight').textContent='Select a talent after loading a specialization.';
 for(const id of ['tfCmdJump','tfCmdInspect','tfCmdMinus','tfCmdPlus','tfCmdApply'])el(id).disabled=true;
}
function decorateTree(s){
 const focus=el('tfCmdPathFocus')?.checked&&selected!==null;
 const neighbors=new Set([selected]);
 if(focus)for(const e of s.linkEdges||[])if(e.from===selected||e.to===selected){neighbors.add(e.from);neighbors.add(e.to)}
 for(const node of tree.querySelectorAll('[data-tf-node]')){
  const id=Number(node.dataset.tfNode),up=(s.linkEdges||[]).filter(e=>e.to===id);
  const needs=up.filter(e=>Number(s.allocations[String(id)]||0)>0&&(e.resolved?Number(s.allocations[String(e.from)]||0)===0:true)).length;
  node.classList.toggle('tf-cmd-muted',Boolean(focus&&!neighbors.has(id)));
  node.classList.toggle('tf-cmd-linked-focus',Boolean(focus&&neighbors.has(id)));
  let badge=node.querySelector('.tf-cmd-tree-hint');
  if(!badge){badge=document.createElement('span');badge.className='tf-cmd-tree-hint';const control=node.querySelector('.tf-node-controls');control?.before(badge)}
  const label=up.length+' source links'+(needs?' · '+needs+' to review':'');
  if(badge&&badge.textContent!==label)badge.textContent=label;
  if(badge)badge.title='Blizzard-reported upstream links. This is not a game eligibility check.';
 }
}
function update(){
 const s=get();latestSnapshot=s;
 if(!s.ready||!Array.isArray(s.catalog)){showEmpty();return}
 if(identity!==s.identity){identity=s.identity;selected=null;preview=null;listSig='';nodeSig='';el('tfCmdSearch').value='';el('tfCmdCategory').value='all';el('tfCmdFilter').value='all'}
 const audit=core.audit(s);
 el('tfCmdStats').innerHTML='<span><b>'+audit.returned+'</b> returned nodes</span><span><b>'+audit.selected+'</b> selected nodes</span><span><b>'+audit.total+'</b> planned points</span><span><b>'+audit.links+'</b> reported links</span><span><b>'+audit.review.length+'</b> links to review</span>';
 const idSignature=s.identity+'|'+s.catalog.map(n=>n.id).join(',')+'|'+Object.entries(s.allocations).filter(([,v])=>v>0).map(([k,v])=>k+':'+v).join(',');
 const query=el('tfCmdSearch').value.trim().toLowerCase(),category=el('tfCmdCategory').value,filter=el('tfCmdFilter').value;
 const sig=idSignature+'|'+query+'|'+category+'|'+filter;
 if(sig!==listSig){listSig=sig;
  const linked=new Set(s.linkEdges.flatMap(e=>[e.from,e.to]));
  const flagged=new Set(audit.review.map(e=>e.id));
  const source=s.catalog.filter(n=>{
   if(category!=='all'&&category!==n.category)return false;
   const point=Number(s.allocations[String(n.id)]||0);
   if(filter==='selected'&&!point||filter==='unselected'&&point||filter==='linked'&&!linked.has(n.id)||filter==='review'&&!flagged.has(n.id))return false;
   const choice=s.nodes.find(x=>x.id===n.id),sourceText=(choice?.ranks||[]).flatMap(x=>x.choices||[]).map(x=>x.description||'').join(' ');
   return !query||name(n).toLowerCase().includes(query)||String(n.id).includes(query)||sourceText.toLowerCase().includes(query);
  });
  el('tfCmdListStatus').textContent=source.length+' matching nodes · showing first '+Math.min(source.length,140)+'. Rank/choice text search is available for the visible tree pool; other pools use returned node names and IDs.';
  el('tfCmdList').innerHTML=source.slice(0,140).map(n=>{const p=Number(s.allocations[String(n.id)]||0);
   return '<button type="button" role="option" aria-selected="'+(n.id===selected)+'" class="tf-cmd-result'+(n.id===selected?' is-active':'')+'" data-tf-cmd-node="'+n.id+'"><span><b>'+esc(name(n))+'</b><small>'+esc(n.category)+' · Blizzard node #'+n.id+'</small></span><strong>'+p+' / '+n.max+'</strong></button>';
  }).join('')||'<div class="empty">No source talents match these filters. Try All returned pools.</div>';
 }
 if(selected!==null&&!s.catalog.some(n=>n.id===selected)){selected=null;preview=null}
 spotlight(s,audit);
 decorateTree(s);
}
function spotlight(s,audit){
 const n=s.catalog.find(x=>x.id===selected),target=el('tfCmdSpotlight');
 for(const id of ['tfCmdJump','tfCmdInspect','tfCmdMinus','tfCmdPlus'])el(id).disabled=!n;
 if(!n){target.textContent='Choose a talent from the results. Its allocated rank, source connections and official rank tooltips will appear here.';el('tfCmdApply').disabled=true;el('tfCmdPreview').textContent='Choose a talent before previewing an allocation change.';return}
 const p=Number(s.allocations[String(n.id)]||0),path=core.trace(s,n.id),incoming=s.linkEdges.filter(e=>e.to===n.id),
 downstream=s.linkEdges.filter(e=>e.from===n.id);
 const returned=s.nodes.find(x=>x.id===n.id);
 const rankData=returned?.ranks?.[Math.max(0,p-1)]||returned?.ranks?.[0];
 const chosen=rankData?.choices?.[Number(s.choiceByNode?.[String(n.id)]||0)]||rankData?.choices?.[0];
 const description=typeof chosen?.description==='string'&&chosen.description.trim()?chosen.description:'No tooltip description for this selection is included in the currently visible source pool. Use OFFICIAL RANK DETAILS for returned rank records.';
 const list=path.levels.slice(0,22).map(x=>'<li>'+esc(x.name)+' · #'+x.id+' · '+x.points+' planned'+(x.depth>1?' · '+x.depth+' hops upstream':'')+'</li>').join('');
 target.innerHTML='<strong>'+esc(name(n))+'</strong><p class="tf-cmd-meta">'+esc(n.category)+' · Node #'+n.id+' · '+p+' / '+n.max+' planned rank(s)'+(n.default_points===null?'':' · '+n.default_points+' Blizzard default point(s)')+'</p>'+
 '<p class="tf-cmd-description">'+esc(description)+'</p>'+
 '<div class="tf-cmd-facts"><span>'+incoming.length+' reported upstream</span><span>'+downstream.length+' reported downstream</span><span>'+path.unresolved.length+' unresolved upstream</span></div>'+
 '<details><summary>Explore reported upstream path ('+path.levels.length+')</summary>'+(list?'<ol>'+list+'</ol>':'<p>No upstream records resolved in this response.</p>')+(path.cycle?'<p>Repeated references detected; this may be a convergence or cycle, not a game-rule conclusion.</p>':'')+(path.unresolved.length?'<p>Unresolved IDs: '+path.unresolved.slice(0,30).join(', ')+'</p>':'')+'</details>'+
 '<p class="hint">This is the Blizzard-reported node graph, not proof of required prerequisites or point eligibility.</p>';
 const prev=preview;
 if(!prev||prev.id!==n.id||prev.identity!==s.identity||prev.from!==p){preview=null;el('tfCmdApply').disabled=true;el('tfCmdPreview').textContent='Preview a single point adjustment, then use APPLY to commit it through the original planner.'}
 else{el('tfCmdApply').disabled=false;el('tfCmdPreview').textContent='Preview: '+prev.from+' → '+prev.to+' ranks · total planned points '+prev.before.total+' → '+prev.after.total+' · reported links to review '+prev.before.review.length+' → '+prev.after.review.length+'. Not an eligibility verdict.'}
 el('tfCmdPlus').disabled=p>=n.max;
 el('tfCmdMinus').disabled=p===0;
}
function pick(id){
 const s=get();const n=s.catalog?.find(x=>x.id===Number(id));if(!n)return;
 selected=n.id;preview=null;listSig='';update();
}
function locate(id){
 const s=get(),n=s.catalog?.find(x=>x.id===id);if(!n)return null;
 const tab=document.querySelector('[data-tf-tab="'+n.category+'"]');
 if(tab&&!tab.classList.contains('active'))tab.click();
 const hero=el('tfHeroTree');if(n.category==='hero'&&hero?.value!=='all'){hero.value='all';hero.dispatchEvent(new Event('change',{bubbles:true}))}
 const search=el('tfFindNode');if(search?.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}
 const flag=el('tfReviewOnly');if(flag?.checked){flag.checked=false;flag.dispatchEvent(new Event('change',{bubbles:true}))}
 const check=()=>tree.querySelector('[data-tf-node="'+id+'"]');
 let item=check();
 if(!item){const card=el('tfLayout');if(card?.value==='grid'){card.value='cards';card.dispatchEvent(new Event('change',{bubbles:true}));item=check()}}
 if(item){item.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'});item.classList.add('tf-cmd-pulse');setTimeout(()=>item.isConnected&&item.classList.remove('tf-cmd-pulse'),1700)}
 return item;
}
el('tfCmdPathFocus').addEventListener('change',update);
el('tfCmdSearch').addEventListener('input',update);
for(const id of ['tfCmdCategory','tfCmdFilter'])el(id).addEventListener('change',update);
el('tfCmdList').addEventListener('click',e=>{const b=e.target.closest('[data-tf-cmd-node]');if(b)pick(Number(b.dataset.tfCmdNode))});
el('tfCmdJump').addEventListener('click',()=>selected!==null&&locate(selected));
el('tfCmdInspect').addEventListener('click',()=>{const node=selected!==null?locate(selected):null;node?.querySelector('[data-tf-inspect]')?.click()});
for(const [id,delta]of [['tfCmdMinus',-1],['tfCmdPlus',1]]){
 el(id).addEventListener('click',()=>{if(selected===null)return;preview=core.preview(get(),selected,delta);spotlight(get(),core.audit(get()))})
}
el('tfCmdApply').addEventListener('click',()=>{
 if(!preview)return;const s=get();
 const current=Number(s.allocations[String(preview.id)]||0);
 if(s.identity!==preview.identity||current!==preview.from){preview=null;spotlight(s,core.audit(s));return}
 const targetId=preview.id,delta=preview.to-preview.from;const node=locate(targetId);
 const button=node?.querySelector(delta>0?'[data-tf-inc="'+targetId+'"]':'[data-tf-dec="'+targetId+'"]');
 preview=null;if(!button||button.disabled){spotlight(get(),core.audit(get()));return}
 button.click();
 requestAnimationFrame(()=>{listSig='';update();el('tfCmdPreview').textContent='Applied via the original Talent Forge rank control. Undo is available in Talent Workspace.'});
});
const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;update()})});
observer.observe(tree,{childList:true});
el('tfSaved')?.addEventListener('click',()=>requestAnimationFrame(update));
el('tfSave')?.addEventListener('click',()=>requestAnimationFrame(update));
window.addEventListener('pageshow',update);
update();
})();
