/* NEXUS | AZEROTH COMPANION v3.0 - Cloudflare dashboard single-file deployment.
 * GENERATED FROM personal-portal.js + worker.js. Do not include passwords or secrets here.
 * Existing BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET remain encrypted Worker bindings.
 * Add AZEROTH_SESSION_SECRET encrypted binding separately.
 */
/* NEXUS | My Azeroth first-party private account portal.
 * Backend: Cloudflare Workers, user OAuth authorization code and wow.profile.
 * The public GitHub Pages app never receives session cookies or Blizzard tokens.
 */
const LOCALES={us:'en_US',eu:'en_GB',kr:'ko_KR',tw:'zh_TW'};
const SESSION='__Host-nx_bnet_session',STATE='__Host-nx_bnet_state';
const jheaders={'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY'};
const response=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:jheaders});
const cookie=(name,value,age)=>name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age;
const value=(req,name)=>{for(const x of (req.headers.get('cookie')||'').split(';')){const [k,...v]=x.trim().split('=');if(k===name)return v.join('=')}return''};
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function bytes(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('Bad cookie');const x=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));return Uint8Array.from(x,c=>c.charCodeAt(0))}
const configured=env=>typeof env.BLIZZARD_CLIENT_ID==='string'&&!!env.BLIZZARD_CLIENT_ID&&typeof env.BLIZZARD_CLIENT_SECRET==='string'&&!!env.BLIZZARD_CLIENT_SECRET&&typeof env.AZEROTH_SESSION_SECRET==='string'&&env.AZEROTH_SESSION_SECRET.length>=32;
async function key(env){if(!configured(env))throw Error('Not configured');const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.AZEROTH_SESSION_SECRET));return crypto.subtle.importKey('raw',d,{name:'AES-GCM'},false,['encrypt','decrypt'])}
async function seal(env,object){const iv=crypto.getRandomValues(new Uint8Array(12)),data=new TextEncoder().encode(JSON.stringify(object));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(env),data);return b64(iv)+'.'+b64(new Uint8Array(ct))}
async function unseal(env,s){try{const [i,c]=String(s).split('.');if(!i||!c||c.length>10000)return null;const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(i)},await key(env),bytes(c)),x=JSON.parse(new TextDecoder().decode(decoded));return x&&Number(x.exp)>Date.now()?x:null}catch(_){return null}}
function redirect(url,cookies=[]){const h=new Headers({'location':url,'cache-control':'no-store','referrer-policy':'no-referrer'});for(const c of cookies)h.append('set-cookie',c);return new Response(null,{status:303,headers:h})}
function page(body,type){return new Response(body,{headers:{'content-type':type,'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; img-src 'self'"}})}
const PAGE="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><title>NEXUS | My Azeroth</title><style>:root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#0b1120;color:#eaf1f2}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 4%,#442d6a60,transparent 40%),radial-gradient(circle at 2% 5%,#205b6260,transparent 35%),#0b1120;min-height:100vh}main{max-width:1050px;padding:32px 18px 80px;margin:auto}h1{font-size:clamp(29px,5vw,46px);margin:8px 0 15px}h1 b{color:#d9b27a}h2{font-size:19px;margin:0 0 10px}.kicker{letter-spacing:2px;color:#cfaf87;font-size:11px;font-weight:bold}.muted{color:#adbdca;line-height:1.6;font-size:13px}.panel{border:1px solid #ba96575c;background:#152237ed;border-radius:17px;padding:19px;margin:16px 0}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.between{justify-content:space-between}.button,button{display:inline-block;border:1px solid #d2ae786c;border-radius:11px;background:#283c54;color:#f5f0df;font:700 12px system-ui;padding:11px 15px;text-decoration:none;cursor:pointer}.primary{color:#23180c;background:#d9b27a;border:0}.danger{border-color:#bd7777}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:11px}.item{border:1px solid #ffffff20;border-radius:11px;padding:13px;background:#ffffff06;min-width:0}.item strong,.item small{display:block}.item strong{font-size:14px;color:#ecdbb5}.item small{font-size:11px;color:#b6cad1;margin:7px 0}.status{font-size:13px;line-height:1.5;color:#a8dfc9;margin:8px 0}select{background:#0d1b30;border:1px solid #ffffff56;border-radius:9px;color:white;padding:10px;width:180px}footer{font-size:11px;color:#8d9bad;margin-top:30px}a{color:#d6d6f0}@media(max-width:620px){main{padding:22px 13px 40px}.panel{padding:14px}.button,button{min-height:42px}}</style><script defer src=\"/account/app.js\"></script></head><body><main><div class=\"kicker\">NEXUS | AZEROTH COMPANION</div><h1>My <b>Azeroth</b></h1><p class=\"muted\">Your personal World of Warcraft dashboard. Sign in directly through Blizzard, using this Cloudflare-hosted secure page instead of third-party cookies.</p><div class=\"panel\"><div class=\"row between\"><div><h2>Battle.net Connection</h2><div id=\"connection\" class=\"status\">Checking connection…</div></div><div class=\"row\"><a class=\"button\" href=\"https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/\">PUBLIC COMPANION</a><form method=\"POST\" action=\"/auth/logout\" id=\"disconnect\"><button type=\"submit\" class=\"danger\">DISCONNECT</button></form></div></div><div class=\"row\" id=\"logins\"><label for=\"region\">Account region</label><select id=\"region\"><option value=\"us\">Americas</option><option value=\"eu\">Europe</option><option value=\"kr\">Korea</option><option value=\"tw\">Taiwan</option></select><button id=\"connect\" class=\"primary\" type=\"button\">CONNECT BATTLE.NET</button></div><p class=\"muted\">Read-only permission: <b>wow.profile</b>. The portal never asks for passwords, never puts tokens in URL links, and does not automatically change your game account. Sessions expire after an hour or sooner if Blizzard revokes access.</p></div><section class=\"panel\" id=\"charactersPanel\" hidden><div class=\"row between\"><h2>My Characters</h2><button type=\"button\" data-reload=\"characters\">REFRESH</button></div><p id=\"charactersStatus\" class=\"muted\"></p><div id=\"characters\" class=\"grid\"></div></section><section class=\"panel\" id=\"collectionsPanel\" hidden><div class=\"row between\"><h2>My Collections</h2><button type=\"button\" data-reload=\"collections\">REFRESH</button></div><p class=\"muted\">Blizzard periodically updates its data. Counts do not represent live in-game inventory or farming activity.</p><div id=\"collections\" class=\"grid\"></div></section><footer>Powered by ZevRo Development | NEXUS · Unofficial fan-made World of Warcraft companion. <a href=\"/account/privacy\">Privacy &amp; security</a></footer></main></body></html>";
const PRIVACY="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><title>My Azeroth Privacy</title><style>body{background:#0d1421;color:#e3eaf0;font:16px/1.65 system-ui;margin:0}main{max-width:800px;margin:auto;padding:30px 20px}a{color:#e9ca8d}h1,h2{color:#f0dcac}</style></head><body><main><h1>NEXUS | My Azeroth — Privacy</h1><p>An unofficial fan-made World of Warcraft tool, not affiliated with Blizzard Entertainment.</p><h2>What is accessed</h2><p>With your consent, we request Blizzard's <code>wow.profile</code> scope to read character lists, mounts and pets that Blizzard makes available to your account and selected region. Your Battle.net password is never handled by this tool.</p><h2>How sessions work</h2><p>The Cloudflare Worker encrypts your Blizzard access token inside a Secure, HttpOnly, SameSite=Lax session cookie on the Worker's own domain. No tokens are placed in GitHub Pages, browser localStorage, analytics or redirect URLs. Sessions expire after up to one hour. The application has no database for this personal data, though your browser, Blizzard and Cloudflare may process network requests and operational logs under their respective policies.</p><h2>Disconnect and revocation</h2><p>Disconnect removes the session cookie from your browser. You can revoke access in Battle.net's account security settings. The separate public companion keeps its own browser-local manual plans and is unaffected by disconnecting.</p><h2>Limitations</h2><p>Account data may lag behind gameplay. The portal is read-only and cannot move items, change talents, or control your game account.</p><p><a href=\"/account\">Return to My Azeroth</a></p></main></body></html>";
const CLIENT="(()=>{'use strict';\nconst $=id=>document.getElementById(id);\nconst el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};\nconst say=(id,text)=>{$(id).textContent=text};\nasync function get(path){const res=await fetch(path,{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});const v=await res.json().catch(()=>null);if(!v)throw Error('Account service returned an unreadable response');if(!res.ok)throw Error(v.message||'Account request failed');return v}\n$('connect').addEventListener('click',()=>{const r=$('region').value;if(['us','eu','kr','tw'].includes(r))location.href='/auth/start?region='+encodeURIComponent(r)});\nasync function showCharacters(){\n say('charactersStatus','Loading character index from Blizzard…');$('characters').replaceChildren();\n try{const data=await get('/api/me/characters');const chars=data.characters||[];say('charactersStatus',chars.length+' character(s) reported in '+data.region.toUpperCase());\n for(const ch of chars){const card=el('div','item'),name=el('strong','',ch.name),meta=el('small','',ch.realm+' · Level '+ch.level+' · '+ch.className),a=el('a','button','OPEN IN PUBLIC ARMORY');const q=new URLSearchParams({armory_region:data.region,armory_realm:ch.realmSlug,armory_name:ch.name.toLowerCase()});a.href='https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/?'+q;a.rel='noopener noreferrer';card.append(name,meta,a);$('characters').append(card)}}catch(e){say('charactersStatus',e.message)}\n}\nasync function showCollections(){\n $('collections').replaceChildren();for(const kind of ['mounts','pets']){const card=el('div','item'),name=el('strong','',kind==='mounts'?'Mounts':'Pets'),status=el('small','','Loading…');card.append(name,status);$('collections').append(card);\n try{const data=await get('/api/me/collections/'+kind);status.textContent=data.total+' Blizzard entries'+(data.sample.length?' · examples: '+data.sample.slice(0,6).map(x=>x.name).join(', '):'')}catch(e){status.textContent=e.message}}}\ndocument.querySelectorAll('[data-reload]').forEach(b=>b.addEventListener('click',()=>b.dataset.reload==='characters'?showCharacters():showCollections()));\n(async()=>{try{const status=await get('/api/me/status');if(!status.connected)throw Error('No session');$('logins').hidden=true;$('disconnect').hidden=false;say('connection','Connected to Blizzard · '+status.region.toUpperCase()+' · Read-only session');$('charactersPanel').hidden=false;$('collectionsPanel').hidden=false;await Promise.allSettled([showCharacters(),showCollections()])}catch(_){$('logins').hidden=false;$('disconnect').hidden=true;say('connection','Not connected. Choose your region and connect through Blizzard.')}})();\n})();";

const callback=u=>u.origin+'/auth/callback';
async function fromBlizzard(token,region,path){const u=new URL('https://'+region+'.api.blizzard.com'+path);u.searchParams.set('namespace','profile-'+region);u.searchParams.set('locale',LOCALES[region]);const r=await fetch(u,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok){if(r.status===401||r.status===403)throw {status:401,message:'Authorization expired or unavailable. Reconnect your Battle.net account.'};if(r.status===404)throw {status:404,message:'No account data returned in this region.'};if(r.status===429)throw {status:429,message:'Blizzard rate limit reached.'};throw {status:502,message:'Blizzard account API unavailable.'}}return r.json()}
function publicChar(ch){const name=String(ch?.name||'').slice(0,60),realmSlug=String(ch?.realm?.slug||'').toLowerCase(),realm=String(ch?.realm?.name||realmSlug).slice(0,80);if(!/^[a-z0-9-]{2,80}$/.test(realmSlug)||!name)return null;return{name,realm,realmSlug,level:Number(ch?.level)||0,className:String(ch?.playable_class?.name||'Unknown class').slice(0,75)}}
async function handlePersonal(request,env,url){
 const path=url.pathname;
 if(path==='/account')return page(PAGE,'text/html; charset=utf-8');
 if(path==='/account/privacy')return page(PRIVACY,'text/html; charset=utf-8');
 if(path==='/account/app.js')return page(CLIENT,'text/javascript; charset=utf-8');
 if(path==='/auth/start'){
  if(request.method!=='GET')return response({message:'Method not allowed'},405);
  if(!configured(env))return redirect('/account?error=configuration');
  const region=url.searchParams.get('region')||'us';if(!Object.hasOwn(LOCALES,region))return response({message:'Invalid region'},400);
  const state=region+'.'+b64(crypto.getRandomValues(new Uint8Array(32)));
  const secureState=await seal(env,{state,exp:Date.now()+10*60*1000});
  const auth=new URL('https://oauth.battle.net/authorize');auth.searchParams.set('client_id',env.BLIZZARD_CLIENT_ID);auth.searchParams.set('redirect_uri',callback(url));auth.searchParams.set('response_type','code');auth.searchParams.set('scope','wow.profile');auth.searchParams.set('state',state);
  return redirect(auth.href,[cookie(STATE,secureState,600)]);
 }
 if(path==='/auth/callback'){
  if(request.method!=='GET')return response({message:'Method not allowed'},405);
  const clear=cookie(STATE,'',0);
  if(!configured(env))return redirect('/account?error=configuration',[clear]);
  const code=url.searchParams.get('code'),state=url.searchParams.get('state'),stored=await unseal(env,value(request,STATE));
  if(!code||code.length>2000||!state||!stored||stored.state!==state)return redirect('/account?error=invalid-state',[clear]);
  const region=state.split('.')[0];if(!Object.hasOwn(LOCALES,region))return redirect('/account?error=region',[clear]);
  try{
   const creds=btoa(env.BLIZZARD_CLIENT_ID+':'+env.BLIZZARD_CLIENT_SECRET);
   const r=await fetch('https://oauth.battle.net/token',{method:'POST',headers:{Authorization:'Basic '+creds,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:callback(url)}),signal:AbortSignal.timeout(12000)});
   if(!r.ok)return redirect('/account?error=exchange',[clear]);
   const d=await r.json();if(typeof d.access_token!=='string'||!d.access_token)return redirect('/account?error=token',[clear]);
   // Read-only hour-long session; do not persist refresh tokens or identities.
   const age=Math.min(3600,Math.max(1,Number(d.expires_in)||3600));
   const session=await seal(env,{token:d.access_token,region,exp:Date.now()+age*1000});
   return redirect('/account',[clear,cookie(SESSION,session,age)]);
  }catch(_){return redirect('/account?error=upstream',[clear])}
 }
 if(path==='/auth/logout'){
  if(request.method!=='POST')return response({message:'Method not allowed'},405);
  const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return response({message:'Invalid origin'},403);
  return redirect('/account',[cookie(SESSION,'',0),cookie(STATE,'',0)]);
 }
 if(!path.startsWith('/api/me/'))return response({message:'No such route'},404);
 if(request.method!=='GET')return response({message:'Method not allowed'},405);
 const session=await unseal(env,value(request,SESSION));
 if(!session||typeof session.token!=='string'||!Object.hasOwn(LOCALES,session.region))return response({success:false,message:'Not connected or session expired.'},401);
 if(path==='/api/me/status')return response({connected:true,region:session.region});
 try{
  if(path==='/api/me/characters'){
   const d=await fromBlizzard(session.token,session.region,'/profile/user/wow');
   const chars=(Array.isArray(d.wow_accounts)?d.wow_accounts:[]).flatMap(x=>Array.isArray(x.characters)?x.characters:[]).map(publicChar).filter(Boolean).slice(0,250);
   return response({success:true,region:session.region,characters:chars});
  }
  if(path==='/api/me/collections/mounts'||path==='/api/me/collections/pets'){
   const kind=path.endsWith('/mounts')?'mounts':'pets';
   const d=await fromBlizzard(session.token,session.region,'/profile/user/wow/collections/'+kind),entries=Array.isArray(d[kind])?d[kind]:[];
   const sample=entries.slice(0,40).map(x=>({name:String(x?.mount?.name||x?.species?.name||x?.name||'Unnamed').slice(0,100)}));
   return response({success:true,region:session.region,kind,total:entries.length,sample});
  }
  return response({message:'No such personal API route'},404);
 }catch(e){return response({success:false,message:String(e?.message||'Account data unavailable').slice(0,180)},Number(e?.status)||502)}
}


/* NEXUS Azeroth API v3.0 — Cloudflare Workers module
 * Deploy this file through Cloudflare's Worker editor. Never insert credentials here.
 * BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET stay in encrypted Worker secrets.
 */
const ORIGIN='https://zevromxr-hub.github.io';
const LOCALE={us:'en_US',eu:'en_GB',kr:'ko_KR',tw:'zh_TW'};
let bearer='',expiry=0,pending=null;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':ORIGIN,'access-control-allow-methods':'GET, OPTIONS','access-control-allow-headers':'Content-Type, Accept','cache-control':'no-store','x-content-type-options':'nosniff'}});
const fail=(message,status=400)=>json({success:false,message},status);
async function token(env){
 if(bearer&&Date.now()<expiry)return bearer;
 if(pending)return pending;
 pending=(async()=>{
  if(!env.BLIZZARD_CLIENT_ID||!env.BLIZZARD_CLIENT_SECRET)throw Error('Credentials not configured');
  const auth=btoa(env.BLIZZARD_CLIENT_ID+':'+env.BLIZZARD_CLIENT_SECRET);
  const r=await fetch('https://oauth.battle.net/token',{method:'POST',headers:{Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Blizzard OAuth unavailable');
  const d=await r.json();if(!d.access_token)throw Error('Blizzard OAuth token missing');
  bearer=d.access_token;expiry=Date.now()+Math.max(60,Number(d.expires_in||3600)-120)*1000;return bearer;
 })();
 try{return await pending}finally{pending=null}
}
async function blizzard(env,region,path,kind,query={}){
 const auth=await token(env),url=new URL('https://'+region+'.api.blizzard.com'+path);
 url.searchParams.set('namespace',kind+'-'+region);
 url.searchParams.set('locale',LOCALE[region]);
 for(const [key,value] of Object.entries(query))url.searchParams.set(key,String(value));
 const r=await fetch(url,{headers:{Authorization:'Bearer '+auth},signal:AbortSignal.timeout(12000)});
 if(!r.ok)return{error:r.status};
 return{data:await r.json()};
}
function nameOf(value,region){return typeof value==='string'?value:value?.[LOCALE[region]]||value?.en_US||value?.en_GB||''}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname==='/account'||u.pathname==='/account/privacy'||u.pathname==='/account/app.js'||u.pathname.startsWith('/auth/')||u.pathname.startsWith('/api/me/'))return handlePersonal(request,env,u);
  if(request.method==='OPTIONS')return json({ok:true});
  if(request.method!=='GET')return fail('Method not allowed',405);
  if(u.pathname==='/'||u.pathname==='/health')return json({application:'NEXUS | AZEROTH COMPANION',service:'Blizzard API Gateway',version:'3.0.0',status:'online',credentialsConfigured:Boolean(env.BLIZZARD_CLIENT_ID&&env.BLIZZARD_CLIENT_SECRET),personalPortalConfigured:Boolean(env.AZEROTH_SESSION_SECRET&&String(env.AZEROTH_SESSION_SECRET).length>=32)});
  const p=u.pathname.split('/').filter(Boolean);
  if(p[0]!=='api'||p.length>6)return fail('Unknown route',404);
  const type=p[1],region=p[2],arg=p[3],arg2=p[4];
  if(!Object.hasOwn(LOCALE,region))return fail('Unsupported region');
  const goodId=/^[1-9][0-9]{0,9}$/,slug=/^[a-z0-9-]{2,80}$/,name=/^[a-z0-9-]{2,50}$/;
  let path,namespace,params={};
  if((type==='item'||type==='media')&&p.length===4&&goodId.test(arg)){
   path=type==='media'?'/data/wow/media/item/'+arg:'/data/wow/item/'+arg;namespace='static';
   }else if(type==='talent-index'&&p.length===3){
   path='/data/wow/talent-tree/index';namespace='static';
  }else if(type==='talent-tree'&&p.length===5&&goodId.test(arg)&&goodId.test(arg2)){
   path='/data/wow/talent-tree/'+arg+'/playable-specialization/'+arg2;namespace='static';
  }else if(type==='search'&&p.length===3){
   const q=(u.searchParams.get('q')||'').trim();
   if(q.length<2||q.length>70||/[<>]/.test(q))return fail('Search needs 2–70 valid characters');
   path='/data/wow/search/item';namespace='static';params['name.'+LOCALE[region]]=q;params._pageSize=20;params._page=1;
  }else if((type==='character'||type==='equipment')&&p.length===5&&slug.test(arg)&&name.test(arg2)){
   path='/profile/wow/character/'+arg+'/'+arg2+(type==='equipment'?'/equipment':'');namespace='profile';
  }else return fail('Unknown or invalid API route',404);
  try{
   const r=await blizzard(env,region,path,namespace,params);
   if(r.error)return fail(r.error===404?'Blizzard record not found':r.error===429?'Blizzard rate limit reached':'Blizzard request unavailable',r.error===404?404:r.error===429?429:502);
   let data=r.data;
   if(type==='search'){
    data={query:u.searchParams.get('q'),items:(Array.isArray(data.results)?data.results:[]).map(row=>({id:Number(row?.data?.id),name:nameOf(row?.data?.name,region),quality:nameOf(row?.data?.quality?.name,region),level:row?.data?.level??null})).filter(row=>Number.isSafeInteger(row.id)&&row.id>0&&row.name).slice(0,20),page:data.page||1};
   }
   if(type==='media'){
    data={id:Number(arg),assets:(Array.isArray(data.assets)?data.assets:[]).filter(a=>a&&a.key&&typeof a.value==='string'&&/^https:\/\//.test(a.value)).slice(0,10).map(a=>({key:a.key,url:a.value}))};
   }
   return json({success:true,source:'Blizzard Battle.net API',region,fetchedAt:new Date().toISOString(),data});
  }catch(error){console.error('Blizzard upstream unavailable');return fail('Blizzard upstream temporarily unavailable',502)}
 }
};