/* Eguraldi · transparent, heuristic outdoor drying guidance · MIT */
const HOUR = 3600000;
const dryingNumber = value => value === null || value === undefined || value === '' || typeof value === 'boolean' || !Number.isFinite(Number(value)) ? null : Number(value);
const within = (value, min, max) => { const n = dryingNumber(value); return n !== null && n >= min && n <= max ? n : null; };
const clamp = n => Math.max(0, Math.min(1, n));
const wetConditions = new Set(['rainy','pouring','snowy','snowy-rainy','hail','lightning','lightning-rainy','exceptional']);

export function dryingHour(forecast, units = {}, humidity = null, night = false) {
  const rawTemp = dryingNumber(forecast?.temperature), rawWind = dryingNumber(forecast?.wind_speed), rawRain = dryingNumber(forecast?.precipitation);
  const windFactor = {'km/h':1,'m/s':3.6,'mph':1.609344,'kn':1.852,'kt':1.852}[units.wind_speed_unit || 'km/h'];
  const rainFactor = {mm:1,in:25.4}[units.precipitation_unit || 'mm'];
  const tempUnit = units.temperature_unit || '°C';
  const temperature = within(rawTemp === null ? null : tempUnit === '°F' ? (rawTemp-32)*5/9 : tempUnit === '°C' ? rawTemp : null, -50,60);
  const wind = within(rawWind === null || !windFactor ? null : rawWind*windFactor,0,250);
  const rain = within(rawRain === null || !rainFactor ? null : rawRain*rainFactor,0,1000);
  const rawGust = dryingNumber(forecast?.wind_gust_speed), gust = within(rawGust === null || !windFactor ? null : rawGust*windFactor,0,350);
  const rh = within(forecast?.humidity,0,100) ?? within(humidity,0,100), probability = within(forecast?.precipitation_probability,0,100);
  const reasons = [];
  if ((rain !== null && rain > 0) || wetConditions.has(forecast?.condition) || (probability !== null && probability >= 40)) reasons.push('rain');
  if ((wind !== null && wind >= 30) || (gust !== null && gust >= 45)) reasons.push('wind');
  if (temperature !== null && temperature <= 2) reasons.push('cold');
  if (forecast?.condition === 'fog' || (rh !== null && rh >= 90)) reasons.push('humidity');
  const missing = [rain === null ? 'rain' : null, wind === null ? 'wind' : null, temperature === null ? 'temperature' : null].filter(Boolean);
  if (reasons.length) return {temperature,wind,rain,gust,humidity:rh,probability,night,status:'avoid',reasons,missing,score:0};
  if (missing.length) return {temperature,wind,rain,gust,humidity:rh,probability,night,status:'unknown',reasons:[],missing,score:0};
  // Product heuristics, not a measured drying time or a probability of success.
  const warmth = clamp((temperature-2)/23), breeze = clamp(wind/12), dryness = rh === null ? null : clamp((90-rh)/50);
  let score = rh === null ? (warmth*.55+breeze*.45)*65 : (warmth*.3+breeze*.25+dryness*.45)*100;
  if (night) score *= .75;
  if (probability !== null && probability >= 20) score *= .7;
  const status = score < 35 ? 'slow' : rh === null ? 'limited' : score >= 65 ? 'good' : 'fair';
  if (rh === null) reasons.push('missing_humidity');
  if (rh !== null && rh >= 75) reasons.push('humid');
  if (temperature < 12) reasons.push('cool');
  if (wind < 5) reasons.push('calm');
  if (night) reasons.push('night');
  if (probability !== null && probability >= 20) reasons.push('chance');
  return {temperature,wind,rain,gust,humidity:rh,probability,night,status,reasons,missing,score:Math.round(score)};
}

export function dryingPlan(forecasts, {now=Date.now(),hours=3,units={},humidityForecast=[],night=()=>false}={}) {
  const duration = [2,3,4].includes(hours) ? hours : 3, anchor = Math.ceil(now/HOUR)*HOUR;
  const index = new Map(), humidity = new Map();
  for (const f of Array.isArray(humidityForecast) ? humidityForecast : []) {
    if (!f || typeof f !== 'object') continue;
    const stamp = Date.parse(f.datetime);
    if (Number.isFinite(stamp) && stamp%HOUR === 0) humidity.set(stamp,within(f.humidity,0,100));
  }
  for (const f of Array.isArray(forecasts) ? forecasts : []) {
    if (!f || typeof f !== 'object') continue;
    const stamp = Date.parse(f.datetime);
    if (Number.isFinite(stamp) && stamp%HOUR === 0 && stamp >= anchor && stamp+HOUR <= now+24*HOUR) index.set(stamp,f);
  }
  const slots = Array.from({length:Math.max(0,Math.floor((now+24*HOUR-anchor)/HOUR))},(_,i)=>{
    const stamp=anchor+i*HOUR, f=index.get(stamp);
    return {stamp,condition:f?.condition,...dryingHour(f,units,humidity.get(stamp),night(stamp)),present:Boolean(f)};
  });
  const windows=[];
  for (let i=0;i<=slots.length-duration;i++) {
    const group=slots.slice(i,i+duration);
    if (group.some(p=>!['good','fair','limited'].includes(p.status))) continue;
    windows.push({start:group[0].stamp,end:group.at(-1).stamp+HOUR,slots:group,score:group.reduce((n,p)=>n+p.score,0)/duration,limited:group.some(p=>p.humidity===null)});
  }
  windows.sort((a,b)=>b.score-a.score || a.start-b.start);
  const best=windows[0]||null, alternatives=[];
  for (const w of windows.slice(1)) {
    if (w.start < best.end && w.end > best.start) continue;
    if (alternatives.some(a=>w.start<a.end && w.end>a.start)) continue;
    alternatives.push(w); if(alternatives.length===2)break;
  }
  return {slots,best,alternatives,duration};
}
