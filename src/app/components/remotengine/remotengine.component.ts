import { AfterRenderPhase, Component, ElementRef, TemplateRef, ViewChild, afterRender} from '@angular/core';
import { GLOBAL } from '../../services/global';

import SockJS from 'sockjs-client';
import { Client, IStompSocket } from '@stomp/stompjs';

import { RemoteParam } from '../../models/remoteParam';
import { ResultEngine } from '../../models/resultEngine';
import { Traces } from '../../models/traces';
import { DialogService } from '../../services/dialog.service';

//Material
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogWithTemplateComponent } from '../dialog-with-template/dialog-with-template.component';



@Component({
  selector: 'app-remotengine',
  templateUrl: './remotengine.component.html',
  styleUrl: './remotengine.component.css'
})
export class RemotengineComponent {
  //vinculacion controles con controlador en C. Dialogo emergente
  formGroup: FormGroup = new FormGroup({
    optionSel: new FormControl()
  });

  @ViewChild('scrollChat') scroll!: ElementRef; //observer del elemento div panel de eventos

  private client: Client; //StompJs

  private urlBaseEngine:string = GLOBAL.urlBaseEngine;//una propertie para mapear la URl del servidor Engine

  //Objeto enlazado (TwoBinding) a todos los campos recibidos del formulario
  public remoteParam: RemoteParam;

  //referencia a un Dialogo abierto mediante el MatDialogService
  private matDialogRef!: MatDialogRef<DialogWithTemplateComponent>;

  //Estructuras para soportar data de selects
  public dataMaquinas: string[]=[];
  public dataSistemas:string[]=[] ;
  public dataModulos:string[]=[];

  public dataListener:string[]=[];//Modelo de datos de Listener registrados en Engine
  public dataListenerActivos:string[]=[];//Modelo de datos de Listener activos registrados en Engine
  
  conectado: boolean = false; //variable de estado conexion socketJs

  linkTop: boolean = false; //variable estado conexion TOP
  
  traces: Traces[] = []; //arreglo de valores conteniendo trazas recibidas de Engine
  
  valueTop:number ; //El valor representando la TOP que estamos monitorizando

  urlEngine :string; //url Endpoint del broker StompJS corriendo en server Engine

  debugger: string="Conectando ....";

  constructor(private dialogService:DialogService) { //Inyectamos el servicio de Dialogos de Material

    this.urlEngine = this.urlBaseEngine + "topwebsocket"; 
  
    this.client=new Client(); //Inicializacion de nuestro cliente SocksJ
  
    this.valueTop = 0;
    this.remoteParam = new RemoteParam("","","","","", false);//mascara de Inicializacion campos de control

    afterRender(() => { //life hook que permite ajustar el scroll del elemento una vez se ha renderizado
      if(this.scroll != undefined){
        this.scroll.nativeElement.scrollTop= this.scroll.nativeElement.scrollHeight;
      }
    }, {phase: AfterRenderPhase.Write});
  }
  //############ On Init #######################################
  ngOnInit() {

    this.client.webSocketFactory = () => { // Stomp on sockjs
      return new SockJS(this.urlEngine) as IStompSocket; //Instanciacion del websocket StompJ
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
    
      this.refreshComboMaquinas(); //Inicializacion (requerido a Engine) de valores de control
    }

    this.client.onDisconnect = (frame) => {
      this.handleOnDisconnect("Desconexion solicitada");
    }
    this.client.onWebSocketClose = (closeEvent:CloseEvent) =>{
      this.handleOnDisconnect(closeEvent.reason);
    }

  }
//######################################################################
 //handlers y metodos loclaes
//######################################################################

  handleOnDisconnect(reason:string){
    console.log('Desconectados de socket TOP: ' + !this.client.connected + ' : ' + reason);
    this.conectado = false;
    //this.mensaje =new Mensaje("",0,"","","");
    this.traces = [];
  }
  //Recogida datos listener de dialogo emergente
  openWithDialogWithTemplate(template: TemplateRef<any>){
    this.matDialogRef = this.dialogService.openDialogWithTemplate({
      template
    })

    /*this.matDialogRef
    .afterClosed()
    .subscribe(res => console.log("Dialog With Template Close"));
    //this.formGroup.reset;*/
  }

