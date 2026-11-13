// PROXIMUS | ASSET ALCHEMIST — Utility Forge
// Device-independent text conversions, cryptographic passwords and batch file ZIP renaming.
import {$,safe,stem,notice,download,textFile,makeZip,bytes,wrap} from './core.js';
const textBytes=x=>new TextEncoder().encode(x);
const b64encode=s=>{const b=textBytes(s);let x='';for(let i=0;i<b.length;i+=8192)x+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(x);};
const b64decode=s=>new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s.trim()),c=>c.charCodeAt(0)));
export function transformText(input,action){
 const str=String(input??'');
 switch(action){
  case 'trim':return str.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).join('\n');
  case 'unique':{const found=new Set();return str.split(/\r?\n/).filter(x=>{const k=x.trim();if(!k||found.has(k))return false;found.add(k);return true;}).join('\n');}
  case 'sort':return str.split(/\r?\n/).filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).join('\n');
  case 'reverse':return str.split(/\r?\n/).reverse().join('\n');
  case 'upper':return str.toLocaleUpperCase();
  case 'lower':return str.toLocaleLowerCase();
  case 'json-pretty':return JSON.stringify(JSON.parse(str),null,2);
  case 'json-min':return JSON.stringify(JSON.parse(str));
  case 'url-enc':return encodeURIComponent(str);
  case 'url-dec':return decodeURIComponent(str.replace(/\+/g,'%20'));
  case 'b64-enc':return b64encode(str);
  case 'b64-dec':return b64decode(str);
  default:throw Error('Choose a text transformation');
 }
}
export function textStats(text){
 const s=String(text??'');
 return {characters:[...s].length,words:s.trim()?s.trim().split(/\s+/).length:0,
  lines:s?s.split(/\r\n|\r|\n/).length:0,bytes:textBytes(s).length};
}
// Cryptographically secure, rejection-sampled random values; no Math.random.
export function randomPassword(length=24,options={lower:true,upper:true,digits:true,symbols:true}){
 const sets={lower:'abcdefghjkmnpqrstuvwxyz',upper:'ABCDEFGHJKMNPQRSTUVWXYZ',digits:'23456789',symbols:'!@#$%&*_-+=?'};
 const used=Object.entries(sets).filter(([k])=>!!options[k]).map(([,v])=>v);
 if(!used.length)throw Error('Select at least one character group.');
 if(!Number.isInteger(length)||length<8||length>96)throw Error('Password length must be between 8 and 96.');
 const alphabet=used.join(''),n=alphabet.length,limit=Math.floor(256/n)*n;
 let output='';
 const buffer=new Uint8Array(256);
 while(output.length<length){
  crypto.getRandomValues(buffer);
  for(const x of buffer){if(x>=limit)continue;output+=alphabet[x%n];if(output.length===length)break;}
 }
 return output;
}
export function renamePlan(names,{prefix='',suffix='',numbered=true,start=1}={}){
 const used=new Set();
 return names.map((input,i)=>{
  const name=safe(input);const dot=name.lastIndexOf('.');
  const ext=dot>0?name.slice(dot):'',root=dot>0?name.slice(0,dot):name;
  const counter=numbered?'-'+String(start+i).padStart(3,'0'):'';
  const base=safe(prefix+root+suffix+counter).slice(0,110)||'asset';
  let out=base+ext,n=2;
  while(used.has(out)){out=base+'-'+n++ +ext;}
  used.add(out);return out;
 });
}
export function initUtilityForge(app){
 const input=$('utilTextIn'),output=$('utilTextOut'),status=$('utilStatus');
 const files=$('utilFiles'),preview=$('utilFilePreview');
 function showStats(){
  const s=textStats(input.value);
  $('utilTextStats').textContent=s.characters+' characters · '+s.words+' words · '+s.lines+' lines · '+bytes(s.bytes);
 }
 function convert(){
  if(input.value.length>180000)throw Error('Text transformation size is limited to 180,000 characters.');
  const type=$('utilAction').value;
  const next=transformText(input.value,type);
  if(next.length>250000)throw Error('Result is too large for the on-screen editor.');
  output.value=next;status.textContent='Transformation complete · '+textStats(next).characters+' characters';return next;
 }
 input.addEventListener('input',showStats);
 $('utilRun').addEventListener('click',wrap(convert));
 $('utilSwap').addEventListener('click',()=>{input.value=output.value;showStats();status.textContent='Output moved to input.';});
 $('utilCopy').addEventListener('click',wrap(async()=>{
  if(!output.value)throw Error('Generate some text first.');
  if(!navigator.clipboard?.writeText)throw Error('Use Select All in the output box to copy this text.');
  await navigator.clipboard.writeText(output.value);
  status.textContent='Output copied to clipboard';
 }));
 $('utilExport').addEventListener('click',wrap(()=>{
  if(!output.value)throw Error('Generate text first.');
  const file=($('utilAction').value.startsWith('json-')?'PROXIMUS-FORMATTED.json':'PROXIMUS-TEXT.txt');
  download(new Blob([output.value],{type:'text/plain;charset=utf-8'}),file);
 }));
 $('utilToPack').addEventListener('click',wrap(()=>{
  if(!output.value)throw Error('Generate text first.');
  app.addAsset('PROXIMUS-UTILITY-TEXT.txt',new Blob([output.value],{type:'text/plain;charset=utf-8'}),'Utility Forge');
 }));
 $('utilPassGenerate').addEventListener('click',wrap(()=>{
  const length=Number($('utilPassLength').value),opts={
   lower:$('utilPassLower').checked,upper:$('utilPassUpper').checked,
   digits:$('utilPassDigits').checked,symbols:$('utilPassSymbols').checked
  };
  const count=Number($('utilPassCount').value);
  if(count<1||count>20)throw Error('Generate between 1 and 20 keys.');
  const lines=Array.from({length:count},()=>randomPassword(length,opts));
  $('utilPassOut').value=lines.join('\n');
  $('utilPassOut').setAttribute('aria-label',count+' locally generated secure strings');
  status.textContent=count+' secure strings generated locally';
 }));
 $('utilPassCopy').addEventListener('click',wrap(async()=>{
  if(!$('utilPassOut').value)throw Error('Generate secure strings first.');
  if(!navigator.clipboard?.writeText)throw Error('Select and copy the strings from the output field.');
  await navigator.clipboard.writeText($('utilPassOut').value);status.textContent='Secure strings copied';
 }));
 $('utilPassDownload').addEventListener('click',wrap(()=>{
  if(!$('utilPassOut').value)throw Error('Generate secure strings first.');
  download(new Blob([$('utilPassOut').value],{type:'text/plain;charset=utf-8'}),'PROXIMUS-PRIVATE-KEYS.txt');
 }));
 let selected=[];
 const settings=()=>({prefix:$('utilPrefix').value,suffix:$('utilSuffix').value,
  numbered:$('utilNumbered').checked,start:Number($('utilStart').value)||1});
 function renderNames(){
  preview.replaceChildren();
  if(!selected.length){preview.textContent='Choose up to 60 files to preview their new names.';return;}
  const planned=renamePlan(selected.map(x=>x.name),settings());
  for(let i=0;i<selected.length;i++){
   const row=document.createElement('div');row.className='util-rename-line';
   const left=document.createElement('span');left.textContent=safe(selected[i].name);
   const right=document.createElement('span');right.textContent=planned[i];
   row.append(left,right);preview.append(row);
  }
 }
 files.addEventListener('change',()=>{
  selected=Array.from(files.files||[]).slice(0,60);renderNames();
  status.textContent=selected.length+' files selected for local batch packaging';
 });
 for(const id of ['utilPrefix','utilSuffix','utilNumbered','utilStart'])$(id).addEventListener('input',renderNames);
 $('utilZip').addEventListener('click',wrap(async()=>{
  if(!selected.length)throw Error('Choose files for the rename package.');
  const bytesTotal=selected.reduce((s,f)=>s+f.size,0);
  if(bytesTotal>150000000)throw Error('Total selected files must be under 150 MB.');
  const planned=renamePlan(selected.map(x=>x.name),settings());
  const entries=selected.map((f,i)=>({name:planned[i],data:f}));
  entries.push({name:'RENAME-MANIFEST.json',data:textFile({
   generated_by:'PROXIMUS | ASSET ALCHEMIST',created_at:new Date().toISOString(),
   files:selected.map((f,i)=>({source:safe(f.name),output:planned[i],size:f.size}))
  })});
  status.textContent='Building renamed file ZIP…';
  const zip=await makeZip(entries);
  download(zip,'PROXIMUS-BATCH-RENAMED.zip');
  status.textContent=selected.length+' files renamed inside ZIP · '+bytes(zip.size);
 }));
 showStats();renderNames();
}
