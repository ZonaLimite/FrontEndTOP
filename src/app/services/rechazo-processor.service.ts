import { Injectable } from '@angular/core';

/**
 * Resultado individual del análisis de una traza de tipo Rechazo.
 *
 * Estructura esperada de la traza (tokens delimitados por coma):
 *   <prefijo> - REJET  ,  <DENOMINACION>  ,  <INFO>
 *
 * Ejemplos:
 *   "15:15:36:033 WRN IL1_MAIN - REJET, ANNULATION_SC, pli 400218A1"
 *   "06:19:35:985 WRN IL1_MAIN - REJET, CONVOYAGE, pli 400181E2 LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur CUL-B1 ! : diff=-603084229 ms"
 */
export interface EventoRechazo {
  /** Token 1: fragmento de la traza que contiene la cadena "- REJET" */
  key: string;
  /** Token 2: nombre o tipo del rechazo detectado (clave de agrupación) */
  denominacion: string;
  /** Token 3: información complementaria (puede contener comas internas) */
  info: string;
}

/**
 * Servicio para analizar cadenas de traza y detectar eventos de tipo Rechazo.
 *
 * Regla de detección:
 * ─────────────────────────────────────────────────────────────────
 * Una línea es de tipo REJET si contiene la subcadena "- REJET".
 * En ese caso, se divide la línea por comas:
 *   tokens[0]              → KEY          (contiene "- REJET")
 *   tokens[1].trim()       → DENOMINACION (segundo token)
 *   tokens.slice(2).join(',').trim() → INFO (tercer token, reensamblado
 *                                           para preservar comas internas)
 */
@Injectable({
  providedIn: 'root'
})
export class RechazoProcessorService {

  // ─── Constante de detección ──────────────────────────────────────────────

  private static readonly MARCA_REJET = '- REJET';

  // ─── API pública ─────────────────────────────────────────────────────────

  /**
   * Analiza un string de traza multilínea y devuelve un array de eventos
   * de tipo Rechazo detectados, o `null` si no se detecta ninguno.
   *
   * @param trace - Cadena con el contenido de traza a analizar (una o varias líneas)
   * @returns Array de `EventoRechazo` encontrados, o `null`
   *
   * @example
   * ```ts
   * const resultado = service.analizarTraza(cadenaTraza);
   * // [{ key: '...IL1_MAIN - REJET', denominacion: 'ANNULATION_SC', info: 'pli 400218A1' }, ...]
   * ```
   */
  analizarTraza(trace: string): EventoRechazo[] | null {
    if (!trace || trace.trim().length === 0) {
      return null;
    }

    const lineas = trace.split('\n');
    const eventos: EventoRechazo[] = [];

    for (const linea of lineas) {
      const evento = this.procesarLinea(linea.trim());
      if (evento) {
        eventos.push(evento);
      }
    }

    return eventos.length > 0 ? eventos : null;
  }

  // ─── Privado ─────────────────────────────────────────────────────────────

  /**
   * Procesa una única línea de traza.
   * Si contiene "- REJET", extrae los tres tokens y construye un EventoRechazo.
   * En caso contrario devuelve null.
   */
  private procesarLinea(linea: string): EventoRechazo | null {
    if (!linea || !linea.includes(RechazoProcessorService.MARCA_REJET)) {
      return null;
    }

    // Dividir por coma para extraer los tres tokens
    const tokens = linea.split(',');

    if (tokens.length < 2) {
      // La línea tiene la marca REJET pero no sigue la estructura esperada
      return null;
    }

    const key          = tokens[0].trim();
    const denominacion = tokens[1].trim();
    // El tercer token puede contener comas internas (p.ej. Ejemplo 2):
    // se reensamblan todos los tokens a partir del índice 2.
    const info         = tokens.length > 2
      ? tokens.slice(2).join(',').trim()
      : '';

    if (!denominacion) {
      return null;
    }

    return { key, denominacion, info };
  }
}
