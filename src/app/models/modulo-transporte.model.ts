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
  etiquetaOcr?: EtiquetaLecturaConfig;         // Solo módulos de adquisición (ACQ-n): parte superior
  etiquetaRestitucion?: EtiquetaLecturaConfig; // Solo módulos de adquisición (ACQ-n): parte inferior
  etiquetaVideocodificacion?: EtiquetaLecturaConfig; // Solo módulo de videocodificación (VCS-n)
  listaRechazos?: ListaRechazosConfig;         // Solo módulos de culling (CUL-n)
}

// ============================================
// LISTA DE ÚLTIMOS RECHAZOS (MÓDULOS CUL)
// ============================================

/**
 * Posición y tamaño de la lista de últimos rechazos dentro de un módulo de culling
 */
export interface ListaRechazosConfig {
  x: number;              // Posición X en % del módulo
  y: number;              // Posición Y en % del módulo
  items?: number;         // Rechazos visibles (por defecto 3)
}

/**
 * Rechazo mostrado en la lista de últimos rechazos
 */
export interface RechazoReciente {
  id: number;             // Identifica el rechazo en la lista (trackBy)
  denominacion: string;   // Tipo de rechazo (ej: 'ANNULATION_SC')
  info: string;           // Información complementaria de la traza
  feeder: string | null;  // Feeder de origen del envío (ej: '2'); null si no se conoce
  timestamp: Date;
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
// ETIQUETA DE LECTURA DE DESTINO (MÓDULOS ACQ)
// ============================================

/**
 * Posición de una etiqueta de lectura de destino dentro de un módulo de
 * adquisición (OCR arriba, restitución abajo) o del de videocodificación
 */
export interface EtiquetaLecturaConfig {
  x: number;              // Posición X en % del módulo
  y: number;              // Posición Y en % del módulo
}

/**
 * Sistema que obtuvo el destino del envío. Cada envío lo resuelve uno u otro:
 * si se detecta cronomarca se usa la restitución y no se trata con OCR.
 * La videocodificación es un sistema aparte: resuelve más tarde, en línea,
 * envíos que ya pasaron por el ACQ.
 */
export type OrigenLectura = 'ocr' | 'restitucion' | 'videocodificacion';

/**
 * Resultado de una lectura de destino:
 * - encaminamiento: CP de 5 dígitos
 * - distribucion:   CP + 6 dígitos de distribución
 * - no-reconocido:  no se obtuvo destino (ej: OCR 'R_REC')
 */
export type EstadoLectura = 'encaminamiento' | 'distribucion' | 'no-reconocido';

/**
 * Última lectura de destino recibida
 */
export interface LecturaDestino {
  origen: OrigenLectura;
  estado: EstadoLectura;
  cp: string | null;            // Código postal (5 dígitos)
  distribucion: string | null;  // 6 dígitos de distribución (calle + sección), si se leyó a ese nivel
  texto: string;                // Destino en texto (solo OCR; '' si no hay)
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

