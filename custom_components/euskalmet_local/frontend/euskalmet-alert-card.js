const ALERT_CAUSES={
 PERSISTENT_PRECIPITATIONS:['Lluvia persistente','Euri iraunkorra','mdi:weather-pouring'],
 HEAVY_PRECIPITATIONS:['Lluvia intensa','Euri handia','mdi:weather-pouring'],
 WIND_ON_EXPOSED_ZONES:['Viento en zonas expuestas','Haizea haizeguneetan','mdi:weather-windy'],
 WIND_ON_NOT_EXPOSED_ZONES:['Viento en zonas no expuestas','Haizea haizeguneak ez diren tokietan','mdi:weather-windy'],
 HIGH_TEMPERATURES:['Temperaturas altas','Tenperatura altuak','mdi:thermometer-high'],
 LOW_TEMPERATURES:['Temperaturas bajas','Tenperatura baxuak','mdi:thermometer-low'],
 SNOW:['Nieve','Elurra','mdi:weather-snowy'],
 FROST:['Heladas','Izozteak','mdi:snowflake'],
 WAVES:['Oleaje','Olatuak','mdi:waves'],
 MARITIME_COASTAL_RISK:['Riesgo marítimo costero','Itsasertzeko arriskua','mdi:waves'],
};
const ALERT_ZONES={BIZKAIA_INTERIOR:['Bizkaia interior','Bizkaiko barnealdea'],BIZKAIA_COAST:['Costa de Bizkaia','Bizkaiko kostaldea'],GIPUZKOA_INTERIOR:['Gipuzkoa interior','Gipuzkoako barnealdea'],GIPUZKOA_COAST:['Costa de Gipuzkoa','Gipuzkoako kostaldea'],TRANSITION:['Zona de transición','Trantsizio-eremua']};
const ALERT_RANK={unknown:0,none:0,yellow:1,orange:2,red:3};
class EuskalmetAlertCard extends HTMLElement {
 constructor(){super();this.attachShadow({mode:'open'});this._opened=new Set();}
 connectedCallback(){this._clock=setInterval(()=>this._render(),60000);}
 disconnectedCallback(){clearInterval(this._clock);}
 setConfig(config){if(!config.entity)throw Error('Indica la entidad de avisos');this._config={...config};this._opened.clear();this._render();}
 set hass(value){const old=this._hass;this._hass=value;if(!old||old.states?.[this._config?.entity]!==this._state()||old.locale?.language!==value.locale?.language)this._render();}
 _state(){return this._hass?.states?.[this._config?.entity];}
 getCardSize(){return Math.max(2,Math.min(8,(this._state()?.attributes?.alerts?.length||0)+1));}
 static getStubConfig(){return {entity:'sensor.nivel_de_aviso'};}
 _text(){const eu=String(this._hass?.locale?.language||navigator.language||'es').startsWith('eu');return {eu,locale:eu?'eu-ES':'es-ES',title:eu?'Abisu meteorologikoak':'Avisos meteorológicos',max:eu?'Argitaratutako gehieneko maila':'Nivel máximo publicado',active:eu?'Indarrean':'En vigor',future:eu?'Hurrengoak':'Próximos',ended:eu?'Amaitutakoak':'Finalizados',unknown:eu?'Ordutegia baieztatu gabe':'Horario sin confirmar',none:eu?'Ez dago abisu meteorologikorik argitaratuta':'No hay avisos meteorológicos publicados',unavailable:eu?'Ezin dira abisuak egiaztatu orain':'No se pueden comprobar los avisos ahora',official:eu?'Ikusi komunikatu ofiziala':'Ver comunicado oficial',today:eu?'Gaur':'Hoy',tomorrow:eu?'Bihar':'Mañana',zone:eu?'Zure herriko abisu-eremua':'Zona de avisos de tu localidad',levels:eu?{yellow:'Horia',orange:'Laranja',red:'Gorria',none:'Abisurik ez',unknown:'Maila baieztatu gabe'}:{yellow:'Amarillo',orange:'Naranja',red:'Rojo',none:'Sin avisos',unknown:'Nivel sin confirmar'}};}
 _schedule(alert,now){const start=Date.parse(alert.starts_at),end=Date.parse(alert.ends_at);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return {status:'unknown',start:null,end:null};return {status:now>=end?'ended':now<start?'future':'active',start,end};}
 _date(stamp,t){const options={timeZone:'Europe/Madrid'},key=s=>new Intl.DateTimeFormat('sv-SE',options).format(new Date(s)),today=key(Date.now()),date=key(stamp),tomorrow=new Date(today+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);const label=date===today?t.today:date===key(tomorrow)?t.tomorrow:new Intl.DateTimeFormat(t.locale,{...options,weekday:'short'}).format(new Date(stamp));return label+' · '+new Intl.DateTimeFormat(t.locale,{...options,day:'numeric',month:'short'}).format(new Date(stamp));}
 _period(item,t){if(item.start===null){const stamp=Date.parse(item.alert.valid_for);return (Number.isFinite(stamp)?this._date(stamp,t)+' · ':'')+t.unknown;}const clock=s=>new Intl.DateTimeFormat(t.locale,{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));const endMidnight=clock(item.end)==='00:00';return this._date(item.start,t)+' · '+clock(item.start)+'–'+(endMidnight?'24:00':clock(item.end));}
 _render(){
  if(!this._hass||!this._config)return;
  const state=this._state(),t=this._text(),fresh=state&&!['unknown','unavailable'].includes(state.state),now=Date.now();
  const source=fresh&&Array.isArray(state.attributes?.alerts)?state.attributes.alerts:[];
  const buckets={active:new Map(),future:new Map(),unknown:new Map(),ended:new Map()},seen=new Set();
  for(const alert of source){
   if(!alert||typeof alert!=='object')continue;
   const description=alert.descriptions_by_language?.[t.eu?'eu':'es']||alert.description||alert.descriptions_by_language?.es||alert.descriptions_by_language?.eu||'';
   const schedule=this._schedule(alert,now),level=['yellow','orange','red'].includes(alert.level)?alert.level:'unknown';
   const key=JSON.stringify([alert.cause,level,alert.zone]),unique=JSON.stringify([key,schedule.start,schedule.end,alert.valid_for,description]);if(seen.has(unique))continue;seen.add(unique);
   const bucket=buckets[schedule.status];if(!bucket.has(key))bucket.set(key,{cause:alert.cause,level,zone:alert.zone,items:[],key});bucket.get(key).items.push({...schedule,alert,description});
  }
  const max=String(state?.attributes?.severity||state?.state||'unknown').toLowerCase(),safeMax=Object.hasOwn(ALERT_RANK,max)?max:'unknown';
  this.shadowRoot.innerHTML=`<style>
  :host{display:block;font-family:inherit}*{box-sizing:border-box}.card{padding:18px;border:1px solid var(--ha-card-border-color,#ffffff20);border-radius:20px;background:linear-gradient(135deg,#193243,#102131);color:#edf8ff}.embedded{padding:0 20px 20px;border:0;background:transparent;color:#edf8ff}.heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}.title{font-size:20px;font-weight:650;margin:0}.max:empty{display:none}.heading:has(.title[hidden]):has(.max:empty){display:none}.embedded .heading{justify-content:flex-end;margin:0 0 8px}.body>.section-title:first-child{margin-top:8px}.max{display:flex;align-items:center;gap:9px;font-size:12px;color:#a9becf}.pill{border:1px solid currentColor;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:650;white-space:nowrap}.yellow{--risk-color:#ffe17c}.orange{--risk-color:#ffb16c}.red{--risk-color:#ff8e96}.unknown,.none{--risk-color:#a9becf}.pill{color:var(--risk-color)}.section-title{font-size:13px;letter-spacing:.06em;margin:20px 0 10px}.groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:12px}.risk{min-width:0;border:1px solid #9acdd926;border-left:4px solid var(--risk-color);border-radius:14px;padding:16px;background:#8ecade06}.risk-head{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.risk-head ha-icon{color:var(--risk-color);flex:none}.cause{font-size:16px;font-weight:650;flex:1;min-width:140px}.zone{font-size:11px;color:#a9becf;margin:8px 0 0}.period{border-top:1px solid #9acdd926;margin-top:12px;padding-top:12px}.period:first-of-type{border:0}.when{font-size:13px;font-weight:650;color:var(--risk-color);margin-bottom:8px}.excerpt{font-size:13px;line-height:1.55;margin:0;color:inherit;overflow-wrap:anywhere}details{margin-top:10px}summary{cursor:pointer;font-size:12px;color:#8edbf6;padding:6px 0;min-height:30px}summary:focus-visible{outline:2px solid #68cef3;outline-offset:3px}.official{font-size:13px;line-height:1.65;white-space:pre-line;overflow-wrap:anywhere;margin:12px 0 0}.empty{padding:16px;border:1px solid #9acdd926;border-radius:14px;font-size:14px}.ended{margin-top:18px}.ended>summary{color:#a9becf}.ended .risk{opacity:.8}.embedded .max{color:#a9becf}@media(max-width:480px){.embedded{padding:0 14px 14px}.card:not(.embedded){padding:14px}.risk{padding:13px}.cause{font-size:15px}.heading{margin-bottom:12px}.max{width:100%}}
  </style><section class="card ${this._config.embedded?'embedded':''}"><div class="heading"><h2 class="title"></h2><div class="max"></div></div><div class="body"></div></section>`;
  const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
  const title=this.shadowRoot.querySelector('.title');title.textContent=this._config.title||t.title;title.hidden=this._config.show_title===false;
  const maxHost=this.shadowRoot.querySelector('.max');if(fresh&&['yellow','orange','red'].includes(safeMax)){maxHost.append(el('span','',t.max),el('span','pill '+safeMax,t.levels[safeMax]));}
  const body=this.shadowRoot.querySelector('.body');
  if(!fresh){body.append(el('div','empty',t.unavailable));return;}
  if(!source.length){body.append(el('div','empty',safeMax==='none'?t.none:t.unavailable));return;}
  const section=(status,target)=>{
   const groups=[...buckets[status].values()].sort((a,b)=>ALERT_RANK[b.level]-ALERT_RANK[a.level]||Math.min(...a.items.map(i=>i.start??Infinity))-Math.min(...b.items.map(i=>i.start??Infinity)));
   if(!groups.length)return;
   if(status!=='ended')target.append(el('h3','section-title',t[status]+' · '+groups.length));
   const grid=el('div','groups');target.append(grid);
   for(const group of groups){
    const article=el('article','risk '+group.level),head=el('div','risk-head'),cause=ALERT_CAUSES[group.cause];
    const icon=el('ha-icon');icon.setAttribute('icon',cause?.[2]||'mdi:alert-outline');icon.setAttribute('aria-hidden','true');head.append(icon,el('div','cause',cause?.[t.eu?1:0]||t.title),el('span','pill '+group.level,t.levels[group.level]));article.append(head,el('div','zone',ALERT_ZONES[group.zone]?.[t.eu?1:0]||t.zone));
    group.items.sort((a,b)=>(a.start??Infinity)-(b.start??Infinity));
    for(const item of group.items){
     const period=el('div','period');period.append(el('div','when',this._period(item,t)));
     const first=item.description.replace(/^\s*[-–]\s*/,'').split(/(?<=[.!?])\s+/),excerpt=first.length>1?first.slice(1).join(' '):first[0];
     if(excerpt)period.append(el('p','excerpt',excerpt.length>230?excerpt.slice(0,227).trimEnd()+'…':excerpt));
     const details=el('details'),id=JSON.stringify([group.key,item.alert.valid_for,item.start,item.end,item.description]);details.open=this._opened.has(id);details.append(el('summary','',t.official),el('p','official',item.description||t.unknown));details.addEventListener('toggle',()=>details.open?this._opened.add(id):this._opened.delete(id));period.append(details);article.append(period);
    }
    grid.append(article);
   }
  };
  for(const status of ['active','future','unknown'])section(status,body);
  if(buckets.ended.size){const ended=el('details','ended'),id='ended';ended.open=this._opened.has(id);ended.append(el('summary','',t.ended+' · '+buckets.ended.size));ended.addEventListener('toggle',()=>ended.open?this._opened.add(id):this._opened.delete(id));section('ended',ended);body.append(ended);}
 }
}
if(!customElements.get('eguraldi-alert-card'))customElements.define('eguraldi-alert-card',class extends EuskalmetAlertCard {});
if(!customElements.get('euskalmet-local-alert-card'))customElements.define('euskalmet-local-alert-card',EuskalmetAlertCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='euskalmet-local-alert-card'))window.customCards.push({type:'euskalmet-local-alert-card',name:'Eguraldi · avisos / abisuak',description:'Avisos por fenómeno, nivel y periodo; comunicado oficial desplegable.',preview:true});
