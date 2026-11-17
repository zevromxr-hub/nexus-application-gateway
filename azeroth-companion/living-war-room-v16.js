/* NEXUS | AZEROTH v16 — LIVE WAR ROOM + COMMAND SEARCH 2.0
 * Additive to v10 Command Center, source-labeled local records, no network.
 * Explicit character choice writes the existing v11 focus key only.
 */
(()=>{'use strict';
const core=window.NexusWorldEngineCoreV16,main=document.getElementById('nx10Root');
if(!main||!core||document.getElementById('nx16WarRoom'))return;
const $=id=>document.getElementById(id),element=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const war=element('section','nx16-war-room');war.id='nx16WarRoom';war.innerHTML="\n<section class=\"nx16-war-banner\" aria-labelledby=\"nx16WarTitle\">\n <div class=\"nx16-war-copy\"><span class=\"nx16-kicker\">NEXUS / LIVING WORLD ENGINE · v16.0</span><h2 id=\"nx16WarTitle\">THE LIVING<br><em>WAR ROOM.</em></h2><p>Your character, next objectives, personal builds and world research—united inside your existing cinematic Command Center.</p>\n <div class=\"nx16-war-actions\"><a href=\"./world-atlas.html\" class=\"nx16-war-primary\">EXPLORE THE WORLD ATLAS ↗</a><button id=\"nx16LaunchSearch\" type=\"button\">⌕ COMMAND SEARCH 2.0</button></div>\n <div class=\"nx16-war-proof\">BROWSER-LOCAL PLANNING · NO LIVE PLAYER LOCATION · ZERO ACCOUNT CHANGES</div></div>\n <div class=\"nx16-war-portrait\" aria-hidden=\"true\"></div>\n</section>\n<div class=\"nx16-war-grid\">\n<section class=\"nx16-war-panel nx16-character\">\n <div class=\"nx16-panel-top\"><span>01 / YOUR SOVEREIGN</span><h3>Choose your legend.</h3></div>\n <label for=\"nx16WarCharacter\">LOCAL CHARACTER ROSTER</label>\n <select id=\"nx16WarCharacter\" aria-label=\"Choose locally saved character\"><option value=\"\">No character selected</option></select>\n <div class=\"nx16-character-dossier\"><strong id=\"nx16WarName\">YOUR LEGEND AWAITS</strong><span id=\"nx16WarMeta\">A local character profile personalizes this room.</span><small>MANUAL PROFILE · NOT VERIFIED ACCOUNT DATA</small></div>\n <div class=\"nx16-war-links\"><a href=\"./player-experience.html\">OPEN CHARACTER NEXUS ↗</a><a href=\"./?enter=1&amp;view=talents\">ENTER TALENT FORGE ↗</a></div>\n</section>\n<section class=\"nx16-war-panel nx16-briefing\">\n <div class=\"nx16-panel-top\"><span>02 / PERSONAL MISSION BOARD</span><h3>Your next move.</h3></div>\n <div class=\"nx16-war-metrics\"><div><strong id=\"nx16WarGoals\">0</strong><small>World objectives</small></div><div><strong id=\"nx16WarDrafts\">0</strong><small>Saved talent drafts</small></div><div><strong id=\"nx16WarItemTargets\">0</strong><small>Manual item records</small></div></div>\n <div id=\"nx16WarBriefing\" class=\"nx16-next-mission\" aria-live=\"polite\">Personal world objectives appear here as you plan them.</div>\n <div class=\"nx16-war-links\"><a href=\"./world-atlas.html#nx16Missions\">PLAN A WORLD OBJECTIVE ↗</a><a href=\"./save-protection.html\">BACK UP MY PROGRESS ↗</a></div>\n</section>\n<section class=\"nx16-war-panel nx16-portals\">\n <div class=\"nx16-panel-top\"><span>03 / CONNECTED DESTINATIONS</span><h3>Enter your next chapter.</h3></div>\n <div class=\"nx16-mini-portals\">\n  <a class=\"nx16-mini-portal nx16-mini-atlas\" href=\"./world-atlas.html\"><span>01 / DISCOVER</span><strong>WORLD ATLAS</strong><small>Explore curated destinations</small></a>\n  <a class=\"nx16-mini-portal nx16-mini-forge\" href=\"./?enter=1&amp;view=talents\"><span>02 / CREATE</span><strong>TALENT FORGE</strong><small>Source-backed planning</small></a>\n  <a class=\"nx16-mini-portal nx16-mini-character\" href=\"./player-experience.html\"><span>03 / PREPARE</span><strong>CHARACTER NEXUS</strong><small>Your personal command</small></a>\n </div>\n</section>\n</div>\n<div class=\"nx16-war-footer\"><span>INTERCONNECTED RESEARCH · VISUAL INTELLIGENCE · OWNER-APPROVED DEVELOPMENT</span><a href=\"./player-test-checklist.html\">FUTURE TESTER CHECKLIST ↗</a></div>";
const after=document.querySelector('.nx10-status-strip');
if(after)after.after(war);else document.querySelector('.nx10-shell')?.prepend(war);
const search=element('div');search.innerHTML="<dialog id=\"nx16SearchDialog\" class=\"nx16-command-dialog\" aria-labelledby=\"nx16SearchTitle\"><div class=\"nx16-command-top\"><div><span class=\"nx16-kicker\">NEXUS / INTELLIGENCE NETWORK</span><h2 id=\"nx16SearchTitle\">Command Search 2.0</h2></div><button id=\"nx16CloseSearch\" type=\"button\" aria-label=\"Close command search\">✕</button></div>\n<label class=\"nx16-search-field\" for=\"nx16SearchField\"><span aria-hidden=\"true\">⌕</span><input id=\"nx16SearchField\" autocomplete=\"off\" type=\"search\" placeholder=\"Search Azeroth regions, saved builds, item IDs, objectives...\" aria-label=\"Search site destinations and local planning records\"></label><div id=\"nx16SearchStatus\" class=\"nx16-search-status\" role=\"status\" aria-live=\"polite\">Type at least two characters.</div>\n<div id=\"nx16SearchResults\" class=\"nx16-search-results\" role=\"list\"></div><p>Queries are processed locally; no search text or personal records are sent to a server. Press Esc to close.</p></dialog>";const dialog=search.firstChild;document.body.append(dialog);
const KEYS={profiles:'nexus_azeroth_companion_genesis_v1',focus:'nexus_player_focus_v11',drafts:'nexus_azeroth_talent_forge_v1',
 atlas:'nexus_azeroth_item_atlas_v1',goals:'nexus_world_atlas_goals_v16',board:'nexus_command_center_goals_v10',
 quest:'nexus_player_quests_v11'};
const read=(key,limit=3300000)=>{try{const raw=localStorage.getItem(key);return raw&&raw.length<=limit?JSON.parse(raw):null}catch(_){return null}};
const list=value=>Array.isArray(value)?value.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
const chars=()=>list(read(KEY.profiles)?.characters).map(core.characterize).filter(Boolean).slice(0,250);
function selectedCharacter(){
 const selected=$('nx16WarCharacter').value,items=chars();return items.find(x=>x.id===selected)||null;
}
function fillCharacters(){
 const select=$('nx16WarCharacter'),items=chars();
 let focused='';try{focused=localStorage.getItem(KEYS.focus)||''}catch(_){}
 const chosen=select.value||focused,old=select.value;
 select.replaceChildren();const guest=element('option','','Explore as guest');guest.value='';select.append(guest);
 items.forEach(c=>{const o=element('option','',c.name+(c.className?' · '+c.className:''));o.value=c.id;select.append(o)});
 select.value=items.some(x=>x.id===chosen)?chosen:items.some(x=>x.id===old)?old:items[0]?.id||'';
}
function refresh(){
 const profile=selectedCharacter(),drafts=list(read(KEYS.drafts)),items=list(read(KEYS.atlas)),
 goals=core.sortedGoals(read(KEYS.goals),{charId:profile?.id||''});
 $('nx16WarName').textContent=profile?.name||'YOUR LEGEND AWAITS';
 $('nx16WarMeta').textContent=profile?[profile.className,profile.spec,profile.realm].filter(Boolean).join(' · '):'Create a local character to personalize your War Room.';
 $('nx16WarGoals').textContent=String(goals.filter(x=>x.status!=='completed').length);
 $('nx16WarDrafts').textContent=String(drafts.length);
 $('nx16WarItemTargets').textContent=String(items.length);
 const open=goals.find(x=>x.status!=='completed'),board=list(read(KEYS.board)).find(x=>x.done!==true);
 const quest=list(read(KEYS.quest)).find(x=>(!profile||x.charId===profile.id)&&x.done!==true);
 const host=$('nx16WarBriefing');host.replaceChildren();
 if(open){
  host.append(element('small','','NEXT WORLD OBJECTIVE · MANUAL PLAN'),
   element('strong','',open.title),
   element('p','',core.zoneById(open.zoneId)?.name+' · '+open.category+' · '+open.status));
  const link=element('a','','OPEN RELATED DESTINATION ↗');link.href='./world-atlas.html?zone='+encodeURIComponent(open.zoneId);host.append(link);
 }else if(quest||board){
  const x=quest||board;host.append(element('small','','NEXT LOCAL OBJECTIVE · MANUAL PLAN'),
   element('strong','',core.safeText(x.title,110)||'Open objective'),
   element('p','','Recorded locally; not a live game quest confirmation.'));
  const a=element('a','','MANAGE OBJECTIVES ↗');a.href=quest?'./player-experience.html':'#nx10Chronicle';host.append(a);
 }else{
  host.append(element('strong','','Write your next chapter.'),
   element('p','','Add an exploration objective in the World Atlas or continue an existing saved build. Nothing is tracked automatically.'));
  const link=element('a','','EXPLORE THE WORLD ↗');link.href='./world-atlas.html';host.append(link);
 }
}
function onCharacterChange(){
 const chosen=selectedCharacter();
 if(chosen){try{localStorage.setItem(KEYS.focus,chosen.id)}catch(_){/* retain current selection */}}
 refresh();
}
$('nx16WarCharacter').addEventListener('change',onCharacterChange);
const openDialog=()=>{
 const existing=document.getElementById('nx10SearchDialog');
 if(existing?.open)existing.close();
 if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();
 else dialog.setAttribute('open','');
 $('nx16SearchField').value='';paintSearch();$('nx16SearchField').focus();
};
const closeDialog=()=>{if(dialog.open&&dialog.close)dialog.close();else dialog.removeAttribute('open')};
$('nx16LaunchSearch').addEventListener('click',openDialog);$('nx16CloseSearch').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog()});
document.addEventListener('keydown',event=>{
 if(!(event.ctrlKey||event.metaKey)||!event.shiftKey||event.key.toLowerCase()!=='k')return;
 event.preventDefault();if(dialog.open)closeDialog();else openDialog();
});
function paintSearch(){
 const term=$('nx16SearchField').value,host=$('nx16SearchResults');host.replaceChildren();
 const matches=core.search({query:term,characters:chars(),drafts:list(read(KEYS.drafts)),goals:read(KEYS.goals),atlas:list(read(KEYS.atlas))});
 $('nx16SearchStatus').textContent=term.trim().length<2?'Type at least two characters to search local records and curated destinations.':
  matches.length+' matching record(s) · browser-local search';
 if(!matches.length){if(term.trim().length>=2)host.append(element('p','nx16-no-results','No matching local records or curated destinations.'));return}
 matches.forEach(r=>{
  const a=element('a','nx16-result');a.href=r.href;a.setAttribute('role','listitem');
  const copy=element('span');copy.append(element('strong','',r.label),element('small','',r.subtitle));
  a.append(element('b','',r.type),copy,element('span','nx16-result-arrow','↗'));host.append(a);
 });
}
$('nx16SearchField').addEventListener('input',paintSearch);
$('nx16SearchField').addEventListener('keydown',event=>{
 if(event.key!=='Enter')return;
 const first=$('nx16SearchResults').querySelector('a[href]');if(first){event.preventDefault();first.click()}
});
window.addEventListener('storage',event=>{
 if(Object.values(KEYS).includes(event.key)){fillCharacters();refresh();if(dialog.open)paintSearch()}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){fillCharacters();refresh()}});
fillCharacters();refresh();
})();