import {test} from 'node:test';
import assert from 'node:assert/strict';
import {daySummaryPlan,summaryAlerts} from '../custom_components/euskalmet_local/frontend/eguraldi-day-summary-model.js';
import {outingPlan} from '../custom_components/euskalmet_local/frontend/eguraldi-outing-model.js';
import {dryingPlan} from '../custom_components/euskalmet_local/frontend/eguraldi-drying-model.js';
import {vehicleWashPlan} from '../custom_components/euskalmet_local/frontend/eguraldi-vehicle-wash-model.js';
const now=Date.parse('2026-11-20T10:17:00Z'),anchor=Math.ceil(now/3600000)*3600000;
const hourly=Array.from({length:24},(_,i)=>({datetime:new Date(anchor+i*3600000).toISOString(),condition:'sunny',temperature:22,wind_speed:12,precipitation:0,humidity:50}));
const daily=Array.from({length:7},(_,i)=>({datetime:new Date(Date.parse('2026-11-20T12:00:00Z')+i*86400000).toISOString(),condition:i===0?'rainy':'sunny',temperature:18,templow:10}));
test('day summary reuses the existing model results, including custom parameters',()=>{
 const options={now,minutes:90,activity:'family',hours:4};const result=daySummaryPlan({hourly,daily,...options});
 assert.deepEqual(result.outing.plan,outingPlan(hourly,options));assert.deepEqual(result.drying.plan,dryingPlan(hourly,options));assert.deepEqual(result.washing.plan,vehicleWashPlan(daily,options));
 assert.equal(result.outing.status,'good');assert.equal(result.drying.status,'good');assert.equal(result.washing.status,'good');
});
test('unavailable data is unknown rather than a negative weather recommendation',()=>{
 const empty=daySummaryPlan({now});for(const key of ['outing','drying','washing'])assert.equal(empty[key].status,'unknown');
 const rain=daySummaryPlan({hourly:hourly.map(f=>({...f,precipitation:2,condition:'rainy'})),daily:daily.map(f=>({...f,condition:'rainy'})),now});
 assert.equal(rain.outing.status,'wait');assert.equal(rain.drying.status,'wait');assert.equal(rain.washing.status,'wait');
});
test('missing humidity remains a limited drying window and the optional supplement is respected',()=>{
 const missing=hourly.map(({humidity,...f})=>f),plan=daySummaryPlan({hourly:missing,now});assert.equal(plan.drying.status,'limited');
 const supplemented=daySummaryPlan({hourly:missing,humidityForecast:hourly,now});assert.equal(supplemented.drying.status,'good');
});
test('a clear alert status requires a fresh successful complete check',()=>{
 const attrs={alerts_updated:new Date(now).toISOString(),alerts_stale:false};
 assert.equal(summaryAlerts({state:'none'},attrs,now).status,'clear');assert.equal(summaryAlerts({state:'red'},attrs,now).status,'active');
 for(const level of ['unknown','unavailable','bad'])assert.equal(summaryAlerts({state:level},attrs,now).status,'unknown');
 assert.equal(summaryAlerts({state:'none'}, {},now).status,'unknown');
 assert.equal(summaryAlerts({state:'none'},{...attrs,alerts_stale:true},now).status,'unknown');
 assert.equal(summaryAlerts({state:'red'},attrs,now+46*60000).status,'unknown');
});
