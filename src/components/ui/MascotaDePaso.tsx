import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useMascota3D } from '../../hooks/useMascota3D';
import { LimiteError } from '../three/LimiteError';
import type { DatosRecorrido, RecorridoMascota, TipoPaseo } from '../three/hero/senalHero';
import estilos from './MascotaDePaso.module.css';

const EscenaHeroMascota = lazy(() => import('../three/hero/EscenaHeroMascota'));

/**
 * La mascota del hero de paso por una sección (Proyectos, Nosotros,
 * Contacto o el pie): un canvas 3D transparente que la sección coloca con
 * `className` (sin eventos de puntero). En cada fotograma la escena llama a
 * `medir` con la capa del canvas para saber dónde apoyarse y a qué sitio ir
 * (ver paseosMascota.ts); `avisar` recibe los momentos clave.
 *
 * Solo en escritorio con mouse y WebGL, sin movimiento reducido (como el
 * resto de la mascota 3D). Se carga con margen, antes de que llegue la
 * sección, y solo pinta mientras se ve y la pestaña está visible.
 */
export function MascotaDePaso({
  tipo,
  className,
  medir,
  avisar,
}: {
  tipo: TipoPaseo;
  className: string;
  medir: (capa: HTMLElement) => DatosRecorrido | null;
  avisar?: (evento: string) => void;
}) {
  const capaRef = useRef<HTMLDivElement>(null);
  const mascota3D = useMascota3D();
  const [fallo, setFallo] = useState(false);
  const [cargar, setCargar] = useState(false);
  const [enPantalla, setEnPantalla] = useState(false);
  const [pestanaVisible, setPestanaVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [listo, setListo] = useState(false);
  const puede3D = mascota3D && !fallo;

  useEffect(() => {
    const capa = capaRef.current;
    if (!capa || !puede3D) return;
    const cerca = new IntersectionObserver(([e]) => e.isIntersecting && setCargar(true), {
      rootMargin: '900px 0px',
    });
    const vista = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), {
      rootMargin: '100px 0px',
    });
    cerca.observe(capa);
    vista.observe(capa);
    const alCambiarPestana = () => setPestanaVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', alCambiarPestana);
    return () => {
      cerca.disconnect();
      vista.disconnect();
      document.removeEventListener('visibilitychange', alCambiarPestana);
    };
  }, [puede3D]);

  // Lo último que pasó la sección (sin recrear el recorrido en cada render)
  const medirRef = useRef(medir);
  medirRef.current = medir;
  const avisarRef = useRef(avisar);
  avisarRef.current = avisar;
  const recorrido = useMemo<RecorridoMascota>(
    () => ({
      tipo,
      medir: () => (capaRef.current ? medirRef.current(capaRef.current) : null),
      avisar: (evento) => avisarRef.current?.(evento),
    }),
    [tipo],
  );

  if (!puede3D) return null;
  return (
    <div ref={capaRef} className={className} aria-hidden="true">
      {cargar && (
        <LimiteError onError={() => setFallo(true)}>
          <Suspense fallback={null}>
            <EscenaHeroMascota
              className={`${estilos.lienzo} ${listo ? estilos.listo : ''}`}
              activo={enPantalla && pestanaVisible}
              onListo={() => setListo(true)}
              recorrido={recorrido}
            />
          </Suspense>
        </LimiteError>
      )}
    </div>
  );
}
