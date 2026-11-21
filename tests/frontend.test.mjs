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
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-alert-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/eguraldi-comparison-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/eguraldi-microclimate-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  for(const file of ['eguraldi-laundry-settings.js','eguraldi-drying-model.js','eguraldi-vehicle-wash-model.js','eguraldi-drying-style.js','eguraldi-outing-model.js','eguraldi-day-summary-model.js'])vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/'+file,import.meta.url),'utf8').replace(/^import .*;$/gm,'').replaceAll('export ',''),dom.getInternalVMContext());
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
  const history=card.shadowRoot.querySelector('eguraldi-history-card');
  assert.ok(history);assert.equal(requests.length,1);
  history.date=new Date(2025,3,1);
  current={...current,station:'Galindo',station_id:'C038',distance_km:4.7};
  count.events({data:{entry_id:'test'}});await flush();
  assert.equal(card.shadowRoot.querySelector('eguraldi-history-card'),history);
  assert.equal(history.data.station,'C038');assert.equal(requests.at(-1).month,4);assert.equal(requests.at(-1).year,2025);
  assert.match(card.shadowRoot.querySelector('#extra-title').textContent,/Ortuella/);
  assert.match(card.shadowRoot.querySelector('#extra-source').textContent,/Galindo.*4,7 km/);
  finishOld({station:'C061',items:[]});await flush();assert.equal(history.data.station,'C038');
  card.hass={...h,states:{...h.states,'light.unrelated':{state:'on'}}};await flush();assert.equal(requests.length,2);
  card.remove();assert.equal(count.eventSubscriptions,count.eventUnsubscribed);dom.window.close();
});

test('comparison labels and requested station update with the selected entry',async()=>{
  const dom=setup(),count={subscriptions:0,unsubscribed:0},h=hass(count);let current={...location,station_id:'C061'};
  h.callWS=async msg=>msg.type==='euskalmet_local/locations'?[current]:{};
  const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'comparison',entry_id:'test',comparison_entity:'sensor.balcony',comparison_name:'Balcón'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.equal(card.shadowRoot.querySelector('eguraldi-comparison-card').config.station_name,'Arboleda');
  current={...current,station:'Galindo',station_id:'C038',distance_km:4.7};count.events({data:{entry_id:'test'}});await flush();
  const comparison=card.shadowRoot.querySelector('eguraldi-comparison-card');assert.equal(comparison.config.station_name,'Galindo');assert.equal(comparison.config.comparison_entity,'sensor.balcony');
  card.remove();dom.window.close();
});

test('comparison ignores a response from before disconnection and reconnects',async()=>{
  const dom=setup(),h=hass(),card=dom.window.document.createElement('eguraldi-comparison-card');let finishOld,requests=0;
  h.callWS=async()=>{requests++;if(requests===1)return new Promise(resolve=>{finishOld=resolve;});return {'sensor.temp':[]};};
  card.setConfig({entity:'sensor.temp'});card.hass=h;dom.window.document.body.append(card);await flush();card.remove();dom.window.document.body.append(card);await flush();
  assert.equal(requests,2);finishOld({'sensor.temp':[{start:0,mean:999}]});await flush();assert.equal(card._data.series[0].length,0);card.remove();dom.window.close();
});

