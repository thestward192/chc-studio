/**
 * Configuración del "Núcleo CHC", la escena 3D del hero de Inicio.
 * Todo lo ajustable vive aquí; los colores salen de theme.ts (`marca`).
 */
export const heroConfig = {
  camara: { fov: 30, z: 7.6 },
  /** Resolución máxima del canvas (la escena es pequeña: 1.5 basta en pantallas retina). */
  dprMax: 1.5,

  nucleo: {
    /** Subdivisiones del icosaedro por nivel de calidad. */
    detalle: { alto: 72, medio: 40 },
    /** Relieve grande y lento (la forma "respira"). */
    ruido: { escala: 0.85, amplitud: 0.13, velocidad: 0.18 },
    /** Relieve fino que le da textura. */
    ruidoFino: { escala: 2.2, amplitud: 0.018, velocidad: 0.3 },
    /** Cuánto se abomba hacia el puntero. */
    atraccion: 0.22,
    /** Respiración de escala. */
    respiracion: { periodo: 7, amplitud: 0.025 },
  },

  /** Hover/foco en "Empecemos tu proyecto": el núcleo crece y los arcos aceleran. */
  crecer: { escala: 1.12, relieve: 0.6, velocidadArcos: 3.2, suavizado: 3.2 },

  /** Las dos "C" del logo orbitando: arcos abiertos al 78 %. */
  arcos: [
    { radio: 1.62, grosor: 0.05, abertura: 0.78, inclinacion: [1.2, 0.25, 0.1], velocidad: 0.22 },
    {
      radio: 2.02,
      grosor: 0.032,
      abertura: 0.78,
      inclinacion: [1.45, -0.55, 0.5],
      velocidad: -0.15,
    },
  ] as const,

  /** Polvo luminoso alrededor (solo calidad alta/media). */
  particulas: { alto: 240, medio: 110, radio: [2.2, 3.1] as const, tamano: 5.5, velocidad: 0.03 },

  /** Inclinación del conjunto hacia el puntero (radianes) y suavizado. */
  puntero: { giroX: 0.32, giroY: 0.48, suavizado: 3.5 },

  /** Luz principal (arriba a la izquierda, como la del resto del sitio). */
  luz: [-0.55, 0.75, 0.6] as const,

  /** Pose fija usada para el póster estático (scripts/capturar-poster-hero.mjs). */
  poster: { tiempo: 3.2, giro: [0.12, -0.35] as const },
};
