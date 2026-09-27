import './PantallaCarga.css';

interface Props {
  visible: boolean;
  etiqueta?: string;
}

/** Se muestra mientras el bundle de Three.js (import dinámico) se descarga. */
export function PantallaCarga({ visible, etiqueta = 'Cargando…' }: Props) {
  if (!visible) return null;
  return (
    <div className="pantalla-carga" role="status" aria-live="polite">
      <span className="pantalla-carga__giro" aria-hidden="true" />
      <span className="pantalla-carga__texto">{etiqueta}</span>
    </div>
  );
}
