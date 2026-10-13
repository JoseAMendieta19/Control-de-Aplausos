import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

const TAMANO = 210;

    type Props = {
    porcentaje: number;
    aplausos: number;
    escuchando: boolean;
    children: ReactNode;
    };

    export default function OrbeAplausos({ porcentaje, aplausos, escuchando, children }: Props) {
    const nivel = useRef(new Animated.Value(0)).current;
    const latido = useRef(new Animated.Value(1)).current;
    const respiro = useRef(new Animated.Value(0)).current;

    // El volumen del micrófono agranda los anillos
    useEffect(() => {
        Animated.timing(nivel, {
        toValue: Math.min(Math.max(porcentaje, 0), 100) / 100,
        duration: 120,
        useNativeDriver: true,
        }).start();
    }, [porcentaje, nivel]);

    // Respiración suave mientras escucha
    useEffect(() => {
        if (!escuchando) {
        respiro.stopAnimation();
        respiro.setValue(0);
        return;
        }
        const bucle = Animated.loop(
        Animated.sequence([
            Animated.timing(respiro, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            }),
            Animated.timing(respiro, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
            }),
        ])
        );
        bucle.start();
        return () => bucle.stop();
    }, [escuchando, respiro]);

    // Latido con cada aplauso
    useEffect(() => {
        if (aplausos === 0) return;
        Animated.sequence([
        Animated.timing(latido, { toValue: 1.12, duration: 80, useNativeDriver: true }),
        Animated.spring(latido, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start();
    }, [aplausos, latido]);

    const escalaRespiro = respiro.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
    const escalaOrbe = Animated.multiply(latido, escalaRespiro);

    const escalaAnillo1 = nivel.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
    const opacidadAnillo1 = nivel.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] });
    const escalaAnillo2 = nivel.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1.8] });
    const opacidadAnillo2 = nivel.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.4] });

    const colores: readonly [string, string] = escuchando
        ? ['#DDF8EE', '#5CC4A5']
        : ['#F1F5F8', '#C9D8DF'];
    const colorAnillo = escuchando ? '#5CC4A5' : '#B7C7CF';

    const anillo = {
        position: 'absolute' as const,
        width: TAMANO,
        height: TAMANO,
        borderRadius: TAMANO / 2,
        borderWidth: 2,
        borderColor: colorAnillo,
    };

    return (
        <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
            pointerEvents="none"
            style={[anillo, { opacity: opacidadAnillo2, transform: [{ scale: escalaAnillo2 }] }]}
        />
        <Animated.View
            pointerEvents="none"
            style={[anillo, { opacity: opacidadAnillo1, transform: [{ scale: escalaAnillo1 }] }]}
        />

        <Animated.View
            style={{
            width: TAMANO,
            height: TAMANO,
            borderRadius: TAMANO / 2,
            transform: [{ scale: escalaOrbe }],
            shadowColor: '#5CC4A5',
            shadowOpacity: escuchando ? 0.45 : 0.2,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 14 },
            elevation: 10,
            }}
        >
            <LinearGradient
            colors={colores}
            start={{ x: 0.2, y: 0.1 }}
            end={{ x: 0.85, y: 1 }}
            style={{
                flex: 1,
                borderRadius: TAMANO / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.9)',
            }}
            >
            {/* Brillo de cristal */}
            <View
                pointerEvents="none"
                style={{
                position: 'absolute',
                top: 22,
                left: 34,
                width: 90,
                height: 46,
                borderRadius: 45,
                backgroundColor: 'rgba(255,255,255,0.55)',
                transform: [{ rotate: '-24deg' }],
                }}
            />
            {children}
            </LinearGradient>
        </Animated.View>
        </View>
    );
    }