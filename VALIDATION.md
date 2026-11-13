# Validación de la beta

## Automatizado

- Pruebas de los analizadores y calendarios heredadas de la base MIT.
- Selección por distancia y disponibilidad; rechazo fuera de cobertura y de coordenadas no finitas; ranking determinista.
- La previsión se resuelve por localidad y rechaza coincidencias parciales ambiguas.
- Tarjetas: 24 celdas, seis columnas, ciclo de suscripción/desuscripción, selección explícita con varias localidades, calidad de humedad, escape de texto y presencia de los iconos empaquetados.
- CI: análisis estático, pruebas Python/JavaScript y comprobación de importación con HA 2026.11.1 en Linux. La validación HACS/hassfest se ejecuta por separado en GitHub.

## Pendiente antes de versión estable

- Configurar una entrada real con credenciales personales en un HA de prueba y recorrer el asistente completo.
- Cambiar de estación y volver a automática, comprobando que la previsión sigue ligada a la localidad.
- Probar reautenticación, reinicio, instalación/actualización por HACS y convivencia con la integración original.
- Confirmar comportamiento con distintas localidades y respuestas actuales de los proveedores.

No se han extraído ni copiado las credenciales del HA del autor para hacer pruebas. La integración existente en su HA sigue intacta. La vista previa local utiliza datos simulados señalados como tales.

## Ejecutar

```sh
python -m pip install -r requirements-dev.txt
python -m pytest
ruff check custom_components tests
npm ci
npm test
```
