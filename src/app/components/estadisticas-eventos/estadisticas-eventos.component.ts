import { Component, inject, computed, signal } from '@angular/core';
import { EventosTrackingService, EstadisticasFotocelula } from '../../services/eventos-tracking.service';
import { TipoEvento } from '../../models/modulo-transporte.model';

@Component({
  selector: 'app-estadisticas-eventos',
  standalone: false,
  templateUrl: './estadisticas-eventos.component.html',
  styleUrls: ['./estadisticas-eventos.component.css']
})
export class EstadisticasEventosComponent {

  // inject() — patrón moderno Angular 17, sin necesidad de constructor
  private trackingService = inject(EventosTrackingService);

  // Tipos de eventos disponibles
  readonly tiposEventos: TipoEvento[] = [
    'atiempo', 'retraso', 'adelanto', 'apparition', 'desaparicion'
  ];

  // ─── Signals locales del componente ──────────────────────────────────────

  /** Signal de filtros activos */
  filtrosActivos = signal<Record<TipoEvento, boolean>>({
    activacion: false,
    desactivacion: false,
    atiempo: true,
    retraso: true,
    adelanto: true,
    apparition: true,
    desaparicion: true,
  });

  /** Signal para mostrar/ocultar historial */
  mostrarHistorial = signal(false);

  // ─── computed(): derivaciones automáticas ────────────────────────────────

  /**
   * Estadísticas con totales recalculados según filtros activos.
   * Se recalcula si cambian las estadísticas del servicio O los filtros.
   */
  estadisticasFiltradas = computed(() => {
    const stats = this.trackingService.estadisticas();
    const filtros = this.filtrosActivos();
    return stats.map(est => ({
      ...est,
      total: this.tiposEventos
        .filter(t => filtros[t])
        .reduce((sum, t) => sum + est[t], 0)
    }));
  });

  /**
   * Lista de tipos de evento actualmente activos.
   * Se recalcula cuando filtrosActivos() cambia.
   */
  tiposEventosFiltrados = computed(() =>
    this.tiposEventos.filter(t => this.filtrosActivos()[t])
  );

  /** Acceso directo al signal de historial del servicio */
  historial = this.trackingService.signal_historial;

  /**
   * computed(): suma de cada tipo de evento sobre todas las fotocélulas visibles.
   * Se recalcula automáticamente cuando estadisticasFiltradas() cambia.
   * Ej: { atiempo: 42, retraso: 7, adelanto: 3, apparition: 1, desaparicion: 0 }
   */
  totalesPorTipo = computed(() => {
    const totales: Record<TipoEvento, number> = {
      activacion: 0, desactivacion: 0, atiempo: 0, retraso: 0, adelanto: 0, apparition: 0, desaparicion: 0
    };
    for (const est of this.estadisticasFiltradas()) {
      for (const tipo of this.tiposEventos) {
        totales[tipo] += est[tipo];
      }
    }
    return totales;
  });

  // ─── Acciones ─────────────────────────────────────────────────────────────

  toggleFiltro(tipo: TipoEvento): void {
    this.filtrosActivos.update(f => ({ ...f, [tipo]: !f[tipo] }));
  }

  activarTodosFiltros(): void {
    this.filtrosActivos.set(
      Object.fromEntries(this.tiposEventos.map(t => [t, true])) as Record<TipoEvento, boolean>
    );
  }

  desactivarTodosFiltros(): void {
    this.filtrosActivos.set(
      Object.fromEntries(this.tiposEventos.map(t => [t, false])) as Record<TipoEvento, boolean>
    );
  }

  toggleHistorial(): void {
    this.mostrarHistorial.update(v => !v);
  }

  limpiarEstadisticas(): void {
    this.trackingService.limpiarEstadisticas();
  }

  exportarCSV(): void {
    const nombreArchivo = `estadisticas-eventos-${new Date().toISOString().split('T')[0]}.csv`;
    this.trackingService.descargarCSV(nombreArchivo);
  }

  // ─── Helpers de presentación ──────────────────────────────────────────────

  /**
   * Devuelve el total acumulado de un tipo concreto sobre todas las fotocélulas.
   * Usado en el template para la columna TOTAL.
   */
  getTotalPorTipo(tipo: TipoEvento): number {
    return this.totalesPorTipo()[tipo];
  }

  getColorTipo(tipo: TipoEvento): string {
    const colores: Record<TipoEvento, string> = {
      activacion: '#00aa00',
      desactivacion: '#00aa00',
      atiempo: '#00aa00',
      retraso: '#ffcc00',
      adelanto: '#00ccff',
      apparition: '#ff00ff',
      desaparicion: '#ff3333'
    };
    return colores[tipo];
  }

  esEventoMaximo(fotocelula: EstadisticasFotocelula, tipo: TipoEvento): boolean {
    const tiposExcluidos: TipoEvento[] = ['atiempo'];
    let valorMax = 0;
    let eventoMax: TipoEvento | null = null;
    for (const t of this.tiposEventos) {
      if (tiposExcluidos.includes(t)) continue;
      if (fotocelula[t] > valorMax) {
        valorMax = fotocelula[t];
        eventoMax = t;
      }
    }
    return eventoMax === tipo;
  }
}
