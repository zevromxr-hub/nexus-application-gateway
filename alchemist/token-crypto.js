// PROXIMUS | ASSET ALCHEMIST — Token Foundry cryptography
// Standalone browser Web Crypto: no external token service, no credential upload.
// 256-bit CSPRNG license/access codes and AES-256-GCM password-sealed inventory.
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EPOCH='1970-01-01T00:00:00.000Z';
export const VAULT_SCHEMA='proximus.token-vault/1';
export const FILE_SCHEMA='proximus.encrypted-token-vault/1';
export const KDF_ROUNDS=310000;
export const TOKEN_TYPES=['license','access','redemption','voucher','test'];
export function cleanPrefix(value){
 const result=String(value??'NX').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);
 if(result.length<2)throw Error('Enter a token prefix of at least two letters or digits.');
 return result;
}
export function base32(bytes){
 let out='',buffer=0,bits=0;
 for(const x of bytes){
  buffer=(buffer<<8)|x;bits+=8;
  while(bits>=5){bits-=5;out+=ALPHABET[(buffer>>>bits)&31];}
  buffer&=(1<<bits)-1;
 }
 if(bits)out+=ALPHABET[(buffer<<(5-bits))&31];
 return out;
}
export function createSecureToken(prefix='NX',bitSize=256){
 if(![128,192,256].includes(bitSize))throw Error('Choose 128, 192 or 256-bit token strength.');
 const random=new Uint8Array(bitSize/8);
 crypto.getRandomValues(random);
 const compact=base32(random);
 const parts=compact.match(/.{1,5}/g)||[];
 return cleanPrefix(prefix)+'-'+parts.join('-');
}
export function normalizeToken(value){return String(value||'').toUpperCase().replace(/\s+/g,'').trim();}
const enc=new TextEncoder(),dec=new TextDecoder();
const toB64=bytes=>{
 let result='';for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.slice(i,i+8192));
 return btoa(result);
};
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function tokenDigest(code){
 const data=enc.encode(normalizeToken(code));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
}
export function newInventory(){
 return {schema:VAULT_SCHEMA,created:new Date().toISOString(),updated:new Date().toISOString(),
  records:[],events:[]};
}
export function scrubRecord(record){
 if(!record||typeof record!=='object'||typeof record.code!=='string'||typeof record.digest!=='string')throw Error('Invalid token record.');
 if(!/^[a-f0-9]{64}$/.test(record.digest))throw Error('Token digest is invalid.');
 return {
  id:String(record.id||'').slice(0,80),code:normalizeToken(record.code),digest:record.digest,
  kind:TOKEN_TYPES.includes(record.kind)?record.kind:'license',
  prefix:cleanPrefix(record.prefix||'NX'),
  label:String(record.label||'').slice(0,120),
  product:String(record.product||'').slice(0,100),
  assignedTo:String(record.assignedTo||'').slice(0,120),
  notes:String(record.notes||'').slice(0,1000),
  strength:[128,192,256].includes(record.strength)?record.strength:256,
  enabled:record.enabled!==false,created:String(record.created||EPOCH).slice(0,40),
  expires:/^\d{4}-\d{2}-\d{2}$/.test(record.expires||'')?record.expires:'',
  maxUses:Math.max(1,Math.min(1000000,Math.floor(Number(record.maxUses)||1))),
  uses:Math.max(0,Math.floor(Number(record.uses)||0)),
  updated:String(record.updated||record.created||EPOCH).slice(0,40),
  revokedAt:record.revokedAt?String(record.revokedAt).slice(0,40):'',
  lastUse:record.lastUse?String(record.lastUse).slice(0,40):''
 };
}
export function normalizeInventory(value){
 if(value?.schema!==VAULT_SCHEMA||!Array.isArray(value.records))throw Error('This file is not a PROXIMUS Token Foundry vault.');
 if(value.records.length>5000)throw Error('Inventory exceeds 5,000 tokens.');
 const records=value.records.map(scrubRecord);
 const uniq=new Set();
 for(const r of records){if(uniq.has(r.digest))throw Error('Inventory contains duplicate token records.');uniq.add(r.digest);}
 return {...newInventory(),created:String(value.created||EPOCH).slice(0,40),
  updated:String(value.updated||EPOCH).slice(0,40),records,
  events:Array.isArray(value.events)?value.events.slice(-450).map(e=>({
   at:String(e.at||EPOCH).slice(0,40),action:String(e.action||'event').slice(0,60),
   token:String(e.token||'').slice(0,80),detail:String(e.detail||'').slice(0,180)
  })):[]
 };
}
export function recordState(record,now=Date.now()){
 if(record.revokedAt)return 'revoked';
 if(!record.enabled)return 'disabled';
 if(record.expires&&Number.isFinite(Date.parse(record.expires+'T23:59:59.999Z'))&&now>Date.parse(record.expires+'T23:59:59.999Z'))return 'expired';
 if(record.uses>=record.maxUses)return 'exhausted';
 return 'active';
}
export function maskedToken(code){
 const s=normalizeToken(code),start=s.split('-')[0];
 return start+'-•••••-•••••-•••••-…-'+s.slice(-5);
}
export function logEvent(inventory,action,record,detail=''){
 inventory.events.push({at:new Date().toISOString(),action,token:record?.id||'',
  detail:String(detail).slice(0,180)});
 inventory.events=inventory.events.slice(-450);
 inventory.updated=new Date().toISOString();
}
export async function makeRecord({prefix='NX',strength=256,kind='license',label='',product='',assignedTo='',notes='',expires='',maxUses=1}={}){
 const code=createSecureToken(prefix,strength),digest=await tokenDigest(code),now=new Date().toISOString();
 return scrubRecord({id:crypto.randomUUID?.()||toB64(crypto.getRandomValues(new Uint8Array(16))),
  code,digest,prefix,kind,label,product,assignedTo,notes,expires,maxUses,uses:0,
  strength,enabled:true,created:now,updated:now,revokedAt:'',lastUse:''});
}
export async function evaluateToken(inventory,value,{consume=false,product=''}={}){
 const digest=await tokenDigest(value);
 const record=inventory.records.find(r=>r.digest===digest);
 if(!record)return {ok:false,state:'not-found'};
 if(product&&record.product&&record.product.toUpperCase()!==String(product).trim().toUpperCase())return {ok:false,state:'wrong-product',record};
 const state=recordState(record);
 if(state!=='active')return {ok:false,state,record};
 if(consume){
  record.uses++;record.lastUse=record.updated=new Date().toISOString();
  logEvent(inventory,'redeemed',record,'Local validation · '+record.uses+'/'+record.maxUses);
 }
 return {ok:true,state:'active',record};
}
function validEnvelope(envelope){
 if(!envelope||envelope.schema!==FILE_SCHEMA||envelope.algorithm!=='AES-256-GCM'||envelope.kdf!=='PBKDF2-SHA256'||
 !Number.isInteger(envelope.iterations)||envelope.iterations<KDF_ROUNDS||
 ![envelope.salt,envelope.iv,envelope.ciphertext].every(x=>typeof x==='string'&&x.length>10))throw Error('This is not a supported encrypted PROXIMUS vault backup.');
 return envelope;
}
export async function deriveVaultKey(passphrase,salt,iterations=KDF_ROUNDS){
 if(typeof passphrase!=='string'||passphrase.length<12)throw Error('Your vault passphrase must be at least 12 characters.');
 const source=await crypto.subtle.importKey('raw',enc.encode(passphrase),'PBKDF2',false,['deriveKey']);
 return await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},
  source,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function sealInventory(inventory,key,salt,iterations=KDF_ROUNDS){
 const normalized=normalizeInventory(inventory),iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(FILE_SCHEMA)},
  key,enc.encode(JSON.stringify(normalized)));
 return {schema:FILE_SCHEMA,algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations,
  salt:toB64(salt),iv:toB64(iv),ciphertext:toB64(new Uint8Array(ciphertext))};
}
export async function newEncryptedVault(passphrase){
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await deriveVaultKey(passphrase,salt);
 const inventory=newInventory(),envelope=await sealInventory(inventory,key,salt);
 return {key,salt,inventory,envelope,iterations:KDF_ROUNDS};
}
export async function openEncryptedVault(input,passphrase){
 const envelope=validEnvelope(input),salt=fromB64(envelope.salt),iv=fromB64(envelope.iv),ciphertext=fromB64(envelope.ciphertext);
 if(salt.length!==16||iv.length!==12||ciphertext.length<18)throw Error('Encrypted vault envelope is malformed.');
 const key=await deriveVaultKey(passphrase,salt,envelope.iterations);
 let plaintext;
 try{plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode(FILE_SCHEMA)},key,ciphertext);}
 catch(e){throw Error('Passphrase incorrect or encrypted vault contents have changed.');}
 let inventory;
 try{inventory=normalizeInventory(JSON.parse(dec.decode(plaintext)));}
 catch(e){throw Error('The decrypted vault data is invalid.');}
 for(const record of inventory.records){
  if(await tokenDigest(record.code)!==record.digest)throw Error('Vault contains a token whose digest does not match its code.');
 }
 return {key,salt,inventory,envelope,iterations:envelope.iterations};
}
export function inventoryCSV(inventory){
 const cols=['code','status','type','product','label','assignedTo','created','expires','uses','maxUses','strength','notes'];
 const escape=v=>{
  let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
 };
 return [cols.join(','),...inventory.records.map(r=>cols.map(c=>escape(c==='status'?recordState(r):c==='type'?r.kind:r[c])).join(','))].join('\r\n')+'\r\n';
}
export function inventoryTXT(inventory){
 return inventory.records.map(r=>r.code+' | '+r.kind+' | '+r.product+' | '+recordState(r)).join('\n')+'\n';
}
export function inventoryStats(inventory){
 const states={active:0,disabled:0,revoked:0,expired:0,exhausted:0};
 for(const r of inventory.records)states[recordState(r)]++;
 return {total:inventory.records.length,...states};
}
