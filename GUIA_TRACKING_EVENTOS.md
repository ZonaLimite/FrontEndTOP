# Sistema de Tracking de Eventos - Guía de Uso

## 📋 Introducción

Se ha implementado un **sistema completo de rastreo y estadísticas de eventos** para fotocélulas en tiempo real. El sistema consta de:

1. **EventosTrackingService** - Servicio que almacena y gestiona eventos
2. **EstadisticasEventosComponent** - Componente visual con tabla interactiva y filtros
3. **Integración con FotocelulaComponent** - Registro automático de eventos

---

## 🏗️ Arquitectura

```
FotocelulaComponent (mostrarEvento)
    ↓ [registra evento]
EventosTrackingService (almacena y cuenta)
    ↓ [emite cambios]
EstadisticasEventosComponent (visualiza en tabla)
```

---

## 🚀 Uso Rápido

### 1. Agregar la Tabla de Estadísticas en tu Componente

```html
<!-- En tu template (ej: demo-modulos.component.html) -->
<div class="contenedor-demo">
  
  <!-- Tu línea de transporte -->
  <app-linea-transporte
    [modoCoords]="true"
    [modulosCoordsConfig]="modulosCoords"
    [anchoLinea]="1200"
    [altoLinea]="600">
  </app-linea-transporte>

  <!-- Compone estadísticas debajo -->
  <app-estadisticas-eventos></app-estadisticas-eventos>

</div>
```

### 2. Ya está Integrado

El servicio se inyecta automáticamente en FotocelulaComponent. Cuando ocurre un evento, se registra automáticamente:

```typescript
// En FotocelulaComponent (ya implementado)
mostrarEvento(tipo: TipoEvento) {
  // ... código de animación ...
  
  // ✅ Se registra automáticamente aquí
  this.trackingService.registrarEvento(
    fotocelulaId,
    fotocelulaNombre,
    moduloId,
    moduloNombre,
    tipo
  );
}
```

---

## 🎯 Proporcionar IDs Correctamente

Para que el tracking funcione correctamente, debes pasar los IDs a FotocelulaComponent:

### Opción A: Desde ModuloTransporteCoordsComponent (RECOMENDADO)

En `modulo-transporte-coords.component.html`:

```html
<!-- ANTES (sin tracking IDs) -->
<app-fotocelula
  [nombreFotocelula]="fotocelulaConfig.nombre"
  [tamano]="fotocelulaConfig.tamano || 'normal'"
  [orientacion]="fotocelulaConfig.orientacion || 'column'">
</app-fotocelula>

<!-- DESPUÉS (con tracking IDs) -->
<app-fotocelula
  [nombreFotocelula]="fotocelulaConfig.nombre"
  [fotocelulaId]="fotocelulaConfig.id"
  [moduloId]="config.id"
  [moduloNombre]="config.nombre"
  [tamano]="fotocelulaConfig.tamano || 'normal'"
  [orientacion]="fotocelulaConfig.orientacion || 'column'">
</app-fotocelula>
```

### Opción B: Hardcoded en tu Página

```html
<app-fotocelula
  nombreFotocelula="FC-001"
  fotocelulaId="fc-001"
  moduloId="modulo-entrada"
  moduloNombre="Módulo de Entrada"
  tamano="normal">
</app-fotocelula>
```

---

## 📊 API del Servicio (EventosTrackingService)

### Métodos Principales

```typescript
// Registrar un evento (llamado automáticamente por FotocelulaComponent)
registrarEvento(
  fotocelulaId: string,
  fotocelulaNombre: string,
  moduloId: string,
  moduloNombre: string,
  tipo: TipoEvento
): void

// Obtener estadísticas como Observable (para templates)
obtenerEstadisticas(): Observable<EstadisticasFotocelula[]>

// Obtener estadísticas agrupadas por módulo
obtenerEstadisticasModulos(): Observable<EstadisticasModulo[]>

// Obtener snapshot actual
obtenerEstadisticasActuales(): EstadisticasFotocelula[]

// Limpiar todas las estadísticas
limpiarEstadisticas(): void

// Limpiar una fotocélula específica
limpiarEstadisticasFotocelula(fotocelulaId: string): void

// Obtener historial de todos los eventos
obtenerHistorialCompleto(): EventoContable[]

// Exportar como CSV
exportarCSV(): string
descargarCSV(nombreArchivo?: string): void

// Utilidades
obtenerPorTipo(tipo: TipoEvento): EstadisticasFotocelula[]
obtenerEventoMasFrecuente(): TipoEvento | null
```

