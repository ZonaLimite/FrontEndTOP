import { AfterViewInit, Component, inject, isDevMode, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { ModuloGridConfig, ModuloCoordsConfig } from '../../models/modulo-transporte.model';
import { LineaTransporteComponent } from '../../components/linea-transporte/linea-transporte.component';
import { ModuloLineaCoordsConfig } from '../../models/modulo-transporte.model';
import { ModuloTransporteCoordsComponent } from '../../components/modulo-transporte-coords/modulo-transporte-coords.component';
import { EventosTrackingService } from '../../services/eventos-tracking.service';
// ── NUEVO ──────────────────────────────────────────────────────────────────
import { RechazoProcessorService } from '../../services/rechazo-processor.service';
import { RechazosEstadoService } from '../../services/rechazos-estado.service';
import { EspesorEstadoService } from '../../services/espesor-estado.service';
import { EspesorProcessorService } from '../../services/espesor-processor.service';
import { OcrProcessorService } from '../../services/ocr-processor.service';
import { LecturaDestinoEstadoService } from '../../services/lectura-destino-estado.service';
import { RestitucionProcessorService } from '../../services/restitucion-processor.service';
import { VideocodificacionProcessorService } from '../../services/videocodificacion-processor.service';
// ──────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-demo-modulos',
  standalone: false,
  templateUrl: './demo-modulos.component.html',
  styleUrls: ['./demo-modulos.component.css']
})
export class DemoModulosComponent implements OnInit {
  eventos: ('atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion')[] =
    ['atiempo', 'retraso', 'adelanto', 'apparition', 'desaparicion'];

  // Referencia al componente hijo <app-linea-transporte>
  @ViewChildren(LineaTransporteComponent) lineasTransporte!: QueryList<LineaTransporteComponent>;

  // ─── Dependencias ──────────────────────────────────────────────────────────
  private trackingService = inject(EventosTrackingService);
  // ── NUEVO ──────────────────────────────────────────────────────────────────
  private rechazoProcessor = inject(RechazoProcessorService);
  private rechazosEstadoService = inject(RechazosEstadoService);
  private espesorEstadoService = inject(EspesorEstadoService);
  private espesorProcessor = inject(EspesorProcessorService);
  private ocrProcessor = inject(OcrProcessorService);
  private lecturaDestinoEstado = inject(LecturaDestinoEstadoService);
  private restitucionProcessor = inject(RestitucionProcessorService);
  private videocodificacionProcessor = inject(VideocodificacionProcessorService);
  // ──────────────────────────────────────────────────────────────────────────

  // ─── Signal local: enfoque activo ─────────────────────────────────────────
  /** Controla qué panel de estadísticas se muestra */
  enfoqueActivo = signal<'tracking' | 'rechazo'>('tracking');

  /**
   * Muestra los botones de simulación (solo para desarrollo).
   * Por defecto: visibles con `ng serve` / build de desarrollo, ocultos en el build de producción.
   * Cambiar a true/false para forzarlo.
   */
  // mostrarSimulacion = isDevMode();
  mostrarSimulacion = true;

  // ==========================================
  // EJEMPLOS DE CONFIGURACIÓN Declarativa - PATRÓN COORDS
  // ==========================================

