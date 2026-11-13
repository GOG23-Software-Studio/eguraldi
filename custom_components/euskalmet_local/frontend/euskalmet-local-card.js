/* Eguraldi — GOG23 Software Studio. MIT. Icons: Meteocons / Bas Milius. */
import './euskalmet-alert-card.js';
import './euskalmet-history-card.js';
import './euskalmet-radar-map-card.js';

const BASE = '/euskalmet_local_static/';
const EXTRA_MODES = ['history','radar','alerts','summaries','comparison','environment'];
const CONDITIONS = {sunny:'Despejado','clear-night':'Despejado',partlycloudy:'Intervalos nubosos',cloudy:'Nuboso',rainy:'Lluvia',pouring:'Lluvia intensa',fog:'Niebla',snowy:'Nieve','snowy-rainy':'Aguanieve',lightning:'Tormenta','lightning-rainy':'Tormenta con lluvia',windy:'Viento','windy-variant':'Viento',hail:'Granizo',exceptional:'Condiciones excepcionales'};
const ICONS = {sunny:'clear-day','clear-night':'clear-night',partlycloudy:'partly-cloudy-day',cloudy:'cloudy',rainy:'rain',pouring:'extreme-rain',fog:'fog-day',snowy:'snow','snowy-rainy':'sleet',lightning:'thunderstorms-day','lightning-rainy':'thunderstorms-day-rain',windy:'wind','windy-variant':'wind',hail:'hail',exceptional:'weather-alert'};
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const numeric = value => value === null || value === undefined || value === '' || typeof value === 'boolean' || !Number.isFinite(Number(value)) ? null : Number(value);
const fmt = (value, digits=1) => numeric(value) === null ? '—' : Number(value).toLocaleString('es-ES',{maximumFractionDigits:digits});

export function isNight(datetime, latitude, longitude) {
  // Solar elevation approximation (NOAA), evaluated separately for each hour.
  const date=new Date(datetime), lat=numeric(latitude), lon=numeric(longitude);
  if (!Number.isFinite(date.getTime()) || lat===null || lon===null) return false;
  const day=(date-Date.UTC(date.getUTCFullYear(),0,0))/86400000;
  const gamma=2*Math.PI/365*(day-1+(date.getUTCHours()-12)/24);
  const decl=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
  const eq=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
  const hourAngle=((date.getUTCHours()*60+date.getUTCMinutes()+eq+4*lon)/4-180)*Math.PI/180;
  const phi=lat*Math.PI/180;
  return Math.sin(phi)*Math.sin(decl)+Math.cos(phi)*Math.cos(decl)*Math.cos(hourAngle)<0;
}

export function iconName(condition, night=false) {
  if (night && ['sunny','clear-night'].includes(condition)) return 'clear-night';
  if (!night && condition==='clear-night') return 'clear-day';
  if (night && condition==='partlycloudy') return 'partly-cloudy-night';
  if (night && condition==='fog') return 'fog-night';
  if (night && condition==='lightning') return 'thunderstorms-night';
  if (night && condition==='lightning-rainy') return 'thunderstorms-night-rain';
  return ICONS[condition] || 'not-available';
}

export function forecastRows(forecast, now=Date.now()) {
  return (Array.isArray(forecast)?forecast:[]).filter(f=>Number.isFinite(Date.parse(f.datetime)) && Date.parse(f.datetime)+3600000>now)
    .sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime)).slice(0,24);
}

