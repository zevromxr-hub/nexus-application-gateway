/* PROXIMUS | SOVEREIGN SURVIVAL / GENESIS v1.0
 * One deterministic Canvas2D engine, zero remote services, local record only.
 */
import {createRun,advance,chooseUpgrade,UPGRADES,runSummary,durationLabel,WORLD} from './core.js';
import {drawArena} from './renderer.js';
const $=id=>document.getElementById(id);
const canvas=$('arenaCanvas'),frame=$('gameFrame'),ctx=canvas.getContext('2d',{alpha:false});
const SAVE_KEY='proximus-sovereign-survival-v1';
const clamp=(value,a,b)=>Math.max(a,Math.min(b,value));
const readRecords=()=>{
 try{
  const x=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
  const number=k=>Number.isFinite(x[k])?clamp(Math.floor(x[k]),0,1000000000):0;
  return {best:number('best'),bestWave:number('bestWave'),runs:number('runs'),kills:number('kills')};
 }catch{return {best:0,bestWave:0,runs:0,kills:0}}
};
let records=readRecords();
const persist=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(records))}catch{}};
function renderRecords(){
 $('recordBest').textContent=records.best.toLocaleString();
 $('recordWave').textContent=String(records.bestWave);
 $('recordRuns').textContent=String(records.runs);
}
let game=createRun(0x41a2b9),mode='menu',quality='auto',soundOn=false;
const coarse=matchMedia('(pointer:coarse)').matches||/mobile|iphone|ipad|android/i.test(navigator.userAgent);
const lowPower=coarse||matchMedia('(prefers-reduced-motion: reduce)').matches;
let dpr=1,width=960,height=590,camera={x:0,y:0},lastTime=performance.now(),lastHud=0,lastDraw=0,toastUntil=0;
const keys=new Set(),joystick={x:0,y:0,pointer:null},manual={active:false,x:0,y:0};
let dashQueued=false,audio=null,latestFire=0;
function setOverlay(){
 for(const [id,visible] of [
  ['menuOverlay',mode==='menu'],['pauseOverlay',mode==='paused'],
  ['upgradeOverlay',mode==='playing'&&game.phase==='upgrade'],
  ['endOverlay',mode==='ended']])$(id).hidden=!visible;
 $('pauseButton').disabled=mode==='menu'||mode==='ended';
 $('pauseButton').textContent=mode==='paused'?'▶ Resume':'Ⅱ Pause';
 $('touchControls').hidden=mode!=='playing'||game.phase!=='running';
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
  bossAttack:[140,210,.18,'sawtooth'],gameover:[190,75,.5,'triangle']};
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
  if(ev.type==='wave'){toast(ev.boss?'☄ THE VOID MONARCH HAS AWAKENED — WAVE '+ev.wave:'✧ WAVE '+ev.wave+' — THE SHADOWS RETURN',3000);sound('wave')}
  else if(ev.type==='level'){showUpgrades();sound('level')}
  else if(ev.type==='waveClear'){toast('✦ WAVE '+ev.wave+' CLEARED · STAND READY',2200);sound('waveClear')}
  else if(ev.type==='bossDefeated'){toast('✦ VOID MONARCH DEFEATED · GLORY EARNED',3300);sound('bossDefeated')}
  else if(ev.type==='gameover'){finishRun();sound('gameover')}
  else if(['fire','dash','hurt','bossAttack','upgrade'].includes(ev.type))sound(ev.type);
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
  button.append(num,icon,title,description);
  button.addEventListener('click',()=>applyUpgrade(id));
  wrap.append(button);
 }
 setOverlay();
}
function applyUpgrade(id){
 if(chooseUpgrade(game,id)){
  setOverlay();sound('upgrade');buildLoadout();updateHud();toast('✧ POWER ACQUIRED · '+UPGRADES.find(u=>u.id===id).name);
  canvas.focus({preventScroll:true});
 }
}
function buildLoadout(){
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
 game=createRun(((Date.now()^Math.floor(Math.random()*0xffffffff))|0)||0x31af);
 records.runs++;persist();renderRecords();
 mode='playing';camera.x=game.player.x-width/2;camera.y=game.player.y-height/2;
 keys.clear();joystick.x=0;joystick.y=0;dashQueued=false;manual.active=false;
 lastTime=performance.now();lastHud=0;buildLoadout();setOverlay();updateHud();
 toast('✧ WAVE 1 · SURVIVE THE SHADOWS',2300);
 canvas.focus({preventScroll:true});
}
function finishRun(){
 if(mode==='ended')return;
 const result=runSummary(game);mode='ended';
 records.best=Math.max(records.best,result.score);
 records.bestWave=Math.max(records.bestWave,result.wave);
 records.kills+=result.kills;
 persist();renderRecords();
 const wrap=$('endStats');wrap.replaceChildren();
 for(const [name,value] of [['SCORE',result.score.toLocaleString()],['WAVE',result.wave],
  ['DEFEATS',result.kills],['TIME',durationLabel(result.duration)],['LEVEL',result.level],['BEST COMBO',result.bestCombo]]){
  const el=document.createElement('div'),num=document.createElement('strong'),label=document.createElement('span');
  num.textContent=String(value);label.textContent=name;el.append(num,label);wrap.append(el);
 }
 setOverlay();updateHud();
}
function pause(){
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
 $('powerStat').textContent=p.damage;
 $('speedStat').textContent=p.speed;
 $('armorStat').textContent=Math.round(p.damageReduction*100)+'%';
 const boss=game.enemies.find(e=>e.kind==='monarch');
 $('bossBar').hidden=!boss;
 if(boss)$('bossFill').style.width=100*clamp(boss.hp/boss.maxHp,0,1)+'%';
 const next=Math.ceil(Math.max(1,game.wave)/4)*4;
 $('bossWaveHint').textContent=boss?'BOSS ACTIVE / WAVE '+game.wave:'BOSS AT WAVE '+next;
 $('waveProgress').style.width=(boss?100:(game.wave%4)/4*100)+'%';
 $('objectiveTitle').textContent=boss?'VOID MONARCH — ACTIVE':next===4?'THE VOID MONARCH':'ANOTHER MONARCH RISES';
 $('objectiveDescription').textContent=boss?'Evade its ranged volleys and attack from a safe angle.':
  'Face the towering monarch every fourth wave. Claim its soul to empower your ascension.';
 $('stageLabel').textContent=mode==='menu'?'SANCTUM / READY TO ENTER':
  mode==='paused'?'WAVE '+game.wave+' / PAUSED':'WAVE '+game.wave+' / '+game.enemies.length+' HOSTILES';
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
 const result={dx,dy,dash:dashQueued,aim:manual.active?{x:manual.x,y:manual.y}:null};
 dashQueued=false;return result;
}
function resize(){
 const rect=frame.getBoundingClientRect();
 width=Math.max(300,rect.width);height=Math.max(300,rect.height);
 const recommended=quality==='eco'||quality==='auto'&&lowPower?1.25:1.8;
 dpr=Math.max(1,Math.min(devicePixelRatio||1,recommended));
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
$('retryRun').addEventListener('click',startRun);
$('resumeRun').addEventListener('click',pause);
$('abandonRun').addEventListener('click',startRun);
$('pauseButton').addEventListener('click',pause);
$('dashButton').addEventListener('click',()=>{if(mode==='playing')dashQueued=true});
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
 if(moveKeys.has(k)){keys.add(k);if(mode==='playing')e.preventDefault()}
 if((k==='shift')&&mode==='playing'){e.preventDefault();dashQueued=true}
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
renderRecords();buildLoadout();setOverlay();resize();camera.x=game.player.x-width/2;camera.y=game.player.y-height/2;
requestAnimationFrame(loop);
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
