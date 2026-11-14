// PROXIMUS v3.6.0 — Orbit Access: pure, backward-compatible navigation helpers.
export const ORBIT_PIN_KEY='proximus-orbit-pins-v1';
export const ORBIT_RECENT_KEY='proximus-orbit-recent-v1';
export const ORBIT_GROUPS=Object.freeze([
 {id:'start',label:'Start',description:'Overview and what is new',members:['command']},
 {id:'entertainment',label:'Entertainment',description:'Music, cinema and arcade',members:['reactor','videos','arcade']},
 {id:'creative',label:'Create',description:'GIF, images and documents',members:['animation','capture','documents','qr']},
 {id:'everyday',label:'Everyday',description:'Plans, notes and useful tools',members:['life','workflow','utility']},
 {id:'workspace',label:'Workspace',description:'Projects and transfers',members:['projects','automation','sync']},
 {id:'settings',label:'Customize & protect',description:'Appearance, tokens and recovery',members:['identity','tokens','recovery']},
 {id:'information',label:'Information',description:'Release notes and project story',members:['releases','creator']}
]);
const allowedIds=new Set(ORBIT_GROUPS.flatMap(group=>group.members));
export const orbitCanonicalId=id=>id==='theater'?'reactor':id;
export const orbitGroupFor=id=>ORBIT_GROUPS.find(group=>group.members.includes(orbitCanonicalId(id)))?.id||'workspace';
export function normalizeOrbitIds(raw=[],known=[...allowedIds],limit=18){
 if(!Array.isArray(raw))return [];
 const allow=new Set(known.map(orbitCanonicalId)),seen=new Set(),out=[];
 for(const item of raw){
  if(typeof item!=='string')continue;
  const id=orbitCanonicalId(item);
  if(!allow.has(id)||seen.has(id))continue;
  seen.add(id);out.push(id);if(out.length>=limit)break;
 }
 return out;
}
export function orbitFilter(studios=[],{term='',group='all',pinnedOnly=false,pins=[],recent=[]}={}){
 if(!Array.isArray(studios))return [];
 const text=String(term||'').trim().toLowerCase();
 const favorites=new Set(normalizeOrbitIds(pins,studios.map(s=>s.id)));
 const recentMap=new Map(normalizeOrbitIds(recent,studios.map(s=>s.id),30).map((id,i)=>[id,i]));
 const output=studios.filter(x=>
  x&&allowedIds.has(x.id)&&x.id!=='theater'&&
  (group==='all'||group==='favorites'&&favorites.has(x.id)||group==='recent'&&recentMap.has(x.id)||orbitGroupFor(x.id)===group)&&
  (!pinnedOnly||favorites.has(x.id))&&
  (!text||(x.title+' '+x.detail+' '+orbitGroupFor(x.id)).toLowerCase().includes(text))
 );
 return output.sort((a,b)=>{
  if(group==='recent')return (recentMap.get(a.id)??99)-(recentMap.get(b.id)??99);
  const pinned=Number(favorites.has(b.id))-Number(favorites.has(a.id));
  if(pinned)return pinned;
  const aRecent=recentMap.get(a.id)??99,bRecent=recentMap.get(b.id)??99;
  if(group==='all'&&!text&&aRecent!==bRecent)return aRecent-bRecent;
  return 0;
 });
}
export const ORBIT_DEFAULT_PINNED=Object.freeze(['reactor','videos','life','projects']);
