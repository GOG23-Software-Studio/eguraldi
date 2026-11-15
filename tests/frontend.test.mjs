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