test('all mounted card modes adopt the new locality and nearest station on the same entry',async()=>{
  const dom=setup();
  for(const tag of ['eguraldi-radar-map-card','euskalmet-local-alert-card']){
    if(!dom.window.customElements.get(tag))dom.window.customElements.define(tag,class extends dom.window.HTMLElement{setConfig(value){this.config=value;}set hass(value){this._hass=value;}});
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
    if(mode==='history')assert.equal(card.shadowRoot.querySelector('eguraldi-history-card').data.station,'C058');
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
  dom.window.customElements.define('eguraldi-radar-map-card',class extends dom.window.HTMLElement{setConfig(value){this.config=value;}set hass(value){this._hass=value;}});
  h.callWS=async()=>[{...location,entities:{...location.entities,radar:'camera.test'}}];
  const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'radar',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  const radar=card.shadowRoot.querySelector('eguraldi-radar-map-card');
  assert.equal(radar.config.locality,'Ortuella');assert.equal(radar.config.latitude,43.3);assert.equal(radar.config.longitude,-3.05);
  card.remove();dom.window.close();
});

test('radar marker moves with locality, keeps one marker and ignores invalid coordinates',()=>{
  const dom=setup();
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-radar-map-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  const radar=dom.window.document.createElement('euskalmet-local-radar-map-card'),markers=[];
  dom.window.L={divIcon:options=>options,marker:(point,options)=>{
    const marker={point,options,icon:options.icon,element:dom.window.document.createElement('div'),addTo(){return this;},setLatLng(value){this.point=value;},setIcon(value){this.icon=value;},getElement(){return this.element;},remove(){this.removed=true;}};
    markers.push(marker);return marker;
  }};
  radar._map={setView(){},fitBounds(){}};
  radar.setConfig({entity:'camera.test',locality:'Ortuella',latitude:43.3,longitude:-3.05});
  assert.equal(markers.length,1);assert.equal(markers[0].icon.html.querySelector('.eguraldi-marker-label').textContent,'Ortuella');assert.ok(markers[0].icon.html.querySelector('.eguraldi-marker-dot'));assert.deepEqual(Array.from(markers[0].icon.iconAnchor),[8,8]);
  radar.setConfig({entity:'camera.test',locality:'Bilbao',latitude:43.26,longitude:-2.93});
  assert.equal(markers.length,1);assert.equal(markers[0].icon.html.querySelector('.eguraldi-marker-label').textContent,'Bilbao');assert.deepEqual(Array.from(markers[0].point),[43.26,-2.93]);
  radar.setConfig({entity:'camera.test',locality:'<img onerror=alert(1)>',latitude:43.26,longitude:-2.93});assert.equal(markers[0].icon.html.querySelector('img'),null);
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


test('visual editor persists locality and removes conflicting legacy entity',async()=>{
  const dom=setup(),editor=dom.window.document.createElement('euskalmet-local-editor'),h=hass();
  h.callWS=async()=>[location,{...location,entry_id:'other',locality:'Bilbao'}];
  editor.setConfig({type:'custom:euskalmet-local-card',mode:'hourly',entity:'weather.test'});editor.hass=h;
  dom.window.document.body.append(editor);await flush();
  let saved;editor.addEventListener('config-changed',e=>saved=e.detail.config);
  const select=editor.querySelector('#eg-location');select.value='other';select.dispatchEvent(new dom.window.Event('change'));
  assert.equal(saved.entry_id,'other');assert.equal(saved.entity,undefined);assert.equal(saved.mode,'hourly');
  assert.equal(editor.querySelector('#eg-location').value,'other');dom.window.close();
});
test('visual radar editor validates zoom and does not interrupt typing on state updates',async()=>{
  const dom=setup(),editor=dom.window.document.createElement('euskalmet-local-editor'),h=hass();
  editor.setConfig({mode:'radar'});editor.hass=h;dom.window.document.body.append(editor);await flush();
  let saved;editor.addEventListener('config-changed',e=>saved=e.detail.config);
  const input=editor.querySelector('#eg-zoom');input.value='12';editor.hass={...h};assert.equal(editor.querySelector('#eg-zoom'),input);
  input.dispatchEvent(new dom.window.Event('change'));assert.equal(saved.zoom,12);
  const invalid=editor.querySelector('#eg-zoom');invalid.value='99';invalid.dispatchEvent(new dom.window.Event('change'));assert.equal(saved.zoom,12);
  dom.window.close();
});
test('explicit locality takes priority over legacy weather entity',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
  h.callWS=async()=>[location,{...location,entry_id:'other',locality:'Bilbao',entities:{...location.entities,weather:'weather.other'}}];
  h.states['weather.other']=h.states['weather.test'];
  card.setConfig({mode:'overview',entry_id:'other',entity:'weather.test'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.equal(card.shadowRoot.querySelector('.place').textContent,'Bilbao');dom.window.close();
});


test('Basque cards follow the profile language without resubscribing or translating locality names',async()=>{
  const dom=setup(),h=hass(),count={subscriptions:0,unsubscribed:0};
  const current=hass(count);current.locale={language:'es'};
  const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'overview',entry_id:'test'});card.hass=current;dom.window.document.body.append(card);await flush();
  const before=count.subscriptions;card.hass={...current,locale:{language:'eu'}};await flush();
  assert.equal(card.shadowRoot.querySelector('.place').textContent,'Ortuella');
  assert.match(card.shadowRoot.querySelector('.metrics').textContent,/Haizea.*Gaurko euria.*Hezetasuna/);
  assert.match(card.shadowRoot.querySelector('.measurement-source').textContent,/Neurketak: Arboleda/);
  assert.equal(count.subscriptions,before);
  for(const [mode,label] of [['hourly','hurrengo 24 orduak'],['daily','hurrengo egunak'],['summaries','gaurko laburpena'],['environment','kostaldea eta ingurumena']]){
    card.setConfig({mode,entry_id:'test'});await flush();assert.match(card.shadowRoot.querySelector('h2').textContent,new RegExp(label));
    if(mode==='hourly')assert.equal(card.shadowRoot.querySelectorAll('.hour').length,24);
    if(mode==='daily')assert.equal(card.shadowRoot.querySelector('.day strong').textContent,'Gaur');
  }
  card.hass={...current,locale:{language:'es'}};await flush();assert.match(card.shadowRoot.querySelector('h2').textContent,/costa y ambiente/);
  dom.window.close();
});
test('Basque visual editor and historical controls update when profile language changes',async()=>{
  const dom=setup(),h=hass(),editor=dom.window.document.createElement('euskalmet-local-editor');
  editor.setConfig({mode:'radar',entry_id:'test'});editor.hass=h;dom.window.document.body.append(editor);await flush();
  editor.hass={...h,locale:{language:'eu-ES'}};assert.match(editor.textContent,/Ikuspegia.*Kokapena.*Maparen zooma/s);assert.equal(editor.querySelector('#eg-location').value,'test');
  const history=dom.window.document.createElement('euskalmet-local-history-card');history.setConfig({entity:'sensor.temp'});history.hass={...h,locale:{language:'eu'}};
  assert.match(history.shadowRoot.textContent,/Tenperatura/);
  dom.window.close();
});


test('Basque short dates work even when the browser lacks Basque locale data',()=>{
  const dom=setup(),Native=dom.window.Intl.DateTimeFormat;
  dom.window.Intl.DateTimeFormat=function(locale,options){return new Native(locale==='eu-ES'?'es-ES':locale,options);};
  const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'daily'});card.hass={...hass(),locale:{language:'eu'}};
  assert.equal(card._time('2026-11-15T12:00:00Z',{weekday:'short'}),'ig.');
  assert.equal(card._time('2026-11-15T12:00:00Z',{weekday:'long'}),'igandea');
  assert.match(card._time('2026-11-15T12:00:00Z',{day:'numeric',month:'short'}),/aza\./);
  dom.window.close();
});


