import { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs';
import { GearSix } from '@phosphor-icons/react/dist/csr/GearSix';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { entrarAlEstudio } from './acciones';
import { LogoEstudio } from './LogoEstudio';

const MENSAJES = [
  'Compilando shaders…',
  'Sirviendo café…',
  'Despertando al servidor…',
  'Ordenando la estantería…',
  'Encendiendo el neón…',
  'Regando las plantas…',
];

/**
 * Pantalla de carga temática: una terminal y unas llaves { } que se
 * dibujan con stroke-dashoffset, engranajes girando, mensajes que cambian
 * cada 0,9 s, barra de progreso real (ver PreparacionCarga) y botón
 * "Entrar". Al entrar se funde y la cámara vuela a la vista general.
 */
export function CargaEstudio({ movimientoReducido }: { movimientoReducido: boolean }) {
  const fase = useEstudio((s) => s.fase);
  const progreso = useEstudio((s) => s.progresoCarga);
  const paso = useEstudio((s) => s.pasoCarga);
  const [mensaje, setMensaje] = useState(0);
  const [visible, setVisible] = useState(true);
  const raiz = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const engranajes = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Mensajes rotando
  useEffect(() => {
    if (fase !== 'cargando') return;
    const id = window.setInterval(() => setMensaje((m) => (m + 1) % MENSAJES.length), 900);
    return () => window.clearInterval(id);
  }, [fase]);

  // Trazos que se dibujan y engranajes que giran (Anime.js)
  useEffect(() => {
    if (movimientoReducido || !svg.current || !engranajes.current) return;
    const trazos = svg.current.querySelectorAll('path, rect, polyline');
    const dibujo = animate(trazos, {
      strokeDashoffset: [1, 0],
      duration: 1400,
      delay: stagger(160),
      ease: 'inOutSine',
      loop: true,
      alternate: true,
    });
    const [grande, chico] = Array.from(engranajes.current.children);
    const giro = animate(grande, { rotate: 360, duration: 3200, ease: 'linear', loop: true });
    const giroInverso = animate(chico, {
      rotate: -360,
      duration: 2100,
      ease: 'linear',
      loop: true,
    });
    return () => {
      dibujo.pause();
      giro.pause();
      giroInverso.pause();
    };
  }, [movimientoReducido]);

  // El botón aparece cuando la escena está lista
  useEffect(() => {
    if (fase !== 'listo' || !boton.current) return;
    boton.current.focus();
    animate(boton.current, { opacity: [0, 1], scale: [0.92, 1], duration: 500, ease: 'outBack' });
  }, [fase]);

  // Al entrar: fundido y desmontaje
  useEffect(() => {
    if (fase !== 'entrando' && fase !== 'explorando') return;
    if (!raiz.current) return;
    const anim = animate(raiz.current, {
      opacity: [1, 0],
      duration: movimientoReducido ? 150 : 700,
      ease: 'outQuad',
      onComplete: () => setVisible(false),
    });
    return () => {
      anim.pause();
    };
  }, [fase, movimientoReducido]);

  if (!visible) return null;
  const listo = fase !== 'cargando';
  const porcentaje = Math.round(progreso * 100);

  return (
    <div
      ref={raiz}
      className="eui eui-carga"
      role="dialog"
      aria-modal="true"
      aria-label="Cargando el estudio"
    >
      <svg className="eui-carga__anillos" viewBox="0 0 400 400" aria-hidden="true">
        {[190, 150, 112, 78].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} />
        ))}
      </svg>
      <div className="eui-carga__caja eui-cristal">
        <div className="eui-carga__ilustracion" aria-hidden="true">
          <svg ref={svg} className="eui-carga__svg" viewBox="0 0 220 150">
            {/* Terminal */}
            <rect
              className="eui-carga__trazo"
              x="8"
              y="10"
              width="170"
              height="115"
              rx="12"
              pathLength={1}
              strokeDasharray="1"
            />
            <path className="eui-carga__trazo" d="M8 34 H178" pathLength={1} strokeDasharray="1" />
            <polyline
              className="eui-carga__trazo eui-carga__trazo--destacado"
              points="30,60 48,74 30,88"
              pathLength={1}
              strokeDasharray="1"
            />
            <path className="eui-carga__trazo" d="M58 90 H96" pathLength={1} strokeDasharray="1" />
            {/* Llaves { } */}
            <path
              className="eui-carga__trazo"
              d="M126 52 q-10 0 -10 10 v6 q0 6 -7 6 q7 0 7 6 v6 q0 10 10 10"
              pathLength={1}
              strokeDasharray="1"
            />
            <path
              className="eui-carga__trazo"
              d="M146 52 q10 0 10 10 v6 q0 6 7 6 q-7 0 -7 6 v6 q0 10 -10 10"
              pathLength={1}
              strokeDasharray="1"
            />
          </svg>
          <div ref={engranajes}>
            <span className="eui-carga__engranaje eui-carga__engranaje--a">
              <GearSix size={34} weight="regular" />
            </span>
            <span className="eui-carga__engranaje eui-carga__engranaje--b">
              <GearSix size={22} weight="regular" />
            </span>
          </div>
        </div>

        <div className="eui-carga__titulo">
          <LogoEstudio tamano="grande" sub="Taller 3D" comoTitulo />
        </div>
        <p className="eui-carga__mensaje eui-mono" aria-live="polite">
          {listo ? 'Todo listo. Pasá, estás en tu casa.' : MENSAJES[mensaje]}
        </p>
        <div
          className="eui-carga__barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={porcentaje}
          aria-valuetext={paso}
        >
          <div className="eui-carga__relleno" style={{ width: `${porcentaje}%` }} />
        </div>
        <p className="eui-carga__porcentaje eui-mono">
          {porcentaje}% · {paso}
        </p>
        <button
          ref={boton}
          type="button"
          className="eui-boton eui-boton--primario"
          disabled={fase !== 'listo'}
          onClick={entrarAlEstudio}
          style={{ opacity: listo ? 1 : 0.45 }}
        >
          Entrar al taller
          <span className="eui-boton__flecha" aria-hidden="true">
            <ArrowRight size={15} weight="bold" />
          </span>
        </button>
      </div>
    </div>
  );
}
