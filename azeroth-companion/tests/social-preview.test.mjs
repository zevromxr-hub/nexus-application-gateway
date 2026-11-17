/* NEXUS | Social Preview contract — Discord reads static HTML, not JS redirects.
 * Guard the branded apex preview, Companion cards and the preserved desktop launcher.
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const asset='azeroth-companion/assets/zevro-wide-banner-v9.2.webp';
const imageUrl='https://zevarchives.com/'+asset;
const cases=[
  ['index.html','https://zevarchives.com/'],
  ['azeroth-companion/index.html','https://zevarchives.com/azeroth-companion/'],
  ['azeroth-companion/citadel-entry.html','https://zevarchives.com/azeroth-companion/citadel-entry.html']
];
const imagePath=join(repoRoot,asset);
assert.ok(existsSync(imagePath),'The linked social preview art is missing');
const bytes=readFileSync(imagePath);
assert.equal(bytes.toString('ascii',0,4),'RIFF');
assert.equal(bytes.toString('ascii',8,12),'WEBP');
assert.equal(bytes.toString('ascii',12,16),'VP8 ');
assert.equal(bytes.readUInt16LE(26)&0x3fff,2172,'Update og:image:width when the art is changed');
assert.equal(bytes.readUInt16LE(28)&0x3fff,724,'Update og:image:height when the art is changed');

for(const [filename,url] of cases){
 const html=readFileSync(join(repoRoot,filename),'utf8');
 const head=html.split('</head>')[0];
 assert.ok(html.includes('</head>'),filename+' needs an HTML head');
 for(const [key,value] of [
   ['og:title','NEXUS | AZEROTH COMPANION'],
   ['og:site_name','NEXUS | AZEROTH COMPANION'],
   ['og:type','website'],
   ['og:url',url],
   ['og:image',imageUrl],
   ['og:image:secure_url',imageUrl],
   ['og:image:type','image/webp'],
   ['og:image:width','2172'],
   ['og:image:height','724']
 ]){
   assert.ok(head.includes('<meta property="'+key+'" content="'+value+'">'),filename+' incorrect '+key);
 }
 assert.match(head, /<meta property="og:description" content="[^"]{60,240}">/,filename+' missing concise social description');
 assert.ok(head.includes('<meta name="twitter:card" content="summary_large_image">'),filename+' missing large image layout');
 assert.ok(!head.includes('og:title" content="PROXIMUS'),filename+' still announces desktop launcher');
}
const apex=readFileSync(join(repoRoot,'index.html'),'utf8');
assert.ok(apex.includes('nexusDesktopLaunch'), 'Keep root ?launch=1 legacy app launch behavior');
assert.ok(apex.includes("location.replace('/azeroth-companion/'"), 'Keep branded apex routing');
assert.ok(existsSync(join(repoRoot,'sonic-reactor-ii/index.html')),'Dedicated Sonic Reactor II must not be removed');
console.log('NEXUS social cards: three pages, existing art, apex routing, and legacy desktop launcher validated.');
