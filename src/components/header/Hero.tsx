import { useRef, type CSSProperties } from 'react';
import { Cube } from '@phosphor-icons/react/dist/csr/Cube';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { hero } from '../../content/cabecera';
import { senalHero } from '../three/hero/senalHero';
import { BotonPill } from './BotonPill';
import { HeroVisual } from './HeroVisual';
import estilos from './Hero.module.css';

/** Retraso escalonado de la animación de entrada (índice → variable CSS). */
const orden = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * Hero estilo página de producto de Apple dentro de la tarjeta oscura:
 * antetítulo, titular enorme centrado y subtítulo; debajo, la mascota CHC
 * como foto de producto, paseando por una sala 3D sin fondo (o su póster),
 * y a sus pies el botón + enlace "›". Señalar el botón la hace crecer y
 * ponerse alegre.
 */
export function Hero() {
  const visualRef = useRef<HTMLDivElement>(null);
  let linea = 0;

  // El botón "hace crecer": la escena 3D lo lee de senalHero; el póster
  // reacciona por CSS con data-crecer.
  const alActivarBoton = (activo: boolean) => {
    senalHero.crecer = activo;
    visualRef.current?.toggleAttribute('data-crecer', activo);
  };

  return (
    <section className={estilos.tarjeta} aria-labelledby="hero-titular">
      <div className={estilos.texto}>
        <p className={`${estilos.antetitulo} ${estilos.entrada}`} style={orden(linea++)}>
          {hero.antetitulo}
        </p>

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
      </div>

      <div
        ref={visualRef}
        className={`${estilos.visual} ${estilos.entradaVisual}`}
        aria-hidden="true"
      >
        <HeroVisual />
      </div>

      {/* Bajo la mascota, sobre el suelo de la sala: el modelo queda despejado */}
      <div className={`${estilos.acciones} ${estilos.entrada}`} style={orden(linea++)}>
        <BotonPill
          etiqueta={hero.boton.etiqueta}
          destino={hero.boton.destino}
          tamano="grande"
          onActivo={alActivarBoton}
        />
        <a className={estilos.enlace} href={hero.prueba.enlace.href}>
          {hero.prueba.enlace.etiqueta}
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        </a>
      </div>

      {/* Prueba social sin cifras: la propia web es la muestra */}
      <p className={`${estilos.prueba} ${estilos.entrada}`} style={orden(linea++)}>
        <Cube size={16} weight="regular" aria-hidden="true" />
        {hero.prueba.texto}
      </p>
    </section>
  );
}
