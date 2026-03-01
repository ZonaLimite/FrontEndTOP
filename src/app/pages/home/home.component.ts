import { Component } from '@angular/core';
import { FotocelulaComponent } from '../../components/fotocelula/fotocelula.component';

@Component({
  selector: 'app-home',
  standalone: false,  
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  // Demo: Estado de las fotocélulas (true = ocultado/no ve emisor, false = ve emisor)
  fotocelula1Ocultada: boolean = true;
  fotocelula2Ocultada: boolean = true;
  fotocelula3Ocultada: boolean = true;
  fotocelula4Ocultada: boolean = true;

  hazSecuenciaDeLos4Leds() {
    const delay = 250; // ms entre cada LED
    
    // Apagar todos primero
    this.fotocelula1Ocultada = true;
    this.fotocelula2Ocultada = true;
    this.fotocelula3Ocultada = true;
    this.fotocelula4Ocultada = true;

    // Encender LED 1
    setTimeout(() => {
      this.fotocelula4Ocultada = false;
    }, delay);

    // Apagar LED 1, encender LED 2
    setTimeout(() => {
      this.fotocelula4Ocultada = true;
      this.fotocelula3Ocultada = false;
    }, delay * 2);

    // Apagar LED 2, encender LED 3
    setTimeout(() => {
      this.fotocelula3Ocultada = true;
      this.fotocelula2Ocultada = false;
    }, delay * 3);

    // Apagar LED 3, encender LED 4
    setTimeout(() => {
      this.fotocelula2Ocultada = true;
      this.fotocelula1Ocultada = false;
    }, delay * 4);

    // Apagar LED 4 (fin de secuencia)
    setTimeout(() => {
      this.fotocelula1Ocultada = true;
    }, delay * 5);
  }
}
