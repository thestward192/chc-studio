import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, PerformanceMonitor } from '@react-three/drei';
import { useEffect, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { sala } from '../../../theme/theme';
import { estimarCalidadInicial, obtenerDprMaximo } from '../../../utils/rendimiento';
import { ControlesCamara } from '../ControlesCamara';
import { estudioConfig as cfg } from './estudio.config';
import { useEstudio, type NivelCalidad } from './estadoEstudio';
import { conectarCamara, vistaGeneral } from './camara';
import { puente } from './puente';
import {
  cerrarPanel,
  listarInteractivos,
  obtenerInteractivo,
  seleccionar,
  vecinoDe,
} from './useInteractivo';
import { ambiente } from './ambiente';
import { liberarTodo } from './recursos';
import { olvidarMateriales } from './materiales';
import { audio } from './audio';
import { RelojAmbiente } from './RelojAmbiente';
import { Iluminacion } from './Iluminacion';
import { Seleccion } from './Seleccion';
import { EncuadrePanel } from './EncuadrePanel';
import { Posproceso } from './Posproceso';

const NIVELES: NivelCalidad[] = ['bajo', 'medio', 'alto'];

interface Props {
  movimientoReducido: boolean;
  /** Color de fondo del canvas (detrás de las paredes). */
  fondo?: string;
  /** Contenido de la sala; recibe el nivel de calidad actual. */
  children: (calidad: NivelCalidad) => ReactNode;
}

/**
 * Motor común de las salas 3D (el taller y las oficinas del equipo):
 * Canvas, calidad adaptable, luces día/noche, cámara con vuelos, selección
 * con outline, encuadre con el panel abierto, posprocesado y preparación de
 * la carga. Todo lo específico de cada sala va en `children` y en la config.
 *
 * Render: continuo mientras hay algo que ver moverse; bajo demanda en
 * pausa, con el menú abierto o con un panel abierto y la cámara quieta;
 * detenido con la pestaña oculta.
 */
export function LienzoSala({ movimientoReducido, fondo = sala.paredFondo, children }: Props) {
  const [nivelMaximo] = useState(estimarCalidadInicial);
  const [movil] = useState(
    () => window.matchMedia('(pointer: coarse), (max-width: 700px)').matches,
  );
  const [pestanaVisible, setPestanaVisible] = useState(() => !document.hidden);
  const calidad = useEstudio((s) => s.calidadForzada ?? s.calidad);
  const pausa = useEstudio((s) => s.pausa || s.menu);
  const panelQuieto = useEstudio((s) => !!s.seleccionado && !s.camaraEnMovimiento && !s.enVuelo);
  const versionConfig = useEstudio((s) => s.versionConfig);

  ambiente.reducido = movimientoReducido;

  // Calidad inicial según la GPU
  useEffect(() => {
    useEstudio.getState().set({ calidad: nivelMaximo });
  }, [nivelMaximo]);

  useEffect(() => {
    const control = new AbortController();
    document.addEventListener('visibilitychange', () => setPestanaVisible(!document.hidden), {
      signal: control.signal,
    });
    return () => control.abort();
  }, []);

  // Conectar la interfaz HTML con la escena (ver puente.ts)
  useEffect(() => {
    Object.assign(puente, {
      seleccionar,
      cerrarPanel,
      vistaGeneral,
      obtener: obtenerInteractivo,
      listar: listarInteractivos,
      vecino: vecinoDe,
    });
  }, []);

  // Limpieza completa al desmontar (y al salir de la página: ver la página)
  useEffect(
    () => () => {
      liberarTodo();
      olvidarMateriales();
      audio.cerrar();
    },
    [],
  );

  const frameloop = !pestanaVisible ? 'never' : pausa || panelQuieto ? 'demand' : 'always';
  const dpr: [number, number] =
    calidad === 'bajo'
      ? [1, 1]
      : calidad === 'medio'
        ? [1, Math.min(1.5, obtenerDprMaximo())]
        : [1, obtenerDprMaximo()];

  const cambiarNivel = (paso: number) => {
    const estado = useEstudio.getState();
    if (estado.calidadForzada) return;
    const i = THREE.MathUtils.clamp(
      NIVELES.indexOf(estado.calidad) + paso,
      0,
      NIVELES.indexOf(nivelMaximo),
    );
    estado.set({ calidad: NIVELES[i] });
  };

  return (
    <Canvas
      frameloop={frameloop}
      dpr={dpr}
      shadows={calidad !== 'bajo' ? 'soft' : false}
      camera={{ fov: cfg.camara.fov, near: 0.05, far: 60, position: cfg.camara.entrada.pos }}
      gl={{
        antialias: false, // el antialiasing lo hacen el MSAA del composer y SMAA
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
    >
      <color attach="background" args={[fondo]} />
      <FovAdaptable />
      {frameloop === 'always' && (
        <PerformanceMonitor
          bounds={(refresco) => (refresco > 90 ? [55, 85] : [42, 57])}
          flipflops={4}
          onDecline={() => cambiarNivel(-1)}
          onIncline={() => cambiarNivel(1)}
          onFallback={() => {
            if (!useEstudio.getState().calidadForzada)
              useEstudio.getState().set({ calidad: 'bajo' });
          }}
        />
      )}

      <RelojAmbiente />
      <Iluminacion calidad={calidad} />
      {/* El panel de depuración remonta este grupo al mover posiciones */}
      <group key={versionConfig}>{children(calidad)}</group>

      {calidad === 'bajo' && (
        // Nivel bajo: sin sombras en tiempo real, solo sombras de contacto (se calculan una vez)
        <ContactShadows
          frames={1}
          position={[0, 0.006, 0]}
          scale={[cfg.sala.ancho, cfg.sala.fondo]}
          resolution={512}
          blur={2.4}
          far={1.6}
          opacity={0.55}
          color={sala.marco}
        />
      )}

      <ControlesCamara
        distanciaMinima={cfg.camara.distanciaMinima}
        distanciaMaxima={cfg.camara.distanciaMaxima}
        anguloPolarMinimo={cfg.camara.anguloPolarMinimo}
        anguloPolarMaximo={cfg.camara.anguloPolarMaximo}
        objetivo={cfg.camara.entrada.objetivo}
        limites={cfg.camara.limites}
        teclado={false}
        alConectar={conectarCamara}
        alMoverse={(moviendo) => {
          if (useEstudio.getState().camaraEnMovimiento !== moviendo) {
            useEstudio.getState().set({ camaraEnMovimiento: moviendo });
          }
        }}
      />
      <Seleccion />
      <EncuadrePanel />
      <Posproceso calidad={calidad} movil={movil} />
      <PreparacionCarga />
    </Canvas>
  );
}

/** FOV más abierto en pantallas verticales, para ver la sala en el móvil. */
function FovAdaptable() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const aspecto = size.width / size.height;
    // Mantener al menos ~70° de campo horizontal
    const vertical =
      aspecto >= 1
        ? cfg.camara.fov
        : Math.min(
            95,
            THREE.MathUtils.radToDeg(
              2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(35)) / aspecto),
            ),
          );
    camera.fov = vertical;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);

  return null;
}

/**
 * Carga real: compila todos los shaders de la escena (compileAsync) y
 * dibuja un primer fotograma antes de dar la escena por lista.
 */
function PreparacionCarga() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let cancelado = false;
    const estado = useEstudio.getState();
    if (estado.fase !== 'cargando') return;
    estado.set({ progresoCarga: 0.7, pasoCarga: 'Compilando shaders…' });
    const compilar = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve();
    void compilar.then(() => {
      if (cancelado) return;
      useEstudio.getState().set({ progresoCarga: 0.92, pasoCarga: 'Primer fotograma…' });
      invalidate();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelado)
            useEstudio.getState().set({ progresoCarga: 1, pasoCarga: 'Listo', fase: 'listo' });
        }),
      );
    });
    return () => {
      cancelado = true;
    };
  }, [gl, scene, camera, invalidate]);

  return null;
}
