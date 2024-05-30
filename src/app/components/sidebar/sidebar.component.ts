import { Component, Input , Output, EventEmitter, OnInit, OnDestroy, WritableSignal, effect} from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';
import { misignal } from '../tableviewer/tableviewer.component';
import moment from 'moment-timezone';


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
    //Hacemos aqui la conversion de fechas y horas time Zone hacia UTC+0
    //que es enl aque esta fijada la base de datos
    // Resetemos valores previos
    this.formQuerySignal().fechaIniUtc="";
    this.formQuerySignal().fechaFinUtc="";
    this.formQuerySignal().horaIniUtc="";
    this.formQuerySignal().horaFinUtc="";

    let fechaIni = this.formQuerySignal().fechaIni;
    let fechaFin = this.formQuerySignal().fechaFin;
    let horaIni =  this.formQuerySignal().horaIni
    let horaFin = this.formQuerySignal().horaFin;
    //Con la libreria moment.js instanciamos un moment de zona horaria Madrid
    if(horaIni !="" && fechaIni!=""){
      let maskMoment = fechaIni + " " + horaIni;
      var m = moment.tz(maskMoment, "YYYY/MM/DD HH:mm:ss", "Europe/Madrid");
      // y luego la pasamos a zona UTC+0 que es la que utiliza la base de datos
      let newHoraIni = m.clone().utc().format("HH:mm:ss");
      let newHoraFin = newHoraIni;
      let newFechaIni = m.clone().utc().format("YYYY/MM/DD");
      let newFechaFin = newFechaIni;
      
      //Se han creado nuevos campos para los campos fecha y hora de UTC+0
      //ya que sino se cambia la hora en el formulario a cada peticion.
      this.formQuerySignal().fechaIniUtc=newFechaIni;
      this.formQuerySignal().fechaFinUtc=newFechaFin;
      this.formQuerySignal().horaIniUtc=newHoraIni;
      this.formQuerySignal().horaFinUtc=newHoraFin;

      console.log("FechaIni = " + this.formQuerySignal().fechaIni); 
      console.log("HoraIni" + this.formQuerySignal().horaIni); 
    }else{
      this.formQuerySignal().fechaIniUtc=this.formQuerySignal().fechaIni;
      this.formQuerySignal().fechaFinUtc=this.formQuerySignal().fechaFin;
      this.formQuerySignal().horaIniUtc=this.formQuerySignal().horaIni;
      this.formQuerySignal().horaFinUtc=this.formQuerySignal().horaFin;
    }

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