test('hourly chart preserves missing slots and separates temperature and rainfall units',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
  const anchor=Math.ceil(Date.now()/3600000)*3600000;
  const rows=[0,1,3].map((i)=>({datetime:new Date(anchor+i*3600000).toISOString(),temperature:10+i,precipitation:i===1?null:.2,condition:'rainy'}));
  h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='weather/subscribe_forecast')cb({forecast:msg.forecast_type==='hourly'?rows:[]});return()=>{};};
  card.setConfig({mode:'hourly_chart'});card.hass=h;dom.window.document.body.append(card);await flush();
  const root=card.shadowRoot;
  assert.equal(root.querySelectorAll('.chart-point').length,3);assert.equal(root.querySelectorAll('.chart-bar').length,2);assert.equal(root.querySelectorAll('.chart-temp').length,2);
  assert.match(root.querySelector('.forecast-legend').textContent,/mm/);assert.doesNotMatch(root.querySelector('.forecast-legend').textContent,/Probabilidad|%/);
  assert.doesNotMatch(root.querySelector('svg').outerHTML,/NaN|Infinity/);
  assert.equal(card._rainMetric([{precipitation_probability:40}]).unit,'%');assert.equal(card._rainMetric([{precipitation:null}]).value({precipitation:null}),null);
  dom.window.close();
});
test('weekly tiles show missing daily rain honestly and all new modes update in Basque',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h={...hass(),locale:{language:'eu'}};
  card.setConfig({mode:'daily_tiles'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.equal(card.shadowRoot.querySelectorAll('.week-tile').length,7);
  assert.equal(card.shadowRoot.querySelector('.week-day').textContent,'Gaur');
  assert.match(card.shadowRoot.querySelector('h2').textContent,/Hurrengo egunak/);
  card._forecasts.daily=card._forecasts.daily.map(({precipitation,...f})=>f);card._render();
  assert.equal(card.shadowRoot.querySelectorAll('.week-rain').length,0);
  card._forecasts.daily[0].precipitation=0;card._render();
  assert.equal(card.shadowRoot.querySelectorAll('.week-rain').length,1);
  assert.match(card.shadowRoot.querySelector('.week-rain').textContent,/0 mm/);
  card.setConfig({mode:'planning'});await flush();assert.equal(card.shadowRoot.querySelectorAll('.planning-hour').length,8);assert.match(card.shadowRoot.querySelector('h2').textContent,/Aterkia ala jaka/);
  dom.window.close();
});
test('planning labels maximum wind honestly and excludes gusts beyond twelve hours',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'planning'});card.hass=hass();dom.window.document.body.append(card);await flush();
  card._forecasts.hourly=forecasts.map((f,i)=>({...f,precipitation:null,wind_gust_speed:i===20?99:null}));card._render();
  assert.match(card.shadowRoot.querySelector('.planning-summary').textContent,/Lluvia sin datos publicados.*Viento máximo previsto/s);
  assert.doesNotMatch(card.shadowRoot.querySelector('.planning-summary').textContent,/99|Racha máxima/);
  const button=card.shadowRoot.querySelector('[data-planning-radar]');button.click();
  assert.equal(card.shadowRoot.querySelector('#planning-radar euskalmet-local-card')._config.entry_id,'test');
  assert.equal(card.shadowRoot.querySelector('[data-planning-radar]').getAttribute('aria-expanded'),'true');
  dom.window.close();
});
test('embedded alerts have one visible title and the radar defaults to satellite without heading',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
  const loc={...location,entities:{...location.entities,alert_level:'sensor.alert'}};h.callWS=async()=>[loc];h.states['sensor.alert']={state:'none',attributes:{alerts:[]}};
  card.setConfig({mode:'alerts'});card.hass=h;dom.window.document.body.append(card);await flush();
  const alerts=card.shadowRoot.querySelector('eguraldi-alert-card');assert.ok(alerts);assert.equal(alerts.shadowRoot.querySelector('.title').hidden,true);assert.equal(card.shadowRoot.querySelector('#extra-source').hidden,true);assert.ok(alerts.shadowRoot.querySelector('.card.embedded'));
  card.setConfig({mode:'radar'});await flush();assert.equal(card.shadowRoot.querySelector('#extra-heading').hidden,true);
  dom.window.close();
});


test('comparison uses matching completed intervals, units and gaps instead of fabricated values',async()=>{
  const dom=setup(),h=hass(),card=dom.window.document.createElement('eguraldi-comparison-card'),end=Math.floor(Date.now()/300000)*300000;
  const row=(offset,mean,min=mean,max=mean)=>({start:end-offset*300000,mean,min,max});let request;
  h.states['sensor.temp'].attributes.unit_of_measurement='°C';h.states['sensor.balcony']={state:'68',attributes:{unit_of_measurement:'°F'}};
  h.callWS=async msg=>{request=msg;return {'sensor.temp':[row(4,10),row(3,null),row(2,12),row(1,14)],'sensor.balcony':[row(4,12),row(2,15),row(0,100)]};};
  card.setConfig({entity:'sensor.temp',comparison_entity:'sensor.balcony',comparison_name:'Balcón',station_name:'Arboleda'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.deepEqual(JSON.parse(JSON.stringify(request.units)),{temperature:'°C'});
  assert.equal(card.current('sensor.balcony'),20);assert.equal(card.pairs().length,2);assert.equal(card.pairs().reduce((a,b)=>a+b,0)/2,2.5);
  assert.equal(card._data.series[1].length,2);assert.equal(card.shadowRoot.querySelectorAll('svg path').length,4);
  assert.match(card.shadowRoot.querySelector('.difference').textContent,/2 intervalos coincidentes.*\+2,5/s);
  card.hass={...h,locale:{language:'eu'}};assert.match(card.shadowRoot.querySelector('.difference').textContent,/Batez besteko aldea/);
  card.remove();dom.window.close();
});
test('monthly history rejects missing readings and splits lines at missing days',()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-history-card');card.setConfig({entity:'sensor.temp',embedded:true,show_title:false});card.date=new Date(2025,0,1);
  card.data={items:[{measureId:'temperature',dailySummaries:[{min:1,mean:2,max:3},{min:null,mean:null,max:null},{min:3,mean:4,max:5}]}]};card.loaded=true;card.render();
  assert.equal(card.value({mean:null},'mean'),null);assert.equal(card.value({mean:''},'mean'),null);assert.equal(card.value({mean:0},'mean'),0);
  assert.equal(card.shadowRoot.querySelectorAll('path.line').length,6);
  assert.equal(card.shadowRoot.querySelectorAll('.history-metrics>div').length,3);assert.ok(card.shadowRoot.querySelector('ha-card.embedded'));
  card.date=new Date();assert.equal(card.plotDays(),new Date().getDate());dom.window.close();
});

test('weekly ranges use a shared temperature scale and omit missing pairs',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');
  card.setConfig({mode:'daily_tiles'});card.hass=hass();dom.window.document.body.append(card);await flush();
  const anchor=Date.now();
  card._forecasts.daily=[[0,10],[5,20],[null,15],[10,10]].map(([templow,temperature],i)=>({datetime:new Date(anchor+i*86400000).toISOString(),templow,temperature,condition:'sunny'}));card._render();
  const tiles=card.shadowRoot.querySelectorAll('.week-tile');
  assert.equal(tiles[0].querySelector('.week-range').style.left,'0%');assert.equal(tiles[0].querySelector('.week-range').style.width,'50%');
  assert.equal(tiles[1].querySelector('.week-range').style.left,'25%');assert.equal(tiles[1].querySelector('.week-range').style.width,'75%');
  assert.equal(tiles[2].querySelector('.week-track'),null);assert.equal(tiles[3].querySelector('.week-range').style.width,'0%');
  assert.match(tiles[0].querySelector('.week-values').textContent,/Máxima.*Mínima/);
  for(const mode of ['overview','hourly','daily','hourly_chart','daily_tiles','planning']){card.setConfig({mode});await flush();assert.equal(card.shadowRoot.querySelector('.forecast-foot,.source'),null);}
  dom.window.close();
});

