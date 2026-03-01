# Guía de Refactorización: Configuración de Situación por Coordenadas

## Resumen de Cambios

Se ha refactorizado `linea-transporte.component` y `modulo-transporte-coords.component` para soportar **posicionamiento por coordenadas absolutas** a nivel de línea de transporte, permitiendo una configuración más versátil y programática similar a cómo las fotocélulas ya funcionan.

---

## Nuevos Modelos de Datos

### 1. `ModuloLineaCoordsConfig`
Representa un módulo con su posición dentro de la línea:

```typescript
export interface ModuloLineaCoordsConfig {
  config: ModuloGridConfig | ModuloCoordsConfig;  // Config del módulo
  x: number;              // Posición X en porcentaje (0-100)
  y: number;              // Posición Y en porcentaje (0-100)
}
```

### 2. `LineaTransporteCoordsConfig`
Configuración específica para modo de coordenadas:

```typescript
export interface LineaTransporteCoordsConfig {
  id: string;
  nombre: string;
  ancho: number;          // Ancho total en píxeles
  alto: number;           // Alto total en píxeles
  modulos: ModuloLineaCoordsConfig[];
}
```

### 3. `LineaTransporteLinealConfig`
Configuración para modo lineal (legacy/flexbox):

```typescript
export interface LineaTransporteLinealConfig {
  id: string;
  nombre: string;
  modulos: (ModuloGridConfig | ModuloCoordsConfig)[];
  direccion: 'horizontal' | 'vertical';
  gap?: number;
}
```

---

## LineaTransporteComponent: Nuevos Inputs

### Modo Lineal (Flexbox - Heredado)
```typescript
@Input() modulosGrid: ModuloGridConfig[] = [];
@Input() modulosCoords: ModuloCoordsConfig[] = [];
@Input() direccion: 'horizontal' | 'vertical' = 'horizontal';
@Input() gap: number = 20;
@Input() titulo: string = 'Línea de Transporte';
```

### Modo Coordenadas (Nuevo)
```typescript
@Input() modoCoords: boolean = false;                    // Activar modo coordenadas
@Input() modulosCoordsConfig: ModuloLineaCoordsConfig[] = [];
@Input() anchoLinea: number = 800;                      // Ancho total en píxeles
@Input() altoLinea: number = 400;                       // Alto total en píxeles
```

---

## Ejemplos de Uso

### Ejemplo 1: Modo Lineal (Flexbox - Tradicional)

```typescript
// En el componente padre
export class MyComponent {
  modulosGrid: ModuloGridConfig[] = [
    {
      id: 'modulo1',
      nombre: 'Módulo 1',
      gridRows: 2,
      gridColumns: 3,
      fotocelulas: [...]
    }
  ];

  modulosCoords: ModuloCoordsConfig[] = [
    {
      id: 'modulo2',
      nombre: 'Módulo 2',
      ancho: 300,
      alto: 200,
      fotocelulas: [...]
    }
  ];
}
```

```html
<!-- Template -->
<app-linea-transporte
  [modulosGrid]="modulosGrid"
  [modulosCoords]="modulosCoords"
  [direccion]="'horizontal'"
  [gap]="20"
  [titulo]="'Mi Línea de Transporte'">
</app-linea-transporte>
```

### Ejemplo 2: Modo Coordenadas (Nuevo)

```typescript
// En el componente padre
export class MyComponent {
  modulosCoordsConfig: ModuloLineaCoordsConfig[] = [
    {
      config: {
        id: 'modulo1',
        nombre: 'Módulo Entrada',
        ancho: 300,
        alto: 200,
        fotocelulas: [
          { id: 'fc1', nombre: 'FC1', x: 30, y: 50, tamano: 'normal' },
          { id: 'fc2', nombre: 'FC2', x: 70, y: 50, tamano: 'normal' }
        ]
      },
      x: 15,   // Posición X dentro de la línea (%)
      y: 20    // Posición Y dentro de la línea (%)
    },
    {
      config: {
        id: 'modulo2',
        nombre: 'Módulo Central',
        ancho: 250,
        alto: 180,
        fotocelulas: [
          { id: 'fc3', nombre: 'FC3', x: 50, y: 50, tamano: 'normal' }
        ]
      },
      x: 50,
      y: 25
    },
    {
      config: {
        id: 'modulo3',
        nombre: 'Módulo Salida',
        ancho: 300,
        alto: 200,
        fotocelulas: [
          { id: 'fc4', nombre: 'FC4', x: 30, y: 50, tamano: 'normal' },
          { id: 'fc5', nombre: 'FC5', x: 70, y: 50, tamano: 'normal' }
        ]
      },
      x: 85,
      y: 20
    }
  ];
}
```

