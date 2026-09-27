import { lazy, Suspense, useCallback, useRef } from 'react';
import { PantallaCarga } from '../../components/ui/PantallaCarga';
import { PanelTexto } from '../../components/ui/PanelTexto';
import { TransicionPagina, type ManejadorTransicion } from '../../components/ui/TransicionPagina';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSoportaWebGL } from '../../hooks/useSoportaWebGL';
import type { Integrante as DatosIntegrante } from '../../content/equipo';
import './Integrante.css';

const EscenaHabitacionPersonal = lazy(() => import('../../components/three/EscenaHabitacionPersonal'));

interface Props {
  integrante: DatosIntegrante;
}

/**
 * Única sala del equipo: se configura por completo a partir de los datos
 * de un integrante (src/content/equipo.ts). Las 4 páginas HTML
 * (equipo/integrante-1..4.html) montan este mismo componente pasando un
 * integrante distinto — no hay 4 componentes duplicados.
 */
export function Integrante({ integrante }: Props) {
  const prefiereReducido = usePrefersReducedMotion();
  const soportaWebGL = useSoportaWebGL();
  const transicionRef = useRef<ManejadorTransicion>(null);

  const irA = useCallback((href: string) => {
    transicionRef.current?.salirHacia(href);
  }, []);

  const mostrarEscena3D = soportaWebGL === true && !prefiereReducido;

  return (
    <>
      <TransicionPagina ref={transicionRef} />

      <a
        href="/estudio.html"
        className="integrante__volver"
        onClick={(evento) => {
          evento.preventDefault();
          irA('/estudio.html');
        }}
      >
        ← Volver a la sala de proyectos
      </a>

      {mostrarEscena3D ? (
        <div className="integrante__lienzo">
          <Suspense
            fallback={<PantallaCarga visible etiqueta={`Preparando la habitación de ${integrante.nombre}…`} />}
          >
            <EscenaHabitacionPersonal integrante={integrante} onVolver={irA} />
          </Suspense>
        </div>
      ) : (
        <p className="integrante__aviso">
          {prefiereReducido
            ? 'Se detectó una preferencia de movimiento reducido: mostramos la versión en texto.'
            : soportaWebGL === false
              ? 'Tu navegador no soporta WebGL: mostramos la versión en texto.'
              : ''}
        </p>
      )}

      <div className="integrante__panel-simple">
        <PanelTexto titulo={integrante.nombre} abiertoPorDefecto={!mostrarEscena3D}>
          <p className="integrante__rol">{integrante.rol}</p>
          <p>{integrante.bio}</p>

          <h3>Gustos</h3>
          <ul>
            {integrante.gustos.map((gusto) => (
              <li key={gusto}>{gusto}</li>
            ))}
          </ul>

          <h3>Experiencia</h3>
          <ul>
            {integrante.experiencia.map((exp) => (
              <li key={`${exp.puesto}-${exp.organizacion}`}>
                <strong>{exp.puesto}</strong> — {exp.organizacion} ({exp.periodo})
                <br />
                {exp.descripcion}
              </li>
            ))}
          </ul>

          <h3>Habilidades</h3>
          <ul>
            {integrante.habilidades.map((habilidad) => (
              <li key={habilidad}>{habilidad}</li>
            ))}
          </ul>

          <a href={integrante.cvUrl} className="integrante__cv" download>
            Descargar CV (PDF)
          </a>
        </PanelTexto>
      </div>
    </>
  );
}
