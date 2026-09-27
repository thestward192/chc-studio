import { Component, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';

interface Props {
  /** Ruta a un .glb en public/models/. */
  url: string;
  /** Qué mostrar mientras no exista un modelo real (geometría simple). */
  fallback: ReactNode;
  escala?: number;
}

/**
 * Punto único de carga de modelos glTF reales. drei ya configura los
 * decodificadores Draco y de texturas KTX2 automáticamente al usar
 * useGLTF con las rutas por defecto (CDN de Google para Draco/Meshopt).
 *
 * Mientras `public/models/` solo tenga archivos de marcador, cada sala usa
 * geometría simple o procedural. Cuando llegue un .glb real, basta
 * envolver la geometría así (o usar <ConModelo url=…> más abajo):
 *
 *   <ModeloGLTF url="/models/objeto.glb" fallback={<GeometriaSimple />} />
 */
function ModeloReal({ url, escala = 1 }: { url: string; escala?: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} scale={escala} />;
}

/** Si el .glb no existe o falla, se queda con la geometría de respaldo. */
class RespaldoSiFalla extends Component<{ respaldo: ReactNode; children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}

export function ModeloGLTF({ url, fallback, escala }: Props) {
  return (
    <RespaldoSiFalla respaldo={fallback}>
      <Suspense fallback={fallback}>
        <ModeloReal url={url} escala={escala} />
      </Suspense>
    </RespaldoSiFalla>
  );
}

/**
 * Envoltorio para los objetos procedurales del estudio: si se indica `url`,
 * carga ese .glb (y mientras carga, o si falla, muestra la geometría
 * procedural); si no, muestra solo la geometría procedural. Así cambiar un
 * objeto por su modelo real es añadir una prop, sin tocar nada más.
 */
export function ConModelo({
  url,
  escala,
  children,
}: {
  url?: string;
  escala?: number;
  children: ReactNode;
}) {
  if (!url) return <>{children}</>;
  return <ModeloGLTF url={url} escala={escala} fallback={children} />;
}
