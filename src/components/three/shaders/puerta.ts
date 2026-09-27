import * as THREE from 'three';

/**
 * Luz de las puertas, en tres modos (define MODO):
 *  0 = pared: halo que se escapa por los bordes del marco (más fuerte abajo);
 *  1 = suelo: abanico de luz que sale por debajo de la puerta;
 *  2 = interior: el vano iluminado que se ve al abrirla.
 * Color propio de cada integrante (equipo.ts) y pulso lento. Mezcla aditiva
 * y valores HDR para que el bloom la recoja.
 */
export function crearUniformsPuerta() {
  return {
    uColor: { value: new THREE.Color() },
    uIntensidad: { value: 1 },
    uTiempo: { value: 0 },
    uPeriodo: { value: 4.5 },
    uApertura: { value: 0 }, // 0 cerrada → 1 abierta del todo
    uMedioPuerta: { value: new THREE.Vector2(0.5, 1.075) }, // medio ancho / medio alto (m)
    uMedioQuad: { value: new THREE.Vector2(1, 1.3) }, // medio tamaño del quad (m)
  };
}

export const vertexPuerta = /* glsl */ `
  varying vec2 vLocal; // posición en metros dentro del quad, centrada
  uniform vec2 uMedioQuad;
  void main() {
    vLocal = (uv - 0.5) * 2.0 * uMedioQuad;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentPuerta = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensidad;
  uniform float uTiempo;
  uniform float uPeriodo;
  uniform float uApertura;
  uniform vec2 uMedioPuerta;
  uniform vec2 uMedioQuad;
  varying vec2 vLocal;

  void main() {
    // Pulso lento de la luz de la habitación de al lado
    float pulso = 0.82 + 0.18 * sin(uTiempo * 6.2831 / uPeriodo);
    float luz = 0.0;

  #if MODO == 0
    // Pared: distancia al rectángulo de la puerta (origen del quad = centro de la puerta)
    vec2 q = abs(vLocal) - uMedioPuerta;
    float fuera = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    float halo = exp(-max(fuera, 0.0) * 9.0) * step(0.0, fuera);
    // Rendija inferior: línea muy intensa junto al suelo
    float abajo = exp(-pow((vLocal.y + uMedioPuerta.y) / 0.02, 2.0)) * step(abs(vLocal.x), uMedioPuerta.x);
    // Al entreabrir, se escapa más luz por el lado de la manija
    float lado = exp(-abs(vLocal.x - uMedioPuerta.x) * 14.0) * step(abs(vLocal.y), uMedioPuerta.y) * uApertura * 3.0;
    luz = halo * 0.5 + abajo * 2.6 + lado;
  #elif MODO == 1
    // Suelo: abanico desde la base de la puerta (vLocal.y = 0 en la puerta)
    float dist = vLocal.y + uMedioQuad.y;
    float ancho = uMedioPuerta.x + dist * (0.35 + uApertura * 0.9);
    float lateral = 1.0 - smoothstep(ancho * 0.6, ancho, abs(vLocal.x));
    luz = lateral * exp(-dist * (4.2 - uApertura * 2.6)) * (0.8 + uApertura * 1.5);
  #else
    // Interior: vano lleno de luz, más intenso en el centro
    float centro = 1.0 - length(vLocal / uMedioQuad) * 0.45;
    luz = (1.2 + uApertura * 2.5) * centro;
    pulso = 1.0;
  #endif

    vec3 color = uColor * luz * uIntensidad * pulso;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
