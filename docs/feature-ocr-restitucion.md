# Feature: lectura de destino OCR + restitución en módulos ACQ-n

Mostrar en cada módulo de adquisición (`ACQ-01`…) la **última lectura de destino** del envío
tratado en la línea enlazada, indicando qué sistema la obtuvo:

- **OCR:** análisis de la imagen de la carta (bloque de dirección). Da el código postal,
  la distribución si está configurada, y el destino en texto.
- **Restitución:** lectura de la cronomarca impresa en la carta en un tratamiento previo.
  Da solo el código postal de clasificación.

Cada envío lo resuelve **uno u otro**: si se detecta cronomarca se usa la restitución y la imagen
no se trata con OCR.

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | OCR: modelo, `ocr-processor`, estado de última lectura y etiqueta en ACQ | **Hecha** (2026-10-01) |
| 2 | Restitución: `restitucion-processor` sobre el mismo estado | Pendiente (faltan las trazas) |

## Requisitos acordados

- **Origen:** trazas WebSocket, una por línea.
- **Filtro por línea:** la línea va en la cabecera tras el nivel (`INF IL<n>_URA_` → línea n, proceso URA).
  Se conserva solo la línea enlazada por el usuario (`enlaceTop().lineaEntrada`), como en
  [feature-espesor](feature-espesor.md). El prefijo `IL:1 #N…;` lo añade el Engine y no se usa.
- **Sin identificador de envío:** no se correlacionan lecturas entre sistemas; basta la última lectura,
  que permanece hasta que llega otra (sin caducidad). Se borra al desconectar.
- **Un ACQ por línea:** las trazas no identifican el módulo; todos los módulos con `etiquetaLectura`
  muestran la última lectura de la línea.

## Fase 1 (hecha): OCR

Formato de traza:

```
IL:1 #N38854254;C30100100 22:23:57:498 INF IL2_URA_ -    texte    DACTHN 50012            S:ES50012_________ NC:2 NS:3 IS:0a ZARAGOZA
IL:1 #N38936892;C30100100 22:27:30:039 INF IL2_URA_ -    texte    DACTHN 01006 104001     S:ES01006104001___ NC:6 NS:5 IS:0a VITORIA GAS
IL:1 #N38872279;C30100100 22:24:08:254 INF IL2_URA_ -    texte    MANUHN R_REC            S:________________ NC:0 NS:0 IS:00
```

| Campo | Significado | Uso |
|-------|-------------|-----|
| `IL<n>_URA_ - texte` | Resultado del OCR (proceso URA) de la línea n | Matching y filtro por línea |
| `S:ES` + 5 dígitos | Leído a nivel **encaminamiento** (CP) | Estado `encaminamiento` |
| `S:ES` + 11 dígitos | Leído a nivel **distribución** (CP + 6) | Estado `distribucion` |
| `S:` sin dígitos | No reconocido (ej: `R_REC`) | Estado `no-reconocido` |
| tras `IS:<xx>` | Destino en texto (puede venir vacío) | Se muestra bajo el CP |
| `DACTHN`, `NC`, `NS`, `IS` | Sin definir | No se usan |

- **Modelo** (`modulo-transporte.model.ts`): `EtiquetaLecturaConfig` (`x`, `y` en %), `OrigenLectura`,
  `EstadoLectura`, `LecturaDestino` y el campo opcional `etiquetaLectura?` en `ModuloCoordsConfig`.
- **`OcrProcessorService.analizarTraza(trace, linea)`** → `LecturaDestino[] | null`.
- **`LecturaDestinoEstadoService`:** signal `ultimaLectura`, compartido por OCR y restitución.
- **`TrackingWebsocketService`:** `_handleTrace()` llama a `procesarTrazasOcr(trace.data)`.
- **Vista** (`modulo-transporte-coords`): título `OCR` / `RESTITUCIÓN` (`DESTINO` sin lectura) sobre un
  recuadro de ancho fijo (84 px, cabe "01006 104001") con el CP (+ distribución) y el texto (tooltip con el
  texto completo).

  | Estado | Color | Muestra |
  |--------|-------|---------|
  | `encaminamiento` / `distribucion` | verde | CP [+ distribución] y texto |
  | `no-reconocido` | ámbar | `NO RECONOCIDO` |
  | sin lectura | gris | `—` |
- **Demo:** `etiquetaLectura` en `ACQ-01` y botón **🎲 Simular OCR** con las trazas reales
  (visible con `mostrarSimulacion = true`).

## Fase 2 (pendiente): restitución

`RestitucionProcessorService.analizarTraza(trace, linea)` que devuelva `LecturaDestino` con
`origen: 'restitucion'`, `texto: ''` y `distribucion: null`, registrada en el mismo
`LecturaDestinoEstadoService`. La vista ya distingue el origen.

Pendiente de definir: formato de la traza de restitución (y de cronomarca no leída / sin datos).

## Pendiente en el Engine

`habilitarTrackingListener()` incluye los model filters de cada línea más `Medida Espesor`.
Falta el model filter que publique las trazas `URA_ - texte` (y después las de restitución).
