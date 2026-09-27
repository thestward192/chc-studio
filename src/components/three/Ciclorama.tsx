import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { crearUniformsCiclorama, fragmentCiclorama, vertexCiclorama } from './shaders/ciclorama';

export type UniformsCiclorama = ReturnType<typeof crearUniformsCiclorama>;

interface Props {
  uniforms: UniformsCiclorama;
}

/**
 * Fondo infinito de estudio: piso y pared unidos por un cuarto de círculo,
 * sin esquina. El perfil (z, y) se extruye a lo ancho en X.
 */
export function Ciclorama({ uniforms }: Props) {
  const { geometria, material } = useMemo(() => {
    const geometria = crearGeometriaCiclorama({
      ancho: 90,
      frente: 40,
      inicioCurva: -4.5,
      radio: 5,
      altoPared: 30,
    });
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertexCiclorama,
      fragmentShader: fragmentCiclorama,
      depthWrite: true,
    });
    return { geometria, material };
  }, [uniforms]);

  useEffect(
    () => () => {
      geometria.dispose();
      material.dispose();
    },
    [geometria, material],
  );

  return <mesh geometry={geometria} material={material} renderOrder={-1} />;
}

function crearGeometriaCiclorama({
  ancho,
  frente,
  inicioCurva,
  radio,
  altoPared,
}: {
  ancho: number;
  frente: number;
  inicioCurva: number;
  radio: number;
  altoPared: number;
}) {
  // Perfil en el plano (z, y): piso → curva → pared.
  const perfil: THREE.Vector2[] = [];
  perfil.push(new THREE.Vector2(frente, 0));
  perfil.push(new THREE.Vector2(inicioCurva, 0));
  const pasosCurva = 40;
  for (let i = 1; i <= pasosCurva; i++) {
    const a = (i / pasosCurva) * (Math.PI / 2);
    perfil.push(new THREE.Vector2(inicioCurva - Math.sin(a) * radio, radio - Math.cos(a) * radio));
  }
  perfil.push(new THREE.Vector2(inicioCurva - radio, altoPared));

  const posiciones: number[] = [];
  const normales: number[] = [];
  const indices: number[] = [];
  perfil.forEach((punto, i) => {
    // Normal del perfil: perpendicular a la tangente, apuntando "hacia dentro".
    const anterior = perfil[Math.max(0, i - 1)];
    const siguiente = perfil[Math.min(perfil.length - 1, i + 1)];
    const tz = siguiente.x - anterior.x;
    const ty = siguiente.y - anterior.y;
    const largo = Math.hypot(tz, ty) || 1;
    const nz = ty / largo;
    const ny = -tz / largo;
    for (const x of [-ancho / 2, ancho / 2]) {
      posiciones.push(x, punto.y, punto.x);
      normales.push(0, ny, nz);
    }
    if (i > 0) {
      const a = (i - 1) * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });

  const geometria = new THREE.BufferGeometry();
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute('normal', new THREE.Float32BufferAttribute(normales, 3));
  geometria.setIndex(indices);
  return geometria;
}
