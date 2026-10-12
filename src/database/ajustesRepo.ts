import type { Ajustes, Sensibilidad } from '../types';
import { obtenerDb } from './conexion';

interface FilaAjustes {
  sensibilidad: string;
  ruta_mensaje_voz: string | null;
}

const SENSIBILIDADES: Sensibilidad[] = ['baja', 'media', 'alta'];

export async function obtenerAjustes(): Promise<Ajustes> {
  const db = await obtenerDb();
  const fila = await db.getFirstAsync<FilaAjustes>(
    'SELECT sensibilidad, ruta_mensaje_voz FROM ajustes WHERE id = 1'
  );
  return {
    sensibilidad: SENSIBILIDADES.find((s) => s === fila?.sensibilidad) ?? 'media',
    ruta_mensaje_voz: fila?.ruta_mensaje_voz ?? null,
  };
}

export async function guardarSensibilidad(sensibilidad: Sensibilidad): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync('UPDATE ajustes SET sensibilidad = ? WHERE id = 1', [sensibilidad]);
}

// null = no hay mensaje de voz grabado
export async function guardarRutaMensajeVoz(ruta: string | null): Promise<void> {
  const db = await obtenerDb();
  await db.runAsync('UPDATE ajustes SET ruta_mensaje_voz = ? WHERE id = 1', [ruta]);
}

// Borra la referencia al mensaje y quita esa acción de los patrones que la usaban.
// Todo en una transacción: o se hace completo o no se hace nada.
export async function eliminarMensajeVozGuardado(): Promise<void> {
  const db = await obtenerDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('UPDATE ajustes SET ruta_mensaje_voz = NULL WHERE id = 1');
    await txn.runAsync(
      "UPDATE configuracion_acciones SET accion = 'ninguna' WHERE accion = 'mensaje_voz'"
    );
  });
}