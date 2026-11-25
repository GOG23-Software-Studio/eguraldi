# Avisos por fenómeno y periodo

Desde 0.9.0 la tarjeta de avisos distingue el nivel máximo **publicado** por Euskalmet del nivel individual de cada fenómeno. Un documento naranja puede contener un aviso amarillo de viento y una alerta naranja de lluvia.

El nivel individual se extrae únicamente del encabezado oficial en castellano («Aviso Amarillo», «Alerta Naranja», «Alarma Roja»). No se adivina a partir del nivel general del documento. Si no se reconoce, se muestra **Nivel sin confirmar**. Los títulos de los fenómenos y los controles están traducidos a castellano y euskera; el comunicado se muestra en el idioma disponible de la fuente.

## Periodos

La fecha procede de `valid_for` y las horas del encabezado oficial «desde las … hasta las … hora local». Se interpretan en **Europe/Madrid**, la hora local indicada por Euskalmet. No se extraen horarios del cuerpo del texto, que puede describir un acumulado o un intervalo diferente. Las 24:00 se convierten en la medianoche del día siguiente, respetando los cambios de hora.

- **En vigor:** inicio ≤ ahora < fin.
- **Próximos:** todavía no ha comenzado el periodo.
- **Finalizados:** el periodo terminó; quedan plegados.
- **Horario sin confirmar:** faltan fechas u horas verificables, o el formato es ambiguo.

La tarjeta revisa los periodos cada minuto. Agrupa por fenómeno, nivel y zona dentro de cada sección y conserva cada periodo y su comunicado. Elimina únicamente duplicados exactos, sin fusionar textos distintos ni periodos de días diferentes.

El breve extracto es parte del comunicado oficial, con puntos suspensivos si se recorta; no es una predicción nueva. **Ver comunicado oficial** permite consultar el texto completo sin salir de la tarjeta. Si la entidad está no disponible, no se presenta la información anterior como vigente.

El título sigue siendo la localidad elegida; la zona de avisos se indica en pequeño. Estos avisos corresponden a una zona meteorológica, no a una medición en la vivienda. El máximo publicado del sensor estándar mantiene su significado y no se modifica con este diseño.

```yaml
type: custom:euskalmet-local-card
mode: alerts
```

La tarjeta independiente `custom:euskalmet-local-alert-card` también admite la entidad de nivel mediante `entity`. Las capturas del README usan datos simulados.


## Diseños a elegir desde 0.10.0

En el editor visual, selecciona **Avisos** y después **Diseño de los avisos**. En el panel completo y en Tu día, esa elección también se aplica al detalle de avisos. Cada tarjeta guarda su propia elección:

| Diseño | Opción | Presentación |
| --- | --- | --- |
| Lista por periodos | `list` | Vista existente, con comunicados desplegables |
| Banda en movimiento | `ticker` | Tarjetas que avanzan de derecha a izquierda |
| Línea temporal | `timeline` | Periodos proporcionales a su duración y marca de la hora actual |
| Titulares · una línea | `headlines` | Localidad y mensajes en una fila compacta, como noticias |

La vista inicial sigue siendo la lista. Las cuatro utilizan los mismos niveles, fechas y comunicados de Euskalmet, sin consultas adicionales a la API. En la línea temporal, los periodos solapados del mismo fenómeno se colocan en carriles distintos; los horarios sin confirmar se muestran fuera del gráfico.

La banda y los titulares se pausan al interactuar o al abrir un aviso. Se puede pausar o reanudar y navegar con teclado; la banda incluye flechas y ambas admiten arrastrar con el dedo. Respetan la preferencia del sistema de reducir movimiento y se detienen al quedar fuera de pantalla. No se anuncia cada avance a los lectores de pantalla. Al cerrar la tarjeta se liberan animaciones y observadores.

En **Velocidad del movimiento** se puede elegir lenta, normal o rápida. La opción avanzada admite entre 12 y 48 píxeles por segundo, con 24 por defecto.

```yaml
type: custom:euskalmet-local-card
mode: alerts
alerts_view: headlines
alerts_speed: 24
```

En la tarjeta independiente se usan `view` y `ticker_speed`:

```yaml
type: custom:euskalmet-local-alert-card
entity: sensor.mi_nivel_de_aviso
view: timeline
```

También dispone de editor visual para entidad, título, diseño y velocidad. No cambia las preferencias de otras tarjetas ni activa notificaciones.
