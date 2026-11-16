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

// v5.4 read-only UI bridge; never exposes OAuth credentials or modifies draft values.
window.NexusTalentSourceBridge=Object.freeze({
 snapshot(){
  const pools=groups();
  const current=active==='hero'&&heroSelection!=='all'?(tree?.hero_talent_trees?.[Number(heroSelection)]?.hero_talent_nodes||[]):pools[active];
  const list=allNodes();
  const byId=new Map(list.map(n=>[String(n.id),n]));
  const edges=list.flatMap(n=>Array.isArray(n.locked_by)?n.locked_by.map(ref=>{
   const from=Number(typeof ref==='object'&&ref!==null?(ref.id??ref.node_id):ref);
   return Number.isSafeInteger(from)&&from>0?{from,to:Number(n.id),resolved:byId.has(String(from))}:null;
  }).filter(Boolean):[]);
  return {region:loadedRegion,identity,active,ready:!!tree,
   allocations:{...draft},choiceByNode:{...choices},
   savedDrafts:saved.filter(x=>x.identity===identity).map(x=>({name:x.name,savedAt:x.savedAt,rankByNode:{...x.rankByNode},choiceByNode:{...x.choiceByNode}})),
   linkEdges:edges,
   catalog:list.map(n=>{const rank=Array.isArray(n.ranks)?n.ranks[0]:null;const choice=Array.isArray(rank?.choice_of_tooltips)?rank.choice_of_tooltips[0]:null;const tip=choice?.spell_tooltip||rank?.tooltip?.spell_tooltip||{};return{id:Number(n.id),name:nodeName(n),max:maxRanks(n),category:groups().class.some(x=>Number(x.id)===Number(n.id))?'class':groups().spec.some(x=>Number(x.id)===Number(n.id))?'spec':'hero',display_row:Number.isSafeInteger(n.display_row)?n.display_row:null,display_col:Number.isSafeInteger(n.display_col)?n.display_col:null,default_points:Number.isSafeInteger(n.default_points)?n.default_points:null,spellId:detailId(tip.spell?.id),talentId:detailId(choice?.talent?.id??rank?.tooltip?.talent?.id),summary:typeof tip.description==='string'?tip.description.slice(0,600):''}}),
   nodes:current.map(n=>{
   const planned=Number(draft[String(n.id)]||0),rankList=Array.isArray(n.ranks)?n.ranks:[];
   const chosen=Number(choices[String(n.id)]||0);
   return {id:Number(n.id),name:nodeName(n,Math.max(0,planned-1)),planned,max:maxRanks(n),
    ranks:rankList.map((r,i)=>{
     const choiceList=Array.isArray(r.choice_of_tooltips)&&r.choice_of_tooltips.length?r.choice_of_tooltips:[null];
     return {rank:i+1,choices:choiceList.map((entry,j)=>{
      const spell=entry?.spell_tooltip||r?.tooltip?.spell_tooltip||{};
      return {index:j,name:entry?.talent?.name||spell?.spell?.name||r?.tooltip?.talent?.name||n.name||'Talent',
       spellId:detailId(spell?.spell?.id),talentId:detailId(entry?.talent?.id??r?.tooltip?.talent?.id),
       description:typeof spell.description==='string'?spell.description:''};
     })};
    }),choice:chosen};
  })};
 }
});
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
 // Preserve the current viewport before the legacy rank buttons rebuild the tree.
 // This is captured before their delegated bubbling handler calls render().
 host.addEventListener('click',e=>{
  if(active() && e.target.closest('[data-tf-inc],[data-tf-dec],[data-tf-inspect],[data-tf-relations]'))savePosition();
 },true);
 host.addEventListener('change',e=>{if(active()&&e.target.closest('[data-tf-choice]'))savePosition()},true);
 host.addEventListener('pointerdown',e=>{
  if(!active() || (e.pointerType==='mouse'&&e.button!==0) || interactive(e.target) || dragging)return;
  dragging={id:e.pointerId,x:e.clientX,y:e.clientY,left:host.scrollLeft,top:host.scrollTop,moved:false,captured:false};
  // Do not capture immediately: native buttons and inspector click actions
  // need ordinary pointerup/click delivery until an actual pan starts.
 },{passive:true});
 host.addEventListener('pointermove',e=>{
  if(!dragging||dragging.id!==e.pointerId)return;
  const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
  if(!dragging.moved&&(Math.abs(dx)+Math.abs(dy)>9)){
   dragging.moved=true;
   try{host.setPointerCapture(e.pointerId);dragging.captured=true}catch(_){}
   host.classList.add('tf-is-dragging');
  }
  if(!dragging.moved)return;
  host.scrollLeft=dragging.left-dx;host.scrollTop=dragging.top-dy;
  drawMap();
 },{passive:true});
 function finish(e){
  if(!dragging||dragging.id!==e.pointerId)return;
  if(dragging.moved){
   blockClick=true;savePosition();
   setTimeout(()=>{blockClick=false},100);
  }
  if(dragging.captured){try{host.releasePointerCapture(e.pointerId)}catch(_){}}
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

;/* BUNDLE SOURCE: talent-source-plus-v5.4.js */
/* NEXUS | AZEROTH COMPANION v5.4 — source-only talent media + comparative research.
 * Optional Blizzard spell media. No simulated DPS, invented icons or game-valid claims.
 */
(()=>{
 'use strict';
 const tree=document.getElementById('tfTree'),source=document.getElementById('tfSourceIntel'),bridge=window.NexusTalentSourceBridge;
 if(!tree||!source||!bridge||document.getElementById('tfCompareLab'))return;
 const API='https://nexus-azeroth-api.zevromxr.workers.dev';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999?Number(x):null;
 const lab=document.createElement('section');lab.id='tfCompareLab';lab.className='panel tf-compare-lab';
 lab.innerHTML='<div class="tf-lab-heading"><div><span class="wow-kicker">NEXUS / OFFICIAL DATA COMPARISON</span><h3>Talent & Gear Comparison Studio</h3><p>Compare Blizzard-returned rank descriptions, precise talent IDs, allocated points, and item properties. Numbers reflect source records only—not predicted combat performance.</p></div><span class="tf-lab-tag">SOURCE VERIFIED</span></div>'+
 '<div class="tf-lab-section"><h4>Talent side-by-side</h4><div class="tf-lab-controls"><label>Talent A<select id="tfLabTalentA"><option value="">Choose a talent</option></select></label><label>Rank<select id="tfLabRankA"></select></label><label>Talent B<select id="tfLabTalentB"><option value="">Choose a talent</option></select></label><label>Rank<select id="tfLabRankB"></select></label></div><div id="tfLabTalentResults" class="tf-lab-pair" role="status" aria-live="polite">Load a Blizzard tree to compare talents.</div></div>'+
 '<div class="tf-lab-section"><h4>Item properties & stat comparison</h4><form id="tfLabGearForm" class="tf-lab-controls tf-lab-gear"><label>Blizzard item ID A<input id="tfLabItemA" type="number" min="1" max="9999999999" step="1" inputmode="numeric" required placeholder="First item ID"></label><label>Blizzard item ID B<input id="tfLabItemB" type="number" min="1" max="9999999999" step="1" inputmode="numeric" required placeholder="Second item ID"></label><button type="submit">COMPARE ITEMS</button></form><div id="tfLabGearResults" class="tf-lab-results" role="status" aria-live="polite">Enter two official item IDs. Results are raw Blizzard records, not character-specific item evaluations.</div></div>'+
 '<p class="tf-lab-foot">Images are fetched only from official Blizzard spell-media records if the optional Cloudflare media route is available. Missing or incorrect media may occur in the upstream API; always check source IDs. No automatic best-in-slot ranking or talent legality is inferred.</p>';
 source.after(lab);
 const el=id=>document.getElementById(id);
 const mediaStatus=document.createElement('p');mediaStatus.className='tf-media-status';mediaStatus.id='tfMediaStatus';
 mediaStatus.textContent='Talent artwork: loads on demand from Blizzard spell media when available.';
 source.querySelector('.tf-source-head')?.append(mediaStatus);
 const iconCache=new Map();let inFlight=0,mediaRouteEnabled=true,observer=null,seenIdentity='',seenSignature='',schedule=false,requestKey=0;
 const mediaQueue=[],queued=new Set();
 function capture(){return bridge.snapshot()}
 function rankChoice(n,rank){
  const r=n?.ranks?.[Math.max(0,Math.min((n.ranks?.length||1)-1,Number(rank)-1))];
  return r?.choices?.[Math.max(0,Math.min((r?.choices?.length||1)-1,n?.choice||0))]||r?.choices?.[0]||null;
 }
 function iconKey(region,id){return region+':'+id}
 async function json(path){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11000);
  try{
   const response=await fetch(API+path,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:controller.signal});
   const body=await response.json().catch(()=>null);
   if(!response.ok||!body||body.success===false)throw new Error('Source unavailable ('+response.status+')');
   return body.data;
  }finally{clearTimeout(timer)}
 }
 function drain(){
  while(mediaRouteEnabled&&inFlight<3&&mediaQueue.length){
   const entry=mediaQueue.shift();queued.delete(entry.key);
   if(iconCache.has(entry.key))continue;
   inFlight++;
   json('/api/spell-media/'+entry.region+'/'+entry.id).then(data=>{
    const asset=Array.isArray(data?.assets)?data.assets.find(a=>a?.key==='icon'&&typeof a.url==='string'&&/^https:\/\/[^\s"<>]+$/i.test(a.url)):null;
    iconCache.set(entry.key,asset?.url||'');
   }).catch(()=>{
    iconCache.set(entry.key,'');
    // A missing optional route should not produce dozens of repeated API requests.
    mediaRouteEnabled=false;mediaQueue.length=0;
    mediaStatus.textContent='Official spell artwork is unavailable. The talent planner and source comparisons remain fully functional; the Cloudflare spell-media route may need deployment.';
   }).finally(()=>{inFlight--;applyIcons();drain()});
  }
 }
 function queueIcon(region,id){const key=iconKey(region,id);if(!mediaRouteEnabled||iconCache.has(key)||queued.has(key))return;queued.add(key);mediaQueue.push({key,region,id});drain()}
 function applyIcons(){
  const s=capture();if(!s.ready)return;
  const byId=new Map(s.nodes.map(n=>[String(n.id),n]));
  for(const node of tree.querySelectorAll('[data-tf-node]')){
   const item=byId.get(node.dataset.tfNode);if(!item)continue;
   const spellId=rankChoice(item,Math.max(1,item.planned))?.spellId;
   const key=iconKey(s.region,spellId);
   let holder=node.querySelector('.tf-spell-art');
   if(!holder){
    holder=document.createElement('span');holder.className='tf-spell-art';holder.setAttribute('aria-hidden','true');holder.textContent='✧';
    const title=node.querySelector('strong');if(title)title.before(holder);
   }
   if(!spellId){if(holder.textContent!=='✧'||holder.firstElementChild)holder.textContent='✧';continue}
   const image=iconCache.get(key);
   if(!image){if(holder.textContent!=='✧'||holder.firstElementChild)holder.textContent='✧';continue}
   if(holder.querySelector('img')?.src===image)continue;
   const img=document.createElement('img');img.src=image;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
   img.addEventListener('error',()=>{iconCache.set(key,'');holder.textContent='✧';},{once:true});
   holder.replaceChildren(img);
  }
 }
 function decorate(){
  const s=capture();if(!s.ready||!s.nodes.length)return;
  if(s.identity!==seenIdentity){seenIdentity=s.identity;seenSignature='';mediaQueue.length=0;queued.clear();requestKey++; }
  applyIcons();
  if(observer)observer.disconnect();
  if(typeof IntersectionObserver==='function'&&mediaRouteEnabled){
   const byId=new Map(s.nodes.map(n=>[String(n.id),n]));
   observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
     if(!entry.isIntersecting)continue;
     const n=byId.get(entry.target.dataset.tfNode);const id=rankChoice(n,Math.max(1,n?.planned||0))?.spellId;
     if(id)queueIcon(s.region,id);
     observer?.unobserve(entry.target);
    }
   },{root:tree,rootMargin:'150px'});
   tree.querySelectorAll('[data-tf-node]').forEach(n=>observer.observe(n));
  }
  updateChoices(s);
 }
 function updateChoices(s){
  const signature=s.identity+'|'+s.active+'|'+s.nodes.map(n=>n.id).join(',');
  if(signature===seenSignature)return;
  seenSignature=signature;
  const opts='<option value="">Select talent</option>'+s.nodes.map(n=>'<option value="'+n.id+'">'+escape(n.name)+' · #'+n.id+'</option>').join('');
  for(const side of ['A','B']){
   const input=el('tfLabTalent'+side),before=input.value;input.innerHTML=opts;
   input.value=s.nodes.some(n=>String(n.id)===before)?before:'';
  }
  renderTalent();
 }
 function selected(side){const snap=capture();return snap.nodes.find(n=>String(n.id)===el('tfLabTalent'+side).value)||null}
 function renderRank(side,n){
  const select=el('tfLabRank'+side),before=select.value;
  select.innerHTML=n?.ranks?.map((r,i)=>'<option value="'+(i+1)+'">Rank '+(i+1)+'</option>').join('')||'<option value="">Unavailable</option>';
  if(n?.ranks?.some(r=>String(r.rank)===before))select.value=before;
  else if(n?.ranks?.length)select.value=String(Math.max(1,n.planned));
 }
 function talentCard(n,side){
  if(!n)return '<div class="tf-lab-card tf-lab-empty">Choose a talent to display Blizzard-returned details.</div>';
  const rank=Number(el('tfLabRank'+side).value)||1,t=rankChoice(n,rank);
  const id=t?.spellId,tid=t?.talentId;
  return '<div class="tf-lab-card"><strong>'+escape(t?.name||n.name)+'</strong><div class="tf-lab-metadata"><span>Node #'+n.id+'</span><span>Talent '+(tid?'#'+tid:'ID unavailable')+'</span><span>Spell '+(id?'#'+id:'ID unavailable')+'</span></div><div class="tf-lab-alloc">'+n.planned+' / '+n.max+' planned points · Viewing rank '+rank+'</div><p>'+escape(t?.description||'No description returned for this rank or choice.')+'</p></div>';
 }
 function renderTalent(){
  const a=selected('A'),b=selected('B');
  for(const [side,n]of [['A',a],['B',b]])renderRank(side,n);
  const area=el('tfLabTalentResults');area.innerHTML=talentCard(a,'A')+talentCard(b,'B')+
   (a&&b?'<p class="tf-lab-delta">Allocated point difference (A − B): <strong>'+ (a.planned-b.planned>0?'+':'')+(a.planned-b.planned)+'</strong>. This is a manual point-count comparison, not a gameplay performance difference.</p>':'');
 }
 for(const side of ['A','B']){
  el('tfLabTalent'+side).addEventListener('change',renderTalent);
  el('tfLabRank'+side).addEventListener('change',()=>{const n=selected(side);const a=selected('A'),b=selected('B');el('tfLabTalentResults').innerHTML=talentCard(a,'A')+talentCard(b,'B')+(a&&b?'<p class="tf-lab-delta">Allocated point difference (A − B): '+(a.planned-b.planned)+'</p>':'')});
 }
 const rows=item=>{
  const fields=[['Item level',item.level],['Required level',item.required_level],['Quality',item.quality?.name],['Item class',item.item_class?.name],['Subclass',item.item_subclass?.name],['Inventory type',item.inventory_type?.name]];
  return fields.filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>[k,String(v)]);
 };
 const stats=item=>{
  const output=new Map();
  for(const s of Array.isArray(item.preview_item?.stats)?item.preview_item.stats:[]){
   const name=s?.type?.name||s?.type?.type;
   if(typeof name==='string'&&name.trim()){
    const value=typeof s.value==='number'&&Number.isFinite(s.value)?s.value:null;
    output.set(name,{value,text:String(s.display?.display_string??value??'Not supplied')});
   }
  }
  return output;
 };
 function showGear(a,b){
  const factsA=new Map(rows(a)),factsB=new Map(rows(b)),sa=stats(a),sb=stats(b);
  const keys=[...new Set([...factsA.keys(),...factsB.keys(),...sa.keys(),...sb.keys()])];
  const fmt=(k,obj,facts,statMap)=>facts.has(k)?escape(facts.get(k)):statMap.has(k)?escape(statMap.get(k).text):'Not supplied';
  const lines=keys.map(k=>{
   const va=sa.get(k)?.value,vb=sb.get(k)?.value;
   const diff=typeof va==='number'&&typeof vb==='number'?'<small>Numeric stat A − B: '+(va-vb>0?'+':'')+(va-vb)+'</small>':'';
   return '<tr><th scope="row">'+escape(k)+'</th><td>'+fmt(k,a,factsA,sa)+'</td><td>'+fmt(k,b,factsB,sb)+diff+'</td></tr>';
  }).join('');
  el('tfLabGearResults').innerHTML='<div class="tf-lab-scroll"><table><thead><tr><th>Returned field</th><th>'+escape(a.name||'Item A')+' (#'+a.id+')</th><th>'+escape(b.name||'Item B')+' (#'+b.id+')</th></tr></thead><tbody>'+lines+'</tbody></table></div><p>Only stat values present in both responses receive a numeric difference. Item levels, bonuses, scaling, and character context can change actual results. No DPS or best-in-slot score is calculated.</p>';
 }
 el('tfLabGearForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const a=validId(el('tfLabItemA').value),b=validId(el('tfLabItemB').value),out=el('tfLabGearResults');
  if(!a||!b){out.textContent='Enter two valid positive Blizzard item IDs.';return}
  const region=capture().region||el('tfRegion')?.value||'us',token=++requestKey;
  out.textContent='Retrieving Blizzard item records for #'+a+' and #'+b+'…';
  try{
   const items=await Promise.all([a,b].map(id=>json('/api/item/'+region+'/'+id)));
   if(token!==requestKey)return;
   if(Number(items[0]?.id)!==a||Number(items[1]?.id)!==b)throw Error('Blizzard item IDs did not match the requested records');
   showGear(items[0],items[1]);
  }catch(error){if(token===requestKey)out.textContent='The comparison could not be completed: '+error.message+'. The existing gear lookup remains available above.'}
 });
 const mut=new MutationObserver(()=>{if(schedule)return;schedule=true;requestAnimationFrame(()=>{schedule=false;decorate()})});
 mut.observe(tree,{childList:true});
 document.getElementById('tfLayout')?.addEventListener('change',()=>{seenSignature='';requestAnimationFrame(decorate)});
 decorate();
})();


