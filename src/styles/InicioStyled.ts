import styled from 'styled-components/native';
import { CameraView } from 'expo-camera';
import { tema } from './tema';

const C = tema.colores;

const vidrio = `
  background-color: ${C.cristal};
  border-width: 1.5px;
  border-color: ${C.cristalBorde};
  shadow-color: #6FA8A0;
  shadow-opacity: 0.18;
  shadow-radius: 24px;
  shadow-offset: 0px 10px;
  elevation: 4;
`;

export const Raiz = styled.View`
  flex: 1;
`;

// Capa de color para la acción "Cambiar color": tiñe el fondo sin taparlo
export const Tinte = styled.View.attrs({ pointerEvents: 'none' })<{ $color: string }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${({ $color }) => $color};
  opacity: 0.35;
`;

export const Contenedor = styled.ScrollView.attrs({
  contentContainerStyle: { padding: 24, paddingBottom: 48, gap: 18 },
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
`;

// Cámara diminuta e invisible: solo existe para poder encender la linterna
export const CamaraOculta = styled(CameraView)`
  position: absolute;
  width: 2px;
  height: 2px;
  opacity: 0;
`;

export const Estado = styled.Text<{ $activo: boolean }>`
  align-self: center;
  overflow: hidden;
  padding: 8px 22px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: ${({ $activo }) => ($activo ? C.mentaOscuro : C.textoSuave)};
  background-color: ${({ $activo }) =>
    $activo ? 'rgba(127,209,185,0.3)' : 'rgba(255,255,255,0.75)'};
`;

// export const BarraFondo = styled.View`
//   height: 14px;
//   border-radius: 999px;
//   overflow: hidden;
//   background-color: rgba(255, 255, 255, 0.75);
//   border-width: 1.5px;
//   border-color: ${C.cristalBorde};
// `;

// export const BarraNivel = styled.View<{ $porcentaje: number }>`
//   height: 100%;
//   border-radius: 999px;
//   background-color: ${C.mentaOscuro};
//   width: ${({ $porcentaje }) => $porcentaje}%;
// `;

export const Tarjeta = styled.View`
  ${vidrio}
  padding: 18px;
  border-radius: ${tema.radio.tarjeta}px;
  gap: 8px;
`;

export const Dato = styled.Text`
  font-size: 15px;
  text-align: center;
  color: ${C.textoSuave};
`;

export const Contador = styled.Text`
  font-size: 72px;
  font-weight: 800;
  text-align: center;
  color: ${C.texto};
`;

export const BotonPrincipal = styled.TouchableOpacity<{ $activo: boolean }>`
  padding: 20px;
  border-radius: ${tema.radio.boton + 4}px;
  align-items: center;
  background-color: ${({ $activo }) => ($activo ? C.peligro : C.mentaOscuro)};
  shadow-color: ${({ $activo }) => ($activo ? C.peligro : C.mentaOscuro)};
  shadow-opacity: 0.35;
  shadow-radius: 18px;
  shadow-offset: 0px 10px;
  elevation: 8;
`;

export const BotonTexto = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
`;

export const FilaBotones = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const BotonSecundario = styled.TouchableOpacity`
  ${vidrio}
  flex: 1;
  padding: 16px;
  border-radius: ${tema.radio.boton}px;
  align-items: center;
`;

export const BotonSecundarioTexto = styled.Text`
  color: ${C.mentaOscuro};
  font-size: 16px;
  font-weight: 700;
`;

export const Aviso = styled.View`
  gap: 10px;
  padding: 16px;
  border-radius: ${tema.radio.boton}px;
  background-color: rgba(229, 86, 109, 0.12);
  border-width: 1.5px;
  border-color: rgba(229, 86, 109, 0.28);
`;

export const TextoError = styled.Text`
  color: #c7364f;
  font-size: 15px;
  text-align: center;
`;