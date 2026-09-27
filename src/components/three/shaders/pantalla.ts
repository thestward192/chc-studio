import * as THREE from 'three';

/**
 * Shader de la pantalla de la laptop: encendido moderno, luminancia central,
 * vidrio con fresnel + franja de brillo, y subpíxeles al acercarse.
 * Colores e intensidades llegan como uniforms (theme.ts / laptop.config.ts).
 */
export function crearUniformsPantalla() {
  return {
    uMapa: { value: null as THREE.Texture | null },
    uColorApagado: { value: new THREE.Color() }, // vidrio negro con la pantalla apagada
    uColorReflejo: { value: new THREE.Color() }, // tono de los reflejos del estudio
    uColorFondoPagina: { value: new THREE.Color() }, // color plano al que termina el zoom
    uEncendido: { value: 0 }, // 0 → 1 en la animación temporal de encendido
    uIntensidad: { value: 1 }, // >1 = HDR para el bloom
    uLuminanciaCentro: { value: 0.14 },
    uAberracion: { value: 0.01 },
    uReflejo: { value: 0.5 },
    uFranja: { value: 0.15 },
    uSubpixel: { value: 0 }, // 0 = invisible, 1 = patrón pleno (ya multiplicado por la intensidad)
    uLimpiar: { value: 0 }, // 1 = la pantalla es solo el fondo de la página
    uDerecha: { value: new THREE.Vector3(1, 0, 0) }, // eje horizontal de la pantalla (mundo)
    uOpacidad: { value: 1 }, // aparición de la laptop al cargar
  };
}

export const vertexPantalla = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosMundo;
  varying vec3 vNormalMundo;

  void main() {
    vUv = uv;
    vec4 mundo = modelMatrix * vec4(position, 1.0);
    vPosMundo = mundo.xyz;
    vNormalMundo = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * mundo;
  }
`;

export const fragmentPantalla = /* glsl */ `
  uniform sampler2D uMapa;
  uniform vec3 uColorApagado;
  uniform vec3 uColorReflejo;
  uniform vec3 uColorFondoPagina;
  uniform float uEncendido;
  uniform float uIntensidad;
  uniform float uLuminanciaCentro;
  uniform float uAberracion;
  uniform float uReflejo;
  uniform float uFranja;
  uniform float uSubpixel;
  uniform float uLimpiar;
  uniform vec3 uDerecha;
  uniform float uOpacidad;

  varying vec2 vUv;
  varying vec3 vPosMundo;
  varying vec3 vNormalMundo;

  void main() {
    vec2 uv = vUv;
    float e = uEncendido;

    // --- Encendido: una línea horizontal central que se expande ---
    // 0.00–0.22: la línea crece a lo ancho; 0.18–0.62: se abre en vertical.
    float anchoLinea = smoothstep(0.0, 0.22, e);
    float altoLinea = mix(0.006, 1.0, smoothstep(0.18, 0.62, e) * smoothstep(0.18, 0.62, e));
    vec2 dCentro = abs(uv - 0.5);
    float mascara = (1.0 - smoothstep(anchoLinea * 0.5 - 0.02, anchoLinea * 0.5, dCentro.x))
                  * (1.0 - smoothstep(altoLinea * 0.5 - 0.004, altoLinea * 0.5, dCentro.y));
    mascara *= step(0.001, e);

    // --- Desfase cromático que se corrige en una fracción de segundo ---
    float ab = uAberracion * (1.0 - smoothstep(0.45, 0.9, e));
    vec3 imagen;
    imagen.r = texture2D(uMapa, uv + vec2(ab, 0.0)).r;
    imagen.g = texture2D(uMapa, uv).g;
    imagen.b = texture2D(uMapa, uv - vec2(ab, 0.0)).b;

    // Al final del zoom, el contenido se funde con el color plano de la página
    // para que el paso al HTML sea limpio.
    imagen = mix(imagen, uColorFondoPagina, uLimpiar);

    // --- Luminancia algo mayor en el centro ---
    float centro = 1.0 - smoothstep(0.0, 0.75, length((uv - 0.5) * vec2(1.2, 1.6)));
    imagen *= 1.0 + uLuminanciaCentro * centro * (1.0 - uLimpiar);

    // --- Subpíxeles RGB, solo cuando la cámara está muy cerca ---
    // Rejilla "gruesa" (320×200 píxeles) para que se lea como textura de
    // pantalla y no produzca moiré; fwidth la apaga si un subpíxel ocupa
    // menos de ~2 píxeles reales.
    float xSub = uv.x * 320.0 * 3.0;
    float columna = fract(xSub / 3.0);
    vec3 sub = vec3(
      1.0 - smoothstep(0.30, 0.36, columna),
      smoothstep(0.30, 0.36, columna) * (1.0 - smoothstep(0.63, 0.69, columna)),
      smoothstep(0.63, 0.69, columna)
    ) * 2.6;
    float fila = smoothstep(0.0, 0.14, fract(uv.y * 200.0));
    float nitidez = 1.0 - smoothstep(0.3, 0.6, fwidth(xSub));
    imagen *= mix(vec3(1.0), sub * fila, uSubpixel * nitidez);

    // --- Destello breve cuando la línea se abre ---
    float destello = exp(-pow((e - 0.34) / 0.09, 2.0));
    vec3 encendida = imagen * uIntensidad + uColorReflejo * destello * 1.6 * mascara;
    vec3 color = mix(uColorApagado, encendida, mascara);

    // --- Vidrio: fresnel + franja diagonal que se desliza con la cámara ---
    vec3 vista = normalize(cameraPosition - vPosMundo);
    vec3 n = normalize(vNormalMundo);
    float fresnel = pow(1.0 - clamp(dot(n, vista), 0.0, 1.0), 4.0);
    // Cuanto más de lado mira la cámara, más se desplaza la franja.
    float desliz = dot(vista, normalize(uDerecha)) * 1.6;
    float coord = uv.x * 0.8 + uv.y * 0.55 + desliz;
    float franja = exp(-pow((fract(coord * 0.5) - 0.5) / 0.07, 2.0));
    franja += 0.4 * exp(-pow((fract(coord * 0.5 + 0.13) - 0.5) / 0.02, 2.0));
    vec3 reflejo = uColorReflejo * (fresnel * 0.9 + franja * uFranja + 0.02) * uReflejo;
    color += reflejo * (1.0 - uLimpiar);

    gl_FragColor = vec4(color, uOpacidad);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
