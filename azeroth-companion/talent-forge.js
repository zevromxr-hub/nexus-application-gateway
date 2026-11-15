/* NEXUS | AZEROTH COMPANION v2.3 — Talent Forge.
 * Blizzard-provided talent nodes only; rankings and choices are manual research drafts.
 * No made-up talent data, no game-valid export claims.
 */
(()=>{'use strict';
const API='https://nexus-azeroth-api.zevromxr.workers.dev',KEY='nexus_azeroth_talent_forge_v1';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=id=>Number.isSafeInteger(Number(id))&&Number(id)>0&&Number(id)<=9999999999;
let index=[],tree=null,active='class',draft={},saved=[],identity='',loadedRegion='us',loading=false,choices={},undoStack=[],redoStack=[],heroSelection='all',compareId='',indexRequest=0,focusedNode=null,showLinks=true;
const PLANNER=window.NexusTalentPlanner,AUTOKEY='nexus_azeroth_talent_planner_autorecover_v51';
let plannerMeta=PLANNER?.defaultMeta()||{activity:'general',role:'unspecified',style:'balanced',notes:'',targets:{class:0,spec:0,hero:0}},recoveryPending=false,recoveryTimer=null,loadRequest=0;
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(v))saved=v.filter(x=>x&&typeof x.name==='string'&&typeof x.identity==='string'&&x.rankByNode&&typeof x.rankByNode==='object').slice(0,40)}catch(_){}
const main=document.querySelector('.main'),foot=main?.querySelector('.footer'),nav=document.querySelector('.nav');if(!main||!foot||!nav)return;
const button=document.createElement('button');button.type='button';button.dataset.view='talents';button.textContent='✧ Talent Forge';nav.appendChild(button);
const mount=document.createElement('div');mount.id='talentForge';mount.innerHTML="<section class=\"section\" data-section=\"talents\"><div class=\"wow-kicker\">LIVE BLIZZARD TALENT DATA · RETAIL</div><h2>Talent Forge</h2><p class=\"muted\">Explore class, specialization, and hero talent nodes from Blizzard’s Retail API. Plan ranks and choice nodes, then save a personal draft. This is a research planner—not an in-game-valid loadout validator or import-code generator.</p><div class=\"panel\"><div class=\"tf-selectors\"><div class=\"field\"><label for=\"tfRegion\">Region</label><select id=\"tfRegion\"><option value=\"us\">Americas</option><option value=\"eu\">Europe</option><option value=\"kr\">Korea</option><option value=\"tw\">Taiwan</option></select></div><div class=\"field\"><label for=\"tfSpec\">Playable specialization</label><select id=\"tfSpec\"><option value=\"\">Load official specializations…</option></select></div><button class=\"primary\" id=\"tfLoad\" type=\"button\">LOAD TALENT TREE</button></div><p class=\"hint\" id=\"tfStatus\" role=\"status\" aria-live=\"polite\">Loading official specialization index…</p></div><div class=\"tf-stats\"><div><strong id=\"tfClassPoints\">0</strong><span>Planned class points</span></div><div><strong id=\"tfSpecPoints\">0</strong><span>Planned spec points</span></div><div><strong id=\"tfHeroPoints\">0</strong><span>Planned hero points</span></div></div><div class=\"panel tf-toolbar\"><div class=\"top\"><h3>Talent Workspace</h3><div class=\"actions\"><button type=\"button\" id=\"tfSave\">SAVE BUILD</button><button type=\"button\" id=\"tfClear\">CLEAR DRAFT</button><button type=\"button\" id=\"tfExport\">EXPORT BUILD JSON</button><label class=\"wow-file\">IMPORT BUILD JSON<input id=\"tfImport\" type=\"file\" accept=\".json,application/json\"></label></div></div><div class=\"tf-tabs\"><button data-tf-tab=\"class\" type=\"button\" class=\"active\">CLASS</button><button data-tf-tab=\"spec\" type=\"button\">SPECIALIZATION</button><button data-tf-tab=\"hero\" type=\"button\">HERO</button></div><div id=\"tfTree\" class=\"tf-tree\"><div class=\"empty\">Select a specialization, then load the talent tree.</div></div></div><div class=\"panel tf-library\"><h3>My Saved Talent Drafts</h3><div class=\"field\"><label for=\"tfBuildName\">Current draft name</label><input id=\"tfBuildName\" maxlength=\"75\" placeholder=\"My raid talent draft\"></div><div id=\"tfSaved\" class=\"tf-saved-list\"></div><p class=\"hint\">Drafts use Blizzard node IDs but do not promise correct prerequisites, allowed points, current meta, hero paths, or game import-string compatibility. Use the in-game talent interface to validate before playing.</p></div></section>";main.insertBefore(mount,foot);
const tools=document.createElement('div');tools.className='tf-overdrive-tools';tools.innerHTML='<div class="tf-overdrive-row"><label for="tfFindNode">Find a talent</label><input id="tfFindNode" type="search" maxlength="80" placeholder="Search official node names and descriptions"><label for="tfLayout">Layout</label><select id="tfLayout"><option value="grid">Tree rows & columns</option><option value="cards">Compact cards</option></select><label class="tf-toggle"><input id="tfBrief" type="checkbox"> Short descriptions</label></div><div class="tf-overdrive-row"><button id="tfUndo" type="button" disabled>UNDO</button><button id="tfRedo" type="button" disabled>REDO</button><label for="tfBudget">Custom planning alert at</label><input id="tfBudget" type="number" min="1" max="250" value="31" aria-label="Custom planning alert points"><span id="tfBudgetStatus" aria-live="polite">Personal reminder only — not a Blizzard cap.</span></div>';
$('tfTree').before(tools);const layoutNotice=document.createElement('p');layoutNotice.id='tfLayoutNotice';layoutNotice.className='tf-layout-notice';layoutNotice.setAttribute('role','status');$('tfTree').before(layoutNotice);
const notice=message=>{$('tfStatus').textContent=message};
const inspectBar=document.createElement('div');inspectBar.id='tfIntel';inspectBar.className='tf-intelligence';
inspectBar.innerHTML='<div class="tf-intel-row"><label for="tfHeroTree">Hero tree</label><select id="tfHeroTree"><option value="all">All returned hero trees</option></select><label for="tfCompare">Compare saved build</label><select id="tfCompare"><option value="">No comparison</option></select></div><div id="tfCompareSummary" class="tf-compare-summary" aria-live="polite">Compare against a saved draft of the same specialization to highlight differences in planned ranks.</div><div class="tf-help">Official API display positions and default points are reference data. Comparisons and allocations are drafts only: no in-game prerequisites or talent point validity are being inferred.</div>';
$('tfTree').before(inspectBar);
const relationUI=document.createElement('div');relationUI.id='tfRelations';relationUI.className='tf-relations';
relationUI.innerHTML='<div class="tf-relation-controls"><label><input type="checkbox" id="tfShowLinks" checked> Show source-reported links</label><span id="tfLinkCounts">Load a talent tree to inspect its relationships.</span></div><div id="tfRelationDetails" class="tf-relation-details" role="status" aria-live="polite">Click RELATIONS on a talent node to inspect the relationships Blizzard reports for that node.</div>';
$('tfTree').before(relationUI);
const pathPanel=document.createElement('div');pathPanel.id='tfPathIntel';pathPanel.className='tf-path-intel';
pathPanel.innerHTML='<div class="tf-path-header"><div><strong>Talent Path Intelligence</strong><p>Review source-linked nodes with no manually allocated points. A warning is not proof a build is invalid.</p></div><label class="tf-path-filter"><input type="checkbox" id="tfReviewOnly"> Show only flagged links</label></div><div id="tfPathSummary" class="tf-path-summary" aria-live="polite">Load a talent tree to inspect reported paths.</div><div id="tfPathDetails" class="tf-path-details">Choose RELATIONS on a node to inspect its reported upstream path.</div>';
$('tfTree').before(pathPanel);

