import { useCallback, useState } from 'react';
import { Alert, FlatList, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { estiloAccion } from '../styles/tema';
import {
  borrarTodoHistorial,
  contarHistorial,
  eliminarRegistro,
  listarHistorial,
  FiltroHistorial,
} from '../database/historialRepo';
import type { RegistroHistorial } from '../types';
import { LISTA_ACCIONES, NOMBRE_ACCION } from '../utils/constantes';
import { formatearFechaHora } from '../utils/fecha';
import * as S from '../styles/HistorialStyled';

const FILTROS: FiltroHistorial[] = ['todas', ...LISTA_ACCIONES];
const nombreFiltro = (f: FiltroHistorial) => (f === 'todas' ? 'Todas' : NOMBRE_ACCION[f]);

export default function HistorialScreen() {
  const { width, height } = useWindowDimensions();
  const columnas = width > height ? 2 : 1; // 2 columnas en modo horizontal

  const [filtro, setFiltro] = useState<FiltroHistorial>('todas');
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Se recarga al entrar a la pantalla y cada vez que cambia el filtro
  useFocusEffect(
    useCallback(() => {
      let vigente = true; // evita que una respuesta lenta pise a una más nueva
      (async () => {
        try {
          const [lista, cantidad] = await Promise.all([listarHistorial(filtro), contarHistorial()]);
          if (!vigente) return;
          setRegistros(lista);
          setTotal(cantidad);
          setError(null);
        } catch {
          if (vigente) setError('No se pudo leer el historial.');
        } finally {
          if (vigente) setCargando(false);
        }
      })();
      return () => {
        vigente = false;
      };
    }, [filtro])
  );

  const confirmarEliminar = (registro: RegistroHistorial) => {
    Alert.alert(
      'Eliminar registro',
      `¿Eliminar "${NOMBRE_ACCION[registro.accion] ?? registro.accion}" del ${formatearFechaHora(registro.fecha_hora)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarRegistro(registro.id);
              setRegistros((prev) => prev.filter((r) => r.id !== registro.id));
              setTotal((t) => Math.max(0, t - 1));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  const confirmarBorrarTodo = () => {
    Alert.alert(
      'Borrar todo el historial',
      `Se eliminarán los ${total} registros. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await borrarTodoHistorial();
              setRegistros([]);
              setTotal(0);
            } catch {
              Alert.alert('Error', 'No se pudo borrar el historial.');
            }
          },
        },
      ]
    );
  };

  const mensajeVacio = cargando
    ? 'Cargando…'
    : filtro === 'todas'
      ? 'No hay registros todavía. Activa la escucha y haz aplausos.'
      : `No hay registros de "${NOMBRE_ACCION[filtro]}".`;

  return (
    <S.Contenedor>
      <S.BarraFiltros>
        {FILTROS.map((f) => (
          <S.Filtro key={f} $activo={filtro === f} onPress={() => setFiltro(f)}>
            <S.FiltroTexto $activo={filtro === f}>
              {f === 'todas' ? '✨' : estiloAccion(nombreFiltro(f)).icono} {nombreFiltro(f)}
            </S.FiltroTexto>
          </S.Filtro>
        ))}
      </S.BarraFiltros>

      {error && <S.TextoError>{error}</S.TextoError>}

      {/* La key obliga a redibujar la lista cuando cambia el número de columnas */}
      <FlatList
        key={`lista-${columnas}`}
        data={registros}
        numColumns={columnas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <S.Vacio>
            <S.VacioIcono>👏</S.VacioIcono>
            <S.TextoVacio>{mensajeVacio}</S.TextoVacio>
          </S.Vacio>
        }
        renderItem={({ item }) => {
          const nombre = NOMBRE_ACCION[item.accion] ?? item.accion;
          const { color, icono } = estiloAccion(nombre);
          return (
            <S.Celda $columnas={columnas}>
              <S.Tarjeta>
                <S.Icono $color={color}>
                  <S.IconoTexto>{icono}</S.IconoTexto>
                </S.Icono>
                <S.Info>
                  <S.Accion>{nombre}</S.Accion>
                  <S.Detalle>
                    {item.cantidad_aplausos} {item.cantidad_aplausos === 1 ? 'aplauso' : 'aplausos'}
                  </S.Detalle>
                  <S.Detalle>{formatearFechaHora(item.fecha_hora)}</S.Detalle>
                </S.Info>
                <S.BotonEliminar onPress={() => confirmarEliminar(item)}>
                  <S.BotonEliminarTexto>Eliminar</S.BotonEliminarTexto>
                </S.BotonEliminar>
              </S.Tarjeta>
            </S.Celda>
          );
        }}
      />

      <S.Pie>
        <S.Total>
          {total} {total === 1 ? 'registro' : 'registros'} en total
        </S.Total>
        <S.BotonBorrarTodo disabled={total === 0} onPress={confirmarBorrarTodo}>
          <S.BotonBorrarTodoTexto>Borrar todo</S.BotonBorrarTodoTexto>
        </S.BotonBorrarTodo>
      </S.Pie>
    </S.Contenedor>
  );
}