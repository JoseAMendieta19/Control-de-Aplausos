import styled from 'styled-components/native';
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

export const Contenedor = styled.View`
  flex: 1;
`;

// Fila horizontal de filtros (Todas, Vibrar, Alarma...)
export const BarraFiltros = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
  contentContainerStyle: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
})`
  flex-grow: 0;
`;

export const Filtro = styled.TouchableOpacity<{ $activo: boolean }>`
  padding: 10px 16px;
  border-radius: ${tema.radio.chip}px;
  border-width: 1.5px;
  border-color: ${({ $activo }) => ($activo ? C.mentaOscuro : C.cristalBorde)};
  background-color: ${({ $activo }) => ($activo ? C.mentaOscuro : 'rgba(255,255,255,0.65)')};
  shadow-color: ${C.mentaOscuro};
  shadow-opacity: ${({ $activo }) => ($activo ? 0.3 : 0)};
  shadow-radius: 12px;
  shadow-offset: 0px 6px;
  elevation: ${({ $activo }) => ($activo ? 5 : 0)};
`;

export const FiltroTexto = styled.Text<{ $activo: boolean }>`
  font-weight: 700;
  font-size: 15px;
  color: ${({ $activo }) => ($activo ? '#ffffff' : C.textoSuave)};
`;

// Cada celda ocupa 100% (vertical) o 50% (horizontal) del ancho
export const Celda = styled.View<{ $columnas: number }>`
  width: ${({ $columnas }) => 100 / $columnas}%;
  padding: 6px;
`;

export const Tarjeta = styled.View`
  ${vidrio}
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: ${tema.radio.tarjeta}px;
`;

export const Icono = styled.View<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $color }) => `${$color}33`};
  border-width: 1.5px;
  border-color: ${({ $color }) => `${$color}88`};
`;

export const IconoTexto = styled.Text`
  font-size: 26px;
`;

export const Info = styled.View`
  flex: 1;
  gap: 2px;
`;

export const Accion = styled.Text`
  font-size: 18px;
  font-weight: 800;
  color: ${C.texto};
`;

export const Detalle = styled.Text`
  font-size: 14px;
  color: ${C.textoSuave};
`;

export const BotonEliminar = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 14px;
  background-color: rgba(229, 86, 109, 0.1);
  border-width: 1.5px;
  border-color: rgba(229, 86, 109, 0.35);
`;

export const BotonEliminarTexto = styled.Text`
  color: ${C.peligro};
  font-weight: 700;
  font-size: 13px;
`;

export const Vacio = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 16px;
`;

export const VacioIcono = styled.Text`
  width: 96px;
  height: 96px;
  line-height: 96px;
  text-align: center;
  font-size: 42px;
  border-radius: 48px;
  overflow: hidden;
  background-color: ${C.cristal};
  border-width: 1.5px;
  border-color: ${C.cristalBorde};
`;

export const TextoVacio = styled.Text`
  font-size: 16px;
  text-align: center;
  color: ${C.textoSuave};
`;

export const TextoError = styled.Text`
  color: #c7364f;
  font-size: 15px;
  text-align: center;
  padding: 12px;
`;

export const Pie = styled.View`
  ${vidrio}
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top-left-radius: ${tema.radio.tarjeta}px;
  border-top-right-radius: ${tema.radio.tarjeta}px;
`;

export const Total = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: ${C.textoSuave};
`;

export const BotonBorrarTodo = styled.TouchableOpacity`
  padding: 12px 18px;
  border-radius: ${tema.radio.boton}px;
  background-color: ${C.peligro};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
`;

export const BotonBorrarTodoTexto = styled.Text`
  color: #ffffff;
  font-weight: 700;
`;