// PROXIMUS Token Foundry v2.8 — WebCrypto and portable vault regression checks.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {
 VAULT_SCHEMA,FILE_SCHEMA,KDF_ROUNDS,createSecureToken,base32,tokenDigest,newEncryptedVault,
 makeRecord,evaluateToken,recordState,sealInventory,openEncryptedVault,
 inventoryCSV,inventoryTXT,inventoryStats,normalizeInventory,maskedToken
} from '../token-crypto.js';

const sample=createSecureToken('NEXUS',256);
assert.match(sample,/^NEXUS-[A-Z2-9-]+$/);
assert.equal(sample.split('-')[0],'NEXUS');
assert.ok(sample.length>=60,'Full entropy must be represented');
assert.notEqual(sample,createSecureToken('NEXUS',256),'Independent CSPRNG tokens must differ');
assert.notEqual(sample,createSecureToken('NEXUS',128));
assert.equal(base32(Uint8Array.of(0,1,2)).length,5);
assert.throws(()=>createSecureToken('NX',64),/128/);
const hash=await tokenDigest(sample);
assert.match(hash,/^[0-9a-f]{64}$/);
assert.equal(hash,await tokenDigest(' '+sample.toLowerCase()+' '));
const pass='correct-horse-energy-singularity-storm';
const created=await newEncryptedVault(pass);
assert.equal(created.inventory.schema,VAULT_SCHEMA);
assert.equal(created.envelope.schema,FILE_SCHEMA);
assert.equal(created.envelope.algorithm,'AES-256-GCM');
assert.ok(created.envelope.iterations>=KDF_ROUNDS);
const issued=await makeRecord({prefix:'NEXUS',kind:'access',strength:256,product:'Asset Alchemist',label:'Friend',assignedTo:'Trusted friend',maxUses:2});
created.inventory.records.push(issued);
assert.equal(recordState(issued),'active');
assert.equal((await evaluateToken(created.inventory,issued.code)).ok,true);
assert.equal((await evaluateToken(created.inventory,issued.code,{product:'Other product'})).state,'wrong-product');
assert.equal((await evaluateToken(created.inventory,'NEXUS-FAKE-CODE')).state,'not-found');
let attempt=await evaluateToken(created.inventory,issued.code,{consume:true});
assert.equal(attempt.ok,true);assert.equal(issued.uses,1);
attempt=await evaluateToken(created.inventory,issued.code,{consume:true});
assert.equal(attempt.ok,true);assert.equal(issued.uses,2);
assert.equal(recordState(issued),'exhausted');
assert.equal((await evaluateToken(created.inventory,issued.code,{consume:true})).state,'exhausted');
assert.equal(inventoryStats(created.inventory).exhausted,1);
const seal=await sealInventory(created.inventory,created.key,created.salt);
assert.equal(JSON.stringify(seal).includes(issued.code),false,'Public backup must not contain raw tokens');
assert.equal(JSON.stringify(seal).includes(pass),false,'Backup must never include passphrase');
const unlocked=await openEncryptedVault(JSON.parse(JSON.stringify(seal)),pass);
assert.equal(unlocked.inventory.records[0].code,issued.code);
assert.equal(unlocked.inventory.records[0].uses,2);
await assert.rejects(openEncryptedVault(seal,'completely-incorrect-passphrase'),/Passphrase incorrect/);
const tampered={...seal,ciphertext:seal.ciphertext.replace(/./,ch=>ch==='A'?'B':'A')};
await assert.rejects(openEncryptedVault(tampered,pass),/Passphrase incorrect|malformed/);
assert.equal(normalizeInventory(unlocked.inventory).records.length,1);
assert.throws(()=>normalizeInventory({schema:VAULT_SCHEMA,records:[issued,issued]}),/duplicate/);
assert.equal(maskedToken(issued.code).includes(issued.code),false);
assert.ok(inventoryTXT(unlocked.inventory).includes(issued.code));
assert.ok(inventoryCSV(unlocked.inventory).includes('code,status,type'));
const expired=await makeRecord({prefix:'EXP',kind:'license',expires:'2022-01-01'});
assert.equal(recordState(expired),'expired');
expired.revokedAt=new Date().toISOString();
assert.equal(recordState(expired),'revoked');
console.log('PASS Token Foundry: 256-bit CSPRNG codes, SHA-256 digests, AES-256-GCM portable vault, tamper detection, wrong password, expiration, revocation, usage limits and exports.');
