import { Component } from '@angular/core';
import { Color, ScaleType} from '@swimlane/ngx-charts';
import { ResultsetService } from '../../services/resultset.service';
import { Input } from '@angular/core';

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
  interval: number;
  //Url de la consulta que ejecuta la grafica
  @Input() url: string="";
  
  //Variables de personalizacion de la grafica desde el selector
  @Input() xAxisLabel: string ="Label eje X";
  @Input() yAxisLabel:string  = "Objeto de la grafica";

  // array de datos de la grafica
  private data: Faults[] = [];

  //Inyeccion de dependencia del servicio
  constructor(private faultsService: ResultsetService){
    this.interval=0;
  }

  ngOnInit(){
    setInterval(() =>{
      console.log(this.xAxisLabel+" : "+this.url)
      if(this.url !=""){
        this.faultsService.faultsDataFromRestForgraphic(this.url)
        .subscribe(data=>{
          this.data= data as Faults[];
        });  
      }
     
      this.interval++;
    }, 3000);
  }

  
  onRandomData(){
    this.faultsService.randomData();
  }

  // options grafica //
  view: [number,number] = [0, 0];
  //La propiedad single apunta a la variable miembro que contiene los datos de la grafica
  get single(){
    return this.data;
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
