# 📦 Sistema de Módulos de Transporte - Guía Completa

## 📋 Índice
1. [Introducción](#introducción)
2. [Componentes Creados](#componentes-creados)
3. [Patrón 1: CSS Grid](#patrón-1-css-grid)
4. [Patrón 2: Coordenadas](#patrón-2-coordenadas)
5. [Ensamblaje de Módulos](#ensamblaje-de-módulos)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [API de Componentes](#api-de-componentes)
8. [Integración con WebSocket](#integración-con-websocket)

---

## 🎯 Introducción

Se han implementado **dos patrones arquitectónicos** para distribuir fotocélulas en módulos de transporte:

### ✅ **Patrón 1: CSS Grid**
- Distribución estructurada usando filas y columnas
- Ideal para layouts predecibles
- Alineación automática
- Responsive por defecto

### ✅ **Patrón 2: Coordenadas Absolutas**
- Posicionamiento libre usando X/Y en porcentaje
- Máxima flexibilidad
- Ideal para distribuciones irregulares
- Perfecto para simulaciones físicas

---

## 🏗️ Componentes Creados

### 1. **ModuloTransporteGridComponent**
📁 `src/app/components/modulo-transporte-grid/`

Componente que usa CSS Grid para distribuir fotocélulas.

**Archivos:**
- `modulo-transporte-grid.component.ts`
- `modulo-transporte-grid.component.html`
- `modulo-transporte-grid.component.css`

### 2. **ModuloTransporteCoordsComponent**
📁 `src/app/components/modulo-transporte-coords/`

Componente que usa coordenadas absolutas para distribuir fotocélulas.

**Archivos:**
- `modulo-transporte-coords.component.ts`
- `modulo-transporte-coords.component.html`
- `modulo-transporte-coords.component.css`

### 3. **LineaTransporteComponent**
📁 `src/app/components/linea-transporte/`

Componente ensamblador que conecta múltiples módulos (Grid o Coords).

**Archivos:**
- `linea-transporte.component.ts`
- `linea-transporte.component.html`
- `linea-transporte.component.css`

### 4. **DemoModulosComponent**
📁 `src/app/pages/demo-modulos/`

Página de demostración con ejemplos completos.

**Archivos:**
- `demo-modulos.component.ts`
- `demo-modulos.component.html`
- `demo-modulos.component.css`

### 5. **Modelos de Datos**
📁 `src/app/models/modulo-transporte.model.ts`

Interfaces TypeScript para configurar módulos.

---

## 🔷 Patrón 1: CSS Grid

### Configuración

```typescript
const moduloGrid: ModuloGridConfig = {
  id: 'MOD-GRID-01',
  nombre: 'Módulo Entrada',
  gridRows: 2,          // Número de filas
  gridColumns: 3,       // Número de columnas
  ancho: '400px',       // Ancho del módulo
  alto: '200px',        // Alto del módulo
  orientacion: 'horizontal',
  fotocelulas: [
    {
      id: 'FC-01',
      nombre: 'FC-Entrada-1',
      gridRow: 1,         // Fila (1-based)
      gridColumn: 1,      // Columna (1-based)
      tamano: 'normal'    // 'pequeno' | 'normal' | 'mediano' | 'grande'
    },
    {
      id: 'FC-02',
      nombre: 'FC-Entrada-2',
      gridRow: 1,
      gridColumn: 2,
      tamano: 'normal'
    },
    {
      id: 'FC-03',
      nombre: 'FC-Entrada-3',
      gridRow: 2,
      gridColumn: 2,
      tamano: 'normal'
    }
  ]
};
```

### Uso en Template

```html
<app-modulo-transporte-grid [config]="moduloGrid"></app-modulo-transporte-grid>
```

### ✅ Ventajas
- Alineación automática de fotocélulas
- Fácil mantenimiento
- Responsive sin esfuerzo
- Ideal para distribuciones regulares

### ⚠️ Limitaciones
- Menos flexibilidad para posiciones irregulares
- Requiere pensar en términos de filas/columnas

---

## 🔶 Patrón 2: Coordenadas

### Configuración

```typescript
const moduloCoords: ModuloCoordsConfig = {
  id: 'MOD-COORDS-01',
  nombre: 'Módulo Salida',
  ancho: 400,           // Ancho en píxeles
  alto: 200,            // Alto en píxeles
  orientacion: 'horizontal',
  fotocelulas: [
    {
      id: 'FC-08',
      nombre: 'FC-Salida-1',
      x: 20,              // Posición X en % (0-100)
      y: 30,              // Posición Y en % (0-100)
      tamano: 'normal'
    },
    {
      id: 'FC-09',
      nombre: 'FC-Salida-2',
      x: 50,
      y: 50,
      tamano: 'mediano'
    },
    {
      id: 'FC-10',
      nombre: 'FC-Salida-3',
      x: 80,
      y: 70,
      tamano: 'normal'
    }
  ]
};
```

### Uso en Template

```html
<app-modulo-transporte-coords [config]="moduloCoords"></app-modulo-transporte-coords>
```

### ✅ Ventajas
- Posicionamiento pixel-perfect
- Ideal para simulaciones físicas
- Máxima flexibilidad
- Perfecto para layouts irregulares

### ⚠️ Limitaciones
- Requiere cálculo manual de coordenadas
- Menos "responsive" automático

---

## 🔗 Ensamblaje de Módulos

### Configuración de Línea de Transporte

```typescript
// En tu componente TypeScript
export class MiComponente {
  modulosGrid: ModuloGridConfig[] = [/* ... */];
  modulosCoords: ModuloCoordsConfig[] = [/* ... */];
}
```

### Uso en Template

```html
<app-linea-transporte
  [modulosGrid]="modulosGrid"
  [modulosCoords]="modulosCoords"
  [direccion]="'horizontal'"
  [gap]="30"
  [titulo]="'Línea Principal de Transporte'">
</app-linea-transporte>
```

### Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `modulosGrid` | `ModuloGridConfig[]` | Array de módulos tipo Grid |
| `modulosCoords` | `ModuloCoordsConfig[]` | Array de módulos tipo Coords |
| `direccion` | `'horizontal' \| 'vertical'` | Dirección de ensamblaje |
| `gap` | `number` | Espaciado entre módulos (px) |
| `titulo` | `string` | Título de la línea |

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Línea con 3 Módulos Grid

```typescript
export class EjemploComponent {
  modulosGrid: ModuloGridConfig[] = [
    {
      id: 'MOD-01',
      nombre: 'Entrada',
      gridRows: 2,
      gridColumns: 2,
      ancho: '300px',
      alto: '150px',
      fotocelulas: [
        { id: 'FC-01', nombre: 'FC-1', gridRow: 1, gridColumn: 1 },
        { id: 'FC-02', nombre: 'FC-2', gridRow: 2, gridColumn: 2 }
      ]
    },
    {
      id: 'MOD-02',
      nombre: 'Proceso',
      gridRows: 3,
      gridColumns: 2,
      ancho: '350px',
      alto: '180px',
      fotocelulas: [
        { id: 'FC-03', nombre: 'FC-3', gridRow: 1, gridColumn: 1 },
        { id: 'FC-04', nombre: 'FC-4', gridRow: 2, gridColumn: 1 },
        { id: 'FC-05', nombre: 'FC-5', gridRow: 2, gridColumn: 2 }
      ]
    },
    {
      id: 'MOD-03',
      nombre: 'Salida',
      gridRows: 2,
      gridColumns: 2,
      ancho: '300px',
      alto: '150px',
      fotocelulas: [
        { id: 'FC-06', nombre: 'FC-6', gridRow: 1, gridColumn: 2 }
      ]
    }
  ];
}
```

### Ejemplo 2: Línea Mixta (Grid + Coords)

```typescript
export class EjemploMixtoComponent {
  modulosGrid: ModuloGridConfig[] = [
    {
      id: 'MOD-G1',
      nombre: 'Entrada Grid',
      gridRows: 2,
      gridColumns: 2,
      ancho: '300px',
      alto: '150px',
      fotocelulas: [
        { id: 'FC-01', nombre: 'FC-1', gridRow: 1, gridColumn: 1 },
        { id: 'FC-02', nombre: 'FC-2', gridRow: 2, gridColumn: 2 }
      ]
    }
  ];

  modulosCoords: ModuloCoordsConfig[] = [
    {
      id: 'MOD-C1',
      nombre: 'Salida Coords',
      ancho: 400,
      alto: 200,
      fotocelulas: [
        { id: 'FC-03', nombre: 'FC-3', x: 25, y: 40 },
        { id: 'FC-04', nombre: 'FC-4', x: 75, y: 60 }
      ]
    }
  ];
}
```

---

## 🔧 API de Componentes

### ModuloTransporteGridComponent

#### Métodos Públicos

```typescript
// Simular evento en una fotocélula
simularEvento(
  fotocelulaId: string, 
  tipo: 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion'
): void

// Cambiar estado de ocultación
setOcultado(fotocelulaId: string, ocultado: boolean): void

// Obtener referencia a fotocélula
getFotocelula(fotocelulaId: string): FotocelulaComponent | undefined
```

### ModuloTransporteCoordsComponent

#### Métodos Públicos
(Mismos métodos que ModuloTransporteGridComponent)

### LineaTransporteComponent

#### Métodos Públicos

```typescript
// Simular evento en fotocélula de un módulo específico
simularEventoEnModulo(
  moduloId: string,
  fotocelulaId: string,
  tipo: TipoEvento
): void

// Simular flujo completo de envíos
simularFlujoCompleto(retardoMs: number = 1000): void
```

---

## 🌐 Integración con WebSocket

### Ejemplo de Integración con RemotengineComponent

```typescript
import { Component, ViewChild } from '@angular/core';
import { LineaTransporteComponent } from './components/linea-transporte/linea-transporte.component';

export class MiComponente {
  @ViewChild(LineaTransporteComponent) lineaTransporte!: LineaTransporteComponent;

  // Cuando llega un evento por WebSocket
  handleTracesEvent(eventTrace: Traces) {
    // Parse del evento
    const evento = JSON.parse(eventTrace.data);
    
    // Simular en la línea de transporte
    this.lineaTransporte.simularEventoEnModulo(
      evento.moduloId,
      evento.fotocelulaId,
      evento.tipo
    );
  }
}
```

### Ejemplo con SockJS/STOMP

```typescript
this.client.subscribe('/channel/tracking', e => {
  const trackingEvent = JSON.parse(e.body);
  
  // Determinar tipo de evento basado en el tracking
  let tipoEvento: TipoEvento = 'atiempo';
  
  if (trackingEvent.adelanto > 100) {
    tipoEvento = 'adelanto';
  } else if (trackingEvent.retraso > 100) {
    tipoEvento = 'retraso';
  } else if (trackingEvent.esAparicion) {
    tipoEvento = 'apparition';
  }
  
  // Activar evento en el módulo correspondiente
  this.lineaTransporte.simularEventoEnModulo(
    trackingEvent.moduloId,
    trackingEvent.fotocelulaId,
    tipoEvento
  );
});
```

---

## 🎨 Ver la Demostración

Para ver todos los ejemplos en acción, navega a:

```
http://localhost:4200/demo-modulos
```

O usa el enlace del sidebar (si lo agregaste):

```html
<a routerLink="/demo-modulos">Demo Módulos</a>
```

---

## 📊 Comparativa de Patrones

| Característica | CSS Grid | Coordenadas |
|----------------|----------|-------------|
| **Facilidad de uso** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Flexibilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Responsive** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Precisión** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mantenimiento** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Simulaciones** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Próximos Pasos Recomendados

1. **Integrar con tu WebSocket existente** en RemotengineComponent
2. **Crear configuraciones** basadas en tus módulos reales
3. **Agregar persistencia** de configuraciones (JSON o BD)
4. **Implementar animación de envíos** entre fotocélulas
5. **Dashboard de estadísticas** de eventos por módulo

---

## 📞 Soporte

Si necesitas ayuda o tienes preguntas sobre:
- Cómo configurar módulos específicos
- Integración con tu sistema actual
- Personalización de estilos
- Optimización de rendimiento

¡No dudes en preguntar! 😊

---

**Creado el:** ${new Date().toLocaleDateString()}
**Versión:** 1.0.0
