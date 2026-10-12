import type { AccionConfig, Patron } from '../types';
import { CONFIG_POR_DEFECTO, LISTA_ACCIONES, NOMBRE_ACCION } from '../utils/constantes';
import { obtenerDb } from './conexion';

interface Fila {
  patron: number;
  accion: string;
}

// En vez de lanzar un error por cada regla de negocio, devolvemos el motivo
export type ResultadoGuardado = { ok: true } | { ok: false; mensaje: string };

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

// Asigna una acción a un patrón, validando las reglas. Si una regla falla, no se guarda nada.
export async function guardarAccionPatron(
  patron: Patron,
  accion: AccionConfig
): Promise<ResultadoGuardado> {
  const db = await obtenerDb();
  let resultado: ResultadoGuardado = { ok: true };

  await db.withExclusiveTransactionAsync(async (txn) => {
    // Regla 1: el mensaje de voz necesita una grabación
    if (accion === 'mensaje_voz') {
      const ajustes = await txn.getFirstAsync<{ ruta_mensaje_voz: string | null }>(
        'SELECT ruta_mensaje_voz FROM ajustes WHERE id = 1'
      );
      if (!ajustes?.ruta_mensaje_voz) {
        resultado = { ok: false, mensaje: 'Primero graba tu mensaje de voz para poder asignarlo.' };
        return;
      }
    }

    // Regla 2: la misma acción no puede estar en dos patrones
    if (accion !== 'ninguna') {
      const repetida = await txn.getFirstAsync<Fila>(
        'SELECT patron, accion FROM configuracion_acciones WHERE accion = ? AND patron <> ?',
        [accion, patron]
      );
      if (repetida) {
        resultado = {
          ok: false,
          mensaje: `"${NOMBRE_ACCION[accion]}" ya está asignada al patrón de ${repetida.patron} aplausos. Cámbiala primero allí.`,
        };
        return;
      }
    }

    await txn.runAsync(
      `INSERT INTO configuracion_acciones (patron, accion) VALUES (?, ?)
       ON CONFLICT(patron) DO UPDATE SET accion = excluded.accion`,
      [patron, accion]
    );
  });

  return resultado;
}