import { AfterRenderPhase, Component, ElementRef, ViewChild, afterRender} from '@angular/core';

import SockJS from 'sockjs-client';
import { Client, IStompSocket } from '@stomp/stompjs';

import { Mensaje } from '../../models/mensaje';

//Un paso de variable desde el fichero assets/configuraciones
//para permitir sin tener que volver a transpilar ,obtener parametro de urls de servidores
// confuraciones.js esta ubicado en assets/configuraciones
// y es instanciado en en Index.html , en el head como un script
declare var configuraciones: any;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  @ViewChild('scrollChat') bindingInput!: ElementRef;
  private client: Client;

  conectado: boolean = false;
  mensaje: Mensaje ;  
  mensajes: Mensaje[] = [];
  valueTop = 0;
  escribiendo: string;
  clienteId: string;
 
  // Al final hacemos el paso de parametro externo desde configuraciones 
    private urlBaseEngine:string = configuraciones.urlBaseEngine;//una propertie para mapear la URl del servidor Engine
    urlEngine :string; //url Endpoint del broker StompJS corriendo en server Engine

  constructor() {
    this.urlEngine = this.urlBaseEngine + "topwebsocket"; 
   
    let ws = new SockJS(this.urlEngine);
    this.client=new Client();
    this.clienteId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
    this.escribiendo= "";

    this.mensaje=new Mensaje("",0,"","","");
    afterRender(() => {
      if(this.bindingInput != undefined){
        this.bindingInput.nativeElement.scrollTop= this.bindingInput.nativeElement.scrollHeight;
      }
    }, {phase: AfterRenderPhase.Write});
  }
  
  ngOnInit() {

    this.client.webSocketFactory = () => { // Stomp on sockjs
      return new SockJS(this.urlEngine) as IStompSocket; //Ojo Engine esta en el puerto 8090
    }
   
    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
      //this.mensaje = new Mensaje();
      //this.mensajes = [];
    }
   
    this.client.onConnect = (frame) => {
      console.log('Conectados: ' + this.client.connected + ' : ' + frame);
      this.conectado = true;

      this.client.subscribe('/channel/mensaje', e => {
        let mensaje: Mensaje = JSON.parse(e.body) as Mensaje;
        let numberTime: number = new Date(mensaje.fecha).getTime();
        mensaje.fecha = numberTime;

        if (!this.mensaje.color && mensaje.tipo == 'NUEVO_USUARIO' &&
          this.mensaje.username == mensaje.username) {
          this.mensaje.color = mensaje.color;
        }
       
        this.mensajes.push(mensaje);
            
      });

      this.client.subscribe('/channel/escribiendo', e => {
        this.escribiendo = e.body;
        setTimeout(() => this.escribiendo = '', 3000)
      });

      console.log(this.clienteId);
      this.client.subscribe('/channel/historial/' + this.clienteId, e => {
        const historial = JSON.parse(e.body) as Mensaje[];
      });

      this.client.publish({ destination: '/app/historial', body: this.clienteId });

      this.mensaje.tipo = 'NUEVO_USUARIO';
      this.client.publish({ destination: '/app/mensaje', body: JSON.stringify(this.mensaje) });
    }

    this.client.onDisconnect = (frame) => {
      console.log('Desconectados: ' + !this.client.connected + ' : ' + frame);
      this.conectado = false;
      this.mensaje =new Mensaje("",0,"","","");
      this.mensajes = [];
    }

  }
 
  conectar(): void {
    this.client.activate();
  }

  desconectar(): void {
    this.client.deactivate();
  }

  enviarMensaje(): void {
    this.mensaje.tipo = 'MENSAJE';
    this.client.publish({ destination: '/app/mensaje', body: JSON.stringify(this.mensaje) });
    this.mensaje.texto = '';
  }

  escribiendoEvento(): void {
    this.client.publish({ destination: '/app/escribiendo', body: this.mensaje.username });
  }

  autoscroll(event: any){
    //this.bindingInput.nativeElement.scrollIntoView();
    console.warn(this.bindingInput.nativeElement);
    
  }  

}
