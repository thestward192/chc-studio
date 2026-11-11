import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { animate } from 'animejs';
import type { Icon } from '@phosphor-icons/react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { HandGrabbing } from '@phosphor-icons/react/dist/csr/HandGrabbing';
import { MouseScroll } from '@phosphor-icons/react/dist/csr/MouseScroll';
import { HandTap } from '@phosphor-icons/react/dist/csr/HandTap';
import { hero } from '../../../content/cabecera';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { entrarAlEstudio } from './acciones';
import { LogoEstudio } from './LogoEstudio';
import { textosSala } from './textosSala';

const ICONOS_CONSEJOS: Icon[] = [HandGrabbing, MouseScroll, HandTap];

/**
 * Pantalla de carga del taller y de las oficinas, con el lenguaje de iOS:
 * la mascota camina hacia la sala sobre un suelo que avanza (como una
 * cinta), con el título de la sala, un mensaje que cambia, la barra de
 * progreso real (ver PreparacionCarga) y consejos para moverse. Todo se
 * tiñe con la luz de la sala (`textosSala.colorCarga`). Cuando la escena
 * está lista, la mascota se para, salta contenta y aparece "Entrar"; al
 * entrar se funde mientras la mascota salta hacia la sala.
 */
export function CargaEstudio({ movimientoReducido }: { movimientoReducido: boolean }) {
  const fase = useEstudio((s) => s.fase);
  const progreso = useEstudio((s) => s.progresoCarga);
  const paso = useEstudio((s) => s.pasoCarga);
  const [mensaje, setMensaje] = useState(0);
  const [visible, setVisible] = useState(true);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Mensajes rotando (cada uno entra con un fundido)
  useEffect(() => {
    if (fase !== 'cargando') return;
    const id = window.setInterval(
      () => setMensaje((m) => (m + 1) % textosSala.mensajesCarga.length),
      1400,
    );
    return () => window.clearInterval(id);
  }, [fase]);

  // El botón aparece cuando la escena está lista
  useEffect(() => {
    if (fase !== 'listo' || !boton.current) return;
    boton.current.focus({ preventScroll: true });
    if (movimientoReducido) return;
    animate(boton.current, {
      opacity: [0, 1],
      translateY: [12, 0],
      scale: [0.94, 1],
      duration: 600,
      ease: 'outBack',
    });
  }, [fase, movimientoReducido]);

  // Al entrar: fundido y desmontaje
  useEffect(() => {
    if (fase !== 'entrando' && fase !== 'explorando') return;
    if (!raiz.current) return;
    const anim = animate(raiz.current, {
      opacity: [1, 0],
      duration: movimientoReducido ? 150 : 800,
      delay: movimientoReducido ? 0 : 150,
      ease: 'outQuad',
      onComplete: () => setVisible(false),
    });
    return () => {
      anim.pause();
    };
  }, [fase, movimientoReducido]);

  if (!visible) return null;
  const listo = fase !== 'cargando';
  const entrando = fase === 'entrando' || fase === 'explorando';
  const porcentaje = Math.round(progreso * 100);

  return (
    <div
      ref={raiz}
      className="eui eui-carga"
      data-fase={listo ? (entrando ? 'entrando' : 'listo') : 'cargando'}
      role="dialog"
      aria-modal="true"
      aria-label={textosSala.etiquetaCarga}
      style={{ '--carga-color': textosSala.colorCarga } as CSSProperties}
    >
      <span className="eui-carga__suelo" aria-hidden="true" />

      <div className="eui-carga__logo">
        <LogoEstudio sub={textosSala.subCarga} />
      </div>

      <div className="eui-carga__centro">
        {/* La mascota caminando hacia la sala */}
        <div className="eui-carga__escena" aria-hidden="true">
          <span className="eui-carga__halo" />
          <span className="eui-carga__sombra" />
          <span className="eui-carga__cuerpo">
            <img
              className="eui-carga__mascota"
              src={hero.poster}
              alt=""
              width={1306}
              height={1306}
              decoding="async"
            />
          </span>
        </div>

        <h1 className="eui-carga__titulo">{textosSala.tituloCarga}</h1>
        <p className="eui-carga__mensaje" aria-live="polite">
          <span key={listo ? 'listo' : mensaje}>
            {listo ? textosSala.listo : textosSala.mensajesCarga[mensaje]}
          </span>
        </p>

        <div className="eui-carga__progreso">
          <div
            className="eui-carga__barra"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentaje}
            aria-valuetext={paso}
          >
            <div className="eui-carga__relleno" style={{ transform: `scaleX(${progreso})` }} />
          </div>
          <p className="eui-carga__porcentaje">
            <span>{paso}</span>
            <span>{porcentaje}%</span>
          </p>
        </div>

        <button
          ref={boton}
          type="button"
          className="eui-boton eui-boton--primario eui-carga__entrar"
          disabled={fase !== 'listo'}
          onClick={entrarAlEstudio}
        >
          {textosSala.entrar}
          <span className="eui-boton__flecha" aria-hidden="true">
            <ArrowRight size={15} weight="bold" />
          </span>
        </button>
      </div>

      <ul className="eui-carga__consejos" aria-label="Cómo moverse">
        {textosSala.consejos.map((consejo, i) => {
          const Icono = ICONOS_CONSEJOS[i % ICONOS_CONSEJOS.length];
          return (
            <li key={consejo} style={{ '--i': i } as CSSProperties}>
              <Icono size={16} weight="bold" aria-hidden="true" />
              {consejo}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
