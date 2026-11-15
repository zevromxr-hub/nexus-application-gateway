/* NEXUS Azeroth Companion Talent Path Analysis 2.7.
 * Pure read-only analysis of Blizzard-provided locked_by references.
 * A linked node with zero planned points is not proof a talent is inaccessible in-game.
 * No prerequisite, tier, hero, level or import-string validation is claimed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentPaths=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 function idOf(ref){
   const candidate=typeof ref==='object'&&ref!==null?(ref.id??ref.node_id):ref;
   const id=Number(candidate);
   return Number.isSafeInteger(id)&&id>0?id:null;
 }
 function analyze(nodes,draft){
   const list=Array.isArray(nodes)?nodes.filter(n=>n&&idOf(n.id)!==null):[];
   const byId=new Map(list.map(n=>[idOf(n.id),n]));
   const edges=[],unresolved=[],seen=new Set();
   for(const node of list){
     const to=idOf(node.id);
     if(!Array.isArray(node.locked_by))continue;
     for(const reference of node.locked_by){
       const from=idOf(reference);
       if(from===null||from===to)continue;
       const key=from+':'+to;
       if(seen.has(key))continue;
       seen.add(key);
       if(byId.has(from))edges.push({from,to});
       else unresolved.push({from,to});
     }
   }
   const ranks=draft&&typeof draft==='object'?draft:{};
   const points=id=>Number.isSafeInteger(ranks[String(id)])&&ranks[String(id)]>0?ranks[String(id)]:0;
   const flagged=edges.filter(link=>points(link.to)>0&&points(link.from)===0);
   const satisfied=edges.filter(link=>points(link.to)>0&&points(link.from)>0);
   const planned=list.filter(node=>points(idOf(node.id))>0);
   const summary={
     nodes:list.length,
     linked:edges.length,
     unresolved:unresolved.length,
     planned:planned.length,
     flagged:flagged.length,
     satisfied:satisfied.length
   };
   function details(id){
     const number=idOf(id);
     if(number===null)return null;
     const incoming=edges.filter(link=>link.to===number);
     const outgoing=edges.filter(link=>link.from===number);
     const outside=unresolved.filter(link=>link.to===number);
     return{
       id:number,points:points(number),
       incoming:incoming.map(link=>({id:link.from,points:points(link.from)})),
       outgoing:outgoing.map(link=>({id:link.to,points:points(link.to)})),
       unresolved:outside.map(link=>link.from)
     };
   }
   function ancestors(id,maxDepth=16){
     const target=idOf(id),result=[],visited=new Set([target]),queue=[{id:target,depth:0}];
     if(target===null||!byId.has(target))return result;
     while(queue.length&&result.length<300){
       const current=queue.shift();
       if(current.depth>=maxDepth)continue;
       for(const edge of edges){
         if(edge.to!==current.id||visited.has(edge.from))continue;
         visited.add(edge.from);result.push({id:edge.from,depth:current.depth+1,points:points(edge.from)});
         queue.push({id:edge.from,depth:current.depth+1});
       }
     }
     return result;
   }
   return{summary,edges,unresolved,flagged,satisfied,details,ancestors};
 }
 return{analyze};
});
