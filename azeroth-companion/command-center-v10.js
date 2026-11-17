/* NEXUS | AZEROTH v10.0 — Living Command Center
 * Purpose: a lightweight cinematic gateway + safe local workspace preview.
 * Reads existing manual plans read-only; writes ONLY v10 goal board, shared v9
 * visual mode, and existing session entry marker when launching the full app.
 * No Blizzard requests, credentials, invented character stats or shared key mutations.
 */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const APP='./?enter=1';
const KEY_CORE='nexus_azeroth_companion_genesis_v1';
const KEY_TALENTS='nexus_azeroth_talent_forge_v1';
const KEY_GOALS='nexus_command_center_goals_v10';
const KEY_VISUAL='nexus_visual_mode_v9';
const KEY_ENTRY='nexus_living_entry_seen_v9';
const SCENES=[
 {title:'Sovereign Adventure Operations v17',group:'Multi-mission session planning',desc:'Assemble and reorder local Atlas objectives, review linked manual builds and export private session briefs',url:'./adventure-operations.html',tokens:'sovereign adventure operations v17 mission sequence multi mission session board briefing personal time budget character talent atlas'},
 {title:'Expedition Intelligence v16.5',group:'Adventure preparation',desc:'Character-aware personal mission checklists, source links and exportable briefs',url:'./expedition-console.html',tokens:'expedition missions adventure planner checklist priority pinned goals readiness research world atlas'},
 {title:'World Atlas Route Architect v18.1',group:'World research',desc:'Interactive world chart, saved personal multi-stop routes, map pins and mission intelligence',url:'./world-atlas.html',tokens:'world atlas route planner itinerary multi stop map region continent locations cities khaz algar stormwind orgrimmar missions adventure'},
 {title:'Sovereign Character Nexus v15',group:'Player workspace',desc:'Blizzard public gear, character-linked talent builds, personal objectives and portable build packages',url:'./player-experience.html',tokens:'my character player experience dossier build intelligence history quest journal'},
 {title:'Save Protection Center',group:'Safety',desc:'Export a private backup of supported local planning records',url:'./save-protection.html',tokens:'save protection safety backup export recovery browser local storage'},
 {title:'Sovereign Ascension',group:'Studio',desc:'Unified character command and public research',url:'./sovereign-ascension.html',tokens:'sovereign ascension character command research profile'},
 {title:'Talent Forge',group:'Studio',desc:'Skill and build planning with allocated ranks',url:'./?enter=1&view=talents',tokens:'talent forge skill builds planner trees specialization'},
 {title:'The Living Armory',group:'Studio',desc:'Public equipment comparison and item research',url:'./character-intelligence.html',tokens:'living armory equipment gear characters items'},
 {title:'Adventure Journal',group:'Studio',desc:'Mythic+, raids and reputation research',url:'./progression-intelligence.html',tokens:'adventure journal progression raids mythic reputations'},
 {title:'The Azeroth Oracle',group:'Studio',desc:'Guided companion help and missions',url:'./azeroth-assistant.html',tokens:'oracle assistant help missions guide'},
 {title:'Build Architect',group:'Companion tool',desc:'Your locally saved build references',url:'./?enter=1&view=builds',tokens:'build architect saved builds'},
 {title:'Character Command Center',group:'Companion tool',desc:'Create and manage manual character records',url:'./?enter=1&view=characters',tokens:'character command center roster'},
 {title:'Progression Planner',group:'Companion tool',desc:'Your manually planned objectives',url:'./?enter=1&view=progress',tokens:'progression planner tasks goals objectives'},
 {title:'Collection Vault',group:'Companion tool',desc:'Saved collection and farming intentions',url:'./?enter=1&view=collections',tokens:'collection vault loot farming items'},
 {title:'Item Atlas',group:'Companion tool',desc:'Research and saved item IDs',url:'./?enter=1',tokens:'item atlas items search catalog'},
 {title:'Addon Nexus',group:'Research tool',desc:'Curated addon and mod catalog',url:'./addon-nexus.html',tokens:'addon nexus curated catalog'},
 {title:'Player Handbook',group:'Guide',desc:'Learn the existing tools and limitations',url:'./player-handbook.html',tokens:'help handbook guide'},
 {title:'Developer Identity',group:'About',desc:'Meet the independent developer behind NEXUS',url:'./developer.html',tokens:'developer founder identity'},
 {title:'Release Notes',group:'About',desc:'Application updates and development history',url:'./release-notes.html',tokens:'updates releases changelog'}
];
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const text=(x,limit=92)=>typeof x==='string'?x.trim().slice(0,limit):'';
const list=(x,limit)=>Array.isArray(x)?x.filter(obj).slice(0,limit):[];
const validHref=href=>href==='#nx10Chronicle'||typeof href==='string'&&href.startsWith('./')&&!href.startsWith('.//')?href:APP;
function readJson(key,max=3500000){
 try{const s=localStorage.getItem(key);return s&&s.length<=max?JSON.parse(s):null}catch(_){return null}
}
const core=readJson(KEY_CORE);
const chars=list(core?.characters,150).filter(c=>text(c.name));
const mainBuilds=list(core?.builds,180).filter(b=>text(b.title));
const talentBuilds=list(readJson(KEY_TALENTS),120).filter(b=>text(b.name)&&obj(b.rankByNode));
const tasks=list(core?.tasks,500);
const collections=list(core?.collections,500);
const GOAL_CATEGORIES=['Adventure','Builds','Equipment','Collections','Custom'];
function parseGoals(){
 const data=readJson(KEY_GOALS,140000);
 if(!Array.isArray(data))return [];
 return data.filter(x=>obj(x)&&typeof x.id==='string'&&typeof x.title==='string'&&GOAL_CATEGORIES.includes(x.category))
   .slice(0,120).map(x=>({id:x.id.slice(0,90),title:text(x.title,96),category:x.category,done:x.done===true,createdAt:text(x.createdAt,40)})).filter(x=>x.title);
}
let goals=parseGoals();
let tab='characters';
const e=(tag,cls,content)=>{
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(content!==undefined)node.textContent=String(content);
 return node;
};
let toastTimer=0;
function toast(message){
 const el=$('nx10Toast');el.textContent=message;el.hidden=false;
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3400);
}
function stampEntered(){try{sessionStorage.setItem(KEY_ENTRY,'entered')}catch(_){}}
document.querySelectorAll('[data-nx10-app]').forEach(link=>link.addEventListener('click',stampEntered));
function metric(id,value){$(id).textContent=String(value)}
function updateMetrics(){
 metric('nx10CountCharacters',chars.length);
 metric('nx10CountBuilds',mainBuilds.length+talentBuilds.length);
 metric('nx10CountGoals',goals.filter(x=>!x.done).length+tasks.filter(x=>x.done!==true).length+collections.filter(x=>x.done!==true).length);
}
const first=chars[0];
if(first){
 $('nx10FeaturedName').textContent=text(first.name,42).toUpperCase();
 const meta=[text(first.className,35),text(first.spec,38),text(first.realm,48)].filter(Boolean).join(' · ');
 $('nx10FeaturedMeta').textContent=meta||'Manual character profile stored in this browser.';
}
function resume(){
 const validView=/^[a-z0-9-]{2,30}$/;
 const recent=readJson('nexus_citadel_recent_view_v91',5000);
 let href=APP,info='The complete companion is ready with your existing studios and tools.';
 if(obj(recent)&&validView.test(String(recent.view||''))){
  href='./?enter=1&view='+encodeURIComponent(recent.view);
  info='Resume your recent companion view: '+(text(recent.label,75)||text(recent.view,30))+'.';
 }else{
  const last=(()=>{try{return localStorage.getItem('nexus_citadel_last_v9_1')}catch(_){return null}})();
  const map={sovereign:'./sovereign-ascension.html',forge:'./?enter=1&view=talents',armory:'./character-intelligence.html',adventure:'./progression-intelligence.html',oracle:'./azeroth-assistant.html'};
  if(map[last]){href=map[last];info='Resume your last visited studio: '+SCENES.filter(x=>x.url===href).map(x=>x.title).join(', ')+'.'}
 }
 $('nx10Resume').href=validHref(href);
 $('nx10ResumeButton').href=validHref(href);
 $('nx10ResumeText').textContent=info;
}
resume();
function empty(host,heading,desc,url,label){
 const box=e('div','nx10-empty');box.append(e('strong','',heading),e('small','',desc));
 const a=e('a','',label);a.href=url;if(url.includes('?enter=1'))a.addEventListener('click',stampEntered);
 box.append(a);host.append(box);
}
function addRecord(host,glyph,title,desc,url,label){
 const card=e('div','nx10-record'),art=e('span','nx10-record-art',glyph),copy=e('div','nx10-record-copy');
 copy.append(e('strong','',title),e('small','',desc));card.append(art,copy);
 const a=e('a','',label||'OPEN ↗');a.href=url;if(url.includes('?enter=1'))a.addEventListener('click',stampEntered);card.append(a);host.append(card);
}
function renderCharacters(){
 const host=$('nx10CharactersList');host.replaceChildren();
 if(!chars.length){empty(host,'A legend begins with a character','Create a manual character profile in the original companion.','./?enter=1&view=characters','CREATE A CHARACTER ↗');return}
 chars.slice(0,7).forEach(c=>{
  const info=[text(c.className,38),text(c.spec,38),text(c.realm,48),text(c.version,22)].filter(Boolean).join(' · ');
  addRecord(host,'♟',text(c.name,65),info+' · Manual profile','./?enter=1&view=characters','VIEW ↗');
 });
 if(chars.length>7)host.append(e('small','nx10-board-note','Showing the first 7 of '+chars.length+' saved manual profiles. Open the full companion to manage all.'));
}
function countRanks(raw){
 let n=0;
 if(!obj(raw))return n;
 for(const [k,v] of Object.entries(raw).slice(0,450)){
  if(!/^\d{1,12}$/.test(k))continue;
  const x=Number(v);if(Number.isInteger(x)&&x>=0&&x<=20)n+=x;
 }
 return n;
}
function renderBuilds(){
 const host=$('nx10BuildsList');host.replaceChildren();
 if(!mainBuilds.length&&!talentBuilds.length){empty(host,'Your forge is ready','Save a build in Talent Forge or Build Architect to see it here.','./?enter=1&view=talents','OPEN TALENT FORGE ↗');return}
 const entries=[
  ...talentBuilds.slice(0,6).map(b=>({title:text(b.name,75),desc:[text(b.identity,62),countRanks(b.rankByNode)+' planned ranks','Local draft · not game-confirmed'].filter(Boolean).join(' · '),url:'./?enter=1&view=talents'})),
  ...mainBuilds.slice(0,6).map(b=>({title:text(b.title,75),desc:[text(b.mode,42),'Saved reference · manually entered'].filter(Boolean).join(' · '),url:'./?enter=1&view=builds'}))
 ].slice(0,8);
 entries.forEach(b=>addRecord(host,'✧',b.title,b.desc,b.url,'CONTINUE ↗'));
 if(mainBuilds.length+talentBuilds.length>entries.length)host.append(e('small','nx10-board-note','Showing '+entries.length+' of '+(mainBuilds.length+talentBuilds.length)+' locally saved build records. These are not verified game allocations.'));
}
function storeGoals(next){
 try{localStorage.setItem(KEY_GOALS,JSON.stringify(next));goals=next;updateMetrics();renderGoals();return true}
 catch(_){toast('Browser storage is unavailable or full. Your board was not changed.');return false}
}
function makeGoal(){
 const title=text($('nx10GoalTitle').value,96);
 const category=$('nx10GoalCategory').value;
 if(!title||!GOAL_CATEGORIES.includes(category)){toast('Enter an objective and valid category.');return}
 if(goals.length>=120){toast('The board holds up to 120 objectives. Export or remove older entries first.');return}
 const id=crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2);
 const next=[{id,title,category,done:false,createdAt:new Date().toISOString()},...goals];
 if(storeGoals(next)){$('nx10GoalForm').reset();toast('Objective saved to this browser.')}
}
$('nx10GoalForm').addEventListener('submit',event=>{event.preventDefault();makeGoal()});
function renderGoals(){
 const host=$('nx10GoalsList');host.replaceChildren();
 if(!goals.length){const p=e('div','nx10-empty');p.append(e('strong','','Your adventure board is ready'),e('small','','Write a goal above to start tracking your own next adventure. This will not change existing companion plans.'));host.append(p)}
 goals.forEach(g=>{
  const card=e('div','nx10-record'+(g.done?' nx10-record-done':''));const check=e('input','nx10-goal-check');check.type='checkbox';check.checked=g.done;check.setAttribute('aria-label','Mark '+g.title+' '+(g.done?'incomplete':'complete'));
  check.addEventListener('change',()=>{const next=goals.map(x=>x.id===g.id?{...x,done:check.checked}:x);if(!storeGoals(next))check.checked=g.done});
  const copy=e('div','nx10-record-copy');copy.append(e('strong','',g.title),e('small','',g.category+' · '+(g.done?'Completed manually':'Planned objective')));
  const del=e('button','nx10-delete-goal','REMOVE');del.type='button';del.setAttribute('aria-label','Remove '+g.title);
  del.addEventListener('click',()=>{if(!confirm('Remove this locally saved objective?'))return;storeGoals(goals.filter(x=>x.id!==g.id))});
  card.append(check,copy,del);host.append(card);
 });
 const existing=$('nx10ExistingTasks');existing.replaceChildren();
 const combined=[
  ...tasks.filter(t=>t.done!==true&&text(t.title)).map(t=>({title:text(t.title,95),detail:'Companion task · '+(text(t.goal,45)||'Manual plan')})),
  ...collections.filter(t=>t.done!==true&&text(t.name)).map(t=>({title:text(t.name,95),detail:'Collection target · '+(text(t.type,45)||'Manual plan')}))
 ];
 if(combined.length){
  existing.append(e('h4','','ALSO IN YOUR ORIGINAL COMPANION · READ ONLY'));
  combined.slice(0,4).forEach(t=>addRecord(existing,'◈',t.title,t.detail,'./?enter=1&view=progress','OPEN ↗'));
  if(combined.length>4)existing.append(e('small','nx10-board-note','And '+(combined.length-4)+' more locally saved tasks or collection plans.'));
 }
}
$('nx10ExportGoals').addEventListener('click',()=>{
 const payload={format:'nexus-command-center-goals-v10',exportedAt:new Date().toISOString(),goals};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=e('a');a.href=url;a.download='nexus-command-center-board-v10.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 toast('Board exported as a JSON backup.');
});
function chooseTab(name,focus=false){
 if(!['characters','builds','goals'].includes(name))return;
 tab=name;
 const map={characters:'Characters',builds:'Builds',goals:'Goals'};
 for(const [value,label] of Object.entries(map)){
  const button=$('nx10Tab'+label),panel=$('nx10Panel'+label);
  button.setAttribute('aria-selected',String(value===name));button.tabIndex=value===name?0:-1;
  panel.hidden=value!==name;
 }
 if(focus)$('nx10Tab'+map[name]).focus();
}
document.querySelectorAll('[data-nx10-tab]').forEach(button=>{
 button.addEventListener('click',()=>chooseTab(button.dataset.nx10Tab));
 button.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
  event.preventDefault();const choices=['characters','builds','goals'];const i=choices.indexOf(tab);
  const next=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;
  chooseTab(choices[next],true);
 });
});
renderCharacters();renderBuilds();renderGoals();updateMetrics();chooseTab('characters');
const dialog=$('nx10SearchDialog'),input=$('nx10SearchInput'),results=$('nx10SearchResults');
function searchIndex(){
 const local=[
  ...chars.map(c=>({title:text(c.name,65),group:'Saved manual character',desc:[text(c.className,35),text(c.realm,50)].filter(Boolean).join(' · '),url:'./?enter=1&view=characters',tokens:text(c.name)+' '+text(c.className)+' '+text(c.spec)})),
  ...mainBuilds.map(b=>({title:text(b.title,75),group:'Saved build reference',desc:'Locally saved in Build Architect',url:'./?enter=1&view=builds',tokens:text(b.title)+' '+text(b.notes)})),
  ...talentBuilds.map(b=>({title:text(b.name,75),group:'Talent Forge draft',desc:'Manual build draft with '+countRanks(b.rankByNode)+' planned ranks',url:'./?enter=1&view=talents',tokens:text(b.name)+' '+text(b.identity)})),
  ...tasks.filter(t=>text(t.title)).map(t=>({title:text(t.title,85),group:'Manual objective',desc:'Original companion task',url:'./?enter=1&view=progress',tokens:text(t.title)+' '+text(t.goal)})),
  ...collections.filter(t=>text(t.name)).map(t=>({title:text(t.name,85),group:'Collection target',desc:'Original companion collection',url:'./?enter=1&view=collections',tokens:text(t.name)+' '+text(t.type)})),
  ...goals.map(g=>({title:g.title,group:'Command board objective',desc:g.category+(g.done?' · complete':''),url:'#nx10Chronicle',tokens:g.title+' '+g.category}))
 ];
 return [...SCENES,...local.slice(0,500)];
}
function renderSearch(){
 const q=input.value.trim().toLowerCase().slice(0,100),tokens=q.split(/\s+/).filter(Boolean),all=searchIndex();
 const matches=all.filter(x=>!tokens.length||tokens.every(t=>(x.title+' '+x.desc+' '+(x.tokens||'')).toLowerCase().includes(t))).slice(0,24);
 results.replaceChildren();
 if(!matches.length){results.append(e('div','nx10-empty','No matching saved records or studios. Try “talent”, “gear”, “raid”, or a saved name.'));return}
 matches.forEach(x=>{
  const a=e('a','nx10-search-result');a.href=validHref(x.url);
  const copy=e('span');copy.append(e('strong','',x.title),e('small','',x.group+' · '+x.desc));
  a.append(copy,e('span','','↗'));
  a.addEventListener('click',()=>{if(a.href.includes('?enter=1'))stampEntered();dialog.close();
   if(x.group==='Command board objective')chooseTab('goals');
  });
  results.append(a);
 });
}
function openSearch(){if(dialog.open)return;renderSearch();dialog.showModal();input.focus()}
$('nx10SearchTrigger').addEventListener('click',openSearch);
$('nx10SearchClose').addEventListener('click',()=>dialog.close());
input.addEventListener('input',renderSearch);
document.addEventListener('keydown',event=>{
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch()}
 if(event.key==='Escape'&&dialog.open)dialog.close();
});
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
function setVisual(mode,persist=false){
 if(!['cinematic','balanced','performance'].includes(mode))return;
 for(const v of ['cinematic','balanced','performance'])document.body.classList.toggle('nx10-mode-'+v,mode===v);
 $('nx10Mode').value=mode;
 if(persist){try{localStorage.setItem(KEY_VISUAL,mode)}catch(_){}}
}
let mode='balanced';try{const m=localStorage.getItem(KEY_VISUAL);if(['cinematic','balanced','performance'].includes(m))mode=m}catch(_){}
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData||navigator.deviceMemory&&navigator.deviceMemory<=2)mode='performance';
setVisual(mode);
$('nx10Mode').addEventListener('change',()=>setVisual($('nx10Mode').value,true));
const snow=$('nx10Snow');
if(snow&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!navigator.connection?.saveData){
 const hash=n=>{const x=Math.sin(n*73.193)*43872.3;return x-Math.floor(x)};
 const mobile=window.matchMedia('(max-width:650px)').matches;const count=mobile?9:28;
 const fragment=document.createDocumentFragment();
 for(let i=0;i<count;i++){
  const p=e('i');
  p.style.setProperty('--x',(hash(i+11)*100).toFixed(1)+'%');
  p.style.setProperty('--s',(1.3+hash(i+45)*3.2).toFixed(1)+'px');
  p.style.setProperty('--o',(0.14+hash(i+21)*0.45).toFixed(2));
  p.style.setProperty('--d',(12+hash(i+56)*18).toFixed(1)+'s');
  p.style.setProperty('--delay',(-hash(i+37)*31).toFixed(1)+'s');
  p.style.setProperty('--drift',((hash(i+6)-.5)*80).toFixed(1)+'px');
  fragment.append(p);
 }
 snow.append(fragment);
 document.addEventListener('visibilitychange',()=>document.body.classList.toggle('nx10-paused',document.hidden),{passive:true});
}
})();