;/* BUNDLE SOURCE: talent-build-intel-v5.5.js */
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
document.getElementById('tfPlanDuplicate')?.addEventListener('click',()=>requestAnimationFrame(render));
render();
})();

;/* BUNDLE SOURCE: official-media-v5.6.js */
/* NEXUS | AZEROTH v5.6 — accessible source-media controls and research guidance.
 * GET-only Blizzard media; no inferred item ownership, spell effects or build legality.
 */
(()=>{
'use strict';
if(document.getElementById('nxVisualIntel'))return;
const forge=document.getElementById('talentForge'),atlas=document.getElementById('itemAtlas'),armory=document.getElementById('connectedArmory');
if(!forge&&!atlas&&!document.getElementById('cxItemResult'))return;
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regions=new Set(['us','eu','kr','tw']),cache=new Map(),queued=new Set(),queue=[];let concurrent=0;
const key=(region,id)=>region+':'+id;
const validId=id=>/^[1-9][0-9]{0,9}$/.test(String(id));
const origin=img=>{try{const url=new URL(img);return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname.endsWith('.worldofwarcraft.com')?url.href:null}catch(_){return null}};
function mediaTask(region,id,done){
 const k=key(region,id);
 if(cache.has(k)){done(cache.get(k));return}
 if(queued.has(k)){const entry=queue.find(t=>t.k===k);if(entry)entry.callbacks.push(done);else{
  const tick=()=>{if(cache.has(k))done(cache.get(k));else requestAnimationFrame(tick)};tick();
 }return}
 queued.add(k);queue.push({k,region,id,callbacks:[done]});drain();
}
function drain(){
 while(concurrent<3&&queue.length){
  const job=queue.shift();concurrent++;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8500);
  fetch(API+'/api/media/'+job.region+'/'+job.id,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:controller.signal})
   .then(r=>r.ok?r.json():null).then(payload=>{
    const assets=Array.isArray(payload?.data?.assets)?payload.data.assets:[];
    return origin(assets.find(x=>x?.key==='icon')?.url)||'';
   }).catch(()=> '').then(url=>{
    cache.set(job.k,url);if(cache.size>250)cache.delete(cache.keys().next().value);
    for(const cb of job.callbacks)cb(url);
   }).finally(()=>{clearTimeout(timeout);queued.delete(job.k);concurrent--;drain()});
 }
}
let savedSize=64;
try{const v=Number(localStorage.getItem('nexus_azeroth_media_scale_v56'));if([48,64,80,96].includes(v))savedSize=v}catch(_){}
function applySize(v){savedSize=v;document.documentElement.style.setProperty('--nx-official-icon-size',v+'px');document.documentElement.dataset.nxIconSize=String(v);try{localStorage.setItem('nexus_azeroth_media_scale_v56',String(v))}catch(_){}}
applySize(savedSize);
const tools=document.createElement('section');tools.id='nxVisualIntel';tools.className='panel nx-media-guide';tools.innerHTML='<div class="nx-guide-top"><div><span class="wow-kicker">NEXUS / VISUAL INTELLIGENCE</span><h3>Artwork & Research Controls</h3><p>Enlarge official Blizzard spell and item artwork without changing your talent allocations, item records, or saved builds. Images are visual references—not item ownership evidence.</p></div><label class="nx-size-field">Artwork size<select id="nxOfficialIconSize" aria-label="Official skill and item artwork size"><option value="48">Compact · 48 px</option><option value="64">Comfortable · 64 px</option><option value="80">Large · 80 px</option><option value="96">Extra large · 96 px</option></select></label></div>'+
'<div class="nx-guide-grid"><article><strong>Talent Atlas</strong><p>Drag the tree to explore; tap + or − to edit a manual rank. INSPECT displays official spell and talent IDs with descriptions for each returned rank. Displayed images come from Blizzard spell-media records.</p></article><article><strong>Build Intelligence</strong><p>Source links show reported relationships between nodes. Amber notes mean review suggested, not that Blizzard rejected the allocation. Compare two local builds to see rank and choice changes—no DPS estimate.</p></article><article><strong>Gear & Item Atlas</strong><p>Search by official item ID, inspect the Blizzard item record, then track personal goals separately. Larger item artwork appears for visible researched results when the Blizzard item-media endpoint supplies an icon.</p></article><article><strong>Saved Builds & Safety</strong><p>Use SAVE to preserve a local draft and EXPORT JSON for a portable backup. Plans are not applied to WoW; no equipment ownership or game-valid import code is claimed.</p></article></div>';
const target=forge?.querySelector('section[data-section="talents"]')||atlas?.querySelector('section[data-section="atlas"]');
if(target){const intro=target.querySelector('p.muted');if(intro)intro.after(tools);else target.prepend(tools)}
const sourcePanel=document.getElementById('tfBuildIntel');
const coverage=document.createElement('div');coverage.id='nxSourceCoverage';coverage.className='nx-skill-coverage';coverage.setAttribute('role','status');
coverage.innerHTML='<strong>Source completeness</strong><p>Load Blizzard specialization data to see what this API response actually includes.</p>';
sourcePanel?.querySelector('#tfBiReview')?.after(coverage);
function reviewCoverage(){
 const snap=window.NexusTalentSourceBridge?.snapshot?.();
 if(!snap?.ready||!coverage.isConnected)return;
 const catalog=Array.isArray(snap.catalog)?snap.catalog:[];
 const nodes=Array.isArray(snap.nodes)?snap.nodes:[];
 const ranks=nodes.flatMap(n=>Array.isArray(n.ranks)?n.ranks:[]);
 const spells=ranks.flatMap(r=>Array.isArray(r.choices)?r.choices:[]).filter(x=>Number.isSafeInteger(x.spellId)&&x.spellId>0);
 const described=ranks.filter(r=>r.choices?.some(x=>typeof x.description==='string'&&x.description.trim()));
 const links=Array.isArray(snap.linkEdges)?snap.linkEdges:[];
 const outside=links.filter(x=>!x.resolved).length;
 coverage.innerHTML='<strong>Blizzard data coverage · '+escape(snap.active||'tree')+'</strong>'+
 '<div class="nx-coverage-stats"><span>'+catalog.length+' returned nodes</span><span>'+links.length+' reported references</span><span>'+spells.length+' spell-ID entries</span><span>'+described.length+' ranks with tooltip descriptions</span></div>'+
 '<p>'+outside+' reported links fall outside the loaded tree. Counts are only for this API response and selected category, not an estimate of total WoW talents. Missing details stay unverified.</p>';
}
const selector=tools.querySelector('select');selector.value=String(savedSize);
selector.addEventListener('change',()=>{const v=Number(selector.value);if([48,64,80,96].includes(v))applySize(v)});
let io=null;
function iconSlot(host,id,region){
 if(!host||!validId(id)||!regions.has(region)||host.querySelector('.nx-item-art'))return;
 const slot=document.createElement('span');slot.className='nx-item-art';slot.setAttribute('aria-label','Official item artwork, if provided by Blizzard');slot.setAttribute('role','img');
 slot.textContent='◇';host.prepend(slot);
 const load=()=>mediaTask(region,id,url=>{
  if(!slot.isConnected||!url)return;
  const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  img.onerror=()=>{slot.textContent='◇'};slot.replaceChildren(img);
 });
 if(typeof IntersectionObserver==='function'){
  if(!io)io=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){io.unobserve(e.target);e.target._nxMediaLoad?.();delete e.target._nxMediaLoad}}},{rootMargin:'120px'});
  slot._nxMediaLoad=load;io.observe(slot);
 }else load();
}
function decorate(){
 reviewCoverage();
 // A bounded visible list prevents an expensive request per catalog entry on iPhone.
 const atlasResults=document.querySelectorAll('#atlasSearchResults .atlas-entry,#atlasIdResult .atlas-entry,#atlasBoard .atlas-entry');
 let i=0;
 for(const row of atlasResults){
  if(i++>=28)break;
  const b=row.querySelector('[data-atlas-inspect]');if(b)iconSlot(row,b.dataset.atlasInspect,b.dataset.atlasRegion);
 }
 let n=0;
 for(const row of document.querySelectorAll('#cxEquipment .cx-saved')){
  if(n++>=36)break;
  const btn=row.querySelector('[data-cxopen]');if(btn)iconSlot(row,btn.dataset.cxopen,btn.dataset.cxregion);
 }
 const comparison=document.getElementById('tfLabGearResults');
 if(comparison?.querySelector('table')&&!comparison.querySelector('.nx-gear-compare-icons')){
  const region=regions.has(document.getElementById('tfRegion')?.value)?document.getElementById('tfRegion').value:'us';
  const ids=[document.getElementById('tfLabItemA')?.value,document.getElementById('tfLabItemB')?.value];
  const deck=document.createElement('div');deck.className='nx-gear-compare-icons';
  ids.forEach((id,i)=>{if(!validId(id))return;const card=document.createElement('div');card.className='nx-gear-compare-item';
   const caption=document.createElement('span');caption.textContent='Item '+(i?'B':'A')+' · #'+id;
   card.append(caption);deck.append(card);iconSlot(card,id,region);
  });
  comparison.prepend(deck);
 }
 for(const card of document.querySelectorAll('#cxItemResult .cx-item')){
  const match=card.querySelector('[data-cxsave]');if(match)iconSlot(card,match.dataset.cxsave,match.dataset.cxregion);
 }
}
let scheduled=false;const mutation=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()})});
for(const id of ['atlasSearchResults','atlasIdResult','atlasBoard','cxEquipment','cxItemResult','tfTree','tfLabGearResults']){
 const host=document.getElementById(id);if(host)mutation.observe(host,{childList:true});
}
decorate();
})();


