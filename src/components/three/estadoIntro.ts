import * as THREE from 'three';

/**
 * Estado compartido por frame entre la escena (LaptopIntro, que lo escribe)
 * y el postproceso (que lo lee). Es mutable para no provocar renders de React.
 */
export interface EstadoIntro {
  pantallaCentro: THREE.Vector3;
  /** 0–1: fuerza del desenfoque de profundidad (giro lateral). */
  desenfoque: number;
  /** 0–1: fuerza de la distorsión de entrada a la pantalla. */
  transicion: number;
  /** 0–1: multiplicador del bloom (baja al limpiar la pantalla). */
  bloom: number;
}

export function crearEstadoIntro(): EstadoIntro {
  return { pantallaCentro: new THREE.Vector3(), desenfoque: 0, transicion: 0, bloom: 1 };
}
