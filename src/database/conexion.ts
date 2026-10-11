import * as SQLite from 'expo-sqlite';
import { CONFIG_POR_DEFECTO } from '../utils/constantes';

const NOMBRE_DB = 'clapcontrol.db';
const VERSION_ESQUEMA = 1; // sube este número cuando cambies las tablas

let conexion: Promise<SQLite.SQLiteDatabase> | null = null;

// Abre la base y, si es la primera vez, crea las tablas y los datos iniciales
async function prepararDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(NOMBRE_DB);
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versionActual = fila?.user_version ?? 0;

  if (versionActual < 1) {
    // Valores fijos del código (no vienen del usuario), por eso es seguro armarlos así
    const patrones = Object.entries(CONFIG_POR_DEFECTO)
      .map(([patron, accion]) => `(${Number(patron)}, '${accion}')`)
      .join(', ');

    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS configuracion_acciones (
          patron INTEGER PRIMARY KEY CHECK (patron BETWEEN 1 AND 5),
          accion TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ajustes (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          sensibilidad TEXT NOT NULL DEFAULT 'media',
          ruta_mensaje_voz TEXT
        );
        CREATE TABLE IF NOT EXISTS historial (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_hora TEXT NOT NULL,
          cantidad_aplausos INTEGER NOT NULL,
          accion TEXT NOT NULL
        );
        INSERT OR IGNORE INTO ajustes (id, sensibilidad, ruta_mensaje_voz)
          VALUES (1, 'media', NULL);
        INSERT OR IGNORE INTO configuracion_acciones (patron, accion) VALUES ${patrones};
        PRAGMA user_version = ${VERSION_ESQUEMA};
      `);
    });
  }

  return db;
}

// Una sola conexión para toda la app. Si falla al abrir, la próxima llamada reintenta.
export function obtenerDb(): Promise<SQLite.SQLiteDatabase> {
  if (!conexion) {
    conexion = prepararDb().catch((error) => {
      conexion = null;
      throw error;
    });
  }
  return conexion;
}