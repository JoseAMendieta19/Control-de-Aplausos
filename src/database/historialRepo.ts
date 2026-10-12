import type { AccionId, RegistroHistorial } from '../types';
import { obtenerDb } from './conexion';

export type FiltroHistorial = AccionId | 'todas';

const LIMITE = 500; // máximo de registros que se muestran a la vez

// Guarda una fila cada vez que se ejecuta una acción
export async function registrarHistorial(cantidad: number, accion: AccionId): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync(
    'INSERT INTO historial (fecha_hora, cantidad_aplausos, accion) VALUES (?, ?, ?)',
    [new Date().toISOString(), cantidad, accion]
  );
}

// Lista los registros, los más recientes primero, con filtro opcional por acción
export async function listarHistorial(filtro: FiltroHistorial): Promise<RegistroHistorial[]> {
  const db = await obtenerDb();
  const base = 'SELECT id, fecha_hora, cantidad_aplausos, accion FROM historial';
  if (filtro === 'todas') {
    return db.getAllAsync<RegistroHistorial>(`${base} ORDER BY id DESC LIMIT ${LIMITE}`);
  }
  return db.getAllAsync<RegistroHistorial>(
    `${base} WHERE accion = ? ORDER BY id DESC LIMIT ${LIMITE}`,
    [filtro]
  );
}

// Total de registros guardados (sin filtro)
export async function contarHistorial(): Promise<number> {
  const db = await obtenerDb();
  const fila = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM historial');
  return fila?.total ?? 0;
}

export async function eliminarRegistro(id: number): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync('DELETE FROM historial WHERE id = ?', [id]);
}

export async function borrarTodoHistorial(): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync('DELETE FROM historial');
}