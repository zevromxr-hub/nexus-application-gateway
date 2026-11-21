/* NEXUS | AZEROTH v23.0 — WORLD DISCOVERY ASCENSION.
   One search, one result rail, one map. Local source index + existing markers.
   No false spawn heatmaps, invented loot rates, character ownership or interiors.
   No modification of user data, Blizzard credentials or Cloudflare routes. */
(()=>{'use strict';
window.NexusAtlasV23=true;
const map=window.NexusRealMapDiscoveryV223,root=document.getElementById('nx221RealAtlas');
if(!map||!root)return;
const $=id=>document.getElementById(id),el=(tag,cls,txt)=>{
 const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e};
const input=$('nx221Search'),original=$('nx221PlacesList'),categories=$('nx221Types'),sidebar=root.querySelector('.nx221-places');
if(!input||!sidebar||!original||!categories)return;
const state={mode:'all',query:'',selected:null,results:[]};
const modes=[['all','Everything'],['instances','Dungeons & raids'],['loot','Loot & items'],['gathering','Gathering'],['travel','Travel'],['places','Places']];
const data=[
 {id:'nerubar',kind:'Raid',name:'Nerub-ar Palace',zone:'azj-kahet',pin:'catalog-0',details:'Raid entrance. Eight documented encounters; rewards depend on difficulty.',source:'https://www.wowhead.com/dungeon-journal/nerub-ar-palace',bosses:['Ulgrax the Devourer','The Bloodbound Horror','Sikran, Captain of the Sureki',"Rasha'nan","Broodtwister Ovi'nax","Nexus-Princess Ky'veza","The Silken Court","Queen Ansurek"]},
 {id:'stonevault',kind:'Dungeon',name:'The Stonevault',zone:'ringing-deeps',pin:'catalog-0',details:'Dungeon entrance. Four documented encounters.',source:'https://www.wowhead.com/dungeon-journal/the-stonevault',bosses:['E.D.N.A.','Skarmorak','Master Machinists','Void Speaker Eirich']},
 {id:'priory',kind:'Dungeon',name:'Priory of the Sacred Flame',zone:'hallowfall',pin:'catalog-1',details:'Dungeon entrance. Three documented encounters.',source:'https://www.wowhead.com/dungeon-journal/priory-of-the-sacred-flame',bosses:['Captain Dailcry','Baron Braunpyke','Prioress Murrpray']},
 {id:'item-refractor',kind:'Item',name:'Augmented Refractor Cannon',zone:'ringing-deeps',pin:'catalog-0',details:'Sample loot reference: E.D.N.A. · The Stonevault. Verify current reward difficulty at source.',source:'https://www.wowhead.com/guide/the-war-within/dungeons/the-stonevault-overview',itemQuery:'Augmented Refractor Cannon',bosses:['E.D.N.A.']},
 {id:'item-fist',kind:'Item',name:"Eirich's Fist of Deception",zone:'ringing-deeps',pin:'catalog-0',details:'Sample loot reference: Void Speaker Eirich · The Stonevault. Check the full journal for difficulty variants.',source:'https://www.wowhead.com/guide/the-war-within/dungeons/the-stonevault-overview',itemQuery:"Eirich's Fist of Deception",bosses:['Void Speaker Eirich']},
 {id:'thunderfury',kind:'Item',name:'Thunderfury, Blessed Blade of the Windseeker',details:'Legacy legendary quest chain involving Molten Core and Silithus; source not mapped in current in-page coverage.',source:'https://warcraft.wiki.gg/wiki/Thunderfury,_Blessed_Blade_of_the_Windseeker',itemId:19019},
 {id:'invincible',kind:'Item',name:"Invincible's Reins",details:'Legacy mount source: The Lich King · Icecrown Citadel · 25-player Heroic. Entrance not yet supported in-page.',source:'https://www.wowhead.com/item=50818',itemId:50818},
 {id:'ashes',kind:'Item',name:"Ashes of Al'ar",details:"Legacy mount source: Kael'thas Sunstrider · The Eye. Entrance not yet mapped in-page.",source:'https://www.wowhead.com/item=32458',itemId:32458},
 {id:'shadowmourne',kind:'Item',name:'Shadowmourne',details:'Legacy Ashen Verdict raid quest chain in Icecrown Citadel. Entrance not yet mapped in-page.',source:'https://www.wowhead.com/item=49623',itemId:49623}
];
const zones=map.catalog;
const regionPins=zones.flatMap(z=>z.points.map(p=>{
 const gather=/^Abundance:/i.test(p.title),travel=p.kind==='Flight'||/portal|rootway/i.test(p.title),
  instance=['Raid','Dungeon','Delve'].includes(p.kind);
 return {id:'map-'+z.id+'-'+p.id,kind:p.kind,name:p.title,zone:z.id,pin:p.id,mapId:z.mapId,x:p.x,y:p.y,
  details:z.name+' · UI Map '+z.mapId+' · X '+p.x.toFixed(1)+' / Y '+p.y.toFixed(1)+
   (gather?' · documented Abundance location, NOT a resource spawn guarantee':''),
  source:z.source,group:gather?'gathering':travel?'travel':instance?'instances':'places',zoneName:z.name};
}));
const bossRows=data.filter(d=>d.bosses).flatMap(d=>d.bosses.map(b=>({
 id:'boss-'+d.id+'-'+b,kind:'Boss',name:b,zone:d.zone,pin:d.pin,
 details:'Encounter within '+(d.kind==='Item'?'The Stonevault':d.name)+'. Outdoor entrance is mapped; interior boss positions are not.',
 source:d.source,group:'instances',parent:d.name})));
const items=data.filter(d=>d.kind==='Item').map(d=>({...d,group:'loot'}));
const instances=data.filter(d=>['Raid','Dungeon'].includes(d.kind)).map(d=>({...d,group:'instances'}));
const entries=[...regionPins,...instances,...bossRows,...items];
const categoryFor=p=>p.group||'places';
function match(p,q){
 if(!q)return true;
 const hay=[p.name,p.zoneName,p.details,p.kind,p.parent,p.bosses?.join(' ')].filter(Boolean).join(' ').toLocaleLowerCase();
 const tokens=q.toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const synonym={dungeons:'dungeon',raids:'raid',delves:'delve',herbalism:'herb',mining:'mining',gear:'item',mounts:'mount',farming:'abundance',farms:'abundance',portals:'portal'};
 return tokens.every(t=>hay.includes(t)||hay.includes(synonym[t]||t));
}
function allowed(p){return state.mode==='all'||state.mode===categoryFor(p)||
  (state.mode==='instances'&&['Raid','Dungeon','Delve','Boss'].includes(p.kind))}
const header=el('div','nx230-searchbar');
header.innerHTML='<strong>WORLD DISCOVERY / v23.0</strong><span>Verified catalog · one map</span>';
const chips=el('div','nx230-chips');
const status=el('p','nx230-status','');
status.setAttribute('role','status');
const results=el('div','nx230-results');results.id='nx230Results';
const detail=el('section','nx230-detail');detail.id='nx230Detail';detail.hidden=true;
const more=el('div','nx230-more');
const full=el('a','nx230-full','FULL ITEM / BOSS DATABASE ↗');full.href='https://www.wowhead.com/';full.rel='noopener noreferrer';full.target='_blank';
const learn=el('p','nx230-trust','Verified map markers and a small curated item/encounter index. Not real-time spawn tracking, complete loot coverage or an interior dungeon map.');
more.append(full,learn);
sidebar.insertBefore(header,input);
input.after(chips,status,results,detail,more);
original.hidden=true;categories.hidden=true;
const oldBoss=$('nx224EncounterResults');if(oldBoss)oldBoss.hidden=true;
const oldWrap=sidebar.querySelector('.nx223-discovery');if(oldWrap)oldWrap.hidden=true;
const originalSelected=$('nx221Selected');if(originalSelected)originalSelected.hidden=true;
const count=$('nx221Count');
input.placeholder='Search item, boss, dungeon, raid, farm, portal…';
input.setAttribute('aria-label','Search across Azeroth map points, bosses, loot and collection sources');
function renderChips(){
 chips.replaceChildren();
 for(const [id,label] of modes){
  const b=el('button','nx230-chip',label);b.type='button';b.setAttribute('aria-pressed',String(state.mode===id));
  b.addEventListener('click',()=>{state.mode=id;draw()});chips.append(b);
 }
}
function sourceAnchor(url,label){
 const a=el('a','nx230-link',label+' ↗');
 a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function openMap(p){
 if(!p.zone||!map.catalog.some(z=>z.id===p.zone))return false;
 return map.open(p.zone,p.pin||undefined);
}
function select(p){
 state.selected=p;detail.hidden=false;detail.replaceChildren();
 const head=el('div','nx230-detailhead');
 head.append(el('span','',p.kind.toUpperCase()),el('strong','',p.name));
 detail.append(head,el('p','nx230-description',p.details||'Catalog reference. Confirm details from the source.'));
 const actions=el('div','nx230-actions');
 if(p.zone){
  const b=el('button','nx230-primary','SHOW ON MAP');b.type='button';
  b.addEventListener('click',()=>{
   if(openMap(p)){
    // The existing map selects the verified entrance, not the indoor boss position.
    const existing=$('nx221Selected');
    const selectedInfo=$('nx221SelectedInfo')?.textContent||'';
    const exact=Boolean(p.pin)&&selectedInfo.includes('UI Map');
    const line=el('p','nx230-note',exact?'Mapped outdoor entrance selected. Use COPY GAME PIN below.':'Mapped zone selected; no precise game coordinate available for this result.');
    detail.querySelector('.nx230-note')?.remove();detail.append(line);
    if(existing)existing.hidden=false;
    $('nx221MapViewport')?.scrollIntoView({behavior:'smooth',block:'nearest'});
   }
  });actions.append(b);
 }
 actions.append(sourceAnchor(p.source,'RESEARCH SOURCE'));
 if(p.itemId){
  actions.append(sourceAnchor('https://www.wowhead.com/item='+p.itemId,'ITEM DETAILS'));
  const hand=el('a','nx230-link','OPEN ITEM CODEX ↗');hand.href='./?enter=1&view=atlas';actions.append(hand);
 }
 if(p.kind==='Boss'||p.kind==='Raid'||p.kind==='Dungeon'){
  actions.append(sourceAnchor('https://www.wowhead.com/search?q='+encodeURIComponent(p.name),'LOOT & ENCOUNTERS'));
 }
 if(p.kind==='Dungeon'||p.kind==='Raid'||p.kind==='Boss'){
  const note=el('p','nx230-note','Interior floors are not plotted on the outdoor map. Use the sourced encounter/journal reference for boss locations and loot.');detail.append(note);
 }
 detail.append(actions);
 detail.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function draw(){
 renderChips();results.replaceChildren();
 let found=entries.filter(p=>allowed(p)&&match(p,state.query));
 if(!state.query&&state.mode==='all')found=regionPins.filter(x=>x.zone===map.current()).slice(0,16);
 else found=found.slice(0,65);
 state.results=found;
 count.textContent=found.length+(found.length===65?'+':'')+' RESULTS';
 status.textContent=state.query?
  found.length+' source-index matches · '+zones.length+' in-page maps · no guessed pins':
  state.mode==='all'?'Displaying current-zone locations; search to explore across Azeroth.':
  'Showing '+found.length+' curated '+state.mode+' references';
 full.href='https://www.wowhead.com/search?q='+encodeURIComponent(state.query||({loot:'items equipment',gathering:'gathering professions',instances:'dungeons raids',travel:'flight masters',places:'locations'}[state.mode]||'world of warcraft'));
 for(const p of found){
  const b=el('button','nx230-result');b.type='button';
  const left=el('span','nx230-resultcontent');
  left.append(el('strong','',p.name),el('small','',p.zoneName||p.parent||p.details?.slice(0,78)||'Research reference'));
  b.append(left,el('span','nx230-kind',p.kind));
  b.addEventListener('click',()=>select(p));
  results.append(b);
 }
 if(!found.length){
  results.append(el('p','nx230-empty','No verified entries yet. Open the full database to research this query; we will not invent a map position.'));
 }
}
$('nx221ZoneTabs')?.addEventListener('click',()=>{if(!state.query&&state.mode==='all')queueMicrotask(draw)});
$('nx221PinLayer')?.addEventListener('click',e=>{if(e.target.closest('button')){const old=$('nx221Selected');if(old)old.hidden=false;}});
input.addEventListener('input',()=>{state.query=input.value.trim().slice(0,100);draw()});
input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';state.query='';draw()}});
const params=new URLSearchParams(location.search);const find=params.get('find');
if(find&&find.length<=100){input.value=find;state.query=find}
draw();
window.NexusWorldDiscoveryV23=Object.freeze({search:q=>{input.value=String(q).slice(0,100);state.query=input.value;draw();input.focus()},counts:()=>({zones:zones.length,mapPoints:regionPins.length,encounters:bossRows.length,items:items.length}),open:openMap});
})();