test('radar translates existing controls without rebuilding its map',()=>{
  const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'outside-only'});
  vm.runInContext(readFileSync(new URL('../custom_components/euskalmet_local/frontend/euskalmet-radar-map-card.js',import.meta.url),'utf8'),dom.getInternalVMContext());
  const radar=dom.window.document.createElement('eguraldi-radar-map-card');radar.setConfig({entity:'camera.test',embedded:true,show_header:false});
  const shell=radar.shadowRoot.querySelector('.map');radar.hass={locale:{language:'eu'},states:{}};
  assert.equal(radar.shadowRoot.querySelector('.recenter').textContent,'Nire kokapena');assert.equal(radar.shadowRoot.querySelector('.opacity').getAttribute('aria-label'),'Opakutasuna');
  assert.equal(radar.shadowRoot.querySelector('.map'),shell);assert.equal(radar.shadowRoot.querySelector('.radar-card').classList.contains('embedded'),true);
  radar.hass={locale:{language:'es'},states:{}};assert.equal(radar.shadowRoot.querySelector('.recenter').textContent,'Mi ubicación');assert.equal(radar.shadowRoot.querySelector('.map'),shell);dom.window.close();
});

test('history pickers select measures, navigate years and block future months',async()=>{
  const dom=setup(),card=dom.window.document.createElement('eguraldi-history-card');card.setConfig({entity:'sensor.temp'});card.hass=hass();dom.window.document.body.append(card);await flush();
  let root=card.shadowRoot;assert.equal(root.querySelector('select,input[type="month"]'),null);
  root.querySelector('[data-measure="humidity"]').click();assert.equal(card.config.measure,'humidity');assert.match(root.querySelector('#measure').textContent,/Humedad/);
  card._picker='date';card.render();root.querySelector('[data-year-step="-1"]').click();assert.equal(card._pickerYear,new Date().getFullYear()-1);assert.equal(root.querySelector('[data-picker="date"]').open,true);
  root.querySelector('[data-month="2"]').click();await flush();assert.equal(card.date.getMonth(),1);assert.equal(card.date.getFullYear(),new Date().getFullYear()-1);
  card.changeDate(new Date().getFullYear(),new Date().getMonth()+1);await flush();
  for(const button of root.querySelectorAll('[data-month]'))assert.equal(button.disabled,Number(button.dataset.month)>new Date().getMonth()+1);
  root.querySelector('#month').dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(root.querySelector('[data-picker="date"]').open,false);
  card.hass={...hass(),locale:{language:'eu'}};assert.match(root.querySelector('#month').textContent,new RegExp(card.monthLabel(new Date().getMonth())));dom.window.close();
});

test('history ignores old month responses after a fast date change',async()=>{
  const dom=setup(),card=dom.window.document.createElement('eguraldi-history-card'),pending=[];
  card.setConfig({entity:'sensor.temp'});card.hass={...hass(),callWS:message=>new Promise(resolve=>pending.push({message,resolve}))};dom.window.document.body.append(card);await flush();
  card.shift(-1);await flush();assert.equal(pending.length,2);
  pending[1].resolve({items:[],month:'new'});await flush();pending[0].resolve({items:[],month:'old'});await flush();assert.equal(card.data.month,'new');dom.window.close();
});

test('microclimate blocks unvalidated estimates, handles missing values and translates live',()=>{
  const dom=setup(),card=dom.window.document.createElement('eguraldi-microclimate-card');
  card.setConfig({entity:'sensor.micro',enabled:true,station_name:'Arboleda'});
  let h={...hass(),locale:{language:'es'},states:{'sensor.micro':{state:'learning',attributes:{paired_hours:0,days:0,coverage_percent:0,estimate:null,outdoor_temperature:0,reference_temperature:2,current_difference:-2,sensor_name:'<img onerror=alert(1)>'}}}};
  card.hass=h;dom.window.document.body.append(card);
  assert.equal(card.shadowRoot.querySelector('.estimate'),null);assert.match(card.shadowRoot.querySelector('.now').textContent,/0/);assert.equal(card.shadowRoot.querySelector('.now img'),null);
  h={...h,states:{'sensor.micro':{state:'validated',attributes:{...h.states['sensor.micro'].attributes,estimate:12.4,baseline_mae:2,adjusted_mae:.5,improvement_percent:75,hourly:[{hour:0,correction:2,samples:20,method:'hourly'}]}}}};card.hass=h;
  assert.match(card.shadowRoot.querySelector('.estimate').textContent,/12,4/);assert.equal(card.shadowRoot.querySelectorAll('[data-hour]').length,1);
  card.hass={...h,locale:{language:'eu'}};assert.match(card.shadowRoot.querySelector('.badge').textContent,/Egiaztatua/);assert.match(card.shadowRoot.querySelector('.method').textContent,/Home Assistanten/);
  card.setConfig({enabled:false});assert.match(card.shadowRoot.textContent,/Aktibatu/);assert.equal(card.shadowRoot.querySelector('.now'),null);dom.window.close();
});

test('microclimate mode follows its entry and never picks another home sensor',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
  h.callWS=async()=>[{...location,microclimate_enabled:true,entities:{...location.entities,microclimate_status:'sensor.micro'}}];
  card.setConfig({mode:'microclimate'});card.hass=h;dom.window.document.body.append(card);await flush();
  const micro=card.shadowRoot.querySelector('eguraldi-microclimate-card');assert.ok(micro);assert.equal(micro.config.entity,'sensor.micro');assert.equal(micro.config.entry_id,'test');assert.equal(micro.config.enabled,true);
  dom.window.close();
});

test('overview offers microclimate without changing existing dashboards',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
  h.callWS=async()=>[{...location,microclimate_enabled:true,entities:{...location.entities,microclimate_status:'sensor.micro'}}];
  card.setConfig({mode:'overview'});card.hass=h;dom.window.document.body.append(card);await flush();
  const details=card.shadowRoot.querySelector('#overview-micro');assert.ok(details);assert.equal(details.open,false);assert.ok(details.querySelector('eguraldi-microclimate-card'));
  details.open=true;details.dispatchEvent(new dom.window.Event('toggle'));card._render();assert.equal(card.shadowRoot.querySelector('#overview-micro').open,true);
  card.setConfig({mode:'overview',show_microclimate:false});await flush();assert.equal(card.shadowRoot.querySelector('#overview-micro'),null);dom.window.close();
});

