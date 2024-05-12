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
 
  constructor(private http: HttpClient) { }

 
  //devuelve un Observable con contenido any[] 
  resultsetFromRest(url: string): Observable<any[]>{
    return this.http.get<any[]>(url);
  } 

}
