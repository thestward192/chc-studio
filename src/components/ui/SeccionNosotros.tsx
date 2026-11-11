import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { Cube } from '@phosphor-icons/react/dist/csr/Cube';
import { encabezadoNosotros, escenasNosotros } from '../../content/nosotros';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import estilos from './SeccionNosotros.module.css';

/** Segundos que se muestra cada escena antes de pasar sola a la siguiente. */
const DURACION_ESCENA = 7;

/**
 * Nosotros: panel oscuro (como el hero) con una ventana grande que muestra
 * la vista previa del estudio 3D: el taller y la oficina de cada integrante
 * (renders reales). La ventana se inclina siguiendo al mouse y la imagen se
 * acerca despacio. Un control segmentado de iOS elige la escena y avanza
 * solo (con su barra de progreso); se pausa al señalar la ventana o los
 * segmentos, fuera de pantalla y con movimiento reducido.
 */
export function SeccionNosotros() {
  const seccionRef = useRef<HTMLElement>(null);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const reducido = usePrefersReducedMotion();
  const [activa, setActiva] = useState(0);
  const [enPantalla, setEnPantalla] = useState(false);
  const [senalada, setSenalada] = useState(false);
  const escena = escenasNosotros[activa];
  const pausa = reducido || !enPantalla || senalada;

  useEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        setEnPantalla(e.isIntersecting);
        if (e.isIntersecting) seccion.dataset.visible = '';
      },
      { threshold: 0.25 },
    );
    observador.observe(seccion);
    return () => observador.disconnect();
  }, []);

  // Precargar las otras escenas cuando la sección ya está cerca
  useEffect(() => {
    if (!enPantalla) return;
    escenasNosotros.forEach((e) => {
      const img = new Image();
      img.src = e.imagen;
    });
  }, [enPantalla]);

  const siguiente = () => setActiva((i) => (i + 1) % escenasNosotros.length);

  // Inclinación 3D de la ventana siguiendo al mouse (variables CSS, sin re-render)
  const inclinar = (e: PointerEvent<HTMLDivElement>) => {
    if (reducido || e.pointerType !== 'mouse') return;
    const ventana = ventanaRef.current;
    if (!ventana) return;
    const r = ventana.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ventana.style.setProperty('--giro-x', `${(-y * 5).toFixed(2)}deg`);
    ventana.style.setProperty('--giro-y', `${(x * 7).toFixed(2)}deg`);
    ventana.style.setProperty('--luz-x', `${((x + 0.5) * 100).toFixed(1)}%`);
    ventana.style.setProperty('--luz-y', `${((y + 0.5) * 100).toFixed(1)}%`);
  };

  const enderezar = () => {
    const ventana = ventanaRef.current;
    ventana?.style.setProperty('--giro-x', '0deg');
    ventana?.style.setProperty('--giro-y', '0deg');
    setSenalada(false);
  };

  return (
    <section
      ref={seccionRef}
      id="nosotros"
      className={estilos.seccion}
      aria-labelledby="nosotros-titular"
      style={{ '--color-escena': escena.color } as CSSProperties}
    >
      <div className={estilos.panel}>
        <header className={estilos.encabezado}>
          <p className={estilos.antetitulo}>{encabezadoNosotros.antetitulo}</p>
          <h2 id="nosotros-titular" className={estilos.titular}>
            {encabezadoNosotros.titular.map((parte, i) =>
              parte.destacado ? (
                <span key={i} className={estilos.degradado}>
                  {parte.texto}
                </span>
              ) : (
                parte.texto
              ),
            )}
          </h2>
          <p className={estilos.subtitulo}>{encabezadoNosotros.subtitulo}</p>
        </header>

        {/* Vista previa del estudio 3D */}
        <div className={estilos.escenario}>
          <div
            ref={ventanaRef}
            className={estilos.ventana}
            onPointerMove={inclinar}
            onPointerEnter={() => setSenalada(true)}
            onPointerLeave={enderezar}
          >
            <div className={estilos.imagenes} aria-hidden="true">
              {escenasNosotros.map((e, i) => (
                <img
                  key={e.id}
                  className={estilos.imagen}
                  data-activa={i === activa || undefined}
                  src={e.imagen}
                  alt=""
                  width={1600}
                  height={1000}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ))}
            </div>
            <span className={estilos.reflejo} aria-hidden="true" />

            <span className={estilos.etiquetaVivo}>
              <Cube size={14} weight="bold" aria-hidden="true" />
              Vista previa · Estudio 3D
            </span>

            <div className={estilos.ficha} key={escena.id} aria-live="polite">
              <h3 className={estilos.fichaTitulo}>{escena.titulo}</h3>
              <p className={estilos.fichaTexto}>{escena.descripcion}</p>
              {escena.gustos.length > 0 && (
                <ul className={estilos.gustos} aria-label="Le gusta">
                  {escena.gustos.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              )}
              <a className={estilos.entrar} href={escena.href}>
                {escena.accion}
                <CaretRight size={14} weight="bold" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Control segmentado de iOS: elige la escena y avanza solo */}
        <div
          className={estilos.segmentos}
          role="tablist"
          aria-label="Elegir oficina"
          data-pausa={pausa || undefined}
          onPointerEnter={() => setSenalada(true)}
          onPointerLeave={() => setSenalada(false)}
        >
          {escenasNosotros.map((e, i) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={i === activa}
              className={estilos.segmento}
              style={{ '--color': e.color, '--duracion': `${DURACION_ESCENA}s` } as CSSProperties}
              onClick={() => setActiva(i)}
            >
              <span className={estilos.punto} aria-hidden="true" />
              {e.etiqueta}
              {i === activa && (
                <span
                  key={`${e.id}-${activa}`}
                  className={estilos.progreso}
                  aria-hidden="true"
                  onAnimationEnd={siguiente}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
