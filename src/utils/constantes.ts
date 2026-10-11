import type { AccionConfig, AccionId, Patron, Sensibilidad } from '../types';

export interface ParametrosDeteccion {
  nivelMinDb: number; // volumen mínimo para considerar un aplauso
  brilloMin: number; // qué tan agudo y seco debe sonar
  caidaMinDb: number; // cuánto debe apagarse a los 60 ms
}

// "media" son los valores que ya probaste. "baja" y "alta" son puntos de partida
// que afinaremos en el paso de calibración.
export const PERFILES_SENSIBILIDAD: Record<Sensibilidad, ParametrosDeteccion> = {
  baja: { nivelMinDb: -24, brilloMin: 0.4, caidaMinDb: 7 },
  media: { nivelMinDb: -30, brilloMin: 0.35, caidaMinDb: 6 },
  alta: { nivelMinDb: -36, brilloMin: 0.3, caidaMinDb: 5 },
};

export const PATRONES: Patron[] = [1, 2, 3, 4, 5];

export const LISTA_ACCIONES: AccionId[] = ['vibrar', 'alarma', 'linterna', 'mensaje_voz', 'color'];

export const NOMBRE_ACCION: Record<AccionConfig, string> = {
  vibrar: 'Vibrar',
  alarma: 'Alarma',
  linterna: 'Linterna',
  mensaje_voz: 'Mensaje de voz',
  color: 'Cambiar color',
  ninguna: 'Ninguna',
};

// Asignación inicial de la base de datos
export const CONFIG_POR_DEFECTO: Record<Patron, AccionConfig> = {
  1: 'vibrar',
  2: 'alarma',
  3: 'linterna',
  4: 'ninguna',
  5: 'color',
};

// Colores por los que rota la acción "Cambiar color"
export const COLORES_PANTALLA = ['#ffffff', '#fde68a', '#bfdbfe', '#bbf7d0', '#fecaca', '#e9d5ff'];