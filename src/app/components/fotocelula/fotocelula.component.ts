import { Component, Input } from '@angular/core';
import { EventosTrackingService } from '../../services/eventos-tracking.service';

interface EventoTracking {
  id: number;
  tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion';
}

@Component({
  selector: 'app-fotocelula',
  standalone: false,
  templateUrl: './fotocelula.component.html',
  styleUrls: ['./fotocelula.component.css']
})
export class FotocelulaComponent {
  @Input() nombreFotocelula: string = 'Fotocélula';
  @Input() fotocelulaId: string = '';  // ID único para tracking
  @Input() moduloId: string = '';      // ID del módulo que contiene esta fotocélula
  @Input() moduloNombre: string = '';  // Nombre del módulo para contexto
  @Input() ocultado: boolean = true;
  @Input() tamano: 'pequeno' | 'normal' | 'mediano' | 'grande' = 'normal';
  @Input() orientacion: 'row' | 'column' = 'column';

  // Lista de eventos activos para permitir concurrencia
  eventosActivos: EventoTracking[] = [];
  private counter: number = 0;

  constructor(private trackingService: EventosTrackingService) { }

  mostrarEvento(tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion') {
    const id = this.counter++;


    if (tipo === 'activacion' || tipo === 'desactivacion') {
      if (tipo === 'activacion') {
        this.ocultado = true;
        //console.log(`Evento ${tipo} en ${this.nombreFotocelula}`);

        setTimeout(() => {
          this.ocultado = false;
        }, 70); // apagamos automaticamente la fotocelula

      } else {
        this.ocultado = false;
      }
    } else {
      const nuevoEvento: EventoTracking = { id, tipo };
      this.eventosActivos.push(nuevoEvento);
    }

    // Registrar el evento en el servicio de tracking
    // Usar IDs generados si no se proporcionan explícitamente
    const fotocelulaId = this.fotocelulaId || this.nombreFotocelula;

    //this.trackingService.registrarEvento(
    //  fotocelulaId,
    //  this.nombreFotocelula,
    //  tipo
    //);

    // Eliminar el evento después de que termine la animación (2s)
    setTimeout(() => {
      this.eventosActivos = this.eventosActivos.filter(e => e.id !== id);
    }, 2000); // 2000ms debe coincidir con la duración de la animación CSS
  }
}
