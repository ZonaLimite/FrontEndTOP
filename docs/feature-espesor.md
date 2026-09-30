# Feature: etiqueta de espesor en módulos FED-n

Mostrar dentro de cada módulo feeder (`FED-01`, `FED-02`…) una etiqueta con el
**espesor medido de la carta alimentada en ese feeder**. Una sola etiqueta por módulo FED,
actualizada con cada carta.

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Visualización: modelo, servicio de estado, etiqueta y su renderizado | **Hecha** (2026-09-30) |
| 2 | `espesor-processor.service`: detección y matching de trazas WebSocket | Pendiente (falta la máscara de detección) |

## Requisitos acordados

- **Origen:** mensajes WebSocket. La traza identifica el feeder y trae el espesor medido.
  La máscara de detección se define en la fase 2.
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
  una medida nueva reinicia el temporizador. Al caducar, la etiqueta vuelve a `sin-lectura`.

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

## Fase 2 (pendiente): `espesor-processor.service`

Seguir el patrón de `rechazo-processor.service` + `rechazos-estado.service`:

1. `EspesorProcessorService.analizarTraza(trace: string): EventoEspesor[] | null`, con
   `EventoEspesor { moduloId: string; micras: number }`. Aquí va la máscara de detección y el
   matching del identificador de feeder de la traza con el id de módulo (`FED-01`…).
2. En `TrackingWebsocketService._handleTrace()`, junto a `handleTracking()` y
   `procesarTrazasRechazo()`, llamar a un `procesarTrazasEspesor(trace.data)` que haga
   `espesorEstado.registrarMedida(ev.moduloId, ev.micras)` por cada evento.

Pendiente de definir: formato de la traza (máscara) y cómo se identifica el feeder en ella.
