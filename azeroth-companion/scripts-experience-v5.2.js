/* NEXUS | AZEROTH v5.2 — compiled experience script including Talent Source Intelligence. DO NOT EDIT: generated from original studio and shell scripts in order. */

;/* BUNDLE SOURCE: talent-paths.js */
/* NEXUS Azeroth Companion Talent Path Analysis 2.7.
 * Pure read-only analysis of Blizzard-provided locked_by references.
 * A linked node with zero planned points is not proof a talent is inaccessible in-game.
 * No prerequisite, tier, hero, level or import-string validation is claimed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentPaths=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function idOf(ref){
   const candidate=typeof ref==='object'&&ref!==null?(ref.id??ref.node_id):ref;
   const id=Number(candidate);
   return Number.isSafeInteger(id)&&id>0?id:null;
 }
 function analyze(nodes,draft){
   const list=Array.isArray(nodes)?nodes.filter(n=>n&&idOf(n.id)!==null):[];
   const byId=new Map(list.map(n=>[idOf(n.id),n]));
   const edges=[],unresolved=[],seen=new Set();
   for(const node of list){
     const to=idOf(node.id);
     if(!Array.isArray(node.locked_by))continue;
     for(const reference of node.locked_by){
       const from=idOf(reference);
       if(from===null||from===to)continue;
       const key=from+':'+to;
       if(seen.has(key))continue;
       seen.add(key);
       if(byId.has(from))edges.push({from,to});
       else unresolved.push({from,to});
     }
   }
   const ranks=draft&&typeof draft==='object'?draft:{};
   const points=id=>Number.isSafeInteger(ranks[String(id)])&&ranks[String(id)]>0?ranks[String(id)]:0;
   const flagged=edges.filter(link=>points(link.to)>0&&points(link.from)===0);
   const satisfied=edges.filter(link=>points(link.to)>0&&points(link.from)>0);
   const planned=list.filter(node=>points(idOf(node.id))>0);
   const summary={
     nodes:list.length,
     linked:edges.length,
     unresolved:unresolved.length,
     planned:planned.length,
     flagged:flagged.length,
     satisfied:satisfied.length
   };
   function details(id){
     const number=idOf(id);
     if(number===null)return null;
     const incoming=edges.filter(link=>link.to===number);
     const outgoing=edges.filter(link=>link.from===number);
     const outside=unresolved.filter(link=>link.to===number);
     return{
       id:number,points:points(number),
       incoming:incoming.map(link=>({id:link.from,points:points(link.from)})),
       outgoing:outgoing.map(link=>({id:link.to,points:points(link.to)})),
       unresolved:outside.map(link=>link.from)
     };
   }
   function ancestors(id,maxDepth=16){
     const target=idOf(id),result=[],visited=new Set([target]),queue=[{id:target,depth:0}];
     if(target===null||!byId.has(target))return result;
     while(queue.length&&result.length<300){
       const current=queue.shift();
       if(current.depth>=maxDepth)continue;
       for(const edge of edges){
         if(edge.to!==current.id||visited.has(edge.from))continue;
         visited.add(edge.from);result.push({id:edge.from,depth:current.depth+1,points:points(edge.from)});
         queue.push({id:edge.from,depth:current.depth+1});
       }
     }
     return result;
   }
   return{summary,edges,unresolved,flagged,satisfied,details,ancestors};
 }
 return{analyze};
});


;/* BUNDLE SOURCE: talent-planner-core.js */
/* NEXUS | AZEROTH — Talent Forge Planner Engine v5.1
 * Pure browser-local helpers. Source data is Blizzard-supplied; calculations
 * validate only structural draft properties, not WoW game loadout legality.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentPlanner=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const activities=['general','raid','mythic-plus','pvp','solo','open-world'];
 const roles=['unspecified','damage','tank','healer'];
 const styles=['balanced','burst','sustain','utility','survival'];
 const defaultMeta=()=>({activity:'general',role:'unspecified',style:'balanced',notes:'',targets:{class:0,spec:0,hero:0}});
 const bounded=(value,min,max)=>Number.isSafeInteger(Number(value))&&Number(value)>=min&&Number(value)<=max?Number(value):min;
 const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)!==null?o:o&&Object.getPrototypeOf(o)===null?o:null;
 const cleanText=(value,limit)=>typeof value==='string'?value.slice(0,limit).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,''):'';
 function sanitizeMeta(raw){
  const x=plain(raw)||{},m=defaultMeta();
  for(const [field,options] of [['activity',activities],['role',roles],['style',styles]])
   if(options.includes(x[field]))m[field]=x[field];
  m.notes=cleanText(x.notes,1800);
  const t=plain(x.targets)||{};
  for(const key of ['class','spec','hero'])m.targets[key]=bounded(t[key],0,150);
  return m;
 }
 const identityOK=s=>typeof s==='string'&&/^(us|eu|kr|tw)\/[1-9]\d{0,9}\/[1-9]\d{0,9}$/.test(s);
 function copyNodes(source,cap,allowedMax){
  const o=plain(source);if(!o||Object.keys(o).length>400)throw Error('Node data is missing or too large');
  const target=Object.create(null);
  for(const [id,v] of Object.entries(o)){
   if(!/^[1-9]\d{0,9}$/.test(id)||!Number.isSafeInteger(v)||v<0||v>allowedMax)
    throw Error('Unsupported node rank or choice value');
   target[id]=v;
  }
  return target;
 }
 function sanitizeImported(raw){
  const v=plain(raw);
  if(!v||v.format!=='nexus-azeroth-talent-draft-v1'||!identityOK(v.identity)||!cleanText(v.name,75).trim())
   throw Error('Unsupported Talent Forge draft or specialization');
  const [region,treeId]=v.identity.split('/');
  const ranks=copyNodes(v.rankByNode,400,20);
  const choices=v.choiceByNode==null?Object.create(null):copyNodes(v.choiceByNode,400,20);
  return{
   format:'nexus-azeroth-talent-draft-v1',identity:v.identity,region,treeId:Number(treeId),
   specName:cleanText(v.specName,95)||'Specialization',
   name:cleanText(v.name,75).trim(),rankByNode:ranks,choiceByNode:choices,
   planner:sanitizeMeta(v.planner),savedAt:typeof v.savedAt==='string'&&/^\d{4}-\d\d-\d\dT/.test(v.savedAt)?v.savedAt.slice(0,30):new Date().toISOString(),
   notice:'Manual planning draft. Validate in the game before use.'
  };
 }
 function nodesByPool(tree){
  const classNodes=Array.isArray(tree?.class_talent_nodes)?tree.class_talent_nodes:[];
  const specNodes=Array.isArray(tree?.spec_talent_nodes)?tree.spec_talent_nodes:[];
  const heroTrees=Array.isArray(tree?.hero_talent_trees)?tree.hero_talent_trees:[];
  const heroNodes=heroTrees.flatMap(t=>Array.isArray(t?.hero_talent_nodes)?t.hero_talent_nodes:[]);
  return{class:classNodes,spec:specNodes,hero:heroNodes,heroTrees};
 }
 function choiceCount(node){
  const ranks=Array.isArray(node?.ranks)?node.ranks:[];
  return Math.max(0,...ranks.map(r=>Array.isArray(r?.choice_of_tooltips)?r.choice_of_tooltips.length:0));
 }
 function analyze(tree,ranks,choiceByNode,rawMeta,paths){
  const meta=sanitizeMeta(rawMeta),pools=nodesByPool(tree),scores={class:0,spec:0,hero:0},
   notes=[],issues=[],nodeKinds=new Map(),heroSelected=new Set(),selected=[];
  for(const category of ['class','spec','hero']){
   for(const node of pools[category]){
    const id=Number(node?.id);
    if(Number.isSafeInteger(id)&&id>0&&!nodeKinds.has(String(id)))nodeKinds.set(String(id),{category,node});
   }
  }
  const selections=plain(ranks)||{},choiceMap=plain(choiceByNode)||{};
  let allocated=0,chosenNodes=0;
  for(const [id,rank]of Object.entries(selections).slice(0,800)){
   if(!Number.isSafeInteger(rank)||rank<0||rank>20){issues.push('A planned rank is outside the supported draft range.');continue}
   if(rank===0)continue;
   allocated+=rank;chosenNodes++;
   const entry=nodeKinds.get(id);
   if(!entry){issues.push('Planned node #'+id+' is not in the currently loaded Blizzard tree.');continue}
   scores[entry.category]+=rank;
   const rankChoices=Array.isArray(entry.node?.ranks)?entry.node.ranks:[];
   const current=rankChoices[Math.min(Math.max(rank-1,0),rankChoices.length-1)]||{};
   const choiceIndex=Number(choiceMap[id]||0);
   const chosen=Array.isArray(current.choice_of_tooltips)?current.choice_of_tooltips[choiceIndex]:null;
   const name=chosen?.talent?.name||chosen?.spell_tooltip?.spell?.name||current?.tooltip?.talent?.name||current?.tooltip?.spell_tooltip?.spell?.name||entry.node?.name||('Node #'+id);
   selected.push({id,category:entry.category,name:cleanText(name,95),rank});
   const max=Math.max(1,Array.isArray(entry.node?.ranks)?entry.node.ranks.length:0);
   if(rank>max)issues.push('Node #'+id+' exceeds the source-reported rank count.');
  }
  for(const [id,v]of Object.entries(choiceMap).slice(0,800)){
   const entry=nodeKinds.get(id);
   if(!entry){if(Number(selections[id])>0)issues.push('Choice for unknown node #'+id+' requires review.');continue}
   const count=choiceCount(entry.node);
   if(!Number.isSafeInteger(v)||v<0||v>=Math.max(1,count))
    issues.push('Choice selection for node #'+id+' is outside the returned options.');
  }
  for(const category of ['class','spec','hero']){
   const goal=meta.targets[category];
   if(goal>0&&scores[category]>goal)notes.push(category+' planned points ('+scores[category]+') exceed your personal target ('+goal+').');
  }
  for(const [index,hTree]of pools.heroTrees.entries()){
   if((hTree?.hero_talent_nodes||[]).some(n=>Number(selections[String(n?.id)]||0)>0))heroSelected.add(index);
  }
  if(heroSelected.size>1)notes.push('Points span multiple returned hero trees; review your selection in the in-game talent interface.');
  let linksForReview=0;
  if(typeof paths==='function'){
   for(const category of ['class','spec','hero']){
    try{
     const graph=paths(pools[category],selections);
     linksForReview+=Math.max(0,Number(graph?.summary?.flagged)||0);
    }catch(_){}
   }
  }
  if(linksForReview)notes.push(linksForReview+' source-linked connections merit review. A missing planned upstream rank does not prove an in-game invalid build.');
  if(!chosenNodes)notes.push('No ranks are allocated yet. Choose talents to begin a planning draft.');
  return{
   scores,allocated,chosenNodes,selected:selected.slice(0,120),goal:{...meta.targets},meta,
   issues:issues.slice(0,12),moreIssues:Math.max(0,issues.length-12),
   advisory:notes.slice(0,12),linksForReview,
   gameValidated:false,hasTree:Boolean(tree)
  };
 }
 function summaryText(info,specName){
  const name=cleanText(specName,95)||'Talent research';
  const p=info||{scores:{class:0,spec:0,hero:0},meta:defaultMeta(),issues:[],advisory:[]};
  return [
   'NEXUS | TALENT FORGE — PLANNING DRAFT',
   'Specialization: '+name,
   'Activity: '+p.meta.activity+' | Role: '+p.meta.role+' | Style: '+p.meta.style,
   'Planned ranks — Class: '+p.scores.class+' | Specialization: '+p.scores.spec+' | Hero: '+p.scores.hero,
   'Personal planning targets — Class: '+p.meta.targets.class+' | Specialization: '+p.meta.targets.spec+' | Hero: '+p.meta.targets.hero,
   'Notes: '+(p.meta.notes||'(none)'),
   'Planned talents: '+(p.selected?.length?p.selected.slice(0,45).map(n=>n.category+': '+n.name+' ('+n.rank+')').join(' | '):'(none)'),
   'Structural review: '+(p.issues.length?p.issues.join(' | '):'No structural issues detected in the currently loaded data'),
   'Advisories: '+(p.advisory.length?p.advisory.join(' | '):'None'),
   'NOT an in-game-valid loadout or Blizzard import code. Verify talents in World of Warcraft.'
  ].join('\n');
 }
 return{activities,roles,styles,defaultMeta,sanitizeMeta,sanitizeImported,nodesByPool,analyze,summaryText,identityOK};
});

;/* BUNDLE SOURCE: talent-forge.js */
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
 record.savedAt=uniqueSavedAt();
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

// v5.2 — source-identifiable talent inspector and item-by-ID research.
// Never claim actual in-game talent legality or numerical gameplay simulation.
const intelPanel=document.createElement('section');
intelPanel.id='tfSourceIntel';intelPanel.className='panel tf-source-intel';
intelPanel.innerHTML='<div class="tf-source-head"><div><span class="wow-kicker">OFFICIAL SOURCE RECORDS</span><h3>Talent & Gear Intelligence</h3><p>Inspect the official IDs, descriptions, ranked tooltips and saved-build deltas. Live item details use the existing Blizzard item API. Missing fields remain unavailable, not estimated.</p></div></div>'+
 '<div class="tf-intel-columns"><section><h4>Selected talent details</h4><div id="tfSourceTalent" role="status" aria-live="polite">Choose INSPECT on a Blizzard talent node to see its rank details.</div></section>'+
 '<section><h4>Gear ID Research</h4><form id="tfSourceItemForm" class="tf-source-item-form"><label for="tfSourceItemId">Blizzard item ID</label><div><input id="tfSourceItemId" type="number" inputmode="numeric" min="1" max="9999999999" step="1" required placeholder="Enter real item ID"><button type="submit">LOOK UP</button></div></form><div id="tfSourceItem" role="status" aria-live="polite">Item lookup uses Blizzard data, not theoretical gear optimization.</div></section></div>';
$('tfPlanner').after(intelPanel);
let inspectedNode=null,itemRequest=0;
const detailId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&Number(v)<=9999999999?Number(v):null;
const tooltipFor=(rank,choice)=>{
 const entry=Array.isArray(rank?.choice_of_tooltips)?rank.choice_of_tooltips[choice]||rank.choice_of_tooltips[0]:null;
 return entry?.spell_tooltip||rank?.tooltip?.spell_tooltip||{};
};
function nodeIdentity(n,r){
 const tooltip=tooltipFor(r,Number(choices[n.id]||0));
 const entry=Array.isArray(r?.choice_of_tooltips)?r.choice_of_tooltips[Number(choices[n.id]||0)]:null;
 return {node:detailId(n.id),talent:detailId(entry?.talent?.id??r?.tooltip?.talent?.id),
 spell:detailId(tooltip?.spell?.id),description:typeof tooltip.description==='string'?tooltip.description:'',
 name:entry?.talent?.name||tooltip?.spell?.name||r?.tooltip?.talent?.name||n.name||('Node '+n.id)};
}
const sourceLine=(name,id)=>'<span class="tf-source-id">'+esc(name)+': '+(id===null?'Not provided by Blizzard':'#'+id)+(id!==null&&(name==='Spell ID'||name==='Item ID')?' <a target="_blank" rel="noopener noreferrer" href="https://www.wowhead.com/'+(name==='Spell ID'?'spell':'item')+'='+id+'">REFERENCE ↗</a>':'')+'</span>';
function renderSourceTalent(){
 const dest=$('tfSourceTalent');if(!dest)return;
 const node=allNodes().find(n=>Number(n.id)===inspectedNode);
 if(!node){dest.textContent=tree?'Select INSPECT on a talent to review Blizzard IDs and each returned rank.':'Load an official specialization and select INSPECT on a talent.';return}
 const selected=Number(draft[String(node.id)]||0),prior=baseline(),previous=Number(prior?.rankByNode?.[String(node.id)]||0),ranks=Array.isArray(node.ranks)?node.ranks:[],current=ranks[Math.max(0,Math.min(ranks.length-1,selected-1))]||ranks[0]||{};
 const id=nodeIdentity(node,current),delta=selected-previous;
 dest.innerHTML='<div class="tf-source-identity"><strong>'+esc(id.name)+'</strong><div class="tf-source-ids">'+sourceLine('Node ID',id.node)+sourceLine('Talent ID',id.talent)+sourceLine('Spell ID',id.spell)+'</div></div>'+
 '<p><strong>Allocation:</strong> '+selected+' / '+maxRanks(node)+' manually planned ranks'+(prior?' · saved comparison '+previous+' → '+selected+' ('+(delta>0?'+':'')+delta+')':'')+'</p>'+
 '<p><strong>Type:</strong> '+(node.hero_group?'Hero · '+esc(node.hero_group):groups().class.some(n=>Number(n.id)===Number(node.id))?'Class':'Specialization')+' · <strong>Blizzard default points:</strong> '+esc(node.default_points??'Not supplied')+'</p>'+
 '<div class="tf-rank-catalog"><strong>Blizzard-returned rank descriptions</strong>'+
 (ranks.length?ranks.map((r,i)=>{const info=nodeIdentity(node,r);const choicesList=Array.isArray(r.choice_of_tooltips)?r.choice_of_tooltips:[];return '<div class="tf-rank-detail'+(i+1===selected?' is-planned':'')+'"><strong>Rank '+(i+1)+(i+1===selected?' · allocated':'')+'</strong><div class="tf-source-ids">'+sourceLine('Talent ID',info.talent)+sourceLine('Spell ID',info.spell)+'</div><p>'+esc(info.description||'Description not supplied in this Blizzard response.')+'</p>'+(choicesList.length>1?'<small>Choice alternatives: '+choicesList.map((x,k)=>esc(x.talent?.name||x.spell_tooltip?.spell?.name||'Choice '+(k+1))+(k===Number(choices[node.id]||0)?' [selected]':'')).join(' · ')+'</small>':'')+'</div>'}).join(''):'<p>No rank-specific tooltips returned for this node.</p>')+'</div>'+
 '<p class="hint">IDs and descriptions come from the loaded specialization response. Effects are text descriptions; no simulated damage, spell coefficients, or gameplay legality is inferred.</p>';
}
async function findItemById(id){
 const output=$('tfSourceItem');if(!detailId(id)){output.textContent='Enter a valid positive numeric Blizzard item ID.';return}
 const token=++itemRequest;output.textContent='Retrieving Blizzard item #'+id+'…';
 try{
  const data=await api('/api/item/'+$('tfRegion').value+'/'+id);if(token!==itemRequest)return;
  if(!data||Number(data.id)!==Number(id))throw Error('Item ID did not match the Blizzard response');
  const name=typeof data.name==='string'?data.name:'Item #'+id;
  const strings=[['Item level',data.level],['Required level',data.required_level],['Quality',data.quality?.name],['Item class',data.item_class?.name],['Item subclass',data.item_subclass?.name],['Inventory type',data.inventory_type?.name],['Purchase price',data.purchase_price]];
  const stats=Array.isArray(data.preview_item?.stats)?data.preview_item.stats:[];
  output.innerHTML='<div class="tf-source-identity"><strong>'+esc(name)+'</strong>'+sourceLine('Item ID',detailId(data.id))+'</div><div class="tf-item-facts">'+strings.filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([k,v])=>'<span><b>'+esc(k)+':</b> '+esc(typeof v==='object'?(v.name||'Not available'):v)+'</span>').join('')+'</div>'+
   (stats.length?'<h5>Reported item stats</h5><ul>'+stats.slice(0,32).map(stat=>'<li>'+esc(stat.type?.name||stat.type?.type||'Stat')+': '+esc((stat.display?.display_string||stat.value||'Not provided'))+'</li>').join('')+'</ul>':'<p>No numeric stat breakdown returned in this item response.</p>')+
   '<p class="hint">Item properties vary by level, difficulty, bonuses and character context. This is source lookup, not an equipped-character DPS comparison.</p>';
 }catch(e){if(token!==itemRequest)return;output.textContent='Blizzard item lookup unavailable: '+e.message}
}
$('tfSourceItemForm').addEventListener('submit',e=>{e.preventDefault();findItemById(Number($('tfSourceItemId').value))});

function render(){
 renderPlanner();
 renderSourceTalent();
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
  return '<div data-tf-node="'+id+'" class="tf-node '+(rank?'tf-selected':'')+' '+difference+' '+(focusedNode===id?'tf-focused':'')+'" style="'+(effectiveLayout==='grid'?'--tf-col:'+(positioned?.locations[id]?.col||1)+';--tf-row:'+(positioned?.locations[id]?.row||1)+';':'')+'"><small>'+(freePoints>0?'<span class="tf-default-points">Blizzard default points: '+freePoints+'</span> · ':'')+(Number.isInteger(n.display_row)&&Number.isInteger(n.display_col)?'BLIZZARD ROW '+esc(n.display_row+1)+' · COL '+esc(n.display_col+1):'BLIZZARD POSITION NOT PROVIDED')+(positioned?.locations[id]?.adjusted?' · POSITION ADJUSTED':'')+' · #'+id+'</small><strong>'+esc(nodeName(n,Math.max(0,rank-1)))+'</strong><p>'+esc(nodeDesc(n,Math.max(0,rank-1)))+'</p>'+option+'<div class="tf-node-controls"><button type="button" data-tf-dec="'+id+'" '+(rank===0?'disabled':'')+' aria-label="Reduce rank">−</button><span>'+rank+' / '+max+'</span><button type="button" data-tf-inc="'+id+'" '+(rank===max?'disabled':'')+' aria-label="Increase rank">+</button></div><div class="tf-source-actions"><button class="tf-relation-button" type="button" data-tf-relations="'+id+'">RELATIONS</button><button class="tf-relation-button" type="button" data-tf-inspect="'+id+'">INSPECT</button></div></div>';
 }).join('')+'</div>'; updateBudget();if(typeof requestAnimationFrame==='function')requestAnimationFrame(renderLinks);
 if(!filtered.length)$('tfTree').innerHTML='<div class="empty">No talents match the current filter. Disable “Show only flagged links” or clear the search to see all nodes.</div>';
 if(prior){const d=countPointChanges(draft,prior.rankByNode);const changed=allNodes().filter(n=>Number(draft[String(n.id)]||0)!==Number(prior.rankByNode?.[String(n.id)]||0)).slice(0,12).map(n=>nodeName(n)+' '+Number(prior.rankByNode?.[String(n.id)]||0)+'→'+Number(draft[String(n.id)]||0));$('tfCompareSummary').textContent='Compared with '+prior.name+': '+d.changed+' changed nodes · '+d.added+' additional planned ranks · '+d.removed+' fewer planned ranks. '+(changed.length?'Rank differences: '+changed.join(' · ')+(d.changed>12?' …':'')+'. ':'')+'Select INSPECT for descriptions and exact source IDs.'}
 else $('tfCompareSummary').textContent='Choose a saved draft of the same specialization to compare planned ranks.';
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(_){notice('Local storage unavailable. Export your saved plans.')}}
function updateBudget(){const custom=Number($('tfBudget').value)||31;const count=Object.values(draft).reduce((a,b)=>a+(Number(b)||0),0);const target=$('tfBudgetStatus');target.textContent=count>custom?'Personal planning alert: '+count+' allocated points exceeds your chosen '+custom+'-point reminder. This does not validate Blizzard limits.':count+' planned points · custom '+custom+'-point reminder (not game validation).';target.dataset.over=count>custom?'true':'false'}
['tfFindNode','tfLayout','tfBrief'].forEach(id=>$(id).addEventListener(id==='tfFindNode'?'input':'change',render));
$('tfBudget').addEventListener('input',updateBudget);
function renderSaved(){if(tree)refreshComparison();$('tfSaved').innerHTML=saved.map((x,i)=>'<div class="tf-save-entry"><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.specName||'Talent draft')+' · '+esc(x.region||'us')+' · '+esc(x.savedAt?.slice(0,10)||'')+'</small></div><div class="actions"><button data-tf-open="'+i+'" type="button">LOAD</button><button data-tf-clone="'+i+'" type="button">DUPLICATE</button><button data-tf-remove="'+i+'" type="button">REMOVE</button></div></div>').join('')||'<div class="empty">No saved talent drafts yet.</div>'}
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
 tree=data;focusedNode=null;loadedRegion=region;identity=region+'/'+spec.treeId+'/'+spec.specId;draft=cleanDraft(restored?.rankByNode||{});choices=cleanChoices(restored?.choiceByNode||{});plannerMeta=PLANNER?.sanitizeMeta(restored?.planner)||PLANNER?.defaultMeta()||plannerMeta;undoStack=[];redoStack=[];updateUndoButtons();active='class';
 $('tfBuildName').value=restored?.name||spec.name+' Draft';plannerToFields();refreshHeroTrees();refreshComparison();render();recoveryPrompt();notice('Loaded official '+spec.name+' data. This is a manual planning workspace, not an in-game validator.'+(recoveryPending?' An unsaved local draft is available to restore.':''));
 }catch(e){notice('Could not load this specialization: '+e.message+'. You can try a different specialization or region.')}finally{loading=false;$('tfLoad').disabled=false}}
