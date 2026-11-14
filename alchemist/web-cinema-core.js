// PROXIMUS Web Cinema Gateway 3.6.1 — pure URL classification and persistent bookmarks.
// No fetching, proxying, token extraction or automatic third-party requests.
export const WEB_CINEMA_KEY='proximus-web-cinema-links-v1';
export const WEB_CINEMA_SCHEMA='proximus.web-cinema.links/1';
export const WEB_CINEMA_LIMIT=180;
export const WEB_CINEMA_MAX_IMPORT=750000;
const youtubeHosts=new Set(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be','www.youtu.be','www.youtube-nocookie.com','youtube-nocookie.com']);
const vimeoHosts=new Set(['vimeo.com','www.vimeo.com','player.vimeo.com']);
const dailymotionHosts=new Set(['www.dailymotion.com','dailymotion.com','dai.ly','www.dai.ly']);
const directExt=/\.(?:mp4|m4v|webm|ogv|ogg|mov|m3u8)$/i;
const clean=x=>String(x??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim();
const validId=x=>/^[A-Za-z0-9_-]{11}$/.test(x||'');
function forbiddenHost(host){
 const h=host.toLowerCase().replace(/\.$/,'');
 if(!h||h==='localhost'||h.endsWith('.localhost')||h.endsWith('.local')||h.endsWith('.internal')||h.endsWith('.invalid')||h.endsWith('.test')||h.endsWith('.example')||h.includes(':'))return true;
 if(/^\d+(?:\.\d+){3}$/.test(h)){
  const n=h.split('.').map(Number);
  return n[0]===0||n[0]===10||n[0]===127||n[0]>=224||
   n[0]===169&&n[1]===254||n[0]===172&&n[1]>=16&&n[1]<=31||
   n[0]===192&&n[1]===168||n[0]===100&&n[1]>=64&&n[1]<=127||
   n[0]===198&&(n[1]===18||n[1]===19);
 }
 return false;
}
export function parseWebCinemaUrl(raw){
 const input=clean(raw);if(!input||input.length>2200)throw Error('Enter a link up to 2,200 characters.');
 if(/^(?:javascript|data|blob|file|ftp|about|vbscript):/i.test(input))throw Error('Only web links using HTTP or HTTPS are allowed.');
 const candidate=/^[a-z][a-z\d+.-]*:/i.test(input)?input:'https://'+input;
 let u;try{u=new URL(candidate);}catch{throw Error('This is not a valid website or video link.');}
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||forbiddenHost(u.hostname)||(u.port&&!['80','443'].includes(u.port)))
  throw Error('Local/private addresses, credentials, custom ports and non-web URLs cannot be opened here.');
 return u;
}
function youtubeStart(u){
 const t=u.searchParams.get('start')||u.searchParams.get('t')||'';
 if(/^\d+$/.test(t))return Math.min(Number(t),86400);
 const m=/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
 return t&&m?Math.min(86400,(Number(m[1])||0)*3600+(Number(m[2])||0)*60+(Number(m[3])||0)):0;
}
export function classifyWebCinemaUrl(input){
 const u=parseWebCinemaUrl(input),url=u.href,host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
 const base={url,host,secure:u.protocol==='https:'};
 if(u.protocol!=='https:')return {...base,kind:'external',label:'External website',reason:'Unencrypted HTTP pages open externally.'};
 if(host==='zevromxr-hub.github.io')return {...base,kind:'external',label:'PROXIMUS website',reason:'The app cannot embed itself.'};
 if(youtubeHosts.has(host)){
  let id='';
  if(host==='youtu.be'||host==='www.youtu.be')id=parts[0]||'';
  else if(parts[0]==='watch')id=u.searchParams.get('v')||'';
  else if(['embed','shorts','live'].includes(parts[0]))id=parts[1]||'';
  if(!validId(id))return {...base,kind:'external',label:'YouTube page',reason:'This URL does not identify a single embeddable video.'};
  const qs=new URLSearchParams({playsinline:'1',rel:'0'}),start=youtubeStart(u);
  if(start)qs.set('start',String(start));
  return {...base,kind:'youtube',label:'YouTube video',embed:'https://www.youtube-nocookie.com/embed/'+id+'?'+qs.toString()};
 }
 if(vimeoHosts.has(host)){
  const id=host==='player.vimeo.com'&&parts[0]==='video'?parts[1]:parts[0];
  if(!/^\d{5,14}$/.test(id||''))return {...base,kind:'external',label:'Vimeo page',reason:'This is not a supported Vimeo video URL.'};
  const h=u.searchParams.get('h')||(host==='player.vimeo.com'?'':parts[1])||'';
  const suffix=/^[a-zA-Z0-9]{6,64}$/.test(h)?'?h='+encodeURIComponent(h):'';
  return {...base,kind:'vimeo',label:'Vimeo video',embed:'https://player.vimeo.com/video/'+id+suffix};
 }
 if(dailymotionHosts.has(host))return {...base,kind:'external',label:'Dailymotion website',
  reason:'This provider requires a configured player ID for modern embeds. Use Open Externally.'};
 if(directExt.test(u.pathname))return {...base,kind:'direct',label:u.pathname.toLowerCase().endsWith('.m3u8')?'HLS stream':'Direct video file'};
 return {...base,kind:'website',label:'Website preview',embed:url,
  reason:'This site may block iframe viewing or require third-party cookies. Use Open Externally if needed.'};
}
export const isWebCinemaVideo=kind=>['youtube','vimeo','direct'].includes(kind);
function safeTitle(s){return clean(s).slice(0,120);}
function safeCollection(s){return clean(s).slice(0,40)||'General';}
export function normalizeWebCinemaLibrary(raw=[]){
 if(!Array.isArray(raw))return [];
 const out=[],seen=new Set();
 for(const row of raw){
  if(!row||typeof row!=='object')continue;
  let classified;try{classified=classifyWebCinemaUrl(row.url);}catch{continue;}
  if(seen.has(classified.url))continue;seen.add(classified.url);
  const added=Number.isSafeInteger(row.added)&&row.added>0?row.added:Date.now();
  const lastOpen=Number.isSafeInteger(row.lastOpen)&&row.lastOpen>0?row.lastOpen:0;
  const position=classified.kind==='direct'&&Number.isFinite(row.position)?Math.max(0,Math.min(432000,row.position)):0;
  const id=typeof row.id==='string'&&/^[\w-]{8,90}$/.test(row.id)?row.id:'web-'+added.toString(36)+'-'+out.length;
  out.push({id,url:classified.url,kind:classified.kind,title:safeTitle(row.title)||classified.label,
   collection:safeCollection(row.collection),favorite:row.favorite===true,added,lastOpen,position});
  if(out.length===WEB_CINEMA_LIMIT)break;
 }
 return out;
}
export function addWebCinemaLink(rows,url,title='',collection='General',now=Date.now(),nonce=''){
 const info=classifyWebCinemaUrl(url),items=normalizeWebCinemaLibrary(rows);
 const exists=items.find(x=>x.url===info.url);
 if(exists)return {items,item:exists,duplicate:true};
 if(items.length>=WEB_CINEMA_LIMIT)throw Error('Saved link library is full. Remove an old link before saving more.');
 const id='web-'+Math.trunc(now).toString(36)+'-'+(nonce||Math.random().toString(36).slice(2,11));
 const item={id,url:info.url,kind:info.kind,title:safeTitle(title)||info.label,
  collection:safeCollection(collection),favorite:false,added:now,lastOpen:0,position:0};
 return {items:[item,...items],item,duplicate:false};
}
export function filterWebCinemaLibrary(rows,{search='',filter='all'}={}){
 const q=clean(search).toLowerCase();
 return normalizeWebCinemaLibrary(rows).filter(x=>
  (filter==='all'||filter==='favorites'&&x.favorite||filter==='videos'&&isWebCinemaVideo(x.kind)||filter==='sites'&&!isWebCinemaVideo(x.kind))&&
  (!q||[x.title,x.collection,x.url].join(' ').toLowerCase().includes(q))
 ).sort((a,b)=>(b.lastOpen||b.added)-(a.lastOpen||a.added));
}
export function webCinemaBackup(rows){
 return {schema:WEB_CINEMA_SCHEMA,exportedAt:new Date().toISOString(),links:normalizeWebCinemaLibrary(rows)};
}
export function readWebCinemaBackup(doc){
 if(!doc||doc.schema!==WEB_CINEMA_SCHEMA||!Array.isArray(doc.links)||doc.links.length>WEB_CINEMA_LIMIT)
  throw Error('This is not a valid Web Cinema Gateway backup.');
 return normalizeWebCinemaLibrary(doc.links);
}
