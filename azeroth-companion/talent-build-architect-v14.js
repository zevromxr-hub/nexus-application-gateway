/* NEXUS | AZEROTH v14 — additive source-aware build studio.
 * Only explicit Save Notes writes a NEW browser key.
 * Original talent allocations, undo, imports, API and OAuth untouched.
 */
(()=>{'use strict';
const root=document.getElementById('nx13Forge'),tree=document.getElementById('nx13Tree'),bridge=window.NexusTalentSourceBridge,core=window.NexusBuildArchitectCore;
if(!root||!tree||!bridge||!core||document.getElementById('nx14Architect'))return;
const $=id=>document.getElementById(id);
const elem=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const mount=elem('section','nx14-architect');mount.id='nx14Architect';mount.innerHTML="<header class=\"nx14-banner\"><div><span>NEXUS / SOVEREIGN BUILD ARCHITECT · v14.0</span><h3>MASTER YOUR <em>BUILD.</em></h3><p>Discover source-reported paths, compare local drafts, organize saved plans and inspect possible patch mismatches. Every original Forge control stays intact.</p></div><div class=\"nx14-banner-portrait\" aria-hidden=\"true\"></div></header><div class=\"nx14-metrics\"><div><small>OFFICIAL NODES</small><strong id=\"nx14Nodes\">—</strong></div><div><small>REPORTED LINKS</small><strong id=\"nx14Links\">—</strong></div><div><small>SAVED DRAFTS</small><strong id=\"nx14Drafts\">—</strong></div><div><small>SOURCE WARNINGS</small><strong id=\"nx14Warnings\">—</strong></div></div>\n<div class=\"nx14-grid\">\n<section class=\"nx14-panel\"><small>01 / CONNECTION EXPLORER</small><h4>Forge Focus Mode</h4><p>Follow source-reported node relationships—never assumed prerequisites.</p><label>FOCUS TALENT<select id=\"nx14Target\"><option value=\"\">Choose a reported node</option></select></label><div class=\"nx14-row\"><label class=\"nx14-check\"><input type=\"checkbox\" id=\"nx14Focus\"> Focus related nodes</label><label>DEPTH<select id=\"nx14Depth\"><option value=\"1\">1 step</option><option value=\"2\">2 steps</option><option value=\"3\" selected>3 steps</option></select></label></div><div id=\"nx14PathSummary\" class=\"nx14-summary\" aria-live=\"polite\">Load a tree to explore connections.</div><div id=\"nx14Related\" class=\"nx14-related\"></div><p class=\"nx14-note\">Source-reported relationships are not complete in-game validation.</p></section>\n<section class=\"nx14-panel\"><small>02 / BUILD COMPARISON 3.0</small><h4>Ranks &amp; Choices</h4><p>Compare any two local snapshots of the same specialization.</p><div class=\"nx14-row\"><label>BUILD A<select id=\"nx14A\"><option value=\"live\">Working plan</option></select></label><label>BUILD B<select id=\"nx14B\"><option value=\"\">Select another</option></select></label></div><div id=\"nx14DiffSummary\" class=\"nx14-summary\" aria-live=\"polite\">Choose two builds.</div><div id=\"nx14DiffRows\" class=\"nx14-list\"></div><button type=\"button\" id=\"nx14ExportDiff\" class=\"nx14-button\">EXPORT BUILD COMPARISON</button></section>\n<section class=\"nx14-panel\"><small>03 / PERSONAL BUILD ARCHIVE</small><h4>Favorites &amp; Notes</h4><p>Record what a saved build is for without editing its original ranks.</p><label>SAVED BUILD<select id=\"nx14Draft\"><option value=\"\">Choose existing draft</option></select></label><div class=\"nx14-fields\"><label class=\"nx14-check\"><input type=\"checkbox\" id=\"nx14Favorite\"> ★ Favorite</label><label>PURPOSE<select id=\"nx14Purpose\"><option value=\"general\">General</option><option value=\"raid\">Raiding</option><option value=\"mythic-plus\">Mythic+</option><option value=\"pvp\">PvP</option><option value=\"solo\">Solo</option><option value=\"open-world\">Open world</option></select></label><label>NOTES<textarea id=\"nx14Notes\" rows=\"3\" maxlength=\"1200\" placeholder=\"What should I test in game?\"></textarea></label><button type=\"button\" id=\"nx14SaveNotes\" class=\"nx14-button\">SAVE NOTES</button><div id=\"nx14NoteStatus\" class=\"nx14-note\" role=\"status\">Notes are browser-local and separate from saved talents.</div><button type=\"button\" id=\"nx14ExportNotes\" class=\"nx14-button nx14-outline\">EXPORT NOTES</button></div></section>\n<section class=\"nx14-panel\"><small>04 / PATCH READINESS</small><h4>Integrity Review</h4><p>Find missing IDs and stored ranks exceeding currently reported maximums.</p><label>BUILD TO REVIEW<select id=\"nx14Review\"><option value=\"live\">Working plan</option></select></label><div id=\"nx14ReviewStatus\" class=\"nx14-summary\" aria-live=\"polite\">Load a Blizzard tree to review.</div><div id=\"nx14Findings\" class=\"nx14-list\"></div><button type=\"button\" id=\"nx14ExportReview\" class=\"nx14-button\">EXPORT SOURCE REVIEW</button><p class=\"nx14-note\">No automatic corrections, account writes, or game-validity claims.</p></section></div>\n<div class=\"nx14-signature\">SOVEREIGN BUILD ARCHITECT · POWERED BY ZEVRO | NEXUS</div>";
const anchor=root.querySelector('.nx13-disclaimer');if(anchor)anchor.before(mount);else root.append(mount);
const NS='nexus_build_architect_library_v14';
const getRaw=(key,limit=700000)=>{try{const v=localStorage.getItem(key);return v&&v.length<=limit?JSON.parse(v):null}catch(_){return null}};
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
let notes=object(getRaw(NS,170000))?getRaw(NS,170000):{};
const drafts=()=>{const x=getRaw('nexus_azeroth_talent_forge_v1',3500000);return Array.isArray(x)?x.filter(d=>object(d)&&typeof d.name==='string'&&typeof d.identity==='string'&&object(d.rankByNode)).slice(0,40):[]};
const history=()=>{const x=getRaw('nexus_forge_reforged_checkpoints_v13',650000);return Array.isArray(x)?x.filter(d=>object(d)&&typeof d.identity==='string'&&object(d.rankByNode)).slice(0,24):[]};
const snapshot=()=>{try{return bridge.snapshot()}catch(_){return null}};
let focus=0,focusMode=false,previous='',fingerprint='',pending=false,comparison=null,review=null;
function records(s){
 const out=[{key:'live',label:'WORKING PLAN',identity:s?.identity||'',rankByNode:s?.allocations||{},choiceByNode:s?.choiceByNode||{}}];
 if(!s?.ready)return out;
 drafts().filter(x=>x.identity===s.identity).forEach((d,i)=>out.push({key:'draft:'+i,label:'SAVED · '+d.name.slice(0,75),identity:d.identity,rankByNode:d.rankByNode,choiceByNode:d.choiceByNode}));
 history().filter(x=>x.identity===s.identity).forEach(d=>out.push({key:'history:'+d.id,label:'CHECKPOINT · '+String(d.name||'History').slice(0,75),identity:d.identity,rankByNode:d.rankByNode,choiceByNode:d.choiceByNode}));
 return out;
}
function options(el,arr,placeholder){
 const old=el.value;el.replaceChildren();
 if(placeholder){const blank=elem('option','',placeholder);blank.value='';el.append(blank)}
 arr.forEach(x=>{const opt=elem('option','',x.label);opt.value=x.key;el.append(opt)});
 el.value=arr.some(x=>x.key===old)?old:placeholder?'':arr[0]?.key||'';
}
function path(s){
 const selected=Number($('nx14Target').value)||focus,trace=core.trace(s,selected,Number($('nx14Depth').value));
 focus=selected;
 tree.classList.toggle('nx14-focus-enabled',focusMode);
 const inbound=new Set(trace.inbound.map(x=>x.id)),outbound=new Set(trace.outbound.map(x=>x.id));
 for(const card of tree.querySelectorAll('.nx13-node[data-node]')){
  const id=Number(card.dataset.node),linked=inbound.has(id)||outbound.has(id);
  card.classList.toggle('nx14-node-target',!!(focusMode&&selected&&id===selected));
  card.classList.toggle('nx14-node-linked',!!(focusMode&&linked));
  card.classList.toggle('nx14-node-muted',!!(focusMode&&selected&&id!==selected&&!linked));
 }
 const found=(s?.catalog||[]).find(n=>Number(n.id)===selected),area=$('nx14Related');area.replaceChildren();
 if(!found){$('nx14PathSummary').textContent='Select an actual Blizzard-reported talent node to explore its connections.';return}
 $('nx14PathSummary').textContent=String(found.name)+' · '+trace.inbound.length+' reported inbound · '+trace.outbound.length+' reported outbound connections.';
 for(const [label,items]of [['REPORTED INBOUND',trace.inbound],['REPORTED OUTBOUND',trace.outbound]]){
  const col=elem('div','nx14-related-column');col.append(elem('strong','',label));
  if(!items.length)col.append(elem('small','','No returned links in this direction.'));
  items.slice(0,10).forEach(x=>{const n=(s.catalog||[]).find(y=>Number(y.id)===x.id);
   const btn=elem('button','',String(n?.name||'Node #'+x.id).slice(0,92));btn.type='button';btn.dataset.focus=String(x.id);btn.title=x.steps+' reported step(s)';col.append(btn)});
  area.append(col);
 }
}
function compare(s,list){
 const a=list.find(x=>x.key===$('nx14A').value),b=list.find(x=>x.key===$('nx14B').value),area=$('nx14DiffRows');area.replaceChildren();
 if(!a||!b){$('nx14DiffSummary').textContent='Select two saved or working plans.';comparison=null;return}
 const result=core.compare(a,b,s?.catalog||[]),t=result.totals;
 comparison={format:'nexus.build-architect.diff/1',timestamp:new Date().toISOString(),source_identity:s?.identity,buildA:a.label,buildB:b.label,result};
 if(!result.compatible){$('nx14DiffSummary').textContent=result.reason;return}
 $('nx14DiffSummary').textContent=t.changedNodes+' changed node IDs · +'+t.added+' / −'+t.removed+' manually planned ranks · '+t.choiceChanges+' changed choice indices.';
 if(!result.changes.length){area.append(elem('p','nx14-empty','No recorded rank or choice-index differences.'));return}
 result.changes.slice(0,60).forEach(x=>{const b=elem('button','nx14-diff-line');b.type='button';b.dataset.focus=String(x.id);
  b.append(elem('strong','',x.name),elem('span','',x.a+' → '+x.b+' ranks'+(x.choiceA!==x.choiceB?' · choice '+x.choiceA+' → '+x.choiceB:'')));area.append(b)});
}
function integrity(s,list){
 const chosen=list.find(x=>x.key===$('nx14Review').value)||list[0],findings=core.integrity(s,chosen),area=$('nx14Findings');area.replaceChildren();
 const warnings=findings.filter(x=>x.level==='warning');
 $('nx14Warnings').textContent=s?.ready?String(warnings.length):'—';
 $('nx14ReviewStatus').textContent=s?.ready?warnings.length+' potential source mismatch(es), not game verification.':'No Blizzard source data loaded for comparison.';
 findings.forEach(x=>{const row=elem('div','nx14-finding nx14-'+x.level);row.append(elem('span','',x.level==='warning'?'!':'i'),elem('p','',x.text));area.append(row)});
 review={format:'nexus.build-architect.source-review/1',timestamp:new Date().toISOString(),tree:s?.identity,source:chosen.label,findings};
}
function loadNotes(){
 const idx=$('nx14Draft').value,d=idx!==''?drafts()[Number(idx)]:null,n=d?notes[core.draftKey(d)]||{}:{};
 $('nx14Favorite').checked=n.favorite===true;
 $('nx14Purpose').value=['general','raid','mythic-plus','pvp','solo','open-world'].includes(n.purpose)?n.purpose:'general';
 $('nx14Notes').value=typeof n.notes==='string'?n.notes.slice(0,1200):'';
 $('nx14SaveNotes').disabled=!d;
 $('nx14NoteStatus').textContent=d?'Editing notes for '+String(d.name).slice(0,65)+'. Original allocation is untouched.':'Select an existing saved draft to add notes.';
}
function library(){
 const select=$('nx14Draft'),old=select.value,list=drafts();select.replaceChildren();
 const none=elem('option','','Choose an existing saved draft');none.value='';select.append(none);
 list.forEach((d,i)=>{const o=elem('option','',(notes[core.draftKey(d)]?.favorite?'★ ':'')+String(d.name).slice(0,75));o.value=String(i);select.append(o)});
 select.value=old!==''&&list[Number(old)]?old:'';loadNotes();
}
function exportJSON(value,name){
 try{const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=elem('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800)}
 catch(_){$('nx14NoteStatus').textContent='Export unavailable; your original drafts have not been changed.'}
}
function refresh(force=false){
 const s=snapshot(),list=records(s),stamp=JSON.stringify([s?.ready,s?.identity,s?.active,s?.allocations,s?.choiceByNode,list.map(x=>x.key+':'+x.label)]);
 if(!force&&stamp===fingerprint){path(s);return}
 fingerprint=stamp;
 $('nx14Nodes').textContent=s?.ready?String((s.catalog||[]).length):'—';
 $('nx14Links').textContent=s?.ready?String((s.linkEdges||[]).length):'—';
 $('nx14Drafts').textContent=String(drafts().length);
 options($('nx14A'),list,null);options($('nx14B'),list,'Choose a saved plan');options($('nx14Review'),list,null);
 if(previous!==s?.identity){previous=s?.identity;$('nx14A').value='live';$('nx14Review').value='live'}
 if(!$('nx14B').value){const alt=list.find(x=>x.key!=='live');if(alt)$('nx14B').value=alt.key}
 const select=$('nx14Target'),old=select.value;select.replaceChildren();const opt=elem('option','','Choose a source node');opt.value='';select.append(opt);
 (s?.catalog||[]).slice(0,450).forEach(x=>{const o=elem('option','',String(x.name||'Source ID')+' · #'+x.id);o.value=String(x.id);select.append(o)});
 select.value=(s?.catalog||[]).some(n=>String(n.id)===old)?old:(s?.catalog||[]).some(n=>Number(n.id)===focus)?String(focus):'';
 path(s);compare(s,list);integrity(s,list);library();
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()})}
function selectFocus(id){focus=Number(id);$('nx14Target').value=String(focus);path(snapshot())}
$('nx14Target').addEventListener('change',e=>{focus=Number(e.target.value)||0;path(snapshot())});
$('nx14Focus').addEventListener('change',e=>{focusMode=e.target.checked;path(snapshot())});
$('nx14Depth').addEventListener('change',()=>path(snapshot()));
for(const id of ['nx14Related','nx14DiffRows'])$(id).addEventListener('click',event=>{
 const b=event.target.closest('button[data-focus]');if(!b)return;selectFocus(b.dataset.focus);
 if(id==='nx14DiffRows'){$('nx14Focus').checked=true;focusMode=true;path(snapshot())}
});
for(const id of ['nx14A','nx14B'])$(id).addEventListener('change',()=>{const s=snapshot();compare(s,records(s))});
$('nx14Review').addEventListener('change',()=>{const s=snapshot();integrity(s,records(s))});
$('nx14Draft').addEventListener('change',loadNotes);
$('nx14SaveNotes').addEventListener('click',()=>{
 const idx=$('nx14Draft').value,d=idx!==''?drafts()[Number(idx)]:null;
 if(!d){$('nx14NoteStatus').textContent='Select a saved draft first.';return}
 const next={...notes,[core.draftKey(d)]:{favorite:$('nx14Favorite').checked,purpose:$('nx14Purpose').value,notes:String($('nx14Notes').value||'').slice(0,1200),updatedAt:new Date().toISOString()}};
 if(Object.keys(next).length>90){$('nx14NoteStatus').textContent='Note limit reached; export notes first.';return}
 try{localStorage.setItem('nexus_build_architect_library_v14',JSON.stringify(next));notes=next;const saved=idx;library();$('nx14Draft').value=saved;loadNotes();$('nx14NoteStatus').textContent='Notes saved separately; original talent draft unchanged.'}
 catch(_){$('nx14NoteStatus').textContent='Browser storage unavailable. Original talent draft unchanged.'}
});
$('nx14ExportNotes').addEventListener('click',()=>exportJSON({format:'nexus.build-architect.notes/1',timestamp:new Date().toISOString(),annotations:notes},'nexus-v14-library-notes.json'));
$('nx14ExportDiff').addEventListener('click',()=>{if(comparison)exportJSON(comparison,'nexus-v14-build-comparison.json')});
$('nx14ExportReview').addEventListener('click',()=>{if(review)exportJSON(review,'nexus-v14-source-review.json')});
tree.addEventListener('click',event=>{const b=event.target.closest('button[data-select],button[data-rank]');if(b){const id=Number(b.dataset.select||b.dataset.id);if(Number.isSafeInteger(id)&&id>0)selectFocus(id)}});
new MutationObserver(schedule).observe(tree,{childList:true,subtree:false});
document.addEventListener('nexus:view-activated',e=>{if(e.detail?.view==='talents')refresh(true)});
refresh(true);
})();