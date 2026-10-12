import styled from 'styled-components/native';

const COLOR = {
  fondo: '#ffffff',
  texto: '#1d1d1f',
  suave: '#555555',
  rojo: '#d62828',
  azul: '#2563eb',
  tarjeta: '#f4f6fb',
  borde: '#e1e6f0',
};

export const Contenedor = styled.View`
  flex: 1;
  background-color: ${COLOR.fondo};
`;

// Fila horizontal de filtros (Todas, Vibrar, Alarma...)
export const BarraFiltros = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { gap: 8, padding: 12 },
})`
  flex-grow: 0;
  border-bottom-width: 1px;
  border-bottom-color: ${COLOR.borde};
`;

export const Filtro = styled.TouchableOpacity<{ $activo: boolean }>`
  padding: 8px 14px;
  border-radius: 20px;
  border-width: 2px;
  border-color: ${COLOR.azul};
  background-color: ${({ $activo }) => ($activo ? COLOR.azul : 'transparent')};
`;

export const FiltroTexto = styled.Text<{ $activo: boolean }>`
  font-weight: 700;
  color: ${({ $activo }) => ($activo ? '#ffffff' : COLOR.azul)};
`;

// Cada celda ocupa 100% (vertical) o 50% (horizontal) del ancho
export const Celda = styled.View<{ $columnas: number }>`
  width: ${({ $columnas }) => 100 / $columnas}%;
  padding: 6px;
`;

export const Tarjeta = styled.View`
  padding: 14px;
  border-radius: 12px;
  gap: 4px;
  background-color: ${COLOR.tarjeta};
`;

export const Accion = styled.Text`
  font-size: 18px;
  font-weight: 700;
  color: ${COLOR.texto};
`;

export const Detalle = styled.Text`
  font-size: 15px;
  color: ${COLOR.suave};
`;

export const BotonEliminar = styled.TouchableOpacity`
  align-self: flex-start;
  margin-top: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border-width: 2px;
  border-color: ${COLOR.rojo};
`;

export const BotonEliminarTexto = styled.Text`
  color: ${COLOR.rojo};
  font-weight: 700;
`;

export const Vacio = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const TextoVacio = styled.Text`
  font-size: 17px;
  text-align: center;
  color: ${COLOR.suave};
`;

export const TextoError = styled.Text`
  color: ${COLOR.rojo};
  font-size: 15px;
  text-align: center;
  padding: 12px;
`;

export const Pie = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top-width: 1px;
  border-top-color: ${COLOR.borde};
`;

export const Total = styled.Text`
  font-size: 15px;
  color: ${COLOR.suave};
`;

export const BotonBorrarTodo = styled.TouchableOpacity`
  padding: 10px 16px;
  border-radius: 10px;
  background-color: ${COLOR.rojo};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const BotonBorrarTodoTexto = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;