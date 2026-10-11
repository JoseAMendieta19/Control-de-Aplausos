import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Acciones que el teléfono puede ejecutar
export type AccionId =
  | 'vibrar'
  | 'alarma'
  | 'linterna'
  | 'mensaje_voz'
  | 'color';

// Lo que se puede asignar a un patrón: una acción o nada
export type AccionConfig = AccionId | 'ninguna';

// Cantidad de aplausos que forman un patrón (1 a 5)
export type Patron = 1 | 2 | 3 | 4 | 5;

export type Sensibilidad = 'baja' | 'media' | 'alta';

// Tablas de SQLite
export interface ConfiguracionAccion {
  patron: Patron;
  accion: AccionConfig;
}

export interface Ajustes {
  sensibilidad: Sensibilidad;
  ruta_mensaje_voz: string | null;
}

export interface RegistroHistorial {
  id: number;
  fecha_hora: string; // formato ISO
  cantidad_aplausos: number;
  accion: AccionId;
}

// Rutas de navegación (pantallas sin parámetros)
export type RootStackParamList = {
  Inicio: undefined;
  Configuracion: undefined;
  Historial: undefined;
};

// Props que recibe cada pantalla (incluye `navigation`)
export type PantallaProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;