$('tfRegion').addEventListener('change',e=>{loadRequest++;clearTimeout(recoveryTimer);tree=null;draft={};choices={};identity='';plannerMeta=PLANNER?.defaultMeta()||plannerMeta;recoveryPending=false;$('tfPlanRecover').hidden=true;plannerToFields();render();indexFetch(e.target.value)});
$('tfLoad').addEventListener('click',()=>{const s=index[Number($('tfSpec').value)];load(s,$('tfRegion').value)});
document.addEventListener('click',e=>{
 const inspect=e.target.closest('[data-tf-inspect]');if(inspect){inspectedNode=Number(inspect.dataset.tfInspect);renderSourceTalent();$('tfSourceIntel').scrollIntoView({behavior:'smooth',block:'nearest'});return}
 const relation=e.target.closest('[data-tf-relations]');if(relation){focusedNode=Number(relation.dataset.tfRelations);render();return}
 const tab=e.target.closest('[data-tf-tab]');if(tab){active=tab.dataset.tfTab;render();return}
 const plus=e.target.closest('[data-tf-inc]'),minus=e.target.closest('[data-tf-dec]');
 if(plus||minus){const id=Number((plus||minus).dataset.tfInc||(plus||minus).dataset.tfDec),n=allNodes().find(x=>x.id===id);if(!n)return;const next=Math.max(0,Math.min(maxRanks(n),(draft[String(id)]||0)+(plus?1:-1)));if(next===(draft[String(id)]||0))return;if(!markPlannerEdit())return;recordUndo();draft[String(id)]=next;render();return}
 const open=e.target.closest('[data-tf-open]');if(open){const x=saved[Number(open.dataset.tfOpen)];if(!x)return;const [region,treeId,specId]=x.identity.split('/');$('tfRegion').value=region;indexFetch(region).then(()=>{const i=index.findIndex(v=>v.treeId===Number(treeId)&&v.specId===Number(specId));if(i>=0){$('tfSpec').value=String(i);load(index[i],region,x)}else notice('Saved specialization is not present in the current Blizzard index.')});return}
 const clone=e.target.closest('[data-tf-clone]');if(clone){const source=saved[Number(clone.dataset.tfClone)];if(!source)return;const copy={...source,name:(String(source.name).slice(0,65)+' Copy').slice(0,75),rankByNode:{...source.rankByNode},choiceByNode:{...source.choiceByNode},planner:PLANNER?.sanitizeMeta(source.planner),savedAt:uniqueSavedAt()};saved=[copy,...saved].slice(0,40);persist();renderSaved();notice('Duplicated the saved draft. The original is unchanged.');return}
 const remove=e.target.closest('[data-tf-remove]');if(remove){if(confirm('Remove this saved talent draft?')){saved.splice(Number(remove.dataset.tfRemove),1);persist();renderSaved();render()}}
});
document.addEventListener('change',e=>{const id=e.target.dataset.tfChoice;if(id&&tree){const next=Number(e.target.value)||0;if(next!==Number(choices[id]||0)){if(!markPlannerEdit()){render();return}recordUndo();choices[id]=next;render()}}});
function uniqueSavedAt(){let ms=Date.now();while(saved.some(x=>x.savedAt===new Date(ms).toISOString()))ms++;return new Date(ms).toISOString()}
function draftRecord(){const selected=index[Number($('tfSpec').value)];return{format:'nexus-azeroth-talent-draft-v1',name:$('tfBuildName').value.trim().slice(0,75)||'My talent draft',identity,region:loadedRegion,treeId:tree.id,specName:selected?.name||tree.playable_specialization?.name||'Spec',rankByNode:{...draft},choiceByNode:{...choices},planner:PLANNER?.sanitizeMeta(plannerMeta)||plannerMeta,savedAt:uniqueSavedAt(),notice:'Manual talent research plan; not validated for game import or points/prerequisites.'}}
$('tfSave').addEventListener('click',()=>{if(!tree)return notice('Load a talent tree before saving.');if(recoveryPending)return notice('Resolve the existing unsaved recovery before saving.');clearTimeout(recoveryTimer);const x=draftRecord();saved=[x,...saved.filter(v=>!(v.identity===x.identity&&v.name===x.name))].slice(0,40);persist();dropRecovery(identity);$('tfPlanRecoveryStatus').textContent='Saved to My Saved Talent Drafts. Export JSON for a portable backup.';renderSaved();render();notice('Build planner draft saved locally. This is not an in-game-valid import code.')});
$('tfClear').addEventListener('click',()=>{if(!tree)return;if(confirm('Clear all allocated ranks and choices from the current draft?')){if(!markPlannerEdit())return;recordUndo();draft={};choices={};render();notice('Draft cleared.')}})
$('tfExport').addEventListener('click',()=>{if(!tree)return notice('Load a talent tree to export.');const text=JSON.stringify(draftRecord(),null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='nexus-talent-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)});
$('tfImport').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>1000000)throw Error('File too large');if(!PLANNER)throw Error('Planner helper unavailable');const v=PLANNER.sanitizeImported(JSON.parse(await f.text()));const [region,treeId,specId]=v.identity.split('/');$('tfRegion').value=region;await indexFetch(region);const i=index.findIndex(s=>s.treeId===Number(treeId)&&s.specId===Number(specId));if(i<0)throw Error('Spec not found in current Blizzard index');$('tfSpec').value=String(i);await load(index[i],region,v)}catch(err){notice('Import failed: '+err.message)}e.target.value=''});
$('tfUndo').addEventListener('click',()=>travelHistory(undoStack,redoStack));$('tfRedo').addEventListener('click',()=>travelHistory(redoStack,undoStack));updateUndoButtons();renderSaved();if(window.NexusStartup?.whenView)window.NexusStartup.whenView('talents',()=>indexFetch($('tfRegion').value));else indexFetch('us');
})();

;/* BUNDLE SOURCE: adaptive-navigation.js */
/* NEXUS | Azeroth Companion v3.4.1 Adaptive Navigation — presentation-only */
(()=>{'use strict';
const sidebar=document.querySelector('.sidebar'),nav=sidebar?.querySelector('.nav'),main=document.querySelector('.main');
if(!sidebar||!nav||!main||document.querySelector('.ac-mobile-bar'))return;
const mobile=window.matchMedia('(max-width: 800px)');
const backdrop=document.createElement('div');backdrop.className='ac-menu-backdrop';backdrop.setAttribute('aria-hidden','true');document.body.append(backdrop);
const header=document.createElement('div');header.className='ac-mobile-menu-head';
const brand=sidebar.querySelector('.brand');if(brand)header.append(brand);
const close=document.createElement('button');close.type='button';close.className='ac-mobile-close';close.textContent='×';close.setAttribute('aria-label','Close navigation');header.append(close);sidebar.prepend(header);
const searchWrap=document.createElement('div');searchWrap.className='ac-search-wrap';const search=document.createElement('input');search.type='search';search.placeholder='Find a companion tool…';search.setAttribute('aria-label','Find companion tool');search.autocomplete='off';const count=document.createElement('span');count.className='ac-search-count';searchWrap.append(search,count);nav.before(searchWrap);
sidebar.id=sidebar.id||'ac-navigation';sidebar.setAttribute('aria-label','All companion tools');
const bar=document.createElement('nav');bar.className='ac-mobile-bar';bar.setAttribute('aria-label','Quick navigation');
const quick=[['overview','⌂','Home'],['armory','♟','Armory'],['progress','◈','Goals']];
for(const [target,icon,label] of quick){const b=document.createElement('button');b.type='button';b.dataset.acTarget=target;b.innerHTML='<span class="ac-icon" aria-hidden="true">'+icon+'</span><span>'+label+'</span>';bar.append(b)}
const more=document.createElement('button');more.type='button';more.dataset.acMore='true';more.setAttribute('aria-controls',sidebar.id);more.setAttribute('aria-expanded','false');more.innerHTML='<span class="ac-icon" aria-hidden="true">☰</span><span>All tools</span>';bar.append(more);document.body.append(bar);
const skip=document.createElement('a');skip.href='#ac-content';skip.className='ac-skip';skip.textContent='Skip to companion content';document.body.prepend(skip);main.id=main.id||'ac-content';main.setAttribute('tabindex','-1');
let opener=null,activeView='overview';
function navButtons(){return [...nav.querySelectorAll('button[data-view]')]}
function refreshSearch(){const q=search.value.trim().toLocaleLowerCase();let visible=0;for(const b of navButtons()){const ok=!q||b.textContent.toLocaleLowerCase().includes(q);b.hidden=!ok;if(ok)visible++}count.textContent=visible+' tool'+(visible===1?'':'s')+' available';}
function isOpen(){return document.body.classList.contains('ac-menu-open')}
function openMenu(){if(!mobile.matches)return;opener=document.activeElement;search.value='';refreshSearch();document.body.classList.add('ac-menu-open');more.setAttribute('aria-expanded','true');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('role','dialog');search.focus({preventScroll:true})}
function closeMenu(restore=false){if(!isOpen())return;document.body.classList.remove('ac-menu-open');more.setAttribute('aria-expanded','false');sidebar.removeAttribute('aria-modal');sidebar.removeAttribute('role');if(restore)(opener&&opener.isConnected?opener:more).focus({preventScroll:true})}
function updateActive(){const selected=nav.querySelector('button[data-view].active');if(selected)activeView=selected.dataset.view;for(const b of bar.querySelectorAll('[data-ac-target]')){const on=b.dataset.acTarget===activeView;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')}more.classList.toggle('active',!quick.some(x=>x[0]===activeView))}
function go(target){const button=navButtons().find(b=>b.dataset.view===target);if(!button){openMenu();return}button.click();closeMenu();updateActive();window.scrollTo({top:0,behavior:'instant'})}
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.acMore)openMenu();else if(b.dataset.acTarget)go(b.dataset.acTarget)});
close.addEventListener('click',()=>closeMenu(true));backdrop.addEventListener('click',()=>closeMenu(true));
search.addEventListener('input',refreshSearch);
nav.addEventListener('click',e=>{if(!e.target.closest('[data-view]'))return;closeMenu();requestAnimationFrame(updateActive)});
document.addEventListener('click',e=>{if(e.target.closest('[data-jump]'))requestAnimationFrame(updateActive)});
document.addEventListener('keydown',e=>{if(!isOpen())return;if(e.key==='Escape'){e.preventDefault();closeMenu(true)}else if(e.key==='Tab'){const focusables=[...sidebar.querySelectorAll('button:not([hidden]),input:not([hidden]),a[href]')].filter(n=>n.getClientRects().length);if(!focusables.length)return;const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
const mediaChanged=()=>{if(!mobile.matches)closeMenu();refreshSearch()};mobile.addEventListener?.('change',mediaChanged);
const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))refreshSearch();updateActive()});observer.observe(nav,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
refreshSearch();updateActive();
})();


;/* BUNDLE SOURCE: command-launcher.js */
/* NEXUS | AZEROTH v3.6 COMMAND LAUNCHER — no changes to underlying application data */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav'),top=document.querySelector('.main .top');if(!nav||!top)return;
const KEY='nexus_azeroth_quick_launch_v36';
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&typeof v==='object'?{pinned:Array.isArray(v.pinned)?v.pinned.filter(x=>typeof x==='string').slice(0,30):[],recent:Array.isArray(v.recent)?v.recent.filter(x=>typeof x==='string').slice(0,8):[]}:{pinned:[],recent:[]}}catch(_){return{pinned:[],recent:[]}}};
const state=read();const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}};
const host=document.createElement('div');host.className='az-launcher';host.hidden=true;host.innerHTML='<div class="azl-backdrop" data-azl-close></div><section class="azl-dialog" role="dialog" aria-modal="true" aria-label="Companion tool launcher"><div class="azl-head"><span>✦ NEXUS / COMMAND LAUNCHER</span><button type="button" class="azl-x" data-azl-close aria-label="Close launcher">×</button></div><label class="azl-search-label" for="azl-search">Search any companion tool</label><input id="azl-search" type="search" autocomplete="off" placeholder="Characters, talents, item atlas…" aria-controls="azl-results"><div class="azl-info" aria-live="polite"></div><div class="azl-results" id="azl-results"></div><div class="azl-foot">★ Pin frequently used tools · Enter to open · Esc to close</div></section>';
document.body.append(host);const input=host.querySelector('#azl-search'),results=host.querySelector('#azl-results'),info=host.querySelector('.azl-info');
const trigger=document.createElement('button');trigger.type='button';trigger.className='azl-trigger';trigger.innerHTML='<span aria-hidden="true">⌕</span> Find a tool <kbd>Ctrl K</kbd>';trigger.setAttribute('aria-label','Find a companion tool');const chip=top.querySelector('.chip');if(chip)chip.before(trigger);else top.append(trigger);
let opener=null,focusables=[];
function items(){return[...nav.querySelectorAll('button[data-view]')].map(b=>({id:b.dataset.view,label:b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||b.dataset.view})).filter(x=>x.id)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]))}
function opened(){return !host.hidden}
function close(){if(!opened())return;host.hidden=true;document.body.classList.remove('azl-open');if(opener&&opener.isConnected)opener.focus({preventScroll:true})}
function open(){if(opened())return;opener=document.activeElement;host.hidden=false;document.body.classList.add('azl-open');input.value='';render();input.focus({preventScroll:true})}
function launch(id){const target=[...nav.querySelectorAll('button[data-view]')].find(b=>b.dataset.view===id);if(!target)return;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,8);persist();close();target.click();window.scrollTo({top:0,behavior:'instant'})}
function group(title,entries){if(!entries.length)return'';return '<div class="azl-group-label">'+esc(title)+'</div>'+entries.map(x=>'<div class="azl-item"><button type="button" class="azl-open" data-azl-go="'+esc(x.id)+'"><span class="azl-name">'+esc(x.label)+'</span><small>Open tool</small></button><button type="button" class="azl-pin '+(state.pinned.includes(x.id)?'pinned':'')+'" data-azl-pin="'+esc(x.id)+'" aria-label="'+(state.pinned.includes(x.id)?'Unpin ':'Pin ')+esc(x.label)+'" title="'+(state.pinned.includes(x.id)?'Unpin':'Pin')+'">★</button></div>').join('')}
function render(){const all=items(),q=input.value.trim().toLocaleLowerCase(),matching=all.filter(x=>x.label.toLocaleLowerCase().includes(q)||x.id.toLocaleLowerCase().includes(q));if(q){results.innerHTML=group('SEARCH RESULTS',matching)}else{const pins=state.pinned.map(id=>all.find(x=>x.id===id)).filter(Boolean);const rec=state.recent.filter(id=>!state.pinned.includes(id)).map(id=>all.find(x=>x.id===id)).filter(Boolean);const others=all.filter(x=>!state.pinned.includes(x.id)&&!state.recent.includes(x.id));results.innerHTML=group('PINNED',pins)+group('RECENT',rec)+(['CHARACTERS & BUILDS','COLLECTIONS & ITEMS','PROGRESS & FARMING','ACCOUNT & DATA','OTHER TOOLS'].map(title=>group(title,others.filter(x=>{
const s=(x.label+' '+x.id).toLowerCase();
const category=/account|azeroth|backup|vault|data|connection/.test(s)?'ACCOUNT & DATA':/character|armory|talent|gear|build|party/.test(s)?'CHARACTERS & BUILDS':/item|loot|collection|codex|atlas/.test(s)?'COLLECTIONS & ITEMS':/farm|progress|war room|weekly|dungeon|raid|route|craft/.test(s)?'PROGRESS & FARMING':'OTHER TOOLS';
return category===title;
}))).join(''))}if(!matching.length)results.innerHTML='<p class="azl-empty">No matching tools. Try another name.</p>';info.textContent=matching.length+' available tool'+(matching.length===1?'':'s');focusables=[input,...host.querySelectorAll('.azl-dialog button:not([disabled])')]}
trigger.addEventListener('click',open);input.addEventListener('input',render);
host.addEventListener('click',e=>{if(e.target.closest('[data-azl-close]')){close();return}const pin=e.target.closest('[data-azl-pin]');if(pin){const id=pin.dataset.azlPin;state.pinned=state.pinned.includes(id)?state.pinned.filter(x=>x!==id):[...state.pinned,id].slice(0,30);persist();render();return}const go=e.target.closest('[data-azl-go]');if(go)launch(go.dataset.azlGo)});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();opened()?close():open();return}if(!opened())return;if(e.key==='Escape'){e.preventDefault();close()}else if(e.key==='Enter'&&document.activeElement===input){const first=results.querySelector('[data-azl-go]');if(first){e.preventDefault();launch(first.dataset.azlGo)}}else if(e.key==='Tab'){const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
})();

;/* BUNDLE SOURCE: unified-dashboard.js */
/* NEXUS | AZEROTH v3.7 Unified Character Dashboard
 * Account portal lives on a different origin: this app NEVER equates redirect/localStorage with verified sign-in.
 * This is a strictly read-only local planning rollup. */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),footer=main?.querySelector('.footer'),top=main?.querySelector('.top');if(!nav||!main||!footer||!top)return;
