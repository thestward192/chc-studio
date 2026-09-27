import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { animate, createTimeline, type JSAnimation, type Timeline } from 'animejs';
import * as THREE from 'three';
import { estudio, laptop as coloresLaptop, marca, type ModoEstudio } from '../../theme/theme';
import { laptopConfig as cfg, type NivelCalidad } from './laptop.config';
import { Ciclorama } from './Ciclorama';
import { EntornoEstudio } from './EntornoEstudio';
import { DIM, LaptopModelo, type ManejadoresLaptop } from './LaptopModelo';
import { crearUniformsCiclorama } from './shaders/ciclorama';
import type { EstadoIntro } from './estadoIntro';
import {
  amortiguar,
  campana,
  clamp01,
  easeInOutCubic,
  esMovil,
  meseta,
  suave,
  tramo,
} from './utilidadesIntro';

interface Props {
  /** Progreso de scroll de la intro, de 0 (cerrada) a 1 (dentro de la pantalla). */
  progreso: number;
  calidad: NivelCalidad;
  movimientoReducido: boolean;
  modo: ModoEstudio;
  estado: EstadoIntro;
}

const ANGULO_CERRADA = Math.PI / 2;
const TAU = Math.PI * 2;

// Vectores de trabajo reutilizados en cada frame (sin basura para el GC).
const vPos = new THREE.Vector3();
const vObj = new THREE.Vector3();
const vPosB = new THREE.Vector3();
const vObjB = new THREE.Vector3();
const vCentro = new THREE.Vector3();
const vNormal = new THREE.Vector3();
const vDerecha = new THREE.Vector3();
const vArriba = new THREE.Vector3();
const vAux = new THREE.Vector3();
const qAux = new THREE.Quaternion();
const vTam = new THREE.Vector2();

/**
 * Escena de la intro: ciclorama + laptop + luces de estudio.
 * Toda la animación ocurre en useFrame leyendo `laptopConfig`; el Canvas es
 * `frameloop="demand"`, así que solo se dibuja cuando algo lo pide (scroll,
 * bucle de reposo, animaciones de Anime.js).
 */
