// PROXIMUS | ASSET ALCHEMIST — Document Forge
// Actual self-contained image-to-PDF writer with JPEG XObjects and PDF page tree.
// Supports scanned photos, reorder, pages, printed captions and simple watermarks.
import {$,safe,stem,bytes,download,blobCanvas,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
const enc=new TextEncoder(),PAGE={a4:[595,842],letter:[612,792],square:[612,612]};
const ascii=s=>enc.encode(s);
const escapePDF=s=>String(s||'').replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&').slice(0,150);
export function createImagePdf(images,{paper='a4',watermark='',title='PROXIMUS Document'}={}){
 if(!Array.isArray(images)||!images.length||images.length>30)throw Error('Choose between 1 and 30 images.');
 const [pageW,pageH]=PAGE[paper]||PAGE.a4;
 const parts=[],offsets=[0],pageObjects=[];let offset=0;
 function push(input){const bytes=typeof input==='string'?ascii(input):input;parts.push(bytes);offset+=bytes.length;}
 function object(id,header,stream){
  offsets[id]=offset;push(id+' 0 obj\n'+header);
  if(stream){push('\nstream\n');push(stream);push('\nendstream');}
  push('\nendobj\n');
 }
 push('%PDF-1.4\n%PROXIMUS\n');
 object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 const kids=images.map((_,i)=>(4+i*3)+' 0 R').join(' ');
 object(2,'<< /Type /Pages /Kids [ '+kids+' ] /Count '+images.length+' >>');
 object(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 for(let i=0;i<images.length;i++){
  const image=images[i],page=4+i*3,content=page+1,picture=page+2;
  if(!(image.jpeg instanceof Uint8Array)||image.jpeg.length<32||image.width<1||image.height<1)throw Error('Invalid JPEG page source.');
  const margin=28,scale=Math.min((pageW-margin*2)/image.width,(pageH-margin*2)/image.height);
  const w=image.width*scale,h=image.height*scale,x=(pageW-w)/2,y=(pageH-h)/2;
  const label=watermark?('BT /F1 12 Tf 0.9 0.9 0.9 rg 30 16 Td ('+escapePDF(watermark)+') Tj ET\n'):'';
  const commands=ascii('q '+w.toFixed(3)+' 0 0 '+h.toFixed(3)+' '+x.toFixed(3)+' '+y.toFixed(3)+' cm /Im1 Do Q\n'+label);
  const resources='<< /XObject << /Im1 '+picture+' 0 R >> /Font << /F1 3 0 R >> >>';
  object(page,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pageW+' '+pageH+'] /Resources '+resources+' /Contents '+content+' 0 R >>');
  object(content,'<< /Length '+commands.length+' >>',commands);
  object(picture,'<< /Type /XObject /Subtype /Image /Width '+image.width+' /Height '+image.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+image.jpeg.length+' >>',image.jpeg);
  pageObjects.push(page);
 }
 const xref=offset;const count=4+images.length*3;
 push('xref\n0 '+count+'\n0000000000 65535 f \n');
 for(let id=1;id<count;id++)push(String(offsets[id]).padStart(10,'0')+' 00000 n \n');
 push('trailer\n<< /Size '+count+' /Root 1 0 R /Info << /Title ('+escapePDF(title)+') >> >>\nstartxref\n'+xref+'\n%%EOF\n');
 return new Blob(parts,{type:'application/pdf'});
}
export function initDocumentForge(app){
 const input=$('documentFiles'),list=$('documentList'),status=$('documentStatus');
 let images=[];
 function render(){
  list.replaceChildren();
  for(let i=0;i<images.length;i++){
   const f=images[i],row=document.createElement('div');row.className='sovereign-project-row';
   const name=document.createElement('span');name.textContent=(i+1)+'. '+safe(f.name);
   for(const [symbol,action] of [['↑',-1],['↓',1]]){
    const b=document.createElement('button');b.className='small-btn';b.textContent=symbol;
    b.disabled=i+action<0||i+action>=images.length;
    b.addEventListener('click',()=>{[images[i],images[i+action]]=[images[i+action],images[i]];render();});
    row.append(b);
   }
   const remove=document.createElement('button');remove.className='small-btn';remove.textContent='×';
   remove.addEventListener('click',()=>{images.splice(i,1);render();});
   row.prepend(name);row.append(remove);list.append(row);
  }
  if(!images.length)list.textContent='Import image pages and arrange them in your preferred order.';
  $('documentCount').textContent=images.length+' pages';
 }
 input.addEventListener('change',e=>{
  const files=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/'));
  images.push(...files.slice(0,30-images.length));input.value='';render();
 });
 async function make(){
  if(!images.length)throw Error('Import a photo or image first.');
  const out=[];for(let i=0;i<images.length;i++){
   const file=images[i];if(file.size>35000000)throw Error('Each page must be under 35 MB.');
   const url=URL.createObjectURL(file),img=new Image();
   try{
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Cannot decode '+safe(file.name)));img.src=url;});
    const scale=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const jpeg=await blobCanvas(canvas,'image/jpeg',Number($('documentQuality').value)/100);
    out.push({width:canvas.width,height:canvas.height,jpeg:new Uint8Array(await jpeg.arrayBuffer())});
    status.textContent='Processing page '+(i+1)+' of '+images.length;
   }finally{URL.revokeObjectURL(url);}
  }
  return createImagePdf(out,{paper:$('documentPaper').value,watermark:$('documentMark').value,title:$('documentTitle').value});
 }
 let busy=false;
 async function exportPdf(kind){
  if(busy)throw Error('PDF conversion is already in progress.');
  busy=true;$('documentExport').disabled=true;$('documentToPack').disabled=true;
  try{
   const pdf=await make(),name=stem($('documentTitle').value||'My Document')+'.pdf';
   if(kind==='pack')app.addAsset(name,pdf,'Document Forge');
   else if(kind==='share')await saveOrShare(pdf,name);else download(pdf,name);
   status.textContent='Created '+images.length+'-page PDF · '+bytes(pdf.size);
  }finally{busy=false;$('documentExport').disabled=false;$('documentToPack').disabled=false;}
 }
 $('documentExport').addEventListener('click',wrap(()=>exportPdf('save')));
 $('documentShare').addEventListener('click',wrap(()=>exportPdf('share')));
 $('documentToPack').addEventListener('click',wrap(()=>exportPdf('pack')));
 render();
}
