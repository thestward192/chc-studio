import * as THREE from 'three';

/**
 * Letrero de neón: la máscara (canvas) trae el tubo nítido y su halo. Al
 * encender, parpadea de forma irregular durante un momento y luego queda
 * estable (con algún parpadeo muy ocasional). Salida HDR para el bloom.
 */
export function crearUniformsNeon() {
  return {
    uMascara: { value: null as THREE.Texture | null },
    uColor: { value: new THREE.Color() },
    uIntensidad: { value: 2.5 },
    uTiempo: { value: 0 },
    uEncendido: { value: 1 }, // 0 apagado / 1 encendido
    uTiempoCambio: { value: -10 }, // cuándo se encendió (para el parpadeo de arranque)
    uParpadeo: { value: 1 }, // 0 = sin parpadeo (movimiento reducido)
  };
}

export const vertexNeon = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentNeon = /* glsl */ `
  uniform sampler2D uMascara;
  uniform vec3 uColor;
  uniform float uIntensidad;
  uniform float uTiempo;
  uniform float uEncendido;
  uniform float uTiempoCambio;
  uniform float uParpadeo;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n * 91.345) * 47453.5453); }

  void main() {
    float m = texture2D(uMascara, vUv).r;
    float tubo = smoothstep(0.72, 0.95, m);  // núcleo del tubo
    float halo = smoothstep(0.02, 0.7, m);   // resplandor alrededor

    // Arranque: parpadeo irregular durante ~1.6 s después de encender
    float desde = uTiempo - uTiempoCambio;
    float arranque = step(0.42, hash(floor(desde * 17.0))) * step(0.2, hash(floor(desde * 5.0) + 3.0));
    float estado = desde < 1.6 ? mix(1.0, arranque, uParpadeo) : 1.0;
    // Parpadeo ocasional ya estable (muy raro, breve)
    float ocasional = step(0.996, hash(floor(uTiempo * 9.0)));
    estado *= 1.0 - ocasional * 0.7 * uParpadeo;
    estado *= uEncendido;

    // Apagado se ve el tubo de vidrio tenue
    vec3 apagado = uColor * tubo * 0.06;
    vec3 encendido = uColor * (tubo * uIntensidad + halo * 0.35 * uIntensidad * 0.5);
    vec3 color = mix(apagado, encendido, estado);
    float alfa = max(tubo, halo * estado);
    gl_FragColor = vec4(color, alfa);
    #include <colorspace_fragment>
  }
`;
