import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { laptop as coloresLaptop } from '../../theme/theme';
import { crearUniformsAluminio, extenderAluminio } from './shaders/aluminio';
import { crearUniformsPantalla, fragmentPantalla, vertexPantalla } from './shaders/pantalla';
import { crearUniformsRanura, fragmentRanura, vertexRanura } from './shaders/brilloRanura';
import { crearTexturaPagina } from './texturaPagina';

/** Medidas de la laptop (unidades de escena ≈ decímetros). */
export const DIM = {
  ancho: 3,
  fondo: 2.1,
  altoBase: 0.085,
  grosorTapa: 0.05,
  largoTapa: 2.02,
  bisagraY: 0.097,
  bisagraZ: -1.01,
  pantallaAncho: 2.74,
  pantallaAlto: 1.71, // 16:10
  pantallaCentroY: 1.05,
} as const;

export interface ManejadoresLaptop {
  grupo: THREE.Group;
  tapa: THREE.Group;
  pantalla: THREE.Mesh;
  luzPantalla: THREE.PointLight;
  uniformsPantalla: ReturnType<typeof crearUniformsPantalla>;
  uniformsRanura: ReturnType<typeof crearUniformsRanura>;
  uniformsAluminio: ReturnType<typeof crearUniformsAluminio>;
  aluminio: THREE.MeshPhysicalMaterial;
  /** Materiales cuya opacidad sigue a la animación de entrada. */
  materialesOpacos: THREE.Material[];
  /** Mallas que proyectan/reciben sombra real (solo niveles alto y medio). */
  mallasSombra: THREE.Mesh[];
}

/**
 * Laptop estilo "gris espacial": base y tapa de aluminio cepillado, teclas
 * negras individuales (un InstancedMesh = 1 draw call), trackpad pulido,
 * marco de vidrio negro, pantalla con shader propio y logo en la tapa.
 * Toda la animación la hace LaptopIntro a través de los manejadores.
 */
