import * as THREE from 'three';

/**
 * Pantallas de videojuego de las oficinas (máquina arcade y televisor),
 * dibujadas por completo en el shader, sin texturas:
 *  - MODO 0: invasores que bajan en formación + nave + estrellas (arcade).
 *  - MODO 1: plataformas con un personaje que salta (consola).
 * Pixelado a una rejilla baja para que se lea como juego retro. Salida HDR
 * para que el bloom la haga brillar. Colores por uniforms (tema/integrante).
 */
export function crearUniformsPantallaJuego() {
  return {
    uTiempo: { value: 0 },
    uEncendido: { value: 1 },
    uColorA: { value: new THREE.Color() },
    uColorB: { value: new THREE.Color() },
    uFondo: { value: new THREE.Color() },
    uBrillo: { value: 1.4 },
    uResolucion: { value: new THREE.Vector2(96, 72) },
  };
}

export const vertexPantallaJuego = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentPantallaJuego = /* glsl */ `
  uniform float uTiempo;
  uniform float uEncendido;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uFondo;
  uniform float uBrillo;
  uniform vec2 uResolucion;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Figura de invasor de 8×6 píxeles codificada en bits (patas animadas)
  float invasor(vec2 p, float cuadro) {
    if (p.x < 0.0 || p.y < 0.0 || p.x >= 8.0 || p.y >= 6.0) return 0.0;
    vec2 q = floor(p);
    float x = q.x < 4.0 ? q.x : 7.0 - q.x; // simétrico
    float fila = q.y;
    float bits = fila == 5.0 ? 2.0 : fila == 4.0 ? 15.0 : fila == 3.0 ? 13.0 : fila == 2.0 ? 15.0 : fila == 1.0 ? (cuadro > 0.5 ? 9.0 : 6.0) : (cuadro > 0.5 ? 4.0 : 8.0);
    return mod(floor(bits / pow(2.0, x)), 2.0);
  }

  void main() {
    vec2 px = floor(vUv * uResolucion);
    vec2 uv = px / uResolucion;
    float t = uTiempo;
    vec3 color = uFondo;

  #if MODO == 0
    // Estrellas que bajan
    float estrella = step(0.985, hash(vec2(px.x, floor(px.y + t * 6.0))));
    color += vec3(0.6) * estrella;
    // Formación de invasores
    float cuadro = mod(floor(t * 2.0), 2.0);
    vec2 base = vec2(12.0 + sin(t * 0.8) * 10.0, uResolucion.y - 30.0 + mod(-t * 1.2, 8.0));
    for (int f = 0; f < 3; f++) {
      for (int c = 0; c < 6; c++) {
        vec2 o = base + vec2(float(c) * 12.0, float(f) * -9.0);
        float v = invasor(px - o, cuadro);
        color = mix(color, f == 1 ? uColorB : uColorA, v);
      }
    }
    // Nave del jugador y disparo
    float naveX = uResolucion.x * 0.5 + sin(t * 1.3) * 30.0;
    vec2 n = px - vec2(naveX, 4.0);
    float nave = step(abs(n.x), 3.0 - n.y) * step(0.0, n.y) * step(n.y, 2.0);
    color = mix(color, vec3(1.0), nave);
    float disparoY = mod(t * 40.0, uResolucion.y);
    color = mix(color, uColorB, step(abs(px.x - naveX), 0.5) * step(abs(px.y - disparoY), 1.5));
  #else
    // Cielo con degradado y nubes de píxeles
    color = mix(uFondo, uColorA * 0.45 + uFondo, uv.y);
    float nube = step(0.72, hash(floor(vec2(px.x / 6.0 + t * 0.8, px.y / 4.0)))) * step(0.6, uv.y);
    color = mix(color, vec3(0.9), nube * 0.5);
    // Suelo con bloques que avanzan
    float suelo = step(px.y, 10.0);
    float bloque = mod(floor((px.x + t * 18.0) / 6.0), 2.0);
    color = mix(color, mix(uColorB * 0.6, uColorB * 0.85, bloque), suelo);
    // Plataformas flotantes
    float plataforma = step(abs(px.y - 28.0), 1.5) * step(0.55, hash(vec2(floor((px.x + t * 18.0) / 14.0), 3.0)));
    color = mix(color, uColorB, plataforma);
    // Personaje: salta con una parábola periódica
    float fase = fract(t * 0.7);
    float altura = 11.0 + 20.0 * 4.0 * fase * (1.0 - fase);
    vec2 pj = px - vec2(uResolucion.x * 0.3, altura);
    float cuerpo = step(0.0, pj.x) * step(pj.x, 4.0) * step(0.0, pj.y) * step(pj.y, 6.0);
    color = mix(color, uColorA * 1.3 + 0.15, cuerpo);
    color = mix(color, vec3(1.0), step(abs(pj.x - 3.0), 0.5) * step(abs(pj.y - 4.5), 0.5) * cuerpo);
    // Monedas
    float moneda = step(length(vec2(mod(px.x + t * 18.0, 24.0) - 12.0, px.y - 40.0)), 1.6);
    color = mix(color, vec3(1.0, 0.85, 0.3), moneda);
  #endif

    // Líneas de barrido y viñeta de tubo
    color *= 0.82 + 0.18 * step(0.5, fract(vUv.y * uResolucion.y));
    vec2 d = vUv - 0.5;
    color *= 1.0 - dot(d, d) * 1.1;

    gl_FragColor = vec4(color * uBrillo * uEncendido + uFondo * 0.15 * (1.0 - uEncendido), 1.0);
    #include <colorspace_fragment>
  }
`;
