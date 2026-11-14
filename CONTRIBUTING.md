# Contribuir a Eguraldi

Describe el problema y el comportamiento esperado en una incidencia. Para cambios de código, crea una rama y un pull request con su validación.

## Entorno y comprobaciones

```sh
python -m pip install -r requirements-dev.txt
npm ci --ignore-scripts
python -m pytest
ruff check custom_components tests tools
npm test
python tools/build_release.py
```

La CI comprueba también los flujos con HA real y valida HACS / hassfest. Las pruebas usan respuestas simuladas, sin claves ni acceso a un HA personal.

## Publicar

Actualiza la versión de `manifest.json`, `dashboard.py`, `package.json` y el registro de cambios. Espera a que la CI pase. Crea la etiqueta `v` seguida de la versión y publica su release en GitHub. El flujo de publicación construye y adjunta el ZIP y su SHA-256 automáticamente.

No incluyas PEM, claves, tokens, copias de `.storage` ni datos personales. El constructor rechaza archivos de credenciales dentro del componente. Mantén sus licencias sincronizadas con las del repositorio.

El dominio `euskalmet_local` se mantiene por compatibilidad. Cambiar los identificadores de entidades requiere una migración explícita.
