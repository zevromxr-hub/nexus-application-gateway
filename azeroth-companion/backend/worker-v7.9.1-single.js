/* NEXUS | AZEROTH v7.9.1 — OWNER CLOUDFARE SINGLE-FILE DEPLOY
 * Preserve BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET, AZEROTH_SESSION_SECRET as encrypted secrets.
 * Based on v4 verification bridge; review v7.9.1 deployment guide before replacing live Worker.
 */
/* NEXUS | AZEROTH COMPANION v3.3 — Cloudflare single-file deployment.
 * Preserve encrypted BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET, AZEROTH_SESSION_SECRET.
 * Copy the entire source. Never paste credential values into this file.
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
const PAGE="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><title>NEXUS | My Azeroth</title><style>:root{color-scheme:dark;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;background:#0b1120;color:#eaf1f2}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 4%,#442d6a60,transparent 40%),radial-gradient(circle at 2% 5%,#205b6260,transparent 35%),#0b1120;min-height:100vh}main{max-width:1050px;padding:32px 18px 80px;margin:auto}h1{font-size:clamp(29px,5vw,46px);margin:8px 0 15px}h1 b{color:#d9b27a}h2{font-size:19px;margin:0 0 10px}.kicker{letter-spacing:2px;color:#cfaf87;font-size:11px;font-weight:bold}.muted{color:#adbdca;line-height:1.6;font-size:13px}.panel{border:1px solid #ba96575c;background:#152237ed;border-radius:17px;padding:19px;margin:16px 0}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.between{justify-content:space-between}.button,button{display:inline-block;border:1px solid #d2ae786c;border-radius:11px;background:#283c54;color:#f5f0df;font:700 12px system-ui;padding:11px 15px;text-decoration:none;cursor:pointer}.primary{color:#23180c;background:#d9b27a;border:0}.danger{border-color:#bd7777}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:11px}.item{border:1px solid #ffffff20;border-radius:11px;padding:13px;background:#ffffff06;min-width:0}.item strong,.item small{display:block}.item strong{font-size:14px;color:#ecdbb5}.item small{font-size:11px;color:#b6cad1;margin:7px 0}.status{font-size:13px;line-height:1.5;color:#a8dfc9;margin:8px 0}select{background:#0d1b30;border:1px solid #ffffff56;border-radius:9px;color:white;padding:10px;width:180px}footer{font-size:11px;color:#8d9bad;margin-top:30px}a{color:#d6d6f0}@media(max-width:620px){main{padding:22px 13px 40px}.panel{padding:14px}.button,button{min-height:42px}}</style><script defer src=\"/account/app.js\"></script></head><body><main><div class=\"kicker\">NEXUS | AZEROTH COMPANION</div><h1>My <b>Azeroth</b></h1><p class=\"muted\">Your personal World of Warcraft dashboard. Sign in directly through Blizzard, using this Cloudflare-hosted secure page instead of third-party cookies.</p><div class=\"panel\"><div class=\"row between\"><div><h2>Battle.net Connection</h2><div id=\"connection\" class=\"status\">Checking connection…</div></div><div class=\"row\"><a class=\"button\" href=\"https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/\">PUBLIC COMPANION</a><form method=\"POST\" action=\"/auth/logout\" id=\"disconnect\"><button type=\"submit\" class=\"danger\">DISCONNECT</button></form></div></div><div class=\"row\" id=\"logins\"><label for=\"region\">Account region</label><select id=\"region\"><option value=\"us\">Americas</option><option value=\"eu\">Europe</option><option value=\"kr\">Korea</option><option value=\"tw\">Taiwan</option></select><button id=\"connect\" class=\"primary\" type=\"button\">CONNECT BATTLE.NET</button></div><p class=\"muted\">Read-only permission: <b>wow.profile</b>. The portal never asks for passwords, never puts tokens in URL links, and does not automatically change your game account. Sessions expire after an hour or sooner if Blizzard revokes access.</p></div><section class=\"panel\" id=\"charactersPanel\" hidden><div class=\"row between\"><h2>My Characters</h2><button type=\"button\" data-reload=\"characters\">REFRESH</button></div><p id=\"charactersStatus\" class=\"muted\"></p><div id=\"characters\" class=\"grid\"></div></section><section class=\"panel\" id=\"gearPanel\" hidden><div class=\"row between\"><div><h2>Equipped Gear Intelligence</h2><p class=\"muted\">Select one of your listed characters to see Blizzard-reported equipped gear. This is not bag storage, bank inventory, or real-time item ownership. Data can lag behind the game.</p></div></div><div class=\"row\"><label for=\"gearCharacter\">Account character</label><select id=\"gearCharacter\"><option value=\"\">Choose a character</option></select><button id=\"gearRefresh\" type=\"button\">LOAD EQUIPMENT</button></div><p class=\"status\" id=\"gearStatus\">Select a character to load equipped gear.</p><div class=\"grid\" id=\"gearItems\"></div></section><section class=\"panel\" id=\"intelligencePanel\" hidden><div class=\"row between\"><h2>Collection Intelligence</h2><button type=\"button\" id=\"intelligenceRefresh\">VERIFY MOUNTS</button></div><p class=\"muted\">Compare selected mounts against your private Blizzard account collection. No personal data is sent to the public companion. This is not an item inventory check.</p><p id=\"intelligenceStatus\" class=\"status\">Not checked yet.</p><div id=\"intelligenceTargets\" class=\"grid\"></div></section><section class=\"panel\" id=\"collectionsPanel\" hidden><div class=\"row between\"><h2>My Collections</h2><button type=\"button\" data-reload=\"collections\">REFRESH</button></div><p class=\"muted\">Blizzard periodically updates its data. Counts do not represent live in-game inventory or farming activity.</p><div id=\"collections\" class=\"grid\"></div></section><footer>Powered by ZevRo Development | NEXUS · Unofficial fan-made World of Warcraft companion. <a href=\"/account/privacy\">Privacy &amp; security</a></footer></main></body></html>";
const PRIVACY="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"referrer\" content=\"no-referrer\"><title>My Azeroth Privacy</title><style>body{background:#0d1421;color:#e3eaf0;font:16px/1.65 system-ui;margin:0}main{max-width:800px;margin:auto;padding:30px 20px}a{color:#e9ca8d}h1,h2{color:#f0dcac}</style></head><body><main><h1>NEXUS | My Azeroth — Privacy</h1><p>An unofficial fan-made World of Warcraft tool, not affiliated with Blizzard Entertainment.</p><h2>What is accessed</h2><p>With your consent, we request Blizzard's <code>wow.profile</code> scope to read character lists, mounts and pets that Blizzard makes available to your account and selected region. Your Battle.net password is never handled by this tool.</p><h2>How sessions work</h2><p>The Cloudflare Worker encrypts your Blizzard access token inside a Secure, HttpOnly, SameSite=Lax session cookie on the Worker's own domain. No tokens are placed in GitHub Pages, browser localStorage, analytics or redirect URLs. Sessions expire when Blizzard's issued OAuth token expires, up to 24 hours. The application has no database for this personal data, though your browser, Blizzard and Cloudflare may process network requests and operational logs under their respective policies.</p><h2>Disconnect and revocation</h2><p>Disconnect removes the session cookie from your browser. You can revoke access in Battle.net's account security settings. The separate public companion keeps its own browser-local manual plans and is unaffected by disconnecting.</p><h2>Limitations</h2><p>Account data may lag behind gameplay. The portal is read-only and cannot move items, change talents, or control your game account.</p><p><a href=\"/account\">Return to My Azeroth</a></p></main></body></html>";
const CLIENT="(()=>{'use strict';\nconst $=id=>document.getElementById(id);\nconst el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};\nconst say=(id,text)=>{$(id).textContent=text};\nasync function get(path){const res=await fetch(path,{cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});const v=await res.json().catch(()=>null);if(!v)throw Error('Account service returned an unreadable response');if(!res.ok)throw Error(v.message||'Account request failed');return v}\n$('connect').addEventListener('click',()=>{const r=$('region').value;if(['us','eu','kr','tw'].includes(r))location.href='/auth/start?region='+encodeURIComponent(r)});\nasync function showCharacters(){\n say('charactersStatus','Loading character index from Blizzard…');$('characters').replaceChildren();\n try{const data=await get('/api/me/characters');const chars=data.characters||[];say('charactersStatus',chars.length+' character(s) reported in '+data.region.toUpperCase());window.nxAccountCharacters=chars;const gear=$('gearCharacter');const old=gear.value;gear.replaceChildren(el('option','','Choose a character'));for(let i=0;i<chars.length;i++){const option=el('option','',chars[i].name+' · '+chars[i].realm);option.value=String(i);gear.append(option)}if(chars[Number(old)]&&old!=='')gear.value=old;\n for(const ch of chars){const card=el('div','item'),name=el('strong','',ch.name),meta=el('small','',ch.realm+' · Level '+ch.level+' · '+ch.className),a=el('a','button','OPEN IN PUBLIC ARMORY');const q=new URLSearchParams({armory_region:data.region,armory_realm:ch.realmSlug,armory_name:ch.name.toLowerCase()});a.href='https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/?'+q;a.rel='noopener noreferrer';card.append(name,meta,a);$('characters').append(card)}}catch(e){say('charactersStatus',e.message)}\n}\nasync function showCollections(){\n $('collections').replaceChildren();for(const kind of ['mounts','pets']){const card=el('div','item'),name=el('strong','',kind==='mounts'?'Mounts':'Pets'),status=el('small','','Loading…');card.append(name,status);$('collections').append(card);\n try{const data=await get('/api/me/collections/'+kind);status.textContent=data.total+' Blizzard entries'+(data.sample.length?' · examples: '+data.sample.slice(0,6).map(x=>x.name).join(', '):'')}catch(e){status.textContent=e.message}}}\nasync function showCollectionIntelligence(){\n say('intelligenceStatus','Checking private Blizzard mount collection…');$('intelligenceTargets').replaceChildren();\n try{const result=await get('/api/me/collection-intelligence');const items=result.targets||[];\n say('intelligenceStatus',items.filter(x=>x.status==='reported-owned').length+' / '+items.length+' curated mounts reported owned. '+result.notice);\n for(const item of items){const card=el('div','item'),name=el('strong','',item.mountName),status=el('small','',item.status==='reported-owned'?'REPORTED OWNED by Blizzard':'NOT CONFIRMED in Blizzard response'),note=el('small','',item.itemName+' · Item #'+item.itemId);card.append(name,status,note);$('intelligenceTargets').append(card)}\n }catch(e){say('intelligenceStatus','Ownership unavailable: '+e.message+'. No missing/owned conclusions can be made.')}\n}\n$('intelligenceRefresh').addEventListener('click',showCollectionIntelligence);\nasync function showGear(){\n const i=Number($('gearCharacter').value),arr=window.nxAccountCharacters||[];\n if($('gearCharacter').value===''||!Number.isSafeInteger(i)||!arr[i]){say('gearStatus','Choose one of your account characters.');return}\n const ch=arr[i];$('gearItems').replaceChildren();say('gearStatus','Checking equipped gear reported by Blizzard…');\n try{const q=new URLSearchParams({realm:ch.realmSlug,name:ch.name});const data=await get('/api/me/equipment?'+q);\n const items=Array.isArray(data.items)?data.items:[];say('gearStatus',ch.name+' · '+items.length+' equipped slot(s) returned by Blizzard. Last fetched: '+new Date().toLocaleTimeString()+'. Not a live inventory scan.');\n for(const item of items){const card=el('div','item'),slot=el('strong','',item.slot||'Equipped slot'),name=el('small','',(item.name||'Item')+' · #'+item.id+(item.level?' · ilvl '+item.level:''));card.append(slot,name);$('gearItems').append(card)}\n }catch(e){say('gearStatus','Equipment unavailable: '+e.message+'. This does not prove the character has no gear.')}\n}\n$('gearRefresh').addEventListener('click',showGear);\ndocument.querySelectorAll('[data-reload]').forEach(b=>b.addEventListener('click',()=>b.dataset.reload==='characters'?showCharacters():showCollections()));\n(async()=>{try{const status=await get('/api/me/status');if(!status.connected)throw Error('No session');$('logins').hidden=true;$('disconnect').hidden=false;say('connection','Connected to Blizzard · '+status.region.toUpperCase()+' · Read-only session');$('charactersPanel').hidden=false;$('gearPanel').hidden=false;$('collectionsPanel').hidden=false;$('intelligencePanel').hidden=false;await Promise.allSettled([showCharacters(),showCollections(),showCollectionIntelligence()])}catch(_){$('logins').hidden=false;$('disconnect').hidden=true;say('connection','Not connected. Choose your region and connect through Blizzard.')}})();\n})();";

const COLLECTION_TARGETS=[{mountName:'Invincible',itemName:"Invincible's Reins",itemId:50818},{mountName:"Ashes of Al'ar",itemName:"Ashes of Al'ar",itemId:32458}];
const foldMount=x=>String(x??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-US');
function matchOwnedMounts(rows){
 const known=new Set((Array.isArray(rows)?rows:[]).map(x=>foldMount(x?.mount?.name)).filter(Boolean));
 return COLLECTION_TARGETS.map(t=>({itemId:t.itemId,itemName:t.itemName,mountName:t.mountName,status:known.has(foldMount(t.mountName))?'reported-owned':'not-confirmed'}));
}


// v7.9.1 additive personal collection explorer. The existing OAuth login and gear panel remain unchanged.
const PAGE_791=PAGE_V4.replace('<footer>',"<section class=\"panel\" id=\"unlocksPanel\" hidden><div class=\"row between\"><div><h2>My Unlocks & Collections</h2><p class=\"muted\">Read-only Blizzard-reported mounts, pets, toys, heirlooms, and character achievements. Results can lag behind the game. These are not bag items or currencies.</p></div></div><div class=\"row\"><label for=\"unlockKind\">Collection</label><select id=\"unlockKind\"><option value=\"mounts\">Mounts</option><option value=\"pets\">Battle pets</option><option value=\"toys\">Toys</option><option value=\"heirlooms\">Heirlooms</option><option value=\"achievements\">Completed achievements (selected character)</option></select><button id=\"unlockLoad\" type=\"button\">LOAD MY UNLOCKS</button></div><div class=\"row\"><label for=\"unlockSearch\">Find unlock</label><input id=\"unlockSearch\" type=\"search\" maxlength=\"100\" placeholder=\"Search returned names\" style=\"min-height:42px;max-width:260px;background:#0d1b30;color:white;border:1px solid #ffffff56;border-radius:9px;padding:10px\"></div><div class=\"status\" id=\"unlocksStatus\" role=\"status\">Choose a collection and load it on demand.</div><div class=\"grid\" id=\"unlocksList\"></div><p class=\"muted\">Account collection results are read-only and may vary by region. A missing entry is not conclusive proof you have not unlocked it.</p></section><section class=\"panel\"><h2>Inventory & Currency Coverage</h2><p class=\"muted\">Your real equipped gear appears above. Complete bag contents, bank slots and character currency balances are not exposed by these Battle.net web endpoints. For those, an optional user-controlled in-game addon export would be needed; we do not invent balances or claim full inventory access.</p><p class=\"muted\">Your public companion's manual planners and backups remain saved separately even if Battle.net authentication expires. Reconnecting does not wipe them.</p></section>"+'<footer>')
 .replace('Sessions expire after an hour or sooner if Blizzard revokes access.','A session can last up to 24 hours, but only for as long as Blizzard grants a valid access token. Reconnect when authorization expires.');
const CLIENT_791=CLIENT_V4.replace('\n(async()=>{',"\n\nlet unlockData=[];\nfunction drawUnlocks(){\n const q=$('unlockSearch').value.trim().toLowerCase(),matching=unlockData.filter(x=>String(x.name||'').toLowerCase().includes(q)||String(x.id??'').includes(q));\n const host=$('unlocksList');host.replaceChildren();\n for(const item of matching.slice(0,120)){\n  const card=el('div','item'),name=el('strong','',item.name||'Unnamed unlock'),id=el('small','',item.id?'Official ID #'+item.id:'Blizzard did not supply an ID');card.append(name,id);host.append(card)\n }\n say('unlocksStatus',unlockData.length+' entries received · '+matching.length+' matching · showing '+Math.min(120,matching.length)+'; no full inventory or currency balances.');\n}\nasync function showUnlocks(){\n const kind=$('unlockKind').value;\n say('unlocksStatus','Requesting '+kind+' from Blizzard…');$('unlocksList').replaceChildren();unlockData=[];\n try{\n  let path='/api/me/unlocks/'+kind;\n  if(kind==='achievements'){\n   const selected=$('gearCharacter').value,ch=(window.nxAccountCharacters||[])[Number(selected)];\n   if(selected===''||!ch)throw Error('Select one of your characters above first.');\n   path='/api/me/achievements?'+new URLSearchParams({realm:ch.realmSlug,name:ch.name});\n  }\n  const data=await get(path);\n  unlockData=Array.isArray(data.items)?data.items:[];\n  drawUnlocks();\n  say('unlocksStatus',data.total+' Blizzard-reported '+kind+' · '+(data.truncated?'Partial list returned; ':'')+'last fetched '+new Date(data.fetchedAt).toLocaleTimeString()+'. Showing up to 120 matching items; search by name or ID.');\n }catch(e){say('unlocksStatus','Unlocks unavailable: '+e.message+'. Missing data is not proof of missing ownership.')}\n}\n$('unlockLoad').addEventListener('click',showUnlocks);\n$('unlockSearch').addEventListener('input',drawUnlocks);\n\n(async()=>{")
 .replace("$('intelligencePanel').hidden=false;","$('intelligencePanel').hidden=false;$('unlocksPanel').hidden=false;")
 .replace("Connected to Blizzard · '+status.region.toUpperCase()+' · Read-only session","Connected to Blizzard · '+status.region.toUpperCase()+' · about '+Math.ceil((status.remainingSeconds||0)/60)+' minutes remaining");

const callback=u=>u.origin+'/auth/callback';
// v4 maintained deployment reference for the verified v3.8.1 Cloudflare session bridge.
// The live Worker must be updated deliberately; committing this reference does NOT deploy it.
// No Blizzard client secrets or encrypted session keys belong in this file.
const PAGE_V4=PAGE.replace('<form method="POST" action="/auth/logout" id="disconnect">','<a class="button primary" id="verifiedReturn" href="/account/verify-companion" hidden>VERIFY &amp; RETURN</a><form method="POST" action="/auth/logout" id="disconnect">');
const CLIENT_V4=CLIENT.replace("$('logins').hidden=true;","$('verifiedReturn').hidden=false;$('logins').hidden=true;").replace("$('logins').hidden=false;","$('verifiedReturn').hidden=true;$('logins').hidden=false;");
// OAuth token validity must not be inferred from WoW character data; even a brand-new
// Battle.net account can have a valid identity and zero game characters.
async function validateBlizzardSession(session,env){
 const res=await fetch('https://oauth.battle.net/check_token',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},
  body:new URLSearchParams({token:session.token}),signal:AbortSignal.timeout(12000)
 });
 if(res.status===400||res.status===401||res.status===403)return {valid:false};
 if(!res.ok)throw Error('OAuth validation temporarily unavailable');
 const details=await res.json();
 if(!details||typeof details!=='object'||details.client_id!==env.BLIZZARD_CLIENT_ID)return {valid:false};
 const scopes=Array.isArray(details.scope)?details.scope.join(' '):String(details.scope||'');
 if(!scopes.split(/\s+/).includes('wow.profile'))return {valid:false};
 if(details.expires_in!==undefined&&(!Number.isFinite(Number(details.expires_in))||Number(details.expires_in)<=0))return {valid:false};
 return {valid:true};
}
async function fromBlizzard(token,region,path){const u=new URL('https://'+region+'.api.blizzard.com'+path);u.searchParams.set('namespace','profile-'+region);u.searchParams.set('locale',LOCALES[region]);const r=await fetch(u,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok){if(r.status===401||r.status===403)throw {status:401,message:'Authorization expired or unavailable. Reconnect your Battle.net account.'};if(r.status===404)throw {status:404,message:'No account data returned in this region.'};if(r.status===429)throw {status:429,message:'Blizzard rate limit reached.'};throw {status:502,message:'Blizzard account API unavailable.'}}return r.json()}
function publicChar(ch){const name=String(ch?.name||'').slice(0,60),realmSlug=String(ch?.realm?.slug||'').toLowerCase(),realm=String(ch?.realm?.name||realmSlug).slice(0,80);if(!/^[a-z0-9-]{2,80}$/.test(realmSlug)||!name)return null;return{name,realm,realmSlug,level:Number(ch?.level)||0,className:String(ch?.playable_class?.name||'Unknown class').slice(0,75)}}
async function handlePersonal(request,env,url){
 const path=url.pathname;
 if(path==='/account')return page(PAGE_791,'text/html; charset=utf-8');
 if(path==='/account/privacy')return page(PRIVACY,'text/html; charset=utf-8');
 if(path==='/account/app.js')return page(CLIENT_791,'text/javascript; charset=utf-8');
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
   const age=Math.min(86400,Math.max(1,Math.floor(Number(d.expires_in)||3600))); // Browser session never outlives Blizzard's OAuth token
   const session=await seal(env,{token:d.access_token,region,exp:Date.now()+age*1000});
   return redirect('/account',[clear,cookie(SESSION,session,age)]);
  }catch(_){return redirect('/account?error=upstream',[clear])}
 }
 if(path==='/auth/logout'){
  if(request.method!=='POST')return response({message:'Method not allowed'},405);
  const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return response({message:'Invalid origin'},403);
  return redirect('/account',[cookie(SESSION,'',0),cookie(STATE,'',0)]);
 }

 // First-party Worker session → short-lived private status receipt; never share access tokens.
 if(path==='/account/verify-companion'){
  if(request.method!=='GET')return response({message:'Method not allowed'},405);
  const destination='https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/';
  const session=await unseal(env,value(request,SESSION));
  if(!session||typeof session.token!=='string'||!Object.hasOwn(LOCALES,session.region))return redirect(destination+'#nxverify=disconnected');
  try{
   const check=await validateBlizzardSession(session,env);
   if(!check.valid)return redirect(destination+'#nxverify=disconnected');
   const checkedAt=Date.now();
   const proof=await seal(env,{purpose:'azeroth-companion-status-v1',aud:destination,region:session.region,verifiedAt:checkedAt,exp:Math.min(checkedAt+1800000,Number(session.exp))});
   return redirect(destination+'#nxverify='+encodeURIComponent(proof));
  }catch(_){return redirect(destination+'#nxverify=unavailable')}
 }
 if(path==='/api/companion/verify'){
  const origin=request.headers.get('origin');
  const headers={...jheaders,'access-control-allow-origin':'https://zevromxr-hub.github.io','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'Content-Type, Accept','vary':'Origin'};
  const out=(obj,code=200)=>new Response(JSON.stringify(obj),{status:code,headers});
  if(origin!=='https://zevromxr-hub.github.io')return response({success:false,message:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return out({success:false,message:'Method not allowed'},405);
  let body;try{if(Number(request.headers.get('content-length')||0)>10000)throw Error('Large request');body=await request.json()}catch(_){return out({success:false,message:'Invalid request'},400)}
  const ticket=body?.ticket;
  if(typeof ticket!=='string'||ticket.length<20||ticket.length>6000)return out({success:false,message:'Invalid verification ticket'},400);
  const claim=await unseal(env,ticket);
  if(!claim||claim.purpose!=='azeroth-companion-status-v1'||claim.aud!=='https://zevromxr-hub.github.io/nexus-application-gateway/azeroth-companion/'||!Object.hasOwn(LOCALES,claim.region)||!Number.isSafeInteger(claim.verifiedAt)||claim.verifiedAt>Date.now()+10000||Date.now()-claim.verifiedAt>1800000||claim.exp>claim.verifiedAt+1800000)return out({success:false,message:'Verification expired or invalid'},401);
  return out({success:true,connected:true,region:claim.region,verifiedAt:claim.verifiedAt,validUntil:claim.exp});
 }
 if(!path.startsWith('/api/me/'))return response({message:'No such route'},404);
 if(request.method!=='GET')return response({message:'Method not allowed'},405);
 const session=await unseal(env,value(request,SESSION));
 if(!session||typeof session.token!=='string'||!Object.hasOwn(LOCALES,session.region))return response({success:false,message:'Not connected or session expired.'},401);
 if(path==='/api/me/status')return response({connected:true,region:session.region,remainingSeconds:Math.max(0,Math.floor((Number(session.exp)-Date.now())/1000))});
 try{
  if(path==='/api/me/characters'){
   const d=await fromBlizzard(session.token,session.region,'/profile/user/wow');
   const chars=(Array.isArray(d.wow_accounts)?d.wow_accounts:[]).flatMap(x=>Array.isArray(x.characters)?x.characters:[]).map(publicChar).filter(Boolean).slice(0,250);
   return response({success:true,region:session.region,characters:chars});
  }
  if(path==='/api/me/equipment'){
   const realm=(url.searchParams.get('realm')||'').toLowerCase();
   const name=(url.searchParams.get('name')||'').toLowerCase();
   if(!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))return response({message:'Invalid character selector'},400);
   // Restrict the private account endpoint to a character actually returned by this Battle.net user's account.
   const account=await fromBlizzard(session.token,session.region,'/profile/user/wow');
   const authorized=(Array.isArray(account.wow_accounts)?account.wow_accounts:[]).flatMap(x=>Array.isArray(x.characters)?x.characters:[]).some(c=>String(c?.realm?.slug||'').toLowerCase()===realm&&String(c?.name||'').toLowerCase()===name);
   if(!authorized)return response({success:false,message:'Character not found on this authorized Battle.net account.'},403);
   const d=await fromBlizzard(session.token,session.region,'/profile/wow/character/'+realm+'/'+name+'/equipment');
   if(!Array.isArray(d.equipped_items))return response({success:false,message:'Blizzard did not return a usable equipment record.'},502);
   const items=d.equipped_items.slice(0,36).map(x=>({
    id:Number(x?.item?.id)||0,
    name:String(x?.name||x?.item?.name||'Equipped item').slice(0,140),
    slot:String(x?.slot?.name||x?.slot?.type||'Gear slot').slice(0,80),
    level:Number(x?.level?.value)||null
   })).filter(x=>Number.isSafeInteger(x.id)&&x.id>0);
   return response({success:true,region:session.region,character:{name,realm},source:'Blizzard character equipment',items,notice:'Equipped items only. No bags, banks, or real-time inventory monitoring.'});
  }

  // Protected account unlock explorer. Nothing is persisted or exposed to GitHub Pages.
  if(path.startsWith('/api/me/unlocks/')){
   const kind=path.slice('/api/me/unlocks/'.length);
   if(!['mounts','pets','toys','heirlooms'].includes(kind))return response({message:'Unsupported collection'},404);
   const d=await fromBlizzard(session.token,session.region,'/profile/user/wow/collections/'+kind);
   if(!Array.isArray(d[kind]))return response({success:false,message:'Blizzard did not return a usable '+kind+' collection.'},502);
   const entries=d[kind],items=entries.slice(0,1800).map(x=>{
    const entity=x?.mount||x?.species||x?.toy||x?.heirloom||x;
    const id=Number(entity?.id);
    const name=String(entity?.name||x?.name||'Unnamed '+kind.slice(0,-1)).slice(0,120);
    return {id:Number.isSafeInteger(id)&&id>0?id:null,name};
   });
   return response({success:true,region:session.region,kind,source:'Blizzard account collection',total:entries.length,items,truncated:entries.length>items.length,fetchedAt:new Date().toISOString()});
  }
  if(path==='/api/me/achievements'){
   const realm=String(url.searchParams.get('realm')||'').toLowerCase(),name=String(url.searchParams.get('name')||'').toLowerCase();
   if(!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))return response({message:'Select a valid character.'},400);
   const account=await fromBlizzard(session.token,session.region,'/profile/user/wow');
   const authorized=(Array.isArray(account.wow_accounts)?account.wow_accounts:[]).flatMap(x=>Array.isArray(x.characters)?x.characters:[])
    .some(ch=>String(ch?.realm?.slug||'').toLowerCase()===realm&&String(ch?.name||'').toLowerCase()===name);
   if(!authorized)return response({success:false,message:'Character not on this authorized account.'},403);
   const d=await fromBlizzard(session.token,session.region,'/profile/wow/character/'+realm+'/'+name+'/achievements');
   if(!Array.isArray(d.achievements))return response({success:false,message:'Blizzard did not return achievement progress.'},502);
   const entries=d.achievements.filter(x=>x?.completed_timestamp!==undefined||x?.completed===true);
   const items=entries.slice(0,1800).map(x=>({id:Number.isSafeInteger(Number(x.achievement?.id))?Number(x.achievement.id):null,name:String(x.achievement?.name||'Achievement').slice(0,120)}));
   return response({success:true,region:session.region,kind:'achievements',source:'Blizzard character achievements',character:{realm,name},total:entries.length,items,truncated:entries.length>items.length,fetchedAt:new Date().toISOString()});
  }
  if(path==='/api/me/collection-intelligence'){
   const d=await fromBlizzard(session.token,session.region,'/profile/user/wow/collections/mounts');
   if(!Array.isArray(d.mounts))return response({success:false,message:'Blizzard did not return a usable mount collection. No ownership conclusions were made.'},502);
   return response({success:true,region:session.region,collection:'mounts',source:'Blizzard account mount collection',matchedBy:'exact normalized mount name',checked:d.mounts.length,targets:matchOwnedMounts(d.mounts),notice:'Reported owned means the exact mount name appears in the authorized Blizzard collection. Not confirmed is not proof of missing ownership. Item acquisition is not validated.'});
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

/* NEXUS Azeroth API v3.3 — Cloudflare Workers module
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
  if(u.pathname==='/account'||u.pathname==='/account/privacy'||u.pathname==='/account/app.js'||u.pathname.startsWith('/auth/')||u.pathname.startsWith('/api/me/')||u.pathname==='/account/verify-companion'||u.pathname==='/api/companion/verify')return handlePersonal(request,env,u);
  if(request.method==='OPTIONS')return json({ok:true});
  if(request.method!=='GET')return fail('Method not allowed',405);
  if(u.pathname==='/'||u.pathname==='/health')return json({application:'NEXUS | AZEROTH COMPANION',service:'Blizzard API Gateway',version:'3.8.1',status:'online',credentialsConfigured:Boolean(env.BLIZZARD_CLIENT_ID&&env.BLIZZARD_CLIENT_SECRET),personalPortalConfigured:Boolean(env.AZEROTH_SESSION_SECRET&&String(env.AZEROTH_SESSION_SECRET).length>=32)});
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
   const page=Number(u.searchParams.get('page')||1);if(!Number.isSafeInteger(page)||page<1||page>50)return fail('Search page must be 1–50');
   path='/data/wow/search/item';namespace='static';params['name.'+LOCALE[region]]=q;params._pageSize=20;params._page=page;
  }else if((type==='character'||type==='equipment')&&p.length===5&&slug.test(arg)&&name.test(arg2)){
   path='/profile/wow/character/'+arg+'/'+arg2+(type==='equipment'?'/equipment':'');namespace='profile';
  }else return fail('Unknown or invalid API route',404);
  try{
   const r=await blizzard(env,region,path,namespace,params);
   if(r.error)return fail(r.error===404?'Blizzard record not found':r.error===429?'Blizzard rate limit reached':'Blizzard request unavailable',r.error===404?404:r.error===429?429:502);
   let data=r.data;
   if(type==='search'){
    data={query:u.searchParams.get('q'),items:(Array.isArray(data.results)?data.results:[]).map(row=>({id:Number(row?.data?.id),name:nameOf(row?.data?.name,region),quality:nameOf(row?.data?.quality?.name,region),level:row?.data?.level??null})).filter(row=>Number.isSafeInteger(row.id)&&row.id>0&&row.name).slice(0,20),page:Number(data.page)||1,pageCount:Number(data.pageCount)||1,resultCount:Number(data.resultCount)||0,resultCountCapped:Boolean(data.resultCountCapped),pageSize:Number(data.pageSize)||20};
   }
   if(type==='media'){
    data={id:Number(arg),assets:(Array.isArray(data.assets)?data.assets:[]).filter(a=>a&&a.key&&typeof a.value==='string'&&/^https:\/\//.test(a.value)).slice(0,10).map(a=>({key:a.key,url:a.value}))};
   }
   return json({success:true,source:'Blizzard Battle.net API',region,fetchedAt:new Date().toISOString(),data});
  }catch(error){console.error('Blizzard upstream unavailable');return fail('Blizzard upstream temporarily unavailable',502)}
 }
};