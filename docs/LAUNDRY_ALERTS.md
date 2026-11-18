# Avisos de ropa tendida

Disponibles desde Eguraldi 0.5.0. **Desactivados por defecto**, independientes para cada localidad. Funcionan dentro de Home Assistant aunque la tarjeta no esté abierta; no necesitan Microclima, humedad de otro proveedor ni un sensor propio.

## Configurar desde Home Assistant

1. Abre **Ajustes → Dispositivos y servicios → Eguraldi → Configurar → Avisos de ropa tendida** en la entrada de tu localidad.
2. Elige un destino: una entidad de notificaciones, un servicio específico como el de tu móvil, o las notificaciones internas de Home Assistant. Debe estar configurado previamente en HA. No se selecciona ningún móvil automáticamente ni se utiliza el envío genérico `notify.notify`.
3. Configura lluvia o tormenta y/o viento fuerte. El umbral de viento es ajustable entre 10 y 100 km/h; por defecto, 30 km/h.
4. Elige antelación de 15, 30 o 60 minutos, horario permitido e intervalo mínimo de 30, 60, 120 o 240 minutos. Por defecto: 30 minutos, 08:00–22:00 y 120 minutos. Se usa la zona horaria de HA. Un horario puede cruzar medianoche; inicio y fin iguales permiten todo el día.
5. Activa los avisos y guarda. Esto **no inicia el seguimiento**.
6. Cuando tiendas, pulsa **Tengo ropa tendida** en la tarjeta **¿Puedo tender fuera?**. Al recogerla, pulsa **Ya he recogido la ropa**. También puedes usar la entidad interruptor del mismo nombre desde HA o en tus automatizaciones.

La sesión caduca a las 24 horas. Desactivar los avisos, cambiar de localidad, coordenadas, estación o destino cancela la sesión; hay que marcar de nuevo que tienes ropa fuera. Cambiar otras preferencias mantiene la sesión. Un reinicio conserva una sesión válida, los riesgos ya avisados y el intervalo mínimo. Los destinos no se exponen en las tarjetas ni en sus atributos.

## Qué detecta y qué límites tiene

Se revisa cada minuto la previsión horaria que Eguraldi ya descarga: precipitación superior a cero o símbolos de lluvia/tormenta, y viento medio previsto por encima del umbral (incluida la igualdad). La API expresa el viento en m/s y Eguraldi lo convierte a km/h. No se inventan probabilidades, rachas ni una predicción de resolución inferior a una hora.

Se incluye el bloque horario en curso y el siguiente cuando entra en el margen elegido. La hora indicada es la del **bloque de previsión**, no un minuto exacto de llegada de la lluvia. No sustituye la observación real ni garantiza que la ropa no se moje. Las previsiones no son específicas de un balcón.

Solo avisa si los avisos están activados, la ropa está marcada fuera, el horario permite avisos y el destino sigue disponible. Se pausa si la última descarga correcta supera dos horas o la emisión del documento supera doce horas. Fuera de horario no se encolan avisos antiguos: se reevalúa la previsión al volver al horario permitido.

Cada riesgo —lluvia y viento— avisa una sola vez por sesión. Si coinciden en el mismo bloque, se agrupan. El intervalo mínimo también impide avisos seguidos al iniciar otra sesión. No se generan notificaciones de prueba al configurar.

Para evitar duplicados tras un reinicio o una respuesta de entrega incierta, el intento se guarda **antes** de enviarlo. Si falla, la tarjeta muestra «No se ha podido confirmar la entrega del aviso» y ese riesgo no se reenvía automáticamente durante la sesión. Revisa el destino antes de iniciar una nueva sesión. «Aviso enviado» significa que HA aceptó la acción; no confirma que el teléfono lo haya mostrado.

Home Assistant permite [notificaciones mediante entidades](https://www.home-assistant.io/actions/notify.send_message/) y [servicios de notificación de sus integraciones](https://www.home-assistant.io/integrations/notify/).

## Capturas

Las capturas del README usan datos simulados y muestran la función desactivada. Para ver los controles activos en la demostración local se puede abrir `preview.html?view=drying&alerts=enabled`; esta demostración no envía mensajes.
