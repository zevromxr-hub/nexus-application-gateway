/* NEXUS | AZEROTH v5.8 — Visual Build Architect.
 * Two independent, ephemeral scenarios; no direct writes to saved talent drafts.
 * Uses Blizzard-returned IDs and handoff to the existing inspector.
 */
(()=>{
'use strict';
const bridge=window.NexusTalentSourceBridge,core=window.NexusVisualArchitectCore;
const parent=document.getElementById('talentForge'),cmd=document.getElementById('tfCommand');
if(!parent||!cmd||!bridge||!core||document.getElementById('tfVisualArchitect'))return;
const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const el=id=>document.getElementById(id);
const panel=document.createElement('section');panel.className='panel tf-va';panel.id='tfVisualArchitect';
panel.innerHTML='<header class="tf-va-head"><div><span class="wow-kicker">NEXUS / TALENT FORGE v5.8</span><h3>Visual Build Architect</h3><p>Two independent planning sandboxes, source-driven skill cards, a point-by-point comparison and a guided review. Experiment freely without changing your active build or saved drafts.</p></div><span class="tf-va-tag">LOCAL SCENARIOS</span></header>'+
'<div class="tf-va-toolbar"><label>Scenario A source<select id="tfVaSourceA"><option value="working">Current working draft</option></select></label><label>Scenario B source<select id="tfVaSourceB"><option value="empty">Start blank</option><option value="working">Current working draft</option></select></label><button type="button" id="tfVaReset">RELOAD SCENARIOS</button></div>'+
'<p class="tf-va-note" id="tfVaStatus" role="status" aria-live="polite">Load a specialization to start comparing two plans.</p>'+
'<div class="tf-va-cards"><article class="tf-va-card"><h4>Scenario A <small>Research variant</small></h4><div class="tf-va-stats" id="tfVaStatsA"></div><div class="tf-va-field"><label for="tfVaNodeA">Inspect / adjust source talent</label><select id="tfVaNodeA"><option value="">Select official talent</option></select></div><div id="tfVaDetailA" class="tf-va-detail"></div><div class="tf-va-buttons"><button type="button" id="tfVaMinusA">− RANK</button><button type="button" id="tfVaPlusA">+ RANK</button><button type="button" id="tfVaInspectA">INSPECT IN FORGE</button></div></article>'+
'<article class="tf-va-card"><h4>Scenario B <small>Alternative variant</small></h4><div class="tf-va-stats" id="tfVaStatsB"></div><div class="tf-va-field"><label for="tfVaNodeB">Inspect / adjust source talent</label><select id="tfVaNodeB"><option value="">Select official talent</option></select></div><div id="tfVaDetailB" class="tf-va-detail"></div><div class="tf-va-buttons"><button type="button" id="tfVaMinusB">− RANK</button><button type="button" id="tfVaPlusB">+ RANK</button><button type="button" id="tfVaInspectB">INSPECT IN FORGE</button></div></article></div>'+
'<div class="tf-va-review"><div class="tf-va-review-head"><div><h4>Side-by-Side Planning Review</h4><p>Only differences in real Blizzard-returned node IDs, point allocations and choice indices are compared.</p></div><button type="button" id="tfVaCopy">COPY COMPARISON BRIEF</button></div><div class="tf-va-total" id="tfVaTotals" role="status" aria-live="polite"></div><div id="tfVaDiff" class="tf-va-diffs"></div><div id="tfVaWarnings" class="tf-va-warnings"></div></div>'+
'<details class="tf-va-help"><summary>How to use these planning scenarios</summary><p>Choose your current working draft or a previously saved build as the starting point for each scenario. The + and − buttons here change only these temporary scenarios; your normal tree allocations, undo history, automatic recovery and saved builds stay untouched. Use the existing Talent Forge to make a final build. Copy a comparison brief to share the research results.</p><p>Source relationships alone do not establish in-game prerequisites, class level, hero eligibility or valid talent budgets. No automatic import string or unsupported DPS recommendation is produced. Scenarios reset when you change specialization or reload this page.</p></details>';
cmd.after(panel);
const get=()=>bridge.snapshot();
let identity='',scenarios={A:null,B:null},dirty={A:false,B:false},selected={A:null,B:null},cached='',ready=false,timer=false;
function savedOption(x){return '<option value="'+esc(x.savedAt)+'">'+esc(x.name)+' · '+esc(x.savedAt.slice(0,10))+'</option>'}
function init(s){
 identity=s.identity;ready=true;dirty={A:false,B:false};selected={A:null,B:null};
 const saved=Array.isArray(s.savedDrafts)?s.savedDrafts:[];
 const a=el('tfVaSourceA'),b=el('tfVaSourceB');
 a.innerHTML='<option value="working">Current working draft</option>'+saved.map(savedOption).join('');
 b.innerHTML='<option value="empty">Start blank</option><option value="working">Current working draft</option>'+saved.map(savedOption).join('');
 a.value='working';b.value='empty';
 scenarios.A=core.copySnapshot({identity:s.identity,name:'Scenario A',allocations:s.allocations,choiceByNode:s.choiceByNode},s.identity);
 scenarios.B=core.copySnapshot({identity:s.identity,name:'Scenario B',allocations:{},choiceByNode:{}},s.identity);
 const options='<option value="">Choose a real talent node</option>'+s.catalog.map(n=>'<option value="'+n.id+'">'+esc(n.name)+' · #'+n.id+' · '+n.category+'</option>').join('');
 for(const side of ['A','B']){el('tfVaNode'+side).innerHTML=options;el('tfVaNode'+side).value=''}
 el('tfVaStatus').textContent='A starts from your current working draft. B starts empty. Experiment below; no changes are committed to Talent Forge.';
}
function load(side){
 const s=get(),v=el('tfVaSource'+side).value,raw=v==='working'?{identity:s.identity,allocations:s.allocations,choiceByNode:s.choiceByNode,name:'Working draft'}:
 v==='empty'?{identity:s.identity,allocations:{},choiceByNode:{},name:'Blank scenario'}:
 s.savedDrafts.find(x=>x.savedAt===v);
 const next=core.copySnapshot(raw,s.identity);
 if(!next){el('tfVaStatus').textContent='That saved build is no longer available. Choose a current source.';return}
 scenarios[side]=next;dirty[side]=false;draw(s);
}
function details(s,side){
 const target=el('tfVaDetail'+side),id=Number(el('tfVaNode'+side).value),node=s.catalog.find(n=>n.id===id),scenario=scenarios[side];
 const minus=el('tfVaMinus'+side),plus=el('tfVaPlus'+side),inspect=el('tfVaInspect'+side);
 minus.disabled=plus.disabled=inspect.disabled=!node;
 if(!node){target.textContent='Select an official node to see its rank limits, tooltip descriptions and source references.';return}
 const rank=Number(scenario.rankByNode[String(id)]||0),max=node.max;
 const record=s.nodes.find(n=>n.id===id);
 const rankRecord=record?.ranks?.[Math.max(0,rank-1)]||record?.ranks?.[0];
 const choice=rankRecord?.choices?.[Number(scenario.choiceByNode[String(id)]||0)]||rankRecord?.choices?.[0];
 const linkCount=s.linkEdges.filter(e=>e.to===id).length;
 target.innerHTML='<strong>'+esc(node.name)+'</strong><div class="tf-va-meta"><span>Node #'+id+'</span><span>'+rank+' / '+max+' points</span><span>'+linkCount+' source links</span></div><p>'+esc(choice?.description||'Blizzard did not return a rank tooltip here. Inspect in Talent Forge for any other available ranks.')+'</p><small>Talent ID: '+(choice?.talentId?'#'+choice.talentId:'not returned')+' · Spell ID: '+(choice?.spellId?'#'+choice.spellId:'not returned')+'</small>';
 minus.disabled=rank===0;plus.disabled=rank>=max;
 if(!record){target.insertAdjacentHTML('beforeend','<p class="hint">This talent is outside the currently visible source pool. Select INSPECT IN FORGE to switch pools and examine its rank data.</p>')}
}
function renderTotals(s){
 const a=core.summary(scenarios.A,s.catalog,s.linkEdges),b=core.summary(scenarios.B,s.catalog,s.linkEdges);
 const chip=x=>'<span>'+x.count+' selected · '+x.total+' points <small>Class '+x.categories.class+' | Spec '+x.categories.spec+' | Hero '+x.categories.hero+'</small></span>';
 el('tfVaStatsA').innerHTML=chip(a);el('tfVaStatsB').innerHTML=chip(b);
 el('tfVaTotals').innerHTML='<strong>A:</strong> '+a.total+' planned · <strong>B:</strong> '+b.total+' planned · <strong>Point difference:</strong> '+(b.total-a.total>0?'+':'')+(b.total-a.total);
 const diff=core.difference(scenarios.A,scenarios.B,s.catalog);
 el('tfVaDiff').innerHTML=diff.length?'<div class="tf-va-scroll"><table><thead><tr><th>Blizzard node</th><th>Scenario A</th><th>Scenario B</th><th>B − A</th></tr></thead><tbody>'+diff.slice(0,120).map(n=>'<tr><th>'+esc(n.name)+' <small>#'+n.id+' · '+esc(n.category)+'</small></th><td>'+n.from+'</td><td>'+n.to+'</td><td>'+(n.delta>0?'+':'')+n.delta+(n.choiceA!==n.choiceB?' · choice '+(n.choiceA+1)+' → '+(n.choiceB+1):'')+'</td></tr>').join('')+'</tbody></table></div>':'<p class="hint">Both variants currently have identical allocated ranks and choices.</p>';
 const warn=(n,x)=>'<div><strong>Scenario '+n+'</strong> · '+x.issues.length+' structural issues · '+x.advisories.length+' source-link notes'+(x.issues.length?'<p>'+x.issues.slice(0,4).map(esc).join(' · ')+'</p>':'')+(x.advisories.length?'<p>'+x.advisories.slice(0,4).map(esc).join(' · ')+'</p>':'')+'</div>';
 el('tfVaWarnings').innerHTML=warn('A',a)+warn('B',b)+'<p class="tf-va-disclaimer">These are manual research notes, not proof that either build is legal or stronger in World of Warcraft. No real gameplay performance is calculated.</p>';
}
function draw(s=get()){
 if(!s.ready||!scenarios.A||!scenarios.B){el('tfVaStatus').textContent='Load a specialization to start planning scenarios.';return}
 for(const side of ['A','B'])details(s,side);
 renderTotals(s);
}
function inspect(side){
 const s=get(),id=Number(el('tfVaNode'+side).value),n=s.catalog.find(x=>x.id===id);
 if(!n)return;
 const tab=parent.querySelector('[data-tf-tab="'+n.category+'"]');tab?.click();
 if(n.category==='hero'){const select=el('tfHeroTree');if(select&&select.value!=='all'){select.value='all';select.dispatchEvent(new Event('change',{bubbles:true}))}}
 for(const [id,value,kind]of [['tfFindNode','','input'],['tfReviewOnly',false,'change']]){const e=el(id);if(e&&(id==='tfFindNode'?e.value!=='':e.checked)){if(id==='tfFindNode')e.value=value;else e.checked=value;e.dispatchEvent(new Event(kind,{bubbles:true}))}}
 const run=()=>{const button=parent.querySelector('#tfTree [data-tf-inspect="'+n.id+'"]');if(button)button.click();else el('tfVaStatus').textContent='Talent is not visible in the selected tree view. Try Compact cards or clear the tree filters.'};
 requestAnimationFrame(run);
}
function refresh(){
 const s=get();
 if(!s.ready){ready=false;identity='';return}
 if(!ready||identity!==s.identity)init(s);
 const saveA=el('tfVaSourceA'),saveB=el('tfVaSourceB');
 const options=(s.savedDrafts||[]).map(x=>x.savedAt);
 const sig=s.identity+'|'+options.join('|');
 if(sig!==cached){cached=sig;
  for(const [side,element]of [['A',saveA],['B',saveB]]){
   const old=element.value;
   const lead=side==='A'?'<option value="working">Current working draft</option>':'<option value="empty">Start blank</option><option value="working">Current working draft</option>';
   element.innerHTML=lead+(s.savedDrafts||[]).map(savedOption).join('');
   element.value=[...element.options].some(x=>x.value===old)?old:(side==='A'?'working':'empty');
  }
 }
 draw(s);
}
for(const side of ['A','B']){
 el('tfVaSource'+side).addEventListener('change',()=>load(side));
 el('tfVaNode'+side).addEventListener('change',()=>draw());
 el('tfVaInspect'+side).addEventListener('click',()=>inspect(side));
 for(const [key,delta]of [['Minus',-1],['Plus',1]])el('tfVa'+key+side).addEventListener('click',()=>{
  const s=get(),id=Number(el('tfVaNode'+side).value),next=core.adjust(scenarios[side],s.catalog,id,delta);
  if(!next)return;
  scenarios[side]=next;dirty[side]=true;
  el('tfVaStatus').textContent='Scenario '+side+' updated temporarily. Your active build, saved drafts and undo history have not changed.';
  draw(s);
 });
}
el('tfVaReset').addEventListener('click',()=>{const s=get();if(!s.ready)return;for(const side of ['A','B'])load(side)});
el('tfVaCopy').addEventListener('click',async()=>{
 const s=get();if(!s.ready)return;
 const changes=core.difference(scenarios.A,scenarios.B,s.catalog);
 const a=core.summary(scenarios.A,s.catalog,s.linkEdges),b=core.summary(scenarios.B,s.catalog,s.linkEdges);
 const lines=['NEXUS | AZEROTH — VISUAL BUILD ARCHITECT','Region/spec identity: '+s.identity,'Scenario A: '+scenarios.A.name+' ('+a.total+' points)','Scenario B: '+scenarios.B.name+' ('+b.total+' points)','Changed official node allocations: '+changes.length,...changes.slice(0,120).map(n=>n.name+' [#'+n.id+']: '+n.from+' → '+n.to+(n.choiceA!==n.choiceB?' (choice index '+n.choiceA+' → '+n.choiceB+')':'')),'Structural issues A/B: '+a.issues.length+'/'+b.issues.length,'Source-linked review notes A/B: '+a.advisories.length+'/'+b.advisories.length,'Manual research comparison only. Not a Blizzard talent import code or legal-loadout verification.'];
 try{await navigator.clipboard.writeText(lines.join('\n'));el('tfVaStatus').textContent='Comparison brief copied. Scenarios are still separate from your saved builds.'}
 catch(_){el('tfVaStatus').textContent='Clipboard unavailable. You can still review the comparison in this panel.'}
});
const observer=new MutationObserver(()=>{if(timer)return;timer=true;requestAnimationFrame(()=>{timer=false;refresh()})});
observer.observe(document.getElementById('tfTree'),{childList:true});
el('tfSave')?.addEventListener('click',()=>requestAnimationFrame(refresh));
el('tfSaved')?.addEventListener('click',()=>requestAnimationFrame(refresh));
refresh();
})();
