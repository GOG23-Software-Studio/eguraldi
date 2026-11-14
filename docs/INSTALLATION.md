# Instalar y configurar Eguraldi

## HACS / Marketplace

1. Abre [Eguraldi en HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner=GOG23-Software-Studio&repository=eguraldi&category=integration).
2. Si no se abre, usa **Añadir desde enlace** en Marketplace o **Repositorios personalizados** en HACS. Pega `https://github.com/GOG23-Software-Studio/eguraldi` y elige **Integración**.
3. Descarga la última versión y reinicia HA.
4. En **Ajustes → Dispositivos y servicios → Añadir integración**, busca **Eguraldi**.

No hace falta activar versiones preliminares para instalar 0.1.0.

## Credenciales y ubicación

Obtén tus claves en [Open Data Euskadi](https://api.euskadi.eus/opendata-apikey/#/). Introduce el correo registrado y el contenido completo de `privatekey.pem`, incluidas las líneas BEGIN y END. No uses la clave pública ni un JWT.

Si no llega el correo de activación, revisa spam o prueba iniciar sesión con Google. Una cuenta pendiente puede requerir resolver su activación con el proveedor o usar otra cuenta.

**Ubicación de Home Assistant** usa el punto de **Ajustes → Sistema → General**. **Otra localidad** permite buscar y confirmar un municipio. En **Configurar → Cambiar estación** puedes elegir otra o volver a automática.

Para añadir otra localidad, pulsa **Añadir servicio**, reutiliza la cuenta guardada y elige **Otra localidad**. Las claves se reutilizan dentro de HA y no se envían al navegador.

## Añadir tarjetas

1. En tu panel, pulsa **Editar → Añadir tarjeta → Eguraldi**.
2. Elige la vista y la ubicación. Con varias localidades, selecciona una para que se guarde con la tarjeta.
3. En el radar puedes ajustar el zoom. En la comparación puedes elegir un sensor de temperatura y su nombre en el gráfico.
4. Guarda la tarjeta y el panel.

Los recursos se registran automáticamente: no añadas JavaScript externo. Si no aparecen tras instalar o actualizar, recarga el navegador o vuelve a abrir la aplicación de HA.

## Actualizar desde las betas

Actualiza desde HACS / Marketplace y reinicia HA. Conserva la integración configurada: no la borres ni la crees de nuevo. Los identificadores y el dominio de las betas se mantienen. Recarga los navegadores para cargar las nuevas tarjetas. Los paneles personales permanecen como están.

## Instalación manual

Descarga el ZIP de la [última versión](https://github.com/GOG23-Software-Studio/eguraldi/releases/latest). Copia `custom_components/euskalmet_local` dentro de `custom_components` en la configuración de HA, incluido todo su contenido: `frontend`, `brand` y `data`. Reinicia HA y añade la integración.

## Problemas habituales

| Problema | Qué revisar |
| --- | --- |
| Clave no válida | Archivo privado PEM completo, incluidas sus líneas de inicio y fin. |
| Credenciales rechazadas | Correo registrado y clave; sigue el asistente de reautenticación. |
| No se detecta la ubicación | Revisa la ubicación global de HA o elige una localidad manualmente. |
| Faltan sensores | La estación puede no medir esas magnitudes; puedes elegir otra. |
| No aparecen tarjetas | Reinicia HA tras instalar y recarga el navegador. |
| Varias localidades | Elige una en el editor visual y guarda el panel. |
| Mapa desplazado | Pulsa **Mi ubicación**; **Ver cobertura** abre la vista regional. |

Si persiste, [abre una incidencia](https://github.com/GOG23-Software-Studio/eguraldi/issues/new/choose) con versiones y pasos. Revisa los diagnósticos antes de publicarlos. No incluyas claves, correo ni coordenadas personales.
