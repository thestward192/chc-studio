/** Límite de devicePixelRatio recomendado en el brief: 2 en escritorio, 1.5 en móvil. */
export function obtenerDprMaximo(): number {
  const esMovil = window.matchMedia('(max-width: 768px)').matches;
  return Math.min(window.devicePixelRatio || 1, esMovil ? 1.5 : 2);
}

/** Rango [mínimo, máximo] de dpr para <Canvas dpr={...}> + AdaptiveDpr de drei. */
export function obtenerRangoDpr(): [number, number] {
  return [1, obtenerDprMaximo()];
}

export type NivelCalidad = 'alto' | 'medio' | 'bajo';

/** Nivel de partida según el dispositivo y la GPU; luego lo ajusta el monitor de FPS. */
export function estimarCalidadInicial(): NivelCalidad {
  const movil = window.matchMedia('(pointer: coarse), (max-width: 768px)').matches;
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const nucleos = navigator.hardwareConcurrency ?? 8;
  const gpu = leerNombreGpu();
  const gpuModesta = /swiftshader|llvmpipe|software|mali-[4t]|adreno \(tm\) [3-5]\d\d|powervr|intel\(r\) (hd|uhd) graphics [2-5]\d\d/i.test(
    gpu,
  );
  if (gpuModesta || (movil && (memoria <= 3 || nucleos <= 4))) return 'bajo';
  if (movil) return 'medio';
  return 'alto';
}

function leerNombreGpu(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const nombre = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(nombre);
  } catch {
    return '';
  }
}
