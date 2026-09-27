import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { intro } from '../../content/intro';
import { laptopConfig as cfg } from '../three/laptop.config';
import { meseta, tramo } from '../three/utilidadesIntro';
import './TextoIntro.css';

interface Props {
  progreso: number;
  movimientoReducido: boolean;
}

/**
 * Texto HTML sobre el canvas de la intro:
 *  - título inicial, que entra palabra a palabra (Anime.js) y se va al bajar;
 *  - panel de información que aparece mientras la laptop gira de lado.
 * Es HTML real (accesible y seleccionable), no texto dentro del 3D.
 */
export function TextoIntro({ progreso, movimientoReducido }: Props) {
  const tituloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = tituloRef.current;
    if (!nodo) return;
    const palabras = nodo.querySelectorAll<HTMLElement>('[data-palabra]');
    const animacion = animate(palabras, {
      opacity: [0, 1],
      translateY: movimientoReducido ? [0, 0] : [18, 0],
      duration: movimientoReducido ? 300 : 900,
      delay: stagger(movimientoReducido ? 0 : cfg.entrada.escalonadoTitulo, {
        start: cfg.entrada.retrasoTitulo,
      }),
      ease: 'outCubic',
    });
    return () => {
      animacion.pause();
    };
  }, [movimientoReducido]);

  const opacidadTitulo = 1 - tramo(progreso, cfg.secuencia.tituloFuera);
  const opacidadInfo = meseta(progreso, cfg.secuencia.info);

  return (
    <>
      <div
        ref={tituloRef}
        className="texto-intro__titulo"
        style={{ opacity: opacidadTitulo, visibility: opacidadTitulo <= 0 ? 'hidden' : 'visible' }}
      >
        <p className="texto-intro__marca">
          <span data-palabra className="texto-intro__palabra">
            {intro.titulo.marca}{' '}
          </span>
          <span data-palabra className="texto-intro__palabra texto-intro__degradado">
            {intro.titulo.resto}
          </span>
        </p>
        <p className="texto-intro__eslogan">
          <Palabras texto={intro.eslogan} />
        </p>
        <p className="texto-intro__pista" aria-hidden="true">
          <span className="texto-intro__raya" />
          <span>
            <Palabras texto={intro.pista} />
          </span>
        </p>
      </div>

      <aside
        className="texto-intro__info"
        aria-hidden={opacidadInfo === 0}
        style={{
          opacity: opacidadInfo,
          transform: `translateY(${(1 - opacidadInfo) * (movimientoReducido ? 0 : 16)}px)`,
          visibility: opacidadInfo <= 0 ? 'hidden' : 'visible',
        }}
      >
        <p className="texto-intro__etiqueta">{intro.info.etiqueta}</p>
        <p className="texto-intro__info-titulo">{intro.info.titulo}</p>
        <p className="texto-intro__descripcion">{intro.info.descripcion}</p>
        <ul className="texto-intro__lista">
          {intro.info.puntos.map((punto) => (
            <li key={punto}>
              <CheckCircle
                className="texto-intro__check"
                size={20}
                weight="regular"
                aria-hidden="true"
              />
              {punto}
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}

function Palabras({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(' ').map((palabra, i) => (
        <span key={i} data-palabra className="texto-intro__palabra">
          {palabra}{' '}
        </span>
      ))}
    </>
  );
}
