/* NEXUS | AZEROTH v15 — SOVEREIGN CHARACTER NEXUS
 * Additive to the existing v11 Player Experience. No OAuth access or credentials.
 * Live public data fetched on button click using existing character/equipment routes.
 * Only explicit user actions may save research identifiers or imported guest packages.
 */
(()=>{'use strict';
const previous=document.getElementById('px11Station'),select=document.getElementById('px11CharacterSelect'),core=window.NexusCharacterNexusCore;
if(!previous||!select||!core||document.getElementById('nx15Nexus'))return;
const API='https://nexus-azeroth-api.zevromxr.workers.dev';
const $=id=>document.getElementById(id);
const e=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const host=e('div','nx15-nexus');host.id='nx15Nexus';host.innerHTML="\n<section class=\"nx15-hero\" aria-labelledby=\"nx15Title\">\n <div class=\"nx15-hero-copy\"><span class=\"nx15-overline\">NEXUS / v15.0 · SOVEREIGN CHARACTER NEXUS</span>\n <h2 id=\"nx15Title\">ONE CHARACTER.<br><em>ONE LIVING WORLD.</em></h2>\n <p>Connect your existing personal character, builds, public gear research and adventure goals in one command station—without confusing your manual plans with Blizzard's records.</p>\n <div class=\"nx15-hero-actions\"><button id=\"nx15Forge\" type=\"button\">OPEN CHARACTER'S FORGE ↗</button><button id=\"nx15Adventure\" type=\"button\">MY ADVENTURE LOG ↗</button><a href=\"./save-protection.html\">PROTECT MY SAVED WORK ↗</a></div>\n <div class=\"nx15-hero-tags\"><span>LOCAL PLANNING</span><span>BLIZZARD PUBLIC RESEARCH</span><span>PORTABLE BUILDS</span></div>\n </div>\n <div class=\"nx15-portrait\"><div class=\"nx15-portrait-image\" aria-hidden=\"true\"></div><div class=\"nx15-portrait-info\"><small>SELECTED MANUAL PROFILE</small><strong id=\"nx15CharacterName\">YOUR LEGEND AWAITS</strong><span id=\"nx15CharacterMeta\">Choose a character above to begin.</span></div></div>\n</section>\n<div class=\"nx15-provenance\"><strong>DATA ORIGIN:</strong> Local manual plans stay separate from Blizzard public character and equipped-item responses. A character lookup does not establish account ownership or live game inventory.</div>\n<div class=\"nx15-metrics\"><div><small>LINKED TALENT DRAFTS</small><strong id=\"nx15BuildCount\">0</strong></div><div><small>OPEN PERSONAL GOALS</small><strong id=\"nx15GoalCount\">0</strong></div><div><small>ITEM ATLAS TARGETS</small><strong id=\"nx15TargetCount\">0</strong></div><div><small>PUBLIC EQUIPPED ITEMS</small><strong id=\"nx15EquippedCount\">—</strong></div></div>\n<div class=\"nx15-grid\">\n <section class=\"nx15-panel nx15-live\" aria-labelledby=\"nx15LiveTitle\">\n  <div class=\"nx15-panel-head\"><span>01 / CHARACTER SOURCE LINK</span><h3 id=\"nx15LiveTitle\">Living Character Dossier</h3><p>Link an optional public character identifier to this local profile. Load real profile and equipped gear only when requested.</p></div>\n  <div class=\"nx15-source-fields\"><label>REGION<select id=\"nx15Region\"><option value=\"us\">Americas</option><option value=\"eu\">Europe</option><option value=\"kr\">Korea</option><option value=\"tw\">Taiwan</option></select></label><label>REALM SLUG<input id=\"nx15Realm\" maxlength=\"80\" autocomplete=\"off\" placeholder=\"area-52\"></label><label>CHARACTER SLUG<input id=\"nx15Name\" maxlength=\"50\" autocomplete=\"off\" placeholder=\"character\"></label></div>\n  <div class=\"nx15-buttons\"><button type=\"button\" id=\"nx15Fetch\" class=\"nx15-primary\">LOAD PUBLIC BLIZZARD DATA</button><button type=\"button\" id=\"nx15Remember\">SAVE RESEARCH LINK</button><button type=\"button\" id=\"nx15OpenArmory\">OPEN FULL ARMORY ↗</button></div>\n  <div id=\"nx15FetchStatus\" class=\"nx15-source-status\" role=\"status\" aria-live=\"polite\">Choose a character and explicitly request public Blizzard research. No automatic account scans.</div>\n  <div id=\"nx15PublicFacts\" class=\"nx15-facts\"></div>\n  <small class=\"nx15-disclaimer\">Public profile data can lag behind the game. Source data is held in memory for this visit; only your optional region/realm/name research link is saved.</small>\n </section>\n <section class=\"nx15-panel nx15-builds\" aria-labelledby=\"nx15BuildTitle\">\n  <div class=\"nx15-panel-head\"><span>02 / CHARACTER ↔ TALENT FORGE</span><h3 id=\"nx15BuildTitle\">Personal Build Command</h3><p>Launch Reforged with this character's context and review drafts you've explicitly linked in My Character.</p></div>\n  <div id=\"nx15CharacterFacts\" class=\"nx15-facts\"></div>\n  <div id=\"nx15BuildRows\" class=\"nx15-list\"></div>\n  <div class=\"nx15-buttons\"><button type=\"button\" class=\"nx15-primary\" id=\"nx15ForgeBuild\">OPEN FORGE WITH CONTEXT</button><button type=\"button\" id=\"nx15OpenLinked\">MANAGE BUILD LINKS ↗</button></div>\n  <small class=\"nx15-disclaimer\">Specialization is only preselected if it matches exactly one official option. Native talent loading and saved-draft selection still require your action.</small>\n </section>\n <section class=\"nx15-panel nx15-gear\" aria-labelledby=\"nx15GearTitle\">\n  <div class=\"nx15-panel-head\"><span>03 / ARMORY + EQUIPMENT INTELLIGENCE</span><h3 id=\"nx15GearTitle\">Equipment &amp; Gear Targets</h3><p>Compare publicly reported equipped item IDs against your manually tracked Item Atlas records—not an upgrade or DPS ranking.</p></div>\n  <div id=\"nx15Equipped\" class=\"nx15-list\"><p class=\"nx15-empty\">Load public character equipment to inspect real reported slots and item levels.</p></div>\n  <h4>YOUR MANUAL ITEM ATLAS</h4><div id=\"nx15GearTargets\" class=\"nx15-list\"></div>\n  <div class=\"nx15-buttons\"><button type=\"button\" id=\"nx15Atlas\">OPEN ITEM ATLAS ↗</button><a href=\"./character-intelligence.html\">COMPARE PUBLIC GEAR ↗</a></div>\n  <small class=\"nx15-disclaimer\">An Atlas “owned” status is player-entered. A missing item is not necessarily an upgrade. The public equipment list is not an inventory scan.</small>\n </section>\n <section class=\"nx15-panel nx15-missions\" aria-labelledby=\"nx15MissionTitle\">\n  <div class=\"nx15-panel-head\"><span>04 / CONNECTED PLAYER PROGRESSION</span><h3 id=\"nx15MissionTitle\">Personal Adventure Command</h3><p>See this character's existing local objectives, global task reminders and collection research in one place.</p></div>\n  <div id=\"nx15MissionRows\" class=\"nx15-list\"></div>\n  <div class=\"nx15-buttons\"><button id=\"nx15NewGoal\" type=\"button\" class=\"nx15-primary\">ADD CHARACTER OBJECTIVE ↗</button><button id=\"nx15Collections\" type=\"button\">OPEN COLLECTIONS ↗</button></div>\n  <small class=\"nx15-disclaimer\">Displayed goals are manual planning entries, not verified in-game quest completion or automatically unlocked achievements.</small>\n </section>\n</div>\n<section class=\"nx15-exchange\" aria-labelledby=\"nx15ExchangeTitle\">\n <div class=\"nx15-exchange-header\"><div><span class=\"nx15-overline\">05 / PORTABLE BUILD VAULT</span><h3 id=\"nx15ExchangeTitle\">SHARE YOUR LEGACY.</h3><p>Export selected character-linked talent drafts, optional notes and manual objectives as a portable JSON package. Import shared packages to an isolated guest shelf.</p></div><div class=\"nx15-exchange-symbol\" aria-hidden=\"true\">✦</div></div>\n <div class=\"nx15-exchange-grid\">\n  <div class=\"nx15-exchange-card\"><h4>Export Character Package</h4><p>Includes character name, class/spec, optional realm, linked draft ranks, personal goals and optional notes. Never includes OAuth tokens, browser sessions or Blizzard account credentials.</p><label class=\"nx15-checkbox\"><input id=\"nx15IncludeNotes\" type=\"checkbox\" checked> Include personal notes and goals</label><button type=\"button\" id=\"nx15ExportPackage\" class=\"nx15-primary\">EXPORT SHAREABLE PACKAGE</button><small>Review the exported JSON before sharing; even manual notes and character names may be personal.</small></div>\n  <div class=\"nx15-exchange-card\"><h4>Import a Shared Build</h4><p>Choose a NEXUS Character Nexus package. It is validated and previewed first; your existing characters and Forge saves are never overwritten.</p><label class=\"nx15-file\">SELECT PACKAGE<input id=\"nx15ImportFile\" type=\"file\" accept=\".json,application/json\"></label><div id=\"nx15ImportPreview\" role=\"status\" class=\"nx15-preview\">No imported package selected.</div><button type=\"button\" id=\"nx15AcceptImport\" disabled>ADD TO GUEST BUILD SHELF</button></div>\n </div>\n <div class=\"nx15-guest\"><h4>Guest Build Shelf</h4><p>Explicitly imported packages stay separate from your original drafts. Download a guest draft in the original Talent Forge JSON format whenever you want to review it.</p><div id=\"nx15GuestShelf\" class=\"nx15-guest-list\"></div></div>\n <div class=\"nx15-portability-note\"><strong>Cross-device use today:</strong> Export the package on iPhone or PC and import it on the other device. Automatic cloud sync would require a separate secure backend and will not be simulated with browser storage.</div>\n</section>\n<footer class=\"nx15-footer\">SOVEREIGN CHARACTER NEXUS · POWERED BY ZEVRO | NEXUS</footer>\n";
previous.before(host);
const KEY={profiles:'nexus_azeroth_companion_genesis_v1',focus:'nexus_player_focus_v11',
 drafts:'nexus_azeroth_talent_forge_v1',links:'nexus_player_build_links_v11',quests:'nexus_player_quests_v11',
 atlas:'nexus_azeroth_item_atlas_v1',notes:'nexus_build_architect_library_v14',research:'nexus_character_research_links_v15',
 guests:'nexus_character_nexus_imports_v15'};
const read=(key,limit=3500000)=>{try{const value=localStorage.getItem(key);return value&&value.length<=limit?JSON.parse(value):null}catch(_){return null}};
const objects=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
const clean=(x,n=90)=>core.clean(x,n);
const data=()=>{const c=read(KEY.profiles),arr=objects(c?.characters),id=select.value;
 return {char:arr.find(x=>x.id===id)||null,id,core:c&&typeof c==='object'?c:{}}};
let publicData=null,request=null,preview=null,guests=loadGuests();
function safeLinks(){const x=read(KEY.research,70000);return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}
function loadGuests(){
 const raw=read(KEY.guests,950000);
 return Array.isArray(raw)?raw.slice(0,10).filter(x=>x&&typeof x.id==='string').map(x=>{const checked=core.sanitizePackage(x.package);return checked.ok?{id:x.id.slice(0,90),receivedAt:clean(x.receivedAt,35),package:checked.package}:null}).filter(Boolean):[];
}
function setStatus(message){$('nx15FetchStatus').textContent=message}
function currentSelector(){return core.normalizeSelector({region:$('nx15Region').value,realm:$('nx15Realm').value,name:$('nx15Name').value})}
function populateResearch(){
 const {char,id}=data();const stored=safeLinks()[id];
 const s=core.normalizeSelector(stored)||core.normalizeSelector({region:char?.region||'us',realm:char?.realm||'',name:char?.name||''});
 $('nx15Region').value=s?.region||'us';$('nx15Realm').value=s?.realm||clean(char?.realm,80).toLowerCase();
 $('nx15Name').value=s?.name||clean(char?.name,50).toLowerCase();
}
function facts(host,arr,empty){
 host.replaceChildren();
 const list=arr.filter(x=>x[1]!==null&&x[1]!==''&&x[1]!==undefined);
 if(!list.length){host.append(e('p','nx15-empty',empty));return}
 for(const [name,val]of list){
  const row=e('div','nx15-fact');row.append(e('small','',name),e('strong','',String(val)));host.append(row);
 }
}
function updateLocal(){
 const {char,id,core:base}=data(),drafts=objects(read(KEY.drafts)),links=read(KEY.links)||{};
 const linked=char?core.linkedDrafts(drafts,links,id):[];
 const goals=char?core.goalsFor(objects(read(KEY.quests,250000)),objects(base.tasks),id):{quests:[],tasks:[],open:0};
 const atlas=objects(read(KEY.atlas)),region=currentSelector()?.region||'us';
 $('nx15CharacterName').textContent=char?clean(char.name,75).toUpperCase():'YOUR LEGEND AWAITS';
 $('nx15CharacterMeta').textContent=char?[clean(char.className,45),clean(char.spec,45),clean(char.realm,70)].filter(Boolean).join(' · ')||'Manual profile':'Choose an existing character above.';
 $('nx15BuildCount').textContent=String(linked.length+objects(base.builds).filter(x=>x.charId===id&&id).length);
 $('nx15GoalCount').textContent=String(goals.open);
 $('nx15TargetCount').textContent=String(atlas.filter(x=>x.region===region&&['wishlist','farming'].includes(x.status)).length);
 $('nx15EquippedCount').textContent=publicData?String(publicData.items.length):'—';
 facts($('nx15CharacterFacts'),char?[
  ['CHARACTER',clean(char.name,65)],['MANUAL CLASS',clean(char.className,45)],['MANUAL SPECIALIZATION',clean(char.spec,65)],
  ['MANUAL REALM',clean(char.realm,75)],['GAME VERSION',clean(char.version,40)],
  ['DRAFTS ASSOCIATED',linked.length]
 ]:[],'Create or choose a local character in the original Companion first.');
 const builds=$('nx15BuildRows');builds.replaceChildren();
 if(!linked.length){builds.append(e('p','nx15-empty','No Talent Forge drafts linked to this character. Use the original Build Intelligence tab below to create associations.'))}
 for(const d of linked.slice(0,8)){
  const row=e('div','nx15-item'),copy=e('div');copy.append(e('strong','',clean(d.name,80)),e('small','',clean(d.specName,95)||clean(d.identity,130)));
  const down=e('button','','DOWNLOAD JSON');down.type='button';down.dataset.draft=core.draftKey(d);
  row.append(copy,down);builds.append(row);
 }
 const mission=$('nx15MissionRows');mission.replaceChildren();
 const relevant=[...goals.quests.map(x=>({title:x.title,done:x.done===true,source:'Local Adventure Log'})),
  ...goals.tasks.map(x=>({title:x.title||x.name||'Manual task',done:x.done===true,source:'Original Companion'}))];
 if(!relevant.length)mission.append(e('p','nx15-empty','No manually saved objectives for this character yet. Add one in the existing Adventure Log.'));
 relevant.slice(0,12).forEach(g=>{const row=e('div','nx15-item');row.append(e('span','nx15-goal-mark',g.done?'✓':'◌'));
 const box=e('div');box.append(e('strong','',clean(g.title,110)),e('small','',(g.done?'Completed · ':'Open · ')+g.source));row.append(box);mission.append(row)});
 renderGear();
}
function renderGear(){
 const area=$('nx15Equipped');area.replaceChildren();
 if(!publicData){area.append(e('p','nx15-empty','No public equipment loaded. Enter a region, realm slug and character, then choose Load Public Blizzard Data.'))}
 else if(!publicData.items.length)area.append(e('p','nx15-empty','The source returned no equipped item records. Nothing has been assumed.'));
 else publicData.items.slice(0,35).forEach(item=>{
  const row=e('div','nx15-item'),box=e('div');box.append(e('strong','',item.slot+' · '+item.name),
   e('small','','Blizzard public · ID '+(item.id??'not reported')+(item.level?' · ilvl '+item.level:'')));
  row.append(box);if(item.id){const a=e('a','','RESEARCH ↗');a.href=API+'/api/item/'+publicData.selector.region+'/'+item.id;a.target='_blank';a.rel='noopener noreferrer';row.append(a)}
  area.append(row);
 });
 const atlas=objects(read(KEY.atlas)),region=currentSelector()?.region||'us',targets=core.gearMatches(publicData?.items,atlas,region);
 const items=$('nx15GearTargets');items.replaceChildren();
 if(!targets.length)items.append(e('p','nx15-empty','No compatible Item Atlas records for this research region. Add targets in the existing Item Atlas studio.'));
 targets.slice(0,20).forEach(target=>{
  const row=e('div','nx15-item'),box=e('div');
  box.append(e('strong','',target.name),e('small','','Manual Atlas status: '+(target.status||'unknown')+
   (publicData?(target.reportedEquipped?' · SAME ID IN PUBLIC EQUIPMENT':' · NOT REPORTED EQUIPPED'):' · public gear not loaded')));
  row.append(box);items.append(row);
 });
}
async function requestBlizzard(){
 const selector=currentSelector();
 if(!selector){setStatus('Enter valid region, ASCII realm slug (2–80 characters) and character name slug (2–50). No request was sent.');return}
 request?.abort();const ctrl=new AbortController();request=ctrl;
 publicData=null;renderGear();$('nx15Fetch').disabled=true;setStatus('Requesting public character profile and equipped items…');
 const timeout=setTimeout(()=>ctrl.abort(),15000),path='/'+selector.region+'/'+selector.realm+'/'+selector.name;
 const get=async route=>{
  const response=await fetch(API+route+path,{credentials:'omit',cache:'no-store',headers:{Accept:'application/json'},signal:ctrl.signal});
  const result=await response.json().catch(()=>null);
  if(!response.ok||result?.success!==true)throw Error(clean(result?.message,160)||'Blizzard public endpoint returned '+response.status);
  return result.data;
 };
 try{
  const result=await Promise.allSettled([get('/api/character'),get('/api/equipment')]);
  if(ctrl.signal.aborted||request!==ctrl)return;
  if(result.every(x=>x.status==='rejected'))throw Error(result.map(x=>x.reason?.message||'Source unavailable').join(' · '));
  const facts=result[0].status==='fulfilled'?core.summarizeProfile(result[0].value,selector):null;
  const equipment=result[1].status==='fulfilled'?core.unpackEquipment(result[1].value):[];
  publicData={selector,profile:facts,items:equipment,loadedAt:new Date().toISOString(),profileOk:!!facts,gearOk:result[1].status==='fulfilled'};
  const origin=$('nx15PublicFacts');
  factsRenderPublic();
  setStatus('BLIZZARD PUBLIC RESEARCH · '+new Date(publicData.loadedAt).toLocaleString()+
   (facts&&publicData.gearOk?' · Profile and equipment loaded':' · Partial response; missing data remains unverified.'));
  updateLocal();
 }catch(error){if(ctrl.signal.aborted)setStatus('Public request was canceled or timed out. Try again.');
  else setStatus('Blizzard public research unavailable: '+clean(error?.message,190));
  $('nx15PublicFacts').replaceChildren();publicData=null;updateLocal();
 }finally{clearTimeout(timeout);if(request===ctrl){request=null;$('nx15Fetch').disabled=false}}
}
function factsRenderPublic(){
 const p=publicData?.profile;
 facts($('nx15PublicFacts'),p?[
  ['PUBLIC NAME',p.name],['BLIZZARD-REPORTED CLASS',p.className],
  ['BLIZZARD-REPORTED SPEC',p.specialization],['REPORTED LEVEL',p.level],
  ['AVERAGE ITEM LEVEL',p.averageItemLevel],['EQUIPPED ITEM LEVEL',p.equippedItemLevel],
  ['FACTION',p.faction],['SOURCE',publicData?.profileOk?'Blizzard public API':'Not available']
 ]:[],'The profile source was not available. Equipment may still be returned.');
}
function switchAdventure(focusTitle=false){
 const tab=$('px11TabJourney');tab?.click();
 ($('px11ViewJourney')||tab)?.scrollIntoView({behavior:'smooth',block:'start'});
 if(focusTitle)$('px11QuestTitle')?.focus({preventScroll:true});
}
function goForge(linkedKey){
 const {char,id}=data();
 if(!char){setStatus('Select a locally saved character before launching its Forge context.');return}
 const context={charId:String(id).slice(0,145),name:clean(char.name,70),className:clean(char.className,65),
  spec:clean(char.spec,65),region:currentSelector()?.region||null,
  draftKey:linkedKey||null,issuedAt:Date.now()};
 try{sessionStorage.setItem('nexus_character_nexus_forge_launch_v15',JSON.stringify(context))}catch(_){}
 try{sessionStorage.setItem('nexus_living_entry_seen_v9','entered')}catch(_){}
 location.assign('./?enter=1&view=talents');
}
function openArmory(){
 const p=currentSelector();if(!p){setStatus('Fill a valid region, realm and character before opening the public Armory.');return}
 const query=new URLSearchParams({enter:'1',view:'armory',armory_region:p.region,armory_realm:p.realm,armory_name:p.name});
 try{sessionStorage.setItem('nexus_living_entry_seen_v9','entered')}catch(_){}
 location.assign('./?'+query.toString());
}
function rememberLink(){
 const {id,char}=data(),p=currentSelector();
 if(!id||!char){setStatus('Select a locally saved profile to associate this research identifier.');return}
 if(!p){setStatus('Enter a valid public region, realm and character slug.');return}
 const original=safeLinks(),next={...original,[id]:p};
 if(Object.keys(next).length>120){setStatus('Research link limit reached. No changes saved.');return}
 try{localStorage.setItem(KEY.research,JSON.stringify(next));setStatus('Research identifier saved locally for this manual profile. This does not prove account ownership.')}
 catch(_){setStatus('Browser storage unavailable. Existing records unchanged.')}
}
function saveJson(data,filename){
 try{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=e('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);return true
 }catch(_){setStatus('Export unavailable in this browser; no original records were modified.');return false}
}
function currentPackage(){
 const {id,char,core:base}=data();if(!char)return null;
 const original=objects(read(KEY.drafts)),links=read(KEY.links)||{},linked=core.linkedDrafts(original,links,id);
 const include=$('nx15IncludeNotes').checked;
 const notes=read(KEY.notes)||{},annotated=linked.map(d=>({...notes[core.draftKey(d)],
  identity:d.identity,name:d.name})).filter(n=>n.name);
 const goals=include?core.goalsFor(objects(read(KEY.quests,260000)),objects(base.tasks),id).quests:[];
 const atlas=include?objects(read(KEY.atlas)):[],selector=currentSelector();
 const targets=atlas.filter(t=>t.region===(selector?.region||'us')&&['wishlist','farming'].includes(t.status));
 return core.packageFrom({character:char,drafts:linked,notes:include?annotated:[],goals,
  targets:include?targets:[]});
}
function exportPackage(){
 const pack=currentPackage();
 if(!pack){setStatus('Choose a manual character before exporting its package.');return}
 const count=pack.drafts.length;
 if(!confirm('Export a portable JSON package containing the selected character name, optional realm, '+count+' linked build(s) and your chosen optional goals/notes? Review it before sharing.'))return;
 if(saveJson(pack,'nexus-character-nexus-v15-package.json'))setStatus('Portable planning package downloaded. It does not contain account credentials or verify in-game ownership.');
}
function renderGuests(){
 const area=$('nx15GuestShelf');area.replaceChildren();
 if(!guests.length){area.append(e('p','nx15-empty','No imported guest builds yet. Add a validated JSON package above.'));return}
 guests.forEach(g=>{
  const row=e('div','nx15-guest-entry');
  const label=e('div');label.append(e('strong','',clean(g.package?.character?.name,75)||'Unnamed guest'),
   e('small','',g.package.drafts.length+' manual draft(s) · '+clean(g.receivedAt,26).slice(0,10)));
  const controls=e('div','nx15-guest-actions');
  g.package.drafts.slice(0,12).forEach((d,i)=>{
   const b=e('button','', 'DRAFT '+(i+1)+' JSON');b.type='button';b.dataset.download=g.id;b.dataset.index=String(i);b.title='Download '+d.name+' as a native Talent Forge JSON draft';
   controls.append(b);
  });
  const remove=e('button','','REMOVE PACKAGE');remove.type='button';remove.dataset.remove=g.id;controls.append(remove);
  row.append(label,controls);area.append(row);
 });
}
async function importPreview(file){
 preview=null;$('nx15AcceptImport').disabled=true;
 if(!file)return;
 if(file.size>270000){$('nx15ImportPreview').textContent='Package exceeds 270 KB limit. No data imported.';return}
 try{
  const input=JSON.parse(await file.text()),result=core.sanitizePackage(input);
  if(!result.ok)throw Error(result.error);
  preview=result.package;
  $('nx15ImportPreview').textContent='VALIDATED PREVIEW · '+preview.character.name+' · '+preview.drafts.length+
   ' manual draft(s), '+preview.goals.length+' manual goal(s). This will not change your original saves.';
  $('nx15AcceptImport').disabled=false;
 }catch(err){$('nx15ImportPreview').textContent='Package rejected: '+clean(err?.message,190);preview=null}
}
function acceptGuest(){
 if(!preview)return;
 if(guests.length>=10){$('nx15ImportPreview').textContent='Guest shelf is full (10 packages). Remove an older package before importing.';return}
 if(!confirm('Store this validated guest package in a separate local guest shelf? Existing Talent Forge drafts and characters will not be modified.'))return;
 const item={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2),receivedAt:new Date().toISOString(),package:preview};
 const next=[item,...guests];
 try{const serialized=JSON.stringify(next);if(serialized.length>900000)throw Error('Guest shelf capacity exceeded');
  localStorage.setItem(KEY.guests,serialized);guests=next;renderGuests();$('nx15ImportPreview').textContent='Guest package saved in isolated shelf. Download its individual draft JSON to review in Talent Forge.';
  preview=null;$('nx15AcceptImport').disabled=true;$('nx15ImportFile').value='';
 }catch(err){$('nx15ImportPreview').textContent='Guest shelf could not be saved: '+clean(err.message,125)}
}
function clearPublic(){
 request?.abort();request=null;publicData=null;$('nx15Fetch').disabled=false;
 $('nx15PublicFacts').replaceChildren();setStatus('Public research cleared. Load again explicitly; no account data was persisted.');
}
select.addEventListener('change',()=>{clearPublic();populateResearch();updateLocal()});
for(const id of ['nx15Region','nx15Realm','nx15Name'])$(id).addEventListener('change',()=>{clearPublic();updateLocal()});
$('nx15Fetch').addEventListener('click',requestBlizzard);
$('nx15Remember').addEventListener('click',rememberLink);
$('nx15OpenArmory').addEventListener('click',openArmory);
$('nx15Forge').addEventListener('click',()=>goForge());
$('nx15ForgeBuild').addEventListener('click',()=>goForge());
$('nx15Adventure').addEventListener('click',()=>switchAdventure());
$('nx15NewGoal').addEventListener('click',()=>switchAdventure(true));
$('nx15OpenLinked').addEventListener('click',()=>{
 $('px11TabBuilds')?.click();$('px11ViewBuilds')?.scrollIntoView({block:'start',behavior:'smooth'});
});
$('nx15Atlas').addEventListener('click',()=>{try{sessionStorage.setItem('nexus_living_entry_seen_v9','entered')}catch(_){}location.assign('./?enter=1&view=atlas')});
$('nx15Collections').addEventListener('click',()=>{try{sessionStorage.setItem('nexus_living_entry_seen_v9','entered')}catch(_){}location.assign('./?enter=1&view=collections')});
$('nx15BuildRows').addEventListener('click',event=>{
 const b=event.target.closest('button[data-draft]');if(!b)return;
 const d=objects(read(KEY.drafts)).find(x=>core.draftKey(x)===b.dataset.draft);
 const valid=d?core.validateDraft(d):null;if(valid)saveJson(valid,'nexus-character-linked-talent-draft.json');
});
$('nx15ExportPackage').addEventListener('click',exportPackage);
$('nx15ImportFile').addEventListener('change',event=>{importPreview(event.target.files?.[0]);});
$('nx15AcceptImport').addEventListener('click',acceptGuest);
$('nx15GuestShelf').addEventListener('click',event=>{
 const button=event.target.closest('button[data-download],button[data-remove]');if(!button)return;
 const item=guests.find(x=>x.id===(button.dataset.download||button.dataset.remove));if(!item)return;
 if(button.dataset.download){
  const draft=item.package.drafts[Number(button.dataset.index)];
  if(draft)saveJson(core.validateDraft(draft),'nexus-guest-talent-draft.json');return;
 }
 if(!confirm('Remove this guest package from the separate guest shelf? Original character and Talent Forge data will not be changed.'))return;
 const next=guests.filter(x=>x.id!==item.id);
 try{localStorage.setItem(KEY.guests,JSON.stringify(next));guests=next;renderGuests()}
 catch(_){$('nx15ImportPreview').textContent='Could not update the guest shelf. Nothing was removed.'}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateLocal();renderGuests()}});
populateResearch();updateLocal();renderGuests();
})();