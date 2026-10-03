import { Component, ChangeDetectionStrategy, Input, ViewChild, ViewChildren, QueryList, ElementRef, NgZone, AfterViewInit, OnDestroy, inject, computed, signal, effect } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModuloLineaCoordsConfig } from '../../models/modulo-transporte.model';
import { ModuloTransporteCoordsComponent } from '../modulo-transporte-coords/modulo-transporte-coords.component';
import { TrackingWebsocketService } from '../../services/tracking-websocket.service';

@Component({
  selector: 'app-linea-transporte',
  standalone: false,
  templateUrl: './linea-transporte.component.html',
  styleUrls: ['./linea-transporte.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineaTransporteComponent implements AfterViewInit, OnDestroy {

  ws = inject(TrackingWebsocketService);
  private zone = inject(NgZone);


  // ==========================================
  // MODO COORDENADAS (Posicionamiento Absoluto)
  // ==========================================
  @Input() modoCoords: boolean = false;          // Activa modo de coordenadas
  @Input() modulosCoordsConfig: ModuloLineaCoordsConfig[] = [];  // Módulos con coordenadas
  @Input() anchoLinea: number = 800;             // Ancho total en píxeles (modo coords)
  @Input() altoLinea: number = 400;              // Alto total en píxeles (modo coords)

  @Input() titulo: string = 'Línea de Transporte';

  /** Título visible: la máquina y línea enlazadas (ej: "TOP 1 Línea 1") o, sin link, el título de entrada */
  readonly tituloEnlace = computed(() => {
    const enlace = this.ws.enlaceTop();
    return this.ws.linkedTop() && enlace
      ? `TOP ${enlace.maquina} Línea ${enlace.lineaEntrada}`
      : null;
  });

  // Referencias a los componentes de módulos
  @ViewChildren(ModuloTransporteCoordsComponent) modulosCoordsComponents!: QueryList<ModuloTransporteCoordsComponent>;

  private cambiosModulosSub?: Subscription;

  /** Zona que contiene los módulos: su ancho es el disponible para la línea */
  @ViewChild('lineaBody', { static: true }) lineaBody!: ElementRef<HTMLElement>;

  /** Factor de zoom del lienzo de módulos: ancho disponible / anchoLinea (misma proporción en vertical) */
  readonly escala = signal(1);

  private observadorAncho?: ResizeObserver;

  /** Borde del wrapper de módulos (1px por lado) que no forma parte del lienzo */
  private readonly BORDE_WRAPPER = 2;

  private ajustarEscala() {
    const disponible = this.lineaBody.nativeElement.clientWidth - this.BORDE_WRAPPER;
    if (disponible <= 0 || this.anchoLinea <= 0) return;   // oculto o sin medir todavía
    this.escala.set(disponible / this.anchoLinea);
  }

  /** Modelo del formulario de conexión */
  /** Rango de máquinas TOP por centro (normalmente no más de 2) */
  readonly MAQUINA_MIN = 1;
  readonly MAQUINA_MAX = 2;

  linkForm = {
    maquina: 2,
    sistema: 'IL',
    lineaEntrada: '1'
  };

  /** Panel de conexión retraíble: en reposo solo se ve su botón junto al título */
  readonly panelAbierto = signal(false);

  /** Al establecerse el link TOP el panel ya no hace falta: se repliega solo */
  private readonly replegarAlEnlazar = effect(() => {
    if (this.ws.linkedTop()) this.panelAbierto.set(false);
  }, { allowSignalWrites: true });

  alternarPanel() { this.panelAbierto.update(abierto => !abierto); }
  cerrarPanel() { this.panelAbierto.set(false); }

  conectar() { this.ws.conectar(); }
  desconectar() {
    this.ws.desconectar();
    this.cerrarPanel();
  }

  linkarTopForm() {
    // El spinner permite teclear valores fuera de rango: se acotan antes de enviar
    const maquina = Math.min(this.MAQUINA_MAX, Math.max(this.MAQUINA_MIN, Math.round(Number(this.linkForm.maquina) || this.MAQUINA_MIN)));
    this.linkForm.maquina = maquina;
    this.ws.linkarTop(
      String(maquina),
      this.linkForm.sistema,
      this.linkForm.lineaEntrada
    );
  }

  ngAfterViewInit() {
    if (this.modoCoords) {
      // Recalcula el zoom cada vez que cambia el ancho disponible (el callback llega fuera de la zona de Angular)
      this.observadorAncho = new ResizeObserver(() => this.zone.run(() => this.ajustarEscala()));
      this.observadorAncho.observe(this.lineaBody.nativeElement);
      //Una vez renderizados todos los modulos los registramos en el servicio para que pueda enrutar los eventos a sus fotocélulas
      this.ws.registrarLinea(this.modulosCoordsComponents);
      // Si cambia la lista de módulos se reindexan las fotocélulas
      this.cambiosModulosSub = this.modulosCoordsComponents.changes.subscribe(() =>
        this.ws.registrarLinea(this.modulosCoordsComponents)
      );
      console.log(`Línea de transporte "${this.titulo}" (MODO COORDENADAS) inicializada con ${this.modulosCoordsConfig.length} módulos`);
    }
  }

  ngOnDestroy() {
    this.cambiosModulosSub?.unsubscribe();
    this.observadorAncho?.disconnect();
    if (this.modulosCoordsComponents) {
      this.ws.desregistrarLinea(this.modulosCoordsComponents);
    }
  }

  /**
   * trackBy del *ngFor de módulos: reutiliza el DOM de cada módulo por su id
   */
  trackByModulo(index: number, moduloCoords: ModuloLineaCoordsConfig): string {
    return moduloCoords.config.id;
  }

  /**
   * Simula un evento en una fotocélula de un módulo específico
   */
  public simularEventoEnModulo(
    moduloId: string,
    fotocelulaId: string,
    tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
  ) {

    const moduloCoords = this.modulosCoordsComponents.find(m => m.getIdModulo() === moduloId);

    if (moduloCoords) {
      moduloCoords.simularEvento(fotocelulaId, tipo);
    }
  }

  /**
   * Simula el encendido del LED rojo de una fotocélula durante 200ms
   * @param moduloId ID del módulo que contiene la fotocélula
   * @param fotocelulaId ID de la fotocélula
   */
  public simularOcultacionEnFotocelula(
    moduloId: string,
    fotocelulaId: string) {
    const moduloCoords = this.modulosCoordsComponents.find(m => m.getIdModulo() === moduloId);

    if (moduloCoords) {
      moduloCoords.setOcultado(fotocelulaId, true);
      setTimeout(() => {
        moduloCoords.setOcultado(fotocelulaId, false);
      }, 200);
    }
  }

  /**
   * Simula el flujo de un envío a través de todos los módulos
   */
  simularFlujoCompleto(retardoMs: number = 1000) {
    if (this.modoCoords) {
      this.modulosCoordsConfig.forEach((moduloConfig, index) => {
        const config = moduloConfig.config;
        const fotocelulas = config.fotocelulas;

        fotocelulas.forEach((fotocelula, fcIndex) => {
          setTimeout(() => {
            this.simularEventoEnModulo(config.id, fotocelula.id, 'atiempo');
            this.simularOcultacionEnFotocelula(config.id, fotocelula.id);
          }, (index * fotocelulas.length + fcIndex) * retardoMs);
        });
      });
    }
  }
}
