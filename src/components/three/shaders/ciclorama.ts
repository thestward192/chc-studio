import * as THREE from 'three';

/**
 * Shader del ciclorama (fondo infinito de estudio fotográfico).
 * Todos los colores llegan como uniforms desde theme.ts.
 * La sombra de contacto de la laptop se pinta aquí mismo, fundida con el piso.
 */
export function crearUniformsCiclorama() {
  return {
    uColorCentro: { value: new THREE.Color() },
    uColorBorde: { value: new THREE.Color() },
    uColorApagado: { value: new THREE.Color() },
    uColorSombra: { value: new THREE.Color() },
    uColorLuzPantalla: { value: new THREE.Color() },
    uColorRanura: { value: new THREE.Color() },
    uTiempo: { value: 0 },
    uResolucion: { value: new THREE.Vector2(1, 1) },
    uEntrada: { value: 0 }, // 0 = estudio apagado, 1 = luces encendidas
    uGrano: { value: 0 },
    uVineta: { value: 0 },
    uCharco: { value: 0 },
    uOscurecer: { value: 0 },
    // Sombra de contacto: centro (xz), medio tamaño de la huella, giro Y,
    // altura de flotación y opacidad.
    uSombraCentro: { value: new THREE.Vector2() },
    uSombraTam: { value: new THREE.Vector2(1.5, 1.05) },
    uSombraGiro: { value: 0 },
    uSombraAltura: { value: 0 },
    uSombraOpacidad: { value: 0 },
    uTapaAbierta: { value: 0 },
    // Luz de la pantalla: centro, normal, eje horizontal y medio tamaño.
    uPantallaCentro: { value: new THREE.Vector3() },
    uPantallaNormal: { value: new THREE.Vector3(0, 0, 1) },
    uPantallaDerecha: { value: new THREE.Vector3(1, 0, 0) },
    uPantallaTam: { value: new THREE.Vector2(1.4, 0.85) },
    uLuzPantalla: { value: 0 },
    // Luz que escapa por la ranura de la tapa cerrada.
    uRanuraPos: { value: new THREE.Vector3() },
    uLuzRanura: { value: 0 },
  };
}

export const vertexCiclorama = /* glsl */ `
  varying vec3 vPosMundo;
  varying vec3 vNormalMundo;

  void main() {
    vec4 mundo = modelMatrix * vec4(position, 1.0);
    vPosMundo = mundo.xyz;
    vNormalMundo = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * mundo;
  }
`;

