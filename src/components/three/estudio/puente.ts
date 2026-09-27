import type { DefinicionInteractivo, Interactivo } from './useInteractivo';

type Foco = { duracion?: number; alTerminar?: () => void };

/**
 * Puente entre la interfaz HTML y la escena 3D. La interfaz se descarga
 * con la página; three.js y la escena llegan después por import dinámico.
 * Para que la interfaz no arrastre three.js al bundle inicial, solo habla
 * con la escena a través de estas funciones, que la escena rellena al
 * montarse (ver EscenaSalaProyectos.tsx). Hasta entonces no hacen nada.
 */
export const puente = {
  seleccionar: (_id: string) => {},
  cerrarPanel: () => {},
  vistaGeneral: (_opciones?: Foco) => {},
  obtener: (_id: string | null | undefined): Interactivo | undefined => undefined,
  listar: (_grupo?: DefinicionInteractivo['grupo']): Interactivo[] => [],
  vecino: (_id: string, _paso: 1 | -1): string | null => null,
};
