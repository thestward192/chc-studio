import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { crearUniformsParticulas, fragmentParticulas, vertexParticulas } from '../shaders/particulas';
import { ambiente } from './ambiente';
import { liberar, rastrear } from './recursos';

type V3 = [number, number, number];

interface PropsComunes {
  cantidad: number;
  color: string;
  tam: number;
}

interface PropsPolvo extends PropsComunes {
  modo: 'polvo';
  cajaMin: V3;
  cajaMax: V3;
  hazOrigen: V3;
  hazDir: V3;
  hazRadio: number;
  /** Opacidad según el ambiente (el haz se ve más de día). */
  opacidad: () => number;
}

interface PropsVapor extends PropsComunes {
  modo: 'vapor';
  origen: V3;
  altura: number;
  /** 0–1: cuánto vapor sale ahora (sube y baja con suavidad). */
  opacidad: () => number;
}

/**
 * Partículas con THREE.Points y ShaderMaterial propio (ver
 * shaders/particulas.ts). Se desactivan con movimiento reducido.
 */
export function Particulas(props: PropsPolvo | PropsVapor) {
  const { cantidad, modo } = props;

  const recursos = useMemo(() => {
    const uniforms = crearUniformsParticulas();
    const geometria = rastrear(new THREE.BufferGeometry());
    const posiciones = new Float32Array(cantidad * 3);
    const semillas = new Float32Array(cantidad);
    for (let i = 0; i < cantidad; i++) {
      semillas[i] = Math.random();
      if (props.modo === 'polvo') {
        for (let k = 0; k < 3; k++) {
          posiciones[i * 3 + k] = props.cajaMin[k] + Math.random() * (props.cajaMax[k] - props.cajaMin[k]);
        }
      } else {
        // Vapor: dispersión lateral aleatoria, la altura la da el shader
        posiciones[i * 3] = (Math.random() - 0.5) * 0.12;
        posiciones[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
      }
    }
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    geometria.setAttribute('aSemilla', new THREE.BufferAttribute(semillas, 1));
    // Evita que se recorte por el bounding sphere (el shader mueve los puntos)
    geometria.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    const material = rastrear(
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vertexParticulas,
        fragmentShader: fragmentParticulas,
        defines: { MODO: modo === 'polvo' ? 0 : 1 },
        transparent: true,
        depthWrite: false,
        blending: modo === 'polvo' ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    );
    return { uniforms, geometria, material };
    // Las posiciones solo dependen de la cantidad y el modo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cantidad, modo]);

  useEffect(() => () => liberar(recursos.geometria, recursos.material), [recursos]);

  useFrame((state) => {
    const u = recursos.uniforms;
    u.uTiempo.value = ambiente.t;
    u.uTam.value = props.tam;
    u.uColor.value.set(props.color);
    u.uOpacidad.value = props.opacidad();
    // Tamaño en píxeles = tamaño en metros · (alto del render / 2) · proyección
    const camara = state.camera as THREE.PerspectiveCamera;
    u.uEscala.value = (state.size.height * state.viewport.dpr * camara.projectionMatrix.elements[5]) / 2;
    if (props.modo === 'polvo') {
      u.uCajaMin.value.set(...props.cajaMin);
      u.uCajaMax.value.set(...props.cajaMax);
      u.uHazOrigen.value.set(...props.hazOrigen);
      u.uHazDir.value.set(...props.hazDir).normalize();
      u.uHazRadio.value = props.hazRadio;
    } else {
      u.uOrigen.value.set(...props.origen);
      u.uAltura.value = props.altura;
    }
  });

  if (ambiente.reducido || cantidad === 0) return null;
  return <points geometry={recursos.geometria} material={recursos.material} frustumCulled={false} />;
}
