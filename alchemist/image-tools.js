import {makeAnimatedIconPack} from './animation-tools.js';
import {$,safe,stem,bytes,number,clamp,notice,download,blobCanvas,createCanvas,imageOf,fitDraw,makeZip,extension,hex,rgb,contrastColor,fileRow,textFile,wrap,validateFileList} from './core.js';
const fileLabel = f=>f?.name||'asset';
const getFile=id=>$(id)?.files?.[0];
export function initImage(app){
 let source=null,last=null,sourceName='PROXIMUS-original-art';
 const ids=['imgW','imgH','imgFit','imgRotate','imgFlipX','imgFlipY','imgBg','imgBright','imgContrast','imgSat','imgHue','imgBlur','imgGray','imgSepia','imgChroma','imgKey','imgTolerance','imgText','imgTextSize','imgTextColor','imgTextPos','imgFormat','imgQuality'];
 const canvas=$('imgCanvas');
 const defaults={imgBright:100,imgContrast:100,imgSat:100,imgHue:0,imgBlur:0,imgGray:0,imgSepia:0,imgChroma:false,imgText:'',imgRotate:'0',imgFlipX:false,imgFlipY:false};
 let pending=false;
 function schedule(){if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;try{render()}catch(e){notice(e.message,true)}})}}
 function render(){
  const w=number('imgW',960,1,8192),h=number('imgH',540,1,8192);
  if(w*h>24000000)throw Error('Image output is above 24 MP; reduce dimensions.');
  canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.clearRect(0,0,w,h);ctx.fillStyle=$('imgBg').value;ctx.fillRect(0,0,w,h);
  if(source){
   const rot=number('imgRotate',0,0,270),rad=rot*Math.PI/180;const sideways=rot===90||rot===270;
   ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rad);ctx.scale($('imgFlipX').checked?-1:1,$('imgFlipY').checked?-1:1);
   ctx.filter='brightness('+number('imgBright',100,0,250)+'%) contrast('+number('imgContrast',100,0,250)+'%) saturate('+number('imgSat',100,0,300)+'%) hue-rotate('+number('imgHue',0,0,360)+'deg) blur('+number('imgBlur',0,0,20)+'px) grayscale('+number('imgGray',0,0,100)+'%) sepia('+number('imgSepia',0,0,100)+'%)';
   const rw=sideways?h:w,rh=sideways?w:h;
   fitDraw(ctx,source,rw,rh,$('imgFit').value,-rw/2,-rh/2);ctx.restore();ctx.filter='none';
   if($('imgChroma').checked){
    const key=rgb($('imgKey').value),tol=number('imgTolerance',50,0,150);
    const img=ctx.getImageData(0,0,w,h),d=img.data;
    for(let i=0;i<d.length;i+=4){
     const diff=Math.hypot(d[i]-key[0],d[i+1]-key[1],d[i+2]-key[2])/Math.sqrt(3);
     const factor=clamp((diff-(tol-11))/24);
     d[i+3]=Math.round(d[i+3]*factor);
    }ctx.putImageData(img,0,0);
   }
  }
  const text=$('imgText').value.trim();if(text){
   const size=number('imgTextSize',64,8,500),pos=$('imgTextPos').value;
   ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+size+'px system-ui,Segoe UI,sans-serif';
   const y=pos==='top'?size*.9:pos==='center'?h/2:h-size*.85;
   ctx.strokeStyle='#0b091b';ctx.lineWidth=Math.max(3,size*.12);ctx.lineJoin='round';
   ctx.strokeText(text,w/2,y,w*.94);ctx.fillStyle=$('imgTextColor').value;ctx.fillText(text,w/2,y,w*.94);ctx.restore();
  }
  $('imgStatus').textContent=w+' × '+h+' px';
  for(const [id,unit] of [['imgBright','%'],['imgContrast','%'],['imgSat','%'],['imgHue','°'],['imgBlur',' px'],['imgGray','%'],['imgSepia','%'],['imgQuality','%']])$(id+'Out').textContent=$(id).value+unit;
  last=canvas;
 }
 $('imgFile').addEventListener('change',wrap(async e=>{source=await imageOf(e.target.files[0]);sourceName=stem(e.target.files[0].name);$('imgW').value=source.naturalWidth;$('imgH').value=source.naturalHeight;schedule();notice('Image loaded: '+safe(e.target.files[0].name));}));
 $('imgGenerate').addEventListener('click',wrap(async()=>{
  const style=$('imgArtStyle').value;let seed=number('imgArtSeed',777,0,99999999)|0;
  const rand=()=>{seed+=0x6D2B79F5;let z=seed;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return ((z^(z>>>14))>>>0)/4294967296};
  const palettes={
   nebula:['#09091c','#2b155e','#914cdb','#dba3f7'],
   eclipse:['#070914','#25203c','#e39f50','#fff0b1'],
   aurora:['#050e24','#153c55','#2dd7b4','#b1faff'],
   embers:['#12070e','#61182b','#e45b35','#ffc16c'],
   frost:['#071322','#23516f','#67b6ff','#f0fcff']
  };
  const p=palettes[style]||palettes.nebula;
  const art=createCanvas(960,540),g=art.getContext('2d');
  const base=g.createLinearGradient(0,0,960,540);base.addColorStop(0,p[0]);base.addColorStop(.5,p[1]);base.addColorStop(1,'#050711');g.fillStyle=base;g.fillRect(0,0,960,540);
  g.globalCompositeOperation='screen';
  for(let i=0;i<115;i++){
   const x=rand()*1100-70,y=rand()*640-50,r=35+rand()*260;
   const fog=g.createRadialGradient(x,y,0,x,y,r);
   const col=i%7===0?p[3]:i%2?p[1]:p[2];
   fog.addColorStop(0,col+'60');fog.addColorStop(.4,col+'25');fog.addColorStop(1,col+'00');
   g.fillStyle=fog;g.fillRect(x-r,y-r,r*2,r*2);
  }
  if(style==='eclipse'||style==='nebula'){
   const x=style==='eclipse'?480:690,y=style==='eclipse'?235:270,r=style==='eclipse'?180:140;
   for(let j=0;j<4;j++){g.beginPath();g.ellipse(x,y,r+j*12,r+j*12,0,0,2*Math.PI);g.strokeStyle=j%2?p[3]:p[2];g.globalAlpha=.5/(1+j*.6);g.lineWidth=14/(1+j*.4);g.shadowColor=p[3];g.shadowBlur=34;g.stroke();}
   g.globalAlpha=1;g.shadowBlur=0;
   if(style==='eclipse'){g.fillStyle='#05040c';g.beginPath();g.arc(x,y,r-15,0,Math.PI*2);g.fill()}
  }
  if(style==='aurora'||style==='frost'){
   for(let k=0;k<7;k++){g.beginPath();for(let x=0;x<=960;x+=8){const y=110+k*29+Math.sin(x*.010+k*.7)*49+Math.cos(x*.018+k)*18;if(x===0)g.moveTo(x,y);else g.lineTo(x,y)}g.strokeStyle=k%2?p[2]:p[3];g.lineWidth=13+rand()*15;g.globalAlpha=.13+rand()*.18;g.shadowColor=p[2];g.shadowBlur=40;g.stroke();}
   g.globalAlpha=1;g.shadowBlur=0;
  }
  if(style==='embers'){
   for(let k=0;k<80;k++){const x=rand()*960,y=rand()*540;g.beginPath();g.strokeStyle=k%3?p[2]:p[3];g.lineWidth=.6+rand()*2.5;g.globalAlpha=.35+rand()*.45;g.moveTo(x,y);g.lineTo(x+(rand()-.5)*12,y-(5+rand()*60));g.stroke();}
   g.globalAlpha=1;
  }
  for(let i=0;i<560;i++){
   const x=rand()*960,y=rand()*540,r=.3+rand()*1.3;
   g.globalAlpha=.23+rand()*.72;g.fillStyle=i%9===0?p[3]:'#f6eaff';
   g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
  }
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  const vignette=g.createRadialGradient(480,270,90,480,270,600);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#000000a9');g.fillStyle=vignette;g.fillRect(0,0,960,540);
  source=art;sourceName='PROXIMUS-'+style+'-'+$('imgArtSeed').value; 
  $('imgW').value='1920';$('imgH').value='1080';schedule();
  notice('Generated original '+style+' background. Adjust filters or export to PNG/WebP.');
 }));
 ids.forEach(id=>$(id)?.addEventListener('input',schedule));
 $('imgPreset').addEventListener('change',()=>{const v=$('imgPreset').value;if(v){const [w,h]=v.split('x');$('imgW').value=w;$('imgH').value=h;schedule()}});
 $('imgReset').addEventListener('click',()=>{for(const [id,v] of Object.entries(defaults)){if(typeof v==='boolean')$(id).checked=v;else $(id).value=v;}schedule();});
 async function output(){if(!source)throw Error('Load an image before exporting.');render();const mime=$('imgFormat').value;return{blob:await blobCanvas(canvas,mime,number('imgQuality',92,20,100)/100),name:stem(sourceName)+'-alchemist.'+extension(mime)}}
 $('imgExport').addEventListener('click',wrap(async()=>{const f=await output();download(f.blob,f.name);notice('Image exported '+f.name)}));
 $('imgAdd').addEventListener('click',wrap(async()=>{const f=await output();app.addAsset(f.name,f.blob,'Image Studio')}));
 render();
 return {receive:files=>{$('imgFile').files=files}};
}
export function initBatch(app){
 let files=[];
 $('batchFiles').addEventListener('change',e=>{
  files=validateFileList(e.target.files,120);const list=$('batchList');list.classList.remove('empty');list.replaceChildren();
  files.forEach(f=>list.append(fileRow(f)));notice(files.length+' images queued');
 });
 $('batchExport').addEventListener('click',wrap(async()=>{
  if(!files.length)throw Error('Add at least one image.');
  const side=number('batchSide',1920,32,8192),mime=$('batchFormat').value,q=number('batchQuality',86,20,100)/100;
  const results=[];let failures=0,idx=0;
  for(const f of files){
   try{
    const im=await imageOf(f),scale=Math.min(1,side/Math.max(im.naturalWidth,im.naturalHeight));
    const w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
    const c=createCanvas(w,h),ctx=c.getContext('2d');if(mime==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h)}
    if($('batchGray').checked)ctx.filter='grayscale(100%)';
    ctx.drawImage(im,0,0,w,h);const blob=await blobCanvas(c,mime,q);
    results.push({name:stem(f.name)+'-'+(++idx)+'.'+extension(mime),data:blob}); // distinct filenames for collisions
   }catch(e){failures++;console.warn('Batch skipped '+f.name,e)}
  }
  if(!results.length)throw Error('All images failed conversion. Check source formats and dimensions.');
  results.push({name:'README.txt',data:'PROXIMUS Asset Alchemist batch export\nProcessed: '+results.length+'\nFailures: '+failures+'\nAll files re-encoded locally; original EXIF metadata is not retained.'});
  download(await makeZip(results),'PROXIMUS-BATCH-FORGE.zip');
  notice('Batch complete: '+(results.length-1)+' images. '+failures+' skipped.');
 }));
}
export function initIcons(app){
 let img=null,iconMaster=null;
 const c=$('iconCanvas');function render(){const ctx=c.getContext('2d');ctx.clearRect(0,0,256,256);if(img)fitDraw(ctx,img,256,256,'cover')}
 $('iconFile').addEventListener('change',wrap(async e=>{iconMaster=e.target.files[0];img=await imageOf(iconMaster);render();notice('Icon master loaded')}));
 $('iconExport').addEventListener('click',wrap(async()=>{
  if(!img)throw Error('Load a master image.');
  const sizes=[...document.querySelectorAll('.iconSize:checked')].map(x=>Number(x.value));if(!sizes.length)throw Error('Select at least one icon size.');
  const entries=[];for(const sz of sizes){const canvas=createCanvas(sz,sz),ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.save();ctx.beginPath();ctx.rect(0,0,sz,sz);ctx.clip();fitDraw(ctx,img,sz,sz,'cover');ctx.restore();
   entries.push({name:'icon-'+sz+'x'+sz+'.png',data:await blobCanvas(canvas)});}
  entries.push({name:'manifest.json',data:textFile({generator:'PROXIMUS Asset Alchemist',sizes,format:'PNG',note:'No Windows ICO binary included'})});
  download(await makeZip(entries),'PROXIMUS-ICON-FOUNDRY.zip');notice(sizes.length+' PNG icon sizes exported');
 }));
 $('iconGifExport').addEventListener('click',wrap(async()=>{
  if(!iconMaster)throw Error('Import an animated GIF into Icon Foundry first.');
  if(!/^image\/gif$/.test(iconMaster.type)&&!/\.gif$/i.test(iconMaster.name))throw Error('Animated GIF icon export requires an imported .gif. Use Animation Forge for video sources.');
  const sizes=[...document.querySelectorAll('.iconSize:checked')].map(x=>Number(x.value)).filter(x=>[32,64,128,256].includes(x));
  if(!sizes.length)throw Error('Select one or more animated GIF icon sizes: 32, 64, 128 or 256 px.');
  $('iconGifExport').disabled=true;
  try{
   $('iconGifStatus').textContent='Decoding and resizing animation…';
   const zip=await makeAnimatedIconPack(iconMaster,{sizes,seconds:Number($('iconGifSeconds').value),fps:Number($('iconGifFps').value),progress:msg=>{$('iconGifStatus').textContent=msg;}});
   download(zip,stem(iconMaster.name)+'-ANIMATED-GIF-ICONS.zip');
   $('iconGifStatus').textContent='Real animated GIF icon ZIP exported · '+bytes(zip.size);
   notice('Animated GIF icon pack downloaded');
  }finally{$('iconGifExport').disabled=false;}
 }));render();
}
export function initSprites(app){
 let files=[],imgs=[];
 const canvas=$('spriteCanvas');let atlas=null,manifest=null;
 async function render(){
  if(!imgs.length){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);return}
  const cols=number('spriteCols',4,1,24),sz=number('spriteSize',128,16,1024),pad=number('spritePad',4,0,128),rows=Math.ceil(imgs.length/cols);
  const w=cols*sz+(cols+1)*pad,h=rows*sz+(rows+1)*pad;atlas=createCanvas(w,h);
  const ctx=atlas.getContext('2d');if($('spriteBg').value!=='transparent'){ctx.fillStyle=$('spriteBg').value;ctx.fillRect(0,0,w,h)}
  manifest={generator:'PROXIMUS Asset Alchemist',width:w,height:h,sprites:[]};
  for(let i=0;i<imgs.length;i++){
   const col=i%cols,row=Math.floor(i/cols),x=pad+col*(sz+pad),y=pad+row*(sz+pad);
   ctx.save();ctx.beginPath();ctx.rect(x,y,sz,sz);ctx.clip();fitDraw(ctx,imgs[i],sz,sz,$('spriteFit').value,x,y);ctx.restore();
   manifest.sprites.push({name:safe(files[i].name),x,y,width:sz,height:sz});
  }
  canvas.width=Math.min(w,900);canvas.height=Math.round(h*canvas.width/w);
  canvas.getContext('2d').drawImage(atlas,0,0,canvas.width,canvas.height);
  $('spriteStatus').textContent=imgs.length+' sprites · '+w+'×'+h+' atlas';
 }
 $('spriteFiles').addEventListener('change',wrap(async e=>{
  files=validateFileList(e.target.files,120);imgs=[];
  for(const f of files){try{imgs.push(await imageOf(f))}catch(err){console.warn(err)}}
  if(imgs.length!==files.length)throw Error('Some images could not be decoded. Select supported PNG/JPEG/WebP images.');
  await render();notice('Sprite layout ready');
 }));
 for(const id of ['spriteCols','spriteSize','spritePad','spriteBg','spriteFit'])$(id).addEventListener('input',wrap(render));
 $('spriteExport').addEventListener('click',wrap(async()=>{if(!imgs.length)throw Error('Import sprites first.');await render();
  const entries=[{name:'sprite-atlas.png',data:await blobCanvas(atlas)},{name:'atlas-manifest.json',data:textFile(manifest)}];
  download(await makeZip(entries),'PROXIMUS-SPRITE-ATLAS.zip');notice('Atlas and manifest exported');
 }));
}
export function initTextures(app){
 let source=null,maps=null;
 $('textureFile').addEventListener('change',wrap(async e=>{source=await imageOf(e.target.files[0]);notice('Texture image loaded')}));
 async function build(){
  if(!source)throw Error('Load a source texture first');
  const side=number('textureSide',1024,512,2048),s=side,canvas=createCanvas(s,s),ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,0,0,s,s);
  const data=ctx.getImageData(0,0,s,s).data,height=new Float32Array(s*s),mode=$('textureMode').value,invert=$('textureInvert').checked;
  for(let i=0;i<height.length;i++){
   const idx=i*4;let v=mode==='alpha'?data[idx+3]/255:mode==='red'?data[idx]/255:(data[idx]*.2126+data[idx+1]*.7152+data[idx+2]*.0722)/255;
   height[i]=invert?1-v:v;
  }
  const output={};let normal=createCanvas(s,s),nc=normal.getContext('2d'),ni=nc.createImageData(s,s);
  const heightC=createCanvas(s,s),hc=heightC.getContext('2d'),hi=hc.createImageData(s,s);
  const maskC=createCanvas(s,s),mc=maskC.getContext('2d'),mi=mc.createImageData(s,s);
  const strength=number('textureStrength',7,1,20),at=(x,y)=>height[clamp(y,0,s-1)*s+clamp(x,0,s-1)];
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
   const p=y*s+x,idx=p*4,h=height[p];
   const dx=(at(x+1,y)-at(x-1,y))*strength,dy=(at(x,y+1)-at(x,y-1))*strength;
   const len=Math.hypot(-dx,-dy,1),nx=-dx/len,ny=-dy/len,nz=1/len;
   ni.data[idx]=Math.round((nx*.5+.5)*255);ni.data[idx+1]=Math.round((ny*.5+.5)*255);ni.data[idx+2]=Math.round((nz*.5+.5)*255);ni.data[idx+3]=255;
   const grey=Math.round(h*255),m=h>.5?255:0;
   for(let a=0;a<3;a++){hi.data[idx+a]=grey;mi.data[idx+a]=m}hi.data[idx+3]=mi.data[idx+3]=255;
  }
  nc.putImageData(ni,0,0);hc.putImageData(hi,0,0);mc.putImageData(mi,0,0);
  maps={normal,height:heightC,mask:maskC};
  const preview=$('textureCanvas');preview.width=Math.min(s,640);preview.height=preview.width;preview.getContext('2d').drawImage(normal,0,0,preview.width,preview.height);
  $('textureStatus').textContent='Ready · '+s+'×'+s+' normal, height and mask maps';return maps;
 }
 $('textureBuild').addEventListener('click',wrap(build));
 async function entries(){if(!maps)await build();return await Promise.all(Object.entries(maps).map(async([key,c])=>({name:'texture-'+key+'.png',data:await blobCanvas(c)})))}
 $('textureExport').addEventListener('click',wrap(async()=>{download(await makeZip(await entries()),'PROXIMUS-TEXTURE-LAB.zip');notice('3 maps exported')}));
 $('textureAdd').addEventListener('click',wrap(async()=>{for(const f of await entries())app.addAsset(f.name,f.data,'Texture Lab');}));
}
export function initPalette(app){
 let selected=[];
 const gradient=()=>{const a=number('gradAngle',135,0,360);$('gradientPreview').style.background='linear-gradient('+a+'deg,'+$('gradStart').value+','+$('gradEnd').value+')'};
 const contrast=()=>{const v=contrastColor($('contrastFg').value,$('contrastBg').value);const el=$('contrastResult');el.style.background=$('contrastBg').value;el.style.color=$('contrastFg').value;el.textContent='Contrast '+v.toFixed(2)+':1 · '+(v>=7?'AAA text':v>=4.5?'AA normal text':v>=3?'AA large text only':'Below WCAG AA text targets')};
 for(const id of ['gradStart','gradEnd','gradAngle'])$(id).addEventListener('input',gradient);
 for(const id of ['contrastFg','contrastBg'])$(id).addEventListener('input',contrast);
 gradient();contrast();
 $('colorExtract').addEventListener('click',wrap(async()=>{
  const file=getFile('colorFile');if(!file)throw Error('Import an image.');
  const img=await imageOf(file),c=createCanvas(120,120),ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0,120,120);const d=ctx.getImageData(0,0,120,120).data;
  const points=[];for(let i=0;i<d.length;i+=12){if(d[i+3]<180)continue;points.push([d[i],d[i+1],d[i+2]])}
  if(points.length<10)throw Error('Image contains too few visible pixels.');
  const k=number('colorCount',7,3,12),iterations=number('colorIterations',10,5,16),means=[];
  means.push(points[Math.floor(points.length*.13)]);
  for(let j=1;j<k;j++){const ranked=points.map(p=>({p,dist:Math.min(...means.map(m=>(p[0]-m[0])**2+(p[1]-m[1])**2+(p[2]-m[2])**2))}));ranked.sort((a,b)=>b.dist-a.dist);means.push(ranked[Math.floor(ranked.length*(j/k)*.15)].p)}
  const counts=Array(k).fill(0);
  for(let iter=0;iter<iterations;iter++){
   const sums=Array.from({length:k},()=>[0,0,0]);counts.fill(0);
   for(const p of points){let idx=0,dist=Infinity;means.forEach((m,j)=>{const d=(m[0]-p[0])**2+(m[1]-p[1])**2+(m[2]-p[2])**2;if(d<dist){dist=d;idx=j}});
    counts[idx]++;for(let c=0;c<3;c++)sums[idx][c]+=p[c];
   }
   for(let j=0;j<k;j++)if(counts[j])means[j]=sums[j].map(s=>Math.round(s/counts[j]));
  }
  selected=means.map((m,i)=>({hex:hex(m),count:counts[i]})).sort((a,b)=>b.count-a.count);
  const container=$('swatches');container.replaceChildren();
  for(const s of selected){const el=document.createElement('button');el.className='swatch';const color=document.createElement('i');color.style.background=s.hex;const label=document.createElement('span');label.textContent=s.hex;el.append(color,label);el.addEventListener('click',wrap(async()=>{await navigator.clipboard.writeText(s.hex);notice('Copied '+s.hex)}));container.append(el);}
  $('gradStart').value=selected[0].hex;$('gradEnd').value=selected.at(-1).hex;gradient();notice('Extracted '+selected.length+' dominant colors');
 }));
 $('gradCss').addEventListener('click',()=>{
  const css='background: linear-gradient('+number('gradAngle',135,0,360)+'deg, '+$('gradStart').value+', '+$('gradEnd').value+');\n';
  download(new Blob([css],{type:'text/css'}),'PROXIMUS-gradient.css');notice('CSS downloaded');
 });
 $('gradSvg').addEventListener('click',()=>{
  const a=number('gradAngle',135,0,360)*Math.PI/180,dx=Math.sin(a)*50,dy=Math.cos(a)*50;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><linearGradient id="g" x1="'+(50-dx)+'%" y1="'+(50+dy)+'%" x2="'+(50+dx)+'%" y2="'+(50-dy)+'%"><stop stop-color="'+$('gradStart').value+'"/><stop offset="1" stop-color="'+$('gradEnd').value+'"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/></svg>';
  download(new Blob([svg],{type:'image/svg+xml'}),'PROXIMUS-gradient.svg');notice('SVG downloaded');
 });
 $('gradPng').addEventListener('click',wrap(async()=>{
  const c=createCanvas(1920,1080),ctx=c.getContext('2d'),a=number('gradAngle',135,0,360)*Math.PI/180;
  const radius=Math.hypot(960,540),dx=Math.sin(a)*radius,dy=Math.cos(a)*radius;
  const g=ctx.createLinearGradient(960-dx,540+dy,960+dx,540-dy);g.addColorStop(0,$('gradStart').value);g.addColorStop(1,$('gradEnd').value);ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
  download(await blobCanvas(c),'PROXIMUS-gradient-1920x1080.png');notice('Gradient PNG downloaded');
 }));
}
