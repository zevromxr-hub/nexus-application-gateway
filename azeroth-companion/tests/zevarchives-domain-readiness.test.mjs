/* NEXUS | ZevArchives domain-readiness acceptance.
 * Exercises both public API origins without Blizzard credentials, network calls, or deployment.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const workerPath=new URL('../backend/worker-v7.9.4-single.js',import.meta.url);
const scriptPath=new URL('../verified-connection.js',import.meta.url);
const source=await readFile(workerPath,'utf8');
const frontend=await readFile(scriptPath,'utf8');
const oldOrigin='https://zevromxr-hub.github.io';
const newOrigin='https://zevarchives.com';
assert.match(frontend,/location\.origin==='https:\/\/zevarchives\.com'/,'New-domain frontend must request a matching signed return');
assert.match(frontend,/\?site=zevarchives/,'The signed return destination must be selected explicitly');
assert.match(source,/const ALLOWED_PUBLIC_ORIGINS=new Set/,'No uncontrolled CORS origin reflection');
assert.match(source,/claim\.aud!==destination/,'Signed receipt must be bound to its exact originating site');
assert.doesNotMatch(source,/localStorage|BLIZZARD_CLIENT_SECRET\s*=\s*['"]/,'No secrets or browser storage may be added to Worker source');
const moduleUrl='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const {default:api}=await import(moduleUrl);
const endpoint='https://nexus-azeroth-api.zevromxr.workers.dev';
async function handle(path,{origin=oldOrigin,method='GET'}={}){
 return api.fetch(new Request(endpoint+path,{method,headers:{origin}}),{});
}
for(const origin of [oldOrigin,newOrigin]){
 const health=await handle('/health',{origin});
 assert.equal(health.status,200,'Public health endpoint should serve '+origin);
 assert.equal(health.headers.get('access-control-allow-origin'),origin,'API CORS should return only the matching trusted origin');
 assert.equal(health.headers.get('vary'),'Origin');
 const preflight=await handle('/api/companion/verify',{origin,method:'OPTIONS'});
 assert.equal(preflight.status,204,'Receipt verification preflight should serve '+origin);
 assert.equal(preflight.headers.get('access-control-allow-origin'),origin,'Receipt CORS should match '+origin);
}
const denied=await handle('/health',{origin:'https://example-evil.invalid'});
assert.equal(denied.status,403,'Unknown origins must be rejected');
assert.equal(denied.headers.get('access-control-allow-origin'),null,'Unknown origins cannot get CORS access');
for(const [site,expected] of [
 ['',oldOrigin+'/nexus-application-gateway/azeroth-companion/'],
 ['?site=zevarchives',newOrigin+'/azeroth-companion/'],
 ['?site=https://example-evil.invalid',oldOrigin+'/nexus-application-gateway/azeroth-companion/']
]){
 const response=await handle('/account/verify-companion'+site);
 assert.equal(response.status,302,'Unauthenticated portal flow must safely redirect');
 const location=response.headers.get('location')||'';
 assert.ok(location.startsWith(expected),'Verification return may target only an allowlisted site: '+location);
}
console.log('PASS ZevArchives staging: legacy and branded origins, exact CORS/audience, no untrusted redirects, no secrets');