;/* BUNDLE SOURCE: talent-command-core-v5.7.js */
/* NEXUS | AZEROTH v5.7 — independent, read-only tree analytics.
 * Relations reflect Blizzard locked_by references only. Zero points are review prompts,
 * never proof of a mandatory prerequisite or a game-valid build.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentCommandCore=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const ident=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):null;
const rank=(alloc,id)=>{const n=alloc?.[String(id)];return Number.isSafeInteger(n)&&n>0?n:0};
function model(s){
 const catalog=Array.isArray(s?.catalog)?s.catalog.filter(n=>ident(n?.id)!==null).slice(0,900):[];
 const nodes=new Map(catalog.map(n=>[Number(n.id),n]));
 const edges=[],seen=new Set();
 for(const e of Array.isArray(s?.linkEdges)?s.linkEdges:[]){
  const from=ident(e?.from),to=ident(e?.to);
  if(!from||!to||from===to||!nodes.has(to))continue;
  const key=from+':'+to;if(seen.has(key))continue;seen.add(key);
  edges.push({from,to,resolved:nodes.has(from)});
 }
 return{catalog,nodes,edges,allocations:s?.allocations||{}};
}
function audit(s){
 const {catalog,nodes,edges,allocations}=model(s),counts={class:0,spec:0,hero:0},issues=[],review=[];
 let selected=0;
 for(const n of catalog){
  const value=rank(allocations,n.id);
  if(value){selected++;if(Object.hasOwn(counts,n.category))counts[n.category]+=value}
  if(value>Number(n.max||0))issues.push({id:n.id,reason:'Planned rank exceeds the returned rank limit.'});
 }
 for(const [id,value]of Object.entries(allocations).slice(0,900)){
  if(rank(allocations,id)>0&&!nodes.has(Number(id)))issues.push({id:Number(id),reason:'Planned ID not found in returned talent records.'});
 }
 for(const e of edges)if(rank(allocations,e.to)>0){
  if(!e.resolved)review.push({id:e.to,from:e.from,reason:'Source-linked upstream node not included in the returned tree.'});
  else if(rank(allocations,e.from)===0)review.push({id:e.to,from:e.from,reason:'Reported upstream node has zero manually planned points.'});
 }
 return{counts,selected,total:counts.class+counts.spec+counts.hero,issues:issues.slice(0,100),review:review.slice(0,300),returned:catalog.length,links:edges.length};
}
function trace(s,id,maxDepth=18){
 const target=ident(id),{nodes,edges,allocations}=model(s);
 if(!target||!nodes.has(target))return{target:null,levels:[],unresolved:[],cycle:false};
 const visited=new Set([target]),queue=[{id:target,depth:0}],levels=[],unresolved=new Set();let cycle=false;
 while(queue.length&&levels.length<180){
  const now=queue.shift();if(now.depth>=maxDepth)continue;
  for(const edge of edges){
   if(edge.to!==now.id)continue;
   if(!edge.resolved){unresolved.add(edge.from);continue}
   if(visited.has(edge.from)){cycle=true;continue}
   visited.add(edge.from);
   levels.push({id:edge.from,depth:now.depth+1,name:nodes.get(edge.from)?.name||'Node #'+edge.from,points:rank(allocations,edge.from)});
   queue.push({id:edge.from,depth:now.depth+1});
  }
 }
 return{target,levels,unresolved:[...unresolved],cycle};
}
function preview(s,id,step){
 const m=model(s),node=m.nodes.get(ident(id)),delta=Number(step);
 if(!node||![1,-1].includes(delta))return null;
 const current=rank(m.allocations,node.id),maximum=Number(node.max)||0,next=current+delta;
 if(next<0||next>maximum)return null;
 const future={...m.allocations,[String(node.id)]:next},before=audit(s),after=audit({...s,allocations:future});
 return{id:node.id,name:node.name||'Node #'+node.id,from:current,to:next,category:node.category,
  before,after,identity:s.identity||'',kind:'manual preview only'};
}
return{audit,trace,preview};
});


;/* BUNDLE SOURCE: talent-command-v5.7.js */
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


