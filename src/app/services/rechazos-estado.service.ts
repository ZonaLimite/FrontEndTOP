import { Injectable, signal, computed } from '@angular/core';
import { EventoRechazo } from './rechazo-processor.service';

/**
 * Entrada individual en el historial de rechazos.
 */
export interface EntradaHistorialRechazo {
  key: string;
  denominacion: string;
  info: string;
  timestamp: Date;
}

/**
 * Registro acumulado de un tipo de rechazo agrupado por DENOMINACION.
 */
export interface RegistroRechazo {
  /** Clave de agrupación: token DENOMINACION */
  denominacion: string;
  /** Número de veces que se ha detectado este tipo de rechazo */
  count: number;
  /** Info del último evento registrado */
  ultimaInfo: string;
  /** Timestamp del último evento registrado */
  ultimoEvento?: Date;
  /** Historial completo de entradas para esta denominación */
  historial: EntradaHistorialRechazo[];
}

/**
 * Servicio para gestionar el estado reactivo de los eventos de tipo Rechazo.
 *
 * Arquitectura: idéntica a EventosTrackingService
 * ─────────────────────────────────────────────────────────────────────────
 * - Map<denominacion, RegistroRechazo>  →  fuente de verdad interna
 * - Signals  →  estado observable para los templates (sin | async)
 * - setInterval de 2000ms  →  refresco periódico del renderizado
 *
 * Los rechazos NO están restringidos a un catálogo fijo: cualquier
 * DENOMINACION nueva se registra automáticamente al detectarse.
 */
@Injectable({
  providedIn: 'root'
})
export class RechazosEstadoService {

  // ─── Fuente de verdad interna ──────────────────────────────────────────────
  private mapaRechazos = new Map<string, RegistroRechazo>();
  private historialInterno: EntradaHistorialRechazo[] = [];

  private static readonly MAX_HISTORIAL = 500;

  constructor() {
    // Refresco periódico de signals, igual que en EventosTrackingService
    setInterval(() => {
      this.actualizarRenderizado();
    }, 2000);

    console.log('RechazosEstadoService inicializado');
  }

  // ─── SIGNALS: estado observable ───────────────────────────────────────────

  /**
   * Signal con el resumen de rechazos agrupados por DENOMINACION,
   * ordenado por count descendente (el más frecuente primero).
   */
  readonly resumen = signal<RegistroRechazo[]>([]);

  /**
   * Signal del historial global de rechazos (más reciente primero).
   */
  readonly signal_historial = signal<EntradaHistorialRechazo[]>([]);

  /**
   * computed(): total acumulado de todos los rechazos registrados.
   */
  readonly totalRechazos = computed(() =>
    this.resumen().reduce((sum, r) => sum + r.count, 0)
  );

  /**
   * computed(): denominación con mayor número de rechazos.
   */
  readonly denominacionMasFrecuente = computed<string | null>(() => {
    const lista = this.resumen();
    if (lista.length === 0) return null;
    return lista.reduce((prev, curr) => curr.count > prev.count ? curr : prev).denominacion;
  });

  // ─── API pública ───────────────────────────────────────────────────────────

  /**
   * Registra un único EventoRechazo proveniente de RechazoProcessorService.
   * Si la denominación aún no existe, se crea un registro nuevo automáticamente.
   */
  registrarRechazo(evento: EventoRechazo): void {
    this.procesarEvento(evento);
  }

  /**
   * Registra un array de EventoRechazo (resultado del análisis de un bloque de trazas).
   */
  registrarRechazos(eventos: EventoRechazo[]): void {
    for (const evento of eventos) {
      this.procesarEvento(evento);
    }
  }

  /**
   * Devuelve el historial actual (snapshot no reactivo).
   */
  getHistorial(): EntradaHistorialRechazo[] {
    return this.signal_historial();
  }

  /**
   * Limpia todas las estadísticas y resetea los signals.
   */
  limpiarEstadisticas(): void {
    this.mapaRechazos.clear();
    this.historialInterno = [];
    this.resumen.set([]);
    this.signal_historial.set([]);
    console.log('RechazosEstadoService: estadísticas limpiadas');
  }

  /**
   * Exporta el resumen actual como string CSV.
   */
  exportarCSV(): string {
    const datos = this.resumen();
    if (datos.length === 0) return '';

    const headers = ['Denominacion', 'Count', 'Ultima Info', 'Ultimo Evento'];
    const rows = datos.map(r => [
      r.denominacion,
      r.count.toString(),
      r.ultimaInfo.replace(/"/g, '""'),
      r.ultimoEvento ? r.ultimoEvento.toLocaleString() : ''
    ]);

    const headerLine = headers.join(',');
    const dataLines  = rows.map(row => row.map(c => `"${c}"`).join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  /**
   * Descarga el resumen actual como archivo CSV.
   */
  descargarCSV(nombreArchivo: string = 'estadisticas-rechazos.csv'): void {
    const csv = this.exportarCSV();
    if (!csv) {
      console.warn('RechazosEstadoService: no hay datos para descargar');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ─── Privado ───────────────────────────────────────────────────────────────

  /**
   * Lógica de procesamiento: actualiza el Map interno con el nuevo evento.
   */
  private procesarEvento(evento: EventoRechazo): void {
    const { key, denominacion, info } = evento;

    let registro = this.mapaRechazos.get(denominacion);

    if (!registro) {
      // Nueva denominación detectada: se crea el registro dinámicamente
      registro = {
        denominacion,
        count: 0,
        ultimaInfo: '',
        historial: []
      };
      this.mapaRechazos.set(denominacion, registro);
    }

    registro.count++;
    registro.ultimaInfo  = info;
    registro.ultimoEvento = new Date();

    const entrada: EntradaHistorialRechazo = {
      key,
      denominacion,
      info,
      timestamp: new Date()
    };

    registro.historial.push(entrada);

    // Historial global: más reciente primero, máximo MAX_HISTORIAL entradas
    this.historialInterno.unshift(entrada);
    if (this.historialInterno.length > RechazosEstadoService.MAX_HISTORIAL) {
      this.historialInterno.pop();
    }
  }

  /**
   * Actualiza los signals con el estado actual del mapa.
   * Llamado periódicamente por el setInterval del constructor.
   * El resumen se ordena por count descendente.
   */
  private actualizarRenderizado(): void {
    const lista = Array.from(this.mapaRechazos.values())
      .sort((a, b) => b.count - a.count);

    this.resumen.set(lista);
    this.signal_historial.set([...this.historialInterno]);
  }
}
