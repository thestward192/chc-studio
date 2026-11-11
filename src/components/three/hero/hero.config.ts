/**
 * Configuración de la mascota CHC, la escena 3D del hero de Inicio.
 * Todo lo ajustable vive aquí; los colores salen de theme.ts (`mascota`).
 *
 * Unidades del objeto: el cuerpo mide ~2 de ancho y de alto (colita en
 * y ≈ -1, punta en y ≈ 1.04), con el centro en el origen. La cara mira a +z.
 */
export type Expresion = 'neutro' | 'alegre' | 'curioso';

export const heroConfig = {
  /** Cámara de la sala: algo elevada, mirando al fondo para que se vea el suelo. */
  camara: { fov: 30, posicion: [0, 1.15, 8.6] as const, mira: [0, -0.15, -1.5] as const },

  /** Sala sin fondo: suelo con cuadrícula, niebla y polvo flotando. */
  sala: {
    suelo: -1.1,
    celda: 0.9,
    /** Distancia a la que la cuadrícula termina de apagarse. */
    alcance: 30,
    /** Niebla (distancia a la cámara donde empieza y donde acaba). */
    niebla: [10, 24] as const,
    particulas: { alto: 170, medio: 90, tamano: 7 },
  },

  /**
   * Vuelo: se queda en casa un rato, sale disparado dando una gran vuelta
   * por la sala (un óvalo amplio hacia el fondo), da una voltereta y vuelve
   * frenando hasta aterrizar en casa. Tiempos en segundos.
   */
  vuelo: {
    enCasa: [7, 11] as const,
    duracion: 9,
    /** Puntos de la gran vuelta (x, y, z) entre el despegue y el aterrizaje en casa. */
    ruta: [
      [1.0, 0.5, -0.8],
      [1.9, 1.0, -3.2],
      [2.0, 1.4, -7.2],
      [0.2, 1.7, -10.5],
      [-2.0, 1.4, -7.4],
      [-1.8, 0.9, -3.4],
      [-0.9, 0.4, -1.1],
    ] as const,
    /** Cada vuelo mueve la ruta al azar hasta esta distancia (y la refleja en x a veces). */
    variacion: 0.4,
    /**
     * Rapidez a lo largo del vuelo: arranca en `arranque` (fracción del vuelo),
     * sale a `salida` veces la media y llega a `llegada` veces, frenando para aterrizar.
     */
    rapidez: { arranque: 0.07, salida: 1.7, llegada: 0.55 },
    /** Tramo del vuelo (0..1) con una voltereta hacia delante. */
    voltereta: [0.6, 0.78] as const,
    /** Se inclina hacia donde vuela (alabeo en las curvas y hacia delante al avanzar). */
    alabeo: 0.5,
    inclinacion: 0.18,
  },
  /** Resolución máxima del canvas (la escena es pequeña: 1.5 basta en pantallas retina). */
  dprMax: 1.5,

  cuerpo: {
    /** Anillos (de la cara a la espalda) y segmentos alrededor del contorno, por calidad. */
    detalle: { alto: [160, 300], medio: [100, 200] } as Record<string, readonly [number, number]>,
    /**
     * Contorno visto de frente: distancia del centro al borde cada 4° (0° =
     * derecha, sentido antihorario). La mitad de abajo está medida de la
     * imagen de referencia (lóbulo a la izquierda, colita abajo y lóbulo abajo
     * a la derecha); la de arriba es una cabeza pequeña y redondeada, sin
     * pico, apenas inclinada a la derecha.
     */
    silueta: [
      0.911, 0.883, 0.857, 0.837, 0.819, 0.803, 0.79, 0.782, 0.777, 0.775, 0.775, 0.777, 0.78,
      0.782, 0.784, 0.785, 0.785, 0.785, 0.783, 0.782, 0.781, 0.781, 0.782, 0.782, 0.781, 0.78,
      0.778, 0.775, 0.772, 0.769, 0.766, 0.764, 0.763, 0.763, 0.763, 0.765, 0.768, 0.773, 0.781,
      0.791, 0.803, 0.82, 0.84, 0.862, 0.888, 0.919, 0.951, 0.981, 1.01, 1.039, 1.06, 1.077, 1.085,
      1.084, 1.073, 1.049, 1.008, 0.947, 0.87, 0.811, 0.808, 0.83, 0.864, 0.905, 0.947, 0.981,
      0.997, 0.99, 0.958, 0.909, 0.861, 0.822, 0.803, 0.815, 0.825, 0.827, 0.835, 0.926, 1.001,
      1.044, 1.073, 1.09, 1.097, 1.094, 1.083, 1.063, 1.034, 1.003, 0.97, 0.94,
    ] as const,
    /**
     * Media profundidad (z) en la cara y en la espalda. `relleno` < 1 hace la
     * sección más llena que una elipse (cuerpo blandito, no lenteja).
     */
    profundidad: { frente: 0.84, espalda: 0.74, relleno: 0.8 },
    /** La cabeza se inclina un poco hacia atrás (-z). */
    curvaPunta: 0.06,
  },

  visor: {
    /** Centro y semiejes de la elipse vista de frente. */
    centroX: 0.04,
    centroY: 0.02,
    semiancho: 0.57,
    semialto: 0.41,
    /** Cuánto se hunde el cuerpo alrededor (borde del capuchón). */
    hueco: 0.17,
    /** El cristal queda por debajo de la superficie y se abomba hacia fuera. */
    retiro: 0.1,
    domo: 0.04,
    /** Escala de los ojos respecto a sus medidas (las de `ojos`). */
    escalaOjos: 0.7,
    detalle: { alto: [56, 96], medio: [36, 64] } as Record<string, readonly [number, number]>,
  },

  ojos: {
    separacion: 0.245,
    /** Cápsula vertical: medio largo del tramo recto y radio. */
    largo: 0.1,
    radio: 0.062,
    /** Cuánto se mueven al mirar (unidades de la cara). */
    mirada: [0.07, 0.045] as const,
  },

  /** Rutina de caras (segundos). Señalar el botón del hero fuerza "alegre". */
  rutina: [
    { expresion: 'neutro', duracion: 3.6 },
    { expresion: 'alegre', duracion: 2.6 },
    { expresion: 'neutro', duracion: 2.4 },
    { expresion: 'curioso', duracion: 3.0 },
  ] as { expresion: Expresion; duracion: number }[],
  /** Velocidad del cambio de cara (más alto = más rápido). */
  transicion: 7,
  parpadeo: { duracion: 0.17, intervalo: [2.2, 5.2] as const, doble: 0.25 },

  movimiento: {
    /** Flotación: periodo (s) y amplitud. */
    flotacion: { periodo: 3.4, amplitud: 0.06 },
    /** Saltitos cuando está alegre. */
    salto: { frecuencia: 1.75, altura: 0.13, aplaste: 0.075 },
    /** Pose de reposo (inclinación y giro, rad): casi de frente para que se lea la silueta. */
    pose: [0.06, 0.1] as const,
    /** Inclinación hacia el puntero y suavizado. */
    puntero: { giroX: 0.22, giroY: 0.5, suavizado: 3.2 },
    /** Muelle de la punta (sigue al giro con retraso). */
    muelle: { rigidez: 38, amortiguacion: 7, fuerza: 0.32 },
  },

  /** Hover/foco en "Empecemos tu proyecto": crece y se pone alegre. */
  crecer: { escala: 1.07, suavizado: 4 },

  /** Luz principal (arriba a la izquierda, como la del resto del sitio). */
  luz: [-0.55, 0.75, 0.6] as const,

  /** Pose fija usada para el póster estático (scripts/capturar-poster-hero.mjs). */
  poster: {
    tiempo: 0.85,
    /** Encuadre cuadrado solo con la mascota (sin sala). Lado en px CSS. */
    camara: { posicion: [0, 0.35, 6.9] as const, mira: [0, 0, 0] as const },
    lado: 653,
  },
};