const CSS = `
:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border-radius:24px;background:linear-gradient(145deg,#1b3246,#101e30);border:1px solid #9acdd926;box-shadow:0 12px 32px #0002;color:#edf8ff;font-family:var(--primary-font-family,system-ui);overflow:hidden}section{padding:20px}h2{font-size:21px;font-weight:550;margin:0 0 14px}h3{font-size:16px;margin:0}.eyebrow{font-size:10px;letter-spacing:2.5px;color:#91d9d1}.muted,.source{color:#a9becf;font-size:11px}.measurement-source{font-size:11px;line-height:1.5;font-weight:400}.source{margin:12px 0 0;line-height:1.4}.hero{background:radial-gradient(ellipse at top right,#326e8370,transparent 70%)}.place{font-size:27px;letter-spacing:-.5px;margin:8px 0 4px}.current{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:15px 0}.big{font-size:68px;letter-spacing:-3px;font-weight:300}.big small{font-size:23px;letter-spacing:0}.hero img{width:132px;height:116px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;border-top:1px solid #ffffff20;padding-top:14px;margin-top:18px;font-size:14px}.metrics small{display:block;color:#a9becf;font-size:10px;margin-top:4px}.warning{background:#efbc7b15;border-left:3px solid #efbc7b;color:#efca95;padding:10px 12px;border-radius:10px;font-size:12px;margin-top:12px}.hour-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px 0}.hour{min-width:0;text-align:center;border-bottom:1px solid #8db8d016;padding:0 1px 8px;line-height:1.25}.hour time{display:block;font-size:11px;color:#bbd0df}.hour .date{font-size:9px;color:#9cb2c4;min-height:12px}.hour .sky{height:53px;display:flex;align-items:center;justify-content:center;background:#87b5d00b}.sky img{width:59px;height:59px;max-width:100%;object-fit:contain}.temp{font-size:16px;font-weight:650;margin:3px 0}.wind,.rain{font-size:10px;color:#a8dce9;white-space:nowrap}.rain{min-height:12px}.days{display:grid;gap:6px}.day{display:grid;grid-template-columns:46px 48px 44px minmax(30px,1fr) 44px;align-items:center;gap:5px;min-height:45px;font-size:12px}.day img{width:48px;height:48px}.day strong:last-child{text-align:right}.track{height:7px;border-radius:8px;background:#94b9d017;position:relative}.range{position:absolute;height:100%;border-radius:8px;background:linear-gradient(90deg,#79d0c1,#ffdf85)}.low{color:#b5d2e4}.message{padding:24px;color:#a9becf;font-size:13px}.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}button,select{font:inherit;color:#d9edf6;background:#7dbbcc12;border:1px solid #b5ddeb28;border-radius:12px;padding:9px 12px;cursor:pointer}button.active{background:#62baa72b;border-color:#8ed9d1}button:focus-visible,select:focus-visible{outline:2px solid #8ed9d1;outline-offset:2px}.extras{display:grid;gap:12px;margin-top:15px}img{display:block}.divider{border-top:1px solid #ffffff16}select{max-width:100%;margin-bottom:14px}.error{color:#efca95} @media(max-width:380px){section{padding:15px 12px}.sky img{width:48px;height:48px}.hour .sky{height:47px}.wind,.rain{font-size:9px}.day{grid-template-columns:39px 38px 39px minmax(20px,1fr) 39px;gap:3px}.day img{width:38px;height:38px}.big{font-size:58px}.hero img{width:108px}.place{font-size:23px}}
`;

