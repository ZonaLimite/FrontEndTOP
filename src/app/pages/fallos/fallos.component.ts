import { Component, Input, OnInit } from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { GraficasService } from '../../services/graficas.service';
import { GLOBAL } from '../../services/global';
import { ApiFaults } from '../../models/apiFaults';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

//Un paso de variable desde el fichero assets/configuraciones
//para permitir sin tener que volver a transpilar ,obtener parametro de urls de servidores
// confuraciones.js esta ubicado en assets/configuraciones
// y es instanciado en en Index.html , en el head como un script
declare var configuraciones: any;


@Component({
  selector: 'app-fallos',
  templateUrl: './fallos.component.html',
  styleUrl: './fallos.component.css'
})
export class FallosComponent implements OnInit {
  private sessionTop1Selected: number=0;
  private sessionTop2Selected: number=0;

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

  //Inicializador Combo de conceptos a manejar
  public listItemsConcepto:ApiFaults[]=
            [new ApiFaults('ETACS','api/faults/ejGroupBy',[]),
             new ApiFaults('FRACASOS ENTRADA','api/faults/etifGroupBy',[]),
             new ApiFaults('FALLOS ELECTROIMAN','api/faults/uefGroupBy',[]),
             new ApiFaults('CUBA MAL CERRADA','api/faults/bnpcGroupBy',[]),
             new ApiFaults('CUBA MAL ABIERTA','api/faults/cnobGroupBy',[]),
            ];

  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  ngOnInit(): void {
    this.graficasService.resetData();
 }

  //Metodo construccion submit Query
  lanzarQuery(filter: QueryParam ){ //QueryParam es el model recibido del sidebar
    this.urlCommon ="";
    this.urlAmbos="";
    this.urlTop1="";
    this.urlTop2="";
    this.verMaquina1=filter.maquina1;
    this.verMaquina2=filter.maquina2;
    
    this.urlCommon=configuraciones.urlBase + filter.apiFault.faultApi+"?";
  
    if(filter.fechaIni != "" ) this.urlCommon += "fecha='"+filter.fechaIniUtc+"' AND '"+filter.fechaFinUtc+"'";
    if(filter.horaIni != "") this.urlCommon += "&hora='"+filter.horaIniUtc+"' AND '"+filter.horaFinUtc+"'";

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
    this.xAxisLabel=filter.apiFault.faultLabel;
    this.yAxisLabel="numero de fallos";
  }
}
