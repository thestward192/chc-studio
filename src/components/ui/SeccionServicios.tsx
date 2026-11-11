import { useEffect, useRef, type CSSProperties } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { Table } from '@phosphor-icons/react/dist/csr/Table';
import { Wrench } from '@phosphor-icons/react/dist/csr/Wrench';
import { CloudArrowUp } from '@phosphor-icons/react/dist/csr/CloudArrowUp';
import { ShieldCheck } from '@phosphor-icons/react/dist/csr/ShieldCheck';
import { TrendUp } from '@phosphor-icons/react/dist/csr/TrendUp';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { ChatCircleDots } from '@phosphor-icons/react/dist/csr/ChatCircleDots';
import {
  animacionesServicios,
  cierreServicios,
  encabezadoServicios,
  servicios,
  type Servicio,
} from '../../content/servicios';
import { hero } from '../../content/cabecera';
import { BotonPill } from '../header/BotonPill';
import { HeroVisual, type ClasesMascota } from '../header/HeroVisual';
import { limitar, useVariableScroll } from '../../hooks/useVariableScroll';
import type { ViajeMascota } from '../three/hero/senalHero';
import { iconosServicio } from './iconosServicio';
import estilos from './SeccionServicios.module.css';

/**
 * Servicios: rejilla bento sobre la página clara con los mismos cinco
 * servicios de la fila de la cabecera; Páginas web y Automatizaciones son las
 * tarjetas oscuras de acento. Cada tarjeta tiene su
 * pequeña animación de luz: la mascota sobre la sala (web), un panel con
 * barras (sistemas), herramientas que se encienden al paso de una chispa
 * (automatizaciones y soporte) y un resultado que sube al primer lugar (SEO).
 * Las tarjetas entran escalonadas la primera vez que se ve la sección y las
 * animaciones solo corren mientras está en pantalla.
 */
export function SeccionServicios() {
  const seccionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) seccion.dataset.visible = '';
        seccion.toggleAttribute('data-en-pantalla', e.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observador.observe(seccion);
    return () => observador.disconnect();
  }, []);

  return (
    <section
      ref={seccionRef}
      id="servicios"
      className={estilos.seccion}
      aria-labelledby="servicios-titular"
    >
      <div className={estilos.contenedor}>
        <header className={estilos.encabezado}>
          <p className={estilos.antetitulo}>{encabezadoServicios.antetitulo}</p>
          <h2 id="servicios-titular" className={estilos.titular}>
            {encabezadoServicios.titular.map((parte, i) =>
              parte.destacado ? (
                <span key={i} className={estilos.degradado}>
                  {parte.texto}
                </span>
              ) : (
                parte.texto
              ),
            )}
          </h2>
          <p className={estilos.subtitulo}>{encabezadoServicios.subtitulo}</p>
        </header>

        <ul className={estilos.rejilla}>
          {servicios.map((servicio, i) => (
            <TarjetaServicio key={servicio.id} servicio={servicio} orden={i} />
          ))}
        </ul>

        <div className={estilos.cierre}>
          <p>{cierreServicios.texto}</p>
          <BotonPill etiqueta={hero.boton.etiqueta} destino={hero.boton.destino} />
        </div>
      </div>
    </section>
  );
}

function TarjetaServicio({ servicio, orden }: { servicio: Servicio; orden: number }) {
  const Icono = iconosServicio[servicio.icono];

  return (
    <li
      id={servicio.id}
      className={`${estilos.tarjeta} ${estilos[servicio.icono]}`}
      style={{ '--i': orden } as CSSProperties}
    >
      <div className={estilos.cuerpo}>
        <span className={estilos.baldosa} aria-hidden="true">
          <Icono size={24} weight="regular" />
        </span>
        <h3 className={estilos.nombre}>{servicio.titulo}</h3>
        <p className={estilos.descripcion}>{servicio.descripcion}</p>
        {(servicio.icono === 'web' || servicio.icono === 'sistema' || servicio.icono === 'seo') && (
          <Etiquetas servicio={servicio} />
        )}
        {servicio.icono === 'soporte' && (
          <span className={estilos.estado}>{animacionesServicios.soporte.estado}</span>
        )}
      </div>

      {servicio.icono === 'web' && <SalaMascota />}
      {servicio.icono === 'sistema' && <PanelSistema />}
      {servicio.icono === 'seo' && <RankingSeo />}
      {servicio.icono === 'automatizacion' && (
        <Flujo
          etiqueta="Herramientas que conectamos"
          pasos={servicio.incluye}
          iconos={[WhatsappLogo, EnvelopeSimple, Table]}
        />
      )}
      {servicio.icono === 'soporte' && (
        <Flujo
          etiqueta={`Incluye en ${servicio.titulo}`}
          pasos={servicio.incluye}
          iconos={[Wrench, CloudArrowUp, ShieldCheck, TrendUp]}
          ciclo
        />
      )}
    </li>
  );
}

