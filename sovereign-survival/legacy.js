/* SOVEREIGN SURVIVAL v1.7 — CHARACTER ASCENSION
 * Self-contained achievements, rare loot, visual-only armor regalia.
 * This never reads or writes other applications' media vaults.
 */
export const LEGACY_KEY='proximus-sovereign-survival-legacy-v1';
export const ACHIEVEMENTS=Object.freeze([
 {id:'first-blood',icon:'⚔',name:"NIGHT'S FIRST HUNTER",description:'Defeat 40 shadows across completed runs.',
  stat:'kills',target:40},
 {id:'survivor',icon:'✦',name:'CITADEL VETERAN',description:'Reach Wave 4 in a completed run.',
  stat:'bestWave',target:4},
 {id:'elites',icon:'◆',name:'CROWN BREAKER',description:'Defeat 3 elite enemies across completed runs.',
  stat:'elites',target:3},
 {id:'boss',icon:'♛',name:'MONARCH SLAYER',description:'Defeat a realm boss in a completed run.',
  stat:'bosses',target:1},
 {id:'expeditions',icon:'◈',name:'REALM WAYFINDER',description:'Complete 2 realm expeditions across completed runs.',
  stat:'expeditions',target:2},
 {id:'renown',icon:'✧',name:'LEGEND FORGED',description:'Earn 200 lifetime Renown.',
  stat:'lifetimeRenown',target:200},
 {id:'nightmare-veteran',icon:'☽',name:'NIGHTMARE VETERAN',description:'Reach wave 12 in a completed run.',stat:'bestWave',target:12},
 {id:'eternal-veteran',icon:'☀',name:'ETERNAL CONQUEROR',description:'Reach wave 30 in a completed run.',stat:'bestWave',target:30},
 {id:'slayer-500',icon:'⚔',name:'LEGION BREAKER',description:'Defeat 500 foes across completed runs.',stat:'kills',target:500},
 {id:'boss-10',icon:'♛',name:'GODSLAYER',description:'Defeat 10 realm bosses.',stat:'bosses',target:10}
]);
export const REGALIA=Object.freeze([
 {id:'standard',icon:'✧',name:'WARBOUND ARMOR',type:'ORIGINAL',cost:0,
  description:'Reforged signature armor for each champion. Always available.'},
 {id:'eclipse',icon:'☽',name:'ECLIPSE RAIMENT',type:'RARE · 2 ACHIEVEMENTS',cost:2,
  achievements:2,description:'Obsidian and radiant-violet plate with an eclipse mantle. Purely cosmetic.'},
 {id:'crowned',icon:'♛',name:'SOVEREIGN REGALIA',type:'LEGENDARY · 4 ACHIEVEMENTS',cost:4,
  achievements:4,bosses:2,description:'Ivory-gold ceremonial plate, royal mantle and a radiant crown. Purely cosmetic.'}
]);
export const WEAPON_STYLES=Object.freeze([
 {id:'signature',name:'CHAMPION SIGNATURE',icon:'⚔',cost:0,
  type:'ORIGINAL WEAPONRY',description:'Void crescent blades, Frost glaive and shield, or Ember cleaver. Free with every champion.'},
 {id:'astral',name:'ASTRAL FORGED',icon:'✧',cost:2,expeditions:2,
  type:'RARE · 2 EXPEDITIONS',
  description:'Radiant ice-blue starmetal with celestial glyphs. Requires two completed realm quests.'},
 {id:'dominion',name:'DOMINION FANG',icon:'◆',cost:3,bosses:1,achievements:2,
  type:'EPIC · 1 BOSS + 2 ACHIEVEMENTS',
  description:'Spiked ruby-darkened war arms with a glowing crimson core. Requires a boss victory and two claimed achievements.'}
]);
const safeInt=n=>Number.isFinite(n)?Math.max(0,Math.min(1000000000,Math.floor(n))):0;
export function freshLegacy(){
 return {version:1,shards:0,lifetimeShards:0,claimed:[],ownedStyles:['standard'],equippedStyle:'standard',
  ownedWeapons:['signature'],equippedWeapon:'signature'};
}
export function normalizeLegacy(raw){
 const p=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const validAchievements=new Set(ACHIEVEMENTS.map(a=>a.id));
 const validStyles=new Set(REGALIA.map(r=>r.id));
 const claimed=[...new Set(Array.isArray(p.claimed)?p.claimed:[])]
  .filter(id=>validAchievements.has(id));
 const ownedStyles=['standard',...[...new Set(Array.isArray(p.ownedStyles)?p.ownedStyles:[])]
  .filter(id=>validStyles.has(id)&&id!=='standard')];
 const equippedStyle=ownedStyles.includes(p.equippedStyle)?p.equippedStyle:'standard';
 const validWeapons=new Set(WEAPON_STYLES.map(r=>r.id));
 const ownedWeapons=['signature',...[...new Set(Array.isArray(p.ownedWeapons)?p.ownedWeapons:[])]
  .filter(id=>validWeapons.has(id)&&id!=='signature')];
 const equippedWeapon=ownedWeapons.includes(p.equippedWeapon)?p.equippedWeapon:'signature';
 const shards=safeInt(p.shards);
 return {version:1,shards,lifetimeShards:Math.max(shards,safeInt(p.lifetimeShards)),
  claimed,ownedStyles,equippedStyle,ownedWeapons,equippedWeapon};
}
export function achievementProgress(achievement,records={},progress={}){
 const raw=achievement.stat==='lifetimeRenown'?progress?.lifetimeRenown:records?.[achievement.stat];
 const achieved=safeInt(raw);
 return {achieved,required:achievement.target,
  complete:achieved>=achievement.target,percentage:Math.min(100,Math.floor(achieved/achievement.target*100))};
}
export function claimAchievement(legacy,id,records={},progress={}){
 const state=normalizeLegacy(legacy),a=ACHIEVEMENTS.find(x=>x.id===id);
 if(!a)return {success:false,reason:'Unknown achievement.',legacy:state};
 if(state.claimed.includes(id))return {success:false,reason:'Already claimed.',legacy:state};
 if(!achievementProgress(a,records,progress).complete)
  return {success:false,reason:'Achievement challenge incomplete.',legacy:state};
 return {success:true,reason:'Achievement claimed · +1 Eclipse Shard.',
  legacy:{...state,shards:Math.min(1000000000,state.shards+1),
   lifetimeShards:Math.min(1000000000,state.lifetimeShards+1),
   claimed:[...state.claimed,id]}};
}
export function bankRareDrops(legacy,summary={}){
 const state=normalizeLegacy(legacy),amount=Math.min(100,safeInt(summary.rareDrops));
 return {earned:amount,legacy:{...state,shards:Math.min(1000000000,state.shards+amount),
  lifetimeShards:Math.min(1000000000,state.lifetimeShards+amount)}};
}
export function styleEligible(legacy,style,records={}){
 const state=normalizeLegacy(legacy),item=REGALIA.find(r=>r.id===style);
 if(!item)return false;
 return state.claimed.length>=(item.achievements||0)&&safeInt(records.bosses)>=(item.bosses||0);
}
export function unlockRegalia(legacy,style,records={}){
 const state=normalizeLegacy(legacy),item=REGALIA.find(r=>r.id===style);
 if(!item)return {success:false,reason:'Unknown armor set.',legacy:state};
 if(state.ownedStyles.includes(style))return {success:false,reason:'Armor already forged.',legacy:state};
 if(!styleEligible(state,style,records))
  return {success:false,reason:'Complete the armor unlock challenges first.',legacy:state};
 if(state.shards<item.cost)return {success:false,reason:'Not enough Eclipse Shards.',legacy:state};
 return {success:true,reason:item.name+' unlocked. Its new look is ready to equip.',
  legacy:{...state,shards:state.shards-item.cost,
   ownedStyles:[...state.ownedStyles,style]}};
}
export function equipRegalia(legacy,style){
 const state=normalizeLegacy(legacy);
 if(!state.ownedStyles.includes(style))
  return {success:false,reason:'Forge this armor set first.',legacy:state};
 return {success:true,reason:'Armor appearance equipped · '+style.toUpperCase(),
  legacy:{...state,equippedStyle:style}};
}
export function resolveRegalia(legacy){
 return normalizeLegacy(legacy).equippedStyle;
}

