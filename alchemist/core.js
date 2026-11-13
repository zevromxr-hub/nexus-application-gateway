// NEXUS Asset Alchemist v1.0 — browser-only utility primitives.
export const $ = id => document.getElementById(id);
export const safe = name => String(name || 'asset').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/^\.+/,'_').slice(0,160) || 'asset';
export const stem = name => safe(String(name).replace(/\.[^.]*$/,''));
export const bytes = n => n < 1024 ? n+' B' : n < 1048576 ? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(2)+' MB';
export const number = (id,fallback,min=0,max=8192) => { const n=Number($(id)?.value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback; };
export const clamp = (x,min=0,max=1) => Math.max(min,Math.min(max,x));
export function notice(message,error=false){const el=$('notice');if(!el)return;el.textContent=message;el.className=error?'error':'good';}
export function download(data,filename){
  const blob = data instanceof Blob ? data : new Blob([data],{type:'application/octet-stream'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=safe(filename);document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);return blob;
}
export function blobCanvas(canvas,type='image/png',quality=.92){
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Canvas export failed: image too large or format unsupported')),type,quality));
}
export function createCanvas(w,h){
 w=Math.round(Number(w));h=Math.round(Number(h));
 if(w<1||h<1||w>8192||h>8192||w*h>24000000)throw Error('Output dimensions exceed safe canvas limits (24 megapixels).');
 const c=document.createElement('canvas');c.width=w;c.height=h;return c;
}
export function imageOf(file){
 if(!file || !file.type.startsWith('image/'))return Promise.reject(Error('Select a supported image file.'));
 if(file.size>75000000)return Promise.reject(Error('Image exceeds the 75 MB browser import limit.'));
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();img.decoding='async';
  img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Could not decode image: '+safe(file.name)));};
  img.src=url;
 });
}
export function fitDraw(ctx,image,w,h,fit='contain',ox=0,oy=0){
 const iw=image.naturalWidth||image.videoWidth||image.width,ih=image.naturalHeight||image.videoHeight||image.height;
 if(!iw||!ih)throw Error('Source has no valid image dimensions');
 const scale=fit==='cover'?Math.max(w/iw,h/ih):fit==='stretch'?null:Math.min(w/iw,h/ih);
 const dw=scale===null?w:iw*scale,dh=scale===null?h:ih*scale;
 ctx.drawImage(image,ox+(w-dw)/2,oy+(h-dh)/2,dw,dh);
}
export function extension(mime){return ({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','audio/wav':'wav','video/webm':'webm'})[mime]||'bin';}
export function hex(rgb){return '#'+Array.from(rgb).slice(0,3).map(n=>Math.round(clamp(n,0,255)).toString(16).padStart(2,'0')).join('');}
export function rgb(text){const v=String(text).replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)||0);}
export function contrastColor(c1,c2){
 const lum=c=>{const p=rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return p[0]*.2126+p[1]*.7152+p[2]*.0722};
 const a=lum(c1),b=lum(c2);return ((Math.max(a,b)+.05)/(Math.min(a,b)+.05));
}
export async function sha256(data){
 const arr=data instanceof Blob?await data.arrayBuffer():data;
 if(!crypto?.subtle)return 'unavailable';
 const digest=await crypto.subtle.digest('SHA-256',arr);
 return Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,'0')).join('');
}
const crcTable=new Uint32Array(256);
for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xedb88320:0);crcTable[i]=c>>>0}
function crc32(arr){let c=0xffffffff;for(const b of arr)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function u16(view,o,val){view.setUint16(o,val,true)}function u32(view,o,val){view.setUint32(o,val>>>0,true)}
export async function makeZip(files){
 if(!files.length)throw Error('No files to include in this ZIP.');
 if(files.length>500)throw Error('Maximum 500 files per package.');
 const encoder=new TextEncoder(),output=[],central=[];let offset=0,centralBytes=0,total=0;
 for(const f of files){
  const name=safe(f.name||'asset.bin');const raw=f.data instanceof Blob?new Uint8Array(await f.data.arrayBuffer()):f.data instanceof Uint8Array?f.data:encoder.encode(String(f.data));
  total+=raw.byteLength;if(total>350000000)throw Error('This package exceeds the 350 MB in-browser ZIP safety limit.');
  const fname=encoder.encode(name);if(fname.length>65000)throw Error('Filename too long');
  const crc=crc32(raw);
  const local=new Uint8Array(30+fname.length),lv=new DataView(local.buffer);
  u32(lv,0,0x04034b50);u16(lv,4,20);u16(lv,6,0x0800);u16(lv,8,0);u16(lv,10,0);u16(lv,12,0);
  u32(lv,14,crc);u32(lv,18,raw.length);u32(lv,22,raw.length);u16(lv,26,fname.length);u16(lv,28,0);local.set(fname,30);
  output.push(local,raw);
  const cd=new Uint8Array(46+fname.length),cv=new DataView(cd.buffer);
  u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x0800);u16(cv,10,0);u16(cv,12,0);u16(cv,14,0);
  u32(cv,16,crc);u32(cv,20,raw.length);u32(cv,24,raw.length);u16(cv,28,fname.length);u16(cv,30,0);u16(cv,32,0);u16(cv,34,0);u16(cv,36,0);u32(cv,38,0);u32(cv,42,offset);cd.set(fname,46);
  central.push(cd);offset+=local.length+raw.length;centralBytes+=cd.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);
 u32(v,0,0x06054b50);u16(v,4,0);u16(v,6,0);u16(v,8,files.length);u16(v,10,files.length);u32(v,12,centralBytes);u32(v,16,offset);u16(v,20,0);
 return new Blob([...output,...central,end],{type:'application/zip'});
}
export function clearCanvas(c){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);}
export function fileRow(file,extra=''){
 const el=document.createElement('div');el.className='file-row';
 const n=document.createElement('span');n.className='name';n.textContent=file.name||file;
 const s=document.createElement('small');s.textContent=extra||bytes(file.size||0);el.append(n,s);return el;
}
export function readAsText(file){return file.text()}
export function wrap(f){
 return async (...args)=>{try{return await f(...args)}catch(e){console.error(e);notice(e?.message||String(e),true)}};
}
export function validateFileList(list,max=120){const files=Array.from(list||[]);if(files.length>max)throw Error('Too many files; maximum '+max);return files}
export function textFile(data,mime='application/json'){return new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:mime});}
export function nowName(){return new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}
