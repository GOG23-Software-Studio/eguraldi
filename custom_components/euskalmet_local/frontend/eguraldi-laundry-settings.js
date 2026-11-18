/* Use HA's options flow so the card and integration share validation and storage. */
export function openLaundrySettings({hass,entryId,locality,t,onClose}){
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const host=document.createElement('div'),root=host.attachShadow({mode:'open'});
  root.innerHTML=`<style>
    :host{color-scheme:dark}dialog{box-sizing:border-box;width:min(540px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:24px;border:1px solid #416071;border-radius:22px;background:linear-gradient(140deg,#1b3445,#10202f);color:#edf8ff;font:14px system-ui;overflow:auto}dialog::backdrop{background:#020a14aa}h2{font-size:20px;margin:0 0 8px}.locality{color:#9bb7cc;margin:0 0 18px}.intro{font-size:12px;color:#adbfcd;line-height:1.6}.field{display:grid;gap:8px;margin:17px 0}.field>span{font-size:12px;color:#c5d7e5}.check{display:flex;align-items:center;gap:10px}.check input{width:20px;height:20px;accent-color:#68cef3}.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}input,select,button{font:inherit;color:inherit;background:#173041;border:1px solid #416071;border-radius:10px;padding:10px;box-sizing:border-box;min-width:0}select,input[type=time],input[type=number]{width:100%}option{background:#173041}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #68cef3;outline-offset:3px}button:disabled{opacity:.5;cursor:wait}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}.save{color:#072032;background:#68cef3;border-color:#68cef3}.error{color:#ffbf83;font-size:13px;line-height:1.5} @media(max-width:380px){dialog{padding:18px}.row{gap:10px}}
  </style><dialog aria-labelledby="laundry-settings-title"><h2 id="laundry-settings-title">${escape(t('Avisos de ropa tendida'))}</h2><p class="locality">${escape(locality)}</p><div id="content" role="status">${escape(t('Cargando opciones…'))}</div><div class="actions"><button type="button" id="close">${escape(t('Cancelar'))}</button></div></dialog>`;
  document.body.append(host);
  const dialog=root.querySelector('dialog'),content=root.querySelector('#content');
  let closed=false,flowId=null,saving=false,finished=false,step=null;
  const path=()=>`config/config_entries/options/flow/${flowId}`;
  const cleanup=()=>{if(flowId&&!finished){const id=flowId;flowId=null;hass.callApi('DELETE',`config/config_entries/options/flow/${id}`).catch(()=>{});}};
  const close=()=>{if(saving)return;closed=true;cleanup();dialog.close();host.remove();onClose?.();};
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  root.querySelector('#close').addEventListener('click',close);
  dialog.showModal();
  const errors={laundry_target_required:'Selecciona un destino disponible para activar los avisos.',laundry_event_required:'Activa al menos lluvia o viento.'};
  function render(data){
    content.removeAttribute('role');
    const fields=step.data_schema||[],defaults=Object.fromEntries(fields.map(f=>[f.name,f.default]));
    data={...defaults,...data};
    const labels={laundry_enabled:'Activar avisos',laundry_target:'Destino de los avisos',laundry_lead_minutes:'Antelación (minutos)',laundry_rain:'Vigilar lluvia o tormenta',laundry_wind:'Vigilar viento fuerte',laundry_wind_kmh:'Umbral de viento (km/h)',laundry_start:'Desde',laundry_end:'Hasta',laundry_cooldown_minutes:'Intervalo mínimo entre avisos (minutos)'};
    const field=name=>{
      const f=fields.find(f=>f.name===name);if(!f)return '';
      const label=escape(t(labels[name]||name)),value=data[name],id='setting-'+name;
      if(['laundry_enabled','laundry_rain','laundry_wind'].includes(name))return `<label class="field check" for="${id}"><input id="${id}" name="${name}" type="checkbox" ${value?'checked':''}><span>${label}</span></label>`;
      const choices=f.selector?.select?.options;
      if(choices)return `<label class="field" for="${id}"><span>${label}</span><select id="${id}" name="${name}">${choices.map(option=>{const v=typeof option==='string'?option:option.value,l=typeof option==='string'?option:option.label;return `<option value="${escape(v)}" ${String(v)===String(value)?'selected':''}>${escape(v===''?t('Selecciona un destino'):l)}</option>`;}).join('')}</select></label>`;
      return `<label class="field" for="${id}"><span>${label}</span><input id="${id}" name="${name}" type="${name==='laundry_wind_kmh'?'number':'time'}" value="${escape(value)}" ${name==='laundry_wind_kmh'?'min="10" max="100" step="any"':'step="60"'} required></label>`;
    };
    content.innerHTML=`<p class="intro">${escape(t('Activa los avisos y elige dónde recibirlos. Después marca «Tengo ropa tendida» para iniciar el seguimiento.'))}</p><form id="settings">${field('laundry_enabled')}${field('laundry_target')}${field('laundry_lead_minutes')}${field('laundry_rain')}${field('laundry_wind')}${field('laundry_wind_kmh')}<div class="row">${field('laundry_start')}${field('laundry_end')}</div>${field('laundry_cooldown_minutes')}<p class="intro">${escape(t('Previsión horaria: la antelación es orientativa. La sesión caduca a las 24 h. Inicio y fin iguales permiten avisos todo el día.'))}</p><div class="error" role="alert">${Object.values(step.errors||{}).map(code=>escape(t(errors[code]||'No se pudieron guardar los avisos. Revisa los valores.'))).join('<br>')}</div></form>`;
    let save=root.querySelector('#save');if(!save){save=document.createElement('button');save.id='save';save.type='submit';save.setAttribute('form','settings');save.className='save';save.textContent=t('Guardar');root.querySelector('.actions').append(save);}
    content.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault();if(saving||closed)return;
      const payload={};for(const f of fields){const input=content.querySelector(`[name="${f.name}"]`);if(input)payload[f.name]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;}
      saving=true;root.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{
        const result=await hass.callApi('POST',path(),payload);
        if(result.type==='create_entry'){finished=true;saving=false;close();return;}
        if(result.type!=='form'||result.step_id!=='laundry')throw Error('Unexpected flow result');
        step=result;render(payload);
      }catch{content.querySelector('[role="alert"]').textContent=t('No se pudieron guardar los avisos. Revisa los valores.');}
      finally{saving=false;root.querySelectorAll('button').forEach(b=>b.disabled=false);}
    });
  }
  (async()=>{
    try{
      step=await hass.callApi('POST','config/config_entries/options/flow',{handler:entryId});flowId=step.flow_id;
      if(closed){cleanup();return;}
      if(step.type==='menu'&&step.menu_options?.includes('laundry'))step=await hass.callApi('POST',path(),{next_step_id:'laundry'});
      if(closed){cleanup();return;}
      if(step.type!=='form'||step.step_id!=='laundry')throw Error('Laundry options unavailable');
      render();
    }catch{cleanup();if(!closed)content.textContent=t('No se pudieron abrir los avisos. Necesitas permisos de administrador y Eguraldi actualizado.');}
  })();
  return {close};
}
