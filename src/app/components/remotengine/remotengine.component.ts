import { AfterRenderPhase, Component, ElementRef, ViewChild, afterRender} from '@angular/core';
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

  @ViewChild('scrollChat') scroll!: ElementRef; //observer del elemento div panel de eventos

  private client: Client; //StompJs

  private urlBaseEngine:string = GLOBAL.urlBaseEngine;//una propertie para mapear la URl del servidor Engine

  //Objeto enlazado (TwoBinding) a todos los campos recibidos del formulario
  public remoteParam: RemoteParam;

  //Estructuras para soportar data de selects
  public dataMaquinas: string[]=[];
  public dataSistemas:string[]=[] ;
  public dataModulos:string[]=[];
  public dataListener:string[]=[];
  
  conectado: boolean = false; //variable de estado conexion socketJs
  linkTop: boolean = false; //variable estado conexion TOP
  
  traces: Traces[] = [];
  valueTop:number ;
  clienteId: string;
  urlEngine :string;

  debugger: string="Conectando ....";

  constructor() {
    this.urlEngine = this.urlBaseEngine + "topwebsocket"; //url broker StompJS en el server Engine
  
    this.client=new Client();
    this.clienteId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
    this.valueTop = 0;
    this.remoteParam = new RemoteParam("","","","","");
    afterRender(() => { //life hook que permite ajustar el scroll del elemento una vez se ha renderizado
      if(this.scroll != undefined){
        this.scroll.nativeElement.scrollTop= this.scroll.nativeElement.scrollHeight;
      }
    }, {phase: AfterRenderPhase.Write});
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
   
      console.log(this.clienteId);
    
      this.refreshComboMaquinas();
    }

    this.client.onDisconnect = (frame) => {
      this.handleOnDisconnect("Desconexion solicitada");
    }
    this.client.onWebSocketClose = (closeEvent:CloseEvent) =>{
      this.handleOnDisconnect(closeEvent.reason);
    }

  }
//######################################################################

  handleOnDisconnect(reason:string){
    console.log('Desconectados de socket TOP: ' + !this.client.connected + ' : ' + reason);
    this.conectado = false;
    //this.mensaje =new Mensaje("",0,"","","");
    this.traces = [];
  }

  onSubmit(){
    //this.eventSubmitQuery.emit(this.formQuery);
  }

  conectar(): void { // activar socket con Engine
    this.client.activate();
  }

  linkarTop(){ //solicitar link Top
   this.enviarComando("adjustnumtop",[this.remoteParam.maquina]) ; //ajustar el numero de maquina
   this.enviarComando("selectSistema",[this.remoteParam.sistema]) ; //ajustar el sistema de maquina
   this.enviarComando("selectConsulta",[this.remoteParam.modulo]) ; //ajustar la consulta empleada
   this.enviarComando("conectar",[]);

  }
  unLinkarTop(){ //solicitar cerrar la conexion a la TOP (No al socket engine)
    this.enviarComando("desconectar",[]);
  }

  desconectar(): void {
    this.client.deactivate();
  }

  //envoltura de la directiva para enviar mensajes al socket
  enviarComando(comando:string, args :string[]){
    this.client.publish({ destination: '/app/manage_engine', body: JSON.stringify(new ResultEngine(comando,args)) });
  }

  //Inicializar combos
  refreshComboMaquinas() {
    this.enviarComando("maquinas",[] );
    this.enviarComando("sistemas",[]);
    this.enviarComando("modulos",["IL"]);
    this.enviarComando("listeners",[]);
  }

  //Manejador responses de Engine
  handleMessage(resultRest: ResultEngine) {
    
     console.log("Recibido de channel control:"+resultRest )
    switch (resultRest.tipoResult){ //tipoResult identifica el tipo de mensaje rcibido
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

      case "ackConectar":
        this.linkTop=true;
        break;  

      case "ackDesconectar":
        this.linkTop=false;
        break;

      }

  }

  //manejador para recepcion de eventos de Engine (consumer)
  handleTracesEvent(eventTrace: Traces) {
    this.traces.push(eventTrace);
  }

  //manejador de evento de cambio combo sistemas
  dataChanged(event: Event) {
    console.log("el item seleccionado es:" + this.remoteParam.sistema);
    this.enviarComando("selectSistema",[this.remoteParam.sistema]);
    this.enviarComando("modulos",[this.remoteParam.sistema]);
    
  }

  //manejador solicitud incluir listener rapido
  incluirListenerRapido(){
    this.enviarComando("incluirListenerRapido",[this.remoteParam.textListener]);
    this.enviarComando("doClickListenerrapido",[]);
  }
  
}





