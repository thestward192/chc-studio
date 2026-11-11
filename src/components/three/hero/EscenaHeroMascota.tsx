import { useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { marca, mascota } from '../../../theme/theme';
import { estimarCalidadInicial } from '../../../utils/rendimiento';
import { heroConfig, type Expresion } from './hero.config';
import { crearGeometriaCuerpo, crearGeometriaVisor } from './geometriaMascota';
import {
  senalHero,
  type ExtensionLienzo,
  type RecorridoMascota,
  type Truco,
  type ViajeMascota,
} from './senalHero';
import { CARAS, pesoTruco, trucos, type Cara, type PoseTruco } from './trucosMascota';
import { crearTexturasEfectos } from './efectosMascota';
import { ALTO_MASCOTA } from './recorridoMascota';
import { crearPaseo } from './paseosMascota';
import {
  cuerpoFragment,
  cuerpoVertex,
  destellosFragment,
  polvoFragment,
  polvoVertex,
  salaFondoFragment,
  salaSueloFragment,
  salaSueloVertex,
  sueloFragment,
  sueloVertex,
  visorFragment,
  visorVertex,
} from '../shaders/mascota';

interface Props {
  /** false: la escena deja de pintar (fuera de pantalla o pestaña oculta). */
  activo: boolean;
  /** Se llama cuando ya se pintó el primer fotograma (para el fundido desde el póster). */
  onListo: () => void;
  className?: string;
  style?: CSSProperties;
  /** Desplazamiento pedido por el scroll (solo se mueve la mascota, no la sala). */
  viaje?: ViajeMascota;
  /** El canvas es más alto que su zona: la cámara mantiene el encuadre de la zona. */
  extension?: ExtensionLienzo;
  /**
   * Modo tranquilo (tarjeta de Páginas web): no vuela, no salta ni cambia de
   * cara; solo sigue al mouse con la mirada y la cabeza.
   */
  tranquila?: boolean;
  /**
   * Paseo por Proyectos, Nosotros, Contacto o el pie: sin sala, canvas
   * transparente sobre la sección y la mascota pequeña (paseosMascota.ts).
   */
  recorrido?: RecorridoMascota;
}

const SIN_EXTENSION: ExtensionLienzo = { arriba: 0, abajo: 0 };

type Calidad = 'alto' | 'medio';

type Fase = 'casa' | 'vuelo';

/** Sprites disponibles para los efectos de los trucos (Zzz, estrellas, notas…). */
const MAX_EFECTOS = 6;

/** Cámara del recorrido: campo estrecho (casi sin deformar a los lados). */
const FOV_RECORRIDO = 16;

const vecTemporal = new THREE.Vector3();
const vecDerecha = new THREE.Vector3();

/**
 * Mascota CHC: escena 3D del hero de Inicio. Canvas transparente que ocupa
 * la zona oscura de la tarjeta: una sala sin fondo (suelo con cuadrícula que
 * se pierde en la niebla y polvo flotando) por la que la mascota sale a
 * volar, dando vueltas en el aire, y vuelve. Solo se monta en escritorio con puntero fino; el resto de casos
 * usa el póster estático.
 */
export default function EscenaHeroMascota({
  activo,
  onListo,
  className,
  style,
  viaje,
  extension = SIN_EXTENSION,
  tranquila = false,
  recorrido,
}: Props) {
  const calidad: Calidad = estimarCalidadInicial() === 'alto' ? 'alto' : 'medio';
  const dpr = Math.min(window.devicePixelRatio || 1, heroConfig.dprMax);

  return (
    <Canvas
      className={className}
      frameloop={activo ? 'always' : 'never'}
      dpr={dpr}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={
        recorrido
          ? { fov: FOV_RECORRIDO, position: [0, 0, 50], near: 1, far: 400 }
          : {
              fov: heroConfig.camara.fov,
              position: [...heroConfig.camara.posicion],
              near: 0.1,
              far: 60,
            }
      }
      onCreated={({ camera }) => {
        if (!recorrido) camera.lookAt(...heroConfig.camara.mira);
      }}
      style={{ pointerEvents: 'none', ...style }}
      aria-hidden="true"
    >
      <Mascota
        calidad={calidad}
        onListo={onListo}
        viaje={viaje}
        extension={extension}
        tranquila={tranquila || !!recorrido}
        recorrido={recorrido}
      />
    </Canvas>
  );
}

function Mascota({
  calidad,
  onListo,
  viaje,
  extension,
  tranquila,
  recorrido,
}: {
  calidad: Calidad;
  onListo: () => void;
  viaje?: ViajeMascota;
  extension: ExtensionLienzo;
  tranquila: boolean;
  recorrido?: RecorridoMascota;
}) {
  const extensionRef = useRef(extension);
  extensionRef.current = extension;
  const paseo = useRef<THREE.Group>(null);
  const sala = useRef<THREE.Group>(null);
  const grupo = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const destellos = useRef<THREE.Mesh>(null);
  const charco = useRef<THREE.Mesh>(null);
  const { gl, scene, camera, size } = useThree();
  const c = heroConfig;

  // Puntero relativo al centro del canvas (-1..1), y si está sobre la tarjeta
  const puntero = useRef({ x: 0, y: 0, dentro: false });
  const estado = useRef({
    tiempo: 0,
    crecer: 0,
    fotogramas: 0,
    pesos: CARAS.map((_, i): number => (i === 0 ? 1 : 0)),
    paso: 0,
    finPaso: c.rutina[0].duracion,
    proximoParpadeo: 1.8,
    parpadeo: -1,
    mirada: new THREE.Vector2(),
    objetivoMirada: new THREE.Vector2(),
    proximaMirada: 1.2,
    giroPrevio: 0,
    muelle: { x: 0, v: 0, z: 0, vz: 0 },
    alturaPrevia: 0,
    fijo: false,
    fase: 'casa' as Fase,
    finFase: azarEntre(c.vuelo.enCasa) * 0.6,
    inicioFase: 0,
    ruta: null as THREE.CatmullRomCurve3 | null,
    tangente: new THREE.Vector3(),
    rumbo: 0,
    rumboSuave: 0,
    inclinacion: 0,
    // Viaje por la página: desplazamiento vertical (unidades), velocidad,
    // si venía de lejos y tiempo desde el aterrizaje (-1: no aterrizando)
    viajeY: 0,
    viajeV: 0,
    lejos: false,
    aterrizaje: -1,
    /** Distancia cámara-mascota (para compensar la perspectiva del viaje). */
    distancia: 8.6,
    // Trucos del menú del hero: el que está en curso (cancelado: instante en
    // que se interrumpió, -1 si no), si está en su casa del hero y quieta
    truco: null as {
      nombre: Truco;
      inicio: number;
      dir: number;
      cancelado: number;
      golpeado: boolean;
    } | null,
    enCasaHero: false,
    xPrevia: 0,
    // Salida por la izquierda de la tarjeta de Páginas web: avance 0..1 (va
    // y vuelve por tiempo), desplazamiento (unidades), velocidad de lado,
    // hacia dónde mira (-1 izquierda, 1 derecha) y cuánto se agacha
    salida: 0,
    salidaX: 0,
    salidaY: 0,
    salidaV: 0,
    encarar: 0,
    agache: 0,
    // Paseo por Proyectos, Nosotros, Contacto o el pie
    paseo: recorrido ? crearPaseo(recorrido.tipo) : null,
  });

  const flex = useMemo(() => ({ value: new THREE.Vector2() }), []);
  const opacidadSala = useMemo(() => ({ value: 1 }), []);
  const niebla = useMemo(
    () => ({
      uNiebla: { value: new THREE.Color(marca.fondoOscuro) },
      // Sin sala (Proyectos) no hay niebla: la cámara está lejos y la apagaría
      uNieblaRango: {
        value: recorrido ? new THREE.Vector2(1e4, 2e4) : new THREE.Vector2(...c.sala.niebla),
      },
    }),
    [c.sala.niebla, recorrido],
  );

  const materialCuerpo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cuerpoVertex,
        fragmentShader: cuerpoFragment,
        uniforms: {
          uFlex: flex,
          uAqua: { value: new THREE.Color(mascota.aqua) },
          uCian: { value: new THREE.Color(mascota.cian) },
          uMenta: { value: new THREE.Color(mascota.menta) },
          uBlanco: { value: new THREE.Color(mascota.blanco) },
          uLuz: { value: new THREE.Vector3(...c.luz) },
          uBrillo: { value: 0 },
          uRojo: { value: 0 },
          ...niebla,
        },
      }),
    [flex, niebla, c.luz],
  );

  const materialVisor = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: visorVertex,
        fragmentShader: visorFragment,
        uniforms: {
          uFlex: flex,
          uVisor: { value: new THREE.Color(mascota.visor) },
          uCian: { value: new THREE.Color(mascota.cian) },
          uOjo: { value: new THREE.Color(mascota.ojo) },
          uBrilloOjo: { value: new THREE.Color(mascota.brilloOjo) },
          uLuz: { value: new THREE.Vector3(...c.luz) },
          uExpresion: { value: new THREE.Vector3(1, 0, 0) },
          uExpresion2: { value: new THREE.Vector4(0, 0, 0, 0) },
          uGiroOjos: { value: 0 },
          uParpadeo: { value: 1 },
          uMirada: { value: new THREE.Vector2() },
          uOjos: { value: new THREE.Vector3(c.ojos.separacion, c.ojos.largo, c.ojos.radio) },
          uSemiejes: {
            value: new THREE.Vector2(c.visor.semiancho, c.visor.semialto).divideScalar(
              c.visor.escalaOjos,
            ),
          },
          ...niebla,
        },
      }),
    [flex, niebla, c.luz, c.ojos, c.visor],
  );

  const materialSuelo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sueloVertex,
        fragmentShader: sueloFragment,
        uniforms: {
          uAqua: { value: new THREE.Color(mascota.aqua) },
          uCian: { value: new THREE.Color(mascota.cian) },
          uIntensidad: { value: 1 },
          uAltura: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const materialDestellos = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sueloVertex,
        fragmentShader: destellosFragment,
        uniforms: {
          uOjo: { value: new THREE.Color(mascota.ojo) },
          uBrilloOjo: { value: new THREE.Color(mascota.brilloOjo) },
          uAparicion: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const materialesSala = useMemo(() => {
    const suelo = new THREE.ShaderMaterial({
      vertexShader: salaSueloVertex,
      fragmentShader: salaSueloFragment,
      uniforms: {
        uCian: { value: new THREE.Color(mascota.cian) },
        uAqua: { value: new THREE.Color(mascota.aqua) },
        uFoco: { value: new THREE.Vector3() },
        uCelda: { value: c.sala.celda },
        uAlcance: { value: c.sala.alcance },
        uOpacidad: opacidadSala,
      },
      transparent: true,
      depthWrite: false,
    });
    const fondo = new THREE.ShaderMaterial({
      vertexShader: sueloVertex,
      fragmentShader: salaFondoFragment,
      uniforms: { uCian: { value: new THREE.Color(mascota.cian) }, uOpacidad: opacidadSala },
      transparent: true,
      depthWrite: false,
    });
    const polvo = new THREE.ShaderMaterial({
      vertexShader: polvoVertex,
      fragmentShader: polvoFragment,
      uniforms: {
        uTiempo: { value: 0 },
        uTamano: { value: c.sala.particulas.tamano * 10 },
        uDpr: { value: 1 },
        uColor: { value: new THREE.Color(mascota.brilloOjo) },
        uNieblaRango: niebla.uNieblaRango,
        uOpacidad: opacidadSala,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { suelo, fondo, polvo };
  }, [c.sala, niebla, opacidadSala]);

  const geometrias = useMemo(() => {
    const [anillos, segmentos] = c.cuerpo.detalle[calidad];
    const [anillosV, segmentosV] = c.visor.detalle[calidad];
    return {
      cuerpo: crearGeometriaCuerpo(anillos, segmentos),
      visor: crearGeometriaVisor(anillosV, segmentosV),
      plano: new THREE.PlaneGeometry(1, 1),
      polvo: crearPolvo(c.sala.particulas[calidad]),
    };
  }, [calidad, c.cuerpo.detalle, c.visor.detalle, c.sala.particulas]);

  // Efectos de los trucos: un grupo de sprites que sigue el paseo de la
  // mascota (no su giro: las Z suben rectas aunque ella esté ladeada)
  const efectos = useMemo(() => {
    const texturas = crearTexturasEfectos();
    const grupoEfectos = new THREE.Group();
    const sprites = Array.from({ length: MAX_EFECTOS }, () => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texturas.z, transparent: true, depthWrite: false }),
      );
      sprite.visible = false;
      grupoEfectos.add(sprite);
      return sprite;
    });
    return { texturas, grupo: grupoEfectos, sprites };
  }, []);

  // Liberar GPU al desmontar
  useEffect(
    () => () => {
      Object.values(geometrias).forEach((g) => g.dispose());
      [
        materialCuerpo,
        materialVisor,
        materialSuelo,
        materialDestellos,
        ...Object.values(materialesSala),
        ...efectos.sprites.map((s) => s.material),
      ].forEach((m) => m.dispose());
      Object.values(efectos.texturas).forEach((t) => t.dispose());
    },
    [
      geometrias,
      materialCuerpo,
      materialVisor,
      materialSuelo,
      materialDestellos,
      materialesSala,
      efectos,
    ],
  );

  // Solo la escena del hero juega: al desmontarse, el menú deja de ofrecerse
  const esDelHero = !tranquila && (!viaje || viaje.lugar === 'hero');
  useEffect(() => {
    if (!esDelHero) return;
    return () => {
      senalHero.pantalla = null;
      senalHero.casa = null;
      senalHero.disponible = false;
      senalHero.ocupada = false;
      senalHero.trucoActual = null;
    };
  }, [esDelHero]);

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

  // Solo en desarrollo: captura del póster estático con la pose fija, y una
  // forma de fijar una cara para revisarla (window.__heroCara('alegre'))
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const ventana = window as Window & {
      __heroPoster?: (escala?: number) => string;
      __heroCara?: (cara: Expresion | null, giro?: number) => void;
    };
    // El póster es cuadrado y solo lleva a la mascota en casa, sin la sala
    ventana.__heroPoster = (escala = 2) => {
      const s = estado.current;
      const cam = camera as THREE.PerspectiveCamera;
      s.fijo = true;
      s.pesos = [1, 0, 0];
      aplicarFotograma(0, c.poster.tiempo);
      paseo.current?.position.set(0, 0, 0);
      if (sala.current) sala.current.visible = false;
      const previo = { dpr: gl.getPixelRatio(), pos: cam.position.clone(), aspecto: cam.aspect };
      cam.position.set(...c.poster.camara.posicion);
      cam.lookAt(...c.poster.camara.mira);
      cam.aspect = 1;
      cam.updateProjectionMatrix();
      gl.setPixelRatio(escala);
      gl.setSize(c.poster.lado, c.poster.lado, false);
      gl.render(scene, camera);
      const datos = gl.domElement.toDataURL('image/webp', 0.9);
      cam.position.copy(previo.pos);
      cam.lookAt(...c.camara.mira);
      cam.aspect = previo.aspecto;
      cam.updateProjectionMatrix();
      gl.setPixelRatio(previo.dpr);
      gl.setSize(size.width, size.height, false);
      if (sala.current) sala.current.visible = true;
      s.fijo = false;
      return datos;
    };
    ventana.__heroCara = (cara, giro) => {
      caraForzada.current = cara;
      giroForzado.current = giro ?? null;
    };
    return () => {
      delete ventana.__heroPoster;
      delete ventana.__heroCara;
    };
  });
  const caraForzada = useRef<Expresion | null>(null);
  const giroForzado = useRef<number | null>(null);

  /** Cara que toca ahora según la rutina, el botón del hero o el modo depuración. */
  function caraActual(): Cara {
    const s = estado.current;
    if (caraForzada.current) return caraForzada.current;
    if (tranquila) return s.salida > 0.04 && s.salida < 0.96 ? 'alegre' : 'neutro';
    if (senalHero.crecer) return 'alegre';
    // Con el menú abierto mira con curiosidad a quien la llamó
    if (esDelHero && senalHero.menuAbierto) return 'curioso';
    if (s.tiempo >= s.finPaso) {
      s.paso = (s.paso + 1) % c.rutina.length;
      s.finPaso = s.tiempo + c.rutina[s.paso].duracion;
    }
    return c.rutina[s.paso].expresion;
  }

  /** Avanza la escena `delta` segundos (o la fija en `tiempoFijo`, para el póster). */
  function aplicarFotograma(delta: number, tiempoFijo?: number) {
    const s = estado.current;
    const m = c.movimiento;
    const fijo = tiempoFijo !== undefined;
    s.tiempo = fijo ? tiempoFijo : s.tiempo + delta;
    const t = s.tiempo;
    const k = (v: number) => (fijo ? 1 : 1 - Math.exp(-v * delta)); // suavizado exponencial

    // --- Trucos del menú del hero: la pose del truco se mezcla con el
    // movimiento normal (pesoPose: 0 al empezar y al acabar, 1 en medio)
    let pose: PoseTruco | null = null;
    let pesoPose = 0;
    if (!fijo && esDelHero) {
      if (senalHero.pedido) {
        if (!s.truco && s.enCasaHero) {
          s.truco = {
            nombre: senalHero.pedido,
            inicio: t,
            dir: Math.random() < 0.5 ? -1 : 1,
            cancelado: -1,
            golpeado: false,
          };
          s.fase = 'casa';
          s.ruta = null;
          senalHero.ocupada = true;
          senalHero.trucoActual = s.truco.nombre;
        }
        senalHero.pedido = null;
      }
      const tr = s.truco;
      if (tr) {
        const def = trucos[tr.nombre];
        // Si deja el hero a mitad (scroll), se interrumpe con un fundido corto
        if (tr.cancelado < 0 && !s.enCasaHero) tr.cancelado = t;
        const local = (tr.cancelado >= 0 ? tr.cancelado : t) - tr.inicio;
        pose = def.pose(Math.min(local, def.duracion), { dir: tr.dir });
        pesoPose =
          pesoTruco(local, def.duracion) *
          (tr.cancelado >= 0 ? 1 - THREE.MathUtils.clamp((t - tr.cancelado) / 0.35, 0, 1) : 1);
        if (def.golpe !== undefined && !tr.golpeado && tr.cancelado < 0 && local >= def.golpe) {
          tr.golpeado = true;
          senalHero.golpes += 1;
        }
        // Mientras dura el truco no sale a volar
        s.finFase = Math.max(s.finFase, t + 3);
        if (local >= def.duracion || (tr.cancelado >= 0 && t - tr.cancelado > 0.35)) {
          s.truco = null;
          senalHero.ocupada = false;
          senalHero.trucoActual = null;
          pose = null;
          pesoPose = 0;
          s.finFase = t + azarEntre(c.vuelo.enCasa) * 0.7;
          // Las volteretas y giros suman vueltas completas: de vuelta a -π..π
          const gr = grupo.current;
          if (gr)
            gr.rotation.set(angulo(gr.rotation.x), angulo(gr.rotation.y), angulo(gr.rotation.z));
          s.rumboSuave = angulo(s.rumboSuave);
        }
      }
      // Menú abierto: deja de volar, vuelve a casa y espera
      if (senalHero.menuAbierto && !s.truco) {
        if (s.fase === 'vuelo') {
          s.fase = 'casa';
          s.ruta = null;
        }
        s.finFase = Math.max(s.finFase, t + 2.5);
      }
    }
    if (!fijo && recorrido) {
      pose = poseDelRecorrido();
      pesoPose = pose ? 1 : 0;
    }
    const enTruco = pose !== null && pesoPose > 0.3;

    // --- Expresión: pesos que se acercan con suavidad a la cara objetivo
    const objetivo = fijo ? 'neutro' : enTruco && pose ? pose.cara : caraActual();
    const rapidezCara = enTruco && pose ? pose.rapidezCara : c.transicion;
    s.pesos = s.pesos.map((p, i) => p + ((CARAS[i] === objetivo ? 1 : 0) - p) * k(rapidezCara));
    const [, alegre, curioso] = s.pesos;
    const pesos = s.pesos;
    materialVisor.uniforms.uExpresion.value.set(pesos[0], pesos[1], pesos[2]);
    materialVisor.uniforms.uExpresion2.value.set(pesos[3], pesos[4], pesos[5], pesos[6]);
    if (pose) materialVisor.uniforms.uGiroOjos.value = pose.giroOjos;
    materialCuerpo.uniforms.uRojo.value = (pose?.rojo ?? 0) * pesoPose;

    // --- Parpadeo (a veces doble); casi no se nota con los ojos en arco
    let abierto = 1;
    // Mareada, dormida o sorprendida no parpadea (la espiral o el arco se
    // aplastarían en una raya)
    const sinParpadeo = pesos[4] + pesos[5] + pesos[6] > 0.2;
    if (!fijo && !sinParpadeo) {
      if (s.parpadeo < 0 && t >= s.proximoParpadeo) s.parpadeo = 0;
      if (s.parpadeo >= 0) {
        s.parpadeo += delta;
        const fase = s.parpadeo / c.parpadeo.duracion;
        if (fase >= 1) {
          s.parpadeo = -1;
          const [a, b] = c.parpadeo.intervalo;
          s.proximoParpadeo =
            t + (Math.random() < c.parpadeo.doble ? 0.12 : a + Math.random() * (b - a));
        } else {
          abierto = 1 - Math.sin(fase * Math.PI) ** 0.7;
        }
      }
    }
    materialVisor.uniforms.uParpadeo.value = THREE.MathUtils.lerp(abierto, 1, alegre * 0.7);

    // --- Mirada: sigue al puntero; si no, pequeños vistazos al azar
    const dentro = !fijo && puntero.current.dentro;
    if (dentro) {
      s.objetivoMirada.set(
        THREE.MathUtils.clamp(puntero.current.x, -1, 1),
        THREE.MathUtils.clamp(puntero.current.y, -1, 1),
      );
    } else if (tranquila) {
      s.objetivoMirada.set(0, 0);
    } else if (!fijo && t >= s.proximaMirada) {
      s.objetivoMirada.set((Math.random() * 2 - 1) * 0.6, (Math.random() * 2 - 1) * 0.4);
      s.proximaMirada = t + 1.4 + Math.random() * 2.2;
    }
    if (fijo) s.objetivoMirada.set(0, 0);
    if (enTruco && pose) s.objetivoMirada.set(...pose.mirada);
    s.mirada.lerp(s.objetivoMirada, k(9));
    const miradaCurioso = new THREE.Vector2(0.5, 0.6).multiplyScalar(curioso);
    materialVisor.uniforms.uMirada.value.set(
      (s.mirada.x * (1 - curioso) + miradaCurioso.x) * c.ojos.mirada[0],
      (s.mirada.y * (1 - curioso) + miradaCurioso.y) * c.ojos.mirada[1],
    );

    // --- Botón del hero: crece y brilla
    s.crecer +=
      ((fijo || tranquila ? 0 : senalHero.crecer ? 1 : 0) - s.crecer) * k(c.crecer.suavizado);
    materialCuerpo.uniforms.uBrillo.value = s.crecer;

    // --- Viaje por la página: un muelle lleva a la mascota al desplazamiento
    // que pide el scroll (px de pantalla pasados a unidades a su distancia)
    const vj = c.viaje;
    if (!fijo) {
      const cam = camera as THREE.PerspectiveCamera;
      const ext = extensionRef.current;
      const altoZona = Math.max(size.height - ext.arriba - ext.abajo, 1);
      const distancia = cam.position.distanceTo(paseo.current?.position ?? new THREE.Vector3());
      s.distancia = distancia;
      const unidadesPorPx =
        (2 * distancia * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)) / altoZona;
      const objetivoViaje = -(viaje?.px ?? 0) * unidadesPorPx;
      // Relevo: si la mascota está en el otro lugar, esta se oculta y espera
      // ya en la posición que pide el scroll (sin viaje ni aterrizaje)
      // En Proyectos solo se ve mientras recorre las tarjetas
      const visible =
        (!viaje || (viaje.lugar === 'hero' ? senalHero.mascotaEnHero : !senalHero.mascotaEnHero)) &&
        (!recorrido || pose !== null);
      if (paseo.current) paseo.current.visible = visible;
      // Puede hacer trucos solo si es la del hero, está a la vista y quieta en su sitio
      s.enCasaHero =
        esDelHero &&
        visible &&
        senalHero.mascotaEnHero &&
        Math.abs(s.viajeY) < 0.05 &&
        Math.abs(objetivoViaje) < 0.03;
      if (!visible) {
        s.viajeY = objetivoViaje;
        s.viajeV = 0;
        s.lejos = Math.abs(objetivoViaje) > 0.8;
        s.aterrizaje = -1;
      }
      s.viajeV +=
        ((objetivoViaje - s.viajeY) * vj.muelle.rigidez - s.viajeV * vj.muelle.amortiguacion) *
        delta;
      s.viajeY += s.viajeV * delta;
      // Aterriza cuando vuelve a casa desde lejos
      if (Math.abs(s.viajeY) > 0.8) s.lejos = true;
      else if (s.lejos && Math.abs(s.viajeY) < 0.08) {
        s.lejos = false;
        s.aterrizaje = 0;
        // Recién llegada se queda en casa un rato antes de volar por la sala
        s.finFase = t + azarEntre(c.vuelo.enCasa);
      }
      if (s.aterrizaje >= 0) {
        s.aterrizaje += delta;
        if (s.aterrizaje > vj.aterrizaje.duracion) s.aterrizaje = -1;
      }
      // De viaje no vuela por la sala: vuelve a casa y espera
      if (Math.abs(s.viajeY) > 0.03 || Math.abs(objetivoViaje) > 0.03) {
        if (s.fase === 'vuelo') {
          s.fase = 'casa';
          s.ruta = null;
        }
        s.finFase = Math.max(s.finFase, t + 2);
        paseo.current?.position.lerp(new THREE.Vector3(), k(6));
      }
      if (charco.current) charco.current.visible = !recorrido && Math.abs(s.viajeY) < 1.2;

      // Salida por la izquierda (tarjeta de Páginas web, rumbo a Proyectos):
      // va y vuelve por tiempo; se agacha, despega subiendo un poco y
      // acelera hasta salir por el borde de la tarjeta. Al volver hace lo
      // mismo al revés: llega frenando y aterriza con un pequeño pasito.
      const sv = vj.salida;
      const objetivoSalida = viaje?.fuera ? 1 : 0;
      if (!visible) s.salida = objetivoSalida;
      else
        s.salida = THREE.MathUtils.clamp(
          s.salida + Math.sign(objetivoSalida - s.salida) * (delta / sv.duracion),
          0,
          1,
        );
      const u = s.salida;
      const despegue = THREE.MathUtils.smoothstep(u, 0, sv.agache);
      const vuelo = THREE.MathUtils.clamp((u - sv.agache) / (1 - sv.agache), 0, 1);
      const distanciaFuera = (viaje?.distanciaFuera ?? 0) * unidadesPorPx;
      const xPrevia = s.salidaX;
      s.salidaX =
        Math.sin(Math.PI * despegue) * sv.retroceso * (1 - vuelo) - distanciaFuera * vuelo ** 2.2;
      s.salidaY = sv.subida * THREE.MathUtils.smoothstep(vuelo, 0, 0.7);
      s.salidaV = delta > 0 && visible ? (s.salidaX - xPrevia) / delta : 0;
      // Agachada antes de despegar (y al aterrizar de vuelta)
      s.agache = Math.sin(Math.PI * despegue) * (1 - vuelo);
      // Mira hacia donde vuela: a la izquierda al irse (ya desde que se
      // agacha), a la derecha al volver y de frente al aterrizar
      const enMarcha = u > 0.001 && u < 0.999;
      const rumbo = !enMarcha ? 0 : objetivoSalida === 1 ? -1 : u > sv.agache ? 1 : 0;
      s.encarar += (rumbo - s.encarar) * k(7);
      // La sala y el brillo del suelo se apagan al despegar (la mascota pasa
      // por delante de la ventana del navegador)
      const apagado = 1 - THREE.MathUtils.smoothstep(u, 0.02, sv.agache + 0.08);
      opacidadSala.value = apagado;
      materialSuelo.uniforms.uIntensidad.value = apagado;
    }

    // --- Vuelo por la sala: despega, da una vuelta por el aire y aterriza en casa
    const v = c.vuelo;
    if (!fijo && !tranquila && t >= s.finFase) {
      s.inicioFase = t;
      if (s.fase === 'casa') {
        s.fase = 'vuelo';
        s.ruta = crearRuta();
        s.finFase = t + v.duracion;
      } else {
        s.fase = 'casa';
        s.finFase = t + azarEntre(v.enCasa);
      }
    }
    const ruta = s.fase === 'vuelo' ? s.ruta : null;
    const u = ruta ? avanceVuelo((t - s.inicioFase) / v.duracion) : 0;
    // 0 en casa, 1 a mitad del vuelo
    const enVuelo = ruta ? Math.sin(u * Math.PI) : 0;
    const pa = paseo.current;
    if (pa && !fijo) {
      if (ruta) {
        ruta.getPoint(u, pa.position);
        ruta.getTangent(THREE.MathUtils.clamp(u, 0.01, 0.99), s.tangente);
        s.rumbo = Math.atan2(s.tangente.x, s.tangente.z);
      } else if (!pose) {
        // En casa (o llamada por el menú a mitad de un vuelo): vuelve a su sitio
        pa.position.multiplyScalar(1 - k(2.5));
      }
      if (viaje?.distanciaFuera !== undefined) pa.position.set(s.salidaX, s.salidaY, 0);
      materialesSala.suelo.uniforms.uFoco.value.copy(pa.position);
      // El brillo se queda en el suelo aunque la mascota suba
      if (charco.current) charco.current.position.y = -1.02 - pa.position.y;
    }

    materialesSala.polvo.uniforms.uTiempo.value = t;
    materialesSala.polvo.uniforms.uDpr.value = gl.getPixelRatio();

    // --- Cuerpo: flota, salta cuando está alegre, se ladea con curiosidad
    const g = grupo.current;
    const cu = cuerpo.current;
    if (g && cu) {
      const flota =
        Math.sin((t / m.flotacion.periodo) * Math.PI * 2) *
        m.flotacion.amplitud *
        (tranquila ? 0.35 : 1) *
        (1 - alegre);
      const rebote = Math.abs(Math.sin(t * Math.PI * m.salto.frecuencia));
      const salto = rebote * m.salto.altura * alegre;
      // Aplaste al tocar el suelo y estiramiento al subir
      const aplaste =
        (1 - rebote) ** 6 * m.salto.aplaste * alegre -
        Math.cos((t / m.flotacion.periodo) * Math.PI * 2) * 0.012 * (1 - alegre);
      // Viaje: se alarga con la velocidad y se aplasta (con rebote) al aterrizar
      const estirar = fijo
        ? 0
        : Math.min(
            (Math.abs(s.viajeV) + Math.abs(s.salidaV) * 0.6) * vj.estiramiento,
            vj.estiramientoMax,
          );
      const golpe =
        s.aterrizaje >= 0
          ? Math.exp(-s.aterrizaje * 6) *
            Math.cos(s.aterrizaje * vj.aterrizaje.frecuencia) *
            vj.aterrizaje.fuerza
          : 0;
      const sy = (1 - aplaste) * (1 + estirar) * (1 - golpe) * (1 - s.agache * 0.16);
      const sxz = 1 / Math.sqrt(sy);
      const escala = 1 + (c.crecer.escala - 1) * s.crecer;
      cu.position.y = flota + salto + (fijo ? 0 : s.viajeY);
      cu.scale.set(sxz * escala, sy * escala, sxz * escala);
      materialSuelo.uniforms.uAltura.value =
        Math.max(cu.position.y + (paseo.current?.position.y ?? 0), 0) * 0.9;

      const [poseX, poseY] = m.pose;
      if (ruta) {
        // Volando: mira hacia donde va, se inclina en las curvas y da una
        // voltereta hacia delante
        const dRumbo = angulo(s.rumbo - s.rumboSuave) * k(4);
        s.rumboSuave += dRumbo;
        const alabeo = THREE.MathUtils.clamp(
          delta > 0 ? (-dRumbo / delta) * 0.25 : 0,
          -v.alabeo,
          v.alabeo,
        );
        const voltereta =
          Math.PI * 2 * THREE.MathUtils.smootherstep(u, v.voltereta[0], v.voltereta[1]);
        g.rotation.y = s.rumboSuave;
        s.inclinacion += (poseX + enVuelo * v.inclinacion - s.inclinacion) * k(4);
        g.rotation.x = s.inclinacion + voltereta;
        g.rotation.z += (alabeo * enVuelo - g.rotation.z) * k(5);
      } else {
        // En casa sigue al puntero
        const atento = dentro;
        // De viaje se inclina hacia donde va (cabeza abajo al caer)
        const inclinacionViaje = fijo
          ? 0
          : THREE.MathUtils.clamp(
              -s.viajeV * vj.inclinacion,
              -vj.inclinacionMax,
              vj.inclinacionMax,
            );
        // Perspectiva: muy arriba se la vería desde abajo (mirando al techo) y
        // muy abajo desde arriba; se gira para mirar siempre igual a la cámara
        const perspectiva = fijo ? 0 : Math.atan2(s.viajeY, s.distancia);
        // Saliendo de la tarjeta se gira de perfil hacia donde vuela y se
        // inclina hacia delante (al agacharse se echa un poco atrás)
        const encarar = s.encarar;
        const objetivoX =
          poseX +
          perspectiva +
          inclinacionViaje +
          Math.abs(encarar) * 0.3 -
          s.agache * 0.12 +
          (atento && !encarar ? -puntero.current.y * m.puntero.giroX : 0);
        const objetivoY =
          poseY +
          (atento
            ? puntero.current.x * m.puntero.giroY - poseY * 0.6
            : tranquila
              ? 0
              : Math.sin(t * 0.37) * 0.12);
        const giroObjetivo =
          giroForzado.current ??
          objetivoY + (encarar * Math.PI * 0.32 - objetivoY) * Math.abs(encarar);
        g.rotation.x += angulo(objetivoX - g.rotation.x) * k(m.puntero.suavizado);
        g.rotation.y += angulo(giroObjetivo - g.rotation.y) * k(m.puntero.suavizado);
        const ladeo = Math.sin(t * 0.9) * 0.035 + curioso * 0.15;
        g.rotation.z += angulo(ladeo - g.rotation.z) * k(4);
        s.rumboSuave = g.rotation.y;
        s.inclinacion = angulo(g.rotation.x);
      }
      if (fijo) g.rotation.set(poseX, poseY, Math.sin(t * 0.9) * 0.035);

      // Truco: la pose manda sobre el movimiento normal según su peso
      if (pose && pesoPose > 0 && pa) {
        const w = pesoPose;
        const mezcla = THREE.MathUtils.lerp;
        pa.position.set(
          mezcla(pa.position.x, pose.pos[0], w),
          mezcla(pa.position.y, pose.pos[1], w),
          mezcla(pa.position.z, pose.pos[2], w),
        );
        cu.position.y = mezcla(cu.position.y, 0, w);
        cu.scale.set(
          mezcla(cu.scale.x, pose.escala[0] * escala, w),
          mezcla(cu.scale.y, pose.escala[1] * escala, w),
          mezcla(cu.scale.z, pose.escala[2] * escala, w),
        );
        // Por el camino corto: las vueltas completas (voltereta, giro del baile) siguen
        g.rotation.x += angulo(pose.rot[0] - g.rotation.x) * w;
        g.rotation.y += angulo(pose.rot[1] - g.rotation.y) * w;
        g.rotation.z += angulo(pose.rot[2] - g.rotation.z) * w;
        s.rumboSuave = g.rotation.y;
        s.inclinacion = angulo(g.rotation.x);
        // El brillo del suelo se queda en el suelo y sigue a la mascota
        if (charco.current) charco.current.position.y = -1.02 - pa.position.y;
        materialesSala.suelo.uniforms.uFoco.value.copy(pa.position);
        materialSuelo.uniforms.uAltura.value = Math.max(cu.position.y + pa.position.y, 0) * 0.9;
      }

      // Muelle de la punta: reacciona al giro, a la subida/bajada y (en los
      // trucos) a la carrera de lado
      const mu = s.muelle;
      const alturaTotal = cu.position.y + (pa?.position.y ?? 0);
      const velGiro = fijo || delta === 0 ? 0 : (g.rotation.y - s.giroPrevio) / delta;
      const velAltura = fijo || delta === 0 ? 0 : (alturaTotal - s.alturaPrevia) / delta;
      const velLado = fijo || delta === 0 || !pa ? 0 : (pa.position.x - s.xPrevia) / delta;
      s.giroPrevio = g.rotation.y;
      s.alturaPrevia = alturaTotal;
      s.xPrevia = pa?.position.x ?? 0;
      if (!fijo) {
        // Limitado: en los giros del vuelo la punta no debe doblarse de más
        const fx =
          THREE.MathUtils.clamp(
            -velGiro * m.muelle.fuerza - velLado * 0.03 * pesoPose,
            -0.22,
            0.22,
          ) +
          Math.sin(t * 1.3) * 0.025;
        const fz =
          THREE.MathUtils.clamp(-velAltura * m.muelle.fuerza * 0.5, -0.15, 0.15) +
          Math.sin(t * 1.1 + 1) * 0.02;
        mu.v += ((fx - mu.x) * m.muelle.rigidez - mu.v * m.muelle.amortiguacion) * delta;
        mu.x += mu.v * delta;
        mu.vz += ((fz - mu.z) * m.muelle.rigidez - mu.vz * m.muelle.amortiguacion) * delta;
        mu.z += mu.vz * delta;
      }
      const [flexX, flexZ] = pose ? pose.flex : [0, 0];
      flex.value.set(fijo ? 0 : mu.x + flexX * pesoPose, fijo ? 0 : mu.z + flexZ * pesoPose);
    }

    // --- Destellos de curioso
    // --- Efectos del truco (Zzz, estrellas, notas, marca de enojo)
    const lista = pose && pesoPose > 0 ? pose.efectos : [];
    efectos.sprites.forEach((sprite, i) => {
      const e = lista[i];
      sprite.visible = !!e && e.opacidad > 0.01;
      if (!e) return;
      const material = sprite.material;
      const mapa = efectos.texturas[e.tipo];
      if (material.map !== mapa) material.map = mapa;
      sprite.position.set(e.x, e.y, e.z);
      sprite.scale.setScalar(e.escala);
      material.opacity = e.opacidad * pesoPose;
      material.rotation = e.giro;
    });

    materialDestellos.uniforms.uAparicion.value = curioso;
    if (destellos.current) destellos.current.visible = curioso > 0.01;
  }

  /**
   * Paseo por una sección: pide a la UI las medidas de este cuadro, pone
   * la cámara a la distancia justa para que la mascota mida `alturaPx` y
   * devuelve la pose (null: esperando fuera de la pantalla).
   */
  function poseDelRecorrido(): PoseTruco | null {
    const datos = recorrido?.medir();
    if (!datos) return null;
    const cam = camera as THREE.PerspectiveCamera;
    const pxPorUnidad = datos.alturaPx / ALTO_MASCOTA;
    const distancia =
      size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * pxPorUnidad);
    if (Math.abs(cam.position.z - distancia) > 1e-3) {
      cam.position.set(0, 0, distancia);
      cam.updateMatrixWorld();
    }
    const paseo = estado.current.paseo;
    if (!paseo) return null;
    const pose = paseo.pose(datos, estado.current.tiempo, {
      ancho: size.width,
      alto: size.height,
      pxPorUnidad,
      distancia,
    });
    // Avisos para la UI (p. ej. la onda en la ventana de Nosotros)
    if (paseo.eventos.length) {
      paseo.eventos.forEach((evento) => recorrido?.avisar?.(evento));
      paseo.eventos.length = 0;
    }
    return pose;
  }

  /**
   * Publica dónde se ve la mascota en la ventana (centro y radio en px) y si
   * acepta trucos; la UI del hero pone ahí la zona para tocarla y el menú.
   */
  function publicarPosicion() {
    const s = estado.current;
    senalHero.disponible = s.enCasaHero && !s.truco;
    const cu = cuerpo.current;
    if (!cu) return;
    const rect = gl.domElement.getBoundingClientRect();
    cu.getWorldPosition(vecTemporal);
    // Un punto en el borde derecho del cuerpo (en el plano de la cámara) da el radio
    vecDerecha
      .setFromMatrixColumn(camera.matrixWorld, 0)
      .multiplyScalar(0.92 * cu.scale.x)
      .add(vecTemporal);
    vecTemporal.project(camera);
    vecDerecha.project(camera);
    const aPx = (v: THREE.Vector3) => [
      rect.left + ((v.x + 1) / 2) * rect.width,
      rect.top + ((1 - v.y) / 2) * rect.height,
    ];
    const [x, y] = aPx(vecTemporal);
    const [xr, yr] = aPx(vecDerecha);
    const r = Math.hypot(xr - x, yr - y);
    senalHero.pantalla = { x, y, r };
    // Casa: el origen del paseo, sin flotación ni trucos (no tiembla)
    const padre = paseo.current?.parent;
    if (padre) {
      const [cx, cy] = aPx(padre.localToWorld(vecTemporal.set(0, 0, 0)).project(camera));
      senalHero.casa = { x: cx, y: cy, r };
    }
  }

  // Canvas más alto que su zona: ventana desplazada de la cámara para que la
  // zona conserve su encuadre y lo extra muestre lo de arriba/abajo
  function ajustarCamara() {
    const { arriba, abajo, izquierda = 0 } = extensionRef.current;
    const cam = camera as THREE.PerspectiveCamera;
    if (!arriba && !abajo && !izquierda) {
      if (cam.view?.enabled) {
        cam.clearViewOffset();
        cam.aspect = size.width / size.height;
        cam.updateProjectionMatrix();
      }
      return;
    }
    const altoZona = Math.max(size.height - arriba - abajo, 1);
    const anchoZona = Math.max(size.width - izquierda, 1);
    const aspecto = anchoZona / altoZona;
    const vista = cam.view;
    if (
      vista?.enabled &&
      vista.fullHeight === altoZona &&
      vista.fullWidth === anchoZona &&
      vista.offsetX === -izquierda &&
      vista.offsetY === -arriba &&
      vista.height === size.height &&
      vista.width === size.width &&
      Math.abs(cam.aspect - aspecto) < 1e-6
    )
      return;
    cam.aspect = aspecto;
    cam.setViewOffset(anchoZona, altoZona, -izquierda, -arriba, size.width, size.height);
  }

  useFrame((_, delta) => {
    if (estado.current.fijo) return;
    ajustarCamara();
    aplicarFotograma(Math.min(delta, 1 / 20));
    if (esDelHero) publicarPosicion();
    // Avisar tras dos fotogramas (shaders ya compilados y pintados)
    if (estado.current.fotogramas < 3 && ++estado.current.fotogramas === 2) onListo();
  });

  return (
    <group position={[0, -0.08, 0]}>
      <group ref={sala} visible={!recorrido}>
        <mesh
          geometry={geometrias.plano}
          material={materialesSala.suelo}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, c.sala.suelo + 0.08, 6 - c.sala.alcance / 2]}
          scale={[40, c.sala.alcance + 12, 1]}
          renderOrder={-3}
        />
        <mesh
          geometry={geometrias.plano}
          material={materialesSala.fondo}
          position={[0, c.sala.suelo + 0.6, -c.sala.alcance + 4]}
          scale={[46, 10, 1]}
          renderOrder={-4}
        />
        <points geometry={geometrias.polvo} material={materialesSala.polvo} />
      </group>
      <group ref={paseo}>
        <primitive object={efectos.grupo} />
        <mesh
          ref={charco}
          geometry={geometrias.plano}
          material={materialSuelo}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.02, 0]}
          scale={[3.6, 2.6, 1]}
          renderOrder={-1}
        />
        <group ref={grupo} rotation-order="YXZ">
          <group ref={cuerpo}>
            <mesh geometry={geometrias.cuerpo} material={materialCuerpo} />
            <mesh geometry={geometrias.visor} material={materialVisor} />
          </group>
          <mesh
            ref={destellos}
            geometry={geometrias.plano}
            material={materialDestellos}
            position={[0.74, 0.62, 0.3]}
            scale={0.62}
            visible={false}
          />
        </group>
      </group>
    </group>
  );
}

