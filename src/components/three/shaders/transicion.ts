import { Effect, EffectAttribute } from 'postprocessing';
import * as THREE from 'three';
import { glslHombroSuave } from './tonos';

/**
 * Efecto de entrada a la pantalla: distorsión de barril + desfase cromático
 * que crecen en el último tramo del zoom y vuelven a cero justo cuando la
 * página HTML reemplaza al canvas. Solo se importa desde el chunk de
 * postproceso (import dinámico), así `postprocessing` no pesa en el nivel bajo.
 */
const fragmentTransicion = /* glsl */ `
  uniform float uFuerza;      // 0 → 1 → 0 a lo largo del tramo final
  uniform float uBarril;      // cantidad máxima de distorsión de barril
  uniform float uAberracion;  // separación máxima de los canales RGB

  // Distorsión de barril alrededor del centro de la imagen.
  // Se normaliza para que las esquinas queden fijas: así nunca se muestrea
  // fuera de la imagen (evita franjas en los bordes).
  vec2 barril(vec2 uv, float k) {
    vec2 c = uv - 0.5;
    float r2 = dot(c, c);
    return clamp(0.5 + c * (1.0 + k * r2) / (1.0 + k * 0.5), 0.0, 1.0);
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    if (uFuerza <= 0.0001) {
      outputColor = inputColor;
      return;
    }
    float k = uBarril * uFuerza;
    float ab = uAberracion * uFuerza;
    // Cada canal se deforma con una k ligeramente distinta: desfase cromático
    // que crece hacia los bordes, como una lente al acercarse demasiado.
    float r = texture2D(inputBuffer, barril(uv, k + ab * 4.0)).r;
    float g = texture2D(inputBuffer, barril(uv, k)).g;
    float b = texture2D(inputBuffer, barril(uv, k - ab * 4.0)).b;
    outputColor = vec4(r, g, b, inputColor.a);
  }
`;

export class EfectoTransicion extends Effect {
  constructor() {
    super('EfectoTransicion', fragmentTransicion, {
      // CONVOLUTION: lee otros píxeles del buffer de entrada.
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, THREE.Uniform>([
        ['uFuerza', new THREE.Uniform(0)],
        ['uBarril', new THREE.Uniform(0.2)],
        ['uAberracion', new THREE.Uniform(0.01)],
      ]),
    });
  }

  set fuerza(valor: number) {
    this.uniforms.get('uFuerza')!.value = valor;
  }

  set barril(valor: number) {
    this.uniforms.get('uBarril')!.value = valor;
  }

  set aberracion(valor: number) {
    this.uniforms.get('uAberracion')!.value = valor;
  }
}

/** Curva de tonos (ver tonos.ts) como efecto del composer, tras el bloom. */
export class EfectoTonos extends Effect {
  constructor() {
    super(
      'EfectoTonos',
      /* glsl */ `
      ${glslHombroSuave}
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        outputColor = vec4(hombroSuave(inputColor.rgb), inputColor.a);
      }
    `,
    );
  }
}
