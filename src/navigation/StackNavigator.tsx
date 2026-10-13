import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import HistorialScreen from '../screens/HistorialScreen';
import InicioScreen from '../screens/InicioScreen';
import { tema } from '../styles/tema';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Inicio"
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerTintColor: tema.colores.mentaOscuro,
        headerTitleAlign: 'center',
        headerTitleStyle: { color: tema.colores.texto, fontWeight: '700', fontSize: 18 },
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
      }}
    >
      <Stack.Screen name="Inicio" component={InicioScreen} options={{ title: 'ClapControl' }} />
      <Stack.Screen
        name="Configuracion"
        component={ConfiguracionScreen}
        options={{ title: 'Configuración' }}
      />
      <Stack.Screen name="Historial" component={HistorialScreen} options={{ title: 'Historial' }} />
    </Stack.Navigator>
  );
}