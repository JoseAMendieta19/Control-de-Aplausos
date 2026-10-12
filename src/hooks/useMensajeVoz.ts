import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import {
  eliminarMensajeVozGuardado,
  guardarRutaMensajeVoz,
  obtenerAjustes,
} from '../database/ajustesRepo';
import { detenerMensajeVoz, reproducirMensajeVoz } from '../services/acciones';
import { borrarArchivo } from '../utils/archivos';

export const MAX_SEGUNDOS = 10;
const MIN_MS = 800; // grabaciones más cortas se descartan

// Audio mono y liviano, guardado en el almacenamiento permanente de la app
const OPCIONES_GRABACION = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'document' as const,
  numberOfChannels: 1,
  bitRate: 64000,
};

export type EstadoVoz = 'libre' | 'grabando' | 'reproduciendo';

export function useMensajeVoz(alBorrar?: () => void) {
  const recorder = useAudioRecorder(OPCIONES_GRABACION);
  const estadoGrabador = useAudioRecorderState(recorder, 200);

  const [ruta, setRuta] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoVoz>('libre');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);

  const grabando = useRef(false);
  const alBorrarRef = useRef(alBorrar);
  alBorrarRef.current = alBorrar;

  // Corta lo que esté pasando (grabación o reproducción) y descarta lo grabado a medias
  const cancelarTodo = useCallback(() => {
    detenerMensajeVoz();
    if (grabando.current) {
      grabando.current = false;
      recorder
        .stop()
        .then(() => borrarArchivo(recorder.uri))
        .catch(() => {});
    }
    setEstado('libre');
  }, [recorder]);

  // Al entrar se lee el mensaje guardado; al salir se cancela todo
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      obtenerAjustes()
        .then((ajustes) => {
          if (vigente) setRuta(ajustes.ruta_mensaje_voz);
        })
        .catch(() => {
          if (vigente) setMensaje('No se pudo leer el mensaje guardado.');
        });
      return () => {
        vigente = false;
        cancelarTodo();
      };
    }, [cancelarTodo])
  );

  const terminarGrabacion = useCallback(async () => {
    if (!grabando.current) return;
    grabando.current = false;
    const duracionMs = recorder.getStatus().durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) throw new Error('La grabación no generó archivo');

      if (duracionMs < MIN_MS) {
        borrarArchivo(uri);
        setMensaje('La grabación fue muy corta. Habla al menos 1 segundo.');
        return;
      }

      const anterior = ruta;
      await guardarRutaMensajeVoz(uri);
      setRuta(uri);
      if (anterior && anterior !== uri) borrarArchivo(anterior); // reemplaza la grabación anterior
      setMensaje('Mensaje guardado.');
    } catch {
      setMensaje('No se pudo guardar la grabación. Inténtalo de nuevo.');
    } finally {
      setEstado('libre');
    }
  }, [recorder, ruta]);

  const grabar = useCallback(async () => {
    if (estado !== 'libre') return;
    setMensaje(null);
    setSinPermiso(false);
    try {
      const permiso = await requestRecordingPermissionsAsync();
      if (!permiso.granted) {
        setSinPermiso(true);
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: MAX_SEGUNDOS }); // tope de seguridad de 10 s
      grabando.current = true;
      setEstado('grabando');
    } catch {
      setMensaje(
        'No se pudo iniciar la grabación. Cierra otras apps que usen el micrófono e inténtalo de nuevo.'
      );
    }
  }, [estado, recorder]);

  // Corta la grabación automáticamente al llegar a 10 s
  useEffect(() => {
    if (estado === 'grabando' && estadoGrabador.durationMillis >= MAX_SEGUNDOS * 1000) {
      terminarGrabacion();
    }
  }, [estado, estadoGrabador.durationMillis, terminarGrabacion]);

  const escuchar = useCallback(async () => {
    if (estado !== 'libre' || !ruta) return;
    setMensaje(null);
    setEstado('reproduciendo');
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const bien = await reproducirMensajeVoz(ruta);
      if (!bien) setMensaje('No se pudo reproducir el mensaje. Vuelve a grabarlo.');
    } catch {
      setMensaje('No se pudo reproducir el mensaje. Vuelve a grabarlo.');
    } finally {
      setEstado('libre');
    }
  }, [estado, ruta]);

  // El mismo botón detiene la grabación o la reproducción
  const detener = useCallback(async () => {
    if (estado === 'grabando') await terminarGrabacion();
    else if (estado === 'reproduciendo') detenerMensajeVoz();
  }, [estado, terminarGrabacion]);

  const borrar = useCallback(async (): Promise<boolean> => {
    if (!ruta || estado !== 'libre') return false;
    try {
      await eliminarMensajeVozGuardado(); // también quita la acción de los patrones
      borrarArchivo(ruta);
      setRuta(null);
      setMensaje('Mensaje borrado.');
      alBorrarRef.current?.();
      return true;
    } catch {
      setMensaje('No se pudo borrar el mensaje. Inténtalo de nuevo.');
      return false;
    }
  }, [ruta, estado]);

  const segundos =
    estado === 'grabando'
      ? Math.min(MAX_SEGUNDOS, Math.floor(estadoGrabador.durationMillis / 1000))
      : 0;

  return { ruta, estado, segundos, mensaje, sinPermiso, grabar, detener, escuchar, borrar };
}