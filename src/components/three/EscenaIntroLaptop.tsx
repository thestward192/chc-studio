import { Canvas, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { estudio, type ModoEstudio } from '../../theme/theme';
import { estimarCalidadInicial, obtenerDprMaximo } from '../../utils/rendimiento';
import { LaptopIntro } from './LaptopIntro';
import { cambiosConfig, laptopConfig as cfg, type NivelCalidad } from './laptop.config';
import { crearEstadoIntro } from './estadoIntro';
import { esMovil } from './utilidadesIntro';
import { instalarTonosPersonalizados } from './shaders/tonos';

instalarTonosPersonalizados();

// Chunk aparte: `postprocessing` solo se descarga en los niveles medio y alto.
const PostprocesoIntro = lazy(() => import('./PostprocesoIntro'));

interface Props {
  progreso: number;
  /** false si la sección salió de la vista (IntersectionObserver en Inicio). */
  visible: boolean;
  movimientoReducido: boolean;
  modo: ModoEstudio;
}

const NIVELES: NivelCalidad[] = ['bajo', 'medio', 'alto'];

/**
 * Entrada perezosa (import dinámico) de toda la escena 3D de la intro.
 * Se encarga de: nivel de calidad automático (GPU + FPS), bucle de render
 * de reposo (solo si hace falta), pausa fuera de vista y carga del postproceso.
 */
export default function EscenaIntroLaptop({ progreso, visible, movimientoReducido, modo }: Props) {
  const [nivelMaximo] = useState(estimarCalidadInicial);
  const [calidadAuto, setCalidadAuto] = useState<NivelCalidad>(nivelMaximo);
  const [calidadForzada, setCalidadForzada] = useState(cfg.calidad.forzar);
  const [pestanaVisible, setPestanaVisible] = useState(() => !document.hidden);
  const estado = useMemo(crearEstadoIntro, []);

  const calidad = calidadForzada === 'auto' ? calidadAuto : calidadForzada;
  const conPostproceso = calidad !== 'bajo' && !movimientoReducido;
  const dpr: [number, number] =
    calidad === 'bajo' ? [1, 1] : [1, calidad === 'medio' ? Math.min(1.5, obtenerDprMaximo()) : obtenerDprMaximo()];

  // document.hidden → pausa total
  useEffect(() => {
    const alCambiar = () => setPestanaVisible(!document.hidden);
    document.addEventListener('visibilitychange', alCambiar);
    return () => document.removeEventListener('visibilitychange', alCambiar);
  }, []);

  // Nivel forzado desde el panel de depuración
  useEffect(() => {
    const alCambiar = () => setCalidadForzada(cfg.calidad.forzar);
    cambiosConfig.addEventListener('cambio', alCambiar);
    return () => cambiosConfig.removeEventListener('cambio', alCambiar);
  }, []);

  const activo = visible && pestanaVisible;
  // El reposo necesita render continuo solo arriba del todo.
  const enReposo = activo && !movimientoReducido && progreso < cfg.secuencia.finReposo;

  const cambiarNivel = (delta: number) =>
    setCalidadAuto((actual) => {
      const i = THREE.MathUtils.clamp(NIVELES.indexOf(actual) + delta, 0, NIVELES.indexOf(nivelMaximo));
      return NIVELES[i];
    });

  return (
    <Canvas
      frameloop={activo ? 'demand' : 'never'}
      dpr={dpr}
      shadows={calidad !== 'bajo' ? 'soft' : false}
      camera={{ fov: cfg.camara.fov, near: 0.05, far: 120, position: [0, 7, 3] }}
      gl={{
        antialias: calidad === 'bajo' || movimientoReducido,
        powerPreference: 'high-performance',
        // Misma curva que el composer (ver shaders/tonos.ts).
        toneMapping: THREE.CustomToneMapping,
      }}
    >
      <color attach="background" args={[estudio[modo].borde]} />
      {/* El monitor solo mide mientras hay render continuo: con render bajo
          demanda los huecos entre frames se leerían como FPS bajos. */}
      {enReposo && (
        <PerformanceMonitor
          bounds={() => (esMovil() ? [cfg.calidad.fpsMovil - 6, cfg.calidad.fpsMovil + 5] : [45, 58])}
          flipflops={4}
          onDecline={() => cambiarNivel(-1)}
          onIncline={() => cambiarNivel(1)}
          onFallback={() => setCalidadAuto('bajo')}
        />
      )}
      <BucleReposo activo={enReposo} reanudar={activo} />
      <LaptopIntro
        progreso={progreso}
        calidad={calidad}
        movimientoReducido={movimientoReducido}
        modo={modo}
        estado={estado}
      />
      {conPostproceso && (
        <Suspense fallback={null}>
          <PostprocesoIntro calidad={calidad} estado={estado} />
        </Suspense>
      )}
    </Canvas>
  );
}

/**
 * Render continuo para las animaciones de reposo, sin cambiar el frameloop
 * del Canvas: pide frames con invalidate() a la tasa permitida (30 FPS en
 * móvil). Cuando se desactiva, el Canvas vuelve a dibujar solo bajo demanda.
 */
function BucleReposo({ activo, reanudar }: { activo: boolean; reanudar: boolean }) {
  const invalidate = useThree((s) => s.invalidate);

  // Al volver a la vista (frameloop never → demand) hay que pedir un frame.
  useEffect(() => {
    if (reanudar) invalidate();
  }, [reanudar, invalidate]);

  // Cambios en vivo desde el panel de depuración → redibujar.
  useEffect(() => {
    const alCambiar = () => invalidate();
    cambiosConfig.addEventListener('cambio', alCambiar);
    return () => cambiosConfig.removeEventListener('cambio', alCambiar);
  }, [invalidate]);

  useEffect(() => {
    if (!activo) return;
    const intervaloMinimo = esMovil() ? 1000 / cfg.calidad.fpsMovil - 2 : 0;
    let ultimo = 0;
    let id = requestAnimationFrame(function tick(ahora) {
      if (ahora - ultimo >= intervaloMinimo) {
        ultimo = ahora;
        invalidate();
      }
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [activo, invalidate]);

  return null;
}
