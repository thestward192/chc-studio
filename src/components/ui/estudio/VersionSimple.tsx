import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { proyectos } from '../../../content/proyectos';
import { equipo } from '../../../content/equipo';
import { useEstudio } from '../../three/estudio/estadoEstudio';

interface Props {
  /** Sin WebGL, la versión simple es la página: sin botón de cerrar ni velo. */
  comoPagina?: boolean;
  onNavegar: (href: string) => void;
}

/** Los 5 proyectos y los 4 integrantes como HTML real, con enlaces. */
export function VersionSimple({ comoPagina = false, onNavegar }: Props) {
  const abierta = useEstudio((s) => s.versionSimple);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta || comoPagina || !caja.current) return;
    caja.current.querySelector<HTMLElement>('button, a')?.focus();
    const anim = animate(caja.current, { opacity: [0, 1], translateY: [12, 0], duration: 300, ease: 'outCubic' });
    return () => {
      anim.pause();
    };
  }, [abierta, comoPagina]);

  if (!abierta && !comoPagina) return null;
  const cerrar = () => useEstudio.getState().set({ versionSimple: false });
  const limpiar = (texto: string) => texto.replace('Texto de marcador: ', '');

  const contenido = (
    <div
      ref={caja}
      className="eui-menu eui-cristal eui-simple"
      role={comoPagina ? undefined : 'dialog'}
      aria-modal={comoPagina ? undefined : true}
      aria-label="Versión simple del estudio"
    >
      <div className="eui-menu__cabecera">
        <h2 className="eui-menu__titulo">Estudio ChcStudio — versión simple</h2>
        {!comoPagina && (
          <button type="button" className="eui-boton" onClick={cerrar}>
            Cerrar ✕
          </button>
        )}
      </div>

      <p className="eui-menu__seccion">Proyectos</p>
      <ul>
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <strong>{limpiar(proyecto.titulo)}</strong> — {proyecto.cliente}, {proyecto.anio}
            <p>{proyecto.descripcion}</p>
            <p>Tecnologías: {proyecto.tecnologias.join(', ')}</p>
            {proyecto.urlProyecto && (
              <a href={proyecto.urlProyecto} target="_blank" rel="noopener noreferrer">
                Ver proyecto ↗
              </a>
            )}
          </li>
        ))}
      </ul>

      <p className="eui-menu__seccion">Equipo</p>
      <ul>
        {equipo.map((integrante) => (
          <li key={integrante.id}>
            <a
              href={integrante.href}
              onClick={(ev) => {
                ev.preventDefault();
                onNavegar(integrante.href);
              }}
            >
              {limpiar(integrante.nombre)}
            </a>{' '}
            — {integrante.rol}
            <p>“{integrante.frase}”</p>
          </li>
        ))}
      </ul>
    </div>
  );

  if (comoPagina) return <div className="eui">{contenido}</div>;
  return (
    <div className="eui eui-velo" onClick={(ev) => ev.target === ev.currentTarget && cerrar()}>
      {contenido}
    </div>
  );
}
