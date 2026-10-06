import { Component, ChangeDetectionStrategy, Input, inject } from '@angular/core';
import { RechazoReciente } from '../../models/modulo-transporte.model';
import { RechazosEstadoService } from '../../services/rechazos-estado.service';


/**
 * Lista de los últimos rechazos de la línea, sobre los módulos de culling (CUL-n).
 *
 * Componente propio (OnPush + Signals) para que cada rechazo solo repinte
 * la lista, sin revisar la plantilla del módulo que la contiene.
 */
@Component({
  selector: 'app-lista-rechazos',
  standalone: false,
  templateUrl: './lista-rechazos.component.html',
  styleUrls: ['./lista-rechazos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListaRechazosComponent {

  /** Rechazos visibles (los más recientes) */
  @Input() items = 3;

  /** Últimos rechazos de la línea, del más antiguo al más reciente */
  readonly ultimos = inject(RechazosEstadoService).ultimos;

  trackByRechazo(index: number, rechazo: RechazoReciente): number {
    return rechazo.id;
  }
}
