# Microclima · primera versión

Microclima compara una temperatura exterior de tu vivienda con la estación de la localidad. Es opcional, local y está desactivado por defecto. Cada entrada de Eguraldi tiene su propio sensor, periodo de aprendizaje y resultados.

## Configurar

En Ajustes → Dispositivos y servicios → Eguraldi → Configurar → Microclima de tu casa:

1. Activa Microclima.
2. Selecciona un sensor exterior de temperatura en °C o °F que tenga estadísticas de medición en HA.
3. Confirma que está al exterior y protegido del sol directo.

No uses un sensor interior ni una entidad de Eguraldi como referencia exterior. Una validación satisfactoria significa que el modelo reproduce mejor ese sensor; no certifica su exactitud ni corrige una instalación inadecuada.

La tarjeta de tiempo actual añade un bloque desplegable. También puedes elegir Microclima en el editor visual, o usar `mode: microclimate` y la entrada correspondiente. El panel completo incorpora una pestaña Microclima.

## Qué aprende y cómo se comprueba

- Lee únicamente las estadísticas horarias locales de la estación y el sensor elegido, convertidas a °C.
- Usa solo horas completas con datos válidos de ambos sensores y posteriores a la activación o al último cambio de origen. No rellena huecos ni convierte valores ausentes en cero.
- Ventana móvil máxima de 28 días. Las diferencias por hora se calculan con una mediana en una ventana de ±1 hora del reloj local, con al menos cuatro fechas y doce muestras. Si faltan, el patrón inicial usa la mediana global.
- Clasifica día y noche con la elevación solar en las coordenadas de la localidad, calculada localmente con Astral.
- Reserva los dos últimos días locales completos para validar; no se usan para entrenar el modelo aplicado. Requiere al menos 72 horas de entrenamiento repartidas en cinco fechas con ocho horas por fecha, y doce horas coincidentes en cada día de validación.
- Compara el error absoluto medio de la estación con el de la estimación. Solo se activa si baja al menos 0,2 °C y un 10 %, con mejora en los dos días por separado.
- Publica el error de validación y el percentil 90 de los errores absolutos observados. Este percentil es descriptivo, no una garantía ni un intervalo probabilístico de previsión.

La validación se refiere a **reconstruir observaciones horarias**, no a acertar la previsión futura. La previsión oficial y las observaciones originales se mantienen separadas. No se presentan probabilidades de lluvia ni mejoras de previsión que no se hayan medido.

## Estados y entidades

- **Aprendiendo:** faltan días u horas para una comprobación temporal válida.
- **Validado:** el modelo ha superado los criterios de mejora.
- **Sin mejora demostrada:** hay datos suficientes, pero no supera todos los criterios. No se publica una temperatura estimada.
- **Histórico no disponible:** Recorder no está disponible o no se puede consultar.

Se crean seis sensores: estado, diferencia media, diferencia actual, temperatura estimada, error de validación y cobertura. La temperatura estimada queda sin valor hasta superar la validación. También se retira si la referencia no es reciente o no hay pares de datos de las últimas 24 horas. Las diferencias se expresan en °C sin aplicar conversiones de temperatura absoluta.

La diferencia actual exige dos lecturas recientes y separadas como máximo quince minutos. Un sensor que solo notifique cambios puede aparecer sin lectura reciente: esto se muestra como dato ausente, no como cero.

## Conservación y reinicio

Un reinicio normal conserva el origen y la fecha de inicio. Cambiar sensor, estación o localidad crea un periodo nuevo, incluso al volver a una estación anterior: los identificadores de HA pueden contener datos históricos de estaciones distintas.

No se reutiliza el historial anterior a la activación porque no se puede garantizar su origen. Desactivar y reactivar inicia otro periodo. Los datos de Recorder y la configuración no se borran al desactivar Microclima.

Recorder debe estar activo y recoger ambas entidades. Si se excluyen de Recorder o faltan estadísticas, no se inventan datos. Con pocas lecturas, el aprendizaje puede tardar más de siete días.

## Privacidad y funcionamiento

No hay modelos en la nube, telemetría ni envío de mediciones a terceros. No se hacen consultas adicionales a Euskalmet. Solo se lee Recorder; la integración no importa ni modifica estadísticas anteriores. Conserva localmente una huella del origen y la fecha inicial; no guarda credenciales nuevas.

Las estadísticas se revisan cada treinta minutos. Las lecturas actuales cambian al actualizarse los sensores, con una comprobación de antigüedad cada cinco minutos.

La acción administrativa `euskalmet_local.configure_microclimate` permite configurar lo mismo que el asistente, con las mismas validaciones y confirmación de sensor exterior. No concede acceso nuevo y solo admite entradas de Eguraldi.

## Desarrollo y vista de demostración

`python tools/preview_server.py` sirve una demostración en `http://127.0.0.1:8793/?view=microclimate`. Añade `&state=learning` para ver el aprendizaje o `&lang=eu` para euskera. Todos los valores de esa vista son simulados y están marcados como tales; no representan resultados de una vivienda real.

## Gráfico de validación y progreso

La tarjeta muestra las tres series de medias horarias de los dos últimos días locales completos: estación (azul), sensor exterior (naranja) y reconstrucción local (verde discontinuo). El ajuste se calcula exclusivamente con los días anteriores. Toca una hora o selecciónala con el teclado para consultar los tres valores. Los huecos sin pares de datos interrumpen las curvas.

El gráfico aparece cuando hay datos suficientes para ejecutar la validación, incluso si el resultado no mejora: se muestran el error absoluto medio de ambas alternativas, el porcentaje de reducción, los errores de cada día y las tres condiciones de aceptación. Una reconstrucción rechazada nunca activa la estimación actual.

El progreso muestra horas de entrenamiento (mínimo 72), días de entrenamiento con al menos 8 horas (mínimo 5) y días de validación con al menos 12 horas (los dos últimos días completos). No es una cuenta atrás ni una probabilidad de acierto. Los periodos se recalculan cada día; llenar las barras solo permite comprobar la mejora, no garantiza que el modelo sea aceptado. Mientras aprende se muestra el progreso sin inventar curvas o porcentajes de mejora.
