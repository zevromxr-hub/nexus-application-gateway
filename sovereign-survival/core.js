/* SOVEREIGN SURVIVAL v1.6 SOVEREIGN LEGACY — rare loot, combat animation and preserved realm objectives.
 * Browser I/O is outside this module. All timers and movement use clamped dt.
 */
import {startingStats} from './progression.js';
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
export const ABILITIES=Object.freeze({
 warden:{id:'nova',name:'ASTRAL NOVA',icon:'✧',cooldown:9,description:'Violet shockwave deals damage and knocks nearby enemies away.'},
 sentinel:{id:'bulwark',name:'GLACIAL BULWARK',icon:'❄',cooldown:13,description:'Become briefly invulnerable and freeze nearby enemies.'},
 reaver:{id:'cleave',name:'INFERNAL CLEAVE',icon:'⚔',cooldown:8,description:'A wide fiery slash scorches enemies with damage over time.'}
});
export const EVOLUTIONS=Object.freeze([
 {id:'blade',rank:3,name:'SOVEREIGN BLADES',icon:'⚔',description:'Regular attacks gain a sweeping close-range cleave.'},
 {id:'barrage',rank:3,name:'CELESTIAL STORM',icon:'✺',description:'Striking blades split into two secondary projectiles.'},
 {id:'ward',rank:3,name:'IMMORTAL AEGIS',icon:'◇',description:'Automatically negate one incoming hit every 15 seconds.'}
]);
export const ENEMY_TYPES=Object.freeze({
 wraith:{hp:28,speed:96,damage:10,rad:15,xp:5,color:'#bc86f7',score:100},
 stalker:{hp:21,speed:150,damage:8,rad:12,xp:6,color:'#61e6f2',score:130},
 brute:{hp:90,speed:62,damage:17,rad:23,xp:12,color:'#f7b16a',score:260},
 hexer:{hp:40,speed:82,damage:10,rad:18,xp:10,color:'#ef87b5',score:220},
 ravager:{hp:62,speed:95,damage:16,rad:20,xp:11,color:'#ffba68',score:270},
 monarch:{hp:660,speed:75,damage:22,rad:43,xp:54,color:'#ff777b',score:2200},
 tyrant:{hp:850,speed:92,damage:26,rad:48,xp:70,color:'#a788ff',score:2750}
});
const PI=Math.PI,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const length=(x,y)=>Math.hypot(x,y)||1;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const ARENAS=Object.freeze([
 {id:'sanctum',name:'THE SHATTERED CITADEL',short:'SANCTUM',floor:'#070b1b',glow:'#7e4bc7',sigil:'#b598ec',mist:'#34306b'},
 {id:'ember',name:'THE ASHEN RIFT',short:'ASHEN RIFT',floor:'#130b19',glow:'#bd4a70',sigil:'#e7a16d',mist:'#6e304a'},
 {id:'moon',name:'THE MOONLIT RUINS',short:'MOONLIT RUINS',floor:'#08131c',glow:'#3f9ab8',sigil:'#a2e1ef',mist:'#244c6a'},
 {id:'throne',name:'THE VOID THRONE',short:'VOID THRONE',floor:'#110a20',glow:'#9753a6',sigil:'#e2a7ff',mist:'#573565'}
]);
export function arenaForWave(wave){return ARENAS[Math.floor((Math.max(1,wave)-1)/2)%ARENAS.length];}
export const EXPEDITIONS=Object.freeze({
 sanctum:{type:'wardstone',name:'WARDSTONE DEFENSE',icon:'◈',
  description:'Keep the wardstone alive until the wave ends.',reward:24},
 ember:{type:'portals',name:'RIFT PURGE',icon:'⊗',
  description:'Destroy both portals before they summon more shadows.',reward:32},
 moon:{type:'shrine',name:'MOONLIGHT RITUAL',icon:'☾',
  description:'Stand inside the moon shrine to charge its blessing.',reward:28},
 throne:{type:'seals',name:'VOID SEALS',icon:'✧',
  description:'Stand near both seals to weaken the Void Tyrant.',reward:42}
});
export const isBoss=e=>e.kind==='monarch'||e.kind==='tyrant';
export const finite=(n,d=0)=>Number.isFinite(n)?n:d;
export function rng(state){
 let x=state.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;state.seed=x|0;
 return (x>>>0)/4294967296;
}
export function createRun(seed=0x59ab7e,loadout={}){
 const seedValue=(Number(seed)|0)||0x59ab7e;
 const initial=startingStats(loadout);
 const game={seed:seedValue,phase:'running',time:0,wave:0,level:1,xp:0,nextXP:20,score:0,kills:0,
  bestCombo:0,combo:0,comboTime:0,eliteKills:0,bossKills:0,rareDrops:0,expeditionsCompleted:0,expeditionsFailed:0,expeditionRenown:0,expedition:null,evolutions:{},options:[],enemies:[],shots:[],hostile:[],orbs:[],effects:[],events:[],hazards:[],
  intermission:0,nextId:1,
  ranks:Object.fromEntries(UPGRADES.map(u=>[u.id,0])),
  player:{x:WORLD.width/2,y:WORLD.height/2,hp:initial.maxHp,
   ...initial,fireCooldown:0,dashCooldown:0,dashTime:0,invulnerable:0,abilityCooldown:0,barrierTime:0,aegisCooldown:0,fireCount:0,
   shots:1,angle:-PI/2,blessingTime:0,stride:0,moving:0,attackPulse:0,shotSide:0,
   modelStyle:['standard','eclipse','crowned'].includes(loadout.style)?loadout.style:'standard'},
  startingLoadout:{champion:initial.champion,relics:[...(loadout.relics||[])],
    style:['standard','eclipse','crowned'].includes(loadout.style)?loadout.style:'standard'}};
 spawnWave(game);
 return game;
}
function newEnemy(s,kind,wave,index=0){
 const model=ENEMY_TYPES[kind];
 const angle=rng(s)*PI*2,range=485+rng(s)*240;
 const elite=!['monarch','tyrant'].includes(kind)&&wave>=3&&rng(s)<Math.min(.17,.075+wave*.007);
 const hp=Math.round(model.hp*(1+(wave-1)*(isBoss({kind})?.32:.18))*(elite?1.8:1));
 return {id:s.nextId++,kind,elite,x:clamp(s.player.x+Math.cos(angle)*range,65,WORLD.width-65),
  y:clamp(s.player.y+Math.sin(angle)*range,65,WORLD.height-65),hp,maxHp:hp,
  speed:model.speed*(1+Math.min(wave,16)*.018)*(elite?1.1:1),damage:Math.round(model.damage*(elite?1.28:1)),rad:model.rad*(elite?1.14:1),
  attack:.45+rng(s)*.4,shoot:1.4+rng(s),wobble:rng(s)*PI*2,phase:index*.36,
  bossPhase:1,boss:false,siege:false,aimAngle:0,aimLocked:false,flash:0,frozenFor:0,burnTime:0,burnTick:0,burnDamage:0,chargeWindup:0,chargeActive:0,chargeAngle:0,
  chargeCooldown:2+rng(s)*.9};
}
function newHazard(s,index){
 const a=rng(s)*PI*2,dist=200+rng(s)*310,p=s.player;
 return {id:s.nextId++,x:clamp(p.x+Math.cos(a)*dist,100,WORLD.width-100),
  y:clamp(p.y+Math.sin(a)*dist,100,WORLD.height-100),radius:54+(index%2)*11,
  timer:rng(s)*.3,period:4.8,telegraph:1.35,active:.82,damage:12+s.wave*1.6};
}
function createExpedition(s){
 const arena=arenaForWave(s.wave),meta=EXPEDITIONS[arena.id],p=s.player;
 const base={type:meta.type,realm:arena.id,name:meta.name,description:meta.description,
  icon:meta.icon,reward:meta.reward+Math.floor(s.wave/4)*5,status:'active',
  progress:0,total:1,items:[],timer:0};
 if(base.type==='wardstone'){
  base.target={x:clamp(p.x+165,110,WORLD.width-110),y:clamp(p.y-58,110,WORLD.height-110),
   hp:125+Math.max(0,s.wave-1)*9,maxHp:125+Math.max(0,s.wave-1)*9,r:38};
 }else if(base.type==='portals'){
  base.total=2;
  for(const [dx,dy] of [[-190,-150],[230,120]])
   base.items.push({x:clamp(p.x+dx,110,WORLD.width-110),
    y:clamp(p.y+dy,110,WORLD.height-110),hp:86+s.wave*5,maxHp:86+s.wave*5,
    r:31,active:true,spawnTimer:4.1+rng(s)*1.3});
 }else if(base.type==='shrine'){
  base.total=5.2;
  base.target={x:clamp(p.x+165,100,WORLD.width-100),
   y:clamp(p.y-80,100,WORLD.height-100),r:95};
 }else if(base.type==='seals'){
  base.total=2;
  for(const [dx,dy] of [[-220,-165],[235,150]])
   base.items.push({x:clamp(p.x+dx,110,WORLD.width-110),
    y:clamp(p.y+dy,110,WORLD.height-110),r:94,charge:0,done:false});
  base.surge={timer:0,period:5.7,telegraph:1.45,active:.65,radius:170};
 }
 return base;
}
function finishExpedition(s,success){
 const obj=s.expedition;
 if(!obj||obj.status!=='active')return;
 obj.status=success?'complete':'failed';
 if(success){
  s.expeditionsCompleted++;
  s.expeditionRenown+=obj.reward;
  s.score+=obj.reward*65;
  if(obj.type==='shrine'){
   s.player.blessingTime=Math.max(s.player.blessingTime,35);
   s.player.hp=Math.min(s.player.maxHp,s.player.hp+18);
  }
  s.effects.push({x:s.player.x,y:s.player.y,t:1.1,kind:'expeditionComplete',size:110});
 }else s.expeditionsFailed++;
 s.events.push({type:success?'expeditionComplete':'expeditionFailed',
  objective:obj.name,realm:obj.realm,renown:success?obj.reward:0});
}
export function expeditionStatus(s){
 const obj=s.expedition;
 if(!obj)return null;
 const details={
  wardstone:()=>Math.max(0,Math.ceil(obj.target.hp))+' / '+obj.target.maxHp+' WARD HP',
  portals:()=>obj.items.filter(q=>q.active).length+' PORTALS REMAIN',
  shrine:()=>Math.floor(obj.progress/obj.total*100)+'% CHARGED',
  seals:()=>obj.items.filter(q=>q.done).length+' / 2 SEALS AWAKENED'
 };
 return {realm:obj.realm,type:obj.type,name:obj.name,description:obj.description,
  status:obj.status,progress:obj.type==='wardstone'?Math.min(1,Math.max(0,obj.target.hp/obj.target.maxHp)):Math.min(1,obj.progress/obj.total),detail:details[obj.type](),
  reward:obj.reward};
}
function updateExpedition(s,dt){
 const obj=s.expedition;
 if(!obj||obj.status!=='active')return;
 const p=s.player;
 if(obj.type==='wardstone'){
  if(obj.target.hp<=0){obj.target.hp=0;finishExpedition(s,false)}
 }else if(obj.type==='portals'){
  for(const portal of obj.items){
   if(!portal.active)continue;
   portal.spawnTimer-=dt;
   if(portal.spawnTimer<=0){
    portal.spawnTimer=3.9+rng(s)*1.4;
    if(s.enemies.filter(e=>e.hp>0).length<53){
     const e=newEnemy(s,s.wave>=5?'stalker':'wraith',s.wave,33);
     e.x=portal.x+(rng(s)-.5)*65;e.y=portal.y+(rng(s)-.5)*65;
     s.enemies.push(e);s.events.push({type:'portalSpawn'});
    }
   }
  }
  obj.progress=obj.items.filter(q=>!q.active).length;
  if(obj.progress>=obj.total)finishExpedition(s,true);
 }else if(obj.type==='shrine'){
  if(distance(p,obj.target)<obj.target.r-11){
   obj.progress=Math.min(obj.total,obj.progress+dt);
   if(obj.progress>=obj.total)finishExpedition(s,true);
  }
 }else if(obj.type==='seals'){
  for(const seal of obj.items){
   if(seal.done)continue;
   if(distance(p,seal)<seal.r-14)seal.charge=Math.min(2.2,seal.charge+dt);
   if(seal.charge>=2.2){
    seal.done=true;obj.progress++;
    s.effects.push({x:seal.x,y:seal.y,t:.8,kind:'seal',size:95});
    s.events.push({type:'sealActivated'});
   }
  }
  if(obj.progress>=obj.total)finishExpedition(s,true);
  if(obj.status==='active'){
   const surge=obj.surge;
   surge.timer=(surge.timer+dt)%surge.period;
   if(surge.timer>=surge.telegraph&&surge.timer<surge.telegraph+surge.active){
    // This dangerous pulse targets the outer arena. Move toward the central
    // dais to avoid the attack; the telegraph is drawn in the renderer.
    if(distance(p,{x:WORLD.width/2,y:WORLD.height/2})>surge.radius)harmPlayer(s,15+s.wave*1.2);
   }
  }
 }
}
export function spawnWave(s){
 if(s.phase==='gameover')return;
 s.wave++;
 s.hazards=[];
 s.expedition=createExpedition(s);
 const count=Math.min(40,6+s.wave*3),
  pool=s.wave<2?['wraith']:s.wave<3?['wraith','stalker']:
   s.wave<5?['wraith','stalker','brute','hexer']:['wraith','stalker','brute','hexer','ravager'];
 for(let i=0;i<count;i++){
  const kind=s.wave>=5&&i===1?'ravager':s.wave>=3&&i===0?'hexer':pool[Math.floor(rng(s)*pool.length)];
  const enemy=newEnemy(s,kind,s.wave,i);
  enemy.siege=s.expedition.type==='wardstone'&&i%4===0&&['wraith','brute','ravager'].includes(kind);
  s.enemies.push(enemy);
 }
 if(s.wave%4===0){
  const boss=newEnemy(s,s.wave%8===0?'tyrant':'monarch',s.wave,99);
  boss.boss=true;boss.shoot=1.4;boss.siege=false;
  s.enemies.push(boss);
  s.effects.push({x:boss.x,y:boss.y,t:1.45,kind:'bossEntrance',size:boss.rad+22});
  s.events.push({type:'bossEntrance',wave:s.wave,kind:boss.kind});
 }
 if(s.wave>=3&&s.wave%2===1){
  for(let i=0;i<Math.min(4,1+Math.floor(s.wave/3));i++)s.hazards.push(newHazard(s,i));
 }
 s.events.push({type:'wave',wave:s.wave,boss:s.wave%4===0,arena:arenaForWave(s.wave).id,
  hazards:s.hazards.length,objective:s.expedition.name});
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
 const evolution=EVOLUTIONS.find(e=>e.id===id&&s.ranks[id]>=e.rank);
 if(evolution&&!s.evolutions[id]){
  s.evolutions[id]=true;
  s.effects.push({x:p.x,y:p.y,t:1.1,kind:'evolution',size:90});
  s.events.push({type:'evolution',id:evolution.id,name:evolution.name});
  if(id==='ward')p.aegisCooldown=0;
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
 // Void Tyrant's armor is genuinely linked to the two local Void Seals.
 if(e.kind==='tyrant'&&s.expedition?.type==='seals'&&s.expedition.status==='active')
  damage=Math.max(1,Math.round(damage*.57));
 e.hp-=damage;e.flash=.13;
 if(isBoss(e)&&e.hp>0&&e.bossPhase===1&&e.hp/e.maxHp<=.55){
  e.bossPhase=2;
  e.shoot=Math.min(e.shoot,1.25);
  s.events.push({type:'bossEnraged',kind:e.kind,wave:s.wave});
  s.effects.push({x:e.x,y:e.y,t:1.1,kind:'bossEnrage',size:140});
  if(e.kind==='tyrant')s.hazards.push({id:s.nextId++,kind:'bossPulse',
   x:e.x,y:e.y,radius:143,timer:0,period:7.3,telegraph:1.4,active:.70,
   damage:19+s.wave*1.2});
 }
 s.effects.push({x:e.x,y:e.y,t:.24,kind:'impact',size:e.rad});
 if(s.effects.length<135)s.effects.push({x:e.x+(rng(s)-.5)*14,y:e.y-e.rad-8,
  t:.55,kind:'number',size:0,value:Math.ceil(damage)});
 if(e.hp>0)return;
 const model=ENEMY_TYPES[e.kind],p=s.player;
 const reward=e.elite?2:1;
 s.score+=Math.round(model.score*reward*(1+Math.floor(s.combo/8)));s.kills++;
 // Loot is deterministically generated from the run seed and earned only
 // on real enemy deaths, then banked after defeat (never on retreat/restart).
 const rare=isBoss(e)?(e.kind==='tyrant'||rng(s)<.50):e.elite&&rng(s)<.22;
 if(rare){
  s.rareDrops=Math.min(100,s.rareDrops+1);
  s.effects.push({x:e.x,y:e.y,t:1.1,kind:'rareLoot',size:55});
  s.events.push({type:'rareLoot',kind:e.kind,total:s.rareDrops});
 }
 if(e.elite){s.eliteKills++;s.events.push({type:'eliteDefeated',kind:e.kind})}
 s.combo++;s.comboTime=4.2;s.bestCombo=Math.max(s.combo,s.bestCombo);
 p.hp=Math.min(p.maxHp,p.hp+p.leech);
 s.orbs.push({x:e.x,y:e.y,value:model.xp*reward,r:5+Math.min(5,model.xp/9)});
 s.effects.push({x:e.x,y:e.y,t:.55,kind:'death',size:e.rad*(e.elite?1.9:1)});
 if(isBoss(e)){s.bossKills++;s.events.push({type:'bossDefeated',wave:s.wave,kind:e.kind})}
 s.events.push({type:'kill',kind:e.kind});
}
export function activateAbility(s){
 if(s.phase!=='running')return false;
 const p=s.player,ability=ABILITIES[p.champion]||ABILITIES.warden;
 if(p.abilityCooldown>0)return false;
 p.abilityCooldown=ability.cooldown;
 if(ability.id==='nova'){
  const radius=230,damage=Math.round(p.damage*2.2);
  for(const e of s.enemies){
   if(e.hp<=0)continue;
   const dx=e.x-p.x,dy=e.y-p.y,d=length(dx,dy);
   if(d>radius+e.rad)continue;
   e.x=clamp(e.x+dx/d*125,30,WORLD.width-30);
   e.y=clamp(e.y+dy/d*125,30,WORLD.height-30);
   hitEnemy(s,e,damage);
  }
  s.effects.push({x:p.x,y:p.y,t:.65,kind:'nova',size:radius});
 }else if(ability.id==='bulwark'){
  p.barrierTime=2.35;p.invulnerable=Math.max(p.invulnerable,2.35);
  for(const e of s.enemies){
   if(e.hp<=0)continue;
   if(distance(e,p)<245+e.rad)e.frozenFor=Math.max(e.frozenFor||0,2.1);
  }
  s.effects.push({x:p.x,y:p.y,t:.75,kind:'freeze',size:240});
 }else{
  const arc=1.08,rad=240,angle=p.angle;
  for(const e of s.enemies){
   if(e.hp<=0)continue;
   const dx=e.x-p.x,dy=e.y-p.y,d=length(dx,dy);
   const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle));
   if(d>rad+e.rad||Math.abs(delta)>arc)continue;
   e.burnTime=Math.max(e.burnTime||0,3);
   e.burnDamage=Math.max(e.burnDamage||0,Math.max(6,Math.round(p.damage*.55)));
   e.burnTick=0;
   hitEnemy(s,e,Math.round(p.damage*1.7));
  }
  s.effects.push({x:p.x,y:p.y,t:.42,kind:'cleave',size:rad,angle});
 }
 s.events.push({type:'ability',id:ability.id,name:ability.name});
 return true;
}
export function evolutionActive(s,id){return Boolean(s.evolutions?.[id])}
function fire(s,aim){
 const p=s.player,targets=s.enemies.filter(e=>e.hp>0);
 if(s.expedition?.type==='portals'&&s.expedition.status==='active')
  targets.push(...s.expedition.items.filter(q=>q.active));
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
 p.angle=dir;p.fireCount++;p.attackPulse=1;p.shotSide=1-p.shotSide;
 if(s.evolutions.blade&&p.fireCount%2===0){
  const radius=148,halfArc=1.05,damage=Math.round(p.damage*.9);
  for(const e of s.enemies){
   const dx=e.x-p.x,dy=e.y-p.y,d=length(dx,dy);
   const difference=Math.atan2(Math.sin(Math.atan2(dy,dx)-dir),Math.cos(Math.atan2(dy,dx)-dir));
   if(e.hp>0&&d<radius+e.rad&&Math.abs(difference)<halfArc)hitEnemy(s,e,damage);
  }
  s.effects.push({x:p.x,y:p.y,t:.30,kind:'sovereignSlash',size:radius,angle:dir});
 }
 for(let i=0;i<p.shots;i++){
  const offset=(i-(p.shots-1)/2)*.125,angle=dir+offset,speed=640;
  s.shots.push({x:p.x+Math.cos(angle)*22,y:p.y+Math.sin(angle)*22,
   vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:5.5,ttl:1.10,
   damage:Math.round(p.damage*(p.blessingTime>0?1.2:1)),split:Boolean(s.evolutions.barrage)});
 }
 s.events.push({type:'fire'});
}
function harmPlayer(s,amount){
 const p=s.player;
 if(p.invulnerable>0||s.phase!=='running')return;
 if(s.evolutions.ward&&p.aegisCooldown<=0){
  p.aegisCooldown=15;p.invulnerable=Math.max(p.invulnerable,.9);
  s.effects.push({x:p.x,y:p.y,t:.85,kind:'aegis',size:85});
  s.events.push({type:'aegisBlock'});
  return;
 }
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
 p.abilityCooldown=Math.max(0,p.abilityCooldown-dt);
 p.blessingTime=Math.max(0,p.blessingTime-dt);
 p.barrierTime=Math.max(0,p.barrierTime-dt);
 p.aegisCooldown=Math.max(0,p.aegisCooldown-dt);
 p.attackPulse=Math.max(0,p.attackPulse-dt*6.5);
 const dx=clamp(finite(input.dx),-1,1),dy=clamp(finite(input.dy),-1,1),n=Math.hypot(dx,dy);
 const mx=n>0?dx/n:0,my=n>0?dy/n:0;
 p.moving=Math.min(1,n);
 if(n>.1)p.stride+=dt*(p.dashTime>0?27:12);
 if(input.dash&&p.dashCooldown<=0&&n>.1){
  p.dashTime=.18;p.dashCooldown=p.dashBase;p.invulnerable=Math.max(p.invulnerable,.25);
  s.events.push({type:'dash'});
 }
 if(input.ability)activateAbility(s);
 const spd=p.speed*(p.dashTime>0?3.5:1)*(p.blessingTime>0?1.08:1);
 p.x=clamp(p.x+mx*spd*dt,40,WORLD.width-40);
 p.y=clamp(p.y+my*spd*dt,40,WORLD.height-40);
 if(n>.12&&p.fireCooldown>0)p.angle=Math.atan2(my,mx);
 if(p.fireCooldown<=0){
  fire(s,input.aim);
  p.fireCooldown=Math.max(.1,p.rate);
 }
 for(const e of s.enemies){
  if(e.hp<=0)continue;
  if(e.burnTime>0){
   e.burnTime=Math.max(0,e.burnTime-dt);
   e.burnTick=(e.burnTick||0)-dt;
   if(e.burnTick<=0){
    e.burnTick=.42;
    hitEnemy(s,e,e.burnDamage||6);
    if(e.hp<=0)continue;
   }
  }
  if(e.frozenFor>0){
   e.frozenFor=Math.max(0,e.frozenFor-dt);
   e.flash=Math.max(0,e.flash-dt);
   continue;
  }
  const siegeTarget=e.siege&&s.expedition?.type==='wardstone'&&s.expedition.status==='active'&&distance(e,p)>e.rad+21?
   s.expedition.target:p;
  const vx=siegeTarget.x-e.x,vy=siegeTarget.y-e.y,dist=length(vx,vy);
  e.attack-=dt;e.shoot-=dt;e.flash=Math.max(0,e.flash-dt);
  e.chargeCooldown=Math.max(0,e.chargeCooldown-dt);
  let moveX=vx/dist,moveY=vy/dist,moveSpeed=e.speed;
  if(e.kind==='stalker'){
   const drift=Math.sin(s.time*2+e.wobble)*.42;
   moveX-=drift*vy/dist;moveY+=drift*vx/dist;
  }else if(e.kind==='hexer'){
   // The Hexer prefers a mid-range duel and slowly strafes rather than
   // behaving like another melee mob.
   const side=Math.sin(s.time*.65+e.wobble)>0?1:-1;
   if(dist<235){moveX=-moveX;moveY=-moveY}
   else if(dist<450){moveX=-moveY*side*.85;moveY=vx/dist*side*.85}
  }else if(e.kind==='ravager'){
   if(e.chargeActive>0){
    e.chargeActive=Math.max(0,e.chargeActive-dt);
    moveX=Math.cos(e.chargeAngle);moveY=Math.sin(e.chargeAngle);moveSpeed=e.speed*4.1;
   }else if(e.chargeWindup>0){
    e.chargeWindup=Math.max(0,e.chargeWindup-dt);
    moveSpeed=0;
    if(e.chargeWindup===0){
     e.chargeActive=.48;e.chargeCooldown=3.6;
     s.events.push({type:'charge',kind:'ravager'});
    }
   }else if(e.chargeCooldown<=0&&dist>120&&dist<650){
    e.chargeAngle=Math.atan2(vy,vx);
    e.chargeWindup=.68;moveSpeed=0;
    s.events.push({type:'chargeWarning',kind:'ravager'});
   }
  }
  e.x=clamp(e.x+moveX*moveSpeed*dt,30,WORLD.width-30);
  e.y=clamp(e.y+moveY*moveSpeed*dt,30,WORLD.height-30);
  if(dist<e.rad+18&&e.attack<=0){
   if(e.siege&&siegeTarget!==p){
    s.expedition.target.hp=Math.max(0,s.expedition.target.hp-e.damage);
    s.effects.push({x:siegeTarget.x,y:siegeTarget.y,t:.38,kind:'wardHit',size:48});
    s.events.push({type:'wardHit'});
   }else harmPlayer(s,e.damage+(e.kind==='ravager'&&e.chargeActive>0?5:0));
   e.attack=isBoss(e)?1.15:.9;
  }
  const isCaster=e.kind==='hexer'||isBoss(e);
  const maxRange=isBoss(e)?890:770;
  const windup=isBoss(e)?.78:.58;
  if(isCaster&&dist<maxRange){
   if(e.shoot<=windup&&!e.aimLocked){
    e.aimAngle=Math.atan2(vy,vx);e.aimLocked=true;
    s.events.push({type:'castWarning',kind:e.kind});
   }
   if(e.shoot<=0){
    const spread=e.kind==='tyrant'?
     (e.bossPhase===2?[-.6,-.3,0,.3,.6]:[-.32,0,.32]):
     e.kind==='monarch'?(e.bossPhase===2?[-.45,-.22,0,.22,.45]:[-.22,0,.22]):[0];
    for(const off of spread){
     const angle=e.aimAngle+off;
     const speed=isBoss(e)?(e.bossPhase===2?295:240):205;
     s.hostile.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      damage:isBoss(e)?(e.bossPhase===2?16:12):9,r:isBoss(e)?8:7,
      ttl:isBoss(e)?3:3.3,kind:e.kind});
    }
    e.shoot=(isBoss(e)?(e.bossPhase===2?1.85:2.5):2.8)+rng(s)*.35;
    e.aimLocked=false;
    s.events.push({type:isBoss(e)?'bossAttack':'hexAttack',kind:e.kind});
   }
  }else if(isCaster){
   // Prevent a spell from firing without warning as an enemy enters range.
   e.shoot=Math.max(e.shoot,windup+.08);
   e.aimLocked=false;
  }
 }
 updateExpedition(s,dt);
 // Rifts activate only after a clear circular warning and then cool down.
 // Damage uses the same single-hit invulnerability logic as enemy contact.
 for(const h of s.hazards){
  h.timer=(h.timer+dt)%h.period;
  if(h.timer>=h.telegraph&&h.timer<h.telegraph+h.active&&distance(h,p)<h.radius+12){
   harmPlayer(s,h.damage);
  }
 }
 if(s.hostile.length>90)s.hostile=s.hostile.slice(-90);
 const splitShots=[];
 for(const b of s.shots){
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
  if(b.ignoreTime>0)b.ignoreTime=Math.max(0,b.ignoreTime-dt);
  if(b.ttl<=0)continue;
  for(const e of s.enemies){
   if(e.hp<=0)continue;
   const rad=b.r+e.rad;
   if((e.x-b.x)**2+(e.y-b.y)**2<rad**2){
    if(b.ignoreId===e.id&&b.ignoreTime>0)continue;
    b.ttl=0;hitEnemy(s,e,b.damage);
    if(b.split){
     const base=Math.atan2(b.vy,b.vx);
     for(const angle of [base-.56,base+.56])
      splitShots.push({x:b.x,y:b.y,vx:Math.cos(angle)*540,vy:Math.sin(angle)*540,
       r:4.4,ttl:.7,damage:Math.max(2,Math.round(b.damage*.58)),
       split:false,storm:true,ignoreId:e.id,ignoreTime:.13});
     s.effects.push({x:b.x,y:b.y,t:.35,kind:'storm',size:44});
    }
    break;
   }
  }
  if(b.ttl>0&&s.expedition?.type==='portals'&&s.expedition.status==='active'){
   for(const portal of s.expedition.items){
    if(!portal.active)continue;
    if(distance(portal,b)>=portal.r+b.r)continue;
    portal.hp-=b.damage;b.ttl=0;
    s.effects.push({x:portal.x,y:portal.y,t:.3,kind:'portalHit',size:portal.r});
    if(portal.hp<=0){
     portal.active=false;portal.hp=0;
     s.events.push({type:'portalDestroyed'});
     s.effects.push({x:portal.x,y:portal.y,t:.8,kind:'portalDestroyed',size:80});
    }
    break;
   }
  }
 }
 s.shots=s.shots.filter(x=>x.ttl>0).concat(splitShots.slice(0,36));
 if(s.shots.length>130)s.shots=s.shots.slice(-130);
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
 if(s.orbs.length>230)s.orbs=s.orbs.slice(-230);
 for(const fx of s.effects)fx.t-=dt;
 s.effects=s.effects.filter(x=>x.t>0).slice(-140);
 if(s.phase!=='running')return;
 if(!s.enemies.length){
  if(s.intermission===0){
   s.intermission=2.6;s.events.push({type:'waveClear',wave:s.wave});
   if(s.expedition?.status==='active'){
    finishExpedition(s,s.expedition.type==='wardstone'&&s.expedition.target.hp>0);
   }
  }
  s.intermission-=dt;
  if(s.intermission<=0){s.intermission=0;spawnWave(s)}
 }else s.intermission=0;
}
export function runSummary(s){
 return {score:Math.max(0,Math.floor(s.score)),wave:s.wave,kills:s.kills,
  eliteKills:s.eliteKills||0,bossKills:s.bossKills||0,rareDrops:s.rareDrops||0,
  expeditionsCompleted:s.expeditionsCompleted||0,expeditionsFailed:s.expeditionsFailed||0,
  expeditionRenown:s.expeditionRenown||0,duration:Math.round(s.time),
  bestCombo:s.bestCombo,level:s.level,champion:s.player.champion};
}
export function durationLabel(seconds){
 const n=Math.max(0,Math.floor(finite(seconds))),m=Math.floor(n/60),s=n%60;
 return m+':'+String(s).padStart(2,'0');
}
