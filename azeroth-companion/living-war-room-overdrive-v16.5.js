/* NEXUS | AZEROTH v16.5 — WAR ROOM MISSION PULSE
 * Enriches original v16 command room, never replacing legacy navigation
 * or writing any account, character, Forge or personal planning record.
 */
(()=>{'use strict';
const root=document.getElementById('nx16WarRoom'),world=window.NexusWorldEngineCoreV16,engine=window.NexusAdventureIntelligenceV165;
if(!root||!world||!engine||document.getElementById('nx165WarPulse'))return;
const $=id=>document.getElementById(id),e=(tag,cls,text)=>{const v=document.createElement(tag);if(cls)v.className=cls;if(text!==undefined)v.textContent=String(text);return v};
const read=(key,limit=350000)=>{try{const x=localStorage.getItem(key);return x&&x.length<limit?JSON.parse(x):null}catch(_){return null}};
const header=root.querySelector('.nx16-war-actions');
if(header&&!header.querySelector('.nx165-war-launch')){
 const a=e('a','nx165-war-launch','⚔ OPEN EXPEDITION CONSOLE ↗');a.href='./expedition-console.html';header.append(a);
}
const host=e('div','nx165-war-pulse');host.id='nx165WarPulse';
host.innerHTML='<div class="nx165-pulse-head"><span>THE EXPEDITION DIRECTOR · V16.5</span><a href="./expedition-console.html" id="nx165PulseOpen">OPEN BRIEFING ↗</a></div><strong id="nx165PulseTitle">YOUR NEXT EXPEDITION</strong><p id="nx165PulseDetail">Create a local Atlas mission and prepare it in Expedition Console.</p><div class="nx165-pulse-progress"><span>YOUR MANUAL PREPARATION</span><b id="nx165PulsePercent">—</b><i><i id="nx165PulseFill"></i></i></div>';
$('nx16WarBriefing')?.after(host);
const favorites=e('div','nx165-war-favorites');favorites.id='nx165WarFavorites';
root.querySelector('.nx16-portals')?.append(favorites);
function refresh(){
 const state=engine.normalizeState(read('nexus_adventure_intelligence_v165')),
  goals=world.cleanGoals(read('nexus_world_atlas_goals_v16'));
 const chosen=$('nx16WarCharacter')?.value||'';
 const ranked=engine.rankGoals(goals.filter(g=>!chosen||!g.charId||g.charId===chosen),state).find(x=>x.goal.status!=='completed');
 if(ranked){
  const {goal,plan}=ranked,detail=engine.inspect(goal,plan);
  const zone=world.zoneById(goal.zoneId);
  $('nx165PulseTitle').textContent=goal.title;
  $('nx165PulseDetail').textContent=(zone?.name||'Research area')+' · '+(plan?.priority||'normal')+' priority · '+(plan?.pinned?'pinned personal plan':'manual planning');
  $('nx165PulseOpen').href='./expedition-console.html?mission='+encodeURIComponent(goal.id);
  $('nx165PulsePercent').textContent=plan?.steps?.length?detail.percent+'%':'Not planned';
  $('nx165PulseFill').style.width=(plan?.steps?.length?detail.percent:0)+'%';
 }else{
  $('nx165PulseTitle').textContent='YOUR NEXT EXPEDITION';
  $('nx165PulseDetail').textContent='Add an Atlas mission to organize manual preparation, research and character-linked objectives.';
  $('nx165PulseOpen').href='./world-atlas.html#nx16Missions';
  $('nx165PulseOpen').textContent='CREATE A MISSION ↗';
  $('nx165PulsePercent').textContent='—';$('nx165PulseFill').style.width='0%';
 }
 if(ranked)$('nx165PulseOpen').textContent='OPEN BRIEFING ↗';
 favorites.replaceChildren();
 if(state.bookmarks.length){
  favorites.append(e('span','','YOUR SAVED DESTINATIONS'));
  state.bookmarks.slice(0,4).forEach(id=>{
   const place=world.zoneById(id);if(!place)return;
   const a=e('a','',place.name+' ↗');a.href='./world-atlas.html?zone='+encodeURIComponent(id);favorites.append(a);
  });
 }
}
$('nx16WarCharacter')?.addEventListener('change',refresh);
window.addEventListener('storage',event=>{
 if(['nexus_adventure_intelligence_v165','nexus_world_atlas_goals_v16','nexus_player_focus_v11'].includes(event.key))refresh();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
refresh();
})();