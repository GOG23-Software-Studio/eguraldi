# ¿Cuándo lavar mi vehículo?

Desde Eguraldi 0.6.0. Vista `vehicle_wash`, disponible en el editor visual y en la pestaña **Lavar vehículo** del panel completo. Funciona para cualquier localidad configurada, sin sensores propios ni otros proveedores.

## Uso

Elige **Coche**, **Moto** u **Otro vehículo**. El editor permite guardar el tipo inicial; los botones de la tarjeta permiten cambiarlo durante la consulta. La selección cambia el título, sin inventar reglas meteorológicas distintas para cada vehículo.

Se muestran siete días de calendario en la zona horaria de HA, incluido hoy. Pulsa un día para ver su valoración y la secuencia disponible. El nombre principal sigue siendo tu localidad; cambiar de localidad actualiza la tarjeta automáticamente.

```yaml
type: custom:euskalmet-local-card
mode: vehicle_wash
wash_vehicle: motorcycle
```

`wash_vehicle`: `car` (predeterminado), `motorcycle` u `other`. Con varias localidades, selecciona una en el editor o usa `entry_id`.

## Criterio

- Se prioriza la secuencia más larga de días consecutivos cuyo estado del cielo no indica lluvia: soleado, parcialmente nuboso o nuboso. En caso de empate, se elige la primera.
- Para recomendar un día hacen falta al menos dos días seguidos con esa previsión. Una secuencia de un solo día muestra poco margen o previsión limitada.
- Un día ausente, desconocido o duplicado interrumpe la secuencia. El final de los siete días también limita la comparación: no se supone tiempo seco después.
- A partir de las 18:00 de la zona horaria de HA ya no se propone hoy como día de lavado. Los siete días siguen visibles.
- Los símbolos de lluvia, nieve, granizo, tormenta y condiciones excepcionales impiden recomendar ese día. Si hay cantidad positiva de precipitación o probabilidad de al menos el 40 %, también se descarta.
- Si el proveedor aporta viento diario de al menos 30 km/h o una máxima de 2 °C o menos, se descarta ese día. Las unidades admitidas de viento son km/h, m/s, mph y nudos; la temperatura admite °C y °F. Euskalmet no aporta viento diario, por lo que normalmente se indica que no está disponible.

## Límites

La previsión diaria de Euskalmet ofrece un estado del cielo y temperaturas máxima/mínima; no ofrece probabilidad de lluvia ni viento diario. Un símbolo sin lluvia es una orientación diaria, no una garantía de que no llueva en ninguna hora. El frío solo se descarta cuando la máxima diaria es de 2 °C o menos, no por una mínima nocturna.

La tarjeta cuenta **días de calendario con esa previsión**, no horas exactas sin lluvia. No estima cuánto permanecerá limpio el vehículo, suciedad, barro, polvo, polen, uso posterior, disponibilidad de un lavadero ni condiciones de lavado. Las explicaciones se encuentran en **Cómo se elige el día**, sin comentarios permanentes al pie.

Utiliza la suscripción de previsión de HA existente. No genera nuevas consultas a la API de Euskalmet ni modifica avisos, sesiones de ropa tendida, Microclima o automatizaciones. Las capturas del README usan datos simulados.