---

## 📈 Estructuras de Datos

### EstadisticasFotocelula
```typescript
{
  fotocelulaId: string;           // ID único
  fotocelulaNombre: string;       // Nombre para mostrar
  moduloId: string;               // ID del módulo contenedor
  moduloNombre: string;           // Nombre del módulo
  atiempo: number;                // Contador de eventos atiempo
  retraso: number;                // Contador de eventos retraso
  adelanto: number;               // Contador de eventos adelanto
  apparition: number;             // Contador de eventos apparition
  desaparicion: number;           // Contador de eventos desaparicion
  total: number;                  // Total de eventos
  ultimoEvento?: Date;            // Timestamp del último evento
  historialCompleto: EventoContable[];  // Lista completa de eventos
}
```

### EstadisticasModulo
```typescript
{
  moduloId: string;
  moduloNombre: string;
  fotocelulas: EstadisticasFotocelula[];
  totalesModulo: {
    atiempo: number;
    retraso: number;
    adelanto: number;
    apparition: number;
    desaparicion: number;
  };
}
```

---

## 🎨 Componente EstadisticasEventos

### Características

- ✅ **Tabla interactiva** con filtros por tipo de evento
- ✅ **Checkboxes** para activar/desactivar tipos de evento
- ✅ **Codificación por colores** según intensidad
- ✅ **Historial expandible** de últimos 50 eventos
- ✅ **Exportación a CSV** con timestamps
- ✅ **Reset completo** de estadísticas
- ✅ **Responsive** para móvil/tablet

### Uso en Template

```html
<!-- Componente standalone, no necesita configuración -->
<app-estadisticas-eventos></app-estadisticas-eventos>
```

### Funcionalidades Interactivas

1. **Filtros de Checkboxes**
   - Seleccion de tipos de evento individuales
   - Botones "Todos" y "Ninguno"

2. **Tabla de Datos**
   - Módulo y Fotocélula en cada fila
   - Columnas dinámicas según filtros
   - Colorización por intensidad (verde → rojo)
   - Timestamp del último evento

3. **Historial**
   - Expandible/contraíble
   - Últimos 50 eventos
   - Ordenado por reciente primero

4. **Botones de Acción**
   - 📥 Descargar CSV
   - 🔄 Limpiar Estadísticas

---

## 💻 Ejemplo Completo: DemoModulosComponent

```typescript
import { Component, OnInit } from '@angular/core';
import { ModuloLineaCoordsConfig, ModuloCoordsConfig } from '../../models/modulo-transporte.model';

@Component({
  selector: 'app-demo-modulos',
  templateUrl: './demo-modulos.component.html',
  styleUrls: ['./demo-modulos.component.css']
})
export class DemoModulosComponent implements OnInit {
  
  modoCoords = true;
  modulosCoordsConfig: ModuloLineaCoordsConfig[] = [];

  ngOnInit() {
    this.crearModulosDemo();
  }

  crearModulosDemo() {
    // Módulo 1: Entrada
    const modulo1: ModuloCoordsConfig = {
      id: 'FED-01',
      nombre: 'Módulo Entrada',
      ancho: 300,
      alto: 200,
      fotocelulas: [
        { id: 'fd01-fc1', nombre: 'FED-01-FC1', x: 30, y: 50 },
        { id: 'fd01-fc2', nombre: 'FED-01-FC2', x: 70, y: 50 }
      ]
    };

    // Módulo 2: Exterior
    const modulo2: ModuloCoordsConfig = {
      id: 'EXT-01',
      nombre: 'Módulo Exterior',
      ancho: 300,
      alto: 200,
      fotocelulas: [
        { id: 'ext01-fc1', nombre: 'EXT-01-FC1', x: 50, y: 50 }
      ]
    };

    this.modulosCoordsConfig = [
      { config: modulo1, x: 15, y: 50 },
      { config: modulo2, x: 85, y: 50 }
    ];
  }

  // Método para simular eventos (opcional)
  simularEventoAleatorio() {
    const modulos = this.modulosCoordsConfig;
    const moduloAleatorio = modulos[Math.floor(Math.random() * modulos.length)];
    const config = moduloAleatorio.config as ModuloCoordsConfig;
    
    if (config.fotocelulas && config.fotocelulas.length > 0) {
      const fotocelula = config.fotocelulas[
        Math.floor(Math.random() * config.fotocelulas.length)
      ];
      const tipos = ['atiempo', 'retraso', 'adelanto', 'apparition', 'desaparicion'];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)] as any;
      
      // Encontrar la fotocélula y simular evento
      console.log(`Simulando evento ${tipo} en ${fotocelula.nombre}`);
    }
  }
}
```

