import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import FondoCristal from './src/components/FondoCristal';
import StackNavigator from './src/navigation/StackNavigator';

const temaNavegacion = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

export default function App() {
  return (
    <FondoCristal>
      <NavigationContainer theme={temaNavegacion}>
        <StackNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </FondoCristal>
  );
}