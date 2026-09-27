import * as THREE from 'three';

/**
 * Partículas con THREE.Points: puntos redondos y suaves, tamaño según la
 * distancia y alfa por partícula. Dos modos (define MODO):
 *  0 = polvo que flota en el haz de luz de la ventana (solo se ve dentro del haz);
 *  1 = vapor que sube de la cafetera mientras se prepara café.
 */
export function crearUniformsParticulas() {
  return {
    uTiempo: { value: 0 },
    uTam: { value: 0.02 }, // tamaño en metros
    uEscala: { value: 400 }, // alto del render / 2 (para pasar a píxeles)
    uColor: { value: new THREE.Color() },
    uOpacidad: { value: 1 },
    // Polvo: caja donde flota y haz de luz (origen, dirección, radio)
    uCajaMin: { value: new THREE.Vector3() },
    uCajaMax: { value: new THREE.Vector3() },
    uHazOrigen: { value: new THREE.Vector3() },
    uHazDir: { value: new THREE.Vector3(1, 0, 0) },
    uHazRadio: { value: 1 },
    // Vapor: punto de salida y altura
    uOrigen: { value: new THREE.Vector3() },
    uAltura: { value: 0.5 },
  };
}

export const vertexParticulas = /* glsl */ `
  attribute float aSemilla;
  uniform float uTiempo;
  uniform float uTam;
  uniform float uEscala;
  uniform vec3 uCajaMin;
  uniform vec3 uCajaMax;
  uniform vec3 uHazOrigen;
  uniform vec3 uHazDir;
  uniform float uHazRadio;
  uniform vec3 uOrigen;
  uniform float uAltura;
  varying float vAlfa;

  void main() {
    vec3 p;
  #if MODO == 0
    // Deriva lenta y ondulante, envuelta dentro de la caja
    vec3 tam = uCajaMax - uCajaMin;
    vec3 deriva = vec3(
      sin(uTiempo * 0.11 + aSemilla * 6.0) * 0.25 + uTiempo * 0.015,
      sin(uTiempo * 0.07 + aSemilla * 13.0) * 0.18 - uTiempo * 0.004,
      cos(uTiempo * 0.09 + aSemilla * 9.0) * 0.22
    );
    p = uCajaMin + mod(position - uCajaMin + deriva, tam);
    // Solo visible dentro del haz: distancia al eje
    vec3 aPunto = p - uHazOrigen;
    float largo = dot(aPunto, uHazDir);
    float distEje = length(aPunto - uHazDir * largo);
    vAlfa = (1.0 - smoothstep(uHazRadio * 0.4, uHazRadio, distEje)) * step(0.0, largo);
    vAlfa *= 0.35 + 0.65 * fract(aSemilla * 7.13); // alfa distinto por partícula
  #else
    // Vida de 0 a 1: sube, se ensancha y se desvanece
    float vida = fract(uTiempo * 0.35 + aSemilla);
    float giro = aSemilla * 40.0 + uTiempo * 0.8;
    float abre = 0.03 + vida * 0.16;
    p = uOrigen + vec3(cos(giro) * abre + position.x * vida, vida * uAltura, sin(giro) * abre + position.z * vida);
    vAlfa = sin(vida * 3.1416) * (0.4 + 0.6 * fract(aSemilla * 3.7));
  #endif
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float tamPart = uTam;
  #if MODO == 1
    tamPart *= 0.6 + fract(uTiempo * 0.35 + aSemilla) * 1.6;
  #endif
    gl_PointSize = tamPart * uEscala / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const fragmentParticulas = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacidad;
  varying float vAlfa;
  void main() {
    // Punto redondo con borde suave
    float d = length(gl_PointCoord - 0.5);
    float suave = smoothstep(0.5, 0.0, d);
    float a = suave * vAlfa * uOpacidad;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
