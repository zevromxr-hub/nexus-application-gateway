/* NEXUS | AZEROTH v5.5 — Build Intelligence: Blizzard-returned links,
 * source-limited draft diagnostics, saved-vs-saved diffs and skill spotlight.
 * No inferred talent eligibility, tier unlocking or in-game import codes.
 */
(()=>{
'use strict';
const tree=document.getElementById('tfTree'),planner=document.getElementById('tfPlanner'),bridge=window.NexusTalentSourceBridge;
if(!tree||!planner||!bridge||document.getElementById('tfBuildIntel'))return;
const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const panel=document.createElement('section');panel.id='tfBuildIntel';panel.className='panel tf-build-intel';
panel.innerHTML='<header class="tf-bi-heading"><div><span class="wow-kicker">NEXUS / TALENT FORGE v5.5</span><h3>Build Intelligence</h3><p>Inspect source-reported connections, check draft integrity, and compare two saved builds without modifying your allocations.</p></div><span class="tf-bi-badge">BLIZZARD SOURCE</span></header>'+
'<div class="tf-bi-grid"><section class="tf-bi-section"><h4>Source-backed allocation review</h4><div id="tfBiSummary" class="tf-bi-metrics" aria-live="polite">Load a specialization to review allocations.</div><div id="tfBiReview" class="tf-bi-list" role="status">No specialization selected.</div></section>'+
'<section class="tf-bi-section"><h4>Reported talent connections</h4><label class="tf-bi-label" for="tfBiNode">Inspect talent node</label><select id="tfBiNode"><option value="">Select a talent</option></select><div id="tfBiConnections" class="tf-bi-list" role="status">Choose a talent to inspect source links.</div><button id="tfBiInspect" type="button" disabled>OPEN SKILL DETAILS</button></section></div>'+
'<section class="tf-bi-section tf-bi-wide"><h4>Saved-build comparison</h4><div class="tf-bi-selectors"><label>Build A<select id="tfBiSaveA"><option value="">Current working draft</option></select></label><label>Build B<select id="tfBiSaveB"><option value="">Choose saved build</option></select></label></div><div id="tfBiDiff" class="tf-bi-diff" role="status" aria-live="polite">Save at least one draft to compare ranks and choices.</div></section>'+
'<p class="tf-bi-disclaimer">Review checks report structurally verifiable source fields only. Blizzard may omit relationships, prerequisites, hero eligibility, or level requirements; no green indicator certifies an in-game legal build. Saved builds and account credentials are never uploaded.</p>';
planner.after(panel);
const el=id=>document.getElementById(id),point=(map,id)=>Number(map?.[String(id)]||0);
const numbers=a=>a.reduce((v,n)=>v+Math.max(0,point(n.allocations,n.id)),0);
let signature='',lastIdentity='',updateQueued=false,inspected=null;
function snapshot(){return bridge.snapshot()}
function nodeName(n){return n?.name||('Node #'+n?.id)}
function badge(label,kind='neutral'){return '<span class="tf-bi-chip tf-bi-'+kind+'">'+esc(label)+'</span>'}
function renderMetrics(s){
 const known=new Map(s.catalog.map(n=>[String(n.id),n]));
 const rows=Object.entries(s.allocations||{}).filter(([,v])=>Number(v)>0);
 const allocated=rows.reduce((sum,[,value])=>sum+Number(value),0);
 const issues=[],review=[];
 for(const [id,value] of rows){
  const n=known.get(id);
  if(!n){issues.push('Unknown talent node #'+id+' is not in the loaded Blizzard record.');continue}
  if(!Number.isSafeInteger(value)||value<0||value>n.max)issues.push(nodeName(n)+' exceeds the Blizzard-returned rank count.');
 }
 for(const edge of s.linkEdges){
  if(!edge.resolved){if(point(s.allocations,edge.to)>0)review.push('Node #'+edge.to+' refers to upstream node #'+edge.from+' outside the returned tree.');continue}
  if(point(s.allocations,edge.to)>0&&point(s.allocations,edge.from)===0){
   const n=known.get(String(edge.to)),from=known.get(String(edge.from));
   review.push(nodeName(n)+' reports a link from '+nodeName(from)+', currently allocated 0 points.');
  }
 }
 const mix=['class','spec','hero'].map(cat=>({name:cat,points:s.catalog.filter(n=>n.category===cat).reduce((v,n)=>v+point(s.allocations,n.id),0)}));
 el('tfBiSummary').innerHTML='<div>'+badge(allocated+' total planned')+badge(rows.length+' chosen nodes')+mix.map(c=>badge(c.name+': '+c.points)).join('')+'</div>';
 const reviewParts=[...issues.map(x=>'<div class="tf-bi-note tf-bi-warning">'+esc(x)+'</div>'),
 ...review.slice(0,24).map(x=>'<div class="tf-bi-note">'+esc(x)+'</div>')];
 el('tfBiReview').innerHTML=reviewParts.join('')||
 '<div class="tf-bi-note tf-bi-neutral">No structural rank violations or zero-point source-linked upstream nodes detected. This does not certify a legal in-game build.</div>';
 if(review.length>24)el('tfBiReview').insertAdjacentHTML('beforeend','<p class="hint">'+(review.length-24)+' further source-linked references are omitted for readability.</p>');
}
function renderNodeOptions(s){
 const select=el('tfBiNode'),previous=select.value;
 select.innerHTML='<option value="">Select a talent</option>'+s.catalog.map(n=>'<option value="'+n.id+'">'+esc(nodeName(n))+' · #'+n.id+'</option>').join('');
 if(s.catalog.some(n=>String(n.id)===previous))select.value=previous;
 else if(inspected!==null&&s.catalog.some(n=>String(n.id)===String(inspected)))select.value=String(inspected);
 else select.value='';
 renderConnections(s);
}
function renderConnections(s){
 const id=Number(el('tfBiNode').value),node=s.catalog.find(n=>n.id===id);
 el('tfBiInspect').disabled=!node;
 if(!node){el('tfBiConnections').textContent='Select a talent to inspect official node connections.';return}
 const upstream=s.linkEdges.filter(e=>e.to===id),downstream=s.linkEdges.filter(e=>e.from===id);
 const byId=new Map(s.catalog.map(n=>[n.id,n]));
 const link=e=>{
  const related=byId.get(e.from===id?e.to:e.from),count=related?point(s.allocations,related.id):null;
  return '<li>'+esc(related?nodeName(related):'Node #'+(e.from===id?e.to:e.from))+' '+badge(related?'#'+related.id+' · '+count+' planned':'Unresolved source ID',related?'neutral':'warn')+'</li>';
 };
 el('tfBiConnections').innerHTML='<strong>'+esc(nodeName(node))+'</strong> '+badge('Node #'+id)+' '+badge(point(s.allocations,id)+' / '+node.max+' points')+
 '<p class="tf-bi-label">Blizzard-reported upstream links ('+upstream.length+')</p>'+(upstream.length?'<ul>'+upstream.map(link).join('')+'</ul>':'<p class="hint">No upstream references returned.</p>')+
 '<p class="tf-bi-label">Reported downstream links ('+downstream.length+')</p>'+(downstream.length?'<ul>'+downstream.map(link).join('')+'</ul>':'<p class="hint">No downstream references returned.</p>')+
 '<p class="hint">A reported link is not proof of a mandatory prerequisite; zero upstream points are a review prompt, not an invalidity verdict.</p>';
}
const savedKey=(a)=>a?.savedAt||'';
function renderSaves(s){
 const saved=s.savedDrafts||[];
 const a=el('tfBiSaveA'),b=el('tfBiSaveB'),beforeA=a.value,beforeB=b.value;
 const options=saved.map(x=>'<option value="'+esc(savedKey(x))+'">'+esc(x.name)+' · '+esc(savedKey(x).slice(0,16))+'</option>').join('');
 a.innerHTML='<option value="">Current working draft</option>'+options;
 b.innerHTML='<option value="">Choose saved build</option>'+options;
 a.value=saved.some(x=>savedKey(x)===beforeA)?beforeA:'';
 b.value=saved.some(x=>savedKey(x)===beforeB)?beforeB:(saved[0]?savedKey(saved[0]):'');
 renderDiff(s);
}
function renderDiff(s){
 const source=side=>{
  const id=el('tfBiSave'+side).value;
  return id?s.savedDrafts.find(x=>savedKey(x)===id):side==='A'?{name:'Current working draft',rankByNode:s.allocations,choiceByNode:s.choiceByNode}:null;
 };
 const a=source('A'),b=source('B'),box=el('tfBiDiff');
 if(!a||!b){box.textContent='Save a talent draft to compare it with your current allocation.';return}
 const catalog=new Map(s.catalog.map(n=>[String(n.id),n]));
 const keys=[...new Set([...Object.keys(a.rankByNode||{}),...Object.keys(b.rankByNode||{})])];
 const changed=keys.map(id=>({id,n:catalog.get(id),from:point(a.rankByNode,id),to:point(b.rankByNode,id),ca:Number(a.choiceByNode?.[id]||0),cb:Number(b.choiceByNode?.[id]||0)})).filter(x=>x.from!==x.to||x.ca!==x.cb);
 const total=map=>Object.values(map||{}).reduce((sum,x)=>sum+(Number.isSafeInteger(x)&&x>0?x:0),0);
 box.innerHTML='<p>'+badge(esc(a.name)+' · '+total(a.rankByNode)+' points')+badge(esc(b.name)+' · '+total(b.rankByNode)+' points')+badge(changed.length+' changed nodes')+'</p>'+
 (changed.length?'<div class="tf-bi-table-wrap"><table><thead><tr><th>Blizzard talent</th><th>A</th><th>B</th><th>Change</th></tr></thead><tbody>'+
 changed.slice(0,150).map(x=>'<tr><th>'+esc(x.n?nodeName(x.n):'Unknown node')+' <small>#'+esc(x.id)+'</small></th><td>'+x.from+'</td><td>'+x.to+'</td><td>'+((x.to-x.from)>0?'+':'')+(x.to-x.from)+(x.ca!==x.cb?' · choice '+(x.ca+1)+' → '+(x.cb+1):'')+'</td></tr>').join('')+
 '</tbody></table></div>':'<p class="hint">No point-allocation or choice-index differences.</p>')+
 '<p class="hint">This is a comparison of saved point choices, not damage, healing, gear score or an in-game legality check.</p>';
}
function render(){
 const s=snapshot();if(!s.ready||!s.catalog){el('tfBiSummary').textContent='Load a specialization to inspect source-backed allocations.';return}
 if(s.identity!==lastIdentity){lastIdentity=s.identity;signature='';inspected=null}
 const sig=s.identity+'|'+s.catalog.map(n=>n.id).join(',')+'|'+s.savedDrafts.map(x=>x.savedAt).join(',');
 if(sig!==signature){signature=sig;renderNodeOptions(s);renderSaves(s)}
 renderMetrics(s);renderConnections(s);renderDiff(s);
}
el('tfBiNode').addEventListener('change',()=>{inspected=Number(el('tfBiNode').value)||null;renderConnections(snapshot())});
for(const side of ['A','B'])el('tfBiSave'+side).addEventListener('change',()=>renderDiff(snapshot()));
el('tfBiInspect').addEventListener('click',()=>{
 const id=Number(el('tfBiNode').value);if(!id)return;
 const button=tree.querySelector('[data-tf-inspect="'+id+'"]');
 if(button){button.click();return}
 const cat=snapshot().catalog.find(n=>n.id===id)?.category;
 const tab=document.querySelector('[data-tf-tab="'+cat+'"]');
 if(tab){tab.click();requestAnimationFrame(()=>tree.querySelector('[data-tf-inspect="'+id+'"]')?.click())}
});
tree.addEventListener('click',event=>{
 const button=event.target.closest('[data-tf-inspect],[data-tf-relations]');if(!button)return;
 const id=Number(button.dataset.tfInspect||button.dataset.tfRelations);
 if(!id)return;const selector=el('tfBiNode');
 if([...selector.options].some(x=>Number(x.value)===id)){selector.value=String(id);inspected=id;renderConnections(snapshot())}
});
const observer=new MutationObserver(()=>{if(updateQueued)return;updateQueued=true;requestAnimationFrame(()=>{updateQueued=false;render()})});
observer.observe(tree,{childList:true});
document.getElementById('tfSaved')?.addEventListener('click',()=>requestAnimationFrame(render));
document.getElementById('tfSave')?.addEventListener('click',()=>requestAnimationFrame(render));
render();
})();