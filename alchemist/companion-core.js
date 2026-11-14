// PROXIMUS | ASSET ALCHEMIST v3.2 — Companion Edition policies.
// Deprecated studios are not mounted. Source and user-created data stay available
// via the immutable previous v3.1 release and repository history.
export const RETIRED_STUDIOS=Object.freeze({
 batch:'Batch Forge',icons:'Icon Foundry',sprites:'Sprite Atlas',textures:'Texture Lab',
 palette:'Color Lab',audio:'Audio Forge',motion:'Motion Lab',model:'3D Inspector'
});
export const ACTIVE_STUDIOS=24;
export const COMPANION_LINKS='proximus-companion-links-v1';
export const COMPANION_GROUPS={
 entertainment:{label:'Entertainment',items:['videos','theater','reactor','animation','arcade']},
 everyday:{label:'Everyday useful',items:['life','workflow','utility','documents','qr','capture','automation','sync','projects']},
 creative:{label:'Creative tools',items:['image','production','layers','motiongraphics','identity','pack']},
 manage:{label:'Manage & protect',items:['command','audit','tokens','recovery','releases','creator']}
};
export function activeStudioList(studios){
 return (studios||[]).filter(s=>s&&typeof s.id==='string'&&!Object.hasOwn(RETIRED_STUDIOS,s.id));
}
export function companionCategory(id){
 for(const [group,data] of Object.entries(COMPANION_GROUPS))if(data.items.includes(id))return group;
 return 'manage';
}
export function validateCompanionUrl(input){
 const value=String(input||'').trim();
 if(value.length>1200)throw Error('Shortcut URL is too long.');
 let u;
 try{u=new URL(value);}catch(e){throw Error('Enter a valid HTTPS website URL.');}
 if(u.protocol!=='https:'||u.username||u.password)throw Error('Shortcuts must use HTTPS without embedded passwords.');
 if(!u.hostname||/[\u0000-\u001f]/.test(value))throw Error('Invalid website shortcut.');
 return u.href;
}
export function cleanCompanionLinks(raw){
 if(!Array.isArray(raw))return [];
 const ids=new Set(),out=[];
 for(const item of raw.slice(0,32)){
  if(out.length>=12)break;
  try{
   if(!item||typeof item.name!=='string'||typeof item.id!=='string')continue;
   const id=item.id.slice(0,90);
   if(!/^[a-zA-Z0-9-]{8,90}$/.test(id)||ids.has(id))continue;
   const name=item.name.trim().slice(0,46);
   if(!name)continue;
   const url=validateCompanionUrl(item.url);
   ids.add(id);out.push({id,name,url});
  }catch(e){}
 }
 return out;
}
export function companionWatchlist(items,limit=4){
 const videos=(Array.isArray(items)?items:[]).filter(x=>x&&x.id&&typeof x.name==='string'&&x.bytes>0);
 return videos.filter(x=>x.position>0)
  .sort((a,b)=>(b.watched||b.added||0)-(a.watched||a.added||0))
  .slice(0,Math.max(0,Math.min(8,limit)));
}
export function companionSavedOverview(items){
 const list=Array.isArray(items)?items.filter(x=>x?.bytes>0):[];
 return {saved:list.length,favorites:list.filter(x=>x.favorite===true).length,
  inProgress:list.filter(x=>x.position>0).length,
  totalBytes:list.reduce((sum,x)=>sum+Number(x.bytes||0),0)};
}
