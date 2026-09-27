import type { MouseEvent } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { irASeccion } from './desplazamiento';
import estilos from './BotonPill.module.css';

interface Props {
  etiqueta: string;
  /** id de la sección de destino (sin #). */
  destino: string;
  tamano?: 'normal' | 'grande';
  className?: string;
  onNavegar?: () => void;
  /** Avisa cuando el botón está señalado o enfocado (lo usa el Núcleo 3D del hero). */
  onActivo?: (activo: boolean) => void;
}

/** Botón píldora con el degradado de marca y una flecha en un círculo. */
export function BotonPill({
  etiqueta,
  destino,
  tamano = 'normal',
  className = '',
  onNavegar,
  onActivo,
}: Props) {
  const alPulsar = (evento: MouseEvent<HTMLAnchorElement>) => {
    if (irASeccion(destino)) evento.preventDefault();
    onNavegar?.();
  };

  return (
    <a
      href={`#${destino}`}
      onClick={alPulsar}
      onPointerEnter={onActivo && (() => onActivo(true))}
      onPointerLeave={onActivo && (() => onActivo(false))}
      onFocus={onActivo && (() => onActivo(true))}
      onBlur={onActivo && (() => onActivo(false))}
      className={`${estilos.boton} ${tamano === 'grande' ? estilos.grande : ''} ${className}`}
    >
      <span>{etiqueta}</span>
      <span className={estilos.circulo} aria-hidden="true">
        <ArrowRight className={estilos.flecha} size={tamano === 'grande' ? 17 : 15} weight="bold" />
      </span>
    </a>
  );
}