;/* BUNDLE SOURCE: visual-architect-core-v5.8.js */
/* NEXUS | AZEROTH v5.8 — pure scenario comparison. No writes or gameplay claims. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusVisualArchitectCore=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const positive=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999;
const safeRank=(map,id)=>{const x=map?.[String(id)];return Number.isSafeInteger(x)&&x>0?x:0};
function copySnapshot(raw,identity){
 if(!raw||raw.identity!==identity)return null;
 const ranks={},choices={};
 for(const [k,v]of Object.entries(raw.rankByNode||raw.allocations||{}).slice(0,1200)){
  if(positive(k)&&Number.isSafeInteger(v)&&v>=0&&v<=250)ranks[String(k)]=v;
 }
 for(const [k,v]of Object.entries(raw.choiceByNode||{}).slice(0,1200)){
  if(positive(k)&&Number.isSafeInteger(v)&&v>=0&&v<=16)choices[String(k)]=v;
 }
 return {identity,name:String(raw.name||'Working draft').slice(0,75),rankByNode:ranks,choiceByNode:choices};
}
function adjust(scenario,catalog,id,delta){
 const node=catalog.find(x=>Number(x.id)===Number(id)),step=Number(delta);
 if(!scenario||!node||![1,-1].includes(step))return null;
 const now=safeRank(scenario.rankByNode,node.id),max=Number(node.max);
 if(!Number.isSafeInteger(max)||max<1||max>250||now+step<0||now+step>max)return null;
 const result=copySnapshot(scenario,scenario.identity);
 result.rankByNode[String(node.id)]=now+step;
 return result;
}
function summary(s,catalog,edges){
 const byId=new Map(catalog.map(n=>[String(n.id),n]));
 const categories={class:0,spec:0,hero:0};const issues=[],advisories=[];
 let count=0;
 for(const [id,r]of Object.entries(s?.rankByNode||{})){
  if(!r)continue;
  const node=byId.get(id);
  if(!node){issues.push('Unknown node #'+id);continue}
  if(r>node.max)issues.push('Over maximum rank at #'+id);
  count++;if(Object.hasOwn(categories,node.category))categories[node.category]+=r;
 }
 for(const edge of edges||[]){
  if(safeRank(s?.rankByNode,edge.to)<=0)continue;
  if(!edge.resolved)advisories.push('Unresolved upstream node #'+edge.from+' for #'+edge.to);
  else if(safeRank(s.rankByNode,edge.from)===0)advisories.push('Zero planned points at source-linked node #'+edge.from+' for #'+edge.to);
 }
 return{categories,count,total:Object.values(categories).reduce((a,b)=>a+b,0),issues:issues.slice(0,25),advisories:advisories.slice(0,80),gameValidated:false};
}
function difference(a,b,catalog){
 const ids=[...new Set([...Object.keys(a?.rankByNode||{}),...Object.keys(b?.rankByNode||{}),...Object.keys(a?.choiceByNode||{}),...Object.keys(b?.choiceByNode||{})])];
 const catalogMap=new Map(catalog.map(n=>[String(n.id),n]));
 return ids.filter(positive).map(id=>{
 const n=catalogMap.get(id),from=safeRank(a?.rankByNode,id),to=safeRank(b?.rankByNode,id);
 const choiceA=Number(a?.choiceByNode?.[id]||0),choiceB=Number(b?.choiceByNode?.[id]||0);
 return{id:Number(id),name:n?.name||'Unknown returned node',category:n?.category||'unknown',from,to,delta:to-from,choiceA,choiceB};
 }).filter(x=>x.delta!==0||x.choiceA!==x.choiceB).sort((x,y)=>x.category.localeCompare(y.category)||x.name.localeCompare(y.name));
}
return{copySnapshot,adjust,summary,difference};
});


;/* BUNDLE SOURCE: visual-architect-v5.8.js */
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


