import { useEffect, useRef, useState } from 'react';
import { animate, cubicBezier } from 'animejs';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { puente } from '../../three/estudio/puente';

const ENTRADA = cubicBezier(0.2, 1.2, 0.4, 1);

/**
 * Panel de información del objeto enfocado: a la derecha (380 px, o 640 px
 * si es ancho); en móvil, hoja inferior que se desliza para cerrar.
 * Etiqueta, título, vista previa en canvas en vivo, texto que se actualiza
 * cada 0,5 s y botones cuyo texto cambia con el estado.
 */
export function PanelInfo() {
  const seleccionado = useEstudio((s) => s.seleccionado);
  const interactivo = puente.obtener(seleccionado);
  const [, setTic] = useState(0);
  const raiz = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const arrastre = useRef<{ y: number; dy: number } | null>(null);

  // Texto y botones se reevalúan cada 0,5 s
  useEffect(() => {
    if (!seleccionado) return;
    const id = window.setInterval(() => setTic((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, [seleccionado]);

  // Entrada desde la derecha (o desde abajo en móvil)
  useEffect(() => {
    if (!seleccionado || !raiz.current) return;
    const movil = window.matchMedia('(max-width: 700px)').matches;
    const anim = animate(raiz.current, {
      ...(movil ? { translateY: ['100%', '0%'] } : { translateX: ['110%', '0%'] }),
      opacity: [0, 1],
      duration: 650,
      ease: ENTRADA,
    });
    return () => {
      anim.pause();
    };
  }, [seleccionado]);

  // Vista previa en vivo
  useEffect(() => {
    const canvas = lienzo.current;
    const dibujar = interactivo?.preview;
    if (!canvas || !dibujar) return;
    const ctx = canvas.getContext('2d')!;
    let id = 0;
    const inicio = performance.now();
    const cuadro = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      dibujar(ctx, (performance.now() - inicio) / 1000, w, h);
      id = requestAnimationFrame(cuadro);
    };
    id = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(id);
  }, [interactivo]);

  if (!interactivo) return null;

  const info = typeof interactivo.info === 'function' ? interactivo.info() : interactivo.info;

  // Hoja inferior: arrastrar hacia abajo para cerrar
  const alBajar = (ev: React.PointerEvent) => {
    arrastre.current = { y: ev.clientY, dy: 0 };
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
  };
  const alMover = (ev: React.PointerEvent) => {
    if (!arrastre.current || !raiz.current) return;
    arrastre.current.dy = Math.max(0, ev.clientY - arrastre.current.y);
    raiz.current.style.transform = `translateY(${arrastre.current.dy}px)`;
  };
  const alSoltar = () => {
    const a = arrastre.current;
    arrastre.current = null;
    if (!a || !raiz.current) return;
    if (a.dy > 90) {
      puente.cerrarPanel();
    } else {
      animate(raiz.current, { translateY: [a.dy, 0], duration: 250, ease: 'outCubic' });
    }
  };

  return (
    <aside
      ref={raiz}
      key={interactivo.id}
      className={`eui eui-panel eui-cristal${interactivo.ancho ? ' eui-panel--ancho' : ''}`}
      aria-label={interactivo.nombre}
    >
      <div
        className="eui-panel__asa"
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        aria-hidden="true"
      />
      <button
        type="button"
        className="eui-boton-redondo eui-panel__cerrar"
        onClick={() => puente.cerrarPanel()}
        aria-label="Cerrar panel"
      >
        <X size={18} weight="bold" aria-hidden="true" />
      </button>
      <div className="eui-panel__cuerpo">
        <p className="eui-etiqueta">{interactivo.etiqueta}</p>
        <h2 className="eui-panel__titulo">
          {interactivo.nombre.replace('Texto de marcador: ', '')}
        </h2>
        {interactivo.preview && (
          <canvas ref={lienzo} className="eui-panel__preview" aria-hidden="true" />
        )}
        <p className="eui-panel__info" aria-live="polite">
          {info}
        </p>
      </div>
      {interactivo.acciones.length > 0 && (
        <div className="eui-panel__acciones">
          {interactivo.acciones.map((accion, i) => (
            <button
              key={i}
              type="button"
              className={`eui-boton${i === 0 ? ' eui-boton--primario' : ''}`}
              onClick={() => {
                accion.run();
                setTic((t) => t + 1);
              }}
            >
              {accion.label()}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
