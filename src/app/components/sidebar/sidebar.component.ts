import { Component, Input , Output, EventEmitter, OnInit, OnDestroy, WritableSignal, effect} from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';
import { misignal } from '../tableviewer/tableviewer.component';



interface apiFaults{
  faultLabel:string;
  faultApi:string;
}

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit,OnDestroy {
  
  
  public title: string;
  public autoRefresh: boolean;
  private handlerInterval:any;
  
 
  //Estructura vinculacion select->api
  public listError:ApiFaults[]=
            [new ApiFaults('ETACS','api/faults/ejGroupBy'),
             new ApiFaults('FRACASOS ENTRADA','api/faults/etifGroupBy'),
            ];
  
  //Objeto para acomodar todos los campos recibidos del formulario
  //Utilizo un signal importado desde tableviewer (para recoger ciertos valores de ese componente)
  public formQuerySignal:WritableSignal<QueryParam>=misignal;


  //Variable de tipo Emitter para exportar el objeto QueryParam
  @Output() eventSubmitQuery:EventEmitter<QueryParam>;

 

  constructor(){
   
    this.title="Un formulario para Querys";
    this.autoRefresh=false;
    this.handlerInterval=0;
    this.eventSubmitQuery = new EventEmitter();
  }

  ngOnInit(): void {
    //Seleccionamos la primera opcion de fallos por defecto
    this.formQuerySignal().apiFault=this.listError[0];
    
  }

  onSubmit(){
    
    this.eventSubmitQuery.emit(this.formQuerySignal());
  }

  onAutorefreshChange(event:any){
    if (this.autoRefresh)this.startSetInterval();
    if (!this.autoRefresh)this.stopInterval();
  }
  startSetInterval(){
    this.handlerInterval=setInterval(() =>{
            this.onSubmit();
    }, 15000);  
    console.log("Interval -->ON")
    }
  stopInterval(){
    clearInterval(this.handlerInterval);
    console.log("Interval -->OFF")
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    this.stopInterval;
    console.log("sidebar destroyed");
    
  }

}
