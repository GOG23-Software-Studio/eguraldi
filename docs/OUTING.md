# La mejor hora para salir

Eguraldi 0.4.0 incorpora la vista `outing`. Se configura desde el editor visual de Eguraldi y también está en la pestaña Salir del panel completo.

```yaml
type: custom:euskalmet-local-card
mode: outing
outing_activity: walk  # walk, sport, family
outing_minutes: 60     # 30, 60, 90
```

Con varias localidades, selecciona la ubicación en el editor (se guarda su `entry_id`). Los controles de actividad y duración cambian la exploración de la sesión; los valores YAML indican la selección inicial. Los datos son de la previsión horaria de Euskalmet para esa localidad. No utiliza lecturas actuales como previsiones ni el ajuste de Microclima, que no valida pronósticos.

## Qué se muestra

- Mejor franja y hasta dos alternativas sin solapamiento, dentro de las próximas 24 horas.
- Consejos de paraguas y chaqueta, lluvia horaria máxima de los bloques atravesados, temperatura mínima y máxima y viento máximo.
- Clasificación de franjas, selección por ratón o teclado y motivos de aceptación, rechazo o datos insuficientes.
- Primer empeoramiento de lluvia, temperatura o viento durante las seis horas posteriores a la mejor franja. Se detiene al encontrar un hueco; si no detecta cambios, indica hasta qué hora se comparó. Si faltan datos posteriores, lo dice.

## Resolución temporal y huecos

Los inicios se exploran en pasos de 30 minutos desde el siguiente paso futuro. La fuente sigue siendo **horaria**: 10:00 y 10:30 comparten el mismo bloque de previsión. Una salida de 90 minutos puede atravesar dos o tres bloques y debe superar la evaluación en todos. No se interpola precipitación ni viento. La lluvia mostrada es el máximo acumulado del bloque horario (`mm/h`), no una cantidad predicha para cada media hora.

Se emparejan y recorren marcas UTC, manteniendo la duración real también en cambios de horario. Las etiquetas usan la zona horaria de HA. La ventana no cruza huecos de lluvia, temperatura o viento. Datos desconocidos, booleanos, unidades no compatibles y valores inválidos no se convierten en ceros. La tarjeta revisa el horizonte cada minuto mientras está abierta y cancela suscripciones al desconectarse. Cambiar localidad renueva los datos e ignora las respuestas anteriores.

## Reglas orientativas

Son criterios de producto para comparar tiempo meteorológico, no una evaluación de seguridad, salud, accesibilidad o estado del terreno. Los límites son conservadores y no oficiales.

| Actividad | Temperatura descartada | Viento descartado | Racha descartada | Temperatura ideal interna |
|---|---|---|---|---|
| Paseo | ≤ 0 °C o ≥ 32 °C | ≥ 35 km/h | ≥ 50 km/h | 18 °C |
| Deporte | ≤ 2 °C o ≥ 28 °C | ≥ 30 km/h | ≥ 45 km/h | 14 °C |
| Con niños | ≤ 5 °C o ≥ 30 °C | ≥ 25 km/h | ≥ 40 km/h | 20 °C |

Todas las actividades descartan tormenta, granizo, condiciones excepcionales, lluvia intensa, nieve/aguanieve y niebla. Una probabilidad de lluvia publicada de al menos 60 % también descarta la hora. En paseo se admite lluvia débil de hasta 0,2 mm/h como aceptable, con paraguas; en deporte o con niños se descarta cualquier lluvia positiva y la condición de lluvia, incluso con acumulación redondeada a cero.

El índice interno parte de 100, resta hasta 45 puntos por distancia a la temperatura ideal (3 por °C), hasta 25 por viento proporcional al límite de la actividad y 30 si se aconseja paraguas. La noche resta 10 puntos (20 con niños). Desde 65 puntos y sin indicación de paraguas, la hora es favorable; el resto de horas no descartadas son aceptables. La mejor franja exige que todas sus horas sean válidas. Primero se ordenan las favorables y después las aceptables; dentro de cada categoría se usa la media del índice ponderada por el tiempo atravesado en cada bloque, y la hora más cercana en los empates. El índice no se presenta como probabilidad de éxito.

Se aconseja paraguas con lluvia positiva, condición de lluvia o probabilidad publicada ≥ 20 %. Se aconseja chaqueta por debajo de 16 °C, o por debajo de 20 °C con viento de al menos 20 km/h. Son orientaciones generales, no instrucciones personales.

El empeoramiento posterior compara contra el último bloque de la mejor franja: aparición de lluvia, nueva indicación de paraguas, descenso de al menos 3 °C o aumento de viento de al menos 10 km/h (o llegada al límite de la actividad). No se afirma qué sucede donde faltan datos.

## Demostración

`python tools/preview_server.py`, después `http://127.0.0.1:8793/?view=outing`. `&lang=eu` activa euskera y `&state=missing` ilustra datos de lluvia ausentes. Las capturas públicas son simuladas y no publican ubicaciones privadas.
