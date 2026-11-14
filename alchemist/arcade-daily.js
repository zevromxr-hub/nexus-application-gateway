// PROXIMUS v3.5.2 Arcade Nexus — browser-local rotating daily challenges.
export const ARCADE_DAILY_KEY='proximus-arcade-daily-v1';
const MISSIONS=[
 {game:'comet',title:'Comet Expedition',target:160,detail:'Score at least 160 points in a Comet Catch run.'},
 {game:'pulse',title:'Pulse Precision',target:230,detail:'Score at least 230 points in one Pulse Reflex round.'},
 {game:'memory',title:'Memory Architect',target:560,detail:'Finish Memory Matrix with at least 560 points.'}
];
export function localDayKey(date=new Date()){
 const y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();
 return [String(y),String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-');
}
export function dailyMission(date=new Date()){
 const day=localDayKey(date),n=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
 return {day,...MISSIONS[((n%3)+3)%3]};
}
export function normalizeDailyProgress(raw={}){
 const obj=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const n=v=>Number.isSafeInteger(v)&&v>=0?Math.min(v,100000):0;
 const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)?x:'';
 return {day:validDay(obj.day),attemptBest:n(obj.attemptBest),completed:obj.completed===true,
  totalCompleted:n(obj.totalCompleted),streak:n(obj.streak),lastComplete:validDay(obj.lastComplete)};
}
function dayOrdinal(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return NaN;
 const date=new Date(day+'T12:00:00Z');
 return Number.isFinite(date.getTime())?Math.floor(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())/86400000):NaN;
}
export function applyDailyAttempt(saved={},mission,game,score){
 let state=normalizeDailyProgress(saved);
 if(!mission||typeof mission.day!=='string')return state;
 if(state.day!==mission.day)state={...state,day:mission.day,attemptBest:0,completed:false};
 if(game!==mission.game||!Number.isFinite(score)||score<0)return state;
 state.attemptBest=Math.max(state.attemptBest,Math.floor(score));
 if(!state.completed&&state.attemptBest>=mission.target){
  const prev=dayOrdinal(state.lastComplete),today=dayOrdinal(mission.day);
  state.streak=Number.isFinite(prev)&&today-prev===1?state.streak+1:1;
  state.lastComplete=mission.day;state.totalCompleted++;state.completed=true;
 }
 return state;
}
