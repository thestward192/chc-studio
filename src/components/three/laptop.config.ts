/**
 * Configuración ÚNICA de la intro 3D de la laptop.
 *
 * - `secuencia`: en qué punto del scroll (progreso 0 → 1) pasa cada cosa.
 *   Los pares `[inicio, fin]` son tramos; el progreso se suaviza antes de
 *   aplicarse, así que no hace falta que los tramos encajen al milímetro.
 * - El resto son intensidades y duraciones de los efectos.
 *
 * Es un objeto mutable a propósito: el panel de depuración (?debug en
 * desarrollo) lo modifica en vivo y la escena lo relee en cada frame.
 * Nada de la lógica tiene números mágicos de tiempo o intensidad fuera de aquí.
 */
export const laptopConfig = {
  /** Altura de la sección de scroll de la intro (en vh). */
  alturaScrollVh: 520,

  secuencia: {
    /** Hasta este progreso se desvanecen los movimientos de reposo. */
    finReposo: 0.05,
    /** Título inicial: se desvanece al empezar a bajar. */
    tituloFuera: [0.01, 0.07] as [number, number],
    /** La tapa se abre. */
    tapa: [0.05, 0.24] as [number, number],
    /** Al cruzar este punto se dispara el encendido (animación temporal). */
    encendido: 0.25,
    /** La laptop gira de lado. */
    giro: [0.33, 0.5] as [number, number],
    /** Panel de información: [entra, visible, empieza a salir, fuera]. */
    info: [0.36, 0.42, 0.56, 0.61] as [number, number, number, number],
    /** Vuelve a ponerse de frente. */
    frente: [0.56, 0.7] as [number, number],
    /** La cámara entra en la pantalla. */
    zoom: [0.7, 0.965] as [number, number],
    /** El estudio se oscurece para dar foco durante el zoom. */
    oscurecer: [0.72, 0.93] as [number, number],
    /** Contenido de la pantalla → color plano de la página. */
    limpiarPantalla: [0.925, 0.965] as [number, number],
    /** Distorsión de barril: [empieza, pico, termina]. Termina justo al corte. */
    distorsion: [0.83, 0.93, 0.985] as [number, number, number],
    /** El canvas se desvanece y queda la página HTML. */
    corte: [0.955, 0.995] as [number, number],
    /** Desenfoque de profundidad: [entra, pleno, empieza a salir, fuera]. */
    desenfoque: [0.31, 0.38, 0.5, 0.58] as [number, number, number, number],
  },

  /** Suavizado del progreso de scroll (mayor = sigue al scroll más rápido). */
  suavizadoScroll: 7,

  reposo: {
    alturaBase: 0.12, // cuánto flota sobre el piso mientras está en reposo
    amplitudFlotacion: 0.045,
    periodoFlotacion: 4.2, // segundos
    amplitudGiro: 0.07, // radianes (≈4°), ida y vuelta
    periodoGiro: 9,
    respiracionCamara: 0.05, // desplazamiento de la cámara (unidades)
    periodoRespiracion: 6.5,
    parallax: 0.22, // cuánto sigue la cámara al mouse/giroscopio
    suavizadoParallax: 3.5,
  },

  entrada: {
    duracionLuz: 1400, // ms: el estudio pasa de apagado a su tono
    duracionLaptop: 1500,
    retrasoLaptop: 250,
    desplazamientoLaptop: 0.6, // aparece desde este tanto más abajo
    escalaInicial: 0.9,
    retrasoTitulo: 550,
    escalonadoTitulo: 90, // ms entre palabra y palabra
  },

  pantalla: {
    duracionEncendido: 1100, // ms (línea → imagen → destello)
    duracionApagado: 280,
    intensidadHdr: 1.3, // >1 para que el bloom solo la afecte a ella
    luminanciaCentro: 0.14,
    aberracionEncendido: 0.012,
    reflejo: 0.38,
    franjaReflejo: 0.16,
    subpixelDistancia: [1.0, 0.5] as [number, number], // aparece al acercarse
    subpixelIntensidad: 0.4,
    luzSobreTeclado: 2.2, // intensidad del pointLight frente a la pantalla
  },

  ranura: {
    intensidad: 2.2,
    periodoPulso: 3.2, // segundos
    pulsoMinimo: 0.35,
  },

  estudio: {
    grano: 0.012,
    vineta: 0.45,
    charco: 0.45, // "charco de luz" elíptico bajo la laptop
    reflejoPantalla: 0.45, // luz de la pantalla sobre piso y pared
    reflejoRanura: 0.18,
    oscurecerZoom: 0.5,
    sombraOpacidad: 0.78,
    intensidadEntorno: 1, // softboxes reflejados en el aluminio
  },

  aluminio: {
    rugosidad: 0.38,
    anisotropia: 0.75,
    cepillado: 0.09, // ruido direccional en la rugosidad
    bordeFresnel: 0.3,
  },

  postproceso: {
    bloomIntensidad: 0.7,
    bloomUmbral: 1.05,
    bloomSuavizado: 0.25,
    grano: 0.035,
    desenfoqueBokeh: 3.2,
    distorsionBarril: 0.22,
    aberracionTransicion: 0.012,
  },

  camara: {
    fov: 35,
    /** Relación de aspecto a partir de la cual se aleja la cámara (móvil). */
    aspectoReferencia: 1.3,
    factorMaximoMovil: 2.6,
    /** Poses fijas antes de ponerse de frente (se interpolan entre sí). */
    poses: [
      { p: 0, posicion: [0, 7.4, 2.7], objetivo: [0, 0, 0.15] }, // cerrada, desde arriba
      { p: 0.24, posicion: [0, 3.1, 6.3], objetivo: [0, 0.75, 0] }, // abierta
      { p: 0.33, posicion: [0.4, 2.5, 6.1], objetivo: [0, 0.85, 0] }, // encendida
      { p: 0.5, posicion: [-0.6, 1.7, 5.8], objetivo: [0.35, 0.8, 0] }, // de lado
    ] as { p: number; posicion: [number, number, number]; objetivo: [number, number, number] }[],
    /** Distancia a la pantalla (sobre su normal) en la pose de frente. */
    distanciaFrente: 4.3,
    /** Ancho visible mínimo en la pose de frente, en múltiplos del ancho de la laptop. */
    margenFrente: 1.25,
    /** Distancia final dentro del zoom, como fracción de la que llena la vista. */
    fraccionFinalZoom: 0.3,
  },

  laptop: {
    anguloAbierta: -0.24, // rad desde la vertical (≈104° de apertura)
    giroLateral: -0.95, // rad sobre Y en el giro de lado
    desplazamientoLateral: 0.9, // se corre a un lado para dejar sitio al texto (escritorio)
  },

  calidad: {
    /** 'auto' o forzar un nivel (útil desde el panel de depuración). */
    forzar: 'auto' as 'auto' | NivelCalidad,
    fpsMovil: 30,
  },
};

export type NivelCalidad = 'alto' | 'medio' | 'bajo';
export type LaptopConfig = typeof laptopConfig;

/**
 * Canal de avisos para cambios en vivo (panel de depuración): la escena lo
 * escucha para redibujar y para aplicar un nivel de calidad forzado.
 */
export const cambiosConfig = new EventTarget();
export function avisarCambioConfig() {
  cambiosConfig.dispatchEvent(new Event('cambio'));
}
