// PROXIMUS v3.5.3 | Portable saved-music queue order — settings only, never audio bytes.
export const SONIC_ORDER_KEY='proximus-sonic-playlist-order-v1';
export function normalizeSonicOrder(raw=[]){
 if(!Array.isArray(raw))return [];
 const out=[],seen=new Set();
 for(const value of raw){
  if(typeof value!=='string'||value.length<1||value.length>500||seen.has(value))continue;
  seen.add(value);out.push(value);if(out.length===150)break;
 }
 return out;
}
export function orderStoredMusic(records=[],rawOrder=[],preferredId=''){
 if(!Array.isArray(records))return [];
 const order=normalizeSonicOrder(rawOrder),byId=new Map(records.map(r=>[r.id,r]));
 const result=[],used=new Set();
 if(typeof preferredId==='string'&&byId.has(preferredId)){
  result.push(byId.get(preferredId));used.add(preferredId);
 }
 for(const id of order){if(byId.has(id)&&!used.has(id)){result.push(byId.get(id));used.add(id);}}
 for(const record of records){if(!used.has(record.id)){result.push(record);used.add(record.id);}}
 return result;
}
export function movePlaylistItem(items,from,direction){
 if(!Array.isArray(items)||!Number.isInteger(from)||![-1,1].includes(direction)||from<0||from>=items.length)return items?.slice?.()||[];
 const to=from+direction;if(to<0||to>=items.length)return items.slice();
 const result=items.slice();const [item]=result.splice(from,1);result.splice(to,0,item);return result;
}
