import type { Sensibilidad } from '../types';

// Umbrales de ruido de fondo (dB) para proponer la sensibilidad. Se afinan con pruebas reales.
export const UMBRAL_SILENCIO_DB = -50;
export const UMBRAL_RUIDO_DB = -38;

export function proponerSensibilidad(fondoDb: number): Sensibilidad {
  if (fondoDb < UMBRAL_SILENCIO_DB) return 'alta'; // lugar silencioso: se pueden detectar aplausos suaves
  if (fondoDb < UMBRAL_RUIDO_DB) return 'media';
  return 'baja'; // lugar ruidoso: solo aplausos fuertes, para evitar falsas alarmas
}

export function describirFondo(fondoDb: number): string {
  if (fondoDb < UMBRAL_SILENCIO_DB) return 'silencioso';
  if (fondoDb < UMBRAL_RUIDO_DB) return 'normal';
  return 'ruidoso';
}