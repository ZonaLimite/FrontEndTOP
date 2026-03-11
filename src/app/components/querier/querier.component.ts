import { Component, EventEmitter, Output } from '@angular/core';
import { TableViewerCommonComponent } from '../tableviewercommon/tableviewercommon.component';
import { GLOBAL } from '../../services/global';

declare var configuraciones: any;
@Component({
  selector: 'app-querier',
  standalone: false,
  templateUrl: './querier.component.html',
  styleUrl: './querier.component.css'
})
export class QuerierComponent {
  private urlBase:string;
  public urlForTop1:string
  public urlForTop2:string

  constructor(){
  this.urlBase= configuraciones.urlBase;
  this.urlForTop1=this.urlBase+"api/sessionsQuerier/machine/4";
  this.urlForTop2 =this.urlBase+"api/sessionsQuerier/machine/5";
  }

}
