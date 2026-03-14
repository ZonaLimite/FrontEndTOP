import { Injectable } from '@angular/core';

/**
 * Resultado individual del análisis de una traza de fotocélula.
 */
export interface EventoFotocelula {
  /** Nombre de la fotocélula detectada */
  fotocelula: string;
  /** Tipo de evento: activación (ocultación) o desactivación (desocultación) */
  evento: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
}

/**
 * Servicio para analizar cadenas de traza del sistema y detectar
 * eventos de activación (ocultación) y desactivación (desocultación)
 * de fotocélulas.
 *
 * Reglas de detección:
 * ─────────────────────────────────────────────────────────────────
 * 1. "BeltConveyor RE ... sur <NOMBRE>"  → activación   (ocultación)
 * 2. "BeltConveyor FE ... sur <NOMBRE>"  → desactivación (desocultación)
 * 3. "MAIN - BeltConveyor onTakeMailPiece ... sur <NOMBRE>"  → activación   (ocultación)
 * 4. "clearTrackingPoint ... sur <NOMBRE>"→ desactivación (desocultación)
 * 5. "TakeMailPiece() from <NOMBRE>"     → activación   (ocultación)
 * 6. "ACC_ - occulted    from <NOMBRE>"     → activación   (ocultación)
 * 7. "LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur <NOMBRE> ! : diff=<VALOR>ms"
 *    → retraso (si VALOR < 0) | adelanto (si VALOR > 0)
 * 8. ": apparition <IdCarta> sur <NOMBRE>" → apparition
 
 */
@Injectable({
  providedIn: 'root'
})
export class TraceProcessorService {

  // ─── Patrones de detección ──────────────────────────────────────────────

  /**
   * Detecta trazas con "BeltConveyor RE ... sur <fotocelula>"
   * → activación (ocultación)
   */
  private static readonly REGEX_RE =
    /BeltConveyor\s+RE\s+\S+\s+sur\s+(\S+)/;

  /**
   * Detecta trazas con "BeltConveyor FE ... sur <fotocelula>"
   * → desactivación (desocultación)
   */
  private static readonly REGEX_FE =
    /BeltConveyor\s+FE\s+\S+\s+sur\s+(\S+)/;

  /**
   * Detecta trazas con "MAIN - BeltConveyor onTakeMailPiece ... sur <fotocelula>"
   * → activación (ocultación)
   */
  private static readonly REGEX_ON_TAKE =
    /MAIN - BeltConveyor onTakeMailPiece\s*.*?\s+sur\s+(\S+)/;

  /**
   * Detecta trazas con "clearTrackingPoint ... sur <fotocelula>"
   * → desactivación (desocultación)
   */
  private static readonly REGEX_CLEAR =
    /clearTrackingPoint\s*.*?\s+sur\s+(\S+)/;

  /**
   * Detecta trazas con "TakeMailPiece() from <fotocelula>"
   * → activación (ocultación)
   * Caso especial: la fotocélula se extrae de "from <nombre>"
   */
  private static readonly REGEX_TAKE_FROM =
    /TakeMailPiece\(\)\s+from\s+(\S+)/;

  /**
   * Detecta trazas con "ACC_ - occulted    from <fotocelula>
   * -> activacion (ocultacion)
   * Caso especial: la fotocélula se extrae de "from <nombre>
   */
  private static readonly REGEX_ACC_OCCULTED =
    /ACC_ - occulted    from\s+(\S+)/;

  /**
   * Detecta trazas con "LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur <NOMBRE> ! : diff=<VALOR>ms"
   * → retraso (si valor < 0) | adelanto (si valor > 0)
   */
  private static readonly REGEX_PLI_DEHORS =
    /LE_PLI_EST_EN_DEHORS_DE_SON_PAS\s+sur\s+(\S+)\s+!\s*:\s*diff=([+-]?\d+(?:\.\d+)?)\s*ms/;

  /**
   * Detecta trazas con ": apparition <IdCarta> sur <NOMBRE>"
   * → apparition
   */
  private static readonly REGEX_APPARITION =
    /:\s*apparition\s+\S+\s+sur\s+(\S+)/;

  // ─── API pública ────────────────────────────────────────────────────────

