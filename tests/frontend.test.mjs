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
test('original humidity is shown without explanatory blocks and locality labels are escaped',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'overview'});card.hass=hass();dom.window.document.body.append(card);await flush();assert.match(card.shadowRoot.textContent,/101,2/);assert.equal(card.shadowRoot.querySelector('.warning'),null);assert.doesNotMatch(card.shadowRoot.textContent,/fuera de rango|La estación mide|Municipio detectado/);assert.equal(dom.window.logic.escapeHTML('<script>'),'&lt;script&gt;');dom.window.close();});
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


test('comparison can reconnect while its lazy card helper is pending',async()=>{
  const dom=setup(),h=hass(),card=dom.window.document.createElement('euskalmet-local-card');
  let finish;const pending=new Promise(resolve=>{finish=resolve;});
  dom.window.loadCardHelpers=()=>pending;
  card.setConfig({mode:'comparison',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  card.remove();dom.window.document.body.append(card);await flush();
  class Graph extends dom.window.HTMLElement{set hass(value){this._hass=value;}}
  dom.window.customElements.define('test-reconnected-graph',Graph);
  finish({createCardElement:()=>dom.window.document.createElement('test-reconnected-graph')});await flush();await flush();
  assert.ok(card.shadowRoot.querySelector('test-reconnected-graph'));card.remove();dom.window.close();
});


test('all mounted card modes adopt the new locality and nearest station on the same entry',async()=>{
  const dom=setup();
  for(const tag of ['euskalmet-local-radar-map-card','euskalmet-local-alert-card']){
    dom.window.customElements.define(tag,class extends dom.window.HTMLElement{setConfig(value){this.config=value;}set hass(value){this._hass=value;}});
  }
  class Graph extends dom.window.HTMLElement{set hass(value){this._hass=value;}}
  dom.window.customElements.define('test-locality-graph',Graph);
  dom.window.loadCardHelpers=async()=>({createCardElement:config=>{const card=dom.window.document.createElement('test-locality-graph');card.config=config;return card;}});
  let current={...location,locality_id:'1',station_id:'C061',distance_km:1.9,entities:{...location.entities,radar:'camera.test',alert_level:'sensor.alerts',temperature_min_today:'sensor.min'}};
  const cards=[];
  for(const mode of ['overview','hourly','daily','summaries','history','comparison','radar','alerts','environment','dashboard']){
    const count={subscriptions:0,unsubscribed:0},h=hass(count);
    h.callWS=async msg=>msg.type==='euskalmet_local/locations'?[current]:{station:current.station_id,items:[]};
    const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode,entry_id:'test'});card.hass=h;dom.window.document.body.append(card);cards.push({card,count,mode});
  }
  await flush();await flush();
  current={...current,locality:'Bilbao',locality_id:'2',station:'Nueva estación',station_id:'C058',distance_km:2.4,latitude:43.26,longitude:-2.93};
  for(const {count} of cards)count.events({data:{entry_id:'test'}});
  await flush();await flush();
  for(const {card,mode} of cards){
    assert.match(card.shadowRoot.querySelector('h2').textContent,/Bilbao/,mode);
    assert.doesNotMatch(card.shadowRoot.textContent,/Ortuella/,mode);
    if(['overview','summaries','history','comparison','dashboard'].includes(mode))assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/Nueva estación.*2,4 km/);
    if(mode==='history')assert.equal(card.shadowRoot.querySelector('euskalmet-local-history-card').data.station,'C058');
    card.remove();
  }
  dom.window.close();
});

