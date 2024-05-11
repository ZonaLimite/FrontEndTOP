import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

@Input()  public pieText: string="";

constructor(){
  
}

ngOnInit(): void {
  
  this.triggerDeletePietext();
  
}

triggerDeletePietext() {
  //actualizo valor y al momento se borra
  this.pieText="Bienvenidos a la APP SPA de mantenimiento TOP 2000"
  setTimeout(() => this.pieText = '', 5000)
}
 

 
}
