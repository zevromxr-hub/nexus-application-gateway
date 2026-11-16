// NEXUS Azeroth release announcer. Uses existing DISCORD_RELEASE_WEBHOOK GitHub Actions secret.
// Independent from PROXIMUS Asset Alchemist; no announcements for ordinary commits.
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateWebhook} from '../../alchemist/scripts/release-announcer.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const site='https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/';
const read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const safe=s=>String(s??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/@/g,'@\u200b').slice(0,220);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function metadata(){const v=await read('azeroth-companion/version.json'),index=await read('azeroth-companion/releases/index.json'),release=await read('azeroth-companion/releases/v'+v.version+'.json');if(!/^\d+\.\d+\.\d+$/.test(v.version)||index.releases?.[0]?.version!==v.version||release.version!==v.version||release.source_repository!=='zevromxr-hub/nexus-application-gateway'||!Array.isArray(release.features))throw Error('Azeroth release metadata is inconsistent.');return{v,index,release}}
export function payload(v,release){return{username:'NEXUS | RELEASE SYSTEM',allowed_mentions:{parse:[]},embeds:[{title:'NEXUS | AZEROTH COMPANION v'+v.version,url:site,description:'**'+safe(release.title)+'**\n\nWorld of Warcraft Companion update published and validated.',color:0xd6a661,fields:[{name:'WHAT’S NEW',value:release.features.slice(0,7).map(s=>'• '+safe(s)).join('\n').slice(0,1024)||'Release improvements.'},{name:'RELEASE',value:'v'+v.version+' · Stable',inline:true},{name:'COMPATIBILITY',value:'iPhone · PC',inline:true},{name:'OPEN COMPANION',value:'[Launch Azeroth Companion]('+site+')'},{name:'RELEASE NOTES',value:'[View release history](https://github.com/zevromxr-hub/nexus-application-gateway/blob/main/azeroth-companion/CHANGELOG.md)'}],timestamp:new Date().toISOString(),footer:{text:'POWERED BY ZEVRO | NEXUS'}}]}}
// A verified remote tag records which releases actually reached Discord.
const marker=version=>'azeroth-announced-v'+version;
function alreadyAnnounced(version){
 try{
  const value=execFileSync('git',['ls-remote','--exit-code','--tags','origin','refs/tags/'+marker(version)],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  return Boolean(value.trim());
 }catch(e){
  if(e.status===2)return false; // No marker exists.
  throw Error('Could not verify Discord delivery marker; announcement halted to avoid duplicates.');
 }
}
function recordAnnouncement(version){
 const tag=marker(version);
 try{
  execFileSync('git',['-c','user.name=NEXUS Release Bot','-c','user.email=noreply@users.noreply.github.com','tag','-a',tag,'-m','Discord confirmed Azeroth v'+version],{cwd:root,stdio:['ignore','pipe','pipe']});
  execFileSync('git',['push','origin','refs/tags/'+tag],{cwd:root,stdio:['ignore','pipe','pipe']});
  console.log('Discord delivery marker saved: '+tag);
 }catch(e){throw Error('Discord accepted the announcement, but GitHub could not record its delivery marker. Do not retry automatically before checking Discord.')}
}
async function awaitLive(v){for(let i=0;i<16;i++){try{const u=new URL('version.json',site);u.searchParams.set('release',v);u.searchParams.set('attempt',i);const response=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(response.ok&&(await response.json()).version===v)return}catch(_){}if(i<15)await delay(12000)}throw Error('GitHub Pages not yet reporting release '+v+'. No announcement sent.')}
async function send(url,body){for(let i=1;i<=3;i++){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});if(r.ok){const d=await r.json();if(!d.id)throw Error('Discord response had no message confirmation');console.log('Azeroth Discord announcement confirmed. Message ID: '+d.id);return}if(r.status===429||r.status>=500){if(i<3){await delay(3000*i);continue}}throw Error('Discord rejected release notification: HTTP '+r.status)}catch(e){if(i===3)throw Error('Discord delivery not confirmed: '+(String(e.message).startsWith('Discord rejected')?e.message:'network or response error'));await delay(i*2500)}}}
export async function run(mode=process.argv[2]||'dry-run'){
 if(!['dry-run','send-current','send-on-release'].includes(mode))throw Error('Invalid release announcement mode');
 const{v,release}=await metadata();
 const body=payload(v,release);
 if(mode==='dry-run'){console.log(JSON.stringify(body,null,2));return}
 if(mode==='send-on-release'&&alreadyAnnounced(v.version)){
  console.log('Azeroth v'+v.version+' was already confirmed in Discord; no duplicate posted.');return;
 }
 const secret=process.env.DISCORD_RELEASE_WEBHOOK;
 if(!secret)throw Error('DISCORD_RELEASE_WEBHOOK is missing. Configure the GitHub Actions secret; no Discord announcement was sent.');
 const uri=validateWebhook(secret);
 await awaitLive(v.version);
 await send(uri,body);
 if(!alreadyAnnounced(v.version))recordAnnouncement(v.version);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))run().catch(e=>{console.error('Azeroth release announcement: '+e.message);process.exitCode=1});
