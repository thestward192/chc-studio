/**
 * Configuración de las oficinas del equipo (equipo/integrante-N.html).
 *
 * Las oficinas reutilizan el motor del taller (LienzoSala, luces, cámara,
 * selección, panel, HUD): `prepararOficina()` aplica `salaOficina` sobre
 * estudio.config.ts antes de montar la escena. Luego cada persona suma sus
 * objetos, colocados con `objetos` (una entrada por diseño).
 *
 * Coordenadas: sala de 7 × 6 m; X a la derecha, Z hacia la cámara. La
 * puerta de salida (vuelta al taller) está en la pared izquierda, la
 * ventana en la derecha y el escritorio contra la pared del fondo.
 */
import { aplicarConfigSala, type Colocacion } from '../estudio/estudio.config';

type V3 = [number, number, number];

/** Qué oficina monta cada integrante (por slug de equipo.ts). */
export type DisenoOficina = 'creativo' | 'futbol' | 'gamer' | 'belleza';
export const disenoPorSlug: Record<string, DisenoOficina> = {
  'integrante-1': 'creativo', // Stward: videojuegos, diseño y 3D
  'integrante-2': 'futbol', // Oscar: fútbol y programación
  'integrante-3': 'gamer', // Hezron: videojuegos y programación
  'integrante-4': 'belleza', // Fabiola: programación y maquillaje
};

/** Cambios sobre la config del taller: la sala de una oficina. */
export const salaOficina = {
  sala: { ancho: 7, fondo: 6, alto: 3, lucesTecho: [-1.7, 1.7], zLucesTecho: -0.2 },
  cuadros: [] as Colocacion[],
  /** Única puerta: la salida hacia el taller. */
  puertas: [{ pos: [-3.48, 0, 1.55], rotY: Math.PI / 2 }] as Colocacion[],
  puerta: { ancho: 1.0, alto: 2.15, distanciaFoco: 2.1 },
  objetos: {
    escritorios: [{ pos: [0.35, 0, -2.05], rotY: 0 }] as Colocacion[],
    estanteria: { pos: [3.3, 0, -1.55], rotY: -Math.PI / 2 } as Colocacion,
    ventana: { pos: [3.49, 1.7, 1.2], rotY: -Math.PI / 2 } as Colocacion,
    ventanaTam: [1.9, 1.45] as [number, number],
    alfombra: { pos: [0, 0.005, 0.35], rotY: 0 } as Colocacion,
    alfombraTam: [3.2, 2.1] as [number, number],
    plantas: [{ pos: [2.95, 0, 2.55], rotY: 0.6 }] as Colocacion[],
  },
  camara: {
    fov: 58,
    general: { pos: [0.2, 1.9, 2.7] as V3, objetivo: [0, 1.05, -1.2] as V3 },
    /** Se entra por la puerta de la izquierda, mirando hacia la sala. */
    entrada: { pos: [-2.6, 1.6, 1.6] as V3, objetivo: [0.4, 1.3, -0.6] as V3 },
    distanciaMinima: 0.4,
    distanciaMaxima: 4.6,
    limites: { min: [-3.25, 0.35, -2.75] as V3, max: [3.25, 2.75, 2.8] as V3 },
  },
  luces: {
    posicionSol: [11, 5.5, 1.4] as V3, // entra por la ventana de la derecha
    posicionRebote: [0, 2.4, 0.2] as V3,
    rebote: { dia: 0.5, noche: 2.2 },
    // Sala más chica que el taller: menos sol y cielo para no quemar la pared opuesta a la ventana
    sol: { dia: 1.35, noche: 0.2 },
    hemisferio: { dia: 0.85, noche: 0.2 },
  },
};

/** Tablero "Lo que hago" (todas las oficinas), sobre el escritorio. */
export const tablero = { pos: [0.35, 1.95, -2.97] as V3, tam: [1.7, 0.95] as [number, number] };

/** Objetos propios de cada diseño (posición en el suelo o en la pared). */
export const objetos = {
  creativo: {
    arcade: { pos: [-2.55, 0, -2.3], rotY: 0.45 } as Colocacion,
    pedestal: { pos: [-2.35, 0, -0.35], rotY: 0.9 } as Colocacion,
    paleta: { pos: [2.25, 1.72, -2.97], rotY: 0 } as Colocacion,
  },
  futbol: {
    porteria: { pos: [-2.92, 0, -0.75], rotY: Math.PI / 2 } as Colocacion,
    balon: { pos: [0.55, 0.11, 0.75], rotY: 0 } as Colocacion,
    camiseta: { pos: [2.25, 1.75, -2.97], rotY: 0 } as Colocacion,
    trofeo: { pos: [3.3, 2.0, -1.2], rotY: -Math.PI / 2 } as Colocacion, // sobre la estantería
    cancha: { pos: [0, 0.006, 0.35], rotY: 0 } as Colocacion,
    canchaTam: [3.6, 2.3] as [number, number],
  },
  gamer: {
    pc: { pos: [1.5, 0, -2.2], rotY: -0.25 } as Colocacion,
    tv: { pos: [-3.18, 0, -0.75], rotY: Math.PI / 2 } as Colocacion,
    puff: { pos: [-2.25, 0, 0.35], rotY: -Math.PI / 2 } as Colocacion, // a un lado, sin tapar la tele
    poster: { pos: [2.25, 1.8, -2.97], rotY: 0 } as Colocacion,
  },
  belleza: {
    tocador: { pos: [-3.12, 0, -0.8], rotY: Math.PI / 2 } as Colocacion,
    banco: { pos: [-2.45, 0, -0.8], rotY: 0 } as Colocacion,
    florero: { pos: [-2.6, 0, -2.55], rotY: 0.4 } as Colocacion,
    espejoPared: { pos: [2.25, 1.75, -2.97], rotY: 0 } as Colocacion,
  },
};

/** Aplica la sala de oficina sobre la config del taller (una vez, al arrancar la página). */
export function prepararOficina() {
  aplicarConfigSala(salaOficina);
}

/**
 * Foco de cámara para un objeto: delante de él (su frente mira a +Z local),
 * a `distancia` en horizontal, con la cámara a `alturaCamara` mirando a
 * `alturaObjetivo`.
 */
export function focoObjeto(
  colocacion: Colocacion,
  distancia: number,
  alturaCamara: number,
  alturaObjetivo: number,
) {
  const [x, , z] = colocacion.pos;
  const nx = Math.sin(colocacion.rotY);
  const nz = Math.cos(colocacion.rotY);
  return {
    pos: [x + nx * distancia, alturaCamara, z + nz * distancia] as V3,
    objetivo: [x, alturaObjetivo, z] as V3,
  };
}
