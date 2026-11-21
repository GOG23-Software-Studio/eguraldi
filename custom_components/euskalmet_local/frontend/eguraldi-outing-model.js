/* Eguraldi · heuristic weather windows, not a safety assessment · MIT */
import {dryingHour} from './eguraldi-drying-model.js?v=0.8.0';
const OUTING_HOUR=3600000, HALF_HOUR=1800000;
const PROFILES={walk:{cold:0,hot:32,wind:35,gust:50,ideal:18},sport:{cold:2,hot:28,wind:30,gust:45,ideal:14},family:{cold:5,hot:30,wind:25,gust:40,ideal:20}};

export function outingHour(forecast,units={},activity='walk',night=false){
  activity=Object.hasOwn(PROFILES,activity)?activity:'walk';
  const profile=PROFILES[activity],values=dryingHour(forecast,units),{temperature,wind,rain,gust,probability}=values;
  const reasons=[],missing=[rain===null?'rain':null,temperature===null?'temperature':null,wind===null?'wind':null].filter(Boolean);
  const storm=['lightning','lightning-rainy','hail','exceptional','pouring','snowy','snowy-rainy'].includes(forecast?.condition);
  if(storm)reasons.push('storm');
  if(wind!==null&&wind>=profile.wind||gust!==null&&gust>=profile.gust)reasons.push('wind');
  if(temperature!==null&&(temperature<=profile.cold||temperature>=profile.hot))reasons.push('extreme');
  if(rain!==null&&rain>0&&(activity!=='walk'||rain>.2)||forecast?.condition==='rainy'&&activity!=='walk'||probability!==null&&probability>=60)reasons.push('rain');
  if(forecast?.condition==='fog')reasons.push('fog');
  if(reasons.length)return {...values,status:'avoid',score:0,reasons,missing,night,umbrella:true,jacket:temperature!==null&&temperature<16};
  if(missing.length)return {...values,status:'unknown',score:0,reasons:[],missing,night,umbrella:null,jacket:null};
  const umbrella=rain>0||['rainy','pouring'].includes(forecast?.condition)||(probability!==null&&probability>=20),jacket=temperature<16||(temperature<20&&wind>=20);
  let score=100-Math.min(45,Math.abs(temperature-profile.ideal)*3)-Math.min(25,wind/profile.wind*25);
  if(umbrella){score-=30;reasons.push('rain_possible');}
  if(jacket)reasons.push('cool');
  if(night){score-=activity==='family'?20:10;reasons.push('night');}
  if(wind>=20)reasons.push('breezy');
  return {...values,status:score>=65&&!umbrella?'good':'fair',score:Math.max(1,Math.round(score)),reasons,missing,night,umbrella,jacket};
}

export function outingPlan(forecasts,{now=Date.now(),minutes=60,activity='walk',units={},night=()=>false}={}){
  const duration=[30,60,90].includes(minutes)?minutes:60,kind=Object.hasOwn(PROFILES,activity)?activity:'walk',index=new Map();
  for(const f of Array.isArray(forecasts)?forecasts:[]){if(!f||typeof f!=='object')continue;const stamp=Date.parse(f.datetime);if(Number.isFinite(stamp)&&stamp%OUTING_HOUR===0)index.set(stamp,f);}
  const anchor=Math.ceil(now/HALF_HOUR)*HALF_HOUR,windows=[];
  for(let start=anchor;start+duration*60000<=now+24*OUTING_HOUR;start+=HALF_HOUR){
    const end=start+duration*60000,parts=[];
    for(let stamp=Math.floor(start/OUTING_HOUR)*OUTING_HOUR;stamp<end;stamp+=OUTING_HOUR){const f=index.get(stamp);parts.push({stamp,condition:f?.condition,...outingHour(f,units,kind,night(stamp+OUTING_HOUR/2))});}
    const status=parts.some(p=>p.status==='avoid')?'avoid':parts.some(p=>p.status==='unknown')?'unknown':parts.every(p=>p.status==='good')?'good':'fair';
    const weight=p=>Math.min(end,p.stamp+OUTING_HOUR)-Math.max(start,p.stamp);
    const score=parts.reduce((sum,p)=>sum+p.score*weight(p),0)/(end-start);
    windows.push({start,end,parts,status,score,umbrella:parts.some(p=>p.umbrella===true),jacket:parts.some(p=>p.jacket===true),reasons:[...new Set(parts.flatMap(p=>p.reasons))]});
  }
  const ranked=windows.filter(w=>['good','fair'].includes(w.status)).sort((a,b)=>(a.status==='good'?0:1)-(b.status==='good'?0:1)||b.score-a.score||a.start-b.start),best=ranked[0]||null,alternatives=[];
  for(const w of ranked.slice(1)){if(w.start<best.end&&w.end>best.start||alternatives.some(a=>w.start<a.end&&w.end>a.start))continue;alternatives.push(w);if(alternatives.length===2)break;}
  const changes=[];let checkedUntil=null;
  if(best){const before=best.parts.at(-1);for(let stamp=Math.ceil(best.end/OUTING_HOUR)*OUTING_HOUR;stamp<Math.min(best.end+6*OUTING_HOUR,now+24*OUTING_HOUR);stamp+=OUTING_HOUR){const f=index.get(stamp);if(!f)break;const p=outingHour(f,units,kind,night(stamp+OUTING_HOUR/2));if(p.missing.length)break;checkedUntil=Math.min(stamp+OUTING_HOUR,best.end+6*OUTING_HOUR,now+24*OUTING_HOUR);const types=[];if(p.rain>0&&before.rain===0||p.umbrella&&!best.umbrella)types.push('rain');if(p.temperature!==null&&p.temperature<=before.temperature-3)types.push('cool');if(p.wind>=before.wind+10||p.wind>=PROFILES[kind].wind)types.push('wind');if(types.length){changes.push({stamp,types});break;}}}
  return {activity:kind,minutes:duration,windows,best,alternatives,changes,checkedUntil};
}
