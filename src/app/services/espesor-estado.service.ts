import { Injectable, inject, signal } from '@angular/core';
import { EstadoEspesor, MedidaEspesor } from '../models/modulo-transporte.model';
import { RenderSchedulerService } from './render-scheduler.service';

/**
 * Servicio para gestionar el estado reactivo de las medidas de espesor
 * de las cartas alimentadas en los módulos feeder (FED-n).
 *
 * Arquitectura
 * ─────────────────────────────────────────────────────────────────────────
 * EspesorProcessorService (parseo y matching de trazas WebSocket)
 *       ↓ registrarMedida(moduloId, micras)
 *  signal medidas: Record<moduloId, MedidaEspesor>
 *       ↓ ModuloTransporteCoordsComponent lee su entrada (OnPush + Signals)
 *
 * A diferencia de EventosTrackingService, el signal se actualiza en cada
 * medida (sin setInterval): la etiqueta debe reflejar cada carta.
 * Cada medida permanece visible TIEMPO_VISIBLE_MS si no llega otra nueva.
 * La caducidad se programa con RenderSchedulerService.despues(): el timer
 * corre fuera de la zona y no dispara detección de cambios por su cuenta.
 */
@Injectable({
  providedIn: 'root'
})
export class EspesorEstadoService {

  /** Umbrales de clasificación en micras (µm) */
  static readonly UMBRAL_WARNING_MICRAS = 30_000;    // > 30 mm → warning
  static readonly UMBRAL_EXCESIVO_MICRAS = 64_000;   // > 64 mm → excesivo

  /** Tiempo mínimo que una medida permanece visible sin llegar otra (ms) */
  static readonly TIEMPO_VISIBLE_MS = 3000;

  // ─── SIGNALS: estado observable ───────────────────────────────────────────

  /** Última medida vigente por id de módulo feeder */
  readonly medidas = signal<Record<string, MedidaEspesor>>({});

  private renderScheduler = inject(RenderSchedulerService);

  constructor() {
    console.log('EspesorEstadoService inicializado');
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Registra una medida de espesor para un módulo feeder.
   * Programa su caducidad; una medida posterior la sustituye y anula esa caducidad.
   *
   * @param moduloId - Id del módulo feeder (ej: 'FED-01')
   * @param micras   - Espesor medido en micras, tal como llega en la traza
   */
  registrarMedida(moduloId: string, micras: number): void {
    if (!Number.isFinite(micras) || micras < 0) {
      console.warn(`[Espesor] Medida descartada para ${moduloId}:`, micras);
      return;
    }

    const medida: MedidaEspesor = {
      micras,
      mm: micras / 1000,
      estado: EspesorEstadoService.clasificar(micras),
      timestamp: Date.now()
    };
    this.medidas.update(m => ({ ...m, [moduloId]: medida }));

    this.renderScheduler.despues(EspesorEstadoService.TIEMPO_VISIBLE_MS, () => this.caducar(moduloId, medida));
  }

  /**
   * Borra todas las medidas vigentes (las caducidades pendientes quedan sin efecto).
   */
  reset(): void {
    this.medidas.set({});
  }

  /**
   * Clasifica un espesor en micras según los umbrales definidos.
   */
  static clasificar(micras: number): EstadoEspesor {
    if (micras === 0) return 'warning';
    if (micras > EspesorEstadoService.UMBRAL_EXCESIVO_MICRAS) return 'excesivo';
    if (micras > EspesorEstadoService.UMBRAL_WARNING_MICRAS) return 'warning';
    return 'ok';
  }

  // ─── Privados ─────────────────────────────────────────────────────────────

  /**
   * Elimina la medida de un módulo al vencer su tiempo de visibilidad,
   * solo si sigue siendo la vigente (no ha llegado otra después).
   */
  private caducar(moduloId: string, medida: MedidaEspesor): void {
    if (this.medidas()[moduloId] !== medida) return;
    this.medidas.update(m => {
      const { [moduloId]: _, ...resto } = m;
      return resto;
    });
  }
}
