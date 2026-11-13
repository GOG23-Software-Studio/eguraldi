import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const sourcePath=new URL('../custom_components/euskalmet_local/frontend/euskalmet-local-card.js',import.meta.url);
const source=readFileSync(sourcePath,'utf8').replace(/^import .*;$/gm,'').replaceAll('export ','');
function setup(){
  const dom=new JSDOM('<body></body>',{url:'http://localhost',runScripts:'outside-only'});
  vm.runInContext(source+'\nwindow.logic={forecastRows,iconName,isNight,numeric,escapeHTML};',dom.getInternalVMContext());
  return dom;
}
const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
const location={entry_id:'test',locality:'Ortuella',station:'Arboleda',latitude:43.3,longitude:-3.05,distance_km:4,entities:{weather:'weather.test',humidity:'sensor.humidity',temperature:'sensor.temp'}};
const now=Date.now();
const forecasts=Array.from({length:24},(_,i)=>({datetime:new Date(now+i*3600000).toISOString(),condition:i%3?'partlycloudy':'rainy',temperature:11+i/10,wind_speed:8,precipitation:i%3?0:.2}));
function hass(counter={subscriptions:0,unsubscribed:0}){return {states:{'weather.test':{state:'partlycloudy',attributes:{temperature:11,temperature_unit:'°C',wind_speed_unit:'km/h'}},'sensor.temp':{attributes:{observed_at:new Date(now).toISOString()}},'sensor.humidity':{state:'unknown',attributes:{quality:'out_of_range',raw_value:101.2}}},config:{time_zone:'Europe/Madrid'},callWS:async()=>[location],connection:{subscribeMessage:async(callback,msg)=>{counter.subscriptions++;callback({forecast:msg.forecast_type==='hourly'?forecasts:forecasts.slice(0,7).map((f,i)=>({...f,datetime:new Date(now+i*86400000).toISOString(),templow:9}))});return ()=>counter.unsubscribed++;}}};}

test('24 hourly slots, six CSS columns, safe missing values',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'hourly'});card.hass=hass();dom.window.document.body.append(card);await flush();assert.equal(card.shadowRoot.querySelectorAll('.hour').length,24);assert.match(card.shadowRoot.querySelector('style').textContent,/repeat\(6,minmax\(0,1fr\)\)/);assert.equal(dom.window.logic.numeric(null),null);assert.equal(dom.window.logic.numeric('unavailable'),null);dom.window.close();});
test('day/night variants depend on each forecast hour',()=>{const dom=setup(),l=dom.window.logic;assert.equal(l.isNight('2026-07-01T00:00:00Z',43.3,-3),true);assert.equal(l.isNight('2026-07-01T12:00:00Z',43.3,-3),false);assert.equal(l.iconName('sunny',true),'clear-night');assert.equal(l.iconName('partlycloudy',true),'partly-cloudy-night');dom.window.close();});
test('unsubscribes on removal and reconnects once',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card'),count={subscriptions:0,unsubscribed:0};card.setConfig({mode:'hourly'});card.hass=hass(count);dom.window.document.body.append(card);await flush();assert.equal(count.subscriptions,2);card.remove();assert.equal(count.unsubscribed,2);dom.window.document.body.append(card);await flush();assert.equal(count.subscriptions,4);dom.window.close();});
test('multiple localities never silently choose first',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');const h=hass();h.callWS=async()=>[location,{...location,entry_id:'other',locality:'Bilbao'}];card.setConfig({mode:'hourly'});card.hass=h;dom.window.document.body.append(card);await flush();assert.ok(card.shadowRoot.querySelector('select'));assert.equal(card.shadowRoot.querySelectorAll('.hour').length,0);dom.window.close();});
test('invalid humidity is explicit and locality labels are escaped',async()=>{const dom=setup(),card=dom.window.document.createElement('euskalmet-local-card');card.setConfig({mode:'overview'});card.hass=hass();dom.window.document.body.append(card);await flush();assert.match(card.shadowRoot.textContent,/101,2/);assert.match(card.shadowRoot.textContent,/fuera de rango/);assert.equal(dom.window.logic.escapeHTML('<script>'),'&lt;script&gt;');dom.window.close();});
test('all referenced icon assets are packaged',()=>{const dom=setup();for(const condition of ['sunny','clear-night','partlycloudy','cloudy','rainy','pouring','fog','snowy','snowy-rainy','lightning','lightning-rainy','windy','hail','exceptional','unknown'])for(const night of [true,false])assert.ok(existsSync(new URL('../custom_components/euskalmet_local/frontend/icons/'+dom.window.logic.iconName(condition,night)+'.svg',import.meta.url)));dom.window.close();});