function Etiquetas({ servicio }: { servicio: Servicio }) {
  return (
    <ul className={estilos.etiquetas} aria-label={`Incluye en ${servicio.titulo}`}>
      {servicio.incluye.map((cosa) => (
        <li key={cosa}>{cosa}</li>
      ))}
    </ul>
  );
}

/** El canvas sube hasta el borde superior de la tarjeta: la mascota entra por ahí. */
const extenderHastaArriba = (zona: HTMLElement) => {
  const tarjeta = zona.parentElement?.getBoundingClientRect();
  return { arriba: tarjeta ? zona.getBoundingClientRect().top - tarjeta.top : 0, abajo: 0 };
};

/** La mascota del hero, con las clases de esta tarjeta. */
const clasesMascota: ClasesMascota = {
  escena: estilos.mascotaEscena,
  poster: estilos.mascotaPoster,
  oculto: estilos.mascotaOculta,
  lienzo: estilos.mascotaLienzo,
  lienzoListo: estilos.mascotaLienzoLista,
};

/**
 * Páginas web: una ventana de navegador que cuenta la historia del servicio
 * (la página se arma, un cursor pulsa "Escríbenos" y llega un mensaje de un
 * cliente) y, delante, la mascota del hero (la misma escena 3D, o su póster).
 * Al aparecer la tarjeta, la mascota entra cayendo desde su borde superior,
 * como si viniera del hero (allí se hunde al bajar): parece que recorre la
 * página.
 */
function SalaMascota() {
  const zonaRef = useRef<HTMLDivElement>(null);

  // Llega desde arriba mientras la tarjeta entra en pantalla y se queda
  // en su sitio cuando la tarjeta ya está a la vista (aterriza con rebote).
  // --viaje mueve el póster; viaje.px, la escena 3D (solo la mascota).
  const viaje = useRef<ViajeMascota>({ px: 0, lugar: 'tarjeta' }).current;
  useVariableScroll(zonaRef, '--viaje', (el, alto) => {
    const tarjeta = el.parentElement?.getBoundingClientRect();
    if (!tarjeta) return 0;
    // Empieza a bajar después del relevo (el hero ya se fue y la tarjeta
    // pasa la mitad de la pantalla) y termina con la tarjeta arriba, a la
    // vista. Al empezar está entera por encima del borde de la tarjeta.
    const llegada = limitar((alto * 0.55 - tarjeta.top) / (alto * 0.45), 0, 1);
    const desdeArriba = el.getBoundingClientRect().top - tarjeta.top + el.offsetHeight * 0.6 + 200;
    viaje.px = -((1 - llegada) ** 1.6) * desdeArriba;
    return viaje.px;
  });

  return (
    <>
      <span className={estilos.cuadricula} aria-hidden="true" />
      <div className={estilos.navegador} aria-hidden="true">
        <div className={estilos.ventanaBarra}>
          <span />
          <span />
          <span />
          <em className={estilos.url}>{animacionesServicios.web.url}</em>
        </div>
        <div className={estilos.pagina}>
          <span className={estilos.bloqueTitulo} style={{ '--k': 0 } as CSSProperties} />
          <span className={estilos.bloqueTexto} style={{ '--k': 1 } as CSSProperties} />
          <span className={estilos.bloqueBoton} style={{ '--k': 2 } as CSSProperties}>
            {animacionesServicios.web.boton}
          </span>
          <div className={estilos.bloqueTarjetas}>
            {[3, 4, 5].map((k) => (
              <span key={k} style={{ '--k': k } as CSSProperties} />
            ))}
          </div>
          <div className={estilos.bloqueBanda} style={{ '--k': 6 } as CSSProperties}>
            <span />
            <span />
            <span className={estilos.bandaBoton} />
          </div>
          <div className={estilos.bloqueResena} style={{ '--k': 7 } as CSSProperties}>
            <span className={estilos.avatar} />
            <span />
            <span />
          </div>
          <div className={estilos.bloquePie} style={{ '--k': 8 } as CSSProperties}>
            <span />
            <span />
            <span />
          </div>
        </div>
        <svg className={estilos.cursor} viewBox="0 0 24 24" width="22" height="22">
          <path d="M4 2.5 19.5 12l-6.6 1.6 3.8 7.2-2.6 1.4-3.8-7.3L5.4 19.6Z" />
        </svg>
        <div className={estilos.aviso}>
          <span className={estilos.avisoIcono}>
            <ChatCircleDots size={16} weight="fill" />
          </span>
          <span>
            <strong>{animacionesServicios.web.aviso.titulo}</strong>
            {animacionesServicios.web.aviso.texto}
          </span>
        </div>
      </div>
      <div ref={zonaRef} className={estilos.mascotaZona} aria-hidden="true">
        <HeroVisual
          clases={clasesMascota}
          viaje={viaje}
          medirExtension={extenderHastaArriba}
          tranquila
        />
      </div>
    </>
  );
}

