import { Component } from '@angular/core';
import { Color, ScaleType} from '@swimlane/ngx-charts';
import { Input } from '@angular/core';
import { GraficasService } from '../../services/graficas.service';

interface Faults{
  name: string;
  value: number;
}

@Component({
  selector: 'grafica',
  templateUrl: './grafica.component.html',
  styleUrl: './grafica.component.css'
})
export class GraficaComponent {
  
  //Target de la grafica de maquina a la que representa
  @Input() target:string="";
  
  //Variables de personalizacion de la grafica desde el selector
  @Input() xAxisLabel: string ="Label eje X";
  @Input() yAxisLabel:string  = "Objeto de la grafica";
 
  //Inyeccion de dependencia del servicio de graficas
  constructor(public graficasService: GraficasService){
 
  }

  ngOnInit(){
 
  }

  // options grafica //
  view: [number,number] = [260, 400];

  //La propiedad single apunta a la variable miembro del 
  //servicio que contiene la gestion de la grafica
  get single(){
    switch (this.target){
      case 'Top1':
        return this.graficasService.dataServiceTop1;
        break;
      case 'Top2':
        return this.graficasService.dataServiceTop2;
          break;
      case 'Ambos':
        return this.graficasService.dataServiceAmbos;
          break;
      default:
        return [];          
    }  
  }

  animations = true;
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = true;
  
  
  showYAxisLabel = true;
  yMax =3;
  padding=1;
  showGridLines = true;
  schemeType = ScaleType.Linear;
  colorScheme: Color = {
      //domain: ['#00FF00','#00AA00', '#00DD00','#FF0000'],
      domain: ['#00FF00','#FF0000'],
      group: ScaleType.Linear,
      selectable: true, // => boolean (true / false)
      name: 'Customer Usage',
  };

  //Tratamiento eventos generados por la grafica
  onSelect(event: any) {
     console.log(event);
  }
 
}
