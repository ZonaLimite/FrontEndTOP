import { Component, OnInit } from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { GraficasService } from '../../services/graficas.service';
import { GLOBAL } from '../../services/global';



@Component({
  selector: 'app-fallos',
  templateUrl: './fallos.component.html',
  styleUrl: './fallos.component.css'
})
export class FallosComponent implements OnInit {
  private urlBase:string = GLOBAL.urlBase;
  private urlCommon ="";
  public urlAmbos:string ="";
  public urlTop1:string ="";
  public urlTop2:string ="";

  public xAxisLabel:string ="Dispositivos";
  public yAxisLabel="Numero de Fallos"
  public verMaquina1:boolean = false;
  public verMaquina2:boolean = false;

  //Inyeccion del servicio de graficas
  constructor(private graficasService: GraficasService){}

  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  ngOnInit(): void {
    this.graficasService.resetData();
 }

  //Metodo construccion submit Query
  lanzarQuery(filter: QueryParam ){ //QueryParam es el model recibido del Formulario
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
      this.graficasService.faultsDataFromRest('Ambos',this.urlAmbos);
      console.log("url es :"+this.urlAmbos);
    } 
    //Solo se quiere visualizar la TOP1
    if(filter.maquina1 && !filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.verMaquina1=true;
      this.graficasService.faultsDataFromRest('Top1',this.urlTop1);
      console.log("url es :"+this.urlTop1);
    }
    //Solo se quiere visualizar la TOP2  
    if(filter.maquina2 && !filter.maquina1) {
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina2=true;
      this.graficasService.faultsDataFromRest('Top2',this.urlTop2);
      console.log("url es :"+this.urlTop2);
    } 
    //Se quiere visualizar ambas  
    if(filter.maquina1 && filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina1=true;
      this.verMaquina2=true;
      this.graficasService.faultsDataFromRest('Top1',this.urlTop1);
      this.graficasService.faultsDataFromRest('Top2',this.urlTop2);
      console.log("url de Top1 es:"+this.urlTop1);
      console.log("url de Top2 es:"+this.urlTop2);
    } 

    
    this.xAxisLabel=filter.apiFault;
    this.yAxisLabel="numero de fallos";
  
    
    
  }
}
