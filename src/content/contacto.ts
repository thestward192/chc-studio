import { empresa } from './empresa';
import { servicios } from './servicios';

// Sección "Contacto" de Inicio. El formulario no tiene servidor: al enviarlo
// se abre la app de correo con el mensaje armado (mailto).

export const encabezadoContacto = {
  antetitulo: 'Contacto',
  titular: [{ texto: 'Hablemos de ' }, { texto: 'tu proyecto.', destacado: true }] as {
    texto: string;
    destacado?: boolean;
  }[],
  subtitulo:
    'Cuéntanos qué necesitas y te ayudamos a encontrar por dónde empezar. Escríbenos por donde te quede más cómodo.',
};

/** Opciones de "¿Qué necesitas?": los mismos servicios de la página. */
export const opcionesServicio = servicios.map((s) => s.titulo);

/** Solo los dígitos del teléfono (para tel: y WhatsApp). */
const digitos = empresa.telefono.replace(/\D/g, '');

export type IconoMedio = 'correo' | 'whatsapp' | 'telefono' | 'ubicacion';

export const mediosContacto: {
  icono: IconoMedio;
  titulo: string;
  valor: string;
  href?: string;
}[] = [
  { icono: 'correo', titulo: 'Correo', valor: empresa.email, href: `mailto:${empresa.email}` },
  // TODO(contenido real): confirmar que el número de WhatsApp es el mismo del teléfono.
  {
    icono: 'whatsapp',
    titulo: 'WhatsApp',
    valor: empresa.telefono,
    href: `https://wa.me/${digitos}`,
  },
  { icono: 'telefono', titulo: 'Teléfono', valor: empresa.telefono, href: `tel:+${digitos}` },
  { icono: 'ubicacion', titulo: 'Ubicación', valor: empresa.direccion },
];

export const formularioContacto = {
  titulo: 'Escríbenos',
  nota: 'Al enviar se abre tu app de correo con el mensaje listo.',
  boton: 'Enviar mensaje',
  enviado: 'Listo: revisa tu app de correo para enviarlo.',
  asunto: (nombre: string) => `Proyecto nuevo: ${nombre}`,
};
