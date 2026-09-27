import { useRef, type ReactNode } from 'react';
import type * as THREE from 'three';
import { ConModelo } from './ModeloGLTF';
import { useInteractivo, type DefinicionInteractivo } from './estudio/useInteractivo';

interface Props extends DefinicionInteractivo {
  posicion: [number, number, number];
  rotY?: number;
  /** .glb real opcional; si no hay, se ve la geometría procedural (children). */
  modelo?: string;
  escalaModelo?: number;
  children: ReactNode;
}

/**
 * Envoltorio de cualquier objeto interactivo del estudio: lo coloca, lo
 * registra con useInteractivo (hover, outline, clic, panel) y permite
 * cambiar su geometría procedural por un .glb con la prop `modelo`.
 */
export function ObjetoInteractivo({
  posicion,
  rotY = 0,
  modelo,
  escalaModelo,
  children,
  grupo = 'objeto',
  ...definicion
}: Props) {
  const raiz = useRef<THREE.Group>(null);
  useInteractivo(raiz, { ...definicion, grupo });

  return (
    <group ref={raiz} position={posicion} rotation-y={rotY}>
      <ConModelo url={modelo} escala={escalaModelo}>
        {children}
      </ConModelo>
    </group>
  );
}
