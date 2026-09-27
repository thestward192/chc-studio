import { useEffect, useRef, type ReactNode } from 'react';
import { animate, stagger } from 'animejs';
import { House } from '@phosphor-icons/react/dist/csr/House';
import { Sun } from '@phosphor-icons/react/dist/csr/Sun';
import { Moon } from '@phosphor-icons/react/dist/csr/Moon';
import { SpeakerHigh } from '@phosphor-icons/react/dist/csr/SpeakerHigh';
import { SpeakerSlash } from '@phosphor-icons/react/dist/csr/SpeakerSlash';
import { Pause } from '@phosphor-icons/react/dist/csr/Pause';
import { Play } from '@phosphor-icons/react/dist/csr/Play';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { FileText } from '@phosphor-icons/react/dist/csr/FileText';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { puente } from '../../three/estudio/puente';
import {
  abrirMenu,
  alternarNoche,
  alternarPausa,
  alternarSonido,
  irAVistaGeneral,
} from './acciones';
import { LogoEstudio } from './LogoEstudio';

interface Props {
  onVolverInicio: () => void;
}

const ICONO = { size: 18, weight: 'regular' } as const;

/**
 * HUD: logo (arriba a la izquierda), botones de control (arriba a la
 * derecha; en móvil, abajo y solo con icono), "Versión simple" y "Volver al
 * inicio", y la pista de controles.
 */
export function Hud({ onVolverInicio }: Props) {
  const fase = useEstudio((s) => s.fase);
  const noche = useEstudio((s) => s.noche);
  const sonido = useEstudio((s) => s.sonido);
  const pausa = useEstudio((s) => s.pausa);
  const raiz = useRef<HTMLDivElement>(null);
  const visible = fase === 'entrando' || fase === 'explorando';
  const proyectos = puente.listar('proyecto').length;
  const puertas = puente.listar('puerta').length;

  // Entrada escalonada de los elementos del HUD
  useEffect(() => {
    if (!visible || !raiz.current) return;
    const anim = animate(raiz.current.querySelectorAll('[data-hud]'), {
      opacity: [0, 1],
      translateY: [-8, 0],
      delay: stagger(60, { start: 900 }),
      duration: 500,
      ease: 'outCubic',
    });
    return () => {
      anim.pause();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={raiz} className="eui">
      <div className="eui-titulo eui-cristal" data-hud>
        <LogoEstudio sub={`Taller 3D: ${proyectos} proyectos y ${puertas} puertas`} />
      </div>

      <nav className="eui-botones" aria-label="Controles del estudio">
        <BotonHud
          icono={<House {...ICONO} />}
          texto="Vista general"
          atajo="H"
          onClick={irAVistaGeneral}
        />
        <BotonHud
          icono={noche ? <Sun {...ICONO} /> : <Moon {...ICONO} />}
          texto={noche ? 'Día' : 'Noche'}
          atajo="N"
          onClick={alternarNoche}
        />
        <BotonHud
          icono={sonido ? <SpeakerHigh {...ICONO} /> : <SpeakerSlash {...ICONO} />}
          texto={sonido ? 'Sonido' : 'Sin sonido'}
          atajo="M"
          pulsado={sonido}
          onClick={alternarSonido}
        />
        <BotonHud
          icono={pausa ? <Play {...ICONO} /> : <Pause {...ICONO} />}
          texto={pausa ? 'Seguir' : 'Pausa'}
          pulsado={pausa}
          onClick={alternarPausa}
        />
        <BotonHud
          icono={<List {...ICONO} />}
          texto="Menú"
          atajo="Esc"
          onClick={() => abrirMenu(true)}
        />
      </nav>

      <div className="eui-secundarios">
        <button
          type="button"
          className="eui-boton"
          data-hud
          onClick={() => useEstudio.getState().set({ versionSimple: true })}
          aria-label="Versión simple"
        >
          <span className="eui-boton__icono" aria-hidden="true">
            <FileText {...ICONO} />
          </span>
          <span className="eui-boton__texto">Versión simple</span>
        </button>
        <button
          type="button"
          className="eui-boton"
          data-hud
          onClick={onVolverInicio}
          aria-label="Volver al inicio"
        >
          <span className="eui-boton__icono" aria-hidden="true">
            <ArrowLeft {...ICONO} />
          </span>
          <span className="eui-boton__texto">Volver al inicio</span>
        </button>
      </div>

      {pausa && (
        <p className="eui-pausado eui-cristal">
          <Pause size={14} weight="bold" aria-hidden="true" />
          Escena en pausa
        </p>
      )}

      <p className="eui-pista eui-cristal" data-hud>
        <span>Arrastrá para orbitar, rueda para acercar, clic para inspeccionar</span>
        <span className="eui-pista__atajos" aria-label="Atajos de teclado">
          <kbd title="Noche / día">N</kbd>
          <kbd title="Vista general">H</kbd>
          <kbd title="Sonido">M</kbd>
          <kbd title="Menú">Esc</kbd>
        </span>
      </p>

      <Tooltip />
    </div>
  );
}

function BotonHud({
  icono,
  texto,
  atajo,
  pulsado,
  onClick,
}: {
  icono: ReactNode;
  texto: string;
  atajo?: string;
  pulsado?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="eui-boton"
      data-hud
      onClick={onClick}
      aria-pressed={pulsado}
      aria-label={texto}
      title={atajo ? `${texto} (${atajo})` : texto}
    >
      <span className="eui-boton__icono" aria-hidden="true">
        {icono}
      </span>
      <span className="eui-boton__texto">{texto}</span>
    </button>
  );
}

/** Etiqueta que sigue al ratón con el objeto bajo el puntero. */
function Tooltip() {
  const hover = useEstudio((s) => s.hover);
  const caja = useRef<HTMLDivElement>(null);
  const interactivo = puente.obtener(hover);

  useEffect(() => {
    const control = new AbortController();
    window.addEventListener(
      'pointermove',
      (ev) => {
        if (caja.current) caja.current.style.left = `${ev.clientX}px`;
        if (caja.current) caja.current.style.top = `${ev.clientY}px`;
      },
      { signal: control.signal, passive: true },
    );
    return () => control.abort();
  }, []);

  return (
    <div
      ref={caja}
      className="eui-tooltip eui-cristal"
      style={{ visibility: interactivo ? 'visible' : 'hidden' }}
      aria-hidden="true"
    >
      {interactivo && (
        <>
          <span className="eui-etiqueta eui-tooltip__etiqueta">{interactivo.etiqueta}</span>
          <span className="eui-tooltip__nombre">
            {interactivo.nombre.replace('Texto de marcador: ', '')}
          </span>
        </>
      )}
    </div>
  );
}
