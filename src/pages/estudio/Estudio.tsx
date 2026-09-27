import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { TransicionPagina, type ManejadorTransicion } from '../../components/ui/TransicionPagina';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSoportaWebGL } from '../../hooks/useSoportaWebGL';
import { useEstudio, type NivelCalidad } from '../../components/three/estudio/estadoEstudio';
import { navegacion } from '../../components/three/estudio/navegacion';
import { puente } from '../../components/three/estudio/puente';
import { ambiente } from '../../components/three/estudio/ambiente';
import { liberarTodo } from '../../components/three/estudio/recursos';
import { audio } from '../../components/three/estudio/audio';
import { ui } from '../../theme/theme';
import { CargaEstudio } from '../../components/ui/estudio/CargaEstudio';
import { Hud } from '../../components/ui/estudio/Hud';
import { useAtajos } from '../../components/ui/estudio/useAtajos';
import { PanelInfo } from '../../components/ui/estudio/PanelInfo';
import { MenuPausa } from '../../components/ui/estudio/MenuPausa';
import { VersionSimple } from '../../components/ui/estudio/VersionSimple';
import { InundacionLuz } from '../../components/ui/estudio/InundacionLuz';
import '../../components/ui/estudio/estudio-ui.css';
import './Estudio.css';

// La escena (three.js + R3F) llega por import dinámico; su descarga cuenta
// en la barra de progreso real de la pantalla de carga.
const EscenaSalaProyectos = lazy(() =>
  import('../../components/three/EscenaSalaProyectos').then((modulo) => {
    useEstudio.getState().set({ progresoCarga: 0.5, pasoCarga: 'Construyendo la sala…' });
    return modulo;
  }),
);

// Panel de depuración (leva): solo en desarrollo y con ?debug.
const DepuracionEstudio = import.meta.env.DEV
  ? lazy(() => import('../../components/three/estudio/DepuracionEstudio'))
  : null;
const parametros = new URLSearchParams(window.location.search);
const conDepuracion = import.meta.env.DEV && parametros.has('debug');

/** Las texturas en canvas (pizarra, neón, código) necesitan las fuentes ya cargadas. */
function cargarFuentes() {
  const familias = [
    `700 48px ${ui.fuenteUi}`,
    `500 26px ${ui.fuenteCodigo}`,
    `600 14px ${ui.fuenteCodigo}`,
    `700 54px ${ui.fuenteManuscrita}`,
    `500 38px ${ui.fuenteManuscrita}`,
  ];
  return Promise.all(familias.map((f) => document.fonts.load(f))).catch(() => undefined);
}

export function Estudio() {
  const movimientoReducido = usePrefersReducedMotion();
  const soportaWebGL = useSoportaWebGL();
  const [fuentesListas, setFuentesListas] = useState(false);
  const transicionRef = useRef<ManejadorTransicion>(null);

  const navegar = useCallback((href: string) => {
    const transicion = transicionRef.current;
    if (transicion) transicion.salirHacia(href);
    else window.location.href = href;
  }, []);

  useAtajos();

  useEffect(() => {
    navegacion.ir = navegar;
  }, [navegar]);

  // Solo en desarrollo: acceso para pruebas automáticas (no existe en producción)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__estudio = { puente, estado: useEstudio, ambiente };
  }, []);

  // Calidad fijada por URL (?calidad=alto|medio|bajo), útil para medir
  useEffect(() => {
    const nivel = parametros.get('calidad');
    if (nivel === 'alto' || nivel === 'medio' || nivel === 'bajo') {
      useEstudio.getState().set({ calidadForzada: nivel as NivelCalidad });
    }
  }, []);

  useEffect(() => {
    useEstudio.getState().set({ progresoCarga: 0.1, pasoCarga: 'Cargando fuentes…' });
    void cargarFuentes().then(() => {
      useEstudio.getState().set({ progresoCarga: 0.25, pasoCarga: 'Descargando la escena 3D…' });
      setFuentesListas(true);
    });
  }, []);

  // Limpieza al salir de la página: recursos de GPU y AudioContext
  useEffect(() => {
    const control = new AbortController();
    window.addEventListener(
      'pagehide',
      () => {
        liberarTodo();
        audio.cerrar();
      },
      { signal: control.signal },
    );
    return () => control.abort();
  }, []);

  if (soportaWebGL === false) {
    return (
      <>
        <TransicionPagina ref={transicionRef} />
        <main className="estudio__sin-webgl">
          <p className="estudio__aviso">Tu navegador no soporta WebGL: esta es la versión en texto del estudio.</p>
          <VersionSimple comoPagina onNavegar={navegar} />
          <a href="/" className="eui-boton">
            ← Volver al inicio
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <TransicionPagina ref={transicionRef} />
      <div className="estudio__lienzo">
        {soportaWebGL && fuentesListas && (
          <Suspense fallback={null}>
            <EscenaSalaProyectos movimientoReducido={movimientoReducido} />
          </Suspense>
        )}
      </div>
      <CargaEstudio movimientoReducido={movimientoReducido} />
      <Hud onVolverInicio={() => navegar('/')} />
      <PanelInfo />
      <MenuPausa />
      <VersionSimple onNavegar={navegar} />
      <InundacionLuz onNavegar={navegar} />
      {conDepuracion && DepuracionEstudio && (
        <Suspense fallback={null}>
          <DepuracionEstudio />
        </Suspense>
      )}
    </>
  );
}