test('microclimate validation graph preserves gaps and shows failed improvement honestly',()=>{
  const dom=setup(),card=dom.window.document.createElement('eguraldi-microclimate-card');
  card.setConfig({entity:'sensor.micro',enabled:true});
  const rows=[0,1,3].map(h=>({timestamp:1794866400+h*3600,reference:10+h,outdoor:12+h,adjusted:14+h}));
  const attributes={training_hours:90,training_days:3,validation_days:1,validation_series:rows,baseline_mae:2,adjusted_mae:2,improvement_percent:0,validation_checks:{absolute_gain:false,relative_gain:false,each_day:false},validation_daily:[{date:'2026-11-16',hours:12,baseline_mae:2,adjusted_mae:2,improved:false}]};
  card.hass={...hass(),states:{'sensor.micro':{state:'not_improved',attributes}}};
  dom.window.document.body.append(card);
  assert.deepEqual([...card.shadowRoot.querySelectorAll('progress')].map(p=>[p.value,p.max]),[[72,72],[3,5],[1,2]]);
  assert.equal(card.shadowRoot.querySelectorAll('.series-chart path').length,3);
  for(const p of card.shadowRoot.querySelectorAll('.series-chart path'))assert.equal((p.getAttribute('d').match(/M/g)||[]).length,2);
  assert.equal(card.shadowRoot.querySelectorAll('.check.pass').length,0);
  assert.equal(card.shadowRoot.querySelector('.estimate'),null);
  const first=card.shadowRoot.querySelector('[data-sample]');first.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  assert.equal(card.sample,rows[0].timestamp);assert.match(card.shadowRoot.querySelector('.sample-values').textContent,/12/);
  card.hass={...hass(),locale:{language:'eu'},states:{'sensor.micro':{state:'learning',attributes:{training_hours:0,training_days:0,validation_days:0}}}};
  assert.equal(card.shadowRoot.querySelector('.series-chart'),null);assert.match(card.shadowRoot.querySelector('.progress').textContent,/Ikaskuntzaren aurrerapena/);dom.window.close();
});

test('drying view subscribes to optional humidity, updates entries, and releases every subscription',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass(),counter={subscribed:0,unsubscribed:0},callbacks={};
  h.states['weather.rh']={state:'cloudy',attributes:{friendly_name:'Humedad local',supported_features:2}};
  h.connection.subscribeMessage=async(cb,msg)=>{counter.subscribed++;if(msg.type==='subscribe_events')callbacks.event=cb;else {callbacks[msg.entity_id+':'+msg.forecast_type]=cb;const hourly=forecasts.map(f=>({...f,datetime:new Date(Math.ceil(Date.parse(f.datetime)/3600000)*3600000).toISOString(),condition:'sunny',precipitation:0,temperature:22,wind_speed:12}));cb({forecast:msg.entity_id==='weather.rh'?hourly.map(f=>({datetime:f.datetime,humidity:50})):hourly});}return()=>counter.unsubscribed++;};
  card.setConfig({mode:'drying',humidity_forecast_entity:'weather.rh',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
  assert.equal(counter.subscribed,4);assert.ok(card.shadowRoot.querySelector('.dry-hero'));assert.match(card.shadowRoot.querySelector('.dry-source').textContent,/Humedad local/);
  assert.ok(card.shadowRoot.querySelectorAll('.dry-hour').length>=23);
  card.shadowRoot.querySelector('[data-drying-duration="4"]').click();assert.equal(card._dryingDuration,4);
  const oldHumidity=callbacks['weather.rh:hourly'];
  let next={...location,locality:'Bilbao',station_id:'C999',entities:{...location.entities,weather:'weather.new'}};h.states['weather.new']=h.states['weather.test'];h.callWS=async()=>[next];callbacks.event({data:{entry_id:'test'}});await flush();
  oldHumidity({forecast:[]});assert.equal(card._humidityMismatch,true);assert.equal(card._humidityForecast.length,0);assert.match(card.shadowRoot.querySelector('.forecast-kicker').textContent,/Bilbao/);
  h.states['weather.rh']={...h.states['weather.rh'],state:'unavailable'};card.hass={...h,states:{...h.states}};card._render();assert.match(card.shadowRoot.textContent,/orientativa|esperar/);
  card.remove();assert.equal(counter.subscribed,counter.unsubscribed);dom.window.close();
});

test('drying editor persists a supplemental humidity source and translates the new view',async()=>{
  const dom=setup(),editor=dom.window.document.createElement('euskalmet-local-editor'),h=hass();h.states['weather.rh']={state:'cloudy',attributes:{friendly_name:'Humedad',supported_features:2}};
  editor.setConfig({mode:'drying'});editor.hass=h;dom.window.document.body.append(editor);await flush();
  let saved;editor.addEventListener('config-changed',e=>saved=e.detail.config);const select=editor.querySelector('#eg-drying-humidity');assert.ok(select);select.value='weather.rh';select.dispatchEvent(new dom.window.Event('change'));assert.equal(saved.humidity_forecast_entity,'weather.rh');assert.equal(saved.humidity_forecast_locality,'Ortuella');
  editor.hass={...h,locale:{language:'eu'}};assert.match(editor.textContent,/Arropa kanpoan zabal dezaket/);dom.window.close();
});

test('outing controls update the view, translate and follow locality changes',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),count={subscriptions:0,unsubscribed:0},h=hass(count);let loc={...location};h.callWS=async()=>[loc];
 card.setConfig({mode:'outing',entry_id:'test'});card.hass=h;dom.window.document.body.append(card);await flush();
 assert.ok(card.shadowRoot.querySelector('.outing'));assert.match(card.shadowRoot.textContent,/Previsión horaria/);
 card.shadowRoot.querySelector('[data-outing-activity="family"]').click();assert.equal(card._outingActivity,'family');
 card.shadowRoot.querySelector('[data-outing-minutes="90"]').click();assert.equal(card._outingMinutes,90);
 loc={...loc,locality:'Bilbao',station_id:'C999'};count.events({data:{entry_id:'test'}});await flush();assert.match(card.shadowRoot.querySelector('.forecast-kicker').textContent,/Bilbao/);
 card.hass={...h,locale:{language:'eu'}};await flush();assert.match(card.shadowRoot.querySelector('h2').textContent,/Kalera irteteko/);
 card.remove();assert.equal(count.subscriptions,count.unsubscribed);dom.window.close();
});


