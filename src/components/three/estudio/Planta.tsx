import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ConModelo } from '../ModeloGLTF';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';

interface Props {
  posicion: [number, number, number];
  rotY?: number;
  escala?: number;
  modelo?: string;
}

/** Planta en maceta: hojas en un InstancedMesh (un draw call por color). */
export function Planta({ posicion, rotY = 0, escala = 1, modelo }: Props) {
  const m = obtenerMateriales();

  const recursos = useMemo(() => {
    // Maceta torneada
    const maceta = rastrear(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0, 0),
          new THREE.Vector2(0.16, 0),
          new THREE.Vector2(0.2, 0.36),
          new THREE.Vector2(0.22, 0.38),
          new THREE.Vector2(0.21, 0.4),
          new THREE.Vector2(0, 0.4),
        ],
        24,
      ),
    );
    // Hoja: forma de gota curvada
    const forma = new THREE.Shape();
    forma.moveTo(0, 0);
    forma.quadraticCurveTo(0.09, 0.18, 0, 0.42);
    forma.quadraticCurveTo(-0.09, 0.18, 0, 0);
    const hoja = rastrear(new THREE.ShapeGeometry(forma, 6));

    const crearHojas = (material: THREE.Material, cantidad: number, semilla: number) => {
      const malla = new THREE.InstancedMesh(hoja, material, cantidad);
      const matriz = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      let a = semilla;
      const azar = () => ((a = (a * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < cantidad; i++) {
        e.set(-0.2 - azar() * 0.9, (i / cantidad) * Math.PI * 2 + azar(), 0, 'YXZ');
        q.setFromEuler(e);
        const s = 0.7 + azar() * 0.6;
        matriz.compose(new THREE.Vector3(0, 0.38 + azar() * 0.08, 0), q, new THREE.Vector3(s, s, s));
        malla.setMatrixAt(i, matriz);
      }
      malla.castShadow = true;
      return malla;
    };
    return {
      maceta,
      hoja,
      claras: crearHojas(m.planta, 16, 7),
      oscuras: crearHojas(m.plantaOscura, 12, 13),
    };
  }, [m.planta, m.plantaOscura]);

  useEffect(
    () => () => liberar(recursos.maceta, recursos.hoja, recursos.claras, recursos.oscuras),
    [recursos],
  );

  return (
    <group position={posicion} rotation-y={rotY} scale={escala}>
      <ConModelo url={modelo}>
        <mesh geometry={recursos.maceta} material={m.maceta} castShadow receiveShadow />
        <mesh position={[0, 0.39, 0]} rotation-x={-Math.PI / 2} material={m.maderaOscura}>
          <circleGeometry args={[0.2, 20]} />
        </mesh>
        <primitive object={recursos.claras} />
        <primitive object={recursos.oscuras} scale={0.85} />
      </ConModelo>
    </group>
  );
}
