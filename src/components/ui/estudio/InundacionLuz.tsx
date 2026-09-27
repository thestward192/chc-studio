import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { useEstudio } from '../../three/estudio/estadoEstudio';
import { destinosPuerta } from '../../three/estudio/navegacion';

/**
 * Al pulsar "Entrar" en una puerta: mientras la puerta se abre y la cámara
 * avanza, la luz del otro lado (color de la puerta) inunda la pantalla;
 * luego se navega con el fundido de TransicionPagina. Sirve para las
 * puertas del taller y para la de salida de cada oficina.
 */
export function InundacionLuz({ onNavegar }: { onNavegar: (href: string) => void }) {
  const puerta = useEstudio((s) => s.puertaEntrando);
  const capa = useRef<HTMLDivElement>(null);
  const destino = puerta ? destinosPuerta.get(puerta) : undefined;

  useEffect(() => {
    if (!destino || !capa.current) return;
    const anim = animate(capa.current, {
      opacity: [0, 1],
      delay: 700,
      duration: 800,
      ease: 'inQuad',
      onComplete: () => onNavegar(destino.href),
    });
    return () => {
      anim.pause();
    };
  }, [destino, onNavegar]);

  if (!destino) return null;
  return (
    <div
      ref={capa}
      className="eui-inundacion"
      style={{
        background: `radial-gradient(circle at 50% 55%, ${destino.color}, color-mix(in srgb, ${destino.color} 55%, var(--color-transicion)) 70%)`,
      }}
      aria-hidden="true"
    />
  );
}
