import { Component, inject, computed, signal } from '@angular/core';
import { RechazosEstadoService, RegistroRechazo } from '../../services/rechazos-estado.service';

@Component({
  selector: 'app-estadisticas-rechazo',
  standalone: false,
  templateUrl: './estadisticas-rechazo.component.html',
  styleUrls: ['./estadisticas-rechazo.component.css']
})
export class EstadisticasRechazoComponent {

  // ─── Dependencias ──────────────────────────────────────────────────────────
  private rechazosService = inject(RechazosEstadoService);

  // ─── Signals locales ───────────────────────────────────────────────────────

  /** Controla la visibilidad de la tabla de historial */
  mostrarHistorial = signal(false);

  // ─── computed(): derivaciones del estado del servicio ─────────────────────

  /**
   * Resumen de rechazos agrupados por denominación, ordenado por count desc.
   * Se actualiza automáticamente al cambiar el signal del servicio.
   */
  resumen = computed(() => this.rechazosService.resumen());

  /**
   * Total acumulado de todos los rechazos.
   */
  totalRechazos = computed(() => this.rechazosService.totalRechazos());

  /**
   * Denominación con el mayor número de rechazos (para el highlight de máximo).
   */
  denominacionMasFrecuente = computed(() =>
    this.rechazosService.denominacionMasFrecuente()
  );

  /**
   * Historial global de rechazos (más reciente primero).
   */
  historial = computed(() => this.rechazosService.signal_historial());

  // ─── Acciones ──────────────────────────────────────────────────────────────

  toggleHistorial(): void {
    this.mostrarHistorial.update(v => !v);
  }

  limpiarEstadisticas(): void {
    this.rechazosService.limpiarEstadisticas();
  }

  exportarCSV(): void {
    const nombre = `estadisticas-rechazos-${new Date().toISOString().split('T')[0]}.csv`;
    this.rechazosService.descargarCSV(nombre);
  }

  // ─── Helpers de presentación ───────────────────────────────────────────────

  /**
   * Devuelve true si este registro es el de mayor frecuencia
   * (para aplicar el highlight de máximo animado).
   */
  esMaximo(registro: RegistroRechazo): boolean {
    return registro.count > 0 &&
      registro.denominacion === this.denominacionMasFrecuente();
  }

  /**
   * Clase de intensidad de color según el count del registro,
   * usando los mismos umbrales que estadisticas-eventos.
   */
  getClaseIntensidad(registro: RegistroRechazo): string {
    if (this.esMaximo(registro)) return '';   // el máximo usa su propia clase
    if (registro.count === 0)    return 'intensidad-0';
    if (registro.count <= 25)    return 'intensidad-1';
    if (registro.count <= 50)    return 'intensidad-2';
    if (registro.count <= 75)    return 'intensidad-3';
    return 'intensidad-4';
  }
}
