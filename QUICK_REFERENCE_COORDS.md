# Quick Reference: Uso Rápido de Coordenadas

## Activar Modo Coordenadas

```typescript
// En tu componente
import { ModuloLineaCoordsConfig, ModuloCoordsConfig } from './models/modulo-transporte.model';

export class MiComponente {
  modoCoords = true;
  modulosCoordsConfig: ModuloLineaCoordsConfig[] = [];

  constructor() {
    this.crearModulos();
  }

  crearModulos() {
    // Crear 3 módulos en línea horizontal
    const modulo1 = this.crearModulo('mod1', 'Entrada', 300, 200);
    const modulo2 = this.crearModulo('mod2', 'Centro', 300, 200);
    const modulo3 = this.crearModulo('mod3', 'Salida', 300, 200);

    this.modulosCoordsConfig = [
      { config: modulo1, x: 15, y: 50 },   // 15% desde la izquierda, 50% desde arriba
      { config: modulo2, x: 50, y: 50 },   // Centro
      { config: modulo3, x: 85, y: 50 }    // 85% desde la izquierda
    ];
  }

  crearModulo(id: string, nombre: string, ancho: number, alto: number) {
    return {
      id,
      nombre,
      ancho,
      alto,
      fotocelulas: [
        { id: `${id}-fc1`, nombre: 'FC1', x: 30, y: 50, tamano: 'normal' },
        { id: `${id}-fc2`, nombre: 'FC2', x: 70, y: 50, tamano: 'normal' }
      ],
      orientacion: 'horizontal'
    };
  }
}
```

## Template

```html
<app-linea-transporte
  [modoCoords]="true"
  [modulosCoordsConfig]="modulosCoordsConfig"
  [anchoLinea]="1000"
  [altoLinea]="400"
  [titulo]="'Mi Línea de Transporte'">
</app-linea-transporte>
```

## Patrones de Posicionamiento Comunes

### 1️⃣ Línea Horizontal
```typescript
modulos.forEach((mod, idx, arr) => {
  const x = (idx + 1) * (100 / (arr.length + 1)); // Distribuir uniformemente
  const y = 50;
  // { config: mod, x, y }
});
```

### 2️⃣ Línea Diagonal
```typescript
modulos.forEach((mod, idx) => {
  const x = 10 + idx * 20;  // 10%, 30%, 50%, ...
  const y = 10 + idx * 20;  // Misma proporción
  // { config: mod, x, y }
});
```

### 3️⃣ Línea Circular
```typescript
const numModulos = modulos.length;
const radio = 30;           // Radio en porcentaje
const centroX = 50, centroY = 50;

modulos.forEach((mod, idx) => {
  const angulo = (idx / numModulos) * 2 * Math.PI;
  const x = centroX + radio * Math.cos(angulo);
  const y = centroY + radio * Math.sin(angulo);
  // { config: mod, x, y }
});
```

### 4️⃣ Grid 3x3
```typescript
let idx = 0;
for (let fila = 0; fila < 3; fila++) {
  for (let col = 0; col < 3; col++) {
    const x = 10 + col * 40;   // 10%, 50%, 90%
    const y = 10 + fila * 40;  // 10%, 50%, 90%
    // { config: modulos[idx], x, y }
    idx++;
  }
}
```

### 5️⃣ Grelación Aleatoria
```typescript
modulos.forEach(mod => {
  const x = Math.random() * 80 + 10;  // 10% a 90%
  const y = Math.random() * 80 + 10;
  // { config: mod, x, y }
});
```

## Métodos Útiles

### En LineaTransporteComponent
```typescript
// Simular evento en módulo específico
this.linea.simularEventoEnModulo('modulo-id', 'fotocelula-id', 'atiempo');

// Simular flujo completo
this.linea.simularFlujoCompleto(500);  // 500ms entre eventos

// Verificar modo
this.linea.isModoCoordenadas();  // true/false
```

