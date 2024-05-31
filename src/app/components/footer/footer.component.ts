import { Component, Input, WritableSignal, effect}  from '@angular/core';
import { logger } from '../tableviewer/tableviewer.component';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

@Input()  public pieText: string="";

//Objeto para acomodar todos los campos recibidos del formulario
//Utilizo un signal importado desde tableviewer (para recoger ciertos valores de ese componente)
public loggerSignal:WritableSignal<string>=logger;


constructor(){ 
  //Un effect propio de los signals, que al cambio de los valores
  //del signal, lo utilizo para seleccionar la primera fila del combo
  effect(() => {
    //cuando el signal cambia
    let tempLog= this.loggerSignal();
    //me selecciona el primer item del combo
    this.triggerDeletePietext(tempLog);
  });}

ngOnInit(): void {
  this.triggerDeletePietext("Bienvenidos a la APP SPA de mantenimiento TOP 2000");
}

triggerDeletePietext(logInfo: string) {
  //actualizo valor y al momento se borra
  this.pieText=logInfo;
  setTimeout(() => this.pieText = '', 5000)
}
 

 
}
