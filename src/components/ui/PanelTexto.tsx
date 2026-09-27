import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import './PanelTexto.css';

interface Props {
  titulo: string;
  children: ReactNode;
  /** Texto del botón que abre el panel, ej. "Ver versión simple". */
  etiquetaBoton?: string;
  abiertoPorDefecto?: boolean;
}

/**
 * Versión en texto real (HTML accesible) de contenido que también existe en
 * 3D: proyectos, gustos, CV. Garantiza que la información esté disponible
 * sin WebGL, para lectores de pantalla y para SEO.
 */
export function PanelTexto({
  titulo,
  children,
  etiquetaBoton = 'Ver versión simple',
  abiertoPorDefecto = false,
}: Props) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) panelRef.current?.focus();
  }, [abierto]);

  return (
    <div className="panel-texto">
      <button
        type="button"
        className="panel-texto__boton"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? 'Ocultar versión simple' : etiquetaBoton}
      </button>
      {abierto && (
        <div className="panel-texto__contenido" tabIndex={-1} ref={panelRef}>
          <h2>{titulo}</h2>
          {children}
        </div>
      )}
    </div>
  );
}