```html
<!-- Template -->
<app-linea-transporte
  [modoCoords]="true"
  [modulosCoordsConfig]="modulosCoordsConfig"
  [anchoLinea]="1000"
  [altoLinea]="500"
  [titulo]="'Línea Configurada por Coordenadas'">
</app-linea-transporte>
```

---

## Métodos Disponibles en LineaTransporteComponent

### Métodos de Utilidad
```typescript
// Determinar el modo actual
isModoCoordenadas(): boolean

// Obtener estilos (ambos modos)
getLineaStyleLineal(): any      // Modo flexbox
getLineaStyleCoords(): any      // Modo coordenadas
getModuloStyleCoords(moduloCoords: ModuloLineaCoordsConfig): any

// Obtener configuración
getModuloConfig(moduloCoords: ModuloLineaCoordsConfig): any
```

### Métodos de Interacción
```typescript
// Simular eventos en fotocélulas
public simularEventoEnModulo(
  moduloId: string,
  fotocelulaId: string,
  tipo: 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
)

// Simular flujo completo
simularFlujoCompleto(retardoMs: number = 1000)
```

---

## Mejoras en ModuloTransporteCoordsComponent

Se han añadido nuevos métodos para mayor versatilidad:

```typescript
// Obtener información del módulo
getNombreModulo(): string
getIdModulo(): string
getInfo(): {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  totalFotocelulas: number;
  fotocelulas: Array<{id, nombre, coordenadas}>
}

// Simular eventos
simularEvento(fotocelulaId: string, tipo: TipoEvento)
simularEventosMultiples(fotocelulaIds: string[], tipo: TipoEvento)

// Gestionar fotocélulas
getFotocelula(fotocelulaId: string): FotocelulaComponent | undefined
getFotocelulaConfig(fotocelulaId: string): FotocelulaCoordsConfig | undefined
getAllFotocelulas(): FotocelulaComponent[]
setOcultado(fotocelulaId: string, ocultado: boolean)
```

---

## Ventajas de la Refactorización

### 1. **Posicionamiento Flexible**
- Módulos pueden posicionarse en cualquier punto del espacio
- NO limitado a disposiciones lineales (fila/columna)
- Permite diseños más creativos y específicos

### 2. **Configuración Programática**
- Fácil de calcular posiciones dinámicamente
- Ideal para simulaciones y demostraciones
- Compatible con algoritmos de layout automático

### 3. **Backward Compatibility**
- Modo lineal sigue funcionando igual
- No requiere cambios en código existente
- Ambos modos pueden coexistir en la misma aplicación

### 4. **Mejor Debugging**
- Marcadores visuales de posición en modo coordenadas
- Información detallada disponible mediante métodos getter
- Grid de fondo opcional para referencia

---

## Consideraciones de Rendimiento

- **Modo Lineal**: Usa `flex` (muy eficiente)
- **Modo Coordenadas**: Usa posicionamiento absoluto (relativa eficiencia similar)

Para aplicaciones con 50+ módulos, considera:
- Virtualización (renderizar solo módulos visibles)
- Optimizar change detection con `OnPush`

---

