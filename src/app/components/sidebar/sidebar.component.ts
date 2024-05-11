import { Component, Input , Output, EventEmitter, OnInit, OnDestroy, WritableSignal, effect} from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';
import { misignal } from '../tableviewer/tableviewer.component';



//Estructura para albergar value y label datos del select
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
  public tempApiFaults: any;

  public autoRefresh: boolean;//Variables para el gobierno de autorefresh
  private handlerInterval:any;//y el interval que permite hacer polling 
  
  //Estructura vinculacion select->api pasado por Input desde el padre
  @Input() listItemsCombo:ApiFaults[]=[];

  //Variable de tipo Emitter para lanzar evento de objeto QueryParam
  @Output() eventSubmitQuery:EventEmitter<QueryParam>;
 
  /* public listError:ApiFaults[]=
            [new ApiFaults('ETACS','api/faults/ejGroupBy'),
             new ApiFaults('FRACASOS ENTRADA','api/faults/etifGroupBy'),
            ];*/
  
  //Objeto para acomodar todos los campos recibidos del formulario
  //Utilizo un signal importado desde tableviewer (para recoger ciertos valores de ese componente)
  public formQuerySignal:WritableSignal<QueryParam>=misignal;

  constructor(){
    //Un effect propio de los signals, que al cambio de los valores
    //del signal, lo utilizo para seleccionar la primera fila del combo
    effect(() => {
      //cuando el signal cambia
      this.tempApiFaults = this.formQuerySignal().apiFault;
      //me selecciona el primer item del combo
      this.formQuerySignal().apiFault=this.listItemsCombo[0];
    });

    this.title="Un formulario para Querys";
    this.autoRefresh=false;
    this.handlerInterval=0;
    this.eventSubmitQuery = new EventEmitter();
  }

  ngOnInit(): void {
    //Seleccionamos la primera opcion de fallos por defecto
    this.formQuerySignal().apiFault=this.listItemsCombo[0];
    
  }

  //Al pulsar el Submit del formulario emite el QueryParam
  onSubmit(){
    this.eventSubmitQuery.emit(this.formQuerySignal());
    console.info(this.formQuerySignal())
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
