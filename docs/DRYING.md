# ¿Puedo tender fuera?

Vista incluida en Eguraldi desde 0.3.0. Funciona con cualquier localidad configurada, sin sensores propios ni Microclima. Se añade desde el editor de la tarjeta Eguraldi, vista **¿Puedo tender fuera?**, o desde la pestaña **Tender fuera** del panel completo.

```yaml
type: custom:euskalmet-local-card
mode: drying
drying_hours: 3
# Opcional, solo si pertenece a la misma localidad:
# humidity_forecast_entity: weather.forecast_home
# humidity_forecast_locality: Ortuella
```

Con varias localidades, fija `entry_id` en el editor. La selección del complemento de humedad es explícita y debe corresponder a la misma localidad; no se elige una entidad ajena automáticamente. El editor vincula el complemento al nombre de localidad elegido. Si cambia, queda desactivado hasta revisar la selección; en YAML, añade `humidity_forecast_locality` para conservar esa protección tras recargar el navegador. Mientras una tarjeta permanece montada, también detecta el cambio de coordenadas y deja de mezclar fuentes. El complemento solo proporciona humedad: lluvia, temperatura y viento siguen siendo los de Euskalmet. La tarjeta identifica ambas fuentes.

## Datos y comportamiento

- Busca ventanas de 2, 3 o 4 horas **completas futuras**, dentro de las próximas 24 horas. La hora actual incompleta se excluye. La duración no representa el tiempo que necesitará una prenda para secarse.
- Muestra la mejor ventana, hasta dos alternativas que no se solapan, horas por colores e iconos animados, y los datos y motivos de la hora seleccionada.
- El resumen de la ventana muestra lluvia total, humedad media, temperatura media y viento máximo. La humedad media queda sin datos si falta en alguna de sus horas.
- Se utilizan horas coincidentes en UTC para combinar la humedad complementaria; no se interpolan datos ni se rellenan huecos con observaciones actuales. La humedad del propio pronóstico tiene prioridad si existe.
- La previsión que expone Eguraldi actualmente no publica humedad horaria. Sin complemento, las ventanas son **orientativas** y no se califican como favorables. Si faltan lluvia, viento o temperatura, esa hora no entra en ninguna ventana.
- Si la entidad principal está no disponible, no se recomiendan ventanas. Si falla el complemento o no dispone de humedad coincidente, se vuelve a la orientación parcial. Los cambios de localidad renuevan las suscripciones y descartan respuestas anteriores.
- Cada minuto se revisa el horizonte temporal mientras la tarjeta permanece abierta. La tarjeta no contacta proveedores externos directamente ni gestiona credenciales o envía ubicaciones: lee las previsiones de entidades ya configuradas en HA.

## Reglas orientativas, no un modelo de tiempo de secado

Estos umbrales son decisiones conservadoras de producto de Eguraldi; no son límites oficiales ni una validación física del secado de ropa.

1. Se descarta una hora si hay cualquier precipitación positiva, una condición de lluvia/nieve/granizo/tormenta, o probabilidad publicada de precipitación de al menos 40 %.
2. También se descarta con viento sostenido de al menos 30 km/h, racha publicada de al menos 45 km/h, temperatura de 2 °C o menos, humedad de al menos 90 % o niebla.
3. El resto se ordena con temperatura (30 %), brisa (25 %) y humedad (45 %). Los factores se acotan entre 0 y 1: temperatura `(T−2)/23`, brisa `viento/12`, sequedad `(90−HR)/50`. De noche se multiplica por 0,75; con probabilidad publicada de lluvia entre 20 % y menos de 40 %, por 0,7.
4. Menos de 35 puntos significa secado lento y no se ofrece como ventana. De 35 a menos de 65 se clasifica como aceptable y desde 65 como favorable. El índice es interno: no se presenta como probabilidad de éxito.
5. Sin humedad horaria se combinan temperatura (55 %) y brisa (45 %), con un máximo de 65 puntos y las mismas penalizaciones. La etiqueta siempre será parcial, aunque el resultado sea alto.

El calor, el movimiento de aire y la humedad influyen en el secado; véase la descripción de parámetros de [Netweather](https://www.netweather.tv/weather-forecasts/uk/drying-guide/). Esa base general no valida nuestros umbrales. La exposición del tendedero, sombra, tejido, centrifugado y las rachas locales pueden cambiar mucho el resultado. La tarjeta no utiliza el ajuste de temperatura de Microclima como corrección de previsión, ya que ese ajuste valida observaciones y no pronósticos.

## Demostración

`python tools/preview_server.py` y `http://127.0.0.1:8793/?view=drying`. Añade `&state=limited` para el caso sin humedad o `&lang=eu` para euskera. Todos los valores de demostración y las capturas del README son simulados.
