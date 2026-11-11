import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import { hero } from '../../content/cabecera';
import { useMascota3D } from '../../hooks/useMascota3D';
import { LimiteError } from '../three/LimiteError';
import type { ExtensionLienzo, ViajeMascota } from '../three/hero/senalHero';
import estilosHero from './Hero.module.css';

const EscenaHeroMascota = lazy(() => import('../three/hero/EscenaHeroMascota'));

/** Clases del póster y del canvas; cada lugar donde aparece la mascota pone las suyas. */
export interface ClasesMascota {
  escena: string;
  poster: string;
  oculto: string;
  lienzo: string;
  lienzoListo: string;
}

const clasesHero: ClasesMascota = {
  escena: estilosHero.escena,
  poster: estilosHero.poster,
  oculto: estilosHero.oculto,
  lienzo: estilosHero.lienzo,
  lienzoListo: estilosHero.lienzoListo,
};

/**
 * La mascota CHC (en el hero y en la tarjeta de Páginas web). Siempre se
 * pinta primero el póster (render estático del mismo personaje). En
 * escritorio con mouse, sin movimiento reducido y con WebGL, cuando está en
 * pantalla y el navegador queda libre, se carga la escena 3D y se funde
 * sobre el póster.
 *
 * `viaje`: desplazamiento que pide el scroll (la escena mueve solo a la
 * mascota). `medirExtension`: cuánto agrandar el canvas desde su zona (el
 * padre de la caja del póster) para que la mascota pueda salir o entrar por
 * el borde de la tarjeta; la cámara conserva el encuadre de la zona.
 */
export function HeroVisual({
  clases = clasesHero,
  viaje,
  medirExtension,
  tranquila = false,
}: {
  clases?: ClasesMascota;
  viaje?: ViajeMascota;
  medirExtension?: (zona: HTMLElement) => ExtensionLienzo;
  /** Sin vuelos ni saltos: solo sigue al mouse (ver EscenaHeroMascota). */
  tranquila?: boolean;
}) {
  const estilos = clases;
  const [extension, setExtension] = useState<ExtensionLienzo>({ arriba: 0, abajo: 0 });
  const cajaRef = useRef<HTMLDivElement>(null);
  const mascota3D = useMascota3D();
  const [enPantalla, setEnPantalla] = useState(false);
  const [pestanaVisible, setPestanaVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [cargar, setCargar] = useState(false);
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [sinPoster, setSinPoster] = useState(false);

  const puede3D = mascota3D && !fallo;

  useEffect(() => {
    const caja = cajaRef.current;
    if (!caja) return;
    // Margen amplio: la escena ya está lista cuando la mascota llega viajando
    const observador = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), {
      rootMargin: '500px 0px',
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

  // Medir la extensión del canvas (cambia con el tamaño de la zona y de la tarjeta)
  const medirRef = useRef(medirExtension);
  medirRef.current = medirExtension;
  useEffect(() => {
    const zona = cajaRef.current?.parentElement;
    if (!con3D || !zona || !medirRef.current) return;
    const medir = () => {
      const nueva = medirRef.current?.(zona);
      if (!nueva) return;
      const redondeada = {
        arriba: Math.round(nueva.arriba),
        abajo: Math.round(nueva.abajo),
        izquierda: Math.round(nueva.izquierda ?? 0),
      };
      setExtension((previa) =>
        previa.arriba === redondeada.arriba &&
        previa.abajo === redondeada.abajo &&
        previa.izquierda === redondeada.izquierda
          ? previa
          : redondeada,
      );
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(zona);
    if (zona.parentElement) observador.observe(zona.parentElement);
    return () => observador.disconnect();
  }, [con3D]);

  // El póster va en una caja cuadrada; el canvas 3D ocupa toda la zona oscura
  return (
    <>
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
      </div>
      {con3D && (
        <LimiteError onError={() => setFallo(true)}>
          <Suspense fallback={null}>
            <EscenaHeroMascota
              className={`${estilos.lienzo} ${listo ? estilos.lienzoListo : ''}`}
              activo={enPantalla && pestanaVisible}
              onListo={() => setListo(true)}
              viaje={viaje}
              extension={extension}
              tranquila={tranquila}
              style={
                {
                  marginTop: -extension.arriba,
                  marginBottom: -extension.abajo,
                  marginLeft: -(extension.izquierda ?? 0),
                  // Para la máscara del canvas (dónde empieza la zona)
                  '--extension-izq': `${extension.izquierda ?? 0}px`,
                } as CSSProperties
              }
            />
          </Suspense>
        </LimiteError>
      )}
    </>
  );
}
