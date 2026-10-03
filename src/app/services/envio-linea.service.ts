import { Injectable } from '@angular/core';

/**
 * Registro de la línea de entrada por la que circula cada envío (MP).
 *
 * Las trazas del servidor de restitución (módulo TLS) son comunes a todas
 * las líneas: traen el identificador del envío pero no la línea que hizo la
 * petición. Las trazas de espesor del feeder sí traen ambos datos y llegan
 * antes (el envío pasa por el feeder antes que por el ACQ), así que se usan
 * para anotar MP → línea y resolver después la línea de cada restitución.
 *
 * El MP es un número de secuencia de control: no codifica la línea.
 */
@Injectable({
  providedIn: 'root'
})
export class EnvioLineaService {

  /** Envíos recordados: de sobra para el tránsito feeder → ACQ de las dos líneas */
  static readonly MAX_ENVIOS = 200; // con 200 es mas que suficiente para las dos líneas, incluso con un feeder lento

  /** MP → línea, en orden de registro (el primero es el más antiguo) */
  private lineas = new Map<string, string>();

  /**
   * Anota la línea de un envío. Al superar MAX_ENVIOS se olvida el más antiguo.
   */
  registrar(mp: string, linea: string): void {
    this.lineas.delete(mp);
    this.lineas.set(mp, linea);
    if (this.lineas.size > EnvioLineaService.MAX_ENVIOS) {
      this.lineas.delete(this.lineas.keys().next().value!);
    }
  }

  /**
   * Línea por la que circula un envío, o undefined si no se conoce
   * (ej: se perdió su traza de espesor).
   */
  lineaDe(mp: string): string | undefined {
    return this.lineas.get(mp);
  }

  reset(): void {
    this.lineas.clear();
  }
}
