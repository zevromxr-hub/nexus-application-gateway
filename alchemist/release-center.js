// PROXIMUS | ASSET ALCHEMIST — Release Center
// Shows release cards from this repository's existing versioned JSON manifests.
// Content is rendered with DOM text nodes. The GitHub source remains canonical.
import {$,notice,wrap} from './core.js';
const SOURCE='https://github.com/zevromxr-hub/nexus-application-gateway/blob/main/alchemist/';
const local=(version)=>'./releases/v'+version+'.json';
const compare=(a,b)=>b.split('.').map(Number).reduce((acc,n,i)=>acc||n-(a.split('.').map(Number)[i]||0),0);
const asText=v=>String(v??'');
function make(tag,className,value){
 const el=document.createElement(tag);if(className)el.className=className;
 if(value!==undefined)el.textContent=asText(value);return el;
}
function listChanges(data){
 const list=Array.isArray(data.changes)?data.changes:Array.isArray(data.features)?data.features:[];
 return list.filter(x=>typeof x==='string'&&x.trim()&&!/^(?:existing|all prior|previous|preserved|unmodified|previously|unchanged|all \d+ existing|offline cache and validation)/i.test(x.trim()))
  .slice(0,32);
}
export function renderReleaseCards(container,items,latest,term=''){
 container.replaceChildren();
 let shown=0;
 for(const obj of items){
  const row=obj.data;
  if(!row)continue;
  const features=listChanges(row),name=asText(obj.title||row.subtitle||row.name||'Release'),date=asText(row.release_date||obj.date||'');
  const searchable=[row.version,name,date,...features].join(' ').toLowerCase();
  if(term&&!searchable.includes(term.toLowerCase()))continue;
  shown++;
  const card=make('article','release-card'+(row.version===latest?' release-current':''));
  const header=make('div','release-card-head');
  const left=make('div','release-card-title');
  left.append(make('span','release-version','v'+row.version));
  if(row.version===latest)left.append(make('span','release-latest','LATEST'));
  left.append(make('h3','',name));
  const metadata=make('div','release-metadata');
  metadata.append(make('span','',date),make('span','','Stable release'));
  header.append(left,metadata);
  const details=make('details','release-details');if(row.version===latest)details.open=true;
  const summary=make('summary','','View new features ('+features.length+')');
  const ul=make('ul','release-features');
  for(const f of features)ul.append(make('li','',f));
  details.append(summary,ul);
  const links=make('div','release-links');
  const link=make('a','release-link','View source release record');link.href=SOURCE+'releases/v'+encodeURIComponent(row.version)+'.json';link.target='_blank';link.rel='noopener noreferrer';
  const history=make('a','release-link','GitHub history');history.href='https://github.com/zevromxr-hub/nexus-application-gateway/commits/main/alchemist/';history.target='_blank';history.rel='noopener noreferrer';
  links.append(link,history);card.append(header,details,links);container.append(card);
 }
 if(!shown)container.append(make('p','hint','No releases match that search.'));
 return shown;
}
export async function initReleaseCenter(){
 const status=$('releaseCenterStatus'),cards=$('releaseCards'),search=$('releaseSearch');
 let stored=[],latest='2.5.0',busy=false;
 const show=()=>{const total=renderReleaseCards(cards,stored,latest,search.value.trim());$('releaseCount').textContent=String(total)+' releases shown';};
 async function refresh(){
  if(busy)return;busy=true;
  status.textContent='Loading official release history…';
  try{
   const [current,history]=await Promise.all([
    fetch('./version.json?releaseCenter='+Date.now(),{cache:'no-store'}),
    fetch('./releases/index.json?releaseCenter='+Date.now(),{cache:'no-store'})
   ]);
   if(!current.ok||!history.ok)throw Error('Could not retrieve local release history');
   const version=await current.json(),index=await history.json();
   if(!Array.isArray(index.releases))throw Error('Invalid release index');
   latest=version.version||latest;
   const manifestVersions=[latest,...index.releases.map(x=>x.version)].filter((v,i,a)=>/^\d+\.\d+\.\d+$/.test(v)&&a.indexOf(v)===i).slice(0,24);
   const outputs=await Promise.all(manifestVersions.map(async v=>{
    const entry=index.releases.find(x=>x.version===v)||{};
    try{
     const response=await fetch(local(v),{cache:'no-store'});
     if(!response.ok)throw Error('Missing release record');
     return {version:v,title:entry.title||'',date:entry.date||'',data:await response.json()};
    }catch(e){return null;}
   }));
   stored=outputs.filter(x=>x&&x.data.version===x.version).sort((a,b)=>compare(a.version,b.version));
   $('releaseLiveVersion').textContent='v'+latest;
   status.textContent='Version history synced from PROXIMUS release records · '+stored.length+' releases';
   show();
  }catch(e){
   status.textContent='Your saved release history is ready to view when you are online.';
   if(!stored.length)cards.replaceChildren(make('p','hint','Open the Release Center again to refresh the version history.'));
  }finally{busy=false;}
 }
 $('releaseRefresh').addEventListener('click',wrap(refresh));
 $('releaseUpdateShortcut').addEventListener('click',()=>$('versionCheck').click());
 search.addEventListener('input',show);
 await refresh();
}
