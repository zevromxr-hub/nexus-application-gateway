// PROXIMUS | Asset Alchemist — Secure Discord Release Announcer
// This script receives the Discord webhook only from an Actions SECRET.
// Never put the webhook URL in this source, the release JSON or Actions logs.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const RELEASE_SITE='https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/';
export const WEBHOOK_SECRET='DISCORD_RELEASE_WEBHOOK';
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clean=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/@/g,'@\u200b').trim();
const cut=(s,n)=>s.length>n?s.slice(0,n-1).trimEnd()+'…':s;
const versionPattern=/^\d+\.\d+\.\d+$/;
export function checkRelease(version,index,release){
 if(!version||!versionPattern.test(version.version||''))throw Error('Invalid application version');
 if(!index||!Array.isArray(index.releases)||index.releases[0]?.version!==version.version)
  throw Error('The release index does not list the current version first.');
 if(!release||release.version!==version.version||!Array.isArray(release.features))
  throw Error('Current release details are missing or inconsistent.');
 if(release.source_repository!=='zevromxr-hub/nexus-application-gateway')
  throw Error('Unexpected release repository.');
 return true;
}
export function buildDiscordPayload(version,release){
 const v=clean(version.version),title=cut(clean(release.title||version.subtitle||'New release'),250);
 const features=release.features.slice(0,7).map(item=>cut(clean(item),220)).filter(Boolean);
 const details=features.map((feature,i)=>'• '+feature).join('\n');
 const desc=['**'+title+'**','','A new release has been published and verified.'].join('\n');
 return {
  username:'PROXIMUS | RELEASE SYSTEM',
  allowed_mentions:{parse:[]},
  embeds:[{
   type:'rich',
   title:'PROXIMUS | UPDATE v'+v,
   url:RELEASE_SITE,
   description:desc,
   color:0x9864df,
   fields:[
    {name:'WHAT’S NEW',value:cut(details||'Release improvements and fixes.',1024)},
    {name:'RELEASE',value:'**v'+v+'** · Stable',inline:true},
    {name:'COMPATIBILITY',value:'iPhone · PC',inline:true},
    {name:'LAUNCH APPLICATION',value:'[Open PROXIMUS Companion Edition]('+RELEASE_SITE+')'},
    {name:'RELEASE DETAILS',value:'[View release notes](https://github.com/zevromxr-hub/nexus-application-gateway/blob/main/alchemist/releases/v'+v+'.json)'}
   ],
   timestamp:new Date().toISOString(),
   footer:{text:'POWERED BY ZEVRO | PROXIMUS'}
  }]
 };
}
export function isNewRelease(previous,current){
 return versionPattern.test(previous||'')&&versionPattern.test(current||'')&&previous!==current;
}
export function validateWebhook(secret){
 // Never expose webhook data in thrown errors or Actions logs.
 if(typeof secret!=='string'||!secret.trim())throw Error('Missing DISCORD_RELEASE_WEBHOOK Actions secret.');
 let uri;
 try{uri=new URL(secret.trim());}catch(error){throw Error('Discord webhook secret is not a valid URL.');}
 if(uri.protocol!=='https:'||!['discord.com','discordapp.com'].includes(uri.hostname)||
    !/^\/api\/webhooks\/\d{15,24}\/[A-Za-z0-9_-]{40,}$/.test(uri.pathname)||
    uri.username||uri.password||uri.search||uri.hash)
  throw Error('Discord webhook secret must be a direct Discord HTTPS webhook URL.');
 uri.searchParams.set('wait','true');
 return uri;
}
async function readCurrent(){
 const [version,index]=await Promise.all([
  readFile(path.join(repoRoot,'alchemist/version.json'),'utf8').then(JSON.parse),
  readFile(path.join(repoRoot,'alchemist/releases/index.json'),'utf8').then(JSON.parse)
 ]);
 const release=JSON.parse(await readFile(path.join(repoRoot,'alchemist/releases/v'+version.version+'.json'),'utf8'));
 checkRelease(version,index,release);
 return {version,index,release};
}
function previousVersion(){
 try{
  const txt=execFileSync('git',['show','HEAD^:alchemist/version.json'],{cwd:repoRoot,encoding:'utf8',stdio:['ignore','pipe','ignore']});
  return JSON.parse(txt).version;
 }catch(e){throw Error('Could not inspect preceding release. Ensure checkout fetch-depth is at least 2.');}
}
async function confirmLive(version,fetchFn=fetch,{attempts=18,delayMs=15000}={}){
 const wanted=version.version;
 for(let i=0;i<attempts;i++){
  try{
   const url=new URL('version.json',RELEASE_SITE);
   url.searchParams.set('proximus_release',wanted);
   url.searchParams.set('attempt',String(i));
   const response=await fetchFn(url,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(14000)});
   if(response.ok){
    const json=await response.json();
    if(json.version===wanted){console.log('GitHub Pages reports v'+wanted+' · published.');return;}
   }
  }catch(e){}
  if(i<attempts-1){console.log('Awaiting GitHub Pages deployment for v'+wanted+' ('+(i+1)+'/'+attempts+')');await wait(delayMs);}
 }
 throw Error('The published GitHub Pages version did not match v'+wanted+'. The Discord post was NOT sent. You can rerun the workflow after deployment.');
}
async function sendWebhook(url,payload,fetchFn=fetch){
 for(let attempt=1;attempt<=4;attempt++){
  let response;
  try{
   response=await fetchFn(url,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
  }catch(e){
   if(attempt===4)throw Error('Could not connect to Discord after 4 attempts. No confirmed announcement.');
   await wait(attempt*2000);continue;
  }
  if(response.ok){
   let message;
   try{message=await response.json();}catch(e){}
   if(!message?.id)throw Error('Discord returned success without a message receipt. Verify the channel before rerunning.');
   console.log('Discord accepted the PROXIMUS release announcement. Message ID: '+message.id);
   return message.id;
  }
  // Do not print Discord response bodies or webhook URLs.
  if((response.status===429||response.status>=500)&&attempt<4){
   const hint=Number(response.headers.get('retry-after'));
   await wait(Number.isFinite(hint)&&hint>0?Math.min(hint*1000,15000):2000*attempt);
   continue;
  }
  throw Error('Discord rejected the release announcement (HTTP '+response.status+'). Check the encrypted webhook secret and channel permissions.');
 }
}
export async function runReleaseAnnouncement(mode=process.argv[2]||'dry-run'){
 if(!['dry-run','send-on-release','send-current'].includes(mode))throw Error('Unsupported announcement mode.');
 const {version,release}=await readCurrent();
 if(mode==='send-on-release'){
  const previous=previousVersion();
  if(!isNewRelease(previous,version.version)){
   console.log('No new version detected ('+version.version+'); skipping Discord to prevent commit spam.');
   return {status:'unchanged'};
  }
  console.log('Release-only trigger: v'+previous+' → v'+version.version);
 }
 const payload=buildDiscordPayload(version,release);
 if(mode==='dry-run'){
  console.log('DISCORD RELEASE PREVIEW (safe; no webhook or HTTP send):');
  console.log(JSON.stringify(payload,null,2));
  return {status:'preview'};
 }
 const secret=process.env[WEBHOOK_SECRET];
 if(!secret){
  console.log('::warning::DISCORD_RELEASE_WEBHOOK is not configured. Release announcer installed; no Discord message sent. Add the repository Actions secret, then manually run this workflow in send-current mode.');
  return {status:'unconfigured'};
 }
 const webhookUrl=validateWebhook(secret);
 await confirmLive(version);
 await sendWebhook(webhookUrl,payload);
 return {status:'delivered',version:version.version};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 runReleaseAnnouncement().catch(error=>{
  // Only errors created above are printed. Never print a secret or raw HTTP body.
  console.error('PROXIMUS Discord Release Announcer: '+error.message);
  process.exitCode=1;
 });
}
