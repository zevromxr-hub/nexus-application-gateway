// PROXIMUS v3.3 — Life Command and cinematic media suite regression tests.
import assert from 'node:assert/strict';
import {
 LIFE_SCHEMA,LIFE_STORAGE,LIFE_LIMIT,validDay,localDay,addDays,nextMonthly,dayDistance,
 normalizeLifeData,normalizeLifeItem,nextOccurrence,isCompleted,toggleLifeDone,
 streakFor,lifeStats,filterLife,lifeCalendar,lifeExport,lifeImport
} from '../life-command-core.js';
import {
 GIF_QUALITY_PROFILES,gifPreflight,combineIdenticalFrames,
 bookmarkAt,normalizeBookmarks,makeVideoCatalog
} from '../media-suite-core.js';

assert.equal(LIFE_SCHEMA,'proximus.life-command/1');
assert.equal(LIFE_STORAGE,'proximus-life-command-v1');
assert.equal(LIFE_LIMIT,350);
assert.equal(Object.keys(GIF_QUALITY_PROFILES).length,4);
assert.equal(GIF_QUALITY_PROFILES.cinema.fps,24);
assert.equal(validDay('2026-02-28'),true);
assert.equal(validDay('2026-02-29'),false);
assert.equal(addDays('2028-02-28',1),'2028-02-29');
assert.equal(dayDistance('2026-11-13','2026-11-20'),7);
assert.equal(nextMonthly('2026-01-31',1),'2026-02-28');
assert.equal(nextMonthly('2028-01-31',1),'2028-02-29');
assert.equal(nextMonthly('2026-01-31',2),'2026-03-31');
assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(localDay(new Date('2026-11-13T18:00:00Z'))));
const task={id:'task-0001',title:'Pay rent',kind:'task',date:'2026-11-10',repeat:'none',priority:'high',note:'Monthly'};
const routine={id:'routine-0001',title:'Take a walk',kind:'routine',date:'2026-11-01',repeat:'daily',doneDays:['2026-11-11','2026-11-12','2026-11-13']};
const weekly={id:'weekly-0001',title:'Review videos',kind:'routine',date:'2026-11-02',repeat:'weekly'};
const monthly={id:'monthly-0001',title:'Subscription renewal',kind:'event',date:'2026-01-31',repeat:'monthly'};
assert.equal(nextOccurrence(task,'2026-11-13'),'2026-11-10');
assert.equal(nextOccurrence(routine,'2026-11-13'),'2026-11-13');
assert.equal(nextOccurrence(weekly,'2026-11-13'),'2026-11-16');
assert.equal(nextOccurrence(monthly,'2026-02-28'),'2026-02-28');
assert.equal(nextOccurrence(monthly,'2026-03-01'),'2026-03-31');
assert.equal(isCompleted(task,'2026-11-13'),false);
assert.equal(toggleLifeDone(task,'2026-11-13').done,true);
assert.equal(streakFor(routine,'2026-11-13'),3);
assert.equal(streakFor(routine,'2026-11-14'),3,'Streak holds until the next completed day begins.');
assert.equal(isCompleted(routine,'2026-11-13'),true);
assert.equal(isCompleted(toggleLifeDone(routine,'2026-11-13'),'2026-11-13'),false);
const data=normalizeLifeData({items:[task,routine,weekly,monthly,task,
  {id:'unsafe',title:'script',date:'not a date'},null]});
assert.equal(data.items.length,4,'Broken and duplicate records must be removed');
const stats=lifeStats(data.items,'2026-11-13');
assert.equal(stats.total,4);
assert.equal(stats.overdue,1);
assert.equal(stats.doneToday,1);
assert.equal(filterLife(data.items,{status:'overdue',today:'2026-11-13'}).length,1);
assert.equal(filterLife(data.items,{query:'walk',today:'2026-11-13',status:'all'}).length,1);
const calendar=lifeCalendar(data.items);
assert.match(calendar,/BEGIN:VCALENDAR/);
assert.match(calendar,/RRULE:FREQ=MONTHLY/);
assert.match(calendar,/RRULE:FREQ=WEEKLY/);
assert.match(calendar,/SUMMARY:Pay rent/);
const recovered=lifeImport(lifeExport(data));
assert.equal(recovered.items.length,4);
assert.throws(()=>lifeImport('{"schema":"wrong","items":[]}'),/Unsupported/);
assert.throws(()=>normalizeLifeItem({id:'bad',title:'bad'}),/ID/);

for(const [fps,seconds] of [[12,8],[15,8],[20,6],[24,5]]){
 const info=gifPreflight({start:0,end:seconds,fps,width:240,height:135});
 assert.equal(info.valid,true);
 assert.ok(info.frames<=120);
}
assert.match(gifPreflight({start:0,end:8,fps:24,width:240,height:135}).reason,/120/);
assert.match(gifPreflight({start:0,end:6,fps:20,width:600,height:300}).reason,/memory/);
const frame=(index,delayMs=70)=>({width:2,height:2,delayMs,data:new Uint8ClampedArray(16).fill(index)});
const optimized=combineIdenticalFrames([frame(1,40),frame(1,70),frame(2,70),frame(2,50)]);
assert.equal(optimized.length,2);
assert.equal(optimized[0].delayMs,110);
assert.equal(optimized[1].delayMs,120);
assert.notEqual(optimized[0].data,optimized[1].data);
assert.throws(()=>combineIdenticalFrames([{width:2,height:2,data:null}]),/Invalid/);
const marks=normalizeBookmarks([
 {id:'abcdefgh-0001',title:'Interesting part',time:20.2},
 {id:'abcdefgh-0002',title:'Earlier',time:5.1},
 {id:'abcdefgh-0002',title:'Duplicate',time:100},
 {id:'bad',time:200}
]);
assert.equal(marks.length,2);
assert.equal(marks[0].time,5.1);
assert.throws(()=>bookmarkAt({id:'bad',time:-1}),/Invalid/);
const catalog=makeVideoCatalog([
 {name:'a.mp4',displayTitle:'My favorite',bytes:123456,collection:'Movies',favorite:true,
  duration:111,bookmarks:marks}
]);
assert.equal(catalog.videos.length,1);
assert.equal(catalog.videos[0].title,'My favorite');
assert.equal(catalog.videos[0].bookmarks.length,2);
assert.match(catalog.note,/does not include/);
console.log('PASS v3.3: private Life Command tasks/routines/streaks, monthly leap-year recurrence, calendar/backup, GIF quality/preflight/duplicate frames, and saved Video Vault chapters.');
