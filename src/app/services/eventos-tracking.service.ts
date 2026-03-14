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

  //Es el historial de eventos que se muestra en el estadisticas-eventos
  private historial: EventoContable[];

  constructor() {
    // Pre-inicializar el mapa con el orden gráfico deseado (valores a 0)
    this.inicializarMapaOrdenado();
    this.historial = [];

    // Único .subscribe() del servicio: convierte eventos WebSocket en Signals
    this.eventoEntrante$.subscribe(ev => {
      this.procesarEvento(
        ev.fotocelulaId, ev.fotocelulaNombre,
        ev.tipo
      );
    });

    setInterval(() => {
      this.actualizarRenderizadoEstadisticas()
    }, 2000); //Refresh renderizado mediante signals

    console.log('EventosTrackingService inicializado (Signals + RxJS WebSocket)');
  }

  /**
   * Orden fijo de fotocélulas: coincide con la disposición física/gráfica.
   * [id, nombreVisible]
   */
  private readonly ordenFotocelulas: [string, string][] = [
    ['INJ-B3', 'INJ-B3'],
    ['INJ-B2', 'INJ-B2'],
    ['INJ-B1', 'INJ-B1'],
    ['CUL-B5', 'CUL-B5'],
    ['CUL-B3', 'CUL-B3'],
    ['CUL-B2', 'CUL-B2'],
    ['CUL-B1', 'CUL-B1'],
    ['MRK-B1', 'MRK-B1'],
    ['ACQ-B1', 'ACQ-B1'],
    ['MER-B3', 'MER-B3'],
    ['MER-B1', 'MER-B1'],
    ['FE1', 'FE1'],
    ['MER-B2', 'MER-B2'],
    ['EXT-B1', 'EXT-B1'],
    ['FE2', 'FE2'],
  ];


  // ─── SIGNALS: estado observable sin BehaviorSubject ──────────────────────

  /** Signal principal con todas las estadísticas por fotocélula */
  readonly estadisticas = signal<EstadisticasFotocelula[]>([]);


  /** Signal del historial global de eventos (más reciente primero) */
  readonly signal_historial = signal<EventoContable[]>([]);

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


  /**
   *  Get de historial
   */
  getHistorial(): EventoContable[] {
    return this.signal_historial();
  }

  /**
   *  Reset de historial
   */
  resetHistorial() {
    this.historial.splice(0); // Vaciar in-place, sin romper la referencia
  }


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


  /**
   * Pre-puebla mapEstadisticas con claves en el orden gráfico fijo.
   * Todos los contadores arrancan a 0.
   */
  private inicializarMapaOrdenado(): void {
    for (const [id, nombre] of this.ordenFotocelulas) {
      this.mapEstadisticas.set(id, {
        fotocelulaId: id,
        fotocelulaNombre: nombre,
        activacion: 0, desactivacion: 0,
        atiempo: 0, retraso: 0, adelanto: 0,
        apparition: 0, desaparicion: 0,
        total: 0,
        historialCompleto: []
      });
    }
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
    //Ahora necesitamos acceder a las interfaces : 

    // mediante observables para conducir la llamada al metodo de calculo y actualizacion : procesarEvento()
    //this.eventoEntrante$.next({
    //  fotocelulaId, fotocelulaNombre, tipo
    //});

    // o  

    // Llamada directa al metodo de calculo y actualizacion : procesarEvento()
    this.procesarEvento(
      fotocelulaId, fotocelulaNombre,
      tipo
    );
    // ✅ Actualizar Signals — notifica automáticamente a computed() y templates
    //this.actualizarRenderizado(tipo);
  }

  /**
   * Actualizacion de renderiazacion dinamica de tablas d estadisticas
   * 
   **/
  actualizarRenderizadoEstadisticas() {
    this.estadisticas.set(Array.from(this.mapEstadisticas.values()));
    //console.log("Actualizando renderizado ... cada 1000")
    this.signal_historial.set([...this.historial]); // Copia nueva → el signal detecta el cambio de referencia
  }

  /**
   * Actualizacion de renderiazacion dinamica de tablas d estadisticas
   * 
   **/
  actualizarRenderizadoHistorial() {
    this.signal_historial.set([...this.historial]); // Copia nueva → el signal detecta el cambio de referencia
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
    //this.historial.set([]);
    this.resetHistorial();
    this.inicializarMapaOrdenado();
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
   * Actualiza el Map interno y (dispara los Signals.(Estadisticas))
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

    // Tratamiento contadores estadisticos de eventos
    est[tipo]++;
    est.total++;
    est.ultimoEvento = new Date();

    const evento: EventoContable = {
      fotocelulaId, fotocelulaNombre, tipo,
      timestamp: new Date()
    };
    est.historialCompleto.push(evento);

    this.historial.unshift(evento);
    if (this.historial.length > 500) this.historial.pop(); // No registramos mas de 500 por rendimiento

    this.mapEstadisticas.set(fotocelulaId, est);
  }
}
