import { Component } from '@angular/core';
import { QueryParam } from '../../models/queryParam';



@Component({
  selector: 'app-fallos',
  templateUrl: './fallos.component.html',
  styleUrl: './fallos.component.css'
})
export class FallosComponent {
  public url:string ="";
  public urlTop1:string ="";
  public urlTop2:string ="";

  public xAxisLabel:string ="Fallo STOP DEVICES";
  public yAxisLabel="Numero de Fallos"
  public verMaquina1:boolean = false;
  public verMaquina2:boolean = false;

  constructor(){

  }

  //Metodo construccion submit Query
  lanzarQuery(filter: QueryParam ){
    this.verMaquina1=filter.maquina1;
    this.verMaquina2=filter.maquina2;

    this.url="http://localhost:8080/api"+ filter.apiError+"?";
    this.urlTop1 = "";
    this.urlTop2 = "";
  
    if(filter.fechaIni != "" ) this.url += "fecha='"+filter.fechaIni+"' AND '"+filter.fechaFin+"'";
    if(filter.horaIni != "") this.url += "&hora='"+filter.horaIni+"' AND '"+filter.horaFin+"'";

    if(filter.turno !="")  this.url += "&turno="+filter.turno;
    if(filter.programa != "")  this.url += "&programa="+filter.programa;

    
    //Solo se quiere visualizar la TOP1
    if(filter.maquina1 && !filter.maquina2) {
      this.urlTop1=this.url + "&maquina=4";
      this.verMaquina1=true;
    }
    //Solo se quiere visualizar la TOP2  
    if(filter.maquina2 && !filter.maquina1) {
      this.urlTop2=this.url + "&maquina=5";
      this.verMaquina2=true;
    } 
    //Se quiere visualizar ambas  
    if(filter.maquina1 && filter.maquina2) {
      this.urlTop1=this.url + "&maquina=4";
      this.urlTop2=this.url + "&maquina=5";
      this.verMaquina1=true;
      this.verMaquina2=true;
    } 

    
    this.xAxisLabel=filter.apiError;
    this.yAxisLabel="numero de fallos";
  
    console.log("url es :"+this.url);
    
  }
}
