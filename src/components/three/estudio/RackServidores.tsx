import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sala, ui } from '../../../theme/theme';
import { ObjetoInteractivo } from '../ObjetoInteractivo';
import { estudioConfig as cfg, localAMundo } from './estudio.config';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { ambiente } from './ambiente';
import { useEstudio } from './estadoEstudio';
import { audio } from './audio';

const ANCHO = 0.6;
const FONDO = 0.8;
const ALTO = 2.0;
const UNIDADES = 10;
const LEDS_POR_UNIDAD = 8;
const DURACION_ARRANQUE = 3.2; // s

/** Métricas falsas del rack (compartidas entre el panel y la vista previa). */
const metricas = { cpu: 34, peticiones: 1200, historial: [] as number[], ultimo: 0, inicio: 0 };

function actualizarMetricas() {
  const ahora = performance.now() / 1000;
  if (ahora - metricas.ultimo < 0.5) return;
  metricas.ultimo = ahora;
  const reinicio = useEstudio.getState().reiniciandoRack;
  const arrancando = reinicio && ambiente.t - reinicio < DURACION_ARRANQUE;
  metricas.cpu = arrancando
    ? 95 + Math.random() * 5
    : Math.max(4, Math.min(92, metricas.cpu + (Math.random() - 0.48) * 14));
  metricas.peticiones = arrancando ? 0 : Math.round(900 + metricas.cpu * 18 + Math.random() * 220);
  metricas.historial.push(metricas.cpu);
  if (metricas.historial.length > 60) metricas.historial.shift();
}

