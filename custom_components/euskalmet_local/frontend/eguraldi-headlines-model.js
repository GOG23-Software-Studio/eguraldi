/* Household news uses published data and existing recommendation results. MIT. */
export const HEADLINE_TOPICS = [
  ['current','Tiempo actual','Uneko eguraldia'],['rain','Lluvia prevista','Espero den euria'],
  ['wind','Viento','Haizea'],['daily','Mínima y máxima de hoy','Gaurko minimoa eta maximoa'],
  ['plans','Planes','Planak'],['microclimate','Microclima','Mikroklima'],
  ['update','Actualización de Eguraldi','Eguraldiren eguneraketa'],['alerts','Avisos oficiales','Abisu ofizialak'],
];
export function headlineTopics(config={}) {
  const allowed=new Set(HEADLINE_TOPICS.map(([id])=>id));
  return [...new Set((Array.isArray(config.headline_topics)?config.headline_topics:HEADLINE_TOPICS.map(([id])=>id)).filter(id=>allowed.has(id)))];
}
const newsNumber=value=>value===null||value===undefined||value===''||typeof value==='boolean'?null:Number.isFinite(Number(value))?Number(value):null;
export function buildHeadlines({weather={},observedAt,hourly=[],daily=[],plans,micro,update,topics=headlineTopics(),now=Date.now(),timeZone='Europe/Madrid',language='es'}={}) {
  const eu=language.startsWith('eu'),locale=eu?'eu-ES':'es-ES',pick=(es,basque)=>eu?basque:es;
  const number=v=>new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(v);
  let zone=timeZone;try{new Intl.DateTimeFormat(locale,{timeZone:zone});}catch{zone='Europe/Madrid';}
  const day=v=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone}).format(new Date(v));
  const time=v=>new Intl.DateTimeFormat(locale,{timeZone:zone,weekday:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
  const groups={},add=(topic,key,title,detail,icon)=>{(groups[topic]??=[]).push({key:'news:'+key,topic,title,description:title+'\n\n'+detail,icon,news:true,group:{level:'none'},start:null,end:null,period:''});};
  const age=now-Date.parse(observedAt),current=Number.isFinite(age)&&age>=-300000&&age<=45*60000;
  const unit=weather.temperature_unit||'°C',temp=newsNumber(weather.temperature),humidity=newsNumber(weather.humidity),wind=newsNumber(weather.wind_speed);
  if(current&&temp!==null)add('current','current',pick(`Ahora: ${number(temp)} ${unit}`,`Orain: ${number(temp)} ${unit}`)+(humidity!==null?pick(` · humedad ${number(humidity)} %`,` · hezetasuna % ${number(humidity)}`):''),pick('Medición de la estación seleccionada; no es una lectura del interior de tu casa.','Hautatutako estazioaren neurketa; ez da etxe barruko irakurketa.'),'mdi:thermometer');
  if(current&&wind!==null&&wind>=0)add('wind','wind',pick(`Viento ahora: ${number(wind)} ${weather.wind_speed_unit||'km/h'}`,`Haizea orain: ${number(wind)} ${weather.wind_speed_unit||'km/h'}`),pick('Viento medido en la estación seleccionada.','Hautatutako estazioan neurtutako haizea.'),'mdi:weather-windy');
  const wet=new Set(['rainy','pouring','lightning-rainy','snowy-rainy','hail']);
  const rows=hourly.filter(f=>Number.isFinite(Date.parse(f.datetime))&&Date.parse(f.datetime)>=now&&Date.parse(f.datetime)<=now+24*3600000).sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime));
  const firstWet=rows.find(f=>wet.has(f.condition)||(newsNumber(f.precipitation)??0)>0);
  const hourlyDetail=pick('Previsión municipal por bloques horarios. La hora indica el bloque previsto, no el minuto exacto de llegada.','Udalerriko ordukako iragarpena. Orduak aurreikusitako tartea adierazten du, ez iristeko minutu zehatza.');
  if(firstWet)add('rain','rain',pick(`Lluvia prevista: ${time(firstWet.datetime)}`,`Euria espero da: ${time(firstWet.datetime)}`),hourlyDetail,'mdi:weather-rainy');
  else {
    // Stop at the first missing/ambiguous hour: never bridge a hole to promise dry weather.
    const index=new Map(),duplicates=new Set();for(const f of rows){const stamp=Date.parse(f.datetime);if(index.has(stamp))duplicates.add(stamp);index.set(stamp,f);}for(const stamp of duplicates)index.delete(stamp);let hours=0;
    for(let stamp=Math.ceil(now/3600000)*3600000;stamp<=now+24*3600000;stamp+=3600000){const f=index.get(stamp),rain=newsNumber(f?.precipitation);if(!f||rain===null||rain!==0||!['sunny','clear-night','partlycloudy','cloudy','windy','windy-variant','fog'].includes(f.condition))break;hours++;}
    if(hours)add('rain','dry',pick(`Sin lluvia prevista en ${hours} ${hours===1?'hora consecutiva':'horas consecutivas'} con datos`,`Ez da euririk espero datuak dituzten ${hours} ordu jarraituetan`),hourlyDetail,'mdi:weather-partly-cloudy');
  }
  const chance=rows.find(f=>{const p=newsNumber(f.precipitation_probability);return p!==null&&p>=0&&p<=100;});
  if(chance)add('rain','probability',pick(`Probabilidad de lluvia: ${number(Number(chance.precipitation_probability))} % · ${time(chance.datetime)}`,`Euri-probabilitatea: % ${number(Number(chance.precipitation_probability))} · ${time(chance.datetime)}`),pick('Porcentaje publicado por la fuente horaria. No se calcula a partir de milímetros.','Ordukako iturriak argitaratutako ehunekoa. Ez da milimetroetatik kalkulatzen.'),'mdi:water-percent');
  const today=daily.find(f=>Number.isFinite(Date.parse(f.datetime))&&day(f.datetime)===day(now));
  if(!chance&&today){const p=newsNumber(today.precipitation_probability);if(p!==null&&p>=0&&p<=100)add('rain','probability',pick(`Probabilidad de lluvia hoy: ${number(p)} %`,`Gaurko euri-probabilitatea: % ${number(p)}`),pick('Porcentaje publicado por la fuente diaria, no calculado a partir de milímetros.','Eguneko iturriak argitaratutako ehunekoa, ez milimetroetatik kalkulatua.'),'mdi:water-percent');}
  const peak=rows.filter(f=>newsNumber(f.wind_speed)!==null&&Number(f.wind_speed)>=0).sort((a,b)=>Number(b.wind_speed)-Number(a.wind_speed))[0];
  if(peak)add('wind','forecast-wind',pick(`Viento máximo previsto: ${number(Number(peak.wind_speed))} ${weather.wind_speed_unit||'km/h'} · ${time(peak.datetime)}`,`Aurreikusitako haize maximoa: ${number(Number(peak.wind_speed))} ${weather.wind_speed_unit||'km/h'} · ${time(peak.datetime)}`),hourlyDetail,'mdi:weather-windy');

  const low=newsNumber(today?.templow),high=newsNumber(today?.temperature);
  if(low!==null&&high!==null&&low<=high)add('daily','daily',pick(`Hoy: mínima ${number(low)} ${unit} · máxima ${number(high)} ${unit}`,`Gaur: minimoa ${number(low)} ${unit} · maximoa ${number(high)} ${unit}`),pick('Temperaturas previstas para el municipio; no son extremos ya medidos.','Udalerrirako aurreikusitako tenperaturak; ez dira dagoeneko neurtutako muturrak.'),'mdi:thermometer-lines');
  for(const [id,label,euLabel] of [['outing','Para salir','Kalera ateratzeko'],['drying','Para tender','Arropa esekitzeko']]){
    const best=plans?.[id]?.plan?.best;if(!best)continue;
    const limited=plans[id].status==='limited';
    add('plans',id,`${pick(label,euLabel)}: ${time(best.start)}–${new Intl.DateTimeFormat(locale,{timeZone:zone,hour:'2-digit',minute:'2-digit'}).format(new Date(best.end))}${limited?pick(' · orientación parcial',' · orientazio partziala'):''}`,pick('Reutiliza la recomendación configurada de Eguraldi. Es orientativa y puede cambiar; no garantiza condiciones en tu vivienda.','Eguraldin konfiguratutako gomendioa erabiltzen du. Orientagarria da eta alda daiteke; ez du etxeko baldintzarik bermatzen.'),id==='drying'?'mdi:tshirt-crew':'mdi:walk');
  }
  const wash=plans?.washing?.plan?.best;
  if(wash){const forecast=daily.find(f=>Number.isFinite(Date.parse(f.datetime))&&day(f.datetime)===wash.key);if(forecast)add('plans','washing',pick(`Para lavar el vehículo: ${time(forecast.datetime).split(',').slice(0,-1).join(',')||wash.key}`,`Ibilgailua garbitzeko: ${wash.key}`),pick(`${wash.run} días consecutivos con previsión sin lluvia. Comparación limitada a los días disponibles.`,`${wash.run} egun jarraitu euririk gabeko iragarpenarekin. Eskuragarri dauden egunak soilik alderatzen dira.`),'mdi:car-wash');}
  if(micro&&!['unknown','unavailable'].includes(micro.state)){
    const labels=eu?{learning:'Ikasten',validated:'Egiaztatua',not_improved:'Hobekuntzarik ez da frogatu',history_unavailable:'Historikorik gabe'}:{learning:'Aprendiendo',validated:'Validado',not_improved:'Sin mejora demostrada',history_unavailable:'Histórico no disponible'};
    const hours=newsNumber(micro.attributes?.training_hours),progress=micro.state==='learning'&&hours!==null&&hours>=0?pick(` · ${number(hours)} horas de aprendizaje`,` · ${number(hours)} ikaskuntza-ordu`):'';
    if(labels[micro.state])add('microclimate','micro',`Microclima: ${labels[micro.state]}${progress}`,pick('Compara observaciones del sensor exterior con la estación. La validación no demuestra una mejora de la previsión futura.','Kanpoko sentsorearen behaketak estazioarekin alderatzen ditu. Egiaztapenak ez du etorkizuneko iragarpenaren hobekuntza frogatzen.'),'mdi:home-thermometer');
  }
  if(update?.state==='on'&&typeof update.attributes?.latest_version==='string')add('update','update',pick(`Eguraldi: actualización ${update.attributes.latest_version} disponible`,`Eguraldi: ${update.attributes.latest_version} eguneraketa eskuragarri`),pick('Home Assistant informa de una actualización en la entidad elegida. Este titular no instala ni reinicia nada.','Home Assistantek eguneraketa baten berri eman du hautatutako entitatean. Titular honek ez du ezer instalatzen edo berrabiarazten.'),'mdi:package-up');
  return [...new Set(topics)].flatMap(topic=>groups[topic]||[]);
}
