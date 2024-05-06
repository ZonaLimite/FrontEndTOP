import { Component, ElementRef, ViewChild} from '@angular/core';

import SockJS from 'sockjs-client';
import { Client, IStompSocket } from '@stomp/stompjs';

import { Mensaje } from '../../models/mensaje';

export function mySocketFactory() {
  return new SockJS('http://127.0.0.1:15674/stomp');
}

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
  url :string;

  constructor() {
    this.url = "http://localhost:8090/topwebsocket"; //Ojo el Engine corre en puerto 8090
    let ws = new SockJS(this.url);
    this.client=new Client();
    this.clienteId = 'id-' + new Date().getTime() + '-' + Math.random().toString(36).substr(2);
    this.escribiendo= "";

    this.mensaje=new Mensaje("",0,"","","");
  }
  
  ngOnInit() {

    this.client.webSocketFactory = () => { // Stomp on sockjs
      return new SockJS("http://localhost:8090/topwebsocket") as IStompSocket; //Ojo Engine esta en el puerto 8090
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
        var suma = (this.bindingInput.nativeElement.scrollHeight) + 28;
       
        this.valueTop = suma ;
       
        this.bindingInput.nativeElement.scrollIntoView(true);
        console.log(mensaje);
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
