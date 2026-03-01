import { AfterViewInit, Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ModuloGridConfig, ModuloCoordsConfig } from '../../models/modulo-transporte.model';
import { LineaTransporteComponent } from '../../components/linea-transporte/linea-transporte.component';
import { ModuloLineaCoordsConfig } from '../../models/modulo-transporte.model';
import { ModuloTransporteCoordsComponent } from '../../components/modulo-transporte-coords/modulo-transporte-coords.component';

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
        { id: 'CUL-B4', nombre: 'CUL-B4', x: 35, y: 30, tamano: 'pequeno', orientacion: 'row' },
        { id: 'CUL-B3', nombre: 'CUL-B3', x: 55, y: 60, tamano: 'pequeno', orientacion: 'row' },
       // { id: 'CUL-B2', nombre: 'CUL-B2', x: 86, y: 45, tamano: 'pequeno', orientacion: 'row' },
        { id: 'CUL-B1', nombre: 'CUL-B1', x: 86, y: 60, tamano: 'pequeno', orientacion: 'row' },                
      ]
    },
    {
      id: 'MRK-01',
      nombre: 'Marcado',
      ancho: 160,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'MRK-01', nombre: 'MRK-01', x: 85, y: 60, tamano: 'pequeno', orientacion: 'row' },
        { id: 'TV-01', nombre: 'TV-01', x: 20, y: 60, tamano: 'pequeno', orientacion: 'row' },
      ]
    },
    {
      id: 'ADQ-01',
      nombre: 'Adquisicion',
      ancho: 140,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'ADQ-01', nombre: 'ADQ-01', x: 83, y: 60, tamano: 'pequeno', orientacion: 'row' }
      ]  
    },
    {
      id: 'MER-01' ,
      nombre: 'Convergencia',
      ancho: 140,
      alto: 150,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'MER-01', nombre: 'MER-01', x: 83, y: 23, tamano: 'pequeno', orientacion: 'row' },
        { id: 'MER-02', nombre: 'MER-02', x: 30, y: 60, tamano: 'pequeno', orientacion: 'row' },
        { id: 'MER-03', nombre: 'MER-03', x: 83, y: 88, tamano: 'pequeno', orientacion: 'row' },
      ]  
    },
    {
      id: 'EXT-01' ,
      nombre: 'Extension',
      ancho: 200,
      alto: 53,
      orientacion: 'horizontal',
      fotocelulas: [
        { id: 'EXT-01', nombre: 'EXT-01', x: 88, y: 66, tamano: 'pequeno', orientacion: 'row' },
      ]  
    },  
    {
      id: 'FED-01' ,
      nombre: 'Feeder1',
      ancho: 80,
      alto: 120,
      orientacion: 'vertical',
      fotocelulas: [
        { id: 'FED-01', nombre: 'FED-01', x: 50, y: 37, tamano: 'pequeno', orientacion: 'row' },
      ]  
    },
    {
      id: 'FED-02' ,
      nombre: 'Feeder2',
      ancho: 80,
      alto: 120,
      orientacion: 'vertical',
      fotocelulas: [
        { id: 'FED-02', nombre: 'FED-02', x: 50, y: 30, tamano: 'pequeno', orientacion: 'row' },
      ]  
    }
  ];
// ==========================================
  // EJEMPLO 1: Posicionamiento Modulos con Coordenadas Absolutas
  // ==========================================
  modulosLineaEntrada: ModuloLineaCoordsConfig[] = [];

  constructor() {}
