import { Component, Input, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { ModuloGridConfig } from '../../models/modulo-transporte.model';
import { FotocelulaComponent } from '../fotocelula/fotocelula.component';

@Component({
  selector: 'app-modulo-transporte-grid',
  standalone: false,
  templateUrl: './modulo-transporte-grid.component.html',
  styleUrls: ['./modulo-transporte-grid.component.css']
})
export class ModuloTransporteGridComponent implements AfterViewInit {
  @Input() config!: ModuloGridConfig;
  
  // Referencia a todas las fotocélulas del módulo
  @ViewChildren(FotocelulaComponent) fotocelulas!: QueryList<FotocelulaComponent>;

  constructor() {}

  ngAfterViewInit() {
    console.log(`Módulo ${this.config?.nombre} inicializado con ${this.fotocelulas.length} fotocélulas`);
  }

  /**
   * Obtiene el estilo del grid container
   */
  getGridStyle() {
    return {
      'display': 'grid',
      'grid-template-rows': `repeat(${this.config.gridRows}, 1fr)`,
      'grid-template-columns': `repeat(${this.config.gridColumns}, 1fr)`,
      'width': this.config.ancho || '400px',
      'height': this.config.alto || '200px',
      'gap': '0px',
      'padding': '16px'
    };
  }

  /**
   * Obtiene el estilo para cada fotocélula en el grid
   */
  getFotocelulaGridStyle(fotocelula: any) {
    return {
      'grid-row': `${fotocelula.gridRow}`,
      'grid-column': `${fotocelula.gridColumn}`,
      'display': 'flex',
      'justify-content': 'center',
      'align-items': 'center'
    };
  }

  /**
   * Simula un evento en una fotocélula específica
   */
  simularEvento(fotocelulaId: string, tipo: 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion') {
    const fotocelula = this.fotocelulas.find((fc, index) => 
      this.config.fotocelulas[index].id === fotocelulaId
    );
    
    if (fotocelula) {
      fotocelula.mostrarEvento(tipo);
    }
  }

  /**
   * Cambia el estado de ocultación de una fotocélula
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
   */
  getFotocelula(fotocelulaId: string): FotocelulaComponent | undefined {
    const index = this.config.fotocelulas.findIndex(fc => fc.id === fotocelulaId);
    return index !== -1 ? this.fotocelulas.toArray()[index] : undefined;
  }
}
