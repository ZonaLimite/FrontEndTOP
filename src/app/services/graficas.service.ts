import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Faults{
  name: string;
  value: number;
}

//Un servicio propio para las graficas
@Injectable({
  providedIn: 'root'
})
export class GraficasService {
  private dataTop1: Faults[] = [];//Array de datos de la grafica
  private dataTop2: Faults[] = [];//Array de datos de la grafica
  private dataAmbos: Faults[] = [];//Array de datos de la grafica
  constructor(private http: HttpClient) { }

  get dataServiceTop1(){
    return this.dataTop1;
  }

  get dataServiceTop2(){
    return this.dataTop2;
  }

  get dataServiceAmbos(){
    return this.dataAmbos;
  }

  resetData(){
    this.dataTop1= [];
    this.dataTop2= [];
    this.dataAmbos= [];
  }

  faultsDataFromRest(target:string, url:string) {
    this.http.get(url).subscribe(data=>{
      switch ( target ) {
        case 'Top1':
          this.dataTop1=data as Faults[];
          break;
        case 'Top2':
          this.dataTop2=data as Faults[];
            break;
        case 'Ambos':
          this.dataAmbos=data as Faults[];
            break;
     }
    });
}

}