const plannerPanel=document.createElement('section');plannerPanel.id='tfPlanner';plannerPanel.className='tf-planner panel';plannerPanel.setAttribute('aria-labelledby','tfPlannerTitle');
plannerPanel.innerHTML='<div class="tf-plan-head"><div><span class="wow-kicker">NEXUS / TALENT FORGE PLANNER</span><h3 id="tfPlannerTitle">Build Architect Workspace</h3><p>Choose a purpose, allocate official Blizzard-returned talent nodes below, and document your decisions. Structural checks and custom targets are planning aids only.</p></div><span class="tf-plan-mode">MANUAL BUILD PLANNER</span></div>'+
'<div class="tf-plan-fields"><label>Content focus<select id="tfPlanActivity"><option value="general">General purpose</option><option value="raid">Raids</option><option value="mythic-plus">Mythic+</option><option value="pvp">PvP</option><option value="solo">Solo</option><option value="open-world">Open world</option></select></label>'+
'<label>Planned role<select id="tfPlanRole"><option value="unspecified">Not specified</option><option value="damage">Damage</option><option value="tank">Tank</option><option value="healer">Healer</option></select></label>'+
'<label>Build approach<select id="tfPlanStyle"><option value="balanced">Balanced</option><option value="burst">Burst</option><option value="sustain">Sustained damage / output</option><option value="utility">Utility</option><option value="survival">Survivability</option></select></label></div>'+
'<div class="tf-plan-targets"><strong>Personal point targets <small>(optional reminders, NOT official Blizzard caps)</small></strong><div class="tf-plan-target-grid">'+
'<label>Class target<input id="tfPlanGoalClass" type="number" min="0" max="150" step="1" value="0"></label>'+
'<label>Specialization target<input id="tfPlanGoalSpec" type="number" min="0" max="150" step="1" value="0"></label>'+
'<label>Hero target<input id="tfPlanGoalHero" type="number" min="0" max="150" step="1" value="0"></label></div><p class="tf-plan-hint">0 = no target. This does not enforce or calculate legal in-game point budgets.</p></div>'+
'<label class="tf-plan-notes">Build notes / rotation ideas / encounter reminders<textarea id="tfPlanNotes" rows="4" maxlength="1800" placeholder="Why you chose these talents, open questions, and situations you want to test in game..."></textarea></label>'+
'<div class="tf-plan-recover" id="tfPlanRecover" hidden><strong>Unsaved local recovery found for this specialization.</strong><p>Choose Restore to recover your most recent working draft, or Discard to start with the loaded build. Recovery is stored only in this browser.</p><div class="actions"><button type="button" id="tfPlanRestore">RESTORE DRAFT</button><button type="button" id="tfPlanDiscard">DISCARD RECOVERY</button></div></div>'+
'<div class="tf-plan-reviews"><div><strong>Build allocation review</strong><div class="tf-plan-summary" id="tfPlanSummary" aria-live="polite">Load a specialization to begin.</div></div><div><strong>Review & advisories</strong><ul class="tf-plan-advisories" id="tfPlanAdvisories"><li>This is a manual planning tool, not an in-game loadout validator.</li></ul></div></div>'+
'<div class="tf-plan-foot"><span id="tfPlanRecoveryStatus" role="status" aria-live="polite">Draft recovery is local to this browser.</span><div class="actions"><button id="tfPlanCopy" type="button">COPY BUILD BRIEF</button><button id="tfPlanDuplicate" type="button">DUPLICATE TO LIBRARY</button></div></div>';
const talentWorkspace=$('tfTree').closest('.panel');talentWorkspace.before(plannerPanel);
$('tfReviewOnly').addEventListener('change',render);

