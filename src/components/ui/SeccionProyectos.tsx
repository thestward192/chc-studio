import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { WhatsappLogo } from '@phosphor-icons/react/dist/csr/WhatsappLogo';
import { EnvelopeSimple } from '@phosphor-icons/react/dist/csr/EnvelopeSimple';
import { Table } from '@phosphor-icons/react/dist/csr/Table';
import { CheckCircle } from '@phosphor-icons/react/dist/csr/CheckCircle';
import {
  dominioProyecto,
  encabezadoProyectos,
  proyectos,
  type Proyecto,
} from '../../content/proyectos';
import { servicios } from '../../content/servicios';
import { hero } from '../../content/cabecera';
import estilos from './SeccionProyectos.module.css';

// Etiqueta del tipo: la del proyecto (p. ej. "E-commerce") o la del servicio
const nombreServicio = (p: Proyecto) =>
  p.tipo ?? servicios.find((s) => s.icono === p.servicio)?.titulo ?? null;

/**
 * Proyectos al estilo del carrusel "Conoce el iPhone" de apple.com: tarjetas
 * grandes que se deslizan de lado (hasta el borde de la pantalla), cada una
 * con una laptop asomando desde abajo que muestra la captura del sistema o
 * una app de escritorio según el servicio del proyecto. El "+" abre una hoja con el detalle (descripción, tecnologías y
 * enlace). Controles ‹ › y puntos de progreso debajo.
 */
export function SeccionProyectos() {
  const seccionRef = useRef<HTMLElement>(null);
  const pistaRef = useRef<HTMLUListElement>(null);
  const hojaRef = useRef<HTMLDialogElement>(null);
  const [actual, setActual] = useState(0);
  const [bordes, setBordes] = useState({ inicio: true, fin: false });
  const [abierto, setAbierto] = useState<Proyecto | null>(null);

  // Entrada escalonada la primera vez que se ve la sección
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

  // Tarjeta actual y si se llegó a un extremo (para los puntos y las flechas)
  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    let pendiente = 0;
    const leer = () => {
      pendiente = 0;
      const tarjetas = [...pista.children] as HTMLElement[];
      const inicio =
        pista.getBoundingClientRect().left + parseFloat(getComputedStyle(pista).paddingLeft);
      let mejor = 0;
      let distancia = Infinity;
      tarjetas.forEach((t, i) => {
        const d = Math.abs(t.getBoundingClientRect().left - inicio);
        if (d < distancia) {
          distancia = d;
          mejor = i;
        }
      });
      setActual(mejor);
      setBordes({
        inicio: pista.scrollLeft < 8,
        fin: pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 8,
      });
    };
    const programar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(leer);
    };
    leer();
    pista.addEventListener('scroll', programar, { passive: true });
    window.addEventListener('resize', programar);
    return () => {
      cancelAnimationFrame(pendiente);
      pista.removeEventListener('scroll', programar);
      window.removeEventListener('resize', programar);
    };
  }, []);

  const irA = (i: number) => {
    const pista = pistaRef.current;
    const tarjeta = pista?.children[i] as HTMLElement | undefined;
    if (!pista || !tarjeta) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pista.scrollTo({
      left: tarjeta.offsetLeft - parseFloat(getComputedStyle(pista).paddingLeft),
      behavior: reducido ? 'auto' : 'smooth',
    });
  };

  const abrir = (p: Proyecto) => {
    setAbierto(p);
    hojaRef.current?.showModal();
  };

  return (
    <section
      ref={seccionRef}
      id="proyectos"
      className={estilos.seccion}
      aria-labelledby="proyectos-titular"
    >
      <header className={estilos.encabezado}>
        <div>
          <p className={estilos.antetitulo}>{encabezadoProyectos.antetitulo}</p>
          <h2 id="proyectos-titular" className={estilos.titular}>
            {encabezadoProyectos.titular}
          </h2>
          <p className={estilos.subtitulo}>{encabezadoProyectos.subtitulo}</p>
        </div>
        <a className={estilos.enlaceEstudio} href={hero.prueba.enlace.href}>
          {hero.prueba.enlace.etiqueta}
          <CaretRight size={14} weight="bold" aria-hidden="true" />
        </a>
      </header>

      <ul ref={pistaRef} className={estilos.pista} aria-label="Proyectos">
        {proyectos.map((p, i) => (
          <TarjetaProyecto key={p.id} proyecto={p} orden={i} onAbrir={() => abrir(p)} />
        ))}
      </ul>

      <div className={estilos.controles}>
        <div className={estilos.puntos} role="tablist" aria-label="Elegir proyecto">
          {proyectos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === actual}
              aria-label={p.titulo}
              className={estilos.punto}
              onClick={() => irA(i)}
            />
          ))}
        </div>
        <div className={estilos.flechas}>
          <button
            type="button"
            className={estilos.flecha}
            aria-label="Proyecto anterior"
            disabled={bordes.inicio}
            onClick={() => irA(Math.max(actual - 1, 0))}
          >
            <CaretLeft size={18} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={estilos.flecha}
            aria-label="Proyecto siguiente"
            disabled={bordes.fin}
            onClick={() => irA(Math.min(actual + 1, proyectos.length - 1))}
          >
            <CaretRight size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        ref={hojaRef}
        className={estilos.hoja}
        aria-labelledby="hoja-titulo"
        onClose={() => setAbierto(null)}
        // Clic en el fondo (fuera de la hoja) la cierra
        onClick={(e) => e.target === e.currentTarget && hojaRef.current?.close()}
      >
        {abierto && (
          <>
            {/* Fuera de la zona que se desplaza: la X queda siempre en su esquina */}
            <button
              type="button"
              className={estilos.cerrar}
              aria-label="Cerrar"
              onClick={() => hojaRef.current?.close()}
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
            <Detalle proyecto={abierto} />
          </>
        )}
      </dialog>
    </section>
  );
}

