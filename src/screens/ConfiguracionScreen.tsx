import { useCallback, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { guardarSensibilidad, obtenerAjustes } from '../database/ajustesRepo';
import { guardarAccionPatron, obtenerConfiguracion } from '../database/configuracionRepo';
import { useCalibracion } from '../hooks/useCalibracion';
import { MAX_SEGUNDOS, useMensajeVoz } from '../hooks/useMensajeVoz';
import { detenerSonidos, ejecutarAccion } from '../services/acciones';
import type { AccionConfig, Patron, Sensibilidad } from '../types';
import { describirFondo } from '../utils/calibracion';
import {
  COLORES_PANTALLA,
  CONFIG_POR_DEFECTO,
  LISTA_ACCIONES,
  NOMBRE_ACCION,
  PATRONES,
} from '../utils/constantes';
import * as S from '../styles/ConfiguracionStyled';

const OPCIONES: AccionConfig[] = ['ninguna', ...LISTA_ACCIONES];
const SENSIBILIDADES: Sensibilidad[] = ['baja', 'media', 'alta'];
const DESCRIPCION_SENSIBILIDAD: Record<Sensibilidad, string> = {
  baja: 'Solo detecta aplausos fuertes y cercanos. Útil en lugares ruidosos.',
  media: 'Recomendada para uso normal.',
  alta: 'Detecta aplausos suaves o lejanos, pero puede confundir otros sonidos.',
};
// En iPhone el selector es una rueda muy alta, la reducimos
const ESTILO_SELECTOR = Platform.OS === 'ios' ? { height: 120 } : undefined;

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

export default function ConfiguracionScreen() {
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [config, setConfig] = useState<Record<Patron, AccionConfig>>(CONFIG_POR_DEFECTO);
  const [sensibilidad, setSensibilidad] = useState<Sensibilidad>('media');
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [linterna, setLinterna] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const [indiceColor, setIndiceColor] = useState(0);
  const [versionSelectores, setVersionSelectores] = useState(0); // fuerza a redibujar los selectores

  // Si se borra el mensaje de voz, la base quita esa acción de los patrones: volvemos a leerlos
  const voz = useMensajeVoz(() => {
    obtenerConfiguracion()
      .then(setConfig)
      .catch(() => {});
  });
  const cal = useCalibracion();

  const libre = voz.estado === 'libre';
  const midiendo = cal.estado === 'midiendo';
  const puedeVoz = libre && !midiendo; // grabar o escuchar no se mezcla con la calibración
  const resultadoCal = cal.resultado;

  // Al entrar se lee lo guardado; al salir se corta cualquier sonido o linterna de prueba
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      (async () => {
        try {
          const [cfg, ajustes] = await Promise.all([obtenerConfiguracion(), obtenerAjustes()]);
          if (!vigente) return;
          setConfig(cfg);
          setSensibilidad(ajustes.sensibilidad);
          setErrorCarga(null);
        } catch {
          if (vigente) setErrorCarga('No se pudo leer la configuración guardada.');
        } finally {
          if (vigente) setCargando(false);
        }
      })();
      return () => {
        vigente = false;
        detenerSonidos();
        setLinterna(false);
        setCamaraLista(false);
      };
    }, [])
  );

  // Texto de cada opción del selector, avisando si ya está en uso
  const etiqueta = (accion: AccionConfig, patronActual: Patron): string => {
    if (accion === 'ninguna') return NOMBRE_ACCION.ninguna;
    const otro = PATRONES.find((p) => p !== patronActual && config[p] === accion);
    if (otro) return `${NOMBRE_ACCION[accion]} (usada en ${otro})`;
    if (accion === 'mensaje_voz' && !voz.ruta) return 'Mensaje de voz (sin grabar)';
    return NOMBRE_ACCION[accion];
  };

  const cambiarAccion = async (patron: Patron, accion: AccionConfig) => {
    if (accion === config[patron]) return; // el selector también avisa al cargar
    try {
      const resultado = await guardarAccionPatron(patron, accion);
      if (!resultado.ok) {
        Alert.alert('No se puede asignar', resultado.mensaje);
        setVersionSelectores((v) => v + 1); // el selector vuelve al valor anterior
        return;
      }
      setConfig((prev) => ({ ...prev, [patron]: accion }));
    } catch {
      Alert.alert('Error', 'No se pudo guardar el cambio. Inténtalo de nuevo.');
      setVersionSelectores((v) => v + 1);
    }
  };

  const cambiarSensibilidad = async (nueva: Sensibilidad) => {
    if (nueva === sensibilidad) return;
    try {
      await guardarSensibilidad(nueva);
      setSensibilidad(nueva);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la sensibilidad. Inténtalo de nuevo.');
    }
  };

  const probar = async (patron: Patron) => {
    const accion = config[patron];
    if (accion === 'ninguna') return;

    if (accion === 'linterna' && !permisoCamara?.granted) {
      const respuesta = await pedirPermisoCamara();
      if (!respuesta.granted) {
        Alert.alert(
          'Permiso necesario',
          'La linterna necesita el permiso de la cámara. Actívalo en los ajustes del teléfono.'
        );
        return;
      }
    }

    const resultado = await ejecutarAccion(
      accion,
      {
        alternarLinterna: async () => {
          setLinterna((encendida) => {
            if (encendida) setCamaraLista(false);
            return !encendida;
          });
          return true;
        },
        siguienteColor: () => setIndiceColor((i) => (i + 1) % COLORES_PANTALLA.length),
      },
      voz.ruta
    );
    if (!resultado.ok && resultado.mensaje) Alert.alert('No se pudo probar', resultado.mensaje);
  };

  const empezarGrabacion = () => {
    detenerSonidos(); // corta cualquier prueba que esté sonando
    voz.grabar();
  };

  const confirmarBorrarVoz = () => {
    const asignada = PATRONES.some((p) => config[p] === 'mensaje_voz');
    Alert.alert(
      'Borrar mensaje de voz',
      `¿Borrar tu mensaje grabado?${asignada ? ' También se quitará del patrón donde está asignado.' : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => voz.borrar() },
      ]
    );
  };

  const empezarCalibracion = () => {
    detenerSonidos(); // cualquier sonido de prueba ensuciaría la medición
    setLinterna(false);
    cal.calibrar();
  };

  return (
    <>
      <S.Contenedor $fondo={COLORES_PANTALLA[indiceColor]}>
        <S.Titulo>Acción de cada patrón</S.Titulo>
        <S.Descripcion>
          Elige qué hace el teléfono según los aplausos. No se puede repetir una acción. Usa
          "Probar" para comprobarla.
        </S.Descripcion>

        {cargando && <S.Descripcion>Cargando…</S.Descripcion>}
        {errorCarga && <S.TextoError>{errorCarga}</S.TextoError>}

        {!cargando &&
          PATRONES.map((patron) => (
            <S.Tarjeta key={patron}>
              <S.FilaTarjeta>
                <S.NombrePatron>
                  {patron} {patron === 1 ? 'aplauso' : 'aplausos'}
                </S.NombrePatron>
                <S.BotonProbar
                  disabled={config[patron] === 'ninguna' || voz.estado === 'grabando' || midiendo}
                  onPress={() => probar(patron)}
                >
                  <S.BotonProbarTexto>Probar</S.BotonProbarTexto>
                </S.BotonProbar>
              </S.FilaTarjeta>

              <S.CajaSelector>
                <Picker<AccionConfig>
                  key={`${patron}-${versionSelectores}`}
                  selectedValue={config[patron]}
                  mode="dropdown"
                  style={ESTILO_SELECTOR}
                  onValueChange={(valor) => cambiarAccion(patron, valor)}
                >
                  {OPCIONES.map((accion) => (
                    <Picker.Item key={accion} label={etiqueta(accion, patron)} value={accion} />
                  ))}
                </Picker>
              </S.CajaSelector>
            </S.Tarjeta>
          ))}

        {!cargando && (
          <>
            <S.Titulo>Sensibilidad</S.Titulo>
            <S.FilaOpciones>
              {SENSIBILIDADES.map((nivel) => (
                <S.BotonOpcion
                  key={nivel}
                  $activo={sensibilidad === nivel}
                  onPress={() => cambiarSensibilidad(nivel)}
                >
                  <S.BotonOpcionTexto $activo={sensibilidad === nivel}>
                    {capitalizar(nivel)}
                  </S.BotonOpcionTexto>
                </S.BotonOpcion>
              ))}
            </S.FilaOpciones>
            <S.Descripcion>{DESCRIPCION_SENSIBILIDAD[sensibilidad]}</S.Descripcion>

            <S.Titulo>Calibración</S.Titulo>
            <S.Descripcion>
              Mide el ruido del lugar durante 3 segundos y propone una sensibilidad. Quédate en
              silencio mientras mide.
            </S.Descripcion>
            <S.FilaVoz>
              <S.BotonVoz disabled={midiendo || !libre} onPress={empezarCalibracion}>
                <S.BotonVozTexto>
                  {midiendo ? `Midiendo… ${Math.round(cal.progreso * 100)}%` : 'Calibrar'}
                </S.BotonVozTexto>
              </S.BotonVoz>
            </S.FilaVoz>

            {cal.error && <S.TextoError>{cal.error}</S.TextoError>}
            {cal.sinPermiso && (
              <>
                <S.TextoError>
                  Sin permiso de micrófono. Actívalo en los ajustes del teléfono para calibrar.
                </S.TextoError>
                <S.BotonVoz onPress={() => Linking.openSettings()}>
                  <S.BotonVozTexto>Abrir ajustes</S.BotonVozTexto>
                </S.BotonVoz>
              </>
            )}

            {resultadoCal && (
              <S.Tarjeta>
                <S.NombrePatron>
                  Ruido de fondo: {resultadoCal.fondoDb.toFixed(0)} dB (
                  {describirFondo(resultadoCal.fondoDb)})
                </S.NombrePatron>
                {resultadoCal.estable ? (
                  <>
                    <S.Descripcion>
                      Sensibilidad propuesta: {capitalizar(resultadoCal.sensibilidad)}.
                    </S.Descripcion>
                    <S.BotonVoz
                      disabled={resultadoCal.sensibilidad === sensibilidad}
                      onPress={() => cambiarSensibilidad(resultadoCal.sensibilidad)}
                    >
                      <S.BotonVozTexto>
                        {resultadoCal.sensibilidad === sensibilidad
                          ? 'Ya la tienes activa'
                          : `Aplicar ${capitalizar(resultadoCal.sensibilidad)}`}
                      </S.BotonVozTexto>
                    </S.BotonVoz>
                  </>
                ) : (
                  <S.TextoError>
                    Hubo ruidos fuertes durante la medición (pico de{' '}
                    {resultadoCal.picoDb.toFixed(0)} dB). Repite sin hablar ni aplaudir.
                  </S.TextoError>
                )}
              </S.Tarjeta>
            )}

            <S.Titulo>Mi mensaje de voz</S.Titulo>
            <S.Descripcion>
              Graba hasta {MAX_SEGUNDOS} segundos. Se reproduce cuando se activa el patrón que tenga
              asignado "Mensaje de voz".{' '}
              {voz.ruta ? 'Ya tienes un mensaje guardado.' : 'Todavía no has grabado ninguno.'}
            </S.Descripcion>

            {voz.estado === 'grabando' && (
              <S.Descripcion>
                Grabando… {voz.segundos} / {MAX_SEGUNDOS} s
              </S.Descripcion>
            )}
            {voz.estado === 'reproduciendo' && <S.Descripcion>Reproduciendo…</S.Descripcion>}

            <S.FilaVoz>
              <S.BotonVoz $peligro disabled={!puedeVoz} onPress={empezarGrabacion}>
                <S.BotonVozTexto>Grabar</S.BotonVozTexto>
              </S.BotonVoz>
              <S.BotonVoz disabled={libre} onPress={voz.detener}>
                <S.BotonVozTexto>Detener</S.BotonVozTexto>
              </S.BotonVoz>
              <S.BotonVoz disabled={!puedeVoz || !voz.ruta} onPress={voz.escuchar}>
                <S.BotonVozTexto>Escuchar</S.BotonVozTexto>
              </S.BotonVoz>
              <S.BotonVoz disabled={!puedeVoz || !voz.ruta} onPress={confirmarBorrarVoz}>
                <S.BotonVozTexto>Borrar</S.BotonVozTexto>
              </S.BotonVoz>
            </S.FilaVoz>

            {voz.mensaje && <S.Descripcion>{voz.mensaje}</S.Descripcion>}
            {voz.sinPermiso && (
              <>
                <S.TextoError>
                  Sin permiso de micrófono. Actívalo en los ajustes del teléfono para grabar.
                </S.TextoError>
                <S.BotonVoz onPress={() => Linking.openSettings()}>
                  <S.BotonVozTexto>Abrir ajustes</S.BotonVozTexto>
                </S.BotonVoz>
              </>
            )}
          </>
        )}
      </S.Contenedor>

      {linterna && (
        <S.CamaraOculta
          facing="back"
          enableTorch={camaraLista}
          onCameraReady={() => setCamaraLista(true)}
          onMountError={() => {
            setLinterna(false);
            Alert.alert('Linterna', 'No se pudo abrir la cámara para la linterna.');
          }}
        />
      )}
    </>
  );
}