test('laundry is off by default and only controls the selected locality switch',async()=>{
  const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),ha=hass(),calls=[];
  const loc={...location,entities:{...location.entities,laundry_out:'switch.demo_laundry'}};
  ha.callWS=async()=>[loc];ha.callService=async(...args)=>calls.push(args);
  ha.states['switch.demo_laundry']={entity_id:'switch.demo_laundry',state:'off',attributes:{alerts_enabled:false,monitoring_status:'disabled'}};
  card.setConfig({mode:'drying'});card.hass=ha;dom.window.document.body.append(card);await flush();
  let button=card.shadowRoot.querySelector('[data-laundry-toggle]');
  assert.equal(button.disabled,true);assert.equal(button.getAttribute('aria-pressed'),'false');button.click();assert.equal(calls.length,0);
  assert.match(card.shadowRoot.querySelector('.laundry-control').textContent,/Avisos desactivados/);
  card.hass={...ha,states:{...ha.states,'switch.demo_laundry':{...ha.states['switch.demo_laundry'],attributes:{alerts_enabled:true,monitoring_status:'idle'}}}};await flush();
  button=card.shadowRoot.querySelector('[data-laundry-toggle]');button.click();await flush();
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),['switch','turn_on',{entity_id:'switch.demo_laundry'}]);
  card.hass={...ha,states:{...ha.states,'switch.demo_laundry':{entity_id:'switch.demo_laundry',state:'on',attributes:{alerts_enabled:true,monitoring_status:'watching'}}}};await flush();
  button=card.shadowRoot.querySelector('[data-laundry-toggle]');assert.match(button.textContent,/Ya he recogido/);button.click();await flush();
  assert.equal(calls[1][1],'turn_off');
  dom.window.close();
});


test('configure laundry opens the selected entry form without navigation and saves through HA',async()=>{
 const dom=setup();dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const card=dom.window.document.createElement('euskalmet-local-card'),ha=hass(),calls=[];
 ha.callWS=async()=>[{...location,entry_id:'chosen-entry',entities:{...location.entities,laundry_out:'switch.laundry'}}];
 ha.states['switch.laundry']={state:'off',attributes:{alerts_enabled:false,monitoring_status:'disabled'}};
 const fields=[['laundry_enabled',false],['laundry_target',''],['laundry_lead_minutes','30'],['laundry_rain',true],['laundry_wind',true],['laundry_wind_kmh',30],['laundry_start','08:00:00'],['laundry_end','22:00:00'],['laundry_cooldown_minutes','120']].map(([name,value])=>({name,default:value,...(['laundry_target','laundry_lead_minutes','laundry_cooldown_minutes'].includes(name)?{selector:{select:{options:name==='laundry_target'?[{value:'',label:'Select'},{value:'persistent_notification',label:'Home Assistant'}]:name==='laundry_lead_minutes'?['15','30','60']:['30','60','120','240']}}}:{})}));
 ha.callApi=async(...args)=>{calls.push(args);if(args[1].endsWith('/flow'))return {type:'menu',flow_id:'our-flow',menu_options:['laundry']};if(args[2]?.next_step_id)return {type:'form',step_id:'laundry',flow_id:'our-flow',data_schema:fields};return {type:'create_entry'};};
 card.setConfig({mode:'drying'});card.hass=ha;dom.window.document.body.append(card);await flush();
 card.shadowRoot.querySelector('[data-laundry-config]').click();await flush();
 assert.equal(calls[0][2].handler,'chosen-entry');assert.equal(calls[1][2].next_step_id,'laundry');assert.equal(dom.window.location.pathname,'/');
 const dialogHost=[...dom.window.document.body.children].find(el=>el.shadowRoot?.querySelector('dialog')),root=dialogHost.shadowRoot;
 assert.match(root.querySelector('h2').textContent,/Avisos de ropa/);assert.equal(root.querySelector('[name=laundry_enabled]').checked,false);
 root.querySelector('[name=laundry_target]').value='persistent_notification';root.querySelector('[name=laundry_enabled]').checked=true;
 root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await flush();
 assert.equal(calls[2][1],'config/config_entries/options/flow/our-flow');assert.equal(calls[2][2].laundry_enabled,true);assert.equal(calls[2][2].laundry_target,'persistent_notification');assert.equal(calls[2][2].laundry_wind_kmh,30);assert.equal(dialogHost.isConnected,false);assert.equal(calls.some(c=>c[0]==='DELETE'),false);
 dom.window.close();
});

test('laundry settings cancel aborts its flow and pending entry responses cannot reopen it',async()=>{
 const dom=setup();dom.window.HTMLDialogElement.prototype.showModal=function(){};dom.window.HTMLDialogElement.prototype.close=function(){};
 let resolve;const calls=[];const ha={callApi:async(...args)=>{calls.push(args);if(args[0]==='POST')return new Promise(r=>resolve=r);return {};}};
 const popup=dom.window.eval('openLaundrySettings')({hass:ha,entryId:'scoped',locality:'Demo',t:text=>text});
 popup.close();resolve({type:'menu',flow_id:'late',menu_options:['laundry']});await flush();
 assert.equal(calls.length,2);assert.equal(calls[1][0],'DELETE');assert.match(calls[1][1],/\/late$/);assert.equal(dom.window.document.body.children.length,0);dom.window.close();
});

