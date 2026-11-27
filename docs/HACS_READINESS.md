# Inclusión de Eguraldi en HACS

Estado actualizado el 27 de noviembre de 2026: **aprobada e incorporada al catálogo general de HACS**. Frenck aprobó la [solicitud #14962](https://github.com/hacs/default/pull/14962), fusionada ese día tras la corrección publicada en 0.12.1. [Confirmación de HACS y plazo inicial de propagación de hasta 8 horas](https://github.com/hacs/default/pull/14962#issuecomment-7221431536).

Para instalar, busca **Eguraldi** en HACS / Marketplace; no es necesario añadir un repositorio personalizado. [Pasos de instalación](INSTALLATION.md). Si ya está instalada, conserva la configuración y actualiza normalmente.

Las secciones siguientes conservan la preparación y el procedimiento histórico de la candidatura. [Resultados y enlaces de esa preparación](HACS_EVIDENCE.md).

## Requisitos y evidencia

| Comprobación | Evidencia / estado |
| --- | --- |
| Repositorio público, descripción, temas e incidencias | [GOG23-Software-Studio/eguraldi](https://github.com/GOG23-Software-Studio/eguraldi). Verificados por API durante esta revisión. |
| Una integración con todos sus archivos | `custom_components/euskalmet_local/`; `hacs.json` con categoría de país `ES`, nombre y versión mínima de HA. |
| Licencia y procedencia | MIT, licencia original y avisos conservados. [Diferencias y alcance heredado](DIFFERENCES.md). |
| Iconos | `brand/icon.png` y `brand/icon@2x.png` incluidos. La documentación fuente actual de HACS acepta `brand/icon.png`; no se requiere abrir una PR en Home Assistant Brands. |
| Validación | [Flujo CI](../.github/workflows/ci.yml): HACS sin `ignore`, hassfest, Ruff, pruebas Python y tarjetas. Se deben enlazar resultados verdes del commit candidato. |
| Compatibilidad anunciada | Matriz de pruebas de formularios e importación con HA 2026.8.0 y 2026.11.1. No equivale a validar cada función en cada versión ni todos los parches intermedios. |
| Publicación | Crear una release completa después del resultado verde; paquete y SHA-256 generados por el flujo de publicación. |
| Historial de revisión | [#14144](https://github.com/hacs/default/pull/14144), cerrada por similitud. Nueva justificación centrada en Microclima y control de sesiones de ropa, no en renombrar el proveedor. |

## Pruebas antes de presentar

Comprobado en la instalación del mantenedor: instalación y actualización mediante HACS, arranque, datos reales, selección de localidad/estación, tarjetas, apertura con un clic y cierre de avisos a los 30 segundos. Las pruebas automatizadas cubren datos ausentes, caducidad, cambios de origen, validación separada del entrenamiento y control de notificaciones.

Se ha completado una [instalación limpia manual en laboratorio](CLEAN_INSTALL_TEST.md) con HA real, proveedor simulado, tarjetas, editor y reinicio. También se ha completado la [instalación limpia desde el Marketplace integrado de HA 2026.11.1](MARKETPLACE_INSTALL_TEST.md). Ninguno de los dos ensayos sustituye una prueba por otra persona ni resultados de Microclima en varios hogares. Esas pruebas externas no son requisitos formales adicionales de HACS, pero siguen siendo una limitación de la evidencia. No se debe marcar como realizado lo que no se haya probado.

### Guion de prueba externa

Registrar solo versión de HA/Eguraldi, navegador, resultado y pasos reproducibles; no recopilar credenciales, coordenadas ni destinatarios.

1. Instalar desde repositorio personalizado en una instalación sin Eguraldi; añadir credenciales propias y comprobar los recursos tras reiniciar.
2. Probar ubicación de HA y otra localidad. Cambiar estación y confirmar títulos, distancia, histórico y resúmenes sin recargar.
3. Sin sensor exterior ni notificador, comprobar que el tiempo y las recomendaciones funcionan y que las opciones voluntarias permanecen desactivadas.
4. Si hay sensor exterior adecuado, activar Microclima; comprobar estado de aprendizaje y conservación al reiniciar. La mejora solo se evalúa cuando haya cobertura suficiente y puede ser rechazada.
5. Probar avisos de ropa únicamente con un destino y una sesión expresamente elegidos por el probador; comprobar desactivación, cierre de sesión y ausencia de duplicados. No enviar pruebas a terceros.
6. Revisar móvil/escritorio, castellano/euskera, cuatro formatos de alertas, teclado y reducción de movimiento.
7. Registrar fallos de instalación o recuperación y corregirlos antes de describir el ensayo como satisfactorio.

## Material preparado para una nueva solicitud

- [Texto de candidatura en inglés](HACS_SUBMISSION.md), con procedencia, diferencias, límites y enlaces.
- Comparación fijada a un commit de la original, con módulos y pruebas de Eguraldi enlazados.
- README en castellano y euskera con el distintivo dinámico de versión como referencia; sin una versión escrita a mano que quede desactualizada.
- Capturas públicas existentes identificadas como simuladas; sin capturas ni datos privados de HA en la candidatura.

## Procedimiento de envío

1. Confirmar resultados verdes y release posterior del mismo commit; completar el bloque de enlaces de la candidatura con esos resultados.
2. Volver a consultar la rama principal original antes del envío y actualizar la comparación si ha cambiado. No presentar la original como abandonada.
3. Comprobar que no exista otra solicitud abierta para Eguraldi.
4. Desde el fork personal del mantenedor de `hacs/default`, crear una rama nueva a partir del `master` actual, añadir `GOG23-Software-Studio/eguraldi` al JSON `integration` respetando orden y mayúsculas, y abrir una única PR editable con la plantilla vigente.
5. Enlazar #14144 y explicar la divergencia; no reabrir la antigua ni pedir revisiones repetidas. La decisión corresponde a HACS.

Fuentes consultadas: [inclusión, fuente actual](https://github.com/hacs/documentation/blob/main/source/docs/publish/include.md), [integraciones](https://hacs.xyz/docs/publish/integration/), [marcas locales de HA](https://developers.home-assistant.io/blog/2026/02/24/brands-proxy-api/). La página renderizada de HACS puede conservar instrucciones anteriores sobre Brands; esta revisión usa la documentación fuente actual y el validador ejecutado sin exclusiones.
