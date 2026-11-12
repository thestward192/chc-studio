import * as THREE from 'three';
import { marca, mascota } from '../../../theme/theme';
import { heroConfig } from './hero.config';
import { CARAS, type Cara } from './trucosMascota';
import { cuerpoFragment, cuerpoVertex, visorFragment, visorVertex } from '../shaders/mascota';

/**
 * Materiales de la mascota CHC (cuerpo de silicona y visor con los ojos por
 * SDF), compartidos por todas sus escenas: el hero, sus paseos por Inicio y
 * las salas 3D del estudio. `flex` (doblez de la punta) y `niebla` son
 * uniforms compartidos entre los dos materiales.
 */
export function crearMaterialesMascota({
  niebla: rango = [1e4, 2e4],
}: {
  /** Distancia a la cámara donde empieza y acaba la niebla (lejos = sin niebla). */
  niebla?: readonly [number, number];
} = {}) {
  const c = heroConfig;
  const flex = { value: new THREE.Vector2() };
  const niebla = {
    uNiebla: { value: new THREE.Color(marca.fondoOscuro) },
    uNieblaRango: { value: new THREE.Vector2(...rango) },
  };
  const cuerpo = new THREE.ShaderMaterial({
    vertexShader: cuerpoVertex,
    fragmentShader: cuerpoFragment,
    uniforms: {
      uFlex: flex,
      uAqua: { value: new THREE.Color(mascota.aqua) },
      uCian: { value: new THREE.Color(mascota.cian) },
      uMenta: { value: new THREE.Color(mascota.menta) },
      uBlanco: { value: new THREE.Color(mascota.blanco) },
      uLuz: { value: new THREE.Vector3(...c.luz) },
      uBrillo: { value: 0 },
      uRojo: { value: 0 },
      ...niebla,
    },
  });
  const visor = new THREE.ShaderMaterial({
    vertexShader: visorVertex,
    fragmentShader: visorFragment,
    uniforms: {
      uFlex: flex,
      uVisor: { value: new THREE.Color(mascota.visor) },
      uCian: { value: new THREE.Color(mascota.cian) },
      uOjo: { value: new THREE.Color(mascota.ojo) },
      uBrilloOjo: { value: new THREE.Color(mascota.brilloOjo) },
      uLuz: { value: new THREE.Vector3(...c.luz) },
      uExpresion: { value: new THREE.Vector3(1, 0, 0) },
      uExpresion2: { value: new THREE.Vector4(0, 0, 0, 0) },
      uGiroOjos: { value: 0 },
      uParpadeo: { value: 1 },
      uMirada: { value: new THREE.Vector2() },
      uOjos: { value: new THREE.Vector3(c.ojos.separacion, c.ojos.largo, c.ojos.radio) },
      uSemiejes: {
        value: new THREE.Vector2(c.visor.semiancho, c.visor.semialto).divideScalar(
          c.visor.escalaOjos,
        ),
      },
      ...niebla,
    },
  });
  return { flex, niebla, cuerpo, visor };
}

/** Lleva los pesos de cara (orden de CARAS) a los uniforms del visor. */
export function aplicarCara(visor: THREE.ShaderMaterial, pesos: number[]) {
  visor.uniforms.uExpresion.value.set(pesos[0], pesos[1], pesos[2]);
  visor.uniforms.uExpresion2.value.set(pesos[3], pesos[4], pesos[5], pesos[6]);
}

/** Acerca los pesos de cara a `objetivo` (suavizado exponencial con `k` ya calculado). */
export function acercarCara(pesos: number[], objetivo: Cara, k: number) {
  for (let i = 0; i < pesos.length; i++)
    pesos[i] += ((CARAS[i] === objetivo ? 1 : 0) - pesos[i]) * k;
}