const WORKER='https://nexus-azeroth-api.zevromxr.workers.dev/account';
const KEYS={profiles:'nexus_azeroth_farm_operations_v1',targets:'nexus_azeroth_character_targets_v1',atlas:'nexus_azeroth_item_atlas_v1',loot:'nexus_azeroth_loot_hunter_v1',base:'nexus_azeroth_companion_genesis_v1'};
const local=x=>{try{return JSON.parse(localStorage.getItem(x)||'null')}catch(_){return null}};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=p=>p&&['us','eu','kr','tw'].includes(p.region)&&/^[a-z0-9-]{2,80}$/.test(String(p.realm||''))&&/^[a-z0-9-]{2,50}$/.test(String(p.name||''));const key=p=>p.region+'/'+p.realm+'/'+p.name;
const a=document.createElement('button');a.type='button';a.dataset.view='dashboard';a.textContent='◉ Character Dashboard';nav.prepend(a);
const badge=document.createElement('a');badge.className='ud-account-badge';badge.href=WORKER;badge.rel='noopener noreferrer';badge.target='_blank';badge.setAttribute('aria-label','Open secure Battle.net account portal to verify sign-in');badge.innerHTML='<span class="ud-dot" aria-hidden="true"></span><span>Account: check sign-in</span>';top.append(badge);
const host=document.createElement('div');host.id='unifiedDashboard';host.innerHTML='<section class="section" data-section="dashboard"><div class="wow-kicker">NEXUS / CHARACTER INTELLIGENCE · v3.7</div><h2>Unified Character Dashboard</h2><p class="muted">See your saved characters, prioritized item targets, loot objectives, and farming history in one place. Planning statistics below are stored on this device; they are not Blizzard-verified ownership.</p><div class="ud-session panel"><div class="ud-avatar" id="udAvatar" aria-hidden="true">✦</div><div class="ud-session-copy"><strong>Battle.net account connection</strong><span id="udSessionText">Session not verified on this site. Open the secure portal to check your actual login.</span><small>For privacy and iPhone Safari compatibility, account cookies stay on the Cloudflare portal domain. This companion cannot safely infer session validity from a redirect.</small></div><a class="ud-account-action" id="udPortal" rel="noopener noreferrer" target="_blank" href="'+WORKER+'">CHECK SIGN-IN / MY AZEROTH</a></div><div class="ud-toolbar"><label for="udCharacter">Character <select id="udCharacter"><option value="all">All saved characters</option></select></label><button type="button" class="primary" id="udRefresh">REFRESH DASHBOARD</button><button type="button" data-ud-goto="personal">OPEN ACCOUNT CONNECTION</button></div><div class="ud-metrics" id="udMetrics" aria-live="polite"></div><div class="ud-columns"><article class="panel"><h3>Character roster</h3><div id="udRoster" class="ud-list"></div></article><article class="panel"><h3>Next character objectives</h3><div id="udObjectives" class="ud-list"></div><button type="button" data-ud-goto="targets">MANAGE CHARACTER TARGETS</button></article></div><div class="ud-columns"><article class="panel"><h3>Collection and loot goals</h3><div id="udLoot" class="ud-list"></div><button type="button" data-ud-goto="loot">OPEN LOOT HUNTER</button></article><article class="panel"><h3>Farming activity</h3><div id="udFarm" class="ud-list"></div><button type="button" data-ud-goto="command">OPEN PROGRESS COMMAND</button></article></div><p class="notice">This dashboard combines independently saved manual goals. It does not access private Blizzard equipment, prove item ownership, or log you into Battle.net. For authenticated account collections, use the separate secure My Azeroth portal.</p><p class="hint" id="udUpdated" role="status"></p></section>';main.insertBefore(host,footer);
const $=id=>document.getElementById(id);let selected='all';
function snapshot(){const farm=local(KEYS.profiles)||{},tar=local(KEYS.targets)||{},atlas=local(KEYS.atlas),loot=local(KEYS.loot),base=local(KEYS.base)||{};
const roster=[...(Array.isArray(farm.characters)?farm.characters:[]),...(Array.isArray(tar.characters)?tar.characters:[])].filter(valid);const chars=[...new Map(roster.map(p=>[key(p),p])).values()].slice(0,80);
const targets=(Array.isArray(tar.targets)?tar.targets:[]).filter(x=>x&&typeof x.character==='string'&&Number.isSafeInteger(Number(x.itemId))&&Number(x.itemId)>0).slice(0,1500);
const items=(Array.isArray(atlas)?atlas:[]).filter(x=>x&&Number.isSafeInteger(Number(x.id))&&Number(x.id)>0).slice(0,5000);
const goals=(Array.isArray(loot)?loot:[]).filter(x=>x&&Number.isSafeInteger(Number(x.id))&&Number(x.id)>0).slice(0,200);
const sessions=(Array.isArray(farm.sessions)?farm.sessions:[]).filter(x=>x&&Number.isSafeInteger(x.attempts)&&x.attempts>=1).slice(-500);
return{chars,targets,items,goals,sessions,base};}
function card(name,sub,action){return '<div class="ud-record"><div><strong>'+esc(name)+'</strong><small>'+esc(sub)+'</small></div>'+(action?'<button type="button" data-ud-goto="'+action+'">OPEN</button>':'')+'</div>'}
function render(){const d=snapshot(),ids=new Set(d.chars.map(key));if(selected!=='all'&&!ids.has(selected))selected='all';
$('udCharacter').innerHTML='<option value="all">All saved characters</option>'+d.chars.map(c=>'<option value="'+esc(key(c))+'" '+(selected===key(c)?'selected':'')+'>'+esc(c.name+' · '+c.realm+' ('+c.region.toUpperCase()+')')+'</option>').join('');
const active=d.chars.find(x=>key(x)===selected);$('udAvatar').textContent=active?active.name.slice(0,2).toUpperCase():'✦';
const targets=d.targets.filter(x=>selected==='all'||x.character===selected),open=targets.filter(x=>!x.done),done=targets.filter(x=>!!x.done),sessions=d.sessions.filter(x=>selected==='all'||x.character===selected);const attempts=sessions.reduce((sum,x)=>sum+x.attempts,0);
const metrics=[['Saved characters',selected==='all'?d.chars.length:active?1:0],['Open item targets',open.length],['Completed targets (manual)',done.length],['Logged farming attempts',attempts]];$('udMetrics').innerHTML=metrics.map(([n,v])=>'<div><strong>'+v+'</strong><span>'+esc(n)+'</span></div>').join('');
$('udRoster').innerHTML=(active?[active]:d.chars).slice(0,15).map(p=>{const id=key(p),n=d.targets.filter(x=>x.character===id&&!x.done).length;return card(p.name,p.realm+' · '+p.region.toUpperCase()+' · '+n+' open target(s)','targets')}).join('')||'<div class="empty">No saved character profiles yet. Add a character in Character Targets or Farming Operations.</div>';
const lookup=new Map(d.items.map(x=>[x.region+':'+x.id,x.name]));open.sort((a,b)=>({high:0,normal:1,later:2}[a.priority]??1)-({high:0,normal:1,later:2}[b.priority]??1));$('udObjectives').innerHTML=open.slice(0,10).map(x=>card(lookup.get(x.region+':'+x.itemId)||'Item #'+x.itemId,(x.priority||'normal')+' priority · '+(selected==='all'?x.character+' · ':'')+'Manual target','targets')).join('')||'<div class="empty">No open character targets.</div>';
$('udLoot').innerHTML=d.goals.filter(x=>!x.done).slice(0,8).map(x=>card(x.name||'Item #'+x.id,'Item #'+x.id+' · Manual loot goal','loot')).join('')||'<div class="empty">No open Loot Hunter goals on this device.</div>';
$('udFarm').innerHTML=sessions.slice(-8).reverse().map(x=>card(lookup.get((x.character||'').split('/')[0]+':'+x.itemId)||'Item #'+x.itemId,x.attempts+' attempts · '+(x.date||'date not recorded')+(selected==='all'?' · '+(x.character||''):''),'loot')).join('')||'<div class="empty">No farming sessions recorded for this selection.</div>';
$('udUpdated').textContent='Refreshed at '+new Date().toLocaleTimeString()+'. All numbers shown are browser-local manual records.';}
$('udCharacter').addEventListener('change',e=>{selected=e.target.value;render()});$('udRefresh').addEventListener('click',render);
host.addEventListener('click',e=>{const b=e.target.closest('[data-ud-goto]');if(!b)return;document.querySelector('.nav [data-view="'+b.dataset.udGoto+'"]')?.click()});
const refreshVisible=()=>{if(document.querySelector('[data-section="dashboard"].active'))render()};
window.addEventListener('storage',e=>{if(Object.values(KEYS).includes(e.key))refreshVisible()});
window.addEventListener('nexus:character-profile-updated',refreshVisible);
window.addEventListener('pageshow',refreshVisible);
if(window.NexusStartup?.whenView)window.NexusStartup.whenView('dashboard',render,{once:false});else render();
})();

;/* BUNDLE SOURCE: verified-connection.js */
/* NEXUS | AZEROTH v3.9 — Connected Player Experience.
 * A server-validated, short-lived proof is the ONLY basis for green verification.
 * Store only that encrypted status proof within this tab's sessionStorage to allow
 * server revalidation on refresh. Never store Battle.net tokens, cookies or identity.
 */
(()=>{'use strict';
const WORKER='https://nexus-azeroth-api.zevromxr.workers.dev';
const CHECK=WORKER+'/account/verify-companion';
const API=WORKER+'/api/companion/verify';
const STORAGE='nexus_azeroth_verified_receipt_v39';
const badge=document.querySelector('.ud-account-badge');
const status=document.getElementById('udSessionText');
const portal=document.getElementById('udPortal');
const personal=document.getElementById('paStatus');
const sessionBox=document.querySelector('#unifiedDashboard .ud-session');
if(!badge)return;
const badgeText=badge.querySelector('span:last-child');
let validUntil=0,verifiedAt=0,region='',timer=null,inflight=0;
let details=null,detailRegion=null,detailTime=null,detailFresh=null,avatar=null;
function safeRead(){try{return sessionStorage.getItem(STORAGE)||''}catch(_){return''}}
function safeSave(ticket){try{if(ticket)sessionStorage.setItem(STORAGE,ticket);else sessionStorage.removeItem(STORAGE)}catch(_){}}
function formatTime(ms){return new Date(ms).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}
function clock(){const left=Math.max(0,Math.ceil((validUntil-Date.now())/1000));return Math.floor(left/60)+':'+String(left%60).padStart(2,'0')}
function createDetails(){
 if(!sessionBox)return;
 details=document.createElement('div');details.className='nx-account-details';details.setAttribute('aria-live','off');
 const title=document.createElement('div');title.className='nx-account-title';title.textContent='Verified session details';
 const stats=document.createElement('div');stats.className='nx-account-stats';
 const make=(label)=>{const wrap=document.createElement('div');const n=document.createElement('small');n.textContent=label;const v=document.createElement('strong');v.textContent='—';wrap.append(n,v);stats.append(wrap);return v};
 detailRegion=make('Account region');detailTime=make('Last verified');detailFresh=make('Proof expires');
 details.append(title,stats);
 const note=document.createElement('p');note.textContent='A verified Battle.net session does not guarantee World of Warcraft characters. Game data appears when Blizzard provides it.';details.append(note);
 const actions=document.createElement('div');actions.className='nx-account-actions';
 const recheck=document.createElement('a');recheck.className='nx-recheck';recheck.href=CHECK;recheck.textContent='↻ Verify again';recheck.setAttribute('aria-label','Recheck Battle.net connection securely');
 const account=document.createElement('a');account.href=WORKER+'/account';account.className='nx-open-account';account.textContent='Open My Azeroth';account.rel='noopener noreferrer';account.target='_blank';
 actions.append(recheck,account);details.append(actions);
 const copy=sessionBox.querySelector('.ud-session-copy');(copy||sessionBox).append(details);
 const existing=sessionBox.querySelector('#udAvatar');if(existing){existing.setAttribute('title','Locally selected character initials — not a Blizzard account portrait')}
}
createDetails();
badge.href=CHECK;badge.removeAttribute('target');badge.removeAttribute('rel');badge.setAttribute('aria-label','Check Battle.net connection');
if(portal){portal.href=CHECK;portal.removeAttribute('target');portal.removeAttribute('rel');portal.textContent='CHECK CONNECTION / VERIFY'}
if(personal){personal.textContent='Account status is verified on the secure portal. Return using Verify & Return; an account may be connected even with no WoW characters.'}
function update(kind,label,description){
 badge.classList.remove('ud-verified','ud-checking','ud-unverified');badge.classList.add('ud-'+kind);
 if(badgeText)badgeText.textContent=label;
 badge.setAttribute('aria-label',label+'. Check your Battle.net connection through the secure portal');
 if(status)status.textContent=description;
 if(details){details.dataset.state=kind;detailRegion.textContent=region?region.toUpperCase():'—';detailTime.textContent=verifiedAt?formatTime(verifiedAt):'—';detailFresh.textContent=kind==='verified'?clock():'Not current'}
 document.dispatchEvent(new CustomEvent('nexus:account-status',{detail:{state:kind,region:kind==='verified'?region:null,verifiedAt:kind==='verified'?verifiedAt:null}}));
}
function stopClock(){if(timer!==null){clearInterval(timer);timer=null}}
function expire(){
 if(validUntil&&Date.now()>=validUntil){stopClock();validUntil=0;region='';safeSave('');update('unverified','Verification expired','Your previous verification has expired. Use Check Connection to verify your Battle.net session again.');return}
 if(validUntil&&details)detailFresh.textContent=clock();
}
function invalid(message,description){stopClock();validUntil=0;verifiedAt=0;region='';safeSave('');update('unverified',message,description)}
function validateTicket(ticket){
 return typeof ticket==='string'&&ticket.length<=6000&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(ticket);
}
async function verify(ticket){
 if(!validateTicket(ticket)){invalid('Invalid verification','The connection receipt was invalid. Select Check Connection to try again.');return}
 const current=++inflight;
 update('checking','Checking connection','Asking the secure Cloudflare service to verify the short-lived account receipt…');
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const resp=await fetch(API,{method:'POST',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({ticket}),signal:controller.signal});
  const data=await resp.json().catch(()=>null);
  if(!resp.ok||data?.success!==true||data?.connected!==true)throw Error('Not verified');
  const end=Number(data.validUntil),start=Number(data.verifiedAt),now=Date.now();
  if(!['us','eu','kr','tw'].includes(data.region)||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>now+10000||end<=now||end>now+121000||end-start>120000)throw Error('Receipt expired');
  if(current!==inflight)return;
  validUntil=end;verifiedAt=start;region=data.region;
  safeSave(ticket);
  stopClock();
  update('verified','Connected · Verified','Battle.net account verification confirmed in '+region.toUpperCase()+' at '+formatTime(start)+'. Status expires automatically and can be refreshed securely.');
  timer=setInterval(expire,1000);
 }catch(_){
  if(current===inflight)invalid('Connection not verified','The account proof could not be confirmed or has expired. Use Check Connection to try again.');
 }finally{clearTimeout(timeout)}
}
function consumeReturn(){
 // The Worker returns a fragment, never credentials. Remove the receipt from the URL immediately.
 if(!location.hash.startsWith('#nxverify='))return false;
 const input=location.hash.slice('#nxverify='.length);
 try{history.replaceState(history.state,'',location.pathname+location.search)}catch(_){}
 if(input==='disconnected'){invalid('Not connected','No active Battle.net session was found. Open the secure My Azeroth portal to sign in and select Verify & Return.');return true}
 if(input==='unavailable'){invalid('Verification unavailable','The secure service could not confirm the Blizzard token. Try Check Connection again.');return true}
 let ticket;
 try{ticket=decodeURIComponent(input)}catch(_){invalid('Invalid verification','The verification response was unreadable.');return true}
 void verify(ticket);return true;
}
update('unverified','Check connection','Select Check Connection to validate your existing Battle.net session. Verification is independent of WoW character ownership.');
if(!consumeReturn()){
 const stored=safeRead();
 if(stored){void verify(stored)}
}
document.addEventListener('nexus:account-status',e=>{
 if(!personal)return;
 const d=e.detail||{};
 if(d.state==='verified')personal.textContent='Connected · Verified ('+(d.region||'').toUpperCase()+'). Verification is recent and time-limited; click Verify Again to refresh.';
 else if(d.state==='checking')personal.textContent='Checking your Battle.net account connection securely…';
 else personal.textContent='No current verified session on this website. Open the secure My Azeroth portal to sign in, then choose Verify & Return.';
});
// The initial account state was rendered before the status listener was installed.
// Bring the My Azeroth panel into sync without waiting for another event.
if(personal){
 const current=badge.classList.contains('ud-verified')?'verified':badge.classList.contains('ud-checking')?'checking':'unverified';
 document.dispatchEvent(new CustomEvent('nexus:account-status',{detail:{state:current,region:current==='verified'?region:null,verifiedAt:current==='verified'?verifiedAt:null}}));
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)expire()});
window.addEventListener('pageshow',expire);
})();


;/* BUNDLE SOURCE: sovereign-vault.js */
/* NEXUS | AZEROTH v4.0 — Sovereign Data Vault
 * User-controlled local data backup only. No Blizzard tokens or HttpOnly cookies.
 * Archive is a JSON file; verify content and show a non-destructive preview before restore.
 */
(()=>{'use strict';
const STORE=[
 ['nexus_azeroth_companion_genesis_v1','Core characters, builds and collections','object'],
 ['nexus_azeroth_overdrive_v1','War Room, routes and weekly planning','object'],
 ['nexus_azeroth_player_utility_v1','Party Architect and Vault plans','object'],
 ['nexus_azeroth_connected_v2','Armory bookmarks and saved items','object'],
 ['nexus_azeroth_armory_bookmarks_v1','Armory character bookmarks','array'],
 ['nexus_azeroth_loot_hunter_v1','Loot Hunter goals','array'],
 ['nexus_azeroth_farm_operations_v1','Character farming operations','object'],
 ['nexus_azeroth_item_atlas_v1','Item Atlas','array'],
 ['nexus_azeroth_character_targets_v1','Character Targets','object'],
 ['nexus_azeroth_talent_forge_v1','Talent Forge drafts','array'],
 ['nexus_azeroth_quick_launch_v36','Launcher favorites and recents','object']
];
const FORMAT='nexus.azeroth.sovereign-vault/1',MAX_FILE=12*1024*1024;
const main=document.querySelector('.main'),foot=main?.querySelector('.footer'),nav=document.querySelector('.sidebar .nav');
if(!main||!nav||!foot)return;
const navItem=document.createElement('button');navItem.type='button';navItem.dataset.view='vault';navItem.textContent='◇ Sovereign Data Vault';nav.append(navItem);
const host=document.createElement('div');host.id='sovereignDataVault';
host.innerHTML='<section class="section" data-section="vault"><div class="wow-kicker">NEXUS / SOVEREIGN CORE · v4.0</div><h2>Sovereign Data Vault</h2><p class="muted">Back up every supported planning module at once. All files are generated and read on your device; no Blizzard cookies, access tokens, or private portal data are included.</p><div class="sv-grid"><div class="panel"><h3>Complete backup</h3><p class="muted">Includes only checked sections. Empty modules are shown, but not included unless they contain saved data.</p><div class="sv-list" id="svSections"></div><div class="sv-actions"><button type="button" class="primary" id="svExport">EXPORT SELECTED DATA</button><button type="button" id="svSelectAll">SELECT ALL</button></div><p class="hint" id="svSummary"></p></div><div class="panel"><h3>Restore on this device</h3><p class="muted">Choose a Sovereign Vault backup to preview its sections. No data changes until you approve restoration.</p><label class="field" for="svFile">Choose JSON backup <input id="svFile" type="file" accept=".json,application/json"></label><div id="svPreview" class="sv-preview" role="status">No backup selected.</div><div class="sv-actions"><button type="button" id="svRestore" class="primary" disabled>RESTORE REVIEWED SECTIONS</button><button type="button" id="svCancel" disabled>CANCEL PREVIEW</button></div><p class="hint">Restore replaces only the selected sections. Other modules are preserved. The page reloads after successful restoration.</p></div></div><p class="notice">This is an offline file backup, not automatic multi-device sync. To move plans from PC to iPhone, export the file on PC, transfer it yourself, then import it on iPhone. Never import a backup you do not trust.</p></section>';
main.insertBefore(host,foot);
const $=id=>document.getElementById(id),section=$('svSections'),preview=$('svPreview'),status=$('svSummary');
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let candidate=null;
function read(key){try{return localStorage.getItem(key)}catch(_){return null}}
function shape(v,type){return type==='array'?Array.isArray(v):v!==null&&typeof v==='object'&&!Array.isArray(v)}
function schema(key,x){
 if(key==='nexus_azeroth_companion_genesis_v1')return ['characters','builds','tasks','collections'].every(k=>Array.isArray(x[k]));
 if(key==='nexus_azeroth_overdrive_v1')return ['routes','encounters','recipes','gear','weeklies'].every(k=>Array.isArray(x[k]));
 if(key==='nexus_azeroth_player_utility_v1')return Array.isArray(x.party)&&x.party.length===5;
 if(key==='nexus_azeroth_connected_v2')return Array.isArray(x.wishlist)&&Array.isArray(x.recent);
 if(key==='nexus_azeroth_armory_bookmarks_v1')return x.length<=300&&x.every(p=>p&&typeof p==='object');
 if(key==='nexus_azeroth_loot_hunter_v1')return x.length<=200&&x.every(p=>p&&Number.isSafeInteger(Number(p.id))&&Number(p.id)>0&&typeof p.name==='string');
 if(key==='nexus_azeroth_farm_operations_v1')return Array.isArray(x.characters)&&Array.isArray(x.sessions)&&x.assignments&&typeof x.assignments==='object';
 if(key==='nexus_azeroth_item_atlas_v1')return x.length<=5000&&x.every(p=>p&&Number.isSafeInteger(Number(p.id))&&Number(p.id)>0&&['us','eu','kr','tw'].includes(p.region));
 if(key==='nexus_azeroth_character_targets_v1')return Array.isArray(x.characters)&&Array.isArray(x.targets);
 if(key==='nexus_azeroth_talent_forge_v1')return x.length<=40&&x.every(p=>p&&typeof p.name==='string'&&typeof p.identity==='string'&&p.rankByNode&&typeof p.rankByNode==='object');
 if(key==='nexus_azeroth_quick_launch_v36')return Array.isArray(x.pinned)&&Array.isArray(x.recent);
 return false;
}
function valid(value,type,key){if(typeof value!=='string'||value.length>4*1024*1024)return false;try{const data=JSON.parse(value);return shape(data,type)&&schema(key,data)}catch(_){return false}}
function getSelected(){return [...section.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.dataset.key)}
function render(){
 const count=STORE.filter(([key])=>read(key)!==null).length;
 section.innerHTML=STORE.map(([key,label,type])=>{
  const raw=read(key),exists=raw!==null;
  const stored=exists&&valid(raw,type,key);
  return '<label class="sv-record"><input type="checkbox" data-key="'+esc(key)+'" '+(stored?'checked':'disabled')+'><span><strong>'+esc(label)+'</strong><small>'+(stored?'Saved locally · '+new Blob([raw]).size.toLocaleString()+' bytes':exists?'Unreadable local record (excluded)':'No local record yet')+'</small></span></label>';
 }).join('');
 status.textContent=count+' / '+STORE.length+' supported modules contain records on this device. Missing or unreadable modules are never added to exports.';
}
function download(data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 if(blob.size>MAX_FILE){status.textContent='Backup exceeds the 12 MB safety limit. Export fewer sections.';return}
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEXUS-AZEROTH-SOVEREIGN-BACKUP-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
 status.textContent='Backup created. Keep this file somewhere safe before clearing browser data.';
}
$('svExport').addEventListener('click',()=>{
 const chosen=getSelected(),items={};
 for(const key of chosen){const type=STORE.find(x=>x[0]===key)?.[2],raw=read(key);if(raw!==null&&valid(raw,type,key))items[key]=JSON.parse(raw)}
 if(!Object.keys(items).length){status.textContent='Select at least one saved module to export.';return}
 download({format:FORMAT,app:'NEXUS | AZEROTH',version:'4.0.0',exportedAt:new Date().toISOString(),items});
});
$('svSelectAll').addEventListener('click',()=>{section.querySelectorAll('input:not(:disabled)').forEach(x=>x.checked=true)});
function clearPreview(){candidate=null;$('svFile').value='';preview.textContent='No backup selected.';$('svRestore').disabled=true;$('svCancel').disabled=true}
$('svCancel').addEventListener('click',clearPreview);
$('svFile').addEventListener('change',async e=>{
 clearCandidate();const file=e.target.files?.[0];if(!file)return;
 if(file.size>MAX_FILE){preview.textContent='File exceeds the 12 MB limit.';return}
 try{
  const data=JSON.parse(await file.text());
  if(!data||data.format!==FORMAT||!data.items||typeof data.items!=='object'||Array.isArray(data.items))throw Error('Not a supported Sovereign Vault backup');
  const keys=Object.keys(data.items);
  if(keys.length<1||keys.length>STORE.length||keys.some(k=>!STORE.some(x=>x[0]===k)))throw Error('Unknown or missing data sections');
  const records=keys.map(key=>{const type=STORE.find(x=>x[0]===key)[2];const value=JSON.stringify(data.items[key]);if(!valid(value,type,key))throw Error('Invalid '+key+' data');return{key,value}});
  candidate=records;
  preview.innerHTML='<strong>Preview — '+records.length+' section(s)</strong><p class="muted">Imported '+esc(data.exportedAt||'unknown date')+'. Existing local data in these sections will be replaced:</p>'+records.map(r=>'<label class="sv-record"><input type="checkbox" data-restore="'+esc(r.key)+'" checked><span>'+esc(STORE.find(x=>x[0]===r.key)[1])+'</span></label>').join('');
  $('svRestore').disabled=false;$('svCancel').disabled=false;
 }catch(err){preview.textContent='Backup rejected: '+err.message}
});
function clearCandidate(){candidate=null;$('svRestore').disabled=true;$('svCancel').disabled=true;preview.textContent='Validating backup…'}
$('svRestore').addEventListener('click',()=>{
 if(!candidate)return;
 const selection=new Set([...preview.querySelectorAll('[data-restore]:checked')].map(x=>x.dataset.restore));
 const changed=candidate.filter(x=>selection.has(x.key));if(!changed.length){preview.textContent='Choose at least one section to restore.';return}
 if(!confirm('Replace '+changed.length+' selected planning section(s) on this device? This cannot be undone without an earlier backup.'))return;
 const before=changed.map(({key})=>({key,value:read(key)}));let done=0;
 try{
  for(const {key,value} of changed){localStorage.setItem(key,value);done++}
  preview.textContent='Restore completed. Reloading the companion…';
  location.reload();
 }catch(err){
  let rollbackFailed=false;
  for(let i=done-1;i>=0;i--){try{const p=before[i];if(p.value===null)localStorage.removeItem(p.key);else localStorage.setItem(p.key,p.value)}catch(_){rollbackFailed=true}}
  preview.textContent=rollbackFailed?'Restore interrupted and rollback could not complete. Do not clear browser data; inspect saved records.':'Storage failed; earlier data has been restored. No completed import was retained.';
 }
});
window.addEventListener('pageshow',render);render();
})();