function recoveryRecords(){
 try{
  const x=JSON.parse(localStorage.getItem(AUTOKEY)||'null');
  return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
 }catch(_){return{}}
}
function dropRecovery(id){
 if(!id)return;
 try{const records=recoveryRecords();delete records[id];localStorage.setItem(AUTOKEY,JSON.stringify(records))}
 catch(_){/* fail closed; exported drafts remain available */}
}
function queueRecovery(){
 if(!tree||!identity||recoveryPending)return;
 clearTimeout(recoveryTimer);
 recoveryTimer=setTimeout(()=>{
  if(!tree||!identity||recoveryPending)return;
  try{
   const records=recoveryRecords(),name=$('tfBuildName').value.trim().slice(0,75)||'Working draft';
   records[identity]={format:'nexus-azeroth-talent-draft-v1',identity,name,region:loadedRegion,
    rankByNode:{...draft},choiceByNode:{...choices},planner:PLANNER?.sanitizeMeta(plannerMeta)||plannerMeta,
    savedAt:new Date().toISOString()};
   const limited=Object.entries(records).filter(([id])=>PLANNER?.identityOK(id))
    .sort((a,b)=>String(b[1]?.savedAt||'').localeCompare(String(a[1]?.savedAt||''))).slice(0,8);
   localStorage.setItem(AUTOKEY,JSON.stringify(Object.fromEntries(limited)));
   $('tfPlanRecoveryStatus').textContent='Working draft backed up locally on this browser.';
  }catch(_){$('tfPlanRecoveryStatus').textContent='Automatic recovery is unavailable. Export your draft JSON to protect it.'}
 },650);
}
function markPlannerEdit(){
 if(recoveryPending){
  notice('Resolve the existing draft recovery first: Restore or Discard.');
  return false;
 }
 queueRecovery();return true;
}
function recoveryPrompt(){
 clearTimeout(recoveryTimer);
 const record=identity?recoveryRecords()[identity]:null;
 recoveryPending=Boolean(record);
 $('tfPlanRecover').hidden=!recoveryPending;
 $('tfPlanRecoveryStatus').textContent=recoveryPending
  ?'An unsaved working draft is available. Restore or discard it before editing.'
  :'Changes to your ranks, choices, notes and targets receive local recovery backups.';
}
function plannerFromFields(){
 if(!PLANNER)return;
 plannerMeta=PLANNER.sanitizeMeta({
  activity:$('tfPlanActivity').value,role:$('tfPlanRole').value,style:$('tfPlanStyle').value,
  notes:$('tfPlanNotes').value,
  targets:{class:Number($('tfPlanGoalClass').value),spec:Number($('tfPlanGoalSpec').value),hero:Number($('tfPlanGoalHero').value)}
 });
}
function plannerToFields(){
 const meta=PLANNER?.sanitizeMeta(plannerMeta)||plannerMeta;
 $('tfPlanActivity').value=meta.activity;$('tfPlanRole').value=meta.role;
 $('tfPlanStyle').value=meta.style;$('tfPlanNotes').value=meta.notes;
 for(const key of ['class','spec','hero'])$('tfPlanGoal'+key[0].toUpperCase()+key.slice(1)).value=String(meta.targets[key]);
}
function cleanChoices(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return{};
 const valid=new Map(allNodes().map(n=>[String(n.id),n])),result={};
 for(const [id,choice]of Object.entries(raw).slice(0,400)){
  const n=valid.get(id);
  const count=Math.max(0,...(Array.isArray(n?.ranks)?n.ranks:[]).map(rank=>
   Array.isArray(rank?.choice_of_tooltips)?rank.choice_of_tooltips.length:0));
  if(n&&Number.isInteger(choice)&&choice>=0&&choice<Math.max(count,1))result[id]=choice;
 }
 return result;
}
function plannerReview(){
 if(!PLANNER)return null;
 return PLANNER.analyze(tree,draft,choices,plannerMeta,(nodes,ranks)=>window.NexusTalentPaths?.analyze(nodes,ranks));
}
function renderPlanner(){
 if(!PLANNER)return;
 const result=plannerReview();
 const status=$('tfPlanSummary'),review=$('tfPlanAdvisories');
 const counts=result.scores,goals=result.goal;
 status.replaceChildren();
 for(const [type,label]of [['class','Class'],['spec','Specialization'],['hero','Hero']]){
  const row=document.createElement('div');row.className='tf-plan-score';
  const title=document.createElement('span');title.textContent=label+' points';
  const value=document.createElement('strong');value.textContent=counts[type]+(goals[type]>0?' / '+goals[type]+' personal target':' allocated');
  row.append(title,value);status.append(row);
 }
 review.replaceChildren();
 const messages=result.issues.map(text=>({text,kind:'issue'}))
  .concat(result.advisory.map(text=>({text,kind:'advisory'})));
 if(!result.hasTree)messages.unshift({text:'Load Blizzard talent data to begin allocating nodes. All point targets are personal planning reminders.',kind:'advisory'});
 if(!result.issues.length&&result.hasTree)messages.unshift({text:'No structural rank or choice inconsistencies detected in the returned talent nodes. This does NOT verify a game-valid build.',kind:'good'});
 for(const msg of messages.slice(0,12)){
  const li=document.createElement('li');li.className='tf-plan-'+msg.kind;li.textContent=msg.text;review.append(li);
 }
 const footer=document.createElement('li');footer.className='tf-plan-disclaimer';
 footer.textContent='Not a Blizzard talent-rule validator, legal loadout checker, meta recommendation, or in-game import-string generator.';
 review.append(footer);
}
function restoreRecovery(){
 if(!tree||!recoveryPending)return;
 const raw=recoveryRecords()[identity];
 try{
  const record=PLANNER.sanitizeImported(raw);
  if(record.identity!==identity)throw Error('Specialization mismatch');
  draft=cleanDraft(record.rankByNode);choices=cleanChoices(record.choiceByNode);
  plannerMeta=PLANNER.sanitizeMeta(record.planner);
  $('tfBuildName').value=record.name;undoStack=[];redoStack=[];updateUndoButtons();
  recoveryPending=false;$('tfPlanRecover').hidden=true;
  plannerToFields();render();queueRecovery();
  notice('Restored your locally backed-up working draft. Save or export it when ready.');
 }catch(error){notice('Recovery could not be opened: '+error.message+'. You can discard the damaged copy.')}
}
$('tfPlanRestore').addEventListener('click',restoreRecovery);
$('tfPlanDiscard').addEventListener('click',()=>{
 if(!tree)return;
 clearTimeout(recoveryTimer);dropRecovery(identity);recoveryPending=false;
 $('tfPlanRecover').hidden=true;
 $('tfPlanRecoveryStatus').textContent='Old recovery discarded. Your currently loaded build is unchanged.';
 notice('Previous local recovery discarded.');renderPlanner();
});
for(const id of ['tfPlanActivity','tfPlanRole','tfPlanStyle','tfPlanGoalClass','tfPlanGoalSpec','tfPlanGoalHero','tfPlanNotes']){
 $(id).addEventListener(id==='tfPlanNotes'?'input':'change',()=>{
  if(recoveryPending){plannerToFields();markPlannerEdit();return}
  plannerFromFields();renderPlanner();markPlannerEdit();
 });
}
$('tfBuildName').addEventListener('input',()=>{if(tree)markPlannerEdit()});
$('tfPlanCopy').addEventListener('click',async()=>{
 if(!tree||!PLANNER)return notice('Load a specialization to copy its build brief.');
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard access unavailable');
  await navigator.clipboard.writeText(PLANNER.summaryText(plannerReview(),$('tfBuildName').value||'Talent draft'));
  notice('Build brief copied. It contains your own planning notes, not a game-importable loadout.');
 }catch(_){notice('Clipboard unavailable. Export the build JSON to share your draft.')}
});
$('tfPlanDuplicate').addEventListener('click',()=>{
 if(!tree)return notice('Load a talent tree before duplicating.');
 if(recoveryPending)return notice('Resolve the unsaved draft recovery before duplicating.');
 const record=draftRecord();record.name=(record.name.slice(0,65)+' Copy').slice(0,75);
 record.savedAt=new Date().toISOString();
 saved=[record,...saved].slice(0,40);persist();renderSaved();
 notice('Created a separate saved copy. Choose LOAD in My Saved Talent Drafts to edit it.');
});
plannerToFields();renderPlanner();
function pathAnalysis(nodes){return window.NexusTalentPaths?.analyze(nodes,draft)||null}
function pathLabel(id,nodes){const n=nodes.find(x=>Number(x.id)===Number(id));return n?nodeName(n):'Node #'+id}
function renderPathIntel(nodes){
 const result=pathAnalysis(nodes);
 if(!result){$('tfPathSummary').textContent='Path analyzer unavailable; source relationships can still be inspected.';return}
 const {summary}=result;
 $('tfPathSummary').innerHTML='<div><strong>'+summary.planned+'</strong><span>Planned nodes</span></div><div><strong>'+summary.satisfied+'</strong><span>Links with points on both ends</span></div><div><strong>'+summary.flagged+'</strong><span>Linked sources with zero planned points</span></div><div><strong>'+summary.unresolved+'</strong><span>Outside this view</span></div>';
 if(focusedNode===null){$('tfPathDetails').textContent='Choose RELATIONS on a talent node to inspect its reported upstream links.';return}
 const current=result.details(focusedNode);
 if(!current){$('tfPathDetails').textContent='The selected talent is not in this view.';return}
 const upstream=result.ancestors(focusedNode);
 const incomplete=upstream.filter(x=>x.points===0);
 $('tfPathDetails').innerHTML='<strong>'+esc(pathLabel(focusedNode,nodes))+'</strong> · '+current.points+' manually planned rank(s)<p>'+current.incoming.length+' direct source link(s) reported · '+current.unresolved.length+' unresolved reference(s) · '+upstream.length+' upstream nodes discovered, up to 16 levels.</p><div class="tf-path-chips">'+(upstream.length?upstream.map(x=>'<span class="'+(x.points?'tf-path-chosen':'tf-path-review')+'">'+esc(pathLabel(x.id,nodes))+' · '+x.points+' pt'+(x.points===1?'':'s')+'</span>').join(''):'<span>No upstream connections reported in this view</span>')+'</div><p>'+(incomplete.length?incomplete.length+' upstream source-linked node(s) have zero manually planned points. Review them in the game talent interface.':'No zero-point upstream nodes detected among reported connections.')+' This check does not validate game prerequisites or hero path eligibility.</p>';
}
$('tfShowLinks').addEventListener('change',e=>{showLinks=e.target.checked;render()});
function relationshipEdges(nodes){
 const known=new Set(nodes.map(n=>Number(n.id)));
 const edges=[],missing=[];
 for(const node of nodes){
  if(!Array.isArray(node.locked_by))continue;
  for(const ref of node.locked_by){const id=Number(typeof ref==='object'?(ref?.id??ref?.node_id):ref);if(!Number.isSafeInteger(id)||id<=0)continue;
   if(known.has(id))edges.push({from:id,to:Number(node.id)});
   else missing.push({from:id,to:Number(node.id)});
  }
 }
 return{edges,missing};
}
function focusRelations(id){
 focusedNode=Number(id);const visible=groups()[active],node=visible.find(n=>Number(n.id)===focusedNode);
 if(!node){$('tfRelationDetails').textContent='The selected node is not in this talent category.';return}
 const {edges,missing}=relationshipEdges(visible),incoming=edges.filter(x=>x.to===focusedNode).map(x=>x.from),outgoing=edges.filter(x=>x.from===focusedNode).map(x=>x.to),label=n=>{const found=visible.find(v=>Number(v.id)===n);return found?nodeName(found):'Node #'+n};
 $('tfRelationDetails').innerHTML='<strong>'+esc(nodeName(node))+'</strong> · Node #'+focusedNode+'<p>Blizzard reports this node is locked by: '+(incoming.length?incoming.map(label).map(esc).join(', '):'None referenced in this category')+'.</p><p>Nodes reporting a lock from this node: '+(outgoing.length?outgoing.map(label).map(esc).join(', '):'None referenced in this category')+'.</p><p>'+missing.filter(x=>x.to===focusedNode).length+' references could not be resolved in this category. These source-reported links are NOT a complete eligibility or prerequisite validator.</p>';
}
function renderLinks(){
 const grid=$('tfTree').querySelector('.tf-positioned');
 if(!grid||!showLinks)return;
 const elements=new Map([...grid.querySelectorAll('[data-tf-node]')].map(el=>[Number(el.dataset.tfNode),el]));
 const visible=groups()[active],{edges}=relationshipEdges(visible);
 const width=grid.scrollWidth,height=grid.scrollHeight;
 if(!width||!height)return;
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('class','tf-link-layer');svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.setAttribute('aria-hidden','true');
 for(const {from,to} of edges.slice(0,400)){const a=elements.get(from),b=elements.get(to);if(!a||!b||a===b)continue;
 const x1=a.offsetLeft+a.offsetWidth/2,y1=a.offsetTop+a.offsetHeight/2,x2=b.offsetLeft+b.offsetWidth/2,y2=b.offsetTop+b.offsetHeight/2;
 const path=document.createElementNS(ns,'path');const delta=Math.max(25,Math.abs(y2-y1)*.45);
 path.setAttribute('d','M'+x1+' '+y1+' C'+x1+' '+(y1+delta)+' '+x2+' '+(y2-delta)+' '+x2+' '+y2);
 path.setAttribute('fill','none');path.setAttribute('stroke',focusedNode===from||focusedNode===to?'#e7c17c':'#64bbb0');path.setAttribute('stroke-width',focusedNode===from||focusedNode===to?'3':'1.5');path.setAttribute('stroke-opacity',focusedNode===from||focusedNode===to?'0.85':'0.42');svg.appendChild(path);
 }
 grid.prepend(svg);
}

