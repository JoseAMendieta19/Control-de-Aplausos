import { useCallback, useEffect, useRef, useState } from 'react';
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioStream,
} from 'expo-audio';

// --- Parámetros de detección ---
const VENTANA_MS = 10; // analizamos el audio en trocitos de 10 ms
const RETRASO = 6; // ventanas (60 ms) que esperamos para ver si el sonido se apaga
const HISTORIAL = 20; // ventanas guardadas en memoria (200 ms)
const SALTO_DB = 18; // cuánto debe subir de golpe sobre el ruido de fondo
const REFRACTARIO = 15; // 150 ms: ignora el eco justo después de un aplauso
const CIERRE_VENTANAS = 90; // 900 ms sin aplausos cierran el patrón
const PISO_REPORTE_DB = -50; // por debajo de este nivel ni se reporta el sonido
const MARGEN_BRILLO_DB = 12; // solo se mide el brillo en ventanas cercanas al pico
const MARGEN_REANUDAR_MS = 300; // espera extra tras una acción antes de volver a escuchar
export const NIVEL_MIN_DB = -60; // piso para dibujar el medidor

export type EstadoEscucha = 'detenido' | 'escuchando' | 'sin_permiso' | 'error';
export type MotivoRechazo = 'nivel' | 'brillo' | 'caida';

interface Ventana {
  rmsDb: number; // volumen promedio de la ventana
  picoDb: number; // volumen máximo de la ventana
  brillo: number; // 0 = grave y tonal, ~1 o más = ruido agudo
}

// Resultado de un sonido brusco analizado (sirve para calibrar)
export interface Candidato {
  id: number;
  aceptado: boolean;
  salto: number;
  nivel: number;
  brillo: number;
  caida: number;
  motivo: MotivoRechazo | null;
}

// El que recibe el patrón puede devolver cuántos ms debe esperar el detector
type ResultadoPatron = number | void | Promise<number | void>;

interface Opciones {
  nivelMinDb: number;
  brilloMin: number;
  caidaMinDb: number;
  onPatron?: (cantidad: number) => ResultadoPatron;
}

const aDb = (x: number) => 20 * Math.log10(Math.max(x, 1e-6));

// Convierte el buffer recibido en un arreglo mono de números entre -1 y 1
function aMono(data: ArrayBuffer | ArrayBufferView, canales: number): Float32Array {
  const x = ArrayBuffer.isView(data)
    ? new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4)
    : new Float32Array(data);
  if (canales <= 1) return x;
  const mono = new Float32Array(Math.floor(x.length / canales));
  for (let i = 0; i < mono.length; i++) mono[i] = x[i * canales];
  return mono;
}

// Describe cómo suena un trocito de audio
function analizarVentana(x: Float32Array, ini: number, fin: number): Ventana {
  let pico = 0;
  let suma = 0;
  let sumaDif = 0;
  for (let i = ini; i < fin; i++) {
    const v = x[i];
    const a = Math.abs(v);
    if (a > pico) pico = a;
    suma += v * v;
    if (i > ini) {
      const d = v - x[i - 1];
      sumaDif += d * d;
    }
  }
  const n = fin - ini;
  const rms = Math.sqrt(suma / n);
  const rmsDif = Math.sqrt(sumaDif / n);
  return { rmsDb: aDb(rms), picoDb: aDb(pico), brillo: rms > 1e-6 ? rmsDif / rms : 0 };
}