export function LaptopIntro({ progreso, calidad, movimientoReducido, modo, estado }: Props) {
  const invalidate = useThree((s) => s.invalidate);
  const laptopRef = useRef<ManejadoresLaptop>(null);

  const uniformsCiclorama = useMemo(() => crearUniformsCiclorama(), []);
  const paleta = estudio[modo];

  // Estado temporal que no pasa por React.
  const temporal = useRef({
    t: 0,
    pSuave: progreso,
    parallax: new THREE.Vector2(),
    puntero: new THREE.Vector2(),
    opacidad: -1,
  });
  const entrada = useRef({ luz: 0, laptop: 0 });
  const encendido = useRef({ valor: 0, disparado: false });
  const animEncendido = useRef<JSAnimation | null>(null);

  // --- Colores del tema → uniforms (cambian con el modo claro/oscuro) ---
  useEffect(() => {
    const u = uniformsCiclorama;
    u.uColorCentro.value.set(paleta.centro);
    u.uColorBorde.value.set(paleta.borde);
    u.uColorApagado.value.set(paleta.apagado);
    u.uColorSombra.value.set(paleta.sombra);
    u.uColorLuzPantalla.value.set(coloresLaptop.luzPantalla);
    u.uColorRanura.value.set(coloresLaptop.luzRanura);
    u.uColorVerde.value.set(marca.verde);
    u.uColorCian.value.set(marca.cian);
    // Anillos claros sobre el azul noche, oscuros sobre el fondo claro
    u.uColorLinea.value.set(modo === 'oscuro' ? paleta.luz : paleta.sombra);
    const l = laptopRef.current;
    if (l) {
      l.uniformsPantalla.uColorReflejo.value.set(paleta.luz);
      l.uniformsPantalla.uColorFondoPagina.value.set(marca.fondoOscuro);
      l.luzPantalla.color.set(coloresLaptop.luzPantalla);
    }
    invalidate();
  }, [paleta, modo, uniformsCiclorama, invalidate]);

  // --- Calidad: anisotropía y sombras reales solo en alto/medio ---
  useEffect(() => {
    const l = laptopRef.current;
    if (!l) return;
    const conSombras = calidad !== 'bajo';
    l.mallasSombra.forEach((malla) => {
      malla.castShadow = conSombras;
      malla.receiveShadow = conSombras;
    });
    invalidate();
  }, [calidad, invalidate]);

  // --- Entrada al cargar la página (Anime.js) ---
  useEffect(() => {
    const e = entrada.current;
    e.luz = 0;
    e.laptop = 0;
    const factor = movimientoReducido ? 0.35 : 1;
    const linea: Timeline = createTimeline({ onUpdate: () => invalidate() })
      .add(e, { luz: [0, 1], duration: cfg.entrada.duracionLuz * factor, ease: 'outCubic' }, 0)
      .add(
        e,
        { laptop: [0, 1], duration: cfg.entrada.duracionLaptop * factor, ease: 'outExpo' },
        cfg.entrada.retrasoLaptop * factor,
      );
    return () => {
      linea.pause();
    };
  }, [invalidate, movimientoReducido]);

  // --- Parallax: mouse en escritorio, giroscopio en móvil (si hay permiso) ---
  useEffect(() => {
    if (movimientoReducido) return;
    const puntero = temporal.current.puntero;
    const alMover = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') return;
      puntero.set(
        (ev.clientX / window.innerWidth) * 2 - 1,
        -((ev.clientY / window.innerHeight) * 2 - 1),
      );
    };
    // En iOS el evento solo llega si el usuario concedió permiso antes: sin
    // permiso no llega nada y el parallax queda quieto, como pide el brief.
    const alOrientar = (ev: DeviceOrientationEvent) => {
      if (ev.gamma == null || ev.beta == null) return;
      puntero.set(
        THREE.MathUtils.clamp(ev.gamma / 25, -1, 1),
        THREE.MathUtils.clamp((ev.beta - 45) / 25, -1, 1),
      );
    };
    window.addEventListener('pointermove', alMover, { passive: true });
    if (esMovil()) window.addEventListener('deviceorientation', alOrientar, { passive: true });
    return () => {
      window.removeEventListener('pointermove', alMover);
      window.removeEventListener('deviceorientation', alOrientar);
    };
  }, [movimientoReducido]);

  // Al cambiar el progreso (scroll), pedir un frame: useFrame suaviza.
  useEffect(() => {
    invalidate();
  }, [progreso, invalidate]);

  useEffect(
    () => () => {
      animEncendido.current?.pause();
    },
    [],
  );

  useFrame((state, deltaBruto) => {
    const l = laptopRef.current;
    if (!l) return;
    const dt = Math.min(deltaBruto, 0.05);
    const tmp = temporal.current;
    tmp.t += dt;
    const t = tmp.t;
    const sec = cfg.secuencia;

    // --- Progreso suavizado: nunca salta aunque el scroll sí lo haga ---
    tmp.pSuave = amortiguar(tmp.pSuave, progreso, cfg.suavizadoScroll, dt);
    if (Math.abs(tmp.pSuave - progreso) < 1e-4) tmp.pSuave = progreso;
    else invalidate();
    const p = tmp.pSuave;

    // Peso del reposo: 1 arriba del todo, 0 en cuanto se empieza a bajar.
    const reposo = movimientoReducido ? 0 : 1 - suave(tramo(p, [0, sec.finReposo]));
    const e = entrada.current;
    const horizontal = state.size.width / state.size.height >= 1;

    // ================= Laptop =================
    const aTapa = easeInOutCubic(tramo(p, sec.tapa));
    l.tapa.rotation.x = THREE.MathUtils.lerp(ANGULO_CERRADA, cfg.laptop.anguloAbierta, aTapa);

    const giro = easeInOutCubic(tramo(p, sec.giro)) * (1 - easeInOutCubic(tramo(p, sec.frente)));
    const oscilacionGiro = Math.sin((t * TAU) / cfg.reposo.periodoGiro) * cfg.reposo.amplitudGiro;
    const rotY = giro * cfg.laptop.giroLateral + oscilacionGiro * reposo;
    const flotacion =
      reposo *
      (cfg.reposo.alturaBase +
        Math.sin((t * TAU) / cfg.reposo.periodoFlotacion) * cfg.reposo.amplitudFlotacion);
    const subida = movimientoReducido ? 0 : (1 - e.laptop) * cfg.entrada.desplazamientoLaptop;
    const escala = movimientoReducido
      ? 1
      : THREE.MathUtils.lerp(cfg.entrada.escalaInicial, 1, e.laptop);
    l.grupo.position.set(
      horizontal ? giro * cfg.laptop.desplazamientoLateral : 0,
      flotacion - subida,
      0,
    );
    l.grupo.rotation.y = rotY;
    l.grupo.scale.setScalar(escala);

    // Opacidad de entrada (solo se toca si cambia)
    const opacidad = clamp01(e.laptop * 1.4);
    if (opacidad !== tmp.opacidad) {
      tmp.opacidad = opacidad;
      l.materialesOpacos.forEach((m) => (m.opacity = opacidad));
      l.uniformsPantalla.uOpacidad.value = opacidad;
    }

    // Aluminio (se relee de la config para el panel de depuración)
    l.aluminio.roughness = cfg.aluminio.rugosidad;
    l.aluminio.anisotropy = calidad === 'bajo' ? 0 : cfg.aluminio.anisotropia;
    l.uniformsAluminio.uCepillado.value = cfg.aluminio.cepillado;
    l.uniformsAluminio.uBordeFresnel.value = cfg.aluminio.bordeFresnel;

    // ================= Pantalla =================
    // El encendido es temporal (no ligado al scroll): se dispara al cruzar el umbral.
    const enc = encendido.current;
    if (!enc.disparado && p >= sec.encendido) {
      enc.disparado = true;
      animEncendido.current?.pause();
      animEncendido.current = animate(enc, {
        valor: 1,
        duration: movimientoReducido ? 200 : cfg.pantalla.duracionEncendido,
        ease: 'linear',
        onUpdate: () => invalidate(),
      });
    } else if (enc.disparado && p < sec.encendido - 0.01) {
      enc.disparado = false;
      animEncendido.current?.pause();
      animEncendido.current = animate(enc, {
        valor: 0,
        duration: cfg.pantalla.duracionApagado,
        ease: 'inQuad',
        onUpdate: () => invalidate(),
      });
    }
    const limpiar = suave(tramo(p, sec.limpiarPantalla));
    const luz = suave(clamp01((enc.valor - 0.3) / 0.7)) * (1 - limpiar);
    const up = l.uniformsPantalla;
    up.uEncendido.value = enc.valor;
    up.uIntensidad.value = THREE.MathUtils.lerp(cfg.pantalla.intensidadHdr, 1, limpiar);
    up.uLuminanciaCentro.value = cfg.pantalla.luminanciaCentro;
    up.uAberracion.value = movimientoReducido ? 0 : cfg.pantalla.aberracionEncendido;
    // El reflejo del vidrio se retira durante el zoom para que no tape la imagen.
    const acercando = suave(
      tramo(p, [sec.zoom[0], sec.zoom[0] + (sec.zoom[1] - sec.zoom[0]) * 0.7]),
    );
    up.uReflejo.value = cfg.pantalla.reflejo * (1 - acercando * 0.85);
    up.uFranja.value = cfg.pantalla.franjaReflejo;
    up.uLimpiar.value = limpiar;
    l.luzPantalla.intensity = luz * cfg.pantalla.luzSobreTeclado;

    // ================= Ranura =================
    const pulso = movimientoReducido
      ? 0.75
      : THREE.MathUtils.lerp(
          cfg.ranura.pulsoMinimo,
          1,
          0.5 + 0.5 * Math.sin((t * TAU) / cfg.ranura.periodoPulso),
        );
    const cerrada = 1 - suave(tramo(aTapa, [0, 0.12]));
    l.uniformsRanura.uIntensidad.value = cfg.ranura.intensidad * pulso * cerrada * e.laptop;

    // ================= Geometría de la pantalla en el mundo =================
    l.grupo.updateMatrixWorld(true);
    l.pantalla.getWorldPosition(vCentro);
    l.pantalla.getWorldQuaternion(qAux);
    vNormal.set(0, 0, 1).applyQuaternion(qAux);
    vDerecha.set(1, 0, 0).applyQuaternion(qAux);
    up.uDerecha.value.copy(vDerecha);

    // ================= Cámara =================
    const cam = state.camera as THREE.PerspectiveCamera;
    if (cam.fov !== cfg.camara.fov) {
      cam.fov = cfg.camara.fov;
      cam.updateProjectionMatrix();
    }
    const aspecto = state.size.width / state.size.height;
    const k = THREE.MathUtils.clamp(
      Math.pow(cfg.camara.aspectoReferencia / aspecto, 0.9),
      1,
      cfg.camara.factorMaximoMovil,
    );
    const poses = cfg.camara.poses;
    const ultima = poses[poses.length - 1];
    const tanMedio = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const dCubre = Math.min(
      DIM.pantallaAlto / 2 / tanMedio,
      DIM.pantallaAncho / 2 / (tanMedio * aspecto),
    );
    // De frente, la laptop entera (con margen) debe caber a lo ancho.
    const dFrente = Math.max(
      cfg.camara.distanciaFrente,
      (DIM.ancho * cfg.camara.margenFrente) / 2 / (tanMedio * aspecto),
    );

    if (p <= ultima.p) {
      // Entre poses fijas
      let i = 0;
      while (i < poses.length - 2 && p > poses[i + 1].p) i++;
      const a = poses[i];
      const b = poses[Math.min(i + 1, poses.length - 1)];
      const f = easeInOutCubic(tramo(p, [a.p, b.p]));
      poseEscalada(a.posicion, a.objetivo, k, vPos, vObj);
      poseEscalada(b.posicion, b.objetivo, k, vPosB, vObjB);
      vPos.lerp(vPosB, f);
      vObj.lerp(vObjB, f);
    } else {
      // De lado → de frente → dentro de la pantalla
      poseEscalada(ultima.posicion, ultima.objetivo, k, vPos, vObj);
      const f = easeInOutCubic(tramo(p, sec.frente));
      const z = easeInOutCubic(tramo(p, sec.zoom));
      // Zoom en escala logarítmica: velocidad percibida constante.
      const d = Math.exp(
        THREE.MathUtils.lerp(Math.log(dFrente), Math.log(dCubre * cfg.camara.fraccionFinalZoom), z),
      );
      vPosB.copy(vCentro).addScaledVector(vNormal, d);
      vPos.lerp(vPosB, f);
      vObj.lerp(vCentro, f);
    }

    // Respiración + parallax (se desvanecen con el peso de reposo)
    vDerecha.subVectors(vObj, vPos).cross(THREE.Object3D.DEFAULT_UP).normalize();
    vArriba.crossVectors(vDerecha, vAux.subVectors(vObj, vPos).normalize());
    const resp = cfg.reposo.respiracionCamara * reposo;
    vPos.addScaledVector(vArriba, Math.sin((t * TAU) / cfg.reposo.periodoRespiracion) * resp);
    vPos.addScaledVector(
      vDerecha,
      Math.cos((t * TAU) / (cfg.reposo.periodoRespiracion * 1.3)) * resp * 0.6,
    );
    tmp.parallax.x = amortiguar(
      tmp.parallax.x,
      tmp.puntero.x * reposo,
      cfg.reposo.suavizadoParallax,
      dt,
    );
    tmp.parallax.y = amortiguar(
      tmp.parallax.y,
      tmp.puntero.y * reposo,
      cfg.reposo.suavizadoParallax,
      dt,
    );
    const par = cfg.reposo.parallax * k;
    vPos.addScaledVector(vDerecha, tmp.parallax.x * par);
    vPos.addScaledVector(vArriba, tmp.parallax.y * par * 0.6);
    if (
      Math.abs(tmp.parallax.x - tmp.puntero.x * reposo) > 1e-3 ||
      Math.abs(tmp.parallax.y - tmp.puntero.y * reposo) > 1e-3
    ) {
      invalidate();
    }

    cam.position.copy(vPos);
    cam.lookAt(vObj);

    // Subpíxeles: aparecen al acercarse y se van al limpiar la pantalla.
    const razon = cam.position.distanceTo(vCentro) / dCubre;
    const [lejos, cerca] = cfg.pantalla.subpixelDistancia;
    up.uSubpixel.value =
      tramo(-razon, [-lejos, -cerca]) * (1 - limpiar) * cfg.pantalla.subpixelIntensidad;

    state.scene.environmentIntensity = cfg.estudio.intensidadEntorno;

    // ================= Ciclorama =================
    const u = uniformsCiclorama;
    u.uTiempo.value = t;
    state.gl.getDrawingBufferSize(u.uResolucion.value);
    u.uEntrada.value = e.luz;
    u.uGrano.value = cfg.estudio.grano;
    u.uVineta.value = cfg.estudio.vineta;
    u.uCharco.value = cfg.estudio.charco;
    u.uHalo.value = modo === 'oscuro' ? cfg.estudio.haloOscuro : cfg.estudio.haloClaro;
    u.uAnillos.value = modo === 'oscuro' ? cfg.estudio.anillosOscuro : cfg.estudio.anillosClaro;
    u.uHaloCentro.value.set(...cfg.estudio.haloCentro);
    u.uHaloRadio.value = cfg.estudio.haloRadio;
    u.uOscurecer.value = suave(tramo(p, sec.oscurecer)) * cfg.estudio.oscurecerZoom;
    u.uSombraCentro.value.set(l.grupo.position.x, l.grupo.position.z);
    u.uSombraTam.value.set((DIM.ancho / 2) * escala, (DIM.fondo / 2) * escala);
    u.uSombraGiro.value = rotY;
    u.uSombraAltura.value = Math.max(0, l.grupo.position.y);
    u.uSombraOpacidad.value = cfg.estudio.sombraOpacidad * clamp01(e.laptop * 1.2);
    u.uTapaAbierta.value = aTapa;
    u.uPantallaCentro.value.copy(vCentro);
    u.uPantallaNormal.value.copy(vNormal);
    u.uPantallaDerecha.value.set(1, 0, 0).applyQuaternion(qAux);
    u.uPantallaTam.value.copy(vTam.set(DIM.pantallaAncho / 2, DIM.pantallaAlto / 2));
    u.uLuzPantalla.value = luz * cfg.estudio.reflejoPantalla;
    u.uRanuraPos.value.set(l.grupo.position.x, 0, DIM.fondo / 2);
    u.uLuzRanura.value =
      (l.uniformsRanura.uIntensidad.value / Math.max(cfg.ranura.intensidad, 1e-3)) *
      cfg.estudio.reflejoRanura;

    // ================= Estado para el postproceso =================
    estado.pantallaCentro.copy(vCentro);
    estado.desenfoque = meseta(p, sec.desenfoque);
    estado.transicion = movimientoReducido ? 0 : campana(p, sec.distorsion);
    estado.bloom = 1 - limpiar;
  });

  const conSombras = calidad !== 'bajo';

  return (
    <>
      <Ciclorama uniforms={uniformsCiclorama} />
      <LaptopModelo ref={laptopRef} />

      {/* Luces de estudio: relleno suave + luz principal */}
      <hemisphereLight args={[paleta.luz, paleta.borde, 0.55]} />
      <directionalLight
        position={[2.5, 6, 4]}
        intensity={1.3}
        color={paleta.luz}
        castShadow={conSombras}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-2.6}
        shadow-camera-right={2.6}
        shadow-camera-top={2.6}
        shadow-camera-bottom={-2.6}
        shadow-camera-near={1}
        shadow-camera-far={14}
      />

      {/* Entorno de estudio: softboxes que se reflejan en el aluminio. */}
      <EntornoEstudio paleta={paleta} />
    </>
  );
}

function poseEscalada(
  posicion: readonly number[],
  objetivo: readonly number[],
  k: number,
  salidaPos: THREE.Vector3,
  salidaObj: THREE.Vector3,
) {
  salidaObj.set(objetivo[0], objetivo[1], objetivo[2]);
  salidaPos
    .set(posicion[0], posicion[1], posicion[2])
    .sub(salidaObj)
    .multiplyScalar(k)
    .add(salidaObj);
}
