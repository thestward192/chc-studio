/**
 * Configuración del estudio 3D (estudio.html): medidas de la sala,
 * posiciones de cuadros, puertas y objetos, luces de día/noche, cámara,
 * posprocesado, intensidades de los shaders y niveles de calidad.
 *
 * Coordenadas: X a la derecha, Y arriba, Z hacia la entrada (la cámara
 * empieza cerca de z = +4 mirando a la pared del fondo, z = -4).
 * Unidades en metros; rotaciones en radianes.
 *
 * Es mutable a propósito: el panel de depuración (?debug) lo edita en vivo.
 */
type V3 = [number, number, number];

export interface Colocacion {
  pos: V3;
  rotY: number;
}

export const estudioConfig = {
  sala: { ancho: 12, fondo: 8, alto: 3.2 },

  /** Cuadros de la pared del fondo, uno por proyecto (en el orden de proyectos.ts). */
  cuadros: [
    { pos: [-4, 1.65, -3.95], rotY: 0 },
    { pos: [-2, 1.65, -3.95], rotY: 0 },
    { pos: [0, 1.65, -3.95], rotY: 0 },
    { pos: [2, 1.65, -3.95], rotY: 0 },
    { pos: [4, 1.65, -3.95], rotY: 0 },
  ] as Colocacion[],
  cuadro: { ancho: 1.4, alto: 0.95, distanciaFoco: 1.9, distanciaAltaResolucion: 3.6 },

  /** Puertas de las paredes laterales, una por integrante (orden de equipo.ts). */
  puertas: [
    { pos: [-5.98, 0, -2.0], rotY: Math.PI / 2 },
    { pos: [5.98, 0, -2.0], rotY: -Math.PI / 2 },
    { pos: [-5.98, 0, 0.4], rotY: Math.PI / 2 },
    { pos: [5.98, 0, 0.4], rotY: -Math.PI / 2 },
  ] as Colocacion[],
  puerta: { ancho: 1.0, alto: 2.15, distanciaFoco: 2.4 },

  objetos: {
    escritorios: [
      { pos: [-1.35, 0, 0.5], rotY: 0 },
      { pos: [1.35, 0, 0.5], rotY: 0 },
    ] as Colocacion[],
    rack: { pos: [5.55, 0, -3.45], rotY: -Math.PI / 2 } as Colocacion,
    estanteria: { pos: [-5.78, 0, -3.3], rotY: Math.PI / 2 } as Colocacion,
    ventana: { pos: [-5.99, 1.75, 2.5], rotY: Math.PI / 2 } as Colocacion,
    ventanaTam: [2.4, 1.7] as [number, number],
    pizarra: { pos: [5.97, 1.55, 2.0], rotY: -Math.PI / 2 } as Colocacion,
    cafetera: { pos: [5.62, 0, 3.4], rotY: -Math.PI / 2 } as Colocacion,
    plantas: [
      { pos: [-5.45, 0, 3.55], rotY: 0.4 },
      { pos: [5.45, 0, -0.8], rotY: 1.2 },
      { pos: [-3.1, 0, -3.55], rotY: 2.1 },
    ] as Colocacion[],
    alfombra: { pos: [0, 0.005, 0.9], rotY: 0 } as Colocacion,
    alfombraTam: [5.2, 3.0] as [number, number],
    neon: { pos: [0, 2.6, -3.96], rotY: 0 } as Colocacion,
  },

  camara: {
    fov: 55,
    /** Vista general (botón "Vista general" / H). */
    general: { pos: [0, 2.35, 3.7] as V3, objetivo: [0, 1.25, -1.2] as V3 },
    /** Punto de partida del vuelo al pulsar "Entrar". */
    entrada: { pos: [0, 1.6, 3.95] as V3, objetivo: [0, 1.55, 0] as V3 },
    duracionVuelo: 1300, // ms (easeInOutCubic)
    duracionVueloReducido: 250,
    distanciaMinima: 0.45,
    distanciaMaxima: 7,
    anguloPolarMinimo: 0.35,
    anguloPolarMaximo: 1.72,
    /** La cámara nunca sale de esta caja (dentro de las paredes). */
    limites: { min: [-5.7, 0.35, -3.7] as V3, max: [5.7, 3.0, 3.85] as V3 },
  },

  /** Valores de día y de noche; se interpolan en `duracionCambio` ms. */
  luces: {
    duracionCambio: 2000,
    exposicion: { dia: 1.0, noche: 1.0 },
    sol: { dia: 3.0, noche: 0.25 }, // direccional que entra por la ventana
    hemisferio: { dia: 1.15, noche: 0.2 },
    rebote: { dia: 0.4, noche: 2.4 }, // puntual cálida
    entorno: { dia: 0.55, noche: 0.12 }, // envMapIntensity general
    entornoMetal: { dia: 1.1, noche: 0.6 },
    neon: { dia: 2.2, noche: 4.0 },
    lampara: 3.5,
    posicionSol: [-11, 5.5, 3.2] as V3,
    posicionRebote: [0.5, 2.6, 1.2] as V3,
  },

  posproceso: {
    outline: { edgeStrength: 3.2, edgeGlow: 0.35, edgeThickness: 1.2 },
    bloom: { fuerza: 0.5, radio: 0.45, umbral: 0.88 },
    vineta: { fuerza: 0.38, inicio: 0.35, fin: 1.05 },
    tinte: { dia: 0.08, noche: 0.14 },
  },

  shaders: {
    monitor: { velocidad: 0.35, lineas: 26, reflejo: 0.22, brillo: 1.25 },
    cuadro: { profundidad: 0.035, destello: 1.0, brilloMarco: 1.6 },
    puerta: { intensidad: 1.1, intensidadHover: 2.6, periodoPulso: 4.5, anguloHover: 0.2 },
    ventana: { nubes: 0.6, velocidadNubes: 0.012 },
    particulas: { tamPolvo: 0.018, tamVapor: 0.07 },
  },

  calidad: {
    particulas: {
      alto: { polvo: 900, vapor: 180 },
      medio: { polvo: 380, vapor: 90 },
      bajo: { polvo: 60, vapor: 24 },
    },
  },
};

export type EstudioConfig = typeof estudioConfig;

/** Foco de cámara para un objeto colocado en una pared: delante de él, mirándolo. */
export function focoFrontal(colocacion: Colocacion, distancia: number, alturaCamara?: number) {
  const [x, y, z] = colocacion.pos;
  const nx = Math.sin(colocacion.rotY);
  const nz = Math.cos(colocacion.rotY);
  return {
    pos: [x + nx * distancia, alturaCamara ?? y, z + nz * distancia] as V3,
    objetivo: [x, y, z] as V3,
  };
}

/** Pasa un punto local de un objeto colocado (posición + giro en Y) a coordenadas del mundo. */
export function localAMundo(colocacion: Colocacion, local: V3): V3 {
  const c = Math.cos(colocacion.rotY);
  const s = Math.sin(colocacion.rotY);
  const [x, y, z] = local;
  return [colocacion.pos[0] + x * c + z * s, colocacion.pos[1] + y, colocacion.pos[2] - x * s + z * c];
}
