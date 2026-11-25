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
