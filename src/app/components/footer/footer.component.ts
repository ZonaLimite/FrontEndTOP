import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

@Input()  public pieText: string;

constructor(){
  this.pieText="Bienvenido a la app SPA de Mantenimiento correos TOP 2000";
}

triggerDeletePietext() {
  setTimeout(() => this.pieText = '', 5000)
}
 

 
}
