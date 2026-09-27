import * as THREE from 'three';

/**
 * Cuadro de proyecto: la imagen parece hundida detrás del vidrio (paralaje
 * según el ángulo de la cámara), con sombra interior del paspartú, reflejo
 * de vidrio con fresnel y un destello diagonal que lo recorre al hover.
 */
export function crearUniformsCuadro() {
  return {
    uMapa: { value: null as THREE.Texture | null },
    uProfundidad: { value: 0.035 }, // cuánto "se hunde" la imagen
    uDestello: { value: -1 }, // posición del destello (−1 = fuera)
    uIntensidadDestello: { value: 1 },
    uHover: { value: 0 },
    uColorReflejo: { value: new THREE.Color() },
    uColorSombra: { value: new THREE.Color() },
    uAspecto: { value: 1.47 },
  };
}

export const vertexCuadro = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vVistaLocal;  // de la superficie hacia la cámara, en espacio local
  varying vec3 vNormalMundo;
  varying vec3 vPosMundo;
  void main() {
    vUv = uv;
    vec3 camaraLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vVistaLocal = camaraLocal - position;
    vec4 mundo = modelMatrix * vec4(position, 1.0);
    vPosMundo = mundo.xyz;
    vNormalMundo = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * mundo;
  }
`;

export const fragmentCuadro = /* glsl */ `
  uniform sampler2D uMapa;
  uniform float uProfundidad;
  uniform float uDestello;
  uniform float uIntensidadDestello;
  uniform float uHover;
  uniform vec3 uColorReflejo;
  uniform vec3 uColorSombra;
  uniform float uAspecto;

  varying vec2 vUv;
  varying vec3 vVistaLocal;
  varying vec3 vNormalMundo;
  varying vec3 vPosMundo;

  void main() {
    // --- Paralaje: desplazar la imagen según la vista (como si estuviera detrás) ---
    vec3 v = normalize(vVistaLocal);
    vec2 desplazamiento = v.xy / max(v.z, 0.25) * uProfundidad;
    desplazamiento.x /= uAspecto;
    vec2 uv = vUv - desplazamiento;
    // Ligero zoom para que el borde no se vea al desplazar
    vec2 uvImagen = (uv - 0.5) * 0.94 + 0.5;
    vec3 color = texture2D(uMapa, uvImagen).rgb;

    // --- Sombra interior del paspartú (cae del lado opuesto a la vista) ---
    vec2 borde = min(uv, 1.0 - uv);
    float sombra = 1.0 - smoothstep(0.0, 0.06, min(borde.x * uAspecto, borde.y));
    vec2 ladoSombra = clamp(0.5 - vUv + desplazamiento * 12.0, -1.0, 1.0);
    color = mix(color, uColorSombra, sombra * 0.55 * (0.6 + 0.4 * length(ladoSombra)));

    // --- Vidrio: fresnel + reflejo suave ---
    vec3 vista = normalize(cameraPosition - vPosMundo);
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormalMundo), vista), 0.0, 1.0), 4.0);
    float reflejo = smoothstep(0.9, 0.0, abs(vUv.x * 0.5 + vUv.y - 1.1)) * 0.06;
    color += uColorReflejo * (fresnel * 0.5 + reflejo);

    // --- Destello diagonal al pasar el ratón ---
    float diagonal = (vUv.x + vUv.y * 0.6) / 1.6;
    float banda = exp(-pow((diagonal - uDestello) / 0.045, 2.0));
    banda += 0.35 * exp(-pow((diagonal - uDestello + 0.09) / 0.015, 2.0));
    color += uColorReflejo * banda * uIntensidadDestello;

    // Un punto más de brillo al hover (la imagen "se enciende")
    color *= 1.0 + uHover * 0.12;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
