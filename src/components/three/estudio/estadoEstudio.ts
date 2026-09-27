import { create } from 'zustand';
import type { NivelCalidad } from '../../../utils/rendimiento';

export type { NivelCalidad };
export type FaseEstudio = 'cargando' | 'listo' | 'entrando' | 'explorando';

/**
 * Estado global de la escena del estudio (zustand). Lo comparten el Canvas
 * (R3F) y la interfaz HTML. Los componentes 3D lo leen con
 * `useEstudio.getState()` dentro de useFrame para no provocar renders.
 */
export interface EstadoEstudio {
  fase: FaseEstudio;
  progresoCarga: number;
  pasoCarga: string;

  hover: string | null;
  seleccionado: string | null;

  noche: boolean;
  sonido: boolean;
  pausa: boolean;
  menu: boolean;
  versionSimple: boolean;

  calidad: NivelCalidad;
  calidadForzada: NivelCalidad | null;
  fps: number;

  enVuelo: boolean;
  /** true mientras la cámara se mueve (vuelo o arrastre con inercia). */
  camaraEnMovimiento: boolean;

  // Estado de los objetos del ambiente
  cafes: number;
  preparandoCafe: boolean;
  lampara: boolean;
  neon: boolean;
  musica: boolean;
  pistaMusica: number;
  reiniciandoRack: number; // marca de tiempo del último reinicio (0 = nunca)
  puertaEntrando: string | null;

  /** Se incrementa cuando el panel de depuración cambia posiciones. */
  versionConfig: number;
  /** Lista de ids registrados (para el menú de pausa). */
  interactivos: string[];

  set: (parcial: Partial<EstadoEstudio>) => void;
}

export const useEstudio = create<EstadoEstudio>()((set) => ({
  fase: 'cargando',
  progresoCarga: 0,
  pasoCarga: 'Preparando…',

  hover: null,
  seleccionado: null,

  noche: false,
  sonido: false,
  pausa: false,
  menu: false,
  versionSimple: false,

  calidad: 'alto',
  calidadForzada: null,
  fps: 0,

  enVuelo: false,
  camaraEnMovimiento: false,

  cafes: 0,
  preparandoCafe: false,
  lampara: true,
  neon: true,
  musica: false,
  pistaMusica: 0,
  reiniciandoRack: 0,
  puertaEntrando: null,

  versionConfig: 0,
  interactivos: [],

  set: (parcial) => set(parcial),
}));

export const estadoEstudio = () => useEstudio.getState();
