import { Injectable } from '@angular/core';
import { LecturaDestino } from '../models/modulo-transporte.model';

/**
 * Servicio para analizar cadenas de traza y detectar resultados de lectura
 * de destino del OCR (proceso URA).
 *
 * Estructura esperada de la traza (una por línea):
 *   "IL:1 #N38854254;C30100100 22:23:57:498 INF IL2_URA_ -    texte    DACTHN 50012            S:ES50012_________ NC:2 NS:3 IS:0a ZARAGOZA"
 *   "IL:1 #N38936892;C30100100 22:27:30:039 INF IL2_URA_ -    texte    DACTHN 01006 104001     S:ES01006104001___ NC:6 NS:5 IS:0a VITORIA GAS"
 *   "IL:1 #N38872279;C30100100 22:24:08:254 INF IL2_URA_ -    texte    MANUHN R_REC            S:________________ NC:0 NS:0 IS:00"
 *
 *   IL<n>_URA_   → línea n (el prefijo 'IL:1 #N…;' lo añade el Engine y no se usa)
 *   S:ES<dígitos> → 5 dígitos: encaminamiento (CP); 11: distribución (CP + 6)
 *   S:____…       → sin dígitos: no reconocido (ej: R_REC)
 *   IS:<xx> <texto> → destino en texto (puede venir vacío)
 *
 * Se filtra por IL<n> con la línea elegida por el usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class OcrProcessorService {

  // ─── Constantes de detección ─────────────────────────────────────────────

  /** Marca rápida para descartar trazas antes de aplicar la regex */
  private static readonly MARCA_OCR = '_URA_';

  /**
   * Grupos: 1 → línea, 2 → dígitos del campo S (vacío si no reconocido), 3 → texto.
   */
  private static readonly REGEX_OCR =
    /\bIL(\d+)_URA_\s+-\s+texte\s+\S+\s+.*?\bS:(?:ES(\d+))?_*\s+NC:\d+\s+NS:\d+\s+IS:\w+[ \t]*(.*)$/;

  // ─── API pública ─────────────────────────────────────────────────────────

  /**
   * Analiza un string de traza multilínea y devuelve las lecturas OCR
   * de la línea indicada, o `null` si no se detecta ninguna.
   *
   * @param trace - Cadena con el contenido de traza a analizar (una o varias líneas)
   * @param linea - Línea de entrada a conservar ('1', '2'); el resto se descarta
   */
  analizarTraza(trace: string, linea: string): LecturaDestino[] | null {
    if (!trace || !trace.includes(OcrProcessorService.MARCA_OCR)) {
      return null;
    }

    const lecturas: LecturaDestino[] = [];

    for (const lineaTraza of trace.split('\n')) {
      const match = lineaTraza.match(OcrProcessorService.REGEX_OCR);
      if (match && match[1] === linea) {
        lecturas.push(this.crearLectura(match[2] ?? '', match[3].trim()));
      }
    }

    return lecturas.length > 0 ? lecturas : null;
  }

  // ─── Privado ─────────────────────────────────────────────────────────────

  /**
   * Construye la lectura a partir de los dígitos del campo S y el texto.
   */
  private crearLectura(digitos: string, texto: string): LecturaDestino {
    const base = { origen: 'ocr' as const, texto, timestamp: Date.now() };

    if (digitos.length === 11) {
      return { ...base, estado: 'distribucion', cp: digitos.slice(0, 5), distribucion: digitos.slice(5) };
    }
    if (digitos.length === 5) {
      return { ...base, estado: 'encaminamiento', cp: digitos, distribucion: null };
    }
    if (digitos.length > 0) {
      console.warn(`[OCR] Campo S con longitud inesperada (${digitos.length}):`, digitos);
    }
    return { ...base, estado: 'no-reconocido', cp: null, distribucion: null };
  }
}
