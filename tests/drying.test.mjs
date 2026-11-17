import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dryingHour,dryingPlan} from '../custom_components/euskalmet_local/frontend/eguraldi-drying-model.js';
const now=Date.parse('2026-11-17T10:17:00Z'),base=Math.ceil(now/3600000)*3600000;
const good={temperature:22,humidity:50,wind_speed:12,precipitation:0,condition:'sunny'};
const rows=Array.from({length:24},(_,i)=>({...good,datetime:new Date(base+i*3600000).toISOString()}));
test('drying excludes rainfall, storms, strong wind, frost, fog and saturated hours',()=>{
  assert.equal(dryingHour(good).status,'good');
  for(const patch of [{precipitation:.001},{condition:'lightning'},{wind_speed:30},{wind_gust_speed:45},{temperature:2},{humidity:90},{condition:'fog'}])assert.equal(dryingHour({...good,...patch}).status,'avoid');
  assert.equal(dryingHour({...good,precipitation_probability:40}).status,'avoid');
  assert.ok(dryingHour({...good,precipitation_probability:30}).score<dryingHour(good).score);
});
test('missing rainfall never becomes dry; humidity absence is labelled partial',()=>{
  for(const bad of [undefined,null,'',true,'unknown',NaN,-1])assert.equal(dryingHour({...good,precipitation:bad}).status,'unknown');
  for(const bad of [undefined,null,'',true,101,-1])assert.notEqual(dryingHour({...good,humidity:bad}).status,'good');
  assert.equal(dryingHour({...good,humidity:null}).status,'limited');
  assert.equal(dryingHour({...good,humidity:null}, {}, 50).status,'good');
  assert.equal(dryingHour({...good,precipitation:null,wind_speed:50}).status,'avoid');
});
test('unit conversion yields the same result; unsupported units block guidance',()=>{
  const metric=dryingHour(good),imperial=dryingHour({...good,temperature:71.6,wind_speed:12/1.609344},{temperature_unit:'°F',wind_speed_unit:'mph',precipitation_unit:'in'});
  assert.equal(metric.score,imperial.score);assert.ok(Math.abs(imperial.temperature-22)<1e-9);
  assert.equal(dryingHour(good,{wind_speed_unit:'invalid'}).status,'unknown');
  assert.equal(dryingHour(good,{precipitation_unit:'invalid'}).status,'unknown');
  assert.ok(dryingHour(good,{},null,true).score<metric.score);
});
test('windows use complete future UTC hours, never bridge gaps or overlap alternatives',()=>{
  const forecasts=rows.filter((r,i)=>i!==5).map((r,i)=>i===0?{...r,precipitation:1}:r);
  const plan=dryingPlan(forecasts,{now,hours:3});
  assert.ok(plan.best);assert.equal(plan.duration,3);assert.equal(plan.slots.length,23);
  assert.ok(plan.best.start>=now);assert.ok(plan.best.end<=now+24*3600000);
  for(const w of [plan.best,...plan.alternatives])assert.equal(w.end-w.start,3*3600000);
  for(const w of [plan.best,...plan.alternatives])assert.ok(!(w.start<=base+5*3600000&&w.end>base+5*3600000));
  for(const w of plan.alternatives)assert.ok(w.end<=plan.best.start||w.start>=plan.best.end);
  assert.equal(dryingPlan(rows.map(r=>({...r,precipitation:.1})),{now}).best,null);
});
test('humidity supplement joins exact UTC timestamps only and native forecast takes priority',()=>{
  const bare=rows.map(r=>{const {humidity,...rest}=r;return rest;});
  const supplement=rows.map(r=>({datetime:r.datetime,humidity:45}));
  assert.equal(dryingPlan(bare,{now,humidityForecast:supplement}).best.limited,false);
  assert.equal(dryingPlan(bare,{now,humidityForecast:supplement.map(r=>({...r,datetime:new Date(Date.parse(r.datetime)+1800000).toISOString()}))}).best.limited,true);
  assert.equal(dryingPlan(rows,{now,humidityForecast:supplement}).slots[0].humidity,50);
  assert.equal(dryingPlan([],{now}).best,null);
});
