import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { Monitor } from '@phosphor-icons/react/dist/csr/Monitor';
import { Stack } from '@phosphor-icons/react/dist/csr/Stack';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { Headset } from '@phosphor-icons/react/dist/csr/Headset';
import { palabrasServicio, type IconoServicio } from '../../content/cabecera';
import { irASeccion } from './desplazamiento';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import estilos from './Header.module.css';

const iconos: Record<IconoServicio, Icon> = {
  web: Monitor,
  sistema: Stack,
  automatizacion: ArrowsClockwise,
  seo: MagnifyingGlass,
  soporte: Headset,
};

interface Props {
  /** Si se pasa, el navbar muestra el botón "Intro" para volver a la laptop 3D. */
  onVolverIntro?: () => void;
}

/**
 * Cabecera de Inicio: navbar (con la pestaña que sube desde la tarjeta en
 * escritorio), hero en la tarjeta oscura y, debajo, la fila de servicios.
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
                  <Icono size={22} weight="regular" />
                </span>
                {servicio.texto}
              </a>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
