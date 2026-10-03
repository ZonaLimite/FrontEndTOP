import { Injectable, signal } from '@angular/core';
import { LecturaDestino, OrigenLectura } from '../models/modulo-transporte.model';

/**
 * Servicio para gestionar el estado reactivo de la última lectura de destino
 * de un envío, por sistema: OCR o restitución (cronomarca).
 *
 * Arquitectura
 * ─────────────────────────────────────────────────────────────────────────
 * OcrProcessorService / RestitucionProcessorService
 *       ↓ registrarLectura(lectura)
 *  signals ultimas / contadores (por origen)
 *       ↓ ModuloTransporteCoordsComponent de los ACQ-n (OnPush + Signals)
 *
 * Las trazas no identifican el módulo ACQ: hay uno por línea y se muestra
 * la última lectura de la línea enlazada, que permanece hasta que llega otra.
 * Solo se conserva la del último envío tratado, sea por OCR o por restitución:
 * al registrar una lectura se borra la del otro sistema, para que no se
 * confunda con el destino de un envío anterior.
 */
@Injectable({
  providedIn: 'root'
})
export class LecturaDestinoEstadoService {

  // ─── SIGNALS: estado observable ───────────────────────────────────────────

  /** Última lectura de destino recibida: solo tiene la entrada del sistema que la obtuvo */
  readonly ultimas = signal<Partial<Record<OrigenLectura, LecturaDestino>>>({});

  /**
   * Número de lecturas registradas por cada sistema. La vista lo usa para
   * señalar cada lectura aunque se repita el mismo destino.
   */
  readonly contadores = signal<Record<OrigenLectura, number>>({ ocr: 0, restitucion: 0 });

  constructor() {
    console.log('LecturaDestinoEstadoService inicializado');
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Registra una lectura de destino: sustituye a la anterior, sea de su
   * sistema o del otro.
   */
  registrarLectura(lectura: LecturaDestino): void {
    this.ultimas.set({ [lectura.origen]: lectura });
    this.contadores.update(c => ({ ...c, [lectura.origen]: c[lectura.origen] + 1 }));
  }

  /**
   * Borra las últimas lecturas y sus contadores.
   */
  reset(): void {
    this.ultimas.set({});
    this.contadores.set({ ocr: 0, restitucion: 0 });
  }
}