function uptime() {
  const segundos = Math.floor(performance.now() / 1000 - metricas.inicio) + 86400 * 41;
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${d} d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Rack de servidores con LEDs (un InstancedMesh; el color de cada LED se
 * actualiza por instancia con valores HDR para que el bloom los recoja).
 * "Reiniciar" lanza una secuencia de arranque de los LEDs.
 */
export function RackServidores({ modelo }: { modelo?: string }) {
  const m = obtenerMateriales();
  const invalidate = useThree((s) => s.invalidate);
  const colocacion = cfg.objetos.rack;

  const recursos = useMemo(() => {
    const geometria = rastrear(new THREE.BoxGeometry(0.018, 0.012, 0.006));
    const material = rastrear(new THREE.MeshBasicMaterial({ toneMapped: false }));
    const total = UNIDADES * LEDS_POR_UNIDAD;
    const leds = new THREE.InstancedMesh(geometria, material, total);
    const matriz = new THREE.Matrix4();
    const tipos: number[] = [];
    const fases: number[] = [];
    for (let u = 0; u < UNIDADES; u++) {
      for (let k = 0; k < LEDS_POR_UNIDAD; k++) {
        const i = u * LEDS_POR_UNIDAD + k;
        matriz.makeTranslation(-0.22 + k * 0.026, 0.22 + u * 0.17, FONDO / 2 + 0.004);
        leds.setMatrixAt(i, matriz);
        leds.setColorAt(i, new THREE.Color());
        tipos.push(k < 5 ? 0 : k < 7 ? 1 : 2); // 0 = actividad, 1 = estado, 2 = enlace
        fases.push(Math.random() * 100);
      }
    }
    return {
      geometria,
      material,
      leds,
      tipos,
      fases,
      colores: [new THREE.Color(sala.ledVerde), new THREE.Color(sala.ledAmbar), new THREE.Color(sala.ledAzul)],
      aux: new THREE.Color(),
      cuadro: 0,
    };
  }, []);

  useEffect(() => {
    metricas.inicio = performance.now() / 1000;
    return () => liberar(recursos.geometria, recursos.material, recursos.leds);
  }, [recursos]);

  useFrame(() => {
    // Los LEDs cambian a ~20 Hz: no hace falta actualizarlos en cada fotograma
    const paso = Math.floor(ambiente.t * 20);
    if (paso === recursos.cuadro) return;
    recursos.cuadro = paso;
    actualizarMetricas();

    const reinicio = useEstudio.getState().reiniciandoRack;
    const desde = reinicio ? ambiente.t - reinicio : Infinity;
    const { leds, tipos, fases, colores, aux } = recursos;
    for (let i = 0; i < tipos.length; i++) {
      const unidad = Math.floor(i / LEDS_POR_UNIDAD);
      let brillo: number;
      let color = colores[tipos[i]];
      if (desde < 0.6) {
        brillo = 0; // apagado
      } else if (desde < 2.2) {
        // Barrido de arranque de abajo arriba, en azul
        const fila = ((desde - 0.6) / 1.6) * UNIDADES;
        brillo = unidad < fila ? 1 : 0;
        color = colores[2];
      } else if (desde < DURACION_ARRANQUE) {
        brillo = Math.floor(desde * 8) % 2 ? 1.2 : 0.2; // parpadeo todo en verde
        color = colores[0];
      } else if (tipos[i] === 0) {
        // Actividad: parpadeo aleatorio
        brillo = ambiente.reducido ? 0.8 : Math.sin(fases[i] + paso * (0.7 + (i % 5) * 0.37)) > 0.1 ? 1 : 0.1;
      } else if (tipos[i] === 1) {
        brillo = Math.sin(fases[i] + ambiente.t * 0.8) > 0.93 ? 1 : 0.15;
      } else {
        brillo = 0.9;
      }
      leds.setColorAt(i, aux.copy(color).multiplyScalar(brillo * 3));
    }
    if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
  });

  const reiniciar = () => {
    audio.arranque();
    useEstudio.getState().set({ reiniciandoRack: ambiente.t });
    metricas.inicio = performance.now() / 1000;
    invalidate();
  };

  return (
    <ObjetoInteractivo
      id="rack"
      nombre="Rack de servidores"
      etiqueta="Infraestructura"
      posicion={colocacion.pos}
      rotY={colocacion.rotY}
      modelo={modelo}
      foco={{ pos: localAMundo(colocacion, [0, 1.35, 2.0]), objetivo: localAMundo(colocacion, [0, 1.05, 0]) }}
      info={() => {
        actualizarMetricas();
        const reinicio = useEstudio.getState().reiniciandoRack;
        const arrancando = reinicio && ambiente.t - reinicio < DURACION_ARRANQUE;
        return [
          arrancando ? 'Estado: arrancando…' : 'Estado: en línea',
          `CPU: ${metricas.cpu.toFixed(0)} %`,
          `Peticiones: ${metricas.peticiones.toLocaleString('es')} /s`,
          `Uptime: ${uptime()}`,
        ].join('\n');
      }}
      preview={(ctx, _t, w, h) => {
        // Gráfica de CPU en vivo
        ctx.fillStyle = sala.pantallaFondo;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = sala.codigo[3];
        ctx.globalAlpha = 0.4;
        for (let y = 1; y < 4; y++) {
          ctx.beginPath();
          ctx.moveTo(0, (h * y) / 4);
          ctx.lineTo(w, (h * y) / 4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = sala.ledVerde;
        ctx.lineWidth = 2;
        ctx.beginPath();
        metricas.historial.forEach((valor, i) => {
          const x = (i / 59) * w;
          const y = h - (valor / 100) * h * 0.9 - 4;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fillStyle = ui.texto;
        ctx.font = `600 14px ${ui.fuenteCodigo}`;
        ctx.fillText(`cpu ${metricas.cpu.toFixed(0)}%`, 10, 20);
      }}
      acciones={[{ label: () => 'Reiniciar', run: reiniciar }]}
    >
      {/* Armario */}
      <mesh position={[0, ALTO / 2, 0]} material={m.rack} castShadow receiveShadow>
        <boxGeometry args={[ANCHO, ALTO, FONDO]} />
      </mesh>
      {/* Frentes de los servidores */}
      {Array.from({ length: UNIDADES }, (_, u) => (
        <mesh key={u} position={[0, 0.22 + u * 0.17, FONDO / 2 + 0.001]} material={u % 3 === 1 ? m.metalClaro : m.metal}>
          <planeGeometry args={[ANCHO - 0.08, 0.14]} />
        </mesh>
      ))}
      <primitive object={recursos.leds} />
    </ObjetoInteractivo>
  );
}
