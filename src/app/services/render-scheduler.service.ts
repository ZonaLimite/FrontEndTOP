import { Injectable, NgZone, inject } from '@angular/core';

/**
 * Agrupa cambios de estado visual para aplicarlos una vez por frame.
 *
 * Con tráfico alto de eventos, cada callback asíncrono dentro de la zona de
 * Angular (mensaje de socket, setTimeout...) dispara un ciclo de detección de
 * cambios completo. Este servicio recibe esos cambios fuera de la zona, los
 * encola y los ejecuta todos juntos dentro de ngZone.run() en el siguiente
 * frame → un único ciclo de detección de cambios por lote.
 */
@Injectable({ providedIn: 'root' })
export class RenderSchedulerService {

  private ngZone = inject(NgZone);

  private pendientes: (() => void)[] = [];
  private flushProgramado = false;

  /**
   * Encola un cambio para aplicarlo en el próximo frame.
   * Puede llamarse tanto dentro como fuera de la zona de Angular.
   *
   * Se programa también un timeout de respaldo porque requestAnimationFrame
   * no se ejecuta con la pestaña en segundo plano.
   */
  programar(tarea: () => void): void {
    this.pendientes.push(tarea);
    if (this.flushProgramado) return;
    this.flushProgramado = true;

    this.ngZone.runOutsideAngular(() => {
      const rafId = requestAnimationFrame(() => {
        clearTimeout(timeoutId);
        this.flush();
      });
      const timeoutId = setTimeout(() => {
        cancelAnimationFrame(rafId);
        this.flush();
      }, 250);
    });
  }

  /**
   * Ejecuta la tarea pasados `ms` milisegundos. El timer corre fuera de la
   * zona (no dispara detección de cambios) y la tarea se aplica en el lote
   * del siguiente frame.
   */
  despues(ms: number, tarea: () => void): void {
    this.ngZone.runOutsideAngular(() =>
      setTimeout(() => this.programar(tarea), ms)
    );
  }

  /**
   * Ejecuta todas las tareas encoladas dentro de la zona de Angular.
   * Las tareas que se programen durante el flush van al siguiente frame.
   */
  private flush(): void {
    this.flushProgramado = false;
    const tareas = this.pendientes;
    this.pendientes = [];
    this.ngZone.run(() => tareas.forEach(tarea => {
      try {
        tarea();
      } catch (e) {
        console.error('[RenderScheduler] Error ejecutando tarea:', e);
      }
    }));
  }
}
