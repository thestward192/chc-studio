/**
 * Shaders de la mascota del hero de Inicio: cuerpo de silicona esmerilada
 * (blanco arriba, aqua luminoso abajo, bordes translúcidos en cian), visor
 * de cristal negro con los ojos dibujados por SDF (cada expresión es un campo
 * de distancia y se mezclan entre sí para cambiar de cara con fluidez), el
 * brillo del suelo, los destellos de "curioso" y la sala sin fondo por la
 * que pasea (suelo con cuadrícula que se pierde en la oscuridad y polvo).
 * Los colores llegan como uniforms desde theme.ts (`mascota`).
 */

/** La punta se dobla con retraso (muelle): más cuanto más arriba. */
const flexion = /* glsl */ `
uniform vec2 uFlex;
vec3 flexionar(vec3 p) {
  float h = clamp(p.y / 1.2, 0.0, 1.0);
  h *= h;
  return p + vec3(uFlex.x * h, 0.0, uFlex.y * h);
}
`;

/* ------------------------------------------------------------------ Cuerpo */

export const cuerpoVertex = /* glsl */ `
attribute float aHueco;
varying vec3 vNormalMundo;
varying vec3 vPosMundo;
varying float vAltura;
varying float vHueco;
varying vec3 vNormalObjeto;
${flexion}

void main() {
  vec4 mundo = modelMatrix * vec4(flexionar(position), 1.0);
  vPosMundo = mundo.xyz;
  vNormalMundo = normalize(mat3(modelMatrix) * normal);
  vNormalObjeto = normal;
  vAltura = position.y;
  vHueco = aHueco;
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

export const cuerpoFragment = /* glsl */ `
uniform vec3 uAqua;
uniform vec3 uCian;
uniform vec3 uMenta;
uniform vec3 uBlanco;
uniform vec3 uLuz;
uniform float uBrillo; // 0..1 extra al crecer
uniform vec3 uNiebla;      // color de la tarjeta: lo lejano se funde con ella
uniform vec2 uNieblaRango; // distancia donde empieza y donde acaba

varying vec3 vNormalMundo;
varying vec3 vPosMundo;
varying float vAltura;
varying float vHueco;
varying vec3 vNormalObjeto;

