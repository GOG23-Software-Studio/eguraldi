# Evidencia de la candidata 0.11.3

Revisión del 25 de noviembre de 2026. Estos resultados se refieren al commit y la release enlazados, no a cualquier cambio futuro de `main`.

- Commit candidato: [`5e561bb1618cc88e6fa0d66bd5d789cd8de78d01`](https://github.com/GOG23-Software-Studio/eguraldi/commit/5e561bb1618cc88e6fa0d66bd5d789cd8de78d01).
- [Ejecución CI completa, correcta](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45715189236).
- [HACS sin exclusiones y hassfest, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45715189236/job/139559339098).
- [Pruebas y Ruff, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45715189236/job/139559339198): 128 pruebas Python y 83 de frontend.
- [Importaciones y formularios con HA 2026.8.0, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45715189236/job/139559339216).
- [Importaciones y formularios con HA 2026.11.1, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45715189236/job/139559338764).
- [Release completa 0.11.3](https://github.com/GOG23-Software-Studio/eguraldi/releases/tag/v0.11.3), creada después de finalizar correctamente esas comprobaciones.

## Cambio del catálogo preparado

[hacs-default.patch](hacs-default.patch) añade solo `GOG23-Software-Studio/eguraldi` a la lista `integration`. Base consultada: [`hacs/default@2275b7b47fb27d3eb474c7b2c055798bd45cffb9`](https://github.com/hacs/default/commit/2275b7b47fb27d3eb474c7b2c055798bd45cffb9). La adición se propone en [hacs/default#14962](https://github.com/hacs/default/pull/14962), desde una rama nueva del fork personal, con edición por mantenedores habilitada. La solicitud está abierta y no se ha fusionado. Al enviarlo hay que partir del `master` vigente y volver a comprobar orden, base y ausencia de otra candidatura.

## Evidencia todavía no obtenida

Se ha completado una [instalación manual limpia en un HA aislado](CLEAN_INSTALL_TEST.md), con el ZIP público de 0.11.2, proveedor simulado, revisión de la UI y reinicio. No se ha registrado una instalación limpia por un probador independiente ni se ha demostrado una mejora de Microclima en varios hogares. El laboratorio y la matriz CI no validan todas las funciones contra la API de producción. Las capturas públicas son demostraciones, no evidencia de precisión. El [guion de prueba externa](HACS_READINESS.md#guion-de-prueba-externa) permite registrar esas comprobaciones sin publicar datos privados.


## Compatibilidad corregida y prueba pendiente

La candidata 0.11.3 elimina el aviso de `via_device`; se ha comprobado el enlace padre mediante `via_device_id` en el registro del HA aislado y la ausencia del aviso en el arranque corregido. Las identidades permanecen estables.

La [instalación limpia mediante Marketplace](MARKETPLACE_INSTALL_TEST.md) se ha completado en una segunda configuración vacía con HA 2026.11.1. Autorización personal de GitHub, descarga e instalación reales desde la UI de repositorio personalizado; 87 archivos coinciden con la release. Configuración, tarjetas y reinicio comprobados con proveedor meteorológico simulado. No se usaron claves reales de Euskalmet ni se acredita precisión o prueba independiente en otro hogar.
