import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Client, IStompSocket, IFrame, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { EventosTrackingService } from './eventos-tracking.service';
import { TipoEvento } from '../models/modulo-transporte.model';
import { ResultEngine } from '../models/resultEngine';
import { Traces } from '../models/traces';

declare var configuraciones: any;

// ─── Modelos de mensajes de tracking ────────────────────────────────────────

/**
 * Estructura esperada en el campo data de una Traces de tipo tracking.
 * 
 * Ejemplo de mensaje JSON que emite el Engine en /channel/traces:
 * {
 *   "tipoResult": "tracking",
 *   "data": "{\"fotocelulaId\":\"INJ-B1\",\"fotocelulaNombre\":\"INJ-B1\",
 *             \"moduloId\":\"INJ-01\",\"moduloNombre\":\"Inyector\",
 *             \"tipoEvento\":\"PasoATiempo\"}"
 * }
 * 
 * Alternativa delimitada por '|' si el Engine no emite JSON:
 * { "tipoResult": "tracking", "data": "INJ-B1|INJ-B1|INJ-01|Inyector|PasoATiempo" }
 * → en ese caso ajustar _handleTrace() para usar split('|')
 */
export interface TrackingPayload {
  fotocelulaId:     string;
  fotocelulaNombre: string;
  moduloId:         string;
  moduloNombre:     string;
  tipoEvento:       string; // string crudo del Engine → se mapea a TipoEvento
}

// ─── Mapa de traducción: nombre en Engine → TipoEvento interno ───────────────
// Ajustar los literales de la izquierda según lo que emita realmente el Engine
const MAPA_EVENTOS: Record<string, TipoEvento> = {
  'PasoATiempo'      : 'atiempo',
  'EnvioRetrasado'   : 'retraso',
  'EnvioAdelantado'  : 'adelanto',
  'AparicionDeEnvio' : 'apparition',
  'DesaparicionEnvio': 'desaparicion',
  // Aliases por si el Engine usa los mismos literales internos
  'atiempo'          : 'atiempo',
  'retraso'          : 'retraso',
  'adelanto'         : 'adelanto',
  'apparition'       : 'apparition',
  'desaparicion'     : 'desaparicion',
};

/**
 * Servicio de comunicación WebSocket STOMP para recepción de trazas de tracking.
 * 
 * Arquitectura:
 * ─────────────────────────────────────────────────────────────────────────────
 *  Engine (SockJS/STOMP)
 *       │
 *       ├── /channel/control  → _handleControl()  → Signals de estado/combos
 *       └── /channel/traces   → _handleTrace()    → EventosTrackingService
 *                                                        │
 *                                                   signal.set()
 *                                                        │
 *                                               computed() en componentes
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Responsabilidades de este servicio:
 *   - Gestionar el ciclo de vida del cliente STOMP (conectar/desconectar)
 *   - Suscribirse a /channel/control y /channel/traces
 *   - Parsear las trazas de tracking y delegarlas a EventosTrackingService
 *   - Exponer signals de estado de conexión para la UI
 *   - Enviar comandos al Engine via /app/manage_engine
 * 
 * Lo que NO hace:
 *   - Gestionar estadísticas (responsabilidad de EventosTrackingService)
 *   - Renderizar nada (responsabilidad de los componentes)
 */
@Injectable({ providedIn: 'root' })
export class TrackingWebsocketService implements OnDestroy {

  // ─── Dependencias ──────────────────────────────────────────────────────────
  private trackingService = inject(EventosTrackingService);

  // ─── Cliente STOMP ────────────────────────────────────────────────────────
  private client: Client;
  private readonly urlEngine: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE ESTADO DE CONEXIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /** true cuando el socket STOMP está activo y conectado al Engine */
  readonly conectado = signal<boolean>(false);

  /** true cuando el Engine ha confirmado el link con la máquina TOP (ackConectar) */
  readonly linkedTop = signal<boolean>(false);

  /** Último error de conexión recibido; null si no hay error activo */
  readonly errorConexion = signal<string | null>(null);