export const LaptopModelo = forwardRef<ManejadoresLaptop>(function LaptopModelo(_props, ref) {
  const grupoRef = useRef<THREE.Group>(null!);
  const tapaRef = useRef<THREE.Group>(null!);
  const pantallaRef = useRef<THREE.Mesh>(null!);
  const luzRef = useRef<THREE.PointLight>(null!);
  const baseRef = useRef<THREE.Mesh>(null!);
  const cuerpoTapaRef = useRef<THREE.Mesh>(null!);
  // La textura de la pantalla se redibuja al cargar fuentes y póster: pedir fotograma
  const invalidate = useThree((s) => s.invalidate);
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const recursos = useMemo(() => {
    const uniformsAluminio = crearUniformsAluminio();
    uniformsAluminio.uColorCanto.value.set(coloresLaptop.aluminioCanto);
    const aluminio = new THREE.MeshPhysicalMaterial({
      color: coloresLaptop.aluminio,
      metalness: 1,
      roughness: 0.38,
      anisotropy: 0.75,
      transparent: true,
    });
    extenderAluminio(aluminio, uniformsAluminio);

    const bisagra = new THREE.MeshStandardMaterial({
      color: coloresLaptop.bisagra,
      metalness: 0.8,
      roughness: 0.5,
      transparent: true,
    });
    const tecla = new THREE.MeshStandardMaterial({
      color: coloresLaptop.tecla,
      roughness: 0.62,
      metalness: 0,
      transparent: true,
    });
    const trackpad = new THREE.MeshPhysicalMaterial({
      color: coloresLaptop.aluminio,
      metalness: 0.55,
      roughness: 0.24,
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
      transparent: true,
    });
    const vidrio = new THREE.MeshPhysicalMaterial({
      color: coloresLaptop.vidrio,
      metalness: 0,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 0.25, // vidrio negro: refleja poco el estudio
      transparent: true,
    });
    const logo = new THREE.MeshStandardMaterial({
      color: coloresLaptop.logo,
      metalness: 1,
      roughness: 0.28,
      transparent: true,
    });

    const uniformsPantalla = crearUniformsPantalla();
    const texturaPagina = crearTexturaPagina(() => invalidateRef.current());
    uniformsPantalla.uMapa.value = texturaPagina;
    uniformsPantalla.uColorApagado.value.set(coloresLaptop.vidrio);
    const pantalla = new THREE.ShaderMaterial({
      uniforms: uniformsPantalla,
      vertexShader: vertexPantalla,
      fragmentShader: fragmentPantalla,
      transparent: true,
    });

    const uniformsRanura = crearUniformsRanura();
    uniformsRanura.uColor.value.set(coloresLaptop.luzRanura);
    const ranura = new THREE.ShaderMaterial({
      uniforms: uniformsRanura,
      vertexShader: vertexRanura,
      fragmentShader: fragmentRanura,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // --- Geometrías ---
    const geoBase = new RoundedBoxGeometry(DIM.ancho, DIM.altoBase, DIM.fondo, 4, 0.03);
    const geoTapa = new RoundedBoxGeometry(DIM.ancho, DIM.largoTapa, DIM.grosorTapa, 4, 0.022);
    const geoTecla = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
    const geoTrackpad = new THREE.ShapeGeometry(rectRedondeado(1.28, 0.8, 0.06), 6);
    const geoVidrio = new THREE.ShapeGeometry(rectRedondeado(2.94, 1.96, 0.07), 6);
    const geoPantalla = new THREE.PlaneGeometry(DIM.pantallaAncho, DIM.pantallaAlto);
    const geoPozo = new THREE.ShapeGeometry(rectRedondeado(2.66, 1.03, 0.03), 4);
    // Logo: una "C" (abertura hacia -X local; la tapa la ve espejada, así que
    // desde fuera queda abierta hacia la derecha, como la C de CHC)
    const aberturaLogo = Math.PI * 0.24; // media abertura
    const geoLogo = new THREE.RingGeometry(
      0.118,
      0.19,
      64,
      1,
      -Math.PI + aberturaLogo,
      Math.PI * 2 - aberturaLogo * 2,
    );
    const geoBisagra = new THREE.CylinderGeometry(0.032, 0.032, 2.3, 20);
    const geoCamara = new THREE.CircleGeometry(0.012, 16);
    const geoRanura = new THREE.PlaneGeometry(2.7, 0.16);

    const teclas = crearTeclado(geoTecla, tecla);

    return {
      aluminio,
      uniformsAluminio,
      bisagra,
      tecla,
      trackpad,
      vidrio,
      logo,
      pantalla,
      uniformsPantalla,
      ranura,
      uniformsRanura,
      texturaPagina,
      teclas,
      geos: {
        geoBase,
        geoTapa,
        geoTecla,
        geoTrackpad,
        geoVidrio,
        geoPantalla,
        geoPozo,
        geoLogo,
        geoBisagra,
        geoCamara,
        geoRanura,
      },
    };
  }, []);

  // Liberar todo al desmontar (R3F no toca lo creado con useMemo).
  useEffect(() => {
    return () => {
      Object.values(recursos.geos).forEach((g) => g.dispose());
      [
        recursos.aluminio,
        recursos.bisagra,
        recursos.tecla,
        recursos.trackpad,
        recursos.vidrio,
        recursos.logo,
        recursos.pantalla,
        recursos.ranura,
      ].forEach((m) => m.dispose());
      recursos.texturaPagina.dispose();
      recursos.teclas.dispose();
    };
  }, [recursos]);

  useImperativeHandle(
    ref,
    () => ({
      grupo: grupoRef.current,
      tapa: tapaRef.current,
      pantalla: pantallaRef.current,
      luzPantalla: luzRef.current,
      uniformsPantalla: recursos.uniformsPantalla,
      uniformsRanura: recursos.uniformsRanura,
      uniformsAluminio: recursos.uniformsAluminio,
      aluminio: recursos.aluminio,
      materialesOpacos: [
        recursos.aluminio,
        recursos.bisagra,
        recursos.tecla,
        recursos.trackpad,
        recursos.vidrio,
        recursos.logo,
      ],
      mallasSombra: [baseRef.current, cuerpoTapaRef.current, recursos.teclas],
    }),
    [recursos],
  );

  const { geos } = recursos;
  const topeBase = DIM.altoBase;

  return (
    <group ref={grupoRef}>
      {/* ---------- Base ---------- */}
      <mesh
        ref={baseRef}
        geometry={geos.geoBase}
        material={recursos.aluminio}
        position={[0, DIM.altoBase / 2, 0]}
      />
      {/* Pozo del teclado (ligeramente más oscuro) */}
      <mesh
        geometry={geos.geoPozo}
        material={recursos.bisagra}
        position={[0, topeBase + 0.0006, -0.49]}
        rotation-x={-Math.PI / 2}
      />
      <primitive object={recursos.teclas} position={[0, topeBase - 0.006, -0.49]} />
      {/* Trackpad pulido */}
      <mesh
        geometry={geos.geoTrackpad}
        material={recursos.trackpad}
        position={[0, topeBase + 0.0008, 0.56]}
        rotation-x={-Math.PI / 2}
      />
      {/* Bisagra */}
      <mesh
        geometry={geos.geoBisagra}
        material={recursos.bisagra}
        position={[0, DIM.bisagraY - 0.02, DIM.bisagraZ - 0.01]}
        rotation-z={Math.PI / 2}
      />
      {/* Luz que escapa por la ranura frontal (tapa cerrada) */}
      <mesh
        geometry={geos.geoRanura}
        material={recursos.ranura}
        position={[0, DIM.bisagraY - 0.002, DIM.fondo / 2 + 0.012]}
        renderOrder={2}
      />

      {/* ---------- Tapa (pivota en la bisagra) ---------- */}
      <group ref={tapaRef} position={[0, DIM.bisagraY, DIM.bisagraZ]} rotation-x={Math.PI / 2}>
        <mesh
          ref={cuerpoTapaRef}
          geometry={geos.geoTapa}
          material={recursos.aluminio}
          position={[0, DIM.largoTapa / 2, -DIM.grosorTapa / 2]}
        />
        {/* Marco de vidrio negro */}
        <mesh
          geometry={geos.geoVidrio}
          material={recursos.vidrio}
          position={[0, DIM.largoTapa / 2, 0.0008]}
        />
        {/* Cámara */}
        <mesh
          geometry={geos.geoCamara}
          material={recursos.bisagra}
          position={[0, DIM.largoTapa - 0.05, 0.0014]}
        />
        {/* Pantalla */}
        <mesh
          ref={pantallaRef}
          geometry={geos.geoPantalla}
          material={recursos.pantalla}
          position={[0, DIM.pantallaCentroY, 0.0018]}
          renderOrder={1}
        />
        {/* Luz de la pantalla sobre el teclado */}
        <pointLight
          ref={luzRef}
          position={[0, DIM.pantallaCentroY - 0.2, 0.7]}
          intensity={0}
          distance={4}
          decay={2}
        />
        {/* Logo en la cara exterior de la tapa */}
        <group position={[0, DIM.largoTapa / 2, -DIM.grosorTapa - 0.0008]} rotation-y={Math.PI}>
          <mesh geometry={geos.geoLogo} material={recursos.logo} />
        </group>
      </group>
    </group>
  );
});

function rectRedondeado(ancho: number, alto: number, radio: number): THREE.Shape {
  const x = -ancho / 2;
  const y = -alto / 2;
  const forma = new THREE.Shape();
  forma.moveTo(x + radio, y);
  forma.lineTo(x + ancho - radio, y);
  forma.quadraticCurveTo(x + ancho, y, x + ancho, y + radio);
  forma.lineTo(x + ancho, y + alto - radio);
  forma.quadraticCurveTo(x + ancho, y + alto, x + ancho - radio, y + alto);
  forma.lineTo(x + radio, y + alto);
  forma.quadraticCurveTo(x, y + alto, x, y + alto - radio);
  forma.lineTo(x, y + radio);
  forma.quadraticCurveTo(x, y, x + radio, y);
  return forma;
}

/**
 * Teclado de 6 filas con teclas individuales en un solo InstancedMesh.
 * Anchos en "unidades de tecla"; cada fila suma 14.5 u.
 */
function crearTeclado(geometria: THREE.BufferGeometry, material: THREE.Material) {
  const anchoTeclado = 2.56;
  const u = anchoTeclado / 14.5;
  const hueco = 0.022;
  const altoTecla = 0.014;
  const filas: { anchos: number[]; fondo: number }[] = [
    { anchos: Array(14).fill(14.5 / 14), fondo: 0.55 }, // fila de funciones
    { anchos: [...Array(13).fill(1), 1.5], fondo: 1 },
    { anchos: [1.5, ...Array(13).fill(1)], fondo: 1 },
    { anchos: [1.75, ...Array(11).fill(1), 1.75], fondo: 1 },
    { anchos: [2.25, ...Array(10).fill(1), 2.25], fondo: 1 },
    { anchos: [1, 1, 1, 1.25, 5, 1.25, 1, 1, 1, 1], fondo: 1 },
  ];
  const total = filas.reduce((suma, fila) => suma + fila.anchos.length, 0);
  const malla = new THREE.InstancedMesh(geometria, material, total);
  const matriz = new THREE.Matrix4();
  const fondoTotal = filas.reduce((suma, fila) => suma + fila.fondo * u, 0);

  let indice = 0;
  let z = -fondoTotal / 2;
  for (const fila of filas) {
    const fondoFila = fila.fondo * u;
    let x = -anchoTeclado / 2;
    for (const anchoU of fila.anchos) {
      const ancho = anchoU * u;
      matriz.compose(
        new THREE.Vector3(x + ancho / 2, altoTecla / 2, z + fondoFila / 2),
        new THREE.Quaternion(),
        new THREE.Vector3(ancho - hueco, altoTecla, fondoFila - hueco),
      );
      malla.setMatrixAt(indice++, matriz);
      x += ancho;
    }
    z += fondoFila;
  }
  malla.instanceMatrix.needsUpdate = true;
  return malla;
}
