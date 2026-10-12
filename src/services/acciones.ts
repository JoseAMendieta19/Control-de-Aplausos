import { Vibration } from 'react-native';
import { createAudioPlayer } from 'expo-audio';
import type { AccionConfig } from '../types';
import { existeArchivo } from '../utils/archivos';

const SONIDO_ALARMA = require('../../assets/audio/alarma.wav');
const DURACION_ALARMA_MS = 3000;
const PATRON_VIBRACION = [0, 400, 200, 400]; // espera, vibra, espera, vibra (ms)
const DURACION_VIBRACION_MS = 1000;
const LIMITE_MENSAJE_MS = 12000; // la grabación dura máximo 10 s; el resto es margen

export interface ResultadoAccion {
  ok: boolean;
  mensaje?: string; // explicación si algo falló
  pausaMs: number; // cuánto debe esperar el detector antes de volver a escuchar
  terminada?: Promise<boolean>; // se cumple cuando termina un sonido largo (true = sin problemas)
}

// Lo que la pantalla debe hacer por nosotros (porque depende de su estado visual)
export interface ControlesPantalla {
  alternarLinterna: () => Promise<boolean>; // false si no hay permiso de cámara
  siguienteColor: () => void;
}

type Reproductor = ReturnType<typeof createAudioPlayer>;

let playerAlarma: Reproductor | null = null;
let cancelarMensaje: (() => void) | null = null;

// Reproduce el mensaje de voz y avisa cuando termina (true) o si falló (false)
export function reproducirMensajeVoz(ruta: string): Promise<boolean> {
  detenerMensajeVoz(); // por si había otro sonando

  return new Promise<boolean>((resolve) => {
    let player: Reproductor | null = null;
    let suscripcion: { remove: () => void } | null = null;
    let limite: ReturnType<typeof setTimeout> | null = null;
    let cerrado = false;

    const cerrar = (exito: boolean) => {
      if (cerrado) return;
      cerrado = true;
      if (limite) clearTimeout(limite);
      suscripcion?.remove();
      try {
        player?.pause();
        player?.remove();
      } catch {
        // el reproductor ya estaba liberado
      }
      if (cancelarMensaje === cancelar) cancelarMensaje = null;
      resolve(exito);
    };
    const cancelar = () => cerrar(true);
    cancelarMensaje = cancelar;

    try {
      player = createAudioPlayer({ uri: ruta });
      suscripcion = player.addListener('playbackStatusUpdate', (estado) => {
        if (estado.error) cerrar(false);
        else if (estado.didJustFinish) cerrar(true);
      });
      limite = setTimeout(() => cerrar(true), LIMITE_MENSAJE_MS);
      player.play();
    } catch {
      cerrar(false);
    }
  });
}

export function detenerMensajeVoz(): void {
  cancelarMensaje?.();
}

export async function ejecutarAccion(
  accion: AccionConfig,
  controles: ControlesPantalla,
  rutaMensajeVoz: string | null = null
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
      if (!rutaMensajeVoz) {
        return { ok: false, mensaje: 'Todavía no has grabado tu mensaje de voz.', pausaMs: 0 };
      }
      if (!existeArchivo(rutaMensajeVoz)) {
        return {
          ok: false,
          mensaje: 'No se encontró el archivo del mensaje. Vuelve a grabarlo en Configuración.',
          pausaMs: 0,
        };
      }
      return { ok: true, pausaMs: 0, terminada: reproducirMensajeVoz(rutaMensajeVoz) };

    default:
      return { ok: false, mensaje: 'Ese patrón no tiene acción asignada.', pausaMs: 0 };
  }
}

// Corta cualquier sonido o vibración en curso (al salir de la pantalla)
export function detenerSonidos(): void {
  Vibration.cancel();
  detenerMensajeVoz();
  try {
    playerAlarma?.pause();
  } catch {
    // el reproductor aún no estaba listo
  }
}