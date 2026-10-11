import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import HistorialScreen from '../screens/HistorialScreen';
import InicioScreen from '../screens/InicioScreen';
import { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Inicio">
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