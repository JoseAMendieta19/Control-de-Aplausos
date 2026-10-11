import { Vibration } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import type { AccionConfig } from '../types';

const SONIDO_ALARMA = require('../../assets/audio/alarma.wav');
const DURACION_ALARMA_MS = 3000;
const PATRON_VIBRACION = [0, 400, 200, 400]; // espera, vibra, espera, vibra (ms)
const DURACION_VIBRACION_MS = 1000;

export interface ResultadoAccion {
  ok: boolean;
  mensaje?: string; // explicación si algo falló
  pausaMs: number; // cuánto debe esperar el detector antes de volver a escuchar
}

// Lo que la pantalla debe hacer por nosotros (porque depende de su estado visual)
export interface ControlesPantalla {
  alternarLinterna: () => Promise<boolean>; // false si no hay permiso de cámara
  siguienteColor: () => void;
}

let playerAlarma: ReturnType<typeof createAudioPlayer> | null = null;

export async function ejecutarAccion(
  accion: AccionConfig,
  controles: ControlesPantalla
): Promise<ResultadoAccion> {
  switch (accion) {
    case 'vibrar':
      Vibration.vibrate(PATRON_VIBRACION);
      return { ok: true, pausaMs: DURACION_VIBRACION_MS };

    case 'alarma':
      try {
        const yaExistia = playerAlarma !== null;
        if (!playerAlarma) playerAlarma = createAudioPlayer(SONIDO_ALARMA);
        if (yaExistia) await playerAlarma.seekTo(0); // reinicia el sonido
        playerAlarma.play();
        return { ok: true, pausaMs: DURACION_ALARMA_MS };
      } catch {
        return { ok: false, mensaje: 'No se pudo reproducir la alarma.', pausaMs: 0 };
      }

    case 'linterna': {
      const hecho = await controles.alternarLinterna();
      return hecho
        ? { ok: true, pausaMs: 300 }
        : { ok: false, mensaje: 'Linterna: falta el permiso de la cámara.', pausaMs: 0 };
    }

    case 'color':
      controles.siguienteColor();
      return { ok: true, pausaMs: 300 };

    case 'mensaje_voz':
      return {
        ok: false,
        mensaje: 'Mensaje de voz: se activará en el paso de grabación.',
        pausaMs: 0,
      };

    default:
      return { ok: false, mensaje: 'Ese patrón no tiene acción asignada.', pausaMs: 0 };
  }
}

// Corta cualquier sonido o vibración en curso (al salir de la pantalla)
export function detenerSonidos(): void {
  Vibration.cancel();
  try {
    playerAlarma?.pause();
  } catch {
    // el reproductor aún no estaba listo
  }
}