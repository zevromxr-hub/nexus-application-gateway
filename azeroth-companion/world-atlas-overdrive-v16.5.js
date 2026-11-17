/* NEXUS | AZEROTH v16.5 — WORLD ATLAS ASCENSION
 * Additive: keep existing map and v16 missions intact.
 * Region counts and bookmarks represent manual planning only.
 */
(()=>{'use strict';
const world=window.NexusWorldEngineCoreV16,engine=window.NexusAdventureIntelligenceV165,atlas=document.getElementById('nx16Atlas');
if(!world||!engine||!atlas||document.getElementById('nx165AtlasAscension'))return;
const $=id=>document.getElementById(id);
const e=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node};
const KEY='nexus_adventure_intelligence_v165',GOALS='nexus_world_atlas_goals_v16';
const read=(key,limit=350000)=>{try{const x=localStorage.getItem(key);return x&&x.length<limit?JSON.parse(x):null}catch(_){return null}};
let state=engine.normalizeState(read(KEY)),goals=world.cleanGoals(read(GOALS));
const section=e('section','nx165-atlas-ascension');section.id='nx165AtlasAscension';
section.setAttribute('aria-label','World Atlas v16.5 Personal Intelligence Overdrive');
section.innerHTML="<div class=\"nx165-atlas-hero\"><div><span>THE WORLD ENGINE / INTELLIGENCE ASCENSION · v16.5</span><h2>THE EXPLORER'S<br><em>WAR TABLE.</em></h2><p>See where your saved expeditions concentrate, bookmark destinations, and turn exploration ideas into preparation briefs.</p></div><a href=\"./expedition-console.html\">OPEN EXPEDITION CONSOLE ↗</a></div>\n<div class=\"nx165-atlas-pulse\" aria-label=\"Personal planning overview\"><div><small>BOOKMARKED PLACES</small><strong id=\"nx165BookmarkCount\">0</strong></div><div><small>OPEN WORLD MISSIONS</small><strong id=\"nx165ActiveMissions\">0</strong></div><div><small>MISSIONS WITH PREP PLANS</small><strong id=\"nx165PreparedMissions\">0</strong></div></div>\n<div class=\"nx165-atlas-lanes\">\n<section class=\"nx165-atlas-lane\" aria-label=\"Personal region activity\"><h3>PERSONAL REGION ACTIVITY</h3><p>Counts come only from your saved Atlas missions—not live player or world-event activity.</p><div id=\"nx165RegionActivity\" class=\"nx165-region-activity\"></div></section>\n<section class=\"nx165-atlas-lane\" aria-label=\"Your bookmarked destinations\"><h3>BOOKMARKED DESTINATIONS</h3><p>Star favorite research locations. Bookmarks stay private and never alter your missions.</p><div id=\"nx165FavoritePlaces\" class=\"nx165-favorites\"></div></section>\n<section class=\"nx165-atlas-lane nx165-next\" aria-label=\"Next personal expedition\"><h3>NEXT PERSONAL EXPEDITION</h3><p id=\"nx165NextGoalText\">Your highest-priority saved mission will appear here.</p><a href=\"./expedition-console.html\" id=\"nx165NextLink\">OPEN EXPEDITION INTELLIGENCE ↗</a></section>\n</div>";
$('nx16Map')?.after(section);
function saveState(next){
 try{const normalized=engine.normalizeState(next),s=JSON.stringify(normalized);
  if(s.length>330000)throw Error('Storage limit');
  localStorage.setItem(KEY,s);state=normalized;update();return true
 }catch(_){$('nx165NextGoalText').textContent='Browser storage unavailable; your bookmarks were not changed.';return false}
}
function decorateDestinations(){
 const host=$('nx16Destinations');if(!host)return;
 host.querySelectorAll('article.nx16-destination').forEach(card=>{
  const original=card.querySelector('button[data-zone]');if(!original)return;
  const id=original.dataset.zone;let button=card.querySelector('button[data-nx165-bookmark]');
  if(!button){button=e('button','nx165-bookmark');button.type='button';button.dataset.nx165Bookmark=id;
   button.title='Bookmark this research destination';original.after(button)}
  button.textContent=state.bookmarks.includes(id)?'★':'☆';
  button.setAttribute('aria-pressed',String(state.bookmarks.includes(id)));
  button.setAttribute('aria-label',(state.bookmarks.includes(id)?'Remove ':'Save ')+(world.zoneById(id)?.name||'destination')+' bookmark');
 });
}
function decorateMissionRows(){
 const host=$('nx16GoalRows');if(!host)return;
 host.querySelectorAll('article.nx16-mission-card').forEach(card=>{
  const id=card.querySelector('select[data-id]')?.dataset.id;if(!engine.normId(id))return;
  const actions=card.querySelector('.nx16-mission-links');if(!actions)return;
  let link=actions.querySelector('a.nx165-open-expedition');
  if(!link){link=e('a','nx165-open-expedition','PREPARE MISSION ↗');actions.prepend(link)}
  link.href='./expedition-console.html?mission='+encodeURIComponent(id);
 });
}
function update(){
 goals=world.cleanGoals(read(GOALS));
 $('nx165BookmarkCount').textContent=String(state.bookmarks.length);
 $('nx165ActiveMissions').textContent=String(goals.filter(g=>g.status!=='completed').length);
 $('nx165PreparedMissions').textContent=String(goals.filter(g=>state.records[g.id]?.steps?.length).length);
 document.querySelectorAll('#nx16RegionPins .nx16-map-pin[data-region]').forEach(pin=>{
  const count=goals.filter(g=>world.zoneById(g.zoneId)?.regionId===pin.dataset.region).length;
  let badge=pin.querySelector('.nx165-pin-count');
  if(!count){badge?.remove();return}
  if(!badge){badge=e('span','nx165-pin-count');pin.append(badge)}
  badge.textContent=String(count);
  badge.setAttribute('aria-label',count+' personal mission'+(count===1?'':'s')+' in this region');
 });
 const activities=$('nx165RegionActivity');activities.replaceChildren();
 const countFor=r=>goals.filter(g=>world.zoneById(g.zoneId)?.regionId===r.id).length;
 const highest=Math.max(1,...world.regions.map(countFor));
 world.regions.forEach(r=>{
  const count=countFor(r),button=e('button','nx165-region-bar');button.type='button';button.dataset.region=r.id;
  const head=e('span');head.append(e('strong','',r.name),e('b','',count+' personal goal'+(count===1?'':'s')));
  const track=e('span','nx165-bar-track'),fill=e('span','nx165-bar-fill');
  fill.style.width=(count/highest*100)+'%';track.append(fill);button.append(head,track);activities.append(button);
 });
 const favorites=$('nx165FavoritePlaces');favorites.replaceChildren();
 if(!state.bookmarks.length)favorites.append(e('p','nx165-empty','No bookmarks yet. Select a zone and tap its star.'));
 state.bookmarks.forEach(id=>{
  const zone=world.zoneById(id);if(!zone)return;
  const row=e('div','nx165-place'),link=e('a','',zone.name);link.href='./world-atlas.html?zone='+encodeURIComponent(id);
  const remove=e('button','','✕');remove.type='button';remove.dataset.removeBookmark=id;remove.setAttribute('aria-label','Remove bookmark '+zone.name);
  row.append(link,remove);favorites.append(row);
 });
 const ranked=engine.rankGoals(goals,state).find(x=>x.goal.status!=='completed');
 const next=$('nx165NextGoalText'),link=$('nx165NextLink');
 if(ranked){
  const zone=world.zoneById(ranked.goal.zoneId);
  next.textContent=ranked.goal.title+' · '+(zone?.name||'Curated destination')+' · '+(ranked.plan?.priority||'normal')+' personal priority.';
  link.href='./expedition-console.html?mission='+encodeURIComponent(ranked.goal.id);
  link.textContent='PREPARE THE NEXT EXPEDITION ↗';
 }else{
  next.textContent='Save a mission at a curated destination to begin preparing your next adventure.';
  link.href='./world-atlas.html#nx16Missions';link.textContent='CREATE YOUR FIRST MISSION ↗';
 }
 decorateDestinations();decorateMissionRows();
}
$('nx16Destinations')?.addEventListener('click',event=>{
 const button=event.target.closest('button[data-nx165-bookmark]');if(!button)return;
 const id=button.dataset.nx165Bookmark;if(!world.zoneById(id))return;
 const set=new Set(state.bookmarks);if(set.has(id))set.delete(id);
 else if(set.size<45)set.add(id);
 else{$('nx165NextGoalText').textContent='Bookmark limit reached (45); remove an older favorite first.';return}
 saveState({...state,bookmarks:[...set]});
});
$('nx165FavoritePlaces').addEventListener('click',event=>{
 const button=event.target.closest('button[data-remove-bookmark]');if(!button)return;
 const id=button.dataset.removeBookmark;if(!world.zoneById(id))return;
 saveState({...state,bookmarks:state.bookmarks.filter(x=>x!==id)});
});
$('nx165RegionActivity').addEventListener('click',event=>{
 const button=event.target.closest('button[data-region]');if(!button)return;
 const ref=document.querySelector('#nx16RegionStrip button[data-region="'+button.dataset.region+'"]');
 if(ref){ref.click();$('nx16Map').scrollIntoView({behavior:'smooth',block:'start'})}
});
const destinations=$('nx16Destinations'),missionRows=$('nx16GoalRows');
if(destinations)new MutationObserver(decorateDestinations).observe(destinations,{childList:true});
if(missionRows)new MutationObserver(update).observe(missionRows,{childList:true});
window.addEventListener('storage',event=>{
 if(event.key===KEY)state=engine.normalizeState(read(KEY));
 if([KEY,GOALS].includes(event.key))update();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){state=engine.normalizeState(read(KEY));update()}});
update();
})();