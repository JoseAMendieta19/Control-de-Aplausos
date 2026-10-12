import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { obtenerAjustes } from '../database/ajustesRepo';
import { obtenerConfiguracion } from '../database/configuracionRepo';
import { registrarHistorial } from '../database/historialRepo';
import { useDetectorAplausos } from '../hooks/useDetectorAplausos';
import { detenerSonidos, ejecutarAccion } from '../services/acciones';
import type { AccionConfig, PantallaProps, Patron, Sensibilidad } from '../types';
import { nivelAPorcentaje } from '../utils/audio';
import {
  COLORES_PANTALLA,
  CONFIG_POR_DEFECTO,
  NOMBRE_ACCION,
  PERFILES_SENSIBILIDAD,
} from '../utils/constantes';
import * as S from '../styles/InicioStyled';

export default function InicioScreen({ navigation }: PantallaProps<'Inicio'>) {
  const [permisoCamara, pedirPermisoCamara] = useCameraPermissions();
  const [config, setConfig] = useState<Record<Patron, AccionConfig>>(CONFIG_POR_DEFECTO);
  const [sensibilidad, setSensibilidad] = useState<Sensibilidad>('media');
  const [rutaMensajeVoz, setRutaMensajeVoz] = useState<string | null>(null);
  const [linterna, setLinterna] = useState(false);
  const [camaraLista, setCamaraLista] = useState(false);
  const [indiceColor, setIndiceColor] = useState(0);
  const [ultimaAccion, setUltimaAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Se llama cuando se cierra un patrón; devuelve cuánto debe esperar el detector
  const manejarPatron = async (cantidad: number): Promise<number> => {
    setAviso(null);
    const textoCantidad = `${cantidad} ${cantidad === 1 ? 'aplauso' : 'aplausos'}`;

    if (cantidad > 5) {
      setAviso(`Se detectaron ${cantidad} aplausos. Solo se aceptan patrones de 1 a 5.`);
      return 0;
    }

    const accion = config[cantidad as Patron];
    if (accion === 'ninguna') {
      setAviso(`El patrón de ${textoCantidad} no tiene acción asignada.`);
      return 0;
    }

    const resultado = await ejecutarAccion(
      accion,
      {
        alternarLinterna: async () => {
          if (!permisoCamara?.granted) return false;
          setLinterna((encendida) => !encendida);
          return true;
        },
        siguienteColor: () => setIndiceColor((i) => (i + 1) % COLORES_PANTALLA.length),
      },
      rutaMensajeVoz
    );

    if (resultado.ok) {
      setUltimaAccion(`${textoCantidad} → ${NOMBRE_ACCION[accion]}`);
      registrarHistorial(cantidad, accion).catch(() =>
        setAviso('La acción se ejecutó, pero no se pudo guardar en el historial.')
      );
    } else if (resultado.mensaje) {
      setAviso(resultado.mensaje);
    }

    // Si la acción dura un rato (mensaje de voz), el detector espera a que termine
    if (resultado.terminada) {
      const bien = await resultado.terminada;
      if (!bien) {
        setAviso('No se pudo reproducir el mensaje de voz. Vuelve a grabarlo en Configuración.');
      }
      return 0;
    }
    return resultado.pausaMs;
  };

  const { estado, nivelDb, aplausos, ultimoPatron, ejecutando, error, iniciar, detener } =
    useDetectorAplausos({ ...PERFILES_SENSIBILIDAD[sensibilidad], onPatron: manejarPatron });

  const escuchando = estado === 'escuchando';

  // Pide el permiso de cámara ANTES de escuchar (un cuadro de permisos interrumpiría el micrófono)
  const activar = async () => {
    setAviso(null);
    if (!permisoCamara?.granted && permisoCamara?.canAskAgain !== false) {
      await pedirPermisoCamara();
    }
    await iniciar();
  };

  // Cada vez que se entra a esta pantalla, se lee la configuración guardada
  useFocusEffect(
    useCallback(() => {
      let vigente = true;
      (async () => {
        try {
          const [cfg, ajustes] = await Promise.all([obtenerConfiguracion(), obtenerAjustes()]);
          if (!vigente) return;
          setConfig(cfg);
          setSensibilidad(ajustes.sensibilidad);
          setRutaMensajeVoz(ajustes.ruta_mensaje_voz);
        } catch {
          if (vigente) {
            setAviso('No se pudo leer la configuración guardada. Se usan los valores por defecto.');
          }
        }
      })();
      return () => {
        vigente = false;
      };
    }, [])
  );

  // Al salir de esta pantalla se libera todo: micrófono, sonidos y linterna
  useFocusEffect(
    useCallback(() => {
      return () => {
        detener();
        detenerSonidos();
        setLinterna(false);
      };
    }, [detener])
  );

  // Mantiene la pantalla encendida solo mientras escucha
  useEffect(() => {
    if (!escuchando) return;
    activateKeepAwakeAsync('escucha').catch(() => {});
    return () => {
      deactivateKeepAwake('escucha');
    };
  }, [escuchando]);

  // Al apagar la linterna se desmonta la cámara y se reinicia su estado
  useEffect(() => {
    if (!linterna) setCamaraLista(false);
  }, [linterna]);

  const textoUltimo = ultimoPatron
    ? `${ultimoPatron} ${ultimoPatron === 1 ? 'aplauso' : 'aplausos'}`
    : 'ninguno todavía';

  return (
    <>
      <S.Contenedor $fondo={COLORES_PANTALLA[indiceColor]}>
        <S.Estado $activo={escuchando}>
          {ejecutando ? 'Ejecutando acción…' : escuchando ? 'Escuchando' : 'Detenido'}
        </S.Estado>

        <S.BarraFondo>
          <S.BarraNivel $porcentaje={nivelAPorcentaje(nivelDb)} />
        </S.BarraFondo>

        <S.Dato>Aplausos del patrón en curso</S.Dato>
        <S.Contador>{aplausos}</S.Contador>
        <S.Dato>Último patrón: {textoUltimo}</S.Dato>
        <S.Dato>Última acción: {ultimaAccion ?? 'ninguna todavía'}</S.Dato>

        <S.BotonPrincipal $activo={escuchando} onPress={escuchando ? detener : activar}>
          <S.BotonTexto>{escuchando ? 'Detener escucha' : 'Activar escucha'}</S.BotonTexto>
        </S.BotonPrincipal>

        <S.FilaBotones>
          <S.BotonSecundario onPress={() => navigation.navigate('Configuracion')}>
            <S.BotonSecundarioTexto>Configuración</S.BotonSecundarioTexto>
          </S.BotonSecundario>
          <S.BotonSecundario onPress={() => navigation.navigate('Historial')}>
            <S.BotonSecundarioTexto>Historial</S.BotonSecundarioTexto>
          </S.BotonSecundario>
        </S.FilaBotones>

        {estado === 'sin_permiso' && (
          <S.Aviso>
            <S.TextoError>
              Sin permiso de micrófono. La app lo necesita para contar aplausos. Actívalo en los
              ajustes del teléfono.
            </S.TextoError>
            <S.BotonSecundario onPress={() => Linking.openSettings()}>
              <S.BotonSecundarioTexto>Abrir ajustes</S.BotonSecundarioTexto>
            </S.BotonSecundario>
          </S.Aviso>
        )}

        {aviso && <S.TextoError>{aviso}</S.TextoError>}
        {error && <S.TextoError>{error}</S.TextoError>}
      </S.Contenedor>

      {linterna && (
        <S.CamaraOculta
          facing="back"
          enableTorch={camaraLista}
          onCameraReady={() => setCamaraLista(true)}
          onMountError={() => {
            setLinterna(false);
            setAviso('No se pudo abrir la cámara para la linterna.');
          }}
        />
      )}
    </>
  );
}