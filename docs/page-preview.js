/* Documentation only: actual Eguraldi cards with explicitly simulated data.
 * This native dialog previews the Browser Mod popup used by the HA example. */
export function mountPagePreview({hass,loc}) {
  const eu=hass.locale.language.startsWith('eu'),pick=(es,basque)=>eu?basque:es;
  document.body.classList.add('weather-page');
  const style=document.createElement('style');style.textContent=`
    .weather-page{--primary-font-family:system-ui;background:#0b121d;padding:20px;color-scheme:dark}
    .weather-page header{max-width:1440px;margin-bottom:20px}.weather-page header>img{display:none!important}
    .weather-page h1{font-size:26px;margin:0 0 12px}.weather-page header p:last-child{display:none}
    .weather-page .grid.page-layout{max-width:1440px;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
    .page-layout>section{min-width:0;display:grid;gap:10px;align-content:start}
    .page-band,.page-week,.page-link{grid-column:1/-1}.page-hours,.page-radar{grid-column:span 2}
    .page-link button{color:#e9f7ff;background:#162c3d;border:1px solid #365467;border-radius:18px;padding:18px;font:600 15px system-ui;cursor:pointer}
    .weather-dialog{width:min(1040px,94vw);max-width:calc(100vw - 24px);max-height:calc(100dvh - 32px);padding:0;border:1px solid #365467;border-radius:24px;background:#101c28;color:#eef8ff;box-sizing:border-box}
    .weather-dialog::backdrop{background:#000a}.weather-dialog .modal-heading{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:14px;margin:0;padding:10px 14px;background:#101c28}
    .modal-heading h2{font-size:18px;margin:0}.modal-heading button{border:0;background:transparent;color:#eef8ff;font:24px system-ui;cursor:pointer;min-width:44px;min-height:44px}
    .modal-cards{display:grid;gap:10px;padding:0 8px 8px}.demo-note{font-size:11px;color:#a6e6ce}
    @media(max-width:799px){.weather-page{padding:8px}.weather-page header{margin:8px 8px 18px}.weather-page h1{font-size:22px}.weather-page .grid.page-layout{grid-template-columns:minmax(0,1fr);gap:24px}.page-layout>section{grid-column:1}.weather-dialog{width:100vw;max-width:100vw;max-height:100dvh;height:100dvh;border:0;border-radius:0}.modal-heading{padding:8px}.modal-heading h2{font-size:16px}}
  `;document.head.append(style);
  document.querySelector('h1').textContent='Eguraldi · Ortuella';
  const main=document.querySelector('#cards');main.style.cssText='';main.classList.add('page-layout');
  // Simple auxiliary glyphs for standalone documentation. HA supplies ha-icon itself.
  if(!customElements.get('ha-icon'))customElements.define('ha-icon',class extends HTMLElement{
    static get observedAttributes(){return ['icon'];}
    connectedCallback(){this.paint();}attributeChangedCallback(){this.paint();}
    paint(){const name=this.getAttribute('icon')||'',paths=name.endsWith(':pause')?'<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>':name.endsWith(':play')?'<path d="M8 5v14l11-7z"/>':name.includes('thermometer')?'<circle cx="12" cy="17" r="4"/><path d="M10 3h4v12h-4z"/>':name.includes('wind')?'<path fill="none" stroke="currentColor" stroke-width="2" d="M3 8h13c6 0 6-6 1-6M2 12h17c5 0 5 6 0 6M4 16h8c4 0 4 5 0 5"/>':name.includes('rain')?'<path d="M6 14a5 5 0 0 1 0-10 6 6 0 0 1 11 1 4 4 0 0 1 0 8H6z"/><path fill="none" stroke="currentColor" stroke-width="2" d="m7 16-2 5m7-5-2 5m7-5-2 5"/>':'<circle cx="12" cy="12" r="6"/>';
      this.attachShadowIfNeeded();this.shadowRoot.innerHTML='<style>:host{display:inline-flex;width:24px;height:24px;flex:none;vertical-align:middle}svg{width:100%;height:100%;fill:currentColor}</style><svg viewBox="0 0 24 24" aria-hidden="true">'+paths+'</svg>';}
    attachShadowIfNeeded(){if(!this.shadowRoot)this.attachShadow({mode:'open'});}
  });
  loc.entities.alert_level='sensor.demo_alert';hass.states['sensor.demo_alert']={state:'none',attributes:{alerts:[]}};
  Object.assign(hass.states['weather.demo'].attributes,{alerts_updated:new Date().toISOString(),alerts_stale:false});
  hass.states['weather.demo'].last_updated=new Date().toISOString();
  const card=mode=>{const n=document.createElement('euskalmet-local-card');n.setConfig({mode,entry_id:'demo',...(mode==='radar'?{autoplay:false}:{}),...(mode==='comparison'?{comparison_entity:'sensor.demo_balcony',comparison_name:pick('Balcón','Balkoia')}:{})});n.hass=hass;return n;};
  const section=(className,modes)=>{const s=document.createElement('section');s.className=className;for(const mode of modes)s.append(card(mode));main.append(s);return s;};
  section('page-band',['headlines']);section('page-now',['overview','summaries']);section('page-hours',['hourly']);section('page-week',['daily_tiles']);section('page-radar',['radar']);section('page-plans',['day_summary']);
  const footer=section('page-link',[]),open=document.createElement('button'),title=pick('Estación, Microclima e histórico','Estazioa, Mikroklima eta historikoa');open.textContent=title;footer.append(open);
  const dialog=document.createElement('dialog');dialog.className='weather-dialog';dialog.setAttribute('aria-label',title);
  const head=document.createElement('header');head.className='modal-heading';const close=document.createElement('button');close.textContent='×';close.setAttribute('aria-label',pick('Cerrar','Itxi'));const heading=document.createElement('h2');heading.textContent=title;head.append(close,heading);dialog.append(head);
  const content=document.createElement('div');content.className='modal-cards';const note=document.createElement('p');note.className='demo-note';note.textContent=pick('VISTA PREVIA · DATOS SIMULADOS','AURREBISTA · SIMULATUTAKO DATUAK');content.append(note);dialog.append(content);document.body.append(dialog);
  open.addEventListener('click',()=>{if(!content.querySelector('euskalmet-local-card'))for(const mode of ['comparison','microclimate','history'])content.append(card(mode));dialog.showModal();});close.addEventListener('click',()=>dialog.close());
}
