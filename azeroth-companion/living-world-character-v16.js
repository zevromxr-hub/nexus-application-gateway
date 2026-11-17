/* NEXUS | AZEROTH v16 — read-only World Atlas bridge in Character Nexus.
 * No original character, draft, quest or session storage writes.
 */
(()=>{'use strict';
const core=window.NexusWorldEngineCoreV16,app=document.getElementById('nx15Nexus'),chooser=document.getElementById('px11CharacterSelect');
if(!core||!app||!chooser||document.getElementById('nx16CharacterWorld'))return;
const e=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const section=e('section','nx16-character-world');section.id='nx16CharacterWorld';
section.innerHTML='<div class="nx16-world-bridge-art" aria-hidden="true"></div><div class="nx16-world-bridge-copy"><span>THE LIVING WORLD · v16</span><h3>YOUR NEXT DESTINATION.</h3><p>Bring this character into a curated Azeroth region and continue your browser-local mission plans. No live player tracking.</p><div id="nx16WorldCharacterStatus" class="nx16-world-bridge-stats">Choose a local character to explore connected goals.</div><div id="nx16WorldCharacterGoals" class="nx16-world-goals"></div><div class="nx16-world-actions"><a href="./world-atlas.html">OPEN THE WORLD ATLAS ↗</a><a href="./command-center.html#nx16WarRoom">RETURN TO WAR ROOM ↗</a></div></div>';
app.after(section);
const $=id=>document.getElementById(id);
const read=()=>{try{const x=localStorage.getItem('nexus_world_atlas_goals_v16');return x&&x.length<700000?core.cleanGoals(JSON.parse(x)):[]}catch(_){return []}};
function render(){
 const id=chooser.value,all=read(),selected=core.sortedGoals(all).filter(g=>!g.charId||g.charId===id),open=selected.filter(g=>g.status!=='completed');
 const name=chooser.selectedOptions?.[0]?.textContent?.trim()||'Guest explorer';
 $('nx16WorldCharacterStatus').textContent=open.length+' open local world objective(s) for '+name+'. Source: personal planning records, not Blizzard quest completion.';
 const host=$('nx16WorldCharacterGoals');host.replaceChildren();
 if(!open.length){host.append(e('div','nx16-world-empty','No active World Atlas objectives yet. Choose a region and create a personal adventure.'));return}
 open.slice(0,4).forEach(g=>{
  const row=e('a','nx16-world-goal');row.href='./world-atlas.html?zone='+encodeURIComponent(g.zoneId);
  row.append(e('strong','',g.title),
   e('small','',(core.zoneById(g.zoneId)?.name||'Curated destination')+' · '+g.category+' · '+g.status),e('span','','↗'));
  host.append(row);
 });
}
chooser.addEventListener('change',render);
window.addEventListener('storage',event=>{if(event.key==='nexus_world_atlas_goals_v16')render()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
render();
})();