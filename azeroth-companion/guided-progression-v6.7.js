/* NEXUS | AZEROTH v6.7 — Guided Progression.
 * Presentation-only overlay: the existing Blizzard-backed Talent Forge owns all
 * allocations, recovery, undo, save and export operations.
 */
(()=>{'use strict';
const forge=document.getElementById('talentForge'),tree=document.getElementById('tfTree'),bridge=window.NexusTalentSourceBridge;
if(!forge||!tree||!bridge||document.getElementById('nxProgressJourney'))return;
const el=id=>document.getElementById(id);
const node=document.createElement('details');node.id='nxProgressJourney';node.className='nx-progress-journey';
node.innerHTML='<summary>✦ GUIDED PROGRESSION <small>Four steps · optional, no automatic points</small></summary>'+
'<div class="nx-journey-inner"><p class="nx-journey-intro">Choose your goals, explore the official talent trees, allocate points with the original controls, then review and save. Nothing here claims your build is legal in game.</p>'+
'<div class="nx-journey-track" role="group" aria-label="Build planning steps">'+
'<button type="button" data-nx-step="0">1 · GOALS</button><button type="button" data-nx-step="1">2 · EXPLORE</button><button type="button" data-nx-step="2">3 · ALLOCATE</button><button type="button" data-nx-step="3">4 · REVIEW</button></div>'+
'<div class="nx-journey-stage" id="nxJourneyStage" aria-live="polite"></div>'+
'<div class="nx-journey-actions"><button id="nxJourneyPrev" type="button">← BACK</button><button id="nxJourneyNext" type="button">NEXT STEP →</button><button id="nxJourneySave" type="button" hidden>SAVE WITH TALENT FORGE</button></div>'+
'<div class="nx-journey-note" id="nxJourneyNote" role="status"></div></div>';
const existing=el('nxGuidedForge'),atlas=el('nxTreeProgress');if(existing)existing.before(node);else if(atlas)atlas.before(node);else tree.before(node);
let step=0,identity='',pending=false;
const snapshot=()=>{try{return bridge.snapshot()}catch(_){return null}};
const create=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
const button=(text,fn)=>{const b=create('button',text);b.type='button';b.addEventListener('click',fn);return b};
function navigate(name){forge.querySelector('[data-tf-tab="'+name+'"]')?.click();setTimeout(schedule,0)}
function render(){
 pending=false;const s=snapshot(),ready=!!s?.ready;
 if(ready&&identity!==s.identity){identity=s.identity;step=0}
 const stage=el('nxJourneyStage');stage.replaceChildren();
 node.querySelectorAll('[data-nx-step]').forEach(b=>{b.setAttribute('aria-current',String(Number(b.dataset.nxStep)===step));b.classList.toggle('active',Number(b.dataset.nxStep)===step)});
 el('nxJourneyPrev').disabled=step===0;el('nxJourneyNext').hidden=step===3;el('nxJourneySave').hidden=step!==3;
 const title=['SET YOUR BUILD GOALS','EXPLORE TALENT BRANCHES','ALLOCATE PLANNED RANKS','REVIEW YOUR DRAFT'][step];
 stage.append(create('h4',title));
 if(!ready){stage.append(create('p','Load a Blizzard specialization tree using the existing Talent Forge controls before proceeding. Your saved drafts remain available.'));return}
 const catalog=s.catalog||[],alloc=s.allocations||{},sum={class:0,spec:0,hero:0};let planned=0,rankPoints=0;
 for(const talent of catalog){const count=Math.max(0,Number(alloc[String(talent.id)])||0);if(count){planned++;rankPoints+=count;if(talent.category in sum)sum[talent.category]+=count}}
 const goals=[['Activity','tfPlanActivity'],['Role','tfPlanRole'],['Style','tfPlanStyle']];
 if(step===0){
  stage.append(create('p','These choices describe your intent and are stored using the original planner fields—not as simulated build recommendations.'));
  const summary=document.createElement('div');summary.className='nx-journey-summary';
  for(const [name,id] of goals){const input=el(id);const value=input?.selectedOptions?.[0]?.textContent||'Not set';summary.append(create('span',name+': '+value))}
  stage.append(summary);
  stage.append(button('OPEN EXISTING BUILD GOALS',()=>{el('nxGuideDetails')?.setAttribute('open','');const target=el('tfPlanActivity');target?.scrollIntoView({behavior:'smooth',block:'center'});target?.focus({preventScroll:true})}));
 }else if(step===1){
  stage.append(create('p','Explore the returned Class, Specialization and Hero branches. Source links are useful context, not complete unlock requirements.'));
  const buttons=document.createElement('div');buttons.className='nx-journey-branches';
  for(const [name,label]of [['class','CLASS'],['spec','SPECIALIZATION'],['hero','HERO']]){
   const b=button(label+' · '+sum[name]+' points',()=>navigate(name));if(s.active===name)b.classList.add('active');buttons.append(b);
  }stage.append(buttons);
  stage.append(create('small','Use Ascendant View or Path Navigator to examine nodes. This guide does not alter talent selections.'));
 }else if(step===2){
  stage.append(create('p','Add or reduce ranks using the original +/− buttons or Rank Inspector. All point rules and recovery checks remain owned by the original Talent Forge.'));
  const summary=document.createElement('div');summary.className='nx-journey-summary';
  for(const k of ['class','spec','hero'])summary.append(create('span',k.toUpperCase()+': '+sum[k]+' rank points'));
  summary.append(create('span',planned+' selected talent nodes'));stage.append(summary);
  const actions=document.createElement('div');actions.className='nx-journey-branches';
  actions.append(button('FIND A TALENT',()=>{const panel=el('nxRouteNavigator');if(panel){panel.open=true;el('nxRouteSearch')?.focus()}else tree.scrollIntoView({behavior:'smooth',block:'center'})}));
  actions.append(button('OPEN TREE',()=>tree.scrollIntoView({behavior:'smooth',block:'center'})));stage.append(actions);
 }else{
  stage.append(create('p',rankPoints+' manually planned points across '+planned+' selected talents. Review your choices before saving; this does not validate an in-game build.'));
  const summary=document.createElement('div');summary.className='nx-journey-summary';
  for(const k of ['class','spec','hero'])summary.append(create('span',k.toUpperCase()+': '+sum[k]));stage.append(summary);
  const flagged=(s.linkEdges||[]).filter(e=>Number(alloc[String(e.to)])>0&&(!e.resolved||!Number(alloc[String(e.from)]))).length;
  stage.append(create('small',flagged+' reported source-link relationships to review (advisory only).'));
  const selected=catalog.filter(n=>Number(alloc[String(n.id)])>0);
  const list=document.createElement('details');list.className='nx-journey-node-list';list.innerHTML='<summary>SEE PLANNED TALENTS ('+selected.length+')</summary>';
  const listEl=document.createElement('ol');for(const n of selected.slice(0,100)){listEl.append(create('li',n.name+' — '+alloc[String(n.id)]+'/'+n.max+' ranks'))}list.append(listEl);stage.append(list);
 }
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(render)}
node.querySelectorAll('[data-nx-step]').forEach(b=>b.addEventListener('click',()=>{step=Number(b.dataset.nxStep);render()}));
el('nxJourneyPrev').addEventListener('click',()=>{step=Math.max(0,step-1);render()});
el('nxJourneyNext').addEventListener('click',()=>{step=Math.min(3,step+1);render()});
el('nxJourneySave').addEventListener('click',()=>{const s=snapshot();if(!s?.ready){el('nxJourneyNote').textContent='Load a tree first.';return}el('tfSave')?.click();el('nxJourneyNote').textContent='Save was requested through the existing Talent Forge. Check its confirmation and My Saved Talent Drafts.';setTimeout(schedule,0)});
new MutationObserver(schedule).observe(tree,{childList:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-tf-tab],#tfUndo,#tfRedo,#tfLoad,#tfClear,#tfSave,[data-tf-inc],[data-tf-dec]'))setTimeout(schedule,0)});
document.addEventListener('change',e=>{if(e.target.closest('#tfPlanActivity,#tfPlanRole,#tfPlanStyle,#tfHeroTree,#tfSpec,#tfRegion'))setTimeout(schedule,0)});
document.addEventListener('nexus:view-activated',schedule);
schedule();
})();