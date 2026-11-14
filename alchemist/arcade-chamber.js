// PROXIMUS | ASSET ALCHEMIST v2.4 — Arcade Chamber.
// Three original local/touch arcade games with session stats and persistent local bests.
import {$,notice,download,textFile,blobCanvas,wrap} from './core.js';
import {ARCADE_DAILY_KEY,dailyMission,normalizeDailyProgress,applyDailyAttempt} from './arcade-daily.js';
const STORE='proximus-alchemist-arcade-scores-v1';
const ICONS=['✦','☾','♛','♜','❖','⚡','♢','✧'];
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const random=(a,b)=>a+Math.random()*(b-a);
export function pulseGrade(position){
 const d=Math.abs(clamp(position,0,1)-.5);
 if(d<=.035)return {points:100,label:'PERFECT'};
 if(d<=.085)return {points:55,label:'GREAT'};
 if(d<=.15)return {points:20,label:'GOOD'};
 return {points:0,label:'MISS'};
}
export function cometPoints(kind,combo=0){
 return kind==='gold'?25+Math.min(15,combo)*2:kind==='purple'?10+Math.min(15,combo):kind==='bomb'?-30:0;
}
export function memoryResult(moves,seconds){
 if(!Number.isFinite(moves)||moves<8||!Number.isFinite(seconds)||seconds<0)return 0;
 return Math.max(50,Math.round(2000-45*Math.max(0,moves-8)-9*seconds));
}
export function initArcadeChamber(app){
 const scoreNode=$('arcadeBest'),status=$('arcadeStatus');
 let best={comet:0,pulse:0,memory:0},active='comet';
 const OPTIONS='proximus-alchemist-arcade-profile-v2';
 const badges=[
  {id:'comet50',name:'✦ Comet Explorer',test:()=>best.comet>=50},
  {id:'comet300',name:'♛ Comet Monarch',test:()=>best.comet>=300},
  {id:'pulse250',name:'⚡ Pulse Initiate',test:()=>best.pulse>=250},
  {id:'pulse700',name:'✺ Reflex Master',test:()=>best.pulse>=700},
  {id:'memory400',name:'◇ Memory Architect',test:()=>best.memory>=400}
 ];
 let achievements=[];try{
  const obj=JSON.parse(localStorage.getItem(OPTIONS)||'{}');
  achievements=Array.isArray(obj.achievements)?obj.achievements:[];
  $('arcadeTheme').value=['violet','cyan','gold'].includes(obj.theme)?obj.theme:'violet';
  $('arcadeProfile').value=String(obj.profile||'Player One').slice(0,24);
 }catch(e){}
 function saveProfile(){try{
  localStorage.setItem(OPTIONS,JSON.stringify({theme:$('arcadeTheme').value,profile:$('arcadeProfile').value.slice(0,24),achievements}));
 }catch(e){}}
 function renderAchievements(){
  const holder=$('arcadeAchievements');holder.replaceChildren();
  for(const badge of badges)if(achievements.includes(badge.id)){
   const span=document.createElement('span');span.textContent=badge.name;holder.append(span);
  }
  if(!achievements.length){const p=document.createElement('small');p.className='hint';p.textContent='Achievements unlock as you play.';holder.append(p);}
 }
 function unlockAchievements(){
  let changed=false;for(const badge of badges)if(!achievements.includes(badge.id)&&badge.test()){
   achievements.push(badge.id);changed=true;
  }
  if(changed){renderAchievements();saveProfile();}
 }
 function applyTheme(){
  const filter={violet:'none',cyan:'hue-rotate(90deg)',gold:'hue-rotate(-65deg)'}[$('arcadeTheme').value]||'none';
  $('cometCanvas').style.filter=filter;
  $('pulseTrack').style.filter=filter;
  saveProfile();
 }
 $('arcadeTheme').addEventListener('change',applyTheme);
 $('arcadeProfile').addEventListener('change',saveProfile);
 renderAchievements();applyTheme();
 try{const stored=JSON.parse(localStorage.getItem(STORE)||'{}');for(const g of Object.keys(best))best[g]=Math.max(0,Number(stored[g])||0);}catch(e){}
 const todaysMission=()=>dailyMission(new Date());
 let dailyState=normalizeDailyProgress();
 try{dailyState=normalizeDailyProgress(JSON.parse(localStorage.getItem(ARCADE_DAILY_KEY)||'{}'));}catch(e){}
 function renderDaily(){
  const mission=todaysMission();
  dailyState=applyDailyAttempt(dailyState,mission,'',0);
  $('arcadeDailyTitle').textContent=mission.title+' · '+mission.day;
  $('arcadeDailyGoal').textContent=mission.detail;
  $('arcadeDailyScore').textContent=dailyState.completed?'MISSION COMPLETE · '+dailyState.attemptBest+' pts':
   'BEST TODAY '+dailyState.attemptBest+' / '+mission.target+' pts';
  $('arcadeDailyStreak').textContent='Completed '+dailyState.totalCompleted+' · Current streak '+dailyState.streak+' day'+(dailyState.streak===1?'':'s');
  $('arcadeDailyProgress').value=Math.min(100,Math.floor(100*dailyState.attemptBest/mission.target));
 }
 function attemptDaily(game,score){
  const mission=todaysMission(),before=dailyState.completed;
  dailyState=applyDailyAttempt(dailyState,mission,game,score);
  try{localStorage.setItem(ARCADE_DAILY_KEY,JSON.stringify(dailyState));}catch(e){}
  renderDaily();
  if(!before&&dailyState.completed)status.textContent='★ Arcade daily challenge complete! '+mission.title+' · Streak '+dailyState.streak;
 }
 function paintBest(){scoreNode.textContent='BEST — COMET '+best.comet+' · PULSE '+best.pulse+' · MEMORY '+best.memory;}
 function record(game,value){
  attemptDaily(game,value);
  if(value>best[game]){best[game]=value;try{localStorage.setItem(STORE,JSON.stringify(best));}catch(e){};paintBest();unlockAchievements();return true;}
  return false;
 }
 function say(message){status.textContent=message;}
 function select(name){
  active=name;
  for(const b of document.querySelectorAll('.arcade-tab'))b.classList.toggle('selected',b.dataset.game===name);
  for(const p of document.querySelectorAll('.arcade-game'))p.hidden=p.dataset.game!==name;
 }
 for(const b of document.querySelectorAll('.arcade-tab'))b.addEventListener('click',()=>{select(b.dataset.game);say(b.textContent.trim()+' selected');});
 $('arcadeDailyPlay').addEventListener('click',()=>{
  const mission=todaysMission();select(mission.game);
  say('Today’s challenge: '+mission.detail);
  document.querySelector('.arcade-game[data-game="'+mission.game+'"]')?.scrollIntoView({block:'nearest',behavior:'auto'});
 });
 $('arcadeDailyExport').addEventListener('click',()=>download(textFile({
  schema:'proximus.arcade.daily/1',exported:new Date().toISOString(),daily:dailyState,
  challenge:todaysMission()
 }),'PROXIMUS-ARCADE-DAILY-CHALLENGE.json'));
 document.addEventListener('proximus-view-changed',event=>{if(event.detail?.studio==='arcade')renderDaily();});
 renderDaily();

 // Game 1: pointer-first falling-object game
 const cometCanvas=$('cometCanvas'),ctx=cometCanvas.getContext('2d'),cw=cometCanvas.width,ch=cometCanvas.height;
 let cometState={running:false,score:0,lives:3,combo:0,remaining:45,objects:[],last:0,spawn:0,raf:0};
 function drawComet(t=0){
  const c=cometState;
  const grad=ctx.createLinearGradient(0,0,0,ch);grad.addColorStop(0,'#0b102d');grad.addColorStop(1,'#251336');
  ctx.fillStyle=grad;ctx.fillRect(0,0,cw,ch);
  for(let i=0;i<64;i++){
   const x=(i*97+21)%cw,y=((i*173+35)+t*.006*(i%4+1))%ch;
   ctx.fillStyle=i%5?'#ffffff66':'#ad9bff88';ctx.fillRect(x,y,i%7===0?2:1,i%7===0?2:1);
  }
  for(const obj of c.objects){
   const color=obj.kind==='bomb'?'#ff557b':obj.kind==='gold'?'#f7d185':'#bca1ff';
   ctx.save();ctx.translate(obj.x,obj.y);ctx.rotate(t*.0009*obj.spin);
   ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=20;
   ctx.beginPath();
   for(let n=0;n<10;n++){const a=-Math.PI/2+n*Math.PI/5,r=n%2?obj.r*.52:obj.r;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}
   ctx.closePath();ctx.fill();ctx.restore();
  }
  ctx.shadowBlur=0;ctx.fillStyle='#f6eaff';ctx.font='800 18px system-ui';ctx.textAlign='left';
  ctx.fillText('SCORE '+c.score,18,28);ctx.fillText('❤ '+c.lives,18,54);
  ctx.textAlign='right';ctx.fillText(Math.ceil(c.remaining)+'s',cw-22,28);
  if(!c.running){
   ctx.fillStyle='#0008';ctx.fillRect(cw*.16,ch*.4,cw*.68,80);
   ctx.fillStyle='#f7dbff';ctx.font='800 24px system-ui';ctx.textAlign='center';
   ctx.fillText('COMET CATCH',cw/2,ch/2-6);
   ctx.font='14px system-ui';ctx.fillText('Tap ✦ and avoid red hazards',cw/2,ch/2+22);
  }
 }
 function cometHud(){
  $('cometScore').textContent='Score '+cometState.score+' · Combo '+cometState.combo+' · Lives '+cometState.lives;
 }
 function endComet(reason){
  const c=cometState;if(!c.running)return;
  c.running=false;cancelAnimationFrame(c.raf);
  const high=record('comet',c.score);
  say('Comet Catch · '+reason+' · '+c.score+' points'+(high?' · NEW BEST!':''));
  $('cometStart').textContent='↻ Play again';cometHud();drawComet(performance.now());
 }
 function stepComet(time){
  const c=cometState;if(!c.running)return;
  if(document.hidden||active!=='comet'||document.querySelector('.studio:not([hidden])')?.dataset.panel!=='arcade'){
   c.last=time;c.raf=requestAnimationFrame(stepComet);return;
  }
  const dt=Math.min(.05,Math.max(0,(time-c.last)/1000));c.last=time;c.remaining-=dt;c.spawn-=dt;
  if(c.spawn<=0){
   const kind=Math.random()<.21?'bomb':Math.random()<.34?'gold':'purple';
   c.objects.push({x:random(30,cw-30),y:-26,r:kind==='bomb'?18:22,spin:random(-2,2),kind,v:random(86,145)+c.score*.022});
   c.spawn=random(.32,.65);
  }
  for(const o of c.objects)o.y+=o.v*dt;
  const before=c.objects.length;
  c.objects=c.objects.filter(o=>o.y<ch+40);
  if(c.objects.length<before){c.combo=0;}
  if(c.remaining<=0){c.remaining=0;endComet('Time complete');return;}
  if(c.lives<=0){endComet('Hazards overwhelmed you');return;}
  drawComet(time);cometHud();c.raf=requestAnimationFrame(stepComet);
 }
 function startComet(){
  cancelAnimationFrame(cometState.raf);
  cometState={running:true,score:0,lives:3,combo:0,remaining:45,objects:[],last:performance.now(),spawn:.28,raf:0};
  $('cometStart').textContent='■ End run';
  say('Tap falling stars for points; avoid crimson hazards.');cometHud();
  cometState.raf=requestAnimationFrame(stepComet);
 }
 $('cometStart').addEventListener('click',()=>cometState.running?endComet('Run ended'):startComet());
 cometCanvas.addEventListener('pointerdown',e=>{
  const c=cometState;if(!c.running)return;
  const box=cometCanvas.getBoundingClientRect();
  const x=(e.clientX-box.left)/box.width*cw,y=(e.clientY-box.top)/box.height*ch;
  for(let i=c.objects.length-1;i>=0;i--){
   const o=c.objects[i];
   if(Math.hypot(x-o.x,y-o.y)>o.r*1.45)continue;
   if(o.kind==='bomb'){c.lives--;c.combo=0;c.score=Math.max(0,c.score+cometPoints('bomb'));}
   else{c.combo++;c.score+=cometPoints(o.kind,c.combo);}
   c.objects.splice(i,1);cometHud();drawComet(performance.now());
   if(c.lives<=0)endComet('All lives spent');return;
  }
 });
 // Game 2: fast reaction rhythm without requiring external music.
 let pulse={running:false,position:0,score:0,combo:0,hits:0,last:0,raf:0};
 const pulseNeedle=$('pulseNeedle'),pulseText=$('pulseText');
 function updatePulse(){
  const visualPosition=pulse.position<=1?pulse.position:2-pulse.position;
  pulseNeedle.style.left=(visualPosition*100).toFixed(2)+'%';
  $('pulseScore').textContent=pulse.score+' pts · Combo '+pulse.combo+' · '+pulse.hits+'/12';
 }
 function pulseTick(t){
  if(!pulse.running)return;
  if(document.hidden||active!=='pulse'||document.querySelector('.studio:not([hidden])')?.dataset.panel!=='arcade'){
   pulse.last=t;pulse.raf=requestAnimationFrame(pulseTick);return;
  }
  const dt=Math.min(.05,Math.max(0,(t-pulse.last)/1000));pulse.last=t;
  pulse.position=(pulse.position+dt*(.78+pulse.hits*.05))%2;
  updatePulse();pulse.raf=requestAnimationFrame(pulseTick);
 }
 function finishPulse(){
  pulse.running=false;cancelAnimationFrame(pulse.raf);
  const newBest=record('pulse',pulse.score);
  pulseText.textContent='ROUND COMPLETE · '+pulse.score+' pts'+(newBest?' · NEW BEST!':'');
  $('pulseStart').textContent='↻ New round';$('pulseHit').disabled=true;
 }
 function startPulse(){
  cancelAnimationFrame(pulse.raf);
  pulse={running:true,position:0,score:0,combo:0,hits:0,last:performance.now(),raf:0};
  pulseText.textContent='Tap HIT when the marker enters the glowing center';
  $('pulseStart').textContent='↻ Restart';$('pulseHit').disabled=false;
  updatePulse();pulse.raf=requestAnimationFrame(pulseTick);
 }
 function hitPulse(){
  if(!pulse.running)return;
  const pos=pulse.position<=1?pulse.position:2-pulse.position;
  const grade=pulseGrade(pos);
  pulse.combo=grade.points?pulse.combo+1:0;
  pulse.score+=grade.points?grade.points+Math.min(10,pulse.combo)*5:0;
  pulse.hits++;pulseText.textContent=grade.label+(grade.points?' +'+grade.points+' (combo '+pulse.combo+')':'');
  updatePulse();
  if(pulse.hits>=12)finishPulse();
 }
 $('pulseStart').addEventListener('click',startPulse);
 $('pulseHit').addEventListener('click',hitPulse);
 document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&pulse.running&&active==='pulse'&&document.querySelector('.studio:not([hidden])')?.dataset.panel==='arcade'&&!/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target?.tagName||'')){
   e.preventDefault();hitPulse();
  }
 });
 // Game 3: touch-friendly 4×4 memory match.
 let memory={flipped:[],matched:new Set(),moves:0,seconds:0,running:false,started:0,lock:false,values:[],raf:0};
 const cards=$('memoryCards'),memoryStats=$('memoryStats');
 function shuffleValues(){
  const v=[...ICONS,...ICONS];
  for(let i=v.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[v[i],v[j]]=[v[j],v[i]];}
  return v;
 }
 function displayMemory(){
  memoryStats.textContent='Pairs '+(memory.matched.size/2)+'/8 · Moves '+memory.moves+' · Time '+Math.floor(memory.seconds)+'s';
  for(const child of cards.children){
   const i=Number(child.dataset.card),visible=memory.flipped.includes(i)||memory.matched.has(i);
   child.textContent=visible?memory.values[i]:'◇';
   child.classList.toggle('face-up',visible);child.classList.toggle('matched',memory.matched.has(i));
   child.setAttribute('aria-label',visible?'Card '+(i+1)+': '+memory.values[i]:'Reveal card '+(i+1));
   child.disabled=memory.matched.has(i);
  }
 }
 function resetMemory(){
  cancelAnimationFrame(memory.raf);
  memory={flipped:[],matched:new Set(),moves:0,seconds:0,running:true,started:performance.now(),lock:false,values:shuffleValues(),raf:0};
  cards.replaceChildren();
  for(let i=0;i<16;i++){
   const b=document.createElement('button');b.type='button';b.className='memory-card';b.dataset.card=String(i);
   b.addEventListener('click',()=>void flip(i));cards.append(b);
  }
  displayMemory();$('memoryReset').textContent='↻ Shuffle board';
  say('Memory Matrix · find all eight matching pairs.');
  memory.raf=requestAnimationFrame(memoryTick);
 }
 function memoryTick(t){
  if(!memory.running)return;
  if(!document.hidden&&active==='memory'&&document.querySelector('.studio:not([hidden])')?.dataset.panel==='arcade'){
   memory.seconds+=Math.max(0,Math.min(.06,(t-memory.started)/1000));
   displayMemory();
  }
  memory.started=t;memory.raf=requestAnimationFrame(memoryTick);
 }
 async function flip(i){
  const m=memory;
  if(!m.running||m.lock||m.matched.has(i)||m.flipped.includes(i)||m.flipped.length>=2)return;
  m.flipped.push(i);displayMemory();
  if(m.flipped.length<2)return;
  m.moves++;const [a,b]=m.flipped;
  if(m.values[a]===m.values[b]){
   m.matched.add(a);m.matched.add(b);m.flipped=[];displayMemory();
   if(m.matched.size===16){
    m.running=false;cancelAnimationFrame(m.raf);
    const pts=memoryResult(m.moves,m.seconds),high=record('memory',pts);
    say('Memory Matrix complete · '+pts+' points · '+m.moves+' moves'+(high?' · NEW BEST!':''));
    $('memoryReset').textContent='↻ Play again';
   }
  }else{
   m.lock=true;
   await new Promise(resolve=>setTimeout(resolve,680));
   if(memory!==m)return;
   m.flipped=[];m.lock=false;displayMemory();
  }
 }
 $('memoryReset').addEventListener('click',resetMemory);
 // Cross-tool screenshot and local high-score export
 $('arcadeSnapshot').addEventListener('click',wrap(async()=>{
  const source=active==='comet'?cometCanvas:null;
  if(!source)throw Error('Open Comet Catch to export its canvas as PNG.');
  app.addAsset('PROXIMUS-ARCADE-COMET.png',await blobCanvas(source),'Arcade Chamber');
 }));
 $('arcadeScoreExport').addEventListener('click',()=>download(textFile({generator:'PROXIMUS | ASSET ALCHEMIST',updated_at:new Date().toISOString(),best}), 'PROXIMUS-ARCADE-HIGHSCORES.json'));
 $('arcadeScoreClear').addEventListener('click',()=>{
  if(!confirm('Reset your locally saved arcade high scores?'))return;
  best={comet:0,pulse:0,memory:0};try{localStorage.removeItem(STORE);}catch(e){}
  paintBest();say('High scores reset');
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&cometState.running)say('Comet Catch paused while the tab is hidden');});
 select('comet');paintBest();drawComet(0);updatePulse();
 // Idle memory layout without automatically starting a game.
 cards.replaceChildren();
 $('memoryReset').textContent='▶ Start Memory Matrix';
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(cometState.raf);cancelAnimationFrame(pulse.raf);cancelAnimationFrame(memory.raf);},{once:true});
}
