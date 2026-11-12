import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { heroConfig } from '../hero/hero.config';
import { crearGeometriaCuerpo, crearGeometriaVisor } from '../hero/geometriaMascota';
import { acercarCara, aplicarCara, crearMaterialesMascota } from '../hero/materialesMascota';
import { crearTexturasEfectos } from '../hero/efectosMascota';
import { ALTO_MASCOTA } from '../hero/recorridoMascota';
import {
  CARAS,
  pesoTruco,
  rebote,
  tramo,
  trucos,
  type Cara,
  type DefinicionTruco,
  type PoseTruco,
} from '../hero/trucosMascota';
import { estudioConfig as cfg } from './estudio.config';
import { useEstudio } from './estadoEstudio';
import { ambiente } from './ambiente';
import { audio } from './audio';
import {
  DECORATIVA,
  sinRaycast,
  useInteractivo,
  type DefinicionInteractivo,
} from './useInteractivo';

type V3 = [number, number, number];
type Fase = 'parada' | 'caminando';
type TrucoSala = 'saludar' | 'bailar' | 'voltereta' | 'dormir' | 'enojarse';

const [BX, BY] = heroConfig.movimiento.pose;
/** Del centro del cuerpo al suelo (la colita apoya en y = 0). */
const BASE = 0.95;
const MAX_EFECTOS = 6;
const TAU = Math.PI * 2;

/** Lo que se le puede pedir desde su panel (orden de los botones). */
const ACCIONES: { truco: TrucoSala; etiqueta: string }[] = [
  { truco: 'saludar', etiqueta: 'Saludar' },
  { truco: 'bailar', etiqueta: 'Bailar' },
  { truco: 'voltereta', etiqueta: 'Voltereta' },
  { truco: 'dormir', etiqueta: 'Siesta' },
  { truco: 'enojarse', etiqueta: 'Ponerse brava' },
];

/** Saludo: dos saltitos contentos moviendo la punta como una mano. */
const saludar: DefinicionTruco = {
  duracion: 1.9,
  pose(t) {
    const salto = (a: number) => {
      const u = tramo(t, a, a + 0.42);
      return 4 * 0.32 * u * (1 - u);
    };
    const y = salto(0.15) + salto(0.8);
    const aplaste = 0.14 * (rebote(t - 0.57, 2.8, 7) + rebote(t - 1.22, 2.8, 7));
    const sy = 1 - aplaste + 0.08 * Math.sin(Math.PI * Math.min(y / 0.32, 1));
    const lado = 1 / Math.sqrt(sy);
    const agitar = Math.sin(t * 15) * 0.32 * Math.sin(Math.PI * tramo(t, 0.05, 1.75));
    return {
      pos: [0, y, 0],
      rot: [BX - 0.05, BY, Math.sin(t * 7.5) * 0.07],
      escala: [lado, sy, lado],
      cara: 'alegre',
      rapidezCara: 12,
      mirada: [0, 0.2],
      rojo: 0,
      giroOjos: 0,
      flex: [agitar, 0.05],
      efectos: [],
    };
  },
};

const trucosSala: Record<TrucoSala, DefinicionTruco> = {
  saludar,
  bailar: trucos.bailar,
  voltereta: trucos.voltereta,
  dormir: trucos.dormir,
  enojarse: trucos.enojarse,
};

/**
 * La mascota CHC viviendo en la sala (el taller o una oficina): pasea de
 * punto en punto por la red de `cfg.mascota` (que esquiva los muebles)
 * dando saltitos con balanceo, como si caminara; en cada punto se para a
 * mirar algo (un cuadro, la ventana, la cafetera…) y vuelve a salir.
 *
 * Es un objeto interactivo más: al señalarla se para y te mira (con el
 * contorno de selección); al tocarla la cámara vuela hasta ella y su panel
 * ofrece trucos (saludar, bailar, voltereta, siesta, ponerse brava). Con
 * movimiento reducido se queda en su sitio, pero sigue respondiendo.
 */
