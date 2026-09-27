/**
 * Shaders del "Núcleo CHC" (hero de Inicio): un núcleo orgánico que respira
 * con ruido simplex, dos arcos abiertos (las "C" del logo) y polvo luminoso.
 * Los colores llegan como uniforms desde theme.ts (`marca`).
 */

// Ruido simplex 3D (Ashima Arts / Stefan Gustavson, licencia MIT)
const ruidoSimplex = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
    i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/* ------------------------------------------------------------------ Núcleo */

export const nucleoVertex = /* glsl */ `
uniform float uTiempo;
uniform vec3 uRuido;      // escala, amplitud, velocidad
uniform vec3 uRuidoFino;  // escala, amplitud, velocidad
uniform vec3 uPuntero;    // dirección hacia el puntero, en espacio del objeto
uniform float uAtraccion;
uniform float uCrecer;    // 0..1
uniform float uCrecerRelieve;

varying vec3 vNormalMundo;
varying vec3 vPosMundo;
varying float vRelieve;

${ruidoSimplex}

float relieve(vec3 p) {
  vec3 n = normalize(p);
  float t = uTiempo;
  float d = snoise(n * uRuido.x + vec3(0.0, t * uRuido.z, t * uRuido.z * 0.7));
  d *= uRuido.y * (1.0 + uCrecer * uCrecerRelieve);
  d += snoise(n * uRuidoFino.x - t * uRuidoFino.z) * uRuidoFino.y;
  // Se abomba hacia donde apunta el mouse
  d += pow(max(dot(n, uPuntero), 0.0), 3.0) * uAtraccion;
  return d;
}

void main() {
  vec3 n = normalize(position);
  // Normal recalculada por diferencias finitas sobre la esfera deformada
  vec3 t1 = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 t2 = cross(n, t1);
  float e = 0.012;
  float d0 = relieve(n);
  vec3 p0 = n * (1.0 + d0);
  vec3 na = normalize(n + t1 * e);
  vec3 nb = normalize(n + t2 * e);
  vec3 pa = na * (1.0 + relieve(na));
  vec3 pb = nb * (1.0 + relieve(nb));
  vec3 normalDeformada = normalize(cross(pa - p0, pb - p0));
  if (dot(normalDeformada, n) < 0.0) normalDeformada = -normalDeformada;

  vRelieve = d0;
  vec4 mundo = modelMatrix * vec4(p0, 1.0);
  vPosMundo = mundo.xyz;
  vNormalMundo = normalize(mat3(modelMatrix) * normalDeformada);
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

export const nucleoFragment = /* glsl */ `
uniform vec3 uVerde;
uniform vec3 uCian;
uniform vec3 uFondo;
uniform vec3 uLuz;
uniform float uTiempo;
uniform float uCrecer;

varying vec3 vNormalMundo;
varying vec3 vPosMundo;
varying float vRelieve;

void main() {
  vec3 n = normalize(vNormalMundo);
  vec3 v = normalize(cameraPosition - vPosMundo);
  vec3 l = normalize(uLuz);
  float nv = max(dot(n, v), 0.0);

  // Degradado de marca en diagonal (verde arriba a la izquierda, turquesa
  // abajo a la derecha), empujado un poco por el relieve
  float g = clamp(0.5 - 0.45 * n.y + 0.35 * n.x + vRelieve * 1.2, 0.0, 1.0);
  vec3 marca = mix(uVerde, uCian, g);

  // Cuerpo: azul noche profundo en sombra, color de marca donde da la luz
  float difusa = max(dot(n, l), 0.0);
  float envolvente = smoothstep(-0.2, 1.0, dot(n, l));
  vec3 color = mix(uFondo * 0.9, marca, 0.08 + 0.6 * envolvente * envolvente);

  // Bandas iridiscentes suaves que recorren el relieve
  float bandas = 0.5 + 0.5 * sin(vRelieve * 30.0 + dot(n, vec3(1.3, 0.7, 0.2)) * 2.4 + uTiempo * 0.45);
  color += marca * bandas * 0.08 * (0.3 + difusa);

  // Valles algo más oscuros
  color *= 0.82 + 0.3 * smoothstep(-0.12, 0.14, vRelieve);

  // Dos brillos: uno ancho y suave, otro nítido (superficie pulida, líquida)
  vec3 h = normalize(l + v);
  float nh = max(dot(n, h), 0.0);
  color += vec3(pow(nh, 18.0)) * 0.18 + vec3(pow(nh, 120.0)) * 0.9;

  // Luz de contra en turquesa por abajo a la derecha + borde fresnel
  float contra = pow(max(dot(n, normalize(vec3(0.7, -0.6, -0.3))), 0.0), 2.0);
  color += uCian * contra * 0.35;
  float fresnel = pow(1.0 - nv, 3.0);
  color += mix(uCian, vec3(1.0), 0.15) * fresnel * (0.75 + uCrecer * 0.6);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

/* ------------------------------------------------------------------ Arcos */

export const arcoVertex = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalMundo;
varying vec3 vPosMundo;

void main() {
  vUv = uv;
  vec4 mundo = modelMatrix * vec4(position, 1.0);
  vPosMundo = mundo.xyz;
  vNormalMundo = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

export const arcoFragment = /* glsl */ `
uniform vec3 uVerde;
uniform vec3 uCian;
uniform vec3 uLuz;
uniform float uIntensidad;

varying vec2 vUv;
varying vec3 vNormalMundo;
varying vec3 vPosMundo;

void main() {
  vec3 n = normalize(vNormalMundo);
  vec3 v = normalize(cameraPosition - vPosMundo);
  // vUv.x recorre el arco: la cola se desvanece y la cabeza brilla
  float a = vUv.x;
  vec3 color = mix(uVerde, uCian, a);
  float luz = 0.55 + 0.45 * max(dot(n, normalize(uLuz)), 0.0);
  color *= luz;
  color += pow(1.0 - max(dot(n, v), 0.0), 2.0) * 0.35;
  color += vec3(1.0) * pow(a, 14.0) * 0.6;
  float alfa = smoothstep(0.0, 0.45, a) * uIntensidad;
  gl_FragColor = vec4(color * uIntensidad, alfa);
  #include <colorspace_fragment>
}
`;

/* --------------------------------------------------------------- Partículas */

export const polvoVertex = /* glsl */ `
uniform float uTiempo;
uniform float uTamano;
uniform float uDpr;
attribute float aFase;
varying float vBrillo;

void main() {
  vec4 vista = modelViewMatrix * vec4(position, 1.0);
  vBrillo = 0.45 + 0.55 * sin(uTiempo * 1.3 + aFase * 6.2831);
  gl_PointSize = uTamano * uDpr * (0.6 + 0.4 * vBrillo) / -vista.z;
  gl_Position = projectionMatrix * vista;
}
`;

export const polvoFragment = /* glsl */ `
uniform vec3 uColor;
varying float vBrillo;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float alfa = smoothstep(0.5, 0.0, d) * vBrillo * 0.7;
  gl_FragColor = vec4(uColor * alfa, alfa);
  #include <colorspace_fragment>
}
`;