  //Eviar una solicitud a Engine para registrar un Listener
  onSaveListener(){ 
    this.enviarComando("incluirlistenermodelfilter",[this.formGroup.value.optionSel]) ;

    this.matDialogRef.close();
  }

  //Solicitud de borrado de listener (el que este seleccionado en el combo)
  eliminarListener(){
    this.enviarComando("quitarlistenermodelfilter",[this.remoteParam.listener])
  }

  onSubmit(){
    //this.eventSubmitQuery.emit(this.formQuery);
  }

  conectar(): void { // activar socket con Engine
    this.client.activate();
  }

  linkarTop(){ //solicitar link Top
   this.enviarComando("adjustnumtop",[this.remoteParam.maquina]) ; //ajusta el numero de maquina
   this.enviarComando("selectSistema",[this.remoteParam.sistema]) ; //ajusta el sistema de maquina
   this.enviarComando("selectConsulta",[this.remoteParam.modulo]) ; //ajusta la consulta empleada
   this.enviarComando("conectar",[]); //conecta

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
    this.enviarComando("listenersActivos",[]);
  }

   //manejador de evento de cambio combo sistemas
   dataChanged(event: Event) {
    console.log("el item seleccionado es:" + this.remoteParam.sistema);
    this.enviarComando("selectSistema",[this.remoteParam.sistema]);
    this.enviarComando("modulos",[this.remoteParam.sistema]);
    
  }
   maquinaChanged(event : Event){
    this.enviarComando("adjustnumtop",[this.remoteParam.maquina]);
   }
   activeChaged(event :any){
      if(event.target.checked){
        this.enviarComando("setWebsocketPublish",["1"]);
      }else{
        this.enviarComando("setWebsocketPublish",["0"]);
      }
   }

  //manejador solicitud incluir listener rapido
  incluirListenerRapido(){
    this.enviarComando("incluirListenerRapido",[this.remoteParam.textListener]);
    this.enviarComando("doClickListenerrapido",[]);
  }

  clearDisplay(){
    this.traces=[];

  }


  //############################################################################
  //Manejador responses de Engine
  //############################################################################
  
  //#####################
  //---> channel control
  //#####################
  handleMessage(resultRest: ResultEngine) {
    
    
    switch (resultRest.tipoResult){ //tipoResult identifica el tipo de mensaje rcibido
      case "maquinas":// recibido arreglo para combo maquinas
        this.dataMaquinas = resultRest.data;
        if(this.remoteParam.maquina==""){
            this.remoteParam.maquina=this.dataMaquinas[0];
        } 
        break;

      case "sistemas":// recibido arreglo para combo sistemas
        this.dataSistemas = resultRest.data;
        if(this.dataSistemas.length > 0)this.remoteParam.sistema=resultRest.data[0]
        break;

      case "modulos":// recibido arreglo para combo sistemas (puede estar vacio)
        this.dataModulos = resultRest.data;
        
          if(this.dataModulos.length > 0)this.remoteParam.modulo=resultRest.data[0]
        
        break;

      case "listeners":
        this.dataListener = resultRest.data;
       
        break;
      case "listenersActivos":
        this.dataListenerActivos = resultRest.data;
        if(this.dataListenerActivos.length > 0)this.remoteParam.listener=resultRest.data[resultRest.data.length-1]
        break;

      case "listenerRapido":
        this.remoteParam.textListener = resultRest.data[0];
        break;
  

      case "ackConectar":
        this.linkTop=true;
        break;  

      case "ackDesconectar":
        this.linkTop=false;
        break;

      }

  }
  //#####################
  //---> channel traces
  //#####################

  //event traces from Engine
  handleTracesEvent(eventTrace: Traces) {
    this.traces.push(eventTrace);
  }

 
  
}





