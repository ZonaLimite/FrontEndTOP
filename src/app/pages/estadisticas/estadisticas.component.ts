import { Component, Input, OnInit } from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { GraficasService } from '../../services/graficas.service';
import { GLOBAL } from '../../services/global';
import { ApiFaults } from '../../models/apiFaults';
import { ApiFaultsTable } from '../../models/apiFaultsTable.model';

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css'
})
export class EstadisticasComponent {
 
  private urlCommon ="";
  public urlAmbos:string ="";
  public urlTop1:string ="";
  public urlTop2:string ="";

  public xAxisLabel:string ="Dispositivos";
  public yAxisLabel="Numero de Fallos"
  public verMaquina1:boolean = true;
  public verMaquina2:boolean = false;

  
  //Modelo de Column tablas utilizado
  modelColInputLineItems: string[]= ["smachinetype","isessionnumber"];
  modelCol :string[]=[]

  //Inicializador Combo de conceptos a manejar
  public listItemsConcepto:ApiFaults[]=
            [new ApiFaultsTable('INPUT LINE ITEMS','api/laque sea',this.modelColInputLineItems), 
            // new ApiFaults('CONVEYOR ITEMS','api/faults/etifGroupBy'),
            // new ApiFaults('FEEDER ITEMS','api/faults/etifGroupBy'),
             //new ApiFaults('MACHIME ITEMS','api/faults/etifGroupBy'),
             //new ApiFaults('OUTPUT ITEMS','api/faults/etifGroupBy'),             
            ];

           
  
  private urlBase:string = GLOBAL.urlBase;
  public urlForTop1:string =this.urlBase+"api/sessions/machine/4";
  public urlForTop2:string =this.urlBase+"api/sessions/machine/5";
          
  //Inyeccion del servicio de graficas
  constructor(private graficasService: GraficasService){}

  
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
    
    this.urlCommon=GLOBAL.urlBase + filter.apiFault.faultApi+"?";
    
    if(filter.fechaIni != "" ) this.urlCommon += "fecha='"+filter.fechaIni+"' AND '"+filter.fechaFin+"'";
    if(filter.horaIni != "") this.urlCommon += "&hora='"+filter.horaIni+"' AND '"+filter.horaFin+"'";

    if(filter.turno !="")  this.urlCommon += "&turno="+filter.turno;
    if(filter.programa != "")  this.urlCommon += "&programa="+filter.programa;

    //Se quiere visualizar la grafica con caracter general
    if(!filter.maquina1 && !filter.maquina2) {
      this.urlAmbos = this.urlCommon
      this.verMaquina1=false;
      this.verMaquina2=false;

      //this.graficasService.faultsDataFromRest('Ambos',this.urlAmbos);
      console.log("url es :"+this.urlAmbos);
    } 
    //Solo se quiere visualizar la TOP1
    if(filter.maquina1 && !filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.verMaquina1=true;

      //this.graficasService.faultsDataFromRest('Top1',this.urlTop1);
      console.log("url es :"+this.urlTop1);
      console.log("faultApi es :"+filter.apiFault);
    }
    //Solo se quiere visualizar la TOP2  
    if(filter.maquina2 && !filter.maquina1) {
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina2=true;

      //this.graficasService.faultsDataFromRest('Top2',this.urlTop2);
      console.log("url es :"+this.urlTop2);
    } 
    //Se quiere visualizar ambas  
    if(filter.maquina1 && filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina1=true;
      this.verMaquina2=true;


      //this.graficasService.faultsDataFromRest('Top1',this.urlTop1);
      //this.graficasService.faultsDataFromRest('Top2',this.urlTop2);
      console.log("url de Top1 es:"+this.urlTop1);
      console.log("url de Top2 es:"+this.urlTop2);
    } 
    this.xAxisLabel=filter.apiFault.faultLabel;
    this.yAxisLabel="numero de fallos";
  }

}
