import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Header } from '../../components/header/Header';
import { SeccionServicios } from '../../components/ui/SeccionServicios';
import { SeccionProyectos } from '../../components/ui/SeccionProyectos';
import { SeccionEquipo } from '../../components/ui/SeccionEquipo';
import { SeccionContacto } from '../../components/ui/SeccionContacto';
import { Footer } from '../../components/ui/Footer';
import { SaltarIntro } from '../../components/ui/SaltarIntro';
import { PantallaCarga } from '../../components/ui/PantallaCarga';
import { TransicionPagina } from '../../components/ui/TransicionPagina';
import { TextoIntro } from '../../components/ui/TextoIntro';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useSoportaWebGL } from '../../hooks/useSoportaWebGL';
import { useModoEstudio } from '../../hooks/useModoEstudio';
import { introVista } from '../../hooks/useIntroVista';
import { empresa } from '../../content/empresa';
import { laptopConfig } from '../../components/three/laptop.config';
import { tramo } from '../../components/three/utilidadesIntro';
import './Inicio.css';

const EscenaIntroLaptop = lazy(() => import('../../components/three/EscenaIntroLaptop'));

// Panel de depuración (leva): solo existe en desarrollo; en producción esta
// rama se elimina y leva no entra en el build.
const DepuracionIntro = import.meta.env.DEV
  ? lazy(() => import('../../components/three/DepuracionIntro'))
  : null;
const conDepuracion =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');

export function Inicio() {
  const prefiereReducido = usePrefersReducedMotion();
  const soportaWebGL = useSoportaWebGL();
  const modoEstudio = useModoEstudio();
  // Con ?debug la intro se muestra siempre, aunque ya se haya visto.
  const [yaVista, setYaVista] = useState(() => introVista.leer() && !conDepuracion);
  const [progreso, setProgreso] = useState(0);
  const [introOculta, setIntroOculta] = useState(false);
  const [introEnVista, setIntroEnVista] = useState(true);
  const introRef = useRef<HTMLDivElement>(null);
  const contenidoRef = useRef<HTMLDivElement>(null);

  // Con movimiento reducido la secuencia de scroll se mantiene (sin reposo,
  // parallax ni postproceso: ver EscenaIntroLaptop / LaptopIntro).
  const mostrarIntro3D = soportaWebGL === true && !yaVista && !introOculta;
  const alturaVh = laptopConfig.alturaScrollVh;

  useEffect(() => {
    if (!mostrarIntro3D) return;

    let animando = false;
    const alManejarScroll = () => {
      if (animando) return;
      animando = true;
      requestAnimationFrame(() => {
        const alturaPx = (window.innerHeight * alturaVh) / 100 - window.innerHeight;
        const nuevoProgreso = alturaPx > 0 ? window.scrollY / alturaPx : 1;
        setProgreso(Math.min(1, Math.max(0, nuevoProgreso)));
        animando = false;
      });
    };

    window.addEventListener('scroll', alManejarScroll, { passive: true });
    window.addEventListener('resize', alManejarScroll, { passive: true });
    alManejarScroll();
    return () => {
      window.removeEventListener('scroll', alManejarScroll);
      window.removeEventListener('resize', alManejarScroll);
    };
  }, [mostrarIntro3D, alturaVh]);

  // Pausar la escena cuando la sección de la intro sale de la vista.
  useEffect(() => {
    const nodo = introRef.current;
    if (!nodo) return;
    const observador = new IntersectionObserver(([entrada]) => setIntroEnVista(entrada.isIntersecting));
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [mostrarIntro3D]);

  useEffect(() => {
    if (progreso >= 0.999) {
      introVista.marcar();
    }
  }, [progreso]);

  const saltarIntro = useCallback(() => {
    introVista.marcar();
    setIntroOculta(true);
    requestAnimationFrame(() => {
      contenidoRef.current?.scrollIntoView({ behavior: 'auto' });
    });
  }, []);

  // Botón "Intro" del navbar: vuelve a montar la laptop y sube al principio.
  const volverAIntro = useCallback(() => {
    introVista.olvidar();
    setProgreso(0);
    setYaVista(false);
    setIntroOculta(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Corte final: el canvas se desvanece y queda la página HTML.
  const opacidadCanvas = 1 - tramo(progreso, laptopConfig.secuencia.corte);

  return (
    <>
      <TransicionPagina />

      {mostrarIntro3D && (
        <div ref={introRef} className="inicio-intro" style={{ height: `${alturaVh}vh` }}>
          <div
            className="inicio-intro__fijo"
            style={{
              opacity: opacidadCanvas,
              visibility: opacidadCanvas === 0 ? 'hidden' : 'visible',
              pointerEvents: opacidadCanvas === 0 ? 'none' : 'auto',
            }}
          >
            <Suspense fallback={<PantallaCarga visible etiqueta="Preparando la escena…" />}>
              <EscenaIntroLaptop
                progreso={progreso}
                visible={introEnVista && opacidadCanvas > 0}
                movimientoReducido={prefiereReducido}
                modo={modoEstudio}
              />
            </Suspense>
            <TextoIntro progreso={progreso} movimientoReducido={prefiereReducido} />
            <p className="inicio-intro__ayuda solo-lectores">
              Desplázate para ver la laptop abrirse y encenderse.
            </p>
          </div>
          <SaltarIntro visible={progreso < 0.98} onSaltar={saltarIntro} />
        </div>
      )}

      {conDepuracion && DepuracionIntro && (
        <Suspense fallback={null}>
          <DepuracionIntro />
        </Suspense>
      )}

      {!soportaWebGL && soportaWebGL !== null && (
        <div className="inicio-aviso-webgl">
          {/* TODO(marca): imagen fija de marcador para navegadores sin WebGL. */}
          <img
            src="/textures/marcador-sin-webgl.png"
            alt={`Vista estática de ${empresa.nombre}`}
            width={960}
            height={540}
          />
          <p>
            Tu navegador no soporta WebGL: mostramos la versión en texto del sitio de{' '}
            {empresa.nombre}.
          </p>
        </div>
      )}

      <div ref={contenidoRef} id="contenido">
        <Header onVolverIntro={soportaWebGL ? volverAIntro : undefined} />
        <main>
          <SeccionServicios />
          <SeccionProyectos />
          <SeccionEquipo />
          <SeccionContacto />
        </main>
        <Footer />
      </div>
    </>
  );
}
