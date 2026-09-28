# Feature: etiqueta de espesor en módulos FED-n

**Estado (2026-09-28):** diseño propuesto, **sin implementar**. Pendiente de responder las preguntas del final.

## Objetivo

Mostrar dentro de cada módulo de tipo feeder (`FED-01`, `FED-02`… en
`src/app/pages/demo-modulos/demo-modulos.component.ts`) una pequeña etiqueta con el
**espesor medido de la carta alimentada en ese feeder**. Una sola etiqueta por módulo FED,
que se actualiza con cada carta.

Componentes implicados:

- `linea-transporte` → renderiza `app-modulo-transporte-coords` por cada módulo.
- `modulo-transporte-coords` → usa `ChangeDetectionStrategy.OnPush`.
- Modelo: `src/app/models/modulo-transporte.model.ts`.

## Diseño propuesto

### 1. Modelo

Separar lo fijo (posición, formato) de lo dinámico (medición):

```ts
/** Posición y formato de la etiqueta de espesor (fijo, en la config del módulo) */
export interface EtiquetaEspesorConfig {
  x: number;              // % dentro del módulo, como las fotocélulas
  y: number;
  decimales?: number;     // por defecto 2
  unidad?: string;        // por defecto 'mm'
}

/** Última medición recibida para un feeder (dinámico, llega por WS) */
export interface MedidaEspesor {
  valor: number;
  timestamp: number;
  estado?: 'ok' | 'fuera-rango' | 'sin-lectura';
}

export interface ModuloCoordsConfig {
  // ...campos actuales
  etiquetaEspesor?: EtiquetaEspesorConfig;   // solo módulos FED-n
}
```

- La plantilla **no** comprueba el prefijo `"FED-"`: solo los FED declaran `etiquetaEspesor` en su config.
- Al ser un campo opcional y único, garantiza como mucho una etiqueta por módulo.

Ejemplo en la config de demo:

```ts
{
  id: 'FED-01', nombre: 'Feeder1', ancho: 80, alto: 120, orientacion: 'vertical',
  fotocelulas: [ { id: 'FE1', nombre: 'FE1', x: 50, y: 37, tamano: 'pequeno', orientacion: 'row' } ],
  etiquetaEspesor: { x: 50, y: 80 }   // debajo de la fotocélula
}
```

### 2. Servicio con signals

`EspesorFeederService` (`providedIn: 'root'`) guarda un `signal<Record<string, MedidaEspesor>>`
indexado por id de módulo. Lo alimenta el servicio WebSocket existente (igual que el tracking).
Cada módulo lee solo su entrada con un `computed(() => valores()[config.id])`.

Los signals leídos en plantilla re-renderizan con `OnPush` sin necesidad de `markForCheck`.

### 3. Plantilla y CSS

Dentro de `.modulo-fotocelulas`, tras el `*ngFor` de fotocélulas:

```html
<div *ngIf="config.etiquetaEspesor as et" class="modulo-etiqueta"
     [class.fuera-rango]="medida()?.estado === 'fuera-rango'"
     [class.sin-lectura]="!medida()"
     [style.left.%]="et.x" [style.top.%]="et.y">
  <!-- valor formateado con et.decimales y et.unidad, o '— mm' si no hay lectura -->
</div>
```

```css
.modulo-etiqueta {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 5;                 /* por debajo de las fotocélulas (z-index 10) */
  max-width: 90%;
  padding: 1px 6px;
  font: 600 9px 'Segoe UI', sans-serif;
  color: #e0e0e0;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #555;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;    /* el módulo FED solo tiene 80px de ancho */
  pointer-events: none;
}
```

- Color por estado: normal si `ok`, rojo si `fuera-rango`, atenuado si no hay lectura.
- Opcional: breve destello al recibir un valor nuevo, para que se note que la lectura está viva.

## Preguntas pendientes

1. **Origen del dato:** ¿llega en los mensajes WebSocket existentes? ¿Qué campo, y cómo se
   identifica el feeder (`FED-01`, `FE1`, número de feeder…)?
2. **Unidad y precisión:** ¿mm? ¿cuántos decimales?
3. **Rango válido:** ¿hay mínimo/máximo? ¿Lo calcula el backend (envía `estado`) o se definen
   umbrales en el front?
4. **Persistencia:** ¿se mantiene la última medida hasta la siguiente, o se limpia por timeout /
   al salir la carta del feeder?
