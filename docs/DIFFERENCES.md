# Eguraldi y Home Assistant Euskalmet

Comparación revisada el 25 de noviembre de 2026. No es una evaluación de calidad del otro proyecto ni una promesa de admisión en HACS.

## Origen y alcance compartido

Eguraldi deriva de [mitxol/home-assistant-euskalmet v2.12.9](https://github.com/mitxol/home-assistant-euskalmet/tree/v2.12.9), bajo MIT. Conserva código del cliente API, coordinador, entidades y recursos meteorológicos. La licencia y las atribuciones permanecen en [LICENSE](../LICENSE) y [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). No es una implementación meteorológica independiente desde cero.

Ambos proyectos usan Euskalmet Open Data y las credenciales personales del usuario. Observaciones, previsiones horarias y diarias, avisos, radar, históricos, mar, mareas, polen y traducciones castellano/euskera son capacidades compartidas. No justificamos una segunda entrada por el cambio de nombre, dominio, iconos o colores.

## Base de la comparación

Se revisaron el README, el árbol de archivos y los módulos Python/JavaScript de la rama principal original fijada en [5945897d3f8ba373274ca0b65416a737427ad909](https://github.com/mitxol/home-assistant-euskalmet/tree/5945897d3f8ba373274ca0b65416a737427ad909). Las diferencias siguientes describen esa instantánea, no todas las versiones futuras, extensiones o automatizaciones que pueda construir un usuario.

## Desarrollo específico de Eguraldi

| Capacidad | Original revisada | Eguraldi y evidencia |
| --- | --- | --- |
| Microclima doméstico | No se identificó un módulo equivalente de aprendizaje y validación con sensor doméstico. | Modelos locales con días reservados para validación, umbrales de mejora y rechazo explícito del ajuste. [Modelo](../custom_components/euskalmet_local/microclimate_model.py), [integración](../custom_components/euskalmet_local/microclimate.py), [pruebas](../tests/test_microclimate.py), [guía](MICROCLIMATE.md). |
| Sesión de ropa tendida | No se identificó un controlador equivalente de sesión y entrega de avisos. | Funciona sin navegador abierto, por entrada, desactivado por defecto; horario, destino, umbral, caducidad y control de duplicados. [Controlador](../custom_components/euskalmet_local/laundry.py), [modelo](../custom_components/euskalmet_local/laundry_model.py), [pruebas](../tests/test_laundry.py), [guía](LAUNDRY_ALERTS.md). |
| Planificación cotidiana | No se identificaron los tres modelos de recomendación integrados. | Ventanas para tender y salir, elección de día para lavar el vehículo. Modelos explícitos y probados, datos ausentes visibles. [Tender](DRYING.md), [salir](OUTING.md), [vehículo](VEHICLE_WASH.md); [pruebas de modelos](../tests). |
| Configuración centrada en localidad | La configuración revisada selecciona una estación como entrada. | Ubicación de HA o municipios adicionales, identificación local del municipio, estación compatible más cercana con elección manual. [Asistente](../custom_components/euskalmet_local/config_flow.py), [localidades](../custom_components/euskalmet_local/locality.py). |
| Panel propio | La original ya ofrece tarjetas de avisos, histórico y radar. | Tarjetas y editores para las recomendaciones y Microclima, comparación doméstica y resumen de decisiones; avisos en lista, banda, línea temporal o titulares. [Frontend](../custom_components/euskalmet_local/frontend), [pruebas](../tests/frontend.test.mjs). La estética por sí sola no es el argumento principal. |

## Por qué parte del trabajo vive en el backend

Microclima consulta estadísticas locales, controla el origen de los datos y publica entidades con estado de validación. Los avisos de ropa conservan sesión y control de entrega al reiniciar y se evalúan aunque no haya una tarjeta abierta. Una colección de tarjetas por sí sola no proporciona esos comportamientos. Esto explica la arquitectura actual; no demuestra que las funciones no puedan incorporarse al proyecto original ni elimina la decisión de los mantenedores de HACS sobre duplicación.

## Límites que deben acompañar la candidatura

- La validación de Microclima mide reconstrucción de observaciones del sensor exterior, no una mejora demostrada de la previsión futura. Puede no mejorar la estación.
- Las recomendaciones son heurísticas. No inventan probabilidades de lluvia; la previsión es horaria y municipal, no específica de un balcón.
- Las imágenes públicas usan datos simulados. No acreditan resultados reales de Microclima.
- Las pruebas automatizadas y la instalación real del mantenedor no equivalen a pruebas independientes en varios hogares. [Fiabilidad y límites](RELIABILITY.md).
- El proyecto original sigue activo. Eguraldi mantiene su propia evolución y soporte; no se afirma aprobación ni colaboración de su autor.

## Respuesta a la revisión anterior

La [solicitud #14144](https://github.com/hacs/default/pull/14144) se cerró por similitud con una integración activa. La nueva candidatura debe enlazarla y pedir una revisión de la divergencia funcional, sin ocultar la procedencia. El archivo compilado heredado `weather-radar-card-euskalmet.js` y su README obsoleto se retiraron en 0.1.11; el radar actual tiene su código en [euskalmet-radar-map-card.js](../custom_components/euskalmet_local/frontend/euskalmet-radar-map-card.js), con Leaflet y sus licencias incluidos. Se conserva el aviso histórico de Weather Radar Card.
