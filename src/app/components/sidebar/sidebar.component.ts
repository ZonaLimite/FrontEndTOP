import { Component, Input , Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
public title: string;

  @Input() propiedad_uno: string;
  @Input() propiedad_dos: string;

  constructor(){
    this.title="Contendo del sideBar";
    this.propiedad_uno="P1 vale 1";
    this.propiedad_dos="P2 vale 2";
  }

}
