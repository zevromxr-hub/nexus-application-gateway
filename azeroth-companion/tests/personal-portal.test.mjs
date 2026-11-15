import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=await readFile(new URL('../backend/personal-portal.js',import.meta.url),'utf8');
const moduleURL='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const {handlePersonal}=await import(moduleURL);
const domain='https://nexus-azeroth-api.zevromxr.workers.dev';
const env={BLIZZARD_CLIENT_ID:'fake-id',BLIZZARD_CLIENT_SECRET:'fake-secret',AZEROTH_SESSION_SECRET:'this-is-a-test-secret-value-longer-than-32-characters-and-random'};
const call=(path,cookie='',method='GET',origin='')=>{const req=new Request(domain+path,{method,headers:{...(cookie?{cookie}:{}),...(origin?{origin}:{})}});return handlePersonal(req,env,new URL(req.url))};
const cookies=res=>typeof res.headers.getSetCookie==='function'?res.headers.getSetCookie():[res.headers.get('set-cookie')||''];
const cookiePair=(res,prefix)=>cookies(res).map(x=>x.split(';')[0]).find(x=>x.startsWith(prefix+'='));
const extract=(res,k)=>new URL(res.headers.get('location')).searchParams.get(k);

let res=await call('/account');assert.equal(res.status,200);assert.match(await res.text(),/My Azeroth/);assert.ok(!res.headers.get('access-control-allow-origin'));
res=await call('/api/me/status');assert.equal(res.status,401);
res=await call('/api/me/characters');assert.equal(res.status,401);
res=await call('/auth/logout','','GET');assert.equal(res.status,405);
res=await call('/auth/logout','','POST','https://attacker.example');assert.equal(res.status,403);

const invalid=await call('/auth/callback?code=wrong&state=us.missing');assert.equal(invalid.status,303);assert.match(invalid.headers.get('location'),/invalid-state/);

const start=await call('/auth/start?region=us');
assert.equal(start.status,303);
const oauth=new URL(start.headers.get('location'));
assert.equal(oauth.hostname,'oauth.battle.net');
assert.equal(oauth.searchParams.get('scope'),'wow.profile');
assert.equal(oauth.searchParams.get('redirect_uri'),domain+'/auth/callback');
const state=oauth.searchParams.get('state');
assert.ok(state&&state.startsWith('us.'));
const stateCookie=cookiePair(start,'__Host-nx_bnet_state');
assert.ok(stateCookie&&cookies(start).some(x=>/HttpOnly/.test(x)&&/SameSite=Lax/.test(x)&&/Secure/.test(x)));
const wrong=await call('/auth/callback?code=test-code&state=us.wrong',stateCookie);assert.match(wrong.headers.get('location'),/invalid-state/);

const original=globalThis.fetch;
const requests=[];
globalThis.fetch=async(url,options)=>{
 requests.push({url:String(url),options});
 if(String(url)==='https://oauth.battle.net/token')return new Response(JSON.stringify({access_token:'example-very-private-token-never-put-in-response',expires_in:3600}),{status:200,headers:{'content-type':'application/json'}});
 if(String(url).endsWith('/profile/user/wow?namespace=profile-us&locale=en_US'))return new Response(JSON.stringify({wow_accounts:[{characters:[{name:'Knight',realm:{slug:'area-52',name:'Area 52'},level:80,playable_class:{name:'Paladin'}}]}]}),{status:200});
 if(String(url).includes('/collections/mounts'))return new Response(JSON.stringify({mounts:[{mount:{name:'Ashes of Alar'}}]}),{status:200});
 if(String(url).includes('/collections/pets'))return new Response(JSON.stringify({pets:[{species:{name:'Companion Pet'}}]}),{status:200});
 throw Error('Unexpected remote endpoint '+url);
};
try{
 const callback=await call('/auth/callback?code=test-code&state='+encodeURIComponent(state),stateCookie);
 assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),'/account');
 const session=cookiePair(callback,'__Host-nx_bnet_session');
 assert.ok(session,'Encrypted account session cookie must be issued');
 assert.ok(!session.includes('example-very-private-token'),'Plain tokens must never appear in cookie values');
 assert.ok(cookies(callback).some(x=>/Max-Age=3600/.test(x)));
 const status=await call('/api/me/status',session);assert.equal(status.status,200);assert.equal((await status.json()).region,'us');
 const chars=await call('/api/me/characters',session);assert.equal(chars.status,200);assert.equal((await chars.json()).characters[0].realmSlug,'area-52');
 const mounts=await call('/api/me/collections/mounts',session);assert.equal((await mounts.json()).total,1);
 const pets=await call('/api/me/collections/pets',session);assert.equal((await pets.json()).total,1);
 assert.ok(!chars.headers.get('access-control-allow-origin'),'Private routes must not expose cross-origin CORS access');
 assert.ok(requests.find(x=>x.url.includes('/profile/user/wow')).options.headers.Authorization.startsWith('Bearer '));
 const logout=await call('/auth/logout',session,'POST',domain);assert.equal(logout.status,303);assert.ok(cookies(logout).some(x=>x.startsWith('__Host-nx_bnet_session=;')&&x.includes('Max-Age=0')));
 const afterLogout=await call('/api/me/status');assert.equal(afterLogout.status,401);
}finally{globalThis.fetch=original}

// Ensure legacy API methods survive Worker route wiring. No credentials in browser sources.
const worker=await readFile(new URL('../backend/worker.js',import.meta.url),'utf8');
assert.match(worker,/import \{handlePersonal\} from '\.\/personal-portal\.js'/);
new vm.Script(worker.replace(/^import .*?;\s*/,'').replace('export default','const worker ='));
for(const route of ["type==='item'","type==='character'",'talent-index','talent-tree',"type==='search'","type==='media'"])assert.ok(worker.includes(route),'Original public API route must remain: '+route);
const frontend=await readFile(new URL('../personal-azeroth.js',import.meta.url),'utf8');new vm.Script(frontend);
assert.ok(!frontend.includes('BLIZZARD_CLIENT_SECRET'));
console.log('My Azeroth private portal validation passed: state, cookies, secure authorization, collections, compatibility.');
