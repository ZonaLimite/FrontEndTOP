import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'App Gobierno fallos TOP 2000';
  
  //variables padre de valores iSession (StartOfRecordingSession) emitidos por tableviewer
  private iSessionTop1Value:number = 0;
  private iSessionTop2Value:number = 0;

  private textFooter:string ="";

  //variables referencia para el pie footer
  public set textFooterValue(newValue:string){
    this.textFooter=newValue;
  }
  public get textFooterValue(){
    return this.textFooter;
  }

  public get iSessionTop1(){
    return this.iSessionTop1Value;
  }
  public get iSessionTop2(){
    return this.iSessionTop2Value;
  }



  updateISessionTop1(valueISession1: any){
    this.iSessionTop1Value=valueISession1;
    this.textFooter="El valor de iSessionTOP1 es :" +this.iSessionTop1 +" y el de TOP2 : " +this.iSessionTop2Value;
  }
  updateISessionTop2(valueISession2: any){
    this.iSessionTop2Value=valueISession2;
    this.textFooter="El valor de iSessionTOP1 es :" +this.iSessionTop1 +" y el de TOP2 : " +this.iSessionTop2Value;  
  }
}