test('laundry settings keeps validation errors and does not silently save',async()=>{
 const dom=setup();dom.window.HTMLDialogElement.prototype.showModal=function(){};dom.window.HTMLDialogElement.prototype.close=function(){};
 const form={type:'form',step_id:'laundry',flow_id:'errors',data_schema:[{name:'laundry_enabled',default:false},{name:'laundry_target',default:'',selector:{select:{options:[{value:'',label:'Select'}]}}}]};
 const ha={callApi:async(method,path,data)=>method==='DELETE'?{}:path.endsWith('/flow')?form:{...form,errors:{laundry_target:'laundry_target_required'}}};
 const popup=dom.window.eval('openLaundrySettings')({hass:ha,entryId:'scoped',locality:'Demo',t:text=>text});await flush();
 const root=dom.window.document.body.firstElementChild.shadowRoot;root.querySelector('[name=laundry_enabled]').checked=true;root.querySelector('form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await flush();
 assert.match(root.querySelector('[role=alert]').textContent,/Selecciona un destino/);assert.equal(root.querySelector('[name=laundry_enabled]').checked,true);assert.equal(root.querySelector('#save').disabled,false);popup.close();dom.window.close();
});


test('generic vehicle washing translates, follows locality and ignores legacy profiles',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h= hass(),count={};let loc={...location};
 h.callWS=async()=>[loc];h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='subscribe_events'){count.events=cb;return ()=>{};}cb({forecast:msg.forecast_type==='daily'?Array.from({length:7},(_,i)=>({datetime:new Date(now+i*86400000).toISOString(),condition:i===0?'rainy':'sunny',temperature:17,templow:9})):forecasts});return ()=>{};};
 card.setConfig({mode:'vehicle_wash',wash_vehicle:'motorcycle'});card.hass=h;dom.window.document.body.append(card);await flush();
 assert.equal(card.shadowRoot.querySelectorAll('.wash-day').length,7);assert.match(card.shadowRoot.querySelector('h2').textContent,/vehículo/);assert.match(card.shadowRoot.querySelector('.wash-detail').textContent,/Viento diario no disponible/);
 assert.equal(card.shadowRoot.querySelector('[data-wash-vehicle]'),null);
 card.shadowRoot.querySelectorAll('[data-wash-day]')[3].click();assert.equal(card.shadowRoot.querySelectorAll('.wash-day.selected').length,1);
 card.hass={...h,locale:{language:'eu'}};await flush();assert.match(card.shadowRoot.querySelector('h2').textContent,/ibilgailua/);
 loc={...loc,locality:'Bilbao',locality_id:'bilbao'};count.events({data:{entry_id:'test'}});await flush();assert.match(card.shadowRoot.querySelector('.forecast-kicker').textContent,/Bilbao/);
 const editor=dom.window.document.createElement('euskalmet-local-editor');editor.setConfig({mode:'vehicle_wash'});editor.hass=h;dom.window.document.body.append(editor);await flush();
 assert.equal(editor.querySelector('#eg-wash-vehicle'),null);card.remove();dom.window.close();
});


test('forecast subscription failure does not block the other type and retries without duplicates',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass(),calls={hourly:0,daily:0},unsubs=[];let retry;
 dom.window.setTimeout=fn=>{retry=fn;return 77;};dom.window.clearTimeout=()=>{};
 h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='subscribe_events')return ()=>{};calls[msg.forecast_type]++;if(msg.forecast_type==='hourly'&&calls.hourly===1)throw Error('offline');cb({forecast:forecasts});return ()=>unsubs.push(msg.forecast_type);};
 card.setConfig({mode:'hourly'});card.hass=h;dom.window.document.body.append(card);await flush();
 assert.equal(calls.hourly,1);assert.equal(calls.daily,1);assert.equal(card._forecasts.hourly.length,0);assert.equal(card._forecasts.daily.length,24);assert.match(card.shadowRoot.textContent,/Se reintentará/);
 retry();await flush();assert.equal(calls.hourly,2);assert.equal(calls.daily,1);assert.equal(card._forecasts.hourly.length,24);
 card.remove();assert.deepEqual(unsubs.sort(),['daily','hourly']);dom.window.close();
});

test('old forecast metadata pauses recommendations while current observations remain visible',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
 card.setConfig({mode:'vehicle_wash'});card.hass=h;dom.window.document.body.append(card);await flush();assert.equal(card.shadowRoot.querySelectorAll('.wash-day').length,7);
 const state=h.states['weather.test'];card.hass={...h,states:{...h.states,'weather.test':{...state,attributes:{...state.attributes,forecast_daily_stale:true}}}};await flush();
 assert.ok(card._forecast('daily').length===0);assert.match(card.shadowRoot.textContent,/Recomendaciones en pausa/);assert.match(card.shadowRoot.textContent,/Esperando una previsión válida/);assert.equal(card.shadowRoot.querySelectorAll('.wash-day.unknown').length,7);
 card.hass={...h,states:{...h.states,'weather.test':{...state,attributes:{...state.attributes,forecast_daily_stale:false,forecast_daily_updated:new Date().toISOString()}}}};await flush();assert.ok(card._forecast('daily').length>0);
 card.remove();dom.window.close();
});

test('disconnect clears forecast cache and ignores an old pending subscription',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();let resolve,oldCallback,unsubscribed=0;
 h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='subscribe_events')return ()=>{};oldCallback=cb;return new Promise(r=>resolve=r);};
 card.setConfig({mode:'hourly'});card.hass=h;dom.window.document.body.append(card);await flush();card.remove();oldCallback({forecast:forecasts});resolve(()=>unsubscribed++);await flush();assert.deepEqual(JSON.parse(JSON.stringify(card._forecasts)),{});assert.equal(unsubscribed,1);dom.window.close();
});


test('a failed locality catalogue retries and releases its previous event subscription',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass(),counter={};let calls=0,retry;
 dom.window.setTimeout=fn=>{retry=fn;return 12;};dom.window.clearTimeout=()=>{};
 h.callWS=async()=>{if(++calls===1)throw Error('temporarily offline');return [location];};
 const original=h.connection.subscribeMessage;h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='subscribe_events'){counter.events=(counter.events||0)+1;return ()=>counter.closed=(counter.closed||0)+1;}return original(cb,msg);};
 card.setConfig({mode:'hourly'});card.hass=h;dom.window.document.body.append(card);await flush();assert.equal(calls,1);
 card.hass={...h};await flush();assert.equal(calls,1);retry();await flush();assert.equal(calls,2);assert.equal(counter.events,2);assert.equal(counter.closed,1);assert.equal(card.shadowRoot.querySelectorAll('.hour').length,24);card.remove();assert.equal(counter.closed,2);dom.window.close();
});


test('recommendations expire by metadata time even before a new HA state arrives',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass(),state=h.states['weather.test'];
 h.states['weather.test']={...state,attributes:{...state.attributes,forecast_hourly_stale:false,forecast_hourly_updated:new Date(Date.now()-3*3600000).toISOString()}};
 card.setConfig({mode:'drying'});card.hass=h;dom.window.document.body.append(card);await flush();assert.equal(card._forecast('hourly').length,0);assert.match(card.shadowRoot.textContent,/Recomendaciones en pausa/);
 h.states['weather.test'].attributes.forecast_hourly_updated=new Date(Date.now()+60000).toISOString();card._render();assert.ok(card._forecast('hourly').length>0);card.remove();dom.window.close();
});


