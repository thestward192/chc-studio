import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { estudioConfig as cfg } from './estudio.config';
import { liberar, rastrear } from './recursos';
import { texturaAlfombra } from './texturas';

/** Alfombra bajo los escritorios (textura de tela procedural). */
export function Alfombra() {
  const material = useMemo(
    () => rastrear(new THREE.MeshStandardMaterial({ map: texturaAlfombra(), roughness: 1 })),
    [],
  );
  useEffect(() => () => liberar(material, material.map), [material]);
  const { pos, rotY } = cfg.objetos.alfombra;
  const [ancho, fondo] = cfg.objetos.alfombraTam;

  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, rotY]} material={material} receiveShadow>
      <planeGeometry args={[ancho, fondo]} />
    </mesh>
  );
}
