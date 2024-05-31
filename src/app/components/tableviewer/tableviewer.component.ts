import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ResultsetService } from '../../services/resultset.service';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';



//Exportar un signal para los sidebar
export var misignal = signal<QueryParam>(new QueryParam("","","","","","",true, true,new ApiFaults("","",[]),"","","","",""));
//Exportar un signal para el footer
export var logger = signal<string>("tableviewer arrancando");

@Component({
  selector: 'tableviewer',
  templateUrl: './tableviewer.component.html',
  styleUrl: './tableviewer.component.css'
})
export class TableviewerComponent {
 
  @Input() cabecera: string; //Titulo impuesto al volcado de tabla
  @Input() urlRest: string; //Url del servicio Rest que proporciona los datos

 //Utilizado a modo de prueba para enviar info al footer
  @Output() isession = new EventEmitter();

  //arreglo con las tuplas de la tabla
  rows: any[] =[] ;

  //numero de fila seleccionada
   indexRow:number=0;  

  
  //Inyeccion de dependencia del servicio
  constructor(public resultsetService: ResultsetService){
    this.urlRest="";
    this.cabecera="";
  }

  ngOnInit(){
  
  setInterval(() =>{
      if(this.urlRest!=""){
        this.requestService (this.urlRest);
      }
    }, 10000)
   
  }
  //metodo de obtencion datos de fila tabla, para construir un
  //objeto que permita caracterizar el sidebar, faclitando asi
  //la contruccion y aporte de parametros para la consulta
  //Se apoya en un signal que es consumido en el componente sidebar.
  handleClick(index:number){
   
    this.indexRow=index;
    
    let fechaIni =  this.rows[index].fecha;
    let fechaFin = this.rows[index].fecha;
    let horaIni =  this.rows[index].hora;
    let horaFin = this.rows[index].hora;
    let turno = this.rows[index].turno;
    let programa = this.rows[index].programa;
    let maquina = this.rows[index].machineid;
    let maquina1:boolean = false;
    let maquina2:boolean= false;
    if (maquina==4) maquina1=true;
    if (maquina==5) maquina2=true;

    let paramQuerySidebar = new QueryParam(fechaIni,fechaFin,horaIni,horaFin,turno,programa,maquina1,maquina2,new ApiFaults('ETACS','api/faults/ejGroupBy',[]),"","","","","");
    
    misignal.set(paramQuerySidebar);//set signal value
 
  }

  private requestService (url : string){
      //logger.set(" Requiriendo servicio ... " + this.urlRest);
      this.resultsetService.resultsetFromRest(url).subscribe(
      {
        next: (result) => {
          if(result==null){
            logger.set("Recibido null ... " + this.urlRest);//set signal value
            //this.rows=[];  
          }else{
            this.rows = result;                
          }
        },
        error: (e) => {
          logger.set("Error resultService ... " + this.urlRest)//set signal value
          console.log(e);
        }/**,  
        complete: () =>  //logger.set(" Completado servicio ... " + this.urlRest)//set signal value**/
    });
  }
}

