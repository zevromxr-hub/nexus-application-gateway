/* NEXUS | AZEROTH v14 — BUILD ARCHITECT PURE INTELLIGENCE
 * Source-reported relationships + manual build records only.
 * No game legality, DPS, optimization or prerequisite assertions.
 * No external calls and no storage access.
 */
(()=>{'use strict';
const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const id=x=>{const n=Number(x);return Number.isSafeInteger(n)&&n>0&&n<=9999999999?n:null};
const map=raw=>{
 const out=Object.create(null);
 if(!isObj(raw))return out;
 for(const [k,v] of Object.entries(raw).slice(0,450)){
  if(!/^[1-9]\d{0,11}$/.test(k))continue;
  const n=Number(v);
  if(Number.isInteger(n)&&n>=0&&n<=100)out[k]=n;
 }
 return out;
};
const validIdentity=x=>typeof x==='string'&&x.length>0&&x.length<=145;
function trace(snapshot,target,maxDepth=3){
 const start=id(target),edges=Array.isArray(snapshot?.linkEdges)?snapshot.linkEdges.slice(0,900):[];
 const known=new Set((Array.isArray(snapshot?.catalog)?snapshot.catalog:[]).map(x=>id(x.id)).filter(Boolean));
 if(!start||!known.has(start))return {target:start,inbound:[],outbound:[],unresolved:0,depth:0};
 const depth=Math.max(1,Math.min(5,Number(maxDepth)||3));
 const adjacency=(reverse)=>{
  const result=new Map();
  for(const edge of edges){
   const from=id(edge?.from),to=id(edge?.to);
   if(!from||!to||!known.has(from)||!known.has(to))continue;
   const source=reverse?to:from,neighbor=reverse?from:to;
   if(!result.has(source))result.set(source,[]);
   result.get(source).push(neighbor);
  }
  const seen=new Set([start]),queue=[[start,0]],found=[];
  for(let i=0;i<queue.length&&i<450;i++){
   const [cur,step]=queue[i];if(step>=depth)continue;
   for(const next of result.get(cur)||[]){
    if(seen.has(next))continue;
    seen.add(next);found.push({id:next,steps:step+1});
    queue.push([next,step+1]);
   }
  }
  return found;
 };
 const unresolved=edges.filter(x=>x?.resolved===false).length;
 return {target:start,inbound:adjacency(true),outbound:adjacency(false),unresolved,depth};
}
function compare(a,b,catalog=[]){
 const out={compatible:false,reason:'',changes:[],totals:{a:0,b:0,added:0,removed:0,changedNodes:0,choiceChanges:0}};
 if(!a||!b||!validIdentity(a.identity)||a.identity!==b.identity){
  out.reason='Different or missing source tree identities. Rank differences cannot be reliably compared.';
  return out;
 }
 out.compatible=true;
 const am=map(a.rankByNode),bm=map(b.rankByNode),ac=map(a.choiceByNode),bc=map(b.choiceByNode);
 const lookup=new Map((Array.isArray(catalog)?catalog:[]).map(n=>[String(n.id),n]));
 const keys=[...new Set([...Object.keys(am),...Object.keys(bm),...Object.keys(ac),...Object.keys(bc)])];
 for(const key of keys){
  const x=am[key]||0,y=bm[key]||0;
  const chA=ac[key]??0,chB=bc[key]??0;
  out.totals.a+=x;out.totals.b+=y;
  if(y>x)out.totals.added+=y-x;
  if(x>y)out.totals.removed+=x-y;
  if(x!==y||chA!==chB){
   out.totals.changedNodes++;
   if(chA!==chB)out.totals.choiceChanges++;
   out.changes.push({id:Number(key),name:String(lookup.get(key)?.name||'Source ID #'+key).slice(0,100),a:x,b:y,choiceA:chA,choiceB:chB,category:String(lookup.get(key)?.category||'unknown')});
  }
 }
 out.changes.sort((x,y)=>Math.abs(y.b-y.a)-Math.abs(x.b-x.a)||x.id-y.id);
 return out;
}
function integrity(snapshot,record){
 const findings=[],catalog=Array.isArray(snapshot?.catalog)?snapshot.catalog:[];
 const known=new Map(catalog.filter(x=>id(x.id)).map(x=>[String(x.id),x]));
 if(!snapshot?.ready){findings.push({level:'info',code:'SOURCE_UNAVAILABLE',text:'No live Blizzard source tree loaded; comparison with current data cannot run.'});return findings}
 if(!record||!validIdentity(record.identity)||record.identity!==snapshot.identity){
  findings.push({level:'warning',code:'TREE_IDENTITY',text:'Saved build identity does not match the currently loaded specialization/tree.'});
  return findings;
 }
 for(const [rawId,rawRank]of Object.entries(map(record.rankByNode))){
  const value=Number(rawRank),n=known.get(rawId);
  if(!n){findings.push({level:'warning',code:'UNKNOWN_NODE',nodeId:Number(rawId),text:'Node #'+rawId+' is missing from the current source catalog.'});continue}
  const max=Number(n.max);
  if(Number.isInteger(max)&&max>=0&&value>max){
   findings.push({level:'warning',code:'RANK_ABOVE_SOURCE',nodeId:Number(rawId),text:'Node #'+rawId+' has '+value+' stored ranks; the current source reports a maximum of '+max+'.'});
  }
 }
 const unresolved=(Array.isArray(snapshot.linkEdges)?snapshot.linkEdges:[]).filter(x=>x?.resolved===false).length;
 if(unresolved)findings.push({level:'info',code:'SOURCE_LINKS',text:unresolved+' source-reported link(s) point to node IDs not included in the returned catalog.'});
 if(!findings.length)findings.push({level:'info',code:'NO_OBVIOUS_MISMATCH',text:'No obvious ID or rank-limit mismatches found in the available source response. This does not verify an in-game-valid build.'});
 return findings.slice(0,80);
}
const draftKey=d=>[String(d?.identity||'').slice(0,145),String(d?.savedAt||'').slice(0,50),String(d?.name||'').slice(0,100)].join('::');
window.NexusBuildArchitectCore=Object.freeze({map,trace,compare,integrity,draftKey});
})();