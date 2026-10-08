import { Injectable } from '@angular/core';

/**
 * Registro de la línea de entrada y del feeder de origen de cada envío (MP).
 *
 * Las trazas del servidor de restitución (módulo TLS) son comunes a todas
 * las líneas: traen el identificador del envío pero no la línea que hizo la
 * petición. Las trazas de espesor del feeder sí traen ambos datos y llegan
 * antes (el envío pasa por el feeder antes que por el ACQ), así que se usan
 * para anotar MP → línea y resolver después la línea de cada restitución.
 *
 * La misma traza dice de qué feeder se singularizó el envío (IL1_FE2_ → feeder 2):
 * se anota también, para indicar el feeder de origen de los envíos rechazados.
 *
 * El MP es un número de secuencia de control: no codifica la línea.
 */
@Injectable({
  providedIn: 'root'
})
export class EnvioLineaService {

  /** Envíos recordados: de sobra para el tránsito feeder → ACQ de las dos líneas */
  static readonly MAX_ENVIOS = 200; // con 200 es mas que suficiente para las dos líneas, incluso con un feeder lento

  /** MP → línea y feeder, en orden de registro (el primero es el más antiguo) */
  private envios = new Map<string, { linea: string; feeder: string }>();

  /**
   * Anota la línea y el feeder de origen de un envío.
   * Al superar MAX_ENVIOS se olvida el más antiguo.
   *
   * @param feeder - Número de feeder tal como llega en la traza (ej: '2')
   */
  registrar(mp: string, linea: string, feeder: string): void {
    this.envios.delete(mp);
    this.envios.set(mp, { linea, feeder });
    if (this.envios.size > EnvioLineaService.MAX_ENVIOS) {
      this.envios.delete(this.envios.keys().next().value!);
    }
  }

  /**
   * Línea por la que circula un envío, o undefined si no se conoce
   * (ej: se perdió su traza de espesor).
   */
  lineaDe(mp: string): string | undefined {
    return this.envios.get(mp)?.linea;
  }

  /**
   * Número del feeder del que se singularizó un envío (ej: '2'),
   * o undefined si no se conoce.
   */
  feederDe(mp: string): string | undefined {
    return this.envios.get(mp)?.feeder;
  }

  reset(): void {
    this.envios.clear();
  }
}