test('environment never falls back to the old locality pollen station',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
  h.callWS=async()=>[{...location,locality:'Bilbao',entities:{...location.entities,pollen_old_total:'sensor.old_pollen',pollen_total:null}}];
  h.states['sensor.old_pollen']={state:'999',attributes:{municipality_name:'OLD'}};
  card.setConfig({mode:'environment',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.doesNotMatch(card.shadowRoot.textContent,/999|OLD/);assert.match(card.shadowRoot.textContent,/No disponible/);card.remove();dom.window.close();
});


test('HA source labels distance from HA while manual localities remain independent',async()=>{
  const dom=setup(),h=hass(),card=dom.window.document.createElement('euskalmet-local-card');
  h.callWS=async()=>[{...location,location_source:'home_assistant'}];
  card.setConfig({mode:'overview',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.equal(card.shadowRoot.querySelector('.place').textContent,'Ortuella');
  assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/de la ubicación de HA/);
  assert.doesNotMatch(card.shadowRoot.textContent,/Municipio detectado|La estación mide|Humedad fuera de rango/);
  card.remove();dom.window.close();
});


test('radar passes the selected locality coordinates to its marker',async()=>{
  const dom=setup(),h=hass();
  dom.window.customElements.define('euskalmet-local-radar-map-card',class extends dom.window.HTMLElement{setConfig(value){this.config=value;}set hass(value){this._hass=value;}});
  h.callWS=async()=>[{...location,entities:{...location.entities,radar:'camera.test'}}];
  const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'radar',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  const radar=card.shadowRoot.querySelector('euskalmet-local-radar-map-card');
  assert.equal(radar.config.locality,'Ortuella');assert.equal(radar.config.latitude,43.3);assert.equal(radar.config.longitude,-3.05);
  card.remove();dom.window.close();
});

test('radar marker moves with locality, keeps one marker and ignores invalid coordinates',()=>{
  const dom=setup();
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-radar-map-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  const radar=dom.window.document.createElement('euskalmet-local-radar-map-card'),markers=[];
  dom.window.L={circleMarker:(point,options)=>{
    const marker={point,options,element:dom.window.document.createElement('span'),addTo(){return this;},bindTooltip(label,settings){this.label=label;this.settings=settings;return this;},setLatLng(value){this.point=value;},setTooltipContent(value){this.label=value;},getElement(){return this.element;},remove(){this.removed=true;}};
    markers.push(marker);return marker;
  }};
  radar._map={setView(){},fitBounds(){}};
  radar.setConfig({entity:'camera.test',locality:'Ortuella',latitude:43.3,longitude:-3.05});
  assert.equal(markers.length,1);assert.equal(markers[0].label.textContent,'Ortuella');assert.equal(markers[0].settings.permanent,true);
  radar.setConfig({entity:'camera.test',locality:'Bilbao',latitude:43.26,longitude:-2.93});
  assert.equal(markers.length,1);assert.equal(markers[0].label.textContent,'Bilbao');assert.deepEqual(Array.from(markers[0].point),[43.26,-2.93]);
  radar.setConfig({entity:'camera.test',locality:'<img onerror=alert(1)>',latitude:43.26,longitude:-2.93});assert.equal(markers[0].label.querySelector('img'),null);
  radar.setConfig({entity:'camera.test',latitude:null,longitude:null});assert.equal(markers[0].removed,true);dom.window.close();
});


test('radar centers with local zoom on location changes, preserving manual navigation between updates',()=>{
  const dom=setup();
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-radar-map-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  const radar=dom.window.document.createElement('euskalmet-local-radar-map-card'),views=[],coverage=[];
  radar._map={setView:(point,zoom)=>views.push({point:Array.from(point),zoom}),fitBounds:(bounds)=>coverage.push(bounds)};
  radar.setConfig({entity:'camera.test',latitude:43.3,longitude:-3.05,locality:'Ortuella'});
  assert.deepEqual(views,[{point:[43.3,-3.05],zoom:10}]);
  radar.setConfig({entity:'camera.test',latitude:43.3,longitude:-3.05,locality:'Ortuella'});
  assert.equal(views.length,1);
  radar.setConfig({entity:'camera.test',latitude:43.26,longitude:-2.93,locality:'Bilbao'});
  assert.deepEqual(views.at(-1),{point:[43.26,-2.93],zoom:10});
  radar.setConfig({entity:'camera.test',latitude:43.26,longitude:-2.93,locality:'Bilbao',zoom:11});
  assert.equal(views.at(-1).zoom,11);
  radar.setConfig({entity:'camera.test',latitude:null,longitude:null});
  assert.equal(coverage.length,1);assert.equal(views.length,3);
  dom.window.close();
});


test('Mi ubicación returns from coverage and manual navigation without resetting radar playback',()=>{
  const dom=setup();
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-radar-map-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  const radar=dom.window.document.createElement('euskalmet-local-radar-map-card'),views=[],coverage=[];
  radar._map={setView:(point,zoom)=>views.push({point:Array.from(point),zoom}),fitBounds:bounds=>coverage.push(bounds)};
  radar.setConfig({entity:'camera.test',latitude:43.3,longitude:-3.05,locality:'Ortuella',zoom:10});
  const button=radar.shadowRoot.querySelector('.recenter');
  assert.equal(button.textContent,'Mi ubicación');assert.equal(button.disabled,false);
  radar._activeIndex=7;radar._playing=true;
  radar.shadowRoot.querySelector('.fit').click();assert.equal(coverage.length,1);
  button.click();assert.deepEqual(views.at(-1),{point:[43.3,-3.05],zoom:10});assert.equal(views.length,2);
  radar._map.setView([43.5,-3.5],8);
  button.click();assert.deepEqual(views.at(-1),{point:[43.3,-3.05],zoom:10});
  assert.equal(radar._activeIndex,7);assert.equal(radar._playing,true);
  radar.setConfig({entity:'camera.test',latitude:null,longitude:null});assert.equal(button.disabled,true);
  const count=views.length;button.click();assert.equal(views.length,count);dom.window.close();
});