;/* BUNDLE SOURCE: character-handoff.js */
/* NEXUS | AZEROTH v4.3 — Character handoff from secure My Azeroth and public Armory.
 * A URL is an untrusted CHARACTER SELECTOR, not a trusted account-ownership claim.
 * This file does not inspect cookies, tokens or private Blizzard data.
 */
(()=>{'use strict';
const area=document.querySelector('[data-section="personal"]'),armory=document.querySelector('[data-section="armory"]'),form=document.getElementById('cxCharacterForm');
if(!area||!armory||!form)return;
const KEYS={farm:'nexus_azeroth_farm_operations_v1',targets:'nexus_azeroth_character_targets_v1'};
const validate=p=>p&&['us','eu','kr','tw'].includes(p.region)&&/^[a-z0-9-]{2,80}$/.test(p.realm||'')&&/^[a-z0-9-]{2,50}$/.test(p.name||'');
const identity=p=>p.region+'/'+p.realm+'/'+p.name;
const params=new URLSearchParams(location.search);
const p={region:params.get('armory_region'),realm:params.get('armory_realm'),name:params.get('armory_name')};
const incoming=validate(p)?p:null;
function read(key,fresh){
 try{const raw=localStorage.getItem(key);if(raw===null)return fresh;const parsed=JSON.parse(raw);return parsed}catch(_){return null}
}
function current(){
 const region=document.getElementById('cxCharacterRegion')?.value;
 const realm=document.getElementById('cxRealm')?.value?.trim().toLowerCase();
 const name=document.getElementById('cxName')?.value?.trim().toLowerCase();
 const x={region,realm,name};
 return validate(x)?x:null;
}
function save(profile){
 if(!validate(profile))return {ok:false,message:'Enter a valid region, ASCII realm slug, and character name.'};
 const farm=read(KEYS.farm,{characters:[],assignments:{},sessions:[]});
 const targets=read(KEYS.targets,{characters:[],targets:[]});
 if(!farm||typeof farm!=='object'||Array.isArray(farm)||!Array.isArray(farm.characters)||!Array.isArray(farm.sessions)||!farm.assignments||typeof farm.assignments!=='object'||!targets||typeof targets!=='object'||Array.isArray(targets)||!Array.isArray(targets.characters)||!Array.isArray(targets.targets))return {ok:false,message:'One saved planner has unreadable data. Back up the current browser before importing.'};
 const id=identity(profile),nf=!farm.characters.some(x=>validate(x)&&identity(x)===id),nt=!targets.characters.some(x=>validate(x)&&identity(x)===id);
 if(!nf&&!nt)return{ok:true,message:'This character is already in your local character planners.'};
 if(nf&&farm.characters.length>=30||nt&&targets.characters.length>=80)return {ok:false,message:'A planner has reached its saved character limit. No data changed.'};
 if(!confirm('Save '+profile.name+' ('+profile.realm+') to your local character planners? This is a manual profile; it does NOT verify Blizzard account ownership.'))return{ok:false,message:'Import canceled. No data was changed.'};
 const updates=[];
 if(nf)updates.push([KEYS.farm,JSON.stringify({...farm,characters:[...farm.characters,profile]})]);
 if(nt)updates.push([KEYS.targets,JSON.stringify({...targets,characters:[...targets.characters,profile]})]);
 let before;try{before=updates.map(([k])=>[k,localStorage.getItem(k)])}catch(_){return{ok:false,message:'Browser storage is not accessible.'}}
 let done=0;
 try{
  for(const [key,value] of updates){localStorage.setItem(key,value);done++}
  window.dispatchEvent(new Event('nexus:character-profile-updated'));
  if(nf)window.dispatchEvent(new Event('nexus:farm-operations-updated'));
  if(nt)window.dispatchEvent(new Event('nexus:character-targets-updated'));
  return{ok:true,message:'Character saved to your local planners. Open Character Dominion to view goals and farming activity.'};
 }catch(_){
  let restored=true;
  for(let i=done-1;i>=0;i--){try{const [k,v]=before[i];if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(__){restored=false}}
  return{ok:false,message:restored?'Storage failed; previous planner records have been restored.':'Storage failed and rollback could not complete. Protect your current data with a backup.'};
 }
}
const card=document.createElement('div');card.className='panel nx-character-handoff';
card.innerHTML='<h3>Connected Character Center</h3><p class="muted">Choose a character in the secure My Azeroth portal, or type its public region, realm and name in Live Armory. Adding it to your local planners is optional and does not establish account ownership.</p><div class="nx-character-actions"><a class="button primary" href="https://nexus-azeroth-api.zevromxr.workers.dev/account" rel="noopener noreferrer" target="_blank">VIEW ACCOUNT CHARACTERS</a><a class="button" href="https://nexus-azeroth-api.zevromxr.workers.dev/account/verify-companion">VERIFY CONNECTION</a><button type="button" id="nxOpenDominion">OPEN CHARACTER DOMINION</button></div><div id="nxCharacterSelection" class="nx-character-selection" role="status"></div>';
area.append(card);
const message=card.querySelector('#nxCharacterSelection');message.textContent=incoming?'Public character selector received from the portal: '+p.name+' · '+p.realm+' ('+p.region.toUpperCase()+'). Check the Armory or save manually.':'No character selected yet. A Battle.net account without World of Warcraft characters can still verify successfully.';
card.querySelector('#nxOpenDominion').addEventListener('click',()=>document.querySelector('.nav [data-view="dominion"]')?.click());
const control=document.createElement('div');control.id='nxArmorySave';control.className='nx-character-selection nx-armory-import';
const heading=document.createElement('strong');heading.textContent='Add this character to my planners';
const info=document.createElement('p');info.textContent='Save the selected public character identifier to Character Targets and Farming Operations. This is an untrusted selector, not proof you own the character.';
const saveButton=document.createElement('button');saveButton.type='button';saveButton.className='primary';saveButton.textContent='SAVE CHARACTER TO MY PLANNERS';
const state=document.createElement('p');state.id='nxArmorySaveStatus';state.setAttribute('role','status');state.textContent='Choose a character above, then save it manually.';
const openDominion=document.createElement('button');openDominion.type='button';openDominion.textContent='VIEW CHARACTER DOMINION';openDominion.addEventListener('click',()=>document.querySelector('.nav [data-view="dominion"]')?.click());
control.append(heading,info,saveButton,openDominion,state);form.append(control);
saveButton.addEventListener('click',()=>{
 const selected=current();const result=save(selected);state.textContent=result.message;message.textContent=result.message;
});
if(incoming){
 const region=document.getElementById('cxCharacterRegion'),realm=document.getElementById('cxRealm'),name=document.getElementById('cxName');
 if(region)region.value=p.region;if(realm)realm.value=p.realm;if(name)name.value=p.name;
 state.textContent='Selected from the My Azeroth link: '+p.name+' · '+p.realm+' ('+p.region.toUpperCase()+'). Public profile data has not been loaded or authenticated here.';
 const url=new URL(location.href);['armory_region','armory_realm','armory_name'].forEach(k=>url.searchParams.delete(k));
 try{history.replaceState(history.state,'',url.pathname+url.search+url.hash)}catch(_){}
 requestAnimationFrame(()=>document.querySelector('.nav [data-view="armory"]')?.click());
}
})();

;/* BUNDLE SOURCE: player-guide.js */
/* NEXUS | AZEROTH v4.1 — Player Information & Guide
 * Documentation-only: no extra Blizzard scopes, no account secrets, no player-data changes.
 * Companion release metadata is fetched from the existing validated release manifest.
 * WoW patch reference is explicitly dated editorial content, NOT automatic patch detection.
 */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),footer=main?.querySelector('.footer');
if(!nav||!main||!footer)return;
const ROOT='https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/';
const WORKER='https://nexus-azeroth-api.zevromxr.workers.dev/account';
const PATCH='https://worldofwarcraft.blizzard.com/en-us/content-update-notes';
const DOCUMENTED_PATCH='12.1.5',PATCH_REVIEW_DATE='2026-11-15';
const flag='nexus_azeroth_player_guide_v41';
const steps=[
 ['Launch and explore','Open the live web companion on iPhone or PC. Use All Tools on mobile or the left navigation on desktop. No install or Battle.net account is required for manual planners.','overview'],
 ['Connect Battle.net (optional)','Open My Azeroth, select your Blizzard account region, authorize the read-only wow.profile scope, and choose Verify & Return. The green Connected · Verified badge represents a short-lived server check, not permanent login.','personal'],
 ['Find a character','On the secure portal, use My Characters when Blizzard provides a roster. Open a character in Public Armory. Use Add to My Planners beside Public Armory (part of the Connected Character Center) to save a character selector with your consent, then open Character Dominion to manage their goals.','armory'],
 ['Research items and equipment','Use Item Codex to look up an item ID, Item Atlas to research and manually organize goals, and Live Armory to inspect Blizzard-reported public gear where available.','atlas'],
 ['Create progression targets','Assign item goals in Character Targets, research acquisition in Loot Hunter, then log manual attempts and character sessions in Farming Operations.','targets'],
 ['Organize group play','Prepare weekly goals in War Room, sketch dungeon routes, write raid encounter notes and assemble a party plan for your friends. Share exported notes or route text deliberately.','warcraft'],
 ['Explore talents','Use Talent Forge to inspect Blizzard-provided Retail tree information and experiment with local drafts. These drafts are not guaranteed to be in-game-valid import strings.','talents'],
 ['Review progress','Open Unified Character Dashboard and Progress Command for summaries of locally saved goals and farming sessions. Counts represent manual records unless explicitly labeled Blizzard-reported.','dashboard'],
 ['Protect your data','Open Sovereign Data Vault, export selected planning sections, save the JSON file somewhere safe and optionally transfer it to another device. Import only trusted backups after reviewing the restore preview.','vault']
];
const sections=[
 {id:'personal',title:'My Azeroth & Connection',desc:'Secure Battle.net authorization, personal characters, mounts, pets and equipped gear where provided. Authentication is hosted on Cloudflare; the public website does not receive Blizzard OAuth tokens.',view:'personal',tag:'Account'},
 {id:'armory',title:'Live Character Armory',desc:'Look up public Retail character profiles and equipped gear by region, realm and character name. Data can lag behind the game and does not show bags or bank inventory.',view:'armory',tag:'Blizzard-reported'},
 {id:'codex',title:'Item Codex & Discovery',desc:'Search and inspect official Retail items by name or numeric ID. Discoverable results depend on Blizzard index coverage and are not a guarantee of a complete item catalog.',view:'codex',tag:'Blizzard data'},
 {id:'atlas',title:'Universal Item Atlas',desc:'Save your own item wishlist, farming targets, ownership notes and priorities. The “owned” marker is manually set by you, not automatically verified.',view:'atlas',tag:'Manual tracking'},
 {id:'dominion',title:'Character Dominion',desc:'Select a saved character, see next manual item objectives and logged farming sessions together, assign Atlas items and open public Blizzard profile research on demand.',view:'dominion',tag:'Character command'},
 {id:'targets',title:'Character Targets',desc:'Assign personal item goals and priorities to local character profiles, whether typed by hand or explicitly imported from a selected character link.',view:'targets',tag:'Manual tracking'},
 {id:'loot',title:'Loot Hunter',desc:'Research curated acquisition references, maintain loot wishlists and record farming attempts. Guides should be checked against the current game patch.',view:'loot',tag:'Reference & planner'},
 {id:'farm',title:'Farming Operations',desc:'Log character-specific farming sessions and assignments. Attempts are entered by players; the site does not monitor the WoW client.',view:'loot',tag:'Manual tracking'},
 {id:'warcraft',title:'War Room & Weekly Planning',desc:'Track weekly plans, raid preparation and encounter notes. Organize who will do what with friends without controlling the game.',view:'warcraft',tag:'Group planning'},
 {id:'dungeons',title:'Dungeon Routes',desc:'Write an ordered route or checklist and share the text with your party. This is planning guidance, not live pathfinding or a Mythic+ game addon.',view:'dungeons',tag:'Group planning'},
 {id:'professions',title:'Crafting Lab',desc:'Estimate crafting material costs and profitability using prices you enter yourself. It does not provide live Auction House quotes.',view:'professions',tag:'Manual estimates'},
 {id:'equipment',title:'Gear Analyzer',desc:'Compare player-entered stat priorities and equipment choices; results are estimates rather than simulation or automatically optimized builds.',view:'equipment',tag:'Manual comparison'},
 {id:'talents',title:'Talent Forge',desc:'Explore Blizzard Retail talent nodes and draft research builds. Imports, prerequisites and patch compatibility are not guaranteed in-game.',view:'talents',tag:'Research tool'},
 {id:'utility',title:'Party Architect & Weekly Vault',desc:'Organize class/role composition and weekly reward plans. These are personal planning records, not character eligibility verification.',view:'party',tag:'Group planning'},
 {id:'dashboard',title:'Unified Character Dashboard',desc:'View saved characters, item goals and farming summaries together. It does not silently download or certify a player’s private inventory.',view:'dashboard',tag:'Manual summary'},
 {id:'progress',title:'Progress Command',desc:'Spot overlapping goals and inconsistencies between local modules without automatically rewriting your records.',view:'command',tag:'Manual summary'},
 {id:'vault',title:'Sovereign Data Vault',desc:'Make one selective export for supported local modules and review restores. There is no background cross-device synchronization.',view:'vault',tag:'Backup'}
];
const faqs=[
 ['Is Azeroth an addon or a game modification?','No. It is a separate browser-based companion. It does not install into World of Warcraft, read game memory, automate movement, provide combat advantages or change your Blizzard account.'],
 ['Do I need to own World of Warcraft to use it?','No. Anyone can explore the manual planners and public research tools. A Battle.net account is optional for the secure portal, while useful personal WoW character data requires Blizzard to return game records for that account and region.'],
 ['Why do I see Connected · Verified but no characters?','Blizzard can authenticate your Battle.net account even when it has no WoW character records. Connection verification and game character availability are separate.'],
 ['Will the green account badge stay on permanently?','No. Its status is a recent verification receipt, currently lasting up to two minutes. After it expires you can select Check Connection to verify again through the first-party portal.'],
 ['Does Item Atlas automatically know what I own?','No. Item Atlas ownership and farming status are manually recorded. Where provided, the private account portal separately shows Blizzard-reported mounts, pets and equipped items, not full bags, bank or live inventory.'],
 ['Can I use it with a party or guild?','Yes. Share manually prepared routes, lists, exported planning data and notes with people you trust. The site does not currently offer live shared accounts, cross-player syncing or guild dashboards.'],
 ['Can I move data between an iPhone and PC?','Yes, with a user-controlled Sovereign Data Vault export/import file. It is not automatic sync. Always keep a backup and review the restore preview before replacing existing sections.'],
 ['Does it support WoW Classic, PTR or beta?','No verified API integration or game-version support is claimed for Classic, PTR or beta. Some generic manual notes may still be useful there, but connected character, item and talent features are designed around modern Retail Blizzard APIs.'],
 ['Do I need to download anything?','No native installation is required for the hosted companion. Open its HTTPS URL in a modern browser. The app has a web-app manifest for supported Home Screen installations, but complete offline operation has not been established.'],
 ['Who operates this companion?','NEXUS is an independent, unofficial World of Warcraft fan companion. It is not affiliated with or endorsed by Blizzard Entertainment. The secure login is handled by Blizzard via the Cloudflare-hosted authorization portal.']
];
const roadmap=[
 ['Next reliability work','Expand end-to-end browser testing, verify backups across devices, confirm real-player account data and keep a clean Worker recovery process.','Planned'],
 ['Character Dominion follow-ons','Continue improving character identity, goals and public gear research after real-player feedback, without exposing private account data in GitHub Pages.','Exploration'],
 ['Collection Atlas improvements','Improve mount and pet reference information, sorting, acquisition notes and supported collection comparisons; never fabricate ownership.','Exploration'],
 ['Party & dungeon workflow','Better group preparation, portable route checklists and planning handoffs, without intrusive game automation.','Exploration'],
 ['Release & compatibility upkeep','Maintain release manifests, Discord announcements, game-patch reference reviews and compatibility notes as Blizzard changes Retail.','Ongoing']
];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b=document.createElement('button');b.type='button';b.dataset.view='guide';b.textContent='ⓘ Information & Guide';nav.prepend(b);
const host=document.createElement('div');host.id='nexusPlayerGuide';
host.innerHTML='<section class="section" data-section="guide">'+
 '<div class="pg-kicker">NEXUS / PLAYER INTELLIGENCE & GUIDES</div>'+
 '<div class="pg-hero"><div><h2>Information & Player Guide</h2><p>Learn what Azeroth does, how to get started, how to plan real gameplay with friends, what data is reliable, and where development is heading.</p><div class="pg-hero-actions"><button type="button" class="primary" data-pg-nav="overview">OPEN THE COMPANION</button><button type="button" data-pg-nav="personal">CONNECT BATTLE.NET</button><button type="button" data-pg-nav="vault">BACK UP MY DATA</button></div></div><div class="pg-hero-mark" aria-hidden="true">⚔</div></div>'+
 '<div class="pg-index" aria-label="Guide sections"><a href="#pg-start">GETTING STARTED</a><a href="#pg-features">TOOLS & BENEFITS</a><a href="#pg-friends">PLAY WITH FRIENDS</a><a href="#pg-versions">VERSIONS & COMPATIBILITY</a><a href="#pg-roadmap">ROADMAP</a><a href="#pg-faq">FAQ</a></div>'+
 '<div class="pg-metrics" aria-label="Guide overview"><div><strong>Free to explore</strong><span>Optional Battle.net connection</span></div><div><strong>PC + iPhone</strong><span>Browser-based planning</span></div><div><strong>Read-only API</strong><span>No game modifications</span></div><div><strong>Manual + verified</strong><span>Clearly different data sources</span></div></div>'+
 '<section class="pg-section" id="pg-start"><div class="pg-heading"><div><div class="pg-eyebrow">01 / START HERE</div><h3>Your first 10 minutes</h3><p>Follow these steps in order. You can skip account connection if you only want to explore and plan.</p></div><button type="button" id="pgReset">RESET CHECKLIST</button></div><div class="pg-steps" id="pgSteps"></div><p class="pg-note" id="pgStepStatus" role="status"></p></section>'+
 '<section class="pg-section" id="pg-features"><div class="pg-eyebrow">02 / WHAT YOU CAN DO</div><h3>Tools, practical uses and benefits</h3><p>Use the search to find a tool, then select Open to jump into the real working section.</p><label class="pg-search-label" for="pgToolSearch">Find a feature<input id="pgToolSearch" type="search" placeholder="Search characters, mounts, talents, routes, backup…"></label><div class="pg-tool-grid" id="pgToolGrid"></div><p id="pgToolCount" class="pg-note"></p></section>'+
 '<section class="pg-section" id="pg-friends"><div class="pg-eyebrow">03 / REAL GAMEPLAY & GROUPS</div><h3>How it helps during a WoW session</h3><div class="pg-examples">'+
 '<article><strong>Before a dungeon or raid</strong><p>Open War Room, set tonight’s goals, build a party role plan, and share a prepared dungeon route or encounter notes. Your group has a checklist before logging in.</p><button type="button" data-pg-nav="warcraft">OPEN WAR ROOM</button></article>'+
 '<article><strong>While farming a mount or item</strong><p>Research the item in Codex/Atlas, record a Loot Hunter objective, assign it to a character and manually log each farming session. Check progress together later.</p><button type="button" data-pg-nav="loot">OPEN LOOT HUNTER</button></article>'+
 '<article><strong>When choosing gear or talents</strong><p>Review publicly reported character gear where available, use Talent Forge to research possibilities, then compare your own plans. Verify actual results in-game.</p><button type="button" data-pg-nav="talents">OPEN TALENT FORGE</button></article>'+
 '<article><strong>Between PC and phone</strong><p>Export the full set of selected local planners using Sovereign Data Vault, send the file to your other device, preview and selectively import it.</p><button type="button" data-pg-nav="vault">OPEN DATA VAULT</button></article></div><p class="pg-note">There is currently no live party synchronization, live game tracking or multiplayer matchmaking. Share only information you choose to share.</p></section>'+
 '<section class="pg-section" id="pg-versions"><div class="pg-eyebrow">04 / RELEASES & GAME COMPATIBILITY</div><h3>Which versions does Azeroth support?</h3><p>The companion’s release number and Blizzard’s game patch are different things. Read both before assuming a feature is supported.</p><div class="pg-versions-grid"><div class="pg-version-panel"><small>CURRENT HOSTED COMPANION</small><strong id="pgAppVersion">Checking release…</strong><span id="pgAppSubtitle">Reading the published version manifest</span><div class="pg-small" id="pgAppDate"></div><button type="button" id="pgCheckVersion">CHECK LATEST RELEASE</button></div><div class="pg-version-panel"><small>MODERN WORLD OF WARCRAFT RETAIL</small><strong>Midnight · 12.1.5</strong><span>Latest official live Retail content patch referenced in this guide</span><div class="pg-small">Reference checked: November 15, 2026 · Patch compatibility testing is not certified per build</div><a href="'+PATCH+'" target="_blank" rel="noopener noreferrer">VIEW OFFICIAL BLIZZARD PATCH NOTES</a></div></div>'+
 '<div class="pg-compatibility"><div class="pg-compat-row"><strong>Modern Retail</strong><span class="pg-support">PRIMARY API TARGET</span><p>Armory, item, character, equipment and talent research use modern Retail Blizzard API routes. Returned records depend on API availability and supported regions; not a tested guarantee for every game client build.</p></div><div class="pg-compat-row"><strong>Classic / Anniversary / Season of Discovery</strong><span class="pg-unsupported">NOT VERIFIED FOR CONNECTED DATA</span><p>Generic planning notes may still be useful, but no Classic-specific Blizzard API integration, accurate Classic talents or official Classic patch support is claimed.</p></div><div class="pg-compat-row"><strong>PTR / Beta / future Retail patches</strong><span class="pg-unsupported">NOT CERTIFIED</span><p>Changes to game rules, item availability or API responses may affect tools. Check official Blizzard updates; future compatibility requires review and testing.</p></div><div class="pg-compat-row"><strong>Browser platforms</strong><span class="pg-support">WEB COMPANION</span><p>Designed for current desktop and mobile browsers, including iPhone Safari. No Windows installer or in-game addon required; unsupported browsers and complete offline caching are not guaranteed.</p></div></div><h4>Recent companion releases</h4><div class="pg-release-list" id="pgRecentReleases"><div class="pg-note">Fetching release history…</div></div><p class="pg-note" id="pgVersionStatus" role="status">Version information is read from this site’s published release manifest; it does not inspect your installed WoW game client.</p><button type="button" data-pg-nav="releases">OPEN FULL RELEASE CENTER</button></section>'+
 '<section class="pg-section" id="pg-roadmap"><div class="pg-eyebrow">05 / FUTURE DEVELOPMENT</div><h3>What we want to improve next</h3><p>These are development priorities, not released features or promised delivery dates.</p><div class="pg-roadmap" id="pgRoadmap"></div></section>'+
 '<section class="pg-section" id="pg-faq"><div class="pg-eyebrow">06 / HONEST ANSWERS</div><h3>Frequently asked questions</h3><div id="pgFAQ" class="pg-faq"></div><div class="pg-links"><a href="'+WORKER+'/privacy" target="_blank" rel="noopener noreferrer">ACCOUNT PRIVACY</a><a href="https://github.com/zevromxr-hub/nexus-application-gateway/blob/main/azeroth-companion/CHANGELOG.md" target="_blank" rel="noopener noreferrer">RELEASE NOTES</a><a href="'+PATCH+'" target="_blank" rel="noopener noreferrer">OFFICIAL WOW UPDATES</a></div></section>'+
 '<footer class="pg-footer">Powered by ZevRo Development | NEXUS · An independent, unofficial World of Warcraft fan companion. Not affiliated with or endorsed by Blizzard Entertainment.</footer>'+
 '</section>';
