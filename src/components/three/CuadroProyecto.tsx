import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Proyecto } from '../../content/proyectos';
import { marca, sala, ui } from '../../theme/theme';
import { crearUniformsCuadro, fragmentCuadro, vertexCuadro } from './shaders/cuadro';
import { estudioConfig as cfg, focoFrontal, type Colocacion } from './estudio/estudio.config';
import {
  DECORATIVA,
  sinRaycast,
  useInteractivo,
  seleccionar,
  vecinoDe,
} from './estudio/useInteractivo';
import { useEstudio } from './estudio/estadoEstudio';
import { ambiente } from './estudio/ambiente';
import {
  aTextura,
  lienzoCaptura,
  lienzoProyecto,
  texturaHalo,
  texturaProyecto,
} from './estudio/texturas';
import { liberar, rastrear } from './estudio/recursos';
import { obtenerMateriales } from './estudio/materiales';
import { navegacion } from './estudio/navegacion';
import { audio } from './estudio/audio';

interface Props {
  proyecto: Proyecto;
  indice: number;
  colocacion: Colocacion;
}

const posMundo = new THREE.Vector3();

/**
 * Cuadro de un proyecto en la pared del fondo. Empieza con una textura
 * liviana y cambia a la de alta resolución cuando la cámara se acerca.
 * Shader propio: paralaje, vidrio y destello diagonal al pasar el ratón;
 * el marco se ilumina con el acento del tema.
 */