export const fragmentCiclorama = /* glsl */ `
  uniform vec3 uColorCentro;
  uniform vec3 uColorBorde;
  uniform vec3 uColorApagado;
  uniform vec3 uColorSombra;
  uniform vec3 uColorLuzPantalla;
  uniform vec3 uColorRanura;
  uniform float uTiempo;
  uniform vec2 uResolucion;
  uniform float uEntrada;
  uniform float uGrano;
  uniform float uVineta;
  uniform float uCharco;
  uniform float uOscurecer;
  uniform vec2 uSombraCentro;
  uniform vec2 uSombraTam;
  uniform float uSombraGiro;
  uniform float uSombraAltura;
  uniform float uSombraOpacidad;
  uniform float uTapaAbierta;
  uniform vec3 uPantallaCentro;
  uniform vec3 uPantallaNormal;
  uniform vec3 uPantallaDerecha;
  uniform vec2 uPantallaTam;
  uniform float uLuzPantalla;
  uniform vec3 uRanuraPos;
  uniform float uLuzRanura;

  varying vec3 vPosMundo;
  varying vec3 vNormalMundo;

  // Hash barato para el grano (valor pseudoaleatorio por píxel).
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Distancia con signo a un rectángulo redondeado (huella de la laptop).
  float sdRectRedondeado(vec2 p, vec2 medio, float radio) {
    vec2 q = abs(p) - medio + radio;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radio;
  }

  void main() {
    vec3 p = vPosMundo;

    // --- Degradado de dos tonos ---
    // Coordenada "desenrollada": la pared cuenta como continuación del piso,
    // así el degradado cruza la curva sin costura.
    // Más claro justo detrás de la laptop, más oscuro hacia los bordes.
    // El foco cae en el piso justo detrás de la laptop, al pie de la curva.
    float s = p.y - p.z;
    float eje = (s - 3.0) / (s > 3.0 ? 12.0 : 15.0);
    float distFoco = length(vec2(p.x / 15.0, eje));
    vec3 color = mix(uColorCentro, uColorBorde, smoothstep(0.0, 1.0, distFoco));

    // --- Charco de luz elíptico bajo la laptop ---
    vec2 dCharco = (p.xz - vec2(0.0, 0.15)) / vec2(4.2, 3.0);
    float charco = exp(-dot(dCharco, dCharco) * 1.6) * step(p.y, 0.05);
    color = mix(color, uColorCentro * 1.25, charco * uCharco);

    // --- Sombra de contacto ---
    // Se calcula en el marco local de la laptop (gira con ella). Dos capas:
    // un núcleo nítido y una penumbra amplia; ambas se abren y aclaran
    // cuanto más alto flota la laptop.
    float cg = cos(uSombraGiro), sg = sin(uSombraGiro);
    vec2 local = p.xz - uSombraCentro;
    local = vec2(cg * local.x - sg * local.y, sg * local.x + cg * local.y);
    float difusion = 0.04 + uSombraAltura * 1.4;
    float d = sdRectRedondeado(local, uSombraTam * (1.0 + uSombraAltura * 0.35), 0.12);
    float nucleo = 1.0 - smoothstep(-0.05, difusion + 0.03, d);
    float penumbra = 1.0 - smoothstep(-0.2, 0.9 + difusion * 2.0, d);
    // Con la tapa abierta, la sombra se alarga un poco hacia atrás.
    vec2 localTapa = local - vec2(0.0, -uSombraTam.y - 0.35);
    float tapa = (1.0 - smoothstep(0.0, 0.7, sdRectRedondeado(localTapa, vec2(uSombraTam.x, 0.35), 0.2))) * uTapaAbierta;
    float fuerza = 1.0 / (1.0 + uSombraAltura * 6.0);
    float sombra = (nucleo * 0.75 * fuerza + penumbra * 0.35 + tapa * 0.25) * step(p.y, 0.05);
    color = mix(color, uColorSombra, clamp(sombra * uSombraOpacidad, 0.0, 1.0));

    // --- Reflejo difuso de la pantalla encendida ---
    // Un rectángulo suave proyectado desde la pantalla hacia donde mira:
    // tiñe el piso delante y la pared cercana.
    vec3 aPunto = p - uPantallaCentro;
    float distancia = length(aPunto);
    float frente = max(dot(aPunto / max(distancia, 1e-4), uPantallaNormal), 0.0);
    float lateral = abs(dot(aPunto, uPantallaDerecha));
    float ancho = uPantallaTam.x + distancia * 0.55;
    float rect = 1.0 - smoothstep(ancho * 0.45, ancho, lateral);
    float caida = 1.0 / (1.0 + distancia * distancia * 0.18);
    float orientacion = 0.35 + 0.65 * max(dot(vNormalMundo, -normalize(aPunto)), 0.0);
    float luzPantalla = pow(frente, 1.5) * rect * caida * orientacion * uLuzPantalla;
    color += uColorLuzPantalla * luzPantalla;

    // --- Luz que escapa por la ranura de la tapa cerrada ---
    vec2 dRanura = (p.xz - uRanuraPos.xz - vec2(0.0, 0.35)) / vec2(1.6, 0.45);
    color += uColorRanura * exp(-dot(dRanura, dRanura) * 2.0) * uLuzRanura * step(p.y, 0.05);

    // --- Viñeta (en espacio de pantalla) ---
    vec2 uvPantalla = gl_FragCoord.xy / uResolucion;
    vec2 v = (uvPantalla - 0.5) * vec2(uResolucion.x / uResolucion.y, 1.0);
    float vineta = smoothstep(0.35, 1.25, length(v));
    color = mix(color, uColorBorde * 0.7, vineta * uVineta);

    // --- Foco durante el zoom y entrada de luces ---
    color *= 1.0 - uOscurecer;
    color = mix(uColorApagado, color, uEntrada);

    // --- Grano de película: ruido por píxel que cambia con el tiempo ---
    float grano = hash12(gl_FragCoord.xy + fract(uTiempo * 7.13) * 431.7) - 0.5;
    color += grano * uGrano;

    gl_FragColor = vec4(max(color, 0.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
