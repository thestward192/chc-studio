import * as THREE from 'three';

/**
 * Vista de la ventana: cielo con degradado de día/noche, nubes suaves con
 * ruido fbm y dos capas de edificios (con paralaje real según la cámara:
 * están "lejos" detrás del vidrio). De noche se encienden ventanas al azar
 * y aparecen estrellas.
 */
export function crearUniformsVentana() {
  return {
    uTiempo: { value: 0 },
    uNoche: { value: 0 },
    uTam: { value: new THREE.Vector2(2.4, 1.7) }, // tamaño del vidrio (m)
    uNubes: { value: 0.6 },
    uVelocidadNubes: { value: 0.012 },
    uCieloDiaArriba: { value: new THREE.Color() },
    uCieloDiaHorizonte: { value: new THREE.Color() },
    uCieloNocheArriba: { value: new THREE.Color() },
    uCieloNocheHorizonte: { value: new THREE.Color() },
    uColorNubes: { value: new THREE.Color() },
    uEdificiosDia: { value: new THREE.Color() },
    uEdificiosNoche: { value: new THREE.Color() },
    uVentanasLuz: { value: new THREE.Color() },
  };
}

export const vertexVentana = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vVistaLocal;
  void main() {
    vUv = uv;
    vec3 camaraLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vVistaLocal = camaraLocal - position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentVentana = /* glsl */ `
  uniform float uTiempo;
  uniform float uNoche;
  uniform vec2 uTam;
  uniform float uNubes;
  uniform float uVelocidadNubes;
  uniform vec3 uCieloDiaArriba;
  uniform vec3 uCieloDiaHorizonte;
  uniform vec3 uCieloNocheArriba;
  uniform vec3 uCieloNocheHorizonte;
  uniform vec3 uColorNubes;
  uniform vec3 uEdificiosDia;
  uniform vec3 uEdificiosNoche;
  uniform vec3 uVentanasLuz;

  varying vec2 vUv;
  varying vec3 vVistaLocal;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * ruido(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  // Punto visto "a través" del vidrio a una profundidad dada (m), en coordenadas del vidrio.
  vec2 aProfundidad(float profundidad) {
    vec2 p = (vUv - 0.5) * uTam;
    vec3 v = normalize(vVistaLocal);
    return p - v.xy / max(v.z, 0.2) * profundidad;
  }

  // Capa de edificios: devuelve (máscara de edificio, ventana encendida)
  vec2 edificios(vec2 q, float densidad, float alturaBase, float alturaVar, float semilla) {
    float x = q.x * densidad;
    float indice = floor(x);
    float h = alturaBase + hash(vec2(indice, semilla)) * alturaVar;
    float mascara = step(q.y, h);
    // Rejilla de ventanas dentro del edificio
    vec2 celda = vec2(fract(x) * 5.0, q.y * densidad * 7.0);
    vec2 idCelda = floor(celda) + vec2(indice * 7.0, semilla);
    float hueco = step(0.25, fract(celda.x)) * step(fract(celda.x), 0.75) * step(0.3, fract(celda.y)) * step(fract(celda.y), 0.75);
    float encendida = step(0.62, hash(idCelda)) * hueco * step(q.y, h - 0.05);
    return vec2(mascara, encendida * mascara);
  }

  void main() {
    // Cielo (muy lejos)
    vec2 cielo = aProfundidad(60.0);
    float altura = clamp(cielo.y / 30.0 + 0.45, 0.0, 1.0);
    vec3 dia = mix(uCieloDiaHorizonte, uCieloDiaArriba, smoothstep(0.1, 1.0, altura));
    vec3 noche = mix(uCieloNocheHorizonte, uCieloNocheArriba, smoothstep(0.0, 0.8, altura));
    vec3 color = mix(dia, noche, uNoche);

    // Estrellas (solo de noche)
    vec2 celdaEstrella = floor(cielo * 1.6);
    float estrella = step(0.985, hash(celdaEstrella)) * smoothstep(0.35, 0.0, length(fract(cielo * 1.6) - 0.5));
    color += uColorNubes * estrella * uNoche * 0.8 * altura;

    // Nubes con ruido que se desplazan despacio
    vec2 pn = cielo * vec2(0.05, 0.12) + vec2(uTiempo * uVelocidadNubes, 0.0);
    float nubes = smoothstep(0.5, 0.85, fbm(pn)) * uNubes * smoothstep(0.15, 0.6, altura);
    color = mix(color, uColorNubes * mix(1.0, 0.12, uNoche), nubes);

    // Edificios lejanos y cercanos (paralaje distinto)
    vec3 colorEdificio = mix(uEdificiosDia, uEdificiosNoche, uNoche);
    vec2 lejos = edificios(aProfundidad(40.0) + vec2(0.0, 6.0), 0.35, -2.0, 6.0, 1.0);
    color = mix(color, mix(colorEdificio, color, 0.45), lejos.x);
    color += uVentanasLuz * lejos.y * uNoche * 0.8;
    vec2 cerca = edificios(aProfundidad(14.0) + vec2(0.0, 3.2), 0.6, -1.0, 3.0, 7.0);
    color = mix(color, colorEdificio * 0.8, cerca.x);
    color += uVentanasLuz * cerca.y * uNoche * 1.4;

    // Un poco de HDR de día: el exterior es más brillante que la sala
    color *= mix(1.25, 1.0, uNoche);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