main.insertBefore(host,footer);
const $=id=>document.getElementById(id);
let done={};try{const v=JSON.parse(localStorage.getItem(flag)||'{}');if(v&&typeof v==='object'&&!Array.isArray(v))done=v}catch(_){}
const save=()=>{try{localStorage.setItem(flag,JSON.stringify(done))}catch(_){/* nonessential guide progress */}};
function jump(view){
 const button=[...nav.querySelectorAll('button[data-view]')].find(x=>x.dataset.view===view);
 if(!button){$('pgVersionStatus').textContent='This tool is unavailable in the current site layout.';return}
 button.click();
 window.scrollTo({top:0,behavior:'instant'});
}
host.addEventListener('click',e=>{const go=e.target.closest('button[data-pg-nav]');if(go)jump(go.dataset.pgNav)});
function renderSteps(){
 $('pgSteps').innerHTML=steps.map(([title,desc,view],i)=>'<article class="pg-step"><label><input type="checkbox" data-pg-done="'+i+'" '+(done[i]?'checked':'')+' aria-label="Mark step '+(i+1)+' complete"><span class="pg-step-num">'+String(i+1).padStart(2,'0')+'</span><span><strong>'+escape(title)+'</strong><small>'+escape(desc)+'</small></span></label><button type="button" data-pg-nav="'+escape(view)+'">OPEN TOOL</button></article>').join('');
 $('pgStepStatus').textContent=steps.filter((_,i)=>!!done[i]).length+' of '+steps.length+' guide steps marked complete on this device. Checklist progress is a personal reminder, not proof of game activity.';
}
$('pgSteps').addEventListener('change',e=>{const n=e.target.closest('input[data-pg-done]');if(!n)return;done[n.dataset.pgDone]=n.checked;save();renderSteps()});
$('pgReset').addEventListener('click',()=>{done={};save();renderSteps()});
function renderTools(q=''){
 const term=q.trim().toLocaleLowerCase();
 const filtered=sections.filter(s=>(s.title+' '+s.desc+' '+s.tag).toLocaleLowerCase().includes(term));
 $('pgToolGrid').innerHTML=filtered.map(x=>'<article class="pg-tool"><span>'+escape(x.tag)+'</span><h4>'+escape(x.title)+'</h4><p>'+escape(x.desc)+'</p><button type="button" data-pg-nav="'+escape(x.view)+'">OPEN TOOL</button></article>').join('')||'<div class="pg-note">No matching tool. Try a broader term.</div>';
 $('pgToolCount').textContent=filtered.length+' of '+sections.length+' documented feature areas shown.';
}
$('pgToolSearch').addEventListener('input',e=>renderTools(e.target.value));
$('pgRoadmap').innerHTML=roadmap.map(([title,desc,status])=>'<article><div><strong>'+escape(title)+'</strong><small>'+escape(status)+'</small></div><p>'+escape(desc)+'</p></article>').join('');
$('pgFAQ').innerHTML=faqs.map(([q,a])=>'<details><summary>'+escape(q)+'</summary><p>'+escape(a)+'</p></details>').join('');
async function fetchVersion(){
 const state=$('pgVersionStatus');state.textContent='Checking the published Azeroth release manifest…';$('pgCheckVersion').disabled=true;
 try{
  const [vResponse,iResponse]=await Promise.all([fetch('./version.json',{cache:'no-store'}),fetch('./releases/index.json',{cache:'no-store'})]);
  if(!vResponse.ok||!iResponse.ok)throw Error('Published release files are unavailable');
  const [v,index]=await Promise.all([vResponse.json(),iResponse.json()]);
  if(!/^\d+\.\d+\.\d+$/.test(v.version)||!Array.isArray(index.releases)||index.releases[0]?.version!==v.version)throw Error('Published release records disagree');
  $('pgAppVersion').textContent='Azeroth v'+v.version;
  $('pgAppSubtitle').textContent=String(v.subtitle||'Current companion release').slice(0,140);
  $('pgAppDate').textContent='Release date: '+String(v.release_date||'not listed').slice(0,20);
  $('pgRecentReleases').replaceChildren();
  for(const item of index.releases.slice(0,8)){
   const div=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('span');
   name.textContent='v'+String(item.version).slice(0,20)+' · '+String(item.title).slice(0,160);
   sub.textContent=String(item.date||'').slice(0,20);
   div.append(name,sub);$('pgRecentReleases').append(div);
  }
  state.textContent='Release metadata checked. Retail game patch information above is a dated reference and may change independently.';
 }catch(_){
  $('pgAppVersion').textContent='Release status unavailable';
  $('pgAppSubtitle').textContent='Open Release Center for an alternate view';
  $('pgRecentReleases').textContent='Could not load published release history. Local guide content remains available.';
  state.textContent='Could not verify the live manifest. No release number is assumed.';
 }finally{$('pgCheckVersion').disabled=false}
}
$('pgCheckVersion').addEventListener('click',fetchVersion);
renderSteps();renderTools();if(window.NexusStartup?.whenView)window.NexusStartup.whenView('guide',()=>void fetchVersion());else void fetchVersion();
})();

;/* BUNDLE SOURCE: player-field-lab.js */
/* NEXUS | AZEROTH v4.2 — Player Field Lab.
 * Private, browser-local acceptance checklist and manual character readiness insights.
 * No account/character names, private Blizzard records, tokens or session proofs
 * in the exported report. Notes are opt-in and must be reviewed before sharing.
 */
(()=>{'use strict';
const nav=document.querySelector('.sidebar .nav'),main=document.querySelector('.main'),footer=main?.querySelector('.footer');if(!nav||!main||!footer)return;
const KEY='nexus_azeroth_player_fieldlab_v42',MAX_NOTE=400;
const checks=[
 ['Navigation and layout','Use the site on PC or iPhone. Open and close All Tools, visit several studios and confirm no buttons or text are cut off.','guide'],
 ['First-time guide','Open Information & Guide, complete at least two onboarding steps and use the tool links.','guide'],
 ['Battle.net sign-in','Visit My Azeroth and sign in through Blizzard. Do not enter credentials anywhere except the Blizzard-controlled login.','personal'],
 ['Verified connection','Choose Verify & Return. Confirm the green badge appears on the main site; it should eventually expire and not become permanently green.','dashboard'],
 ['Character roster','Check My Azeroth for any characters Blizzard returns. An account with no WoW data should show an understandable empty state.','personal'],
 ['Character research','Use a real character region, realm and name in the public Armory. Check that results and API errors are presented clearly.','armory'],
 ['Items and Loot Hunter','Look up a valid item in Codex or Atlas. Save a manual target and inspect the corresponding Loot Hunter tools.','atlas'],
 ['Personal planners','Add a manual character target or farming entry and confirm the Character Dashboard displays the saved information.','targets'],
 ['Talent and party tools','Load a Retail specialization in Talent Forge, explore nodes and prepare a party plan. Do not treat drafts as game-valid exports.','talents'],
 ['Backup and restore safety','Export selected modules in Sovereign Data Vault. Review a backup preview; perform a restore only if comfortable and after preserving another copy.','vault'],
 ['Release information','Open Information & Guide and compare the companion release number with Release Center. Read the game compatibility limitations.','releases'],
 ['Returning session','Refresh the site and revisit your local planner data. Verify the interface behaves correctly if the two-minute account proof has expired.','dashboard']
];
const states={untested:'Not tested',passed:'Passed',issue:'Issue found',blocked:'Blocked'};
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;':'&#39;'}[c]));
let data={records:{}};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&saved.records&&typeof saved.records==='object')data.records=saved.records}catch(_){}
function write(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){message('Cannot save local test notes. Export your report before closing the page.')}} 
function message(t){$('pflMessage').textContent=t}
const b=document.createElement('button');b.type='button';b.dataset.view='fieldlab';b.textContent='⌁ Player Field Lab';nav.append(b);
const host=document.createElement('div');host.id='playerFieldLab';
host.innerHTML='<section class="section" data-section="fieldlab">'+
 '<div class="wow-kicker">NEXUS / PLAYER FIELD LAB · v4.2</div><h2>Player Testing & Character Insights</h2>'+
 '<p class="muted">Test Azeroth with real gameplay, record what works and report issues without sharing Blizzard credentials. Personal notes remain in this browser until you choose to export them.</p>'+
 '<div class="pfl-status"><div><strong id="pflPassed">0 / 12</strong><span>Checks passed</span></div><div><strong id="pflIssues">0</strong><span>Issues discovered</span></div><div><strong id="pflBlocked">0</strong><span>Blocked checks</span></div><div><strong id="pflCoverage">0%</strong><span>Checks attempted</span></div></div>'+
 '<div class="pfl-columns"><article class="panel"><h3>Player test checklist</h3><p class="muted">Choose Passed, Issue found or Blocked for each step. You can test freely even without a WoW character.</p><div id="pflChecklist" class="pfl-checklist"></div></article>'+
 '<article class="panel"><h3>Privacy-safe feedback export</h3><p class="muted">Create a report for the developer or a Discord support thread. Statuses are included. Personal test notes are excluded by default.</p>'+
 '<label class="pfl-checkbox"><input id="pflNotes" type="checkbox">Include my written notes (review them for personal information first)</label>'+
 '<label class="pfl-checkbox"><input id="pflEnvironment" type="checkbox" checked>Include broad browser/device category</label>'+
 '<div class="pfl-buttons"><button class="primary" type="button" id="pflCopy">COPY REPORT</button><button type="button" id="pflDownload">DOWNLOAD REPORT</button><button type="button" id="pflClear">CLEAR TEST RESULTS</button></div>'+
 '<div class="pfl-preview"><strong>Report preview</strong><textarea id="pflReportPreview" rows="12" readonly aria-label="Privacy-safe report preview"></textarea></div><p class="hint">No report is sent automatically. The report never includes OAuth tokens, session tickets, saved character names or private Blizzard account data. Avoid typing secrets into notes.</p></article></div>'+
 '<section class="pfl-insights"><div class="wow-kicker">CHARACTER INTELLIGENCE / LOCAL PLANNER</div><h3>Planning Readiness</h3><p class="muted">An at-a-glance summary of goals on this device. Figures are based on manually entered planning data and are NOT Blizzard-confirmed equipment, level, achievement, or collection ownership.</p><div class="pfl-status" id="pflPlannerStats"></div><div id="pflPlannerState" class="pfl-insight-notice" role="status"></div><div class="pfl-buttons"><button type="button" data-pfl-go="dashboard">OPEN CHARACTER DASHBOARD</button><button type="button" data-pfl-go="targets">MANAGE TARGETS</button><button type="button" data-pfl-go="loot">OPEN FARMING</button><button type="button" data-pfl-go="vault">BACK UP PLANS</button><button type="button" id="pflRefresh">REFRESH INSIGHTS</button></div></section>'+
 '<p class="hint" id="pflMessage" role="status">Test results are saved locally. No connection to Discord is required to use this lab.</p></section>';
main.insertBefore(host,footer);
function record(i){const s=data.records[String(i)]||{};return{state:Object.hasOwn(states,s.state)?s.state:'untested',note:typeof s.note==='string'?s.note.slice(0,MAX_NOTE):''}}
function updateCounts(){
 const rows=checks.map((_,i)=>record(i)),count=s=>rows.filter(x=>x.state===s).length;
 $('pflPassed').textContent=count('passed')+' / '+checks.length;
 $('pflIssues').textContent=String(count('issue'));
 $('pflBlocked').textContent=String(count('blocked'));
 $('pflCoverage').textContent=Math.round(100*(checks.length-count('untested'))/checks.length)+'%';
}
function render(){
 $('pflChecklist').innerHTML=checks.map(([name,desc,view],i)=>{const r=record(i);
  return '<div class="pfl-check" data-pfl-check="'+i+'"><div class="pfl-check-head"><div><strong>'+String(i+1).padStart(2,'0')+' · '+esc(name)+'</strong><p>'+esc(desc)+'</p></div><button type="button" data-pfl-go="'+esc(view)+'">OPEN</button></div><label>Result<select data-pfl-state="'+i+'">'+Object.entries(states).map(([value,label])=>'<option value="'+value+'" '+(r.state===value?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label><label class="pfl-note-label">Test notes (optional)<textarea data-pfl-note="'+i+'" maxlength="'+MAX_NOTE+'" rows="2" placeholder="What happened? Include steps to reproduce; never paste credentials.">'+esc(r.note)+'</textarea></label></div>';
 }).join('');
 updateCounts();refreshReport();
}
function category(){const ua=navigator.userAgent||'';const mobile=/iPhone|iPad|Android/i.test(ua);return mobile?'Mobile browser':'Desktop browser'}
function report(){
 const withNotes=$('pflNotes').checked,withEnv=$('pflEnvironment').checked;
 const lines=['NEXUS | AZEROTH — PLAYER TEST REPORT','Companion UI version: '+(document.querySelector('.main .top .chip')?.textContent?.match(/v\d+\.\d+(?:\.\d+)?/)?.[0]||'unavailable')+' (see Release Center for verified release metadata)','Created: '+new Date().toISOString().slice(0,10),'Report source: voluntary browser-local checklist'];
 if(withEnv)lines.push('Environment: '+category());
 lines.push('','Test results:');
 checks.forEach(([name],i)=>{const r=record(i);lines.push((i+1)+'. '+name+' — '+states[r.state]);if(withNotes&&r.note.trim())lines.push('   Note: '+r.note.trim().replace(/[\r\n]+/g,' ').slice(0,MAX_NOTE))});
 const total=checks.map((_,i)=>record(i).state),attempted=total.filter(x=>x!=='untested').length;
 lines.push('','Summary: '+total.filter(x=>x==='passed').length+'/'+checks.length+' passed; '+total.filter(x=>x==='issue').length+' issues; '+total.filter(x=>x==='blocked').length+' blocked; '+attempted+'/'+checks.length+' attempted.');
 lines.push('No Blizzard tokens, account IDs or private collection data are intentionally included. Review all optional notes before sharing.');
 return lines.join('\n');
}
function refreshReport(){$('pflReportPreview').value=report()}
host.addEventListener('change',e=>{
 const choice=e.target.closest('[data-pfl-state]');if(choice){const i=Number(choice.dataset.pflState);if(!Number.isInteger(i)||i<0||i>=checks.length)return;data.records[i]={...record(i),state:choice.value};write();updateCounts();refreshReport();return}
 if(e.target.closest('#pflNotes,#pflEnvironment'))refreshReport();
});
host.addEventListener('input',e=>{
 const note=e.target.closest('[data-pfl-note]');if(!note)return;
 const i=Number(note.dataset.pflNote);if(!Number.isInteger(i)||i<0||i>=checks.length)return;
 data.records[i]={...record(i),note:note.value.slice(0,MAX_NOTE)};write();if($('pflNotes').checked)refreshReport();
});
function jump(view){const btn=[...nav.querySelectorAll('button[data-view]')].find(x=>x.dataset.view===view);if(btn){btn.click();window.scrollTo({top:0,behavior:'instant'})}else message('This tool is not available on the current page.')}
host.addEventListener('click',e=>{const link=e.target.closest('[data-pfl-go]');if(link)jump(link.dataset.pflGo)});
$('pflCopy').addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(report());message('Report copied. Review it before sharing with anyone.')}
 catch(_){$('pflReportPreview').focus();$('pflReportPreview').select();message('Clipboard permission unavailable. Select and copy the preview manually.')}
});
$('pflDownload').addEventListener('click',()=>{
 const blob=new Blob([report()],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NEXUS-AZEROTH-PLAYER-TEST-'+new Date().toISOString().slice(0,10)+'.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 message('Text report downloaded locally. No report was sent to Discord or a remote server.');
});
$('pflClear').addEventListener('click',()=>{if(!confirm('Clear all local player-test statuses and notes? Your WoW planners and Battle.net connection will remain unchanged.'))return;data={records:{}};write();render();message('Player test results cleared. Other saved data was preserved.')});
function local(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function readiness(){
 const farm=local('nexus_azeroth_farm_operations_v1'),targets=local('nexus_azeroth_character_targets_v1'),atlas=local('nexus_azeroth_item_atlas_v1'),loot=local('nexus_azeroth_loot_hunter_v1');
 const profiles=[...(Array.isArray(farm?.characters)?farm.characters:[]),...(Array.isArray(targets?.characters)?targets.characters:[])];
 const ids=new Set(profiles.filter(x=>x&&['us','eu','kr','tw'].includes(x.region)&&typeof x.realm==='string'&&typeof x.name==='string').map(x=>x.region+'/'+x.realm+'/'+x.name));
 const goals=Array.isArray(targets?.targets)?targets.targets:[],sessions=Array.isArray(farm?.sessions)?farm.sessions:[];
 const total=goals.filter(x=>x&&Number.isSafeInteger(Number(x.itemId))&&Number(x.itemId)>0),open=total.filter(x=>!x.done);
 const own=Array.isArray(atlas)?atlas.filter(x=>x&&x.status==='owned').length:0;
 const lootGoals=Array.isArray(loot)?loot.filter(x=>x&&!x.done).length:0;
 const metrics=[['Saved characters',ids.size],['Open item targets',open.length],['Logged farm sessions',sessions.length],['Manual Atlas owned',own],['Open loot goals',lootGoals]];
 $('pflPlannerStats').innerHTML=metrics.map(([label,value])=>'<div><strong>'+value+'</strong><span>'+label+'</span></div>').join('');
 $('pflPlannerState').textContent=ids.size?'Planning data found for '+ids.size+' character profile(s). Your next action: review open targets or start a new farming session.':'No local character planning profiles found. Add a character in Character Targets or manually via Farming Operations. Battle.net sign-in is optional.';
}
$('pflRefresh').addEventListener('click',readiness);
const refreshVisible=()=>{if(document.querySelector('[data-section="fieldlab"].active')){readiness();refreshReport()}};
window.addEventListener('pageshow',refreshVisible);
window.addEventListener('storage',e=>{if(['nexus_azeroth_farm_operations_v1','nexus_azeroth_character_targets_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1'].includes(e.key))refreshVisible()});
window.addEventListener('nexus:character-profile-updated',refreshVisible);
const guide=document.querySelector('#pg-friends');if(guide){
 const shortcut=document.createElement('div');shortcut.className='pg-note';
 shortcut.textContent='Testing with friends? Record their results without sharing Battle.net secrets.';
 const open=document.createElement('button');open.type='button';open.dataset.pgNav='fieldlab';open.textContent='OPEN PLAYER FIELD LAB';
 shortcut.append(document.createTextNode(' '),open);guide.append(shortcut);
}
let labInitialized=false;
if(window.NexusStartup?.whenView)window.NexusStartup.whenView('fieldlab',()=>{if(!labInitialized){labInitialized=true;render()}readiness();refreshReport()},{once:false});else{render();readiness()}
})();

;/* BUNDLE SOURCE: character-dominion.js */
/* NEXUS | AZEROTH v4.3 CHARACTER DOMINION
 * Character-centered, browser-local planning aggregation. Explicitly distinguished
 * from Blizzard-authenticated account data and public API profile lookups.
 */