export function MascotaSala({ info }: { info: string }) {
  const m = cfg.mascota;
  const escala = m.alto / ALTO_MASCOTA;
  const raiz = useRef<THREE.Group>(null);
  const orientado = useRef<THREE.Group>(null);
  const paseo = useRef<THREE.Group>(null);
  const grupo = useRef<THREE.Group>(null);
  const cuerpo = useRef<THREE.Group>(null);
  const sombra = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  const mats = useMemo(() => crearMaterialesMascota(), []);
  const recursos = useMemo(() => {
    // Sombra suave bajo los pies (degradado radial)
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = 64;
    const ctx = lienzo.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const texSombra = new THREE.CanvasTexture(lienzo);
    const texturas = crearTexturasEfectos();
    const sprites = Array.from({ length: MAX_EFECTOS }, () => {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texturas.z, transparent: true, depthWrite: false }),
      );
      sprite.visible = false;
      sprite.raycast = sinRaycast;
      return sprite;
    });
    return {
      cuerpo: crearGeometriaCuerpo(100, 200),
      visor: crearGeometriaVisor(36, 64),
      plano: new THREE.PlaneGeometry(1, 1),
      texSombra,
      matSombra: new THREE.MeshBasicMaterial({
        map: texSombra,
        transparent: true,
        depthWrite: false,
      }),
      texturas,
      sprites,
    };
  }, []);

  useEffect(
    () => () => {
      [
        mats.cuerpo,
        mats.visor,
        recursos.matSombra,
        ...recursos.sprites.map((s) => s.material),
      ].forEach((x) => x.dispose());
      [recursos.cuerpo, recursos.visor, recursos.plano].forEach((x) => x.dispose());
      [recursos.texSombra, ...Object.values(recursos.texturas)].forEach((x) => x.dispose());
    },
    [mats, recursos],
  );

  const s = useRef({
    t: 0,
    pos: new THREE.Vector2(...m.puntos[m.inicio].pos),
    yaw: 0,
    fase: 'parada' as Fase,
    actual: m.inicio,
    previo: -1,
    destino: -1,
    finParada: 1.5,
    llegada: -9,
    velocidad: 0,
    paso: 0,
    pesos: CARAS.map((_, i): number => (i === 0 ? 1 : 0)),
    mirada: new THREE.Vector2(),
    parpadeo: -1,
    proximoParpadeo: 2,
    hover: false,
    atentaDesde: -9,
    truco: null as { nombre: TrucoSala; inicio: number } | null,
    muelle: { x: 0, v: 0, z: 0, vz: 0 },
    giroPrevio: 0,
    alturaPrevia: 0,
  });

  // Foco de la cámara: delante de ella, del lado desde donde se la mira (se
  // actualiza en cada fotograma mientras pasea)
  const foco = useMemo(() => ({ pos: [0, 0, 0] as V3, objetivo: [0, 0, 0] as V3 }), []);

  const definicion = useMemo<DefinicionInteractivo>(
    () => ({
      id: 'mascota',
      nombre: 'La mascota de CHC',
      etiqueta: 'Mascota',
      grupo: 'objeto',
      orden: 100,
      foco,
      info,
      acciones: ACCIONES.map(({ truco, etiqueta }) => ({
        label: () => etiqueta,
        run: () => {
          s.current.truco = { nombre: truco, inicio: s.current.t };
          audio.clic();
        },
      })),
      alHover: (activo) => {
        s.current.hover = activo;
      },
    }),
    [foco, info],
  );
  useInteractivo(raiz, definicion);

  useFrame((_, deltaBruto) => {
    const e = s.current;
    const dt = Math.min(deltaBruto, 1 / 20);
    e.t += dt;
    const t = e.t;
    const k = (v: number) => 1 - Math.exp(-v * dt);
    const estado = useEstudio.getState();
    const seleccionada = estado.seleccionado === 'mascota';
    const atenta = seleccionada || e.hover;
    if (atenta && e.atentaDesde < 0) e.atentaDesde = t;
    if (!atenta) e.atentaDesde = -9;

    // --- Truco pedido desde el panel
    let pose: PoseTruco | null = null;
    let peso = 0;
    if (e.truco) {
      const def = trucosSala[e.truco.nombre];
      const local = t - e.truco.inicio;
      if (local >= def.duracion) e.truco = null;
      else {
        pose = def.pose(local, { dir: 1 });
        peso = pesoTruco(local, def.duracion);
      }
    }

    // --- Hacia la cámara (horizontal) y su ángulo
    const aCamX = camera.position.x - e.pos.x;
    const aCamZ = camera.position.z - e.pos.y;
    const yawCamara = Math.atan2(aCamX, aCamZ);

    // --- Paseo: de punto en punto; se para si la miran o si hace un truco
    let yawObjetivo = e.yaw;
    let mirarPunto: V3 | undefined;
    const quieta = atenta || !!e.truco || ambiente.reducido;
    let vMax = 0;
    if (quieta) {
      yawObjetivo = atenta || e.truco ? yawCamara : e.yaw;
    } else if (e.fase === 'parada') {
      const punto = m.puntos[e.actual];
      mirarPunto = punto.mirar;
      yawObjetivo = punto.mirar
        ? Math.atan2(punto.mirar[0] - e.pos.x, punto.mirar[2] - e.pos.y)
        : yawCamara + Math.sin(t * 0.5) * 0.5;
      if (t >= e.finParada) {
        const vecinos = m.conexiones
          .filter(([a, b]) => a === e.actual || b === e.actual)
          .map(([a, b]) => (a === e.actual ? b : a));
        const opciones = vecinos.length > 1 ? vecinos.filter((v) => v !== e.previo) : vecinos;
        e.destino = opciones[Math.floor(Math.random() * opciones.length)] ?? e.actual;
        e.fase = 'caminando';
      }
    }
    if (!quieta && e.fase === 'caminando') {
      const [dx, dz] = m.puntos[e.destino].pos;
      const vx = dx - e.pos.x;
      const vz = dz - e.pos.y;
      const distancia = Math.hypot(vx, vz);
      yawObjetivo = Math.atan2(vx, vz);
      // Primero se gira (a saltitos en el sitio) y después avanza, frenando al llegar
      const desvio = Math.abs(angulo(yawObjetivo - e.yaw));
      vMax = desvio > 0.5 ? 0 : Math.min(m.velocidad, distancia * 1.6 + 0.08);
      if (distancia < 0.03) {
        e.previo = e.actual;
        e.actual = e.destino;
        e.fase = 'parada';
        e.llegada = t;
        e.finParada = t + 2.5 + Math.random() * 3.5;
        vMax = 0;
      } else if (e.velocidad > 0) {
        const avance = Math.min(e.velocidad * dt, distancia);
        e.pos.x += (vx / distancia) * avance;
        e.pos.y += (vz / distancia) * avance;
      }
    }
    e.velocidad += (vMax - e.velocidad) * k(vMax > e.velocidad ? 3.5 : 7);
    // Girar: deprisa al caminar, con calma al mirar algo
    const girando = Math.abs(angulo(yawObjetivo - e.yaw)) > 0.08;
    e.yaw += angulo(yawObjetivo - e.yaw) * k(e.fase === 'caminando' && !quieta ? 5 : 3.2);

    // --- Andar a saltitos: más rápido y más alto cuanto más deprisa va (o
    // saltitos cortos al girarse en el sitio)
    const ritmo = Math.min(e.velocidad / m.velocidad, 1);
    const intensidad = Math.max(ritmo, girando && !e.truco && !atenta ? 0.45 : 0);
    if (intensidad > 0.02) e.paso += dt * TAU * (1.6 + 1.2 * ritmo);
    const bote = Math.abs(Math.sin(e.paso));
    const salto = bote * 0.14 * intensidad;
    const contacto = (1 - bote) ** 5 * intensidad;
    let sy = 1 - 0.1 * contacto + 0.05 * bote * intensidad + Math.sin(t * 2.4) * 0.02;
    // Rebote al llegar a un punto
    sy -= 0.08 * rebote(t - e.llegada, 2.6, 6);
    let rotX = BX + 0.14 * ritmo;
    let rotYRel = 0;
    let rotZ = Math.sin(e.paso) * 0.09 * intensidad + Math.sin(t * 0.9) * 0.03;

    // Mirar lo que tiene delante al pararse: un poco hacia arriba si está alto
    if (mirarPunto && e.fase === 'parada' && !quieta) {
      const d = Math.hypot(mirarPunto[0] - e.pos.x, mirarPunto[2] - e.pos.y);
      rotX -= THREE.MathUtils.clamp(Math.atan2(mirarPunto[1] - m.alto * 0.6, d) * 0.35, 0, 0.3);
    }

    // --- Cara
    let cara: Cara = 'neutro';
    if (pose && peso > 0.3) cara = pose.cara;
    else if (atenta) cara = t - e.atentaDesde < 1.4 ? 'alegre' : 'neutro';
    else if (e.fase === 'parada' && t - e.llegada < 1) cara = 'alegre';
    else if (
      e.fase === 'parada' &&
      mirarPunto &&
      (t - e.llegada) % 6 > 2 &&
      (t - e.llegada) % 6 < 3.8
    )
      cara = 'curioso';
    acercarCara(e.pesos, cara, k(pose ? pose.rapidezCara : 7));
    aplicarCara(mats.visor, e.pesos);
    mats.visor.uniforms.uGiroOjos.value = pose?.giroOjos ?? 0;
    mats.cuerpo.uniforms.uRojo.value = (pose?.rojo ?? 0) * peso;

    // --- Parpadeo (no con espirales, dormida o sorprendida)
    let abierto = 1;
    if (e.pesos[4] + e.pesos[5] + e.pesos[6] < 0.2) {
      if (e.parpadeo < 0 && t >= e.proximoParpadeo) e.parpadeo = 0;
      if (e.parpadeo >= 0) {
        e.parpadeo += dt;
        const f = e.parpadeo / 0.17;
        if (f >= 1) {
          e.parpadeo = -1;
          e.proximoParpadeo = t + (Math.random() < 0.25 ? 0.12 : 2.2 + Math.random() * 3);
        } else abierto = 1 - Math.sin(f * Math.PI) ** 0.7;
      }
    }
    mats.visor.uniforms.uParpadeo.value = THREE.MathUtils.lerp(abierto, 1, e.pesos[1] * 0.7);

    // --- Mirada: a la cámara si la miran; si no, hacia donde va o a lo que mira
    const objetivoMirada = new THREE.Vector2(0, 0.1);
    if (atenta || e.truco) {
      const local = angulo(yawCamara - e.yaw);
      const alto = camera.position.y - m.alto * 0.6;
      objetivoMirada.set(
        THREE.MathUtils.clamp(local * 2, -1, 1),
        THREE.MathUtils.clamp(alto / Math.max(Math.hypot(aCamX, aCamZ), 0.3), -1, 1),
      );
    } else if (mirarPunto && e.fase === 'parada') objetivoMirada.set(0, 0.6);
    if (pose && peso > 0.3) objetivoMirada.set(...pose.mirada);
    e.mirada.lerp(objetivoMirada, k(9));
    const curioso = e.pesos[2];
    mats.visor.uniforms.uMirada.value.set(
      (e.mirada.x * (1 - curioso) + 0.5 * curioso) * heroConfig.ojos.mirada[0],
      (e.mirada.y * (1 - curioso) + 0.6 * curioso) * heroConfig.ojos.mirada[1],
    );

    // --- Mezcla con el truco (su pose manda según su peso)
    let px = 0;
    let py = salto;
    let pz = 0;
    let ex = 1 / Math.sqrt(sy);
    let ey = sy;
    let ez = ex;
    if (pose && peso > 0) {
      const w = peso;
      const mezcla = THREE.MathUtils.lerp;
      px = mezcla(px, pose.pos[0], w);
      py = mezcla(py, pose.pos[1], w);
      pz = mezcla(pz, pose.pos[2], w);
      ex = mezcla(ex, pose.escala[0], w);
      ey = mezcla(ey, pose.escala[1], w);
      ez = mezcla(ez, pose.escala[2], w);
      rotX += angulo(pose.rot[0] - rotX) * w;
      rotYRel += angulo(pose.rot[1] - BY - rotYRel) * w;
      rotZ += angulo(pose.rot[2] - rotZ) * w;
    }

    // --- Aplicar
    raiz.current?.position.set(e.pos.x, 0, e.pos.y);
    orientado.current?.rotation.set(0, e.yaw, 0);
    paseo.current?.position.set(px, BASE + py, pz);
    cuerpo.current?.scale.set(ex, ey, ez);
    const g = grupo.current;
    if (g) g.rotation.set(rotX, BY * 0.3 + rotYRel, rotZ);
    if (sombra.current) {
      const altura = Math.max(py, 0) * escala;
      sombra.current.scale.setScalar(m.alto * 1.05 * (1 - Math.min(altura * 1.6, 0.5)));
      (sombra.current.material as THREE.MeshBasicMaterial).opacity =
        1 - Math.min(altura * 2.5, 0.7);
    }

    // --- Muelle de la punta: sigue a los giros, a los botes y al truco
    const mu = e.muelle;
    const giroTotal = e.yaw + rotYRel;
    const velGiro = dt > 0 ? angulo(giroTotal - e.giroPrevio) / dt : 0;
    const velAltura = dt > 0 ? (py - e.alturaPrevia) / dt : 0;
    e.giroPrevio = giroTotal;
    e.alturaPrevia = py;
    const fx = THREE.MathUtils.clamp(-velGiro * 0.3, -0.22, 0.22) + Math.sin(t * 1.3) * 0.025;
    const fz =
      THREE.MathUtils.clamp(-velAltura * 0.16 - ritmo * 0.08, -0.18, 0.18) +
      Math.sin(t * 1.1 + 1) * 0.02;
    mu.v += ((fx - mu.x) * 38 - mu.v * 7) * dt;
    mu.x += mu.v * dt;
    mu.vz += ((fz - mu.z) * 38 - mu.vz * 7) * dt;
    mu.z += mu.vz * dt;
    const [flexX, flexZ] = pose ? pose.flex : [0, 0];
    mats.flex.value.set(mu.x + flexX * peso, mu.z + flexZ * peso);

    // --- Efectos del truco (Zzz, notas, estrellas, enojo)
    const lista = pose && peso > 0 ? pose.efectos : [];
    recursos.sprites.forEach((sprite, i) => {
      const ef = lista[i];
      sprite.visible = !!ef && ef.opacidad > 0.01;
      if (!ef) return;
      const material = sprite.material;
      const mapa = recursos.texturas[ef.tipo];
      if (material.map !== mapa) material.map = mapa;
      sprite.position.set(ef.x, ef.y, ef.z);
      sprite.scale.setScalar(ef.escala);
      material.opacity = ef.opacidad * peso;
      material.rotation = ef.giro;
    });

    // --- Foco para la cámara: delante de ella, desde el lado de la cámara
    if (!seleccionada) {
      const largo = Math.hypot(aCamX, aCamZ) || 1;
      const { min, max } = cfg.camara.limites;
      foco.pos[0] = THREE.MathUtils.clamp(
        e.pos.x + (aCamX / largo) * 1.3,
        min[0] + 0.1,
        max[0] - 0.1,
      );
      foco.pos[1] = 0.85;
      foco.pos[2] = THREE.MathUtils.clamp(
        e.pos.y + (aCamZ / largo) * 1.3,
        min[2] + 0.1,
        max[2] - 0.1,
      );
      foco.objetivo[0] = e.pos.x;
      foco.objetivo[1] = m.alto * 0.62;
      foco.objetivo[2] = e.pos.y;
    }

    // Con su panel abierto la sala pinta a pedido: que se siga viendo viva
    if (seleccionada || e.truco) invalidate();
  });

  return (
    <group ref={raiz}>
      <mesh
        ref={sombra}
        geometry={recursos.plano}
        material={recursos.matSombra}
        rotation-x={-Math.PI / 2}
        position-y={0.004}
        raycast={sinRaycast}
        userData={DECORATIVA}
      />
      <group ref={orientado} scale={escala}>
        <group ref={paseo}>
          {recursos.sprites.map((sprite, i) => (
            <primitive key={i} object={sprite} />
          ))}
          <group ref={grupo} rotation-order="YXZ">
            <group ref={cuerpo}>
              <mesh geometry={recursos.cuerpo} material={mats.cuerpo} />
              <mesh geometry={recursos.visor} material={mats.visor} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Diferencia de ángulos llevada a -π..π (girar por el camino corto). */
function angulo(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
