import styled from 'styled-components/native';
import { CameraView } from 'expo-camera';
import { tema } from './tema';

const C = tema.colores;

const vidrio = `
  background-color: ${C.cristal};
  border-width: 1.5px;
  border-color: ${C.cristalBorde};
  shadow-color: #6FA8A0;
  shadow-opacity: 0.16;
  shadow-radius: 20px;
  shadow-offset: 0px 8px;
  elevation: 3;
`;

export const Raiz = styled.View`
  flex: 1;
`;

// Capa de color para la prueba de "Cambiar color": tiñe el fondo sin taparlo
export const Tinte = styled.View<{ $color: string }>`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: ${({ $color }) => $color};
  opacity: 0.35;
`;

export const Contenedor = styled.ScrollView.attrs({
  contentContainerStyle: { padding: 24, paddingBottom: 56, gap: 16 },
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

export const Titulo = styled.Text`
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
  color: ${C.texto};
`;

export const Descripcion = styled.Text`
  font-size: 15px;
  line-height: 22px;
  color: ${C.textoSuave};
`;

export const Tarjeta = styled.View`
  ${vidrio}
  padding: 16px;
  border-radius: ${tema.radio.tarjeta}px;
  gap: 12px;
`;

export const FilaTarjeta = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const NombrePatron = styled.Text`
  font-size: 18px;
  font-weight: 800;
  color: ${C.texto};
`;

export const CajaSelector = styled.View`
  border-width: 1.5px;
  border-color: ${C.cristalBorde};
  border-radius: ${tema.radio.boton}px;
  background-color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
`;

export const BotonProbar = styled.TouchableOpacity`
  padding: 9px 20px;
  border-radius: ${tema.radio.chip}px;
  background-color: ${C.mentaOscuro};
  shadow-color: ${C.mentaOscuro};
  shadow-opacity: 0.3;
  shadow-radius: 10px;
  shadow-offset: 0px 5px;
  elevation: 4;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const BotonProbarTexto = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;

// Selector segmentado de sensibilidad (Baja, Media, Alta)
export const FilaOpciones = styled.View`
  flex-direction: row;
  gap: 8px;
  padding: 6px;
  border-radius: ${tema.radio.chip}px;
  background-color: rgba(255, 255, 255, 0.55);
  border-width: 1.5px;
  border-color: ${C.cristalBorde};
`;

export const BotonOpcion = styled.TouchableOpacity<{ $activo: boolean }>`
  flex: 1;
  padding: 12px;
  align-items: center;
  border-radius: ${tema.radio.chip}px;
  background-color: ${({ $activo }) => ($activo ? C.mentaOscuro : 'transparent')};
  shadow-color: ${C.mentaOscuro};
  shadow-opacity: ${({ $activo }) => ($activo ? 0.3 : 0)};
  shadow-radius: 10px;
  shadow-offset: 0px 5px;
  elevation: ${({ $activo }) => ($activo ? 4 : 0)};
`;

export const BotonOpcionTexto = styled.Text<{ $activo: boolean }>`
  font-weight: 700;
  font-size: 15px;
  color: ${({ $activo }) => ($activo ? '#ffffff' : C.textoSuave)};
`;

// Sección del mensaje de voz
export const FilaVoz = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`;

export const BotonVoz = styled.TouchableOpacity<{ $peligro?: boolean }>`
  padding: 13px 18px;
  border-radius: ${tema.radio.boton}px;
  background-color: ${({ $peligro }) => ($peligro ? C.peligro : C.mentaOscuro)};
  shadow-color: ${({ $peligro }) => ($peligro ? C.peligro : C.mentaOscuro)};
  shadow-opacity: 0.28;
  shadow-radius: 12px;
  shadow-offset: 0px 6px;
  elevation: 4;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const BotonVozTexto = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;

export const TextoError = styled.Text`
  color: #c7364f;
  font-size: 15px;
`;