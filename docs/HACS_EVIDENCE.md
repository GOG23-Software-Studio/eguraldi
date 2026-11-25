# Evidencia de la candidata 0.11.2

Revisión del 25 de noviembre de 2026. Estos resultados se refieren al commit y la release enlazados, no a cualquier cambio futuro de `main`.

- Commit candidato: [`afa658eb09b13b5022940a2762c12436c89686f3`](https://github.com/GOG23-Software-Studio/eguraldi/commit/afa658eb09b13b5022940a2762c12436c89686f3).
- [Ejecución CI completa, correcta](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070).
- [HACS sin exclusiones y hassfest, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070/job/139535862184).
- [Pruebas y Ruff, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070/job/139535861757): 128 pruebas Python y 83 de frontend.
- [Importaciones y formularios con HA 2026.8.0, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070/job/139535862215).
- [Importaciones y formularios con HA 2026.11.1, correctos](https://github.com/GOG23-Software-Studio/eguraldi/actions/runs/45708307070/job/139535862301).
- [Release completa 0.11.2](https://github.com/GOG23-Software-Studio/eguraldi/releases/tag/v0.11.2), creada después de finalizar correctamente esas comprobaciones.

## Cambio del catálogo preparado

[hacs-default.patch](hacs-default.patch) añade solo `GOG23-Software-Studio/eguraldi` a la lista `integration`. Base consultada: [`hacs/default@2275b7b47fb27d3eb474c7b2c055798bd45cffb9`](https://github.com/hacs/default/commit/2275b7b47fb27d3eb474c7b2c055798bd45cffb9). No se ha aplicado al repositorio de HACS ni se ha abierto una nueva PR. Al enviarlo hay que partir del `master` vigente y volver a comprobar orden, base y ausencia de otra candidatura.

## Evidencia todavía no obtenida

No se ha registrado una instalación limpia por un probador independiente ni se ha demostrado una mejora de Microclima en varios hogares. La matriz CI ejecuta HA real con respuestas de proveedor simuladas; no valida todas las funciones contra la API de producción. Las capturas públicas son demostraciones, no evidencia de precisión. El [guion de prueba externa](HACS_READINESS.md#guion-de-prueba-externa) permite registrar esas comprobaciones sin publicar datos privados.
