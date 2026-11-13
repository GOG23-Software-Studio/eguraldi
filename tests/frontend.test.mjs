import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const sourcePath=new URL('../custom_components/euskalmet_local/frontend/euskalmet-local-card.js',import.meta.url);
const source=readFileSync(sourcePath,'utf8').replace(/^import .*;$/gm,'').replaceAll('export ','');
function setup(){
  const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'outside-only'});
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-history-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  vm.runInContext(source+'\nwindow.logic={forecastRows,iconName,isNight,numeric,escapeHTML};',dom.getInternalVMContext());
  return dom;
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const location={entry_id:'test',locality:'Ortuella',station:'Arboleda',latitude:43.3,longitude:-3.05,distance_km:4,entities:{weather:'weather.test',humidity:'sensor.humidity',temperature:'sensor.temp'}};
const now=Date.now();
const forecasts=Array.from({length:24},(_,i)=>({datetime:new Date(now+i*3600000).toISOString(),condition:i%3?'partlycloudy':'rainy',temperature:11+i/10,wind_speed:8,precipitation:i%3?0:.2}));
function hass(counter={subscriptions:0,unsubscribed:0}){return {states:{'weather.test':{state:'partlycloudy',attributes:{temperature:11,temperature_unit:'°C',wind_speed_unit:'km/h'}},'sensor.temp':{attributes:{observed_at:new Date(now).toISOString()}},'sensor.humidity':{state:'unknown',attributes:{quality:'out_of_range',raw_value:101.2}}},config:{time_zone:'Europe/Madrid'},callWS:async()=>[location],connection:{subscribeMessage:async(callback,msg)=>{if(msg.type==='subscribe_events'){counter.events=callback;counter.eventSubscriptions=(counter.eventSubscriptions||0)+1;return ()=>{counter.eventUnsubscribed=(counter.eventUnsubscribed||0)+1;};}counter.subscriptions++;callback({forecast:msg.forecast_type==='hourly'?forecasts:forecasts.slice(0,7).map((f,i)=>({...f,datetime:new Date(now+i*86400000).toISOString(),templow:9}))});return ()=>counter.unsubscribed++;}}};}

test('24 hourly slots, six CSS columns, safe missing values',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'hourly'});card.hass=hass();dom.window.document.body.append(card);await flush();assert.equal(card.shadowRoot.querySelectorAll('.hour').length,24);assert.match(card.shadowRoot.querySelector('style').textContent,/repeat\(6,minmax\(0,1fr\)\)/);assert.equal(dom.window.logic.numeric(null),null);assert.equal(dom.window.logic.numeric('unavailable'),null);dom.window.close();});
test('day/night variants depend on each forecast hour',()=>{const dom=setup(),l=dom.window.logic;assert.equal(l.isNight('2026-07-01T00:00:00Z',43.3,-3),true);assert.equal(l.isNight('2026-07-01T12:00:00Z',43.3,-3),false);assert.equal(l.iconName('sunny',true),'clear-night');assert.equal(l.iconName('partlycloudy',true),'partly-cloudy-night');dom.window.close();});
test('unsubscribes on removal and reconnects once',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),count={subscriptions:0,unsubscribed:0};card.setConfig({mode:'hourly'});card.hass=hass(count);dom.window.document.body.append(card);await flush();assert.equal(count.subscriptions,2);card.remove();assert.equal(count.unsubscribed,2);dom.window.document.body.append(card);await flush();assert.equal(count.subscriptions,4);dom.window.close();});
test('multiple localities never silently choose first',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');const h=hass();h.callWS=async()=>[location,{...location,entry_id:'other',locality:'Bilbao'}];card.setConfig({mode:'hourly'});card.hass=h;dom.window.document.body.append(card);await flush();assert.ok(card.shadowRoot.querySelector('select'));assert.equal(card.shadowRoot.querySelectorAll('.hour').length,0);dom.window.close();});
test('invalid humidity is explicit and locality labels are escaped',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'overview'});card.hass=hass();dom.window.document.body.append(card);await flush();assert.match(card.shadowRoot.textContent,/101,2/);assert.match(card.shadowRoot.textContent,/fuera de rango/);assert.equal(dom.window.logic.escapeHTML('<script>'),'&lt;script&gt;');dom.window.close();});
test('all referenced icon assets are packaged',()=>{const dom=setup();for(const condition of ['sunny','clear-night','partlycloudy','cloudy','rainy','pouring','fog','snowy','snowy-rainy','lightning','lightning-rainy','windy','hail','exceptional','unknown'])for(const night of [true,false])assert.ok(existsSync(new URL('../custom_components/euskalmet_local/frontend/icons/'+dom.window.logic.iconName(condition,night)+'.svg',import.meta.url)));dom.window.close();});


