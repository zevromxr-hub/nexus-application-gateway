/* NEXUS | AZEROTH v4.0 — opt-in character handoff.
 * Secure My Azeroth links populate public Armory fields. Character data in a URL
 * is untrusted; user must explicitly confirm importing a local planning profile.
 */
(()=>{'use strict';
const area=document.querySelector('[data-section="personal"]');
if(!area)return;
const keys={farm:'nexus_azeroth_farm_operations_v1',targets:'nexus_azeroth_character_targets_v1'};
const params=new URLSearchParams(location.search);
const p={region:params.get('armory_region'),realm:params.get('armory_realm'),name:params.get('armory_name')};
const valid=p=>['us','eu','kr','tw'].includes(p.region)&&/^[a-z0-9-]{2,80}$/.test(p.realm||'')&&/^[a-z0-9-]{2,50}$/.test(p.name||'');
const card=document.createElement('div');card.className='panel nx-character-handoff';
card.innerHTML='<h3>Connected Character Center</h3><p class="muted">Your authenticated character list remains on the secure My Azeroth portal. Choose <strong>OPEN IN PUBLIC ARMORY</strong> there to research a character here. Saving to your personal planner is optional and requires confirmation.</p><div class="nx-character-actions"><a class="button primary" href="https://nexus-azeroth-api.zevromxr.workers.dev/account" rel="noopener noreferrer" target="_blank">VIEW ACCOUNT CHARACTERS</a><a class="button" href="https://nexus-azeroth-api.zevromxr.workers.dev/account/verify-companion">VERIFY CONNECTION</a></div><div id="nxCharacterSelection" class="nx-character-selection" role="status"></div>';
area.append(card);
const selection=document.getElementById('nxCharacterSelection');
function read(key,defaultValue){try{return JSON.parse(localStorage.getItem(key)||'null')||defaultValue}catch(_){return defaultValue}}
if(!valid(p)){
 selection.textContent='No character selected yet. Accounts without WoW characters can still be Connected · Verified; character tools simply remain optional.';
 return;
}
const label=document.createElement('p');label.textContent='Character link detected: '+p.name+' · '+p.realm+' · '+p.region.toUpperCase()+'. This link is an untrusted selector, not proof of Blizzard account ownership.';
const save=document.createElement('button');save.className='primary';save.type='button';save.textContent='SAVE TO LOCAL CHARACTER PLANNERS';
selection.append(label,save);
save.addEventListener('click',()=>{
 const key=p.region+'/'+p.realm+'/'+p.name;
 const farm=read(keys.farm,{characters:[],assignments:{},sessions:[]});
 const targets=read(keys.targets,{characters:[],targets:[]});
 if(!farm||typeof farm!=='object'||Array.isArray(farm)||!targets||typeof targets!=='object'||Array.isArray(targets)){
  label.textContent='Existing saved profile data is unreadable. Back it up before importing.';return;
 }
 const farmProfiles=Array.isArray(farm.characters)?farm.characters:[];
 const tarProfiles=Array.isArray(targets.characters)?targets.characters:[];
 const identity=x=>x?.region+'/'+x?.realm+'/'+x?.name;
 const needsFarm=!farmProfiles.some(x=>identity(x)===key),needsTargets=!tarProfiles.some(x=>identity(x)===key);
 if(!needsFarm&&!needsTargets){label.textContent='This character is already saved in the local planners.';save.disabled=true;return}
 if((needsFarm&&farmProfiles.length>=30)||(needsTargets&&tarProfiles.length>=80)){label.textContent='One planner has reached its saved-character capacity. No data was changed.';return}
 if(!confirm('Save '+p.name+' ('+p.realm+') as a local planning profile? This does not verify character ownership or import private Blizzard data.'))return;
 const updates=[];
 if(needsFarm)updates.push([keys.farm,JSON.stringify({...farm,characters:[...farmProfiles,p]})]);
 if(needsTargets)updates.push([keys.targets,JSON.stringify({...targets,characters:[...tarProfiles,p]})]);
 const previous=updates.map(([k])=>[k,localStorage.getItem(k)]);let completed=0;
 try{
  for(const [k,val] of updates){localStorage.setItem(k,val);completed++}
  label.textContent='Saved '+p.name+' to the selected local character planners. You can now manage goals and farming sessions for this character.';
  save.disabled=true;
  window.dispatchEvent(new Event('nexus:character-profile-updated'));
 }catch(_){
  for(let i=completed-1;i>=0;i--){try{if(previous[i][1]===null)localStorage.removeItem(previous[i][0]);else localStorage.setItem(previous[i][0],previous[i][1])}catch(_){}}
  label.textContent='Local storage failed; please export a backup and try again.';
 }
});
})();
