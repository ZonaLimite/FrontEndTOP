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

  /** Signal para filtrar solo eventos de activación en el historial */
  checkEventActivation = signal(false);

  /** Historial computado que filtra los eventos 'activacion' si el checkbox NO está activo */
  historial = computed(() => {
    const todos = this.trackingService.signal_historial();
    if (!this.checkEventActivation()) {
      return todos.filter(e => e.tipo !== 'activacion');
    }
    return todos;
  });

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

  /**
   * computed(): calcula la fotocélula con el valor máximo para cada tipo de evento.
   * En caso de empate, se selecciona la fotocélula cuyo último evento sea más antiguo.
   * Se utiliza para resaltar la celda máxima de cada fila (tipo de evento).
   */
  maximosPorTipo = computed(() => {
    const maximos: Record<TipoEvento, { id: string | null, max: number, timestamp: Date | null }> = {
      activacion: { id: null, max: 0, timestamp: null },
      desactivacion: { id: null, max: 0, timestamp: null },
      atiempo: { id: null, max: 0, timestamp: null },
      retraso: { id: null, max: 0, timestamp: null },
      adelanto: { id: null, max: 0, timestamp: null },
      apparition: { id: null, max: 0, timestamp: null },
      desaparicion: { id: null, max: 0, timestamp: null }
    };

    for (const est of this.estadisticasFiltradas()) {
      for (const tipo of this.tiposEventos) {
        const valorActual = est[tipo];
        if (valorActual === 0) continue;

        const maxActual = maximos[tipo];
        const timestampEst = est.ultimoEvento || null;

        if (valorActual > maxActual.max) {
          // Supera el máximo actual
          maxActual.max = valorActual;
          maxActual.id = est.fotocelulaId;
          maxActual.timestamp = timestampEst;
        } else if (valorActual === maxActual.max && maxActual.max > 0) {
          // Empate: gana el que tenga el timestamp más antiguo (menor valor)
          if (timestampEst && maxActual.timestamp) {
            if (timestampEst.getTime() < maxActual.timestamp.getTime()) {
              maxActual.id = est.fotocelulaId;
              maxActual.timestamp = timestampEst;
            }
          } else if (timestampEst && !maxActual.timestamp) {
             // Fallback por si acaso el actual no tiene timestamp (raro pero posible)
             maxActual.id = est.fotocelulaId;
             maxActual.timestamp = timestampEst;
          }
        }
      }
    }
    return maximos;
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

  toggleEventActivation(): void {
    this.checkEventActivation.update(v => !v);
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
    if (tiposExcluidos.includes(tipo)) return false;

    const maximo = this.maximosPorTipo()[tipo];
    return maximo.max > 0 && maximo.id === fotocelula.fotocelulaId;
  }
}