test('station updates replace metadata in the mounted card and preserve locality',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');
  const count={subscriptions:0,unsubscribed:0},h=hass(count);
  let current={...location,station_id:'C061',distance_km:1.9};
  h.callWS=async()=>[current];
  card.setConfig({mode:'overview',entry_id:'test'});card.hass=h;
  dom.window.document.body.append(card);await flush();
  assert.equal(card.shadowRoot.querySelector('.place').textContent,'Ortuella');
  assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/Arboleda.*1,9 km/);
  const oldEvents=count.events;
  current={...current,station:'Otra estación',station_id:'C999',distance_km:7.2};
  count.events({data:{entry_id:'another-entry'}});await flush();
  assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/Arboleda/);
  count.events({data:{entry_id:'test'}});await flush();
  assert.equal(card.shadowRoot.querySelector('.place').textContent,'Ortuella');
  assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/Otra estación.*7,2 km/);
  assert.equal(count.subscriptions,4);assert.equal(count.unsubscribed,2);
  oldEvents({data:{entry_id:'test'}});await flush();assert.equal(count.subscriptions,4);
  current={...current,station:'Arboleda',station_id:'C061',distance_km:1.9};
  count.events({data:{entry_id:'test'}});await flush();
  assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/Arboleda.*1,9 km/);
  card.remove();assert.equal(count.eventSubscriptions,count.eventUnsubscribed);
  assert.equal(count.subscriptions,count.unsubscribed);dom.window.close();
});


test('summary cards refresh their source and values while keeping locality',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),count={subscriptions:0,unsubscribed:0},h=hass(count);
  let current={...location,station_id:'C061',entities:{...location.entities,temperature_min_today:'sensor.min'}};
  h.callWS=async()=>[current];h.states['sensor.min']={state:'10',attributes:{unit_of_measurement:'°C'}};
  card.setConfig({mode:'summaries',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.match(card.shadowRoot.querySelector('.rows').textContent,/10 °C/);
  current={...current,station:'Galindo',station_id:'C038',distance_km:4.7};
  h.states['sensor.min']={state:'12',attributes:{unit_of_measurement:'°C'}};
  count.events({data:{entry_id:'test'}});await flush();
  assert.equal(card.shadowRoot.querySelector('#extra-title').textContent,'Ortuella · resumen de hoy');
  assert.match(card.shadowRoot.querySelector('#extra-source').textContent,/Galindo.*4,7 km/);
  assert.match(card.shadowRoot.querySelector('.rows').textContent,/12 °C/);
  assert.equal(count.subscriptions,0);card.remove();assert.equal(count.eventSubscriptions,count.eventUnsubscribed);dom.window.close();
});

test('mounted monthly history switches station, retains month and ignores the old pending response',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),count={subscriptions:0,unsubscribed:0},h=hass(count);
  let current={...location,station_id:'C061',distance_km:1.9},finishOld;
  const requests=[];
  h.callWS=async msg=>{
    if(msg.type==='euskalmet_local/locations')return [current];
    requests.push(msg);
    if(msg.station_id==='C061')return new Promise(resolve=>{finishOld=resolve;});
    return {station:'C038',items:[]};
  };
  card.setConfig({mode:'history',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  const history=card.shadowRoot.querySelector('euskalmet-local-history-card');
  assert.ok(history);assert.equal(requests.length,1);
  history.date=new Date(2025,3,1);
  current={...current,station:'Galindo',station_id:'C038',distance_km:4.7};
  count.events({data:{entry_id:'test'}});await flush();
  assert.equal(card.shadowRoot.querySelector('euskalmet-local-history-card'),history);
  assert.equal(history.data.station,'C038');assert.equal(requests.at(-1).month,4);assert.equal(requests.at(-1).year,2025);
  assert.match(card.shadowRoot.querySelector('#extra-title').textContent,/Ortuella/);
  assert.match(card.shadowRoot.querySelector('#extra-source').textContent,/Galindo.*4,7 km/);
  finishOld({station:'C061',items:[]});await flush();assert.equal(history.data.station,'C038');
  card.hass={...h,states:{...h.states,'light.unrelated':{state:'on'}}};await flush();assert.equal(requests.length,2);
  card.remove();assert.equal(count.eventSubscriptions,count.eventUnsubscribed);dom.window.close();
});

test('comparison legend and environmental source follow the selected entry',async()=>{
  const dom=setup(),count={subscriptions:0,unsubscribed:0},h=hass(count),configs=[];
  class Graph extends dom.window.HTMLElement{setConfig(config){this.config=config;}set hass(value){this._hass=value;}}
  dom.window.customElements.define('test-history-graph',Graph);
  dom.window.loadCardHelpers=async()=>({createCardElement:config=>{configs.push(config);return dom.window.document.createElement('test-history-graph');}});
  let current={...location,station_id:'C061'};h.callWS=async()=>[current];
  const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'comparison',entry_id:'test',comparison_entity:'sensor.balcony',comparison_name:'Balcón'});card.hass=h;dom.window.document.body.append(card);await flush();await flush();
  assert.equal(configs.at(-1).entities[0].name,'Ortuella · estación Arboleda');
  current={...current,station:'Galindo',station_id:'C038',distance_km:4.7};count.events({data:{entry_id:'test'}});await flush();await flush();
  assert.equal(configs.at(-1).entities[0].name,'Ortuella · estación Galindo');assert.equal(configs.at(-1).entities[1].entity,'sensor.balcony');
  card.remove();dom.window.close();
});
