# Cambios

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