function countPointChanges(current,baseline){const ids=new Set([...Object.keys(current||{}),...Object.keys(baseline||{})]);let changed=0,added=0,removed=0;for(const id of ids){const a=Number(current?.[id]||0),b=Number(baseline?.[id]||0);if(a!==b){changed++;if(a>b)added+=a-b;else removed+=b-a}}return{changed,added,removed}}
function baseline(){return saved.find(x=>x.identity===identity&&x.savedAt===compareId)||null}
function refreshComparison(){const prior=$('tfCompare').value;const items=saved.filter(x=>x.identity===identity);$('tfCompare').innerHTML='<option value="">No comparison</option>'+items.map(x=>'<option value="'+esc(x.savedAt)+'">'+esc(x.name)+' · '+esc((x.savedAt||'').slice(0,16))+'</option>').join('');$('tfCompare').value=items.some(x=>x.savedAt===prior)?prior:'';compareId=$('tfCompare').value}
function refreshHeroTrees(){const list=Array.isArray(tree?.hero_talent_trees)?tree.hero_talent_trees:[];$('tfHeroTree').innerHTML='<option value="all">All returned hero trees</option>'+list.map((x,i)=>'<option value="'+i+'">'+esc(x.name||('Hero tree '+(i+1)))+'</option>').join('');heroSelection='all';$('tfHeroTree').value='all';$('tfHeroTree').disabled=!list.length}
$('tfHeroTree').addEventListener('change',e=>{heroSelection=e.target.value;render()});
$('tfCompare').addEventListener('change',e=>{compareId=e.target.value;render()});

