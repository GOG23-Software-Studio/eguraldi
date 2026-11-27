import './euskalmet-alert-card.js?v=0.12.1';
/* Reuse the alert ticker's pointer, keyboard, timer and reduced-motion behavior. */
class EguraldiHeadlinesCard extends customElements.get('eguraldi-alert-card') {
  update(items,hass,alertsFresh){this._items=items;this._hass=hass;this._alertsFresh=alertsFresh;this._render();}
  _state(){return this._alertsFresh?super._state():null;}
  _entryTitle(entry,t){const title=entry.news?entry.title:super._entryTitle(entry,t),limit=Math.max(60,Math.min(240,Number(this._config.headline_length)||160));return [...title].length>limit?[...title].slice(0,limit-1).join('')+'…':title;}
  _period(entry,t){return entry.news?'':super._period(entry,t);}
  _text(){const t=super._text();return {...t,levels:{...t.levels,none:''}};}
  _viewText(t){return {...super._viewText(t),moving:t.eu?'Titularrak mugimenduan':'Titulares en movimiento',previous:t.eu?'Aurreko titularra':'Titular anterior',next:t.eu?'Hurrengo titularra':'Titular siguiente'};}
  _renderTicker(target,entries){this._officialEntries=entries;}
  _render(){
    this._officialEntries=[];super._render();if(!this._hass||!this._config)return;
    const body=this.shadowRoot.querySelector('.body');if(!body)return;body.replaceChildren();
    const t=this._text(),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    const enabled=this._config.include_alerts!==false,entries=[...(enabled?this._officialEntries:[]),...(this._items||[])];
    if(enabled&&!this._alertsFresh)entries.unshift({key:'news:alerts-unavailable',title:t.unavailable,news:true,group:{level:'unknown'},icon:'mdi:alert-outline',description:t.eu?'Abisuen iturria ez dago eguneratuta. Beste titularrek ez dute arriskurik eza adierazten.':'La fuente de avisos no está vigente. Los demás titulares no implican ausencia de riesgos.'});
    if(enabled&&this._alertsFresh&&super._state()?.state==='none'&&!entries.length)entries.push({key:'news:no-alerts',title:t.none,description:t.none,news:true,group:{level:'none'},icon:'mdi:check-circle-outline'});
    if(entries.length)super._renderTicker(body,entries,t,el);
    else body.append(el('div','empty',t.eu?'Ez dago datu eguneraturik hautatutako titularretarako':'Sin titulares disponibles para los temas seleccionados'));
    const heading=this.shadowRoot.querySelector('.heading');
    heading.prepend(el('span','news-brand','EGURALDI'));
    const labels=t.eu?{current:'ORAIN',rain:'EURIA',wind:'HAIZEA',daily:'GAUR',plans:'PLANAK',microclimate:'MIKROKLIMA',update:'BERRIAK'}:{current:'AHORA',rain:'LLUVIA',wind:'VIENTO',daily:'HOY',plans:'PLANES',microclimate:'MICROCLIMA',update:'NOVEDADES'};
    for(const button of body.querySelectorAll('[data-alert-index]')){
      const entry=entries[Number(button.dataset.alertIndex)],line=button.querySelector('.headline-line');
      if(line&&entry)line.prepend(el('span','news-topic',entry.news?(labels[entry.topic]||(t.eu?'INFORMAZIOA':'INFORMACIÓN')):(t.eu?'ABISU OFIZIALA':'AVISO OFICIAL')));
    }
    const style=el('style');style.textContent=`
      .headline-level:empty,.headline-period:empty{display:none}.none{--risk-color:#83d8f6}
      .card.headline-card{padding:0 14px 0 0;gap:16px;overflow:hidden}
      .headline-card .heading{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;align-self:stretch;padding:12px 18px;background:#83d8f60c;border-right:1px solid #83d8f62b;min-width:94px}
      .news-brand{font-size:10px;font-weight:800;letter-spacing:2px;color:#83d8f6}
      .headline-card .heading h2{font-size:14px;max-width:160px;overflow:hidden;text-overflow:ellipsis}
      .news-topic{display:inline-flex;align-items:center;flex:none;border:1px solid color-mix(in srgb,var(--risk-color) 45%,transparent);border-radius:5px;padding:3px 7px;font-size:9px;font-weight:800;letter-spacing:1px;color:var(--risk-color);background:color-mix(in srgb,var(--risk-color) 9%,transparent)}
      .headline-line{font-size:14px;gap:10px}.headline-line strong{font-weight:650}.headline-line:after{content:'◆';font-size:8px;color:#83d8f66b;margin:0 16px}
      .alert-band.headlines{height:64px}.headlines .alert-message{padding-top:15px;padding-bottom:15px}
      .headlines-footer .alert-control{border-radius:50%;background:transparent;border-color:#83d8f62b}
      .headline-card:has(.alert-detail:not([hidden])) .heading{margin:0 -14px 8px 0;border-right:0;border-bottom:1px solid #83d8f62b}
      .alert-detail{margin:12px 16px 16px}
      @media(max-width:560px){.card.headline-card{gap:10px;padding-right:6px}.headline-card .heading{padding:10px;min-width:66px}.news-brand{font-size:9px;letter-spacing:1px}.headline-card .heading h2{font-size:12px;max-width:94px}.headline-line{font-size:13px}.news-topic{font-size:8px;padding:3px 5px}}
    `;this.shadowRoot.append(style);this._paintTicker?.();
  }
}
if(!customElements.get('eguraldi-headlines-card'))customElements.define('eguraldi-headlines-card',EguraldiHeadlinesCard);
