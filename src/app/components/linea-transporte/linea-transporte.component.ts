import { Component, Input, ViewChildren, QueryList, AfterViewInit, inject } from '@angular/core';
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
  styleUrls: ['./linea-transporte.component.css']
})
export class LineaTransporteComponent implements AfterViewInit {

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

  constructor() { }

  conectar() { this.ws.conectar(); }
  desconectar() { this.ws.desconectar(); }
  linkarTop() { this.ws.linkarTop("2", "IL", "IL:Linea Entrada1"); } // Solo para pruebas

  ngAfterViewInit() {
    if (this.modoCoords) {
      //Una vez renderizado todos los modulos pasamos la referencia de instanciacion al servicio para que pueda usar los modulos
      this.ws.lineasTransporte = this.modulosCoordsComponents;
      console.log(`Línea de transporte "${this.titulo}" (MODO COORDENADAS) inicializada con ${this.modulosCoordsConfig.length} módulos`);
    }
  }

  /**
   * Determina si está en modo coordenadas
   */
  isModoCoordenadas(): boolean {
    return this.modoCoords && this.modulosCoordsConfig.length > 0;
  }


  /**
   * Obtiene el estilo del contenedor de módulos (Modo Coordenadas - Posicionamiento Absoluto)
   */
  getLineaStyleCoords() {
    return {
      'position': 'relative',
      'width': `${this.anchoLinea}px`,
      'height': `${this.altoLinea}px`,
      'border': '1px solid #ccc',
      'background': '#0e0d0d'
    };
  }

  /**
   * Obtiene el estilo de posicionamiento para un módulo en modo coordenadas
   */
  getModuloStyleCoords(moduloCoords: ModuloLineaCoordsConfig) {
    return {
      'position': 'absolute',
      'left': `${moduloCoords.x}px`,
      'top': `${moduloCoords.y}px`
      //'transform': 'translate(-50%, -50%)'  // Centrar en las coordenadas
    };
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
