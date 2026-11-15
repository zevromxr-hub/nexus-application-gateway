/* NEXUS | AZEROTH v5.7 — independent, read-only tree analytics.
 * Relations reflect Blizzard locked_by references only. Zero points are review prompts,
 * never proof of a mandatory prerequisite or a game-valid build.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentCommandCore=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const ident=x=>Number.isSafeInteger(Number(x))&&Number(x)>0?Number(x):null;
const rank=(alloc,id)=>{const n=alloc?.[String(id)];return Number.isSafeInteger(n)&&n>0?n:0};
function model(s){
 const catalog=Array.isArray(s?.catalog)?s.catalog.filter(n=>ident(n?.id)!==null).slice(0,900):[];
 const nodes=new Map(catalog.map(n=>[Number(n.id),n]));
 const edges=[],seen=new Set();
 for(const e of Array.isArray(s?.linkEdges)?s.linkEdges:[]){
  const from=ident(e?.from),to=ident(e?.to);
  if(!from||!to||from===to||!nodes.has(to))continue;
  const key=from+':'+to;if(seen.has(key))continue;seen.add(key);
  edges.push({from,to,resolved:nodes.has(from)});
 }
 return{catalog,nodes,edges,allocations:s?.allocations||{}};
}
function audit(s){
 const {catalog,nodes,edges,allocations}=model(s),counts={class:0,spec:0,hero:0},issues=[],review=[];
 let selected=0;
 for(const n of catalog){
  const value=rank(allocations,n.id);
  if(value){selected++;if(Object.hasOwn(counts,n.category))counts[n.category]+=value}
  if(value>Number(n.max||0))issues.push({id:n.id,reason:'Planned rank exceeds the returned rank limit.'});
 }
 for(const [id,value]of Object.entries(allocations).slice(0,900)){
  if(rank(allocations,id)>0&&!nodes.has(Number(id)))issues.push({id:Number(id),reason:'Planned ID not found in returned talent records.'});
 }
 for(const e of edges)if(rank(allocations,e.to)>0){
  if(!e.resolved)review.push({id:e.to,from:e.from,reason:'Source-linked upstream node not included in the returned tree.'});
  else if(rank(allocations,e.from)===0)review.push({id:e.to,from:e.from,reason:'Reported upstream node has zero manually planned points.'});
 }
 return{counts,selected,total:counts.class+counts.spec+counts.hero,issues:issues.slice(0,100),review:review.slice(0,300),returned:catalog.length,links:edges.length};
}
function trace(s,id,maxDepth=18){
 const target=ident(id),{nodes,edges,allocations}=model(s);
 if(!target||!nodes.has(target))return{target:null,levels:[],unresolved:[],cycle:false};
 const visited=new Set([target]),queue=[{id:target,depth:0}],levels=[],unresolved=new Set();let cycle=false;
 while(queue.length&&levels.length<180){
  const now=queue.shift();if(now.depth>=maxDepth)continue;
  for(const edge of edges){
   if(edge.to!==now.id)continue;
   if(!edge.resolved){unresolved.add(edge.from);continue}
   if(visited.has(edge.from)){cycle=true;continue}
   visited.add(edge.from);
   levels.push({id:edge.from,depth:now.depth+1,name:nodes.get(edge.from)?.name||'Node #'+edge.from,points:rank(allocations,edge.from)});
   queue.push({id:edge.from,depth:now.depth+1});
  }
 }
 return{target,levels,unresolved:[...unresolved],cycle};
}
function preview(s,id,step){
 const m=model(s),node=m.nodes.get(ident(id)),delta=Number(step);
 if(!node||![1,-1].includes(delta))return null;
 const current=rank(m.allocations,node.id),maximum=Number(node.max)||0,next=current+delta;
 if(next<0||next>maximum)return null;
 const future={...m.allocations,[String(node.id)]:next},before=audit(s),after=audit({...s,allocations:future});
 return{id:node.id,name:node.name||'Node #'+node.id,from:current,to:next,category:node.category,
  before,after,identity:s.identity||'',kind:'manual preview only'};
}
return{audit,trace,preview};
});