void main() {
  vec3 n = normalize(vNormalMundo);
  vec3 v = normalize(cameraPosition - vPosMundo);
  vec3 l = normalize(uLuz);
  float nv = clamp(dot(n, v), 0.0, 1.0);

  // Altura normalizada: 0 en la colita, 1 en la punta
  float h = clamp((vAltura + 1.0) / 2.05, 0.0, 1.0);
  float abajo = 1.0 - smoothstep(0.0, 0.42, h);

  // Color propio: aqua abajo, menta en medio, blanco arriba
  vec3 albedo = mix(uAqua, uMenta, smoothstep(0.0, 0.5, h));
  albedo = mix(albedo, uBlanco, smoothstep(0.38, 0.88, h));

  // Luz envolvente (material blando): las sombras son azuladas, nunca negras
  float envolver = 0.6;
  float difusa = clamp((dot(n, l) + envolver) / (1.0 + envolver), 0.0, 1.0);
  vec3 sombra = mix(vec3(0.32, 0.47, 0.55), uCian * 0.75, 0.4);
  vec3 color = albedo * mix(sombra, vec3(1.06), difusa);

  // Dispersión interna: la parte baja brilla como si tuviera luz dentro
  color += uAqua * (abajo * abajo) * (0.42 + 0.35 * uBrillo);
  // Rebote del suelo luminoso en las caras que miran hacia abajo
  color += uAqua * pow(max(-n.y, 0.0), 1.6) * 0.55;

  // Bordes translúcidos: cian en el contorno, aqua abajo
  float fresnel = pow(1.0 - nv, 2.4);
  vec3 borde = mix(mix(uCian, uAqua, 0.35) * 1.1, uAqua * 1.3, abajo);
  color = mix(color, borde, fresnel * (0.5 + 0.2 * uBrillo));

  // Brillo satinado ancho (no plástico)
  vec3 mitad = normalize(l + v);
  float nh = max(dot(n, mitad), 0.0);
  color += vec3(pow(nh, 22.0) * 0.16 + pow(nh, 90.0) * 0.12) * (1.0 - abajo);

  // Oclusión dentro del capuchón, junto al visor
  color *= 1.0 - vHueco * 0.45;

  float niebla = smoothstep(uNieblaRango.x, uNieblaRango.y, length(cameraPosition - vPosMundo));
  color = mix(color, uNiebla, niebla * 0.9);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

/* ------------------------------------------------------------------ Visor */

export const visorVertex = /* glsl */ `
attribute vec2 aCara;
varying vec3 vNormalMundo;
varying vec3 vPosMundo;
varying vec2 vCara;
${flexion}

void main() {
  vec4 mundo = modelMatrix * vec4(flexionar(position), 1.0);
  vPosMundo = mundo.xyz;
  vNormalMundo = normalize(mat3(modelMatrix) * normal);
  vCara = aCara;
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

export const visorFragment = /* glsl */ `
uniform vec3 uVisor;
uniform vec3 uCian;
uniform vec3 uOjo;
uniform vec3 uBrilloOjo;
uniform vec3 uLuz;
uniform vec3 uExpresion;   // pesos: neutro, alegre, curioso
uniform float uParpadeo;   // 1 abierto, 0 cerrado
uniform vec2 uMirada;
uniform vec3 uOjos;        // separación, medio largo, radio
uniform vec2 uSemiejes;    // semiejes del visor en coordenadas de la cara
uniform vec3 uNiebla;      // color de la tarjeta: lo lejano se funde con ella
uniform vec2 uNieblaRango; // distancia donde empieza y donde acaba

varying vec3 vNormalMundo;
varying vec3 vPosMundo;
varying vec2 vCara;

float sdCapsula(vec2 p, float h, float r) {
  p.y -= clamp(p.y, -h, h);
  return length(p) - r;
}

// Arco simétrico respecto al eje y, abierto hacia abajo (forma de "^" redondeada)
float sdArco(vec2 p, float apertura, float ra, float rb) {
  vec2 sc = vec2(sin(apertura), cos(apertura));
  p.x = abs(p.x);
  return ((sc.y * p.x > sc.x * p.y) ? length(p - sc * ra) : abs(length(p) - ra)) - rb;
}

vec2 rotar(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// Un ojo: lado = -1 (izquierda de la imagen) o 1. Mezcla las tres caras.
float ojo(vec2 p, float lado) {
  float sep = uOjos.x, largo = uOjos.y, radio = uOjos.z;
  vec2 q = p - vec2(lado * sep, 0.0) - uMirada;
  // Parpadeo: el ojo se aplasta hacia su centro
  float b = max(uParpadeo, 0.06);
  q.y /= b;

  // Neutro: cápsula vertical
  float dNeutro = sdCapsula(q, largo, radio);

  // Alegre: arcos "^" un poco más bajos
  float dAlegre = sdArco(q - vec2(0.0, -0.045), 1.2, 0.1, 0.036);

  // Curioso: un ojo grande y el otro más corto, levantado y ladeado
  vec2 qc = q - vec2(0.0, 0.012);
  float dCurioso = lado > 0.0
    ? sdCapsula(rotar(qc - vec2(0.0, 0.03), 0.16), largo * 0.55, radio * 0.95)
    : sdCapsula(qc, largo * 1.08, radio * 1.02);

  float d = dNeutro * uExpresion.x + dAlegre * uExpresion.y + dCurioso * uExpresion.z;
  return d * mix(1.0, b, 0.6);
}

void main() {
  vec3 n = normalize(vNormalMundo);
  vec3 v = normalize(cameraPosition - vPosMundo);
  vec3 l = normalize(uLuz);
  float nv = clamp(dot(n, v), 0.0, 1.0);

  // Cristal negro: un poco más claro hacia los bordes y reflejo del cuerpo
  vec3 color = uVisor * (0.55 + 0.45 * smoothstep(0.25, 1.0, length(vCara / uSemiejes)));
  float fresnel = pow(1.0 - nv, 3.0);
  color += mix(uCian, vec3(0.8, 0.95, 1.0), 0.4) * fresnel * 0.22;

  // Reflejo de la luz principal: mancha ancha y otra nítida
  vec3 r = reflect(-v, n);
  float rl = max(dot(r, l), 0.0);
  color += vec3(0.75, 0.9, 1.0) * (pow(rl, 5.0) * 0.03 + pow(rl, 40.0) * 0.06);

  // Ojos
  float d = min(ojo(vCara, -1.0), ojo(vCara, 1.0));
  float aa = fwidth(d) * 0.9;
  float nucleo = 1.0 - smoothstep(-aa, aa, d);
  float halo = exp(-max(d, 0.0) * 20.0) * 0.38 + exp(-max(d, 0.0) * 70.0) * 0.5;
  color += uBrilloOjo * halo * (1.0 - nucleo);
  // Centro más blanco, borde cian
  vec3 colorOjo = mix(uBrilloOjo, uOjo, smoothstep(0.0, -0.022, d));
  color = mix(color, colorOjo * 1.15, nucleo);

  // Los ojos atraviesan algo más la niebla que el cuerpo
  float niebla = smoothstep(uNieblaRango.x, uNieblaRango.y, length(cameraPosition - vPosMundo));
  color = mix(color, uNiebla, niebla * (0.9 - 0.4 * max(nucleo, halo)));

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

/* --------------------------------------------------------------- Suelo */

export const sueloVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Charco de luz bajo la mascota: halo amplio cian y anillo aqua bajo las patas. */
export const sueloFragment = /* glsl */ `
uniform vec3 uAqua;
uniform vec3 uCian;
uniform float uIntensidad;
uniform float uAltura; // 0 en el suelo, >0 cuando salta (el halo se encoge)
varying vec2 vUv;

void main() {
  float d = length(vUv);
  float encoger = 1.0 + uAltura * 2.5;
  float de = d * encoger;
  float amplio = exp(-pow(de / 0.66, 2.0)) * 0.45;
  float centro = exp(-pow(de / 0.38, 2.0)) * 0.75;
  vec3 color = uCian * amplio + uAqua * centro;
  // Se apaga antes del borde del plano para que no se vea el corte
  float alfa = clamp((amplio + centro) * uIntensidad / encoger, 0.0, 1.0) * (1.0 - smoothstep(0.6, 0.98, d));
  gl_FragColor = vec4(color * alfa, alfa);
  #include <colorspace_fragment>
}
`;

/* --------------------------------------------------------------- Destellos */

/** Tres rayitas de "¡!" que aparecen junto a la cabeza en la cara de curioso. */
export const destellosFragment = /* glsl */ `
uniform vec3 uBrilloOjo;
uniform vec3 uOjo;
uniform float uAparicion;
varying vec2 vUv;

float sdSegmento(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * t) - r;
}

void main() {
  vec2 p = vUv;
  float d = 1e3;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    // Cada rayita aparece un poco después que la anterior
    float a = clamp(uAparicion * 1.6 - fi * 0.3, 0.0, 1.0);
    float ang = 1.95 - fi * 0.55;
    vec2 dir = vec2(cos(ang), sin(ang));
    float largo = (fi == 1.0 ? 0.36 : 0.26) * a;
    vec2 ini = vec2(-0.55, -0.6) + dir * 0.55;
    d = min(d, sdSegmento(p, ini, ini + dir * max(largo, 0.001), 0.06 * a));
  }
  float aa = fwidth(d);
  float nucleo = 1.0 - smoothstep(-aa, aa, d);
  float halo = exp(-max(d, 0.0) * 14.0) * 0.5;
  vec3 color = mix(uBrilloOjo * halo, uOjo, nucleo);
  float alfa = clamp(nucleo + halo, 0.0, 1.0) * smoothstep(0.0, 0.2, uAparicion);
  gl_FragColor = vec4(color * alfa, alfa);
  #include <colorspace_fragment>
}
`;

/* --------------------------------------------------------- Sala sin fondo */

export const salaSueloVertex = /* glsl */ `
varying vec3 vPosMundo;
void main() {
  vec4 mundo = modelMatrix * vec4(position, 1.0);
  vPosMundo = mundo.xyz;
  gl_Position = projectionMatrix * viewMatrix * mundo;
}
`;

/**
 * Suelo infinito: cuadrícula fina que se apaga con la distancia y se
 * ilumina alrededor de la mascota (la sigue como un foco).
 */
export const salaSueloFragment = /* glsl */ `
uniform vec3 uCian;
uniform vec3 uAqua;
uniform vec3 uFoco;     // posición de la mascota en el suelo
uniform float uCelda;
uniform float uAlcance;
varying vec3 vPosMundo;

void main() {
  vec2 g = vPosMundo.xz / uCelda;
  vec2 ancho = fwidth(g);
  vec2 l = abs(fract(g - 0.5) - 0.5) / max(ancho, vec2(1e-4));
  float linea = 1.0 - min(min(l.x, l.y), 1.0);
  // Las líneas lejanas se juntan: se apagan antes de hacer moiré
  linea *= 1.0 - smoothstep(0.25, 0.6, max(ancho.x, ancho.y));

  float distancia = length(vPosMundo.xz - cameraPosition.xz);
  float lejos = 1.0 - smoothstep(uAlcance * 0.45, uAlcance, distancia);
  float lados = 1.0 - smoothstep(6.0, 14.0, abs(vPosMundo.x));
  vec2 d = vPosMundo.xz - uFoco.xz;
  float foco = exp(-dot(d, d) / 5.0);

  float alfa = (linea * (0.13 + 0.3 * foco) + foco * 0.05) * lejos * lados;
  vec3 color = mix(uCian, uAqua, foco);
  gl_FragColor = vec4(color * alfa, alfa);
  #include <colorspace_fragment>
}
`;

/** Resplandor al fondo de la sala: da la sensación de que no termina. */
export const salaFondoFragment = /* glsl */ `
uniform vec3 uCian;
varying vec2 vUv;
void main() {
  // Franja ancha y baja a la altura del horizonte, más viva en el centro
  float franja = exp(-pow(vUv.y / 0.26, 2.0)) * exp(-pow(vUv.x / 0.6, 2.0));
  float alfa = franja * 0.13 + exp(-dot(vUv, vUv) * 3.0) * 0.05;
  gl_FragColor = vec4(uCian * alfa, alfa);
  #include <colorspace_fragment>
}
`;

export const polvoVertex = /* glsl */ `
uniform float uTiempo;
uniform float uTamano;
uniform float uDpr;
uniform vec2 uNieblaRango;
attribute float aFase;
varying float vBrillo;

void main() {
  vec3 p = position;
  // Sube muy despacio y vuelve a empezar abajo
  p.y = mod(p.y + uTiempo * (0.05 + 0.05 * aFase) + 1.0, 5.0) - 1.0;
  p.x += sin(uTiempo * 0.3 + aFase * 6.28) * 0.15;
  vec4 vista = modelViewMatrix * vec4(p, 1.0);
  float lejos = smoothstep(uNieblaRango.x, uNieblaRango.y * 1.4, -vista.z);
  vBrillo = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTiempo * 1.2 + aFase * 6.28))) * (1.0 - lejos);
  vBrillo *= smoothstep(-1.0, -0.4, p.y) * (1.0 - smoothstep(3.0, 4.0, p.y));
  gl_PointSize = uTamano * uDpr / -vista.z;
  gl_Position = projectionMatrix * vista;
}
`;

export const polvoFragment = /* glsl */ `
uniform vec3 uColor;
varying float vBrillo;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float alfa = smoothstep(0.5, 0.0, d) * vBrillo * 0.55;
  gl_FragColor = vec4(uColor * alfa, alfa);
  #include <colorspace_fragment>
}
`;