  modulosCoordsEjemplo: ModuloCoordsConfig[] = [
    {
      id: 'INJ-01',
      nombre: 'Inyector',
      ancho: 160,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'INJ-B3', nombre: 'INJ-B3', x: 20, y: 60, tamano: 'pequeno', orientacion: 'row' },
        { id: 'INJ-B2', nombre: 'INJ-B2', x: 50, y: 60, tamano: 'pequeno', orientacion: 'row' },
        { id: 'INJ-B1', nombre: 'INJ-B1', x: 80, y: 60, tamano: 'pequeno', orientacion: 'row' },
      ]
    },
    {
      id: 'CUL-01',
      nombre: 'Culling',
      ancho: 200,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'CUL-B5', nombre: 'CUL-B5', x: 15, y: 60, tamano: 'pequeno', orientacion: 'row' },
        { id: 'CUL-B3', nombre: 'CUL-B3', x: 35, y: 30, tamano: 'pequeno', orientacion: 'row' },
        { id: 'CUL-B2', nombre: 'CUL-B2', x: 55, y: 60, tamano: 'pequeno', orientacion: 'row' },
        { id: 'CUL-B1', nombre: 'CUL-B1', x: 86, y: 60, tamano: 'pequeno', orientacion: 'row' },
      ],
      listaRechazos: { x: 75, y: 21 }
    },
    {
      id: 'MRK-01',
      nombre: 'Marcado',
      ancho: 160,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'MRK-B1', nombre: 'MRK-B1', x: 85, y: 60, tamano: 'pequeno', orientacion: 'row' }
      ]
    },
    {
      id: 'ACQ-01',
      nombre: 'Adquisicion',
      ancho: 140,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'ACQ-B1', nombre: 'ACQ-B1', x: 83, y: 60, tamano: 'pequeno', orientacion: 'row' }
      ],
      etiquetaOcr: { x: 40, y: 16 },
      etiquetaRestitucion: { x: 40, y: 81 }
    },
    {
      // Sistema de videocodificación: no es un módulo de transporte (sin fotocélulas)
      id: 'VCS-01',
      nombre: 'VideoOnLine',
      ancho: 140,
      alto: 56,
      orientacion: 'horizontal',
      fotocelulas: [],
      etiquetaVideocodificacion: { x: 40, y: 50 }   // misma x que las etiquetas del ACQ-01: quedan en vertical
    },
    {
      id: 'MER-01',
      nombre: 'Convergencia',
      ancho: 140,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'MER-B2', nombre: 'MER-B2', x: 83, y: 23, tamano: 'pequeno', orientacion: 'row' },
        { id: 'MER-B3', nombre: 'MER-B3', x: 83, y: 88, tamano: 'pequeno', orientacion: 'row' },
      ]
    },
    {
      id: 'EXT-01',
      nombre: 'Extension',
      ancho: 200,
      alto: 53,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'EXT-B1', nombre: 'EXT-B1', x: 88, y: 66, tamano: 'pequeno', orientacion: 'row' },
      ]
    },
    {
      id: 'FED-01',
      nombre: 'Feeder1',
      ancho: 80,
      alto: 120,
      orientacion: 'vertical',
      fotocelulas: [
        { id: 'FE1', nombre: 'FE1', x: 50, y: 37, tamano: 'pequeno', orientacion: 'row' },
      ],
      etiquetaEspesor: { x: 50, y: 78 }
    },
    {
      id: 'FED-02',
      nombre: 'Feeder2',
      ancho: 80,
      alto: 120,
      orientacion: 'vertical',
      fotocelulas: [
        { id: 'FE2', nombre: 'FE2', x: 50, y: 30, tamano: 'pequeno', orientacion: 'row' },
      ],
      etiquetaEspesor: { x: 50, y: 78 }
    }
  ];

  // ==========================================
  // EJEMPLO 1: Posicionamiento Modulos con Coordenadas Absolutas
  // ==========================================
  modulosLineaEntrada: ModuloLineaCoordsConfig[] = [];

  constructor() { }

  //inicializamos estructuras con los modulos declarados
  ngOnInit() {
    const modulo = this.modulosCoordsEjemplo.find(m => m.id === "INJ-01");
    if (modulo) {
      this.modulosLineaEntrada.push({ config: modulo, x: 10, y: 50 });
    }
    const modulo2 = this.modulosCoordsEjemplo.find(m => m.id === "CUL-01");
    if (modulo2) {
      this.modulosLineaEntrada.push({ config: modulo2, x: 170 + 2, y: 50 });
    }
    const modulo3 = this.modulosCoordsEjemplo.find(m => m.id === "MRK-01");
    if (modulo3) {
      this.modulosLineaEntrada.push({ config: modulo3, x: 372 + 2, y: 50 });
    }
    const modulo4 = this.modulosCoordsEjemplo.find(m => m.id === "ACQ-01");
    if (modulo4) {
      this.modulosLineaEntrada.push({ config: modulo4, x: 534 + 2, y: 50 });
    }
    // Separado de la línea: por debajo del ACQ-01, con su mismo ancho y alineado con él
    const modulo9 = this.modulosCoordsEjemplo.find(m => m.id === "VCS-01");
    if (modulo9) {
      this.modulosLineaEntrada.push({ config: modulo9, x: 534 + 2, y: 240 });
    }
    const modulo5 = this.modulosCoordsEjemplo.find(m => m.id === "MER-01");
    if (modulo5) {
      this.modulosLineaEntrada.push({ config: modulo5, x: 676 + 2, y: 50 });
    }
    const modulo7 = this.modulosCoordsEjemplo.find(m => m.id === "EXT-01");
    if (modulo7) {
      this.modulosLineaEntrada.push({ config: modulo7, x: 818 + 2, y: 50 });
    }
    const modulo6 = this.modulosCoordsEjemplo.find(m => m.id === "FED-01");
    if (modulo6) {
      this.modulosLineaEntrada.push({ config: modulo6, x: 818 + 2, y: 138 });
    }
    const modulo8 = this.modulosCoordsEjemplo.find(m => m.id === "FED-02");
    if (modulo8) {
      this.modulosLineaEntrada.push({ config: modulo8, x: 1020 + 2, y: 50 });
    }
  }

  // ==========================================
  // SELECTOR DE ENFOQUE
  // ==========================================

  /**
   * Cambia el enfoque activo entre Tracking y Rechazo.
   */
  cambiarEnfoque(enfoque: 'tracking' | 'rechazo'): void {
    this.enfoqueActivo.set(enfoque);
  }

  // ==========================================
  // MÉTODOS DE RECHAZO
  // ==========================================

  /**
   * Analiza un bloque de trazas en busca de eventos REJET y los
   * registra en el servicio de estado de rechazos.
   *
   * @param trazas - String multilínea con trazas a analizar
   */
  procesarTrazasRechazo(trazas: string): void {
    const eventos = this.rechazoProcessor.analizarTraza(trazas);
    if (eventos && eventos.length > 0) {
      this.rechazosEstadoService.registrarRechazos(eventos);
      console.log(`DemoModulosComponent: ${eventos.length} rechazo(s) registrado(s)`);
    }
  }

  /**
   * Simula la llegada de trazas REJET de ejemplo para pruebas en desarrollo.
   */
  simularTrazasRechazo(): void {
    const trazasEjemplo = [
      '15:15:36:033 WRN IL1_MAIN - REJET, ANNULATION_SC, pli 400218A1',
      '06:19:35:985 WRN IL1_MAIN - REJET, CONVOYAGE, pli 400181E2 LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur CUL-B1 ! : diff=-603084229 ms',
      '06:18:58:045 WRN IL1_____ - REJET, LONGUEUR_LONG, pli 4001818D EN_DEHORS_DU_SPECTRE : 130000<504000<420000, index convoyeur 0',
      '06:20:10:112 WRN IL1_MAIN - REJET, ANNULATION_SC, pli 400219B2',
      '06:21:05:774 WRN IL1_MAIN - REJET, CONVOYAGE, pli 400220C3 LE_PLI_EST_EN_DEHORS_DE_SON_PAS sur CUL-B2 ! : diff=120345 ms',
    ].join('\n');

    this.procesarTrazasRechazo(trazasEjemplo);
  }

  // ==========================================
  // MÉTODOS DE PRUEBA (ESPESOR)
  // ==========================================

  /**
   * Simula una traza de medida de espesor (en micras) en cada feeder,
   * cubriendo todos los estados: ok, warning (0 y 30–64 mm) y excesivo.
   * Pasa por EspesorProcessorService igual que las trazas del WebSocket.
   * Incluye trazas de la línea 2, que el filtro por línea (línea 1) debe descartar.
   */
  simularEspesor(): void {
    const muestrasMicras = [0, 350, 4200, 12500, 30000, 41800, 64000, 68500];
    const trazas = [1, 2].flatMap(feeder => [1, 2].map(linea => {
      const micras = muestrasMicras[Math.floor(Math.random() * muestrasMicras.length)];
      return `C30100200 18:07:09:232 INF IL${linea}_FE${feeder}_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=4001B256, thickness=${micras}`;
    })).join('\n');

    this.espesorProcessor.analizarTraza(trazas, '1')
      ?.forEach(ev => this.espesorEstadoService.registrarMedida(ev.moduloId, ev.micras));
  }

  /**
   * Simula una traza OCR de la línea 1 elegida al azar entre trazas reales
   * (encaminamiento, distribución y no reconocido).
   * Pasa por OcrProcessorService igual que las trazas del WebSocket.
   */
  simularLecturaOcr(): void {
    const trazas = [
      'IL:1 #N38854254;C30100100 22:23:57:498 INF IL1_URA_ -                    texte                  DACTHN 50012            S:ES50012_________ NC:2 NS:3 IS:0a ZARAGOZA',
      'IL:1 #N38855128;C30100100 22:23:58:156 INF IL1_URA_ -                    texte                  DACTVI 42140            S:ES42140_________ NC:2 NS:3 IS:0a SAN LEONARD',
      'IL:1 #N38936892;C30100100 22:27:30:039 INF IL1_URA_ -                    texte                  DACTHN 01006 104001     S:ES01006104001___ NC:6 NS:5 IS:0a VITORIA GAS  ',
      'IL:1 #N38872279;C30100100 22:24:08:254 INF IL1_URA_ -                    texte                  MANUHN R_REC            S:________________ NC:0 NS:0 IS:00          ',
    ];
    const traza = trazas[Math.floor(Math.random() * trazas.length)];

    this.ocrProcessor.analizarTraza(traza, '1')
      ?.forEach(l => this.lecturaDestinoEstado.registrarLectura(l));
  }

  /**
   * Simula la restitución de un envío de la línea 1: primero su traza de espesor
   * en el feeder (anota mpId → línea) y después la traza TLS con el destino
   * (encaminamiento o distribución). Incluye una restitución de un envío de la
   * línea 2, que debe descartarse.
   */
  simularRestitucion(): void {
    const codes = ['20280', '01013177001', '28045', '50012104001'];
    const code = codes[Math.floor(Math.random() * codes.length)];
    const trazas = [
      'C30100200 19:02:20:101 INF IL1_FE1_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=400CE551, thickness=1280',
      'C30100200 19:02:20:140 INF IL2_FE1_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=400CE5D5, thickness=900',
      'IL:1 #N44572539;C30100000 19:02:26:300 INF TLS      - processSanction: addressRead on mpId=400CE5D5 : code=99999',
      `IL:1 #N44548575;C30100000 19:02:26:378 INF TLS      - processSanction: addressRead on mpId=400CE551 : code=${code}`,
    ];

    // Cada mensaje del WebSocket trae una sola traza
    trazas.forEach(traza => {
      this.espesorProcessor.analizarTraza(traza, '1')
        ?.forEach(ev => this.espesorEstadoService.registrarMedida(ev.moduloId, ev.micras));
      this.restitucionProcessor.analizarTraza(traza, '1')
        ?.forEach(l => this.lecturaDestinoEstado.registrarLectura(l));
    });
  }

  /**
   * Simula el resultado de videocodificación de un envío de la línea 1: primero
   * su traza de espesor en el feeder (anota mpId → línea) y después la traza ILS
   * con el destino (encaminamiento o distribución). Incluye el resultado de un
   * envío de la línea 2, que debe descartarse. Las trazas pasan también por el
   * procesador de restitución, que debe ignorarlas (exige TLS).
   */
  simularVideocodificacion(): void {
    const codes = ['20280', '01013177001', '28045', '50012104001'];
    const code = codes[Math.floor(Math.random() * codes.length)];
    const trazas = [
      'C30100200 19:02:20:101 INF IL1_FE1_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=400CE551, thickness=1280',
      'C30100200 19:02:20:140 INF IL2_FE1_ - rootOnMailPieceReportOutputThickness(), T.Reader:1, MP=400CE5D5, thickness=900',
      'IL:1 #N44572539;C30100000 19:02:26:300 INF ILS      - processSanction: addressRead on mpId=400CE5D5 : code=99999',
      `IL:1 #N44548575;C30100000 19:02:26:378 INF ILS      - processSanction: addressRead on mpId=400CE551 : code=${code}`,
    ];

    // Cada mensaje del WebSocket trae una sola traza
    trazas.forEach(traza => {
      this.espesorProcessor.analizarTraza(traza, '1')
        ?.forEach(ev => this.espesorEstadoService.registrarMedida(ev.moduloId, ev.micras));
      this.restitucionProcessor.analizarTraza(traza, '1')
        ?.forEach(l => this.lecturaDestinoEstado.registrarLectura(l));
      this.videocodificacionProcessor.analizarTraza(traza, '1')
        ?.forEach(l => this.lecturaDestinoEstado.registrarLectura(l));
    });
  }

  // ==========================================
  // MÉTODOS DE PRUEBA (TRACKING — sin cambios)
  // ==========================================

  simularEventosEnTodosModulos() {
    this.lineasTransporte.forEach(linea => {
      linea.modulosCoordsComponents.forEach(modulo => {
        modulo.config.fotocelulas.forEach(fotocelula => {
          const eventoAleatorio = this.eventos[Math.floor(Math.random() * this.eventos.length)];
          console.log(`Simulando evento: ${eventoAleatorio} en ${modulo.getNombreModulo()} - ${fotocelula.nombre}`);
          modulo.simularEvento(fotocelula.id, eventoAleatorio);
          this.trackingService.inyectarEventoWebSocket(
            fotocelula.id,
            fotocelula.id,
            eventoAleatorio
          );
        });
      });
    });
  }

  simularSeguimientoEnTodosModulos() {
    const orderFotocelulas: string[] = ['FE2', 'EXT-B1', 'MER-B2', 'MER-B3', 'Input_1', 'MRK-B1', 'TV-B1', 'CUL-B1', 'CUL-B3', 'CUL-B5', 'INJ-B1', 'INJ-B2', 'INJ-B3'];

    orderFotocelulas.forEach((fotocelulaId, index) => {
      setTimeout(() => {
        this.simularOcultacionEnFotocelula(fotocelulaId);
        this.simularTriggerinEvent(fotocelulaId);
      }, 500 * index);
    });
  }

  public simularOcultacionEnFotocelula(fotocelulaId: string) {
    this.lineasTransporte.first.modulosCoordsComponents.forEach(modulo =>
      modulo.getAllFotocelulas().forEach(fc => {
        if (fc.fotocelulaId === fotocelulaId) {
          modulo.setOcultado(fc.fotocelulaId, true);
          setTimeout(() => {
            modulo.setOcultado(fc.fotocelulaId, false);
          }, 200);
        }
      })
    );
  }

  public simularTriggerinEvent(fotocelulaId: string) {
    let evento: any;
    this.lineasTransporte.first.modulosCoordsComponents.forEach(modulo =>
      modulo.getAllFotocelulas().forEach(fc => {
        if (fc.fotocelulaId === fotocelulaId) {
          evento = this.eventos[Math.floor(Math.random() * this.eventos.length)];
          modulo.simularEvento(fc.fotocelulaId, evento);
          this.trackingService.inyectarEventoWebSocket(
            fc.fotocelulaId,
            fc.fotocelulaId,
            evento
          );
        }
      })
    );
  }
}
