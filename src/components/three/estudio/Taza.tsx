import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';

/** Taza de cerámica (torneada) con asa. */
export function Taza({ posicion, rotY = 0 }: { posicion: [number, number, number]; rotY?: number }) {
  const m = obtenerMateriales();
  const geometria = useMemo(() => {
    const perfil = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.038, 0),
      new THREE.Vector2(0.041, 0.006),
      new THREE.Vector2(0.042, 0.095),
      new THREE.Vector2(0.036, 0.095),
      new THREE.Vector2(0.035, 0.012),
      new THREE.Vector2(0, 0.012),
    ];
    return rastrear(new THREE.LatheGeometry(perfil, 28));
  }, []);
  useEffect(() => () => liberar(geometria), [geometria]);

  return (
    <group position={posicion} rotation-y={rotY}>
      <mesh geometry={geometria} material={m.ceramica} castShadow />
      <mesh position={[0.046, 0.05, 0]} material={m.ceramica}>
        <torusGeometry args={[0.022, 0.006, 8, 16, Math.PI]} />
      </mesh>
    </group>
  );
}
