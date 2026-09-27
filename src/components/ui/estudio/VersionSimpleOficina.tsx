import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { listaGustos, pendiente, type Integrante } from '../../../content/equipo';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { LineasPendientes } from './PanelInfo';

interface Props {
  integrante: Integrante;
  /** Sin WebGL, la versión simple es la página: sin botón de cerrar ni velo. */
  comoPagina?: boolean;
  onNavegar: (href: string) => void;
}

/**
 * Versión en texto de una oficina: nombre, gustos y, donde todavía no hay
 * texto (qué hace, experiencia, habilidades), líneas de marcador.
 */
export function VersionSimpleOficina({ integrante, comoPagina = false, onNavegar }: Props) {
  const abierta = useEstudio((s) => s.versionSimple);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierta || comoPagina || !caja.current) return;
    caja.current.querySelector<HTMLElement>('button, a')?.focus();
    const anim = animate(caja.current, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 320,
      ease: 'outCubic',
    });
    return () => {
      anim.pause();
    };
  }, [abierta, comoPagina]);

  if (!abierta && !comoPagina) return null;
  const cerrar = () => useEstudio.getState().set({ versionSimple: false });

  const seccion = (titulo: string, texto: string | string[]) => {
    const vacio = Array.isArray(texto) ? texto.length === 0 : pendiente(texto);
    return (
      <>
        <p className="eui-etiqueta eui-menu__seccion">{titulo}</p>
        {vacio ? (
          <LineasPendientes lineas={[88, 70]} />
        ) : Array.isArray(texto) ? (
          <ul>
            {texto.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : (
          <p>{texto}</p>
        )}
      </>
    );
  };

  const contenido = (
    <div
      ref={caja}
      className="eui-menu eui-cristal eui-simple"
      role={comoPagina ? undefined : 'dialog'}
      aria-modal={comoPagina ? undefined : true}
      aria-label={`Versión simple de la oficina de ${integrante.nombre}`}
    >
      <div className="eui-menu__cabecera">
        <h2 className="eui-menu__titulo">{integrante.nombre}</h2>
        {!comoPagina && (
          <button type="button" className="eui-boton-redondo" onClick={cerrar} aria-label="Cerrar">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="eui-etiqueta eui-menu__seccion">Le gusta</p>
      <p>{listaGustos(integrante)}.</p>
      {seccion('Lo que hace', integrante.rol)}
      {seccion('Sobre mí', integrante.bio)}
      {seccion(
        'Experiencia',
        integrante.experiencia.map((e) => `${e.puesto}, ${e.organizacion} (${e.periodo})`),
      )}
      {seccion('Habilidades', integrante.habilidades)}

      <p className="eui-menu__fila" style={{ marginTop: '1.5rem' }}>
        <a
          href="/estudio.html"
          className="eui-boton"
          onClick={(ev) => {
            ev.preventDefault();
            onNavegar('/estudio.html');
          }}
        >
          <span className="eui-boton__icono" aria-hidden="true">
            <ArrowLeft size={18} />
          </span>
          Volver al taller
        </a>
      </p>
    </div>
  );

  if (comoPagina) return <div className="eui">{contenido}</div>;
  return (
    <div className="eui eui-velo" onClick={(ev) => ev.target === ev.currentTarget && cerrar()}>
      {contenido}
    </div>
  );
}
