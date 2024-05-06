import { Component, ElementRef, ViewChild} from '@angular/core';
import { GLOBAL } from '../../services/global';

import SockJS from 'sockjs-client';
import { Client, IStompSocket } from '@stomp/stompjs';

import { Mensaje } from '../../models/mensaje';
import { RemoteParam } from '../../models/remoteParam';
import { ResultEngine } from '../../models/resultEngine';
import { Traces } from '../../models/traces';


@Component({
  selector: 'app-remotengine',
  templateUrl: './remotengine.component.html',
  styleUrl: './remotengine.component.css'
})
export class RemotengineComponent {

  @ViewChild('scrollChat') bindingInput!: ElementRef;

  private client: Client; //StompJs

  private urlBaseEngine:string = GLOBAL.urlBaseEngine;//una propertie para mapear la URl del servidor Engine

  //Objeto enlazado (TwoBinding) a todos los campos recibidos del formulario
  public remoteParam: RemoteParam;

  //Estrcuturas para soportar data de selects
  public dataMaquinas: string[]=[];
  public dataSistemas:string[]=[] ;
  public dataModulos:string[]=[];
  public dataListener:string[]=[];
  
  conectado: boolean = false; //variable de estado conexion socketJs
  
  traces: Traces[] = [];
  valueTop:number ;
  clienteId: string;
  urlEngine :string;

  debugger: string="Conectando ....";

  constructor() {
    this.urlEngine = this.urlBaseEngine + "topwebsocket"; //servicio StompJS en el server Engine
  
    this.client=new Client();
    this.clienteId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
    this.valueTop = 0;
    this.remoteParam = new RemoteParam("","","","");

  }
  
  ngOnInit() {

    this.client.webSocketFactory = () => { // Stomp on sockjs
      return new SockJS(this.urlEngine) as IStompSocket; //Ojo Engine esta en el puerto 8090
    }
   
    this.client.onConnect = (frame) => {
      console.log('Conectados a socket TOP: ' + this.client.connected + ' : ' + frame);
      this.conectado = true;

      this.client.subscribe('/channel/control', e => {//websocket channel recepcion eventos de control
        let resultRest:ResultEngine  = JSON.parse(e.body) as ResultEngine;
        this.handleMessage(resultRest);
      });  

      this.client.subscribe('/channel/traces', e => {//websocket channel recepcion eventos de trazas de maquina
        let traces:Traces  = JSON.parse(e.body) as Traces;
        this.handleTracesEvent(traces);
      });  
   

      this.client.subscribe('/channel/escribiendo', e => {
        //this.escribiendo = e.body;
        //setTimeout(() => this.escribiendo = '', 3000)

      });
      console.log(this.clienteId);
    
      this.refreshComboMaquinas();

      //this.mensaje.tipo = 'NUEVO_USUARIO';
      // this.client.publish({ destination: '/app/mensaje', body: JSON.stringify(this.mensaje) });
    }


    this.client.onDisconnect = (frame) => {
      console.log('Desconectados de socket TOP: ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
      //this.mensaje =new Mensaje("",0,"","","");
      this.traces = [];
    }

  }
//######################################################################

  onSubmit(){
    //this.eventSubmitQuery.emit(this.formQuery);
  }

  conectar(): void {
    this.client.activate();
 
    
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    //this.mensaje.tipo = 'MENSAJE';
    //this.client.publish({ destination: '/app/mensaje', body: JSON.stringify(this.mensaje) });
    //this.mensaje.texto = '';
  }

  escribiendoEvento(): void {
    //this.client.publish({ destination: '/app/escribiendo', body: this.mensaje.username });
  }

  refreshComboMaquinas() {
    this.client.publish({ destination: '/app/manage_engine', body: JSON.stringify(new ResultEngine("maquinas",[])) });
    this.client.publish({ destination: '/app/manage_engine', body: JSON.stringify(new ResultEngine("sistemas",[])) });
    this.client.publish({ destination: '/app/manage_engine', body: JSON.stringify(new ResultEngine("modulos",["IL"])) });
    this.client.publish({ destination: '/app/manage_engine', body: JSON.stringify(new ResultEngine("listeners",[])) });
  }

  //Manejador responses de Engine
  handleMessage(resultRest: ResultEngine) {
    
    console.log("Recibido de channel control:"+resultRest )
    switch (resultRest.tipoResult){ //tipoResult identifica el tipo de mensaje recibido
      case "maquinas":// recibido arreglo para combo maquinas
        this.dataMaquinas = resultRest.data;
        if(this.remoteParam.maquina==""){
            this.remoteParam.maquina=this.dataMaquinas[0];
        } 
        break;
      case "sistemas":// recibido arreglo para combo sistemas
        this.dataSistemas = resultRest.data;
        if(this.remoteParam.sistema==""){
          this.remoteParam.sistema=this.dataSistemas[0];
      } 

        break;
      case "modulos":// recibido arreglo para combo sistemas (puede estar vacio)
        this.dataModulos = resultRest.data;
        if(this.dataModulos.length > 0){
          if(this.remoteParam.modulo==""){
            this.remoteParam.modulo=this.dataModulos[0];
          }else{
            
          }  
      } 
        break;
      case "listeners":
        this.dataListener = resultRest.data;

        if(this.dataListener.length > 0){
          if(this.remoteParam.listener==""){
            this.remoteParam.listener=this.dataListener[0];
          }else{
            
          }  
        }
        break;
      }
    

    //this.mensajes.push(mensaje);

    var suma = (this.bindingInput.nativeElement.scrollHeight) + 28;
    this.valueTop = suma ;
  
  }

  handleTracesEvent(eventTrace: Traces) {
    console.log("Recibido de channel traces:  Tipo:"+eventTrace.tipoResult+"--->"+"Data:"+eventTrace.data )
    this.traces.push(eventTrace);

  }

  
  
}





