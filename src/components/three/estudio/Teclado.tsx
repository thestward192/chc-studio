import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';

/** Teclado: base + teclas individuales en un solo InstancedMesh. */
export function Teclado({ posicion }: { posicion: [number, number, number] }) {
  const m = obtenerMateriales();

  const recursos = useMemo(() => {
    const geometria = rastrear(new RoundedBoxGeometry(1, 1, 1, 2, 0.15));
    // Anchos de cada tecla por fila, en "unidades de tecla" (la última lleva la barra espaciadora)
    const filas = [
      Array(14).fill(1),
      [1.5, ...Array(12).fill(1), 1.5],
      [1.8, ...Array(11).fill(1), 1.8],
      [2.3, ...Array(10).fill(1), 2.3],
      [1.2, 1.2, 1.2, 6.4, 1.2, 1.2, 1.2, 1.2],
    ];
    const total = filas.reduce((a, fila) => a + fila.length, 0);
    const teclas = new THREE.InstancedMesh(geometria, m.marco, total);
    const matriz = new THREE.Matrix4();
    const u = 0.0265;
    let i = 0;
    filas.forEach((anchos, fila) => {
      const largo = anchos.reduce((a, b) => a + b, 0) * u;
      let x = -largo / 2;
      for (const anchoU of anchos) {
        const ancho = anchoU * u;
        matriz.compose(
          new THREE.Vector3(x + ancho / 2, 0.012, (fila - 2) * u),
          new THREE.Quaternion(),
          new THREE.Vector3(ancho - u * 0.14, 0.008, u * 0.86),
        );
        teclas.setMatrixAt(i++, matriz);
        x += ancho;
      }
    });
    teclas.instanceMatrix.needsUpdate = true;
    teclas.castShadow = true;
    return { geometria, teclas };
  }, [m.marco]);

  useEffect(() => () => liberar(recursos.geometria, recursos.teclas), [recursos]);

  return (
    <group position={posicion}>
      <mesh position={[0, 0.005, 0]} material={m.plastico} receiveShadow castShadow>
        <boxGeometry args={[0.43, 0.012, 0.15]} />
      </mesh>
      <primitive object={recursos.teclas} />
    </group>
  );
}