function TarjetaProyecto({
  proyecto: p,
  orden,
  onAbrir,
}: {
  proyecto: Proyecto;
  orden: number;
  onAbrir: () => void;
}) {
  const servicio = nombreServicio(p);
  return (
    <li className={estilos.tarjeta} style={{ '--i': orden } as CSSProperties}>
      {/* Toda la tarjeta abre el detalle con el mouse; con teclado, el "+" */}
      <article className={estilos.tarjetaInterior} onClick={onAbrir}>
        <div className={estilos.tarjetaTexto}>
          {servicio && <p className={estilos.servicio}>{servicio}</p>}
          <h3 className={estilos.tarjetaTitulo}>{p.titulo}</h3>
          <p className={estilos.tarjetaDatos}>
            {p.anio && <span>{p.anio}</span>}
            {p.estado && <Estado estado={p.estado} />}
          </p>
        </div>
        <Portatil proyecto={p} />
      </article>
      <button
        type="button"
        className={estilos.mas}
        aria-label={`Ver detalles de ${p.titulo}`}
        onClick={onAbrir}
      >
        <Plus size={18} weight="bold" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * Hoja de detalle (estilo iOS) dentro del <dialog>. En escritorio, dos
 * columnas que se ven enteras sin desplazarse: a la izquierda la captura
 * grande (con miniaturas) y las características; a la derecha el título,
 * la ficha, la descripción, las tecnologías y el enlace. En móvil, apiladas.
 */
function Detalle({ proyecto: p }: { proyecto: Proyecto }) {
  const servicio = nombreServicio(p);
  const galeria = p.galeria ?? [];
  const [vista, setVista] = useState(0);
  const datos = [
    p.anio && { etiqueta: 'Año', valor: String(p.anio) },
    p.estado && { etiqueta: 'Estado', valor: <Estado estado={p.estado} /> },
    servicio && { etiqueta: 'Tipo', valor: servicio },
  ].filter(Boolean) as { etiqueta: string; valor: ReactNode }[];
  return (
    <article className={estilos.detalle}>
      <div className={estilos.detalleVisual}>
        {galeria.length > 0 ? (
          // La captura tal cual, en una ventana con la dirección del sitio
          <div className={estilos.vista} aria-hidden="true">
            <div className={estilos.vistaBarra}>
              <span />
              <span />
              <span />
              <em>{dominioProyecto(p) ?? 'Acceso privado'}</em>
            </div>
            <div className={estilos.vistaImagenes}>
              {galeria.map((src, i) => (
                <img
                  key={src}
                  className={estilos.vistaImagen}
                  data-activa={i === vista ? '' : undefined}
                  src={src}
                  alt=""
                />
              ))}
            </div>
          </div>
        ) : (
          <Portatil proyecto={p} />
        )}
        {/* Miniaturas: eligen qué captura se ve */}
        {galeria.length > 1 && (
          <div className={estilos.miniaturas} role="group" aria-label="Capturas del proyecto">
            {galeria.map((src, i) => (
              <button
                key={src}
                type="button"
                className={estilos.miniatura}
                aria-pressed={i === vista}
                aria-label={`Captura ${i + 1} de ${galeria.length}`}
                onClick={() => setVista(i)}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        <Caracteristicas proyecto={p} />
      </div>
      <div className={estilos.detalleTexto}>
        {servicio && <p className={estilos.servicio}>{servicio}</p>}
        <h3 id="hoja-titulo" className={estilos.detalleTitulo}>
          {p.titulo}
        </h3>
        <p className={estilos.tarjetaDatos}>
          {p.cliente}
          {p.rol && ` · ${p.rol}`}
        </p>

        {/* Ficha corta, como la de "Información" en la App Store */}
        <dl className={estilos.ficha}>
          {datos.map((d) => (
            <div key={d.etiqueta}>
              <dt>{d.etiqueta}</dt>
              <dd>{d.valor}</dd>
            </div>
          ))}
        </dl>

        <p className={estilos.detalleDescripcion}>{p.descripcion}</p>
        {/* En móvil van aquí, después del texto (en escritorio, en el panel oscuro) */}
        <Caracteristicas proyecto={p} claras />

        <h4 className={estilos.detalleSubtitulo}>Tecnologías</h4>
        <ul className={estilos.tecnologias} aria-label="Tecnologías">
          {p.tecnologias.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {p.urlProyecto && (
          <a className={estilos.verProyecto} href={p.urlProyecto} target="_blank" rel="noreferrer">
            Visitar el sitio
            <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}

/** Lista de características (versión oscura del panel o clara del texto). */
function Caracteristicas({ proyecto: p, claras }: { proyecto: Proyecto; claras?: boolean }) {
  if (!p.caracteristicas?.length) return null;
  return (
    <div className={claras ? estilos.caracteristicasMovil : estilos.bloqueCaracteristicas}>
      <h4 className={estilos.detalleSubtitulo}>Características</h4>
      <ul className={estilos.caracteristicas}>
        {p.caracteristicas.map((c) => (
          <li key={c}>
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Estado del proyecto; "En línea" lleva un punto verde que late y "Privado", uno gris. */
function Estado({ estado }: { estado: NonNullable<Proyecto['estado']> }) {
  return (
    <span
      className={estilos.estado}
      data-estado={
        estado === 'En línea' ? 'linea' : estado === 'Privado' ? 'privado' : 'desarrollo'
      }
    >
      {estado}
    </span>
  );
}

const PAUSA_GALERIA = 3800;

/**
 * Laptop estilo MacBook (bisel fino, muesca y base) con pantalla 16:10. Si
 * el proyecto tiene capturas reales (`galeria`) se muestran y, si son
 * varias, se turnan con un fundido (o se ve la que diga `indice`); si no,
 * una app de escritorio dibujada según el servicio.
 */
function Portatil({ proyecto: p, indice }: { proyecto: Proyecto; indice?: number }) {
  const galeria = p.galeria ?? [];
  const [turno, setTurno] = useState(0);
  const pantallaRef = useRef<HTMLDivElement>(null);

  // Turnos automáticos solo si nadie elige, hay varias y la laptop se ve
  useEffect(() => {
    const pantalla = pantallaRef.current;
    if (indice !== undefined || galeria.length < 2 || !pantalla) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let id = 0;
    const observador = new IntersectionObserver(([e]) => {
      window.clearInterval(id);
      if (e.isIntersecting) {
        id = window.setInterval(() => setTurno((t) => (t + 1) % galeria.length), PAUSA_GALERIA);
      }
    });
    observador.observe(pantalla);
    return () => {
      observador.disconnect();
      window.clearInterval(id);
    };
  }, [indice, galeria.length]);

  const actual = indice ?? turno;
  return (
    <div className={estilos.portatil} aria-hidden="true">
      <div className={estilos.tapa}>
        <div ref={pantallaRef} className={estilos.pantalla}>
          <span className={estilos.muesca} />
          {galeria.length > 0 ? (
            // Escritorio de Mac: la captura entera en una ventana del
            // navegador (sin recortar los lados) y el Dock abajo
            <div className={estilos.escritorio}>
              <div className={estilos.navegador}>
                <div className={estilos.navegadorBarra}>
                  <span />
                  <span />
                  <span />
                  <em>{dominioProyecto(p) ?? 'Acceso privado'}</em>
                </div>
                <div className={estilos.navegadorVista}>
                  {galeria.map((src, i) => (
                    <img
                      key={src}
                      className={estilos.captura}
                      data-activa={i === actual ? '' : undefined}
                      src={src}
                      alt=""
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
              <div className={estilos.dock}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} />
                ))}
              </div>
            </div>
          ) : (
            <AppDeMarca servicio={p.servicio} />
          )}
        </div>
      </div>
      <div className={estilos.base} />
    </div>
  );
}

/** Barra de ventana con los tres puntos y la dirección. */
function BarraVentana() {
  return (
    <div className={estilos.appVentana}>
      <span />
      <span />
      <span />
      <em />
    </div>
  );
}

function AppDeMarca({ servicio }: { servicio: Proyecto['servicio'] }) {
  switch (servicio) {
    case 'sistema':
      return (
        <div className={`${estilos.app} ${estilos.appSistema}`}>
          <BarraVentana />
          <div className={estilos.appEscritorio}>
            <div className={estilos.appLateral}>
              <span className={estilos.appMarca} />
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={i === 1 ? estilos.appMenuActivo : undefined} />
              ))}
            </div>
            <div className={estilos.appContenido}>
              <div className={estilos.appCifras}>
                <span />
                <span />
                <span />
              </div>
              <div className={estilos.appBarras}>
                {[0.45, 0.7, 0.55, 0.9, 0.65, 1, 0.75, 0.85, 0.6, 0.95].map((alto, i) => (
                  <span key={i} style={{ '--alto': alto } as CSSProperties} />
                ))}
              </div>
              {[0, 1, 2].map((i) => (
                <div key={i} className={estilos.appFila}>
                  <span className={estilos.appAvatar} />
                  <span />
                  <span />
                  <span className={estilos.appEstado} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'automatizacion':
      return (
        <div className={`${estilos.app} ${estilos.appAutomatizacion}`}>
          <BarraVentana />
          <div className={estilos.appLienzo}>
            <span className={estilos.appCable} />
            {[WhatsappLogo, EnvelopeSimple, Table].map((Icono, i) => (
              <div key={i} className={estilos.appNodo} style={{ '--n': i } as CSSProperties}>
                <span className={estilos.appNodoIcono}>
                  <Icono size={14} weight="fill" />
                </span>
                <span className={estilos.appNodoTexto} />
              </div>
            ))}
            <div className={estilos.appAviso}>
              <span className={estilos.appNodoIcono} />
              <span className={estilos.appNodoTexto} />
            </div>
          </div>
        </div>
      );
    case 'seo':
      return (
        <div className={`${estilos.app} ${estilos.appSeo}`}>
          <BarraVentana />
          <div className={estilos.appBuscador}>
            <MagnifyingGlass size={11} weight="bold" />
            <span />
          </div>
          <div className={estilos.appResultadosEscritorio}>
            <div className={estilos.appResultados}>
              <div className={`${estilos.appResultado} ${estilos.appPrimero}`}>
                <span />
                <span />
                <span />
              </div>
              {[0, 1].map((i) => (
                <div key={i} className={estilos.appResultado}>
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
            <span className={estilos.appMapa} />
          </div>
        </div>
      );
    default:
      return (
        <div className={`${estilos.app} ${estilos.appWeb}`}>
          <BarraVentana />
          <div className={estilos.appNav}>
            <span className={estilos.appMarca} />
            <span />
            <span />
            <span />
            <span className={estilos.appBoton} />
          </div>
          <div className={estilos.appPortada}>
            <div>
              <span />
              <span />
              <span />
              <span className={estilos.appBoton} />
            </div>
            <span className={estilos.appImagen} />
          </div>
          <div className={estilos.appGaleria}>
            <span />
            <span />
            <span />
          </div>
        </div>
      );
  }
}
