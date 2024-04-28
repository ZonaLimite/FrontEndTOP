import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


interface Faults{
  name: string;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResultsetService {
  private myUrl:string="http://localhost:8080/api/faults/etifGroupBy?fecha='2024/04/02' AND '2024/04/02'&maquina=5&turno=Tarde&maquina=5&turno=Tarde";
  private data: Faults[] = [];//Array de datos de la grafica
  private dataresults: any[] = [ ];//Array de datos utilizado por resulsetFrom Rest

  constructor(private http: HttpClient) { }
  
  get dataOfService(){
    return this.data;
  }

  get dataresultsetsOfService(){
    return this.dataresults;
  }

  //devuelve un Observable con contenido any[] 
  resultsetFromRest(url: string): Observable<any[]>{
    return this.http.get<any[]>(url);
  } 

  //metodo obtencion data grafica mediante Rest INHERENT
  faultsDataFromRest() {
      this.http.get(this.myUrl).subscribe(data=>{
         this.data=data as Faults[];
      });
  }

  //metodo obtencion data grafica mediante Rest com Observable
  faultsDataFromRestForgraphic(url:string): Observable<Faults[]> {
    return this.http.get<Faults[]>(url);
  }

  //generador de datos de prueba para la grafica
  randomData() {
    this.data =  [
                    {
                      "name": "AF01",
                      "value": Math.random() * 50
                    },
                    {
                      "name": "AF02",
                      "value": Math.random() * 50
                    },
                    {
                      "name": "AF03",
                      "value": Math.random() * 50
                    },
                    { "name": "AF01",
                      "value": Math.random() * 50
                    },
                    { "name": "AF04",
                      "value": 11
                    },
                    { "name": "AF05",
                      "value": 1
                    },
                    { "name": "AF06",
                      "value": 3
                    },
                    { "name": "AF07",
                      "value": 6
                    },
                    { "name": "AF08",
                      "value": 8
                    },
                    { "name": "AF09",
                      "value": 4
                    },
                    { "name": "AF10",
                      "value": 1
                    },
                    { "name": "AF11",
                      "value": 22
                    },
                    { "name": "AF12",
                      "value": 2
                    },
                    { "name": "AF13",
                      "value": 1
                    },
                    { "name": "AF14",
                      "value": 7
                    },
                    { "name": "AF15",
                      "value": 8
                    },
                    { "name": "AF16",
                      "value": 1
                    },
                    { "name": "AF17",
                      "value": 1
                    },
                    { "name": "AF18",
                      "value": 2
                    },
                    { "name": "AF19",
                      "value": 2
                    },
                    { "name": "AF20",
                      "value": 2
                    },
                    { "name": "AF21",
                      "value": 2
                    },
                    { "name": "AF22",
                      "value": 1
                    },
                    {
                      "name": "AF23",
                      "value": 11
                    },
                    {
                      "name": "AF24",
                      "value": 2
                    },
                    {
                      "name": "AF25",
                      "value": 2
                    },
                    { "name": "AF26",
                      "value": 2
                    },
                    { "name": "AF27",
                      "value": 11
                    },
                    { "name": "AF28",
                      "value": 1
                    },
                    { "name": "AF29",
                      "value": 3
                    },
                    { "name": "AF30",
                      "value": 6
                    },
                    { "name": "AF31",
                      "value": 8
                    },
                    { "name": "AF32",
                      "value": 4
                    },
                    { "name": "AF33",
                      "value": 1
                    },
                    { "name": "AF34",
                      "value": 12
                    },
                    { "name": "AF35",
                      "value": 2
                    },
                    { "name": "AF36",
                      "value": 1
                    },
                    { "name": "AF37",
                      "value": 7
                    },
                    { "name": "AF38",
                      "value": 8
                    },
                    { "name": "AF39",
                      "value": 1
                    },
                    { "name": "AF40",
                      "value": 1
                    },
                    { "name": "AF41",
                      "value": 2
                    },
                    { "name": "AF42",
                      "value": 2
                    },
                    { "name": "AF43",
                      "value": 2
                    },
                    { "name": "AF44",
                      "value": 2
                    },
                    { "name": "AF45",
                      "value": 1
                    },
                    {
                       "name": "AF46",
                       "value": 11
                     },
                     {
                       "name": "AF47",
                       "value": 2
                     },
                     {
                       "name": "AF48",
                       "value": 2
                     },
                     { "name": "AF49",
                       "value": 2
                     },
                     { "name": "AF50",
                       "value": 11
                     },
                     { "name": "AF51",
                       "value": 1
                     },
                     { "name": "AF52",
                       "value": 3
                     },
                     { "name": "AF53",
                       "value": 6
                     },
                     { "name": "AF54",
                       "value": 8
                     },
                     { "name": "AF55",
                       "value": 4
                     },
                     { "name": "AF56",
                       "value": 1
                     },
                     { "name": "AF57",
                       "value": 12
                     },
                     { "name": "AF58",
                       "value": 2
                     },
                     { "name": "AF59",
                       "value": 1
                     },
                     { "name": "AF60",
                       "value": 7
                     },
                     { "name": "AF61",
                       "value": 8
                     },
                     { "name": "AF62",
                       "value": 1
                     },
                     { "name": "AF63",
                       "value": 1
                     },
                     { "name": "AF64",
                       "value": 2
                     },
                     { "name": "AF65",
                       "value": 2
                     },
                     { "name": "AF66",
                       "value": 2
                     },
                     { "name": "AF67",
                       "value": 2
                     },
                     { "name": "AF68",
                       "value": 1
                     },
                     {
                       "name": "AF69",
                       "value": 11
                     },
                     {
                       "name": "AF70",
                       "value": 2
                     },
                     {
                       "name": "AF71",
                       "value": 2
                     },
                     { "name": "AF72",
                       "value": 2
                     },
                     { "name": "AF73",
                       "value": 11
                     },
                     { "name": "AF74",
                       "value": 1
                     },
                     { "name": "AF75",
                       "value": 3
                     },
                     { "name": "AF76",
                       "value": 6
                     },
                     { "name": "AF77",
                       "value": 8
                     },
                     { "name": "AF78",
                       "value": 4
                     },

                  ];
  }
}
