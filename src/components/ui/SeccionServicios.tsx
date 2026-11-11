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
import {
  animacionesServicios,
  cierreServicios,
  encabezadoServicios,
  servicios,
  type Servicio,
} from '../../content/servicios';
import { hero } from '../../content/cabecera';
import { BotonPill } from '../header/BotonPill';
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

/**
 * Páginas web: una ventana de navegador donde la página se arma bloque a
 * bloque, y la mascota flotando delante sobre el suelo de la sala, que
 * recorre una onda de luz.
 */
function SalaMascota() {
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
          <span className={estilos.bloqueBoton} style={{ '--k': 2 } as CSSProperties} />
          <div className={estilos.bloqueTarjetas}>
            {[3, 4, 5].map((k) => (
              <span key={k} style={{ '--k': k } as CSSProperties} />
            ))}
          </div>
        </div>
      </div>
      <img
        className={estilos.mascota}
        src={hero.poster}
        alt=""
        width={1306}
        height={1306}
        loading="lazy"
        decoding="async"
      />
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
