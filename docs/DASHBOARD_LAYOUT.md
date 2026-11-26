# Una página del tiempo con las tarjetas de Eguraldi

Las capturas del README muestran una **propuesta de distribución**, no una nueva dependencia ni un cambio automático en todos los paneles. En escritorio, el boletín ocupa la anchura completa; después se agrupan tiempo actual y resumen de hoy junto a las 24 horas, la semana visual y, finalmente, radar y recomendaciones. En móvil, los bloques se apilan en ese orden.

El botón **Estación, Microclima e histórico** abre un modal con comparación de temperatura, Microclima e histórico mensual. No crea una pestaña ni una subvista. Este ejemplo utiliza la integración opcional [Browser Mod](https://github.com/thomasloven/hass-browser_mod), que se instala y configura por separado. Las tarjetas de Eguraldi funcionan sin ella y pueden colocarse directamente en cualquier panel.

## Preparar el panel

1. Crea una vista de tipo **Secciones**, con un máximo de tres secciones en paralelo y colocación densa desactivada.
2. Coloca `headlines` en una sección de anchura tres; `overview` y `summaries` en una de anchura uno, y `hourly` en una de anchura dos.
3. Añade `daily_tiles` a otra sección de anchura tres.
4. Termina con `radar` en una sección de anchura dos y `day_summary` en otra de anchura uno.
5. Añade el botón siguiente a una sección de anchura tres si utilizas Browser Mod.

En cada tarjeta usa `grid_options: {columns: full}` para ocupar su sección. Con una única localidad, la selección automática es suficiente. Con varias, elige la misma localidad desde cada editor. Puedes configurar también el sensor exterior de comparación y las preferencias de planificación; no se selecciona ningún sensor privado automáticamente.

```yaml
type: button
name: Estación, Microclima e histórico
icon: mdi:chart-timeline-variant
icon_height: 28px
show_state: false
grid_options:
  columns: full
tap_action:
  action: fire-dom-event
  browser_mod:
    service: browser_mod.popup
    data:
      title: Estación, Microclima e histórico
      size: wide
      style: >-
        --popup-wide-width: min(1040px, 94vw);
        --popup-max-width: 1040px;
        --popup-padding-x: 0px;
        --popup-padding-y: 0px;
      content:
        type: vertical-stack
        cards:
          - type: custom:euskalmet-local-card
            mode: comparison
          - type: custom:euskalmet-local-card
            mode: microclimate
          - type: custom:euskalmet-local-card
            mode: history
```

Con varias localidades, añade el mismo `entry_id` a las tres tarjetas del modal. Para comparar con tu sensor exterior, añade `comparison_entity` a la tarjeta `comparison`, con el identificador de tu sensor. Microclima requiere su configuración y suficientes datos; no se activa ni se valida por abrir el modal.

## Sobre las imágenes

Las capturas públicas usan las tarjetas reales con **datos meteorológicos y estadísticos simulados**; también se simula la lluvia del radar. Ortuella identifica el municipio, no la posición de una vivienda. El estado «Validado» de Microclima es un escenario ficticio, no un resultado de precisión de una casa real.

La vista independiente de documentación reproduce el modal con un diálogo del navegador y algunos iconos auxiliares simplificados; en HA se usa Browser Mod y los iconos de HA. Para repetir las capturas, ejecuta `python tools/preview_server.py` y abre `http://localhost:8793/preview.html?view=page`; añade `&lang=eu` para euskera. Revisa también un ancho de 390 px y el botón del modal.

[Escritorio](preview.jpg) · [Móvil](preview-mobile.jpg) · [Modal](detail-modal.jpg) · [Modal móvil](detail-modal-mobile.jpg).
