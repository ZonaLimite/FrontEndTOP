import { AfterViewChecked, Component, Input, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import { QueryParam } from '../../models/queryParam';
import { GLOBAL } from '../../services/global';
import { ApiFaults } from '../../models/apiFaults';
import { TableViewerCommonComponent } from '../../components/tableviewercommon/tableviewercommon.component';

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

  public verMaquina1:boolean = true;
  public verMaquina2:boolean = false;

  //Lo utilizo para obtener una referencia al componente hijo TableViewer y asi poder hacer uso
  //de su metodo refreshTable()
  @ViewChildren(TableViewerCommonComponent) 
  tablas!: QueryList<TableViewerCommonComponent> ;
  
  //Modelo de Column tablas utilizado
  modelColInputLineItems: string[]= ["iinputLineId","injectedItems","cullingRejectOld","mailpieceAppeared","outOfSlotTooLate","slotTooEarly","injectableCollision","unInjectableCollision","tooThick","tooHigh","tooLong","tooShort","unavailableBucket","tooCloseToCulledItem","cullingReject"];

  modelCol :string[]=[]

  //Inicializador Combo de conceptos a manejar
  public listItemsConcepto:ApiFaults[]=
            [new ApiFaults('INPUT LINE ITEMS','api/querys/ilItems',this.modelColInputLineItems), 
            // new ApiFaults('CONVEYOR ITEMS','api/faults/etifGroupBy'),
            // new ApiFaults('FEEDER ITEMS','api/faults/etifGroupBy'),
             //new ApiFaults('MACHIME ITEMS','api/faults/etifGroupBy'),
             //new ApiFaults('OUTPUT ITEMS','api/faults/etifGroupBy'),             
            ];

           
  
  private urlBase:string = GLOBAL.urlBase;
          

  constructor(){}

  
  //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
  ngOnInit(): void {
    //this.graficasService.resetData();
  }

  //Metodo construccion submit Query
  lanzarQuery(filter: QueryParam ){ //QueryParam es el model recibido del sidebar
    this.urlCommon ="";
    this.urlAmbos="";
    this.urlTop1="";

    //reseteamos datos de tablas
    this.tablas.forEach(tabla =>{
      tabla.resetRows();
      
    })
   
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

      this.tablas.get(2)!.refreshTable("Ambas",this.urlAmbos,this.modelCol);
      //this.tableViewerCommonComponent.refreshTable("Ambas",this.urlAmbos,this.modelCol);
      console.log("url es :"+this.urlAmbos);
    } 
    //<!--------------------->
    //Solo se quiere visualizar la TOP1
    if(filter.maquina1 && !filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.verMaquina1=true;
      this.modelCol =filter.apiFault.modelColumn;
      let cabecera:string = "TOP1";

      this.tablas.get(0)!.refreshTable("TOP1",this.urlTop1,this.modelCol);
      //this.tableViewerCommonComponent.refreshTable(cabecera,this.urlTop1,this.modelCol);
      //console.log("url es :"+this.urlTop1);
    }
    //Solo se quiere visualizar la TOP2  
    if(filter.maquina2 && !filter.maquina1) {
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina2=true;
      this.modelCol =filter.apiFault.modelColumn;
      let cabecera:string = "TOP2";

      this.tablas.get(1)!.refreshTable("TOP2",this.urlTop2,this.modelCol);
      //this.tableViewerCommonComponent.refreshTable("TOP2",this.urlTop2,this.modelCol);
      //console.log("url es :"+this.urlTop2);
    } 
    //Se quiere visualizar ambas  
    if(filter.maquina1 && filter.maquina2) {
      this.urlTop1=this.urlCommon + "&maquina=4";
      this.urlTop2=this.urlCommon + "&maquina=5";
      this.verMaquina1=true;
      this.verMaquina2=true;

      this.modelCol =filter.apiFault.modelColumn;
      this.tablas.get(0)!.refreshTable("TOP1",this.urlTop1,this.modelCol);
      this.tablas.get(1)!.refreshTable("TOP2",this.urlTop2,this.modelCol);
      
      //this.tableViewerCommonComponent.refreshTable("TOP1",this.urlTop1,this.modelCol);
      //this.tableViewerCommonComponent.refreshTable("TOP2",this.urlTop2,this.modelCol);
      console.log("url de Top1 es:"+this.urlTop1);
      console.log("url de Top2 es:"+this.urlTop2);
    } 
   
  }

}

