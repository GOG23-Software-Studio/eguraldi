/* Calendar-day guidance. No invented rainfall probabilities or hourly precision. */
export function washDayKey(value,timeZone='Europe/Madrid'){
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return null;
  return new Intl.DateTimeFormat('sv-SE',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function washCalendarDay(key,offset=0){
  const [year,month,day]=key.split('-').map(Number);
  return new Date(Date.UTC(year,month-1,day+offset)).toISOString().slice(0,10);
}
const washNumber=value=>{if(value===null||value===undefined||value===''||typeof value==='boolean')return null;const n=Number(value);return Number.isFinite(n)?n:null;};
export function vehicleWashPlan(forecasts,{now=Date.now(),timeZone='Europe/Madrid',units={}}={}){
  const today=washDayKey(now,timeZone),byDay=new Map(),duplicates=new Set();
  const localHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',hourCycle:'h23'}).format(new Date(now)));
  for(const row of Array.isArray(forecasts)?forecasts:[]){
    if(!row||typeof row!=='object')continue;const key=washDayKey(row.datetime,timeZone);if(!key)continue;
    if(byDay.has(key))duplicates.add(key);else byDay.set(key,row);
  }
  const dry=new Set(['sunny','clear-night','partlycloudy','cloudy']),wet=new Set(['rainy','pouring','snowy','snowy-rainy','hail','lightning','lightning-rainy','exceptional']);
  const windFactor={'km/h':1,'m/s':3.6,'mph':1.609344,'kn':1.852,'knots':1.852,'kt':1.852}[units.wind_speed_unit||'km/h'];
  const days=Array.from({length:7},(_,index)=>{
    const key=washCalendarDay(today,index),row=duplicates.has(key)?null:byDay.get(key),condition=row?.condition||null;
    const rain=washNumber(row?.precipitation),chance=washNumber(row?.precipitation_probability),rawWind=washNumber(row?.wind_speed),wind=rawWind!==null&&rawWind>=0&&windFactor?rawWind*windFactor:null;
    let status=dry.has(condition)?'dry':wet.has(condition)?'wet':'unknown',reason=status==='wet'?'rain':status==='unknown'?'missing':null;
    if(rain!==null&&rain>0||chance!==null&&chance>=40&&chance<=100){status='wet';reason='rain';}
    if(wind!==null&&wind>=30||['windy','windy-variant'].includes(condition)){status='avoid';reason='wind';}
    const high=washNumber(row?.temperature),low=washNumber(row?.templow);
    let celsius=units.temperature_unit==='°F'&&high!==null?(high-32)*5/9:high;
    if(units.temperature_unit&&!['°C','°F'].includes(units.temperature_unit))celsius=null;
    if(celsius!==null&&celsius<=2){status='avoid';reason='cold';}
    return {key,index,condition,high,low,wind,status,reason,eligible:index>0||localHour<18,run:0,stop:null};
  });
  for(const day of days){
    if(day.status!=='dry')continue;
    let cursor=day.index;while(cursor<7&&days[cursor].status==='dry')cursor++;
    day.run=cursor-day.index;day.stop=cursor<7?days[cursor]:null;
    day.recommendation=day.run>=2?'good':!day.stop||day.stop.status==='unknown'?'limited':'short';
  }
  const best=days.filter(d=>d.status==='dry'&&d.run>=2&&d.eligible).sort((a,b)=>b.run-a.run||a.index-b.index)[0]||null;
  return {days,best,today};
}