//inicializamos estructuras con los modulos declarados
  ngOnInit() {
    //Configuramos los módulos con coordenadas para la línea de entrada    
    //el border de modulo es de 2 px, por eso se suma 2 a la posición para evitar solapamiento con el borde de la línea
    const modulo = this.modulosCoordsEjemplo.find(m => m.id === "INJ-01");
    if (modulo) {
      this.modulosLineaEntrada.push({
        config: modulo,
        x: 10 ,
        y: 50
      });
    }
    const modulo2 = this.modulosCoordsEjemplo.find(m => m.id === "CUL-01");
    if (modulo2) {
      this.modulosLineaEntrada.push({
        config: modulo2,
        x: 170 + 2, 
        y: 50
      });
    }
    const modulo3 = this.modulosCoordsEjemplo.find(m => m.id === "MRK-01");
    if (modulo3) {
      this.modulosLineaEntrada.push({
        config: modulo3,
        x: 372 + 2,
        y: 50
      });
    }
    const modulo4 = this.modulosCoordsEjemplo.find(m => m.id === "ADQ-01");
    if (modulo4) {
      this.modulosLineaEntrada.push({
        config: modulo4,
        x: 534 + 2,
        y: 50
      });
    }
    const modulo5 = this.modulosCoordsEjemplo.find(m => m.id === "MER-01");
    if (modulo5) {
      this.modulosLineaEntrada.push({
        config: modulo5,
        x: 676 + 2,
        y: 50
      });
    }
    const modulo7 = this.modulosCoordsEjemplo.find(m => m.id === "EXT-01");
    if (modulo7) {
      this.modulosLineaEntrada.push({
        config: modulo7,
        x: 818 + 2,
        y: 50
      });
    }
    const modulo6 = this.modulosCoordsEjemplo.find(m => m.id === "FED-01");
    if (modulo6) {
      this.modulosLineaEntrada.push({
        config: modulo6,
        x: 818 + 2,
        y: 138
      });
    }
    const modulo8 = this.modulosCoordsEjemplo.find(m => m.id === "FED-02");
    if (modulo8) {
      this.modulosLineaEntrada.push({
        config: modulo8,
        x: 1020  + 2,
        y: 50
      });
    }

  }
  
  
  // ==========================================
  // MÉTODOS DE PRUEBA
  // ==========================================
 
  //Método para simular eventos en todas fotocélulas  

  simularEventosEnTodosModulos() {
    
    this.lineasTransporte.forEach(linea => {
      linea.modulosCoordsComponents.forEach(modulo => {
        modulo.config.fotocelulas.forEach(fotocelula => {
          const eventoAleatorio = this.eventos[Math.floor(Math.random() * this.eventos.length)];
          console.log(`Simulando evento: ${eventoAleatorio} en ${modulo.getNombreModulo()} - ${fotocelula.nombre}`);
          modulo.simularEvento(fotocelula.id, eventoAleatorio);
        });
      });
    });
  }

  //Simular seguimiento de todas las fotocelulas
  simularSeguimientoEnTodosModulos() {  
    const orderFotocelulas : string[] = ['FED-02','EXT-01','MER-01','MER-02','ADQ-01','MRK-01','TV-01','CUL-B1','CUL-B3','CUL-B5','INJ-B1','INJ-B2','INJ-B3'];

    orderFotocelulas.forEach((fotocelulaId, index) => {
      setTimeout(() => {
        this.simularOcultacionEnFotocelula(fotocelulaId)
        this.simularTriggerinEvent(fotocelulaId);
      }, 500 * index);  
    });  
  }

    /**
   * Simula el enecendido de una fotocelula durante 150ms
   * @param moduloId Simula el enecendido de una fotocelula durante 100ms
   * @param fotocelulaId 
   */
  public simularOcultacionEnFotocelula(
      fotocelulaId: string){
        this.lineasTransporte.first.modulosCoordsComponents.forEach(modulo =>
          modulo.getAllFotocelulas().forEach(fc => { 
            console.log(`Simulando evento en modulo ${modulo.getNombreModulo()} fotocélula ${fc.fotocelulaId} contra ${fotocelulaId}`);         
            if (fc.fotocelulaId === fotocelulaId) {
              modulo.setOcultado(fc.fotocelulaId, true);  
              setTimeout(() => {
                modulo.setOcultado(fc.fotocelulaId, false);
              }, 200);
            }
          })
        );  
      
  }  

    /**
   * Simula el disparo de un evento en una fotocelula específica 
   * @param fotocelulaId 
   */
  public simularTriggerinEvent(
      fotocelulaId: string){
        let evento : any ;
        this.lineasTransporte.first.modulosCoordsComponents.forEach(modulo =>
          modulo.getAllFotocelulas().forEach(fc => { 
            console.log(`Simulando disparo evento en modulo ${modulo.getNombreModulo()} fotocélula ${fc.fotocelulaId} contra ${fotocelulaId}`);         
            if (fc.fotocelulaId === fotocelulaId) {
              evento = this.eventos[Math.floor(Math.random() * this.eventos.length)];
              modulo.simularEvento(fc.fotocelulaId, evento);  
              setTimeout(() => {
                modulo.setOcultado(fc.fotocelulaId, false);
              }, 200);
            }
          })
        );  
      
  }  
 


}  
