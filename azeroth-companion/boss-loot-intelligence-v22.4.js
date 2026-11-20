/* NEXUS v22.4 — sourced encounter-to-entrance research.
   Bosses live INSIDE instances; entrance coordinates are the only map pins.
   A curated index, not live loot, drop odds or personalized eligibility. */
(()=>{'use strict';
const bridge=window.NexusRealMapDiscoveryV223,side=document.querySelector('#nx221RealAtlas .nx221-places'),
 input=document.getElementById('nx221Search');
if(!bridge||!side||!input)return;
const records=[
 {name:'Nerub-ar Palace',type:'Raid',zone:'azj-kahet',pin:'catalog-0',
 source:'https://www.wowhead.com/dungeon-journal/nerub-ar-palace',
 bosses:['Ulgrax the Devourer','The Bloodbound Horror','Sikran, Captain of the Sureki',"Rasha'nan","Broodtwister Ovi'nax","Nexus-Princess Ky'veza","The Silken Court","Queen Ansurek"],items:[]},
 {name:'The Stonevault',type:'Dungeon',zone:'ringing-deeps',pin:'catalog-0',
 source:'https://www.wowhead.com/dungeon-journal/the-stonevault',
 bosses:['E.D.N.A.','Skarmorak','Master Machinists','Void Speaker Eirich'],
 items:[{name:'Augmented Refractor Cannon',boss:'E.D.N.A.',source:'https://www.wowhead.com/guide/the-war-within/dungeons/the-stonevault-overview'},
 {name:"Eirich's Fist of Deception",boss:'Void Speaker Eirich',source:'https://www.wowhead.com/guide/the-war-within/dungeons/the-stonevault-overview'}]},
 {name:'Priory of the Sacred Flame',type:'Dungeon',zone:'hallowfall',pin:'catalog-1',
 source:'https://www.wowhead.com/dungeon-journal/priory-of-the-sacred-flame',
 bosses:['Captain Dailcry','Baron Braunpyke','Prioress Murrpray'],items:[]}
];
const make=(tag,cls,content)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=String(content);return n};
const host=make('div','nx224-encounters');host.id='nx224EncounterResults';host.setAttribute('aria-label','Boss and sample loot source results');
const title=make('div','nx224-intro');
const list=make('div','nx224-list');host.append(title,list);
const listHost=document.getElementById('nx221PlacesList');
listHost?.after(host);
const safe=(value)=>String(value||'').trim().toLocaleLowerCase().slice(0,80);
const words=(q)=>q.split(/\s+/).filter(Boolean);
function jump(r){
 bridge.open(r.zone,r.pin);
 const selected=document.getElementById('nx221Selected');
 selected?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function external(url,label){
 const link=make('a','nx224-source',label+' ↗');link.href=url;link.target='_blank';link.rel='noopener noreferrer';return link
}
function card(r,match){
 const item=make('article','nx224-card');
 const header=make('div','nx224-card-head');
 header.append(make('strong','',r.name),make('span','nx224-kind',r.type));
 item.append(header);
 const details=make('p','nx224-muted',match?match:'Verified encounter directory · entrance marked on the outdoor zone map');
 item.append(details);
 const actions=make('div','nx224-actions');
 const go=make('button','nx224-jump','SHOW INSTANCE ENTRANCE');go.type='button';go.addEventListener('click',()=>jump(r));actions.append(go,external(r.source,'BOSSES & LOOT'));
 item.append(actions);
 return item;
}
function render(raw,category){
 const q=safe(raw),tokens=words(q),hasSearch=!!q;
 const relevant=category==='all'||category==='instances'||category==='other';
 const items=records.flatMap(r=>r.items.map(i=>({r,i})));
 const matches=records.flatMap(r=>{
  const common=(r.name+' '+r.type).toLowerCase();
  const hits=r.bosses.filter(b=>tokens.every(w=>(b+' '+common+' boss raid dungeon encounter loot').toLowerCase().includes(w)));
  const loot=items.filter(v=>v.r===r&&tokens.every(w=>(v.i.name+' '+v.i.boss+' '+common+' loot gear weapon item drop').toLowerCase().includes(w)));
  const self=tokens.every(w=>(common+' boss raid dungeon loot drops equipment gear').includes(w));
  if(!relevant)return [];
  if(!hasSearch)return category==='instances'?[{r,match:'Encounter index · '+r.bosses.length+' named bosses'}]:[];
  if(!self&&!hits.length&&!loot.length)return [];
  return [{r,match:loot.length?'Sample documented loot: '+loot.map(v=>v.i.name+' ('+v.i.boss+')').join('; '):
   hits.length?'Matching boss: '+hits.join(', '):r.bosses.length+' known encounters'}];
 });
 host.hidden=!matches.length;
 title.replaceChildren();list.replaceChildren();
 if(!matches.length)return;
 title.append(make('strong','','BOSS & LOOT INTELLIGENCE'),make('small','',matches.length+' matching instance'+(matches.length===1?'':'s')+' · curated source index'));
 matches.forEach(hit=>list.append(card(hit.r,hit.match)));
 const note=make('p','nx224-disclaimer','Only outdoor instance entrances are mapped. Boss positions, loot probabilities, class eligibility and current difficulty-specific rewards are not inferred. Open the journal source to confirm complete loot.');
 list.append(note);
}
window.NexusBossLootV224=Object.freeze({render,recordCount:records.length,openInstance:name=>{
 const r=records.find(x=>x.name===name);if(!r)return false;jump(r);return true;
}});
render('', 'all');
})();
