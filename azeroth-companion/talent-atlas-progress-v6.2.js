/* NEXUS | AZEROTH v6.2.0 — Talent Atlas Progress & Immersive Workspace.
 * Read-only UI layer. Uses existing Talent Canvas zoom actions and Blizzard node IDs.
 * No alteration to allocations, saved builds or underlying engine.
 */
(()=>{'use strict';
const tree=document.getElementById('tfTree'),bar=document.getElementById('tfCanvasTools');
const bridge=window.NexusTalentSourceBridge,forge=document.getElementById('talentForge');
if(!tree||!bar||!bridge||!forge||document.getElementById('nxTreeProgress'))return;
const parent=tree.closest('.tf-toolbar')||tree.parentElement;
const controls=document.createElement('section');controls.id='nxTreeProgress';controls.className='nx-tree-progress';
controls.innerHTML='<div class="nx-tree-progress-head"><div><span class="wow-kicker">NEXUS / TALENT ATLAS v6.2</span><h3>Progress Intelligence</h3><p>Color-coded <b>planned ranks</b>, not loot rarity, acquisition difficulty, or in-game unlock verification. Amber indicates reported source links to review.</p></div><div class="nx-tree-progress-actions"><label>Highlight<select id="nxTreeStatusFilter"><option value="all">All nodes</option><option value="complete">Fully planned</option><option value="partial">Partially planned</option><option value="empty">Unallocated</option><option value="review">Review source links</option></select></label><button type="button" id="nxTreeExpand" aria-pressed="false">⛶ FULL SCREEN TREE</button></div></div><div class="nx-tree-progress-stats" id="nxTreeProgressStats" aria-live="polite">Load a specialization to view planned progress.</div><div class="nx-tree-progress-legend" aria-label="Planning status legend"><span class="nx-key nx-key-complete">● Full ranks</span><span class="nx-key nx-key-partial">● Partial ranks</span><span class="nx-key nx-key-empty">● No ranks</span><span class="nx-key nx-key-review">● Source link review</span></div><p class="nx-tree-instruction">Inside the tree: mouse wheel zooms in/out • drag blank canvas to pan • use + / − / FIT / RESET or minimap. Outside the tree: regular page scrolling.</p>';
bar.before(controls);
const el=id=>document.getElementById(id),filter=el('nxTreeStatusFilter'),button=el('nxTreeExpand');
const eligible=()=>!!tree.querySelector('.tf-positioned')&&tree.classList.contains('tf-canvas-active');
let scheduled=false,lastSignature='',fallback=false,zoomTick=0;
function snapshot(){try{return bridge.snapshot()}catch(_){return null}}
function update(){
 scheduled=false;
 const s=snapshot(),cards=[...tree.querySelectorAll('[data-tf-node]')];
 if(!s?.ready||!cards.length){el('nxTreeProgressStats').textContent='Load a specialization to view planned progress.';return}
 const catalog=new Map((s.catalog||[]).map(n=>[String(n.id),n]));
 const upstream=new Map();
 for(const edge of s.linkEdges||[]){const key=String(edge.to);if(!upstream.has(key))upstream.set(key,[]);upstream.get(key).push(edge)}
 const counts={complete:0,partial:0,empty:0,review:0,points:0,max:0},view=filter.value;
 for(const card of cards){
  const key=card.dataset.tfNode,info=catalog.get(key);if(!info)continue;
  const max=Math.max(1,Math.min(50,Number(info.max)||1));
  const planned=Math.max(0,Math.min(max,Number(s.allocations?.[key])||0));
  const links=upstream.get(key)||[];
  const missing=links.filter(link=>!link.resolved||(planned>0&&(Number(s.allocations?.[String(link.from)])||0)===0)).length;
  const status=planned>=max?'complete':planned>0?'partial':'empty';
  counts[status]++;if(missing)counts.review++;
  counts.points+=planned;counts.max+=max;
  card.dataset.nxProgress=status;
  card.dataset.nxReview=missing?'yes':'no';
  card.classList.toggle('nx-tree-dimmed',view!=='all'&&(view==='review'?!missing:status!==view));
  card.style.setProperty('--nx-progress',Math.round(planned/max*100)+'%');
  let pill=card.querySelector('.nx-tree-rank-pill');
  if(!pill){pill=document.createElement('span');pill.className='nx-tree-rank-pill';pill.setAttribute('aria-hidden','true');const controls=card.querySelector('.tf-node-controls');if(controls)controls.before(pill);else card.append(pill)}
  const text=planned+'/'+max+' ranks'+(missing?' · REVIEW':'');
  if(pill.textContent!==text)pill.textContent=text;
  card.title=(info.name||'Talent')+' · '+text+' · Node #'+key+'. Reported upstream links are advisory; this is not a confirmed in-game unlock rule.';
 }
 const sig=[s.identity,s.active,counts.complete,counts.partial,counts.empty,counts.review,counts.points,counts.max,view].join('|');
 if(sig!==lastSignature){lastSignature=sig;el('nxTreeProgressStats').innerHTML='<span><strong>'+counts.points+'</strong> planned rank points</span><span><strong>'+counts.complete+'</strong> fully planned</span><span><strong>'+counts.partial+'</strong> in progress</span><span><strong>'+counts.empty+'</strong> unallocated</span><span><strong>'+counts.review+'</strong> source-link reviews</span>'}
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(update)}
filter.addEventListener('change',schedule);
tree.addEventListener('click',()=>setTimeout(schedule,0));
document.addEventListener('click',e=>{if(e.target.closest('[data-tf-tab],#tfUndo,#tfRedo,#tfLoad,#tfClear,#tfImport,#tfSaved,#tfHeroTree'))setTimeout(schedule,0)});
document.addEventListener('change',e=>{if(e.target.closest('#tfHeroTree,#tfLayout,#tfSpec,#tfRegion'))setTimeout(schedule,0)});
const observer=new MutationObserver(schedule);observer.observe(tree,{childList:true,subtree:false});
function toggleFallback(on){
 fallback=on;
 document.body.classList.toggle('nx-tree-presentation',on);
 parent.classList.toggle('nx-tree-fallback-fullscreen',on);
 button.textContent=on?'✕ EXIT FULL SCREEN':'⛶ FULL SCREEN TREE';
 button.setAttribute('aria-pressed',String(on));
 if(on){parent.setAttribute('role','dialog');parent.setAttribute('aria-label','Full-screen talent tree');}else{parent.removeAttribute('role');parent.removeAttribute('aria-label')}
 window.dispatchEvent(new Event('resize'));
}
button.addEventListener('click',()=>{
 if(document.fullscreenElement===parent){document.exitFullscreen?.().catch(()=>{});return}
 if(fallback){toggleFallback(false);return}
 if(typeof parent.requestFullscreen==='function'){parent.requestFullscreen().then(()=>{button.textContent='✕ EXIT FULL SCREEN';button.setAttribute('aria-pressed','true');window.dispatchEvent(new Event('resize'))}).catch(()=>toggleFallback(true))}
 else toggleFallback(true);
});
document.addEventListener('fullscreenchange',()=>{
 const open=document.fullscreenElement===parent;
 button.textContent=open?'✕ EXIT FULL SCREEN':'⛶ FULL SCREEN TREE';
 button.setAttribute('aria-pressed',String(open));
 window.dispatchEvent(new Event('resize'));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fallback)toggleFallback(false)});
document.addEventListener('nexus:view-activated',e=>{if(e.detail?.view!=='talents'&&fallback)toggleFallback(false);else if(e.detail?.view==='talents')schedule()});
// Capture before legacy handler so the ordinary wheel will zoom only on the tree.
// Existing Atlas +/- buttons own the scale, positions and minimap sync.
tree.addEventListener('wheel',e=>{
 if(!eligible()||!e.deltaY||e.target.closest('input,select,textarea,[contenteditable]'))return;
 if(e.cancelable)e.preventDefault();
 e.stopImmediatePropagation();
 const now=performance.now();if(now-zoomTick<45)return;zoomTick=now;
 const action=e.deltaY<0?'in':'out';
 const btn=bar.querySelector('[data-canvas="'+action+'"]');
 btn?.click();
},{passive:false,capture:true});
schedule();
})();
