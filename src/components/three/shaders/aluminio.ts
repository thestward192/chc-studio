import * as THREE from 'three';

/**
 * Aluminio cepillado: MeshPhysicalMaterial con anisotropía (three ≥ r153 la
 * soporta: estira los reflejos en la dirección U de las UV, que en todas las
 * piezas va a lo ancho = cepillado horizontal) + dos añadidos por
 * onBeforeCompile:
 *  - ruido direccional en la rugosidad (vetas finas del cepillado, visibles
 *    incluso en el nivel bajo, donde la anisotropía se apaga);
 *  - un borde de luz fresnel leve en los cantos.
 */
export function crearUniformsAluminio() {
  return {
    uCepillado: { value: 0.08 },
    uColorCanto: { value: new THREE.Color() },
    uBordeFresnel: { value: 0.3 },
  };
}

export type UniformsAluminio = ReturnType<typeof crearUniformsAluminio>;

export function extenderAluminio(
  material: THREE.MeshPhysicalMaterial,
  uniforms: UniformsAluminio,
) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    // Vértice: pasamos la posición local para que las vetas no dependan de las UV.
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosLocal = position;');

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vPosLocal;
        uniform float uCepillado;
        uniform vec3 uColorCanto;
        uniform float uBordeFresnel;
        // Ruido 1D suave: varía rápido en perpendicular al cepillado y casi
        // nada a lo largo de él, lo que da vetas horizontales.
        float hashVeta(float n) { return fract(sin(n) * 43758.5453); }
        float ruidoVeta(float x) {
          float i = floor(x); float f = fract(x);
          return mix(hashVeta(i), hashVeta(i + 1.0), f * f * (3.0 - 2.0 * f));
        }`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
        // Vetas: coordenada perpendicular al cepillado (y + z locales).
        float perpendicular = (vPosLocal.y + vPosLocal.z) * 900.0;
        float veta = ruidoVeta(perpendicular) * 0.6 + ruidoVeta(perpendicular * 0.21 + vPosLocal.x * 3.0) * 0.4;
        roughnessFactor = clamp(roughnessFactor + (veta - 0.5) * uCepillado, 0.04, 1.0);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        /* glsl */ `#include <emissivemap_fragment>
        // Borde de luz fresnel: más intenso cuanto más rasante es la vista.
        float fresnelCanto = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 5.0);
        totalEmissiveRadiance += uColorCanto * fresnelCanto * uBordeFresnel;`,
      );
  };
  // Clave de caché propia para que three no reutilice el programa sin extender.
  material.customProgramCacheKey = () => 'aluminio-cepillado-v1';
}