function azarEntre([a, b]: readonly [number, number]) {
  return a + Math.random() * (b - a);
}

/** Diferencia de ángulos llevada a -π..π (para girar por el camino corto). */
function angulo(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * Avance por la ruta (0..1) según el tiempo del vuelo (0..1): arranca suave,
 * sale rápido y frena para aterrizar (perfil `vuelo.rapidez`, integrado una vez).
 */
const avanceVuelo = (() => {
  const { arranque, salida, llegada } = heroConfig.vuelo.rapidez;
  const n = 240;
  const tabla = [0];
  for (let i = 1; i <= n; i++) {
    const x = (i - 0.5) / n;
    const rapidez =
      THREE.MathUtils.smoothstep(x, 0, arranque) *
      (1 - THREE.MathUtils.smoothstep(x, 0.82, 1) * 0.85) *
      (salida + (llegada - salida) * x);
    tabla.push(tabla[i - 1] + rapidez);
  }
  const total = tabla[n];
  return (tiempo: number) => {
    const x = THREE.MathUtils.clamp(tiempo, 0, 1) * n;
    const i = Math.min(Math.floor(x), n - 1);
    return (tabla[i] + (tabla[i + 1] - tabla[i]) * (x - i)) / total;
  };
})();

/** Ruta de un vuelo: sale de casa y vuelve, con variaciones (y a veces en espejo). */
function crearRuta() {
  const { ruta, variacion } = heroConfig.vuelo;
  const espejo = Math.random() < 0.5 ? -1 : 1;
  const azar = () => (Math.random() * 2 - 1) * variacion;
  const puntos = ruta.map(
    ([x, y, z]) =>
      new THREE.Vector3(x * espejo + azar(), Math.max(y + azar() * 0.6, 0.4), z + azar()),
  );
  return new THREE.CatmullRomCurve3(
    [new THREE.Vector3(), ...puntos, new THREE.Vector3()],
    false,
    'centripetal',
  );
}

/** Polvo flotando por toda la sala (distribución determinista). */
function crearPolvo(cantidad: number) {
  const posiciones = new Float32Array(cantidad * 3);
  const fases = new Float32Array(cantidad);
  let semilla = 11;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < cantidad; i++) {
    posiciones.set([(azar() * 2 - 1) * 6, azar() * 5 - 1, 4 - azar() * 30], i * 3);
    fases[i] = azar();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  g.setAttribute('aFase', new THREE.BufferAttribute(fases, 1));
  return g;
}
