# Validación de la beta

## Automatizado

- Pruebas de los analizadores y calendarios heredadas de la base MIT.
- Selección por distancia y disponibilidad; rechazo fuera de cobertura y de coordenadas no finitas; ranking determinista.
- La previsión se resuelve por localidad y rechaza coincidencias parciales ambiguas.
- Tarjetas: 24 celdas, seis columnas, ciclo de suscripción/desuscripción, selección explícita con varias localidades, calidad de humedad, escape de texto y presencia de los iconos empaquetados.
- CI: análisis estático, pruebas Python/JavaScript y comprobación de importación con HA 2026.11.1 en Linux. La validación HACS/hassfest se ejecuta por separado en GitHub.

## Pendiente antes de versión estable

- Probar reautenticación, reinicio, instalación/actualización por HACS y convivencia con la integración original.
- Confirmar comportamiento con distintas localidades y respuestas actuales de los proveedores.

No se han extraído ni copiado las credenciales del HA del autor para hacer pruebas. La vista previa local utiliza datos simulados señalados como tales.

## Validación real · 13 de noviembre de 2026

- Asistente completado por el usuario con sus credenciales en HA 2026.11.1: localidad Ortuella y estación Arboleda, a 1,9 km.
- Entrada cargada, observaciones disponibles y previsión horaria y diaria para Ortuella.
- Tarjetas incluidas verificadas en HA: observaciones, 24 horas en cuatro filas de seis, próximos días, avisos, radar e histórico mensual.
- Humedad publicada de 101,2 % conservada en atributos y señalada fuera de rango; no se muestra como una lectura válida.
- Convivencia con la integración original comprobada antes de la migración de la pestaña.

## Ejecutar

```sh
python -m pip install -r requirements-dev.txt
python -m pytest
ruff check custom_components tests
npm ci
npm test
```


## Cambio de estación en tarjetas abiertas · beta 0.1.0b10

- Prueba real en HA: Arboleda (1,9 km) → Galindo (4,7 km) → selección automática de Arboleda, sin recargar la pestaña durante los cambios.
- La localidad Ortuella y su previsión se mantienen. Se actualizan la fuente, los resúmenes de mínima/máxima y la leyenda de la comparación con el balcón.
- El histórico mensual conserva octubre de 2026 y sus tres curvas cambian al consultar Galindo. Al terminar se restaura el mes actual.
- Pruebas de tarjetas: cambio en una tarjeta montada, resúmenes, histórico con respuesta anterior pendiente, conservación del mes, leyenda y reconexión durante carga de recursos.


## Cambio de localidad · beta 0.1.0b11

- Prueba real con la misma entrada y las tarjetas abiertas: Ortuella → Bilbao → Ortuella, sin recargar el panel durante los cambios.
- Bilbao selecciona automáticamente Zorrotza (4,3 km) y actualiza los títulos, las observaciones y la previsión oficial a Bilbao.
- Elección manual verificada en Bilbao: Arboleda (12,1 km), manteniendo Bilbao como localidad y previsión.
- La vuelta a Ortuella restablece automáticamente Arboleda (1,9 km), conserva los identificadores de entidades y actualiza todas las tarjetas.
- Pruebas de protección frente a localidad duplicada y localidad sin previsión; la configuración anterior no se modifica antes de confirmar ni en caso de error.
- Selección por distancia sin redondear: una estación más cercana no pierde por tener menos magnitudes; la cobertura solo desempata distancias iguales.
