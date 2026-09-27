import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { TransicionPagina, type ManejadorTransicion } from '../../components/ui/TransicionPagina';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSoportaWebGL } from '../../hooks/useSoportaWebGL';
import type { Integrante } from '../../content/equipo';
import { useEstudio, type NivelCalidad } from '../../components/three/estudio/estadoEstudio';
import { navegacion } from '../../components/three/estudio/navegacion';
import { puente } from '../../components/three/estudio/puente';
import { ambiente } from '../../components/three/estudio/ambiente';
import { liberarTodo } from '../../components/three/estudio/recursos';
import { audio } from '../../components/three/estudio/audio';
import { CargaEstudio } from '../../components/ui/estudio/CargaEstudio';
import { Hud } from '../../components/ui/estudio/Hud';
import { useAtajos } from '../../components/ui/estudio/useAtajos';
import { PanelInfo } from '../../components/ui/estudio/PanelInfo';
import { MenuPausa } from '../../components/ui/estudio/MenuPausa';
import { VersionSimpleOficina } from '../../components/ui/estudio/VersionSimpleOficina';
import { InundacionLuz } from '../../components/ui/estudio/InundacionLuz';
import { cargarFuentes } from '../../components/ui/estudio/fuentes';
import '../../components/ui/estudio/estudio-ui.css';
import '../estudio/Estudio.css';

// La escena llega por import dinámico; su descarga cuenta en la barra de carga.
const EscenaOficina = lazy(() =>
  import('../../components/three/EscenaOficina').then((modulo) => {
    useEstudio.getState().set({ progresoCarga: 0.5, pasoCarga: 'Armando la oficina…' });
    return modulo;
  }),
);

const parametros = new URLSearchParams(window.location.search);

/**
 * Oficina de un integrante (equipo/integrante-N.html). Misma interfaz y
 * motor que el taller: carga, HUD, panel, menú de pausa, versión simple y
 * la luz al cruzar la puerta (que aquí lleva de vuelta al taller). La sala
 * y los textos ya se ajustaron en main.tsx antes de montar esto.
 */
export function Oficina({ integrante }: { integrante: Integrante }) {
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

  // Solo en desarrollo: acceso para pruebas automáticas
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__estudio = {
      puente,
      estado: useEstudio,
      ambiente,
    };
  }, []);

  // Calidad fijada por URL (?calidad=alto|medio|bajo)
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
          <p className="estudio__aviso">
            Tu navegador no soporta WebGL: esta es la versión en texto de la oficina.
          </p>
          <VersionSimpleOficina integrante={integrante} comoPagina onNavegar={navegar} />
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
            <EscenaOficina integrante={integrante} movimientoReducido={movimientoReducido} />
          </Suspense>
        )}
      </div>
      <CargaEstudio movimientoReducido={movimientoReducido} />
      <Hud onVolverInicio={() => navegar('/estudio.html')} />
      <PanelInfo />
      <MenuPausa />
      <VersionSimpleOficina integrante={integrante} onNavegar={navegar} />
      <InundacionLuz onNavegar={navegar} />
    </>
  );
}