  /**
   * Analiza un string de traza multilínea y devuelve un array de eventos
   * de activación/desactivación de fotocélulas detectados, o `null` si no
   * se detecta ningún evento.
   *
   * @param trace - Cadena con el contenido de traza a analizar
   * @returns Array de `EventoFotocelula` con los eventos encontrados, o `null`
   *
   * @example
   * ```ts
   * const resultado = service.analizarTraza(cadenaTraza);
   * // [{ fotocelula: 'CUL-B5', evento: 'desactivacion' }, ...]
   * ```
   */
  analizarTraza(trace: string): EventoFotocelula[] | null {
    if (!trace || trace.trim().length === 0) {
      return null;
    }

    const lineas = trace.split('\n');
    const eventos: EventoFotocelula[] = [];

    for (const linea of lineas) {
      const evento = this.procesarLinea(linea.trim());
      if (evento) {
        eventos.push(evento);
      }
    }

    return eventos.length > 0 ? eventos : null;
  }

  // ─── Privado ────────────────────────────────────────────────────────────

  /**
   * Procesa una línea individual de traza y determina si contiene un
   * evento de fotocélula. Las reglas se evalúan por orden de prioridad:
   *
   *  1. TakeMailPiece() from ...  (caso especial)
   *  2. onTakeMailPiece ... sur ...
   *  3. clearTrackingPoint ... sur ...
   *  4. BeltConveyor RE ... sur ...
   *  5. BeltConveyor FE ... sur ...
   *  6. ACC_ - occulted    from <NOMBRE>     → activación   (ocultación)
   *  7. LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur <NOMBRE> ! : diff=<VALOR>ms"
   *    → retraso (si VALOR < 0) | adelanto (si VALOR > 0)
   */
  private procesarLinea(linea: string): EventoFotocelula | null {
    if (!linea) {
      return null;
    }

    // 1. Caso especial: TakeMailPiece() from <fotocelula>
    const matchTakeFrom = linea.match(TraceProcessorService.REGEX_TAKE_FROM);
    if (matchTakeFrom) {
      return {
        fotocelula: this.limpiarNombreFotocelula(matchTakeFrom[1]),
        evento: 'activacion'
      };
    }

    // 2. onTakeMailPiece ... sur <fotocelula> → activación
    const matchOnTake = linea.match(TraceProcessorService.REGEX_ON_TAKE);
    if (matchOnTake) {
      if (matchOnTake[1].includes("Input_1")) {
        return {
          fotocelula: this.limpiarNombreFotocelula("ACQ-B1"),
          evento: 'activacion'
        };
      }
      return {
        fotocelula: this.limpiarNombreFotocelula(matchOnTake[1]),
        evento: 'activacion'
      };
    }


    // 5. BeltConveyor FE ... sur <fotocelula> → desactivación
    const matchFE = linea.match(TraceProcessorService.REGEX_FE);
    if (matchFE) {
      return {
        fotocelula: this.limpiarNombreFotocelula(matchFE[1]),
        evento: 'activacion'
      };
    }
    // 6. Caso especial: la fotocélula se extrae de "from <nombre>
    // "ACC_ - occulted    from <NOMBRE>"     → activación   (ocultación)
    const matchAccOcculted = linea.match(TraceProcessorService.REGEX_ACC_OCCULTED);
    if (matchAccOcculted) {
      return {
        fotocelula: this.limpiarNombreFotocelula(matchAccOcculted[1]),
        evento: 'activacion'
      };
    }

    // 7. LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur <NOMBRE> ! : diff=<VALOR>ms
    //    → retraso (valor < 0) | adelanto (valor > 0)
    const matchPliDehors = linea.match(TraceProcessorService.REGEX_PLI_DEHORS);
    if (matchPliDehors) {
      const valor = parseFloat(matchPliDehors[2]);
      return {
        fotocelula: this.limpiarNombreFotocelula(matchPliDehors[1]),
        evento: valor < 0 ? 'retraso' : 'adelanto'
      };
    }

    // 8. : apparition <IdCarta> sur <NOMBRE> → apparition
    const matchApparition = linea.match(TraceProcessorService.REGEX_APPARITION);
    if (matchApparition) {
      return {
        fotocelula: this.limpiarNombreFotocelula(matchApparition[2]),
        evento: 'apparition'
      };
    }

    return null;
  }

  /**
   * Elimina posibles caracteres sobrantes del nombre de la fotocélula
   * (comas, puntos, puntos y coma que pudieran ir pegados al final).
   */
  private limpiarNombreFotocelula(nombre: string): string {
    return nombre.replace(/[,;.]+$/, '')

  }
}