  /** Texto de estado legible para mostrar en la UI */
  readonly estadoTexto = computed(() => {
    if (this.errorConexion())  return `Error: ${this.errorConexion()}`;
    if (!this.conectado())     return 'Desconectado';
    if (!this.linkedTop())     return 'Conectado — sin link TOP';
    return 'Conectado y enlazado a TOP';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE DATOS DE CONTROL (combos de la UI)
  // ═══════════════════════════════════════════════════════════════════════════

  readonly dataMaquinas         = signal<string[]>([]);
  readonly dataSistemas         = signal<string[]>([]);
  readonly dataModulos          = signal<string[]>([]);
  readonly dataListeners        = signal<string[]>([]);
  readonly dataListenersActivos = signal<string[]>([]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE CONTADORES DE MENSAJES (diagnóstico)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Total de mensajes recibidos por ambos canales */
  readonly mensajesRecibidos  = signal<number>(0);

  /** Total de trazas de tracking procesadas correctamente */
  readonly trackingRecibidos  = signal<number>(0);

  /** Total de trazas con tipoEvento no reconocido en el MAPA_EVENTOS */
  readonly trackingDesconocidos = signal<number>(0);

  constructor() {
    this.urlEngine = configuraciones.urlBaseEngine + 'topwebsocket';
    this.client    = new Client();
    this._configurarCliente();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API PÚBLICA
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Activa el socket STOMP hacia el Engine.
   * Equivale a client.activate() en remotengine.
   */
  conectar(): void {
    if (!this.client.active) {
      this.errorConexion.set(null);
      this.client.activate();
    }
  }

  /**
   * Desactiva el socket STOMP.
   * Equivale a client.deactivate() en remotengine.
   */
  desconectar(): void {
    this.enviarComando('desconectar', []); // Asegura que el Engine cierre el link TOP si está activo
    this.client.deactivate();
  }

  /**
   * Solicita al Engine abrir el link con la máquina TOP.
   * Equivale al método linkarTop() de remotengine.
   * @param maquina  Identificador de máquina (ej: "4")
   * @param sistema  Sistema seleccionado (ej: "IL")
   * @param modulo   Módulo/consulta seleccionada
   */
  linkarTop(maquina: string, sistema: string, modulo: string): void {
    this.enviarComando('adjustnumtop',   [maquina]);
    this.enviarComando('selectSistema',  [sistema]);
    this.enviarComando('selectConsulta', [modulo]);
    this.enviarComando('conectar',       []);
  }

  /**
   * Solicita al Engine cerrar el link con la TOP.
   * Equivale a unLinkarTop() en remotengine.
   */
  unlinkarTop(): void {
    this.enviarComando('desconectar', []);
  }

  /**
   * Activa o desactiva la publicación de eventos de tracking en el Engine.
   * @param activo true → Engine publica trazas; false → Engine para publicación
   */
  setPublicacionActiva(activo: boolean): void {
    this.enviarComando('setWebsocketPublish', [activo ? '1' : '0']);
  }

  /**
   * Registra un listener de filtrado en el Engine.
   * @param listener Cadena de filtro a registrar
   */
  incluirListener(listener: string): void {
    this.enviarComando('incluirlistenermodelfilter', [listener]);
  }

  /**
   * Elimina un listener activo del Engine.
   * @param listener Cadena de filtro a eliminar
   */
  eliminarListener(listener: string): void {
    this.enviarComando('quitarlistenermodelfilter', [listener]);
  }

  /**
   * Incluye un listener rápido y lo activa inmediatamente.
   * @param textListener Cadena de búsqueda rápida
   */
  incluirListenerRapido(textListener: string): void {
    this.enviarComando('incluirListenerRapido',  [textListener]);
    this.enviarComando('doClickListenerrapido',  []);
  }

  /**
   * Solicita al Engine refrescar los datos de los combos de control.
   * Equivale a refreshComboMaquinas() en remotengine.
   */
  refrescarCombos(): void {
    this.enviarComando('maquinas',         []);
    this.enviarComando('sistemas',         []);
    this.enviarComando('modulos',          ['IL']);
    this.enviarComando('listeners',        []);
    this.enviarComando('listenersActivos', []);
  }

  /**
   * Envía un comando genérico al Engine via /app/manage_engine.
   * Mismo patrón que enviarComando() en remotengine.
   * @param comando  Nombre del comando (ej: 'conectar', 'adjustnumtop')
   * @param args     Array de argumentos del comando
   */
  enviarComando(comando: string, args: string[]): void {
    if (!this.client.connected) {
      console.warn(`[WS-Tracking] Intento de enviar "${comando}" sin conexión activa`);
      return;
    }
    this.client.publish({
      destination: '/app/manage_engine',
      body: JSON.stringify(new ResultEngine(comando, args))
    });
  }

  ngOnDestroy(): void {
    this.client.deactivate();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN STOMP (privado)
  // ═══════════════════════════════════════════════════════════════════════════

  private _configurarCliente(): void {

    // ── WebSocket factory: SockJS como transporte ────────────────────────────
    this.client.webSocketFactory = () =>
      new SockJS(this.urlEngine) as IStompSocket;

    // ── onConnect ────────────────────────────────────────────────────────────
    this.client.onConnect = (frame: IFrame) => {
      console.log('[WS-Tracking] Conectado al Engine:', frame);
      this.conectado.set(true);
      this.errorConexion.set(null);

      // Suscripción al canal de control (respuestas de comandos enviados)
      this.client.subscribe('/channel/control', (msg: IMessage) => {
        const result = JSON.parse(msg.body) as ResultEngine;
        this._handleControl(result);
      });

      // Suscripción al canal de trazas (eventos de tracking de la máquina)
      this.client.subscribe('/channel/traces', (msg: IMessage) => {
        const trace = JSON.parse(msg.body) as Traces;
        this._handleTrace(trace);
      });

      // Inicializar combos al conectar
      this.refrescarCombos();
    };

    // ── onDisconnect ─────────────────────────────────────────────────────────
    this.client.onDisconnect = (frame: IFrame) => {
      console.log('[WS-Tracking] Desconectado del Engine');
      this._resetEstado();
    };

    // ── onWebSocketClose ─────────────────────────────────────────────────────
    this.client.onWebSocketClose = (event: CloseEvent) => {
      console.warn('[WS-Tracking] Socket cerrado:', event.reason);
      this.errorConexion.set(event.reason || 'Conexión cerrada inesperadamente');
      this._resetEstado();
    };

    // ── onStompError ─────────────────────────────────────────────────────────
    this.client.onStompError = (frame: IFrame) => {
      const msg = frame.headers['message'] || 'Error STOMP desconocido';
      console.error('[WS-Tracking] Error STOMP:', msg);
      this.errorConexion.set(msg);
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MANEJADORES DE ENTRADA (privados)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Manejador del canal /channel/control.
   * Procesa respuestas del Engine a comandos enviados y actualiza
   * los Signals de datos de control (combos, acks de conexión, etc.).
   */
  private _handleControl(result: ResultEngine): void {
    this.mensajesRecibidos.update(n => n + 1);

    switch (result.tipoResult) {

      case 'maquinas':
        this.dataMaquinas.set(result.data);
        break;

      case 'sistemas':
        this.dataSistemas.set(result.data);
        break;

      case 'modulos':
        this.dataModulos.set(result.data);
        break;

      case 'listeners':
        this.dataListeners.set(result.data);
        break;

      case 'listenersActivos':
        this.dataListenersActivos.set(result.data);
        break;

      case 'ackConectar':
        this.linkedTop.set(true);
        console.log('[WS-Tracking] Link TOP establecido');
        break;

      case 'ackDesconectar':
        this.linkedTop.set(false);
        console.log('[WS-Tracking] Link TOP cerrado');
        break;

      case 'listenerRapido':
        // El Engine devuelve el texto del listener rápido activo
        // Se puede exponer como signal si la UI lo necesita
        console.log('[WS-Tracking] listenerRapido activo:', result.data[0]);
        break;

      default:
        console.log('[WS-Tracking] Control no manejado:', result.tipoResult, result.data);
    }
  }

  /**
   * Manejador del canal /channel/traces.
   * 
   * Solo procesa trazas con tipoResult === 'tracking'.
   * Parsea el payload y lo inyecta en EventosTrackingService,
   * que a su vez actualiza sus Signals y notifica a los componentes.
   * 
   * Formato esperado del campo data (JSON serializado):
   * {
   *   "fotocelulaId":     "INJ-B1",
   *   "fotocelulaNombre": "INJ-B1",
   *   "moduloId":         "INJ-01",
   *   "moduloNombre":     "Inyector",
   *   "tipoEvento":       "PasoATiempo"
   * }
   * 
   * Si el Engine emite formato delimitado por '|', sustituir el bloque
   * de parseo JSON por: const partes = trace.data.split('|')
   */
  private _handleTrace(trace: Traces): void {
    this.mensajesRecibidos.update(n => n + 1);

    // Filtrar trazas que no sean de tracking
    if (trace.tipoResult !== 'tracking') {
      console.log('[WS-Tracking] Traza no-tracking ignorada:', trace.tipoResult);
      return;
    }

    try {
      const payload: TrackingPayload = JSON.parse(trace.data);
      const tipoEvento = this._mapearTipoEvento(payload.tipoEvento);

      if (!tipoEvento) {
        console.warn('[WS-Tracking] TipoEvento desconocido recibido:', payload.tipoEvento);
        this.trackingDesconocidos.update(n => n + 1);
        return;
      }

      // ✅ Punto de cruce WebSocket → Signals:
      // Inyecta el evento en EventosTrackingService.
      // Desde aquí el evento fluye automáticamente a todos los componentes
      // suscritos via computed() sin ningún código adicional.
      this.trackingService.inyectarEventoWebSocket(
        payload.fotocelulaId,
        payload.fotocelulaNombre,
        payload.moduloId,
        payload.moduloNombre,
        tipoEvento
      );

      this.trackingRecibidos.update(n => n + 1);

    } catch (e) {
      console.error('[WS-Tracking] Error parseando payload de tracking:', trace.data, e);
    }
  }

  /**
   * Traduce el nombre de evento tal como llega del Engine
   * al TipoEvento interno usado por EventosTrackingService.
   * Retorna null si el tipo no está en el MAPA_EVENTOS.
   */
  private _mapearTipoEvento(tipoEngine: string): TipoEvento | null {
    return MAPA_EVENTOS[tipoEngine] ?? null;
  }

  /**
   * Resetea los signals de estado de conexión.
   * Se llama tanto en onDisconnect como en onWebSocketClose.
   */
  private _resetEstado(): void {
    this.conectado.set(false);
    this.linkedTop.set(false);
  }
}
