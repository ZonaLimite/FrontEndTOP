import { Injectable, inject } from '@angular/core';
import { LecturaDestino } from '../models/modulo-transporte.model';
import { EnvioLineaService } from './envio-linea.service';

/**
 * Servicio para analizar cadenas de traza y detectar destinos obtenidos por
 * videocodificación en línea: sanción de un videocodificador sobre la imagen
 * de un envío que el OCR no resolvió, publicada por el módulo de traza ILS.
 *
 * La traza es igual que la de restitución (ver RestitucionProcessorService),
 * salvo que lleva la cadena "ILS" en vez de "TLS":
 *   "IL:1 #N44548575;C30100000 19:02:26:378 INF ILS      - processSanction: addressRead on mpId=400CE551 : code=20280"
 *   "IL:1 #N44572539;C30100000 19:02:44:379 INF ILS      - processSanction: addressRead on mpId=400CE5D5 : code=01013177001"
 *
 *   mpId → identificador del envío (el mismo que 'MP=' en las trazas de espesor)
 *   code → 5 dígitos: encaminamiento (CP); 11: distribución (CP + sección (3) + calle (3))
 *
 * Como en la restitución, la traza no dice qué línea trató el envío: la línea
 * se resuelve por el mpId con EnvioLineaService.
 */
@Injectable({
  providedIn: 'root'
})
export class VideocodificacionProcessorService {

  private envioLinea = inject(EnvioLineaService);

  // ─── Constantes de detección ─────────────────────────────────────────────

  /** Marca rápida para descartar trazas antes de aplicar la regex (común con la restitución) */
  private static readonly MARCA_SANCION = 'processSanction: addressRead';

  /** Distingue la videocodificación de la restitución ("TLS"): puede ir en cualquier lugar de la traza */
  private static readonly MARCA_VIDEOCODIFICACION = 'ILS';

  /**
   * Grupos: 1 → mpId, 2 → code (vacío o no numérico si no hay destino).
   */
  private static readonly REGEX_SANCION =
    /processSanction:\s+addressRead\s+on\s+mpId=(\w+)\s*:\s*code=(\S*)/;

  // ─── API pública ─────────────────────────────────────────────────────────

  /**
   * Analiza un string de traza multilínea y devuelve los resultados de
   * videocodificación de envíos de la línea indicada, o `null` si no se
   * detecta ninguno. Se descartan los de envíos de otra línea o de línea
   * desconocida.
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
      if (!lineaTraza.includes(VideocodificacionProcessorService.MARCA_VIDEOCODIFICACION)) continue;
      const match = lineaTraza.match(VideocodificacionProcessorService.REGEX_SANCION);
      if (match && this.envioLinea.lineaDe(match[1]) === linea) {
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