## Ejemplo Completo: Dashboard de Simulación

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h1>Control de Línea de Transporte</h1>
      
      <app-linea-transporte
        [modoCoords]="true"
        [modulosCoordsConfig]="modulosSimulacion"
        [anchoLinea]="1200"
        [altoLinea]="600"
        [titulo]="'Línea de Simulación Dinámica'">
      </app-linea-transporte>

      <div class="controles">
        <button (click)="agregarModulo()">Añadir Módulo</button>
        <button (click)="reconfigurar()">Reconfigurar Posiciones</button>
      </div>
    </div>
  `
})
export class DashboardComponent {
  modulosSimulacion: ModuloLineaCoordsConfig[] = [];

  constructor() {
    this.inicializarModulos();
  }

  inicializarModulos() {
    // Crear módulos con posiciones calculadas
    for (let i = 0; i < 5; i++) {
      this.modulosSimulacion.push({
        config: {
          id: `modulo-${i}`,
          nombre: `Módulo ${i + 1}`,
          ancho: 250,
          alto: 150,
          fotocelulas: this.generarFotocelulas(3)
        },
        x: (i + 1) * 16,  // 16%, 32%, 48%, 64%, 80%
        y: 50
      });
    }
  }

  agregarModulo() {
    // Lógica para añadir módulos dinámicamente
    const nuevoId = `modulo-${this.modulosSimulacion.length}`;
    this.modulosSimulacion.push({
      config: {
        id: nuevoId,
        nombre: `Módulo Nuevo`,
        ancho: 250,
        alto: 150,
        fotocelulas: this.generarFotocelulas(2)
      },
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    });
  }

  reconfigurar() {
    // Reorganizar módulos en círculo, diagonal, etc.
    this.modulosSimulacion.forEach((mod, index) => {
      const angulo = (index / this.modulosSimulacion.length) * 2 * Math.PI;
      const radio = 35;
      mod.x = 50 + radio * Math.cos(angulo);
      mod.y = 50 + radio * Math.sin(angulo);
    });
  }

  private generarFotocelulas(cantidad: number): FotocelulaCoordsConfig[] {
    const fotocelulas: FotocelulaCoordsConfig[] = [];
    for (let i = 0; i < cantidad; i++) {
      fotocelulas.push({
        id: `fc-${i}`,
        nombre: `FC${i + 1}`,
        x: (i + 1) * (100 / (cantidad + 1)),
        y: 50,
        tamano: 'normal'
      });
    }
    return fotocelulas;
  }
}
```

---

## Migración desde Modo Lineal a Modo Coordenadas

### Paso 1: Actualizar Template
```html
<!-- ANTES -->
<app-linea-transporte
  [modulosGrid]="modulosGrid"
  [modulosCoords]="modulosCoords"
  [direccion]="'horizontal'"
  [gap]="20">
</app-linea-transporte>

<!-- DESPUÉS -->
<app-linea-transporte
  [modoCoords]="true"
  [modulosCoordsConfig]="modulosConCoordenadas"
  [anchoLinea]="1000"
  [altoLinea]="500">
</app-linea-transporte>
```

### Paso 2: Transformar Configuración
```typescript
// Función helper para migrar
transformarAModulosCoordenados(
  modulos: (ModuloGridConfig | ModuloCoordsConfig)[]
): ModuloLineaCoordsConfig[] {
  return modulos.map((config, index) => ({
    config,
    x: (index + 1) * (100 / (modulos.length + 1)),
    y: 50
  }));
}

// Uso
this.modulosConCoordenadas = this.transformarAModulosCoordenados(
  [...this.modulosGrid, ...this.modulosCoords]
);
```

---

## Preguntas Frecuentes

**P: ¿Puedo mezclar modo lineal y modo coordenadas?**
A: No, selecciona uno u otro. Usa `modoCoords: true` para coordenadas, `false` para lineal.

**P: ¿Cómo posiciono módulos en una cuadrícula?**
A: Calcula posiciones uniformes:
```typescript
x = (columna + 1) * (100 / (cols + 1))
y = (fila + 1) * (100 / (filas + 1))
```

**P: ¿El rendimiento se degrada con muchos módulos?**
A: Hasta ~100 módulos debería funcionar bien. Para más, considera virtualización.

**P: ¿Puedo animar el cambio de posiciones?**
A: Sí, usa transiciones CSS en `.modulo-wrapper` o aplica Angular animations.

---

## Recursos

- Modelos: [modulo-transporte.model.ts](src/app/models/modulo-transporte.model.ts)
- Componente: [linea-transporte.component.ts](src/app/components/linea-transporte/)
- Módulo: [modulo-transporte-coords.component.ts](src/app/components/modulo-transporte-coords/)
