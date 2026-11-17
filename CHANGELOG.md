# Cambios

## 0.2.0 · Microclima

- Asistente opcional para elegir un sensor exterior propio, sin identificadores escritos a mano, con confirmación de su ubicación. Compatible con sensores en °C y °F.
- Motor local independiente: pares de medias horarias, diferencias por hora y día/noche según la posición del Sol, cobertura y validación temporal.
- Aprende con al menos cinco días y se comprueba con otros dos días completos. Solo publica una estimación si el error absoluto medio mejora al menos 0,2 °C y un 10 %, con mejora en ambos días de prueba. No sustituye ni corrige la previsión oficial.
- Seis entidades y una tarjeta Microclima en el editor visual y en el panel completo. Lecturas y estimación se actualizan sin recargar.
- Cambio de sensor, estación o localidad reinicia el periodo; un reinicio normal de HA lo conserva. No se reutiliza histórico anterior a la activación.
- Datos y procesamiento dentro de HA, sin peticiones adicionales a Euskalmet. Función desactivada por defecto y textos en castellano/euskera.

## 0.1.11

- Retirados el radar compilado obsoleto `weather-radar-card-euskalmet.js`, que no se registraba ni se utilizaba, y el README antiguo de frontend con rutas `/euskalmet_static/`.
- El radar integrado de Eguraldi conserva su código fuente y Leaflet. Se mantienen las licencias y atribuciones correspondientes.
- README en castellano y euskera actualizado: la solicitud del catálogo general de HACS está cerrada; instalación y actualizaciones disponibles mediante repositorio personalizado.

## 0.1.10

- Comparación de temperaturas con mínima azul y máxima naranja en ambos sensores. La media mantiene su color neutro.
- Selectores propios de medida y mes/año, con fondo oscuro, buen contraste, teclado y cierre con Escape o al tocar fuera. Fechas en castellano y euskera.
- Cambiar de mes descarta las respuestas pendientes del mes anterior.
- Capturas de comparación e histórico actualizadas en castellano y euskera.

## 0.1.9

- Resumen de hoy con temperatura mínima azul y máxima naranja, igual que la semana visual.
- Capturas del resumen en ambos README.

## 0.1.8

- Máximas y mínimas de la semana visual al mismo tamaño y peso, también en móvil. Máximas en naranja y mínimas en azul.
- Capturas de previsión actualizadas en ambos idiomas.

## 0.1.7

- Radar integrado con el fondo azul, tipografía y controles del resto de Eguraldi, sin panel negro interior ni cabecera añadida.
- El mapa reajusta su tamaño al cambiar de columna o pantalla; el botón de ubicación vuelve a centrarlo correctamente.
- Tarjetas sin comentarios inferiores. Se mantiene la atribución de Leaflet y del mapa.
- Previsión diaria con máxima y mínima identificadas y barras que representan cada rango sobre una escala común de la semana.
- Capturas del radar, comparación, histórico y previsiones actualizadas en castellano y euskera, con datos de demostración.

## 0.1.6

- El punto y el nombre de la ubicación del radar forman un único marcador, para que permanezcan unidos al mover, ampliar o redimensionar el mapa.

- Comparación de temperaturas propia: gráfico integrado, valores actuales, mínima/media/máxima y diferencia media de intervalos coincidentes. Estadísticas de HA cada cinco minutos, con unidades unificadas.
- Histórico mensual integrado con tarjetas de resumen, controles más claros y etiquetas legibles. El mes actual termina en el día de hoy.
- Los valores ausentes no se convierten en cero ni se conectan líneas a través de huecos.
- Documentación y capturas en castellano y euskera.

## 0.1.5

- La previsión diaria oculta la fila de lluvia en los días sin datos publicados, sin mostrar gotas ni rayas. Los valores publicados de cero se conservan.

## 0.1.4

- Carga versionada de los componentes de avisos, histórico y radar para evitar conservar componentes anteriores tras actualizar.
- La vista integrada de avisos usa su propio elemento Eguraldi y conserva el elemento anterior para configuraciones existentes.

## 0.1.3

- Tres vistas independientes nuevas: gráfico de temperatura/lluvia de 24 horas, semana visual y planificador con radar desplegable.
- Datos ausentes sin interpolaciones ni probabilidades inventadas; viento y rachas diferenciados.
- Radar con satélite predeterminado y sin título superior; estilo seleccionable en el editor.
- Avisos integrados con una sola cabecera y sin tarjeta anidada.
- Diseño adaptable a móvil, textos en castellano/euskera y documentación actualizada.

## 0.1.2

