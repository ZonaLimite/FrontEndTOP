# Feature: etiqueta de espesor en módulos FED-n

Mostrar dentro de cada módulo feeder (`FED-01`, `FED-02`…) una etiqueta con el
**espesor medido de la carta alimentada en ese feeder**. Una sola etiqueta por módulo FED,
actualizada con cada carta.

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Visualización: modelo, servicio de estado, etiqueta y su renderizado | **Hecha** (2026-09-30) |
| 2 | `espesor-processor.service`: detección y matching de trazas WebSocket | **Hecha** (2026-10-01) |

## Requisitos acordados

- **Origen:** mensajes WebSocket. La traza identifica el feeder y trae el espesor medido
  (formato en la fase 2).
- **Unidad:** la traza trae **micras** (µm). Se muestra en **mm** (1 decimal por defecto,
  configurable con `etiquetaEspesor.decimales`).
- **Clasificación (en el frontend):**

  | Espesor | Estado | Color |
  |---------|--------|-------|
  | 0 mm | `warning` | ámbar |
  | 0 < e ≤ 30 mm | `ok` | verde |
  | 30 < e ≤ 64 mm | `warning` | ámbar |
  | e > 64 mm | `excesivo` | rojo |
  | sin medida vigente | `sin-lectura` | gris, muestra `— mm` |

  Valores negativos o no numéricos se descartan (log `console.warn`).
- **Persistencia:** cada medida permanece visible **3 s** (`TIEMPO_VISIBLE_MS`) si no llega otra;
  una medida nueva la sustituye y anula su caducidad. Al caducar, la etiqueta vuelve a `sin-lectura`.
  La caducidad usa `RenderSchedulerService.despues()` (timer fuera de la zona).

## Fase 1 (hecha)

- **Modelo** (`src/app/models/modulo-transporte.model.ts`): `EtiquetaEspesorConfig`
  (`x`, `y` en %, `decimales?`), `EstadoEspesor`, `MedidaEspesor` y el campo opcional
  `etiquetaEspesor?` en `ModuloCoordsConfig`. Solo los FED lo declaran: la plantilla no
  comprueba el prefijo `"FED-"`.
- **Estado** (`src/app/services/espesor-estado.service.ts`): signal
  `medidas: Record<moduloId, MedidaEspesor>`, umbrales, clasificación y caducidad por módulo.
  Actualiza el signal en cada medida (sin `setInterval`).
- **Vista** (`modulo-transporte-coords`): título "ESPESOR" (8 px) sobre un recuadro de ancho fijo
  (56 px, cabe "70.0 mm"; el espesor nunca supera 70 mm). `computed` `medidaEspesor()` por `config.id` y un
  `div.etiqueta-espesor` posicionado como las fotocélulas, con clase `estado-<estado>`.
- **Demo** (`demo-modulos`): `etiquetaEspesor` en FED-01 y FED-02, y botón
  **🎲 Simular Espesor** (visible con `mostrarSimulacion = true`).

## Fase 2 (hecha): `espesor-processor.service`

Formato de traza:

```
C30100200 18:07:09:232 INF IL1_FE2_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=4001B256, thickness=1280
```

| Campo | Significado | Uso |
|-------|-------------|-----|
| `rootOnMailPieceReportOutputThickness()` | Marca del evento de medida de espesor en el feeder | Matching |
| `IL<n>` | Línea | Filtro: solo se conserva la línea enlazada por el usuario |
| `FE<m>` | Feeder | Módulo `FED-0<m>` (siempre se corresponde) |
| `T.Reader` | Lector de espesor | Se ignora: el feeder tiene un solo lector |
| `MP` | Identificador del envío | No se muestra; se anota `MP → línea` en `EnvioLineaService` para la [restitución](feature-ocr-restitucion.md) |
| `thickness` | Espesor en micras | Valor registrado |

- `EspesorProcessorService.analizarTraza(trace, linea)` → `EventoEspesor[] | null`
  (`{ moduloId, micras }`). El model filter `Medida Espesor` del Engine no distingue línea
  (llegan trazas de IL1 e IL2): se descartan las de `IL<n>` distinto de `linea`. Regex sobre la marca: no colisiona con `BeltConveyor FE …`
  del `trace-processor` (allí FE es *front edge*).
- `TrackingWebsocketService._handleTrace()` llama a `procesarTrazasEspesor(trace.data)`,
  que toma la línea de `enlaceTop().lineaEntrada` (elección del usuario en `linkarTop()`; sin
  enlace no se procesa) y hace `espesorEstado.registrarMedida(ev.moduloId, ev.micras)` por cada evento.
- El botón **🎲 Simular Espesor** de la demo genera trazas con este formato y las pasa por el processor.

## Pendiente

- Lectores de espesor en otros tipos de módulo (no feeder).
