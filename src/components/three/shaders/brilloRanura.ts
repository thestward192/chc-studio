import * as THREE from 'three';

/**
 * Brillo que escapa por la ranura de la tapa cerrada: una línea fina y
 * luminosa sobre el borde frontal que pulsa lentamente. Se dibuja en un
 * plano con mezcla aditiva; su valor HDR (>1) lo hace entrar en el bloom.
 */
export function crearUniformsRanura() {
  return {
    uColor: { value: new THREE.Color() },
    uIntensidad: { value: 0 }, // incluye el pulso y el desvanecimiento al abrir
  };
}

export const vertexRanura = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentRanura = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensidad;
  varying vec2 vUv;

  void main() {
    // Distancia vertical a la línea central: núcleo fino + halo gaussiano.
    float dy = abs(vUv.y - 0.5) * 2.0;
    // (el núcleo abarca varios píxeles para que no se vea punteado)
    float nucleo = exp(-pow(dy / 0.14, 2.0));
    float halo = exp(-pow(dy / 0.55, 2.0)) * 0.3;
    // Extremos que se apagan suavemente (la luz se escapa más por el centro).
    float dx = abs(vUv.x - 0.5) * 2.0;
    float extremos = 1.0 - smoothstep(0.55, 1.0, dx);
    float brillo = (nucleo + halo) * extremos * uIntensidad;
    gl_FragColor = vec4(uColor * brillo, brillo);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