- Banner propio de Eguraldi con la identidad de GOG23 Software Studio.
- README completo en castellano y euskera, con enlaces para cambiar de idioma.
- Tarjetas y editor visual en euskera según el perfil de HA, con actualización al cambiar el idioma.
- Completadas las traducciones de localidad, recomendaciones, estaciones y errores; controles históricos y marcador del radar coherentes con el idioma.
- Los nombres de localidades, estaciones y textos oficiales del proveedor se mantienen.

## 0.1.1

- Capturas actuales de escritorio, móvil y editor visual con datos simulados.
- Descripción más precisa del proyecto, documentación con codificación UTF-8 y enlace de apoyo voluntario Buy Me a Coffee.
- Publicación preparada para solicitar inclusión en el catálogo general de HACS.

## 0.1.0

- Primera versión pública para instalar mediante repositorio personalizado de HACS.

- Editor visual con selección de localidad, tipo de tarjeta, zoom del radar y sensor de comparación.

- Guía de instalación, plantillas de ayuda y publicación automática del paquete con suma SHA-256.

- Licencias incluidas también dentro del componente y diagnósticos más seguros.

## 0.1.0b15

- Botón Mi ubicación en el radar para recuperar el centro y zoom local tras desplazar el mapa o ver la cobertura, sin reiniciar la animación.

## 0.1.0b14

- El radar se centra automáticamente en la ubicación elegida con zoom local 10. Se actualiza al cambiar de localidad y respeta el desplazamiento o zoom manual entre actualizaciones.

- Ver cobertura mantiene disponible la vista regional.

## 0.1.0b13

- La tarjeta muestra la humedad original de Euskalmet, incluso fuera del rango habitual, sin el bloque de aviso ni los textos explicativos inferiores. Los atributos de calidad del sensor se conservan.

- El radar marca la ubicación seleccionada con un punto y su nombre permanente; el marcador se actualiza al cambiar de localidad.

## 0.1.0b12

- Ubicación de Home Assistant como opción predeterminada; municipio detectado localmente con geoEuskadi, sin enviar coordenadas a un geocodificador.

- La entrada vinculada a HA sigue sus cambios de ubicación y mantiene la elección manual de estación.

- Añadir otras localidades reutilizando en HA una cuenta guardada, sin volver a introducir ni mostrar la clave.

## 0.1.0b11

- Cambio de localidad desde opciones: confirma el municipio y actualiza la misma entrada, las tarjetas, previsión y avisos.

- Al guardar una localidad se elige la estación compatible geográficamente más cercana; se mantiene el cambio manual y el retorno a automática.

- Conserva los IDs de entidades y rechaza localidades duplicadas sin modificar la configuración actual.

- La tarjeta de ambiente usa la captadora de polen activa de la nueva localidad.

## 0.1.0b10

- Modos de tarjeta por localidad para histórico, resúmenes, comparación, radar, avisos y ambiente; refrescan su fuente al cambiar de estación.

- El histórico invalida la caché al cambiar de estación y descarta respuestas antiguas pendientes, conservando el mes seleccionado.

- Encabezados por localidad y origen de los datos indicado por separado.

## 0.1.0b9

- Las tarjetas abiertas actualizan estación y distancia al guardar un cambio de estación, sin recargar la tarjeta ni perder la localidad. Renuevan las suscripciones de previsión y liberan las anteriores.

## 0.1.0b8

- Bajo la localidad se indica en letra pequeña dónde se realizan las mediciones y la distancia respecto al municipio seleccionado.

## 0.1.0b7

- Validación estática del cambio de dispositivo por localidad. Sustituye a las betas b5 y b6.

## 0.1.0b6

- El tiempo pertenece a un dispositivo con el nombre de la localidad; la estación conserva su propio dispositivo como fuente. Evita que HA anteponga la estación al municipio y mantiene los IDs existentes.

## 0.1.0b5

- La entidad de tiempo y los encabezados de radar e histórico muestran la localidad elegida. La estación sigue identificada como fuente de las observaciones.

## 0.1.0b4

- Enlace del asistente compatible con la validación de traducciones de Home Assistant.

## 0.1.0b3

Enlace directo para obtener las claves en el asistente y la reautenticación; recomendación de acceso con Google ante problemas del correo de activación. Título de las nuevas entradas corregido a Eguraldi.

## 0.1.0b2

Nuevo nombre público: Eguraldi. Se mantienen el dominio y las referencias de tarjetas para compatibilidad con la primera beta.

## 0.1.0b1

Primera beta independiente: asistente por localidad, recomendación explicable con cambio manual, separación de localidad de previsión y estación de observación, control de humedad fuera de rango, tarjetas propias con iconos incluidos y cuadrícula compacta de 24 horas. Base de API MIT atribuida a Mitxol.
