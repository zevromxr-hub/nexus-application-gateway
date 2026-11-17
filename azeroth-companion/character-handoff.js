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
if(location.origin==='https://zevarchives.com'){
 const accountLink=card.querySelector('.nx-character-actions a[href$="/account"]');
 const proofLink=card.querySelector('.nx-character-actions a[href$="/account/verify-companion"]');
 if(accountLink)accountLink.href+='?site=zevarchives';
 if(proofLink)proofLink.href+='?site=zevarchives';
}
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