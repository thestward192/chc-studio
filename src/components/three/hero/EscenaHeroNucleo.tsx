import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { marca } from '../../../theme/theme';
import { estimarCalidadInicial } from '../../../utils/rendimiento';
import { heroConfig } from './hero.config';
import { senalHero } from './senalHero';
import {
  arcoFragment,
  arcoVertex,
  nucleoFragment,
  nucleoVertex,
  polvoFragment,
  polvoVertex,
} from '../shaders/nucleo';

interface Props {
  /** false: la escena deja de pintar (fuera de pantalla o pestaña oculta). */
  activo: boolean;
  /** Se llama cuando ya se pintó el primer fotograma (para el fundido desde el póster). */
  onListo: () => void;
  className?: string;
}

type Calidad = 'alto' | 'medio';

/**
 * "Núcleo CHC": escena 3D del hero de Inicio. Canvas transparente sobre la
 * tarjeta oscura (los anillos SVG y el halo CSS quedan detrás). Solo se monta
 * en escritorio con puntero fino; el resto de casos usa el póster estático.
 */
export default function EscenaHeroNucleo({ activo, onListo, className }: Props) {
  const calidad: Calidad = estimarCalidadInicial() === 'alto' ? 'alto' : 'medio';
  const dpr = Math.min(window.devicePixelRatio || 1, heroConfig.dprMax);

  return (
    <Canvas
      className={className}
      frameloop={activo ? 'always' : 'never'}
      dpr={dpr}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{
        fov: heroConfig.camara.fov,
        position: [0, 0, heroConfig.camara.z],
        near: 0.1,
        far: 30,
      }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Nucleo calidad={calidad} onListo={onListo} />
    </Canvas>
  );
}

