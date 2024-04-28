import { Component } from '@angular/core';

@Component({
  selector: 'app-querier',
  templateUrl: './querier.component.html',
  styleUrl: './querier.component.css'
})
export class QuerierComponent {
public urlForTop1:string ="http://localhost:8080/api/sessions/machine/4";
public urlForTop2:string ="http://localhost:8080/api/sessions/machine/5";

}
