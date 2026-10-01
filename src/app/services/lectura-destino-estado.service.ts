import { Injectable, signal } from '@angular/core';
import { LecturaDestino } from '../models/modulo-transporte.model';

/**
 * Servicio para gestionar el estado reactivo de la última lectura de destino
 * de un envío, obtenida por OCR o por restitución (cronomarca).
 *
 * Arquitectura
 * ─────────────────────────────────────────────────────────────────────────
 * OcrProcessorService (y restitución, pendiente)
 *       ↓ registrarLectura(lectura)
 *  signal ultimaLectura
 *       ↓ ModuloTransporteCoordsComponent de los ACQ-n (OnPush + Signals)
 *
 * Las trazas no identifican el módulo ACQ: hay uno por línea y se muestra
 * la última lectura de la línea enlazada. Sin identificador de envío, solo
 * interesa la última lectura: permanece hasta que llega otra.
 */
@Injectable({
  providedIn: 'root'
})
export class LecturaDestinoEstadoService {

  // ─── SIGNALS: estado observable ───────────────────────────────────────────

  /** Última lectura de destino recibida; null si aún no hay ninguna */
  readonly ultimaLectura = signal<LecturaDestino | null>(null);

  constructor() {
    console.log('LecturaDestinoEstadoService inicializado');
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Registra una lectura de destino (sustituye a la anterior).
   */
  registrarLectura(lectura: LecturaDestino): void {
    this.ultimaLectura.set(lectura);
  }

  /**
   * Borra la última lectura.
   */
  reset(): void {
    this.ultimaLectura.set(null);
  }
}
