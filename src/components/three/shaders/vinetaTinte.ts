import * as THREE from 'three';

/**
 * Paso de posprocesado propio (ShaderPass): viñeta con smoothstep + tinte
 * de color cálido (día) o frío (noche). Se aplica antes del OutputPass,
 * en espacio lineal.
 */
export const shaderVinetaTinte = {
  name: 'VinetaTinte',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uFuerza: { value: 0.38 }, // oscurecimiento máximo en las esquinas
    uInicio: { value: 0.35 }, // radio donde empieza la viñeta
    uFin: { value: 1.05 }, // radio donde alcanza su máximo
    uAspecto: { value: 1.6 },
    uTinte: { value: new THREE.Color(1, 1, 1) },
    uFuerzaTinte: { value: 0.1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uFuerza;
    uniform float uInicio;
    uniform float uFin;
    uniform float uAspecto;
    uniform vec3 uTinte;
    uniform float uFuerzaTinte;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // Viñeta: distancia al centro corregida por el aspecto
      vec2 c = (vUv - 0.5) * vec2(uAspecto, 1.0);
      float v = smoothstep(uInicio, uFin, length(c));
      color.rgb *= 1.0 - v * uFuerza;
      // Tinte: multiplica por el color del ambiente (cálido o frío)
      color.rgb = mix(color.rgb, color.rgb * uTinte, uFuerzaTinte);
      gl_FragColor = color;
    }
  `,
};
