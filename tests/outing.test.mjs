import {test} from 'node:test';
import assert from 'node:assert/strict';
import {outingHour,outingPlan} from '../custom_components/euskalmet_local/frontend/eguraldi-outing-model.js';
const base=Date.parse('2026-11-18T10:00:00Z'),good={temperature:18,wind_speed:8,precipitation:0,condition:'sunny'};
const rows=Array.from({length:24},(_,i)=>({...good,datetime:new Date(base+i*3600000).toISOString()}));
test('activity thresholds differ and wet sport never gets an umbrella recommendation',()=>{
 assert.equal(outingHour({...good,wind_speed:26},{},'walk').status,'good');
 assert.equal(outingHour({...good,wind_speed:26},{},'family').status,'avoid');
 assert.equal(outingHour({...good,temperature:29},{},'sport').status,'avoid');
 assert.equal(outingHour({...good,precipitation:.1},{},'walk').status,'fair');
 assert.equal(outingHour({...good,precipitation:.1},{},'sport').status,'avoid');
 assert.equal(outingHour({...good,condition:'rainy'},{},'sport').status,'avoid');
 for(const condition of ['lightning','lightning-rainy','hail','pouring','snowy','exceptional','fog'])assert.equal(outingHour({...good,condition}).status,'avoid');
});
test('unknown readings never become favourable and units are normalized',()=>{
 for(const patch of [{precipitation:null},{temperature:true},{wind_speed:''}])assert.equal(outingHour({...good,...patch}).status,'unknown');
 const converted=outingHour({...good,temperature:64.4,wind_speed:8/1.609344},{temperature_unit:'°F',wind_speed_unit:'mph'});
 assert.ok(Math.abs(converted.temperature-18)<1e-9);assert.equal(converted.score,outingHour(good).score);
 assert.equal(outingHour(good,{wind_speed_unit:'invalid'}).status,'unknown');
});
test('30 and 90 minute windows use every touched hourly block without filling gaps',()=>{
 const plan=outingPlan(rows,{now:base+17*60000,minutes:90});
 assert.ok(plan.best);assert.ok(plan.best.start>=base+17*60000);assert.equal(plan.best.end-plan.best.start,90*60000);
 const crossing=plan.windows.find(w=>w.start===base+30*60000);assert.equal(crossing.parts.length,2);
 const missing=outingPlan(rows.filter((_,i)=>i!==1),{now:base+17*60000,minutes:90});
 assert.equal(missing.windows.find(w=>w.start===base+30*60000).status,'unknown');
 for(const w of [missing.best,...missing.alternatives])assert.ok(w.end<=base+3600000||w.start>=base+2*3600000);
 for(const w of plan.alternatives)assert.ok(w.end<=plan.best.start||w.start>=plan.best.end);
 assert.equal(outingPlan(rows.map(r=>({...r,condition:'lightning'})),{now:base}).best,null);
 assert.equal(outingPlan([],{now:base}).best,null);
});
test('half-hour starts do not change underlying hourly forecast and stop at 24 hours',()=>{
 const plan=outingPlan(rows,{now:base,minutes:30});
 assert.deepEqual(plan.windows[0].parts,plan.windows[1].parts);
 assert.ok(plan.windows.every(w=>w.end<=base+24*3600000));
 const dst=outingPlan(rows.map((r,i)=>({...r,datetime:new Date(Date.parse('2026-10-25T00:00:00Z')+i*3600000).toISOString()})),{now:Date.parse('2026-10-25T00:00:00Z'),minutes:90});
 assert.ok(dst.windows.every(w=>w.end-w.start===90*60000));
});
test('later changes are factual hourly comparisons and never jump across missing readings',()=>{
 const changing=rows.map((r,i)=>i>=2?{...r,precipitation:1,condition:'rainy'}:r),plan=outingPlan(changing,{now:base,minutes:60});
 assert.equal(plan.changes[0].stamp,base+2*3600000);assert.ok(plan.changes[0].types.includes('rain'));
 const gap=outingPlan(changing.filter((_,i)=>i!==1),{now:base,minutes:60});assert.equal(gap.changes.length,0);
 const incomplete=outingPlan(changing.map((r,i)=>i===1?{...r,temperature:null,condition:'rainy',precipitation:1}:r),{now:base,minutes:60});assert.equal(incomplete.changes.length,0);
});
