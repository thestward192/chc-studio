import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { sala, ui } from '../../../theme/theme';
import { crearUniformsMonitor, fragmentMonitor, vertexMonitor } from '../shaders/monitor';
import { estudioConfig as cfg } from './estudio.config';
import { ambiente } from './ambiente';
import { obtenerMateriales } from './materiales';
import { liberar, rastrear } from './recursos';
import { LienzoCodigo } from './texturas';
import { useInteractivo } from './useInteractivo';
import { audio } from './audio';
import { useEstudio } from './estadoEstudio';

interface Props {
  /** Posición local dentro del escritorio. */
  posicion: [number, number, number];
  semilla: number;
  /** Monitor principal: interactivo, escribe código en vivo al enfocarlo. */
  principal?: { id: string; foco: { pos: [number, number, number]; objetivo: [number, number, number] } };
}

const ANCHO_PANTALLA = 0.62;
const ALTO_PANTALLA = 0.36;

export function Monitor({ posicion, semilla, principal }: Props) {
  const raiz = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const m = obtenerMateriales();

  const recursos = useMemo(() => {
    const uniforms = crearUniformsMonitor();
    uniforms.uSemilla.value = semilla;
    uniforms.uColorFondo.value.set(sala.pantallaFondo);
    sala.codigo.forEach((c, i) => uniforms.uColores.value[i].set(c));
    uniforms.uColorCursor.value.set(sala.cursor);
    uniforms.uColorReflejo.value.set(ui.texto);
    const codigo = principal ? new LienzoCodigo() : null;
    uniforms.uTexto.value = codigo?.textura ?? null;
    const material = rastrear(
      new THREE.ShaderMaterial({ uniforms, vertexShader: vertexMonitor, fragmentShader: fragmentMonitor }),
    );
    const marco = rastrear(new RoundedBoxGeometry(ANCHO_PANTALLA + 0.04, ALTO_PANTALLA + 0.04, 0.03, 3, 0.01));
    return { uniforms, material, marco, codigo, mezcla: 0, escritos: 0, temporizador: 0 as number };
    // Depende de si es principal, no del objeto (que cambia en cada render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semilla, !!principal]);

  useEffect(
    () => () => {
      window.clearInterval(recursos.temporizador);
      liberar(recursos.material, recursos.marco, recursos.codigo?.textura);
    },
    [recursos],
  );

  const escribir = () => {
    const codigo = recursos.codigo;
    if (!codigo) return;
    window.clearInterval(recursos.temporizador);
    recursos.escritos = 0;
    recursos.temporizador = window.setInterval(() => {
      recursos.escritos = Math.min(codigo.total, recursos.escritos + (ambiente.reducido ? 8 : 1));
      codigo.dibujar(recursos.escritos);
      if (recursos.escritos % 2 === 0) audio.tecla();
      invalidate();
      if (recursos.escritos >= codigo.total) window.clearInterval(recursos.temporizador);
    }, 42);
  };

  useInteractivo(
    raiz,
    principal && {
      id: principal.id,
      nombre: 'Monitor principal',
      etiqueta: 'Código',
      grupo: 'objeto',
      foco: principal.foco,
      info: () => {
        const total = recursos.codigo?.total ?? 1;
        const pct = Math.round((recursos.escritos / total) * 100);
        return pct >= 100
          ? 'Listo: `construir()` compila a la primera (esta vez).'
          : `Escribiendo estudio.ts… ${pct}%`;
      },
      acciones: [{ label: () => 'Escribir de nuevo', run: escribir }],
      alEnfocar: escribir,
      alDesenfocar: () => window.clearInterval(recursos.temporizador),
    },
  );

  useFrame((_, dt) => {
    const u = recursos.uniforms;
    u.uTiempo.value = ambiente.t;
    u.uVelocidad.value = cfg.shaders.monitor.velocidad;
    u.uLineas.value = cfg.shaders.monitor.lineas;
    u.uReflejo.value = cfg.shaders.monitor.reflejo;
    u.uBrillo.value = cfg.shaders.monitor.brillo;
    // El texto real aparece mientras el monitor principal está enfocado
    const enfocado = principal && useEstudio.getState().seleccionado === principal.id;
    recursos.mezcla += ((enfocado ? 1 : 0) - recursos.mezcla) * (1 - Math.exp(-dt * 6));
    u.uMezclaTexto.value = recursos.mezcla;
  });

  return (
    <group ref={raiz} position={posicion}>
      {/* Pie */}
      <mesh position={[0, 0.006, 0]} material={m.metal} castShadow>
        <cylinderGeometry args={[0.1, 0.11, 0.012, 24]} />
      </mesh>
      <mesh position={[0, 0.17, -0.03]} material={m.metal} castShadow>
        <boxGeometry args={[0.04, 0.32, 0.02]} />
      </mesh>
      {/* Marco y pantalla */}
      <group position={[0, 0.37, 0]}>
        <mesh geometry={recursos.marco} material={m.plastico} castShadow />
        <mesh position={[0, 0, 0.0152]} material={recursos.material}>
          <planeGeometry args={[ANCHO_PANTALLA, ALTO_PANTALLA]} />
        </mesh>
      </group>
    </group>
  );
}
