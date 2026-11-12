import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { Cube } from '@phosphor-icons/react/dist/csr/Cube';
import { encabezadoNosotros, escenasNosotros } from '../../content/nosotros';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { MascotaDePaso } from './MascotaDePaso';
import estilos from './SeccionNosotros.module.css';

/** Segundos que se muestra cada escena antes de pasar sola a la siguiente. */
const DURACION_ESCENA = 7;

/**
 * Nosotros: panel oscuro (como el hero) en dos columnas. A la izquierda el
 * titular y el equipo en una lista agrupada de iOS (el taller y cada
 * integrante con su avatar y lo que le gusta); a la derecha, la ventana con
 * la vista previa del estudio 3D (renders reales) de la fila elegida. La
 * lista avanza sola con una barra de progreso en la fila activa; se pausa
 * al señalar la ventana o la lista, fuera de pantalla y con movimiento
 * reducido. La ventana se inclina con el mouse y la imagen se acerca despacio.
 *
 * La mascota llega volando por la derecha y se posa en el borde de la
 * ventana; al cambiar de escena se asoma a mirarla y, al seguir bajando, se
 * zambulle en ella (la ventana hace una onda).
 */
export function SeccionNosotros() {
  const seccionRef = useRef<HTMLElement>(null);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const reducido = usePrefersReducedMotion();
  const [activa, setActiva] = useState(0);
  const [enPantalla, setEnPantalla] = useState(false);
  const [senalada, setSenalada] = useState(false);
  const [onda, setOnda] = useState(0);
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

  // Lista como pestañas: flechas arriba/abajo, Inicio y Fin
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = escenasNosotros.length;
    const ir = (i: number) => {
      e.preventDefault();
      const destino = (i + n) % n;
      setActiva(destino);
      listaRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[destino]?.focus();
    };
    if (e.key === 'ArrowDown') ir(activa + 1);
    else if (e.key === 'ArrowUp') ir(activa - 1);
    else if (e.key === 'Home') ir(0);
    else if (e.key === 'End') ir(n - 1);
  };

  // La mascota: se posa en el borde de arriba de la ventana (a la derecha),
  // llega cuando la ventana entra en pantalla y se zambulle en ella cuando
  // la ventana ya sube hacia el navbar (todavía a la vista)
  const medirMascota = (capa: HTMLElement) => {
    const ventana = ventanaRef.current;
    if (!ventana) return null;
    const lienzo = capa.getBoundingClientRect();
    const r = ventana.getBoundingClientRect();
    const alto = window.innerHeight;
    let objetivo = 0;
    if (r.top > alto * 0.8) objetivo = -1;
    else if (r.top < alto * 0.2) objetivo = 1;
    return {
      anclas: [
        { x: r.left + r.width * 0.84 - lienzo.left, y: r.top - lienzo.top },
        { x: r.left + r.width * 0.5 - lienzo.left, y: r.top + r.height * 0.5 - lienzo.top },
      ],
      objetivo,
      alturaPx: Math.min(Math.max(r.width * 0.15, 70), 104),
      aviso: activa,
    };
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
        <div className={estilos.rejilla}>
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

          {/* El equipo: lista agrupada de iOS que elige la escena y avanza sola */}
          <div
            ref={listaRef}
            className={estilos.lista}
            role="tablist"
            aria-label="Elegir oficina"
            aria-orientation="vertical"
            data-pausa={pausa || undefined}
            onPointerEnter={() => setSenalada(true)}
            onPointerLeave={() => setSenalada(false)}
            onKeyDown={alTeclear}
          >
            {escenasNosotros.map((e, i) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                id={`nosotros-pestana-${e.id}`}
                aria-selected={i === activa}
                aria-controls="nosotros-vista"
                tabIndex={i === activa ? 0 : -1}
                className={estilos.fila}
                style={{ '--color': e.color, '--duracion': `${DURACION_ESCENA}s` } as CSSProperties}
                onClick={() => setActiva(i)}
              >
                <span className={estilos.avatar} aria-hidden="true">
                  {e.inicial || <Cube size={18} weight="bold" />}
                </span>
                <span className={estilos.filaTexto}>
                  <span className={estilos.filaTitulo}>{e.titulo}</span>
                  <span className={estilos.filaDetalle}>{e.detalle}</span>
                </span>
                <CaretRight
                  className={estilos.chevron}
                  size={15}
                  weight="bold"
                  aria-hidden="true"
                />
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

          {/* Vista previa del estudio 3D */}
          <div className={estilos.escenario}>
            <div
              ref={ventanaRef}
              id="nosotros-vista"
              role="tabpanel"
              aria-labelledby={`nosotros-pestana-${escena.id}`}
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
              {/* Onda cuando la mascota se zambulle en la ventana (o sale) */}
              {onda > 0 && <span key={onda} className={estilos.onda} aria-hidden="true" />}

              <span className={estilos.etiquetaVivo}>
                <Cube size={14} weight="bold" aria-hidden="true" />
                Vista previa · Estudio 3D
              </span>

              <div className={estilos.ficha} key={escena.id} aria-live="polite">
                <h3 className={estilos.fichaTitulo}>{escena.titulo}</h3>
                <p className={estilos.fichaTexto}>{escena.descripcion}</p>
                <a className={estilos.entrar} href={escena.href}>
                  {escena.accion}
                  <CaretRight size={14} weight="bold" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <MascotaDePaso
          tipo="nosotros"
          className={estilos.mascotaCapa}
          medir={medirMascota}
          avisar={(evento) => {
            if (evento === 'chapuzon' || evento === 'emerger') setOnda((o) => o + 1);
          }}
        />
      </div>
    </section>
  );
}
