/* PROXIMUS | ASSET ALCHEMIST v2.0.0 — Production Lab and Asset Audit.
 * All processing remains in the browser. No user file is uploaded. */
import {$,safe,stem,bytes,notice,download,blobCanvas,createCanvas,imageOf,fitDraw,wrap,sha256,textFile} from './core.js';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const targetSizes={
 discord:[960,540],banner:[1920,480],square:[1080,1080],youtube:[1280,720],
 cover:[1600,900],wallpaper:[1920,1080],fourk:[3840,2160],portrait:[1080,1920]
};
const palettes={
 imperial:['#100a26','#391d69','#b98cff','#efc37b'],
 obsidian:['#070912','#1b2742','#6fe5f0','#f0f5ff'],
 inferno:['#170813','#542032','#fc6679','#f2bd77'],
 celestial:['#0c132b','#193d53','#63dbf4','#f4db98'],
 forest:['#071a1b','#19543f','#54e3b0','#e2f8cd']
};
function randomGenerator(seed){let s=seed>>>0;return()=>{s+=0x6d2b79f5;let z=s;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return((z^(z>>>14))>>>0)/4294967296;};}
function paintProduction(c,opts,photo){
 const [w,h]=targetSizes[opts.target]||targetSizes.discord;
 c.width=w;c.height=h;const g=c.getContext('2d',{alpha:false});
 const p=palettes[opts.theme]||palettes.imperial;const rng=randomGenerator(opts.seed>>>0);
 let bg=g.createLinearGradient(0,0,w,h);
 bg.addColorStop(0,p[0]);bg.addColorStop(.56,p[1]);bg.addColorStop(1,'#060815');
 g.fillStyle=bg;g.fillRect(0,0,w,h);
 if(photo){g.save();g.globalAlpha=.38;fitDraw(g,photo,w,h,'cover');g.restore();}
 g.save();g.globalCompositeOperation='screen';
 if(opts.style==='nebula'||opts.style==='aurora'||opts.style==='eclipse'){
  for(let i=0;i<Math.min(40,Math.round(w*h/24000));i++){
   const x=rng()*w,y=rng()*h,r=(.05+rng()*.24)*Math.max(w,h);
   const grad=g.createRadialGradient(x,y,0,x,y,r);
   grad.addColorStop(0,(i%3?p[2]:p[3])+'3c');grad.addColorStop(1,p[2]+'00');
   g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
  }
 }
 if(opts.style==='grid'){
  g.strokeStyle=p[2]+'46';g.lineWidth=Math.max(1,w/1000);
  for(let x=0;x<w;x+=Math.max(24,w/24)){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
  for(let y=0;y<h;y+=Math.max(24,h/16)){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
  for(let i=0;i<8;i++){g.strokeStyle=p[3]+'6c';g.lineWidth=(2+i%3)*w/900;g.strokeRect(w*.12+i*w*.035,h*.12+i*h*.035,w*.76-i*w*.07,h*.76-i*h*.07);}
 }
 if(opts.style==='aurora'){
  for(let j=0;j<7;j++){g.beginPath();g.lineWidth=(9+j*7)*w/1000;g.strokeStyle=(j%2?p[2]:p[3])+'38';
   for(let x=0;x<=w;x+=Math.max(4,w/220)){const y=h*(.18+j*.085)+Math.sin(x/w*9+j*.65)*h*.067;if(x===0)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();}
 }
 if(opts.style==='eclipse'){
  const x=w*.74,y=h*.45,r=Math.min(w,h)*.32;
  for(let j=0;j<4;j++){g.beginPath();g.strokeStyle=j%2?p[2]:p[3];g.globalAlpha=.3/(1+j*.22);g.lineWidth=(12+j*7)*Math.min(w,h)/900;g.arc(x,y,r+j*8,0,Math.PI*2);g.stroke();}
  g.globalAlpha=1;g.fillStyle='#050612';g.beginPath();g.arc(x,y,r*.90,0,Math.PI*2);g.fill();
 }
 for(let i=0;i<Math.min(440,Math.ceil(w*h/10000));i++){
  const x=rng()*w,y=rng()*h,size=(.3+rng()*1.8)*w/1920;
  g.fillStyle=i%9===0?p[3]:'#d8d4fd';g.globalAlpha=.2+rng()*.7;
  g.fillRect(x,y,Math.max(.5,size),Math.max(.5,size));
 }
 g.restore();
 g.fillStyle='#06061180';g.fillRect(0,h*.73,w,h*.27);
 g.strokeStyle=opts.accent;g.globalAlpha=.7;g.lineWidth=Math.max(2,Math.min(w,h)/190);
 g.beginPath();g.moveTo(w*.06,h*.16);g.lineTo(w*.06,h*.84);g.stroke();g.globalAlpha=1;
 const title=opts.title.trim()||'PROXIMUS';
 const base=Math.min(w*.085,h*.21,148);const titleSize=Math.max(20,Math.floor(base));
 const x=opts.position==='center'?w/2:w*.095;
 g.textAlign=opts.position==='center'?'center':'left';g.textBaseline='middle';
 g.font='900 '+titleSize+'px system-ui,Segoe UI,sans-serif';
 let y=h*.53; if(opts.position==='top')y=h*.31;else if(opts.position==='bottom')y=h*.68;
 g.shadowBlur=titleSize*.35;g.shadowColor=opts.accent;
 g.strokeStyle='#080818';g.lineWidth=Math.max(3,titleSize*.15);g.lineJoin='round';
 g.strokeText(title,x,y,w*.83);g.fillStyle='#f8f5ff';g.fillText(title,x,y,w*.83);g.shadowBlur=0;
 const subtitleSize=Math.max(12,Math.floor(titleSize*.29));
 g.font='600 '+subtitleSize+'px system-ui,Segoe UI,sans-serif';g.fillStyle=opts.accent;
 g.fillText(opts.subtitle.trim(),x,y+titleSize*.69,w*.82);
 if(opts.watermark){
  g.textAlign='right';g.font='700 '+Math.max(11,Math.floor(Math.min(w,h)*.022))+'px system-ui,Segoe UI,sans-serif';
  g.fillStyle='#dcd7f6be';g.fillText('POWERED BY ZEVRO | PROXIMUS',w*.965,h*.965,w*.9);
 }
}
export function initProduction(app){
 const c=$('prodCanvas');if(!c)return;let photo=null,photoName='';let scheduled=false;
 const ids=['prodPreset','prodTheme','prodStyle','prodTitle','prodSubtitle','prodAccent','prodSeed','prodPosition','prodWatermark','prodFormat'];
 const current=()=>({
  target:$('prodPreset').value,theme:$('prodTheme').value,style:$('prodStyle').value,
  title:$('prodTitle').value.slice(0,80),subtitle:$('prodSubtitle').value.slice(0,120),
  accent:$('prodAccent').value,seed:Math.floor(Number($('prodSeed').value)||777),
  position:$('prodPosition').value,watermark:$('prodWatermark').checked
 });
 function render(){const opts=current();paintProduction(c,opts,photo);
  $('prodSize').textContent=c.width+' × '+c.height+' · '+opts.theme+' / '+opts.style;
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;try{render()}catch(e){notice(e.message,true)}});}
 ids.forEach(id=>$(id)?.addEventListener('input',schedule));
 $('prodFile').addEventListener('change',wrap(async e=>{
  const f=e.target.files[0];if(!f)return;photo=await imageOf(f);photoName=safe(f.name);schedule();
  notice('Using '+photoName+' as a backdrop; nothing uploaded.');
 }));
 $('prodClearPhoto').addEventListener('click',()=>{photo=null;photoName='';$('prodFile').value='';schedule();notice('Backdrop image cleared')});
 $('prodShuffle').addEventListener('click',()=>{$('prodSeed').value=Math.floor(Math.random()*99999999);schedule();});
 $('prodRender').addEventListener('click',()=>{render();notice('Production image rendered '+c.width+' × '+c.height)});
 async function result(){
  render();const mime=$('prodFormat').value;
  const file=stem(current().title||'Proximus')+'-'+current().target+'-'+current().seed+(mime==='image/webp'?'.webp':'.png');
  return {name:file,data:await blobCanvas(c,mime,.92)};
 }
 $('prodExport').addEventListener('click',wrap(async()=>{const f=await result();download(f.data,f.name);notice('Image exported: '+f.name+' · '+bytes(f.data.size));}));
 $('prodAdd').addEventListener('click',wrap(async()=>{const f=await result();app.addAsset(f.name,f.data,'Production Lab');}));
 $('prodRecipe').addEventListener('click',()=>download(textFile({schema:'proximus.production.recipe/1',...current(),note:'Imported image pixels are not included; reselect your source backdrop.'}), 'Proximus-Production-Recipe.json'));
 $('prodImportRecipe').addEventListener('change',wrap(async e=>{
  const f=e.target.files[0];if(!f)return;if(f.size>100000)throw Error('Recipe too large');
  const o=JSON.parse(await f.text());if(o.schema!=='proximus.production.recipe/1')throw Error('Not a supported Proximus production recipe');
  const mappings={target:'prodPreset',theme:'prodTheme',style:'prodStyle',title:'prodTitle',subtitle:'prodSubtitle',accent:'prodAccent',seed:'prodSeed',position:'prodPosition'};
  for(const [k,id] of Object.entries(mappings))if(o[k]!=null&&$(id))$(id).value=String(o[k]).slice(0,140);
  $('prodWatermark').checked=!!o.watermark;schedule();notice('Production recipe loaded. Reimport any external background image.');
 }));schedule();
}
const textDecoder=new TextDecoder('utf-8',{fatal:false});
function magicType(raw){
 const b=new Uint8Array(raw);
 const ascii=(start,count)=>textDecoder.decode(b.slice(start,start+count));
 if(b.length>=8&&b[0]===137&&ascii(1,3)==='PNG')return 'png';
 if(b[0]===255&&b[1]===216)return 'jpg';
 if(ascii(0,3)==='GIF')return 'gif';
 if(ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP')return 'webp';
 if(ascii(0,4)==='RIFF'&&ascii(8,4)==='WAVE')return 'wav';
 if(ascii(0,4)==='glTF')return 'glb';
 if(ascii(0,4)==='%PDF')return 'pdf';
 if(ascii(0,2)==='PK')return 'zip';
 if(ascii(4,4)==='ftyp')return 'mp4';
 if(b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3)return 'webm';
 if(ascii(0,3)==='ID3'||b[0]===255&&(b[1]&0xe0)===0xe0)return 'mp3';
 const first=ascii(0,500).trimStart();
 if(first.startsWith('<svg')||first.startsWith('<?xml')&&first.includes('<svg'))return 'svg';
 if(first.startsWith('{')||first.startsWith('[')){try{JSON.parse(ascii(0,Math.min(b.length,32000)));return 'json';}catch(_){}}
 return 'unknown';
}
function fileMetadata(buffer,kind){
 const view=new DataView(buffer);
 if(kind==='png'&&view.byteLength>=24)return {width:view.getUint32(16),height:view.getUint32(20)};
 if(kind==='gif'&&view.byteLength>=10)return {width:view.getUint16(6,true),height:view.getUint16(8,true)};
 if(kind==='webp'&&view.byteLength>=30){
  const tag=textDecoder.decode(new Uint8Array(buffer,12,4));
  if(tag==='VP8X'){const b=new Uint8Array(buffer);return{width:1+(b[24]|(b[25]<<8)|(b[26]<<16)),height:1+(b[27]|(b[28]<<8)|(b[29]<<16))};}
 }
 if(kind==='wav'&&view.byteLength>=28)return {sampleRate:view.getUint32(24,true),channels:view.getUint16(22,true)};
 if(kind==='glb'&&view.byteLength>=12)return {glbVersion:view.getUint32(4,true),declaredBytes:view.getUint32(8,true)};
 return {};
}
export function initAudit(app){
 const input=$('auditFiles');if(!input)return;
 let last=null;let lastBlob=null;
 $('auditRun').addEventListener('click',wrap(async()=>{
  const files=Array.from(input.files||[]);
  if(!files.length)throw Error('Select files to inspect first.');
  if(files.length>80)throw Error('Inspect up to 80 files per batch.');
  const total=files.reduce((n,f)=>n+f.size,0);
  if(total>350000000)throw Error('Audit input limit is 350 MB per batch.');
  $('auditResults').replaceChildren();$('auditStats').textContent='Inspecting '+files.length+' files…';
  const rows=[];const seen=new Map();
  for(const f of files){
   const head=await f.slice(0,65536).arrayBuffer();
   const type=magicType(head),ext=(f.name.split('.').pop()||'').toLowerCase();
   const normalized=ext==='jpeg'?'jpg':ext;
   const mismatch=type!=='unknown'&&normalized!==type&&(type==='zip'&&!['zip','jar','docx','xlsx','pptx','apk'].includes(ext)?true:type!=='zip');
   const hash=await sha256(f);const duplicate=seen.has(hash)?seen.get(hash):'';
   if(!duplicate)seen.set(hash,f.name);
   const meta=fileMetadata(head,type);
   rows.push({name:safe(f.name),bytes:f.size,declaredExtension:ext,detectedType:type,extensionMismatch:mismatch,duplicateOf:duplicate,sha256:hash,...meta});
  }
  last={schema:'proximus.asset.audit/1',created:new Date().toISOString(),totalFiles:rows.length,totalBytes:total,files:rows};
  lastBlob=textFile(last);let mismatches=0,duplicates=0;
  for(const row of rows){
   if(row.extensionMismatch)mismatches++;if(row.duplicateOf)duplicates++;
   const item=document.createElement('div');item.className='file-row';
   const n=document.createElement('span');n.className='name';n.textContent=row.name;
   const info=document.createElement('small');info.textContent=row.detectedType.toUpperCase()+' · '+bytes(row.bytes)+(row.extensionMismatch?' · extension mismatch':'')+(row.duplicateOf?' · duplicate of '+row.duplicateOf:'');
   const digest=document.createElement('code');digest.textContent=row.sha256.slice(0,12)+'…';digest.title=row.sha256;
   item.append(n,info,digest);$('auditResults').append(item);
  }
  $('auditStats').textContent=rows.length+' files · '+bytes(total)+' · '+duplicates+' duplicates · '+mismatches+' extension mismatches';
  notice('Audit complete. Full SHA-256 hashes ready to export.');
 }));
 $('auditJSON').addEventListener('click',wrap(async()=>{if(!lastBlob)throw Error('Run an audit first');download(lastBlob,'Proximus-Asset-Audit.json');}));
 $('auditCSV').addEventListener('click',wrap(async()=>{
  if(!last)throw Error('Run an audit first');
  const escapeCell=x=>{let s=String(x??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const cols=['name','bytes','declaredExtension','detectedType','extensionMismatch','duplicateOf','sha256','width','height','sampleRate','channels'];
  const lines=[cols.join(','),...last.files.map(row=>cols.map(k=>escapeCell(row[k])).join(','))];
  download(new Blob([lines.join('\r\n')],{type:'text/csv'}),'Proximus-Asset-Audit.csv');
 }));
 $('auditAdd').addEventListener('click',wrap(async()=>{if(!lastBlob)throw Error('Run an audit first');app.addAsset('Proximus-Asset-Audit.json',lastBlob,'Asset Audit');}));
}
