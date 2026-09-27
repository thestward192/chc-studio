import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { equipo } from '../../../content/equipo';
import { useEstudio } from '../../three/estudio/estadoEstudio';

/**
 * Al pulsar "Entrar" en una puerta: mientras la puerta se abre y la cámara
 * avanza, la luz de la habitación (color del integrante) inunda la
 * pantalla; luego se navega con el fundido de TransicionPagina.
 */
export function InundacionLuz({ onNavegar }: { onNavegar: (href: string) => void }) {
  const puerta = useEstudio((s) => s.puertaEntrando);
  const capa = useRef<HTMLDivElement>(null);
  const integrante = equipo.find((i) => `puerta-${i.id}` === puerta);

  useEffect(() => {
    if (!integrante || !capa.current) return;
    const anim = animate(capa.current, {
      opacity: [0, 1],
      delay: 700,
      duration: 800,
      ease: 'inQuad',
      onComplete: () => onNavegar(integrante.href),
    });
    return () => {
      anim.pause();
    };
  }, [integrante, onNavegar]);

  if (!integrante) return null;
  return (
    <div
      ref={capa}
      className="eui-inundacion"
      style={{
        background: `radial-gradient(circle at 50% 55%, ${integrante.colorLuz}, color-mix(in srgb, ${integrante.colorLuz} 55%, var(--color-transicion)) 70%)`,
      }}
      aria-hidden="true"
    />
  );
}
