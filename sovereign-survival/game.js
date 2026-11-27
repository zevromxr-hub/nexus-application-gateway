/* PROXIMUS | SOVEREIGN SURVIVAL / REALM EXPEDITIONS v1.5
 * One deterministic Canvas2D engine, zero remote services, local record only.
 */
import {createRun,advance,chooseUpgrade,UPGRADES,ABILITIES,EVOLUTIONS,runSummary,durationLabel,WORLD,arenaForWave,expeditionStatus,isBoss} from './core.js';
import {drawArena} from './renderer.js';
import {PROGRESSION_KEY,CHAMPIONS,RELICS,MAX_RELICS,normalizeProgress,
 championUnlocked,chooseChampion,purchaseRelic,toggleRelic,resolveLoadout,blueprintUnlocked,
 awardRun} from './progression.js';
const $=id=>document.getElementById(id);
const canvas=$('arenaCanvas'),frame=$('gameFrame'),ctx=canvas.getContext('2d',{alpha:false});
const SAVE_KEY='proximus-sovereign-survival-v1';
const clamp=(value,a,b)=>Math.max(a,Math.min(b,value));
const readRecords=()=>{
 try{
  const x=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
  const number=k=>Number.isFinite(x[k])?clamp(Math.floor(x[k]),0,1000000000):0;
  return {best:number('best'),bestWave:number('bestWave'),runs:number('runs'),
    kills:number('kills'),elites:number('elites'),bosses:number('bosses'),expeditions:number('expeditions')};
 }catch{return {best:0,bestWave:0,runs:0,kills:0,elites:0,bosses:0,expeditions:0}}
};
let records=readRecords();
const readProgress=()=>{
 try{return normalizeProgress(JSON.parse(localStorage.getItem(PROGRESSION_KEY)||'{}'))}
 catch{return normalizeProgress({})}
};
let progression=readProgress();
const persist=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(records))}catch{}};
const persistProgress=()=>{
 try{localStorage.setItem(PROGRESSION_KEY,JSON.stringify(progression))}catch{}
};
function renderRecords(){
 $('recordBest').textContent=records.best.toLocaleString();
 $('recordWave').textContent=String(records.bestWave);
 $('recordRuns').textContent=String(records.runs);
 $('recordKills').textContent=records.kills.toLocaleString();
 $('recordElites').textContent=records.elites.toLocaleString();
 $('recordBosses').textContent=records.bosses.toLocaleString();
 $('recordExpeditions').textContent=records.expeditions.toLocaleString();
 $('recordRenown').textContent=progression.lifetimeRenown.toLocaleString();
}
let game=createRun(0x41a2b9),mode='menu',quality='auto',soundOn=false;
const coarse=matchMedia('(pointer:coarse)').matches||/mobile|iphone|ipad|android/i.test(navigator.userAgent);
const lowPower=coarse||matchMedia('(prefers-reduced-motion: reduce)').matches;
let dpr=1,width=960,height=590,camera={x:0,y:0},lastTime=performance.now(),lastHud=0,lastDraw=0,toastUntil=0;
const keys=new Set(),joystick={x:0,y:0,pointer:null},manual={active:false,x:0,y:0};
let dashQueued=false,abilityQueued=false,audio=null,latestFire=0,auxPage=null,auxReturn='menu',impactTimer=0;
const AUX_PAGES=Object.freeze(['records','guide','settings','warbook','armory']);
function setOverlay(){
 document.body.dataset.gameView=mode;
 for(const [id,visible] of [
  ['menuOverlay',mode==='menu'],['pauseOverlay',mode==='paused'],
  ['upgradeOverlay',mode==='playing'&&game.phase==='upgrade'],
  ['endOverlay',mode==='ended']])$(id).hidden=!visible||Boolean(auxPage);
 for(const name of AUX_PAGES)$(name+'Overlay').hidden=auxPage!==name;
 $('pauseButton').disabled=mode==='menu'||mode==='ended'||Boolean(auxPage);
 $('pauseButton').textContent=mode==='paused'?'▶ Resume':'Ⅱ Pause';
 $('touchControls').hidden=mode!=='playing'||game.phase!=='running'||Boolean(auxPage);
 for(const button of document.querySelectorAll('.auxBack'))
  button.textContent=auxReturn==='paused'?'← RETURN TO PAUSE MENU':
   auxReturn==='ended'?'← RETURN TO RESULTS':'← BACK TO TITLE MENU';
}
function openAux(page){
 if(!AUX_PAGES.includes(page))return;
 if(page==='armory'&&mode!=='menu')return;
 if(page==='armory')renderArmory();
 if(mode==='playing'){
  if(game.phase==='upgrade')return;
  mode='paused';keys.clear();joystick.x=joystick.y=0;resetStick();
 }
 auxReturn=mode;auxPage=page;setOverlay();
 const next=$(page+'Overlay').querySelector('.auxBack');
 if(next)next.focus({preventScroll:true});
}
function closeAux(){
 if(!auxPage)return;
 auxPage=null;setOverlay();
 const next=auxReturn==='paused'?$('resumeRun'):auxReturn==='ended'?$('retryRun'):$('startRun');
 next?.focus({preventScroll:true});
}
function returnToTitle(){
 mode='menu';auxPage=null;keys.clear();joystick.x=joystick.y=0;dashQueued=false;abilityQueued=false;manual.active=false;
 resetStick();setOverlay();renderRecords();refreshMenuLoadout();
 $('startRun').focus({preventScroll:true});
}
function impact(type){
 const klass=type==='hurt'?'damage-impact':'dash-impact';
 frame.classList.remove('damage-impact','dash-impact');void frame.offsetWidth;
 frame.classList.add(klass);
 window.clearTimeout(impactTimer);
 impactTimer=window.setTimeout(()=>frame.classList.remove('damage-impact','dash-impact'),225);
}
function toast(message,duration=2300){
 const el=$('messageToast');el.textContent=message;el.hidden=false;
 toastUntil=performance.now()+duration;
}
function sound(type){
 if(!soundOn||!audio)return;
 const now=performance.now();
 if(type==='fire'){if(now-latestFire<165)return;latestFire=now}
 const notes={fire:[280,440,.055,'triangle'],dash:[350,660,.14,'sine'],
  hurt:[150,85,.18,'sawtooth'],level:[490,890,.35,'sine'],
  upgrade:[520,740,.2,'triangle'],wave:[260,520,.21,'triangle'],
  waveClear:[400,710,.18,'sine'],bossDefeated:[330,880,.5,'sine'],
  bossAttack:[140,210,.18,'sawtooth'],hexAttack:[540,260,.16,'triangle'],
  charge:[180,440,.20,'sawtooth'],eliteDefeated:[420,900,.25,'sine'],
  nova:[280,790,.32,'sine'],bulwark:[640,260,.34,'sine'],cleave:[190,730,.23,'sawtooth'],
  evolution:[490,1100,.36,'triangle'],aegisBlock:[560,140,.20,'sine'],bossEntrance:[100,300,.32,'sawtooth'],
  expeditionComplete:[580,1060,.34,'sine'],expeditionFailed:[220,110,.21,'triangle'],
  bossEnraged:[120,430,.33,'sawtooth'],portalDestroyed:[360,920,.25,'triangle'],sealActivated:[480,950,.28,'sine'],
  gameover:[190,75,.5,'triangle']};
 const n=notes[type];if(!n)return;
 try{
  const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type=n[3];osc.frequency.setValueAtTime(n[0],t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40,n[1]),t+n[2]);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(type==='fire'?.016:.045,t+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,t+n[2]);
  osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+n[2]+.025);
 }catch{}
}
function handleEvents(){
 for(const ev of game.events){
  if(ev.type==='wave'){
   const arena=arenaForWave(ev.wave);
   toast(ev.boss?'☄ '+(ev.wave%8===0?'VOID TYRANT':'VOID MONARCH')+' · '+arena.name:
    '✧ WAVE '+ev.wave+' · '+arena.name+' · '+ev.objective,3100);
   sound('wave');
  }
  else if(ev.type==='level'){showUpgrades();sound('level')}
  else if(ev.type==='waveClear'){toast('✦ WAVE '+ev.wave+' CLEARED · STAND READY',2200);sound('waveClear')}
  else if(ev.type==='bossDefeated'){toast('✦ '+(ev.kind==='tyrant'?'VOID TYRANT':'VOID MONARCH')+' DEFEATED',3300);sound('bossDefeated')}
  else if(ev.type==='eliteDefeated'){sound('eliteDefeated')}
  else if(ev.type==='bossEnraged'){toast('☄ '+(ev.kind==='tyrant'?'VOID TYRANT':'VOID MONARCH')+' · PHASE TWO',2800);sound('bossEnraged')}
  else if(ev.type==='expeditionComplete'){toast('✦ '+ev.objective+' COMPLETE · +'+ev.renown+' RENOWN',3000);sound('expeditionComplete')}
  else if(ev.type==='expeditionFailed'){toast('◇ '+ev.objective+' LOST · SURVIVE THE NEXT WAVE',2700);sound('expeditionFailed')}
  else if(ev.type==='portalDestroyed'||ev.type==='sealActivated'){sound(ev.type)}
  else if(ev.type==='ability'){toast('✦ '+ev.name+' UNLEASHED',1150);sound(ev.id)}
  else if(ev.type==='aegisBlock'){sound('aegisBlock')}
  else if(ev.type==='bossEntrance'){sound('bossEntrance')}
  else if(ev.type==='gameover'){finishRun();sound('gameover')}
  else if(ev.type==='hurt'||ev.type==='dash'){impact(ev.type);sound(ev.type)}
  else if(['fire','bossAttack','upgrade','hexAttack','charge'].includes(ev.type))sound(ev.type);
 }
}
function armoryNode(tag,className,text){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
function refreshMenuLoadout(){
 const loadout=resolveLoadout(progression,records);
 const champion=CHAMPIONS.find(c=>c.id===loadout.champion)||CHAMPIONS[0];
 const relics=loadout.relics.map(id=>RELICS.find(r=>r.id===id)?.name).filter(Boolean);
 $('menuLoadout').textContent=champion.icon+' '+champion.name.toUpperCase()+
  ' · '+(relics.length?relics.join(' + '):'NO RELICS EQUIPPED');
}
function refreshCodexChampion(){
 const id=game.startingLoadout?.champion||'warden';
 const champion=CHAMPIONS.find(c=>c.id===id)||CHAMPIONS[0];
 $('codexHeroIcon').textContent=champion.icon;
 $('codexHeroName').textContent=champion.name.toUpperCase();
 $('codexHeroBonus').textContent=champion.bonus;
 const items=(game.startingLoadout?.relics||[])
  .map(id=>RELICS.find(r=>r.id===id)).filter(Boolean);
 $('codexRelics').textContent=items.length?
  'EQUIPPED RELICS · '+items.map(r=>r.icon+' '+r.name).join(' · '):
  'NO RELICS EQUIPPED';
}
function setArmoryFeedback(message){
 $('armoryFeedback').textContent=message;
}
function applyArmoryChange(action,id){
 let result;
 if(action==='champion')result=chooseChampion(progression,id,records);
 else if(action==='buy')result=purchaseRelic(progression,id,records);
 else if(action==='toggle')result=toggleRelic(progression,id);
 else return;
 if(result.success){
  progression=result.progress;
  persistProgress();
  refreshMenuLoadout();renderRecords();
  sound('upgrade');
 }
 renderArmory();
 setArmoryFeedback(result.reason);
}
function renderArmory(){
 const loadout=resolveLoadout(progression,records);
 const owned=progression.owned;
 $('armoryRenown').textContent=progression.renown.toLocaleString();
 $('championsUnlocked').textContent=CHAMPIONS.filter(c=>championUnlocked(c.id,records)).length+
  ' / '+CHAMPIONS.length+' UNLOCKED';
 $('relicSlots').textContent=loadout.relics.length+' / '+MAX_RELICS+' EQUIPPED';
 const champions=$('championCards');champions.replaceChildren();
 for(const item of CHAMPIONS){
  const unlocked=championUnlocked(item.id,records);
  const selected=loadout.champion===item.id;
  const card=armoryNode('article','champion-card '+item.style+
   (selected?' selected':'')+(unlocked?'':' locked'));
  card.append(
   armoryNode('span','state',selected?'✦ ACTIVE CHAMPION':unlocked?'AVAILABLE':'✧ LOCKED'),
   armoryNode('div','champion-icon',item.icon),
   armoryNode('h3','',item.name),
   armoryNode('p','caption',item.description),
   armoryNode('p','bonus',item.bonus)
  );
  if(!unlocked){
   let remaining='';
   if(item.id==='sentinel')remaining=' ('+Math.max(0,40-records.kills)+' defeats remaining)';
   if(item.id==='reaver')remaining=' (Best wave '+records.bestWave+'/4)';
   card.append(armoryNode('p','unlock',item.unlock+remaining));
  }
  const button=armoryNode('button','armory-action',selected?'✦ SELECTED':unlocked?'SELECT CHAMPION':'LOCKED');
  button.type='button';button.disabled=!unlocked||selected;
  button.setAttribute('aria-label',selected?item.name+' is selected':
   unlocked?'Select '+item.name:'Locked: '+item.unlock);
  if(unlocked&&!selected)button.addEventListener('click',()=>applyArmoryChange('champion',item.id));
  card.append(button);champions.append(card);
 }
 const relics=$('relicCards');relics.replaceChildren();
 for(const item of RELICS){
  const forged=owned.includes(item.id),equipped=loadout.relics.includes(item.id);
  const discovered=blueprintUnlocked(item,records);
  const card=armoryNode('article','relic-card'+(equipped?' equipped':'')+(!discovered?' blueprint-locked':''));
  const glyph=armoryNode('span','relic-glyph',item.icon);
  const info=armoryNode('div','relic-info');
  const heading=armoryNode('div','relic-heading');
  heading.append(armoryNode('strong','',item.name),
   armoryNode('small','',equipped?'✦ EQUIPPED':forged?'OWNED':item.rarity));
  info.append(heading,armoryNode('p','relic-description',item.description),
   armoryNode('p','relic-bonus',item.effect));
  if(!discovered){
   const challenge=item.requiredExpeditions?
    Math.max(0,item.requiredExpeditions-records.expeditions)+' MORE REALM EXPEDITIONS':
    Math.max(0,item.requiredBosses-records.bosses)+' MORE BOSS DEFEATS';
   info.append(armoryNode('small','blueprint-status','BLUEPRINT LOCKED · '+challenge));
  }
  card.append(glyph,info);
  let label='',action='buy',disabled=false;
  if(!forged){
   label='FORGE · '+item.cost+' RENOWN';
   if(!discovered){label='BLUEPRINT NOT DISCOVERED';disabled=true}
   else if(progression.renown<item.cost){
    label='NEED '+(item.cost-progression.renown)+' MORE RENOWN';
    disabled=true;
   }
  }else if(equipped){
   label='✦ EQUIPPED · TAP TO REMOVE';action='toggle';
  }else{
   label='EQUIP RELIC';action='toggle';
   if(loadout.relics.length>=MAX_RELICS){label='TWO SLOTS FULL';disabled=true}
  }
  const button=armoryNode('button','armory-action',label);
  button.type='button';button.disabled=disabled;
  button.setAttribute('aria-label',(forged?'Equip or remove ':'Forge ')+item.name+' — '+label);
  if(!disabled)button.addEventListener('click',()=>applyArmoryChange(action,item.id));
  card.append(button);relics.append(card);
 }
}
function showUpgrades(){
 const wrap=$('upgradeOptions');wrap.replaceChildren();
 for(const [index,id] of game.options.entries()){
  const u=UPGRADES.find(q=>q.id===id);
  const button=document.createElement('button');button.className='upgrade-choice';button.type='button';
  const num=document.createElement('span');num.className='number';num.textContent=String(index+1).padStart(2,'0')+' / SELECT';
  const icon=document.createElement('span');icon.className='glyph';icon.textContent=u.icon;
  const title=document.createElement('strong');title.textContent=u.name;
  const description=document.createElement('small');description.textContent=u.text+'  ·  Rank '+(game.ranks[id]+1)+'/'+u.max;
  const evolution=EVOLUTIONS.find(e=>e.id===id);
  if(evolution&&game.ranks[id]<evolution.rank){
   const extra=document.createElement('span');extra.className='evolution-unlock';
   extra.textContent=game.ranks[id]+1===evolution.rank?'✦ EVOLVES INTO '+evolution.name:
    'EVOLUTION AT RANK '+evolution.rank+' · '+evolution.name;
   description.append(extra);
  }
  button.setAttribute('aria-label',u.name+', rank '+(game.ranks[id]+1)+'. '+u.text);
  button.append(num,icon,title,description);
  button.addEventListener('click',()=>applyUpgrade(id));
  wrap.append(button);
 }
 setOverlay();
}
function applyUpgrade(id){
 const wasEvolved=Boolean(game.evolutions[id]);
 if(chooseUpgrade(game,id)){
  const evolved=EVOLUTIONS.find(e=>e.id===id&&game.evolutions[id]&&!wasEvolved);
  setOverlay();sound(evolved?'evolution':'upgrade');buildLoadout();updateHud();
  toast(evolved?'✦ WEAPON AWAKENED · '+evolved.name:
   '✧ POWER ACQUIRED · '+UPGRADES.find(u=>u.id===id).name,evolved?3600:2300);
  canvas.focus({preventScroll:true});
 }
}
function buildLoadout(){
 const evolutions=$('evolutionList');evolutions.replaceChildren();
 for(const entry of EVOLUTIONS){
  const active=Boolean(game.evolutions[entry.id]);
  const el=document.createElement('div');el.className='evolution-entry'+(active?'':' pending');
  const title=document.createElement('strong');title.textContent=entry.icon+' '+entry.name;
  const note=document.createElement('small');
  note.textContent=active?'✦ AWAKENED · '+entry.description:
   'RANK '+game.ranks[entry.id]+'/'+entry.rank+' · '+entry.description;
  el.append(title,note);evolutions.append(el);
 }
 const wrap=$('buildList');wrap.replaceChildren();const selected=UPGRADES.filter(u=>game.ranks[u.id]>0);
 $('upgradeCount').textContent=selected.reduce((n,u)=>n+game.ranks[u.id],0)+' UPGRADES';
 if(!selected.length){const p=document.createElement('p');p.textContent='Defeat shadows, collect soul orbs, and choose your next power.';wrap.append(p);return}
 for(const u of selected){
  const row=document.createElement('div');row.className='build-item';
  const icon=document.createElement('span');icon.textContent=u.icon;
  const label=document.createElement('strong');label.textContent=u.name;
  const rank=document.createElement('small');rank.textContent='RANK '+game.ranks[u.id];
  row.append(icon,label,rank);wrap.append(row);
 }
}
function startRun(){
 auxPage=null;
 const loadout=resolveLoadout(progression,records);
 game=createRun(((Date.now()^Math.floor(Math.random()*0xffffffff))|0)||0x31af,loadout);
 records.runs++;persist();renderRecords();
 mode='playing';camera.x=game.player.x-width/2;camera.y=game.player.y-height/2;
 keys.clear();joystick.x=0;joystick.y=0;dashQueued=false;abilityQueued=false;manual.active=false;
 lastTime=performance.now();lastHud=0;buildLoadout();setOverlay();updateHud();
 refreshCodexChampion();
 toast('✧ THE SHATTERED CITADEL · WAVE 1',2300);
 canvas.focus({preventScroll:true});
}
function finishRun(){
 if(mode==='ended')return;
 const result=runSummary(game);mode='ended';
 records.best=Math.max(records.best,result.score);
 records.bestWave=Math.max(records.bestWave,result.wave);
 records.kills+=result.kills;
 records.elites+=result.eliteKills;
 records.bosses+=result.bossKills;
 records.expeditions+=result.expeditionsCompleted;
 const resultReward=awardRun(progression,result);
 progression=resultReward.progress;
 persist();persistProgress();renderRecords();refreshMenuLoadout();
 $('runRenown').textContent='+'+resultReward.earned.toLocaleString()+' RENOWN';
 $('endExpeditionRenown').textContent='+'+result.expeditionRenown.toLocaleString();
 $('endExpeditionProgress').textContent=result.expeditionsCompleted+' EXPEDITIONS COMPLETED · '+
  result.expeditionsFailed+' FAILED';
 const wrap=$('endStats');wrap.replaceChildren();
 for(const [name,value] of [['SCORE',result.score.toLocaleString()],['WAVE',result.wave],
  ['DEFEATS',result.kills],['TIME',durationLabel(result.duration)],['LEVEL',result.level],
  ['ELITES',result.eliteKills],['BOSSES',result.bossKills],['REALM QUESTS',result.expeditionsCompleted],
  ['BEST COMBO',result.bestCombo]]){
  const el=document.createElement('div'),num=document.createElement('strong'),label=document.createElement('span');
  num.textContent=String(value);label.textContent=name;el.append(num,label);wrap.append(el);
 }
 setOverlay();updateHud();
}
function pause(){
 if(auxPage)return;
 if(mode==='playing'&&game.phase==='running'){mode='paused';keys.clear();joystick.x=joystick.y=0;
  resetStick();setOverlay();toast('THE BATTLE IS PAUSED',1200)}
 else if(mode==='paused'){mode='playing';lastTime=performance.now();setOverlay();canvas.focus({preventScroll:true})}
}
function updateHud(){
 const p=game.player;
 $('healthText').textContent=Math.ceil(p.hp)+' / '+p.maxHp;
 $('hpFill').style.width=100*clamp(p.hp/p.maxHp,0,1)+'%';
 $('levelText').textContent=game.level;
 $('xpText').textContent=Math.floor(game.xp)+' / '+game.nextXP+' XP';
 $('xpFill').style.width=100*clamp(game.xp/game.nextXP,0,1)+'%';
 $('waveText').textContent=String(game.wave).padStart(2,'0');
 $('killText').textContent=String(game.kills);
 $('scoreText').textContent=game.score.toLocaleString();
 $('timerText').textContent=durationLabel(game.time);
 $('comboText').textContent=game.combo>1?'✦ '+game.combo+'× COMBO':'✧ BUILD YOUR COMBO';
 $('dashText').textContent=p.dashCooldown<=0?'➤ DASH READY':'➤ '+p.dashCooldown.toFixed(1)+'S';
 $('dashButton').disabled=p.dashCooldown>.1||mode!=='playing'||game.phase!=='running';
 const ability=ABILITIES[p.champion]||ABILITIES.warden;
 $('abilityName').textContent=ability.name;
 $('abilityStatus').textContent=p.abilityCooldown>0?p.abilityCooldown.toFixed(1)+' SEC':'READY';
 $('abilityTouchIcon').textContent=ability.icon;
 const ready=p.abilityCooldown<=0;
 $('abilityButton').disabled=!ready||mode!=='playing'||game.phase!=='running';
 $('abilityButton').setAttribute('aria-label',(ready?'Cast ':'Recharging ')+ability.name+
  (ready?'':' in '+p.abilityCooldown.toFixed(1)+' seconds'));
 $('abilityHud').setAttribute('aria-busy',String(!ready));
 $('abilityFill').style.height=(100*(1-Math.max(0,p.abilityCooldown)/ability.cooldown)).toFixed(1)+'%';
 $('powerStat').textContent=p.damage;
 $('speedStat').textContent=p.speed;
 $('armorStat').textContent=Math.round(p.damageReduction*100)+'%';
 const boss=game.enemies.find(isBoss);
 $('bossBar').hidden=!boss;
 $('bossBar').dataset.phase=String(boss?.bossPhase||1);
 if(boss){
  $('bossFill').style.width=100*clamp(boss.hp/boss.maxHp,0,1)+'%';
  $('bossName').textContent='✦ '+(boss.kind==='tyrant'?'VOID TYRANT':'VOID MONARCH')+
   (boss.bossPhase===2?' · ENRAGED':'');
 }
 const next=Math.ceil(Math.max(1,game.wave)/4)*4;
 $('bossWaveHint').textContent=boss?'BOSS ACTIVE / WAVE '+game.wave:
  'NEXT BOSS AT WAVE '+next;
 $('waveProgress').style.width=(boss?100:(game.wave%4)/4*100)+'%';
 const quest=expeditionStatus(game);
 $('objectiveTitle').textContent=quest?quest.name:'THE REALM WAITS';
 $('objectiveDescription').textContent=quest?quest.description:'Complete the expedition for additional Renown.';
 const questHud=$('expeditionHud');
 questHud.hidden=!quest||mode==='menu'||mode==='ended';
 if(quest){
  questHud.dataset.status=quest.status;
  $('expeditionIcon').textContent=game.expedition.icon;
  $('expeditionName').textContent=quest.name;
  $('expeditionReward').textContent='+'+quest.reward+' R';
  $('expeditionDescription').textContent=quest.description;
  $('expeditionFill').style.width=(quest.progress*100).toFixed(1)+'%';
  $('expeditionDetail').textContent=quest.detail;
  $('expeditionState').textContent=quest.status==='complete'?'COMPLETE':
   quest.status==='failed'?'FAILED':'ACTIVE';
 }
 $('blessingBanner').hidden=game.player.blessingTime<=0||mode==='menu'||mode==='ended';
 $('blessingSeconds').textContent=Math.ceil(game.player.blessingTime)+'S';
 const arena=arenaForWave(game.wave);
 document.body.dataset.realm=arena.id;
 $('stageLabel').textContent=mode==='menu'?'THE SHATTERED CITADEL':
  arena.name+' · WAVE '+game.wave+' · '+game.enemies.length+' FOES';
 const rift=$('riftCount');
 rift.hidden=!game.hazards.length||mode==='menu'||mode==='ended';
 rift.textContent=game.hazards.length?
  '⊗ '+game.hazards.length+' RIFT'+(game.hazards.length===1?'':'S')+' ACTIVE':'✧ NO RIFTS';
}
function resetStick(){
 $('joystickKnob').style.transform='translate(-50%, -50%)';
}
function setStick(e){
 const r=$('joystickZone').querySelector('.joystick-base').getBoundingClientRect();
 let x=(e.clientX-(r.left+r.width/2))/43,y=(e.clientY-(r.top+r.height/2))/43;
 const d=Math.hypot(x,y);if(d>1){x/=d;y/=d}
 joystick.x=x;joystick.y=y;
 $('joystickKnob').style.transform='translate(-50%, -50%) translate('+(x*36).toFixed(1)+'px,'+(y*36).toFixed(1)+'px)';
}
function input(){
 const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
 const y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
 const dx=joystick.pointer===null?x:joystick.x,dy=joystick.pointer===null?y:joystick.y;
 const result={dx,dy,dash:dashQueued,ability:abilityQueued,
  aim:manual.active?{x:manual.x,y:manual.y}:null};
 dashQueued=false;abilityQueued=false;return result;
}
function resize(){
 const rect=frame.getBoundingClientRect();
 width=Math.max(300,rect.width);height=Math.max(300,rect.height);
 const recommended=quality==='eco'||quality==='auto'&&lowPower?1.2:1.65;
 const maxPixels=quality==='cinema'?3600000:2000000;
 const budget=Math.sqrt(maxPixels/Math.max(1,width*height));
 dpr=Math.max(.72,Math.min(devicePixelRatio||1,recommended,budget));
 const rw=Math.round(width*dpr),rh=Math.round(height*dpr);
 if(canvas.width!==rw)canvas.width=rw;
 if(canvas.height!==rh)canvas.height=rh;
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function loop(now){
 requestAnimationFrame(loop);
 if(!ctx)return;
 const dt=Math.min(.045,Math.max(0,(now-lastTime)/1000));lastTime=now;
 if(document.hidden)return;
 if(mode==='playing'&&game.phase==='running'){
  advance(game,input(),dt);handleEvents();
  if(game.phase==='upgrade')setOverlay();
 }
 if(mode==='playing'||mode==='menu'||now-lastDraw>200){
  lastDraw=now;
  const px=clamp(game.player.x-width/2,0,Math.max(0,WORLD.width-width));
  const py=clamp(game.player.y-height/2,0,Math.max(0,WORLD.height-height));
  const speed=mode==='menu'?1:Math.min(1,dt*8);
  camera.x+=(px-camera.x)*speed;camera.y+=(py-camera.y)*speed;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawArena(ctx,game,{x:camera.x,y:camera.y,w:width,h:height},
    quality==='eco'||quality==='auto'&&lowPower?'low':'high');
 }
 if(now-lastHud>115){lastHud=now;updateHud()}
 if(toastUntil&&now>toastUntil){$('messageToast').hidden=true;toastUntil=0}
}
$('startRun').addEventListener('click',startRun);
$('menuArmory').addEventListener('click',()=>openAux('armory'));
$('menuRecords').addEventListener('click',()=>openAux('records'));
$('menuGuide').addEventListener('click',()=>openAux('guide'));
$('menuSettings').addEventListener('click',()=>openAux('settings'));
$('pauseWarbook').addEventListener('click',()=>openAux('warbook'));
$('pauseSettings').addEventListener('click',()=>openAux('settings'));
$('retreatToMenu').addEventListener('click',returnToTitle);
$('endMenu').addEventListener('click',returnToTitle);
document.querySelectorAll('.auxBack').forEach(button=>button.addEventListener('click',closeAux));
$('retryRun').addEventListener('click',startRun);
$('resumeRun').addEventListener('click',pause);
$('abandonRun').addEventListener('click',startRun);
$('pauseButton').addEventListener('click',pause);
$('dashButton').addEventListener('click',()=>{if(mode==='playing')dashQueued=true});
$('abilityButton').addEventListener('click',()=>{
 if(mode==='playing'&&game.phase==='running'&&game.player.abilityCooldown<=0)abilityQueued=true;
});
$('soundToggle').addEventListener('click',async()=>{
 if(soundOn){soundOn=false;$('soundToggle').textContent='♪ Sound Off';$('soundToggle').setAttribute('aria-pressed','false');return}
 const Audio=window.AudioContext||window.webkitAudioContext;
 if(!Audio){toast('THIS BROWSER DOES NOT SUPPORT GAME AUDIO');return}
 try{audio??=new Audio();await audio.resume();soundOn=true;
  $('soundToggle').textContent='♫ Sound On';$('soundToggle').setAttribute('aria-pressed','true');sound('upgrade')}
 catch{toast('AUDIO NEEDS A USER TAP ON THIS DEVICE')}
});
$('qualityToggle').addEventListener('click',()=>{
 quality=quality==='auto'?'eco':quality==='eco'?'cinema':'auto';
 $('qualityToggle').textContent=quality==='auto'?'◈ Auto':quality==='eco'?'◈ Eco':'✦ Cinema';
 resize();toast('VISUAL QUALITY · '+quality.toUpperCase(),1400);
});
$('fullscreenToggle').addEventListener('click',async()=>{
 try{if(document.fullscreenElement)await document.exitFullscreen();
 else if(frame.requestFullscreen)await frame.requestFullscreen();
 else toast('FULLSCREEN IS NOT SUPPORTED BY THIS BROWSER');}
 catch{toast('FULLSCREEN COULD NOT BE OPENED')}
});
const moveKeys=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(auxPage){if(k==='escape'){e.preventDefault();closeAux()}return}
 if(moveKeys.has(k)){keys.add(k);if(mode==='playing')e.preventDefault()}
 if((k==='shift')&&mode==='playing'){e.preventDefault();dashQueued=true}
 if(k==='q'&&mode==='playing'&&game.phase==='running'&&!e.repeat){
  e.preventDefault();if(game.player.abilityCooldown<=0)abilityQueued=true;
 }
 if((k===' '||k==='p'||k==='escape')&&mode!=='menu'&&mode!=='ended'){
  if(k===' '||k==='p'||k==='escape')e.preventDefault();
  if(!e.repeat&&game.phase!=='upgrade')pause();
 }
 if(mode==='playing'&&game.phase==='upgrade'&&['1','2','3'].includes(k)){
  e.preventDefault();const id=game.options[Number(k)-1];if(id)applyUpgrade(id)
 }
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(mode==='playing'&&game.phase==='running')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing'&&game.phase==='running')pause();lastTime=performance.now()});
const zone=$('joystickZone');
zone.addEventListener('pointerdown',e=>{
 if(mode!=='playing'||game.phase!=='running'||joystick.pointer!==null)return;
 joystick.pointer=e.pointerId;zone.setPointerCapture(e.pointerId);setStick(e);e.preventDefault();
});
zone.addEventListener('pointermove',e=>{if(e.pointerId===joystick.pointer){setStick(e);e.preventDefault()}});
function releaseStick(e){
 if(e.pointerId!==joystick.pointer)return;joystick.pointer=null;joystick.x=joystick.y=0;resetStick();
}
zone.addEventListener('pointerup',releaseStick);zone.addEventListener('pointercancel',releaseStick);
canvas.addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch'||mode!=='playing'||game.phase!=='running')return;
 manual.active=true;updatePointer(e);canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{if(manual.active&&e.pointerType!=='touch')updatePointer(e)});
canvas.addEventListener('pointerup',()=>{manual.active=false});
canvas.addEventListener('pointercancel',()=>{manual.active=false});
function updatePointer(e){
 const r=canvas.getBoundingClientRect();
 manual.x=camera.x+e.clientX-r.left;manual.y=camera.y+e.clientY-r.top;
}
window.addEventListener('resize',resize,{passive:true});
if(typeof ResizeObserver==='function')new ResizeObserver(()=>resize()).observe(frame);
renderRecords();refreshMenuLoadout();buildLoadout();refreshCodexChampion();setOverlay();resize();updateHud();camera.x=game.player.x-width/2;camera.y=game.player.y-height/2;
requestAnimationFrame(loop);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
