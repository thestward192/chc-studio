import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Laptop } from '@phosphor-icons/react/dist/csr/Laptop';
import { ctaNav, enlacesNav, volverIntro } from '../../content/cabecera';
import { BotonPill } from './BotonPill';
import { Logo } from './Logo';
import { irASeccion } from './desplazamiento';
import { useSeccionActiva } from './useSeccionActiva';
import { useIndicadorNav } from './useIndicadorNav';
import { useEstadoNav } from './useEstadoNav';
import estilos from './Navbar.module.css';

interface Props {
  /** Si se pasa, muestra el botón "Intro" para volver a la laptop 3D. */
  onVolverIntro?: () => void;
}

/**
 * Navbar estilo iOS: cápsula de vidrio esmerilado fija arriba en toda la
 * página; se compacta al bajar y pasa a vidrio oscuro sobre zonas oscuras
 * (useEstadoNav). En escritorio,
 * logo a la izquierda, enlaces al centro y botón a la derecha; una píldora
 * clara se desliza hasta el enlace activo (o el que está bajo el mouse), como
 * un control segmentado. En tablet y móvil: logo + botón de menú que abre una
 * hoja de vidrio oscuro a todo el ancho.
 */
export function Navbar({ onVolverIntro }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [sobre, setSobre] = useState<string | null>(null);
  const activa = useSeccionActiva(enlacesNav.map((e) => e.id));
  const menuRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  useEstadoNav(navRef);
  const { listaRef, indicadorRef } = useIndicadorNav(sobre ?? activa);

  // Con el menú abierto: Esc lo cierra y al pasar a escritorio se cierra solo
  useEffect(() => {
    if (!abierto) return;
    const control = new AbortController();
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') {
          setAbierto(false);
          botonRef.current?.focus();
        }
      },
      { signal: control.signal },
    );
    window
      .matchMedia('(min-width: 1024px)')
      .addEventListener('change', (e) => e.matches && setAbierto(false), {
        signal: control.signal,
      });
    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    return () => control.abort();
  }, [abierto]);

  const alPulsarEnlace = (id: string) => (evento: MouseEvent<HTMLAnchorElement>) => {
    if (irASeccion(id)) evento.preventDefault();
    setAbierto(false);
  };

  const alVolverIntro = () => {
    setAbierto(false);
    onVolverIntro?.();
  };

  return (
    <nav ref={navRef} className={estilos.nav} aria-label="Navegación principal">
      <div className={estilos.zonaLogo}>
        <Logo />
        {onVolverIntro && (
          <button
            type="button"
            className={estilos.botonIntro}
            onClick={alVolverIntro}
            aria-label={volverIntro.descripcion}
            title={volverIntro.descripcion}
          >
            <Laptop size={18} weight="regular" aria-hidden="true" />
            <span className={estilos.textoIntro}>{volverIntro.etiqueta}</span>
          </button>
        )}
      </div>

      {/* Enlaces centrales (solo escritorio) */}
      <div className={estilos.centro}>
        <ul ref={listaRef} className={estilos.enlaces} onPointerLeave={() => setSobre(null)}>
          {enlacesNav.map((enlace) => (
            <li key={enlace.id}>
              <a
                href={`#${enlace.id}`}
                data-id={enlace.id}
                className={`${estilos.enlace} ${activa === enlace.id ? estilos.activo : ''}`}
                aria-current={activa === enlace.id ? 'location' : undefined}
                onClick={alPulsarEnlace(enlace.id)}
                onPointerEnter={() => setSobre(enlace.id)}
                onFocus={() => setSobre(enlace.id)}
                onBlur={() => setSobre(null)}
              >
                {enlace.etiqueta}
              </a>
            </li>
          ))}
        </ul>
        <span ref={indicadorRef} className={estilos.indicador} aria-hidden="true" />
      </div>

      <div className={estilos.zonaCta}>
        <BotonPill
          etiqueta={ctaNav.etiqueta}
          destino={ctaNav.destino}
          className={estilos.ctaEscritorio}
        />
        <button
          ref={botonRef}
          type="button"
          className={`${estilos.hamburguesa} ${abierto ? estilos.hamburguesaAbierta : ''}`}
          aria-expanded={abierto}
          aria-controls="menu-principal"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Menú de tablet y móvil */}
      <div
        ref={menuRef}
        id="menu-principal"
        className={`${estilos.menu} ${abierto ? estilos.menuAbierto : ''}`}
      >
        <ul className={estilos.menuEnlaces}>
          {enlacesNav.map((enlace) => (
            <li key={enlace.id}>
              <a
                href={`#${enlace.id}`}
                className={`${estilos.menuEnlace} ${activa === enlace.id ? estilos.activo : ''}`}
                aria-current={activa === enlace.id ? 'location' : undefined}
                onClick={alPulsarEnlace(enlace.id)}
              >
                {enlace.etiqueta}
              </a>
            </li>
          ))}
        </ul>
        <div className={estilos.menuAcciones}>
          <BotonPill
            etiqueta={ctaNav.etiqueta}
            destino={ctaNav.destino}
            tamano="grande"
            onNavegar={() => setAbierto(false)}
          />
          {onVolverIntro && (
            <button type="button" className={estilos.menuIntro} onClick={alVolverIntro}>
              <Laptop size={20} weight="regular" aria-hidden="true" />
              {volverIntro.descripcion}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