/**
 * Herramientas (o pasos) unidas por una vía por la que corre una chispa de
 * luz; cada una se enciende cuando la chispa pasa por ella. Con `ciclo`, la
 * vía vuelve del último paso al primero.
 */
function Flujo({
  etiqueta,
  pasos,
  iconos,
  ciclo = false,
}: {
  etiqueta: string;
  pasos: string[];
  iconos: Icon[];
  ciclo?: boolean;
}) {
  const n = pasos.length;
  return (
    <div
      className={`${estilos.flujo} ${ciclo ? estilos.flujoCiclo : ''}`}
      style={{ '--n': n } as CSSProperties}
    >
      <span className={estilos.via} aria-hidden="true">
        <span className={estilos.chispa} />
      </span>
      <ul className={estilos.nodos} aria-label={etiqueta}>
        {pasos.map((paso, k) => {
          const Icono = iconos[k % iconos.length];
          return (
            <li key={paso} className={estilos.nodo} style={{ '--p': k / (n - 1) } as CSSProperties}>
              <span className={estilos.nodoIcono} aria-hidden="true">
                <Icono size={22} weight="regular" />
              </span>
              {paso}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Sistemas a medida: una ventanita de panel con barras que crecen por turnos. */
function PanelSistema() {
  return (
    <div className={estilos.ventana} aria-hidden="true">
      <div className={estilos.ventanaBarra}>
        <span />
        <span />
        <span />
        <em>{animacionesServicios.sistema.ventana}</em>
      </div>
      <div className={estilos.grafico}>
        {[0.55, 0.8, 0.45, 0.95, 0.65, 0.75, 0.5].map((alto, i) => (
          <span key={i} style={{ '--alto': alto, '--b': i } as CSSProperties} />
        ))}
      </div>
      <div className={estilos.filas}>
        <span />
        <span />
      </div>
    </div>
  );
}

/** SEO: una búsqueda y tu negocio subiendo del tercer al primer resultado. */
function RankingSeo() {
  const { busqueda, resultado } = animacionesServicios.seo;
  return (
    <div className={estilos.ranking} aria-hidden="true">
      <div className={estilos.buscador}>
        <MagnifyingGlass size={15} weight="bold" />
        <span className={estilos.consulta}>{busqueda}</span>
      </div>
      <ol className={estilos.resultados}>
        <li className={estilos.resultadoA}>
          <span />
        </li>
        <li className={estilos.resultadoB}>
          <span />
        </li>
        <li className={estilos.resultadoTuyo}>
          <b>1</b>
          {resultado}
        </li>
      </ol>
    </div>
  );
}
