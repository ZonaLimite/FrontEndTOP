import { Injectable, signal } from '@angular/core';
import { LecturaDestino, OrigenLectura } from '../models/modulo-transporte.model';

/**
 * Servicio para gestionar el estado reactivo de la última lectura de destino
 * de un envío, por sistema: OCR, restitución (cronomarca) o videocodificación.
 *
 * Arquitectura
 * ─────────────────────────────────────────────────────────────────────────
 * OcrProcessorService / RestitucionProcessorService / VideocodificacionProcessorService
 *       ↓ registrarLectura(lectura)
 *  signals ultimas / contadores (por origen)
 *       ↓ ModuloTransporteCoordsComponent de los ACQ-n y VCS-n (OnPush + Signals)
 *
 * Las trazas no identifican el módulo ACQ: hay uno por línea y se muestra
 * la última lectura de la línea enlazada, que permanece hasta que llega otra.
 * Solo se conserva la del último envío tratado, sea por OCR o por restitución:
 * al registrar una lectura se borra la del otro sistema, para que no se
 * confunda con el destino de un envío anterior.
 * La videocodificación es independiente: su resultado llega más tarde y es de
 * un envío anterior al que está en el ACQ, así que ni borra ni es borrada por
 * las lecturas de OCR / restitución.
 */
@Injectable({
  providedIn: 'root'
})
export class LecturaDestinoEstadoService {

  // ─── SIGNALS: estado observable ───────────────────────────────────────────

  /**
   * Últimas lecturas de destino recibidas: de OCR / restitución solo la del
   * sistema que trató el último envío, más la última de videocodificación.
   */
  readonly ultimas = signal<Partial<Record<OrigenLectura, LecturaDestino>>>({});

  /**
   * Número de lecturas registradas por cada sistema. La vista lo usa para
   * señalar cada lectura aunque se repita el mismo destino.
   */
  readonly contadores = signal<Record<OrigenLectura, number>>({ ocr: 0, restitucion: 0, videocodificacion: 0 });

  constructor() {
    console.log('LecturaDestinoEstadoService inicializado');
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Registra una lectura de destino. Las de OCR y restitución sustituyen a la
   * anterior, sea de su sistema o del otro; la de videocodificación solo
   * sustituye a la anterior de videocodificación.
   */
  registrarLectura(lectura: LecturaDestino): void {
    this.ultimas.update(u => lectura.origen === 'videocodificacion'
      ? { ...u, videocodificacion: lectura }
      : { videocodificacion: u.videocodificacion, [lectura.origen]: lectura });
    this.contadores.update(c => ({ ...c, [lectura.origen]: c[lectura.origen] + 1 }));
  }

  /**
   * Borra las últimas lecturas y sus contadores.
   */
  reset(): void {
    this.ultimas.set({});
    this.contadores.set({ ocr: 0, restitucion: 0, videocodificacion: 0 });
  }
}
