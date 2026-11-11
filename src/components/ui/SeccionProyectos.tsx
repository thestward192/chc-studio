import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { proyectos, type Proyecto } from '../../content/proyectos';
import { servicios } from '../../content/servicios';
import { hero } from '../../content/cabecera';
import { iconosServicio } from './iconosServicio';
import estilos from './SeccionProyectos.module.css';

const nombreServicio = (p: Proyecto) =>
  servicios.find((s) => s.icono === p.servicio)?.titulo ?? null;

/**
 * Proyectos destacados: índice de proyectos a la derecha y un escenario
 * oscuro a la izquierda con el proyecto elegido (señalar o enfocar una fila
 * lo cambia). En móvil no hay escenario: la fila elegida se despliega.
 * Toda la información está en HTML (es la versión en texto de la sala 3D).
 */
export function SeccionProyectos() {
  const [activo, setActivo] = useState(0);
  const seccionRef = useRef<HTMLElement>(null);
  const proyecto = proyectos[activo];

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
      id="proyectos"
      className={estilos.seccion}
      aria-labelledby="proyectos-titular"
    >
      <div className={estilos.contenedor}>
        <header className={estilos.encabezado}>
          <h2 id="proyectos-titular" className={estilos.titular}>
            Proyectos que ya están en marcha.
          </h2>
          <p className={estilos.subtitulo}>
            Una muestra de lo que construimos. Recórrelos aquí o entra a la sala 3D del estudio para
            verlos en grande.
          </p>
          <a className={estilos.enlaceEstudio} href={hero.prueba.enlace.href}>
            {hero.prueba.enlace.etiqueta}
            <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
          </a>
        </header>

        <div className={estilos.cuerpo}>
          {/* Escenario (escritorio): el proyecto elegido en grande */}
          <div className={estilos.escenario} aria-live="polite">
            <Ficha key={proyecto.id} proyecto={proyecto} />
          </div>

          <ol className={estilos.indice}>
            {proyectos.map((p, i) => {
              const Icono = p.servicio ? iconosServicio[p.servicio] : null;
              const elegido = i === activo;
              return (
                <li key={p.id} className={estilos.fila} data-activo={elegido || undefined}>
                  <button
                    type="button"
                    className={estilos.boton}
                    aria-current={elegido || undefined}
                    aria-expanded={elegido}
                    onClick={() => setActivo(i)}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setActivo(i)}
                    onFocus={() => setActivo(i)}
                  >
                    {Icono && (
                      <span className={estilos.baldosa} aria-hidden="true">
                        <Icono size={20} weight="regular" />
                      </span>
                    )}
                    <span className={estilos.filaTexto}>
                      <span className={estilos.filaTitulo}>{p.titulo}</span>
                      <span className={estilos.filaDatos}>
                        {p.cliente}, {p.anio}
                      </span>
                    </span>
                    <ArrowUpRight
                      className={estilos.filaFlecha}
                      size={18}
                      weight="bold"
                      aria-hidden="true"
                    />
                  </button>
                  {/* Móvil: la ficha se despliega dentro de la fila */}
                  {elegido && (
                    <div className={estilos.desplegable}>
                      <Ficha proyecto={p} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Ficha({ proyecto: p }: { proyecto: Proyecto }) {
  const Icono = p.servicio ? iconosServicio[p.servicio] : null;
  const servicio = nombreServicio(p);

  return (
    <article className={estilos.ficha}>
      <div className={estilos.portada}>
        {p.imagenAlta ? (
          <img src={p.imagenAlta} alt={`Vista de ${p.titulo}`} loading="lazy" decoding="async" />
        ) : (
          // TODO(contenido real): captura del proyecto (16:10, mín. 1600×1000) en `imagenAlta`.
          // Mientras tanto, portada de marca: el icono del servicio sobre la cuadrícula de la sala.
          <div className={estilos.portadaMarca} aria-hidden="true">
            <span className={estilos.portadaCuadricula} />
            {Icono && (
              <span className={estilos.portadaIcono}>
                <Icono size={40} weight="regular" />
              </span>
            )}
          </div>
        )}
      </div>

      <div className={estilos.fichaTexto}>
        {servicio && <p className={estilos.fichaServicio}>{servicio}</p>}
        <h3 className={estilos.fichaTitulo}>{p.titulo}</h3>
        <p className={estilos.fichaDescripcion}>{p.descripcion}</p>
        <ul className={estilos.tecnologias} aria-label="Tecnologías">
          {p.tecnologias.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {p.urlProyecto && (
          <a className={estilos.verProyecto} href={p.urlProyecto} target="_blank" rel="noreferrer">
            Ver el proyecto
            <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
