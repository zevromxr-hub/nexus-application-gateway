// Run from repository root: node alchemist/scripts/bump-version.mjs 2.1.0
// Creates version metadata and updates UI/cache identity. Review changelog before publishing.
import fs from 'node:fs';
import path from 'node:path';
const ver=process.argv[2];
if(!/^\d+\.\d+\.\d+$/.test(ver||'')){console.error('Usage: node alchemist/scripts/bump-version.mjs X.Y.Z');process.exit(2);}
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),write=(p,v)=>fs.writeFileSync(path.join(root,p),v);
const version=JSON.parse(read('version.json'));const previous=version.version;
if(ver===previous){console.error('Version already at '+ver);process.exit(2);}
version.previous_version=previous;version.version=ver;version.release_date=new Date().toISOString().slice(0,10);
write('version.json',JSON.stringify(version,null,2)+'\n');
let html=read('index.html').replaceAll('v'+previous,'v'+ver);write('index.html',html);
let app=read('app.js').replaceAll("LOCAL='"+previous+"'","LOCAL='"+ver+"'").replaceAll('ALCHEMIST v'+previous,'ALCHEMIST v'+ver);write('app.js',app);
let sw=read('sw.js').replaceAll('proximus-alchemist-v'+previous,'proximus-alchemist-v'+ver).replaceAll('Alchemist v'+previous,'Alchemist v'+ver);write('sw.js',sw);
const r={schema:'proximus.alchemist.release/1',brand:'PROXIMUS',name:'Asset Alchemist',version:ver,release_date:version.release_date,status:'pending-validation',channel:version.channel,studios:version.studio_count,branch:'main',path:'alchemist/'};
fs.mkdirSync(path.join(root,'releases'),{recursive:true});write('releases/v'+ver+'.json',JSON.stringify(r,null,2)+'\n');
write('CHANGELOG.md','# PROXIMUS | ASSET ALCHEMIST — Changelog\n\n## v'+ver+' — '+version.release_date+'\n\n- Document features and tests before publication.\n\n'+read('CHANGELOG.md').replace(/^# [^\n]+\n\n/,''));
console.log('Prepared '+ver+'. Run node alchemist/tests/validate.mjs, review changelog, then commit ALL modified files to GitHub.');
