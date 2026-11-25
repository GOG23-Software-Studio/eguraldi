const historyEscape = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[ch]));
class EuskalmetHistoryCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.date = new Date();
    this.date.setDate(1);
    this.retries = 0;
    this.hiddenSeries = new Set();
    this._outsidePicker = event => {
      if (!event.composedPath().includes(this)) this.closePickers();
    };
  }

  setConfig(config) {
    if (!config) throw new Error(this.text().missingConfig);
    const oldKey = this._sourceKey();
    this.config = { measure: "temperature", ...config };
    if (oldKey !== this._sourceKey()) this._invalidateSource();
    this.render();
    this.scheduleLoad();
  }

  set hass(hass) {
    const oldKey = this._sourceKey();
    const oldLocale = this.text().locale;
    this._hass = hass;
    if (oldLocale !== this.text().locale) this.render();
    if (oldKey !== this._sourceKey()) this._invalidateSource();
    this.scheduleLoad();
  }

  _sourceKey() {
    return JSON.stringify([this.config?.entry_id, this.config?.entity,
      this.config?.station_id || this._hass?.states[this.config?.entity]?.attributes?.station]);
  }

  _invalidateSource() {
    this.request = (this.request || 0) + 1;
    clearTimeout(this.retryTimer);
    this.data = null; this.loaded = false; this.loading = false;
    this.error = null; this.retries = 0;
  }

  connectedCallback() { document.addEventListener('pointerdown',this._outsidePicker);this.scheduleLoad(); }
  disconnectedCallback() { document.removeEventListener('pointerdown',this._outsidePicker);clearTimeout(this.retryTimer); }
  getCardSize() { return 7; }
  static getStubConfig() { return { measure: "temperature" }; }

  text() {
    const language = this._hass?.locale?.language || navigator.language || "es";
    const eu = String(language).toLowerCase().startsWith("eu");
    return eu ? {
      missingConfig: "Txartelaren konfigurazioa falta da",
      title: "Euskalmet historikoa",
      loading: "Kargatzen…",
      loadError: "Ezin izan da historikoa kargatu.",
      retry: "Saiatu berriro",
      noData: "Ez dago hilabete honetako daturik.",
      selectDate: "Aukeratu hilabetea", selectMeasure:"Aukeratu neurria",previousYear:"Aurreko urtea",nextYear:"Hurrengo urtea",
      previous: "Aurreko hilabetea",
      next: "Hurrengo hilabetea",
      showSeries: "Erakutsi seriea",
      hideSeries: "Ezkutatu seriea",
      fields: { min: "minimoa", mean: "batezbestekoa", max: "maximoa", total: "guztira" },
      measures: {
        temperature: "Tenperatura (°C)", precipitation: "Prezipitazioa (mm)",
        humidity: "Hezetasuna (%)", pressure: "Presioa (hPa)",
        irradiance: "Erradiazioa (W/m²)", mean_speed: "Batez besteko haizea (m/s)",
        max_speed: "Haize-bolada (m/s)",
      },
      locale: "eu-ES",
    } : {
      missingConfig: "Falta la configuración de la tarjeta",
      title: "Histórico Euskalmet",
      loading: "Cargando…",
      loadError: "No se pudo cargar el histórico.",
      retry: "Reintentar",
      noData: "No hay datos para este mes.",
      selectDate: "Seleccionar mes", selectMeasure:"Seleccionar medida",previousYear:"Año anterior",nextYear:"Año siguiente",
      previous: "Mes anterior",
      next: "Mes siguiente",
      showSeries: "Mostrar serie",
      hideSeries: "Ocultar serie",
      fields: { min: "mínima", mean: "media", max: "máxima", total: "total" },
      measures: {
        temperature: "Temperatura (°C)", precipitation: "Precipitación (mm)",
        humidity: "Humedad (%)", pressure: "Presión (hPa)",
        irradiance: "Radiación (W/m²)", mean_speed: "Viento medio (m/s)",
        max_speed: "Racha (m/s)",
      },
      locale: "es-ES",
    };
  }

  scheduleLoad(force = false) {
    if (!this.isConnected || !this._hass || !this.config || this.loading) return;
    if (!force && this.loaded) return;
    queueMicrotask(() => this.load(force));
  }

  async load(force = false) {
    if (!this.isConnected || !this._hass || !this.config || this.loading) return;
    if (!force && this.loaded) return;
    this.loading = true;
    this.error = null;
    this.render();
    const request = (this.request || 0) + 1;
    this.request = request;
    try {
      const entityState = this.config.entity
        ? this._hass.states[this.config.entity]
        : undefined;
      const stationId = this.config.station_id || entityState?.attributes?.station;
      const data = await this._hass.callWS({
        type: "euskalmet_local/history",
        entry_id: this.config.entry_id,
        station_id: stationId,
        year: this.date.getFullYear(),
        month: this.date.getMonth() + 1,
      });
      if (request !== this.request) return;
      this.data = data;
      this.loaded = true;
      this.retries = 0;
    } catch (error) {
      if (request !== this.request) return;
      this.error = String(error?.message || error);
      this.loaded = false;
      if (this.retries < 3 && this.isConnected) {
        this.retries += 1;
        clearTimeout(this.retryTimer);
        this.retryTimer = setTimeout(() => this.scheduleLoad(true), this.retries * 1000);
      }
    } finally {
      if (request === this.request) {
        this.loading = false;
        this.render();
      }
    }
  }

  item() {
    return this.data?.items?.find((item) => item.measureId === this.config.measure);
  }

  fields() {
    if (this.config.measure === "temperature") return ["min", "mean", "max"];
    if (this.config.measure === "precipitation") return ["total"];
    return ["mean", "max"];
  }

  value(summary, field) {
    const raw = typeof summary?.[field] === "object"
      ? summary[field]?.value
      : summary?.[field];
    if (raw === null || raw === undefined || raw === "" || typeof raw === "boolean") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  points(field) {
    return (this.item()?.dailySummaries || []).map((summary, index) => ({
      day: index + 1,
      value: this.value(summary, field),
    })).filter((point) => point.value !== null);
  }

  unit() {
    return {
      temperature: "°C", precipitation: "mm", humidity: "%",
      pressure: "hPa", irradiance: "W/m²", mean_speed: "m/s", max_speed: "m/s",
    }[this.config.measure] || "";
  }

  formatValue(value) {
    return new Intl.NumberFormat(this.text().locale, {
      maximumFractionDigits: 1,
    }).format(value);
  }

  changeDate(year, month) {
    const next = new Date();next.setFullYear(year,month-1,1);next.setHours(0,0,0,0);
    if (!Number.isFinite(next.getTime())) return;
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (next > currentMonth) return;
    this.date = next;
    this._picker=null;this._pickerYear=next.getFullYear();
    this._invalidateSource();
    this.render();
    this.scheduleLoad(true);
  }

  monthLabel(index,short=false) {
    const names=this.text().locale==='eu-ES'
      ? ['urtarrila','otsaila','martxoa','apirila','maiatza','ekaina','uztaila','abuztua','iraila','urria','azaroa','abendua']
      : ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return short?names[index].slice(0,3):names[index];
  }

  closePickers() {
    this._picker=null;
    this.shadowRoot.querySelectorAll('details.picker').forEach(picker=>{picker.open=false;});
  }

  bindPickers() {
    const root=this.shadowRoot;
    root.querySelectorAll('details.picker').forEach(picker=>{
      picker.addEventListener('toggle',()=>{
        if(picker.open){this._picker=picker.dataset.picker;root.querySelectorAll('details.picker').forEach(other=>{if(other!==picker)other.open=false;});}
        else if(this._picker===picker.dataset.picker)this._picker=null;
      });
      picker.addEventListener('keydown',event=>{
        if(event.key==='Escape'){event.preventDefault();this.closePickers();picker.querySelector('summary').focus();}
        if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
          event.preventDefault();picker.open=true;
          const buttons=Array.from(picker.querySelectorAll('.picker-panel button:not(:disabled)'));
          const current=buttons.indexOf(root.activeElement),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:current<0?(event.key==='ArrowUp'?buttons.length-1:0):(current+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length;
          buttons[next]?.focus();
        }
      });
    });
    root.querySelectorAll('[data-measure]').forEach(button=>button.addEventListener('click',()=>{
      this.config.measure=button.dataset.measure;this.hiddenSeries.clear();this.closePickers();this.render();root.querySelector('#measure').focus();
    }));
    root.querySelectorAll('[data-year-step]').forEach(button=>button.addEventListener('click',()=>{
      this._pickerYear+=Number(button.dataset.yearStep);this._picker='date';this.render();root.querySelector(`[data-year-step="${button.dataset.yearStep}"]`).focus();
    }));
    root.querySelectorAll('[data-month]').forEach(button=>button.addEventListener('click',()=>{
      this.changeDate(this._pickerYear,Number(button.dataset.month));root.querySelector('#month').focus();
    }));
  }

  shift(delta) {
    this.changeDate(this.date.getFullYear(), this.date.getMonth() + 1 + delta);
  }

  plotDays() {
    const now = new Date();
    return this.date.getFullYear() === now.getFullYear() && this.date.getMonth() === now.getMonth()
      ? now.getDate() : new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0).getDate();
  }

  smoothPath(points) {
    return points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  }

  summary(text) {
    const fields = this.fields();
    return `<div class="history-metrics" style="grid-template-columns:repeat(${fields.length},minmax(0,1fr))">${fields.map(field => {
      const values = this.points(field).filter(point => point.day <= this.plotDays()).map(point => point.value);
      const value = !values.length ? null : field === 'min' ? Math.min(...values) : field === 'max' ? Math.max(...values)
        : field === 'total' ? values.reduce((a,b)=>a+b,0) : values.reduce((a,b)=>a+b,0)/values.length;
      const basque = text.locale === 'eu-ES';
      const label = field === 'mean' ? (basque ? 'Eguneko batezbestekoen batezbestekoa' : 'Promedio de medias diarias')
        : field === 'total' ? (basque ? 'Aldiko guztizkoa' : 'Total del periodo') : text.fields[field];
      return `<div><span>${historyEscape(label)}</span><strong>${value === null ? '—' : this.formatValue(value)} <small>${this.unit()}</small></strong></div>`;
    }).join('')}</div>`;
  }

  graph(text) {
    const width = 720;
    const height = 330;
    const margin = { top: 18, right: 22, bottom: 42, left: 62 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const days = this.plotDays();
    const colors = { min: "#68cef3", mean: "#8cddba", max: "#ffbf83", total: "#68cef3" };
    const allSeries = this.fields().map((field) => ({
      field,
      color: colors[field],
      points: this.points(field).filter(point => point.day <= days),
    }));
    const visibleSeries = allSeries.filter((series) => !this.hiddenSeries.has(series.field));
    const visibleValues = visibleSeries.flatMap((series) => series.points.map((point) => point.value));
    const fallbackValues = allSeries.flatMap((series) => series.points.map((point) => point.value));
    const values = visibleValues.length ? visibleValues : fallbackValues;
    if (!values.length) return "";

    let minimum = this.config.measure === "precipitation" ? 0 : Math.min(...values);
    let maximum = Math.max(...values);
    const padding = Math.max((maximum - minimum) * 0.12, Math.abs(maximum || 1) * 0.025, 0.5);
    if (this.config.measure !== "precipitation") minimum -= padding;
    maximum += padding;
    if (maximum === minimum) maximum = minimum + 1;

    const x = (day) => margin.left + ((day - 1) / Math.max(days - 1, 1)) * plotWidth;
    const y = (value) => margin.top + ((maximum - value) / (maximum - minimum)) * plotHeight;
    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const value = maximum - ((maximum - minimum) * index) / 4;
      const position = margin.top + (plotHeight * index) / 4;
      return `<line class="grid" x1="${margin.left}" y1="${position}" x2="${width - margin.right}" y2="${position}"/>
        <text class="axis y-axis" x="${margin.left - 10}" y="${position + 4}">${new Intl.NumberFormat(text.locale,{maximumFractionDigits:1}).format(value)}</text>`;
    }).join("");
    const xDays = [...new Set([1, ...[1,2,3].map(i => Math.round(1+(days-1)*i/4)), days])];
    const xTicks = xDays.map((day) =>
      `<text class="axis x-axis" x="${x(day)}" y="${height - 14}">${day}</text>`,
    ).join("");
    const plotSeries = visibleSeries.map((series) => {
      const coordinates = series.points.map((point) => ({
        ...point,
        x: x(point.day),
        y: y(point.value),
      }));
      if (this.config.measure === "precipitation") {
        const barWidth = Math.max(3, (plotWidth / days) * 0.66);
        return coordinates.map((point) =>
          `<rect class="bar" data-field="${series.field}" data-day="${point.day}"
            x="${point.x - barWidth / 2}" y="${point.y}" width="${barWidth}"
            height="${margin.top + plotHeight - point.y}" fill="${series.color}"/>`,
        ).join("");
      }
      const segments = [];
      for (const point of coordinates) {
        const segment = segments.at(-1);
        if (!segment || point.day !== segment.at(-1).day + 1) segments.push([point]);
        else segment.push(point);
      }
      return segments.map(segment => {
        const path = this.smoothPath(segment);
        const dots = segment.map(point => `<circle cx="${point.x}" cy="${point.y}" r="2.6" fill="${series.color}"/>`).join('');
        return `<path class="line" data-field="${series.field}" stroke="${series.color}" d="${path}"/>${dots}`;
      }).join('');
    }).join("");
    const month = `${this.monthLabel(this.date.getMonth())} ${this.date.getFullYear()}`;
    const pickerYear=this._pickerYear??this.date.getFullYear();this._pickerYear=pickerYear;

    return `<div class="legend">${allSeries.map((series) => {
      const hidden = this.hiddenSeries.has(series.field);
      const action = hidden ? text.showSeries : text.hideSeries;
      return `<button class="legend-item ${hidden ? "disabled" : ""}" data-series="${series.field}"
        title="${action}: ${text.fields[series.field]}" aria-pressed="${!hidden}">
        <i style="background:${series.color}"></i>${text.fields[series.field]}</button>`;
    }).join("")}</div>
      <div class="chart-wrap">
        <svg class="chart" viewBox="0 0 ${width} ${height}" role="img"
          aria-label="${text.title}: ${month}">
          ${yTicks}${xTicks}
          <text class="unit" x="8" y="15">${this.unit()}</text>
          <g class="series">${plotSeries}</g>
          <line class="hover-line" y1="${margin.top}" y2="${margin.top + plotHeight}"/>
          <g class="hover-points"></g>
          <rect class="interaction" x="${margin.left}" y="${margin.top}"
            width="${plotWidth}" height="${plotHeight}"/>
        </svg>
        <div class="tooltip" role="status"></div>
      </div>`;
  }

  bindGraph(text) {
    this.shadowRoot.querySelectorAll(".legend-item").forEach((button) => {
      button.addEventListener("click", () => {
        const field = button.dataset.series;
        if (this.hiddenSeries.has(field)) this.hiddenSeries.delete(field);
        else this.hiddenSeries.add(field);
        this.render();
      });
    });

    const chart = this.shadowRoot.querySelector(".chart");
    const interaction = this.shadowRoot.querySelector(".interaction");
    const tooltip = this.shadowRoot.querySelector(".tooltip");
    const hoverLine = this.shadowRoot.querySelector(".hover-line");
    const hoverPoints = this.shadowRoot.querySelector(".hover-points");
    if (!chart || !interaction || !tooltip || !hoverLine || !hoverPoints) return;

    const days = this.plotDays();
    const marginLeft = 62;
    const plotWidth = 636;
    const fields = this.fields().filter((field) => !this.hiddenSeries.has(field));
    let touchPinned = false;
    const hideTooltip = () => {
      tooltip.classList.remove("visible");
      hoverLine.classList.remove("visible");
      hoverPoints.innerHTML = "";
    };
    const showTooltip = (event) => {
      const rect = chart.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * 720;
      const day = Math.max(1, Math.min(days,
        Math.round(1 + ((svgX - marginLeft) / plotWidth) * (days - 1))));
      const lineX = marginLeft + ((day - 1) / Math.max(days - 1, 1)) * plotWidth;
      const summaries = this.item()?.dailySummaries || [];
      const summary = summaries[day - 1];
      const values = fields.map((field) => ({
        field,
        value: this.value(summary, field),
      })).filter((item) => item.value !== null);
      if (!values.length) {
        hideTooltip();
        return false;
      }
      const date = new Date(this.date.getFullYear(), this.date.getMonth(), day);
      tooltip.innerHTML = `<strong>${date.toLocaleDateString(text.locale, {
        weekday: "short", day: "numeric", month: "short",
      })}</strong>${values.map((item) =>
        `<span><i class="${item.field}"></i>${text.fields[item.field]}:
          <b>${this.formatValue(item.value)} ${this.unit()}</b></span>`).join("")}`;
      const relativeX = (lineX / 720) * rect.width;
      tooltip.style.left = `${Math.min(Math.max(relativeX, 90), rect.width - 90)}px`;
      hoverLine.setAttribute("x1", lineX);
      hoverLine.setAttribute("x2", lineX);
      hoverLine.classList.add("visible");
      tooltip.classList.add("visible");
      return true;
    };
    interaction.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") return;
      touchPinned = showTooltip(event);
    });
    interaction.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        if (event.pressure > 0) touchPinned = showTooltip(event);
        return;
      }
      touchPinned = false;
      showTooltip(event);
    });
    interaction.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "touch" && !touchPinned) hideTooltip();
    });
  }

  render() {
    if (!this.config) return;
    const text = this.text();
    const monthValue = `${this.date.getFullYear()}-${String(this.date.getMonth() + 1).padStart(2, "0")}`;
    const now = new Date();
    const maximumMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = `${this.monthLabel(this.date.getMonth())} ${this.date.getFullYear()}`;
    const pickerYear=this._pickerYear??this.date.getFullYear();this._pickerYear=pickerYear;
    const graph = this.graph(text);
    const body = this.loading ? `<div class="message">${text.loading}</div>`
      : this.error
        ? `<div class="message">${text.loadError}<small>${historyEscape(this.error)}</small><button id="retry">${text.retry}</button></div>`
        : graph || `<div class="message">${text.noData}</div>`;

    this.shadowRoot.innerHTML = `<style>
      :host{display:block}*{box-sizing:border-box}ha-card{display:block;padding:18px;overflow:hidden;background:linear-gradient(145deg,#1b3246,#101e30);border:1px solid #9acdd926;border-radius:22px;color:#edf8ff;font-family:var(--primary-font-family,system-ui)}ha-card.embedded{padding:0 20px 18px;border:0;border-radius:0;background:transparent;box-shadow:none}
      header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      h2{font-size:20px;margin:0 0 3px}header small{color:#a9becf;text-transform:capitalize}
      .controls{position:relative;z-index:3;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:16px 0 4px}
      .date-tools{display:flex;gap:6px;margin-left:auto;min-width:0}
      button,select,input{font:inherit;color:#edf8ff;background:#87b5d00b;
        border:1px solid #9acdd926;border-radius:9px;padding:8px 10px}
      button{cursor:pointer}button:hover{background:#87b5d022}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #68cef3;outline-offset:2px}
      .picker{position:relative;min-width:0}.picker summary{display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none;font-size:12px;min-height:42px;cursor:pointer;color:#edf8ff;background:#87b5d00b;border:1px solid #9acdd926;border-radius:12px;padding:10px 12px}
      .picker summary::-webkit-details-marker{display:none}.picker summary::after{content:'⌄';color:#8ed9d1;font-size:16px}.picker[open] summary{border-color:#8ed9d1;background:#8ecade12}.picker summary:focus-visible{outline:2px solid #8ed9d1;outline-offset:2px}
      .measure-picker{flex:1 1 170px;max-width:250px}.date-picker{flex:1;min-width:0}.date-picker summary{text-transform:capitalize;white-space:nowrap}
      .picker-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:10;min-width:100%;max-width:calc(100vw - 48px);padding:6px;background:#142a3b;border:1px solid #8ed9d14d;border-radius:14px;box-shadow:0 12px 28px #0005}
      .measure-picker .picker-panel{width:260px}.picker-panel button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;border:0;border-radius:8px;padding:10px;font-size:12px;line-height:1.4;text-align:left;background:transparent}
      .picker-panel button[aria-pressed="true"]{color:#8ed9d1;background:#8ed9d118}.picker-panel button:disabled,.nav:disabled{opacity:.3;cursor:default}.picker-panel button:hover:not(:disabled){background:#8ed9d122}.picker-panel .check{color:#8ed9d1}
      .date-picker .picker-panel{left:auto;right:0;width:260px}.year-nav{display:grid;grid-template-columns:34px 1fr 34px;align-items:center;gap:8px;margin-bottom:6px}.year-nav strong{text-align:center;font-size:15px;font-weight:550}.year-nav button{justify-content:center;padding:6px;font-size:20px}.month-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.month-grid button{justify-content:center;text-transform:capitalize}

      .nav{font-size:20px;line-height:18px;padding:7px 11px}
      .legend{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:13px 0 2px}
      .legend-item{border:0;padding:5px 8px;font-size:12px;background:transparent}
      .legend-item i,.tooltip i{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:6px}
      .legend-item.disabled{opacity:.42;text-decoration:line-through}
      .chart-wrap{position:relative;min-height:0}.chart{display:block;width:100%;height:auto;overflow:visible}
      .grid{stroke:#a9cbe426;stroke-width:1;opacity:.55}.axis,.unit{fill:#a9becf;font-size:16px}
      .y-axis{text-anchor:end}.x-axis{text-anchor:middle}.line{fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}
      .area{opacity:.12}.bar{opacity:.78;rx:2}.interaction{fill:transparent;pointer-events:all;touch-action:pan-y}
      .hover-line{stroke:var(--secondary-text-color);stroke-width:1;stroke-dasharray:4 4;opacity:0;pointer-events:none}
      .hover-line.visible{opacity:.7}.tooltip{position:absolute;top:10px;z-index:2;display:none;min-width:160px;
        padding:9px 11px;transform:translateX(-50%);color:#edf8ff;
        background:#142a3b;border:1px solid #9acdd926;
        border-radius:9px;box-shadow:0 4px 14px rgba(0,0,0,.22);pointer-events:none;font-size:12px}
      .tooltip.visible{display:flex;flex-direction:column;gap:4px}.tooltip strong{margin-bottom:2px;text-transform:capitalize}
      .tooltip .min{background:#68cef3}.tooltip .mean{background:#8cddba}
      .tooltip .max{background:#ffbf83}.tooltip .total{background:#68cef3}
      .message{min-height:280px;display:flex;gap:12px;flex-direction:column;align-items:center;justify-content:center;text-align:center}
      .history-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}.history-metrics div{border:1px solid #9acdd926;border-radius:12px;background:#ffffff03;padding:11px 9px;min-width:0}.history-metrics span{display:block;color:#a9becf;font-size:10px;min-height:25px}.history-metrics strong{display:block;margin-top:6px;font-weight:550;font-size:19px}.history-metrics small{font-size:11px;font-weight:400}.history-foot{font-size:10px;color:#a9becf;margin-top:12px;line-height:1.5}
      @media(max-width:600px){ha-card{padding:14px}.controls{align-items:stretch}.controls .measure-picker{width:100%;max-width:none;flex-basis:100%}
        .date-tools{margin-left:0;width:100%}.date-tools .date-picker{flex:1}.chart-wrap{margin:0 -8px}.axis,.unit{font-size:20px}ha-card.embedded{padding:0 12px 16px}
        .legend{gap:2px}.legend-item{padding:5px 6px}}

:host{font-family:var(--primary-font-family,system-ui);font-size:13px;line-height:1.5}
:host h2,:host .forecast-top h2{font-family:inherit;font-size:20px;font-weight:600;line-height:1.3;letter-spacing:0;margin:0 0 16px}
:host h3{font-family:inherit;font-size:14px;font-weight:600;line-height:1.4}
:host button,:host input,:host select{font-family:inherit}
ha-card{border-radius:22px}ha-card.embedded{padding:0 20px 20px}:host .minima{color:#68cef3}:host .maxima{color:#ffbf83}@media(max-width:550px){:host h2{font-size:18px}:host .card.headline-card h2{font-size:12px}}:host .history-metrics>div:first-child strong{color:#68cef3}:host .history-metrics>div:last-child strong{color:#ffbf83}</style>
    <ha-card class="${this.config.embedded ? "embedded" : ""}">
      <header><div>${this.config.show_title === false ? "" : `<h2>${historyEscape(this.config.title || text.title)}</h2>`}${this.config.show_title === false ? "" : `<small>${month}</small>`}</div></header>
      <div class="controls">
        <details class="picker measure-picker" data-picker="measure" ${this._picker==='measure'?'open':''}>
          <summary id="measure" aria-label="${text.selectMeasure}">${historyEscape(text.measures[this.config.measure]||this.config.measure)}</summary>
          <div class="picker-panel" role="group" aria-label="${text.selectMeasure}">${Object.entries(text.measures).map(([key,label])=>`<button type="button" data-measure="${key}" aria-label="${historyEscape(label)}" aria-pressed="${key===this.config.measure}">${label}<span class="check" aria-hidden="true">${key===this.config.measure?'✓':''}</span></button>`).join('')}</div>
        </details>
        <div class="date-tools">
          <button class="nav" id="prev" title="${text.previous}" aria-label="${text.previous}">‹</button>
          <details class="picker date-picker" data-picker="date" ${this._picker==='date'?'open':''}>
            <summary id="month" aria-label="${text.selectDate}">${month}</summary>
            <div class="picker-panel" role="group" aria-label="${text.selectDate}">
              <div class="year-nav"><button type="button" data-year-step="-1" ${pickerYear<=1?'disabled':''} aria-label="${text.previousYear}">‹</button><strong>${pickerYear}</strong><button type="button" data-year-step="1" ${pickerYear>=now.getFullYear()?'disabled':''} aria-label="${text.nextYear}">›</button></div>
              <div class="month-grid">${Array.from({length:12},(_,index)=>`<button type="button" data-month="${index+1}" aria-label="${this.monthLabel(index)} ${pickerYear}" aria-pressed="${pickerYear===this.date.getFullYear()&&index===this.date.getMonth()}" ${pickerYear===now.getFullYear()&&index>now.getMonth()?'disabled':''}>${this.monthLabel(index,true)}</button>`).join('')}</div>
            </div>
          </details>
          <button class="nav" id="next" ${monthValue === maximumMonth ? "disabled" : ""} title="${text.next}" aria-label="${text.next}">›</button>
        </div>
      </div>
      ${graph && !this.loading && !this.error ? this.summary(text) : ''}
      ${body}
    </ha-card>`;

    this.shadowRoot.querySelector("#prev")?.addEventListener("click", () => this.shift(-1));
    this.shadowRoot.querySelector("#next")?.addEventListener("click", () => this.shift(1));
    this.shadowRoot.querySelector("#retry")?.addEventListener("click", () => {
      this.retries = 0;
      this.scheduleLoad(true);
    });
    this.bindPickers();
    this.bindGraph(text);
  }
}

if (!customElements.get("eguraldi-history-card")) {
  customElements.define("eguraldi-history-card", class extends EuskalmetHistoryCard {});
}

if (!customElements.get("euskalmet-local-history-card")) {
  customElements.define("euskalmet-local-history-card", EuskalmetHistoryCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "euskalmet-local-history-card")) {
  const eu = navigator.language?.toLowerCase().startsWith("eu");
  window.customCards.push({
    type: "euskalmet-local-history-card",
    name: eu ? "Euskalmet - Historikoa" : "Euskalmet - Histórico",
    description: eu ? "Euskalmeteko eguneko grafiko historikoak" : "Gráficos diarios históricos de Euskalmet",
  });
}
