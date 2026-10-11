import type { AccionConfig, Patron } from '../types';
import { CONFIG_POR_DEFECTO, LISTA_ACCIONES, NOMBRE_ACCION } from '../utils/constantes';
import { obtenerDb } from './conexion';

interface Fila {
  patron: number;
  accion: string;
}

const esAccionValida = (valor: string): valor is AccionConfig =>
  valor === 'ninguna' || (LISTA_ACCIONES as string[]).includes(valor);

// Devuelve qué acción tiene cada patrón (si un dato está dañado, usa el valor por defecto)
export async function obtenerConfiguracion(): Promise<Record<Patron, AccionConfig>> {
  const db = await obtenerDb();
  const filas = await db.getAllAsync<Fila>('SELECT patron, accion FROM configuracion_acciones');

  const config = { ...CONFIG_POR_DEFECTO };
  for (const fila of filas) {
    if (fila.patron >= 1 && fila.patron <= 5 && esAccionValida(fila.accion)) {
      config[fila.patron as Patron] = fila.accion;
    }
  }
  return config;
}

// Asigna una acción a un patrón. No permite repetir la misma acción en dos patrones.
export async function guardarAccionPatron(patron: Patron, accion: AccionConfig): Promise<void> {
  const db = await obtenerDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    if (accion !== 'ninguna') {
      const repetida = await txn.getFirstAsync<Fila>(
        'SELECT patron, accion FROM configuracion_acciones WHERE accion = ? AND patron <> ?',
        [accion, patron]
      );
      if (repetida) {
        throw new Error(
          `"${NOMBRE_ACCION[accion]}" ya está asignada al patrón de ${repetida.patron} aplausos.`
        );
      }
    }
    await txn.runAsync(
      `INSERT INTO configuracion_acciones (patron, accion) VALUES (?, ?)
       ON CONFLICT(patron) DO UPDATE SET accion = excluded.accion`,
      [patron, accion]
    );
  });
}