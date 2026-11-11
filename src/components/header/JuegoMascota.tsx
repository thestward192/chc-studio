import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { Icon } from '@phosphor-icons/react';
import { SmileyAngry } from '@phosphor-icons/react/dist/csr/SmileyAngry';
import { PersonSimpleRun } from '@phosphor-icons/react/dist/csr/PersonSimpleRun';
import { Monitor } from '@phosphor-icons/react/dist/csr/Monitor';
import { MusicNotes } from '@phosphor-icons/react/dist/csr/MusicNotes';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { MoonStars } from '@phosphor-icons/react/dist/csr/MoonStars';
import { juegoMascota } from '../../content/mascota';
import { senalHero, type Truco } from '../three/hero/senalHero';
import estilos from './JuegoMascota.module.css';

const iconos: Record<Truco, Icon> = {
  enojarse: SmileyAngry,
  correr: PersonSimpleRun,
  chocar: Monitor,
  bailar: MusicNotes,
  voltereta: ArrowCounterClockwise,
  dormir: MoonStars,
};

const CLAVE_PISTA = 'chc-studio:pista-mascota';

/**
 * Juego con la mascota del hero. La escena 3D publica en `senalHero` dónde
 * se ve la mascota (centro y radio en px) y si está quieta en su sitio; aquí
 * se pone encima una zona para tocarla que la sigue. Al tocarla se abre un
 * menú de trucos repartido a sus dos lados (tres y tres, en arco), con el
 * mismo vidrio que el resto de la interfaz; elegir uno se lo pide a la
 * escena. Si se estampa contra la pantalla, el vidrio se raja y la tarjeta
 * tiembla. Sin escena 3D (móvil, movimiento reducido) no aparece nada.
 */