function snapshot(){return{ranks:{...draft},choices:{...choices}}}
function recordUndo(){undoStack.push(snapshot());if(undoStack.length>60)undoStack.shift();redoStack=[];updateUndoButtons()}
function updateUndoButtons(){const u=$('tfUndo'),r=$('tfRedo');if(u)u.disabled=!undoStack.length;if(r)r.disabled=!redoStack.length}
function travelHistory(from,to){if(recoveryPending){markPlannerEdit();return}if(!from.length)return;to.push(snapshot());if(to.length>60)to.shift();const state=from.pop();draft=cleanDraft(state.ranks);choices={...state.choices};render();markPlannerEdit();updateUndoButtons();notice('Draft history restored; use the in-game builder to validate any points.')}

const groups=()=>({class:Array.isArray(tree?.class_talent_nodes)?tree.class_talent_nodes:[],spec:Array.isArray(tree?.spec_talent_nodes)?tree.spec_talent_nodes:[],hero:Array.isArray(tree?.hero_talent_trees)?tree.hero_talent_trees.flatMap(t=>Array.isArray(t.hero_talent_nodes)?t.hero_talent_nodes.map(n=>({...n,hero_group:t.name||'Hero'})):[]):[]});
const allNodes=()=>Object.values(groups()).flat();
function nodeName(n,rank=0){
 const ranks=Array.isArray(n.ranks)?n.ranks:[],r=ranks[Math.min(Math.max(rank,0),ranks.length-1)];
 const ch=Array.isArray(r?.choice_of_tooltips)?r.choice_of_tooltips:[],choice=choices[n.id]||0;
 return ch[choice]?.talent?.name||ch[choice]?.spell_tooltip?.spell?.name||r?.tooltip?.talent?.name||r?.tooltip?.spell_tooltip?.spell?.name||n.name||('Talent node #'+n.id);
}
function nodeDesc(n,rank=0){
 const ranks=Array.isArray(n.ranks)?n.ranks:[],r=ranks[Math.min(Math.max(rank,0),ranks.length-1)];
 const c=Array.isArray(r?.choice_of_tooltips)?r.choice_of_tooltips:[],choice=choices[n.id]||0;
 return c[choice]?.spell_tooltip?.description||r?.tooltip?.spell_tooltip?.description||'No spell description supplied by Blizzard.';
}
const maxRanks=n=>Math.max(1,Array.isArray(n.ranks)?n.ranks.length:1);
function cleanDraft(raw){const result={},valid=new Map(allNodes().map(n=>[String(n.id),n]));if(!raw||typeof raw!=='object')return result;for(const [id,v] of Object.entries(raw)){const node=valid.get(id);if(node&&Number.isInteger(v)&&v>=0&&v<=maxRanks(node))result[id]=v}return result}
function render(){
 renderPlanner();
 const pools=groups();
 const current=active==='hero'&&heroSelection!=='all'?(tree?.hero_talent_trees?.[Number(heroSelection)]?.hero_talent_nodes||[]):pools[active];
 const relationship=relationshipEdges(current);
 $('tfLinkCounts').textContent=relationship.edges.length+' source-reported links · '+relationship.missing.length+' references outside this category. Not game validation.';
 renderPathIntel(current);
 if(focusedNode!==null)focusRelations(focusedNode);

 for(const kind of ['class','spec','hero']){$('tf'+kind[0].toUpperCase()+kind.slice(1)+'Points').textContent=pools[kind].reduce((n,x)=>n+(draft[String(x.id)]||0),0)}
 document.querySelectorAll('[data-tf-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tfTab===active));
 if(!tree){$('tfTree').innerHTML='<div class="empty">Load a Blizzard specialization tree to begin.</div>';$('tfLinkCounts').textContent='Load a talent tree to see its source-reported connections.';$('tfPathSummary').textContent='Load a talent tree to analyze paths.';$('tfPathDetails').textContent='Select a specialization to begin.';return}
 const pool=active==='hero'&&heroSelection!=='all'?(Array.isArray(tree?.hero_talent_trees?.[Number(heroSelection)]?.hero_talent_nodes)?tree.hero_talent_trees[Number(heroSelection)].hero_talent_nodes:[]):pools[active];
 if(!pool.length){$('tfTree').innerHTML='<div class="empty">Blizzard did not return nodes for this talent category. This does not necessarily mean the class has no such talents.</div>';return}
 const sorted=pool.slice().sort((a,b)=>(a.display_row??0)-(b.display_row??0)||(a.display_col??0)-(b.display_col??0));
 const query=$('tfFindNode').value.trim().toLowerCase(),layout=$('tfLayout').value;
 const prior=baseline(),priorRanks=prior?.rankByNode||{};
 const positioned=window.NexusTalentLayout?.arrange(sorted,14);
 const effectiveLayout=layout==='grid'&&!positioned?'cards':layout;
 if(layout==='grid'&&positioned?.adjusted){$('tfLayoutNotice').textContent=positioned.adjusted+' talent node(s) have automatically adjusted positions to avoid overlap. Adjusted positions are visual only; original Blizzard row and column metadata is still shown.'}
 else if(layout==='grid'&&!positioned){$('tfLayoutNotice').textContent='The position helper was not loaded. Nodes are displayed in compact cards.'}
 else $('tfLayoutNotice').textContent='';
 const review=$('tfReviewOnly').checked,flaggedTargets=new Set((pathAnalysis(current)?.flagged||[]).map(e=>e.to));
 const filtered=sorted.filter(n=>(!review||flaggedTargets.has(Number(n.id)))&&(!query||nodeName(n,draft[String(n.id)]||0).toLowerCase().includes(query)||nodeDesc(n,draft[String(n.id)]||0).toLowerCase().includes(query)||String(n.id)===query));
 $('tfTree').innerHTML='<div class="tf-node-grid '+(effectiveLayout==='grid'?'tf-positioned':'tf-cards')+($('tfBrief').checked?' tf-brief':'')+'">'+filtered.map(n=>{
  const id=Number(n.id),max=maxRanks(n),rank=draft[String(id)]||0,previous=Number(priorRanks[String(id)]||0),difference=prior?(rank>previous?'tf-more':rank<previous?'tf-less':''):'',freePoints=Number(n.default_points||0);
  const choiceNames=Array.isArray(n.ranks?.[0]?.choice_of_tooltips)?n.ranks[0].choice_of_tooltips:[];
  const option=choiceNames.length>1?'<div class="tf-choice"><label for="tfChoice'+id+'">Choice branch</label><select id="tfChoice'+id+'" data-tf-choice="'+id+'">'+choiceNames.map((x,i)=>'<option value="'+i+'" '+((choices[id]||0)===i?'selected':'')+'>'+esc(x.talent?.name||x.spell_tooltip?.spell?.name||('Option '+(i+1)))+'</option>').join('')+'</select></div>':'';
  return '<div data-tf-node="'+id+'" class="tf-node '+(rank?'tf-selected':'')+' '+difference+' '+(focusedNode===id?'tf-focused':'')+'" style="'+(effectiveLayout==='grid'?'--tf-col:'+(positioned?.locations[id]?.col||1)+';--tf-row:'+(positioned?.locations[id]?.row||1)+';':'')+'"><small>'+(freePoints>0?'<span class="tf-default-points">Blizzard default points: '+freePoints+'</span> · ':'')+(Number.isInteger(n.display_row)&&Number.isInteger(n.display_col)?'BLIZZARD ROW '+esc(n.display_row+1)+' · COL '+esc(n.display_col+1):'BLIZZARD POSITION NOT PROVIDED')+(positioned?.locations[id]?.adjusted?' · POSITION ADJUSTED':'')+' · #'+id+'</small><strong>'+esc(nodeName(n,Math.max(0,rank-1)))+'</strong><p>'+esc(nodeDesc(n,Math.max(0,rank-1)))+'</p>'+option+'<div class="tf-node-controls"><button type="button" data-tf-dec="'+id+'" '+(rank===0?'disabled':'')+' aria-label="Reduce rank">−</button><span>'+rank+' / '+max+'</span><button type="button" data-tf-inc="'+id+'" '+(rank===max?'disabled':'')+' aria-label="Increase rank">+</button></div><button class="tf-relation-button" type="button" data-tf-relations="'+id+'">RELATIONS</button></div>';
 }).join('')+'</div>'; updateBudget();if(typeof requestAnimationFrame==='function')requestAnimationFrame(renderLinks);
 if(!filtered.length)$('tfTree').innerHTML='<div class="empty">No talents match the current filter. Disable “Show only flagged links” or clear the search to see all nodes.</div>';
 if(prior){const d=countPointChanges(draft,prior.rankByNode);$('tfCompareSummary').textContent='Compared with '+prior.name+': '+d.changed+' changed nodes · '+d.added+' additional planned ranks · '+d.removed+' fewer planned ranks. Green outlines indicate more; amber indicate fewer.'}
 else $('tfCompareSummary').textContent='Choose a saved draft of the same specialization to compare planned ranks.';
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(_){notice('Local storage unavailable. Export your saved plans.')}}
function updateBudget(){const custom=Number($('tfBudget').value)||31;const count=Object.values(draft).reduce((a,b)=>a+(Number(b)||0),0);const target=$('tfBudgetStatus');target.textContent=count>custom?'Personal planning alert: '+count+' allocated points exceeds your chosen '+custom+'-point reminder. This does not validate Blizzard limits.':count+' planned points · custom '+custom+'-point reminder (not game validation).';target.dataset.over=count>custom?'true':'false'}
['tfFindNode','tfLayout','tfBrief'].forEach(id=>$(id).addEventListener(id==='tfFindNode'?'input':'change',render));
$('tfBudget').addEventListener('input',updateBudget);
function renderSaved(){if(tree)refreshComparison();$('tfSaved').innerHTML=saved.map((x,i)=>'<div class="tf-save-entry"><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.specName||'Talent draft')+' · '+esc(x.region||'us')+' · '+esc(x.savedAt?.slice(0,10)||'')+'</small></div><div class="actions"><button data-tf-open="'+i+'" type="button">LOAD</button><button data-tf-remove="'+i+'" type="button">REMOVE</button></div></div>').join('')||'<div class="empty">No saved talent drafts yet.</div>'}
async function api(path){const c=new AbortController(),timeout=setTimeout(()=>c.abort(),17000);try{const r=await fetch(API+path,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:c.signal});const d=await r.json().catch(()=>null);if(!r.ok||!d||d.success===false)throw Error(String(d?.message||'Talent API unavailable').slice(0,120));return d.data}catch(e){if(e.name==='AbortError')throw Error('Blizzard request timed out');throw e}finally{clearTimeout(timeout)}}
function parseSpec(x){
 const href=x?.key?.href||'';
 const m=href.match(/\/talent-tree\/(\d+)\/playable-specialization\/(\d+)/);
 return m?{treeId:Number(m[1]),specId:Number(m[2]),name:typeof x.name==='string'?x.name:('Specialization '+m[2])}:null;
}
async function indexFetch(region){
 const requestId=++indexRequest;
 notice('Loading Blizzard talent-tree index…');index=[];$('tfSpec').innerHTML='<option value="">Loading specializations…</option>';
 try{const data=await api('/api/talent-index/'+region),raw=Array.isArray(data?.spec_talent_trees)?data.spec_talent_trees:[];if(requestId!==indexRequest)return;index=raw.map(parseSpec).filter(Boolean).filter((v,i,a)=>a.findIndex(x=>x.treeId===v.treeId&&x.specId===v.specId)===i).sort((a,b)=>a.name.localeCompare(b.name));if(!index.length)throw Error('Blizzard returned no usable specialization-tree links');$('tfSpec').innerHTML='<option value="">Select a specialization</option>'+index.map((s,i)=>'<option value="'+i+'">'+esc(s.name)+' (ID '+s.specId+')</option>').join('');notice('Loaded '+index.length+' official talent tree entries. Select a specialization.')}
 catch(e){if(requestId!==indexRequest)return;$('tfSpec').innerHTML='<option value="">Talent index unavailable</option>';notice('Talent index unavailable: '+e.message+'. The current Cloudflare Worker may need the v2.3 upgrade.')}
}
async function load(spec,region,restored=null){if(!spec)return notice('Choose a specialization first.');if(loading)return;const token=++loadRequest;clearTimeout(recoveryTimer);loading=true;$('tfLoad').disabled=true;notice('Loading '+spec.name+' specialization data from Blizzard…');try{
 const data=await api('/api/talent-tree/'+region+'/'+spec.treeId+'/'+spec.specId);
 if(token!==loadRequest)return;
 if(!Array.isArray(data?.class_talent_nodes)||!Array.isArray(data?.spec_talent_nodes))throw Error('Blizzard response lacks class or specialization talent nodes');
 if(restored&&PLANNER)restored=PLANNER.sanitizeImported(restored);
 tree=data;focusedNode=null;loadedRegion=region;identity=region+'/'+spec.treeId+'/'+spec.specId;draft=cleanDraft(restored?.rankByNode||{});choices=cleanChoices(restored?.choiceByNode||{});plannerMeta=PLANNER?.sanitizeMeta(restored?.planner)||plannerMeta;undoStack=[];redoStack=[];updateUndoButtons();active='class';
 $('tfBuildName').value=restored?.name||spec.name+' Draft';plannerToFields();refreshHeroTrees();refreshComparison();render();recoveryPrompt();notice('Loaded official '+spec.name+' data. This is a manual planning workspace, not an in-game validator.'+(recoveryPending?' An unsaved local draft is available to restore.':''));
 }catch(e){notice('Could not load this specialization: '+e.message+'. You can try a different specialization or region.')}finally{loading=false;$('tfLoad').disabled=false}}
$('tfRegion').addEventListener('change',e=>{loadRequest++;clearTimeout(recoveryTimer);tree=null;draft={};choices={};identity='';plannerMeta=PLANNER?.defaultMeta()||plannerMeta;recoveryPending=false;$('tfPlanRecover').hidden=true;plannerToFields();render();indexFetch(e.target.value)});
$('tfLoad').addEventListener('click',()=>{const s=index[Number($('tfSpec').value)];load(s,$('tfRegion').value)});
document.addEventListener('click',e=>{
 const relation=e.target.closest('[data-tf-relations]');if(relation){focusedNode=Number(relation.dataset.tfRelations);render();return}
 const tab=e.target.closest('[data-tf-tab]');if(tab){active=tab.dataset.tfTab;render();return}
 const plus=e.target.closest('[data-tf-inc]'),minus=e.target.closest('[data-tf-dec]');
 if(plus||minus){const id=Number((plus||minus).dataset.tfInc||(plus||minus).dataset.tfDec),n=allNodes().find(x=>x.id===id);if(!n)return;const next=Math.max(0,Math.min(maxRanks(n),(draft[String(id)]||0)+(plus?1:-1)));if(next===(draft[String(id)]||0))return;if(!markPlannerEdit())return;recordUndo();draft[String(id)]=next;render();return}
 const open=e.target.closest('[data-tf-open]');if(open){const x=saved[Number(open.dataset.tfOpen)];if(!x)return;const [region,treeId,specId]=x.identity.split('/');$('tfRegion').value=region;indexFetch(region).then(()=>{const i=index.findIndex(v=>v.treeId===Number(treeId)&&v.specId===Number(specId));if(i>=0){$('tfSpec').value=String(i);load(index[i],region,x)}else notice('Saved specialization is not present in the current Blizzard index.')});return}
 const remove=e.target.closest('[data-tf-remove]');if(remove){if(confirm('Remove this saved talent draft?')){saved.splice(Number(remove.dataset.tfRemove),1);persist();renderSaved();render()}}
});
document.addEventListener('change',e=>{const id=e.target.dataset.tfChoice;if(id&&tree){const next=Number(e.target.value)||0;if(next!==Number(choices[id]||0)){if(!markPlannerEdit()){render();return}recordUndo();choices[id]=next;render()}}});
function draftRecord(){const selected=index[Number($('tfSpec').value)];return{format:'nexus-azeroth-talent-draft-v1',name:$('tfBuildName').value.trim().slice(0,75)||'My talent draft',identity,region:loadedRegion,treeId:tree.id,specName:selected?.name||tree.playable_specialization?.name||'Spec',rankByNode:draft,choiceByNode:choices,savedAt:new Date().toISOString(),notice:'Manual talent research plan; not validated for game import or points/prerequisites.'}}
$('tfSave').addEventListener('click',()=>{if(!tree)return notice('Load a talent tree before saving.');const x=draftRecord();saved=[x,...saved.filter(v=>!(v.identity===x.identity&&v.name===x.name))].slice(0,40);persist();renderSaved();render();notice('Talent draft saved locally.')});
$('tfClear').addEventListener('click',()=>{if(!tree)return;if(confirm('Clear all allocated ranks and choices from the current draft?')){if(!markPlannerEdit())return;recordUndo();draft={};choices={};render();notice('Draft cleared.')}})
$('tfExport').addEventListener('click',()=>{if(!tree)return notice('Load a talent tree to export.');const text=JSON.stringify(draftRecord(),null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='nexus-talent-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
$('tfImport').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>1000000)throw Error('File too large');const v=JSON.parse(await f.text());if(v.format!=='nexus-azeroth-talent-draft-v1'||typeof v.identity!=='string'||typeof v.name!=='string'||!v.rankByNode||typeof v.rankByNode!=='object')throw Error('Invalid talent draft');if(!/^(us|eu|kr|tw)\/\d{1,10}\/\d{1,10}$/.test(v.identity))throw Error('Invalid specialization reference');const [region,treeId,specId]=v.identity.split('/');$('tfRegion').value=region;await indexFetch(region);const i=index.findIndex(s=>s.treeId===Number(treeId)&&s.specId===Number(specId));if(i<0)throw Error('Spec not found in current Blizzard index');$('tfSpec').value=String(i);await load(index[i],region,v)}catch(err){notice('Import failed: '+err.message)}e.target.value=''});
$('tfUndo').addEventListener('click',()=>travelHistory(undoStack,redoStack));$('tfRedo').addEventListener('click',()=>travelHistory(redoStack,undoStack));updateUndoButtons();renderSaved();if(window.NexusStartup?.whenView)window.NexusStartup.whenView('talents',()=>indexFetch($('tfRegion').value));else indexFetch('us');
})();