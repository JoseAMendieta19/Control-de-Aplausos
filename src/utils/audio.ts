import { NIVEL_MIN_DB } from '../hooks/useDetectorAplausos';

// Convierte dB (-60 a 0) en porcentaje (0 a 100) para dibujar el medidor
export const nivelAPorcentaje = (db: number): number =>
  Math.max(0, Math.min(100, ((db - NIVEL_MIN_DB) / -NIVEL_MIN_DB) * 100));