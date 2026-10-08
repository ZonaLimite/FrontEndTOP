# Feature: lectura de destino OCR + restitución en módulos ACQ-n

Mostrar en cada módulo de adquisición (`ACQ-01`…) la **última lectura de destino** del envío
tratado en la línea enlazada, indicando qué sistema la obtuvo:

- **OCR:** análisis de la imagen de la carta (bloque de dirección). Da el código postal,
  la distribución si está configurada, y el destino en texto.
- **Restitución:** lectura de la cronomarca impresa en la carta en un tratamiento previo. El ACQ
  pide al servidor ITLS (cronomarca → destino) la información registrada para esa cronomarca
  (por un OCR anterior o por videocodificación). Da solo el código de clasificación, sin texto.

Cada envío lo resuelve **uno u otro**: si se detecta cronomarca se usa la restitución y la imagen
no se trata con OCR.

| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | OCR: modelo, `ocr-processor`, estado de última lectura y etiqueta en ACQ | **Hecha** (2026-10-01) |
| 2 | Restitución: `restitucion-processor`, registro mpId → línea y etiqueta inferior en ACQ | **Hecha** (2026-10-03) |
| 3 | Videocodificación, presentación: módulo `VCS-01` bajo el ACQ y estado independiente | **Hecha** (2026-10-06) |
| 4 | Videocodificación, lógica de servicio: `videocodificacion-processor` y enganche al WebSocket | **Hecha** (2026-10-06) |

## Requisitos acordados

- **Origen:** trazas WebSocket, una por línea.
- **Filtro por línea:** la línea va en la cabecera tras el nivel (`INF IL<n>_URA_` → línea n, proceso URA).
  Se conserva solo la línea enlazada por el usuario (`enlaceTop().lineaEntrada`), como en
  [feature-espesor](feature-espesor.md). El prefijo `IL:1 #N…;` lo añade el Engine y no se usa.
- **Última lectura:** en el ACQ se muestra solo la del **último envío tratado**, sea por OCR o por restitución
  (la videocodificación va aparte, ver fases 3 y 4):
  al llegar una lectura se borra la del otro sistema (su recuadro vuelve a `—`), para no confundirla con
  el destino de un envío anterior. Permanece hasta que llega otra (sin caducidad). Se borra al desconectar.
- **Un ACQ por línea:** las trazas no identifican el módulo; todos los módulos con `etiquetaOcr` /
  `etiquetaRestitucion` muestran la última lectura de la línea.

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
  `EstadoLectura`, `LecturaDestino` y el campo opcional `etiquetaOcr?` en `ModuloCoordsConfig`.
- **`OcrProcessorService.analizarTraza(trace, linea)`** → `LecturaDestino[] | null`.
- **`LecturaDestinoEstadoService`:** signals `ultimas` (última lectura, con la sola entrada de su origen) y `contadores`
  (lecturas registradas por origen), compartido por OCR y restitución.
- **`TrackingWebsocketService`:** `_handleTrace()` llama a `procesarTrazasOcr(trace.data)`.
- **Vista** (`modulo-transporte-coords`): en la parte superior del ACQ, título `DESTINO (OCR)` con un LED
  sobre un recuadro de tamaño fijo (84 px, cabe "01006 104001"; dos líneas) con el CP (+ distribución) y el
  texto (tooltip con el texto completo).
- **Indicación de cada lectura:** el LED destella (400 ms, color según estado) y el contenido del recuadro
  parpadea (250 ms) con cada lectura, aunque se repita el mismo destino. El contador del origen alterna
  las clases `pulso-a` / `pulso-b`, dos animaciones idénticas: cambiar de nombre reinicia la animación.

  | Estado | Color | Muestra |
  |--------|-------|---------|
  | `encaminamiento` / `distribucion` | verde | CP [+ distribución] y texto |
  | `no-reconocido` | ámbar | `NO RECONOCIDO` |
  | sin lectura | gris | `—` |
- **Demo:** `etiquetaOcr` en `ACQ-01` (`x: 40, y: 16`, alineada con la de restitución) y botón **🎲 Simular OCR** con las trazas reales
  (visible con `mostrarSimulacion = true`).

## Fase 2 (hecha): restitución

Formato de traza (módulo de traza `TLS`: coloquios con el servidor ITLS):

```
IL:1 #N44548575;C30100000 19:02:26:378 INF TLS      - processSanction: addressRead on mpId=400CE551 : code=20280
IL:1 #N44572539;C30100000 19:02:44:379 INF TLS      - processSanction: addressRead on mpId=400CE5D5 : code=01013177001
```

| Campo | Significado | Uso |
|-------|-------------|-----|
| `TLS - processSanction: addressRead` | Destino restituido por el ITLS | Matching |
| `mpId` | Identificador del envío (el `MP=` de las trazas de espesor) | Resolver la línea |
| `code` 5 dígitos | **Encaminamiento** (CP) | Estado `encaminamiento` |
| `code` 11 dígitos | **Distribución**: CP + calle (3) + sección (3) | Estado `distribucion` |
| `code` con otro formato | Sin destino | Estado `no-reconocido` (+ `console.warn`) |

