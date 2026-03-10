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
 * 3. "onTakeMailPiece ... sur <NOMBRE>"  → activación   (ocultación)
 * 4. "clearTrackingPoint ... sur <NOMBRE>"→ desactivación (desocultación)
 * 5. "TakeMailPiece() from <NOMBRE>"     → activación   (ocultación)
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
   * Detecta trazas con "onTakeMailPiece ... sur <fotocelula>"
   * → activación (ocultación)
   */
  private static readonly REGEX_ON_TAKE =
    /onTakeMailPiece\s*.*?\s+sur\s+(\S+)/;

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
      return {
        fotocelula: this.limpiarNombreFotocelula(matchOnTake[1]),
        evento: 'activacion'
      };
    }

    // 3. clearTrackingPoint ... sur <fotocelula> → desactivación
    const matchClear = linea.match(TraceProcessorService.REGEX_CLEAR);
    if (matchClear) {
      return {
        fotocelula: this.limpiarNombreFotocelula(matchClear[1]),
        evento: 'desactivacion'
      };
    }

    // 4. BeltConveyor RE ... sur <fotocelula> → activación
    const matchRE = linea.match(TraceProcessorService.REGEX_RE);
    if (matchRE) {
      return {
        fotocelula: this.limpiarNombreFotocelula(matchRE[1]),
        evento: 'desactivacion'
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

    return null;
  }

  /**
   * Elimina posibles caracteres sobrantes del nombre de la fotocélula
   * (comas, puntos, puntos y coma que pudieran ir pegados al final).
   */
  private limpiarNombreFotocelula(nombre: string): string {
    return nombre.replace(/[,;.]+$/, '');
  }
}