### En ModuloTransporteCoordsComponent
```typescript
// Acceder al módulo via @ViewChild
@ViewChild('myModule') modulo!: ModuloTransporteCoordsComponent;

// Simular evento
this.modulo.simularEvento('fc-id', 'retraso');

// Simular múltiples eventos
this.modulo.simularEventosMultiples(['fc1', 'fc2', 'fc3'], 'atiempo');

// Obtener información
const info = this.modulo.getInfo();
console.log(info);  // { id, nombre, ancho, alto, totalFotocelulas, fotocelulas[] }

// Cambiar estado de fotocélula
this.modulo.setOcultado('fc-id', true);
```

## Cambiar Modo en Tiempo Real

```typescript
export class MiComponente {
  @ViewChild('linea') linea!: LineaTransporteComponent;

  modoCoords = false;
  modulosLineal = [...];
  modulosCoordenados = [...];

  toggleModo() {
    this.modoCoords = !this.modoCoords;
    // El componente se actualiza automáticamente
  }

  convertirACoords() {
    // Convertir lista lineal a coordenadas
    this.modulosCoordenados = this.modulosLineal.map((mod, idx, arr) => ({
      config: mod,
      x: (idx + 1) * (100 / (arr.length + 1)),
      y: 50
    }));
    this.modoCoords = true;
  }
}
```

## Ejemplo Mínimo

```typescript
import { Component } from '@angular/core';
import { ModuloLineaCoordsConfig } from './models/modulo-transporte.model';

@Component({
  selector: 'app-test',
  template: `
    <app-linea-transporte
      [modoCoords]="true"
      [modulosCoordsConfig]="modulos"
      [anchoLinea]="800"
      [altoLinea]="400">
    </app-linea-transporte>
  `
})
export class TestComponent {
  modulos: ModuloLineaCoordsConfig[] = [
    {
      config: {
        id: 'mod1',
        nombre: 'Módulo 1',
        ancho: 250,
        alto: 150,
        fotocelulas: [
          { id: 'fc1', nombre: 'FC1', x: 50, y: 50 }
        ]
      },
      x: 25, y: 50
    },
    {
      config: {
        id: 'mod2',
        nombre: 'Módulo 2',
        ancho: 250,
        alto: 150,
        fotocelulas: [
          { id: 'fc2', nombre: 'FC2', x: 50, y: 50 }
        ]
      },
      x: 75, y: 50
    }
  ];
}
```

## Tips & Tricks 💡

### Centrar módulos en sus coordenadas
```typescript
// El componente automáticamente centra los módulos:
// transform: 'translate(-50%, -50%)'
// Esto significa que x=50, y=50 pone el módulo en el centro exacto
```

### Debugging visual
```html
<!-- El grid de fondo y marcadores de posición son visibles automáticamente -->
<!-- Pasa el cursor sobre los módulos para ver coordenadas exactas -->
```

### Limites de coordenadas
```typescript
// Coordenadas en porcentaje: 0-100
// 0 = arriba/izquierda
// 100 = abajo/derecha
// 50 = centro
```

### Tamaño de módulos
```typescript
// Los módulos mantienen su tamaño en píxeles
// Independiente del tamaño de la línea
// Asegúrate que el contenedor sea suficientemente grande
```

### Responsive
```typescript
// Para que sea responsive, calcula dinámicamente el tamaño:
@HostListener('window:resize')
onResize() {
  this.update();  // Recalcular posiciones si es necesario
}
```

## Troubleshooting

**P: Los módulos se sobreponen**
- Ajusta las coordenadas x, y para mayor separación

**P: Los módulos no se ven**
- Verifica que `modoCoords=true`
- Verifica que `anchoLinea` y `altoLinea` sean suficientes

**P: Las fotocélulas no se renderizan**
- Asegúrate que cada módulo tiene `fotocelulas` array poblado
- Verifica la estructura de `FotocelulaCoordsConfig`

**P: ¿Cómo mezclo módulos Grid con Coords?**
- El campo `config` acepta cualquiera de los dos tipos
- El componente detecta automáticamente el tipo

---

**Necesitas más ayuda?** Ver [GUIA_REFACTORIZACION_COORDS.md](GUIA_REFACTORIZACION_COORDS.md) para documentación completa.
