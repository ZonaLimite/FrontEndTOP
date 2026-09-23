import { Component, Input, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { EventosTrackingService } from '../../services/eventos-tracking.service';
import { RenderSchedulerService } from '../../services/render-scheduler.service';

interface EventoTracking {
  id: number;
  tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion';
}

@Component({
  selector: 'app-fotocelula',
  standalone: false,
  templateUrl: './fotocelula.component.html',
  styleUrls: ['./fotocelula.component.css'],
  // OnPush: solo se revisa cuando cambian sus inputs o sus signals (ocultado, eventosActivos)
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FotocelulaComponent {
  @Input() nombreFotocelula: string = 'Fotocélula';
  @Input() fotocelulaId: string = '';  // ID único para tracking
  @Input() moduloId: string = '';      // ID del módulo que contiene esta fotocélula
  @Input() moduloNombre: string = '';  // Nombre del módulo para contexto
  @Input('ocultado') set ocultadoInicial(valor: boolean) { this.ocultado.set(valor); }
  @Input() tamano: 'pequeno' | 'normal' | 'mediano' | 'grande' = 'normal';
  @Input() orientacion: 'row' | 'column' = 'column';

  // Estado del haz: true → LED rojo encendido (envío tapando la fotocélula)
  readonly ocultado = signal<boolean>(true);

  // Lista de eventos activos para permitir concurrencia
  readonly eventosActivos = signal<EventoTracking[]>([]);
  private counter: number = 0;

  // Los timers de apagado se ejecutan fuera de la zona y se aplican por frame
  private renderScheduler = inject(RenderSchedulerService);

  constructor(private trackingService: EventosTrackingService) { }

  /**
   * trackBy de los indicadores: al quitar un evento no se recrean los demás
   */
  trackByEvento(index: number, evento: EventoTracking): number {
    return evento.id;
  }

  mostrarEvento(tipo: 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion') {
    const id = this.counter++;


    if (tipo === 'activacion' || tipo === 'desactivacion') {
      if (tipo === 'activacion') {
        this.ocultado.set(true);
        //console.log(`Evento ${tipo} en ${this.nombreFotocelula}`);

        this.renderScheduler.despues(70, () => {
          this.ocultado.set(false);
        }); // apagamos automaticamente la fotocelula

      } else {
        this.ocultado.set(false);
      }
    } else {
      const nuevoEvento: EventoTracking = { id, tipo };
      this.eventosActivos.update(eventos => [...eventos, nuevoEvento]);

      // Eliminar el evento después de que termine la animación (2s)
      this.renderScheduler.despues(2000, () => {
        this.eventosActivos.update(eventos => eventos.filter(e => e.id !== id));
      }); // 2000ms debe coincidir con la duración de la animación CSS
    }

    // Registrar el evento en el servicio de tracking
    // Usar IDs generados si no se proporcionan explícitamente
    const fotocelulaId = this.fotocelulaId || this.nombreFotocelula;

    //this.trackingService.registrarEvento(
    //  fotocelulaId,
    //  this.nombreFotocelula,
    //  tipo
    //);
  }
}
