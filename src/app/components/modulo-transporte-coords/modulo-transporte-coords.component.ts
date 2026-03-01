import { Component, Input, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { ModuloCoordsConfig, FotocelulaCoordsConfig } from '../../models/modulo-transporte.model';
import { FotocelulaComponent } from '../fotocelula/fotocelula.component';

@Component({
  selector: 'app-modulo-transporte-coords',
  standalone: false,
  templateUrl: './modulo-transporte-coords.component.html',
  styleUrls: ['./modulo-transporte-coords.component.css']
})
export class ModuloTransporteCoordsComponent implements AfterViewInit {
  @Input() config!: ModuloCoordsConfig;
  
  // Referencia a todas las fotocélulas del módulo
  @ViewChildren(FotocelulaComponent) fotocelulas!: QueryList<FotocelulaComponent>;

  constructor() {}

  ngAfterViewInit() {
    console.log(`Módulo ${this.config?.nombre} inicializado con ${this.fotocelulas.length} fotocélulas`);
  }

  /**
   * Obtiene el nombre del módulo
   */
  getNombreModulo(): string {
    return this.config?.nombre || '';
  }

  /**
   * Obtiene el ID del módulo
   */
  getIdModulo(): string {
    return this.config?.id || '';
  }

  /**
   * Obtiene el estilo del contenedor del módulo
   */
  getModuloStyle() {
    return {
      'width': `${this.config.ancho}px`,
      'height': `${this.config.alto}px`,
      'position': 'relative'
    };
  }

  /**
   * Obtiene el estilo de posicionamiento para cada fotocélula
   */
  getFotocelulaStyle(fotocelula: FotocelulaCoordsConfig) {
    return {
      'position': 'absolute',
      'left': `${fotocelula.x}%`,
      'top': `${fotocelula.y}%`,
      'transform': 'translate(-50%, -50%)'  // Centrar en las coordenadas
    };
  }

  /**
   * Simula un evento en una fotocélula específica
   * @param fotocelulaId - ID de la fotocélula
   * @param tipo - Tipo de evento a simular
   */
  simularEvento(
    fotocelulaId: string, 
    tipo: 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
  ) {
    const fotocelula = this.fotocelulas.find((fc, index) => 
      this.config.fotocelulas[index].id === fotocelulaId
    );
    
    if (fotocelula) {
      fotocelula.mostrarEvento(tipo);
    }
  }

  /**
   * Simula múltiples eventos en fotocélulas del módulo
   * @param fotocelulaIds - Array de IDs de fotocélulas
   * @param tipo - Tipo de evento a simular
   */
  simularEventosMultiples(
    fotocelulaIds: string[],
    tipo: 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
  ) {
    fotocelulaIds.forEach(id => {
      this.simularEvento(id, tipo);
    });
  }

  /**
   * Cambia el estado de ocultación de una fotocélula
   * @param fotocelulaId - ID de la fotocélula
   * @param ocultado - Nuevo estado de ocultación
   */
  setOcultado(fotocelulaId: string, ocultado: boolean) {
    const index = this.config.fotocelulas.findIndex(fc => fc.id === fotocelulaId);
    if (index !== -1) {
      const fotocelula = this.fotocelulas.toArray()[index];
      fotocelula.ocultado = ocultado;
    }
  }

  /**
   * Obtiene una fotocélula por su ID
   * @param fotocelulaId - ID de la fotocélula a obtener
   */
  getFotocelula(fotocelulaId: string): FotocelulaComponent | undefined {
    const index = this.config.fotocelulas.findIndex(fc => fc.id === fotocelulaId);
    return index !== -1 ? this.fotocelulas.toArray()[index] : undefined;
  }

  /**
   * Obtiene todas las fotocélulas
   */
  getAllFotocelulas(): FotocelulaComponent[] {
    return this.fotocelulas.toArray();
  }

  /**
   * Obtiene la configuración de una fotocélula
   * @param fotocelulaId - ID de la fotocélula
   */
  getFotocelulaConfig(fotocelulaId: string): FotocelulaCoordsConfig | undefined {
    return this.config.fotocelulas.find(fc => fc.id === fotocelulaId);
  }

  /**
   * Obtiene información del módulo (para debugging)
   */
  getInfo() {
    return {
      id: this.config.id,
      nombre: this.config.nombre,
      ancho: this.config.ancho,
      alto: this.config.alto,
      totalFotocelulas: this.fotocelulas.length,
      fotocelulas: this.config.fotocelulas.map(fc => ({
        id: fc.id,
        nombre: fc.nombre,
        coordenadas: { x: fc.x, y: fc.y }
      }))
    };
  }
}
