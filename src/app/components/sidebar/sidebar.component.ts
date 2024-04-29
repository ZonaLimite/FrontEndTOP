import { Component, Input , Output, EventEmitter, OnInit} from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { ApiFaults } from '../../models/apiFaults';
import { FormGroup, FormControl } from '@angular/forms';


interface apiFaults{
  faultLabel:string;
  faultApi:string;
}

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  public title: string;
 


  //Estructura vinculacion select->api
  public listError:ApiFaults[]=
            [new ApiFaults('ETACS','/faults/ejGroupBy'),
             new ApiFaults('FRACASOS ENTRADA','/faults/etifGroupBy'),
            ];
  
  

  //Objeto para acomodar todos los campos recibidos del formulario
  public formQuery: QueryParam;

  //Variable de tipo Emitter para exportar el objeto QueryParam
  @Output() eventSubmitQuery:EventEmitter<QueryParam>;

  constructor(){
    this.formQuery = new QueryParam("","","","","Tarde","",false, false,"");
    
    this.title="Un formulario para Querys";
    
    this.eventSubmitQuery = new EventEmitter();
  }

  ngOnInit(): void {
    //Seleccionamos esta opcion como selected en el select
    this.formQuery.apiFault='/faults/ejGroupBy';
  }

  onSubmit(){
    this.eventSubmitQuery.emit(this.formQuery);
  }

}
