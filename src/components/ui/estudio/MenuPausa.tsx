import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { useEstudio, type NivelCalidad } from '../../three/estudio/estadoEstudio';
import { puente } from '../../three/estudio/puente';
import { abrirMenu, alternarNoche, alternarSonido } from './acciones';

const NIVELES: { valor: NivelCalidad | null; texto: string }[] = [
  { valor: null, texto: 'Automático' },
  { valor: 'alto', texto: 'Alto' },
  { valor: 'medio', texto: 'Medio' },
  { valor: 'bajo', texto: 'Bajo' },
];

/**
 * Menú de pausa: centrado sobre la escena desenfocada. Lleva directo a
 * cualquier proyecto o puerta, muestra el nivel de calidad actual (y los
 * FPS medidos) y permite fijarlo a mano.
 */
export function MenuPausa() {
  const menu = useEstudio((s) => s.menu);
  const calidad = useEstudio((s) => s.calidad);
  const forzada = useEstudio((s) => s.calidadForzada);
  const fps = useEstudio((s) => s.fps);
  const noche = useEstudio((s) => s.noche);
  const sonido = useEstudio((s) => s.sonido);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu || !caja.current) return;
    caja.current.querySelector<HTMLButtonElement>('button')?.focus();
    const anim = animate(caja.current, { opacity: [0, 1], scale: [0.96, 1], duration: 320, ease: 'outCubic' });
    return () => {
      anim.pause();
    };
  }, [menu]);

  if (!menu) return null;

  const ir = (id: string) => {
    abrirMenu(false);
    puente.seleccionar(id);
  };

  return (
    <div className="eui eui-velo" onClick={(ev) => ev.target === ev.currentTarget && abrirMenu(false)}>
      <div ref={caja} className="eui-menu eui-cristal" role="dialog" aria-modal="true" aria-label="Menú de pausa">
        <div className="eui-menu__cabecera">
          <h2 className="eui-menu__titulo">Pausa</h2>
          <button type="button" className="eui-boton eui-boton--primario" onClick={() => abrirMenu(false)}>
            Continuar
          </button>
        </div>

        <p className="eui-menu__seccion">Proyectos</p>
        <div className="eui-menu__rejilla">
          {puente.listar('proyecto').map((item) => (
            <button key={item.id} type="button" className="eui-boton" onClick={() => ir(item.id)}>
              🖼️ {item.nombre.replace('Texto de marcador: ', '')}
            </button>
          ))}
        </div>

        <p className="eui-menu__seccion">Puertas del equipo</p>
        <div className="eui-menu__rejilla">
          {puente.listar('puerta').map((item) => (
            <button key={item.id} type="button" className="eui-boton" onClick={() => ir(item.id)}>
              🚪 {item.nombre.replace('Texto de marcador: ', '')}
            </button>
          ))}
        </div>

        <p className="eui-menu__seccion">Objetos</p>
        <div className="eui-menu__rejilla">
          {puente.listar('objeto').map((item) => (
            <button key={item.id} type="button" className="eui-boton" onClick={() => ir(item.id)}>
              {item.nombre}
            </button>
          ))}
        </div>

        <p className="eui-menu__seccion">Ambiente</p>
        <div className="eui-menu__fila">
          <button type="button" className="eui-boton" onClick={alternarNoche}>
            {noche ? '☀️ Día' : '🌙 Noche'}
          </button>
          <button type="button" className="eui-boton" aria-pressed={sonido} onClick={alternarSonido}>
            {sonido ? '🔊 Sonido activado' : '🔇 Sonido apagado'}
          </button>
        </div>

        <p className="eui-menu__seccion">Calidad gráfica</p>
        <div className="eui-menu__fila">
          {NIVELES.map((nivel) => (
            <button
              key={nivel.texto}
              type="button"
              className="eui-boton"
              aria-pressed={forzada === nivel.valor}
              onClick={() => useEstudio.getState().set({ calidadForzada: nivel.valor })}
            >
              {nivel.texto}
            </button>
          ))}
          <span className="eui-menu__dato eui-mono">
            Nivel actual: {forzada ?? calidad}
            {forzada ? ' (fijado)' : ' (automático)'} · {fps} FPS
          </span>
        </div>
      </div>
    </div>
  );
}