;/* BUNDLE SOURCE: local-media-studio-v5.9.js */
/* NEXUS | AZEROTH v5.9 — local media studio.
 * Browser-only IndexedDB blobs. Nothing is submitted to GitHub, Blizzard or Cloudflare.
 * Muted GIF/video backdrop and independent user-initiated audio, no visualizer.
 */
(()=>{
'use strict';
const parent=document.getElementById('talentForge');if(!parent||document.getElementById('nxMediaStudio'))return;
const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const el=id=>document.getElementById(id),storeName='nexus_azeroth_private_media_v59',prefKey='nexus_azeroth_media_preferences_v59';
let db=null,backgroundURL='',musicURL='',musicTracks=[],playingId=null,shuffle=false,repeat='off',mediaPrefs={visibility:80,shade:35,blur:0,fit:'cover',volume:65,backdropOn:true},restoreOn=false;
try{const pref=JSON.parse(localStorage.getItem(prefKey)||'{}');if(pref&&typeof pref==='object'){
 for(const k of ['visibility','shade','blur','volume'])if(Number.isFinite(pref[k]))mediaPrefs[k]=Math.max(0,Math.min(k==='blur'?8:100,Math.round(pref[k])));
 if(['cover','contain'].includes(pref.fit))mediaPrefs.fit=pref.fit;
 if(typeof pref.backdropOn==='boolean')mediaPrefs.backdropOn=pref.backdropOn;
}}catch(_){}
const savePrefs=()=>{try{localStorage.setItem(prefKey,JSON.stringify(mediaPrefs))}catch(_){}};
const stage=document.createElement('div');stage.id='nxMediaBackdrop';stage.setAttribute('aria-hidden','true');document.body.prepend(stage);
stage.innerHTML='<div class="nx-media-canvas"></div><div class="nx-media-scrim"></div>';
const canvas=stage.querySelector('.nx-media-canvas');stage.hidden=true;
const section=parent.querySelector('[data-section="talents"]');
const panel=document.createElement('details');panel.id='nxMediaStudio';panel.className='panel nx-media-studio';
panel.innerHTML='<summary class="nx-media-summary">CUSTOMIZE BACKGROUND & MUSIC PLAYER · PRIVATE MEDIA STUDIO</summary><header class="nx-media-head"><div><span class="wow-kicker">NEXUS / PRIVATE MEDIA STUDIO v5.9</span><h3>Atmosphere & Music</h3><p>Customize the companion background using your own GIF, MP4, or WebM. Adjust its visibility without altering the interface. Keep a private playlist of local audio files in this browser.</p></div><span>LOCAL DEVICE ONLY</span></header>'+
'<div class="nx-media-grid"><div class="nx-media-panel"><h4>Animated background</h4><label class="nx-upload">SELECT GIF OR VIDEO<input id="nxMediaFile" type="file" accept=".gif,.mp4,.webm,image/gif,video/mp4,video/webm"></label><p id="nxBackgroundStatus" role="status" aria-live="polite">No background selected.</p><div class="nx-media-controls"><label>Visibility <output id="nxMediaVisOut">80%</output><input id="nxMediaVisibility" type="range" min="0" max="100" value="80"></label><label>Readability shade <output id="nxMediaShadeOut">35%</output><input id="nxMediaShade" type="range" min="0" max="90" value="35"></label><label>Soft blur <output id="nxMediaBlurOut">0px</output><input id="nxMediaBlur" type="range" min="0" max="8" value="0"></label><label>Image/video fit<select id="nxMediaFit"><option value="cover">Fill screen</option><option value="contain">Show full frame</option></select></label></div><div class="nx-media-buttons"><button id="nxMediaToggle" type="button">HIDE BACKGROUND</button><button id="nxMediaRemove" type="button">REMOVE BACKGROUND</button></div><p class="hint">Uploaded media stays on this device using browser storage when available. MP4/WebM always play muted and loop. Storage quotas and iPhone browser restrictions may limit large files or prevent automatic playback; no uploads leave this browser.</p></div>'+
'<div class="nx-media-panel"><h4>Personal music library</h4><label class="nx-upload">ADD LOCAL AUDIO FILES<input id="nxMusicFiles" type="file" accept=".mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,audio/*" multiple></label><p id="nxMusicStatus" role="status" aria-live="polite">Music plays only after a user presses Play.</p><div class="nx-media-buttons"><button id="nxMusicOpen" type="button">SHOW MUSIC PLAYER</button><button id="nxMusicClear" type="button">CLEAR MUSIC LIBRARY</button></div><p class="hint">No audio visualization, external music downloads, or streaming-account connection. Playback depends on your the audio codecs supported by your browser. Your tracks stay private and do not transfer between devices automatically.</p></div></div>';
section?.insertBefore(panel,section.querySelector('.panel')||null);
const dock=document.createElement('aside');dock.id='nxMusicDock';dock.className='nx-music-dock';dock.hidden=true;
dock.innerHTML='<div class="nx-music-title"><strong>♫ NEXUS | MUSIC PLAYER</strong><button type="button" id="nxMusicClose" aria-label="Close music player">×</button></div><div class="nx-track-now" id="nxMusicNow">Select a local track to begin.</div><audio id="nxMusicAudio" preload="metadata"></audio><div class="nx-audio-controls"><button type="button" id="nxMusicPrev" aria-label="Previous track">⏮</button><button type="button" id="nxMusicPlay" aria-label="Play or pause">PLAY</button><button type="button" id="nxMusicNext" aria-label="Next track">⏭</button><button type="button" id="nxMusicShuffle">SHUFFLE OFF</button><button type="button" id="nxMusicRepeat">REPEAT OFF</button></div><div class="nx-audio-sliders"><label><span id="nxMusicTime">0:00 / 0:00</span><input id="nxMusicSeek" type="range" min="0" max="1000" value="0" aria-label="Seek through song"></label><label>Volume <output id="nxMusicVolOut">65%</output><input id="nxMusicVolume" type="range" min="0" max="100" value="65"></label></div><div class="nx-music-playlist" id="nxMusicPlaylist" role="list" aria-label="Private local music playlist"></div>';
document.body.append(dock);
const audio=el('nxMusicAudio');
function announce(id,msg){el(id).textContent=msg}
function openDB(){if(!('indexedDB'in window))return Promise.reject(Error('IndexedDB is unavailable'));return new Promise((res,rej)=>{
 const req=indexedDB.open(storeName,1);
 req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('media'))d.createObjectStore('media',{keyPath:'id'});if(!d.objectStoreNames.contains('tracks'))d.createObjectStore('tracks',{keyPath:'id'})};
 req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error||Error('Private storage unavailable'));req.onblocked=()=>rej(Error('Media storage is blocked by another open tab'));
})}
function dbAction(name,mode,method,value){if(!db)return Promise.reject(Error('Private storage is not available'));return new Promise((res,rej)=>{
 const tx=db.transaction(name,mode);let output;const request=tx.objectStore(name)[method](...(value===undefined?[]:[value]));request.onsuccess=()=>{output=request.result};tx.oncomplete=()=>res(output);tx.onerror=()=>rej(request.error||tx.error||Error('Browser storage error'));tx.onabort=()=>rej(request.error||tx.error||Error('Storage capacity exceeded'));
})}
function free(url){if(url)URL.revokeObjectURL(url)}
function mediaBlob(record){return record?.blob instanceof Blob?record.blob:record?.buffer instanceof ArrayBuffer?new Blob([record.buffer],{type:record.mediaType||'application/octet-stream'}):null}
async function storeMediaCompatible(bucket,record,file){
 try{await dbAction(bucket,'readwrite','put',record);return record}
 catch(first){
  if(file.size>64*1048576)throw Error('This browser could not persist the file as a Blob. For this device, try a file below 64 MB. '+(first?.name||''));
  const buffer=await file.arrayBuffer();const fallback={...record,buffer,mediaType:record.mediaType||file.type||'application/octet-stream'};delete fallback.blob;
  try{await dbAction(bucket,'readwrite','put',fallback);return fallback}
  catch(second){throw Error('Browser denied local media storage: '+(second?.name||second?.message||'Unknown error'))}
 }
}
function updateBackground(){
 stage.hidden=!mediaPrefs.backdropOn||!canvas.firstElementChild;
 stage.style.setProperty('--nx-media-visibility',String(mediaPrefs.backdropOn?mediaPrefs.visibility/100:0));
 stage.style.setProperty('--nx-media-shade',String(mediaPrefs.shade/100));
 stage.style.setProperty('--nx-media-blur',mediaPrefs.blur+'px');
 stage.style.setProperty('--nx-media-fit',mediaPrefs.fit);
 for(const [id,v,unit]of [['nxMediaVisibility',mediaPrefs.visibility,'%'],['nxMediaShade',mediaPrefs.shade,'%'],['nxMediaBlur',mediaPrefs.blur,'px']]){el(id).value=String(v);el(id.replace(/^(nxMedia)/,'nxMedia').replace('Visibility','VisOut').replace('Shade','ShadeOut').replace('Blur','BlurOut')).textContent=v+unit}
 el('nxMediaFit').value=mediaPrefs.fit;el('nxMediaToggle').textContent=mediaPrefs.backdropOn?'HIDE BACKGROUND':'SHOW BACKGROUND';
}
function renderBackground(record){
 canvas.replaceChildren();free(backgroundURL);backgroundURL='';
 const blob=mediaBlob(record);
 if(!blob){stage.hidden=true;announce('nxBackgroundStatus','No background installed. Choose a local GIF or video to customize the site.');return}
 stage.hidden=false;backgroundURL=URL.createObjectURL(blob);
 const element=document.createElement(record.kind==='gif'?'img':'video');
 element.src=backgroundURL;
 if(element.tagName==='VIDEO'){element.muted=true;element.loop=true;element.autoplay=true;element.playsInline=true;element.preload='metadata';element.defaultMuted=true;element.setAttribute('playsinline','');element.addEventListener('loadeddata',()=>{if(mediaPrefs.backdropOn)element.play().catch(()=>announce('nxBackgroundStatus','Background is saved, but autoplay is blocked. Use SHOW BACKGROUND to retry.'))})}
 else{element.alt='';element.decoding='async'}
 canvas.append(element);announce('nxBackgroundStatus','Saved locally: '+record.name+' · '+Math.round(blob.size/1048576)+' MB');
 updateBackground();
}
async function uploadBackground(file){
 if(!file)return;
 const extension=String(file.name).toLowerCase().split('.').pop();const kind=extension==='gif'?'gif':['mp4','webm'].includes(extension)?'video':null;
 if(!kind||!(kind==='gif'?['image/gif',''].includes(file.type):['video/mp4','video/webm',''].includes(file.type)))throw Error('Use a GIF, MP4 or WebM file');
 if(file.size<=0||file.size>500*1048576)throw Error('Background must be 500 MB or smaller. Available device storage may be less');
 if(navigator.storage?.estimate){const q=await navigator.storage.estimate();if(Number.isFinite(q.quota)&&q.quota>0&&Number.isFinite(q.usage)&&q.quota-q.usage<file.size*1.05)throw Error('Insufficient browser storage. Try a smaller video or free site data')}
 const mediaType=file.type||(kind==='gif'?'image/gif':extension==='webm'?'video/webm':'video/mp4');
 const record={id:'background',blob:new Blob([file],{type:mediaType}),mediaType,name:String(file.name).slice(0,140),kind};
 const saved=await storeMediaCompatible('media',record,file);renderBackground(saved);
}
function clock(n){if(!Number.isFinite(n))return '0:00';return Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0')}
function playState(){el('nxMusicPlay').textContent=audio.paused?'PLAY':'PAUSE';announce('nxMusicTime',clock(audio.currentTime)+' / '+clock(audio.duration))}
function playlist(){
 const parent=el('nxMusicPlaylist');parent.replaceChildren();
 for(const item of musicTracks){const row=document.createElement('div');row.className='nx-music-entry';row.dataset.id=item.id;
 const name=document.createElement('button');name.type='button';name.textContent=(item.id===playingId?'♫ ':'')+item.name;name.title=item.name;name.addEventListener('click',()=>loadTrack(item.id,true));
 const remove=document.createElement('button');remove.type='button';remove.textContent='REMOVE';remove.setAttribute('aria-label','Remove '+item.name);remove.addEventListener('click',()=>removeTrack(item.id));
 row.append(name,remove);parent.append(row)}
 if(!musicTracks.length)parent.textContent='No tracks saved. Add audio files using the Music Library controls.';
}
async function loadTrack(id,autoplay=false){
 const item=musicTracks.find(x=>x.id===id);if(!item)return;
 const record=await dbAction('tracks','readonly','get',id);const blob=mediaBlob(record);if(!blob)return;
 audio.pause();audio.removeAttribute('src');audio.load();free(musicURL);musicURL=URL.createObjectURL(blob);audio.src=musicURL;playingId=id;audio.volume=mediaPrefs.volume/100;
 announce('nxMusicNow',item.name);playlist();
 if(autoplay){try{await audio.play()}catch(_){announce('nxMusicStatus','Press PLAY to start playback; automatic audio playback may be restricted.')}}
 playState();
}
async function removeTrack(id){if(!confirm('Remove this local track from your browser library?'))return;
 const was=id===playingId;if(was){audio.pause();audio.removeAttribute('src');free(musicURL);musicURL='';playingId=null;announce('nxMusicNow','Select a track to begin')}
 await dbAction('tracks','readwrite','delete',id);musicTracks=musicTracks.filter(x=>x.id!==id);playlist();playState();
}
async function next(direction=1){
 if(!musicTracks.length)return;
 let index=musicTracks.findIndex(x=>x.id===playingId);
 if(shuffle&&musicTracks.length>1){let value=Math.floor(Math.random()*musicTracks.length);if(value===index)value=(value+1)%musicTracks.length;index=value}
 else index=(index+direction+musicTracks.length)%musicTracks.length;
 await loadTrack(musicTracks[index].id,true);
}
async function addAudio(files){
 if(!db)throw Error('Browser storage is unavailable');
 const batch=[...files].slice(0,20),newItems=[];
 for(const file of batch){
  const ext=String(file.name).toLowerCase().split('.').pop();
  if(!['mp3','wav','m4a','aac','ogg','oga','flac'].includes(ext)||file.size<1||file.size>100*1048576)continue;
  if(musicTracks.length+newItems.length>=60)break;
  const id='track-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
  const mediaType=file.type||({mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',ogg:'audio/ogg',oga:'audio/ogg',flac:'audio/flac',aac:'audio/aac'}[ext]||'application/octet-stream');
  const row={id,name:String(file.name).slice(0,160),blob:new Blob([file],{type:mediaType}),mediaType,added:Date.now()};
  await storeMediaCompatible('tracks',row,file);
  newItems.push({id,name:row.name,added:row.added});
 }
 musicTracks.push(...newItems);playlist();
 announce('nxMusicStatus',newItems.length+' local track(s) stored. Unsupported, empty, or oversized files were skipped. Up to 60 tracks, 100 MB per track.');
}
el('nxMediaFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file){try{await uploadBackground(file)}catch(err){announce('nxBackgroundStatus','Background not saved: '+err.message)}}e.target.value=''});
for(const [id,key]of [['nxMediaVisibility','visibility'],['nxMediaShade','shade'],['nxMediaBlur','blur']]){
 el(id).addEventListener('input',e=>{mediaPrefs[key]=Number(e.target.value);updateBackground();savePrefs()});
}
el('nxMediaFit').addEventListener('change',e=>{mediaPrefs.fit=e.target.value==='contain'?'contain':'cover';updateBackground();savePrefs()});
el('nxMediaToggle').addEventListener('click',()=>{mediaPrefs.backdropOn=!mediaPrefs.backdropOn;updateBackground();savePrefs();const video=canvas.querySelector('video');if(video){if(mediaPrefs.backdropOn)video.play().catch(()=>announce('nxBackgroundStatus','Tap SHOW BACKGROUND again if video playback is blocked.'));else video.pause()}});
el('nxMediaRemove').addEventListener('click',async()=>{if(!confirm('Remove your locally saved companion background?'))return;try{await dbAction('media','readwrite','delete','background');renderBackground(null)}catch(e){announce('nxBackgroundStatus',e.message)}});
el('nxMusicFiles').addEventListener('change',async e=>{try{await addAudio(e.target.files||[])}catch(err){announce('nxMusicStatus','Music storage error: '+err.message)}e.target.value=''});
el('nxMusicOpen').addEventListener('click',()=>{dock.hidden=false;playlist()});
el('nxMusicClose').addEventListener('click',()=>{dock.hidden=true});
el('nxMusicPlay').addEventListener('click',async()=>{if(!audio.src){if(musicTracks[0])await loadTrack(musicTracks[0].id,false);else return}if(audio.paused){try{await audio.play()}catch(_){announce('nxMusicStatus','This format may be unsupported. Try MP3 or M4A.')}}else audio.pause();playState()});
el('nxMusicPrev').addEventListener('click',()=>next(-1));el('nxMusicNext').addEventListener('click',()=>next(1));
el('nxMusicShuffle').addEventListener('click',()=>{shuffle=!shuffle;el('nxMusicShuffle').textContent='SHUFFLE '+(shuffle?'ON':'OFF')});
el('nxMusicRepeat').addEventListener('click',()=>{repeat=repeat==='off'?'one':repeat==='one'?'all':'off';el('nxMusicRepeat').textContent='REPEAT '+repeat.toUpperCase()});
el('nxMusicVolume').value=String(mediaPrefs.volume);el('nxMusicVolOut').textContent=mediaPrefs.volume+'%';
el('nxMusicVolume').addEventListener('input',e=>{mediaPrefs.volume=Number(e.target.value);audio.volume=mediaPrefs.volume/100;el('nxMusicVolOut').textContent=mediaPrefs.volume+'%';savePrefs()});
el('nxMusicSeek').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(e.target.value)/1000*audio.duration});
audio.addEventListener('timeupdate',()=>{el('nxMusicSeek').value=Number.isFinite(audio.duration)&&audio.duration>0?String(Math.round(audio.currentTime/audio.duration*1000)):'0';playState()});
audio.addEventListener('play',playState);audio.addEventListener('pause',playState);audio.addEventListener('loadedmetadata',playState);
audio.addEventListener('ended',()=>{if(repeat==='one'){audio.currentTime=0;audio.play().catch(()=>{})}else if(repeat==='all'||musicTracks.findIndex(x=>x.id===playingId)<musicTracks.length-1)next(1);else playState()});
el('nxMusicClear').addEventListener('click',async()=>{if(!confirm('Permanently clear your locally stored music library?'))return;audio.pause();audio.removeAttribute('src');free(musicURL);musicURL='';playingId=null;try{await dbAction('tracks','readwrite','clear');musicTracks=[];playlist();announce('nxMusicStatus','Music library cleared on this device.')}catch(e){announce('nxMusicStatus',e.message)}});
updateBackground();
openDB().then(async database=>{db=database;
 try{const bg=await dbAction('media','readonly','get','background');renderBackground(bg);const tracks=await dbAction('tracks','readonly','getAll');musicTracks=tracks.map(t=>({id:t.id,name:t.name,added:t.added})).sort((a,b)=>a.added-b.added);playlist();announce('nxMusicStatus',musicTracks.length+' stored track(s) on this browser. Open the player and press Play.')}
 catch(e){announce('nxBackgroundStatus','Unable to restore local media: '+e.message)}
}).catch(e=>{announce('nxBackgroundStatus','Persistent media storage unavailable: '+e.message+'. Please use a normal browser tab.');announce('nxMusicStatus','Music storage is unavailable here.')});
window.addEventListener('pagehide',()=>{audio.pause();free(musicURL);free(backgroundURL)});
})();


