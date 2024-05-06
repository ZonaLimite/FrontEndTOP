import { Component } from '@angular/core';
import { GLOBAL } from '../../services/global';

@Component({
  selector: 'app-querier',
  templateUrl: './querier.component.html',
  styleUrl: './querier.component.css'
})
export class QuerierComponent {
private urlBase:string = GLOBAL.urlBase;
public urlForTop1:string =this.urlBase+"api/sessions/machine/4";
public urlForTop2:string =this.urlBase+"api/sessions/machine/5";

}