(()=>{'use strict';
const main=document.querySelector('.main'),nav=document.querySelector('.sidebar .nav'),footer=main?.querySelector('.footer');
if(!main||!nav||!footer)return;
const KEYS={targets:'nexus_azeroth_character_targets_v1',farm:'nexus_azeroth_farm_operations_v1',atlas:'nexus_azeroth_item_atlas_v1',loot:'nexus_azeroth_loot_hunter_v1'};
const REGIONS=['us','eu','kr','tw'],PRIORITY={high:0,normal:1,later:2};
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','&#39;':'&#39;'}[c]));
const idOf=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999?Number(x):null;
const validProfile=p=>p&&REGIONS.includes(p.region)&&/^[a-z0-9-]{2,80}$/.test(String(p.realm||''))&&/^[a-z0-9-]{2,50}$/.test(String(p.name||''));
const key=p=>p.region+'/'+p.realm+'/'+p.name;
let current='all',publicResult=null,scope='all';
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
function snapshot(){
 const tar=read(KEYS.targets),farm=read(KEYS.farm),atlas=read(KEYS.atlas),loot=read(KEYS.loot);
 const roster=[...(Array.isArray(tar?.characters)?tar.characters:[]),...(Array.isArray(farm?.characters)?farm.characters:[])].filter(validProfile);
 const chars=[...new Map(roster.map(p=>[key(p),{region:p.region,realm:p.realm,name:p.name}])).values()].slice(0,80);
 const ids=new Set(chars.map(key));
 const targets=(Array.isArray(tar?.targets)?tar.targets:[]).filter(t=>t&&ids.has(t.character)&&idOf(t.itemId)&&REGIONS.includes(t.region)&&t.region===t.character.split('/')[0]&&Object.hasOwn(PRIORITY,t.priority)).slice(0,1500);
 const items=(Array.isArray(atlas)?atlas:[]).filter(x=>x&&REGIONS.includes(x.region)&&idOf(x.id)&&typeof x.name==='string').slice(0,5000);
 const lootGoals=(Array.isArray(loot)?loot:[]).filter(x=>x&&idOf(x.id)&&typeof x.name==='string').slice(0,200);
 const sessions=(Array.isArray(farm?.sessions)?farm.sessions:[]).filter(x=>x&&ids.has(x.character)&&idOf(x.itemId)&&Number.isSafeInteger(x.attempts)&&x.attempts>=1&&x.attempts<=100).slice(-500);
 const assignments=farm?.assignments&&typeof farm.assignments==='object'&&!Array.isArray(farm.assignments)?farm.assignments:{};
 return {chars,targets,items,lootGoals,sessions,assignments};
}
const tab=document.createElement('button');tab.type='button';tab.dataset.view='dominion';tab.textContent='♜ Character Dominion';nav.prepend(tab);
const host=document.createElement('div');host.id='characterDominion';
host.innerHTML='<section class="section" data-section="dominion"><div class="wow-kicker">NEXUS / CHARACTER DOMINION · v4.3</div><div class="cd-heading"><div><h2>Character Dominion</h2><p class="muted">One command view for saved character objectives, item tracking and manual farming history. Blizzard public profile lookups are optional, read-only and never proof you own a character.</p></div><button type="button" id="cdRefresh">REFRESH DATA</button></div><div class="cd-hero panel"><div class="cd-portrait" id="cdAvatar" aria-hidden="true">✦</div><div class="cd-head-copy"><label for="cdCharacter">Active planning character</label><select id="cdCharacter"><option value="all">All saved characters</option></select><span id="cdSource">Source: manually saved planning profiles</span></div><div class="cd-hero-actions"><button type="button" data-cd-go="personal">SECURE MY AZEROTH</button><button type="button" id="cdOpenArmory">OPEN PUBLIC ARMORY</button></div></div><div id="cdProfileData" class="cd-profile-source" role="status">Public character profile details appear after you explicitly load them in Live Armory. Your manual planners work without Battle.net.</div><div class="cd-metrics" id="cdMetrics"></div><div class="cd-cols"><article class="panel"><h3>Next recommended objective</h3><div id="cdNext" class="cd-list"></div><div class="cd-section-actions"><button type="button" data-cd-go="targets">MANAGE OBJECTIVES</button><button type="button" data-cd-go="atlas">FIND ITEMS</button></div></article><article class="panel"><h3>Assign an Item Atlas goal</h3><p class="muted">Choose an existing saved Atlas item for this character. Assignment is manual and cannot verify ownership.</p><div class="cd-form"><label for="cdAssignItem">Tracked item<select id="cdAssignItem"></select></label><label for="cdPriority">Priority<select id="cdPriority"><option value="high">High</option><option value="normal" selected>Normal</option><option value="later">Later</option></select></label><button type="button" class="primary" id="cdAssign">ASSIGN TO CHARACTER</button></div><p class="hint" id="cdAssignHint"></p></article></div><div class="cd-cols"><article class="panel"><h3>Character item objectives</h3><div class="cd-filters"><label for="cdFilter">Show<select id="cdFilter"><option value="all">All goals</option><option value="open">Open</option><option value="done">Completed manually</option></select></label></div><div class="cd-list" id="cdObjectives"></div></article><article class="panel"><h3>Recent farming activity</h3><div class="cd-list" id="cdSessions"></div><div class="cd-section-actions"><button type="button" data-cd-go="loot">OPEN LOOT HUNTER</button><button type="button" data-cd-go="dashboard">CHARACTER DASHBOARD</button></div></article></div><div class="cd-notice">Blizzard-reported public equipment is only displayed in Live Armory after a lookup; it is not an account inventory or a confirmation of ownership. Item Atlas ownership, objective completion and farming sessions are recorded manually on this device. Your authenticated Battle.net account data stays on the separate secure Cloudflare portal.</div><p id="cdStatus" class="hint" role="status">Character Dominion ready.</p></section>';
main.insertBefore(host,footer);
function notice(message){$('cdStatus').textContent=message}
function go(view){const b=[...nav.querySelectorAll('button[data-view]')].find(x=>x.dataset.view===view);if(!b)return notice('That studio is not available.');b.click();window.scrollTo({top:0,behavior:'instant'})}
host.addEventListener('click',e=>{const b=e.target.closest('[data-cd-go]');if(b)go(b.dataset.cdGo)});
const formatChar=p=>p.name+' · '+p.realm+' ('+p.region.toUpperCase()+')';
function itemName(items,t){return items.find(x=>x.region===t.region&&Number(x.id)===Number(t.itemId))?.name||'Item #'+t.itemId}
function ranked(targets){return targets.slice().sort((a,b)=>(PRIORITY[a.priority]??1)-(PRIORITY[b.priority]??1))}
function statusTag(x){return x?'Manually completed':'Open / manually tracked'}
function goalCard(t,d){
 const name=itemName(d.items,t),item=d.items.find(x=>x.region===t.region&&Number(x.id)===Number(t.itemId));
 const manual=item?.status==='owned'&&!t.done?' <span class="cd-discrepancy">Atlas marked owned — review goal</span>':'';
 const attempts=d.sessions.filter(s=>s.character===t.character&&s.itemId===Number(t.itemId)).reduce((a,s)=>a+s.attempts,0);
 const char=selectedChar(d);
 return '<div class="cd-record"><div><strong>'+esc(name)+'</strong><small>#'+t.itemId+' · '+esc(t.priority)+' priority · '+statusTag(t.done)+' · '+attempts+' logged character attempts'+manual+'</small>'+((current==='all')?'<small>'+esc(t.character)+'</small>':'')+(t.note?'<small>'+esc(t.note)+'</small>':'')+'</div><div class="cd-record-actions"><button type="button" data-cd-item="'+t.itemId+'" data-cd-region="'+esc(t.region)+'">INSPECT</button><button type="button" data-cd-toggle="'+esc(t.character+'|'+t.region+':'+t.itemId)+'">'+(t.done?'REOPEN':'MARK DONE')+'</button></div></div>';
}
function selectedChar(d){return d.chars.find(x=>key(x)===current)}
function render(){
 const d=snapshot(),ids=new Set(d.chars.map(key));if(current!=='all'&&!ids.has(current))current='all';
 const char=selectedChar(d);
 $('cdCharacter').innerHTML='<option value="all">All saved characters</option>'+d.chars.map(c=>'<option value="'+esc(key(c))+'" '+(current===key(c)?'selected':'')+'>'+esc(formatChar(c))+'</option>').join('');
 $('cdAvatar').textContent=char?char.name.slice(0,2).toUpperCase():'✦';
 $('cdSource').textContent=char?'Local planning profile · '+char.region.toUpperCase():'Source: manually saved planning profiles';
 $('cdOpenArmory').disabled=!char;
 const filtered=d.targets.filter(t=>current==='all'||t.character===current);
 const open=filtered.filter(t=>!t.done),done=filtered.filter(t=>t.done);
 const sessions=d.sessions.filter(s=>current==='all'||s.character===current),attempts=sessions.reduce((sum,s)=>sum+s.attempts,0);
 const metrics=[['Saved characters',current==='all'?d.chars.length:char?1:0],['Open targets',open.length],['Completed manually',done.length],['Logged farm attempts',attempts]];
 $('cdMetrics').innerHTML=metrics.map(([n,val])=>'<div><strong>'+val+'</strong><span>'+esc(n)+'</span></div>').join('');
 const next=ranked(open)[0];
 $('cdNext').innerHTML=next?goalCard(next,d):'<div class="empty">No open targets for this selection. Save an item in Atlas, then assign it here.</div>';
 const visible=scope==='open'?open:scope==='done'?done:filtered;
 $('cdObjectives').innerHTML=ranked(visible).slice(0,35).map(t=>goalCard(t,d)).join('')||'<div class="empty">No objectives match the current filter.</div>';
 const lookup=new Map(d.items.map(x=>[x.region+':'+x.id,x.name]));
 $('cdSessions').innerHTML=sessions.slice(-10).reverse().map(s=>'<div class="cd-record"><div><strong>'+esc(lookup.get(s.character.split('/')[0]+':'+s.itemId)||'Item #'+s.itemId)+'</strong><small>'+s.attempts+' attempts · '+esc(s.date||'Date unrecorded')+'</small>'+(current==='all'?'<small>'+esc(s.character)+'</small>':'')+(s.note?'<small>'+esc(s.note)+'</small>':'')+'</div></div>').join('')||'<div class="empty">No farming sessions logged for this selection.</div>';
 const available=d.items.filter(x=>char&&x.region===char.region&&x.status!=='archived');
 $('cdAssignItem').innerHTML=available.map(x=>'<option value="'+esc(x.region+':'+x.id)+'">'+esc(x.name)+' · #'+x.id+'</option>').join('');
 $('cdAssign').disabled=!char||!available.length;
 $('cdAssignHint').textContent=!char?'Select a saved character to assign an objective.':!available.length?'Save a valid item in Item Atlas for '+char.region.toUpperCase()+' first.':'Eligible items are loaded from your existing Atlas. Nothing is written until you select Assign.';
 const profile=publicResult;
 $('cdProfileData').textContent=profile&&char&&profile.identity===key(char)?'Blizzard PUBLIC profile (read-only, fetched '+profile.fetchedAt+'): Level '+(profile.level??'unknown')+' · '+(profile.className||'Class unavailable')+' · '+(profile.spec||'Spec unavailable')+' · Average item level '+(profile.itemLevel??'not reported')+'. This is public research data, not authenticated ownership.':'No public profile loaded for this selection. Open Public Armory to request Blizzard profile and equipment data.';
}
function saveTargets(next,previous){
 try{localStorage.setItem(KEYS.targets,JSON.stringify(next));window.dispatchEvent(new Event('nexus:character-targets-updated'));return true}
 catch(_){try{if(previous===null)localStorage.removeItem(KEYS.targets);else localStorage.setItem(KEYS.targets,previous)}catch(__){}notice('Could not save objectives. Storage may be unavailable; create a backup.');return false}
}
function safeTargets(){
 let raw;try{raw=localStorage.getItem(KEYS.targets)}catch(_){return null}if(raw===null)return{raw:null,data:{characters:[],targets:[]}};
 let parsed;try{parsed=JSON.parse(raw)}catch(_){return null}
 if(!parsed||!Array.isArray(parsed.characters)||!Array.isArray(parsed.targets)||parsed.targets.length>1500)return null;
 return{raw,data:parsed};
}
$('cdCharacter').addEventListener('change',e=>{current=e.target.value;render()});
$('cdFilter').addEventListener('change',e=>{scope=e.target.value;render()});
$('cdRefresh').addEventListener('click',()=>{render();notice('Character planning data refreshed from the saved local studios.')});
$('cdOpenArmory').addEventListener('click',()=>{
 const c=selectedChar(snapshot());if(!c)return notice('Select a saved character first.');
 go('armory');
 if($('cxCharacterRegion'))$('cxCharacterRegion').value=c.region;
 if($('cxRealm'))$('cxRealm').value=c.realm;
 if($('cxName'))$('cxName').value=c.name;
 $('cxCharacterResult').textContent='Character selected from a local planner. Select Load Real Profile to request public Blizzard data.';
});
$('cdAssign').addEventListener('click',()=>{
 const d=snapshot(),c=selectedChar(d);if(!c)return notice('Choose a character.');
 const raw=$('cdAssignItem').value;const parts=/^(us|eu|kr|tw):([1-9][0-9]{0,9})$/.exec(raw);
 if(!parts||parts[1]!==c.region)return notice('Choose a valid saved Item Atlas entry in the character’s region.');
 const itemId=idOf(parts[2]);if(!itemId||!d.items.some(x=>x.region===c.region&&Number(x.id)===itemId))return notice('Item not found in current Atlas.');
 const record=safeTargets();if(!record)return notice('Existing Character Targets data could not be validated. Back it up before modifying it.');
 const p=record.data;if(p.targets.some(x=>x.character===key(c)&&Number(x.itemId)===itemId&&x.region===c.region))return notice('That item is already assigned to this character. Edit it in Character Targets.');
 if(p.targets.length>=1500)return notice('Character Targets is full; archive an earlier goal before adding more.');
 if(!p.characters.some(x=>validProfile(x)&&key(x)===key(c))){if(p.characters.length>=80)return notice('Character Targets roster is full.');p.characters.push({...c})}
 p.targets.push({character:key(c),region:c.region,itemId,priority:$('cdPriority').value,done:false,note:''});
 if(!saveTargets(p,record.raw))return;
 current=key(c);scope='all';$('cdFilter').value='all';render();
 notice('New manual objective assigned. The original Character Targets board has been updated.');
});
host.addEventListener('click',e=>{
 const button=e.target.closest('[data-cd-toggle],[data-cd-item]');if(!button)return;
 if(button.dataset.cdItem){const reg=button.dataset.cdRegion,id=idOf(button.dataset.cdItem);if(!REGIONS.includes(reg)||!id)return;go('codex');if($('cxItemRegion'))$('cxItemRegion').value=reg;if($('cxItemId'))$('cxItemId').value=id;document.getElementById('cxItemForm')?.requestSubmit();return}
 const ref=String(button.dataset.cdToggle||''),pos=ref.lastIndexOf('|');if(pos<0)return;
 const identity=ref.slice(0,pos),match=/^(us|eu|kr|tw):([1-9][0-9]{0,9})$/.exec(ref.slice(pos+1));if(!match)return;
 const record=safeTargets();if(!record)return notice('Character Targets data is unreadable. No changes made.');
 const item=record.data.targets.find(t=>t.character===identity&&t.region===match[1]&&Number(t.itemId)===Number(match[2]));if(!item)return notice('That objective no longer exists.');
 item.done=!item.done;
 if(!saveTargets(record.data,record.raw))return;
 render();notice('Objective status updated manually. This is not a Blizzard ownership confirmation.');
});
document.addEventListener('nexus:public-profile-loaded',e=>{
 const d=e.detail||{};if(!validProfile(d))return;
 publicResult={identity:key(d),level:d.level,className:d.className,spec:d.spec,itemLevel:d.itemLevel,fetchedAt:new Date().toLocaleTimeString()};
 refreshVisible();
});
function refreshVisible(){if(document.querySelector('[data-section="dominion"].active'))render()}
window.addEventListener('nexus:character-profile-updated',refreshVisible);
window.addEventListener('nexus:character-targets-changed',refreshVisible);
window.addEventListener('nexus:farm-operations-changed',refreshVisible);
window.addEventListener('nexus:item-atlas-changed',refreshVisible);
window.addEventListener('nexus:loot-updated',refreshVisible);
window.addEventListener('storage',e=>{if(Object.values(KEYS).includes(e.key))refreshVisible()});
window.addEventListener('pageshow',refreshVisible);
if(window.NexusStartup?.whenView)window.NexusStartup.whenView('dominion',render,{once:false});else render();
})();

;/* BUNDLE SOURCE: sovereign-experience.js */
/* NEXUS | AZEROTH v4.4 — SOVEREIGN EXPERIENCE ENGINE
 * Additive WEBSITE SHELL only: homepage, navigation organization, appearance and
 * published release notices. No studio data/API writes or authentication changes.
 */
(()=>{'use strict';
const main=document.querySelector('.main'),nav=document.querySelector('.sidebar .nav'),overview=main?.querySelector('[data-section="overview"]'),top=main?.querySelector('.top');
if(!main||!nav||!overview||!top||document.getElementById('sxExperience'))return;
const KEY='nexus_azeroth_site_shell_v44';
const TYPES={theme:['gold','violet','cyan'],background:['cinematic','soft','minimal'],motion:['auto','reduce'],density:['comfortable','compact'],contrast:['standard','high']};
const defaults={theme:'gold',background:'cinematic',motion:'auto',density:'comfortable',contrast:'standard'};
let data={...defaults,recent:[],collapsed:[],lastSeenVersion:''},version=null,releases=[],lastOpener=null,modal=null,loadPromise=null;
const $=id=>document.getElementById(id);
const text=x=>String(x??'').slice(0,160);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||'null');
  if(!x||Array.isArray(x)||typeof x!=='object')return;
  for(const [k,allowed]of Object.entries(TYPES))if(allowed.includes(x[k]))data[k]=x[k];
  if(Array.isArray(x.recent))data.recent=[...new Set(x.recent.filter(v=>typeof v==='string'&&/^[a-z0-9-]{2,30}$/.test(v)))].slice(0,8);
  if(Array.isArray(x.collapsed))data.collapsed=x.collapsed.filter(v=>typeof v==='string'&&/^[a-z]+$/.test(v)).slice(0,8);
  if(typeof x.lastSeenVersion==='string'&&/^\d+\.\d+\.\d+$/.test(x.lastSeenVersion))data.lastSeenVersion=x.lastSeenVersion;
 }catch(_){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){/* preferences are optional */}}
read();
function apply(){
 const body=document.body;
 for(const k of Object.keys(TYPES))body.dataset['sx'+k[0].toUpperCase()+k.slice(1)]=data[k];
 for(const sel of document.querySelectorAll('[data-sx-setting]'))if(sel.value!==data[sel.dataset.sxSetting])sel.value=data[sel.dataset.sxSetting];
}
const groups=[
 {id:'home',title:'Home & Discovery',icon:'⌂',views:['overview','guide','releases','fieldlab']},
 {id:'character',title:'Character & Builds',icon:'♜',views:['dominion','dashboard','characters','personal','armory','targets','talents','equipment','builds']},
 {id:'items',title:'Items & Collections',icon:'✧',views:['atlas','codex','loot','collections']},
 {id:'planning',title:'Planning & Operations',icon:'◈',views:['warcraft','dungeons','professions','progress','command','party','quick']},
 {id:'system',title:'Data & Utilities',icon:'⌘',views:['vault','data']}
];
const buttonMap=()=>new Map([...nav.querySelectorAll('button[data-view]')].map(b=>[b.dataset.view,b]));
function categorize(){
 const all=buttonMap(),used=new Set();
 for(const g of groups){
  const owned=g.views.filter(id=>all.has(id));if(!owned.length)continue;
  const box=document.createElement('section');box.className='sx-nav-group';box.dataset.sxGroupId=g.id;
  if(data.collapsed.includes(g.id))box.dataset.collapsed='true';
  const title=document.createElement('button');title.className='sx-nav-toggle';title.type='button';title.dataset.sxGroupToggle=g.id;title.setAttribute('aria-expanded',String(!data.collapsed.includes(g.id)));title.innerHTML='<span aria-hidden="true">'+g.icon+'</span><span>'+g.title+'</span><span class="sx-chevron" aria-hidden="true">⌄</span>';
  const mobileTitle=document.createElement('div');mobileTitle.className='sx-mobile-group-title';mobileTitle.textContent=g.title;
  const items=document.createElement('div');items.className='sx-nav-items';items.id='sx-group-'+g.id;title.setAttribute('aria-controls',items.id);
  for(const id of owned){items.append(all.get(id));used.add(id)}
  box.append(title,mobileTitle,items);nav.append(box);
 }
 const remaining=[...all].filter(([id])=>!used.has(id));
 if(remaining.length){
  const box=document.createElement('section');box.className='sx-nav-group';box.dataset.sxGroupId='other';
  const heading=document.createElement('div');heading.className='sx-mobile-group-title sx-other-title';heading.textContent='More tools';
  const items=document.createElement('div');items.className='sx-nav-items';
  for(const [,btn]of remaining)items.append(btn);
  box.append(heading,items);nav.append(box);
 }
}
categorize();
// Keep the existing iPhone All Tools filter useful after moving links into groups.
// This reads the original search field without modifying the adaptive-navigation studio.
const legacySearch=document.querySelector('.ac-search-wrap input');
const sxGroups=[...nav.querySelectorAll('.sx-nav-group')];
let searchFrame=0;
function syncMobileSearch(){
 if(searchFrame){cancelAnimationFrame(searchFrame);searchFrame=0}
 const filtering=Boolean(legacySearch?.value.trim());
 for(const group of sxGroups){
  const hidden=filtering&&!group.querySelector('.sx-nav-items button[data-view]:not([hidden])');
  if(group.hidden!==hidden)group.hidden=hidden;
 }
}
function scheduleMobileSearch(){
 if(searchFrame)return;
 searchFrame=requestAnimationFrame(()=>{searchFrame=0;syncMobileSearch()});
}
legacySearch?.addEventListener('input',scheduleMobileSearch);
document.addEventListener('click',e=>{
 if(e.target.closest('[data-ac-more]'))syncMobileSearch();
});
// The adaptive drawer resets its search when reopened. Reset group visibility too.
// When widening from phone to desktop, remove the old mobile-only filter so all
// studio buttons and categories become available again.
const sxMobileMedia=window.matchMedia('(max-width: 800px)');
sxMobileMedia.addEventListener?.('change',()=>{
 if(!sxMobileMedia.matches&&legacySearch){
  legacySearch.value='';
  legacySearch.dispatchEvent(new Event('input',{bubbles:true}));
 }
 scheduleMobileSearch();
});
const drawerObserver=new MutationObserver(rs=>{
 if(rs.some(r=>r.attributeName==='class'&&document.body.classList.contains('ac-menu-open')))
  syncMobileSearch();
});
drawerObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
nav.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-sx-group-toggle]');
 if(toggle){
  const id=toggle.dataset.sxGroupToggle,group=toggle.closest('.sx-nav-group');
  const collapsed=group.dataset.collapsed!=='true';
  if(collapsed)group.dataset.collapsed='true';else delete group.dataset.collapsed;
  toggle.setAttribute('aria-expanded',String(!collapsed));
  data.collapsed=collapsed?[...new Set([...data.collapsed,id])]:data.collapsed.filter(x=>x!==id);
  save();return;
 }
 const btn=e.target.closest('button[data-view]');if(btn)recordVisit(btn.dataset.view);
});
function recordVisit(view){
 if(!/^[a-z0-9-]{2,30}$/.test(view))return;
 const next=[view,...data.recent.filter(x=>x!==view)].slice(0,8);
 if(next.join('|')!==data.recent.join('|')){
  data.recent=next;save();renderRecent();
 }
 scheduleSelectedView();
}
document.addEventListener('click',e=>{
 const jump=e.target.closest('[data-jump]');if(jump)recordVisit(jump.dataset.jump);
});
let selectedFrame=0,lastSelectedView='';
function updateSelectedView(){
 const active=nav.querySelector('button[data-view].active');
 const id=active?.dataset.view||'overview';
 const wrapper=active?.closest('.sx-nav-group');
 const needsExpansion=Boolean(wrapper&&wrapper.dataset.collapsed==='true'&&window.matchMedia('(min-width:801px)').matches);
 if(lastSelectedView===id&&document.body.classList.contains('sx-home')===(id==='overview')&&!needsExpansion)return;
 lastSelectedView=id;
 document.body.classList.toggle('sx-home',id==='overview');
 if(needsExpansion){
  delete wrapper.dataset.collapsed;
  wrapper.querySelector('[data-sx-group-toggle]')?.setAttribute('aria-expanded','true');
  const g=wrapper.dataset.sxGroupId;
  data.collapsed=data.collapsed.filter(x=>x!==g);save();
 }
}
function scheduleSelectedView(){
 if(selectedFrame)return;
 selectedFrame=requestAnimationFrame(()=>{selectedFrame=0;updateSelectedView()});
}
const activeObserver=new MutationObserver(records=>{
 if(records.some(x=>x.type==='attributes'&&x.attributeName==='class'))scheduleSelectedView();
});
activeObserver.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
document.addEventListener('nexus:view-activated',scheduleSelectedView);
function navigate(id){
 const btn=buttonMap().get(id);if(!btn)return;
 btn.click();
 window.scrollTo({top:0,behavior:'instant'});
}
const root=document.createElement('div');root.id='sxExperience';root.className='sx-experience';
root.innerHTML='<div class="sx-welcome"><div class="sx-welcome-inner"><span class="sx-eyebrow">NEXUS / SOVEREIGN COMMAND</span><h2 id="sxWelcomeTitle">Your adventure begins here.</h2><p class="sx-welcome-copy">One home for your character research, collection goals, party plans and saved progress. Explore freely or connect to Battle.net when you want official account information.</p><div class="sx-hero-actions"><button class="sx-action-primary" type="button" data-sx-go="dominion">OPEN CHARACTER COMMAND</button><button type="button" data-sx-go="guide">GETTING STARTED</button><button type="button" data-sx-go="personal">MY AZEROTH ACCOUNT</button></div><div class="sx-welcome-foot"><span>✦ <strong id="sxHeroVersion">Checking published version…</strong></span><span>Unofficial read-only companion · PC & mobile</span></div></div><div class="sx-art-seal" aria-hidden="true">✧</div></div>'+
 '<div class="sx-home-split"><section class="sx-home-block"><div class="sx-home-head"><div><span class="sx-eyebrow">YOUR WORKSPACE</span><h3>Continue where you left off</h3></div><button type="button" data-sx-launcher>FIND ANY TOOL</button></div><div id="sxRecent" class="sx-recent"><p class="sx-muted">Open a tool to begin building your recent activity.</p></div></section><section class="sx-home-block"><div class="sx-home-head"><div><span class="sx-eyebrow">LATEST INTELLIGENCE</span><h3>What’s new in Azeroth</h3></div><button type="button" data-sx-updates>ALL UPDATES</button></div><strong class="sx-release-name" id="sxHomeRelease">Checking latest release…</strong><p class="sx-muted" id="sxHomeReleaseNote">Release information is loaded from this website’s published version manifest.</p><button class="sx-text-action" type="button" data-sx-go="releases">OPEN FULL RELEASE CENTER</button></section></div>'+
 '<div class="sx-discover-head"><span class="sx-eyebrow">EXPLORE YOUR COMPANION</span><h3>Choose your next destination</h3></div><div class="sx-destinations"><button type="button" data-sx-go="dominion"><span class="sx-dest-icon" aria-hidden="true">♜</span><strong>Characters</strong><small>Command your saved goals and character research</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button><button type="button" data-sx-go="atlas"><span class="sx-dest-icon" aria-hidden="true">✧</span><strong>Collections & Items</strong><small>Research items and organize acquisition targets</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button><button type="button" data-sx-go="warcraft"><span class="sx-dest-icon" aria-hidden="true">◈</span><strong>Adventure Planning</strong><small>Prepare dungeon, crafting and weekly objectives</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button><button type="button" data-sx-go="vault"><span class="sx-dest-icon" aria-hidden="true">⌘</span><strong>Sovereign Data Vault</strong><small>Export and protect local progress on this device</small><span class="sx-dest-arrow" aria-hidden="true">↗</span></button></div>'+
 '<div class="sx-home-notice">Battle.net connection and private collections stay in the secure My Azeroth portal. Saved plans on this page are local to your browser unless you export them yourself.</div>';
