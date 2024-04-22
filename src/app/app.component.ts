import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Gobierno fallos TOP 2000';

  private modeloP1 = 'Desde app.component P1 ahora vale X';

  public set ModeloP1(newValue:string){
    this.modeloP1=newValue
  }

  public get ModeloP1(){
    return this.modeloP1;
  }
}
