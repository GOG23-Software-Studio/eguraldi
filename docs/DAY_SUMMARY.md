# Tu día con Eguraldi

Desde 0.7.0. Vista `day_summary` del editor visual y pestaña **Tu día** del panel completo. Reúne cuatro decisiones para la localidad elegida:

- **Salir:** la mejor franja para un paseo de 60 minutos en las próximas 24 horas.
- **Tender fuera:** la mejor ventana de tres horas, distinguiendo la orientación parcial cuando falta humedad horaria.
- **Lavar vehículo:** el mejor día entre los próximos siete, con los límites de la previsión diaria ya explicados en la tarjeta de lavado.
- **Avisos de tu localidad:** nivel oficial vigente o estado de datos no disponibles.

Cada bloque abre o cierra su tarjeta de detalle dentro del resumen, sin cambiar de panel. Los detalles mantienen la misma localidad. Los horarios incluyen fecha: una franja puede corresponder a hoy o mañana y no se etiqueta falsamente como «hoy». Los modelos de recomendación son los mismos que en las tarjetas independientes, no un algoritmo nuevo.

```yaml
type: custom:euskalmet-local-card
mode: day_summary
```

Con varias localidades, elige una en el editor o fija `entry_id`. El complemento opcional de humedad puede elegirse en el editor igual que en Tender fuera: debe ser una previsión de la misma localidad y solo se utiliza su humedad. Sin él no se inventa humedad futura ni se utiliza la lectura actual como pronóstico.

Las opciones avanzadas existentes `drying_hours`, `outing_activity` y `outing_minutes` también se transmiten al detalle. Los controles dentro del detalle permiten explorar otras opciones, sin guardar cambios en el resumen ni en las demás tarjetas.

## Datos ausentes y avisos

Un bloque sin datos suficientes se diferencia de «Mejor esperar». La caducidad de la previsión horaria no impide consultar un resumen diario vigente ni los avisos si siguen disponibles, y viceversa.

Para confirmar avisos se requiere una descarga completa y correcta de como máximo 45 minutos, sin fallo posterior de su actualización. Una respuesta vacía válida significa «Sin avisos activos»; una respuesta inválida o parcial no. La hora de la última descarga y su vigencia están en los atributos `alerts_updated` y `alerts_stale` de la entidad meteorológica. Si no se pueden verificar, el resumen lo indica y no presenta un estado verde de ausencia de avisos. Los sensores estándar de nivel y presencia de avisos también pasan a no disponibles cuando caduca la consulta o falla su actualización.

Esta tarjeta no envía notificaciones ni activa sesiones de ropa tendida. No incorpora consultas adicionales a la API de Euskalmet: utiliza los datos que la integración ya actualiza. Microclima continúa aprendiendo por separado y no corrige estas previsiones.

Las capturas del README son demostraciones con datos simulados. La tarjeta es una orientación meteorológica, no una garantía sobre el tiempo ni sobre las actividades.
