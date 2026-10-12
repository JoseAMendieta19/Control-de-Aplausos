import { File } from 'expo-file-system';

// Comprueba si el archivo todavía existe en el teléfono
export function existeArchivo(uri: string | null): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

// Borra un archivo sin lanzar error si ya no estaba
export function borrarArchivo(uri: string | null): void {
  if (!uri) return;
  try {
    const archivo = new File(uri);
    if (archivo.exists) archivo.delete();
  } catch {
    // si no se pudo borrar, no es grave
  }
}