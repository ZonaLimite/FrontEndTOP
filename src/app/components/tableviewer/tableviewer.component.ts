import { Component, Input } from '@angular/core';
import { ResultsetService } from '../../services/resultset.service';

@Component({
  selector: 'tableviewer',
  templateUrl: './tableviewer.component.html',
  styleUrl: './tableviewer.component.css'
})
export class TableviewerComponent {
 
  @Input() cabecera: string; //Titulo impuesto al volcado de tabla
  @Input() urlRest: string; //Url del servicio Rest que proporciona los datos de la grafica

  private interval: number;

  //arreglo con las filas del la tabla
  rows: any[] =[] ;

  
  //Inyeccion de dependencia del servicio
  constructor(private resultsetService: ResultsetService){
    this.urlRest="";
    this.cabecera="Aqui va cabecera";
    this.interval=0;
    
  }

  ngOnInit(){
  
  setInterval(() =>{
      if(this.urlRest!=""){
        this.resultsetService.resultsetFromRest(this.urlRest).subscribe(
          {
            next: (result) =>   this.rows = result,
            error: (e) => console.error(e)/*,
            complete: () => /*console.info('complete') */
        });
      }
    }, 5000)
   
  }

}
