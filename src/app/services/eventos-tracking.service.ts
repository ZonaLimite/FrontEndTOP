import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { TipoEvento } from '../models/modulo-transporte.model';

/**
 * Interfaz para un evento individual registrado
 */
export interface EventoContable {
  fotocelulaId: string;
  fotocelulaNombre: string;
  tipo: TipoEvento;
  timestamp: Date;
}

/**
 * Interfaz para contadores de eventos por tipo
 */
export interface ContadoresEvento {
  atiempo: number;
  retraso: number;
  adelanto: number;
  apparition: number;
  desaparicion: number;
  activacion: number;
  desactivacion: number;
}

/**
 * Interfaz para estadísticas de una fotocélula individual
 */
export interface EstadisticasFotocelula extends ContadoresEvento {
  fotocelulaId: string;
  fotocelulaNombre: string;
  total: number;
  ultimoEvento?: Date;
  historialCompleto: EventoContable[];
}

/**
 * Interfaz para estadísticas agregadas de un módulo
 */
export interface EstadisticasModulo {
  moduloId: string;
  moduloNombre: string;
  fotocelulas: EstadisticasFotocelula[];
  totalesModulo: ContadoresEvento;
}

/**
 * Servicio para rastrear y contar eventos de fotocélulas.
 * 
 * Arquitectura: Signals para estado + RxJS solo para entrada WebSocket
 * ─────────────────────────────────────────────────────────────────────
 * WebSocket (STOMP/SockJS)
 *       ↓ Observable — se queda con RxJS (es un stream externo)
 *       ↓ eventoEntrante$.subscribe() — único punto de cruce
 *  signal.set() / .update()
 *       ↓ Signals — gestionan el estado interno
 *       ↓ computed() — derivaciones automáticas
 *  Templates sin | async, sin suscripciones manuales
 */
@Injectable({
  providedIn: 'root'
})
export class EventosTrackingService {

  // ─── Fuente de verdad interna ─────────────────────────────────────────────
  private mapEstadisticas = new Map<string, EstadisticasFotocelula>();

  // ─── SIGNALS: estado observable sin BehaviorSubject ──────────────────────

  /** Signal principal con todas las estadísticas por fotocélula */
  readonly estadisticas = signal<EstadisticasFotocelula[]>([]);

  /** Signal del historial global de eventos (más reciente primero) */
  readonly historial = signal<EventoContable[]>([]);

  /**
   * computed(): fotocélulas que tienen algún retraso registrado.
   * Útil para paneles de alertas o destacar módulos problemáticos.
   */
  readonly fotocelulasConRetraso = computed(() =>
    this.estadisticas().filter(s => s.retraso > 0)
  );

  /**
   * computed(): tipo de evento más frecuente en toda la sesión.
   * Se recalcula automáticamente al cambiar estadisticas().
   */
  readonly eventoMasFrecuente = computed<TipoEvento | null>(() => {
    const totales: ContadoresEvento = {
      atiempo: 0, retraso: 0, adelanto: 0, apparition: 0, desaparicion: 0, activacion: 0, desactivacion: 0
    };
    for (const est of this.estadisticas()) {
      totales.atiempo += est.atiempo;
      totales.retraso += est.retraso;
      totales.adelanto += est.adelanto;
      totales.apparition += est.apparition;
      totales.desaparicion += est.desaparicion;
      totales.activacion += est.activacion;
      totales.desactivacion += est.desactivacion;
    }
    const [tipo, valor] = Object.entries(totales)
      .reduce((prev, curr) => curr[1] > prev[1] ? curr : prev);
    return valor > 0 ? (tipo as TipoEvento) : null;
  });

  // ─── RxJS: SOLO para la entrada del WebSocket ────────────────────────────
  /**
   * Subject interno que actúa como puerta de entrada desde STOMP/SockJS.
   * Los componentes NO se suscriben a esto — es uso interno del servicio.
   */
  private eventoEntrante$ = new Subject<{
    fotocelulaId: string;
    fotocelulaNombre: string;
    tipo: TipoEvento;
  }>();

