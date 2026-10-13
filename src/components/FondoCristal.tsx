import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { tema } from '../styles/tema';

    type EsferaProps = {
    tamano: number;
    posicion: ViewStyle;
    colores: readonly [string, string];
    };

    function Esfera({ tamano, posicion, colores }: EsferaProps) {
    return (
        <LinearGradient
        colors={colores}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.8, y: 1 }}
        style={[
            {
            position: 'absolute',
            width: tamano,
            height: tamano,
            borderRadius: tamano / 2,
            opacity: 0.75,
            },
            posicion,
        ]}
        />
    );
    }

    export default function FondoCristal({ children }: { children: ReactNode }) {
    return (
        <LinearGradient
        colors={[tema.colores.fondoInicio, tema.colores.fondoFin]}
        style={{ flex: 1 }}
        >
        <Esfera tamano={260} posicion={{ top: -70, right: -90 }} colores={['#CFF3E6', '#8FD9C0']} />
        <Esfera tamano={200} posicion={{ top: 330, left: -100 }} colores={['#D9F5EC', '#9ADFC9']} />
        <Esfera tamano={300} posicion={{ bottom: -130, right: -60 }} colores={['#C4EFE0', '#7FD1B9']} />
        {children}
        </LinearGradient>
    );
    }