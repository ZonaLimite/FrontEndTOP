# Feature: lista de últimos rechazos en módulos CUL-n

Mostrar sobre cada módulo de culling (`CUL-01`…) una lista corta con los **últimos eventos de
rechazo** obtenidos de las trazas de la línea visualizada.

Se desarrolla por fases; no se pasa a la siguiente sin consenso.

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Interfaz: título, lista y destacado del más reciente sobre el módulo CUL | **Hecha** (2026-10-06) |
| 2 | Servicio: signal `ultimos` en `RechazosEstadoService` | **Hecha** (2026-10-06) |
| 3 | Renderizado optimizado: componente propio y contención CSS | **Hecha** (2026-10-06) |

## Fase 1 (hecha): interfaz

Diseño acordado (opción A de las maquetas):

- **Posición:** arriba a la derecha del módulo, sobre `CUL-B2` / `CUL-B1` (`listaRechazos: { x: 75, y: 21 }`).
- **Título:** `ÚLTIMOS RECHAZOS`, con el estilo de las demás etiquetas (8 px, gris).
- **Lista:** recuadro de tamaño fijo (92 px, cabe `ANNULATION_SC`; 3 ítems, configurable con
  `listaRechazos.items`). Cada ítem muestra solo la **denominación**; la hora y la info van en el tooltip.
  Se llena desde abajo: no cambia de tamaño con 0, 1 o 2 rechazos.
- **Más reciente:** abajo, separado por una línea, en **rojo**, negrita y un punto más grande.
  Los anteriores, atenuados en gris.
- **Destello:** al llegar un rechazo, su ítem aparece en blanco sobre rojo y pasa a rojo en 500 ms.
  Es un elemento nuevo en el DOM (`trackBy` por `id`), así que la animación arranca sola aunque se
  repita la denominación.

Código:

- **Modelo** (`modulo-transporte.model.ts`): `ListaRechazosConfig` (`x`, `y`, `items?`), `RechazoReciente`
  (`id`, `denominacion`, `info`, `timestamp`) y el campo opcional `listaRechazos?` en `ModuloCoordsConfig`.
- **Vista:** título + lista con el más reciente destacado (desde la fase 3, en el componente
  `app-lista-rechazos`).
- **Demo:** `listaRechazos` en `CUL-01`.

## Fase 2 (hecha): servicio

Decisiones acordadas:

- **Se amplía `RechazosEstadoService`** (no hay servicio nuevo): los rechazos ya pasan por él y
  `_handleTrace` no cambia.
- **Signal `ultimos: RechazoReciente[]`**, del más antiguo al más reciente, con los últimos
  `MAX_ULTIMOS` (5) rechazos; cada módulo muestra los `listaRechazos.items` más recientes (3 por defecto).
  Cada rechazo lleva un `id` incremental (para el `trackBy` y el destello).
- **Actualización inmediata** en `registrarRechazos()`, una vez por bloque de eventos. No espera al
  `setInterval`: el destello debe coincidir con la llegada del rechazo. Como se llama dentro del lote de
  `RenderSchedulerService`, no añade ciclos de detección de cambios.
- **El `setInterval` de 2 s se mantiene** para `resumen` y `signal_historial`: da un refresco mínimo
  automático a la vista de historial / estadísticas.
- **Sin filtro por línea en el frontend:** el Engine ya publica solo los rechazos de la línea enlazada
  (model filters `IL1-Rechazos` / `IL2-Rechazos`).
- **Vaciado** en `limpiarEstadisticas()` (se llama al desconectar).
- La vista lee `RechazosEstadoService.ultimos` directamente (se eliminó el signal provisional).

## Fase 3 (hecha): renderizado

- **Componente propio `app-lista-rechazos`** (`components/lista-rechazos`, OnPush + Signals, declarado en
  `AppModule`). Lee `RechazosEstadoService.ultimos` y recibe `[items]`; el módulo solo lo coloca
  (`left` / `top` en % sobre el host). Al llegar un rechazo Angular revisa la plantilla de la lista,
  **no la de `modulo-transporte-coords`** (comprobado con el profiler de Angular: aparece
  `ListaRechazosComponent` y no `ModuloTransporteCoordsComponent`).
- **`contain: content`** en el host: el destello y los cambios de texto no obligan al navegador a
  recalcular el resto del módulo. El recuadro tiene tamaño fijo, así que tampoco hay reflujo interno.
- **Se mantiene `*ngFor` con `trackBy` por `id`:** cada rechazo crea un único elemento, y por ser nuevo
  arranca solo la animación del destello. Se descartó usar tres líneas fijas cambiando el texto
  (obliga a reiniciar la animación a mano para ahorrar la creación de un elemento por rechazo).
- Varias trazas en un mismo frame se pintan una sola vez (lote de `RenderSchedulerService`).

## Feeder de origen del envío rechazado (2026-10-08)

Cada ítem de la lista muestra, a la derecha de la denominación, el **feeder del que se singularizó
el envío** que provocó el rechazo (`FE1`, `FE2`…).

La traza de rechazo no trae el feeder, pero sí el envío (`pli 400218A1`, el `MP=` de otras trazas).
Se resuelve con el mismo registro que da la línea de las restituciones:

1. La traza de espesor trae línea, feeder y envío:
   `INF IL1_FE2_ - rootOnMailPieceReportOutputThickness(), …, MP=4001B256, …`.
   `EspesorProcessorService` anota `MP → { línea, feeder }` en `EnvioLineaService`
   (`registrar(mp, linea, feeder)`; consulta con `lineaDe(mp)` / `feederDe(mp)`).
2. `RechazoProcessorService` extrae el envío de INFO (`/\bpli\s+(\w+)/`) y añade a `EventoRechazo`
   el campo `feeder` (número tal como llega en la traza, ej. `'2'`; `null` si no se conoce).
3. `RechazosEstadoService` lo copia a `RechazoReciente.feeder` y la lista lo pinta como `FE<n>`.

- **Sin feeder conocido** (traza sin `pli`, traza de espesor perdida, o envío ya fuera del registro de
  `MAX_ENVIOS` = 200): el ítem muestra solo la denominación.
- **Vista:** recuadro de 116 px (`listaRechazos: { x: 69, y: 21 }` en `CUL-01`), suficiente para
  `ANNULATION_SC` a 9 px junto al feeder. Para hacerle sitio, `CUL-B3` se desplazó a la izquierda
  (`x: 35` → `x: 27`). El tooltip incluye `Feeder <n>`.
