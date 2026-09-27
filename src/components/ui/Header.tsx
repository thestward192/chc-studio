import { empresa } from '../../content/empresa';
import { BotonPreview } from './BotonPreview';
import './Header.css';

interface Props {
  /** Si se pasa, muestra el botón "Volver a la intro" (solo en Inicio, con WebGL). */
  onVolverIntro?: () => void;
}

export function Header({ onVolverIntro }: Props) {
  return (
    <header className="encabezado">
      <a href="/" className="encabezado__marca">
        {empresa.nombre}
      </a>
      <nav className="encabezado__nav" aria-label="Navegación principal">
        <a href="#servicios">Servicios</a>
        <a href="#proyectos">Proyectos</a>
        <a href="#equipo">Equipo</a>
        <a href="#contacto">Contacto</a>
      </nav>
      {onVolverIntro && (
        <button
          type="button"
          className="encabezado__volver"
          onClick={onVolverIntro}
          aria-label="Volver a la intro"
        >
          <span className="encabezado__volver-largo">Volver a la intro</span>
          <span className="encabezado__volver-corto" aria-hidden="true">
            Intro
          </span>
        </button>
      )}
      <BotonPreview
        href="/estudio.html"
        etiqueta="Explorar el estudio"
        // TODO(video real): sustituir por un video en bucle corto (<2 MB)
        // de la sala de proyectos. Ver public/video/README.md.
        videoUrl="/video/preview-estudio.mp4"
      />
    </header>
  );
}
