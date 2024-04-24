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
  private myUrl:string="";
  private data: Faults[] = [ ];//Array de datos de la grafica
  private dataresults: any[] = [ ];


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

  
  
  //metodo obtencion data grafica mediante Rest
  faultsDataFromRest() {
      this.myUrl ="http://localhost:8080/api/faults/etifGroupBy?fecha='2024/04/02' AND '2024/04/02'&maquina=5&turno=Tarde&maquina=5&turno=Tarde";
      this.http.get(this.myUrl).subscribe(data=>{
         this.data=data as Faults[];
      });
  }
}
