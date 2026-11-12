import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import { palabrasServicio } from '../../content/cabecera';
import { iconosServicio as iconos } from '../ui/iconosServicio';
import { irASeccion } from './desplazamiento';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import estilos from './Header.module.css';

interface Props {
  /** Si se pasa, el navbar muestra el botón "Intro" para volver a la laptop 3D. */
  onVolverIntro?: () => void;
}

/**
 * Cabecera de Inicio: navbar de vidrio estilo iOS (fijo mientras se recorre
 * la cabecera), hero en la tarjeta oscura y el Dock de servicios montado
 * sobre su borde inferior.
 */
export function Header({ onVolverIntro }: Props) {
  const filaRef = useRef<HTMLUListElement>(null);

  // La fila de servicios entra escalonada la primera vez que se ve
  useEffect(() => {
    const fila = filaRef.current;
    if (!fila) return;
    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        fila.dataset.visible = '';
        observador.disconnect();
      },
      { threshold: 0.4 },
    );
    observador.observe(fila);
    return () => observador.disconnect();
  }, []);

  const alPulsar = (evento: MouseEvent<HTMLAnchorElement>) => {
    if (irASeccion('servicios')) evento.preventDefault();
  };

  return (
    <header className={estilos.header}>
      <Navbar onVolverIntro={onVolverIntro} />
      <Hero />
      <ul ref={filaRef} className={estilos.franja} aria-label="Lo que hacemos">
        {palabrasServicio.map((servicio, i) => {
          const Icono = iconos[servicio.icono];
          return (
            <li key={servicio.texto} className={estilos.item} style={{ '--i': i } as CSSProperties}>
              <a href="#servicios" className={estilos.servicio} onClick={alPulsar}>
                <span className={estilos.baldosa} aria-hidden="true">
                  <Icono size={26} weight="regular" />
                </span>
                <span className={estilos.etiqueta}>{servicio.texto}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
