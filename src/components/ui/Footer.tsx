import { useEffect, useRef, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { empresa } from '../../content/empresa';
import { enlacesNav, hero } from '../../content/cabecera';
import { servicios } from '../../content/servicios';
import { equipo } from '../../content/equipo';
import { mediosContacto } from '../../content/contacto';
import { irASeccion } from '../header/desplazamiento';
import { MascotaDePaso } from './MascotaDePaso';
import estilos from './Footer.module.css';

const MARCA = 'CHC STUDIO';

/**
 * Pie de página: panel oscuro redondeado que cierra la página como el hero
 * la abre. Marca y columnas de enlaces (secciones, servicios, oficinas 3D y
 * contacto), barra legal con "Volver arriba" y, al final, "CHC STUDIO" en
 * gigante a todo el ancho, cortado por el borde: las letras suben una a una
 * al aparecer y una luz las sigue con el mouse.
 *
 * Último lugar de la mascota: se asoma por encima de las letras gigantes, de
 * letra en letra, y se esconde si el mouse se le acerca.
 */
export function Footer() {
  const marcaRef = useRef<HTMLDivElement>(null);
  /** Cuándo terminaron de subir las letras (la mascota espera a que estén). */
  const letrasListasRef = useRef(Infinity);
  /** Mouse en px de la ventana (null si salió). */
  const punteroRef = useRef<{ x: number; y: number } | null>(null);
  /** Línea de arriba de las letras y alto de la mascota (px, en la marca). */
  const medidasRef = useRef({ linea: 0, alturaPx: 0 });

  // Las letras gigantes suben la primera vez que se ven
  useEffect(() => {
    const marca = marcaRef.current;
    if (!marca) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        marca.dataset.visible = '';
        letrasListasRef.current = performance.now() + 1500;
        observador.disconnect();
      },
      { threshold: 0.3 },
    );
    observador.observe(marca);
    return () => observador.disconnect();
  }, []);

  // Dónde está la línea de arriba de las letras (alto de las mayúsculas
  // medido con la fuente real): ahí termina el canvas de la mascota, así que
  // lo que queda debajo no se ve y parece que está detrás de las letras
  useEffect(() => {
    const marca = marcaRef.current;
    const letra = marca?.querySelector<HTMLElement>(`.${estilos.capaBase} > span`);
    if (!marca || !letra) return;
    const medir = () => {
      const { arriba, mayuscula } = lineaDeLetras(letra);
      const linea = letra.offsetTop + arriba;
      const alturaPx = Math.min(Math.max(mayuscula * 0.72, 60), 130);
      medidasRef.current = { linea, alturaPx };
      marca.style.setProperty('--mascota-arriba', `${linea - alturaPx * 1.8}px`);
      marca.style.setProperty('--mascota-alto', `${alturaPx * 1.8}px`);
    };
    const observador = new ResizeObserver(medir);
    observador.observe(marca);
    void document.fonts.ready.then(medir);
    const control = new AbortController();
    window.addEventListener(
      'pointermove',
      (e) => (punteroRef.current = { x: e.clientX, y: e.clientY }),
      { passive: true, signal: control.signal },
    );
    document.documentElement.addEventListener('pointerleave', () => (punteroRef.current = null), {
      signal: control.signal,
    });
    return () => {
      observador.disconnect();
      control.abort();
    };
  }, []);

  const medirMascota = (capa: HTMLElement) => {
    const marca = marcaRef.current;
    const { alturaPx } = medidasRef.current;
    if (!marca || !alturaPx) return null;
    // Las letras donde se puede asomar (sin el espacio), en px del canvas;
    // medidas sin transformaciones (las letras suben al aparecer)
    const letras = [...marca.querySelectorAll<HTMLElement>(`.${estilos.capaBase} > span`)];
    const anclas = letras
      .filter((l) => l.textContent?.trim())
      .map((l) => ({
        x: l.offsetLeft + l.offsetWidth / 2 - capa.offsetLeft,
        y: capa.offsetHeight,
      }));
    const r = marca.getBoundingClientRect();
    const alto = window.innerHeight;
    const lienzo = capa.getBoundingClientRect();
    const p = punteroRef.current;
    const aLaVista =
      performance.now() > letrasListasRef.current && r.top < alto * 0.88 && r.bottom > alto * 0.15;
    return {
      anclas,
      objetivo: aLaVista ? 0 : -1,
      alturaPx,
      puntero: p ? { x: p.x - lienzo.left, y: p.y - lienzo.top } : null,
    };
  };

  const iluminar = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--luz-x', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--luz-y', `${e.clientY - r.top}px`);
  };

  const volverArriba = () => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' });
  };

  const irA = (id: string) => (evento: MouseEvent<HTMLAnchorElement>) => {
    if (irASeccion(id)) evento.preventDefault();
  };

  const correo = mediosContacto.find((m) => m.icono === 'correo');
  const telefono = mediosContacto.find((m) => m.icono === 'telefono');

  return (
    <footer className={estilos.pie}>
      <div className={estilos.panel}>
        <div className={estilos.contenedor}>
          <div className={estilos.superior}>
            <div className={estilos.presentacion}>
              <a
                href="#"
                className={estilos.logo}
                onClick={(e) => {
                  e.preventDefault();
                  volverArriba();
                }}
              >
                CHC <span>STUDIO</span>
              </a>
              <p className={estilos.lema}>{hero.subtitulo}</p>
              <a className={estilos.cta} href="#contacto" onClick={irA('contacto')}>
                {hero.boton.etiqueta}
              </a>
            </div>

            <nav className={estilos.columnas} aria-label="Pie de página">
              <div>
                <h3>Explora</h3>
                <ul>
                  {enlacesNav.map((enlace) => (
                    <li key={enlace.id}>
                      <a href={`#${enlace.id}`} onClick={irA(enlace.id)}>
                        {enlace.etiqueta}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Servicios</h3>
                <ul>
                  {servicios.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} onClick={irA(s.id)}>
                        {s.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Estudio 3D</h3>
                <ul>
                  <li>
                    <a href="/estudio.html">El taller</a>
                  </li>
                  {equipo.map((p) => (
                    <li key={p.id}>
                      <a href={p.href}>Oficina de {p.nombreCorto}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Contacto</h3>
                <ul>
                  {correo && (
                    <li>
                      <a href={correo.href}>{correo.valor}</a>
                    </li>
                  )}
                  {telefono && (
                    <li>
                      <a href={telefono.href}>{telefono.valor}</a>
                    </li>
                  )}
                  {empresa.redes.map((red) => (
                    <li key={red.nombre}>
                      <a href={red.url} target="_blank" rel="noreferrer">
                        {red.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <div className={estilos.legal}>
            <p>
              © {new Date().getFullYear()} {empresa.nombre}. Hecho en Costa Rica.
            </p>
            <button type="button" className={estilos.arriba} onClick={volverArriba}>
              Volver arriba
              <ArrowUp size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* La marca en gigante, cortada por el borde inferior del panel */}
        <div
          ref={marcaRef}
          className={estilos.marcaGigante}
          aria-hidden="true"
          onPointerMove={iluminar}
        >
          <Letras capa={estilos.capaBase} />
          {/* Misma palabra en blanco, visible solo alrededor del mouse */}
          <Letras capa={estilos.capaLuz} />
          {/* La mascota asomándose por encima de las letras */}
          <MascotaDePaso tipo="pie" className={estilos.mascotaCapa} medir={medirMascota} />
        </div>
      </div>
    </footer>
  );
}

function Letras({ capa }: { capa: string }) {
  return (
    <span className={capa}>
      {[...MARCA].map((letra, i) => (
        <span
          key={i}
          className={i >= 4 ? estilos.letraStudio : undefined}
          style={{ '--i': i } as CSSProperties}
        >
          {letra === ' ' ? '\u00a0' : letra}
        </span>
      ))}
    </span>
  );
}

let lienzoMedidas: CanvasRenderingContext2D | null = null;

/**
 * Distancia del borde de arriba de la caja de una letra (inline-block) a la
 * línea de las mayúsculas, y el alto de las mayúsculas, con la fuente real.
 */
function lineaDeLetras(letra: HTMLElement) {
  const estilo = getComputedStyle(letra);
  lienzoMedidas ??= document.createElement('canvas').getContext('2d');
  const tamano = parseFloat(estilo.fontSize);
  if (!lienzoMedidas) return { arriba: tamano * 0.25, mayuscula: tamano * 0.72 };
  lienzoMedidas.font = `${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;
  const m = lienzoMedidas.measureText('H');
  // La caja mide lo que la línea; el texto va centrado en ella
  const contenido = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
  const base = (letra.offsetHeight - contenido) / 2 + m.fontBoundingBoxAscent;
  return { arriba: base - m.actualBoundingBoxAscent, mayuscula: m.actualBoundingBoxAscent };
}