export function JuegoMascota({ seccionRef }: { seccionRef: RefObject<HTMLElement> }) {
  const raizRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [pista, setPista] = useState(false);
  const [grietas, setGrietas] = useState<Grieta[]>([]);
  const abiertoRef = useRef(abierto);
  abiertoRef.current = abierto;

  // Bucle por fotograma mientras el hero está a la vista: sigue a la
  // mascota, cierra el menú si se va (scroll) y detecta los golpes
  useEffect(() => {
    const raiz = raizRef.current;
    const seccion = seccionRef.current;
    if (!raiz || !seccion) return;
    let id = 0;
    let visible = false;
    let golpes = senalHero.golpes;
    let vistaDesde = 0;
    const cuadro = (ahora: number) => {
      id = requestAnimationFrame(cuadro);
      const p = senalHero.pantalla;
      const lista = !!p && senalHero.mascotaEnHero && senalHero.disponible;
      raiz.toggleAttribute('data-lista', lista && !senalHero.ocupada);
      if (p) {
        raiz.style.setProperty('--x', `${p.x}px`);
        raiz.style.setProperty('--y', `${p.y}px`);
        raiz.style.setProperty('--r', `${p.r}px`);
      }
      // El menú se ancla a su sitio en reposo: no baila con la flotación
      const casa = senalHero.casa;
      if (casa) {
        raiz.style.setProperty('--cx', `${Math.round(casa.x)}px`);
        raiz.style.setProperty('--cy', `${Math.round(casa.y)}px`);
        raiz.style.setProperty('--cr', `${Math.round(casa.r)}px`);
      }
      if (abiertoRef.current && !lista) setAbierto(false);
      // Durante un truco la mascota pasa delante del texto del hero
      const truco = senalHero.trucoActual;
      if (truco !== seccion.dataset.truco) {
        if (truco) seccion.dataset.truco = truco;
        else delete seccion.dataset.truco;
      }
      // La pista sale una vez por visita, tras un rato con la mascota lista
      if (lista && !vistaDesde) vistaDesde = ahora;
      if (vistaDesde && ahora - vistaDesde > 2500) {
        vistaDesde = -1;
        if (leerPista()) {
          setPista(true);
          window.setTimeout(() => setPista(false), 3800);
        }
      }
      if (senalHero.golpes !== golpes) {
        golpes = senalHero.golpes;
        if (p) golpear(p.x, p.y, p.r);
      }
    };
    const golpear = (x: number, y: number, r: number) => {
      const grieta = crearGrieta(x, y, Math.min(Math.max(r * 0.9, 140), 300));
      setGrietas((g) => [...g, grieta]);
      window.setTimeout(() => setGrietas((g) => g.filter((o) => o !== grieta)), 2400);
      seccion.removeAttribute('data-golpe');
      void seccion.offsetWidth; // reinicia la animación del temblor
      seccion.setAttribute('data-golpe', '');
      window.setTimeout(() => seccion.removeAttribute('data-golpe'), 600);
    };
    const observador = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(id);
      if (visible) id = requestAnimationFrame(cuadro);
    });
    observador.observe(seccion);
    return () => {
      observador.disconnect();
      cancelAnimationFrame(id);
    };
  }, [seccionRef]);

  // La escena sabe que el menú está abierto (vuelve a casa y mira curiosa)
  useEffect(() => {
    senalHero.menuAbierto = abierto;
    if (!abierto) return;
    marcarPista();
    setPista(false);
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    // Clic fuera cierra
    const control = new AbortController();
    document.addEventListener(
      'pointerdown',
      (e) => {
        const objetivo = e.target as Node;
        if (menuRef.current?.contains(objetivo) || botonRef.current?.contains(objetivo)) return;
        setAbierto(false);
      },
      { signal: control.signal },
    );
    return () => control.abort();
  }, [abierto]);

  useEffect(() => () => void (senalHero.menuAbierto = false), []);

  const elegir = (truco: Truco) => {
    senalHero.pedido = truco;
    setAbierto(false);
    botonRef.current?.focus({ preventScroll: true });
  };

  // Teclado: flechas entre opciones (arriba/abajo en su lado, izquierda/derecha
  // cambia de lado), Inicio/Fin, y Escape cierra
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const botones = [...(menuRef.current?.querySelectorAll('button') ?? [])];
    const i = botones.indexOf(document.activeElement as HTMLButtonElement);
    const mover = (n: number) => {
      e.preventDefault();
      botones[(n + botones.length) % botones.length]?.focus();
    };
    if (e.key === 'Escape') {
      e.preventDefault();
      setAbierto(false);
      botonRef.current?.focus({ preventScroll: true });
    } else if (e.key === 'ArrowDown') mover(i + 1);
    else if (e.key === 'ArrowUp') mover(i - 1);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') mover((i + 3) % 6);
    else if (e.key === 'Home') mover(0);
    else if (e.key === 'End') mover(botones.length - 1);
  };

  return createPortal(
    <>
      <div ref={raizRef} className={estilos.juego} data-abierto={abierto || undefined}>
        <button
          ref={botonRef}
          type="button"
          className={estilos.toque}
          aria-label={juegoMascota.etiquetaBoton}
          aria-haspopup="menu"
          aria-expanded={abierto}
          onClick={() => setAbierto((a) => !a && !senalHero.ocupada)}
        />
        <span className={estilos.pista} data-visible={pista || undefined} aria-hidden="true">
          {juegoMascota.pista}
        </span>

        {abierto && (
          <div
            ref={menuRef}
            className={estilos.menu}
            role="menu"
            aria-label={juegoMascota.etiquetaMenu}
            onKeyDown={alTeclear}
          >
            {juegoMascota.opciones.map((opcion, i) => {
              const Icono = iconos[opcion.id];
              const fila = (i % 3) - 1; // -1, 0, 1
              return (
                <button
                  key={opcion.id}
                  type="button"
                  role="menuitem"
                  className={estilos.opcion}
                  data-truco={opcion.id}
                  data-lado={opcion.lado}
                  style={
                    {
                      '--fila': fila,
                      '--lado': opcion.lado === 'izquierda' ? -1 : 1,
                      // En arco: la del medio sale un poco más
                      '--empuje': fila === 0 ? 1 : 0,
                      '--orden': i % 3,
                    } as CSSProperties
                  }
                  onClick={() => elegir(opcion.id)}
                >
                  <span className={estilos.icono} aria-hidden="true">
                    <Icono size={17} weight="fill" />
                  </span>
                  {opcion.etiqueta}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Vidrio rajado donde se estampó */}
      {grietas.map((g) => (
        <svg
          key={g.id}
          className={estilos.grieta}
          style={{ left: g.x - g.tam, top: g.y - g.tam, width: g.tam * 2, height: g.tam * 2 }}
          viewBox={`${-g.tam} ${-g.tam} ${g.tam * 2} ${g.tam * 2}`}
          aria-hidden="true"
        >
          <circle className={estilos.destello} r={g.tam * 0.55} />
          {g.trazos.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      ))}
    </>,
    document.body,
  );
}

interface Grieta {
  id: number;
  x: number;
  y: number;
  tam: number;
  trazos: string[];
}

let siguienteGrieta = 0;

/** Grieta al azar: rayos quebrados desde el impacto y dos anillos rotos. */
function crearGrieta(x: number, y: number, tam: number): Grieta {
  const trazos: string[] = [];
  const rayos = 11;
  for (let i = 0; i < rayos; i++) {
    const base = (i / rayos) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const largo = tam * (0.45 + Math.random() * 0.5);
    let d = `M${(Math.cos(base) * 6).toFixed(1)} ${(Math.sin(base) * 6).toFixed(1)}`;
    const tramos = 4;
    for (let k = 1; k <= tramos; k++) {
      const a = base + (Math.random() - 0.5) * 0.28;
      const r = (largo * k) / tramos;
      d += ` L${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
    }
    trazos.push(d);
  }
  for (const radio of [tam * 0.18, tam * 0.36]) {
    let a = Math.random() * Math.PI * 2;
    const fin = a + Math.PI * 2;
    // Anillo a trozos (con huecos) y un poco irregular
    while (a < fin) {
      const tramo = 0.35 + Math.random() * 0.5;
      const pasos = 4;
      let d = '';
      for (let k = 0; k <= pasos; k++) {
        const b = a + (tramo * k) / pasos;
        const r = radio * (0.92 + Math.random() * 0.16);
        d += `${k ? ' L' : 'M'}${(Math.cos(b) * r).toFixed(1)} ${(Math.sin(b) * r).toFixed(1)}`;
      }
      trazos.push(d);
      a += tramo + 0.15 + Math.random() * 0.3;
    }
  }
  return { id: siguienteGrieta++, x, y, tam, trazos };
}

function leerPista() {
  try {
    return sessionStorage.getItem(CLAVE_PISTA) !== '1';
  } catch {
    return true;
  }
}

function marcarPista() {
  try {
    sessionStorage.setItem(CLAVE_PISTA, '1');
  } catch {
    /* sin almacenamiento: la pista puede volver a salir */
  }
}