overview.prepend(root);
// Keep the original overview's working character/task/collection metrics, but
// display them ONLY on Home instead of above every separate studio.
const legacyStats=main.querySelector(':scope > .stats');
if(legacyStats)root.after(legacyStats);
function labelFor(id){const b=buttonMap().get(id);return b?b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||id:id}
let recentSignature=null;
function renderRecent(){
 const region=$('sxRecent');if(!region)return;
 const launch=(()=>{try{const v=JSON.parse(localStorage.getItem('nexus_azeroth_quick_launch_v36')||'null');return Array.isArray(v?.pinned)?v.pinned.filter(x=>typeof x==='string').slice(0,3):[]}catch(_){return[]}})();
 const available=buttonMap(),keys=[...new Set([...launch,...data.recent.filter(x=>x!=='overview')])].filter(id=>available.has(id)).slice(0,6);
 const signature=keys.map(id=>id+':'+(launch.includes(id)?'p':'r')).join('|');
 if(signature===recentSignature)return;
 recentSignature=signature;
 region.replaceChildren();
 if(!keys.length){const p=document.createElement('p');p.className='sx-muted';p.textContent='No recent tools yet. Try Character Dominion, Item Atlas, or the Information & Guide.';region.append(p);return}
 for(const id of keys){const btn=document.createElement('button');btn.type='button';btn.dataset.sxGo=id;
  const symbol=document.createElement('span');symbol.className='sx-recent-symbol';symbol.textContent=launch.includes(id)?'★':'↗';
  const label=document.createElement('span');label.textContent=labelFor(id);
  btn.append(symbol,label);region.append(btn);
 }
}
renderRecent();
const toolbar=document.createElement('div');toolbar.className='sx-toolbar';
toolbar.innerHTML='<button type="button" id="sxUpdatesButton" class="sx-tool-button" aria-label="Open Azeroth release updates" title="Azeroth updates"><span aria-hidden="true">♧</span><i id="sxUnread" hidden></i></button><button type="button" id="sxSettingsButton" class="sx-tool-button" aria-label="Open website appearance settings" title="Appearance settings"><span aria-hidden="true">⚙</span></button>';
const chip=top.querySelector('.chip');if(chip)chip.before(toolbar);else top.append(toolbar);
const overlay=document.createElement('div');overlay.id='sxOverlay';overlay.className='sx-overlay';overlay.hidden=true;
overlay.innerHTML='<div class="sx-overlay-scrim" data-sx-close></div><section class="sx-dialog" role="dialog" aria-modal="true" aria-labelledby="sxDialogTitle" tabindex="-1"><div class="sx-dialog-head"><div><span class="sx-eyebrow">NEXUS / SITE EXPERIENCE</span><h2 id="sxDialogTitle">Website settings</h2></div><button type="button" class="sx-close" data-sx-close aria-label="Close panel">×</button></div><div class="sx-dialog-content">'+
 '<div id="sxPreferences"><p class="sx-muted">Personalize the website shell without changing studio functionality, Battle.net permissions or saved gameplay records. Settings remain on this browser.</p><div class="sx-settings-grid">'+
 '<label>Accent style<select data-sx-setting="theme"><option value="gold">Assassin Gold (default)</option><option value="violet">Dominion Violet</option><option value="cyan">Astral Cyan</option></select></label>'+
 '<label>Background visibility<select data-sx-setting="background"><option value="cinematic">Cinematic (default)</option><option value="soft">Softened</option><option value="minimal">Minimal</option></select></label>'+
 '<label>Visual motion<select data-sx-setting="motion"><option value="auto">Respect device setting</option><option value="reduce">Reduce animations</option></select></label>'+
 '<label>Navigation spacing<select data-sx-setting="density"><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>'+
 '<label>Contrast<select data-sx-setting="contrast"><option value="standard">Default</option><option value="high">Higher contrast</option></select></label>'+
 '</div><div class="sx-dialog-actions"><button type="button" id="sxResetSettings">RESTORE DEFAULT APPEARANCE</button></div><p class="sx-help">Changes apply immediately to the site frame and background. Each existing studio retains its own controls and gameplay data.</p></div>'+
 '<div id="sxReleasePanel" hidden><p class="sx-muted" id="sxReleaseStatus">Checking published release details…</p><div class="sx-release-hero"><strong id="sxReleaseVersion">Azeroth companion</strong><span id="sxReleaseSubtitle"></span></div><h3>Latest release highlights</h3><div class="sx-changes" id="sxReleaseChanges"></div><h3>Recent releases</h3><div class="sx-history" id="sxReleaseHistory"></div><div class="sx-dialog-actions"><button type="button" id="sxRefreshRelease">CHECK FOR UPDATES</button><button type="button" class="sx-action-primary" id="sxMarkRead">MARK THIS RELEASE AS READ</button><button type="button" data-sx-go="releases">OPEN RELEASE CENTER</button></div></div>'+
 '</div></section>';
document.body.append(overlay);
function openDialog(type){
 const isRelease=type==='updates';
 lastOpener=document.activeElement;modal=type;overlay.hidden=false;document.body.classList.add('sx-dialog-open');
 $('sxDialogTitle').textContent=isRelease?'Azeroth release updates':'Website settings';
 $('sxPreferences').hidden=isRelease;$('sxReleasePanel').hidden=!isRelease;
 apply();
 overlay.querySelector('.sx-dialog').focus({preventScroll:true});
 if(isRelease)void loadRelease();
}
function closeDialog(){
 if(overlay.hidden)return;overlay.hidden=true;modal=null;document.body.classList.remove('sx-dialog-open');
 if(lastOpener?.isConnected)lastOpener.focus({preventScroll:true});
}
overlay.addEventListener('click',e=>{if(e.target.closest('[data-sx-close]'))closeDialog()});
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();closeDialog();return}
 if(e.key!=='Tab')return;
 const focusable=[...overlay.querySelectorAll('button:not([disabled]):not([hidden]),select:not([disabled]),a[href]')].filter(el=>el.getClientRects().length&&el.closest('[hidden]')===null);
 if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
$('sxUpdatesButton').addEventListener('click',()=>openDialog('updates'));
$('sxSettingsButton').addEventListener('click',()=>openDialog('settings'));
$('sxResetSettings').addEventListener('click',()=>{Object.assign(data,defaults);save();apply()});
overlay.addEventListener('change',e=>{
 const field=e.target.closest('[data-sx-setting]');if(!field)return;
 const k=field.dataset.sxSetting;if(!Object.hasOwn(TYPES,k)||!TYPES[k].includes(field.value))return;
 data[k]=field.value;save();apply();
});
function updateNotice(){
 $('sxUnread').hidden=!version||data.lastSeenVersion===version.version;
 $('sxUpdatesButton').setAttribute('aria-label',version&&data.lastSeenVersion!==version.version?'New Azeroth release '+version.version+'. Open updates':'Open Azeroth release updates');
}
async function loadRelease(force=false){
 if(loadPromise&&!force)return loadPromise;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
 const task=(async()=>{
  try{
   $('sxReleaseStatus').textContent='Checking release metadata…';
   const [vResponse,iResponse]=await Promise.all([fetch('./version.json',{cache:'no-store',signal:controller.signal}),fetch('./releases/index.json',{cache:'no-store',signal:controller.signal})]);
   if(!vResponse.ok||!iResponse.ok)throw Error('Release server unavailable');
   const [v,i]=await Promise.all([vResponse.json(),iResponse.json()]);
   if(!/^\d+\.\d+\.\d+$/.test(v.version)||!Array.isArray(i.releases)||i.releases[0]?.version!==v.version)throw Error('Release records do not agree');
   version={version:v.version,title:text(v.subtitle),date:text(v.release_date),changes:Array.isArray(v.changes)?v.changes.filter(s=>typeof s==='string').slice(0,8):[]};
   releases=i.releases.filter(x=>x&&/^\d+\.\d+\.\d+$/.test(x.version)).slice(0,8);
   $('sxHeroVersion').textContent='Azeroth v'+version.version;
   $('sxHomeRelease').textContent='v'+version.version+' · '+version.title;
   $('sxHomeReleaseNote').textContent=version.changes[0]?text(version.changes[0]):'Open Release Center to read the official changelog.';
   $('sxReleaseStatus').textContent='Published '+(version.date||'date unavailable')+' · GitHub Pages release record';
   $('sxReleaseVersion').textContent='Azeroth v'+version.version;
   $('sxReleaseSubtitle').textContent=version.title;
   $('sxReleaseChanges').replaceChildren();
   for(const change of version.changes){const p=document.createElement('p');p.textContent='✓ '+text(change);$('sxReleaseChanges').append(p)}
   $('sxReleaseHistory').replaceChildren();
   for(const release of releases){const row=document.createElement('div'),name=document.createElement('strong'),day=document.createElement('small');name.textContent='v'+release.version+' · '+text(release.title);day.textContent=text(release.date);row.append(name,day);$('sxReleaseHistory').append(row)}
   updateNotice();
  }catch(_){
   $('sxReleaseStatus').textContent='Cannot confirm the latest published release right now. The rest of Azeroth remains available.';
   if(!version){$('sxHeroVersion').textContent='Release information unavailable';$('sxHomeRelease').textContent='Release information unavailable';$('sxHomeReleaseNote').textContent='Try again using Check for Updates or open the Release Center.'}
  }finally{clearTimeout(timeout)}
 })();
 loadPromise=task;
 try{await task}finally{if(loadPromise===task)loadPromise=null}
}
$('sxRefreshRelease').addEventListener('click',()=>{void loadRelease(true)});
$('sxMarkRead').addEventListener('click',()=>{
 if(!version){$('sxReleaseStatus').textContent='Release verification is unavailable. Recheck before marking as read.';return}
 data.lastSeenVersion=version.version;save();updateNotice();$('sxReleaseStatus').textContent='v'+version.version+' marked as read on this device.';
});
document.addEventListener('click',e=>{
 const action=e.target.closest('[data-sx-go],[data-sx-updates],[data-sx-launcher]');
 if(!action)return;
 if(action.hasAttribute('data-sx-go')){
  const target=action.dataset.sxGo;closeDialog();navigate(target);
 }else if(action.hasAttribute('data-sx-updates'))openDialog('updates');
 else if(action.hasAttribute('data-sx-launcher'))document.querySelector('.azl-trigger')?.click();
});
apply();
document.body.classList.add('sx-ready');updateSelectedView();
$('sxWelcomeTitle').textContent=data.recent.length?'Welcome back to Azeroth.':'Your adventure begins here.';
renderRecent();
void loadRelease();
})();

;/* BUNDLE SOURCE: sovereign-portal.js */
/* NEXUS | AZEROTH v4.5 — SOVEREIGN PORTAL
 * Additional website-shell experience only. No studio data, OAuth or Worker access.
 * Preferences use a separate allowlisted local record; nothing is uploaded.
 */
(()=>{'use strict';
const main=document.querySelector('.main'),nav=document.querySelector('.sidebar .nav'),top=main?.querySelector(':scope > .top');
const home=document.getElementById('sxExperience'),toolbar=top?.querySelector('.sx-toolbar');
if(!main||!nav||!top||!home||!toolbar||document.getElementById('spQuickDeck'))return;
const KEY='nexus_azeroth_portal_v45',MAX=6,DEFAULT=['dominion','atlas','warcraft','guide'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validId=x=>typeof x==='string'&&/^[a-z0-9-]{2,32}$/.test(x);
let state={favorites:[...DEFAULT],tourSeen:false},opener=null,step=0;
function read(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x||typeof x!=='object'||Array.isArray(x))return;
  if(Array.isArray(x.favorites))state.favorites=[...new Set(x.favorites.filter(validId))].slice(0,MAX);
  if(typeof x.tourSeen==='boolean')state.tourSeen=x.tourSeen;
 }catch(_){}
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){/* optional local preferences */}}
read();
const navButtons=()=>[...nav.querySelectorAll('button[data-view]')];
const names=()=>new Map(navButtons().map(b=>[b.dataset.view,b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||b.dataset.view]));
function jump(view){
 if(!validId(view))return;
 const button=navButtons().find(x=>x.dataset.view===view);if(!button)return;
 button.click();window.scrollTo({top:0,behavior:'instant'});
}
function currentView(){return nav.querySelector('button[data-view].active')?.dataset.view||'overview'}
const deck=document.createElement('section');deck.className='sp-deck';deck.id='spQuickDeck';
deck.setAttribute('aria-label','Custom quick access shortcuts');
deck.innerHTML='<div class="sp-deck-top"><div><span class="sx-eyebrow">YOUR COMMAND SHORTCUTS</span><h3>My Quick Deck</h3><p>Keep up to six favorite destinations one tap away. These shortcuts are personal to this browser.</p></div><button type="button" id="spCustomize" aria-expanded="false" aria-controls="spDeckEditor">CUSTOMIZE SHORTCUTS</button></div>'+
 '<div class="sp-deck-buttons" id="spFavorites"></div>'+
 '<div class="sp-deck-editor" id="spDeckEditor" hidden><div class="sp-deck-editor-head"><strong>Choose your quick access tools</strong><span id="spDeckCount" role="status"></span></div><div class="sp-deck-checks" id="spDeckChoices"></div><p class="sp-muted" id="spDeckMessage" role="status">Select up to six destinations. Your existing studios are not modified.</p><div class="sp-deck-footer"><button type="button" id="spResetShortcuts">RESET SHORTCUTS</button><button type="button" id="spDoneShortcuts">DONE</button></div></div>'+
 '<div class="sp-tour-prompt" id="spTourPrompt" hidden><span>New here? Take a short tour of the website, navigation and account safety.</span><div><button type="button" data-sp-tour>START WEBSITE TOUR</button><button type="button" id="spDismissTour">NOT NOW</button></div></div>';
const split=home.querySelector('.sx-home-split');if(split)split.after(deck);else home.append(deck);
function renderDeck(focusId=null){
 const known=names();const choices=[...new Set(state.favorites)].filter(id=>known.has(id));
 // Ignore shortcuts for removed tools and prevent invisible choices consuming a slot.
 if(choices.length!==state.favorites.length){state.favorites=choices;persist()}
 const zone=document.getElementById('spFavorites');zone.replaceChildren();
 if(!choices.length){
  const p=document.createElement('p');p.className='sp-muted';p.textContent='No shortcuts chosen. Select Customize Shortcuts to add your favorite destinations.';zone.append(p);
 }
 for(const id of choices){
  const btn=document.createElement('button');btn.type='button';btn.dataset.spGo=id;
  const symbol=document.createElement('span');symbol.setAttribute('aria-hidden','true');symbol.className='sp-deck-icon';symbol.textContent='✦';
  const label=document.createElement('span');label.className='sp-deck-label';label.textContent=known.get(id);
  const arrow=document.createElement('span');arrow.className='sp-deck-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
  btn.append(symbol,label,arrow);zone.append(btn);
 }
 const choicesWrap=document.getElementById('spDeckChoices');
 // Keep checkbox elements mounted across selections: do not reset focus, scroll
 // position or touch state just because a different shortcut was checked.
 const knownKeys=[...known.keys()].join('|');
 if(choicesWrap.dataset.spKeys!==knownKeys){
  choicesWrap.replaceChildren();
  choicesWrap.dataset.spKeys=knownKeys;
  for(const [id,name]of known){
   const label=document.createElement('label');label.className='sp-deck-choice';
   const check=document.createElement('input');check.type='checkbox';check.dataset.spFavorite=id;
   const title=document.createElement('span');title.textContent=name;
   label.append(check,title);choicesWrap.append(label);
  }
 }
 for(const check of choicesWrap.querySelectorAll('input[data-sp-favorite]')){
  const checked=choices.includes(check.dataset.spFavorite);
  if(check.checked!==checked)check.checked=checked;
  check.disabled=!checked&&choices.length>=MAX;
 }
 document.getElementById('spDeckCount').textContent=choices.length+' / '+MAX+' selected';
 // Preserve keyboard focus even after a future tool inventory changes.
 if(focusId&&document.activeElement?.dataset?.spFavorite!==focusId&&document.getElementById('spDeckEditor')?.hidden===false)
  [...choicesWrap.querySelectorAll('input[data-sp-favorite]')].find(x=>x.dataset.spFavorite===focusId)?.focus({preventScroll:true});
}
function editing(open){
 const editor=document.getElementById('spDeckEditor');editor.hidden=!open;
 const trigger=document.getElementById('spCustomize');trigger.setAttribute('aria-expanded',String(open));
 if(open){renderDeck();editor.querySelector('input:not([disabled])')?.focus({preventScroll:true})}
 else trigger.focus({preventScroll:true});
}
document.getElementById('spCustomize').addEventListener('click',()=>{
 const editor=document.getElementById('spDeckEditor');editing(editor.hidden);
});
document.getElementById('spDoneShortcuts').addEventListener('click',()=>editing(false));
document.getElementById('spResetShortcuts').addEventListener('click',()=>{
 state.favorites=[...DEFAULT].filter(x=>names().has(x));persist();renderDeck();
 document.getElementById('spDeckMessage').textContent='Your default shortcuts were restored. All tools remain available in navigation.';
});
document.getElementById('spDeckChoices').addEventListener('change',e=>{
 const input=e.target.closest('input[data-sp-favorite]');if(!input)return;
 const id=input.dataset.spFavorite;if(!validId(id)||!names().has(id))return;
 if(input.checked&&!state.favorites.includes(id)){
  if(state.favorites.length>=MAX){input.checked=false;document.getElementById('spDeckMessage').textContent='Maximum six shortcuts. Uncheck an existing item first.';return}
  state.favorites.push(id);
 }else if(!input.checked)state.favorites=state.favorites.filter(x=>x!==id);
 persist();renderDeck(id);
 document.getElementById('spDeckMessage').textContent='Shortcuts updated on this device.';
});
deck.addEventListener('click',e=>{const b=e.target.closest('[data-sp-go]');if(b)jump(b.dataset.spGo)});
renderDeck();
const context=document.createElement('nav');context.className='sp-contextbar';context.id='spContext';context.setAttribute('aria-label','Current page and return home');
context.innerHTML='<div class="sp-context-location"><span aria-hidden="true">⌂</span><span>NEXUS / AZEROTH</span><span aria-hidden="true">/</span><strong id="spCurrentView">Home</strong></div><div class="sp-context-actions"><button type="button" id="spContextHome">RETURN HOME</button></div>';
top.after(context);
document.getElementById('spContextHome').addEventListener('click',()=>jump('overview'));
let contextFrame=0,lastContextView=null;
function refreshContext(){
 const view=currentView();
 if(view===lastContextView)return;
 lastContextView=view;
 const label=names().get(view)||'Companion tool';
 const p=document.getElementById('spCurrentView');
 if(p.textContent!==label)p.textContent=label;
 const hide=view==='overview';
 if(context.hidden!==hide)context.hidden=hide;
}
function scheduleContext(){
 if(contextFrame)return;
 contextFrame=requestAnimationFrame(()=>{contextFrame=0;refreshContext()});
}
nav.addEventListener('click',e=>{if(e.target.closest('button[data-view]'))scheduleContext()});
const observer=new MutationObserver(rs=>{
 if(rs.some(r=>r.attributeName==='class'))scheduleContext();
});
observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
document.addEventListener('nexus:view-activated',scheduleContext);
refreshContext();
const online=document.createElement('div');online.className='sp-offline';online.id='spOffline';online.setAttribute('role','status');online.textContent='Your device appears offline. Saved planning tools may still be available, but Blizzard lookups and release checks require a connection.';
top.after(online);
function connection(){online.hidden=navigator.onLine!==false}
window.addEventListener('online',connection);window.addEventListener('offline',connection);connection();
const tour=[
 {title:'Welcome to the Sovereign Portal',body:'The new Home keeps your most useful destinations together. You can explore without signing in; planning records stay in your browser.',target:'overview',action:'OPEN HOME'},
 {title:'Discover everything without clutter',body:'On desktop, expand the navigation groups in the sidebar. On iPhone, use All Tools. You can always search studios in the Command Launcher.',target:'guide',action:'OPEN PLAYER GUIDE'},
 {title:'Make the homepage yours',body:'Use My Quick Deck to keep up to six destinations ready for your next visit. These preferences do not affect saved character or item records.',target:null,action:null},
 {title:'Keep account data separate',body:'My Azeroth opens the secure Battle.net portal. Only Blizzard can authenticate a player. Manual planning records are never presented as verified inventory.',target:'personal',action:'OPEN MY AZEROTH'},
 {title:'Back up before moving devices',body:'Sovereign Data Vault can export selected local planner records into a JSON file. Use it before switching browsers or clearing device storage.',target:'vault',action:'OPEN DATA VAULT'}
];
const overlay=document.createElement('div');overlay.className='sp-tour-overlay';overlay.hidden=true;overlay.id='spTour';
overlay.innerHTML='<div class="sp-tour-shade" data-sp-close></div><section class="sp-tour-dialog" role="dialog" aria-modal="true" aria-labelledby="spTourTitle" tabindex="-1"><div class="sp-tour-head"><span class="sx-eyebrow">NEXUS / WEBSITE TOUR</span><button type="button" class="sp-tour-close" data-sp-close aria-label="Close website tour">×</button></div><div class="sp-tour-progress" id="spTourProgress"></div><h2 id="spTourTitle">Welcome</h2><p id="spTourBody"></p><div class="sp-tour-actions"><button type="button" id="spTourBack">BACK</button><button type="button" id="spTourGo" hidden>OPEN FEATURE</button><button type="button" class="sp-tour-next" id="spTourNext">NEXT</button></div><p class="sp-tour-hint">Optional orientation · no permissions or account changes</p></section>';
document.body.append(overlay);
function renderTour(){
 const item=tour[step],progress=document.getElementById('spTourProgress');
 progress.replaceChildren();
 for(let n=0;n<tour.length;n++){const bar=document.createElement('span');if(n<=step)bar.className='active';progress.append(bar)}
 document.getElementById('spTourTitle').textContent=item.title;
 document.getElementById('spTourBody').textContent=item.body;
 document.getElementById('spTourBack').disabled=step===0;
 document.getElementById('spTourNext').textContent=step===tour.length-1?'FINISH TOUR':'NEXT';
 const action=document.getElementById('spTourGo');action.hidden=!item.target;
 if(item.target)action.textContent=item.action;
}
function dismiss(){
 if(overlay.hidden)return;
 overlay.hidden=true;document.body.classList.remove('sp-tour-open');
 state.tourSeen=true;persist();updatePrompt();
 if(opener&&opener.isConnected)opener.focus({preventScroll:true});
}
function startTour(){
 opener=document.activeElement;step=0;renderTour();
 overlay.hidden=false;document.body.classList.add('sp-tour-open');
 overlay.querySelector('.sp-tour-close')?.focus({preventScroll:true});
}
function updatePrompt(){document.getElementById('spTourPrompt').hidden=state.tourSeen}
const help=document.createElement('button');help.type='button';help.id='spTourButton';help.className='sx-tool-button';help.setAttribute('aria-label','Start guided website tour');help.title='Website tour';help.textContent='?';toolbar.append(help);
help.addEventListener('click',startTour);
deck.addEventListener('click',e=>{if(e.target.closest('[data-sp-tour]'))startTour()});
document.getElementById('spDismissTour').addEventListener('click',()=>{
 state.tourSeen=true;persist();updatePrompt();
});
overlay.addEventListener('click',e=>{if(e.target.closest('[data-sp-close]'))dismiss()});
document.getElementById('spTourBack').addEventListener('click',()=>{step=Math.max(0,step-1);renderTour()});
document.getElementById('spTourNext').addEventListener('click',()=>{
 if(step===tour.length-1){dismiss();return}
 step++;renderTour();
});
document.getElementById('spTourGo').addEventListener('click',()=>{
 const target=tour[step].target;dismiss();if(target)jump(target);
});
document.addEventListener('keydown',e=>{
 if(overlay.hidden)return;
 if(e.key==='Escape'){e.preventDefault();dismiss();return}
 if(e.key!=='Tab')return;
 const focusables=[...overlay.querySelectorAll('button:not([disabled]):not([hidden])')].filter(el=>el.getClientRects().length);
 if(!focusables.length)return;
 const first=focusables[0],last=focusables[focusables.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});
updatePrompt();
window.addEventListener('pageshow',()=>{refreshContext();connection();renderDeck()});
document.body.classList.add('sp-portal-ready');
})();

