import { Injectable, inject } from '@angular/core';
import { EnvioLineaService } from './envio-linea.service';

/**
 * Resultado individual del análisis de una traza de medida de espesor.
 */
export interface EventoEspesor {
  /** Id del módulo feeder (ej: 'FED-02') */
  moduloId: string;
  /** Espesor medido, en micras (µm) */
  micras: number;
}

/**
 * Servicio para analizar cadenas de traza y detectar medidas de espesor
 * realizadas por el lector de espesor de los módulos feeder.
 *
 * Estructura esperada de la traza:
 *   "C30100200 18:07:09:232 INF IL1_FE2_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=4001B256, thickness=1280"
 *
 *   IL<n>_FE<m>  → línea n, feeder m → módulo 'FED-0m'
 *   T.Reader     → lector de espesor (uno por feeder: se ignora)
 *   MP           → identificador del envío: se anotan su línea y su feeder en
 *                  EnvioLineaService (de cualquier línea) para resolver después la
 *                  línea de su restitución y el feeder de origen de un rechazo
 *   thickness    → espesor medido en micras
 *
 * El model filter 'Medida Espesor' del Engine no distingue línea: llegan
 * trazas de las dos. Se filtra por IL<n> con la línea elegida por el usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class EspesorProcessorService {

  private envioLinea = inject(EnvioLineaService);

  // ─── Constantes de detección ─────────────────────────────────────────────

  /** Marca rápida para descartar líneas antes de aplicar la regex */
  private static readonly MARCA_ESPESOR = 'rootOnMailPieceReportOutputThickness()';

  /**
   * Grupos: 1 → línea, 2 → número de feeder, 3 → MP (opcional), 4 → thickness (micras).
   * Se aceptan valores negativos para que EspesorEstadoService los descarte con aviso.
   */
  private static readonly REGEX_ESPESOR =
    /\bIL(\d+)_FE(\d+)_*\s+-\s+rootOnMailPieceReportOutputThickness\(\)\s*,(?:.*?\bMP=(\w+))?.*?\bthickness=(-?\d+)/;

  // ─── API pública ─────────────────────────────────────────────────────────

  /**
   * Analiza un string de traza multilínea y devuelve las medidas de espesor
   * detectadas en la línea indicada, o `null` si no se detecta ninguna.
   * Anota además la línea y el feeder de cada envío (MP), sea de la línea que sea.
   *
   * @param trace - Cadena con el contenido de traza a analizar (una o varias líneas)
   * @param linea - Línea de entrada a conservar ('1', '2'); el resto se descarta
   *
   * @example
   * ```ts
   * service.analizarTraza('... INF IL1_FE2_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=4001B256, thickness=1280', '1');
   * // [{ moduloId: 'FED-02', micras: 1280 }]
   * ```
   */
  analizarTraza(trace: string, linea: string): EventoEspesor[] | null {
    if (!trace || !trace.includes(EspesorProcessorService.MARCA_ESPESOR)) {
      return null;
    }

    const eventos: EventoEspesor[] = [];

    for (const lineaTraza of trace.split('\n')) {
      const match = lineaTraza.match(EspesorProcessorService.REGEX_ESPESOR);
      if (!match) continue;
      if (match[3]) this.envioLinea.registrar(match[3], match[1], match[2]);
      if (match[1] === linea) {
        eventos.push({
          moduloId: `FED-${match[2].padStart(2, '0')}`,
          micras: Number(match[4])
        });
      }
    }

    return eventos.length > 0 ? eventos : null;
  }
}
