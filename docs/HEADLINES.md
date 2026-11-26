# Titulares de Eguraldi

Disponible desde 0.12.0 como una vista propia de la tarjeta Eguraldi. Combina información del hogar y avisos oficiales en el carrusel de una línea. Los cuatro diseños de la tarjeta de avisos siguen disponibles por separado.

La cabecera muestra **EGURALDI** y la localidad, sin añadir «Titulares». Cada mensaje lleva una etiqueta de tema; los avisos oficiales conservan sus colores y periodo.

## Configurar sin YAML

En el editor de la tarjeta, selecciona **Titulares de Eguraldi** y la localidad. En **Temas y orden de titulares** puedes activar o desactivar tiempo actual, lluvia, viento, mínimas/máximas previstas, planes, Microclima, actualizaciones y avisos. Las flechas cambian el orden de los temas; los avisos oficiales habilitados se sitúan primero, ordenados por periodo y nivel.

Ajusta velocidad y longitud. Para mostrar una actualización, elige expresamente la **entidad de actualización de Eguraldi** de tu instalación. No se selecciona una entidad automáticamente ni se instala nada al pulsar el titular. Las preferencias de salida, duración y ventana de secado reutilizan los mismos modelos que las tarjetas de recomendaciones. La humedad complementaria opcional tiene la misma vinculación a localidad.

El idioma sigue el perfil de HA: castellano o euskera. Cada tarjeta conserva su configuración y localidad; no modifica las preferencias de otros usuarios ni crea notificaciones.

## Qué puede contar

- Temperatura y humedad actuales de la estación, cuando la observación tiene menos de 45 minutos. No son lecturas del interior de casa.
- Lluvia prevista en un bloque horario, o una secuencia de horas con precipitación explícitamente cero. Los huecos, horas duplicadas o lluvia desconocida interrumpen la secuencia; no se promete una hora exacta de llegada.
- Probabilidad horaria o diaria **solo si la fuente la publica**. Los milímetros nunca se transforman en porcentajes. Con los datos habituales de Euskalmet puede no aparecer ningún porcentaje.
- Viento actual y máximo de las próximas horas con datos, con las unidades publicadas por HA.
- Mínima y máxima previstas para hoy, diferenciadas de los extremos ya medidos.
- Ventanas para salir o tender, y día para lavar el vehículo, reutilizando las recomendaciones existentes y sus límites. Una orientación de secado sin humedad se identifica como parcial.
- Estado de Microclima y horas de aprendizaje disponibles. «Sin mejora demostrada» no se convierte en una mejora ni en una previsión corregida.
- Una actualización disponible según la entidad seleccionada. La acción de instalación permanece en HA/HACS.

## Avisos, datos ausentes y movimiento

Los avisos habilitados se añaden al mismo carrusel con su color, periodo y comunicado oficial. Si su fuente no está vigente se muestra que no pueden comprobarse; no se anuncia que no hay riesgos. Los titulares de previsión caducada se omiten. Con ningún tema o dato utilizable se muestra un estado vacío, sin inventar cifras.

Pulsar un titular abre su detalle en la propia tarjeta. Se cierra automáticamente después de 30 segundos y reanuda el movimiento. Conserva el manejo con teclado, el arrastre, el botón de pausa y la preferencia de reducción de movimiento del sistema. Las actualizaciones de datos no reinician el plazo del detalle. No hay una región viva anunciando continuamente cada mensaje que pasa.

## Ejemplo YAML

```yaml
type: custom:euskalmet-local-card
mode: headlines
# Con varias localidades, selecciónala desde el editor para guardar entry_id.
headline_topics:
  - current
  - rain
  - wind
  - daily
  - plans
  - microclimate
  - update
  - alerts
headline_speed: 24
headline_length: 160
# Sustituye por la entidad real de Eguraldi en tu instalación.
headline_update_entity: update.eguraldi
```

Temas admitidos: los del ejemplo, sin duplicados. Velocidades del editor: 16, 24 o 36 píxeles por segundo. Longitudes: 100, 160 o 240 caracteres; el detalle conserva el texto completo. `headline_topics: []` desactiva todos los temas. No cambia el comportamiento de `mode: alerts` ni de `alerts_view: headlines`, que siguen mostrando solo avisos.

El cálculo se realiza localmente en el navegador con las entidades y previsiones ya utilizadas por Eguraldi. No añade un servicio meteorológico, un modelo en la nube ni consultas directas desde la tarjeta a la API de Euskalmet.
