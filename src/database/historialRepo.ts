import type { AccionId } from '../types';
import { obtenerDb } from './conexion';

// Guarda una fila cada vez que se ejecuta una acción
export async function registrarHistorial(cantidad: number, accion: AccionId): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync(
    'INSERT INTO historial (fecha_hora, cantidad_aplausos, accion) VALUES (?, ?, ?)',
    [new Date().toISOString(), cantidad, accion]
  );
}