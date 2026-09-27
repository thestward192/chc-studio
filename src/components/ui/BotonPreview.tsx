import { useRef } from 'react';
import './BotonPreview.css';

interface Props {
  href: string;
  etiqueta: string;
  videoUrl: string;
}

/**
 * Botón con una preview en VIDEO (no una escena 3D en vivo): mucho más
 * barato que instanciar Three.js solo para una miniatura decorativa.
 * Precarga la página destino (rel=prefetch) al pasar el mouse/foco.
 */
export function BotonPreview({ href, etiqueta, videoUrl }: Props) {
  const prefetchAgregado = useRef(false);

  const precargar = () => {
    if (prefetchAgregado.current) return;
    prefetchAgregado.current = true;
    const enlace = document.createElement('link');
    enlace.rel = 'prefetch';
    enlace.href = href;
    document.head.appendChild(enlace);
  };

  return (
    <a
      href={href}
      className="boton-preview"
      onMouseEnter={precargar}
      onFocus={precargar}
      onTouchStart={precargar}
    >
      <video
        className="boton-preview__video"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <span className="boton-preview__etiqueta">{etiqueta}</span>
    </a>
  );
}
