import { Component, EventEmitter, Output } from '@angular/core';
import { GLOBAL } from '../../services/global';

@Component({
  selector: 'app-querier',
  templateUrl: './querier.component.html',
  styleUrl: './querier.component.css'
})
export class QuerierComponent {

@Output() iSessionValueEventTop1= new EventEmitter();
@Output() iSessionValueEventTop2= new EventEmitter();
  
private urlBase:string = GLOBAL.urlBase;
public urlForTop1:string =this.urlBase+"api/sessions/machine/4";
public urlForTop2:string =this.urlBase+"api/sessions/machine/5";

//Metodo recogida evento iSession emitido por el tableViewer
adjustIsessionTop1(iSessionValueTop1:number){
  this.iSessionValueEventTop1.emit(iSessionValueTop1);
}
adjustIsessionTop2(iSessionValueTop2:number){
  this.iSessionValueEventTop2.emit(iSessionValueTop2);
}

}
