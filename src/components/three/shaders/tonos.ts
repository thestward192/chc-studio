import * as THREE from 'three';

/**
 * Curva de tonos de la intro: lineal hasta `umbral` (los colores del tema
 * salen exactos: fondo, ciclorama y color de la página) y un hombro suave
 * por encima para que los brillos del metal y la pantalla no se quemen.
 * (ACES/AgX/Neutral alteran los tonos oscuros; Neutral, por ejemplo, les
 * resta un "toe" que tiñe de azul un fondo gris oscuro.)
 */
export const glslHombroSuave = /* glsl */ `
  vec3 hombroSuave(vec3 color) {
    const float umbral = 0.8;
    vec3 exceso = max(color - umbral, 0.0);
    vec3 comprimido = umbral + (1.0 - umbral) * (1.0 - exp(-exceso / (1.0 - umbral)));
    return mix(color, comprimido, step(umbral, color));
  }
`;

let instalado = false;

/**
 * Nivel bajo (sin postproceso): la misma curva como CustomToneMapping del
 * renderer. Se instala una sola vez sustituyendo el stub de three.
 */
export function instalarTonosPersonalizados() {
  if (instalado) return;
  instalado = true;
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `${glslHombroSuave}
    vec3 CustomToneMapping( vec3 color ) { return hombroSuave( color * toneMappingExposure ); }`,
  );
}
