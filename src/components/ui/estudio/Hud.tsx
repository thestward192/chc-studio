import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { puente } from '../../three/estudio/puente';
import { abrirMenu, alternarNoche, alternarPausa, alternarSonido, irAVistaGeneral } from './acciones';

interface Props {
  onVolverInicio: () => void;
}

/**
 * HUD: tarjeta de título (arriba a la izquierda), botones de control
 * (arriba a la derecha; en móvil, abajo y solo con icono), "Versión
 * simple" y "Volver al inicio", y la pista de controles.
 */
export function Hud({ onVolverInicio }: Props) {
  const fase = useEstudio((s) => s.fase);
  const noche = useEstudio((s) => s.noche);
  const sonido = useEstudio((s) => s.sonido);
  const pausa = useEstudio((s) => s.pausa);
  const raiz = useRef<HTMLDivElement>(null);
  const visible = fase === 'entrando' || fase === 'explorando';

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
        <span className="eui-titulo__punto" aria-hidden="true" />
        <div>
          <p className="eui-titulo__nombre">Estudio ChcStudio</p>
          <p className="eui-titulo__sub eui-mono">~/estudio · 5 proyectos · 4 puertas</p>
        </div>
      </div>

      <nav className="eui-botones" aria-label="Controles del estudio">
        <BotonHud icono="🏠" texto="Vista general" atajo="H" onClick={irAVistaGeneral} />
        <BotonHud icono={noche ? '☀️' : '🌙'} texto={noche ? 'Día' : 'Noche'} atajo="N" onClick={alternarNoche} />
        <BotonHud
          icono={sonido ? '🔊' : '🔇'}
          texto={sonido ? 'Sonido' : 'Sin sonido'}
          atajo="M"
          pulsado={sonido}
          onClick={alternarSonido}
        />
        <BotonHud icono={pausa ? '▶️' : '⏸️'} texto={pausa ? 'Seguir' : 'Pausa'} pulsado={pausa} onClick={alternarPausa} />
        <BotonHud icono="☰" texto="Menú" onClick={() => abrirMenu(true)} />
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
            📄
          </span>
          <span className="eui-boton__texto">Versión simple</span>
        </button>
        <button type="button" className="eui-boton" data-hud onClick={onVolverInicio} aria-label="Volver al inicio">
          <span className="eui-boton__icono" aria-hidden="true">
            ←
          </span>
          <span className="eui-boton__texto">Volver al inicio</span>
        </button>
      </div>

      {pausa && <p className="eui-pausado eui-cristal eui-mono">⏸ Escena en pausa</p>}

      <p className="eui-pista eui-cristal" data-hud>
        Arrastra para orbitar · Rueda para acercar · Clic para inspeccionar · <kbd>N</kbd> <kbd>H</kbd>{' '}
        <kbd>M</kbd> <kbd>Esc</kbd>
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
  icono: string;
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
          <span className="eui-tooltip__etiqueta">{interactivo.etiqueta}</span>
          <span className="eui-tooltip__nombre">{interactivo.nombre}</span>
        </>
      )}
    </div>
  );
}
