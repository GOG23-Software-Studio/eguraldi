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
 connectedCallback(){this._clock=setInterval(()=>this._render(),60000);this._render();}
 disconnectedCallback(){clearInterval(this._clock);this._stopMotion();this._selectedAlertKey=null;this._detailExpiresAt=null;}
 setConfig(config){if(!config.entity)throw Error('Indica la entidad de avisos');if(config.view&&!['list','ticker','timeline','headlines'].includes(config.view))throw Error('Vista de avisos no válida');this._config={...config};this._opened.clear();this._selectedAlertKey=null;this._detailExpiresAt=null;this._tickerOffset=0;this._render();}
 set hass(value){const old=this._hass;this._hass=value;if(!old||old.states?.[this._config?.entity]!==this._state()||old.locale?.language!==value.locale?.language)this._render();}
 _state(){return this._hass?.states?.[this._config?.entity];}
 getCardSize(){return Math.max(2,Math.min(8,(this._state()?.attributes?.alerts?.length||0)+1));}
 static getConfigElement(){return document.createElement('eguraldi-alert-editor');}
 static getStubConfig(){return {entity:'sensor.nivel_de_aviso'};}
 _text(){const eu=String(this._hass?.locale?.language||navigator.language||'es').startsWith('eu');return {eu,locale:eu?'eu-ES':'es-ES',title:eu?'Abisu meteorologikoak':'Avisos meteorológicos',max:eu?'Argitaratutako gehieneko maila':'Nivel máximo publicado',active:eu?'Indarrean':'En vigor',future:eu?'Hurrengoak':'Próximos',ended:eu?'Amaitutakoak':'Finalizados',unknown:eu?'Ordutegia baieztatu gabe':'Horario sin confirmar',none:eu?'Ez dago abisu meteorologikorik argitaratuta':'No hay avisos meteorológicos publicados',unavailable:eu?'Ezin dira abisuak egiaztatu orain':'No se pueden comprobar los avisos ahora',official:eu?'Ikusi komunikatu ofiziala':'Ver comunicado oficial',today:eu?'Gaur':'Hoy',tomorrow:eu?'Bihar':'Mañana',zone:eu?'Zure herriko abisu-eremua':'Zona de avisos de tu localidad',levels:eu?{yellow:'Horia',orange:'Laranja',red:'Gorria',none:'Abisurik ez',unknown:'Maila baieztatu gabe'}:{yellow:'Amarillo',orange:'Naranja',red:'Rojo',none:'Sin avisos',unknown:'Nivel sin confirmar'}};}
 _schedule(alert,now){const start=Date.parse(alert.starts_at),end=Date.parse(alert.ends_at);if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return {status:'unknown',start:null,end:null};return {status:now>=end?'ended':now<start?'future':'active',start,end};}
 _date(stamp,t){const options={timeZone:'Europe/Madrid'},key=s=>new Intl.DateTimeFormat('sv-SE',options).format(new Date(s)),today=key(Date.now()),date=key(stamp),tomorrow=new Date(today+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);const label=date===today?t.today:date===key(tomorrow)?t.tomorrow:new Intl.DateTimeFormat(t.locale,{...options,weekday:'short'}).format(new Date(stamp));return label+' · '+new Intl.DateTimeFormat(t.locale,{...options,day:'numeric',month:'short'}).format(new Date(stamp));}
 _period(item,t){if(item.start===null){const stamp=Date.parse(item.alert.valid_for);return (Number.isFinite(stamp)?this._date(stamp,t)+' · ':'')+t.unknown;}const clock=s=>new Intl.DateTimeFormat(t.locale,{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(s));const endMidnight=clock(item.end)==='00:00';return this._date(item.start,t)+' · '+clock(item.start)+'–'+(endMidnight?'24:00':clock(item.end));}
 _render(){
  this._stopMotion();
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
  .alert-band{position:relative;height:210px;overflow:hidden;touch-action:pan-y;margin:10px 0 14px}.alert-message{position:absolute;top:2px;bottom:2px;left:0;width:min(340px,calc(100% - 8px));border:1px solid #9acdd940;border-left:4px solid var(--risk-color);border-radius:15px;background:#193748;color:#edf8ff;padding:15px;text-align:left;font:inherit;display:flex;flex-direction:column;gap:9px;cursor:pointer;will-change:transform}.alert-message .cause{font-size:15px;min-width:0}.alert-message .risk-head{flex-wrap:nowrap;align-items:flex-start}.alert-message ha-icon{flex:none}.message-meta{color:var(--risk-color);font-size:12px}.message-time{font-size:12px;color:#a9cbe0}.alert-message .excerpt{font-size:12px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.alert-band-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.motion-status{font-size:12px;color:#a9cbe0}.alert-actions{display:flex;gap:8px}.alert-control{min-width:40px;min-height:40px;padding:7px 12px;border:1px solid #9acdd940;border-radius:9px;background:#193748;color:#edf8ff;font:inherit;font-size:12px;cursor:pointer}.alert-control:disabled{opacity:.5;cursor:default}.alert-control:focus-visible,.alert-message:focus-visible,.time-bar:focus-visible{outline:2px solid #83d8f6;outline-offset:2px}.alert-detail{margin-top:18px;padding-top:14px;border-top:1px solid #9acdd926}.alert-detail[hidden]{display:none}.alert-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.alert-detail h3{margin:0;font-size:15px}.alert-detail .when{color:var(--risk-color)}.alert-timeline{margin:20px 0 10px}.time-axis{position:relative;margin-left:194px;height:38px;font-size:11px;color:#a9cbe0}.time-axis span{white-space:nowrap;position:absolute;top:0;max-width:105px;text-align:center;transform:translateX(-50%)}.time-axis span:first-child{transform:none;text-align:left}.time-axis span:last-child{transform:translateX(-100%);text-align:right}.time-row{display:grid;grid-template-columns:180px minmax(0,1fr);gap:14px;margin-bottom:14px;align-items:center}.time-name{font-size:13px;line-height:1.5}.time-tracks{display:grid;gap:5px;min-width:0}.time-track{position:relative;height:44px;border-radius:8px;background:repeating-linear-gradient(to right,#9acdd90b 0,#9acdd90b calc(25% - 1px),#9acdd927 calc(25% - 1px),#9acdd927 25%)}.time-bar{position:absolute;top:6px;height:32px;background:var(--risk-color);color:#172b39;font:inherit;font-size:11px;font-weight:650;border:0;border-radius:6px;padding:4px 7px;text-align:left;overflow:hidden;white-space:nowrap;cursor:pointer}.time-bar.future{background:color-mix(in srgb,var(--risk-color) 45%,#193748);color:#edf8ff}.time-now{position:absolute;top:0;bottom:0;width:2px;background:#83d8f6;pointer-events:none}.timeline-current{font-size:12px;color:#83d8f6;margin-left:194px;margin-top:8px}@media(max-width:560px){.time-axis{margin-left:0;height:40px}.time-axis span:nth-child(2),.time-axis span:nth-child(4){display:none}.time-row{grid-template-columns:minmax(0,1fr);gap:6px;margin-bottom:18px}.time-name{font-size:12px}.timeline-current{margin-left:0}.time-track{height:48px}.time-bar{top:2px;height:44px;padding:4px;font-size:11px}.alert-control{min-height:44px;min-width:44px}.alert-message{padding:12px}.alert-band{height:225px}}

  .alert-band.headlines{height:52px;margin:0;flex:1;min-width:0}.headlines .alert-message{width:max-content;max-width:none;min-width:320px;top:2px;bottom:2px;border:0;border-radius:0;border-left:0;background:transparent;padding:8px 20px 8px 0;display:block}.headline-line{display:flex;align-items:center;gap:12px;white-space:nowrap;font-size:13px}.headline-line:after{content:'•';color:#708fa1;margin:0 8px}.headline-line strong{font-weight:600}.headline-line ha-icon{color:var(--risk-color);flex:none}.headline-level{color:var(--risk-color)}.headline-period{color:#a9cbe0;font-size:12px}.headlines-footer .motion-status{display:none}.headline-shell{display:flex;align-items:center;gap:10px;min-width:0}.headline-shell .alert-band-footer{flex:none}.headline-shell .alert-actions{gap:4px}.headline-shell .alert-control{min-width:34px;padding:5px 8px}@media(max-width:560px){.headline-shell .alert-control{min-width:44px;min-height:44px}.headline-line{font-size:12px;gap:9px}.headline-period{font-size:11px}}
  .card.headline-card{display:grid;grid-template-columns:max-content minmax(0,1fr);align-items:center;gap:14px;padding:8px 14px}.headline-card .heading,.embedded.headline-card .heading{margin:0;justify-content:flex-start}.headline-card .title{font-size:14px;white-space:nowrap}.headline-card .max{display:none}.headline-card .body{min-width:0}.headline-card .alert-detail{grid-column:1/-1}.headline-card:has(.alert-detail:not([hidden])){display:block}.headline-card:has(.alert-detail:not([hidden])) .heading{margin-bottom:10px}.headline-card .empty{font-size:12px;border:0;padding:8px}.headline-card .headlines-footer [data-headline-step]{display:none}.alert-control[data-motion-toggle]{display:inline-flex;align-items:center;justify-content:center;gap:7px}.alert-control[data-motion-toggle] ha-icon{width:20px;height:20px;--mdc-icon-size:20px}.headlines-footer .motion-label{display:none}.headlines-footer .alert-control{width:38px}@media(max-width:560px){.card.headline-card{padding:4px 10px;gap:9px}.headline-card .title{font-size:12px}.headlines-footer .alert-control{width:44px}}

:host{font-family:var(--primary-font-family,system-ui);font-size:13px;line-height:1.5}
:host h2,:host .forecast-top h2{font-family:inherit;font-size:20px;font-weight:600;line-height:1.3;letter-spacing:0;margin:0 0 16px}
:host h3{font-family:inherit;font-size:14px;font-weight:600;line-height:1.4}
:host button,:host input,:host select{font-family:inherit}
:host .card:not(.embedded){border-radius:22px;background:linear-gradient(145deg,#1b3246,#101e30)}:host .card.headline-card h2{font-size:14px;line-height:1.3;margin:0}:host .heading h2{margin:0}@media(max-width:550px){:host h2{font-size:18px}:host .card.headline-card h2{font-size:12px}}</style><section class="card ${this._config.view==='headlines'?'headline-card':''} ${this._config.embedded?'embedded':''}"><div class="heading"><h2 class="title"></h2><div class="max"></div></div><div class="body"></div></section>`;
  const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
  const title=this.shadowRoot.querySelector('.title');title.textContent=this._config.title||t.title;title.hidden=this._config.show_title===false;
  const maxHost=this.shadowRoot.querySelector('.max');if(fresh&&['yellow','orange','red'].includes(safeMax)){maxHost.append(el('span','',t.max),el('span','pill '+safeMax,t.levels[safeMax]));}
  const body=this.shadowRoot.querySelector('.body');
  if(!fresh){body.append(el('div','empty',t.unavailable));return;}
  if(!source.length){body.append(el('div','empty',safeMax==='none'?t.none:t.unavailable));return;}
  if(this._config.view==='headlines'&&!buckets.active.size&&!buckets.future.size&&!buckets.unknown.size)body.append(el('span','motion-status',t.ended));
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
  if(['ticker','timeline','headlines'].includes(this._config.view)){
   const entries=(this._config.view==='headlines'?['active','future','unknown']:['active','future']).flatMap(status=>[...buckets[status].values()].sort((a,b)=>ALERT_RANK[b.level]-ALERT_RANK[a.level]).flatMap(group=>group.items.map(item=>({...item,group,key:JSON.stringify([group.key,item.start,item.end,item.description])}))));
   if(entries.length)this._config.view!=='timeline'?this._renderTicker(body,entries,t,el):this._renderTimeline(body,entries,t,el,now);
   if(this._config.view!=='headlines')section('unknown',body);
  }else for(const status of ['active','future','unknown'])section(status,body);
  if(buckets.ended.size&&this._config.view!=='headlines'){const ended=el('details','ended'),id='ended';ended.open=this._opened.has(id);ended.append(el('summary','',t.ended+' · '+buckets.ended.size));ended.addEventListener('toggle',()=>ended.open?this._opened.add(id):this._opened.delete(id));section('ended',ended);body.append(ended);}
 }
 _viewText(t){return t.eu?{pause:'Pausatu',resume:'Jarraitu',reduced:'Mugimendu murriztua',previous:'Aurreko abisua',next:'Hurrengo abisua',close:'Itxi',now:'Orain',periods:'Abisuen denbora-lerroa',moving:'Abisuak mugimenduan',paused:'Pausatuta'}:{pause:'Pausar',resume:'Reanudar',reduced:'Movimiento reducido',previous:'Aviso anterior',next:'Aviso siguiente',close:'Cerrar',now:'Ahora',periods:'Línea temporal de avisos',moving:'Avisos en movimiento',paused:'En pausa'};}
 _stopMotion(){
  clearTimeout(this._detailTimer);this._detailTimer=null;this._resumeTicker=null;
  this._motionVersion=(this._motionVersion||0)+1;
  if(this._raf!==undefined&&window.cancelAnimationFrame)window.cancelAnimationFrame(this._raf);
  this._raf=undefined;this._motionCleanup?.();this._motionCleanup=null;this._paintTicker=null;
 }
 _entryTitle(entry,t){return ALERT_CAUSES[entry.group.cause]?.[t.eu?1:0]||t.title;}
 _detailArea(target,entries,t,el){
  const text=this._viewText(t),generation=this._motionVersion,area=el('section','alert-detail');area.setAttribute('aria-live','polite');target.append(area);
  const close=()=>{
   const entry=entries.find(e=>e.key===this._selectedAlertKey),active=this.shadowRoot.activeElement,refocus=active&&(area.contains(active)||active.closest?.('.alert-band'));
   clearTimeout(this._detailTimer);this._detailTimer=null;this._selectedAlertKey=null;this._detailExpiresAt=null;this._tickerPaused=false;show();
   if(refocus)target.querySelector('[data-motion-toggle]')?.focus({preventScroll:true});
   this._resumeTicker?.();
   if(!target.querySelector('[data-motion-toggle]')&&entry)target.querySelector(`[data-alert-index="${entries.indexOf(entry)}"]`)?.focus({preventScroll:true});
  };
  const show=()=>{
   area.replaceChildren();const entry=entries.find(e=>e.key===this._selectedAlertKey);area.hidden=!entry;if(!entry)return;
   const head=el('div','alert-detail-head'),button=el('button','alert-control',text.close);button.type='button';button.addEventListener('click',close);
   head.append(el('h3','',this._entryTitle(entry,t)+' · '+t.levels[entry.group.level]),button);
   area.append(head,el('div','when '+entry.group.level,this._period(entry,t)),el('p','official',entry.description||t.unknown));
  };
  const schedule=()=>{
   clearTimeout(this._detailTimer);if(!this._selectedAlertKey||!this._detailExpiresAt)return;
   const key=this._selectedAlertKey;this._detailTimer=setTimeout(()=>{if(this.isConnected&&generation===this._motionVersion&&this._selectedAlertKey===key)close();},Math.max(0,this._detailExpiresAt-Date.now()));
  };
  this._openAlert=entry=>{this._selectedAlertKey=entry.key;this._detailExpiresAt=Date.now()+30000;this._tickerPaused=true;this._paintTicker?.();show();schedule();};
  show();schedule();
 }
 _renderTicker(target,entries,t,el){
  const generation=this._motionVersion,compact=this._config.view==='headlines',text=this._viewText(t),viewport=el('div','alert-band'+(compact?' headlines':''));viewport.setAttribute('aria-label',text.moving);target.append(viewport);
  const buttons=entries.map((entry,index)=>{
   const button=el('button','alert-message '+entry.group.level);button.type='button';button.dataset.alertIndex=String(index);
   const head=el('div','risk-head'),icon=el('ha-icon');icon.setAttribute('icon',ALERT_CAUSES[entry.group.cause]?.[2]||'mdi:alert-outline');icon.setAttribute('aria-hidden','true');head.append(icon,el('span','cause',this._entryTitle(entry,t)));
   const first=entry.description.replace(/^\s*[-–]\s*/,'').split(/(?<=[.!?])\s+/),excerpt=first.length>1?first.slice(1).join(' '):first[0];
   button.append(head,el('div','message-meta',t.levels[entry.group.level]+' · '+t[entry.status]),el('div','message-time',this._period(entry,t)),el('p','excerpt',excerpt.length>170?excerpt.slice(0,167).trimEnd()+'…':excerpt));
   button.addEventListener('click',event=>{if(!moved||event.detail===0)this._openAlert(entry);});if(compact){const line=el('span','headline-line'),icon=el('ha-icon');icon.setAttribute('icon',ALERT_CAUSES[entry.group.cause]?.[2]||'mdi:alert-outline');icon.setAttribute('aria-hidden','true');line.append(icon,el('strong','',this._entryTitle(entry,t)),el('span','headline-level',t.levels[entry.group.level]),el('span','headline-period',this._period(entry,t)));button.replaceChildren(line);button.setAttribute('aria-label',this._entryTitle(entry,t)+' · '+t.levels[entry.group.level]+' · '+this._period(entry,t));}viewport.append(button);return button;
  });
  const controls=el('div','alert-band-footer'+(compact?' headlines-footer':'')),status=el('span','motion-status'),actions=el('div','alert-actions');controls.append(status,actions);target.append(controls);
  const make=(label,content)=>{const b=el('button','alert-control',content);b.type='button';b.setAttribute('aria-label',label);actions.append(b);return b;};
  const previous=make(text.previous,'←'),pause=make(text.pause,''),next=make(text.next,'→');pause.dataset.motionToggle='';const motionIcon=el('ha-icon'),motionLabel=el('span','motion-label',text.pause);motionIcon.setAttribute('aria-hidden','true');pause.append(motionIcon,motionLabel);previous.disabled=next.disabled=entries.length<2;
  const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');let reduced=!!query?.matches,hover=false,focused=false,drag=null,moved=false,last=null,visible=true;
  const speed=Number(this._config.ticker_speed),pixels=Number.isFinite(speed)?Math.min(48,Math.max(12,speed)):24;
  this._tickerOffset=this._tickerOffset||0;
  const span=()=>Math.max(1,(buttons[0].getBoundingClientRect().width||300)+14),widths=()=>buttons.map(b=>(b.getBoundingClientRect().width||300)+14),singleOverflow=()=>compact&&entries.length===1&&(buttons[0].getBoundingClientRect().width||300)>viewport.getBoundingClientRect().width,stopped=()=>reduced||this._tickerPaused||hover||focused||drag!==null||(entries.length<2&&!singleOverflow());
  const paint=()=>{
   if(!this.isConnected||generation!==this._motionVersion)return;const sizes=widths(),step=span(),total=sizes.reduce((a,b)=>a+b,0)+(singleOverflow()?viewport.getBoundingClientRect().width*.5:0);
   this._tickerOffset=((this._tickerOffset%total)+total)%total;
   let prefix=0;buttons.forEach((button,index)=>{const size=sizes[index],x=entries.length===1&&!singleOverflow()?0:((prefix-this._tickerOffset+size+total)%total)-size;prefix+=size;button.style.transform=`translateX(${x}px)`;});
   const label=reduced?text.reduced:this._tickerPaused?text.resume:text.pause;if(motionLabel.textContent!==label)motionLabel.textContent=label;motionIcon.setAttribute('icon',this._tickerPaused||reduced?'mdi:play':'mdi:pause');pause.setAttribute('aria-label',label);pause.setAttribute('aria-pressed',String(!!this._tickerPaused||reduced));pause.disabled=reduced||(entries.length<2&&!singleOverflow());
   const message=stopped()?text.paused:text.moving;if(status.textContent!==message)status.textContent=message;
   if(!stopped()&&visible&&!document.hidden&&window.requestAnimationFrame){if(this._raf===undefined)this._raf=window.requestAnimationFrame(tick);}else{if(this._raf!==undefined)window.cancelAnimationFrame?.(this._raf);this._raf=undefined;last=null;}
  };
  const tick=stamp=>{if(generation!==this._motionVersion)return;this._raf=undefined;if(!this.isConnected)return;if(last!==null)this._tickerOffset+=Math.min(80,stamp-last)*pixels/1000;last=stamp;paint();};
  this._paintTicker=paint;this._resumeTicker=()=>{hover=false;focused=false;drag=null;this._tickerPaused=false;paint();};
  pause.addEventListener('click',()=>{this._tickerPaused=!this._tickerPaused;paint();});
  const position=index=>widths().slice(0,index).reduce((a,b)=>a+b,0);const move=direction=>{this._tickerPaused=true;const points=buttons.map((_,i)=>position(i));let index=points.findIndex(p=>p>=this._tickerOffset-1);if(index<0)index=0;index=(index+direction+entries.length)%entries.length;this._tickerOffset=points[index];paint();};previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  viewport.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;paint();}});
  viewport.addEventListener('pointerleave',()=>{hover=false;drag=null;paint();});
  viewport.addEventListener('focusin',e=>{focused=true;const index=e.target.closest('[data-alert-index]')?.dataset.alertIndex;if(index!==undefined)this._tickerOffset=position(Number(index));paint();});
  viewport.addEventListener('focusout',()=>{focused=false;paint();});
  viewport.addEventListener('pointerdown',e=>{drag={x:e.clientX,offset:this._tickerOffset};moved=false;paint();});
  viewport.addEventListener('pointermove',e=>{if(drag&&Math.abs(e.clientX-drag.x)>6){moved=true;this._tickerOffset=drag.offset+drag.x-e.clientX;paint();}});
  const end=()=>{if(drag){drag=null;if(moved)this._tickerPaused=true;paint();}};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
  const onVisibility=()=>{last=null;paint();},onReduced=()=>{reduced=!!query.matches;paint();};document.addEventListener('visibilitychange',onVisibility);query?.addEventListener?.('change',onReduced);
  const resize=window.ResizeObserver?new ResizeObserver(paint):null;resize?.observe(viewport);
  const intersection=window.IntersectionObserver?new IntersectionObserver(events=>{visible=events[0]?.isIntersecting!==false;paint();}):null;intersection?.observe(viewport);
  this._motionCleanup=()=>{document.removeEventListener('visibilitychange',onVisibility);query?.removeEventListener?.('change',onReduced);resize?.disconnect();intersection?.disconnect();};
  if(compact){const shell=el('div','headline-shell');target.insertBefore(shell,viewport);shell.append(viewport,controls);previous.dataset.headlineStep='';next.dataset.headlineStep='';}this._detailArea(target,entries,t,el);paint();
 }
 _renderTimeline(target,entries,t,el,now){
  const text=this._viewText(t),start=Math.floor(now/3600000)*3600000-6*3600000,end=Math.max(start+30*3600000,...entries.map(e=>e.end)),span=end-start;
  const chart=el('div','alert-timeline');chart.setAttribute('aria-label',text.periods);target.append(chart);
  const axis=el('div','time-axis');chart.append(axis);
  const format=stamp=>new Intl.DateTimeFormat(t.locale,{timeZone:'Europe/Madrid',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(stamp));
  for(let i=0;i<5;i++){const label=el('span','',format(start+span*i/4));label.style.left=(i*25)+'%';axis.append(label);}
  const groups=new Map();for(const entry of entries){if(entry.end<=start)continue;if(!groups.has(entry.group.key))groups.set(entry.group.key,[]);groups.get(entry.group.key).push(entry);}
  for(const group of groups.values()){
   const row=el('div','time-row'),label=el('div','time-name',this._entryTitle(group[0],t)),tracks=el('div','time-tracks');row.append(label,tracks);chart.append(row);
   const lanes=[];
   for(const entry of group.sort((a,b)=>a.start-b.start)){
    let lane=lanes.find(l=>l.end<=entry.start);if(!lane){lane={end:-Infinity,track:el('div','time-track')};lanes.push(lane);tracks.append(lane.track);}lane.end=entry.end;
    const left=Math.max(0,(entry.start-start)/span*100),right=Math.min(100,(entry.end-start)/span*100),bar=el('button','time-bar '+entry.group.level+(entry.status==='future'?' future':''),t.levels[entry.group.level]);bar.type='button';bar.dataset.alertIndex=String(entries.indexOf(entry));bar.style.left=left+'%';bar.style.width=(right-left)+'%';bar.setAttribute('aria-label',this._entryTitle(entry,t)+' · '+t.levels[entry.group.level]+' · '+this._period(entry,t));bar.title=this._period(entry,t);bar.addEventListener('click',()=>this._openAlert(entry));lane.track.append(bar);
   }
   for(const lane of lanes){const line=el('div','time-now');line.style.left=((now-start)/span*100)+'%';line.setAttribute('aria-hidden','true');lane.track.append(line);}
  }
  const current=el('div','timeline-current',text.now+' · '+format(now));chart.append(current);
  this._detailArea(target,entries,t,el);
 }

}
if(!customElements.get('eguraldi-alert-card'))customElements.define('eguraldi-alert-card',class extends EuskalmetAlertCard {});
if(!customElements.get('euskalmet-local-alert-card'))customElements.define('euskalmet-local-alert-card',EuskalmetAlertCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='euskalmet-local-alert-card'))window.customCards.push({type:'euskalmet-local-alert-card',name:'Eguraldi · avisos / abisuak',description:'Avisos por fenómeno, nivel y periodo; comunicado oficial desplegable.',preview:true});

class EguraldiAlertEditor extends HTMLElement{
 setConfig(config){this._config={...config};this._render();}
 set hass(value){const changed=!this._hass||this._hass.locale?.language!==value.locale?.language;this._hass=value;if(changed)this._render();}
 _render(){
  if(!this._config)return;const eu=String(this._hass?.locale?.language||'es').startsWith('eu');
  this.replaceChildren();const style=document.createElement('style');style.textContent='eguraldi-alert-editor{display:grid;gap:14px;padding:8px 0}eguraldi-alert-editor label{display:grid;gap:7px}eguraldi-alert-editor select,eguraldi-alert-editor input{width:100%;font:inherit;padding:10px;border:1px solid var(--divider-color,#888);border-radius:10px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#111)}';this.append(style);
  const save=(key,value)=>{this._config={...this._config,[key]:value};this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));this._render();};
  const field=(label,key,options,value)=>{const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement(options?'select':'input');input.id='alert-editor-'+key;if(options)for(const [id,text] of options){const o=document.createElement('option');o.value=id;o.textContent=text;input.append(o);}input.value=value;input.addEventListener('change',()=>save(key,key==='ticker_speed'?Number(input.value):input.value));wrap.append(input);this.append(wrap);};
  const sources=Object.entries(this._hass?.states||{}).filter(([,state])=>Array.isArray(state.attributes?.alerts)).map(([id,state])=>[id,state.attributes.friendly_name||id]);if(this._config.entity&&!sources.some(([id])=>id===this._config.entity))sources.push([this._config.entity,this._config.entity]);
  field(eu?'Abisuen entitatea':'Entidad de avisos','entity',sources,this._config.entity||'');
  field(eu?'Izenburua':'Título','title',null,this._config.title||'');
  field(eu?'Abisuen diseinua':'Diseño de los avisos','view',[['list',eu?'Aldien araberako zerrenda':'Lista por periodos'],['ticker',eu?'Banda mugikorra':'Banda en movimiento'],['timeline',eu?'Denbora-lerroa':'Línea temporal'],['headlines',eu?'Titularrak · lerro bakarra':'Titulares · una línea']],this._config.view||'list');
  if(['ticker','headlines'].includes(this._config.view)){const current=Number(this._config.ticker_speed)||24,values=[[16,eu?'Motela':'Lenta'],[24,eu?'Normala':'Normal'],[36,eu?'Azkarra':'Rápida']];if(!values.some(([v])=>v===current))values.push([current,current+' px/s']);field(eu?'Mugimenduaren abiadura':'Velocidad del movimiento','ticker_speed',values,current);}
 }
}
if(!customElements.get('eguraldi-alert-editor'))customElements.define('eguraldi-alert-editor',EguraldiAlertEditor);