;/* BUNDLE SOURCE: sovereign-command-v5.js */
/* NEXUS | AZEROTH v5.0 — SOVEREIGN COMMAND EXPERIENCE
 * Website presentation and discovery only. No studio storage, Blizzard tokens,
 * authenticated calls, character inventories, or account permissions.
 */
(()=>{'use strict';
const home=document.getElementById('sxExperience');
const nav=document.querySelector('.sidebar .nav');
const main=document.querySelector('main.main');
const prefs=document.getElementById('sxPreferences');
const toolbar=document.querySelector('.main .top .sx-toolbar');
if(!home||!nav||!main||!prefs||!toolbar||document.getElementById('nxCommandV5'))return;
const KEY='nexus_azeroth_sovereign_v5';
const presets={text:'standard',home:'cinematic',journey:'new'};
const allowed={text:['standard','comfortable','large'],home:['cinematic','quiet'],journey:['new','returning','group']};
let data={...presets};
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
  for(const [name,options]of Object.entries(allowed))if(options.includes(raw[name]))data[name]=raw[name];
 }
}catch(_){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(_){/* personal site preferences are optional */}};
function apply(){
 document.body.dataset.nxText=data.text;
 document.body.dataset.nxHome=data.home;
 for(const input of document.querySelectorAll('[data-nx-setting]')){
  const key=input.dataset.nxSetting;
  if(Object.hasOwn(allowed,key)&&input.value!==data[key])input.value=data[key];
 }
}
const paths={
 new:{
  eyebrow:'DISCOVER YOUR COMPANION',
  title:'Start with the essentials',
  detail:'Learn which records are manual, explore your tools, and build your first goals without needing a Battle.net login.',
  steps:[
   ['guide','Read the player guide','Understand account connection, collections, and which features use official public data'],
   ['characters','Create a character profile','Organize an optional local character roster and basic planning notes'],
   ['atlas','Discover items','Research items and start recording goals without assuming Blizzard ownership']
  ]
 },
 returning:{
  eyebrow:'CONTINUE YOUR JOURNEY',
  title:'Pick up your next objective',
  detail:'Return to saved planning records and prepare your next activities. Everything here is local to this browser unless you exported it.',
  steps:[
   ['dominion','Open Character Dominion','Review manually tracked priorities and recently recorded activity'],
   ['command','Review progress','Find the next unfinished planning objectives and revisit saved goals'],
   ['vault','Protect your data','Export selected local planning records before moving browsers or devices']
  ]
 },
 group:{
  eyebrow:'PLAN WITH FRIENDS',
  title:'Prepare your next adventure',
  detail:'Use planning tools together, then share decisions with friends yourself. Local records are not synchronized automatically.',
  steps:[
   ['warcraft','Open War Room','Review activities, routes and preparation tools before the group meets'],
   ['dungeons','Review dungeon planning','Check available route and encounter planning tools'],
   ['guide','Use the group-play guide','See practical examples for preparing with friends']
  ]
 }
};
const existing=()=>new Map([...nav.querySelectorAll('button[data-view]')].map(b=>[
 b.dataset.view,b.textContent.replace(/^[^a-zA-Z0-9]+/,'').trim()||b.dataset.view
]));
function openTool(id){
 const btn=[...nav.querySelectorAll('button[data-view]')].find(b=>b.dataset.view===id);
 if(btn){btn.click();window.scrollTo({top:0,behavior:'instant'})}
}
const section=document.createElement('section');
section.id='nxCommandV5';section.className='nx-command-v5';
section.setAttribute('aria-labelledby','nxCommandHeading');
section.innerHTML='<div class="nx-command-top"><div><span class="sx-eyebrow">NEXUS / SOVEREIGN COMMAND v5</span><h3 id="nxCommandHeading">Choose your journey</h3><p>Every player can begin at a different point. These are guided shortcuts into the tools already available in Azeroth.</p></div><button type="button" id="nxFindTools">FIND ANY TOOL <span aria-hidden="true">⌕</span></button></div>'+
 '<div class="nx-path-tabs" role="group" aria-label="Choose a website journey">'+
 '<button type="button" data-nx-journey="new" aria-pressed="false"><span aria-hidden="true">✦</span> NEW PLAYER</button>'+
 '<button type="button" data-nx-journey="returning" aria-pressed="false"><span aria-hidden="true">◈</span> RETURNING PLAYER</button>'+
 '<button type="button" data-nx-journey="group" aria-pressed="false"><span aria-hidden="true">♜</span> PLAYING WITH FRIENDS</button>'+
 '</div><div class="nx-command-story" id="nxCommandStory"><span class="sx-eyebrow" id="nxJourneyEyebrow"></span><h4 id="nxJourneyTitle"></h4><p id="nxJourneyDetail"></p><div id="nxJourneySteps" class="nx-journey-steps"></div></div>'+
 '<div class="nx-command-trust"><span><strong>Local planning</strong> — saved in this browser</span><span><strong>Blizzard account</strong> — separate secure My Azeroth portal</span><span><strong>Updates</strong> — published release information</span></div>';
const split=home.querySelector('.sx-home-split');
if(split)home.insertBefore(section,split);else home.append(section);
function renderJourney(){
 const selected=paths[data.journey];
 for(const btn of section.querySelectorAll('[data-nx-journey]'))
  btn.setAttribute('aria-pressed',String(btn.dataset.nxJourney===data.journey));
 document.getElementById('nxJourneyEyebrow').textContent=selected.eyebrow;
 document.getElementById('nxJourneyTitle').textContent=selected.title;
 document.getElementById('nxJourneyDetail').textContent=selected.detail;
 const steps=document.getElementById('nxJourneySteps');steps.replaceChildren();
 const names=existing();
 for(const [id,label,description]of selected.steps){
  if(!names.has(id))continue; // avoid dead links if a studio is retired
  const btn=document.createElement('button');btn.type='button';btn.dataset.nxGo=id;
  const top=document.createElement('strong');top.textContent=label;
  const sub=document.createElement('small');sub.textContent=description;
  const arrow=document.createElement('span');arrow.className='nx-step-arrow';
  arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';
  btn.append(top,sub,arrow);steps.append(btn);
 }
}
section.addEventListener('click',event=>{
 const tab=event.target.closest('[data-nx-journey]');
 if(tab){
  if(allowed.journey.includes(tab.dataset.nxJourney)){
   data.journey=tab.dataset.nxJourney;save();renderJourney();
  }
  return;
 }
 const action=event.target.closest('[data-nx-go]');
 if(action)openTool(action.dataset.nxGo);
});
document.getElementById('nxFindTools').addEventListener('click',()=>document.querySelector('.azl-trigger')?.click());
renderJourney();

// Accessible navigation: a skip link, meaningful page titles and a concise
// announcement when the active studio changes. Never move focus away while
// players are typing or using studio controls.
main.id=main.id||'nxMain';
main.setAttribute('tabindex','-1');
const skip=document.createElement('a');
skip.className='nx-skip-link';skip.href='#'+main.id;skip.textContent='Skip to main content';
document.body.insertBefore(skip,document.body.firstChild);
skip.addEventListener('click',event=>{
 event.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({behavior:'instant',block:'start'});
});
const announcer=document.createElement('div');
announcer.id='nxPageAnnouncer';announcer.className='nx-screen-reader-only';
announcer.setAttribute('role','status');announcer.setAttribute('aria-live','polite');
announcer.setAttribute('aria-atomic','true');document.body.append(announcer);
const baseTitle='NEXUS | AZEROTH COMPANION';
let current='';
function synchronizeLocation(view){
 if(typeof view!=='string'||view===current)return;
 const names=existing();
 if(!names.has(view))return;
 current=view;
 const title=names.get(view);
 document.title=view==='overview'?baseTitle:title+' | NEXUS AZEROTH';
 for(const button of nav.querySelectorAll('button[data-view]')){
  if(button.dataset.view===view)button.setAttribute('aria-current','page');
  else button.removeAttribute('aria-current');
 }
 if(view!=='overview')announcer.textContent=title+' section opened';
}
function syncCurrent(){
 const active=nav.querySelector('button[data-view].active');
 synchronizeLocation(active?.dataset.view||'overview');
}
document.addEventListener('nexus:view-activated',event=>synchronizeLocation(event.detail?.view));
syncCurrent();

// Site-shell-only display options. Existing studio themes and local gameplay
// settings remain unchanged; these preferences are scoped to website UI.
const box=document.createElement('fieldset');box.className='nx-display-settings';
box.innerHTML='<legend>v5 Experience & readability</legend>'+
 '<label>Website text comfort<select data-nx-setting="text">'+
 '<option value="standard">Standard</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label>'+
 '<label>Homepage atmosphere<select data-nx-setting="home">'+
 '<option value="cinematic">Cinematic</option><option value="quiet">Quiet and focused</option></select></label>'+
 '<p>These choices affect website navigation, home cards and guidance—not studio data, Blizzard account access, or gameplay.</p>';
const controls=prefs.querySelector('.sx-settings-grid');
if(controls)controls.after(box);else prefs.append(box);
box.addEventListener('change',event=>{
 const field=event.target.closest('[data-nx-setting]');if(!field)return;
 const key=field.dataset.nxSetting;
 if(!Object.hasOwn(allowed,key)||!allowed[key].includes(field.value))return;
 data[key]=field.value;save();apply();
});
document.getElementById('sxResetSettings')?.addEventListener('click',()=>{
 data={...presets};save();apply();renderJourney();
});
apply();
const search=document.querySelector('.azl-trigger');
if(search)search.setAttribute('aria-keyshortcuts','Control+K Meta+K');

// A discreet return-to-top affordance for long desktop/mobile pages.
const toTop=document.createElement('button');toTop.type='button';
toTop.id='nxToTop';toTop.className='nx-to-top';toTop.textContent='↑';
toTop.title='Return to top';toTop.setAttribute('aria-label','Return to top');
toTop.hidden=true;document.body.append(toTop);
toTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
let scrollFrame=0;
function checkScroll(){
 scrollFrame=0;
 const shown=window.scrollY>640;
 if(toTop.hidden===shown)toTop.hidden=!shown;
}
window.addEventListener('scroll',()=>{
 if(scrollFrame)return;
 scrollFrame=requestAnimationFrame(checkScroll);
},{passive:true});
document.addEventListener('nexus:view-activated',()=>requestAnimationFrame(checkScroll));
checkScroll();
document.body.classList.add('nx-v5-ready');
})();

;/* BUNDLE SOURCE: talent-canvas-v5.3.js */
/* NEXUS Talent Canvas v5.3: display-only controls; allocation data is untouched. */
(() => {
 'use strict';
 const host = document.getElementById('tfTree');
 if (!host || document.getElementById('tfCanvasTools')) return;
 const bar = document.createElement('div');
 bar.id = 'tfCanvasTools';
 bar.className = 'tf-canvas-tools';
 bar.innerHTML = '<div class="tf-canvas-title"><span class="tf-canvas-emblem" aria-hidden="true">✦</span><div><strong>Talent Atlas</strong><small>Drag to explore · Tap a talent to edit</small></div></div><div class="tf-canvas-actions"><button type="button" data-canvas="out" aria-label="Zoom out">−</button><span id="tfCanvasZoom" aria-live="polite">100%</span><button type="button" data-canvas="in" aria-label="Zoom in">+</button><button type="button" data-canvas="fit">FIT</button><button type="button" data-canvas="reset">RESET</button></div><div class="tf-minimap-wrap"><canvas id="tfCanvasMap" width="170" height="98" aria-label="Tree overview; tap or click to navigate"></canvas><small>Tap map to jump</small></div>';
 host.before(bar);
 const map = bar.querySelector('canvas');
 const zoomLabel = document.getElementById('tfCanvasZoom');
 const positions = new Map();
 let scale = 1, stage = null, grid = null, dragging = null, pinch = null;
 let painting = false, paintToken = 0;
 let blockClick = false;
 const limit = (v, a, b) => Math.max(a, Math.min(b, v));
 const category = () => document.querySelector('[data-tf-tab].active')?.dataset.tfTab || 'class';
 const layout = () => document.getElementById('tfLayout')?.value || 'grid';
 const key = () => category() + ':' + (document.getElementById('tfHeroTree')?.value || 'all');
 const active = () => !!grid && grid.isConnected && !!stage && stage.isConnected;
 function geometry() {
  if (!active()) return {w:1,h:1};
  return {w:Math.max(grid.scrollWidth, grid.offsetWidth, 1), h:Math.max(grid.scrollHeight, grid.offsetHeight, 1)};
 }
 function applyScale(value, center) {
  if (!active()) return;
  const prev = scale;
  const oldX = (host.scrollLeft + (center?.x ?? host.clientWidth / 2)) / prev;
  const oldY = (host.scrollTop + (center?.y ?? host.clientHeight / 2)) / prev;
  scale = limit(Math.round(value * 100)/100, .25, 1.4);
  const {w,h} = geometry();
  grid.style.transform = 'scale(' + scale + ')';
  stage.style.width = (w * scale) + 'px';
  stage.style.height = (h * scale) + 'px';
  zoomLabel.textContent = Math.round(scale * 100) + '%';
  host.scrollLeft = oldX * scale - (center?.x ?? host.clientWidth / 2);
  host.scrollTop = oldY * scale - (center?.y ?? host.clientHeight / 2);
  drawMap();
 }
 function fit() {
  if (!active()) return;
  const {w,h} = geometry();
  applyScale(limit(Math.min((host.clientWidth - 16)/w, (host.clientHeight - 12)/h), .25, 1.4), {x:0,y:0});
  host.scrollTo({left:0,top:0,behavior:'instant'});
  drawMap();
 }
 function reset() { if (active()) {applyScale(1,{x:0,y:0});host.scrollTo({left:0,top:0,behavior:'instant'});drawMap();} }
 function savePosition() { if (active()) positions.set(key(),{x:host.scrollLeft,y:host.scrollTop,scale}); }
 function install() {
  const next = host.querySelector('.tf-positioned');
  bar.hidden = !next;
  host.classList.toggle('tf-canvas-active', !!next);
  if (!next) {grid=null;stage=null;dragging=null;return;}
  if (grid === next && active()) return;
  grid = next;
  stage = document.createElement('div');
  stage.className = 'tf-canvas-stage';
  grid.parentNode.insertBefore(stage,grid);
  stage.appendChild(grid);
  const prior = positions.get(key());
  scale = prior?.scale ?? (matchMedia('(max-width:760px)').matches ? .72 : .88);
  grid.style.transformOrigin = '0 0';
  grid.style.transform = 'scale(' + scale + ')';
  zoomLabel.textContent = Math.round(scale*100)+'%';
  requestAnimationFrame(() => {
   if (!active()) return;
   const {w,h} = geometry();
   stage.style.width = (w * scale) + 'px';
   stage.style.height = (h * scale) + 'px';
   zoomLabel.textContent = Math.round(scale*100)+'%';
   if (prior) host.scrollTo({left:prior.x,top:prior.y,behavior:'instant'});
   drawMap();
  });
 }
 function drawMap() {
  if (painting) return;
  painting = true;
  cancelAnimationFrame(paintToken);
  paintToken = requestAnimationFrame(() => {
   painting = false;
   const ctx = map.getContext('2d'); if (!ctx) return;
   const W=map.width,H=map.height;
   ctx.clearRect(0,0,W,H);
   ctx.fillStyle='#0b1525';ctx.fillRect(0,0,W,H);
   if (!active()) return;
   const {w,h}=geometry(), k=Math.min((W-12)/w,(H-12)/h),ox=(W-w*k)/2,oy=(H-h*k)/2;
   map._atlas={w,h,k,ox,oy};
   const nodes=grid.querySelectorAll('[data-tf-node]');
   for (const n of nodes) {
    const x=ox+n.offsetLeft*k,y=oy+n.offsetTop*k;
    ctx.fillStyle=n.classList.contains('tf-selected')?'#f5c77f':'#5d8397';
    ctx.fillRect(x,y,Math.max(2,n.offsetWidth*k),Math.max(2,n.offsetHeight*k));
   }
   const vx=ox+host.scrollLeft/scale*k,vy=oy+host.scrollTop/scale*k;
   ctx.strokeStyle='#f3d59a';ctx.lineWidth=1.5;
   ctx.strokeRect(vx,vy,Math.min(w,host.clientWidth/scale)*k,Math.min(h,host.clientHeight/scale)*k);
  });
 }
 function onMap(event) {
  if (!active() || !map._atlas) return;
  const r=map.getBoundingClientRect(),p=map._atlas;
  const x=(event.clientX-r.left)*map.width/r.width,y=(event.clientY-r.top)*map.height/r.height;
  host.scrollLeft=limit(((x-p.ox)/p.k)*scale-host.clientWidth/2,0,host.scrollWidth-host.clientWidth);
  host.scrollTop=limit(((y-p.oy)/p.k)*scale-host.clientHeight/2,0,host.scrollHeight-host.clientHeight);
  savePosition();drawMap();
 }
 map.addEventListener('click',onMap);
 map.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();const rect=map.getBoundingClientRect();onMap({clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2})}});
 map.tabIndex=0;map.setAttribute('role','button');
 bar.addEventListener('click',e=>{
  const button=e.target.closest('button[data-canvas]');if(!button)return;
  const action=button.dataset.canvas;
  if(action==='in')applyScale(scale+.15);
  if(action==='out')applyScale(scale-.15);
  if(action==='fit')fit();
  if(action==='reset')reset();
  savePosition();
 });
 const interactive = target => !!target.closest('button,select,input,textarea,a,label,[contenteditable],.tf-node-controls,.tf-source-actions,.tf-choice');
 host.addEventListener('pointerdown',e=>{
  if (!active() || (e.pointerType==='mouse'&&e.button!==0) || interactive(e.target)) return;
  if (dragging) return;
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,left:host.scrollLeft,top:host.scrollTop,moved:false};
  host.setPointerCapture(e.pointerId);
  host.classList.add('tf-is-dragging');
 },{passive:true});
 host.addEventListener('pointermove',e=>{
  if(!dragging||dragging.id!==e.pointerId)return;
  const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
  if(Math.abs(dx)+Math.abs(dy)>6)dragging.moved=true;
  if(!dragging.moved)return;
  host.scrollLeft=dragging.left-dx;host.scrollTop=dragging.top-dy;
  drawMap();
 },{passive:true});
 function finish(e) {
  if (!dragging || dragging.id!==e.pointerId)return;
  if (dragging.moved) {blockClick=true;savePosition();setTimeout(()=>{blockClick=false},0);}
  dragging=null;host.classList.remove('tf-is-dragging');
 }
 host.addEventListener('pointerup',finish);
 host.addEventListener('pointercancel',finish);
 host.addEventListener('lostpointercapture',()=>{dragging=null;host.classList.remove('tf-is-dragging')});
 host.addEventListener('click',e=>{if(blockClick){e.preventDefault();e.stopImmediatePropagation();blockClick=false;}},true);
 host.addEventListener('scroll',()=>{drawMap();if(!dragging)savePosition();},{passive:true});
 host.addEventListener('wheel',e=>{
  if(!active() || !(e.ctrlKey||e.metaKey))return;
  e.preventDefault();
  const box=host.getBoundingClientRect();
  applyScale(scale+(e.deltaY<0?.08:-.08),{x:e.clientX-box.left,y:e.clientY-box.top});
  savePosition();
 },{passive:false});
 const observer = new MutationObserver(()=>{
  const next=host.querySelector('.tf-positioned');
  if (next && next===grid && stage?.contains(next))return;
  if(active())savePosition();
  requestAnimationFrame(install);
 });
 observer.observe(host,{childList:true});
 document.querySelectorAll('[data-tf-tab]').forEach(b=>b.addEventListener('click',savePosition,true));
 document.getElementById('tfHeroTree')?.addEventListener('change',savePosition,true);
 const resize=()=>{requestAnimationFrame(()=>{if(active()){const {w,h}=geometry();stage.style.width=w*scale+'px';stage.style.height=h*scale+'px';drawMap();}})};
 window.addEventListener('resize',resize,{passive:true});
 install();
})();