### Resolución de la línea

El ITLS es **común a todas las líneas** y la traza TLS no dice qué línea hizo la petición (sí la máquina:
solo se trata una a la vez). El `mpId` es un número de secuencia de control y no codifica la línea.

Se resuelve con la traza de espesor del feeder, que trae línea y envío y llega antes (el envío pasa por el
feeder antes que por el ACQ): `INF IL1_FE2_ - rootOnMailPieceReportOutputThickness(), …, MP=4001B256, …`.

- **`EnvioLineaService`:** registro `mpId → línea` acotado a los últimos 2000 envíos. Lo alimenta
  `EspesorProcessorService` con las trazas de espesor de **todas** las líneas (antes de filtrar por la enlazada).
- **`RestitucionProcessorService.analizarTraza(trace, linea)`** → `LecturaDestino[] | null`
  (`origen: 'restitucion'`, `texto: ''`). Solo conserva las restituciones cuyo `mpId` es de la línea enlazada;
  se descartan las de otra línea y las de **línea desconocida** (traza de espesor perdida, o envío alimentado
  antes de enlazar).
- **`TrackingWebsocketService`:** `_handleTrace()` llama a `procesarTrazasRestitucion(trace.data, true)`;
  al desconectar se vacía el registro.
- **Vista:** recuadro `RESTITUCIÓN` en la parte inferior del ACQ (`etiquetaRestitucion`), con la misma
  plantilla, LED y parpadeo que el OCR; muestra el CP (+ calle y sección), sin línea de texto.
- **Demo:** `etiquetaRestitucion` en `ACQ-01` (`x: 40, y: 81`) y botón **🎲 Simular Restitución**
  (traza de espesor + traza TLS; incluye un envío de la línea 2 que debe descartarse).

Pendiente de definir: trazas de fallo (cronomarca sin datos, ITLS sin respuesta).

## Model filters del Engine

`habilitarTrackingListener()` incluye, además de los de cada línea:

| Model filter | Trazas |
|--------------|--------|
| `Medida Espesor` | Espesor en feeders (también resuelve la línea de cada restitución) |
| `Lectura OCR` | `URA_ - texte` de las dos líneas; se filtran en el frontend |
| `Restitucion ITLS y VideoCodif` | `TLS - processSanction: addressRead` (restitución, común a todas las líneas) e `IL<n>_ILS_ - …` (videocodificación, con la línea en la cabecera) |

## Fases 3 y 4 (hechas): videocodificación en línea

El model filter `Restitucion ITLS y VideoCodif` publica también las resoluciones de destino de los
videocodificadores. La traza es como la de restitución, pero el módulo de la cabecera es
`IL<n>_ILS_` en vez de `TLS`, e **incluye la línea** de la que procede el envío:

```
IL:1 #N11649052;C30100000 21:10:59:282 INF IL1_ILS_ - processSanction: addressRead on mpId=40011D6C : code=36202
```

`code`: 5 dígitos → encaminamiento; 11 → distribución (CP + sección (3) + calle (3)).

La videocodificación se representa como un **sistema aparte**: un módulo propio, separado de la línea.

### Fase 3: presentación

- **Modelo:** `OrigenLectura` incluye `'videocodificacion'`; campo opcional `etiquetaVideocodificacion?`
  en `ModuloCoordsConfig`.
- **Módulo `VCS-01`** (demo): sin fotocélulas, 140 × 56 (mismo ancho que el `ACQ-01`), situado por debajo de él
  y alineado con sus bordes (`x: 536, y: 240`). El lienzo de la línea pasa de 300 a 335 px de alto para darle sitio.
- **Vista:** recuadro `VIDEOCODIFICACIÓN` con la misma plantilla, LED y parpadeo que OCR / restitución;
  muestra el CP (+ distribución), sin línea de texto.
- **Estado independiente** (`LecturaDestinoEstadoService`): el resultado de videocodificación llega más
  tarde y es de un envío anterior al que está en el ACQ, así que **no borra** la lectura de OCR /
  restitución **ni es borrado** por ellas. Solo lo sustituye otro resultado de videocodificación
  (o la desconexión).

### Fase 4: lógica de servicio

- **`VideocodificacionProcessorService.analizarTraza(trace, linea)`** → `LecturaDestino[] | null`
  (`origen: 'videocodificacion'`, `texto: ''`). Exige `IL<n>_ILS_ - processSanction: addressRead`.
  **La línea se toma de la cabecera de la traza** (`IL<n>_ILS_`), no del registro `mpId → línea` de
  `EnvioLineaService`: una videocodificación puede tardar hasta 22 s y para entonces el envío puede haber
  salido ya del registro (200 envíos). Así se capturan todos los resultados; se descartan los de otra línea.
- **`TrackingWebsocketService`:** `_handleTrace()` llama a `procesarTrazasVideocodificacion(trace.data, true)`
  tras la restitución (cuya regex exige `TLS` e ignora las trazas `ILS`).
- **Demo:** botón **🎲 Simular Videocodificación** (traza `IL1_ILS_`; incluye un resultado de la
  línea 2 que debe descartarse).

Formato confirmado con una traza real (2026-10-08).
