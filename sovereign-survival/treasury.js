/* Permanent local inventory: deterministic loot, bounded storage, no paid currency. */
export const TREASURY_KEY='proximus-sovereign-treasury-v1';
export const GEAR_SLOTS=Object.freeze(['weapon','armor','charm']);
export const RARITIES=Object.freeze(['common','rare','epic','legendary']);
export const GEAR_NAMES=Object.freeze({weapon:['Iron Oath','Moonfang','Voidrender','Dawnbringer'],armor:['Iron Mantle','Frostguard','Eclipse Plate','Godforged Regalia'],charm:['Ash Talisman','Soul Prism','Astral Heart','Crown of Eternity']});
const int=(v,max=1000000)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):0;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const TALENTS=Object.freeze([
 {id:'warden',name:'Arcane Sovereignty',desc:'+5% attack damage per rank'},
 {id:'sentinel',name:'Glacial Constitution',desc:'+10 maximum health per rank'},
 {id:'reaver',name:'Infernal Momentum',desc:'+4% attack speed per rank'}
]);
export function rollGear(seed,wave=1,boss=false,difficulty='normal'){
 let x=(seed|0)||1;
 const roll=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296};
 const tier=Math.max(1,Math.min(12,1+Math.floor(wave/5)));
 const r=roll(),boost=Math.min(.16,wave*.002)+(difficulty==='eternal'?.10:difficulty==='nightmare'?.05:0);
 const rarity=boss?(r<.10+boost?'legendary':r<.42+boost?'epic':'rare'):(r<.015+boost*.2?'legendary':r<.12+boost?'epic':r<.48+boost?'rare':'common');
 const slot=GEAR_SLOTS[Math.floor(roll()*3)],rollValue=1+Math.floor(roll()*5);
 return {id:(seed>>>0).toString(36)+'-'+wave,slot,rarity,tier,roll:rollValue,rank:0};
}
function cleanItem(q){
 if(!q||typeof q.id!=='string'||!q.id||q.id.length>80||!GEAR_SLOTS.includes(q.slot)||!RARITIES.includes(q.rarity))return null;
 return {id:q.id,slot:q.slot,rarity:q.rarity,tier:clamp(int(q.tier),1,12),roll:clamp(int(q.roll),1,5),rank:int(q.rank,5)};
}
export function normalizeTreasury(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const seen=new Set(),items=[];
 for(const candidate of (Array.isArray(raw.items)?raw.items:[]).slice(0,100)){
  const q=cleanItem(candidate);if(!q||seen.has(q.id))continue;seen.add(q.id);items.push(q);
 }
 const equipped={};for(const slot of GEAR_SLOTS){const id=raw.equipped?.[slot];if(items.some(q=>q.id===id&&q.slot===slot))equipped[slot]=id}
 const talents=Object.fromEntries(TALENTS.map(t=>[t.id,int(raw.talents?.[t.id],5)]));
 return {version:1,items,equipped,dust:int(raw.dust),talents};
}
export function gearName(q){return GEAR_NAMES[q.slot][RARITIES.indexOf(q.rarity)]}
export function gearPower(q){return 2+RARITIES.indexOf(q.rarity)*4+q.tier+q.roll+q.rank*2}
export function gearDescription(q){const v=gearPower(q);return q.slot==='weapon'?'+'+v+'% attack damage':q.slot==='armor'?'+'+v*2+' max health':'+'+v+'% movement speed'}
export function salvageValue(q){return 2+RARITIES.indexOf(q.rarity)*3+q.tier+q.rank*2}
export function reforgeCost(q){return 5+q.rank*5+RARITIES.indexOf(q.rarity)*2}
export function bankGear(raw,drops){
 const state=normalizeTreasury(raw);let earned=0,overflow=0;
 for(const candidate of (Array.isArray(drops)?drops:[]).slice(0,100)){
  const q=cleanItem(candidate);if(!q||state.items.some(x=>x.id===q.id))continue;
  if(state.items.length>=100){overflow+=salvageValue(q);continue}
  state.items.push(q);earned++;
 }
 state.dust=int(state.dust+overflow);return {state,earned,overflow};
}
export function changeGear(raw,action,id){
 const state=normalizeTreasury(raw),q=state.items.find(x=>x.id===id);
 if(!q)return {state,ok:false,message:'Unknown item'};
 const active=state.equipped[q.slot]===id;
 if(action==='equip'){if(active)delete state.equipped[q.slot];else state.equipped[q.slot]=id;return {state,ok:true,message:active?'Unequipped':'Equipped'}}
 if(action==='salvage'&&!active){state.dust=int(state.dust+salvageValue(q));state.items=state.items.filter(x=>x.id!==id);return {state,ok:true,message:'Salvaged into forge dust'}}
 if(action==='reforge'&&q.rank<5&&state.dust>=reforgeCost(q)){state.dust-=reforgeCost(q);q.rank++;return {state,ok:true,message:'Item reforged'}}
 return {state,ok:false,message:'Unequip first or gather more dust'};
}
export function trainTalent(raw,id,records={}){
 const state=normalizeTreasury(raw),rank=state.talents[id];
 if(rank===undefined||rank>=5||int(records.bestWave)<(rank+1)*4||state.dust<10+rank*5)return {state,ok:false,message:'Talent requirements not met'};
 state.dust-=10+rank*5;state.talents[id]++;return {state,ok:true,message:'Permanent talent trained'};
}
export function gearLoadout(raw){const state=normalizeTreasury(raw);return {gear:state.items.filter(q=>state.equipped[q.slot]===q.id),talents:state.talents}}
export function applyGear(stats,loadout={}){
 const used=new Set();
 for(const raw of (Array.isArray(loadout.gear)?loadout.gear:[]).slice(0,3)){
  const q=cleanItem(raw);if(!q||used.has(q.slot))continue;used.add(q.slot);const v=gearPower(q);
  if(q.slot==='weapon')stats.damage=Math.round(stats.damage*(1+v/100));
  if(q.slot==='armor')stats.maxHp+=v*2;
  if(q.slot==='charm')stats.speed=Math.round(stats.speed*(1+v/100));
  if(q.rarity==='legendary'){if(q.slot==='weapon')stats.critGear=true;if(q.slot==='armor')stats.guardGear=true;if(q.slot==='charm')stats.chargeGear=true}
 }
 const n=int(loadout.talents?.[stats.champion],5);
 if(stats.champion==='warden')stats.damage=Math.round(stats.damage*(1+.05*n));
 if(stats.champion==='sentinel')stats.maxHp+=10*n;
 if(stats.champion==='reaver')stats.rate*=1-.04*n;
 return stats;
}
