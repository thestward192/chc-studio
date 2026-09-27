import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PaletaEstudio } from '../../theme/theme';

interface Props {
  paleta: PaletaEstudio;
}

/** Softboxes del estudio: [posición, rotación, escala, intensidad]. */
const SOFTBOXES: [THREE.Vector3Tuple, THREE.Vector3Tuple, [number, number], number][] = [
  [[0, 6, 0], [Math.PI / 2, 0, 0], [9, 4], 2.4], // cenital
  [[-6, 2, 1], [0, Math.PI / 2, 0], [6, 1.2], 1.4], // tira izquierda
  [[6, 2, 1], [0, -Math.PI / 2, 0], [6, 1.2], 1.4], // tira derecha
  [[0, 4.5, 7], [0, Math.PI, 0], [10, 4], 1.6], // frontal alto
  [[0, 1.2, 7], [0, Math.PI, 0], [12, 0.4], 1.1], // tira frontal (reflejo horizontal)
  [[0, 4, -7], [0, 0, 0], [12, 5], 1.5], // fondo (se refleja en el teclado)
];

/**
 * Entorno de reflejos del aluminio y el vidrio: una escena mínima de
 * rectángulos luminosos (colores del tema) prefiltrada una sola vez con
 * PMREMGenerator. Sustituye a <Environment> de drei para no descargar sus
 * cargadores de HDR/EXR, que aquí no se usan.
 */
export function EntornoEstudio({ paleta }: Props) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const escena = new THREE.Scene();
    escena.background = new THREE.Color(paleta.borde).multiplyScalar(0.4);
    const geometria = new THREE.PlaneGeometry(1, 1);
    const materiales: THREE.Material[] = [];

    for (const [posicion, rotacion, [ancho, alto], fuerza] of SOFTBOXES) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(paleta.luz).multiplyScalar(fuerza),
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      materiales.push(material);
      const malla = new THREE.Mesh(geometria, material);
      malla.position.set(...posicion);
      malla.rotation.set(...rotacion);
      malla.scale.set(ancho, alto, 1);
      escena.add(malla);
    }
    // Rebote suave del piso del estudio.
    const piso = new THREE.MeshBasicMaterial({ color: paleta.centro, side: THREE.DoubleSide, toneMapped: false });
    materiales.push(piso);
    const mallaPiso = new THREE.Mesh(geometria, piso);
    mallaPiso.rotation.x = -Math.PI / 2;
    mallaPiso.position.y = -3;
    mallaPiso.scale.set(30, 30, 1);
    escena.add(mallaPiso);

    const pmrem = new THREE.PMREMGenerator(gl);
    const objetivo = pmrem.fromScene(escena, 0.02, 0.1, 100);
    scene.environment = objetivo.texture;
    invalidate();

    // Liberar todo: geometría, materiales, generador y render target.
    return () => {
      if (scene.environment === objetivo.texture) scene.environment = null;
      objetivo.dispose();
      pmrem.dispose();
      geometria.dispose();
      materiales.forEach((m) => m.dispose());
    };
  }, [gl, scene, paleta, invalidate]);

  return null;
}
