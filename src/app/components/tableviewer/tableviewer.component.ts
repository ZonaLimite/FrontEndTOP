import { Component, Input } from '@angular/core';
import { ResultsetService } from '../../services/resultset.service';

@Component({
  selector: 'tableviewer',
  templateUrl: './tableviewer.component.html',
  styleUrl: './tableviewer.component.css'
})
export class TableviewerComponent {
 
  @Input() cabecera: string;
  @Input() urlRest: string;

  private interval: number;

  rows: any[] =[] ;

  
  //Inyeccion de dependencia del servicio
  constructor(private resultsetService: ResultsetService){
    this.urlRest="";
    this.cabecera="Aqui va cabecera";
    this.interval=0;
    
  }

  ngOnInit(){
    if(this.urlRest!=""){
      this.resultsetService.resultsetFromRest(this.urlRest).subscribe(
        {
          next: (result) =>   this.rows = result,
          error: (e) => console.error(e),
          complete: () => console.info('complete') 
      });
    }
    
    /*setInterval(() =>{
      this.resultsetService.faultsDataFromRest();
      this.interval++;
    }, 3000);*/

  }

}