function Nucleo({ calidad, onListo }: { calidad: Calidad; onListo: () => void }) {
  const grupo = useRef<THREE.Group>(null);
  const malla = useRef<THREE.Mesh>(null);
  const arcos = useRef<(THREE.Group | null)[]>([]);
  const polvo = useRef<THREE.Points>(null);
  const { gl, scene, camera, size } = useThree();

  // Puntero relativo al centro del canvas (-1..1), y si está sobre la tarjeta
  const puntero = useRef({ x: 0, y: 0, dentro: false });
  const estado = useRef({
    tiempo: 0,
    crecer: 0,
    atraccion: 0,
    giroArcos: [0, 0],
    fotogramas: 0,
    pose: null as null | readonly [number, number],
  });

  const uniformsNucleo = useMemo(
    () => ({
      uTiempo: { value: 0 },
      uRuido: {
        value: new THREE.Vector3(
          heroConfig.nucleo.ruido.escala,
          heroConfig.nucleo.ruido.amplitud,
          heroConfig.nucleo.ruido.velocidad,
        ),
      },
      uRuidoFino: {
        value: new THREE.Vector3(
          heroConfig.nucleo.ruidoFino.escala,
          heroConfig.nucleo.ruidoFino.amplitud,
          heroConfig.nucleo.ruidoFino.velocidad,
        ),
      },
      uPuntero: { value: new THREE.Vector3(0, 0, 1) },
      uAtraccion: { value: 0 },
      uCrecer: { value: 0 },
      uCrecerRelieve: { value: heroConfig.crecer.relieve },
      uVerde: { value: new THREE.Color(marca.verde) },
      uCian: { value: new THREE.Color(marca.cian) },
      uFondo: { value: new THREE.Color(marca.fondoOscuro) },
      uLuz: { value: new THREE.Vector3(...heroConfig.luz) },
    }),
    [],
  );

  const materialArco = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: arcoVertex,
        fragmentShader: arcoFragment,
        uniforms: {
          uVerde: { value: new THREE.Color(marca.verde) },
          uCian: { value: new THREE.Color(marca.cian) },
          uLuz: { value: new THREE.Vector3(...heroConfig.luz) },
          uIntensidad: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  // Cabeza de cada arco: punto de luz en el color final del degradado
  const materialCabeza = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(marca.cian).lerp(new THREE.Color('#ffffff'), 0.35),
        toneMapped: false,
      }),
    [],
  );

  const geometriaNucleo = useMemo(
    () => new THREE.IcosahedronGeometry(1, heroConfig.nucleo.detalle[calidad]),
    [calidad],
  );

  const geometriasArco = useMemo(
    () =>
      heroConfig.arcos.map((a) => ({
        tubo: new THREE.TorusGeometry(a.radio, a.grosor, 14, 180, Math.PI * 2 * a.abertura),
        cabeza: new THREE.SphereGeometry(a.grosor, 16, 12),
        angulo: Math.PI * 2 * a.abertura,
      })),
    [],
  );

  const polvoDatos = useMemo(() => {
    const n = heroConfig.particulas[calidad];
    const posiciones = new Float32Array(n * 3);
    const fases = new Float32Array(n);
    const [rMin, rMax] = heroConfig.particulas.radio;
    // Distribución determinista (misma nube en cada carga y en el póster)
    let semilla = 7;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const u = azar() * 2 - 1;
      const fi = azar() * Math.PI * 2;
      const r = rMin + (rMax - rMin) * Math.sqrt(azar());
      const s = Math.sqrt(1 - u * u);
      posiciones.set([r * s * Math.cos(fi), r * u * 0.7, r * s * Math.sin(fi)], i * 3);
      fases[i] = azar();
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    geometria.setAttribute('aFase', new THREE.BufferAttribute(fases, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: polvoVertex,
      fragmentShader: polvoFragment,
      uniforms: {
        uTiempo: { value: 0 },
        uTamano: { value: heroConfig.particulas.tamano * heroConfig.camara.z },
        uDpr: { value: 1 },
        uColor: { value: new THREE.Color(marca.cian) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometria, material };
  }, [calidad]);

  // Liberar GPU al desmontar
  useEffect(
    () => () => {
      geometriaNucleo.dispose();
      materialArco.dispose();
      materialCabeza.dispose();
      geometriasArco.forEach((g) => {
        g.tubo.dispose();
        g.cabeza.dispose();
      });
      polvoDatos.geometria.dispose();
      polvoDatos.material.dispose();
    },
    [geometriaNucleo, materialArco, materialCabeza, geometriasArco, polvoDatos],
  );

  // Seguir al puntero por toda la tarjeta del hero (no solo sobre el canvas)
  useEffect(() => {
    const lienzo = gl.domElement;
    const tarjeta = lienzo.closest('section') ?? lienzo;
    const control = new AbortController();
    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
        const r = lienzo.getBoundingClientRect();
        const t = tarjeta.getBoundingClientRect();
        puntero.current.x = THREE.MathUtils.clamp(
          (e.clientX - (r.left + r.width / 2)) / (r.width / 2),
          -1.6,
          1.6,
        );
        puntero.current.y = THREE.MathUtils.clamp(
          -(e.clientY - (r.top + r.height / 2)) / (r.height / 2),
          -1.6,
          1.6,
        );
        puntero.current.dentro =
          e.clientX >= t.left &&
          e.clientX <= t.right &&
          e.clientY >= t.top &&
          e.clientY <= t.bottom;
      },
      { passive: true, signal: control.signal },
    );
    document.documentElement.addEventListener(
      'pointerleave',
      () => {
        puntero.current.dentro = false;
      },
      { signal: control.signal },
    );
    return () => control.abort();
  }, [gl]);

  // Solo en desarrollo: captura del póster estático con la pose fija
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const ventana = window as Window & { __heroPoster?: (escala?: number) => string };
    ventana.__heroPoster = (escala = 2) => {
      estado.current.pose = heroConfig.poster.giro;
      aplicarFotograma(0, heroConfig.poster.tiempo);
      const previo = gl.getPixelRatio();
      gl.setPixelRatio(escala);
      gl.setSize(size.width, size.height, false);
      gl.render(scene, camera);
      const datos = gl.domElement.toDataURL('image/webp', 0.9);
      gl.setPixelRatio(previo);
      gl.setSize(size.width, size.height, false);
      estado.current.pose = null;
      return datos;
    };
    return () => {
      delete ventana.__heroPoster;
    };
  });

  const eje = useMemo(() => new THREE.Vector3(), []);
  const cuaternion = useMemo(() => new THREE.Quaternion(), []);

  /** Avanza la escena `delta` segundos (o la fija en `tiempoFijo`, para el póster). */
  function aplicarFotograma(delta: number, tiempoFijo?: number) {
    const s = estado.current;
    const c = heroConfig;
    const fijo = tiempoFijo !== undefined;
    s.tiempo = fijo ? tiempoFijo : s.tiempo + delta;
    const k = (v: number) => (fijo ? 1 : 1 - Math.exp(-v * delta)); // suavizado exponencial

    s.crecer += ((fijo ? 0 : senalHero.crecer ? 1 : 0) - s.crecer) * k(c.crecer.suavizado);
    const dentro = !fijo && puntero.current.dentro;
    s.atraccion += ((dentro ? c.nucleo.atraccion : 0) - s.atraccion) * k(2.5);

    const g = grupo.current;
    if (g) {
      const [px, py] = s.pose ?? [
        dentro ? puntero.current.y * c.puntero.giroX : 0,
        dentro ? puntero.current.x * c.puntero.giroY : 0,
      ];
      g.rotation.x += (-px - g.rotation.x) * k(c.puntero.suavizado);
      g.rotation.y += (py - g.rotation.y) * k(c.puntero.suavizado);
      if (fijo) g.rotation.set(-px, py, 0);
    }

    const m = malla.current;
    if (m) {
      const respiracion =
        1 +
        Math.sin((s.tiempo / c.nucleo.respiracion.periodo) * Math.PI * 2) *
          c.nucleo.respiracion.amplitud;
      m.scale.setScalar(respiracion * (1 + (c.crecer.escala - 1) * s.crecer));
      m.rotation.y = s.tiempo * 0.08;
      // Dirección hacia el puntero en espacio del objeto
      eje.set(puntero.current.x, puntero.current.y, 0.9).normalize();
      m.getWorldQuaternion(cuaternion);
      eje.applyQuaternion(cuaternion.invert());
      uniformsNucleo.uPuntero.value.copy(eje);
    }
    uniformsNucleo.uTiempo.value = s.tiempo;
    uniformsNucleo.uCrecer.value = s.crecer;
    uniformsNucleo.uAtraccion.value = s.atraccion;

    const aceleracion = 1 + (c.crecer.velocidadArcos - 1) * s.crecer;
    c.arcos.forEach((a, i) => {
      s.giroArcos[i] = fijo
        ? s.tiempo * a.velocidad
        : s.giroArcos[i] + delta * a.velocidad * aceleracion;
      const arco = arcos.current[i];
      if (arco) arco.rotation.z = s.giroArcos[i];
    });

    if (polvo.current) {
      polvo.current.rotation.y = s.tiempo * c.particulas.velocidad;
      polvoDatos.material.uniforms.uTiempo.value = s.tiempo;
      polvoDatos.material.uniforms.uDpr.value = gl.getPixelRatio();
    }
  }

  useFrame((_, delta) => {
    aplicarFotograma(Math.min(delta, 1 / 20));
    // Avisar tras dos fotogramas (shaders ya compilados y pintados)
    if (estado.current.fotogramas < 3 && ++estado.current.fotogramas === 2) onListo();
  });

  return (
    <group ref={grupo}>
      <mesh ref={malla} geometry={geometriaNucleo}>
        <shaderMaterial
          vertexShader={nucleoVertex}
          fragmentShader={nucleoFragment}
          uniforms={uniformsNucleo}
        />
      </mesh>

      {heroConfig.arcos.map((a, i) => (
        <group key={i} rotation={a.inclinacion as unknown as [number, number, number]}>
          <group ref={(n) => (arcos.current[i] = n)}>
            <mesh geometry={geometriasArco[i].tubo} material={materialArco} />
            <mesh
              geometry={geometriasArco[i].cabeza}
              material={materialCabeza}
              position={[
                a.radio * Math.cos(geometriasArco[i].angulo),
                a.radio * Math.sin(geometriasArco[i].angulo),
                0,
              ]}
            />
          </group>
        </group>
      ))}

      <points ref={polvo} geometry={polvoDatos.geometria} material={polvoDatos.material} />
    </group>
  );
}
