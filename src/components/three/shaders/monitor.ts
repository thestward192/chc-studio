import * as THREE from 'three';

/**
 * Pantalla de monitor: "código" que se desplaza lentamente (líneas de
 * rectángulos de colores generadas en el shader, no texto real), cursor
 * parpadeante y reflejo de vidrio con fresnel. Opcionalmente mezcla una
 * textura con texto real (el monitor principal escribe código en vivo).
 */
export function crearUniformsMonitor() {
  return {
    uTiempo: { value: 0 },
    uVelocidad: { value: 0.35 }, // líneas por segundo
    uLineas: { value: 26 }, // líneas visibles
    uSemilla: { value: 0 },
    uColorFondo: { value: new THREE.Color() },
    uColores: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
    uColorCursor: { value: new THREE.Color() },
    uColorReflejo: { value: new THREE.Color() },
    uReflejo: { value: 0.22 },
    uBrillo: { value: 1.2 },
    uTexto: { value: null as THREE.Texture | null },
    uMezclaTexto: { value: 0 },
  };
}

export const vertexMonitor = /* glsl */ `
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

export const fragmentMonitor = /* glsl */ `
  uniform float uTiempo;
  uniform float uVelocidad;
  uniform float uLineas;
  uniform float uSemilla;
  uniform vec3 uColorFondo;
  uniform vec3 uColores[4];
  uniform vec3 uColorCursor;
  uniform vec3 uColorReflejo;
  uniform float uReflejo;
  uniform float uBrillo;
  uniform sampler2D uTexto;
  uniform float uMezclaTexto;

  varying vec2 vUv;
  varying vec3 vNormalMundo;
  varying vec3 vPosMundo;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32 + uSemilla);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;
    vec3 color = uColorFondo;

    // --- Líneas de "código" que suben lentamente ---
    float y = (1.0 - uv.y) * uLineas + uTiempo * uVelocidad;
    float fila = floor(y);
    float fy = fract(y);
    float hFila = hash(vec2(fila, 1.7));
    float vacia = step(hFila, 0.12);                      // líneas en blanco
    float comentario = step(0.86, hash(vec2(fila, 9.1))); // línea de comentario
    float sangria = floor(hash(vec2(fila, 3.3)) * 4.0) * 2.0;
    float largo = 6.0 + floor(hash(vec2(fila, 5.9)) * 30.0);

    // Celdas de "caracteres": 56 por línea
    float x = uv.x * 56.0 - 1.5;
    float celda = floor(x);
    float fx = fract(x);
    float dentro = step(sangria, celda) * step(celda, sangria + largo);
    float espacio = step(hash(vec2(fila, celda)), 0.17);  // huecos entre palabras
    float glifo = step(0.12, fx) * step(fx, 0.86) * step(0.32, fy) * step(fy, 0.74);
    float visible = dentro * (1.0 - espacio) * glifo * (1.0 - vacia);

    // Color por "palabra": índice pseudoaleatorio estable por tramo de la línea
    float palabra = floor((celda + hFila * 7.0) / (3.0 + floor(hFila * 4.0)));
    float indice = floor(hash(vec2(fila, palabra + 11.0)) * 3.0);
    indice = mix(indice, 3.0, comentario);
    vec3 tinta = uColores[0];
    if (indice > 0.5) tinta = uColores[1];
    if (indice > 1.5) tinta = uColores[2];
    if (indice > 2.5) tinta = uColores[3];
    color = mix(color, tinta, visible);

    // --- Cursor parpadeante en una línea fija de la pantalla ---
    float filaCursor = floor(uLineas * 0.82);
    float enFilaCursor = step(abs((1.0 - uv.y) * uLineas - filaCursor - 0.5), 0.32);
    float largoCursor = 6.0 + floor(hash(vec2(floor(filaCursor + uTiempo * uVelocidad), 5.9)) * 30.0);
    float xCursor = step(abs(x - (largoCursor + 3.0) - 0.5), 0.35);
    float parpadeo = step(0.5, fract(uTiempo * 1.1));
    color = mix(color, uColorCursor, enFilaCursor * xCursor * parpadeo);

    // --- Texto real (monitor principal escribiendo en vivo) ---
    vec4 texto = texture2D(uTexto, uv);
    color = mix(color, texto.rgb, uMezclaTexto);

    // Viñeta suave de panel LCD
    vec2 d = abs(uv - 0.5) * 2.0;
    color *= 1.0 - 0.25 * pow(max(d.x, d.y), 6.0);
    color *= uBrillo;

    // --- Vidrio: reflejo con fresnel + degradado diagonal ---
    vec3 vista = normalize(cameraPosition - vPosMundo);
    float fresnel = pow(1.0 - clamp(dot(normalize(vNormalMundo), vista), 0.0, 1.0), 3.0);
    float diagonal = smoothstep(0.35, 0.0, abs(uv.x * 0.7 + uv.y - 1.05)) * 0.35;
    color += uColorReflejo * (fresnel + diagonal) * uReflejo;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
