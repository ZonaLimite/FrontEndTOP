import { Component, ChangeDetectionStrategy, Input, ViewChildren, QueryList, AfterViewInit, inject, computed } from '@angular/core';
import { ModuloCoordsConfig, FotocelulaCoordsConfig, MedidaEspesor, LecturaDestino } from '../../models/modulo-transporte.model';
import { FotocelulaComponent } from '../fotocelula/fotocelula.component';
import { EspesorEstadoService } from '../../services/espesor-estado.service';
import { LecturaDestinoEstadoService } from '../../services/lectura-destino-estado.service';

@Component({
  selector: 'app-modulo-transporte-coords',
  standalone: false,
  templateUrl: './modulo-transporte-coords.component.html',
  styleUrls: ['./modulo-transporte-coords.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModuloTransporteCoordsComponent implements AfterViewInit {
  @Input() config!: ModuloCoordsConfig;
  
  // Referencia a todas las fotocélulas del módulo
  @ViewChildren(FotocelulaComponent) fotocelulas!: QueryList<FotocelulaComponent>;

  private espesorEstado = inject(EspesorEstadoService);

  /** Última medida de espesor vigente de este módulo (solo feeders) */
  readonly medidaEspesor = computed<MedidaEspesor | undefined>(() => this.espesorEstado.medidas()[this.config?.id]);

  private lecturaDestinoEstado = inject(LecturaDestinoEstadoService);

  /** Última lectura de destino de la línea (solo módulos ACQ): solo una de las dos está definida */
  readonly lecturaOcr = computed<LecturaDestino | undefined>(() => this.lecturaDestinoEstado.ultimas().ocr);
  readonly lecturaRestitucion = computed<LecturaDestino | undefined>(() => this.lecturaDestinoEstado.ultimas().restitucion);

  /** Último resultado de videocodificación de la línea (solo módulo VCS): independiente de las anteriores */
  readonly lecturaVideocodificacion = computed<LecturaDestino | undefined>(() => this.lecturaDestinoEstado.ultimas().videocodificacion);

  /**
   * Pulso de cada lectura: alterna 'a' / 'b' con cada lectura registrada.
   * Cambiar de clase cambia el nombre de la animación CSS y la reinicia,
   * aunque llegue el mismo destino que en la carta anterior.
   */
  readonly pulsoOcr = computed(() => this.pulso(this.lecturaDestinoEstado.contadores().ocr));
  readonly pulsoRestitucion = computed(() => this.pulso(this.lecturaDestinoEstado.contadores().restitucion));
  readonly pulsoVideocodificacion = computed(() => this.pulso(this.lecturaDestinoEstado.contadores().videocodificacion));

  private pulso(n: number): 'a' | 'b' | null {
    return n === 0 ? null : n % 2 ? 'a' : 'b';
  }

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
   * trackBy del *ngFor de fotocélulas: reutiliza el DOM de cada fotocélula por su id
   */
  trackByFotocelula(index: number, fotocelula: FotocelulaCoordsConfig): string {
    return fotocelula.id;
  }

  /**
   * Simula un evento en una fotocélula específica
   * @param fotocelulaId - ID de la fotocélula
   * @param tipo - Tipo de evento a simular
   */
  simularEvento(
    fotocelulaId: string, 
    tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
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
    tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
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
      fotocelula.ocultado.set(ocultado);
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
