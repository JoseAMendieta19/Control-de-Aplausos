    export const tema = {
    colores: {
        fondoInicio: '#F5F9FC',
        fondoFin: '#E2F2EE',
        texto: '#1F2D3D',
        textoSuave: '#5B6B7C',
        menta: '#7FD1B9',
        mentaOscuro: '#2FA384',
        cristal: 'rgba(255,255,255,0.55)',
        cristalBorde: 'rgba(255,255,255,0.95)',
        peligro: '#E5566D',
    },
    acciones: {
        Vibrar: '#8B8CF7',
        Alarma: '#F58A8A',
        Linterna: '#F5C766',
        'Mensaje de voz': '#6EC6E6',
        'Cambiar color': '#C58BF2',
    },
    radio: { tarjeta: 28, boton: 20, chip: 999 },
    sombraCristal: {
        shadowColor: '#6FA8A0',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
    },
    };
    export const iconosAcciones: Record<string, string> = {
    Vibrar: '📳',
    Alarma: '⏰',
    Linterna: '🔦',
    'Mensaje de voz': '🎙️',
    'Cambiar color': '🎨',
    };

    // Recibe el nombre visible de la acción (el de NOMBRE_ACCION)
    export const estiloAccion = (nombre: string) => ({
    color: tema.acciones[nombre as keyof typeof tema.acciones] ?? tema.colores.menta,
    icono: iconosAcciones[nombre] ?? '👏',
    });