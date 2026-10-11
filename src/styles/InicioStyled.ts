import styled from 'styled-components/native';
import { CameraView } from 'expo-camera';

const COLOR = {
  texto: '#1d1d1f',
  suave: '#555555',
  verde: '#2e8b57',
  rojo: '#d62828',
  gris: '#e5e5e5',
  azul: '#2563eb',
  avisoFondo: '#fdecea',
};

// El fondo cambia con la acción "Cambiar color"
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

export const Estado = styled.Text<{ $activo: boolean }>`
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: ${({ $activo }) => ($activo ? COLOR.verde : COLOR.texto)};
`;

export const BarraFondo = styled.View`
  height: 28px;
  background-color: ${COLOR.gris};
  border-radius: 8px;
  overflow: hidden;
`;

export const BarraNivel = styled.View<{ $porcentaje: number }>`
  height: 100%;
  background-color: ${COLOR.verde};
  width: ${({ $porcentaje }) => $porcentaje}%;
`;

export const Dato = styled.Text`
  font-size: 16px;
  text-align: center;
  color: ${COLOR.suave};
`;

export const Contador = styled.Text`
  font-size: 56px;
  font-weight: 700;
  text-align: center;
  color: ${COLOR.texto};
`;

export const BotonPrincipal = styled.TouchableOpacity<{ $activo: boolean }>`
  padding: 18px;
  border-radius: 12px;
  align-items: center;
  background-color: ${({ $activo }) => ($activo ? COLOR.rojo : COLOR.verde)};
`;

export const BotonTexto = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
`;

export const FilaBotones = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const BotonSecundario = styled.TouchableOpacity`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  align-items: center;
  border-width: 2px;
  border-color: ${COLOR.azul};
`;

export const BotonSecundarioTexto = styled.Text`
  color: ${COLOR.azul};
  font-size: 16px;
  font-weight: 700;
`;

export const Aviso = styled.View`
  gap: 10px;
  padding: 14px;
  border-radius: 10px;
  background-color: ${COLOR.avisoFondo};
`;

export const TextoError = styled.Text`
  color: ${COLOR.rojo};
  font-size: 15px;
  text-align: center;
`;