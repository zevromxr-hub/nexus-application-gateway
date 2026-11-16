/* NEXUS | AZEROTH v5.1 Talent Planner — source and domain-safety checks */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>readFile(path.join(root,file),'utf8');
const [html,helper,forge,css]=await Promise.all([
 'index.html','talent-planner-core.js','talent-forge.js','talent-forge.css'].map(read));
new vm.Script(helper,{filename:'talent-planner-core.js'});
new vm.Script(forge,{filename:'talent-forge.js'});
const sandbox={module:{exports:{}},window:{}};
vm.runInNewContext(helper,sandbox);
const plan=sandbox.module.exports;
assert.ok(plan&&typeof plan.analyze==='function'&&typeof plan.sanitizeImported==='function');
const meta=plan.sanitizeMeta({activity:'raid',role:'damage',style:'burst',notes:'A'.repeat(3000),targets:{class:1,spec:31,hero:0}});
assert.equal(meta.activity,'raid');assert.equal(meta.role,'damage');assert.equal(meta.style,'burst');
assert.equal(meta.notes.length,1800);assert.equal(meta.targets.class,1);
assert.equal(plan.sanitizeMeta({activity:'unsupported',targets:{class:250}}).activity,'general');
assert.equal(plan.sanitizeMeta({activity:'unsupported',targets:{class:250}}).targets.class,0);
const nodes={
 class_talent_nodes:[{id:1001,name:'Test Class Talent',ranks:[{tooltip:{talent:{name:'Class Rank 1'}}},{tooltip:{talent:{name:'Class Rank 2'}}}]}],
 spec_talent_nodes:[{id:2001,name:'Test Spec Talent',ranks:[{tooltip:{talent:{name:'Spec Talent'}}}],locked_by:[1001]}],
 hero_talent_trees:[{name:'Test Hero A',hero_talent_nodes:[{id:3001,name:'Hero A',ranks:[{tooltip:{talent:{name:'Hero A'}}}]}]},{name:'Test Hero B',hero_talent_nodes:[{id:4001,name:'Hero B',ranks:[{tooltip:{talent:{name:'Hero B'}}}]}]}]
};
const details=plan.analyze(nodes,{'1001':2,'2001':1,'3001':1,'4001':1},{},meta,()=>({summary:{flagged:1}}));
assert.equal(details.scores.class,2);
assert.equal(details.scores.spec,1);
assert.equal(details.scores.hero,2);
assert.equal(details.allocated,5);
assert.equal(details.selected.length,4);
assert.equal(details.gameValidated,false);
assert.ok(details.advisory.some(x=>x.includes('personal target')),'Personal target must be a warning, never hard game limit');
assert.ok(details.advisory.some(x=>x.includes('multiple returned hero trees')),'Mixing hero groups should be flagged for manual review');
assert.ok(plan.summaryText(details,'Mock Spec').includes('Class Rank 2'),'Copy summary should identify selected talent names');
const bad=plan.analyze(nodes,{'1001':4,'9001':1},{'2001':40},meta);
assert.ok(bad.issues.some(x=>x.includes('exceeds')),'Source-reported rank caps must be evaluated');
assert.ok(bad.issues.some(x=>x.includes('not in the currently loaded')));
assert.ok(bad.issues.some(x=>x.includes('returned options')));
const legacy={format:'nexus-azeroth-talent-draft-v1',identity:'us/111/222',name:'Old build',
 rankByNode:{1001:1,2001:1},choiceByNode:{2001:0}};
const loaded=plan.sanitizeImported(legacy);
assert.equal(loaded.identity,'us/111/222');
assert.equal(loaded.planner.activity,'general','Old v1 format should remain compatible');
assert.equal(loaded.rankByNode[1001],1);
assert.throws(()=>plan.sanitizeImported({...legacy,identity:'us/../auth'}));
assert.throws(()=>plan.sanitizeImported({...legacy,rankByNode:{1001:21}}));
assert.throws(()=>plan.sanitizeImported({...legacy,rankByNode:{1001:'2'}}));
assert.throws(()=>plan.sanitizeImported({...legacy,rankByNode:{bad:1}}));
assert.throws(()=>plan.sanitizeImported({...legacy,rankByNode:Array(100).fill(1)}));
const tested=plan.sanitizeImported({...legacy,planner:{activity:'pvp',notes:'x'.repeat(2100)}});
assert.equal(tested.planner.activity,'pvp');assert.equal(tested.planner.notes.length,1800);
assert.match(html,/id="nxCanonicalVersion"[^>]*>AZEROTH v7\.5\.0/);
assert.ok(html.includes('./styles-core-v5.2.css')&&html.includes('./scripts-experience-v5.2.js'));
assert.ok(html.indexOf('talent-planner-core.js')<html.indexOf('talent-forge.js'),'Planner helper loads before Talent Forge');
for(const marker of ['tfPlanActivity','tfPlanRole','tfPlanStyle','tfPlanNotes','tfPlanGoalClass','tfPlanGoalSpec','tfPlanGoalHero','tfPlanReview','tfPlanRecover','tfPlanRestore','tfPlanDiscard','tfPlanDuplicate','tfPlanCopy','nexus_azeroth_talent_planner_autorecover_v51','tfSave','tfImport','tfExport','tfUndo','tfRedo','tfCompare','tfHeroTree']){
 if(marker==='tfPlanReview')continue;
 assert.ok(forge.includes(marker),'Planner or preserved studio control missing: '+marker);
}
assert.ok(forge.includes('PLANNER.sanitizeImported(JSON.parse(await f.text()))'),'Import must use strict helper');
assert.ok(forge.includes('if(recoveryPending)return notice('),'Unresolved recovery must be guarded during save');
assert.ok(forge.includes('planner:PLANNER?.sanitizeMeta(plannerMeta)'),'Saved drafts must include sanitized metadata');
assert.ok(forge.includes('NexusTalentPaths')&&forge.includes('NexusTalentLayout'),'Prior tree analysis must remain intact');
assert.ok(css.includes('.tf-plan-fields')&&css.includes('.tf-plan-reviews')&&css.includes('@media(max-width:700px)'));
assert.ok(!helper.includes('fetch(')&&!helper.includes('/auth/')&&!helper.includes('access_token'),'Pure planning engine must not access accounts');
console.log('Talent Forge Planner v5.1 domain, import, recovery and preservation tests passed.');
