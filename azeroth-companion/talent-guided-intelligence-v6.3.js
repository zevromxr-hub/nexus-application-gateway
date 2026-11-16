/* NEXUS AZEROTH v6.3 — Guided Talent Intelligence. Read-only except invoking original controls. */
(()=>{'use strict';
const root=document.getElementById('talentForge'),tree=document.getElementById('tfTree'),atlas=document.getElementById('nxTreeProgress'),bridge=window.NexusTalentSourceBridge;
if(!root||!tree||!atlas||!bridge||document.getElementById('nxGuidedForge'))return;
const el=id=>document.getElementById(id);
const escapeText=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const guide=document.createElement('details');guide.id='nxGuidedForge';guide.className='nx-guided-forge';
guide.innerHTML='<summary>✦ GUIDED BUILD CREATOR <small>Optional · manual build planning</small></summary>'+
'<div class="nx-guide-body"><p>Choose a goal and use the existing talent controls to allocate points. Recommendations, legal builds and combat performance are not inferred.</p>'+
'<div class="nx-guide-fields"><label>Activity<select id="nxGuideActivity"><option value="general">General</option><option value="raid">Raid</option><option value="mythic-plus">Mythic+</option><option value="pvp">PvP</option><option value="solo">Solo</option><option value="open-world">Open World</option></select></label>'+
'<label>Role<select id="nxGuideRole"><option value="unspecified">Unspecified</option><option value="damage">Damage</option><option value="tank">Tank</option><option value="healer">Healer</option></select></label>'+
'<label>Style<select id="nxGuideStyle"><option value="balanced">Balanced</option><option value="burst">Burst</option><option value="sustain">Sustained output</option><option value="utility">Utility</option><option value="survival">Survivability</option></select></label></div>'+
'<div id="nxGuideSteps" class="nx-guide-steps" aria-live="polite">Load a talent specialization.</div>'+
'<div class="nx-guide-buttons"><button type="button" id="nxGuideApply">APPLY GOALS TO PLANNER</button><button type="button" id="nxGuideNext">NEXT TREE</button><button type="button" id="nxGuideReviewButton">REVIEW PROGRESS</button><button type="button" id="nxGuideSave">SAVE BUILD</button></div>'+
'<div id="nxGuideReview" class="nx-guide-review" hidden></div></div>';
atlas.before(guide);
const inspector=document.createElement('section');inspector.id='nxTalentInspector';inspector.className='nx-talent-inspector';inspector.hidden=true;
inspector.innerHTML='<div class="nx-inspect-head"><div><span class="wow-kicker">NEXUS / TALENT INSPECTOR</span><h3 id="nxInspectTitle">Talent details</h3></div><button type="button" id="nxInspectClose" aria-label="Close talent details">✕</button></div>'+
'<div class="nx-rank-preview"><label for="nxInspectPreviewRank">PREVIEW RANK EFFECT <small>(does not spend points)</small></label><select id="nxInspectPreviewRank" aria-label="Preview talent rank"></select><button type="button" id="nxInspectPreviewApply">APPLY PREVIEWED RANK</button></div>'+ 
'<div id="nxInspectPreviewEffect" class="nx-preview-effect" aria-live="polite"></div>'+ 
'<div id="nxInspectContent" class="nx-inspect-content" aria-live="polite"></div>'+
'<div class="nx-inspect-actions"><button type="button" id="nxInspectMinus">− RANK</button><button type="button" id="nxInspectPlus">+ RANK</button><button type="button" id="nxInspectLocate">LOCATE</button><button type="button" id="nxInspectOriginal">ORIGINAL INSPECTOR</button></div>';
tree.after(inspector);
const pathBar=document.createElement('div');pathBar.className='nx-path-controls';pathBar.innerHTML='<label><input type="checkbox" id="nxPathToggle" checked> Highlight connected talents</label><button type="button" id="nxPathClear">CLEAR PATH</button><small id="nxPathSummary" role="status">Select any node to inspect details.</small>';atlas.append(pathBar);
let selected=null,identity='',scheduled=false,previewRank=null;
function snapshot(){try{return bridge.snapshot()}catch(_){return null}}
function card(id){return [...tree.querySelectorAll('[data-tf-node]')].find(n=>n.dataset.tfNode===String(id))}
function highlight(s){
 const cards=tree.querySelectorAll('[data-tf-node]');
 for(const node of cards)node.classList.remove('nx-node-selected','nx-node-up','nx-node-down');
 if(selected===null||!s?.ready||!el('nxPathToggle').checked)return;
 const id=Number(selected),edges=s.linkEdges||[];
 const traverse=forward=>{const out=new Set(),queue=[id];while(queue.length&&out.size<300){const p=queue.shift();for(const e of edges){const n=forward&&e.from===p?e.to:!forward&&e.to===p?e.from:null;if(n===null||n===id||out.has(n))continue;out.add(n);queue.push(n)}}return out};
 const up=traverse(false),down=traverse(true);
 for(const node of cards){const n=Number(node.dataset.tfNode);node.classList.toggle('nx-node-selected',n===id);node.classList.toggle('nx-node-up',up.has(n));node.classList.toggle('nx-node-down',down.has(n))}
 el('nxPathSummary').textContent='Node #'+selected+' · '+up.size+' upstream and '+down.size+' downstream references (advisory, not verified unlock requirements).';
}
function render(){
 scheduled=false;const s=snapshot();
 if(!s?.ready){el('nxGuideSteps').textContent='Load a Blizzard specialization to begin.';return}
 if(s.identity!==identity){identity=s.identity;selected=null;previewRank=null;inspector.hidden=true;}
 const totals={class:0,spec:0,hero:0};for(const n of s.catalog||[])if(n.category in totals)totals[n.category]+=Number(s.allocations[String(n.id)]||0);
 el('nxGuideSteps').textContent='1. Choose goal → 2. Inspect talents → 3. Allocate points → 4. Review & save · Class '+totals.class+' / Spec '+totals.spec+' / Hero '+totals.hero+' planned points.';
 if(selected!==null&&!inspector.hidden){
 const n=s.nodes?.find(x=>String(x.id)===selected),meta=s.catalog?.find(x=>String(x.id)===selected);
 if(!n){el('nxInspectTitle').textContent=meta?.name||'Talent';el('nxInspectContent').textContent='Switch to this talent’s Class, Specialization or Hero tab to inspect rank descriptions.'}
 else{
 const allocated=Math.max(0,Number(s.allocations[selected]||0)),max=Math.max(1,Number(n.max)||1);
 const desired=previewRank===null?Math.max(1,allocated):previewRank;
 const count=Math.max(1,n.ranks?.length||1);
 const rankNumber=Math.max(1,Math.min(desired,count));
 const rank=n.ranks?.[rankNumber-1];
 const choice=rank?.choices?.[n.choice]||rank?.choices?.[0];
 const info=(n.ranks||[]).slice(0,20).map((r,i)=>{const x=r.choices?.[n.choice]||r.choices?.[0];return '<div class="nx-inspect-rank"><strong>Rank '+(i+1)+'</strong><p>'+escapeText(x?.description||'Description not supplied by Blizzard.')+'</p></div>'}).join('');
 const incoming=(s.linkEdges||[]).filter(e=>String(e.to)===selected);
 const desc=choice?.description||meta?.summary||'Description not supplied by Blizzard.';
 const dropdown=el('nxInspectPreviewRank'),previous=dropdown.value;
 const options=(n.ranks||[]).map((entry,i)=>'<option value="'+(i+1)+'">Rank '+(i+1)+(allocated===i+1?' · current':'')+'</option>').join('');
 if(dropdown.dataset.node!==selected||dropdown.dataset.ranks!==String(count)){
  dropdown.innerHTML=options||'<option value="1">Rank 1</option>';
  dropdown.dataset.node=selected;dropdown.dataset.ranks=String(count);
 }
 dropdown.value=String(rankNumber);
 const preview=el('nxInspectPreviewEffect');
 preview.textContent='Rank '+rankNumber+' effect · '+desc+' · '+(allocated===rankNumber?'currently planned':'preview only; no points applied');
 el('nxInspectPreviewApply').disabled=allocated===rankNumber||!card(selected)||Math.abs(allocated-rankNumber)>Math.max(1,max);

 el('nxInspectTitle').textContent=n.name||meta?.name||'Talent';
 el('nxInspectContent').innerHTML='<div class="nx-inspect-tags"><span>Node #'+escapeText(selected)+'</span><span>'+escapeText(String(meta?.category||s.active).toUpperCase())+'</span><span>'+allocated+'/'+max+' planned ranks</span></div>'+
 '<p>'+escapeText(desc)+'</p><div class="nx-inspect-progress"><div style="width:'+Math.round(allocated/max*100)+'%"></div></div>'+
 '<small>Spell ID: '+escapeText(choice?.spellId??meta?.spellId??'Not provided')+' · Talent ID: '+escapeText(choice?.talentId??meta?.talentId??'Not provided')+'</small>'+
 '<details open><summary>Official rank descriptions</summary>'+info+'</details>'+
 '<details><summary>Upstream source references ('+incoming.length+')</summary><p>'+escapeText(incoming.map(e=>{const source=s.catalog?.find(x=>x.id===e.from);return(source?.name||'Node #'+e.from)+' ('+(Number(s.allocations[e.from])||0)+' planned)'}).join(' · ')||'No upstream references provided.')+'</p><small>Reported links are advisory; not a complete prerequisite validator.</small></details>';
 }
 el('nxInspectMinus').disabled=!card(selected)?.querySelector('[data-tf-dec]:not([disabled])');
 el('nxInspectPlus').disabled=!card(selected)?.querySelector('[data-tf-inc]:not([disabled])');
 }
 highlight(s);
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(render)}
function choose(id){if(!id)return;if(selected!==String(id))previewRank=null;selected=String(id);inspector.hidden=false;render();}
tree.addEventListener('click',e=>{
 const node=e.target.closest('[data-tf-node]');if(!node)return;
 // Rank and choice actions are delegated to the original planner. Never
 // re-select or scroll the inspector when those controls are clicked.
 if(e.target.closest('button,select,input,label,a,[data-tf-inc],[data-tf-dec]')){setTimeout(schedule,0);return}
 choose(node.dataset.tfNode);
});
el('nxInspectClose').addEventListener('click',()=>{selected=null;previewRank=null;inspector.hidden=true;el('nxPathSummary').textContent='Select any node to inspect details.';highlight(snapshot())});
el('nxInspectMinus').addEventListener('click',()=>{
 const button=card(selected)?.querySelector('[data-tf-dec]:not([disabled])');
 if(!button)return;previewRank=null;button.click();setTimeout(schedule,0);
});
el('nxInspectPlus').addEventListener('click',()=>{
 const button=card(selected)?.querySelector('[data-tf-inc]:not([disabled])');
 if(!button)return;previewRank=null;button.click();setTimeout(schedule,0);
});
el('nxInspectPreviewRank').addEventListener('change',e=>{previewRank=Number(e.target.value)||1;render()});
el('nxInspectPreviewApply').addEventListener('click',()=>{
 const s=snapshot(),n=s?.nodes?.find(x=>String(x.id)===selected);
 if(!n||previewRank===null)return;
 const before=Math.max(0,Number(s.allocations?.[selected])||0);
 const target=Math.min(Number(n.max)||1,Math.max(0,previewRank));
 if(before===target)return;
 // Single-step actions retain the original planner's undo and recovery checks.
 // Deliberately never bypass disabled buttons or write draft data directly.
 const increment=target>before,button=card(selected)?.querySelector(increment?'[data-tf-inc]:not([disabled])':'[data-tf-dec]:not([disabled])');
 if(!button)return;
 button.click();
 setTimeout(schedule,0);
 const message=el('nxInspectPreviewEffect');
 message.textContent='Applied one '+(increment?'increase':'decrease')+' using the original Talent Forge controls. Continue until the previewed rank is reached.';
});
el('nxInspectLocate').addEventListener('click',()=>card(selected)?.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}));
el('nxInspectOriginal').addEventListener('click',()=>card(selected)?.querySelector('[data-tf-inspect]')?.click());
el('nxPathToggle').addEventListener('change',()=>highlight(snapshot()));
el('nxPathClear').addEventListener('click',()=>{selected=null;inspector.hidden=true;el('nxPathSummary').textContent='Path highlight cleared.';highlight(snapshot())});
el('nxGuideApply').addEventListener('click',()=>{for(const [src,dest] of [['nxGuideActivity','tfPlanActivity'],['nxGuideRole','tfPlanRole'],['nxGuideStyle','tfPlanStyle']]){const t=el(dest);if(!t)continue;t.value=el(src).value;t.dispatchEvent(new Event('change',{bubbles:true}))}const output=el('nxGuideReview');output.hidden=false;output.textContent='Goals copied into the existing planner. Select talents manually below; no automatic allocation was made.'});
el('nxGuideNext').addEventListener('click',()=>{const tabs=['class','spec','hero'],s=snapshot(),next=tabs[(tabs.indexOf(s?.active)+1)%3];root.querySelector('[data-tf-tab="'+next+'"]')?.click();setTimeout(schedule,0)});
el('nxGuideReviewButton').addEventListener('click',()=>{const s=snapshot(),output=el('nxGuideReview');output.hidden=false;output.replaceChildren();if(!s?.ready){output.textContent='Load a specialization first.';return}
const chosen=(s.catalog||[]).filter(n=>Number(s.allocations[String(n.id)])>0),total=chosen.reduce((x,n)=>x+Number(s.allocations[n.id]),0);
const flagged=(s.linkEdges||[]).filter(e=>Number(s.allocations[e.to])>0&&(!e.resolved||!Number(s.allocations[e.from]))).length;
const head=document.createElement('p');head.textContent=total+' planned rank points across '+chosen.length+' nodes · '+flagged+' reported connections to review. Advisory only; not game-validated.';output.append(head);
const list=document.createElement('ol');for(const n of chosen.slice(0,80)){const row=document.createElement('li');row.textContent=n.name+' '+s.allocations[n.id]+'/'+n.max;list.append(row)}output.append(list)});
el('nxGuideSave').addEventListener('click',()=>el('tfSave')?.click());
document.addEventListener('click',e=>{if(e.target.closest('[data-tf-tab],#tfUndo,#tfRedo,#tfLoad,#tfClear,#tfSaved'))setTimeout(schedule,0)});
document.addEventListener('change',e=>{if(e.target.closest('#tfHeroTree,#tfLayout,#tfSpec,#tfRegion'))setTimeout(schedule,0)});
new MutationObserver(schedule).observe(tree,{childList:true,subtree:false});
document.addEventListener('nexus:view-activated',schedule);
schedule();
})();