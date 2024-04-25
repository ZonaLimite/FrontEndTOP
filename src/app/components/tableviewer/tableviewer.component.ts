import { Component, Input } from '@angular/core';
import { ResultsetService } from '../../services/resultset.service';

@Component({
  selector: 'tableviewer',
  templateUrl: './tableviewer.component.html',
  styleUrl: './tableviewer.component.css'
})
export class TableviewerComponent {
 
  @Input() cabecera: string;
  private interval: number;
  private url: string;
  rows: any[] =[] ;

  
  //Inyeccion de dependencia del servicio
  constructor(private resultsetService: ResultsetService){
    this.cabecera="Aqui va cabecera";
    this.interval=0;
    this.url="http://localhost:8080/api/sessions/all";
  }

  ngOnInit(){
    this.resultsetService.resultsetFromRest(this.url).subscribe(
      result => {
        this.rows = result;
        //console.log(this.rows);
      },
      error => {
        var errorMessage = <any>error;
        //console.log(errorMessage);
      },
    );
   
    /*setInterval(() =>{
      this.resultsetService.faultsDataFromRest();
      this.interval++;
    }, 3000);*/

  }

}
