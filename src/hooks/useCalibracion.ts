import { useCallback, useEffect, useRef, useState } from 'react';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioStream,
} from 'expo-audio';
import type { Sensibilidad } from '../types';
import { rmsEnDb } from '../utils/audio';
import { proponerSensibilidad } from '../utils/calibracion';

const DURACION_MS = 3000;
const DESCARTAR_PRIMERAS = 3; // los primeros trozos (~0.3 s) incluyen el toque del dedo en el botón
const MIN_MUESTRAS = 12; // si llegan menos trozos, algo falló con el micrófono
const VARIACION_MAX_DB = 15; // más que esto = hubo ruidos fuertes durante la medición

export interface ResultadoCalibracion {
  fondoDb: number; // ruido de fondo típico (mediana)
  picoDb: number; // el momento más fuerte de la medición
  sensibilidad: Sensibilidad; // la que proponemos
  estable: boolean; // false si hubo ruidos fuertes y la medición no es confiable
}

export function useCalibracion() {
  const [estado, setEstado] = useState<'libre' | 'midiendo'>('libre');
  const [progreso, setProgreso] = useState(0); // 0 a 1
  const [resultado, setResultado] = useState<ResultadoCalibracion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);

  const midiendo = useRef(false);
  const muestras = useRef<number[]>([]);
  const inicio = useRef(0);
  const intervalo = useRef<ReturnType<typeof setInterval> | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { stream } = useAudioStream({
    channels: 1,
    encoding: 'float32',
    onBuffer: (buffer) => {
      if (!midiendo.current) return;
      try {
        muestras.current.push(rmsEnDb(buffer.data, buffer.channels));
      } catch {
        // un trozo dañado se ignora
      }
    },
  });

  const limpiar = () => {
    if (intervalo.current) clearInterval(intervalo.current);
    if (temporizador.current) clearTimeout(temporizador.current);
    intervalo.current = null;
    temporizador.current = null;
  };

  const detenerMicrofono = useCallback(() => {
    try {
      stream.stop();
    } catch {
      // ya estaba detenido
    }
  }, [stream]);

  const finalizar = useCallback(() => {
    if (!midiendo.current) return;
    midiendo.current = false;
    limpiar();
    detenerMicrofono();
    setEstado('libre');
    setProgreso(0);

    const datos = muestras.current.slice(DESCARTAR_PRIMERAS);
    if (datos.length < MIN_MUESTRAS) {
      setError('No se recibió suficiente audio del micrófono. Inténtalo de nuevo.');
      return;
    }
    const ordenados = [...datos].sort((a, b) => a - b);
    const fondoDb = ordenados[Math.floor(ordenados.length / 2)]; // la mediana ignora picos sueltos
    const picoDb = ordenados[ordenados.length - 1];
    setResultado({
      fondoDb,
      picoDb,
      sensibilidad: proponerSensibilidad(fondoDb),
      estable: picoDb - fondoDb <= VARIACION_MAX_DB,
    });
  }, [detenerMicrofono]);

  const calibrar = useCallback(async () => {
    if (midiendo.current) return;
    setError(null);
    setResultado(null);
    setSinPermiso(false);
    try {
      const permiso = await requestRecordingPermissionsAsync();
      if (!permiso.granted) {
        setSinPermiso(true);
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      muestras.current = [];
      midiendo.current = true;
      inicio.current = Date.now();
      await stream.start();
      setEstado('midiendo');
      intervalo.current = setInterval(() => {
        setProgreso(Math.min(1, (Date.now() - inicio.current) / DURACION_MS));
      }, 200);
      temporizador.current = setTimeout(finalizar, DURACION_MS);
    } catch {
      midiendo.current = false;
      limpiar();
      setEstado('libre');
      setError('No se pudo activar el micrófono. Cierra otras apps que lo usen e inténtalo de nuevo.');
    }
  }, [stream, finalizar]);

  // Al salir de la pantalla se cancela la medición y se libera el micrófono
  useEffect(() => {
    return () => {
      midiendo.current = false;
      limpiar();
      detenerMicrofono();
    };
  }, [detenerMicrofono]);

  return { estado, progreso, resultado, error, sinPermiso, calibrar };
}