export function CuadroProyecto({ proyecto, indice, colocacion }: Props) {
  const raiz = useRef<THREE.Group>(null);
  const id = `cuadro-${proyecto.id}`;
  const { ancho, alto } = cfg.cuadro;

  const recursos = useMemo(() => {
    const uniforms = crearUniformsCuadro();
    uniforms.uColorReflejo.value.set(sala.lampara);
    uniforms.uColorSombra.value.set(sala.marco);
    uniforms.uAspecto.value = ancho / alto;
    uniforms.uMapa.value = cargarTextura(proyecto, indice, 'baja');
    const material = rastrear(
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vertexCuadro,
        fragmentShader: fragmentCuadro,
      }),
    );
    // Marco propio (no compartido) para iluminarlo al hover
    const marco = rastrear(obtenerMateriales().marco.clone());
    marco.emissive = new THREE.Color(ui.acento);
    marco.emissiveIntensity = 0;
    const halo = rastrear(
      new THREE.MeshBasicMaterial({
        map: texturaHalo(),
        color: sala.lampara,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    return {
      uniforms,
      material,
      marco,
      halo,
      alta: false,
      hoverAnterior: false,
      inicioDestello: -10,
    };
  }, [proyecto, indice, ancho, alto]);

  useEffect(
    () => () =>
      liberar(recursos.material, recursos.marco, recursos.halo, recursos.uniforms.uMapa.value),
    [recursos],
  );

  // Lienzo de la vista previa del panel (se crea al abrirlo por primera vez)
  const lienzoPreview = useRef<HTMLCanvasElement | null>(null);
  // Captura real para la vista previa (la primera de la galería), si existe
  const imagenPreview = useRef<HTMLImageElement | null>(null);

  useInteractivo(raiz, {
    id,
    nombre: proyecto.titulo,
    etiqueta: 'Proyecto',
    grupo: 'proyecto',
    orden: indice,
    ancho: true,
    foco: focoFrontal(colocacion, cfg.cuadro.distanciaFoco),
    info: () =>
      [
        [proyecto.cliente, proyecto.anio, proyecto.estado].filter(Boolean).join(' · '),
        proyecto.rol && `Nuestro rol: ${proyecto.rol}`,
        proyecto.descripcion,
        proyecto.caracteristicas?.map((c) => `• ${c}`).join('\n'),
        `Tecnologías: ${proyecto.tecnologias.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    preview: (ctx, t, w, h) => {
      const captura = proyecto.galeria?.[0];
      if (captura && !imagenPreview.current) {
        imagenPreview.current = new Image();
        imagenPreview.current.src = captura;
      }
      lienzoPreview.current ??= lienzoProyecto(proyecto, indice, 640);
      const img = imagenPreview.current;
      const real = !!img?.complete && img.naturalWidth > 0;
      const fuente = real ? img : lienzoPreview.current;
      // "En vivo": acercamiento lento tipo Ken Burns. La captura real se ve
      // entera (como object-fit: contain) sobre el fondo de marca; el
      // marcador cubre el lienzo
      const zoom = 1.06 + Math.sin(t * 0.4) * 0.04;
      const dx = Math.sin(t * 0.23) * 12;
      const fw = real ? img.naturalWidth : fuente.width;
      const fh = real ? img.naturalHeight : fuente.height;
      const escala = real
        ? Math.min(w / fw, h / fh) * (zoom - 0.07)
        : Math.max(w / fw, h / fh) * zoom;
      if (real) {
        ctx.fillStyle = marca.fondoOscuro;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(
        fuente,
        (w - fw * escala) / 2 + dx,
        (h - fh * escala) / 2,
        fw * escala,
        fh * escala,
      );
    },
    // Los enlaces solo aparecen si el proyecto los tiene
    acciones: [
      ...(proyecto.urlProyecto
        ? [
            {
              label: () => 'Ver proyecto ↗',
              run: () => {
                audio.clic();
                window.open(proyecto.urlProyecto, '_blank', 'noopener');
              },
            },
          ]
        : []),
      ...(proyecto.urlCaso
        ? [
            {
              label: () => 'Ver caso completo',
              run: () => {
                audio.clic();
                if (proyecto.urlCaso) navegacion.ir(proyecto.urlCaso);
              },
            },
          ]
        : []),
      { label: () => '← Anterior', run: () => irAVecino(id, -1) },
      { label: () => 'Siguiente →', run: () => irAVecino(id, 1) },
    ],
  });

  useFrame((state) => {
    const u = recursos.uniforms;
    const hover = useEstudio.getState().hover === id;
    // Al empezar el hover, el destello recorre el vidrio (0,8 s)
    if (hover && !recursos.hoverAnterior) recursos.inicioDestello = ambiente.t;
    recursos.hoverAnterior = hover;
    const avance = (ambiente.t - recursos.inicioDestello) / 0.8;
    u.uDestello.value = avance >= 0 && avance <= 1 ? -0.2 + avance * 1.4 : -1;
    u.uIntensidadDestello.value = cfg.shaders.cuadro.destello;
    u.uProfundidad.value = cfg.shaders.cuadro.profundidad;
    u.uHover.value += ((hover ? 1 : 0) - u.uHover.value) * 0.15;
    recursos.marco.emissiveIntensity = u.uHover.value * cfg.shaders.cuadro.brilloMarco;

    // Textura de alta resolución al acercarse
    if (!recursos.alta && raiz.current) {
      raiz.current.getWorldPosition(posMundo);
      if (state.camera.position.distanceTo(posMundo) < cfg.cuadro.distanciaAltaResolucion) {
        recursos.alta = true;
        const baja = u.uMapa.value;
        u.uMapa.value = cargarTextura(proyecto, indice, 'alta');
        liberar(baja);
      }
    }
  });

  return (
    <group ref={raiz} position={colocacion.pos} rotation-y={colocacion.rotY}>
      {/* Halo de galería sobre la pared */}
      <mesh
        position={[0, 0.25, 0.002]}
        material={recursos.halo}
        userData={DECORATIVA}
        raycast={sinRaycast}
      >
        <planeGeometry args={[ancho + 1.1, alto + 1.2]} />
      </mesh>
      {/* Marco */}
      <mesh position={[0, 0, 0.03]} material={recursos.marco} castShadow>
        <boxGeometry args={[ancho + 0.14, alto + 0.14, 0.05]} />
      </mesh>
      {/* Imagen tras el vidrio */}
      <mesh position={[0, 0, 0.056]} material={recursos.material}>
        <planeGeometry args={[ancho, alto]} />
      </mesh>
    </group>
  );
}

function irAVecino(id: string, paso: 1 | -1) {
  audio.clic();
  const vecino = vecinoDe(id, paso);
  if (vecino) seleccionar(vecino);
}

/**
 * Textura del cuadro. Prioridad: imagen propia del cuadro (imagenBaja /
 * imagenAlta); si no, la primera captura de la galería, entera dentro de una
 * ventana de navegador (lienzoCaptura); si no, el marcador en canvas.
 */
function cargarTextura(proyecto: Proyecto, indice: number, calidad: 'baja' | 'alta') {
  const ancho = calidad === 'baja' ? 256 : 1280;
  const url = calidad === 'baja' ? proyecto.imagenBaja : proyecto.imagenAlta;
  if (url) {
    const textura = rastrear(new THREE.TextureLoader().load(url));
    textura.colorSpace = THREE.SRGBColorSpace;
    return textura;
  }
  const captura = proyecto.galeria?.[0];
  if (!captura) return texturaProyecto(proyecto, indice, ancho);
  // Mientras llega la captura se ve el marcador; luego se redibuja encima
  const c = lienzoProyecto(proyecto, indice, ancho);
  const textura = aTextura(c);
  const img = new Image();
  img.onload = () => {
    lienzoCaptura(proyecto, img, ancho, c);
    textura.needsUpdate = true;
  };
  img.src = captura;
  return textura;
}
