import { Component, Input , Output, EventEmitter} from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';


interface apiFaults{
  faultLabel:string;
  faultApi:string;
}

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  public title: string;
  
  //Estructura vinculacion select->api
  public listError:ApiFaults[]=
            [new ApiFaults("ETACS","/faults/ejGroupBy"),
             new ApiFaults("FRACASOS ENTRADA ","/faults/etifGroupBy"),
            ];
  
  //Objeto para acomodar todos los campos recibidos del formulario
  public formQuery: QueryParam;

  //Variable de tipo Emitter para exportar el objeto QueryParam
  @Output() eventSubmitQuery:EventEmitter<QueryParam>;

  constructor(){
    this.formQuery = new QueryParam("","","","","","",false, false,"");
    this.title="Un formulario para Querys";
    this.eventSubmitQuery = new EventEmitter();
  }

  onSubmit(){
    this.eventSubmitQuery.emit(this.formQuery);
  }


 
  /*@Input() cabecera: string;
  @Input() propiedad_uno: string;
  @Input() propiedad_dos: string;*/

}
