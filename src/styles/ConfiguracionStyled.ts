import styled from 'styled-components/native';
import { CameraView } from 'expo-camera';

const COLOR = {
  texto: '#1d1d1f',
  suave: '#555555',
  rojo: '#d62828',
  azul: '#2563eb',
  tarjeta: '#f4f6fb',
  borde: '#c9d1e0',
};

// El fondo cambia con la prueba de "Cambiar color"
export const Contenedor = styled.ScrollView.attrs({
  contentContainerStyle: { padding: 24, gap: 16 },
})<{ $fondo: string }>`
  flex: 1;
  background-color: ${({ $fondo }) => $fondo};
`;

// Cámara diminuta e invisible: solo existe para poder encender la linterna
export const CamaraOculta = styled(CameraView)`
  position: absolute;
  width: 2px;
  height: 2px;
  opacity: 0;
`;

export const Titulo = styled.Text`
  font-size: 20px;
  font-weight: 700;
  color: ${COLOR.texto};
`;

export const Descripcion = styled.Text`
  font-size: 15px;
  color: ${COLOR.suave};
`;

export const Tarjeta = styled.View`
  padding: 14px;
  border-radius: 12px;
  gap: 8px;
  background-color: ${COLOR.tarjeta};
`;

export const FilaTarjeta = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const NombrePatron = styled.Text`
  font-size: 17px;
  font-weight: 700;
  color: ${COLOR.texto};
`;

export const CajaSelector = styled.View`
  border-width: 1px;
  border-color: ${COLOR.borde};
  border-radius: 8px;
  background-color: #ffffff;
  overflow: hidden;
`;

export const BotonProbar = styled.TouchableOpacity`
  padding: 8px 16px;
  border-radius: 8px;
  background-color: ${COLOR.azul};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const BotonProbarTexto = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;

export const FilaOpciones = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const BotonOpcion = styled.TouchableOpacity<{ $activo: boolean }>`
  flex: 1;
  padding: 12px;
  align-items: center;
  border-radius: 10px;
  border-width: 2px;
  border-color: ${COLOR.azul};
  background-color: ${({ $activo }) => ($activo ? COLOR.azul : 'transparent')};
`;

export const BotonOpcionTexto = styled.Text<{ $activo: boolean }>`
  font-weight: 700;
  color: ${({ $activo }) => ($activo ? '#ffffff' : COLOR.azul)};
`;

// Sección del mensaje de voz
export const FilaVoz = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

export const BotonVoz = styled.TouchableOpacity<{ $peligro?: boolean }>`
  padding: 12px 16px;
  border-radius: 10px;
  background-color: ${({ $peligro }) => ($peligro ? COLOR.rojo : COLOR.azul)};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const BotonVozTexto = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;

export const TextoError = styled.Text`
  color: ${COLOR.rojo};
  font-size: 15px;
`;