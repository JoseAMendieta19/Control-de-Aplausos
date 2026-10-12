import { NIVEL_MIN_DB } from '../hooks/useDetectorAplausos';

// Convierte dB (-60 a 0) en porcentaje (0 a 100) para dibujar el medidor
export const nivelAPorcentaje = (db: number): number =>
  Math.max(0, Math.min(100, ((db - NIVEL_MIN_DB) / -NIVEL_MIN_DB) * 100));

// Volumen promedio de un trozo de audio en decibelios (0 = máximo, más negativo = más silencio)
export function rmsEnDb(data: ArrayBuffer | ArrayBufferView, canales: number): number {
  const x = ArrayBuffer.isView(data)
    ? new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4)
    : new Float32Array(data);
  const paso = Math.max(1, canales); // si hay varios canales, usamos solo el primero
  let suma = 0;
  let n = 0;
  for (let i = 0; i < x.length; i += paso) {
    suma += x[i] * x[i];
    n++;
  }
  if (n === 0) return -160;
  return 20 * Math.log10(Math.max(Math.sqrt(suma / n), 1e-6));
}