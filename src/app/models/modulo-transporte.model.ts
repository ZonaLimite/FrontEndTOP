// ============================================
// MODELO PARA CONFIGURACIÓN DE FOTOCÉLULAS
// ============================================

export type TipoEvento = 'activacion' | 'desactivacion' | 'atiempo' | 'retraso' | 'adelanto' | 'apparition' | 'desaparicion';
export type TamanoFotocelula = 'pequeno' | 'normal' | 'mediano' | 'grande';

// ============================================
// PATRÓN 1: CSS GRID
// ============================================

/**
 * Configuración de una fotocélula usando posicionamiento Grid
 */
export interface FotocelulaGridConfig {
  id: string;
  nombre: string;
  gridRow: number;        // Fila del grid (1-based)
  gridColumn: number;     // Columna del grid (1-based)
  orientacion?: 'row' | 'column';
  tamano?: TamanoFotocelula;
}

/**
 * Configuración de un módulo de transporte usando Grid
 */
export interface ModuloGridConfig {
  id: string;
  nombre: string;
  gridRows: number;       // Número de filas del grid interno
  gridColumns: number;    // Número de columnas del grid interno
  fotocelulas: FotocelulaGridConfig[];
  orientacion?: 'horizontal' | 'vertical';
  ancho?: string;         // Ancho CSS (ej: '300px', '100%')
  alto?: string;          // Alto CSS (ej: '150px', 'auto')
}

// ============================================
// PATRÓN 2: COORDENADAS ABSOLUTAS
// ============================================

/**
 * Configuración de una fotocélula usando coordenadas
 */
export interface FotocelulaCoordsConfig {
  id: string;
  nombre: string;
  x: number;              // Posición X
  y: number;              // Posición Y
  tamano?: TamanoFotocelula;
  orientacion?: 'row' | 'column';
}

/**
 * Configuración de un módulo de transporte usando coordenadas
 */
export interface ModuloCoordsConfig {
  id: string;
  nombre: string;
  ancho: number;          // Ancho en píxeles
  alto: number;           // Alto en píxeles
  fotocelulas: FotocelulaCoordsConfig[];
  orientacion?: 'horizontal' | 'vertical';
  etiquetaEspesor?: EtiquetaEspesorConfig;   // Solo módulos feeder (FED-n)
}

// ============================================
// ETIQUETA DE ESPESOR (MÓDULOS FEEDER)
// ============================================

/**
 * Posición y formato de la etiqueta de espesor dentro de un módulo feeder
 */
export interface EtiquetaEspesorConfig {
  x: number;              // Posición X en % del módulo
  y: number;              // Posición Y en % del módulo
  decimales?: number;     // Decimales mostrados en mm (por defecto 1)
}

/**
 * Clasificación de una medida de espesor:
 * - ok:          0 < espesor <= 30 mm
 * - warning:     espesor == 0, o 30 mm < espesor <= 64 mm
 * - excesivo:    espesor > 64 mm
 * - sin-lectura: no hay medida vigente
 */
export type EstadoEspesor = 'ok' | 'warning' | 'excesivo' | 'sin-lectura';

/**
 * Última medida de espesor recibida para un módulo feeder
 */
export interface MedidaEspesor {
  micras: number;         // Valor tal como llega en la traza (µm)
  mm: number;             // Valor convertido a milímetros
  estado: EstadoEspesor;
  timestamp: number;
}

// ============================================
// CONFIGURACIÓN DE MÓDULOS POR COORDENADAS EN LÍNEA
// ============================================

/**
 * Configuración de un módulo con posicionamiento por coordenadas en la línea
 */
export interface ModuloLineaCoordsConfig {
  config:  ModuloCoordsConfig;  // Config del módulo
  x: number;              // Posición X en porcentaje o píxeles (depende del contexto)
  y: number;              // Posición Y en porcentaje o píxeles (depende del contexto)
}

// ============================================
// CONFIGURACIÓN DE LÍNEA DE TRANSPORTE
// ============================================

/**
 * Configuración para ensamblar múltiples módulos con posicionamiento por coordenadas
 */
export interface LineaTransporteCoordsConfig {
  id: string;
  nombre: string;
  ancho: number;          // Ancho total del área de módulos en píxeles
  alto: number;           // Alto total del área de módulos en píxeles
  modulos: ModuloLineaCoordsConfig[];  // Módulos con coordenadas
}

