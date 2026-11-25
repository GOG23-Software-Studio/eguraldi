# Estilo común de las tarjetas

Desde 0.11.0 las tarjetas siguen una misma jerarquía visual, comprobada en la interfaz de escritorio y en un ancho móvil de 390 px con datos simulados:

- Título: **Localidad · nombre de la tarjeta**, 20 px en escritorio, 18 px en móvil, peso 600 y altura de línea 1,3.
- Subtítulos de contenido: 14 px, peso 600 y altura de línea 1,4.
- Familia de letra: la configurada en Home Assistant (`primary-font-family`), con `system-ui` como alternativa.
- Marco exterior: fondo azul oscuro, borde discreto y radio de 22 px.
- Márgenes: 20 px en escritorio y 16 px en móvil donde el contenido lo permite; las rejillas horarias conservan su tamaño compacto.
- Temperaturas mínima y máxima: azul y naranja, respectivamente, también en los resúmenes del histórico. Los valores numéricos destacados conservan su jerarquía propia.
- Las lecturas de temperatura, medias del histórico y diferencia media visible usan hasta un decimal. Los datos originales y los cálculos no se redondean; las métricas de validación pueden conservar más precisión.

Se eliminan los antetítulos de promoción y la repetición de la localidad antes del título. Las referencias de estación y distancia siguen debajo, con formato secundario, cuando corresponden a mediciones.

Se mantienen dos excepciones deliberadas: **Titulares** conserva una sola línea con la localidad como encabezado compacto, y el **radar** sigue sin título por defecto. Los iconos de pausa y reproducción son iconos reales también en el radar.

La revisión cubre el resumen Tu día, tiempo actual, resumen de hoy, comparación, gráfico y rejilla horaria, las dos previsiones diarias, planificación, secado, salidas, lavado, histórico, Microclima, costa y ambiente, las vistas de avisos y el radar.

Las capturas públicas usan datos simulados. Las capturas de la instalación personal no se publican en el repositorio.