export class EuskalmetLocalCard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._forecasts={};this._unsubs=[];this._tab='hourly';}
  setConfig(config){
    if(!['dashboard','overview','hourly','daily',...EXTRA_MODES].includes(config.mode||'dashboard'))throw Error('Modo no válido');
    this._stop();this._config={...config,mode:config.mode||'dashboard'};this._location=null;this._locations=null;this._forecasts={};this._error=null;this._start();this._render();
  }
  set hass(value){const previous=this._hass;this._hass=value;this._start();const changed=!previous||!this._location||Object.values(this._location.entities).some(id=>previous.states[id]!==value.states[id])||previous.config?.time_zone!==value.config?.time_zone;if(changed&&!this._renderScheduled){this._renderScheduled=true;queueMicrotask(()=>{this._renderScheduled=false;this._render();});}}
  connectedCallback(){this._start();}
  disconnectedCallback(){this._stop();}
  _stop(){this._generation++;this._extraRevision=(this._extraRevision||0)+1;this._extraPending=null;for(const unsubscribe of this._unsubs.splice(0))unsubscribe();this._starting=false;}
  async _start(){
    if(!this._hass||!this._config||!this.isConnected||this._starting||this._unsubs.length)return;
    this._starting=true;const generation=this._generation;
    try{
      const unsubscribeEvents=await this._hass.connection.subscribeMessage(event=>{
        if(generation!==this._generation)return;
        const entry=event.data?.entry_id;
        if(entry&&this._location&&entry!==this._location.entry_id)return;
        // Reload metadata and forecasts after HA has rebuilt the entry's entities.
        this._stop();this._error=null;this._start();
      },{type:'subscribe_events',event_type:'euskalmet_local_locations_updated'});
      if(generation!==this._generation){unsubscribeEvents();return;}this._unsubs.push(unsubscribeEvents);
      const locations=await this._hass.callWS({type:'euskalmet_local/locations'});
      if(generation!==this._generation)return;
      this._locations=locations;
      const selected=locations.find(l=>l.entry_id===this._config.entry_id||l.entities.weather===this._config.entity) || (!this._config.entry_id&&!this._config.entity&&locations.length===1?locations[0]:null);
      if(this._location&&(selected?.locality_id!==this._location.locality_id||selected?.station_id!==this._location.station_id||selected?.locality!==this._location.locality))this._forecasts={};
      this._location=selected;
      this._render();
      if(!this._location){this._render();return;}
      if(EXTRA_MODES.includes(this._config.mode)){this._render();return;}
      const weather=this._location.entities.weather;
      if(!weather)throw Error('La entidad meteorológica no está disponible.');
      for(const type of ['hourly','daily']){
        const unsubscribe=await this._hass.connection.subscribeMessage(event=>{
          if(generation!==this._generation)return;
          this._forecasts[type]=event.forecast||[];this._forecastErrors??={};delete this._forecastErrors[type];this._render();
        },{type:'weather/subscribe_forecast',forecast_type:type,entity_id:weather});
        if(generation!==this._generation){unsubscribe();return;}this._unsubs.push(unsubscribe);
      }
    }catch(error){if(generation===this._generation){this._error='No se ha podido cargar la previsión. Comprueba la integración y vuelve a abrir la tarjeta.';this._render();}}
    finally{if(generation===this._generation)this._starting=false;}
  }
  _state(key){return this._hass?.states[this._location?.entities[key]];}
  _time(value,options){return new Date(value).toLocaleString('es-ES',{timeZone:this._hass?.config?.time_zone||'Europe/Madrid',...options});}
  _icon(condition,datetime){const night=isNight(datetime,this._location.latitude,this._location.longitude);return `<img src="${BASE}icons/${iconName(condition,night)}.svg" alt="${escapeHTML(CONDITIONS[condition]||'Sin datos')}" loading="lazy">`;}
  _weather(){return this._state('weather')?.attributes||{};}
  _overview(){
    const weather=this._state('weather'),a=weather?.attributes||{},humidity=this._state('humidity');
    const invalid=humidity?.attributes.quality==='out_of_range';
    const observed=this._state('temperature')?.attributes.observed_at;
    const age=observed?(Date.now()-Date.parse(observed))/60000:null;
    const stale=age===null||age>45||this._state('temperature')?.attributes.stale===true;
    return `<section class="hero"><div class="eyebrow">EGURALDI</div><h2 class="place">${escapeHTML(this._location.locality)}</h2><div class="muted measurement-source">Mediciones en ${escapeHTML(this._location.station)}${numeric(this._location.distance_km)===null?'':` · a ${fmt(this._location.distance_km)} km de ${escapeHTML(this._location.locality)}`}</div><div class="current"><div class="big">${fmt(a.temperature)}<small> ${escapeHTML(a.temperature_unit||'°C')}</small></div>${this._icon(weather?.state,Date.now())}</div><div>${escapeHTML(CONDITIONS[weather?.state]||'Esperando observaciones')}</div><div class="metrics"><div>${fmt(a.wind_speed)} ${escapeHTML(a.wind_speed_unit||'km/h')}<small>Viento</small></div><div>${fmt(this._state('precipitation_today')?.state)} mm<small>Lluvia hoy</small></div><div>${invalid?'Sin validar':fmt(a.humidity)+' %'}<small>Humedad</small></div></div><div class="source ${stale?'error':''}">${stale?'Revisar antigüedad':'Última lectura'} · ${observed?escapeHTML(this._time(observed,{hour:'2-digit',minute:'2-digit'})):'sin fecha'}</div>${invalid?`<div class="warning">Humedad fuera de rango: Euskalmet publica ${fmt(humidity.attributes.raw_value)} %. Se conserva el valor original en los atributos.</div>`:''}<div class="source">La estación mide en su propia ubicación y altitud; las condiciones pueden diferir de las de tu localidad.</div></section>`;
  }
  _hourly(){
    const forecast=forecastRows(this._forecasts.hourly),units=this._weather();
    return `<section><h2>${escapeHTML(this._location.locality)} · próximas 24 horas</h2>${forecast.length?`<div class="hour-grid">${forecast.map(f=>`<div class="hour"><div class="sky">${this._icon(f.condition,f.datetime)}</div><div class="date">${escapeHTML(this._time(f.datetime,{day:'numeric',month:'short'}))}</div><time datetime="${escapeHTML(f.datetime)}">${escapeHTML(this._time(f.datetime,{hour:'2-digit',minute:'2-digit'}))}</time><div class="temp">${fmt(f.temperature,0)}°</div><div class="wind">${fmt(f.wind_speed,0)} ${escapeHTML(units.wind_speed_unit||'km/h')}</div><div class="rain">${numeric(f.precipitation)!==null?fmt(f.precipitation)+' '+escapeHTML(units.precipitation_unit||'mm'):'—'}</div></div>`).join('')}</div>`:'<div class="message">Esperando previsión horaria…</div>'}<div class="source">Euskalmet · cada columna representa una hora. Lluvia acumulada por hora; — significa dato no publicado.</div></section>`;
  }
  _daily(){
    const zone=this._hass?.config?.time_zone||'Europe/Madrid';
    const dayKey=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone}).format(new Date(value));
    const today=dayKey(Date.now()),forecast=(this._forecasts.daily||[]).filter(f=>Number.isFinite(Date.parse(f.datetime))&&dayKey(f.datetime)>=today).slice(0,7);
    const vals=forecast.flatMap(f=>[numeric(f.templow),numeric(f.temperature)]).filter(v=>v!==null),lo=vals.length?Math.min(...vals):0,hi=vals.length?Math.max(...vals):1,span=Math.max(hi-lo,1);
    return `<section><h2>${escapeHTML(this._location.locality)} · próximos días</h2>${forecast.length?`<div class="days">${forecast.map(f=>{
      const low=numeric(f.templow),high=numeric(f.temperature),left=low===null?0:Math.max(0,Math.min(100,(low-lo)/span*100)),width=low===null||high===null?0:Math.max(0,Math.min(100-left,(high-low)/span*100));
      return `<div class="day"><strong>${dayKey(f.datetime)===today?'Hoy':escapeHTML(this._time(f.datetime,{weekday:'short'}))}</strong><img src="${BASE}icons/${iconName(f.condition,false)}.svg" alt="${escapeHTML(CONDITIONS[f.condition]||'Sin datos')}"><span class="low">${fmt(low)}°</span><div class="track" aria-label="Rango de temperatura"><div class="range" style="left:${left}%;width:${width}%"></div></div><strong>${fmt(high)}°</strong></div>`;
    }).join('')}</div>`:'<div class="message">Esperando previsión diaria…</div>'}<div class="source">Mínima / máxima · ${escapeHTML(this._weather().temperature_unit||'°C')} · previsión para ${escapeHTML(this._location.locality)}</div></section>`;
  }
  _render(){
    if(!this.shadowRoot||!this._config)return;
    if(this._location&&EXTRA_MODES.includes(this._config.mode)){this._renderExtra();return;}
    const previousExtra=this.shadowRoot.querySelector('#content > euskalmet-local-card');
    const extraMode=this._tab==='history'?'history':this._tab==='radar'?'radar':'alerts';
    const reusableExtra=previousExtra?._config?.mode===extraMode&&previousExtra?._config?.entry_id===this._location?.entry_id?previousExtra:null;
    let html='';
    if(!this._location){
      const locations=this._locations||[];
      html=`<section><h2>Eguraldi</h2>${locations.length?`<label>Selecciona localidad <select id="locality"><option value="">Elegir…</option>${locations.map(l=>`<option value="${escapeHTML(l.entry_id)}">${escapeHTML(l.locality)}</option>`).join('')}</select></label>`:`<div class="message">${escapeHTML(this._error||(this._locations?'Añade una localidad desde la integración Eguraldi.':'Cargando localidades…'))}</div>`}</section>`;
    }else{
      const mode=this._config.mode;
      html=mode==='overview'?this._overview():mode==='hourly'?this._hourly():mode==='daily'?this._daily():this._overview()+`<section class="divider"><nav class="tabs" aria-label="Vista del tiempo">${[['hourly','24 horas'],['daily','Próximos días'],['radar','Radar'],['history','Histórico'],['alerts','Avisos']].map(([id,label])=>`<button data-tab="${id}" class="${this._tab===id?'active':''}" aria-pressed="${this._tab===id}">${label}</button>`).join('')}</nav><div id="content"></div></section>`;
    }
    this.shadowRoot.innerHTML=`<style>${CSS}</style><ha-card>${html}${this._error?`<div class="message error">${escapeHTML(this._error)}</div>`:''}</ha-card>`;
    this.shadowRoot.querySelector('#locality')?.addEventListener('change',e=>{if(e.target.value)this.setConfig({...this._config,entry_id:e.target.value});});
    for(const button of this.shadowRoot.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>{this._tab=button.dataset.tab;this._render();});
    if(this._location&&this._config.mode==='dashboard'){
      const content=this.shadowRoot.querySelector('#content');
      if(this._tab==='hourly'||this._tab==='daily')content.innerHTML=this._tab==='hourly'?this._hourly():this._daily();
      else{
        const card=reusableExtra||document.createElement('euskalmet-local-card');
        if(!reusableExtra)card.setConfig({entry_id:this._location.entry_id,mode:extraMode});
        card.hass=this._hass;content.append(card);
      }
    }
  }
  _measurementSource(){
    return `Mediciones en ${this._location.station || 'estación no disponible'}${numeric(this._location.distance_km)===null?'':` · a ${fmt(this._location.distance_km)} km de ${this._location.locality}`}`;
  }
  _renderExtra(){
    const mode=this._config.mode,loc=this._location;
    const labels={history:'histórico de temperatura',radar:'radar de precipitación',alerts:'avisos',summaries:'resumen de hoy',comparison:'temperatura · últimas 24 horas',environment:'costa y ambiente'};
    if(!this.shadowRoot.querySelector('#extra-content')){
      this.shadowRoot.innerHTML=`<style>${CSS}.rows{padding:0 20px 18px}.row{display:flex;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #ffffff15;font-size:13px}.row span{color:#b5d2e4}.row strong{text-align:right;font-weight:500}#extra-content>p{padding:0 20px 20px;color:#a9becf;font-size:12px}</style><ha-card><section><h2 id="extra-title"></h2><div class="muted measurement-source" id="extra-source"></div></section><div id="extra-content"></div></ha-card>`;
    }
    this.shadowRoot.querySelector('#extra-title').textContent=`${loc.locality} · ${labels[mode]}`;
    this.shadowRoot.querySelector('#extra-source').textContent=['radar','alerts','environment'].includes(mode)?(mode==='radar'?'Radar regional · Euskalmet':mode==='alerts'?'Avisos para la zona de tu localidad':'Cantábrico · mareas de Pasaia · captadora de polen de referencia'):this._measurementSource();
    const content=this.shadowRoot.querySelector('#extra-content');
    if(mode==='summaries'||mode==='environment'){
      const pollen=Object.prototype.hasOwnProperty.call(loc.entities,'pollen_total')?'pollen_total':Object.keys(loc.entities).find(key=>key.startsWith('pollen_')&&key.endsWith('_total'));
      const rows=mode==='summaries'?[['temperature_min_today','Temperatura mínima'],['temperature_max_today','Temperatura máxima'],['wind_gust_max_today','Racha máxima'],['precipitation_today','Lluvia acumulada'],['irradiance','Radiación solar']]:[['ocean_wave_height','Altura de ola · Cantábrico'],['ocean_water_temperature','Temperatura del mar'],['ocean_tide_high','Próxima pleamar · Pasaia'],[pollen,'Polen · muestra de referencia']];
      content.innerHTML='<div class="rows">'+rows.map(([key,label])=>{
        const state=this._state(key),a=state?.attributes||{},n=numeric(state?.state);
        const value=a.device_class==='timestamp'&&Number.isFinite(Date.parse(state?.state))?this._time(state.state,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):n===null?'No disponible':`${fmt(n)} ${a.unit_of_measurement||''}`;
        const source=mode==='environment'&&key===pollen?(a.municipality_name||a.municipality||''):'';
        return `<div class="row"><span>${escapeHTML(label)}${source?` · ${escapeHTML(source)}`:''}</span><strong>${escapeHTML(value)}</strong></div>`;
      }).join('')+'</div>';return;
    }
    let tag,config;
    if(mode==='comparison'){
      tag='hui-history-graph-card';
      config={type:'history-graph',hours_to_show:24,entities:[{entity:loc.entities.temperature,name:`${loc.locality} · estación ${loc.station}`},...(this._config.comparison_entity?[{entity:this._config.comparison_entity,name:this._config.comparison_name||'Comparación'}]:[])]};
    }else{
      tag=mode==='history'?'euskalmet-local-history-card':mode==='radar'?'euskalmet-local-radar-map-card':'euskalmet-local-alert-card';
      const entity=loc.entities[mode==='history'?'temperature':mode==='radar'?'radar':'alert_level'];
      config={entity,entry_id:loc.entry_id,title:`${loc.locality} · ${labels[mode]}`};
      if(mode==='history'){config.station_id=loc.station_id;config.show_title=false;if(this._config.measure)config.measure=this._config.measure;}
      if(mode==='radar'){config.show_header=false;config.map_style=this._config.map_style||'dark';}
    }
    const key=JSON.stringify([mode,config]);
    if(content.firstElementChild?.dataset.extraKey===key){content.firstElementChild.hass=this._hass;return;}
    if(this._extraPending===key)return;
    const revision=this._extraRevision=(this._extraRevision||0)+1;
    const apply=card=>{if(!this.isConnected||revision!==this._extraRevision)return;card.dataset.extraKey=key;card.hass=this._hass;content.replaceChildren(card);this._extraPending=null;};
    if(mode==='comparison'&&window.loadCardHelpers){
      this._extraPending=key;
      window.loadCardHelpers().then(helpers=>helpers.createCardElement(config)).then(apply).catch(()=>{if(revision===this._extraRevision){content.innerHTML='<p>No se ha podido cargar la comparación.</p>';this._extraPending=null;}});
    }else if(customElements.get(tag)){
      const existing=content.firstElementChild;
      if(existing?.tagName.toLowerCase()===tag){existing.setConfig(config);existing.dataset.extraKey=key;existing.hass=this._hass;return;}
      const card=document.createElement(tag);card.setConfig(config);apply(card);
    }else content.innerHTML='<p>Esta tarjeta todavía no está disponible.</p>';
  }
  getCardSize(){return this._config?.mode==='hourly'?9:6;}
  static getStubConfig(){return {mode:'dashboard'};}
  static getConfigElement(){return document.createElement('euskalmet-local-editor');}
}

