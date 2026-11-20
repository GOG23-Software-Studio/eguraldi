import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vehicleWashPlan,washDayKey,washCalendarDay} from '../custom_components/euskalmet_local/frontend/eguraldi-vehicle-wash-model.js';
const now=Date.parse('2026-11-20T09:00:00Z');
const rows=conditions=>conditions.map((condition,i)=>({datetime:washCalendarDay('2026-11-20',i),condition,temperature:16,templow:9}));
test('washing chooses the longest uninterrupted run and the earliest tie',()=>{
 const p=vehicleWashPlan(rows(['rainy','sunny','partlycloudy','cloudy','rainy','sunny','sunny']),{now});
 assert.equal(p.days.length,7);assert.equal(p.best.index,1);assert.equal(p.best.run,3);assert.equal(p.best.stop.key,'2026-11-24');
 assert.equal(vehicleWashPlan(rows(['sunny','sunny','rainy','sunny','sunny']),{now}).best.index,0);
});
test('washing never bridges gaps or pretends the forecast continues',()=>{
 const p=vehicleWashPlan(rows(['rainy','sunny',null,'sunny','sunny',null,'sunny']),{now});
 assert.equal(p.best.index,3);assert.equal(p.best.run,2);assert.equal(p.best.stop.status,'unknown');assert.equal(p.days[6].recommendation,'limited');
 assert.equal(vehicleWashPlan(rows(['rainy','rainy','sunny']),{now}).best,null);
 assert.equal(vehicleWashPlan([],{now}).days.filter(d=>d.status==='unknown').length,7);
});
test('rain overrides a dry symbol and unsupported weather never becomes dry',()=>{
 const r=rows(['sunny','sunny','sunny','sunny']);r[0].precipitation=.01;r[1].precipitation_probability=60;r[2].condition='mystery';
 const p=vehicleWashPlan(r,{now});assert.equal(p.days[0].status,'wet');assert.equal(p.days[1].status,'wet');assert.equal(p.days[2].status,'unknown');assert.equal(p.best,null);
});
test('known wind and cold veto days while missing wind stays missing',()=>{
 const r=rows(['sunny','sunny','sunny','sunny']);r.forEach(day=>day.temperature=60);r[0].wind_speed=30/3.6;r[1].temperature=32;
 const p=vehicleWashPlan(r,{now,units:{wind_speed_unit:'m/s',temperature_unit:'°F'}});
 assert.equal(p.days[0].reason,'wind');assert.equal(p.days[1].reason,'cold');assert.equal(p.days[2].wind,null);
 const clean=vehicleWashPlan(rows(['sunny','sunny']),{now});assert.equal(clean.best.run,2);assert.equal(clean.best.wind,null);
});
test('calendar respects HA timezone, month rollover and DST without adding 24-hour timestamps',()=>{
 assert.equal(washDayKey('2026-11-19T23:30:00Z','Europe/Paris'),'2026-11-20');
 assert.equal(washCalendarDay('2026-12-31',1),'2027-01-01');
 const p=vehicleWashPlan(rows(['sunny']),{now:Date.parse('2026-10-24T22:30:00Z'),timeZone:'Europe/Paris'});
 assert.equal(p.days[0].key,'2026-10-25');assert.equal(p.days[1].key,'2026-10-26');
});
test('old dates and duplicate daily records cannot give a confident recommendation',()=>{
 const r=rows(['sunny','sunny']);r.push({...r[0],condition:'rainy'});
 assert.equal(vehicleWashPlan(r,{now}).days[0].status,'unknown');
 assert.equal(vehicleWashPlan(r,{now:now+8*86400000}).best,null);
});

test('after 18 local time today is shown but no longer proposed as the washing day',()=>{
 const p=vehicleWashPlan(rows(['sunny','sunny','sunny']),{now:Date.parse('2026-11-20T18:30:00Z')});
 assert.equal(p.days[0].eligible,false);assert.equal(p.best.index,1);
});
