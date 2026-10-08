import { Injectable } from '@angular/core';
import { LecturaDestino } from '../models/modulo-transporte.model';

/**
 * Servicio para analizar cadenas de traza y detectar destinos obtenidos por
 * videocodificación en línea: sanción de un videocodificador sobre la imagen
 * de un envío que el OCR no resolvió, publicada por el módulo de traza ILS.
 *
 * Estructura esperada de la traza:
 *   "IL:1 #N11649052;C30100000 21:10:59:282 INF IL1_ILS_ - processSanction: addressRead on mpId=40011D6C : code=36202"
 *
 *   IL<n>_ILS_ → línea n de la que procede el envío
 *   mpId       → identificador del envío (no se usa)
 *   code       → 5 dígitos: encaminamiento (CP); 11: distribución (CP + sección (3) + calle (3))
 *
 * A diferencia de la restitución (módulo TLS, sin línea en la traza), aquí la
 * línea se toma de la propia cabecera y no del registro mpId → línea de
 * EnvioLineaService: una videocodificación puede tardar hasta 22 s y para
 * entonces el envío puede haber salido ya de ese registro.
 */
@Injectable({
  providedIn: 'root'
})
export class VideocodificacionProcessorService {

  // ─── Constantes de detección ─────────────────────────────────────────────

  /** Marca rápida para descartar trazas antes de aplicar la regex (común con la restitución) */
  private static readonly MARCA_SANCION = 'processSanction: addressRead';

  /**
   * El módulo IL<n>_ILS_ distingue la videocodificación de la restitución (TLS).
   * Grupos: 1 → línea, 2 → code (vacío o no numérico si no hay destino).
   */
  private static readonly REGEX_SANCION =
    /\bIL(\d+)_ILS_*\s+-\s+processSanction:\s+addressRead\s+on\s+mpId=\w+\s*:\s*code=(\S*)/;

  // ─── API pública ─────────────────────────────────────────────────────────

  /**
   * Analiza un string de traza multilínea y devuelve los resultados de
   * videocodificación de envíos de la línea indicada, o `null` si no se
   * detecta ninguno. Se descartan los de envíos de otra línea.
   *
   * @param trace - Cadena con el contenido de traza a analizar (una o varias líneas)
   * @param linea - Línea de entrada a conservar ('1', '2')
   */
  analizarTraza(trace: string, linea: string): LecturaDestino[] | null {
    if (!trace || !trace.includes(VideocodificacionProcessorService.MARCA_SANCION)) {
      return null;
    }

    const lecturas: LecturaDestino[] = [];

    for (const lineaTraza of trace.split('\n')) {
      const match = lineaTraza.match(VideocodificacionProcessorService.REGEX_SANCION);
      if (match && match[1] === linea) {
        lecturas.push(this.crearLectura(match[2]));
      }
    }

    return lecturas.length > 0 ? lecturas : null;
  }

  // ─── Privado ─────────────────────────────────────────────────────────────

  /**
   * Construye la lectura a partir del campo code.
   */
  private crearLectura(code: string): LecturaDestino {
    const base = { origen: 'videocodificacion' as const, texto: '', timestamp: Date.now() };

    if (/^\d{11}$/.test(code)) {
      return { ...base, estado: 'distribucion', cp: code.slice(0, 5), distribucion: code.slice(5) };
    }
    if (/^\d{5}$/.test(code)) {
      return { ...base, estado: 'encaminamiento', cp: code, distribucion: null };
    }
    console.warn('[Videocodificación] Campo code con formato inesperado:', code);
    return { ...base, estado: 'no-reconocido', cp: null, distribucion: null };
  }
}
