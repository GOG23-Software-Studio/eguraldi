/* Compose existing models; do not introduce a second recommendation algorithm. */
import {outingPlan} from './eguraldi-outing-model.js?v=0.11.3';
import {dryingPlan} from './eguraldi-drying-model.js?v=0.11.3';
import {vehicleWashPlan} from './eguraldi-vehicle-wash-model.js?v=0.11.3';
export function daySummaryPlan({hourly=[],daily=[],units={},humidityForecast=[],now=Date.now(),timeZone='Europe/Madrid',night=()=>false,minutes=60,activity='walk',hours=3}={}){
  const outing=outingPlan(hourly,{now,minutes,activity,units,night});
  const drying=dryingPlan(hourly,{now,hours,units,humidityForecast,night});
  const washing=vehicleWashPlan(daily,{now,timeZone,units});
  return {
    outing:{status:outing.best?outing.best.status:outing.windows.some(w=>w.parts.every(p=>p.missing.length===0))?'wait':'unknown',plan:outing},
    drying:{status:drying.best?(drying.best.limited?'limited':drying.best.score>=65?'good':'fair'):drying.slots.some(p=>p.present&&p.missing.length===0)?'wait':'unknown',plan:drying},
    washing:{status:washing.best?'good':washing.days.some(d=>d.status!=='unknown')?'wait':'unknown',plan:washing},
  };
}
export function summaryAlerts(entity,attributes={},now=Date.now()){
  const stamp=Date.parse(attributes.alerts_updated),age=now-stamp,level=entity?.state;
  const valid=['none','yellow','orange','red'].includes(level)&&attributes.alerts_stale===false&&Number.isFinite(age)&&age>=-300000&&age<=45*60000;
  if(!valid)return {status:'unknown',level:null};
  return {status:level==='none'?'clear':'active',level};
}
