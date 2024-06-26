import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ResultsetService } from '../../services/resultset.service';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';


 interface Item{
  key:string,
  value:string
}


//Exportar un signal para los sidebar. No lo utilizamos en este caso.
//export var misignal = signal<QueryParam>(new QueryParam("","","","","","",true, true,new ApiFaults("","",[]),""));

@Component({
  selector: 'tableviewercommon',
  templateUrl: './tableviewercommon.component.html',
  styleUrl: './tableviewercommon.component.css'
})
export class TableViewerCommonComponent {
 
  @Input() cabecera: string=""; //Titulo impuesto al volcado de tabla
  @Input() urlRest: string=""; //Url del servicio Rest que proporciona los datos
  @Input() modelColumn:string[]=[];//Modelo del encolumnado de la tabla

 
  //arreglo con las tuplas de la tabla
  rows: any[] =[] ;
  
 
  //numero de fila seleccionada
   indexRow:number=0;  

  
  //Inyeccion de dependencia del servicio
  constructor(public resultsetService: ResultsetService){
   
    this.cabecera="";
  }

  ngOnInit(){
  
  } 
  resetRows(){
    this.rows=[];
    console.log("reseteando "+ this.cabecera);
  }

  //Es un metodo pensado para su utilizacion mmediante @ViewClild o @ViewChildren, de tal manera que es llamado
  //desde otro componente padre.
  refreshTable(cabecera: string, urlRest: string, modelColumn:string[]){
    this.cabecera=cabecera;
    this.urlRest=urlRest;
    this.modelColumn=modelColumn;
    this.resultsetService.resultsetFromRest(this.urlRest).subscribe(
      {
        next: (result) => {
          this.rows = result ;
          console.log(result);
        }  ,
        error: (e) => console.error(e)/*,
        complete: () => /*console.info('complete') */

     });
  }
}


