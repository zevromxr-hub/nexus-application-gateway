/* SOVEREIGN SURVIVAL v1.6 — SOVEREIGN LEGACY
 * Self-contained achievements, rare loot, visual-only armor regalia.
 * This never reads or writes other applications' media vaults.
 */
export const LEGACY_KEY='proximus-sovereign-survival-legacy-v1';
export const ACHIEVEMENTS=Object.freeze([
 {id:'first-blood',icon:'⚔',name:'NIGHT'S FIRST HUNTER',description:'Defeat 40 shadows across completed runs.',
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
  stat:'lifetimeRenown',target:200}
]);
export const REGALIA=Object.freeze([
 {id:'standard',icon:'✧',name:'WARBOUND ARMOR',type:'ORIGINAL',cost:0,
  description:'Reforged signature armor for each champion. Always available.'},
 {id:'eclipse',icon:'☽',name:'ECLIPSE RAIMENT',type:'RARE · 2 ACHIEVEMENTS',cost:2,
  achievements:2,description:'Obsidian and radiant-violet plate with an eclipse mantle. Purely cosmetic.'},
 {id:'crowned',icon:'♛',name:'SOVEREIGN REGALIA',type:'LEGENDARY · 4 ACHIEVEMENTS',cost:4,
  achievements:4,bosses:2,description:'Ivory-gold ceremonial plate, royal mantle and a radiant crown. Purely cosmetic.'}
]);
const safeInt=n=>Number.isFinite(n)?Math.max(0,Math.min(1000000000,Math.floor(n))):0;
export function freshLegacy(){
 return {version:1,shards:0,lifetimeShards:0,claimed:[],ownedStyles:['standard'],equippedStyle:'standard'};
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
 const shards=safeInt(p.shards);
 return {version:1,shards,lifetimeShards:Math.max(shards,safeInt(p.lifetimeShards)),
  claimed,ownedStyles,equippedStyle};
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
