import { useId } from 'react';

interface Props {
  /** Línea pequeña bajo el nombre (p. ej. "Taller 3D"). */
  sub?: string;
  /** Tamaño del nombre: 'normal' (HUD) o 'grande' (pantalla de carga). */
  tamano?: 'normal' | 'grande';
  /** Nivel de encabezado para el nombre (en la carga es el h1 de la página). */
  comoTitulo?: boolean;
}

/**
 * Logo del taller: la "C" de la tapa de la laptop (arco abierto con el
 * degradado de marca) + "CHC" en blanco y "STUDIO" con el degradado, igual
 * que el logo del header de Inicio.
 */
export function LogoEstudio({ sub, tamano = 'normal', comoTitulo = false }: Props) {
  const Nombre = comoTitulo ? 'h1' : 'p';
  const grande = tamano === 'grande';
  return (
    <div className="eui-logo">
      <span
        className="eui-logo__marca"
        style={grande ? { width: 52, height: 52, borderRadius: 16 } : undefined}
      >
        <MarcaC tamano={grande ? 30 : 22} />
      </span>
      <span className="eui-logo__texto">
        <Nombre className="eui-logo__nombre" style={grande ? { fontSize: '1.45rem' } : undefined}>
          CHC <span className="eui-logo__degradado">STUDIO</span>
        </Nombre>
        {sub && <span className="eui-logo__sub">{sub}</span>}
      </span>
    </div>
  );
}

/** "C" de marca: arco abierto a la derecha (misma abertura que el logo de la laptop). */
export function MarcaC({ tamano = 22 }: { tamano?: number }) {
  const id = useId();
  // Arco de radio 8 centrado en (12,12), abierto ±43° hacia la derecha
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent-green)" />
          <stop offset="1" stopColor="var(--accent-cyan)" />
        </linearGradient>
      </defs>
      <path
        d="M17.85 6.55 A8 8 0 1 0 17.85 17.45"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="3.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
