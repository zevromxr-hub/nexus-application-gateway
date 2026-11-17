/* NEXUS AZEROTH v13 — SOVEREIGN TALENT FORGE: REFORGED
 * Additive live visualization, native-button delegation and separate v13 checkpoints.
 * Reads the official original window.NexusTalentSourceBridge snapshot.
 * NEVER writes the original Talent Forge, character, Blizzard or authentication keys.
 */
(()=>{'use strict';
const root=document.getElementById('talentForge'),source=document.getElementById('tfTree'),bridge=window.NexusTalentSourceBridge;
if(!root||!source||!bridge||document.getElementById('nx13Forge'))return;
const section=root.querySelector('[data-section="talents"]'),$=id=>document.getElementById(id);
if(!section||!$('tfSpec')||!$('tfRegion')||!$('tfCompare'))return;
const host=document.createElement('div');host.id='nx13Forge';host.innerHTML="<section class=\"nx13-hero\" aria-label=\"Sovereign Talent Forge Reforged\">\n <div class=\"nx13-hero-portrait\" aria-hidden=\"true\"></div>\n <div class=\"nx13-hero-content\">\n  <span class=\"nx13-kicker\">NEXUS / SOVEREIGN TALENT FORGE · v13.0</span>\n  <h2>TALENT FORGE<br><em>REFORGED.</em></h2>\n  <p>The existing Blizzard-powered talent planner, reimagined. Inspect real talent ranks, compare saved drafts, and allocate using the same original undo-safe engine.</p>\n  <div class=\"nx13-hero-actions\"><button id=\"nx13Toggle\" type=\"button\" aria-pressed=\"true\">CLASSIC FORGE VIEW</button><a href=\"./player-experience.html\">MY CHARACTER ↗</a><a href=\"./save-protection.html\">SAVE PROTECTION ↗</a></div>\n  <div class=\"nx13-hero-foot\"><span>✦ OFFICIAL REPORTED DATA</span><span>✦ MANUAL BUILDS</span><span>✦ NO FAKE TALENTS</span></div>\n </div>\n</section>\n<div id=\"nx13Work\">\n <div class=\"nx13-intro\"><div><span class=\"nx13-kicker\">THE LIVE BUILD WORKSHOP</span><h3>Your next build begins here.</h3><p>All changes go through the original Forge's allocation and recovery controls.</p></div><div class=\"nx13-actions\"><button id=\"nx13Undo\" type=\"button\">↶ UNDO</button><button id=\"nx13Redo\" type=\"button\">↷ REDO</button><button id=\"nx13Save\" class=\"nx13-gold\" type=\"button\">SAVE BUILD</button><button id=\"nx13Export\" type=\"button\">EXPORT JSON ↗</button></div></div>\n <div class=\"nx13-score\"><div><span>CLASS</span><strong id=\"nx13PointsClass\">0</strong></div><div><span>SPECIALIZATION</span><strong id=\"nx13PointsSpec\">0</strong></div><div><span>HERO</span><strong id=\"nx13PointsHero\">0</strong></div><div><span>STATE</span><strong id=\"nx13State\">AWAITING TREE</strong></div></div>\n <div class=\"nx13-layout\">\n  <aside class=\"nx13-left\">\n   <div class=\"nx13-boxhead\"><small>01 / FORGE SETUP</small><strong>Your Workshop</strong></div>\n   <div class=\"nx13-controls\">\n    <label>Blizzard region<select id=\"nx13Region\"></select></label>\n    <label>Playable specialization<select id=\"nx13Spec\"><option value=\"\">Load the official index</option></select></label>\n    <button id=\"nx13Load\" class=\"nx13-gold\" type=\"button\">LOAD OFFICIAL TREE</button>\n    <label>Build name<input id=\"nx13Name\" maxlength=\"75\" placeholder=\"My next build\"></label>\n    <label>Planning focus<select id=\"nx13Activity\"><option value=\"general\">General</option><option value=\"raid\">Raiding</option><option value=\"mythic-plus\">Mythic+</option><option value=\"pvp\">PvP</option><option value=\"solo\">Solo</option><option value=\"open-world\">Open world</option></select></label>\n   </div>\n   <div class=\"nx13-boxhead nx13-savedhead\"><small>02 / ORIGINAL SAVE LIBRARY</small><strong>Saved Drafts</strong></div>\n   <div id=\"nx13Library\" class=\"nx13-library\"></div><a class=\"nx13-link\" href=\"./player-experience.html\">CHARACTER-LINKED BUILDS ↗</a>\n  </aside>\n  <section class=\"nx13-center\" aria-label=\"Live talent canvas\">\n   <header class=\"nx13-centerhead\"><div><small>03 / REAL TALENT CANVAS</small><strong id=\"nx13TreeName\">Official talent tree</strong></div><span id=\"nx13Ready\">NO TREE LOADED</span></header>\n   <div class=\"nx13-tabs\" role=\"tablist\" aria-label=\"Talent categories\">\n    <button data-nx13-pool=\"class\" id=\"nx13TabClass\" role=\"tab\" aria-selected=\"true\" type=\"button\">CLASS</button>\n    <button data-nx13-pool=\"spec\" id=\"nx13TabSpec\" role=\"tab\" aria-selected=\"false\" type=\"button\">SPECIALIZATION</button>\n    <button data-nx13-pool=\"hero\" id=\"nx13TabHero\" role=\"tab\" aria-selected=\"false\" type=\"button\">HERO</button>\n   </div>\n   <div class=\"nx13-filters\"><label class=\"nx13-search\">⌕ <input type=\"search\" id=\"nx13Search\" maxlength=\"80\" placeholder=\"Find talent or node ID…\" aria-label=\"Search official talents\"></label><label class=\"nx13-checkbox\"><input type=\"checkbox\" id=\"nx13Only\"> Allocated only</label><label class=\"nx13-baseline\">COMPARE WITH<select id=\"nx13Compare\"><option value=\"\">No comparison</option></select></label></div>\n   <div class=\"nx13-status\" id=\"nx13Status\" role=\"status\" aria-live=\"polite\">Load a specialization to see Blizzard-returned talent nodes. No example skills are generated.</div>\n   <div class=\"nx13-scroll\" tabindex=\"0\" role=\"region\" aria-label=\"Scrollable talent tree map\"><div id=\"nx13Tree\" class=\"nx13-tree\"></div></div>\n   <div class=\"nx13-legend\"><span>✦ Planned ranks</span><span>◇ No allocated ranks</span><span>↑ Additional ranks</span><span>↓ Reduced ranks</span></div>\n  </section>\n  <aside class=\"nx13-right\">\n   <div class=\"nx13-boxhead\"><small>04 / LIVE INSPECTION</small><strong>Talent Intelligence</strong></div>\n   <div id=\"nx13Inspector\" class=\"nx13-inspector\"></div>\n   <div class=\"nx13-boxhead nx13-savedhead\"><small>05 / SEPARATE HISTORY</small><strong>Version Checkpoints</strong></div>\n   <p class=\"nx13-note\">Checkpoint copies never overwrite existing Talent Forge drafts.</p>\n   <button id=\"nx13Checkpoint\" type=\"button\" class=\"nx13-history-button\">+ SAVE CHECKPOINT</button>\n   <div id=\"nx13History\" class=\"nx13-history\"></div>\n  </aside>\n </div>\n <p class=\"nx13-disclaimer\"><strong>Research and manual planning only.</strong> Source IDs, names and rank descriptions come from the current Blizzard response. Planned ranks and comparisons are user-created and do not verify legal prerequisites, current meta, DPS, in-game equipment ownership or import strings.</p>\n</div>\n<div id=\"nx13Feedback\" class=\"nx13-feedback\" role=\"status\" aria-live=\"polite\" hidden></div>";
section.prepend(host);
$('tfRegion')?.closest('.panel')?.classList.add('nx13-legacy-setup');
section.querySelector('.tf-stats')?.classList.add('nx13-legacy-stats');
root.classList.add('nx13-workshop-open');
const sidebarButton=document.querySelector('.sidebar [data-view="talents"]');
if(sidebarButton){sidebarButton.textContent='✦ TALENT FORGE · REFORGED v13';sidebarButton.classList.add('nx13-nav-entry')}
const KEY='nexus_forge_reforged_checkpoints_v13';
const str=(v,n=110)=>typeof v==='string'?v.trim().slice(0,n):'';
const nodeId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0&&Number(x)<=9999999999;
const e=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=String(txt);return x};
let chosen=null,baseline='',only=false,mode=true,scheduled=0,drawId=0,signature='',toastTimer=0,lastBaselineKey='';
const snapshot=()=>{try{return bridge.snapshot()}catch(_){return null}};
const read=(key,max=800000)=>{try{const raw=localStorage.getItem(key);return raw&&raw.length<=max?JSON.parse(raw):null}catch(_){return null}};
function feedback(msg){const x=$('nx13Feedback');x.textContent=msg;x.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.hidden=true,3300)}
const pointMap=value=>{const output=Object.create(null);if(!value||typeof value!=='object'||Array.isArray(value))return output;for(const [k,v] of Object.entries(value).slice(0,450)){const n=Number(v);if(nodeId(k)&&Number.isInteger(n)&&n>=0&&n<=20)output[k]=n}return output};
const checkpoints=()=>{const raw=read(KEY,650000);return Array.isArray(raw)?raw.filter(x=>x&&typeof x==='object'&&typeof x.name==='string'&&typeof x.identity==='string'&&x.rankByNode&&typeof x.rankByNode==='object').slice(0,24):[]};
function saveLocal(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){feedback('Storage unavailable or full. Original drafts remain unchanged.');return false}}
function delegate(id){const btn=$(id);if(btn&&!btn.disabled){btn.click();schedule();return true}feedback('The original Forge control is unavailable. Check the loaded tree and recovery prompt.');return false}
function emit(x,name){x.dispatchEvent(new Event(name,{bubbles:true}))}
function copyOptions(from,to){if(!from||!to)return;to.replaceChildren();for(const o of from.options){const n=e('option','',o.textContent);n.value=o.value;to.append(n)}to.value=from.value}
function sync(){
 for(const [a,b] of [['tfRegion','nx13Region'],['tfSpec','nx13Spec']]){
  const src=$(a),dst=$(b);
  if(src.options.length!==dst.options.length||src.value!==dst.value||src.options[0]?.textContent!==dst.options[0]?.textContent)copyOptions(src,dst);
 }
 if(document.activeElement!==$('nx13Name'))$('nx13Name').value=$('tfBuildName')?.value||'';
 if(document.activeElement!==$('nx13Activity'))$('nx13Activity').value=$('tfPlanActivity')?.value||'general';
 $('nx13Load').disabled=!!$('tfLoad')?.disabled;
 $('nx13Undo').disabled=!!$('tfUndo')?.disabled;
 $('nx13Redo').disabled=!!$('tfRedo')?.disabled;
}
function savedDrafts(){const a=read('nexus_azeroth_talent_forge_v1',3500000);return Array.isArray(a)?a.filter(x=>x&&typeof x.name==='string'&&typeof x.identity==='string'&&x.rankByNode&&typeof x.rankByNode==='object').slice(0,40):[]}
function renderLibrary(){
 const area=$('nx13Library'),all=savedDrafts();area.replaceChildren();
 if(!all.length){area.append(e('div','nx13-empty','No saved drafts in this browser yet. Build and save one using the original Forge.'));return}
 const links=read('nexus_player_build_links_v11',120000)||{},profile=read('nexus_azeroth_companion_genesis_v1',450000)||{};
 for(let i=0;i<Math.min(all.length,40);i++){
  const d=all[i],entry=e('div','nx13-library-entry'),copy=e('div','nx13-library-copy'),button=e('button','','LOAD');
  copy.append(e('strong','',str(d.name,75)),e('small','',str(d.specName,70)||str(d.identity,80)));
  const key=str(d.identity,130)+'::'+str(d.savedAt,40)+'::'+str(d.name,75),cid=links?.[key];
  const character=Array.isArray(profile.characters)?profile.characters.find(c=>c.id===cid):null;
  if(character)copy.append(e('small','nx13-character-link','♟ '+str(character.name,70)));
  button.dataset.load=String(i);button.type='button';entry.append(copy,button);area.append(entry);
 }
}
function renderHistory(){
 const area=$('nx13History');area.replaceChildren();
 const rows=checkpoints();if(!rows.length){area.append(e('div','nx13-empty','No checkpoints yet. Keep versions here without changing original drafts.'));return}
 for(const d of rows){
  const item=e('div','nx13-history-entry'),copy=e('div');
  copy.append(e('strong','',str(d.name,75)),e('small','',str(d.createdAt,30).slice(0,16).replace('T',' ')+' · '+Object.values(pointMap(d.rankByNode)).reduce((a,b)=>a+b,0)+' ranks'));
  const controls=e('div','nx13-history-actions');
  for(const act of ['EXPORT','REMOVE']){const btn=e('button','',act);btn.type='button';btn.dataset.history=act.toLowerCase();btn.dataset.id=d.id;controls.append(btn)}
  item.append(copy,controls);area.append(item);
 }
}
function saveCheckpoint(){
 const s=snapshot();if(!s?.ready||!s.identity){feedback('Load a Blizzard specialization before saving a version.');return}
 const entries=checkpoints();if(entries.length>=24){feedback('The checkpoint vault is full (24). Export and remove an old version first.');return}
 const id=globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2);
 const entry={id,name:str($('tfBuildName')?.value,75)||'Working draft',identity:s.identity,region:s.region,
  rankByNode:pointMap(s.allocations),choiceByNode:pointMap(s.choiceByNode),createdAt:new Date().toISOString()};
 if(saveLocal([entry,...entries])){renderHistory();renderBaselines();feedback('Independent checkpoint saved. Original talent drafts were not modified.')}
}
function download(data,name){
 try{const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=e('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800);return true}
 catch(_){feedback('File export is unavailable here. Try the original Forge export.');return false}
}
function renderBaselines(){
 const s=snapshot(),control=$('nx13Compare'),previous=control.value;control.replaceChildren();
 const blank=e('option','','No comparison');blank.value='';control.append(blank);
 if(s?.ready){
  for(const d of s.savedDrafts||[]){const o=e('option','',str(d.name,75)+' · '+str(d.savedAt,25).slice(0,10));o.value='draft:'+str(d.savedAt,40);control.append(o)}
  for(const item of checkpoints().filter(x=>x.identity===s.identity)){const o=e('option','','CHECKPOINT · '+str(item.name,75)+' · '+item.createdAt.slice(0,10));o.value='checkpoint:'+item.id;control.append(o)}
 }
 control.value=[...control.options].some(o=>o.value===previous)?previous:'';
 baseline=control.value;
}
function baselineData(s){
 if(!s?.ready||!baseline)return null;
 if(baseline.startsWith('draft:')){const d=(s.savedDrafts||[]).find(x=>x.savedAt===baseline.slice(6));return d?{name:str(d.name),ranks:pointMap(d.rankByNode)}:null}
 if(baseline.startsWith('checkpoint:')){const d=checkpoints().find(x=>x.id===baseline.slice(11)&&x.identity===s.identity);return d?{name:str(d.name)+' checkpoint',ranks:pointMap(d.rankByNode)}:null}
 return null;
}
function nativeIcon(id){
 const img=source.querySelector('[data-tf-node="'+id+'"] .tf-spell-art img'),url=img?.getAttribute('src')||'';
 if(!(/^(?:https:\/\/|\.\/|\/)/i.test(url))||url.startsWith('//'))return null;
 return url;
}
function totals(s){
 const out={class:0,spec:0,hero:0},points=pointMap(s?.allocations);
 for(const n of s?.catalog||[])if(n.category in out)out[n.category]+=points[String(n.id)]||0;
 for(const [p,id]of [['class','nx13PointsClass'],['spec','nx13PointsSpec'],['hero','nx13PointsHero']])$(id).textContent=String(out[p]);
 $('nx13State').textContent=s?.ready?'MANUAL DRAFT':'AWAITING TREE';
 $('nx13Ready').textContent=s?.ready?(s.nodes?.length||0)+' SOURCE NODES':'NO TREE LOADED';
 $('nx13TreeName').textContent=s?.ready?str($('tfSpec')?.selectedOptions?.[0]?.textContent,115)||'Official Talent Canvas':'Official talent tree';
 for(const b of host.querySelectorAll('[data-nx13-pool]'))b.setAttribute('aria-selected',String(b.dataset.nx13Pool===s?.active));
}
function inspect(s){
 const area=$('nx13Inspector');area.replaceChildren();
 if(!s?.ready){area.append(e('div','nx13-empty','Load the source tree and select a node to inspect real returned rank descriptions.'));return}
 const n=(s.nodes||[]).find(x=>x.id===chosen);
 if(!n){area.append(e('div','nx13-empty','Select any talent card to view its official identity, all returned ranks and relevant links.'));return}
 const info=(s.catalog||[]).find(x=>x.id===n.id),rank=Number(s.allocations?.[String(n.id)]||0);
 const intro=e('div','nx13-inspector-main'),icon=e('div','nx13-inspector-art'),src=nativeIcon(n.id);
 if(src){const img=e('img');img.src=src;img.alt='';img.loading='lazy';img.decoding='async';icon.append(img)}else icon.textContent='✧';
 intro.append(icon,e('span','nx13-inspector-tag','BLIZZARD NODE #'+n.id),e('h4','',n.name),
  e('p','',str(info?.summary,600)||'Inspect official rank descriptions below.'));
 const meta=e('div','nx13-inspector-meta');
 meta.append(e('span','',rank+' / '+n.max+' MANUALLY PLANNED'),e('span','',str(info?.category||s.active).toUpperCase()+' CATEGORY'));
 intro.append(meta);
 const ctl=e('div','nx13-inspector-actions');
 for(const [act,label]of [['dec','−'],['none',rank+' / '+n.max],['inc','+']]){
  if(act==='none'){ctl.append(e('strong','',label));continue}
  const b=e('button','',label);b.dataset.rank=act;b.dataset.id=n.id;b.type='button';b.disabled=act==='dec'?rank<=0:rank>=n.max;ctl.append(b)
 }
 intro.append(ctl);
 const base=baselineData(s);if(base){const prev=base.ranks[String(n.id)]||0;intro.append(e('p','nx13-compare-note','Against '+base.name+': '+prev+' → '+rank+' planned ranks'))}
 const ids=e('div','nx13-source-ids');ids.append(e('small','','Node #'+n.id),e('small','',info?.spellId?'Spell #'+info.spellId:'Spell ID not provided'),e('small','',info?.talentId?'Talent #'+info.talentId:'Talent ID not provided'));intro.append(ids);
 const linked=(s.linkEdges||[]).filter(x=>x.from===n.id||x.to===n.id).slice(0,12);
 if(linked.length)intro.append(e('p','nx13-link-note','Source-reported links: '+linked.map(x=>x.from===n.id?'→ #'+x.to:'#'+x.from+' →').join(' · ')));
 const rankList=e('div','nx13-ranks');rankList.append(e('strong','','OFFICIAL RETURNED RANK DESCRIPTIONS'));
 for(const item of (n.ranks||[]).slice(0,20)){
  const box=e('div','nx13-rank'+(item.rank===rank?' is-planned':''));box.append(e('strong','','RANK '+item.rank+(item.rank===rank?' · ALLOCATED':'')));
  for(const c of (item.choices||[]).slice(0,5)){box.append(e('p','',str(c.name,90)||'Choice '+(c.index+1)),e('small','',str(c.description,840)||'No source description provided.'))}
  rankList.append(box);
 }
 intro.append(rankList);
 const more=e('button','nx13-original-inspect','OPEN ORIGINAL SOURCE INSPECTOR ↗');more.type='button';more.dataset.inspect=n.id;intro.append(more);
 area.append(intro);
}
function rank(id,act){
 if(!nodeId(id))return;
 let button=source.querySelector('[data-tf-'+act+'="'+id+'"]');
 if(!button){
  // Clear original Forge filters to make sure the same true node control is present.
  const field=$('tfFindNode');if(field?.value){field.value='';emit(field,'input')}
  const review=$('tfReviewOnly');if(review?.checked){review.checked=false;emit(review,'change')}
  button=source.querySelector('[data-tf-'+act+'="'+id+'"]');
 }
 if(!button||button.disabled){feedback('This action is not available in the original Forge. Check the tree and any pending recovery prompt.');return}
 chosen=Number(id);button.click();schedule();
}
function draw(s){
 const stage=$('nx13Tree');stage.replaceChildren();
 if($('tfPlanRecover')&&!$('tfPlanRecover').hidden){$('nx13Status').textContent='Unsaved recovery needs review in the original Build Architect panel below before editing. Choose Restore or Discard there.';}
 if(!s?.ready){stage.append(e('div','nx13-empty','Load an official Blizzard specialization to see its talents. No sample nodes are used.'));return}
 const all=(s.nodes||[]).filter(n=>nodeId(n.id)),q=$('nx13Search').value.trim().toLowerCase(),points=pointMap(s.allocations);
 const catalog=new Map((s.catalog||[]).map(n=>[n.id,n]));
 const filtered=all.filter(n=>(!only||points[String(n.id)]>0)&&(!q||n.name.toLowerCase().includes(q)||String(n.id).includes(q)||(catalog.get(n.id)?.summary||'').toLowerCase().includes(q)));
 if(!filtered.length){stage.append(e('div','nx13-empty','No official talents match the selected filters. Clear the search or show unallocated nodes.'));return}
 const baselineRanks=baselineData(s)?.ranks;
 const located=filtered.filter(n=>Number.isInteger(catalog.get(n.id)?.display_row)&&Number.isInteger(catalog.get(n.id)?.display_col)).length>=filtered.length*.75;
 const grid=e('div','nx13-grid'),positions=new Map(),used=new Set;
 let maxC=1;
 for(let i=0;i<filtered.length;i++){
  const n=filtered[i],info=catalog.get(n.id),native=source.querySelector('[data-tf-node="'+n.id+'"]');
  const nc=Number(native?.style?.getPropertyValue('--tf-col')),nr=Number(native?.style?.getPropertyValue('--tf-row'));
  let col=located&&nc>=1&&nc<=16?nc:located?Math.max(1,Math.min(16,Number(info?.display_col||0)+1)):i%6+1;
  let row=located&&nr>=1&&nr<=40?nr:located?Math.max(1,Math.min(38,Number(info?.display_row||0)+1)):Math.floor(i/6)+1;
  while(used.has(col+':'+row)){col++;if(col>16){col=1;row++}}
  used.add(col+':'+row);maxC=Math.max(maxC,col);positions.set(n.id,{col,row});
 }
 grid.style.setProperty('--nx13-cols',String(Math.max(3,maxC)));grid.style.width=Math.max(570,maxC*112)+'px';
 for(const n of filtered.slice(0,160)){
  const {col,row}=positions.get(n.id),value=points[String(n.id)]||0,previous=baselineRanks?.[String(n.id)]||0;
  const card=e('div','nx13-node'+(value?' nx13-allocated':'')+(baselineRanks&&value>previous?' nx13-more':baselineRanks&&value<previous?' nx13-less':''));
  card.dataset.node=n.id;card.style.gridColumn=String(col);card.style.gridRow=String(row);
  if(n.id===chosen)card.classList.add('nx13-focused');
  const title=e('button','nx13-node-select');title.type='button';title.dataset.select=n.id;
  const image=e('span','nx13-node-icon'),url=nativeIcon(n.id);
  if(url){const img=e('img');img.src=url;img.alt='';img.loading='lazy';img.decoding='async';image.append(img)}else image.textContent='✦';
  title.append(image,e('strong','',str(n.name,80)),e('small','','#'+n.id));
  const ctl=e('div','nx13-node-ranks'),down=e('button','','−'),up=e('button','','+');
  down.type='button';down.dataset.rank='dec';down.dataset.id=n.id;down.disabled=value<=0;down.setAttribute('aria-label','Reduce '+n.name+' ranks');
  up.type='button';up.dataset.rank='inc';up.dataset.id=n.id;up.disabled=value>=n.max;up.setAttribute('aria-label','Increase '+n.name+' ranks');
  ctl.append(down,e('span','',value+' / '+n.max),up);card.append(title,ctl);grid.append(card);
 }
 stage.append(grid);$('nx13Status').textContent='Showing '+filtered.length+' of '+all.length+' source nodes · '+(located?'source position layout':'compact fallback layout')+' · original Forge allocations only.';
 if(drawId)cancelAnimationFrame(drawId);
 drawId=requestAnimationFrame(()=>{
  if(!grid.isConnected)return;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','nx13-links');svg.setAttribute('viewBox','0 0 '+grid.scrollWidth+' '+grid.scrollHeight);svg.setAttribute('width',grid.scrollWidth);svg.setAttribute('height',grid.scrollHeight);svg.setAttribute('aria-hidden','true');
  const nodes=new Map([...grid.querySelectorAll('[data-node]')].map(node=>[Number(node.dataset.node),node]));
  for(const edge of (s.linkEdges||[]).slice(0,400)){
   const from=nodes.get(edge.from),to=nodes.get(edge.to);if(!from||!to||from===to)continue;
   const x1=from.offsetLeft+from.offsetWidth/2,y1=from.offsetTop+from.offsetHeight/2,x2=to.offsetLeft+to.offsetWidth/2,y2=to.offsetTop+to.offsetHeight/2,t=Math.max(20,Math.abs(y2-y1)*.5);
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M'+x1+' '+y1+' C'+x1+' '+(y1+t)+' '+x2+' '+(y2-t)+' '+x2+' '+y2);
   path.setAttribute('fill','none');path.setAttribute('stroke',chosen===edge.from||chosen===edge.to?'#f1c993':'#9db5d1');path.setAttribute('stroke-opacity',chosen===edge.from||chosen===edge.to?'0.88':'0.33');path.setAttribute('stroke-width',chosen===edge.from||chosen===edge.to?'2.4':'1.3');svg.append(path);
  }
  grid.prepend(svg);
 });
}
function hash(s){return JSON.stringify([s?.ready,s?.identity,s?.active,s?.allocations,s?.choiceByNode,s?.savedDrafts?.map(d=>d.savedAt),$('tfSpec')?.options.length,$('tfSpec')?.value,$('tfRegion')?.value,$('tfBuildName')?.value,$('tfPlanActivity')?.value,$('tfSaved')?.querySelectorAll('[data-tf-open]').length,source.querySelectorAll('[data-tf-node] img').length,baseline,only,$('nx13Search').value,checkpoints().length])}
function render(force=false){
 const s=snapshot();sync();totals(s);
 const nextKey=String(s?.identity||'')+'|'+(s?.savedDrafts||[]).map(d=>str(d.savedAt,40)).join(';')+'|'+checkpoints().map(d=>d.id).join(';');
 if(nextKey!==lastBaselineKey){lastBaselineKey=nextKey;renderBaselines()}
 const next=hash(s);if(!force&&next===signature)return;signature=next;
 draw(s);inspect(s);renderLibrary();
}
function schedule(){if(scheduled)return;scheduled=setTimeout(()=>{scheduled=0;render()},130)}
const originalToolbar=source.closest('.tf-toolbar');
$('nx13Toggle').addEventListener('click',()=>{
 mode=!mode;root.classList.toggle('nx13-workshop-open',mode);$('nx13Work').hidden=!mode;
 $('nx13Toggle').textContent=mode?'CLASSIC FORGE VIEW':'RETURN TO REFORGED VIEW';$('nx13Toggle').setAttribute('aria-pressed',String(mode));
 if(mode){render(true);$('nx13Work').scrollIntoView({block:'nearest'})}else originalToolbar?.scrollIntoView({block:'start'});
});
$('nx13Region').addEventListener('change',event=>{$('tfRegion').value=event.target.value;emit($('tfRegion'),'change');schedule()});
$('nx13Spec').addEventListener('change',event=>{$('tfSpec').value=event.target.value;emit($('tfSpec'),'change');schedule()});
$('nx13Load').addEventListener('click',()=>{$('tfSpec').value=$('nx13Spec').value;delegate('tfLoad')});
$('nx13Name').addEventListener('input',event=>{$('tfBuildName').value=event.target.value;emit($('tfBuildName'),'input')});
$('nx13Activity').addEventListener('change',event=>{$('tfPlanActivity').value=event.target.value;emit($('tfPlanActivity'),'change')});
for(const [newId,original]of [['nx13Undo','tfUndo'],['nx13Redo','tfRedo'],['nx13Save','tfSave'],['nx13Export','tfExport']])$(newId).addEventListener('click',()=>delegate(original));
$('nx13Search').addEventListener('input',event=>{$('tfFindNode').value=event.target.value;emit($('tfFindNode'),'input');schedule()});
$('nx13Only').addEventListener('change',event=>{only=event.target.checked;render(true)});
$('nx13Compare').addEventListener('change',event=>{baseline=event.target.value;render(true)});
$('nx13Checkpoint').addEventListener('click',saveCheckpoint);
for(const button of host.querySelectorAll('[data-nx13-pool]'))button.addEventListener('click',()=>{
 const target=document.querySelector('[data-tf-tab="'+button.dataset.nx13Pool+'"]');
 if(target){target.click();schedule()}else feedback('Original Forge category is unavailable.');
});
$('nx13Tree').addEventListener('click',event=>{
 const select=event.target.closest('button[data-select]'),rankButton=event.target.closest('button[data-rank]');
 if(select){chosen=Number(select.dataset.select);inspect(snapshot());for(const card of $('nx13Tree').querySelectorAll('[data-node]'))card.classList.toggle('nx13-focused',Number(card.dataset.node)===chosen);return}
 if(rankButton){rank(rankButton.dataset.id,rankButton.dataset.rank);inspect(snapshot())}
});
$('nx13Inspector').addEventListener('click',event=>{
 const rankButton=event.target.closest('button[data-rank]');
 if(rankButton){rank(rankButton.dataset.id,rankButton.dataset.rank);return}
 const inspect=event.target.closest('button[data-inspect]');
 if(inspect){
  const target=source.querySelector('[data-tf-inspect="'+inspect.dataset.inspect+'"]');
  if(target){target.click();feedback('Original source inspector opened below.')}else feedback('Original inspector unavailable while filters are active.');
 }
});
$('nx13Library').addEventListener('click',event=>{
 const button=event.target.closest('button[data-load]');if(!button)return;
 const target=$('tfSaved')?.querySelector('[data-tf-open="'+button.dataset.load+'"]');
 if(target){target.click();feedback('Loading saved build through the original Forge.');schedule()}else feedback('Saved draft not available in the native library.');
});
$('nx13History').addEventListener('click',event=>{
 const button=event.target.closest('button[data-history]');if(!button)return;
 const d=checkpoints().find(x=>x.id===button.dataset.id);if(!d)return;
 if(button.dataset.history==='remove'){
  if(!confirm('Remove this v13 checkpoint? The original saved draft will remain unchanged.'))return;
  if(saveLocal(checkpoints().filter(x=>x.id!==d.id))){renderHistory();renderBaselines();render(true);feedback('Checkpoint removed, original drafts preserved.')}
 }else{
  const [region,treeId]=d.identity.split('/');
  const payload={format:'nexus-azeroth-talent-draft-v1',name:d.name,identity:d.identity,region,treeId:Number(treeId),specName:'Manual historical checkpoint',
   rankByNode:d.rankByNode,choiceByNode:d.choiceByNode,savedAt:d.createdAt,notice:'Manual snapshot. Validate in-game; not an import string.'};
  if(download(payload,'nexus-reforged-checkpoint-v13.json'))feedback('Checkpoint exported.');
 }
});
new MutationObserver(schedule).observe(source,{childList:true,subtree:true});
new MutationObserver(schedule).observe($('tfSpec'),{childList:true});
if($('tfSaved'))new MutationObserver(schedule).observe($('tfSaved'),{childList:true,subtree:true});
for(const id of ['tfCompare','tfRegion','tfSpec','tfSave','tfUndo','tfRedo'])$(id)?.addEventListener('change',schedule);
document.addEventListener('nexus:view-activated',event=>{if(event.detail?.view==='talents')schedule()});
sync();renderBaselines();renderHistory();render(true);
})();