### Template Completo

```html
<div class="demo-container">
  
  <!-- Línea de Transporte -->
  <div class="seccion-linea">
    <h2>Línea de Transporte Monitorizada</h2>
    <app-linea-transporte
      [modoCoords]="modoCoords"
      [modulosCoordsConfig]="modulosCoordsConfig"
      [anchoLinea]="1200"
      [altoLinea]="600"
      [titulo]="'Demo de Tracking en Tiempo Real'">
    </app-linea-transporte>
  </div>

  <!-- Estadísticas y Controls -->
  <div class="seccion-estadisticas">
    <div class="controls">
      <button (click)="simularEventoAleatorio()" class="btn-simular">
        🎲 Simular Evento Aleatorio
      </button>
    </div>
    
    <app-estadisticas-eventos></app-estadisticas-eventos>
  </div>

</div>
```

### Estilos Básicos

```css
.demo-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.seccion-linea {
  flex: 1;
}

.seccion-estadisticas {
  flex: 1;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.btn-simular {
  background: linear-gradient(135deg, #0088ff, #0066cc);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
```

---

## ⚙️ Integración con WebSocket (Futuro)

Para cuando tengas el WebSocket funcionando:

```typescript
// En tu servicio WebSocket
private socket = webSocket(this.wsUrl);

ngOnInit() {
  this.socket.subscribe((evento: EventoFotocelula) => {
    // Registrar el evento del servidor
    this.trackingService.registrarEvento(
      evento.fotocelulaId,
      evento.fotocelulaNombre,
      evento.moduloId,
      evento.moduloNombre,
      evento.tipo
    );
  });
}
```

---

## 🐛 Troubleshooting

### Los eventos no se registran
- [ ] ¿Estás pasando `fotocelulaId` a FotocelulaComponent?
- [ ] ¿Está inyectado EventosTrackingService en FotocelulaComponent?
- [ ] ¿Se importó EstadisticasEventosComponent en AppModule?

### La tabla está vacía
- [ ] Verifica la consola para mensajes de error
- [ ] Asegúrate de que mostrarEvento() se está llamando
- [ ] Comprueba que los IDs no sean vacíos

### Exportar CSV no funciona
- [ ] Verifica que haya eventos registrados
- [ ] Prueba en otro navegador
- [ ] Verifica la consola del navegador para errores

---

## 📌 Resumen

### ✅ Implementado
- Servicio de tracking con Observable
- Tabla interactiva con filtros
- Historial de eventos
- Exportación CSV
- Integración automática con FotocelulaComponent

### 🚀 Próximos Pasos
1. Integrar con WebSocket cuando esté disponible
2. Añadir colorización dinámica de módulos (heat map)
3. Gráficos de eventos por tiempo
4. Alertas de anomalías

---

## 📖 Más Información

- **Servicio**: `src/app/services/eventos-tracking.service.ts`
- **Componente**: `src/app/components/estadisticas-eventos/`
- **Modelos**: `src/app/models/modulo-transporte.model.ts`

¡Disfrutalo! 🎉
