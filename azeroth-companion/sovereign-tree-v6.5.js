/* NEXUS | AZEROTH v6.5 — Sovereign Tree visual system.
 * Presentation-only: no changes to Blizzard talent IDs, positions, point allocations,
 * prerequisites, saves, or original rank buttons. Classification denotes visual
 * connection importance only, not official rarity/keystone/capstone status.
 */
(()=>{'use strict';
const tree=document.getElementById('tfTree'),tools=document.getElementById('tfCanvasTools'),bridge=window.NexusTalentSourceBridge;
if(!tree||!tools||!bridge||document.getElementById('nxSovereignTreeMode'))return;
const mode=document.createElement('button');mode.type='button';mode.id='nxSovereignTreeMode';mode.textContent='✦ ASCENDANT VIEW';mode.setAttribute('aria-pressed','true');mode.title='Toggle immersive fantasy visualization. Does not modify your build.';
tools.querySelector('.tf-canvas-actions')?.append(mode);
const hud=document.createElement('div');hud.id='nxSovereignHUD';hud.className='nx-sovereign-hud';hud.innerHTML='<span class="nx-hud-title">SOVEREIGN TREE</span><span id="nxSovereignSummary">Load a talent tree to explore its branches.</span><span class="nx-hud-note">Visual hierarchy based on source links and rank structure · not official unlock tiers</span>';
tree.before(hud);
const legend=document.createElement('details');legend.className='nx-sovereign-legend';legend.innerHTML='<summary>NODE SHAPES & BRANCHES</summary><div>✧ Standard · ◇ Multiple ranks · ⬡ Choice · ✦ Connected hub · Gold path: planned endpoints · Cyan path: source-linked · Dashed: source relation, not verified unlock requirement</div>';
hud.after(legend);
let enabled=true,queued=false,signature='',lastGrid=null;
function get(){try{return bridge.snapshot()}catch(_){return null}}
function refresh(){
 queued=false;
 const grid=tree.querySelector('.tf-positioned'),s=get();if(!grid||!s?.ready){hud.querySelector('#nxSovereignSummary').textContent='Load a talent tree to explore its branches.';lastGrid=null;return}
 const cards=[...grid.querySelectorAll('[data-tf-node]')];
 const ids=new Set(cards.map(n=>Number(n.dataset.tfNode)));
 const meta=new Map((s.catalog||[]).map(n=>[Number(n.id),n]));
 const links=(s.linkEdges||[]).filter(e=>ids.has(e.from)&&ids.has(e.to)).slice(0,400);
 const degree=new Map();for(const e of links){degree.set(e.from,(degree.get(e.from)||0)+1);degree.set(e.to,(degree.get(e.to)||0)+1)}
 let selected=0,choices=0,hubs=0;
 for(const card of cards){
  const id=Number(card.dataset.tfNode),n=meta.get(id),rank=Number(s.allocations?.[String(id)]||0);
  const choice=!!card.querySelector('[data-tf-choice]'),hub=(degree.get(id)||0)>=3,multi=(n?.max||1)>1;
  card.dataset.nxShape=choice?'choice':hub?'hub':multi?'multi':'standard';
  card.classList.toggle('nx-sovereign-planned',rank>0);
  if(rank>0)selected++;if(choice)choices++;if(hub)hubs++;
  let marker=card.querySelector('.nx-node-kind');
  if(!marker){marker=document.createElement('span');marker.className='nx-node-kind';marker.setAttribute('aria-hidden','true');const heading=card.querySelector('strong');heading?.before(marker)}
  const label=choice?'CHOICE':hub?'CONNECTED HUB':multi?'MULTI-RANK':'TALENT';
  if(marker&&marker.textContent!==label)marker.textContent=label;
 }
 const svg=grid.querySelector('.tf-link-layer');
 if(svg){
  const paths=[...svg.querySelectorAll('path')];
  paths.forEach((p,i)=>{
   const edge=links[i];if(!edge)return;
   const a=Number(s.allocations?.[String(edge.from)]||0),b=Number(s.allocations?.[String(edge.to)]||0);
   p.classList.toggle('nx-path-planned',a>0&&b>0);
   p.classList.toggle('nx-path-semi',!(a>0&&b>0)&&(a>0||b>0));
  });
 }
 hud.querySelector('#nxSovereignSummary').textContent=cards.length+' returned nodes · '+selected+' planned · '+choices+' choices · '+hubs+' connected hubs · '+links.length+' displayed source links';
 signature=s.identity+'|'+s.active+'|'+selected+'|'+links.length;lastGrid=grid;
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
function applyMode(){tree.classList.toggle('nx-sovereign-active',enabled);hud.hidden=!enabled;legend.hidden=!enabled;mode.textContent=enabled?'✦ ASCENDANT ON':'✧ ASCENDANT OFF';mode.setAttribute('aria-pressed',String(enabled));schedule()}
mode.addEventListener('click',()=>{enabled=!enabled;applyMode()});
tree.addEventListener('click',e=>{if(e.target.closest('[data-tf-node]'))setTimeout(schedule,0)});
new MutationObserver(schedule).observe(tree,{childList:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-tf-tab],#tfUndo,#tfRedo,#tfLoad,#tfClear'))setTimeout(schedule,0)});
document.addEventListener('change',e=>{if(e.target.closest('#tfHeroTree,#tfLayout,#tfSpec,#tfRegion,#tfShowLinks'))setTimeout(schedule,0)});
document.addEventListener('nexus:view-activated',schedule);
applyMode();
})();