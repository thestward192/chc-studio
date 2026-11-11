import { useEffect, useRef, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { ArrowUp } from '@phosphor-icons/react/dist/csr/ArrowUp';
import { empresa } from '../../content/empresa';
import { enlacesNav, hero } from '../../content/cabecera';
import { servicios } from '../../content/servicios';
import { equipo } from '../../content/equipo';
import { mediosContacto } from '../../content/contacto';
import { irASeccion } from '../header/desplazamiento';
import estilos from './Footer.module.css';

const MARCA = 'CHC STUDIO';

/**
 * Pie de página: panel oscuro redondeado que cierra la página como el hero
 * la abre. Marca y columnas de enlaces (secciones, servicios, oficinas 3D y
 * contacto), barra legal con "Volver arriba" y, al final, "CHC STUDIO" en
 * gigante a todo el ancho, cortado por el borde: las letras suben una a una
 * al aparecer y una luz las sigue con el mouse.
 */
export function Footer() {
  const marcaRef = useRef<HTMLDivElement>(null);

  // Las letras gigantes suben la primera vez que se ven
  useEffect(() => {
    const marca = marcaRef.current;
    if (!marca) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        marca.dataset.visible = '';
        observador.disconnect();
      },
      { threshold: 0.3 },
    );
    observador.observe(marca);
    return () => observador.disconnect();
  }, []);

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
