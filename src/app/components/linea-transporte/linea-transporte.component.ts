import { Component, ChangeDetectionStrategy, Input, ViewChildren, QueryList, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ModuloGridConfig,
  ModuloCoordsConfig,
  ModuloLineaCoordsConfig
} from '../../models/modulo-transporte.model';
import { ModuloTransporteGridComponent } from '../modulo-transporte-grid/modulo-transporte-grid.component';
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

  // Referencias a los componentes de módulos
  @ViewChildren(ModuloTransporteCoordsComponent) modulosCoordsComponents!: QueryList<ModuloTransporteCoordsComponent>;

  private cambiosModulosSub?: Subscription;

  constructor() { }

  conectar() { this.ws.conectar(); }
  desconectar() { this.ws.desconectar(); }
  linkarTop() { this.ws.linkarTop("2", "IL", "IL:Linea Entrada1"); } // Solo para pruebas

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
   * Determina si está en modo coordenadas
   */
  isModoCoordenadas(): boolean {
    return this.modoCoords && this.modulosCoordsConfig.length > 0;
  }


  /**
   * trackBy del *ngFor de módulos: reutiliza el DOM de cada módulo por su id
   */
  trackByModulo(index: number, moduloCoords: ModuloLineaCoordsConfig): string {
    return moduloCoords.config.id;
  }

  /**
   * Obtiene la configuración del módulo 
   */
  getModuloConfig(moduloCoords: ModuloLineaCoordsConfig): ModuloCoordsConfig {
    return moduloCoords.config;
  }

  /**
   * Simula un evento en una fotocélula de un módulo específico (Ambos modos)
   */
  public simularEventoEnModulo(
    moduloId: string,
    fotocelulaId: string,
    tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
  ) {

    // Buscar en módulos Coords
    const moduloCoords = this.modulosCoordsComponents.find(
      (m, index) => m.getIdModulo() === moduloId
    );

    if (moduloCoords) {
      moduloCoords.simularEvento(fotocelulaId, tipo);
    }
  }

  /**
   * Simula el enecendido de una fotocelula durante 150ms
   * @param moduloId Simula el enecendido de una fotocelula durante 100ms
   * @param fotocelulaId 
   */
  public simularOcultacionEnFotocelula(
    moduloId: string,
    fotocelulaId: string,) {
    // Buscar en módulos Coords
    const moduloCoords = this.modulosCoordsComponents.find(
      (m, index) => m.getIdModulo() === moduloId
    );

    if (moduloCoords) {
      moduloCoords.setOcultado(fotocelulaId, true);
      setTimeout(() => {
        moduloCoords.setOcultado(fotocelulaId, false);
      }, 200);
    }
  }

  /**
   * Obtiene la referencia a un módulo por su ID (Ambos modos)
   */
  private obtenerComponenteModulo(moduloId: string): ModuloTransporteGridComponent | ModuloTransporteCoordsComponent | undefined {

    // Buscar en módulos Coords (modo lineal)
    const moduloCoords = this.modulosCoordsComponents.find(
      (m, index) => m.getIdModulo() === moduloId
    );
    if (moduloCoords) return moduloCoords;

    return undefined;
  }

  /**
   * Simula el flujo de un envío a través de todos los módulos (Ambos modos)
   */
  simularFlujoCompleto(retardoMs: number = 1000) {
    if (this.modoCoords) {
      // Modo coordenadas
      this.modulosCoordsConfig.forEach((moduloConfig, index) => {
        const config = moduloConfig.config;
        const fotocelulas = 'fotocelulas' in config ? config.fotocelulas : [];

        fotocelulas.forEach((fotocelula: any, fcIndex: number) => {
          setTimeout(() => {
            this.simularEventoEnModulo(config.id, fotocelula.id, 'atiempo');
            this.simularOcultacionEnFotocelula(config.id, fotocelula.id);
          }, (index * fotocelulas.length + fcIndex) * retardoMs);
        });
      });
    }
  }


  /**
   * Determina si un módulo es de tipo Coords
   */
  isModuloCoords(modulo: any): modulo is ModuloCoordsConfig {
    return 'ancho' in modulo && 'alto' in modulo && !('gridRows' in modulo);
  }
}
