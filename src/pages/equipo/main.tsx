import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Oficina } from './Oficina';
import { obtenerIntegrantePorSlug } from '../../content/equipo';
import { mensajesCargaOficina } from '../../content/oficinas';
import { prepararOficina } from '../../components/three/oficina/oficinas.config';
import { textosSala } from '../../components/ui/estudio/textosSala';
// Fuentes de marca (como el taller): Sora e Inter; JetBrains Mono para el
// código del monitor y Caveat, que usan algunas texturas compartidas.
import '@fontsource/sora/latin-600.css';
import '@fontsource/sora/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import '@fontsource/caveat/latin-500.css';
import '@fontsource/caveat/latin-700.css';
import '../../styles/global.css';

const contenedor = document.getElementById('app');
if (!contenedor) throw new Error('No se encontró el elemento #app');

const slug = contenedor.dataset.miembro;
const integrante = slug ? obtenerIntegrantePorSlug(slug) : undefined;

if (!integrante) {
  throw new Error(
    `No se encontró al integrante "${slug}". Revisa el atributo data-miembro en el HTML y src/content/equipo.ts.`,
  );
}

// La oficina reutiliza el motor y la interfaz del taller: se ajustan la sala
// (medidas, cámara, puerta, ventana) y los textos antes de montar nada.
prepararOficina();
Object.assign(textosSala, {
  subCarga: `Oficina de ${integrante.nombreCorto}`,
  subHud: () => `Oficina de ${integrante.nombre}`,
  etiquetaCarga: `Cargando la oficina de ${integrante.nombre}`,
  mensajesCarga: mensajesCargaOficina[integrante.slug] ?? textosSala.mensajesCarga,
  listo: `Pasá, esta es la oficina de ${integrante.nombreCorto}.`,
  entrar: 'Entrar a la oficina',
  volver: 'Volver al taller',
  grupos: { proyecto: 'Proyectos', puerta: 'Salida', objeto: `Cosas de ${integrante.nombreCorto}` },
});

createRoot(contenedor).render(
  <StrictMode>
    <Oficina integrante={integrante} />
  </StrictMode>,
);