;/* BUNDLE SOURCE: talent-finale-v5.9.js */
/* NEXUS | AZEROTH v5.9 — Final Talent Tree Visual Pass.
 * Source-backed talent images, accessible tree focus and better search previews.
 * Media requests are GET-only, bounded, lazy and never infer missing spell IDs.
 */
(()=>{
'use strict';
const cmd=document.getElementById('tfCommand'),tree=document.getElementById('tfTree'),bridge=window.NexusTalentSourceBridge;
if(!cmd||!tree||!bridge||document.getElementById('nxTreeFinalControls'))return;
const API='https://nexus-azeroth-api.zevromxr.workers.dev',cache=new Map(),waiting=[],pending=new Map();let inFlight=0,scheduled=false,thumbObserver=null;
const el=id=>document.getElementById(id),validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999;
function safeURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='worldofwarcraft.com'||u.hostname.endsWith('.worldofwarcraft.com'))?u.href:''}catch(_){return ''}}
function getMedia(region,id,done){
 if(!validId(id)||!['us','eu','kr','tw'].includes(region))return done('');
 const key=region+':'+id;
 if(cache.has(key))return done(cache.get(key));
 if(pending.has(key)){pending.get(key).push(done);return}
 pending.set(key,[done]);waiting.push({key,region,id});drain();
}
function drain(){
 while(inFlight<3&&waiting.length){
  const job=waiting.shift();inFlight++;
  const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),9000);
  fetch(API+'/api/spell-media/'+job.region+'/'+job.id,{headers:{Accept:'application/json'},credentials:'omit',cache:'no-store',signal:ctrl.signal})
  .then(r=>r.ok?r.json():null).then(body=>safeURL(body?.data?.assets?.find(a=>a?.key==='icon')?.url))
  .catch(()=> '').then(url=>{
   cache.set(job.key,url||'');if(cache.size>300)cache.delete(cache.keys().next().value);
   const callbacks=pending.get(job.key)||[];pending.delete(job.key);callbacks.forEach(fn=>fn(url||''));
  }).finally(()=>{clearTimeout(timeout);inFlight--;drain()});
 }
}
function mediaImage(host,id,region,slotClass){
 if(!host||!validId(id)||host.querySelector('.'+slotClass))return;
 const slot=document.createElement('span');slot.className=slotClass;slot.textContent='✧';slot.setAttribute('aria-hidden','true');
 host.prepend(slot);
 const load=()=>getMedia(region,id,url=>{
  if(!slot.isConnected||!url)return;
  const img=document.createElement('img');img.src=url;img.alt='';img.decoding='async';img.loading='lazy';img.referrerPolicy='no-referrer';
  img.onerror=()=>{if(slot.isConnected)slot.textContent='✧'};
  slot.replaceChildren(img);
 });
 if(slotClass==='nx-skill-thumb'&&typeof IntersectionObserver==='function'){
  if(!thumbObserver)thumbObserver=new IntersectionObserver(entries=>{
   for(const e of entries)if(e.isIntersecting){thumbObserver.unobserve(e.target);e.target._nxLoad?.();delete e.target._nxLoad}
  },{root:el('tfCmdList'),rootMargin:'120px'});
  slot._nxLoad=load;thumbObserver.observe(slot);
 }else load();
}
function refresh(){
 const s=bridge.snapshot();if(!s.ready)return;
 const byId=new Map(s.catalog.map(x=>[String(x.id),x]));
 let limit=0;
 for(const button of document.querySelectorAll('#tfCmdList [data-tf-cmd-node]')){
  if(++limit>90)break;
  const node=byId.get(button.dataset.tfCmdNode);if(node?.spellId)mediaImage(button,node.spellId,s.region,'nx-skill-thumb');
 }
 for(const side of ['A','B']){
  const scenarioNode=byId.get(el('tfVaNode'+side)?.value);
  const detail=el('tfVaDetail'+side);
  if(detail&&scenarioNode?.spellId)mediaImage(detail,scenarioNode.spellId,s.region,'nx-skill-hero');
  const researchId=el('tfLabTalent'+side)?.value;
  const result=document.querySelectorAll('#tfLabTalentResults .tf-lab-card')[side==='A'?0:1];
  const lab=s.nodes.find(n=>String(n.id)===researchId);
  const rank=Number(el('tfLabRank'+side)?.value)||1;
  const spell=lab?.ranks?.[rank-1]?.choices?.[lab.choice||0]?.spellId||byId.get(researchId)?.spellId;
  if(result&&spell)mediaImage(result,spell,s.region,'nx-skill-hero');
 }
 for(const card of tree.querySelectorAll('[data-tf-node]')){
  const n=byId.get(card.dataset.tfNode);if(!n)continue;
  const label='Official source node #'+n.id+' · '+n.max+' returned rank(s)'+(n.summary?' · '+n.summary.replace(/<[^>]*>/g,'').slice(0,160):'');
  if(card.getAttribute('aria-label')!==label)card.setAttribute('aria-label',label);
 }
}
const tools=document.createElement('div');tools.id='nxTreeFinalControls';tools.className='nx-finale-controls';
tools.innerHTML='<div><span class="wow-kicker">NEXUS / FINAL TREE WORKSPACE</span><strong>Tree Focus & Skill Previews</strong><p>Browse source-backed skill art in search results, inspect official rank information and give the tree more room when planning. Nothing here changes your saved builds.</p></div><div class="nx-finale-actions"><button id="nxTreeFocus" type="button" aria-pressed="false">FOCUS TREE</button><button id="nxTreeJump" type="button">GO TO TALENT TREE</button><button id="nxTreeFull" type="button">ALL RESEARCH PANELS</button></div>';
cmd.querySelector('.tf-cmd-head')?.after(tools);
let focused=false;
function focus(on){
 focused=Boolean(on);
 const section=document.querySelector('#talentForge [data-section="talents"]');
 section?.classList.toggle('nx-tree-focused',focused);
 el('nxTreeFocus').textContent=focused?'EXIT FOCUS':'FOCUS TREE';
 el('nxTreeFocus').setAttribute('aria-pressed',String(focused));
 if(focused)tree.scrollIntoView({behavior:'smooth',block:'center'});
}
el('nxTreeFocus').addEventListener('click',()=>focus(!focused));
el('nxTreeFull').addEventListener('click',()=>focus(false));
el('nxTreeJump').addEventListener('click',()=>tree.scrollIntoView({behavior:'smooth',block:'center'}));
const containers=['tfCmdList','tfTree','tfLabTalentResults','tfVaDetailA','tfVaDetailB'];
const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.target?.id==='tfCmdList'))thumbObserver?.disconnect();if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;refresh()})});
for(const id of containers){const host=el(id);if(host)observer.observe(host,{childList:true})}
for(const id of ['tfVaNodeA','tfVaNodeB','tfLabTalentA','tfLabTalentB','tfLabRankA','tfLabRankB'])el(id)?.addEventListener('change',()=>requestAnimationFrame(refresh));
refresh();
})();

