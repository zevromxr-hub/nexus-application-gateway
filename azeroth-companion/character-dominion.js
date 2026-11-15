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
 render();
});
window.addEventListener('nexus:character-profile-updated',render);
window.addEventListener('nexus:character-targets-changed',render);
window.addEventListener('nexus:farm-operations-changed',render);
window.addEventListener('nexus:item-atlas-changed',render);
window.addEventListener('nexus:loot-updated',render);
window.addEventListener('storage',e=>{if(Object.values(KEYS).includes(e.key))render()});
window.addEventListener('pageshow',render);
render();
})();