test('day summary opens matching detail cards, keeps locality and translates without new recommendations',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass(),count={};let loc={...location,entities:{...location.entities,alert_level:'sensor.alert'}};
 h.callWS=async()=>[loc];h.states['sensor.alert']={state:'none',attributes:{alerts:[]}};h.states['weather.test']={...h.states['weather.test'],attributes:{...h.states['weather.test'].attributes,alerts_updated:new Date().toISOString(),alerts_stale:false}};
 const original=h.connection.subscribeMessage;h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='subscribe_events'){if(!count.events)count.events=cb;return ()=>{};}return original(cb,msg);};
 card.setConfig({mode:'day_summary'});card.hass=h;dom.window.document.body.append(card);await flush();assert.equal(card.shadowRoot.querySelectorAll('.summary-row').length,4);assert.match(card.shadowRoot.textContent,/Sin avisos activos/);
 card.shadowRoot.querySelector('[data-summary-detail=outing]').click();await flush();let child=card.shadowRoot.querySelector('#summary-detail > euskalmet-local-card');assert.equal(child._config.mode,'outing');assert.equal(child._config.entry_id,'test');
 card.shadowRoot.querySelector('[data-summary-close]').click();assert.equal(card.shadowRoot.querySelector('#summary-detail'),null);
 card.hass={...h,locale:{language:'eu'}};await flush();assert.match(card.shadowRoot.querySelector('h2').textContent,/Zure eguna/);
 loc={...loc,locality:'Bilbao',locality_id:'new'};count.events({data:{entry_id:'test'}});await flush();assert.match(card.shadowRoot.querySelector('.forecast-kicker').textContent,/Bilbao/);
 card.remove();dom.window.close();
});
test('day summary does not claim no alerts or good weather when sources are stale',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass();
 h.states['weather.test']={...h.states['weather.test'],attributes:{...h.states['weather.test'].attributes,forecast_daily_stale:true,forecast_hourly_stale:true,alerts_stale:true}};
 card.setConfig({mode:'day_summary'});card.hass=h;dom.window.document.body.append(card);await flush();assert.equal(card.shadowRoot.querySelectorAll('.summary-row.unknown').length,4);assert.doesNotMatch(card.shadowRoot.textContent,/Sin avisos activos/);
 card.shadowRoot.querySelector('[data-summary-detail=alerts]').click();assert.match(card.shadowRoot.querySelector('#summary-detail').textContent,/No se pueden comprobar/);card.remove();dom.window.close();
});


test('summary detail stays mounted when a new subscriber broadcasts to every forecast listener',async()=>{
 const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),h=hass(),listeners={hourly:[],daily:[]};let subscriptions=0;
 h.connection.subscribeMessage=async(cb,msg)=>{if(msg.type==='subscribe_events')return ()=>{};subscriptions++;if(subscriptions>10)throw Error('subscription loop');const list=listeners[msg.forecast_type];list.push(cb);for(const fn of [...list])fn({forecast:forecasts});return ()=>{const index=list.indexOf(cb);if(index>=0)list.splice(index,1);};};
 card.setConfig({mode:'day_summary'});card.hass=h;dom.window.document.body.append(card);await flush();
 card.shadowRoot.querySelector('[data-summary-detail=outing]').click();await flush();await flush();const detail=card.shadowRoot.querySelector('#summary-detail > euskalmet-local-card');assert.ok(detail);assert.equal(subscriptions,4);
 card.hass={...h,states:{...h.states,'weather.test':{...h.states['weather.test'],attributes:{...h.states['weather.test'].attributes,temperature:15}}}};await flush();
 assert.equal(card.shadowRoot.querySelector('#summary-detail > euskalmet-local-card'),detail);assert.equal(subscriptions,4);assert.ok(detail._forecast('hourly').length);
 card.shadowRoot.querySelector('[data-summary-close]').click();assert.equal(card.shadowRoot.querySelector('#summary-detail'),null);assert.equal(listeners.hourly.length,1);card.remove();dom.window.close();
});


test('summary editor persists visible order and planning preferences without changing the source',async()=>{
 const dom=setup(),editor=dom.window.document.createElement('euskalmet-local-editor');editor.setConfig({mode:'day_summary',entry_id:'test',humidity_forecast_entity:'weather.other'});editor.hass=hass();dom.window.document.body.append(editor);await flush();
 let saved;editor.addEventListener('config-changed',e=>saved=e.detail.config);
 const change=(selector,value)=>{const input=editor.querySelector(selector);input.value=value;input.dispatchEvent(new dom.window.Event('change'));};
 change('#eg-outing_activity','family');change('#eg-outing_minutes','90');change('#eg-drying_hours','4');
 editor.querySelector('[data-summary-block="vehicle_wash"]').click();
 editor.querySelector('[data-summary-move="alerts"][data-direction="-1"]').click();
 assert.deepEqual(Array.from(saved.summary_blocks),['outing','alerts','drying']);assert.equal(saved.outing_activity,'family');assert.equal(saved.outing_minutes,90);assert.equal(saved.drying_hours,4);assert.equal(saved.humidity_forecast_entity,'weather.other');assert.equal(saved.entry_id,'test');
 const card=dom.window.document.createElement('euskalmet-local-card');card.setConfig(saved);card.hass=hass();dom.window.document.body.append(card);await flush();
 assert.deepEqual(Array.from(card.shadowRoot.querySelectorAll('[data-summary-detail]'),b=>b.dataset.summaryDetail),['outing','alerts','drying']);
 assert.match(card.shadowRoot.textContent,/90 min/);assert.match(card.shadowRoot.textContent,/4 h/);assert.doesNotMatch(card.shadowRoot.querySelector('.summary-horizon').textContent,/7/);
 card.setConfig({...saved,summary_blocks:['alerts','unknown','alerts']});await flush();assert.equal(card.shadowRoot.querySelectorAll('[data-summary-detail]').length,1);
 card.setConfig({...saved,summary_blocks:[]});await flush();assert.match(card.shadowRoot.textContent,/Selecciona al menos/);
 editor.hass={...hass(),language:'eu'};assert.match(editor.textContent,/Laburpenaren blokeak/);
 card.remove();editor.remove();dom.window.close();
});
