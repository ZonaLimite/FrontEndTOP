import { Component } from '@angular/core';
import { QueryParam } from '../../models/queryParam';



@Component({
  selector: 'app-fallos',
  templateUrl: './fallos.component.html',
  styleUrl: './fallos.component.css'
})
export class FallosComponent {
  private urlCommon ="";
  public urlAmbos:string ="";
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
    this.urlCommon ="";
    this.urlAmbos="";
    this.urlTop1="";
    this.urlTop2="";
    this.verMaquina1=filter.maquina1;
    this.verMaquina2=filter.maquina2;
    
    this.urlCommon="http://localhost:8080/api"+ filter.apiFault+"?";
    
    if(filter.fechaIni != "" ) this.urlCommon += "fecha='"+filter.fechaIni+"' AND '"+filter.fechaFin+"'";
    if(filter.horaIni != "") this.urlCommon += "&hora='"+filter.horaIni+"' AND '"+filter.horaFin+"'";

    if(filter.turno !="")  this.urlCommon += "&turno="+filter.turno;
    if(filter.programa != "")  this.urlCommon += "&programa="+filter.programa;

    //Se quiere visualizar la grafica con caracter general
    if(!filter.maquina1 && !filter.maquina2) {
      this.urlAmbos = this.urlCommon
      this.verMaquina1=false;
      this.verMaquina2=false;
      console.log("url es :"+this.urlAmbos);
    } 
    //Solo se quiere visualizar la TOP1
    if(filter.maquina1 && !filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.verMaquina1=true;
      console.log("url es :"+this.urlTop1);
    }
    //Solo se quiere visualizar la TOP2  
    if(filter.maquina2 && !filter.maquina1) {
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina2=true;
      console.log("url es :"+this.urlTop2);
    } 
    //Se quiere visualizar ambas  
    if(filter.maquina1 && filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina1=true;
      this.verMaquina2=true;
      console.log("url de Top1 es:"+this.urlTop1);
      console.log("url de Top2 es:"+this.urlTop2);
    } 

    
    this.xAxisLabel=filter.apiFault;
    this.yAxisLabel="numero de fallos";
  
    
    
  }
}
