/* PROXIMUS 4.1 / CINEMA INTELLIGENCE — pure local catalog helpers.
 * This module never opens media files, touches storage, or sends network traffic.
 */
const clean=(value,max=200)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);
export const CINEMA_FILTERS=Object.freeze(['all','unwatched','resume','favorites','watchlist','annotated','short']);
export const CINEMA_SORTS=Object.freeze(['recent','name','oldest','largest','shortest','longest','last-played']);
export function normalizeCinemaTags(value){
 const raw=Array.isArray(value)?value:String(value??'').split(/[,;\n]+/);
 const seen=new Set(),result=[];
 for(const piece of raw){
  const name=clean(piece,25).replace(/\s+/g,' ');
  const key=name.toLocaleLowerCase();
  if(name&&!seen.has(key)){seen.add(key);result.push(name)}
  if(result.length>=8)break;
 }
 return result;
}
export function normalizeCinemaMetadata(raw={}){
 const x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const year=Number(x.releaseYear);
 return {
  displayTitle:clean(x.displayTitle,105),
  synopsis:String(x.synopsis??'').replace(/\r/g,'').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').trim().slice(0,450),
  tags:normalizeCinemaTags(x.tags),
  releaseYear:x.releaseYear===''||x.releaseYear==null||!Number.isInteger(year)||year<1888||year>2100?null:year
 };
}
const valid=x=>typeof x?.id==='string'&&x.id.length>0&&Number(x.bytes)>0;
const titleOf=x=>clean(x?.displayTitle||x?.name||'Untitled video',130);
const playing=x=>Number(x.position)>2&&(!Number(x.duration)||Number(x.position)<Number(x.duration)-6);
const seen=x=>Number(x.watched)>0;
const tagsOf=x=>normalizeCinemaTags(x.tags).join(' ');
const searchable=x=>[titleOf(x),x.collection,x.synopsis,tagsOf(x),x.releaseYear].map(y=>clean(y,500)).join(' ').toLocaleLowerCase();
const compareText=(a,b)=>titleOf(a).localeCompare(titleOf(b),undefined,{numeric:true,sensitivity:'base'});
export function filterCinemaCatalog(raw,options={}){
 const src=Array.isArray(raw)?raw:[];
 const opt=options&&typeof options==='object'?options:{};
 const mode=CINEMA_FILTERS.includes(opt.filter)?opt.filter:'all';
 const sort=CINEMA_SORTS.includes(opt.sort)?opt.sort:'recent';
 const query=clean(opt.query,120).toLocaleLowerCase();
 const ok=(x)=>{
  if(mode==='unwatched'&&(seen(x)||playing(x)))return false;
  if(mode==='resume'&&!playing(x))return false;
  if(mode==='favorites'&&!x.favorite)return false;
  if(mode==='watchlist'&&x.watchLater!==true)return false;
  if(mode==='annotated'&&!String(x.synopsis||'').trim()&&!normalizeCinemaTags(x.tags).length)return false;
  if(mode==='short'&&!(Number(x.duration)>0&&Number(x.duration)<=1800))return false;
  return !query||searchable(x).includes(query);
 };
 const list=src.filter(x=>valid(x)&&ok(x));
 const number=(x,k)=>Number(x[k])||0;
 const sorters={
  recent:(a,b)=>number(b,'added')-number(a,'added'),
  oldest:(a,b)=>number(a,'added')-number(b,'added'),
  name:(a,b)=>compareText(a,b),
  largest:(a,b)=>number(b,'bytes')-number(a,'bytes'),
  shortest:(a,b)=>(number(a,'duration')||Infinity)-(number(b,'duration')||Infinity),
  longest:(a,b)=>number(b,'duration')-number(a,'duration'),
  'last-played':(a,b)=>number(b,'watched')-number(a,'watched')
 };
 return list.sort((a,b)=>sorters[sort](a,b)||compareText(a,b));
}
export function cinemaLibraryStats(items){
 const x=(Array.isArray(items)?items:[]).filter(valid);
 return {titles:x.length,favorites:x.filter(v=>v.favorite===true).length,watchlist:x.filter(v=>v.watchLater===true).length,
  continueWatching:x.filter(playing).length,unwatched:x.filter(v=>!seen(v)&&!playing(v)).length,
  annotated:x.filter(v=>String(v.synopsis||'').trim()||normalizeCinemaTags(v.tags).length).length,
  bytes:x.reduce((sum,v)=>sum+Math.max(0,Number(v.bytes)||0),0),
  knownSeconds:x.reduce((sum,v)=>sum+Math.max(0,Number(v.duration)||0),0)
 };
}
export function cinemaCatalogSnapshot(items){
 const list=(Array.isArray(items)?items:[]).filter(valid);
 return {schema:'proximus.cinema.catalog/1',version:'4.1.0',
  notice:'Catalog metadata only. No movie files, posters, login tokens or personal media are included. This is not a movie backup.',
  exportedAt:new Date().toISOString(),
  movies:list.map(x=>({
   filename:clean(x.name,180),title:titleOf(x),collection:clean(x.collection||'Unsorted',42),
   ...normalizeCinemaMetadata(x),
   bytes:Number(x.bytes)||0,duration:Math.max(0,Number(x.duration)||0),
   favorite:Boolean(x.favorite),watchLater:Boolean(x.watchLater),added:Number(x.added)||0
  }))};
}
