import { useRef, type CSSProperties } from 'react';
import { Cube } from '@phosphor-icons/react/dist/csr/Cube';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { hero } from '../../content/cabecera';
import { senalHero } from '../three/hero/senalHero';
import { BotonPill } from './BotonPill';
import { HeroVisual } from './HeroVisual';
import estilos from './Hero.module.css';

/** Retraso escalonado de la animación de entrada (índice → variable CSS). */
const orden = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * Hero dentro de la tarjeta oscura: titular, subtítulo, botón y prueba
 * social a la izquierda; el "Núcleo CHC" (3D o póster) con anillos y halo a
 * la derecha. Señalar el botón hace crecer el núcleo.
 */
export function Hero() {
  const visualRef = useRef<HTMLDivElement>(null);
  let linea = 0;

  // El botón "hace crecer": la escena 3D lo lee de senalHero; el póster y el
  // halo reaccionan por CSS con data-crecer.
  const alActivarBoton = (activo: boolean) => {
    senalHero.crecer = activo;
    visualRef.current?.toggleAttribute('data-crecer', activo);
  };

  return (
    <section className={estilos.tarjeta} aria-labelledby="hero-titular">
      <div className={estilos.texto}>
        <h1 id="hero-titular" className={estilos.titular}>
          {hero.titular.map((partes, i) => (
            <span key={i} className={`${estilos.linea} ${estilos.entrada}`} style={orden(linea++)}>
              {partes.map((parte, j) =>
                parte.destacado ? (
                  <span key={j} className={estilos.degradado}>
                    {parte.texto}
                  </span>
                ) : (
                  parte.texto
                ),
              )}
            </span>
          ))}
        </h1>

        <p className={`${estilos.subtitulo} ${estilos.entrada}`} style={orden(linea++)}>
          {hero.subtitulo}
        </p>

        <div className={estilos.entrada} style={orden(linea++)}>
          <BotonPill
            etiqueta={hero.boton.etiqueta}
            destino={hero.boton.destino}
            tamano="grande"
            onActivo={alActivarBoton}
          />
        </div>

        {/* Prueba social sin cifras: la propia web es la muestra */}
        <p className={`${estilos.prueba} ${estilos.entrada}`} style={orden(linea++)}>
          <span className={estilos.pruebaIcono} aria-hidden="true">
            <Cube size={20} weight="regular" />
          </span>
          <span className={estilos.pruebaTexto}>
            {hero.prueba.texto}{' '}
            <a className={estilos.pruebaEnlace} href={hero.prueba.enlace.href}>
              {hero.prueba.enlace.etiqueta}
              <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
            </a>
          </span>
        </p>
      </div>

      <div
        ref={visualRef}
        className={`${estilos.visual} ${estilos.entradaVisual}`}
        aria-hidden="true"
      >
        <div className={estilos.resplandor} />
        <svg className={estilos.anillos} viewBox="0 0 400 400">
          <circle className={estilos.anillo} cx="200" cy="200" r="196" />
          <circle className={estilos.anillo} cx="200" cy="200" r="150" />
          {/* Dos arcos abiertos como las dos "C" del logo, girando en sentidos opuestos */}
          <g className={estilos.giroA}>
            <circle
              className={`${estilos.anillo} ${estilos.arco}`}
              cx="200"
              cy="200"
              r="118"
              pathLength="100"
            />
          </g>
          <g className={estilos.giroB}>
            <circle
              className={`${estilos.anillo} ${estilos.arco}`}
              cx="200"
              cy="200"
              r="84"
              pathLength="100"
            />
          </g>
        </svg>
        <HeroVisual />
      </div>
    </section>
  );
}