  constructor() {
    // Único .subscribe() del servicio: convierte eventos WebSocket en Signals
    this.eventoEntrante$.subscribe(ev => {
      this.procesarEvento(
        ev.fotocelulaId, ev.fotocelulaNombre,
        ev.tipo
      );
    });
    console.log('EventosTrackingService inicializado (Signals + RxJS WebSocket)');
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Inyecta un evento proveniente del WebSocket (STOMP/SockJS).
   * Entrada al Subject RxJS que cruza al mundo Signals.
   */
  inyectarEventoWebSocket(
    fotocelulaId: string,
    fotocelulaNombre: string,
    tipo: TipoEvento
  ): void {
    //Ahora necesitamos acceder a las interfaces de 
    this.eventoEntrante$.next({
      fotocelulaId, fotocelulaNombre, tipo
    });
  }

  /**
   * Registra un evento offline (procedente de base de datos).
   */
  registrarEvento(
    fotocelulaId: string,
    fotocelulaNombre: string,
    tipo: TipoEvento
  ): void {
    this.procesarEvento(fotocelulaId, fotocelulaNombre, tipo);
  }

  /**
   * Obtiene las estadísticas actuales como snapshot (no reactivo).
   * Usar estadisticas() signal si se necesita reactividad.
   */
  obtenerEstadisticasActuales(): EstadisticasFotocelula[] {
    return this.estadisticas();
  }

  /**
   * Obtiene estadísticas de una fotocélula específica.
   */
  obtenerEstadisticasFotocelula(fotocelulaId: string): EstadisticasFotocelula | undefined {
    return this.mapEstadisticas.get(fotocelulaId);
  }

  /**
   * Limpia todas las estadísticas y resetea los signals.
   */
  limpiarEstadisticas(): void {
    this.mapEstadisticas.clear();
    this.estadisticas.set([]);
    this.historial.set([]);
    console.log('Estadísticas de eventos limpiadas');
  }

  /**
   * Limpia estadísticas de una fotocélula específica.
   */
  limpiarEstadisticasFotocelula(fotocelulaId: string): void {
    this.mapEstadisticas.delete(fotocelulaId);
    this.estadisticas.set(Array.from(this.mapEstadisticas.values()));
  }

  /**
   * Obtiene estadísticas filtradas por tipo de evento.
   */
  obtenerPorTipo(tipo: TipoEvento): EstadisticasFotocelula[] {
    return this.estadisticas().filter(est => est[tipo] > 0);
  }

  /**
   * Exporta las estadísticas actuales como string CSV.
   */
  exportarCSV(): string {
    const estadisticas = this.estadisticas();
    if (estadisticas.length === 0) return '';

    const headers = [
      'Fotocélula',
      'Atiempo', 'Retraso', 'Adelanto', 'Apparition', 'Desaparición',
      'Total', 'Último Evento'
    ];

    const rows = estadisticas.map(est => [
      est.fotocelulaNombre,
      est.atiempo.toString(),
      est.retraso.toString(),
      est.adelanto.toString(),
      est.apparition.toString(),
      est.desaparicion.toString(),
      est.total.toString(),
      est.ultimoEvento ? est.ultimoEvento.toLocaleString() : ''
    ]);

    const headerLine = headers.join(',');
    const dataLines = rows.map(row => row.map(cell => `"${cell}"`).join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Descarga las estadísticas actuales como archivo CSV.
   */
  descargarCSV(nombreArchivo: string = 'estadisticas-eventos.csv'): void {
    const csv = this.exportarCSV();
    if (!csv) {
      console.warn('No hay estadísticas para descargar');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ─── Privado ──────────────────────────────────────────────────────────────

  /**
   * Lógica común de procesamiento de eventos.
   * Actualiza el Map interno y dispara los Signals.(Estadisticas)
   */
  private procesarEvento(
    fotocelulaId: string,
    fotocelulaNombre: string,
    tipo: TipoEvento
  ): void {
    let est = this.mapEstadisticas.get(fotocelulaId);
    console.log('Procesando evento ' + tipo + "de Fotocelula : " + fotocelulaNombre);
    if (!est) {
      est = {
        fotocelulaId, fotocelulaNombre,
        activacion: 0, desactivacion: 0, atiempo: 0, retraso: 0, adelanto: 0, apparition: 0, desaparicion: 0,
        total: 0,
        historialCompleto: []
      };
      this.mapEstadisticas.set(fotocelulaId, est);
    }

    est[tipo]++;
    est.total++;
    est.ultimoEvento = new Date();

    const evento: EventoContable = {
      fotocelulaId, fotocelulaNombre, tipo,
      timestamp: new Date()
    };
    est.historialCompleto.push(evento);

    // ✅ Actualizar Signals — notifica automáticamente a computed() y templates
    this.estadisticas.set(Array.from(this.mapEstadisticas.values()));
    this.historial.update(h => [evento, ...h]); // más reciente primero
  }
}