export function weaponEligible(legacy,id,records={}){
 const state=normalizeLegacy(legacy),item=WEAPON_STYLES.find(x=>x.id===id);
 if(!item)return false;
 return state.claimed.length>=(item.achievements||0)&&
  safeInt(records.bosses)>=(item.bosses||0)&&
  safeInt(records.expeditions)>=(item.expeditions||0);
}
export function unlockWeapon(legacy,id,records={}){
 const state=normalizeLegacy(legacy),item=WEAPON_STYLES.find(x=>x.id===id);
 if(!item)return {success:false,reason:'Unknown weapon appearance.',legacy:state};
 if(state.ownedWeapons.includes(id))
  return {success:false,reason:'Weapon appearance already owned.',legacy:state};
 if(!weaponEligible(state,id,records))
  return {success:false,reason:'Complete the weapon unlock challenge first.',legacy:state};
 if(state.shards<item.cost)
  return {success:false,reason:'Not enough Eclipse Shards.',legacy:state};
 return {success:true,reason:item.name+' forged. Equip it for your next battle.',
  legacy:{...state,shards:state.shards-item.cost,
   ownedWeapons:[...state.ownedWeapons,id]}};
}
export function equipWeapon(legacy,id){
 const state=normalizeLegacy(legacy);
 if(!state.ownedWeapons.includes(id))
  return {success:false,reason:'Forge this weapon appearance before equipping.',legacy:state};
 return {success:true,reason:'Equipped '+id.toUpperCase()+' weapon appearance.',
  legacy:{...state,equippedWeapon:id}};
}
export function resolveWeapon(legacy){
 return normalizeLegacy(legacy).equippedWeapon;
}