class EuskalmetLocalEditor extends HTMLElement {
  setConfig(config){this._config=config;this._render();}
  set hass(hass){this._hass=hass;this._render();}
  _render(){if(!this._config)return;this.innerHTML='<label>Vista <select><option value="dashboard">Panel completo</option><option value="overview">Tiempo actual</option><option value="hourly">Próximas 24 horas</option><option value="daily">Próximos días</option><option value="summaries">Resumen de hoy</option><option value="history">Histórico mensual</option><option value="radar">Radar</option><option value="alerts">Avisos</option><option value="comparison">Comparación de temperatura</option><option value="environment">Costa y ambiente</option></select></label>';const select=this.querySelector('select');select.value=this._config.mode||'dashboard';select.addEventListener('change',()=>this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,mode:select.value}},bubbles:true,composed:true})));}
}
if(!customElements.get('euskalmet-local-card'))customElements.define('euskalmet-local-card',EuskalmetLocalCard);
if(!customElements.get('euskalmet-local-editor'))customElements.define('euskalmet-local-editor',EuskalmetLocalEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='euskalmet-local-card'))window.customCards.push({type:'euskalmet-local-card',name:'Eguraldi',description:'Tu localidad: observaciones, 24 horas, siete días, radar, históricos y avisos.',preview:true});
