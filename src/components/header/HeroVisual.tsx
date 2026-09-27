import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { hero } from '../../content/cabecera';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import estilos from './Hero.module.css';

const EscenaHeroNucleo = lazy(() => import('../three/hero/EscenaHeroNucleo'));

/** Escritorio con mouse: único caso en el que se carga la escena 3D. */
const CONSULTA_3D = '(min-width: 1024px) and (pointer: fine)';

/**
 * Parte visual del hero: el "Núcleo CHC". Siempre se pinta primero el
 * póster (render estático del mismo objeto). En escritorio con mouse, sin
 * movimiento reducido y con WebGL, cuando el hero está en pantalla y el
 * navegador queda libre, se carga la escena 3D y se funde sobre el póster.
 */
export function HeroVisual() {
  const cajaRef = useRef<HTMLDivElement>(null);
  const reducido = usePrefersReducedMotion();
  const escritorio = useCoincideMedia(CONSULTA_3D);
  const [enPantalla, setEnPantalla] = useState(false);
  const [pestanaVisible, setPestanaVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [cargar, setCargar] = useState(false);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [sinPoster, setSinPoster] = useState(false);

  const puede3D = escritorio && !reducido && !fallo && soportaWebGL();

  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    const observador = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), {
      rootMargin: '120px 0px',
    });
    observador.observe(caja);
    const alCambiarPestana = () => setPestanaVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', alCambiarPestana);
    return () => {
      observador.disconnect();
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, []);

  // Carga diferida: la primera vez que el hero está en pantalla y el navegador está libre
  useEffect(() => {
    if (!puede3D || !enPantalla || cargar) return;
    const libre = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 200));
    const cancelar = window.cancelIdleCallback ?? window.clearTimeout;
    const id = libre(() => setCargar(true), { timeout: 1500 });
    return () => cancelar(id);
  }, [puede3D, enPantalla, cargar]);

  const con3D = puede3D && cargar;

  return (
    <div ref={cajaRef} className={estilos.escena}>
      {!sinPoster && (
        <img
          className={`${estilos.poster} ${con3D && listo ? estilos.oculto : ''}`}
          src={hero.poster}
          alt=""
          width={1306}
          height={1306}
          decoding="async"
          onError={() => setSinPoster(true)}
        />
      )}
      {con3D && (
        <LimiteError onError={() => setFallo(true)}>
          <Suspense fallback={null}>
            <EscenaHeroNucleo
              className={`${estilos.lienzo} ${listo ? estilos.lienzoListo : ''}`}
              activo={enPantalla && pestanaVisible}
              onListo={() => setListo(true)}
            />
          </Suspense>
        </LimiteError>
      )}
    </div>
  );
}

function useCoincideMedia(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const media = window.matchMedia(consulta);
    const alCambiar = () => setCoincide(media.matches);
    media.addEventListener('change', alCambiar);
    return () => media.removeEventListener('change', alCambiar);
  }, [consulta]);
  return coincide;
}

let webglCache: boolean | undefined;
function soportaWebGL(): boolean {
  if (webglCache === undefined) {
    try {
      const lienzo = document.createElement('canvas');
      const gl = lienzo.getContext('webgl2') ?? lienzo.getContext('webgl');
      webglCache = !!gl;
      (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webglCache = false;
    }
  }
  return webglCache;
}

/** Si la escena falla (contexto WebGL perdido, shader), se queda el póster. */
class LimiteError extends Component<
  { children: ReactNode; onError: () => void },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
