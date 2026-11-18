/* Eguraldi — GOG23 Software Studio. MIT. Icons: Meteocons / Bas Milius. */
import './euskalmet-alert-card.js?v=0.4.0';
import './eguraldi-comparison-card.js?v=0.4.0';
import './eguraldi-microclimate-card.js?v=0.4.0';
import './euskalmet-history-card.js?v=0.4.0-controls';
import './euskalmet-radar-map-card.js?v=0.4.0';

import {DRYING_CSS} from './eguraldi-drying-style.js?v=0.4.0';
import {dryingPlan} from './eguraldi-drying-model.js?v=0.4.0';

import {outingPlan} from './eguraldi-outing-model.js?v=0.4.0';

const EU_TEXT = {
  "Despejado": "Oskarbi",
  "Intervalos nubosos": "Hodei tarteak",
  "Nuboso": "Hodeitsu",
  "Lluvia": "Euria",
  "Lluvia intensa": "Euri-jasa",
  "Niebla": "Lainoa",
  "Nieve": "Elurra",
  "Aguanieve": "Elur bustia",
  "Tormenta": "Ekaitza",
  "Tormenta con lluvia": "Ekaitza euriarekin",
  "Viento": "Haizea",
  "Granizo": "Txingorra",
  "Condiciones excepcionales": "Ezohiko baldintzak",
  "Sin datos": "Daturik ez",
  "Esperando observaciones": "Neurketen zain",
  "Lluvia hoy": "Gaurko euria",
  "Humedad": "Hezetasuna",
  "Revisar antigüedad": "Berrikusi dataren antzinatasuna",
  "Última lectura": "Azken neurketa",
  "sin fecha": "datarik gabe",
  "próximas 24 horas": "hurrengo 24 orduak",
  "próximos días": "hurrengo egunak",
  "Hoy": "Gaur",
  "Rango de temperatura": "Tenperatura-tartea",
  "Esperando previsión horaria…": "Orduko iragarpenaren zain…",
  "Esperando previsión diaria…": "Eguneko iragarpenaren zain…",
  "Euskalmet · cada columna representa una hora. Lluvia acumulada por hora; — significa dato no publicado.": "Euskalmet · zutabe bakoitzak ordu bat adierazten du. Orduko euri metatua; — ikurrak argitaratu gabeko datua adierazten du.",
  "Mínima / máxima": "Minimoa / maximoa",
  "previsión para": "iragarpena:",
  "Selecciona localidad": "Aukeratu herria",
  "Elegir…": "Aukeratu…",
  "Añade una localidad desde la integración Eguraldi.": "Gehitu herri bat Eguraldi integrazioan.",
  "Cargando localidades…": "Herriak kargatzen…",
  "Vista del tiempo": "Eguraldiaren ikuspegia",
  "24 horas": "24 ordu",
  "Próximos días": "Hurrengo egunak",
  "Histórico": "Historikoa",
  "Avisos": "Abisuak",
  "Mediciones en {station}{distance}": "Neurketak: {station}{distance}",
  " · a {distance} km de {reference}": " · {reference}: {distance} km-ra",
  "estación no disponible": "estazioa ez dago eskuragarri",
  "la ubicación de HA": "HAren kokapena",
  "histórico de temperatura": "tenperaturaren historikoa",
  "radar de precipitación": "prezipitazio-radarra",
  "avisos": "abisuak",
  "resumen de hoy": "gaurko laburpena",
  "temperatura · últimas 24 horas": "tenperatura · azken 24 orduak",
  "costa y ambiente": "kostaldea eta ingurumena",
  "Radar regional · Euskalmet": "Eskualdeko radarra · Euskalmet",
  "Avisos para la zona de tu localidad": "Zure herriko eremurako abisuak",
  "Cantábrico · mareas de Pasaia · captadora de polen de referencia": "Kantauri itsasoa · Pasaiako mareak · erreferentziako polen-neurgailua",
  "Temperatura mínima": "Tenperatura minimoa",
  "Temperatura máxima": "Tenperatura maximoa",
  "Racha máxima": "Haize-bolada maximoa",
  "Lluvia acumulada": "Euri metatua",
  "Radiación solar": "Eguzki-erradiazioa",
  "Altura de ola · Cantábrico": "Olatuen altuera · Kantauri itsasoa",
  "Temperatura del mar": "Itsasoko tenperatura",
  "Próxima pleamar · Pasaia": "Hurrengo itsasgora · Pasaia",
  "Polen · muestra de referencia": "Polena · erreferentziako lagina",
  "No disponible": "Ez dago eskuragarri",
  "estación": "estazioa",
  "Comparación": "Konparazioa",
  "No se ha podido cargar la comparación.": "Ezin izan da konparazioa kargatu.",
  "Esta tarjeta todavía no está disponible.": "Txartel hau ez dago oraindik eskuragarri.",
  "Modo no válido": "Modua ez da baliozkoa",
  "La entidad meteorológica no está disponible.": "Eguraldi-entitatea ez dago eskuragarri.",
  "No se ha podido cargar la previsión. Comprueba la integración y vuelve a abrir la tarjeta.": "Ezin izan da iragarpena kargatu. Egiaztatu integrazioa eta ireki txartela berriro.",
  "Panel completo": "Panel osoa",
  "Tiempo actual": "Uneko eguraldia",
  "Próximas 24 horas": "Hurrengo 24 orduak",
  "Resumen de hoy": "Gaurko laburpena",
  "Histórico mensual": "Hileko historikoa",
  "Comparación de temperatura": "Tenperaturen konparazioa",
  "Costa y ambiente": "Kostaldea eta ingurumena",
  "Vista": "Ikuspegia",
  "Ubicación": "Kokapena",
  "Automática · única ubicación": "Automatikoa · kokapen bakarra",
  "Elegir en la tarjeta": "Txartelean aukeratu",
  " · ubicación de HA": " · HAren kokapena",
  "No se han podido cargar las ubicaciones. Vuelve a abrir el editor.": "Ezin izan dira kokapenak kargatu. Ireki editorea berriro.",
  "La ubicación elegida se guardará con esta tarjeta.": "Aukeratutako kokapena txartel honekin gordeko da.",
  "Añade una ubicación en la integración Eguraldi.": "Gehitu kokapen bat Eguraldi integrazioan.",
  "Cargando ubicaciones…": "Kokapenak kargatzen…",
  "Ubicación configurada · no disponible": "Konfiguratutako kokapena · ez dago eskuragarri",
  "Zoom del mapa": "Maparen zooma",
  "Un número mayor acerca la vista a tu ubicación.": "Zenbakia handitu zure kokapenera hurbiltzeko.",
  "Sensor de temperatura para comparar": "Konparatzeko tenperatura-sentsorea",
  "Solo la estación": "Estazioa bakarrik",
  "Nombre en el gráfico": "Grafikoko izena",
  "Por ejemplo, Balcón": "Adibidez, Balkoia"
};
Object.assign(EU_TEXT,{"Aprendiendo":"Ikasten","Validado":"Egiaztatua","Sin mejora demostrada":"Hobekuntzarik gabe","Histórico no disponible":"Historikorik gabe","Microclima":"Mikroklima","microclima":"mikroklima","Máxima":"Maximoa","Mínima":"Minimoa","Máxima / mínima":"Maximoa / minimoa","Gráfico de próximas 24 horas": "Hurrengo 24 orduen grafikoa", "Semana visual": "Asteko ikuspegia", "Planifica las próximas horas": "Planifikatu hurrengo orduak", "Una mirada a la semana": "Asteari begirada bat", "¿Paraguas o chaqueta?": "Aterkia ala jaka?", "Mañana": "Bihar", "Temperatura": "Tenperatura", "Lluvia prevista": "Aurreikusitako euria", "Probabilidad de lluvia": "Euri-probabilitatea", "Previsión de Euskalmet": "Euskalmeten iragarpena", "Los datos ausentes dejan huecos": "Falta diren datuek hutsuneak uzten dituzte", "Previsión recibida": "Jasotako iragarpena", "Lluvia sin datos publicados": "Ez dago euri-datu argitaraturik", "Desde las {time}": "{time} ordutik aurrera", "Sin lluvia en las horas con datos": "Euririk ez datuak dituzten orduetan", "Viento máximo previsto · próximas 12 h": "Aurreikusitako haize maximoa · hurrengo 12 orduak", "Racha máxima · próximas 12 h": "Haize-bolada maximoa · hurrengo 12 orduak", "Lluvia prevista · próximas 24 h": "Aurreikusitako euria · hurrengo 24 orduak", "Cerrar radar": "Itxi radarra", "Próximo amanecer": "Hurrengo egunsentia", "Próxima puesta": "Hurrengo ilunabarra", "Mapa satélite": "Satelite-mapa", "Mapa oscuro": "Mapa iluna", "Mapa claro": "Mapa argia", "Estilo del mapa": "Maparen estiloa"});
Object.assign(EU_TEXT,{"¿Puedo tender fuera?": "Arropa kanpoan zabal dezaket?", "Tender fuera": "Arropa zabaldu", "Planifica el secado": "Planifikatu lehortzea", "Buscar una ventana de": "Bilatu tarte bat:", "Mejor ventana": "Tarterik onena", "Ventana orientativa": "Gutxi gorabeherako tartea", "Condiciones favorables": "Baldintza onak", "Condiciones aceptables": "Baldintza onargarriak", "Secado lento": "Lehortze motela", "Evitar": "Saihestu", "Sin datos suficientes": "Ez dago nahikoa daturik", "Mejor esperar": "Hobe itxarotea", "No hay una franja de {hours} h con condiciones suficientes.": "Ez dago baldintza nahikoak dituen {hours} orduko tarterik.", "Humedad horaria no disponible: orientación parcial.": "Orduko hezetasuna ez dago eskuragarri: orientazio partziala.", "Otras opciones": "Beste aukerak", "Próximas horas": "Hurrengo orduak", "Detalle de la hora": "Orduaren xehetasuna", "Sin lluvia prevista": "Ez da euririk espero", "Lluvia o tormenta prevista": "Euria edo ekaitza espero da", "Viento demasiado fuerte": "Haize bortitzegia", "Frío intenso": "Hotz handia", "Humedad muy alta o niebla": "Hezetasun oso handia edo lainoa", "Humedad alta": "Hezetasun handia", "Temperatura baja": "Tenperatura baxua", "Poco viento": "Haize gutxi", "Noche: menor potencial de secado": "Gaua: lehortzeko ahalmen txikiagoa", "Posibilidad de lluvia": "Euria egiteko aukera", "Faltan lluvia, temperatura o viento": "Euri-, tenperatura- edo haize-datuak falta dira", "Humedad horaria complementaria": "Orduko hezetasun osagarria", "Solo Euskalmet": "Euskalmet soilik", "Opcional: elige una previsión horaria de la misma localidad. Solo se utiliza su humedad.": "Aukerakoa: hautatu herri bereko orduko iragarpena. Hezetasuna soilik erabiltzen da.", "Complemento de humedad: {source}": "Hezetasun osagarria: {source}", "Cómo se calcula": "Nola kalkulatzen da", "Se comparan franjas de horas completas. No se calcula cuánto tardará tu ropa en secarse.": "Ordu osoko tarteak alderatzen dira. Ez da zure arropa lehortzeko denbora kalkulatzen.", "La lluvia prevista, la niebla, el frío intenso y el viento fuerte descartan una hora. El resto se ordena por temperatura, humedad, brisa y noche.": "Aurreikusitako euriak, lainoak, hotz handiak eta haize bortitzak ordua baztertzen dute. Gainerakoak tenperaturaren, hezetasunaren, haizearen eta gauaren arabera ordenatzen dira.", "Sin humedad horaria no se muestra una recomendación favorable. La humedad actual no se usa como previsión.": "Orduko hezetasunik gabe ez da gomendio onik erakusten. Uneko hezetasuna ez da iragarpen gisa erabiltzen.", "Reglas orientativas de Eguraldi, sin garantía de secado.": "Eguraldiren orientazio-arauak, lehortzeko bermerik gabe.", "h": "h"});
Object.assign(EU_TEXT,{"Lluvia total":"Euri metatua","Humedad media":"Batez besteko hezetasuna","Temperatura media":"Batez besteko tenperatura","Viento máximo":"Haize maximoa"});
Object.assign(EU_TEXT,{"Revisa el complemento de humedad para esta localidad":"Berrikusi herri honetako hezetasun osagarria"});
Object.assign(EU_TEXT,{"La mejor hora para salir": "Kalera irteteko ordurik onena", "Salir": "Kalera irten", "Organiza tu salida": "Antolatu zure irteera", "Paseo": "Paseoa", "Deporte": "Kirola", "Con niños": "Umeekin", "Actividad": "Jarduera", "Duración": "Iraupena", "Previsión horaria: las franjas de 30 minutos usan los mismos datos de su hora.": "Orduko iragarpena: 30 minutuko tarteek ordu bereko datuak erabiltzen dituzte.", "Paraguas": "Aterkia", "Chaqueta": "Jaka", "Por precaución": "Badaezpada", "No se prevé lluvia": "Ez da euririk espero", "Recomendable": "Gomendagarria", "A tu elección": "Zure aukeran", "Después de la mejor franja": "Tarterik onenaren ondoren", "Puede aparecer lluvia": "Euria ager daiteke", "Baja la temperatura": "Tenperatura jaisten da", "Aumenta el viento": "Haizea indartzen da", "No se detectan cambios destacables en las horas disponibles.": "Eskuragarri dauden orduetan ez da aldaketa nabarmenik antzeman.", "Franjas para comparar": "Alderatzeko tarteak", "Detalle de la franja": "Tartearen xehetasuna", "Máxima lluvia horaria": "Orduko euri maximoa", "Temperatura mínima": "Tenperatura minimoa", "Temperatura máxima": "Tenperatura maximoa", "Noche o poca luz": "Gaua edo argi gutxi", "Probabilidad de lluvia o lluvia débil": "Euri-probabilitatea edo euri ahula", "Viento molesto": "Haize gogaikarria", "Franja con lluvia": "Euria duen tartea", "Tormenta o condiciones adversas": "Ekaitza edo baldintza txarrak", "Temperatura poco adecuada para esta actividad": "Jarduera honetarako tenperatura desegokia", "Niebla": "Lainoa", "Faltan datos para valorar esta franja": "Tarte hau baloratzeko datuak falta dira", "No se ha encontrado una franja adecuada con los datos disponibles.": "Eskuragarri dauden datuekin ez da tarte egokirik aurkitu.", "Orientación meteorológica, no una evaluación de seguridad. Las reglas cambian según la actividad.": "Eguraldiari buruzko orientazioa da, ez segurtasun-ebaluazioa. Arauak jardueraren arabera aldatzen dira.", "Las franjas deben tener datos en todas las horas que tocan. No se interpolan la lluvia ni el viento.": "Tarteek ukitzen dituzten ordu guztietan datuak behar dituzte. Euria eta haizea ez dira interpolatzen.", "Se comparan lluvia, temperatura, viento y luz diurna. Microclima no modifica la previsión.": "Euria, tenperatura, haizea eta eguneko argia alderatzen dira. Mikroklimak ez du iragarpena aldatzen."});
Object.assign(EU_TEXT,{"No se detectan cambios destacables en las horas comparadas.":"Alderatutako orduetan ez da aldaketa nabarmenik antzeman.","No hay suficientes datos posteriores para comparar.":"Ez dago ondorengo datu nahikorik alderatzeko.","Comparado hasta {time}":"{time} arte alderatuta"});
const egLocale = hass => String(hass?.locale?.language || hass?.language || navigator.language || 'es').toLowerCase().startsWith('eu') ? 'eu-ES' : 'es-ES';
const egText = (hass, text, values={}) => {
  const translated=egLocale(hass)==='eu-ES'?(EU_TEXT[text]||text):text;
  return translated.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??`{${key}}`));
};

