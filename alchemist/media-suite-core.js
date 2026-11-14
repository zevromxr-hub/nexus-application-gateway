// PROXIMUS v3.3 — cross-studio GIF & Video suite logic
export const GIF_QUALITY_PROFILES={
 mobile:{label:'Mobile',preset:'small',fps:12,dither:false},
 balanced:{label:'Balanced',preset:'auto',fps:15,dither:true},
 smooth:{label:'Smooth',preset:'medium',fps:20,dither:true},
 cinema:{label:'Cinematic',preset:'medium',fps:24,dither:true}
};
export function gifPreflight({start,end,fps,width,height,speed=1}){
 const duration=Number(end)-Number(start),rate=Number(fps),w=Number(width),h=Number(height),playback=Number(speed);
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(rate)||rate<1||
 !Number.isFinite(w)||w<1||!Number.isFinite(h)||h<1||!Number.isFinite(playback)||playback<=0)
  return {valid:false,reason:'Enter a valid clip range and output dimensions.'};
 const frames=Math.ceil(duration*rate/playback),pixelBudget=frames*w*h,rawBytes=pixelBudget*4;
 if(duration>8.01)return {valid:false,frames,rawBytes,reason:'Maximum clip length is 8 seconds.'};
 if(frames>120)return {valid:false,frames,rawBytes,reason:'120-frame limit. Shorten clip or reduce FPS.'};
 if(pixelBudget>17000000)return {valid:false,frames,rawBytes,reason:'Frame pixel memory limit. Reduce dimensions, duration, or FPS.'};
 return {valid:true,frames,rawBytes,duration,outputSeconds:frames/rate};
}
function identicalFrames(a,b){
 if(a.width!==b.width||a.height!==b.height||a.data.length!==b.data.length)return false;
 const d=a.data,e=b.data;
 for(let i=0;i<d.length;i++)if(d[i]!==e[i])return false;
 return true;
}
export function combineIdenticalFrames(frames){
 const out=[];
 for(const frame of frames){
  if(!frame?.data||!Number.isFinite(frame.delayMs))throw Error('Invalid GIF frame for optimization.');
  const prev=out[out.length-1];
  if(prev&&identicalFrames(prev,frame)&&prev.delayMs+frame.delayMs<=655350){
   prev.delayMs+=frame.delayMs;
  }else out.push({width:frame.width,height:frame.height,data:frame.data,delayMs:frame.delayMs});
 }
 return out;
}
export function bookmarkAt(raw){
 const position=Number(raw?.time),id=String(raw?.id||'').slice(0,80),
  title=String(raw?.title||'Favorite scene').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,70);
 if(!/^[A-Za-z0-9-]{8,80}$/.test(id)||!Number.isFinite(position)||position<0||position>10000000)throw Error('Invalid scene bookmark');
 return {id,time:Math.round(position*10)/10,title:title||'Favorite scene'};
}
export function normalizeBookmarks(raw){
 if(!Array.isArray(raw))return [];
 const unique=new Set(),list=[];
 for(const value of raw.slice(0,120)){
  if(list.length>=60)break;
  try{const v=bookmarkAt(value);if(!unique.has(v.id)){unique.add(v.id);list.push(v);}}catch(e){}
 }
 return list.sort((a,b)=>a.time-b.time);
}
export function makeVideoCatalog(list){
 const items=(Array.isArray(list)?list:[]).filter(x=>x?.name&&x?.bytes).slice(0,500).map(x=>({
  title:String(x.displayTitle||x.name).slice(0,180),originalName:String(x.name).slice(0,180),
  bytes:Number(x.bytes)||0,duration:Number(x.duration)||0,
  collection:String(x.collection||'Unsorted').slice(0,42),
  favorite:!!x.favorite,bookmarks:normalizeBookmarks(x.bookmarks)
 }));
 return {schema:'proximus.video-catalog/1',exported:new Date().toISOString(),
  note:'This is a metadata catalog. It does not include or back up video files.',videos:items};
}
