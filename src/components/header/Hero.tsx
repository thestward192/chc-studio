import { useRef, type CSSProperties } from 'react';
import { Cube } from '@phosphor-icons/react/dist/csr/Cube';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { hero } from '../../content/cabecera';
import { senalHero, type ViajeMascota } from '../three/hero/senalHero';
import { limitar, useVariableScroll } from '../../hooks/useVariableScroll';
import { BotonPill } from './BotonPill';
import { HeroVisual } from './HeroVisual';
import { JuegoMascota } from './JuegoMascota';
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
  const seccionRef = useRef<HTMLElement>(null);
  let linea = 0;

  // Viaje de la mascota: al bajar, solo ella cae (la sala se queda) un poco
  // más rápido que el scroll, así se ve bajar y salir por el borde inferior
  // de la tarjeta, tapada por la parte clara. Reaparece llegando a la
  // tarjeta de Páginas web. --viaje mueve el póster; viaje.px, la escena 3D.
  const viaje = useRef<ViajeMascota>({ px: 0, lugar: 'hero' }).current;
  useVariableScroll(visualRef, '--viaje', (el, alto) => {
    const tarjeta = el.parentElement?.getBoundingClientRect();
    if (!tarjeta) return 0;
    // Relevo: es un solo personaje. Mientras queda hero en pantalla vive
    // aquí; luego pasa a la tarjeta de Páginas web (nunca en los dos)
    const enHero = tarjeta.bottom > alto * 0.15;
    senalHero.mascotaEnHero = enHero;
    document.documentElement.dataset.mascota = enHero ? 'hero' : 'tarjeta';
    viaje.px = limitar(-tarjeta.top, 0, tarjeta.height) * 1.25;
    return viaje.px;
  });
  // El canvas llega hasta el borde inferior de la tarjeta para que la
  // mascota salga justo por ahí
  const medirExtension = (zona: HTMLElement) => {
    const tarjeta = zona.parentElement?.getBoundingClientRect();
    return { arriba: 0, abajo: tarjeta ? tarjeta.bottom - zona.getBoundingClientRect().bottom : 0 };
  };

  // El botón "hace crecer": la escena 3D lo lee de senalHero; el póster
  // reacciona por CSS con data-crecer.
  const alActivarBoton = (activo: boolean) => {
    senalHero.crecer = activo;
    visualRef.current?.toggleAttribute('data-crecer', activo);
  };

  return (
    <section ref={seccionRef} className={estilos.tarjeta} aria-labelledby="hero-titular">
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
        <HeroVisual viaje={viaje} medirExtension={medirExtension} />
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

      {/* Tocar a la mascota abre su menú de trucos (solo con la escena 3D) */}
      <JuegoMascota seccionRef={seccionRef} />

      {/* Prueba social sin cifras: la propia web es la muestra */}
      <p className={`${estilos.prueba} ${estilos.entrada}`} style={orden(linea++)}>
        <Cube size={16} weight="regular" aria-hidden="true" />
        {hero.prueba.texto}
      </p>
    </section>
  );
}
