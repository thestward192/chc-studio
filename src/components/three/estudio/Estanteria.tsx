import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { sala } from '../../../theme/theme';
import { ConModelo } from '../ModeloGLTF';
import { estudioConfig as cfg } from './estudio.config';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { texturaLomos } from './texturas';

const ANCHO = 1.2;
const ALTO = 2.0;
const FONDO = 0.32;
const BALDAS = 5;

/**
 * Estantería con libros. Todos los libros son un solo InstancedMesh: el
 * lomo sale de un atlas en canvas y el color de cada libro va por instancia.
 */
export function Estanteria({ modelo }: { modelo?: string }) {
  const m = obtenerMateriales();

  const recursos = useMemo(() => {
    const material = rastrear(new THREE.MeshStandardMaterial({ map: texturaLomos(), roughness: 0.8 }));
    const geometria = rastrear(new THREE.BoxGeometry(1, 1, 1));
    // Mapeo del atlas: cada libro usa uno de los 8 lomos del canvas
    const libros: { pos: THREE.Vector3; tam: THREE.Vector3; color: THREE.Color; giro: number }[] = [];
    let semilla = 17;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
    for (let balda = 0; balda < BALDAS - 1; balda++) {
      const yBase = 0.06 + balda * (ALTO / BALDAS) + 0.02;
      let x = -ANCHO / 2 + 0.04;
      while (x < ANCHO / 2 - 0.08) {
        if (azar() < 0.08) {
          x += 0.12; // hueco
          continue;
        }
        const grosor = 0.025 + azar() * 0.03;
        const alto = 0.2 + azar() * 0.12;
        const inclinado = azar() < 0.06 ? 0.25 : 0;
        libros.push({
          pos: new THREE.Vector3(x + grosor / 2, yBase + alto / 2, 0),
          tam: new THREE.Vector3(grosor, alto, 0.18 + azar() * 0.06),
          color: new THREE.Color(sala.libros[Math.floor(azar() * sala.libros.length)]),
          giro: inclinado,
        });
        x += grosor + 0.003;
      }
    }
    const malla = new THREE.InstancedMesh(geometria, material, libros.length);
    const matriz = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    libros.forEach((libro, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), libro.giro);
      matriz.compose(libro.pos, q, libro.tam);
      malla.setMatrixAt(i, matriz);
      malla.setColorAt(i, libro.color);
    });
    malla.castShadow = true;
    malla.receiveShadow = true;
    return { material, geometria, malla };
  }, []);

  useEffect(() => () => liberar(recursos.material, recursos.geometria, recursos.malla), [recursos]);

  const { pos, rotY } = cfg.objetos.estanteria;
  return (
    <group position={pos} rotation-y={rotY}>
      <ConModelo url={modelo}>
        {/* Laterales, fondo y baldas */}
        {[-1, 1].map((lado) => (
          <mesh key={lado} position={[(lado * ANCHO) / 2, ALTO / 2, 0]} material={m.madera} castShadow receiveShadow>
            <boxGeometry args={[0.03, ALTO, FONDO]} />
          </mesh>
        ))}
        <mesh position={[0, ALTO / 2, -FONDO / 2 + 0.01]} material={m.maderaOscura} receiveShadow>
          <boxGeometry args={[ANCHO, ALTO, 0.02]} />
        </mesh>
        {Array.from({ length: BALDAS + 1 }, (_, i) => (
          <mesh key={i} position={[0, 0.04 + i * (ALTO / BALDAS) - (i === BALDAS ? 0.04 : 0), 0]} material={m.madera} castShadow receiveShadow>
            <boxGeometry args={[ANCHO, 0.03, FONDO]} />
          </mesh>
        ))}
        <primitive object={recursos.malla} />
      </ConModelo>
    </group>
  );
}