const BASE = '/euskalmet_local_static/';
const EXTRA_MODES = ['microclimate','history','radar','alerts','summaries','comparison','environment'];
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
.micro-entry{margin-top:18px;border-top:1px solid #9acdd926;padding-top:14px}.micro-entry>summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;color:#edf8ff}.micro-entry>summary small{font-size:10px;color:#8ed9d1;border:1px solid #8ed9d140;border-radius:20px;padding:5px 8px}.micro-entry>summary:focus-visible{outline:2px solid #8ed9d1;outline-offset:4px}
:host{display:block;min-width:0}*{box-sizing:border-box}ha-card{display:block;border-radius:24px;background:linear-gradient(145deg,#1b3246,#101e30);border:1px solid #9acdd926;box-shadow:0 12px 32px #0002;color:#edf8ff;font-family:var(--primary-font-family,system-ui);overflow:hidden}section{padding:20px}h2{font-size:21px;font-weight:550;margin:0 0 14px}h3{font-size:16px;margin:0}.eyebrow{font-size:10px;letter-spacing:2.5px;color:#91d9d1}.muted,.source{color:#a9becf;font-size:11px}.measurement-source{font-size:11px;line-height:1.5;font-weight:400}.source{margin:12px 0 0;line-height:1.4}.hero{background:radial-gradient(ellipse at top right,#326e8370,transparent 70%)}.place{font-size:27px;letter-spacing:-.5px;margin:8px 0 4px}.current{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:15px 0}.big{font-size:68px;letter-spacing:-3px;font-weight:300}.big small{font-size:23px;letter-spacing:0}.hero img{width:132px;height:116px}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;border-top:1px solid #ffffff20;padding-top:14px;margin-top:18px;font-size:14px}.metrics small{display:block;color:#a9becf;font-size:10px;margin-top:4px}.warning{background:#efbc7b15;border-left:3px solid #efbc7b;color:#efca95;padding:10px 12px;border-radius:10px;font-size:12px;margin-top:12px}.hour-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px 0}.hour{min-width:0;text-align:center;border-bottom:1px solid #8db8d016;padding:0 1px 8px;line-height:1.25}.hour time{display:block;font-size:11px;color:#bbd0df}.hour .date{font-size:9px;color:#9cb2c4;min-height:12px}.hour .sky{height:53px;display:flex;align-items:center;justify-content:center;background:#87b5d00b}.sky img{width:59px;height:59px;max-width:100%;object-fit:contain}.temp{font-size:16px;font-weight:650;margin:3px 0}.wind,.rain{font-size:10px;color:#a8dce9;white-space:nowrap}.rain{min-height:12px}.days{display:grid;gap:6px}.day{display:grid;grid-template-columns:46px 48px 44px minmax(30px,1fr) 44px;align-items:center;gap:5px;min-height:45px;font-size:12px}.day img{width:48px;height:48px}.day strong:last-child{text-align:right}.track{height:7px;border-radius:8px;background:#94b9d017;position:relative}.range{position:absolute;height:100%;border-radius:8px;background:linear-gradient(90deg,#79d0c1,#ffdf85)}.low{color:#b5d2e4}.message{padding:24px;color:#a9becf;font-size:13px}.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}button,select{font:inherit;color:#d9edf6;background:#7dbbcc12;border:1px solid #b5ddeb28;border-radius:12px;padding:9px 12px;cursor:pointer}button.active{background:#62baa72b;border-color:#8ed9d1}button:focus-visible,select:focus-visible{outline:2px solid #8ed9d1;outline-offset:2px}.extras{display:grid;gap:12px;margin-top:15px}img{display:block}.divider{border-top:1px solid #ffffff16}select{max-width:100%;margin-bottom:14px}.error{color:#efca95} @media(max-width:380px){section{padding:15px 12px}.sky img{width:48px;height:48px}.hour .sky{height:47px}.wind,.rain{font-size:9px}.day{grid-template-columns:39px 38px 39px minmax(20px,1fr) 39px;gap:3px}.day img{width:38px;height:38px}.big{font-size:58px}.hero img{width:108px}.place{font-size:23px}}
`;


const FORECAST_CSS=`
.forecast-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}.forecast-top h2{margin:6px 0 0}.forecast-kicker{text-transform:uppercase;letter-spacing:2px;font-size:10px;color:#a9cbe4}.forecast-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;margin-bottom:12px}.forecast-legend .temperature{color:#ffbf83}.forecast-legend .precipitation{color:#68cef3}.forecast-chart{display:block;width:100%;height:auto;overflow:visible}.chart-grid{stroke:#a9cbe414;stroke-width:1}.chart-temp{stroke:#ffbf83;stroke-width:2.5;fill:none}.chart-bar{fill:#68cef3;fill-opacity:.35}.forecast-foot{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;font-size:10px;color:#a9becf}.week-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:10px}.week-tile{display:flex;flex-direction:column;align-items:center;min-width:0;padding:16px 10px;border:1px solid #9acdd91c;border-radius:16px;background:#ffffff02}.week-tile:first-child{background:#8ecade0a;border-color:#78c9ec40}.week-day{font-size:12px;font-weight:600}.week-tile img{width:80px;height:80px;margin:12px 0}.week-values{display:flex;align-items:baseline;gap:8px}.week-values strong,.week-values span{display:block;font-size:25px;font-weight:700;line-height:1.15}.week-values strong{color:#ffbf83}.week-values span{color:#68cef3}.week-values small{display:block;font-size:9px;font-weight:400;color:#a9becf;margin-bottom:4px}.week-track{height:4px;width:100%;position:relative;border-radius:4px;background:#94b9d017;margin:14px 0 4px}.week-range{position:absolute;height:100%;min-width:4px;max-width:100%;border-radius:4px;background:linear-gradient(90deg,#68cef3,#ffbf83)}.week-rain{font-size:11px;color:#68cef3}.planning-hours{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}.planning-hour{text-align:center;padding:10px 2px;border-radius:14px;font-size:11px;color:#a9cbe4}.planning-hour:first-child{background:#8ecade0d}.planning-hour img{height:58px;width:100%;object-fit:contain;margin:9px 0}.planning-hour strong{display:block;color:#edf8ff;font-size:18px;margin:5px 0 12px}.planning-hour .planning-rain{color:#68cef3;margin-bottom:8px}.planning-hour small{font-size:10px}.planning-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.planning-summary div{border:1px solid #9acdd926;border-radius:14px;padding:14px;font-size:11px;color:#a9cbe4}.planning-summary strong{display:block;margin-top:5px;font-size:15px;color:#edf8ff}#planning-radar:empty{display:none}#planning-radar{margin-top:16px}.chart-point:focus-visible{outline:none;stroke:#fff;stroke-width:3}
@media(max-width:550px){.week-tiles{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.week-tile{padding:12px 6px}.week-tile img{width:62px;height:62px}.week-values strong,.week-values span{font-size:22px}.planning-hours{grid-template-columns:repeat(4,minmax(0,1fr));row-gap:12px}.planning-summary{grid-template-columns:1fr}.forecast-top h2{font-size:19px}.forecast-chart text{font-size:18px}}
`;

export class EuskalmetLocalCard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._generation=0;this._forecasts={};this._unsubs=[];this._tab='hourly';}
  setConfig(config){
    if(!['dashboard','overview','hourly','daily','hourly_chart','daily_tiles','planning','drying','outing',...EXTRA_MODES].includes(config.mode||'dashboard'))throw Error(this._t('Modo no válido'));
    this._stop();this._config={...config,mode:config.mode||'dashboard'};this._location=null;this._locations=null;this._forecasts={};this._humidityForecast=[];this._humidityBinding=null;this._dryingSelected=null;this._dryingDuration=null;this._outingSelected=null;this._outingActivity=null;this._outingMinutes=null;this._error=null;this._start();this._render();
  }
  set hass(value){const previous=this._hass;this._hass=value;this._start();const changed=!previous||!this._location||Object.values(this._location.entities).some(id=>previous.states[id]!==value.states[id])||previous.states[this._config?.humidity_forecast_entity]!==value.states[this._config?.humidity_forecast_entity]||previous.config?.time_zone!==value.config?.time_zone||egLocale(previous)!==egLocale(value);if(changed&&!this._renderScheduled){this._renderScheduled=true;queueMicrotask(()=>{this._renderScheduled=false;this._render();});}}
  connectedCallback(){this._start();this._dryingClock=setInterval(()=>{if(['drying','outing'].includes(this._config?.mode)||['drying','outing'].includes(this._tab))this._render();},60000);}
  disconnectedCallback(){clearInterval(this._dryingClock);this._stop();}
  _stop(){this._generation++;this._extraRevision=(this._extraRevision||0)+1;this._extraPending=null;this._humidityForecast=[];this._dryingSelected=null;for(const unsubscribe of this._unsubs.splice(0))unsubscribe();this._starting=false;}
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
      const selected=locations.find(l=>this._config.entry_id?l.entry_id===this._config.entry_id:this._config.entity?l.entities.weather===this._config.entity:false) || (!this._config.entry_id&&!this._config.entity&&locations.length===1?locations[0]:null);
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
          this._forecasts[type]=event.forecast||[];this._receivedAt??={};this._receivedAt[type]=Date.now();this._forecastErrors??={};delete this._forecastErrors[type];this._render();
        },{type:'weather/subscribe_forecast',forecast_type:type,entity_id:weather});
        if(generation!==this._generation){unsubscribe();return;}this._unsubs.push(unsubscribe);
      }
      const humidityEntity=this._config.humidity_forecast_entity;
      const binding=JSON.stringify([this._location.locality,this._location.latitude,this._location.longitude]);
      this._humidityBinding??=binding;
      this._humidityMismatch=this._humidityBinding!==binding||Boolean(this._config.humidity_forecast_locality&&this._config.humidity_forecast_locality!==this._location.locality);
      if(!this._humidityMismatch&&['drying','dashboard'].includes(this._config.mode)&&/^weather\.[a-z0-9_]+$/.test(humidityEntity||'')&&humidityEntity!==weather){
        try{
          const unsubscribe=await this._hass.connection.subscribeMessage(event=>{if(generation!==this._generation)return;this._humidityForecast=event.forecast||[];this._render();},{type:'weather/subscribe_forecast',forecast_type:'hourly',entity_id:humidityEntity});
          if(generation!==this._generation){unsubscribe();return;}this._unsubs.push(unsubscribe);
        }catch{if(generation===this._generation){this._humidityForecast=[];this._render();}}
      }
    }catch(error){if(generation===this._generation){this._error='No se ha podido cargar la previsión. Comprueba la integración y vuelve a abrir la tarjeta.';this._render();}}
    finally{if(generation===this._generation)this._starting=false;}
  }
  _t(text,values){return egText(this._hass,text,values);}
  _state(key){return this._hass?.states[this._location?.entities[key]];}
  _time(value,options){
    const locale=egLocale(this._hass),timeZone=this._hass?.config?.time_zone||'Europe/Madrid',date=new Date(value);
    const formatter=new Intl.DateTimeFormat(locale,{timeZone,...options});
    if(locale!=='eu-ES'||formatter.resolvedOptions().locale.startsWith('eu'))return formatter.format(date);
    // Some browsers ship without Basque ICU data. Keep short calendar labels Basque there too.
    const months=['urt.','ots.','mar.','api.','mai.','eka.','uzt.','abu.','ira.','urr.','aza.','abe.'];
    const weekdays={Mon:'al.',Tue:'ar.',Wed:'az.',Thu:'og.',Fri:'or.',Sat:'lr.',Sun:'ig.'};
    const month=Number(new Intl.DateTimeFormat('en-US',{timeZone,month:'numeric'}).format(date))-1;
    const weekday=new Intl.DateTimeFormat('en-US',{timeZone,weekday:'short'}).format(date);
    return formatter.formatToParts(date).map(part=>part.type==='month'&&options.month==='short'?months[month]:part.type==='weekday'&&options.weekday==='short'?weekdays[weekday]:part.value).join('');
  }
  _icon(condition,datetime){const night=isNight(datetime,this._location.latitude,this._location.longitude);return `<img src="${BASE}icons/${iconName(condition,night)}.svg" alt="${escapeHTML(this._t(CONDITIONS[condition]||'Sin datos'))}" loading="lazy">`;}
  _weather(){return this._state('weather')?.attributes||{};}
  _microEntry(){
    if(!this._location?.microclimate_enabled||this._config.show_microclimate===false)return '';
    const status=this._state('microclimate_status')?.state,labels={learning:'Aprendiendo',validated:'Validado',not_improved:'Sin mejora demostrada',history_unavailable:'Histórico no disponible'};
    return `<details class="micro-entry" id="overview-micro" ${this._microExpanded?'open':''}><summary><span>${escapeHTML(this._t('Microclima'))}</span><small>${escapeHTML(this._t(labels[status]||'Aprendiendo'))}</small></summary><div id="overview-micro-card"></div></details>`;
  }
  _overview(){
    const weather=this._state('weather'),a=weather?.attributes||{},humidity=this._state('humidity');
    const sourceHumidity=numeric(humidity?.state)??numeric(humidity?.attributes.raw_value)??numeric(a.humidity);
    return `<section class="hero"><div class="eyebrow">EGURALDI</div><h2 class="place">${escapeHTML(this._location.locality)}</h2><div class="muted measurement-source">${escapeHTML(this._measurementSource())}</div><div class="current"><div class="big">${fmt(a.temperature)}<small> ${escapeHTML(a.temperature_unit||'°C')}</small></div>${this._icon(weather?.state,Date.now())}</div><div>${escapeHTML(this._t(CONDITIONS[weather?.state]||'Esperando observaciones'))}</div><div class="metrics"><div>${fmt(a.wind_speed)} ${escapeHTML(a.wind_speed_unit||'km/h')}<small>${escapeHTML(this._t("Viento"))}</small></div><div>${fmt(this._state('precipitation_today')?.state)} mm<small>${escapeHTML(this._t("Lluvia hoy"))}</small></div><div>${fmt(sourceHumidity)} %<small>${escapeHTML(this._t("Humedad"))}</small></div></div>${this._microEntry()}</section>`;
  }
  _hourly(){
    const forecast=forecastRows(this._forecasts.hourly),units=this._weather();
    return `<section><h2>${escapeHTML(this._location.locality)} · ${escapeHTML(this._t('próximas 24 horas'))}</h2>${forecast.length?`<div class="hour-grid">${forecast.map(f=>`<div class="hour"><div class="sky">${this._icon(f.condition,f.datetime)}</div><div class="date">${escapeHTML(this._time(f.datetime,{day:'numeric',month:'short'}))}</div><time datetime="${escapeHTML(f.datetime)}">${escapeHTML(this._time(f.datetime,{hour:'2-digit',minute:'2-digit'}))}</time><div class="temp">${fmt(f.temperature,0)}°</div><div class="wind">${fmt(f.wind_speed,0)} ${escapeHTML(units.wind_speed_unit||'km/h')}</div><div class="rain">${numeric(f.precipitation)!==null?fmt(f.precipitation)+' '+escapeHTML(units.precipitation_unit||'mm'):'—'}</div></div>`).join('')}</div>`:`<div class="message">${escapeHTML(this._t("Esperando previsión horaria…"))}</div>`}</section>`;
  }
  _daily(){
    const zone=this._hass?.config?.time_zone||'Europe/Madrid';
    const dayKey=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone}).format(new Date(value));
    const today=dayKey(Date.now()),forecast=(this._forecasts.daily||[]).filter(f=>Number.isFinite(Date.parse(f.datetime))&&dayKey(f.datetime)>=today).slice(0,7);
    const vals=forecast.flatMap(f=>[numeric(f.templow),numeric(f.temperature)]).filter(v=>v!==null),lo=vals.length?Math.min(...vals):0,hi=vals.length?Math.max(...vals):1,span=Math.max(hi-lo,1);
    return `<section><h2>${escapeHTML(this._location.locality)} · ${escapeHTML(this._t('próximos días'))}</h2>${forecast.length?`<div class="days">${forecast.map(f=>{
      const low=numeric(f.templow),high=numeric(f.temperature),left=low===null?0:Math.max(0,Math.min(100,(low-lo)/span*100)),width=low===null||high===null?0:Math.max(0,Math.min(100-left,(high-low)/span*100));
      return `<div class="day"><strong>${dayKey(f.datetime)===today?this._t('Hoy'):escapeHTML(this._time(f.datetime,{weekday:'short'}))}</strong><img src="${BASE}icons/${iconName(f.condition,false)}.svg" alt="${escapeHTML(this._t(CONDITIONS[f.condition]||'Sin datos'))}"><span class="low">${fmt(low)}°</span><div class="track" aria-label="${escapeHTML(this._t('Rango de temperatura'))}"><div class="range" style="left:${left}%;width:${width}%"></div></div><strong>${fmt(high)}°</strong></div>`;
    }).join('')}</div>`:`<div class="message">${escapeHTML(this._t("Esperando previsión diaria…"))}</div>`}</section>`;
  }
  _forecastHeader(title,kicker='Previsión de Euskalmet',action=''){
    return `<div class="forecast-top"><div><div class="forecast-kicker">${escapeHTML(this._t(kicker))} · ${escapeHTML(this._location.locality)}</div><h2>${escapeHTML(this._t(title))}</h2></div>${action}</div>`;
  }
  _rainMetric(rows){
    const amount=rows.some(f=>numeric(f.precipitation)!==null&&numeric(f.precipitation)>=0);
    const hasProbability=rows.some(f=>numeric(f.precipitation_probability)!==null&&numeric(f.precipitation_probability)>=0&&numeric(f.precipitation_probability)<=100);
    const useAmount=amount||!hasProbability,key=useAmount?'precipitation':'precipitation_probability';
    return {unit:useAmount?(this._weather().precipitation_unit||'mm'):'%',label:useAmount?'Lluvia prevista':'Probabilidad de lluvia',value:f=>{const n=numeric(f?.[key]);return n!==null&&n>=0&&(useAmount||n<=100)?n:null;}};
  }
  _hourlyChart(){
    const raw=forecastRows(this._forecasts.hourly),anchor=Math.ceil(Date.now()/3600000)*3600000;
    const indexed=new Map(raw.map(f=>[Math.floor(Date.parse(f.datetime)/3600000)*3600000,f]));
    const slots=Array.from({length:24},(_,i)=>({datetime:anchor+i*3600000,forecast:indexed.get(anchor+i*3600000)}));
    const rain=this._rainMetric(raw),temps=slots.map(s=>numeric(s.forecast?.temperature)).filter(n=>n!==null);
    const low=temps.length?Math.floor(Math.min(...temps)-1):0,high=temps.length?Math.ceil(Math.max(...temps)+1):1;
    const rainfall=slots.map(s=>rain.value(s.forecast)).filter(n=>n!==null),rainMax=rain.unit==='%'?100:Math.max(1,Math.ceil(Math.max(0,...rainfall)*1.2));
    const left=52,right=668,top=28,bottom=220,width=right-left,step=width/24;
    const x=i=>left+step*(i+.5),y=n=>bottom-(n-low)/Math.max(high-low,1)*(bottom-top);
    const unit=this._weather().temperature_unit||'°C';
    let grid='',bars='',paths='',dots='',axis='',segment=[];
    const flush=()=>{if(segment.length)paths+=`<path class="chart-temp" d="${segment.join(' ')}"/>`;segment=[];};
    for(let i=0;i<=4;i++){const py=bottom-i*(bottom-top)/4;grid+=`<line class="chart-grid" x1="${left}" x2="${right}" y1="${py}" y2="${py}"/><text x="${left-9}" y="${py+4}" text-anchor="end" fill="#ffbf83" font-size="12">${fmt(low+(high-low)*i/4,1)}°</text><text x="${right+9}" y="${py+4}" fill="#68cef3" font-size="12">${fmt(rainMax*i/4,1)}${rain.unit==='%'?'%':''}</text>`;}
    slots.forEach((slot,i)=>{
      const f=slot.forecast,t=numeric(f?.temperature),r=rain.value(f),time=this._time(slot.datetime,{hour:'2-digit',minute:'2-digit'});
      if(r!==null){const h=r/rainMax*(bottom-top);bars+=`<rect class="chart-bar" x="${x(i)-step*.32}" y="${bottom-h}" width="${step*.64}" height="${h}" rx="2"><title>${escapeHTML(time)} · ${escapeHTML(this._t(rain.label))}: ${fmt(r)} ${escapeHTML(rain.unit)}</title></rect>`;}
      if(t===null)flush();else{segment.push(`${segment.length?'L':'M'}${x(i)},${y(t)}`);dots+=`<circle class="chart-point" cx="${x(i)}" cy="${y(t)}" r="3" fill="#ffbf83" tabindex="0"><title>${escapeHTML(time)} · ${fmt(t)} ${escapeHTML(unit)}</title></circle>`;}
      if(i%4===0||i===23)axis+=`<text x="${x(i)}" y="245" text-anchor="middle" fill="#a9cbe4" font-size="12">${escapeHTML(time)}</text>`;
    });flush();
    return `<section>${this._forecastHeader('Próximas 24 horas')}<div class="forecast-legend"><span class="temperature">— ${escapeHTML(this._t('Temperatura'))} · ${escapeHTML(unit)}</span><span class="precipitation">▥ ${escapeHTML(this._t(rain.label))} · ${escapeHTML(rain.unit)}</span></div>${raw.length?`<svg class="forecast-chart" viewBox="0 0 720 260" role="img" aria-label="${escapeHTML(this._t('Gráfico de próximas 24 horas'))}"><text x="${left}" y="14" fill="#ffbf83" font-size="12">${escapeHTML(unit)}</text><text x="${right}" y="14" text-anchor="end" fill="#68cef3" font-size="12">${escapeHTML(rain.unit)}</text>${grid}${bars}${paths}${dots}${axis}</svg>`:`<div class="message">${escapeHTML(this._t('Esperando previsión horaria…'))}</div>`}</section>`;
  }
  _forecastDays(){
    const zone=this._hass?.config?.time_zone||'Europe/Madrid',key=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone}).format(new Date(value));
    const today=key(Date.now());return (this._forecasts.daily||[]).filter(f=>Number.isFinite(Date.parse(f.datetime))&&key(f.datetime)>=today).sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime)).slice(0,7);
  }
  _dailyTiles(){
    const days=this._forecastDays(),rain=this._rainMetric(days),zone=this._hass?.config?.time_zone||'Europe/Madrid';
    const dayKey=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone}).format(new Date(value));
    const today=dayKey(Date.now()),tomorrowDate=new Date();tomorrowDate.setDate(tomorrowDate.getDate()+1);const tomorrow=dayKey(tomorrowDate);
    const values=days.flatMap(f=>[numeric(f.templow),numeric(f.temperature)]).filter(v=>v!==null);
    const minimum=values.length?Math.min(...values):0,maximum=values.length?Math.max(...values):1,span=Math.max(maximum-minimum,1);
    return `<section>${this._forecastHeader('Próximos días','Una mirada a la semana')}<div class="week-tiles">${days.map(f=>{const key=dayKey(f.datetime),label=key===today?this._t('Hoy'):key===tomorrow?this._t('Mañana'):this._time(f.datetime,{weekday:'short',day:'numeric'}),value=rain.value(f),low=numeric(f.templow),high=numeric(f.temperature),valid=low!==null&&high!==null&&high>=low,left=valid?(low-minimum)/span*100:0,width=valid?(high-low)/span*100:0;return `<article class="week-tile"><div class="week-day">${escapeHTML(label)}</div><img src="${BASE}icons/${iconName(f.condition,false)}.svg" alt="${escapeHTML(this._t(CONDITIONS[f.condition]||'Sin datos'))}"><div class="week-values"><div><small>${escapeHTML(this._t('Máxima'))}</small><strong>${fmt(high,0)}°</strong></div><div><small>${escapeHTML(this._t('Mínima'))}</small><span>${fmt(low,0)}°</span></div></div>${valid?`<div class="week-track" role="img" aria-label="${escapeHTML(this._t('Rango de temperatura'))}: ${fmt(low)}–${fmt(high)} ${escapeHTML(this._weather().temperature_unit||'°C')}"><div class="week-range" style="left:${left}%;width:${width}%"></div></div>`:''}${value===null?'':`<div class="week-rain" title="${escapeHTML(this._t(rain.label))}">💧 ${fmt(value)} ${escapeHTML(rain.unit)}</div>`}</article>`;}).join('')}</div>${!days.length?`<div class="message">${escapeHTML(this._t('Esperando previsión diaria…'))}</div>`:''}</section>`;
  }
  _outing(){
    const weather=this._state('weather'),usable=weather&&!['unknown','unavailable'].includes(weather.state),plan=outingPlan(usable?this._forecasts.hourly:[],{activity:this._outingActivity||this._config.outing_activity||'walk',minutes:this._outingMinutes||Number(this._config.outing_minutes)||60,units:this._weather(),night:stamp=>isNight(stamp,this._location.latitude,this._location.longitude)});
    const day=stamp=>this._time(stamp,{day:'numeric',month:'short'}),clock=stamp=>this._time(stamp,{hour:'2-digit',minute:'2-digit'}),range=w=>`${day(w.start)} · ${clock(w.start)}–${day(w.start)!==day(w.end)?day(w.end)+' · ':''}${clock(w.end)}`;
    const best=plan.best,selected=plan.windows.find(w=>w.start===this._outingSelected)||best||plan.windows[0],labels={good:'Condiciones favorables',fair:'Condiciones aceptables',avoid:'Evitar',unknown:'Sin datos suficientes'},reasons={storm:'Tormenta o condiciones adversas',wind:'Viento demasiado fuerte',extreme:'Temperatura poco adecuada para esta actividad',rain:'Franja con lluvia',fog:'Niebla',rain_possible:'Probabilidad de lluvia o lluvia débil',cool:'Temperatura baja',night:'Noche o poca luz',breezy:'Viento molesto'};
    const rows=plan.windows.filter(w=>w.start%3600000===0||w.start===best?.start||w.start===selected?.start);
    const facts=w=>{const all=key=>w.parts.every(p=>numeric(p[key])!==null),values=key=>w.parts.map(p=>p[key]);return `<div class="dry-facts">${[[this._t('Máxima lluvia horaria'),all('rain')?Math.max(...values('rain')):null,'mm/h'],[this._t('Temperatura mínima'),all('temperature')?Math.min(...values('temperature')):null,'°C'],[this._t('Temperatura máxima'),all('temperature')?Math.max(...values('temperature')):null,'°C'],[this._t('Viento máximo'),all('wind')?Math.max(...values('wind')):null,'km/h']].map(([label,value,unit])=>`<div><span>${escapeHTML(label)}</span><strong class="${label===this._t('Temperatura mínima')?'outing-min':label===this._t('Temperatura máxima')?'outing-max':''}">${fmt(value)} <small>${unit}</small></strong></div>`).join('')}</div>`;};
    return `<section class="drying outing">${this._forecastHeader('La mejor hora para salir','Organiza tu salida')}<div class="outing-controls" role="group" aria-label="${this._t('Actividad')}">${[['walk','Paseo'],['sport','Deporte'],['family','Con niños']].map(([id,label])=>`<button data-outing-activity="${id}" aria-pressed="${plan.activity===id}">${escapeHTML(this._t(label))}</button>`).join('')}</div><div class="dry-controls"><span>${escapeHTML(this._t('Duración'))}</span><div>${[30,60,90].map(n=>`<button data-outing-minutes="${n}" aria-pressed="${plan.minutes===n}">${n} min</button>`).join('')}</div></div><div class="dry-source">${escapeHTML(this._t('Previsión horaria: las franjas de 30 minutos usan los mismos datos de su hora.'))}</div><div class="dry-hero ${best?best.status:'avoid'}"><div><span class="dry-kicker">${escapeHTML(this._t(best?'Mejor ventana':'Mejor esperar'))}</span><strong>${best?`<small class="dry-window-date">${escapeHTML(day(best.start))}</small>${escapeHTML(clock(best.start))}–${escapeHTML(clock(best.end))}${day(best.start)!==day(best.end)?`<small class="dry-window-date">${escapeHTML(day(best.end))}</small>`:''}`:escapeHTML(this._t('No se ha encontrado una franja adecuada con los datos disponibles.'))}</strong><span class="dry-verdict">${best?escapeHTML(this._t(labels[best.status])):''}</span></div>${best?this._icon(best.parts[0].condition,best.start):''}</div>${best?`<div class="outing-kit"><div><span>${this._t('Paraguas')}</span><strong>${this._t(best.umbrella?'Por precaución':'No se prevé lluvia')}</strong></div><div><span>${this._t('Chaqueta')}</span><strong>${this._t(best.jacket?'Recomendable':'A tu elección')}</strong></div></div><div class="dry-window-summary">${facts(best)}</div>`:''}${plan.alternatives.length?`<div class="dry-alternatives"><span>${this._t('Otras opciones')}</span>${plan.alternatives.map(w=>`<button data-outing-start="${w.start}">${escapeHTML(range(w))}</button>`).join('')}</div>`:''}${best?`<div class="outing-changes"><h3>${this._t('Después de la mejor franja')}</h3>${plan.changes.length?plan.changes.map(c=>`<span>${escapeHTML(day(c.stamp)+' · '+clock(c.stamp))}</span><strong>${c.types.map(type=>this._t({rain:'Puede aparecer lluvia',cool:'Baja la temperatura',wind:'Aumenta el viento'}[type])).join(' · ')}</strong>`).join(''):`<span>${this._t(plan.checkedUntil?'No se detectan cambios destacables en las horas comparadas.':'No hay suficientes datos posteriores para comparar.')}</span>${plan.checkedUntil?`<span class="outing-until">${escapeHTML(this._t('Comparado hasta {time}',{time:day(plan.checkedUntil)+' · '+clock(plan.checkedUntil)}))}</span>`:''}`}</div>`:''}<div class="dry-source">${this._t('Previsión de Euskalmet')}</div><div class="dry-legend">${['good','fair','avoid','unknown'].map(id=>`<span class="${id}">${this._t(labels[id])}</span>`).join('')}</div><h3>${this._t('Franjas para comparar')}</h3><div class="dry-hours">${rows.map(w=>`<button class="dry-hour ${w.status} ${w.start===selected?.start?'selected':''}" data-outing-start="${w.start}" aria-pressed="${w.start===selected?.start}" aria-label="${escapeHTML(range(w)+' · '+this._t(labels[w.status]))}"><time>${escapeHTML(clock(w.start))}</time>${this._icon(w.parts[0].condition,w.start)}<strong>${w.parts.every(p=>p.temperature!==null)?fmt(w.parts.reduce((n,p)=>n+p.temperature,0)/w.parts.length,0):'—'}°</strong><span class="dry-status-dot" aria-hidden="true"></span><small>${escapeHTML(day(w.start))} · ${plan.minutes} min</small></button>`).join('')}</div>${selected?`<div class="dry-detail"><div class="dry-detail-head"><h3>${this._t('Detalle de la franja')} · ${escapeHTML(range(selected))}</h3><span class="${selected.status}">${this._t(labels[selected.status])}</span></div>${facts(selected)}<div class="dry-reasons">${(selected.status==='unknown'?['Faltan datos para valorar esta franja']:selected.reasons.length?selected.reasons.map(r=>reasons[r]):['No se prevé lluvia']).map(r=>`<span>${escapeHTML(this._t(r))}</span>`).join('')}</div></div>`:''}<details class="dry-method"><summary>${this._t('Cómo se calcula')}</summary>${['Orientación meteorológica, no una evaluación de seguridad. Las reglas cambian según la actividad.','Las franjas deben tener datos en todas las horas que tocan. No se interpolan la lluvia ni el viento.','Se comparan lluvia, temperatura, viento y luz diurna. Microclima no modifica la previsión.'].map(p=>`<p>${this._t(p)}</p>`).join('')}</details></section>`;
  }
  _drying(){
    const humidityEntity=this._config.humidity_forecast_entity,other=this._hass?.states[humidityEntity],weather=this._state('weather'),usable=weather&&!['unknown','unavailable'].includes(weather.state);
    const supplemental=!this._humidityMismatch&&other&&!['unknown','unavailable'].includes(other.state)?this._humidityForecast||[]:[];
    const plan=dryingPlan(usable?this._forecasts.hourly:[],{hours:this._dryingDuration||Number(this._config.drying_hours)||3,units:this._weather(),humidityForecast:supplemental,night:stamp=>isNight(stamp,this._location.latitude,this._location.longitude)});
    const labels={good:'Condiciones favorables',fair:'Condiciones aceptables',limited:'Ventana orientativa',slow:'Secado lento',avoid:'Evitar',unknown:'Sin datos suficientes'};
    const reasons={rain:'Lluvia o tormenta prevista',wind:'Viento demasiado fuerte',cold:'Frío intenso',humidity:'Humedad muy alta o niebla',missing_humidity:'Humedad horaria no disponible: orientación parcial.',humid:'Humedad alta',cool:'Temperatura baja',calm:'Poco viento',night:'Noche: menor potencial de secado',chance:'Posibilidad de lluvia'};
    const day=stamp=>this._time(stamp,{day:'numeric',month:'short'}),clock=stamp=>this._time(stamp,{hour:'2-digit',minute:'2-digit'});
    const range=w=>`${day(w.start)} · ${clock(w.start)}–${day(w.start)!==day(w.end)?day(w.end)+' · ':''}${clock(w.end)}`;
    const best=plan.best,selected=plan.slots.find(p=>p.stamp===this._dryingSelected)||best?.slots[0]||plan.slots[0];
    const facts=(p,aggregate=false)=>`<div class="dry-facts">${[[this._t(aggregate?'Lluvia total':'Lluvia prevista'),p.rain,'mm'],[this._t(aggregate?'Humedad media':'Humedad'),p.humidity,'%'],[this._t(aggregate?'Temperatura media':'Temperatura'),p.temperature,'°C'],[this._t(aggregate?'Viento máximo':'Viento'),p.wind,'km/h']].map(([label,value,unit])=>`<div><span>${escapeHTML(label)}</span><strong>${fmt(value)} <small>${unit}</small></strong></div>`).join('')}</div>`;
    return `<section class="drying">${this._forecastHeader('¿Puedo tender fuera?','Planifica el secado')}<div class="dry-controls"><span>${escapeHTML(this._t('Buscar una ventana de'))}</span><div>${[2,3,4].map(h=>`<button data-drying-duration="${h}" aria-pressed="${plan.duration===h}">${h} h</button>`).join('')}</div></div><div class="dry-hero ${best?(best.limited?'limited':best.score>=65?'good':'fair'):'avoid'}"><div><span class="dry-kicker">${escapeHTML(this._t(best?(best.limited?'Ventana orientativa':'Mejor ventana'):'Mejor esperar'))}</span><strong>${best?`<small class="dry-window-date">${escapeHTML(day(best.start))}</small>${escapeHTML(clock(best.start))}–${escapeHTML(clock(best.end))}${day(best.start)!==day(best.end)?`<small class="dry-window-date">${escapeHTML(day(best.end))}</small>`:''}`:escapeHTML(this._t('No hay una franja de {hours} h con condiciones suficientes.',{hours:plan.duration}))}</strong><span class="dry-verdict">${best?escapeHTML(this._t(best.limited?'Humedad horaria no disponible: orientación parcial.':best.score>=65?'Condiciones favorables':'Condiciones aceptables')):''}</span></div>${best?this._icon(best.slots[0].condition,best.start):''}</div>${best?`<div class="dry-window-summary">${facts({rain:best.slots.reduce((n,p)=>n+p.rain,0),humidity:best.limited?null:best.slots.reduce((n,p)=>n+p.humidity,0)/best.slots.length,temperature:best.slots.reduce((n,p)=>n+p.temperature,0)/best.slots.length,wind:Math.max(...best.slots.map(p=>p.wind))},true)}</div>`:''}${best&&plan.alternatives.length?`<div class="dry-alternatives"><span>${escapeHTML(this._t('Otras opciones'))}</span>${plan.alternatives.map(w=>`<button data-drying-hour="${w.start}">${escapeHTML(range(w))}${w.limited?' · '+escapeHTML(this._t('Ventana orientativa')):''}</button>`).join('')}</div>`:''}<div class="dry-source">${escapeHTML(this._t('Previsión de Euskalmet'))}${this._humidityMismatch?' · '+escapeHTML(this._t('Revisa el complemento de humedad para esta localidad')):humidityEntity?' · '+escapeHTML(this._t('Complemento de humedad: {source}',{source:(String(other?.attributes?.attribution||'').includes('met.no')?'Met.no · ':'')+(other?.attributes?.friendly_name||humidityEntity)})):''}</div><div class="dry-legend">${['good','fair','limited','slow','avoid','unknown'].map(key=>`<span class="${key}">${escapeHTML(this._t(labels[key]))}</span>`).join('')}</div><h3>${escapeHTML(this._t('Próximas horas'))}</h3><div class="dry-hours">${plan.slots.map(p=>`<button class="dry-hour ${p.status} ${p.stamp===selected?.stamp?'selected':''}" data-drying-hour="${p.stamp}" aria-pressed="${p.stamp===selected?.stamp}" aria-label="${escapeHTML(this._time(p.stamp,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+this._t(labels[p.status]))}"><time>${escapeHTML(this._time(p.stamp,{hour:'2-digit',minute:'2-digit'}))}</time>${this._icon(p.condition,p.stamp)}<strong>${fmt(p.temperature,0)}°</strong><span class="dry-status-dot" aria-hidden="true"></span><small>${escapeHTML(this._time(p.stamp,{day:'numeric',month:'short'}))}</small></button>`).join('')}</div>${selected?`<div class="dry-detail"><div class="dry-detail-head"><h3>${escapeHTML(this._t('Detalle de la hora'))} · ${escapeHTML(this._time(selected.stamp,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</h3><span class="${selected.status}">${escapeHTML(this._t(labels[selected.status]))}</span></div>${facts(selected)}<div class="dry-reasons">${(selected.status==='unknown'?['Faltan lluvia, temperatura o viento']:selected.reasons.length?selected.reasons.map(r=>reasons[r]):['Sin lluvia prevista']).map(r=>`<span>${escapeHTML(this._t(r))}</span>`).join('')}</div></div>`:''}<details class="dry-method"><summary>${escapeHTML(this._t('Cómo se calcula'))}</summary>${['Se comparan franjas de horas completas. No se calcula cuánto tardará tu ropa en secarse.','La lluvia prevista, la niebla, el frío intenso y el viento fuerte descartan una hora. El resto se ordena por temperatura, humedad, brisa y noche.','Sin humedad horaria no se muestra una recomendación favorable. La humedad actual no se usa como previsión.','Reglas orientativas de Eguraldi, sin garantía de secado.'].map(p=>`<p>${escapeHTML(this._t(p))}</p>`).join('')}</details></section>`;
  }
  _planning(){
    const rows=forecastRows(this._forecasts.hourly).filter(f=>Date.parse(f.datetime)<=Date.now()+24*3600000),hours=rows.slice(0,8),rain=this._rainMetric(rows),wet=rows.find(f=>(rain.value(f)??0)>0);
    const rainText=wet?this._t('Desde las {time}',{time:this._time(wet.datetime,{hour:'2-digit',minute:'2-digit'})}):rows.some(f=>rain.value(f)!==null)?this._t('Sin lluvia en las horas con datos'):this._t('Lluvia sin datos publicados');
    const next12=rows.filter(f=>Date.parse(f.datetime)<=Date.now()+12*3600000),gusts=next12.map(f=>numeric(f.wind_gust_speed)).filter(n=>n!==null&&n>=0),winds=next12.map(f=>numeric(f.wind_speed)).filter(n=>n!==null&&n>=0);
    const values=gusts.length?gusts:winds,windLabel=gusts.length?'Racha máxima · próximas 12 h':'Viento máximo previsto · próximas 12 h',windUnit=this._weather().wind_speed_unit||'km/h';
    const action=`<button data-planning-radar aria-expanded="${Boolean(this._planningRadar)}">${escapeHTML(this._t(this._planningRadar?'Cerrar radar':'Radar'))} ↗</button>`;
    return `<section>${this._forecastHeader('¿Paraguas o chaqueta?','Planifica las próximas horas',action)}<div class="planning-hours">${hours.map(f=>`<div class="planning-hour"><time>${escapeHTML(this._time(f.datetime,{hour:'2-digit',minute:'2-digit'}))}</time>${this._icon(f.condition,f.datetime)}<strong>${fmt(f.temperature,0)}°</strong><div class="planning-rain" title="${escapeHTML(this._t(rain.label))}">${rain.value(f)===null?'—':`${fmt(rain.value(f))} ${escapeHTML(rain.unit)}`}</div><small>${fmt(f.wind_speed,0)} ${escapeHTML(windUnit)}</small></div>`).join('')}</div>${!hours.length?`<div class="message">${escapeHTML(this._t('Esperando previsión horaria…'))}</div>`:''}<div class="planning-summary"><div>${escapeHTML(this._t('Lluvia prevista · próximas 24 h'))}<strong>${escapeHTML(rainText)}</strong></div><div>${escapeHTML(this._t(windLabel))}<strong>${values.length?`${fmt(Math.max(...values),0)} ${escapeHTML(windUnit)}`:'—'}</strong></div></div><div id="planning-radar"></div></section>`;
  }
  _render(){
    if(!this.shadowRoot||!this._config)return;
    if(this._location&&EXTRA_MODES.includes(this._config.mode)){this._renderExtra();return;}
    const previousPlanningRadar=this.shadowRoot.querySelector('#planning-radar > euskalmet-local-card');
    const previousExtra=this.shadowRoot.querySelector('#content > euskalmet-local-card');
    const extraMode=this._tab==='microclimate'?'microclimate':this._tab==='history'?'history':this._tab==='radar'?'radar':'alerts';
    const reusableExtra=previousExtra?._config?.mode===extraMode&&previousExtra?._config?.entry_id===this._location?.entry_id?previousExtra:null;
    let html='';
    if(!this._location){
      const locations=this._locations||[];
      html=`<section><h2>Eguraldi</h2>${locations.length?`<label>${this._t('Selecciona localidad')} <select id="locality"><option value="">${escapeHTML(this._t("Elegir…"))}</option>${locations.map(l=>`<option value="${escapeHTML(l.entry_id)}">${escapeHTML(l.locality)}</option>`).join('')}</select></label>`:`<div class="message">${escapeHTML(this._t(this._error||(this._locations?'Añade una localidad desde la integración Eguraldi.':'Cargando localidades…')))}</div>`}</section>`;
    }else{
      const mode=this._config.mode;
      html=mode==='overview'?this._overview():mode==='hourly'?this._hourly():mode==='daily'?this._daily():mode==='hourly_chart'?this._hourlyChart():mode==='daily_tiles'?this._dailyTiles():mode==='planning'?this._planning():mode==='drying'?this._drying():mode==='outing'?this._outing():this._overview()+`<section class="divider"><nav class="tabs" aria-label="${this._t('Vista del tiempo')}">${[['hourly','24 horas'],['daily','Próximos días'],['microclimate','Microclima'],['drying','Tender fuera'],['outing','Salir'],['radar','Radar'],['history','Histórico'],['alerts','Avisos']].map(([id,label])=>`<button data-tab="${id}" class="${this._tab===id?'active':''}" aria-pressed="${this._tab===id}">${escapeHTML(this._t(label))}</button>`).join('')}</nav><div id="content"></div></section>`;
    }
    this.shadowRoot.innerHTML=`<style>${CSS}${FORECAST_CSS}${DRYING_CSS}</style><ha-card>${html}${this._error?`<div class="message error">${escapeHTML(this._t(this._error))}</div>`:''}</ha-card>`;
    const microHost=this.shadowRoot.querySelector('#overview-micro-card');
    if(microHost){const micro=document.createElement('eguraldi-microclimate-card');micro.setConfig({entity:this._location.entities.microclimate_status,enabled:true,station_name:this._location.station,compact:true});micro.hass=this._hass;microHost.append(micro);this.shadowRoot.querySelector('#overview-micro').addEventListener('toggle',event=>{this._microExpanded=event.currentTarget.open;});}
    this.shadowRoot.querySelector('[data-planning-radar]')?.addEventListener('click',()=>{this._planningRadar=!this._planningRadar;this._render();});
    if(this._config.mode==='planning'&&this._planningRadar&&this._location){const radar=previousPlanningRadar||document.createElement('euskalmet-local-card');if(!previousPlanningRadar)radar.setConfig({mode:'radar',entry_id:this._location.entry_id});radar.hass=this._hass;this.shadowRoot.querySelector('#planning-radar').append(radar);}
    this.shadowRoot.querySelector('#locality')?.addEventListener('change',e=>{if(e.target.value)this.setConfig({...this._config,entry_id:e.target.value});});
    for(const button of this.shadowRoot.querySelectorAll('[data-tab]'))button.addEventListener('click',()=>{this._tab=button.dataset.tab;this._render();});
    if(this._location&&this._config.mode==='dashboard'){
      const content=this.shadowRoot.querySelector('#content');
      if(['hourly','daily','drying','outing'].includes(this._tab))content.innerHTML=this._tab==='hourly'?this._hourly():this._tab==='daily'?this._daily():this._tab==='outing'?this._outing():this._drying();
      else{
        const card=reusableExtra||document.createElement('euskalmet-local-card');
        if(!reusableExtra)card.setConfig({entry_id:this._location.entry_id,mode:extraMode});
        card.hass=this._hass;content.append(card);
      }
    }
    this.shadowRoot.querySelectorAll('[data-outing-activity],[data-outing-minutes],[data-outing-start]').forEach(b=>b.addEventListener('click',()=>{let attr;if(b.dataset.outingActivity){this._outingActivity=b.dataset.outingActivity;this._outingSelected=null;attr='data-outing-activity';}else if(b.dataset.outingMinutes){this._outingMinutes=Number(b.dataset.outingMinutes);this._outingSelected=null;attr='data-outing-minutes';}else{this._outingSelected=Number(b.dataset.outingStart);attr='data-outing-start';}const value=b.getAttribute(attr);this._render();this.shadowRoot.querySelector(`[${attr}="${value}"]`)?.focus();}));
    this.shadowRoot.querySelectorAll('[data-drying-duration]').forEach(b=>b.addEventListener('click',()=>{this._dryingDuration=Number(b.dataset.dryingDuration);this._dryingSelected=null;this._render();this.shadowRoot.querySelector(`[data-drying-duration="${this._dryingDuration}"]`)?.focus();}));
    this.shadowRoot.querySelectorAll('[data-drying-hour]').forEach(b=>b.addEventListener('click',()=>{this._dryingSelected=Number(b.dataset.dryingHour);this._render();this.shadowRoot.querySelector(`.dry-hour[data-drying-hour="${this._dryingSelected}"]`)?.focus();}));
  }
  _measurementSource(){
    const station=this._location.station||this._t('estación no disponible');
    const reference=this._location.location_source==='home_assistant'?this._t('la ubicación de HA'):this._location.locality;
    const distance=numeric(this._location.distance_km)===null?'':this._t(' · a {distance} km de {reference}',{distance:fmt(this._location.distance_km),reference});
    return this._t('Mediciones en {station}{distance}',{station,distance});
  }
  _renderExtra(){
    const mode=this._config.mode,loc=this._location;
    const labels={microclimate:'microclima',history:'histórico de temperatura',radar:'radar de precipitación',alerts:'avisos',summaries:'resumen de hoy',comparison:'temperatura · últimas 24 horas',environment:'costa y ambiente'};
    if(!this.shadowRoot.querySelector('#extra-content')){
      this.shadowRoot.innerHTML=`<style>${CSS}${FORECAST_CSS}${DRYING_CSS}.rows{padding:0 20px 18px}.row{display:flex;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #ffffff15;font-size:13px}.row span{color:#b5d2e4}.row strong{text-align:right;font-weight:500}.row.minimum strong{color:#68cef3}.row.maximum strong{color:#ffbf83}#extra-content>p{padding:0 20px 20px;color:#a9becf;font-size:12px}</style><ha-card><section id="extra-heading"><h2 id="extra-title"></h2><div class="muted measurement-source" id="extra-source"></div></section><div id="extra-content"></div></ha-card>`;
    }
    this.shadowRoot.querySelector('#extra-heading').hidden=mode==='radar'&&this._config.show_title!==true;
    this.shadowRoot.querySelector('#extra-source').hidden=mode==='alerts';
    this.shadowRoot.querySelector('#extra-title').textContent=`${loc.locality} · ${this._t(labels[mode])}`;
    this.shadowRoot.querySelector('#extra-source').textContent=['radar','alerts','environment'].includes(mode)?this._t(mode==='radar'?'Radar regional · Euskalmet':mode==='alerts'?'Avisos para la zona de tu localidad':'Cantábrico · mareas de Pasaia · captadora de polen de referencia'):this._measurementSource();
    const content=this.shadowRoot.querySelector('#extra-content');
    if(mode==='summaries'||mode==='environment'){
      const pollen=Object.prototype.hasOwnProperty.call(loc.entities,'pollen_total')?'pollen_total':Object.keys(loc.entities).find(key=>key.startsWith('pollen_')&&key.endsWith('_total'));
      const rows=mode==='summaries'?[['temperature_min_today','Temperatura mínima'],['temperature_max_today','Temperatura máxima'],['wind_gust_max_today','Racha máxima'],['precipitation_today','Lluvia acumulada'],['irradiance','Radiación solar']]:[['ocean_wave_height','Altura de ola · Cantábrico'],['ocean_water_temperature','Temperatura del mar'],['ocean_tide_high','Próxima pleamar · Pasaia'],[pollen,'Polen · muestra de referencia']];
      content.innerHTML='<div class="rows">'+rows.map(([key,label])=>{
        const state=this._state(key),a=state?.attributes||{},n=numeric(state?.state);
        const value=a.device_class==='timestamp'&&Number.isFinite(Date.parse(state?.state))?this._time(state.state,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):n===null?this._t('No disponible'):`${fmt(n)} ${a.unit_of_measurement||''}`;
        const source=mode==='environment'&&key===pollen?(a.municipality_name||a.municipality||''):'';
        return `<div class="row${key==='temperature_min_today'?' minimum':key==='temperature_max_today'?' maximum':''}"><span>${escapeHTML(this._t(label))}${source?` · ${escapeHTML(source)}`:''}</span><strong>${escapeHTML(value)}</strong></div>`;
      }).join('')+'</div>';return;
    }
    let tag,config;
    if(mode==='microclimate'){
      tag='eguraldi-microclimate-card';
      config={entity:loc.entities.microclimate_status,enabled:loc.microclimate_enabled,station_name:loc.station,entry_id:loc.entry_id};
    }else if(mode==='comparison'){
      tag='eguraldi-comparison-card';
      config={entity:loc.entities.temperature,station_id:loc.station_id,station_name:loc.station||this._t('estación'),comparison_entity:this._config.comparison_entity,comparison_name:this._config.comparison_name||this._t('Comparación')};
    }else{
      tag=mode==='history'?'eguraldi-history-card':mode==='radar'?'eguraldi-radar-map-card':'eguraldi-alert-card';
      const entity=loc.entities[mode==='history'?'temperature':mode==='radar'?'radar':'alert_level'];
      config={entity,entry_id:loc.entry_id,title:`${loc.locality} · ${this._t(labels[mode])}`};
      if(mode==='alerts'){config.embedded=true;config.show_title=false;}
      if(mode==='history'){config.station_id=loc.station_id;config.show_title=false;config.embedded=true;if(this._config.measure)config.measure=this._config.measure;}
      if(mode==='radar'){config.embedded=true;config.show_header=false;config.map_style=this._config.map_style||'satellite';config.latitude=loc.latitude;config.longitude=loc.longitude;config.locality=loc.locality;config.zoom=this._config.zoom??10;}
    }
    const key=JSON.stringify([mode,config]);
    if(content.firstElementChild?.dataset.extraKey===key){content.firstElementChild.hass=this._hass;return;}
    if(this._extraPending===key)return;
    const revision=this._extraRevision=(this._extraRevision||0)+1;
    const apply=card=>{if(!this.isConnected||revision!==this._extraRevision)return;card.dataset.extraKey=key;card.hass=this._hass;content.replaceChildren(card);this._extraPending=null;};
    if(customElements.get(tag)){
      const existing=content.firstElementChild;
      if(existing?.tagName.toLowerCase()===tag){existing.setConfig(config);existing.dataset.extraKey=key;existing.hass=this._hass;return;}
      const card=document.createElement(tag);card.setConfig(config);apply(card);
    }else content.innerHTML=`<p>${escapeHTML(this._t("Esta tarjeta todavía no está disponible."))}</p>`;
  }
  getCardSize(){return ['hourly','planning'].includes(this._config?.mode)?9:6;}
  static getStubConfig(){return {mode:'dashboard'};}
  static getConfigElement(){return document.createElement('euskalmet-local-editor');}
}

class EuskalmetLocalEditor extends HTMLElement {
  _t(text,values){return egText(this._hass,text,values);}
  constructor(){super();this._generation=0;}
  setConfig(config){this._config={...config};this._render();}
  set hass(hass){const first=!this._hass,changed=this._hass?.connection!==hass.connection;this._hass=hass;if(changed){this._generation++;this._loading=false;this._locations=undefined;}if(first||changed||egLocale(this._previousHass)!==egLocale(hass))this._render();this._previousHass=hass;if(changed)this._loadLocations();}
  connectedCallback(){this._loadLocations();}
  disconnectedCallback(){this._generation++;this._loading=false;}
  async _loadLocations(){
    if(!this.isConnected||!this._hass||this._loading)return;
    this._loading=true;const generation=this._generation;
    try{
      const locations=await this._hass.callWS({type:'euskalmet_local/locations'});
      if(generation!==this._generation)return;
      this._locations=locations;this._loadError=false;this._render();
    }catch(error){if(generation===this._generation){this._loadError=true;this._render();}}
    finally{if(generation===this._generation)this._loading=false;}
  }
  _save(changes,remove=[]){
    this._config={...this._config,...changes};for(const key of remove)delete this._config[key];
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));
    this._render();
  }
  _render(){
    if(!this._config)return;
    const modes=[['dashboard','Panel completo'],['overview','Tiempo actual'],['hourly','Próximas 24 horas'],['daily','Próximos días'],['hourly_chart','Gráfico de próximas 24 horas'],['daily_tiles','Semana visual'],['planning','Planifica las próximas horas'],['drying','¿Puedo tender fuera?'],['outing','La mejor hora para salir'],['summaries','Resumen de hoy'],['microclimate','Microclima'],['history','Histórico mensual'],['radar','Radar'],['alerts','Avisos'],['comparison','Comparación de temperatura'],['environment','Costa y ambiente']];
    const locations=this._locations||[];
    this.innerHTML=`<style>.eg-editor{display:grid;gap:16px;padding:8px 0}.eg-editor label{display:grid;gap:7px;font-size:14px}.eg-editor select,.eg-editor input{font:inherit;padding:10px;border:1px solid var(--divider-color,#888);border-radius:10px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#111);width:100%;box-sizing:border-box}.eg-editor p{font-size:12px;color:var(--secondary-text-color);margin:0}</style><div class="eg-editor"><label>${escapeHTML(this._t("Vista"))}<select id="eg-mode">${modes.map(([id,label])=>`<option value="${id}">${escapeHTML(this._t(label))}</option>`).join('')}</select></label><label>${escapeHTML(this._t("Ubicación"))}<select id="eg-location"><option value="">${this._t(locations.length===1?'Automática · única ubicación':'Elegir en la tarjeta')}</option>${locations.map(loc=>`<option value="${escapeHTML(loc.entry_id)}">${escapeHTML(loc.locality)}${loc.location_source==='home_assistant'?this._t(' · ubicación de HA'):''}</option>`).join('')}</select></label><p>${this._t(this._loadError?'No se han podido cargar las ubicaciones. Vuelve a abrir el editor.':this._locations?(locations.length?'La ubicación elegida se guardará con esta tarjeta.':'Añade una ubicación en la integración Eguraldi.'):'Cargando ubicaciones…')}</p><div id="eg-extra"></div></div>`;
    const mode=this.querySelector('#eg-mode');mode.value=this._config.mode||'dashboard';mode.addEventListener('change',()=>this._save({mode:mode.value}));
    const locality=this.querySelector('#eg-location');locality.value=this._config.entry_id||locations.find(loc=>loc.entities.weather===this._config.entity)?.entry_id||'';
    if(this._config.entry_id&&!locations.some(loc=>loc.entry_id===this._config.entry_id)){const option=document.createElement('option');option.value=this._config.entry_id;option.textContent=this._t('Ubicación configurada · no disponible');locality.append(option);locality.value=this._config.entry_id;}
    locality.addEventListener('change',()=>locality.value?this._save({entry_id:locality.value},['entity']):this._save({},['entry_id','entity']));
    const extra=this.querySelector('#eg-extra');
    if(this._config.mode==='radar'){
      extra.innerHTML=`<label>${escapeHTML(this._t("Zoom del mapa"))}<input id="eg-zoom" type="number" min="3" max="16" step="1"></label><p>${escapeHTML(this._t("Un número mayor acerca la vista a tu ubicación."))}</p>`;
      const mapLabel=document.createElement('label');mapLabel.textContent=this._t('Estilo del mapa');
      const mapStyle=document.createElement('select');mapStyle.id='eg-map-style';
      for(const [value,label] of [['satellite','Mapa satélite'],['dark','Mapa oscuro'],['light','Mapa claro']]){const option=document.createElement('option');option.value=value;option.textContent=this._t(label);mapStyle.append(option);}
      if(this._config.map_style&&!['satellite','dark','light'].includes(this._config.map_style)){const option=document.createElement('option');option.value=this._config.map_style;option.textContent=this._config.map_style;mapStyle.append(option);}
      mapStyle.value=this._config.map_style||'satellite';mapStyle.addEventListener('change',()=>this._save({map_style:mapStyle.value}));mapLabel.append(mapStyle);extra.append(mapLabel);
      const zoom=extra.querySelector('input');zoom.value=String(this._config.zoom??10);zoom.addEventListener('change',()=>{const value=Number(zoom.value);if(Number.isFinite(value)&&value>=3&&value<=16)this._save({zoom:value});});
    }
    if(['drying','dashboard'].includes(this._config.mode)){
      const sources=Object.entries(this._hass?.states||{}).filter(([id,state])=>id.startsWith('weather.')&&(Number(state.attributes?.supported_features||0)&2)&&!locations.some(l=>l.entities.weather===id));
      extra.innerHTML=`<label>${escapeHTML(this._t('Humedad horaria complementaria'))}<select id="eg-drying-humidity"><option value="">${escapeHTML(this._t('Solo Euskalmet'))}</option>${sources.map(([id,state])=>`<option value="${escapeHTML(id)}">${escapeHTML(state.attributes.friendly_name||id)}</option>`).join('')}</select></label><p>${escapeHTML(this._t('Opcional: elige una previsión horaria de la misma localidad. Solo se utiliza su humedad.'))}</p>`;
      const source=extra.querySelector('select');
      if(this._config.humidity_forecast_entity&&!sources.some(([id])=>id===this._config.humidity_forecast_entity)){const option=document.createElement('option');option.value=this._config.humidity_forecast_entity;option.textContent=this._config.humidity_forecast_entity;source.append(option);}
      source.value=this._config.humidity_forecast_entity||'';source.addEventListener('change',()=>source.value?this._save({humidity_forecast_entity:source.value,humidity_forecast_locality:(locations.find(l=>l.entry_id===this._config.entry_id||l.entities.weather===this._config.entity)||(locations.length===1?locations[0]:null))?.locality}):this._save({},['humidity_forecast_entity','humidity_forecast_locality']));
    }
    if(this._config.mode==='comparison'){
      const sensors=Object.entries(this._hass?.states||{}).filter(([id,state])=>id.startsWith('sensor.')&&(state.attributes?.device_class==='temperature'||['°C','°F'].includes(state.attributes?.unit_of_measurement))).sort((a,b)=>(a[1].attributes.friendly_name||a[0]).localeCompare(b[1].attributes.friendly_name||b[0]));
      extra.innerHTML=`<label>${escapeHTML(this._t("Sensor de temperatura para comparar"))}<select id="eg-comparison"><option value="">${escapeHTML(this._t("Solo la estación"))}</option>${sensors.map(([id,state])=>`<option value="${escapeHTML(id)}">${escapeHTML(state.attributes.friendly_name||id)}</option>`).join('')}</select></label><label>${escapeHTML(this._t("Nombre en el gráfico"))}<input id="eg-comparison-name" type="text" placeholder="${this._t('Por ejemplo, Balcón')}"></label>`;
      const sensor=extra.querySelector('select');sensor.value=this._config.comparison_entity||'';sensor.addEventListener('change',()=>sensor.value?this._save({comparison_entity:sensor.value,comparison_name:this._config.comparison_name||this._hass.states[sensor.value]?.attributes.friendly_name||'Comparación'}):this._save({},['comparison_entity','comparison_name']));
      const name=extra.querySelector('input');name.value=this._config.comparison_name||'';name.addEventListener('change',()=>this._save({comparison_name:name.value.trim()||'Comparación'}));
    }
  }
}
if(!customElements.get('euskalmet-local-card'))customElements.define('euskalmet-local-card',EuskalmetLocalCard);
if(!customElements.get('euskalmet-local-editor'))customElements.define('euskalmet-local-editor',EuskalmetLocalEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==='euskalmet-local-card'))window.customCards.push({type:'euskalmet-local-card',name:'Eguraldi',description:'Tu localidad: observaciones, 24 horas, siete días, radar, históricos y avisos.',preview:true});