export function useDetectorAplausos({ nivelMinDb, brilloMin, caidaMinDb, onPatron }: Opciones) {
  const [estado, setEstado] = useState<EstadoEscucha>('detenido');
  const [nivelDb, setNivelDb] = useState<number>(-160);
  const [aplausos, setAplausos] = useState(0); // patrón en curso
  const [ultimoPatron, setUltimoPatron] = useState<number | null>(null);
  const [ejecutando, setEjecutando] = useState(false); // hay una acción en curso
  const [recientes, setRecientes] = useState<Candidato[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs: valores que cambian rápido sin necesidad de redibujar
  const activo = useRef(false);
  const pausado = useRef(false);
  const historial = useRef<Ventana[]>([]);
  const indice = useRef(0); // número de ventanas procesadas
  const ultimoAplauso = useRef(-1000); // índice de la ventana del último aplauso
  const contador = useRef(0);
  const timerReanudar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nivelMinRef = useRef(nivelMinDb);
  const brilloMinRef = useRef(brilloMin);
  const caidaMinRef = useRef(caidaMinDb);
  const onPatronRef = useRef(onPatron);
  nivelMinRef.current = nivelMinDb;
  brilloMinRef.current = brilloMin;
  caidaMinRef.current = caidaMinDb;
  onPatronRef.current = onPatron;

  const limpiarTimerReanudar = () => {
    if (timerReanudar.current) clearTimeout(timerReanudar.current);
    timerReanudar.current = null;
  };

  // Vuelve a escuchar después de que terminó la acción
  const programarReanudar = (ms: number) => {
    limpiarTimerReanudar();
    timerReanudar.current = setTimeout(() => {
      timerReanudar.current = null;
      historial.current = [];
      contador.current = 0;
      ultimoAplauso.current = -1000;
      pausado.current = false;
      setEjecutando(false);
    }, ms + MARGEN_REANUDAR_MS);
  };

  const cerrarPatron = () => {
    const cantidad = contador.current;
    contador.current = 0;
    setAplausos(0);
    if (cantidad === 0) return;
    setUltimoPatron(cantidad);

    // Pausamos YA la detección para que la app no se escuche a sí misma
    pausado.current = true;
    setEjecutando(true);

    let resultado: ResultadoPatron;
    try {
      resultado = onPatronRef.current?.(cantidad);
    } catch {
      resultado = 0;
    }
    Promise.resolve(resultado)
      .catch(() => 0)
      .then((ms) => programarReanudar(typeof ms === 'number' ? ms : 0));
  };

  // Decide si el sonido que arrancó hace 60 ms fue un aplauso
  const evaluar = () => {
    const h = historial.current;
    const p = h.length - 1 - RETRASO; // ventana candidata
    const idxCand = indice.current - RETRASO;

    // Ruido de fondo: la ventana más baja justo antes del sonido
    let fondo = Infinity;
    for (let q = p - 8; q <= p - 2; q++) fondo = Math.min(fondo, h[q].rmsDb);

    const salto = h[p].rmsDb - fondo;
    const saltoPrevio = h[p - 1].rmsDb - fondo;
    // Solo nos interesa el instante en que el sonido arranca de golpe
    if (salto < SALTO_DB || saltoPrevio >= SALTO_DB) return;
    if (h[p].rmsDb < PISO_REPORTE_DB) return;
    if (idxCand - ultimoAplauso.current < REFRACTARIO) return;

    // Ventana más fuerte del arranque (un aplauso dura ~30 ms)
    let fuerte = h[p];
    for (let q = p + 1; q <= p + 2; q++) {
      if (h[q].rmsDb > fuerte.rmsDb) fuerte = h[q];
    }
    // Brillo: el mayor entre las ventanas del arranque cercanas al pico
    let brillo = 0;
    for (let q = p; q <= p + 2; q++) {
      if (h[q].rmsDb >= fuerte.rmsDb - MARGEN_BRILLO_DB && h[q].brillo > brillo) {
        brillo = h[q].brillo;
      }
    }
    const caida = fuerte.rmsDb - h[h.length - 1].rmsDb;

    let motivo: MotivoRechazo | null = null;
    if (fuerte.rmsDb < nivelMinRef.current) motivo = 'nivel';
    else if (brillo < brilloMinRef.current) motivo = 'brillo';
    else if (caida < caidaMinRef.current) motivo = 'caida';

    const candidato: Candidato = {
      id: idxCand,
      aceptado: motivo === null,
      salto,
      nivel: fuerte.rmsDb,
      brillo,
      caida,
      motivo,
    };
    setRecientes((prev) => [candidato, ...prev].slice(0, 8));

    if (motivo === null) {
      ultimoAplauso.current = idxCand;
      contador.current += 1;
      setAplausos(contador.current);
    }
  };

  const procesarVentana = (v: Ventana) => {
    if (pausado.current) return; // mientras suena una acción, no analizamos
    const h = historial.current;
    h.push(v);
    if (h.length > HISTORIAL) h.shift();
    indice.current += 1;

    if (h.length === HISTORIAL) evaluar();

    // Si pasó la ventana de cierre sin otro aplauso, cerramos el patrón
    if (contador.current > 0 && indice.current - ultimoAplauso.current >= CIERRE_VENTANAS) {
      cerrarPatron();
    }
  };

  const { stream } = useAudioStream({
    channels: 1,
    encoding: 'float32',
    onBuffer: (buffer) => {
      if (!activo.current) return;
      try {
        const x = aMono(buffer.data, buffer.channels);
        const n = x.length;
        if (n === 0) return;

        // Partimos el buffer en ventanas de ~10 ms
        const tam = Math.round((buffer.sampleRate * VENTANA_MS) / 1000);
        const cantidad = Math.max(1, Math.round(n / tam));
        const paso = Math.floor(n / cantidad);

        let picoBuffer = -160;
        for (let k = 0; k < cantidad; k++) {
          const ini = k * paso;
          const fin = k === cantidad - 1 ? n : ini + paso;
          const ventana = analizarVentana(x, ini, fin);
          if (ventana.picoDb > picoBuffer) picoBuffer = ventana.picoDb;
          procesarVentana(ventana);
        }
        setNivelDb(picoBuffer);
      } catch {
        setError('Error al analizar el audio del micrófono.');
      }
    },
  });

  const iniciar = useCallback(async () => {
    if (activo.current) return;
    setError(null);
    try {
      const permiso = await requestRecordingPermissionsAsync();
      if (!permiso.granted) {
        setEstado('sin_permiso');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      historial.current = [];
      indice.current = 0;
      ultimoAplauso.current = -1000;
      contador.current = 0;
      pausado.current = false;
      setAplausos(0);
      setEjecutando(false);
      setRecientes([]);

      activo.current = true;
      await stream.start();
      setEstado('escuchando');
    } catch {
      activo.current = false;
      setEstado('error');
      setError('No se pudo activar el micrófono. Cierra otras apps que lo usen e inténtalo de nuevo.');
    }
  }, [stream]);

  const detener = useCallback(() => {
    activo.current = false;
    pausado.current = false;
    limpiarTimerReanudar();
    try {
      stream.stop();
    } catch {
      // si ya estaba detenido, no pasa nada
    }
    contador.current = 0;
    setAplausos(0);
    setEjecutando(false);
    setNivelDb(-160);
    setEstado('detenido');
  }, [stream]);

  const limpiarRecientes = useCallback(() => setRecientes([]), []);

  // Al salir de la pantalla, liberamos el micrófono
  useEffect(() => {
    return () => {
      activo.current = false;
      limpiarTimerReanudar();
      try {
        stream.stop();
      } catch {
        // ya estaba detenido
      }
    };
  }, [stream]);

  return {
    estado,
    nivelDb,
    aplausos,
    ultimoPatron,
    ejecutando,
    recientes,
    error,
    iniciar,
    detener,
    limpiarRecientes,
  };
}