import { Component, ChangeDetectionStrategy, Input, ViewChildren, QueryList, AfterViewInit, OnDestroy, inject, computed } from '@angular/core';
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

  /** Modelo del formulario de conexión */
  linkForm = {
    maquina: '2',
    sistema: 'IL',
    lineaEntrada: '1'
  };

  conectar() { this.ws.conectar(); }
  desconectar() { this.ws.desconectar(); }

  linkarTopForm() {
    this.ws.linkarTop(
      this.linkForm.maquina,
      this.linkForm.sistema,
      this.linkForm.lineaEntrada
    );
  }

  ngAfterViewInit() {
    if (this.modoCoords) {
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
