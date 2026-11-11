import { useEffect, useRef, type CSSProperties } from 'react';
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { Table } from '@phosphor-icons/react/dist/csr/Table';
import {
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
 * Servicios: rejilla tipo bento con los mismos cinco servicios de la fila de
 * la cabecera. Páginas web es la tarjeta destacada (oscura, con la mascota
 * sobre la cuadrícula de la sala del hero); Automatizaciones muestra el flujo
 * entre herramientas y Soporte continuo ocupa el ancho con el degradado suave.
 * Las tarjetas entran escalonadas la primera vez que se ve la sección.
 */
export function SeccionServicios() {
  const seccionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        seccion.dataset.visible = '';
        observador.disconnect();
      },
      { threshold: 0.15 },
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
  const destacada = servicio.icono === 'web';

  return (
    <li
      id={servicio.id}
      className={`${estilos.tarjeta} ${estilos[servicio.icono]}`}
      style={{ '--i': orden } as CSSProperties}
    >
      <span className={estilos.baldosa} aria-hidden="true">
        <Icono size={24} weight="regular" />
      </span>
      <h3 className={estilos.nombre}>{servicio.titulo}</h3>
      <p className={estilos.descripcion}>{servicio.descripcion}</p>

      {servicio.icono === 'automatizacion' ? (
        <FlujoAutomatizacion etiquetas={servicio.incluye} />
      ) : (
        <ul className={estilos.etiquetas} aria-label={`Incluye en ${servicio.titulo}`}>
          {servicio.incluye.map((cosa) => (
            <li key={cosa}>{cosa}</li>
          ))}
        </ul>
      )}

      {destacada && (
        <>
          <span className={estilos.cuadricula} aria-hidden="true" />
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
      )}
    </li>
  );
}

const iconosFlujo = [WhatsappLogo, EnvelopeSimple, Table];

/** Tres herramientas unidas por una línea por la que corre un pulso de luz. */
function FlujoAutomatizacion({ etiquetas }: { etiquetas: string[] }) {
  return (
    <ul className={estilos.flujo} aria-label="Herramientas que conectamos">
      {etiquetas.map((etiqueta, i) => {
        const Icono = iconosFlujo[i % iconosFlujo.length];
        return (
          <li key={etiqueta} className={estilos.nodo}>
            <span className={estilos.nodoIcono} aria-hidden="true">
              <Icono size={20} weight="regular" />
            </span>
            {etiqueta}
          </li>
        );
      })}
    </ul>
  );
}
