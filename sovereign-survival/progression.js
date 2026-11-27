/* SOVEREIGN SURVIVAL v1.3 — ASCENSION ARMORY
 * Pure, device-local progression and item definitions. This module has no
 * global storage access or network dependencies; game.js owns persistence.
 */
export const PROGRESSION_KEY='proximus-sovereign-survival-armory-v1';
export const CHAMPIONS=Object.freeze([
 {id:'warden',name:'Void Warden',title:'THE LAST SOVEREIGN',icon:'✧',style:'violet',
  description:'Balanced steel and arcane power. A dependable champion for every realm.',
  bonus:'Balanced health, damage and agility.',unlock:'Available from the beginning.'},
 {id:'sentinel',name:'Frost Sentinel',title:'THE WINTER BULWARK',icon:'❄',style:'frost',
  description:'A fortress against the dark. Greater health and armor, with slower movement.',
  bonus:'+30 starting vitality · 10% damage reduction · 8% less speed.',
  unlock:'Defeat 40 enemies across completed runs.'},
 {id:'reaver',name:'Ember Reaver',title:'THE ASHEN BLADE',icon:'⚔',style:'ember',
  description:'Relentless offensive power. High damage and rapid attacks at the cost of health.',
  bonus:'+25% blade damage · 10% faster attacks · -20 vitality.',
  unlock:'Reach Wave 4 during a completed run.'}
]);
export const RELICS=Object.freeze([
 {id:'nightglass',name:'Nightglass Edge',icon:'⚔',cost:45,rarity:'FORGED',
  description:'An ancient blade that cuts a little deeper into the shadows.',
  effect:'+20% starting blade damage.'},
 {id:'moonwell',name:'Moonwell Sigil',icon:'◈',cost:65,rarity:'ENCHANTED',
  description:'A warding symbol filled with the cold light of the old moon.',
  effect:'+25 maximum vitality at the start of each run.'},
 {id:'phantom',name:'Phantom Spurs',icon:'✧',cost:80,rarity:'RARE',
  description:'Spectral armor that moves like an unbroken shadow.',
  effect:'+13% base movement speed.'},
 {id:'chalice',name:'Soul Chalice',icon:'❖',cost:110,rarity:'RELIC',
  description:'A vessel that drinks back a fragment of every defeated foe.',
  effect:'Restore 2 additional vitality after each defeat.'}
]);
export const MAX_RELICS=2;
const safeInt=(value)=>Number.isFinite(value)?Math.max(0,Math.min(1000000000,Math.floor(value))):0;
export function freshProgress(){
 return {version:1,renown:0,lifetimeRenown:0,champion:'warden',owned:[],equipped:[]};
}
export function normalizeProgress(raw){
 const data=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const known=new Set(RELICS.map(r=>r.id));
 const owned=[...new Set(Array.isArray(data.owned)?data.owned:[])].filter(id=>known.has(id));
 const equipped=[...new Set(Array.isArray(data.equipped)?data.equipped:[])]
  .filter(id=>owned.includes(id)).slice(0,MAX_RELICS);
 const champion=CHAMPIONS.some(c=>c.id===data.champion)?data.champion:'warden';
 const renown=safeInt(data.renown),lifetimeRenown=Math.max(renown,safeInt(data.lifetimeRenown));
 return {version:1,renown,lifetimeRenown,champion,owned,equipped};
}
export function championUnlocked(id,records={}){
 if(id==='warden')return true;
 if(id==='sentinel')return safeInt(records.kills)>=40;
 if(id==='reaver')return safeInt(records.bestWave)>=4;
 return false;
}
export function chooseChampion(progress,id,records={}){
 const p=normalizeProgress(progress);
 if(!CHAMPIONS.some(c=>c.id===id))return {progress:p,success:false,reason:'Unknown champion.'};
 if(!championUnlocked(id,records))return {progress:p,success:false,reason:'Complete this champion’s unlock challenge first.'};
 return {progress:{...p,champion:id},success:true,reason:'Champion equipped.'};
}
export function purchaseRelic(progress,id){
 const p=normalizeProgress(progress),item=RELICS.find(r=>r.id===id);
 if(!item)return {progress:p,success:false,reason:'Unknown relic.'};
 if(p.owned.includes(id))return {progress:p,success:false,reason:'Already forged.'};
 if(p.renown<item.cost)return {progress:p,success:false,reason:'Not enough Renown.'};
 return {progress:{...p,renown:p.renown-item.cost,owned:[...p.owned,id]},
  success:true,reason:'Relic forged! Equip it to use its power.'};
}
export function toggleRelic(progress,id){
 const p=normalizeProgress(progress);
 if(!p.owned.includes(id))return {progress:p,success:false,reason:'Forge the relic first.'};
 if(p.equipped.includes(id))return {progress:{...p,equipped:p.equipped.filter(x=>x!==id)},
  success:true,reason:'Relic unequipped.'};
 if(p.equipped.length>=MAX_RELICS)return {progress:p,success:false,
  reason:'Both relic slots are full. Unequip one first.'};
 return {progress:{...p,equipped:[...p.equipped,id]},success:true,reason:'Relic equipped.'};
}
export function resolveLoadout(progress,records={}){
 const p=normalizeProgress(progress);
 return {champion:championUnlocked(p.champion,records)?p.champion:'warden',
  relics:p.equipped.filter(id=>p.owned.includes(id)).slice(0,MAX_RELICS)};
}
export function startingStats(loadout={}){
 const champion=CHAMPIONS.some(c=>c.id===loadout.champion)?loadout.champion:'warden';
 const items=[...new Set(Array.isArray(loadout.relics)?loadout.relics:[])].slice(0,MAX_RELICS);
 const stats={maxHp:100,speed:225,damage:18,rate:.26,damageReduction:0,dashBase:4.6,leech:0};
 if(champion==='sentinel'){
  stats.maxHp+=30;stats.speed=Math.round(stats.speed*.92);stats.damageReduction=.10;
 }else if(champion==='reaver'){
  stats.maxHp-=20;stats.damage=Math.round(stats.damage*1.25);stats.rate*=.9;
 }
 for(const id of items){
  switch(id){
  case 'nightglass':stats.damage=Math.round(stats.damage*1.2);break;
  case 'moonwell':stats.maxHp+=25;break;
  case 'phantom':stats.speed=Math.round(stats.speed*1.13);break;
  case 'chalice':stats.leech+=2;break;
  }
 }
 return {...stats,champion};
}
export function renownReward(summary={}){
 // Only awarded on a completed run; abandoning/restarting is not rewarded.
 const score=safeInt(summary.score),wave=safeInt(summary.wave),kills=safeInt(summary.kills);
 const elites=safeInt(summary.eliteKills),bosses=safeInt(summary.bossKills);
 return Math.min(4000,Math.round(6+Math.floor(score/350)+Math.min(wave,250)*3+
  Math.min(kills,1000)*.5+Math.min(elites,100)*7+Math.min(bosses,40)*24));
}
export function awardRun(progress,summary={}){
 const p=normalizeProgress(progress),amount=renownReward(summary);
 return {progress:{...p,renown:Math.min(1000000000,p.renown+amount),
  lifetimeRenown:Math.min(1000000000,p.lifetimeRenown+amount)},earned:amount};
}
