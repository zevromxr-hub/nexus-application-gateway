/* SOVEREIGN SURVIVAL v1.0 — deterministic, dependency-free arena engine.
 * Browser I/O is outside this module. All timers and movement use clamped dt.
 */
export const WORLD={width:2800,height:1900};
export const UPGRADES=Object.freeze([
 {id:'barrage',name:'Arcane Barrage',icon:'✺',text:'Fire an additional blade of violet energy.',max:4},
 {id:'blade',name:'Bloodsteel Edge',icon:'⚔',text:'Increase your attack damage by 25%.',max:6},
 {id:'vitality',name:'Sovereign Heart',icon:'♥',text:'Gain 25 maximum health and heal 30.',max:5},
 {id:'speed',name:'Phantom Stride',icon:'✧',text:'Move 13% faster.',max:5},
 {id:'tempo',name:'Storm Tempo',icon:'↯',text:'Fire 12% more frequently.',max:5},
 {id:'ward',name:'Runic Ward',icon:'◇',text:'Reduce incoming damage by 12%.',max:5},
 {id:'dash',name:'Shadowstep',icon:'➤',text:'Decrease dash cooldown by 15%.',max:4},
 {id:'soul',name:'Soul Reaver',icon:'❖',text:'Restore 3 health on each defeat.',max:4}
]);
export const ENEMY_TYPES=Object.freeze({
 wraith:{hp:28,speed:96,damage:10,rad:15,xp:5,color:'#bc86f7',score:100},
 stalker:{hp:21,speed:150,damage:8,rad:12,xp:6,color:'#61e6f2',score:130},
 brute:{hp:90,speed:62,damage:17,rad:23,xp:12,color:'#f7b16a',score:260},
 monarch:{hp:660,speed:75,damage:22,rad:43,xp:54,color:'#ff777b',score:2200}
});
const PI=Math.PI,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const length=(x,y)=>Math.hypot(x,y)||1;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const finite=(n,d=0)=>Number.isFinite(n)?n:d;
export function rng(state){
 let x=state.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;state.seed=x|0;
 return (x>>>0)/4294967296;
}
export function createRun(seed=0x59ab7e){
 const seedValue=(Number(seed)|0)||0x59ab7e;
 const game={seed:seedValue,phase:'running',time:0,wave:0,level:1,xp:0,nextXP:20,score:0,kills:0,
  bestCombo:0,combo:0,comboTime:0,options:[],enemies:[],shots:[],hostile:[],orbs:[],effects:[],events:[],
  intermission:0,nextId:1,
  ranks:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),
  player:{x:WORLD.width/2,y:WORLD.height/2,hp:100,maxHp:100,speed:225,damage:18,
   fireCooldown:0,dashCooldown:0,dashTime:0,invulnerable:0,shots:1,rate:0.26,damageReduction:0,
   dashBase:4.6,leech:0,angle:-PI/2}};
 spawnWave(game);
 return game;
}
function newEnemy(s,kind,wave,index=0){
 const model=ENEMY_TYPES[kind];
 const angle=rng(s)*PI*2,range=485+rng(s)*240;
 const hp=Math.round(model.hp*(1+(wave-1)*(kind==='monarch'?0.32:0.18)));
 return {id:s.nextId++,kind,x:clamp(s.player.x+Math.cos(angle)*range,65,WORLD.width-65),
  y:clamp(s.player.y+Math.sin(angle)*range,65,WORLD.height-65),hp,maxHp:hp,
  speed:model.speed*(1+Math.min(wave,16)*.018),damage:model.damage,rad:model.rad,
  attack:0.45+rng(s)*.4,shoot:1.4+rng(s),wobble:rng(s)*PI*2,phase:index*0.36};
}
export function spawnWave(s){
 if(s.phase==='gameover')return;
 s.wave++;
 const count=Math.min(40,6+s.wave*3),pool=s.wave<2?['wraith']:s.wave<3?['wraith','stalker']:['wraith','stalker','brute'];
 for(let i=0;i<count;i++){
  const kind=pool[Math.floor(rng(s)*pool.length)];
  s.enemies.push(newEnemy(s,kind,s.wave,i));
 }
 if(s.wave%4===0)s.enemies.push(newEnemy(s,'monarch',s.wave,99));
 s.events.push({type:'wave',wave:s.wave,boss:s.wave%4===0});
}
export function chooseUpgrade(s,id){
 if(s.phase!=='upgrade'||!s.options.includes(id))return false;
 const u=UPGRADES.find(x=>x.id===id);
 if(!u||s.ranks[id]>=u.max)return false;
 s.ranks[id]++;
 const p=s.player;
 switch(id){
 case 'barrage':p.shots++;break;
 case 'blade':p.damage=Math.round(p.damage*1.25);break;
 case 'vitality':p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+30);break;
 case 'speed':p.speed=Math.round(p.speed*1.13);break;
 case 'tempo':p.rate=Math.max(.10,p.rate*.88);break;
 case 'ward':p.damageReduction=1-Math.pow(.88,s.ranks[id]);break;
 case 'dash':p.dashBase=Math.max(1.7,p.dashBase*.85);break;
 case 'soul':p.leech+=3;break;
 }
 s.phase='running';s.options=[];s.events.push({type:'upgrade',id});return true;
}
export function offerUpgrade(s){
 const choices=UPGRADES.filter(u=>s.ranks[u.id]<u.max);
 const selected=[];
 while(selected.length<3&&choices.length){
  const index=Math.floor(rng(s)*choices.length);
  selected.push(choices.splice(index,1)[0].id);
 }
 s.options=selected;s.phase='upgrade';s.events.push({type:'level',level:s.level});
}
function addXp(s,value){
 s.xp+=value;
 if(s.xp>=s.nextXP){
  s.xp-=s.nextXP;s.level++;s.nextXP=Math.round(20+Math.pow(s.level,1.28)*11);
  offerUpgrade(s);
 }
}
function hitEnemy(s,e,damage){
 e.hp-=damage;s.effects.push({x:e.x,y:e.y,t:.24,kind:'impact',size:e.rad});
 if(e.hp>0)return;
 const model=ENEMY_TYPES[e.kind],p=s.player;
 s.score+=model.score*(1+Math.floor(s.combo/8));s.kills++;
 s.combo++;s.comboTime=4.2;s.bestCombo=Math.max(s.combo,s.bestCombo);
 p.hp=Math.min(p.maxHp,p.hp+p.leech);
 s.orbs.push({x:e.x,y:e.y,value:model.xp,r:5+Math.min(5,model.xp/9)});
 s.effects.push({x:e.x,y:e.y,t:.55,kind:'death',size:e.rad});
 if(e.kind==='monarch')s.events.push({type:'bossDefeated',wave:s.wave});
 s.events.push({type:'kill',kind:e.kind});
}
function fire(s,aim){
 const p=s.player,targets=s.enemies.filter(e=>e.hp>0);
 if(!targets.length)return;
 let dir=null;
 if(aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.y)){
  const dx=aim.x-p.x,dy=aim.y-p.y;
  if(dx*dx+dy*dy>400)dir=Math.atan2(dy,dx);
 }
 if(dir===null){
  let closest=null,best=610*610;
  for(const e of targets){
   const d=(e.x-p.x)**2+(e.y-p.y)**2;
   if(d<best){closest=e;best=d}
  }
  if(!closest)return;
  dir=Math.atan2(closest.y-p.y,closest.x-p.x);
 }
 p.angle=dir;
 for(let i=0;i<p.shots;i++){
  const offset=(i-(p.shots-1)/2)*.125,angle=dir+offset,speed=640;
  s.shots.push({x:p.x+Math.cos(angle)*22,y:p.y+Math.sin(angle)*22,
   vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:5.5,ttl:1.10,damage:p.damage});
 }
 s.events.push({type:'fire'});
}
function harmPlayer(s,amount){
 const p=s.player;
 if(p.invulnerable>0||s.phase!=='running')return;
 p.hp=Math.max(0,p.hp-Math.max(1,Math.round(amount*(1-p.damageReduction))));
 p.invulnerable=.62;s.combo=0;s.comboTime=0;
 s.events.push({type:'hurt'});
 s.effects.push({x:p.x,y:p.y,t:.45,kind:'hurt',size:34});
 if(p.hp<=0){s.phase='gameover';s.events.push({type:'gameover',score:s.score,wave:s.wave})}
}
export function advance(s,input={},dt=1/60){
 if(s.phase!=='running')return;
 dt=clamp(finite(dt),0,1/25);
 if(dt<=0)return;
 s.events=[];
 s.time+=dt;
 s.comboTime=Math.max(0,s.comboTime-dt);
 if(!s.comboTime)s.combo=0;
 const p=s.player;
 p.invulnerable=Math.max(0,p.invulnerable-dt);
 p.dashCooldown=Math.max(0,p.dashCooldown-dt);
 p.fireCooldown-=dt;
 p.dashTime=Math.max(0,p.dashTime-dt);
 const dx=clamp(finite(input.dx),-1,1),dy=clamp(finite(input.dy),-1,1),n=Math.hypot(dx,dy);
 const mx=n>0?dx/n:0,my=n>0?dy/n:0;
 if(input.dash&&p.dashCooldown<=0&&n>.1){
  p.dashTime=.18;p.dashCooldown=p.dashBase;p.invulnerable=Math.max(p.invulnerable,.25);
  s.events.push({type:'dash'});
 }
 const spd=p.speed*(p.dashTime>0?3.5:1);
 p.x=clamp(p.x+mx*spd*dt,40,WORLD.width-40);
 p.y=clamp(p.y+my*spd*dt,40,WORLD.height-40);
 if(n>.12&&p.fireCooldown>0)p.angle=Math.atan2(my,mx);
 if(p.fireCooldown<=0){
  fire(s,input.aim);
  p.fireCooldown=Math.max(.1,p.rate);
 }
 for(const e of s.enemies){
  if(e.hp<=0)continue;
  const vx=p.x-e.x,vy=p.y-e.y,dist=length(vx,vy);
  let drift=0;
  if(e.kind==='stalker')drift=Math.sin(s.time*2+e.wobble)*.42;
  e.x=clamp(e.x+(vx/dist-drift*vy/dist)*e.speed*dt,30,WORLD.width-30);
  e.y=clamp(e.y+(vy/dist+drift*vx/dist)*e.speed*dt,30,WORLD.height-30);
  e.attack-=dt;e.shoot-=dt;
  if(dist<e.rad+18&&e.attack<=0){harmPlayer(s,e.damage);e.attack=e.kind==='monarch'?1.15:0.9}
  if(e.kind==='monarch'&&e.shoot<=0&&dist<890){
   const direction=Math.atan2(vy,vx);
   for(let i=-1;i<=1;i++){
    const angle=direction+i*.21;
    s.hostile.push({x:e.x,y:e.y,vx:Math.cos(angle)*225,vy:Math.sin(angle)*225,
     damage:12,r:8,ttl:3});
   }
   e.shoot=2.3;s.events.push({type:'bossAttack'});
  }
 }
 for(const b of s.shots){
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
  if(b.ttl<=0)continue;
  for(const e of s.enemies){
   if(e.hp<=0)continue;
   const rad=b.r+e.rad;
   if((e.x-b.x)**2+(e.y-b.y)**2<rad**2){b.ttl=0;hitEnemy(s,e,b.damage);break}
  }
 }
 s.shots=s.shots.filter(x=>x.ttl>0);
 s.enemies=s.enemies.filter(x=>x.hp>0);
 for(const b of s.hostile){
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
  if(b.ttl>0&&distance(b,p)<b.r+15){b.ttl=0;harmPlayer(s,b.damage)}
 }
 s.hostile=s.hostile.filter(x=>x.ttl>0);
 for(const orb of s.orbs){
  const dd=distance(orb,p);
  if(dd<165){const v=Math.min(dd,Math.max(110,350/(dd/80+1)))*dt;
   orb.x+=(p.x-orb.x)/(dd||1)*v;orb.y+=(p.y-orb.y)/(dd||1)*v}
  if(dd<24){orb.collected=true;addXp(s,orb.value);s.events.push({type:'xp'})}
 }
 s.orbs=s.orbs.filter(o=>!o.collected);
 for(const fx of s.effects)fx.t-=dt;
 s.effects=s.effects.filter(x=>x.t>0).slice(-140);
 if(s.phase!=='running')return;
 if(!s.enemies.length){
  if(s.intermission===0){s.intermission=2.6;s.events.push({type:'waveClear',wave:s.wave})}
  s.intermission-=dt;
  if(s.intermission<=0){s.intermission=0;spawnWave(s)}
 }else s.intermission=0;
}
export function runSummary(s){
 return {score:Math.max(0,Math.floor(s.score)),wave:s.wave,kills:s.kills,
  duration:Math.round(s.time),bestCombo:s.bestCombo,level:s.level};
}
export function durationLabel(seconds){
 const n=Math.max(0,Math.floor(finite(seconds))),m=Math.floor(n/60),s=n%60;
 return m+':'+String(s).padStart(2,'0');
}
