# Cambios

## 0.1.0

- Primera versi髇 p鷅lica para instalar mediante repositorio personalizado de HACS.
- Editor visual con selecci髇 de localidad, tipo de tarjeta, zoom del radar y sensor de comparaci髇.
- Gu韆 de instalaci髇, plantillas de ayuda y publicaci髇 autom醫ica del paquete con suma SHA-256.
- Licencias incluidas tambi閚 dentro del componente y diagn髎ticos m醩 seguros.

## 0.1.0b15

- Bot贸n Mi ubicaci贸n en el radar para recuperar el centro y zoom local tras desplazar el mapa o ver la cobertura, sin reiniciar la animaci贸n.

## 0.1.0b14

- El radar se centra autom谩ticamente en la ubicaci贸n elegida con zoom local 10. Se actualiza al cambiar de localidad y respeta el desplazamiento o zoom manual entre actualizaciones.
- Ver cobertura mantiene disponible la vista regional.

## 0.1.0b13

- La tarjeta muestra la humedad original de Euskalmet, incluso fuera del rango habitual, sin el bloque de aviso ni los textos explicativos inferiores. Los atributos de calidad del sensor se conservan.
- El radar marca la ubicaci贸n seleccionada con un punto y su nombre permanente; el marcador se actualiza al cambiar de localidad.

## 0.1.0b12

- Ubicaci贸n de Home Assistant como opci贸n predeterminada; municipio detectado localmente con geoEuskadi, sin enviar coordenadas a un geocodificador.
- La entrada vinculada a HA sigue sus cambios de ubicaci贸n y mantiene la elecci贸n manual de estaci贸n.
- A帽adir otras localidades reutilizando en HA una cuenta guardada, sin volver a introducir ni mostrar la clave.

## 0.1.0b11

- Cambio de localidad desde opciones: confirma el municipio y actualiza la misma entrada, las tarjetas, previsi贸n y avisos.
- Al guardar una localidad se elige la estaci贸n compatible geogr谩ficamente m谩s cercana; se mantiene el cambio manual y el retorno a autom谩tica.
- Conserva los IDs de entidades y rechaza localidades duplicadas sin modificar la configuraci贸n actual.
- La tarjeta de ambiente usa la captadora de polen activa de la nueva localidad.

## 0.1.0b10

- Modos de tarjeta por localidad para hist贸rico, res煤menes, comparaci贸n, radar, avisos y ambiente; refrescan su fuente al cambiar de estaci贸n.
- El hist贸rico invalida la cach茅 al cambiar de estaci贸n y descarta respuestas antiguas pendientes, conservando el mes seleccionado.
- Encabezados por localidad y origen de los datos indicado por separado.

## 0.1.0b9

- Las tarjetas abiertas actualizan estaci贸n y distancia al guardar un cambio de estaci贸n, sin recargar la tarjeta ni perder la localidad. Renuevan las suscripciones de previsi贸n y liberan las anteriores.

## 0.1.0b8

- Bajo la localidad se indica en letra peque帽a d贸nde se realizan las mediciones y la distancia respecto al municipio seleccionado.

## 0.1.0b7

- Validaci贸n est谩tica del cambio de dispositivo por localidad. Sustituye a las betas b5 y b6.

## 0.1.0b6

- El tiempo pertenece a un dispositivo con el nombre de la localidad; la estaci贸n conserva su propio dispositivo como fuente. Evita que HA anteponga la estaci贸n al municipio y mantiene los IDs existentes.

## 0.1.0b5

- La entidad de tiempo y los encabezados de radar e hist贸rico muestran la localidad elegida. La estaci贸n sigue identificada como fuente de las observaciones.

## 0.1.0b4

- Enlace del asistente compatible con la validaci贸n de traducciones de Home Assistant.

## 0.1.0b3

Enlace directo para obtener las claves en el asistente y la reautenticaci贸n; recomendaci贸n de acceso con Google ante problemas del correo de activaci贸n. T铆tulo de las nuevas entradas corregido a Eguraldi.

## 0.1.0b2

Nuevo nombre p煤blico: Eguraldi. Se mantienen el dominio y las referencias de tarjetas para compatibilidad con la primera beta.

## 0.1.0b1

Primera beta independiente: asistente por localidad, recomendaci贸n explicable con cambio manual, separaci贸n de localidad de previsi贸n y estaci贸n de observaci贸n, control de humedad fuera de rango, tarjetas propias con iconos incluidos y cuadr铆cula compacta de 24 horas. Base de API MIT atribuida a Mitxol.
