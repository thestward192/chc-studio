import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, PerformanceMonitor } from '@react-three/drei';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { proyectos } from '../../content/proyectos';
import { equipo } from '../../content/equipo';
import { sala } from '../../theme/theme';
import { estimarCalidadInicial, obtenerDprMaximo } from '../../utils/rendimiento';
import { CuadroProyecto } from './CuadroProyecto';
import { Puerta } from './Puerta';
import { ControlesCamara } from './ControlesCamara';
import { estudioConfig as cfg } from './estudio/estudio.config';
import { useEstudio, type NivelCalidad } from './estudio/estadoEstudio';
import { conectarCamara, vistaGeneral } from './estudio/camara';
import { puente } from './estudio/puente';
import {
  cerrarPanel,
  listarInteractivos,
  obtenerInteractivo,
  seleccionar,
  vecinoDe,
} from './estudio/useInteractivo';
import { ambiente } from './estudio/ambiente';
import { liberarTodo } from './estudio/recursos';
import { olvidarMateriales } from './estudio/materiales';
import { audio } from './estudio/audio';
import { RelojAmbiente } from './estudio/RelojAmbiente';
import { Iluminacion } from './estudio/Iluminacion';
import { Seleccion } from './estudio/Seleccion';
import { EncuadrePanel } from './estudio/EncuadrePanel';
import { Posproceso } from './estudio/Posproceso';
import { Sala } from './estudio/Sala';
import { Alfombra } from './estudio/Alfombra';
import { Escritorio } from './estudio/Escritorio';
import { RackServidores } from './estudio/RackServidores';
import { Estanteria } from './estudio/Estanteria';
import { Ventana } from './estudio/Ventana';
import { Pizarra } from './estudio/Pizarra';
import { Cafetera } from './estudio/Cafetera';
import { Planta } from './estudio/Planta';
import { LetreroNeon } from './estudio/LetreroNeon';
import { Particulas } from './estudio/Particulas';

const NIVELES: NivelCalidad[] = ['bajo', 'medio', 'alto'];

interface Props {
  movimientoReducido: boolean;
}

/**
 * Estudio 3D de ChcStudio (estudio.html). Se carga con import dinámico.
 * Render: continuo mientras hay algo que ver moverse; bajo demanda en
 * pausa, con el menú abierto o con un panel abierto y la cámara quieta;
 * detenido con la pestaña oculta.
 */
export default function EscenaSalaProyectos({ movimientoReducido }: Props) {
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

  // Limpieza completa al desmontar (y al salir de la página, ver Estudio.tsx)
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
  const particulas = cfg.calidad.particulas[calidad];

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

  // Haz de luz de la ventana (para el polvo)
  const [vx, vy, vz] = cfg.objetos.ventana.pos;
  const dirSol = new THREE.Vector3(0.5, 0, 1)
    .sub(new THREE.Vector3(...cfg.luces.posicionSol))
    .normalize();

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
      <color attach="background" args={[sala.paredFondo]} />
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
      <group key={versionConfig}>
        <Sala />
        <Alfombra />

        {proyectos.slice(0, cfg.cuadros.length).map((proyecto, i) => (
          <CuadroProyecto
            key={proyecto.id}
            proyecto={proyecto}
            indice={i}
            colocacion={cfg.cuadros[i]}
          />
        ))}
        {equipo.slice(0, cfg.puertas.length).map((integrante, i) => (
          <Puerta
            key={integrante.id}
            integrante={integrante}
            indice={i}
            colocacion={cfg.puertas[i]}
          />
        ))}

        <Escritorio colocacion={cfg.objetos.escritorios[0]} indice={0} extra="lampara" principal />
        <Escritorio colocacion={cfg.objetos.escritorios[1]} indice={1} extra="radio" />
        <RackServidores />
        <Estanteria />
        <Ventana />
        <Pizarra />
        <Cafetera cantidadVapor={particulas.vapor} />
        {cfg.objetos.plantas.map((planta, i) => (
          <Planta key={i} posicion={planta.pos} rotY={planta.rotY} escala={i === 2 ? 1.25 : 1} />
        ))}
        <LetreroNeon />
        <Particulas
          modo="polvo"
          cantidad={particulas.polvo}
          color={sala.sol}
          tam={cfg.shaders.particulas.tamPolvo}
          cajaMin={[vx + 0.1, 0.2, vz - 2.2]}
          cajaMax={[vx + 5.5, 2.8, vz + 1.4]}
          hazOrigen={[vx, vy, vz]}
          hazDir={[dirSol.x, dirSol.y, dirSol.z]}
          hazRadio={1.1}
          opacidad={() => (1 - ambiente.noche * 0.85) * 0.9}
        />
      </group>

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
