import { listaGustos, pendiente, type Integrante } from '../../content/equipo';

/** Adónde lleva una puerta (una oficina del equipo o, desde una oficina, el taller). */
export interface DestinoPuerta {
  id: string;
  /** Texto de la placa y título del panel. */
  nombre: string;
  colorLuz: string;
  colorPuerta: string;
  href: string;
  /** Texto del panel (vacío = líneas de marcador). */
  info: string;
  /** Muestra líneas de marcador bajo el texto (contenido aún sin escribir). */
  pendiente?: boolean;
  /** Texto del botón de entrar. */
  accion?: string;
}

/** Destino de la puerta de un integrante en el taller. */
export function destinoIntegrante(integrante: Integrante): DestinoPuerta {
  const texto = [integrante.rol, integrante.frase ? `“${integrante.frase}”` : '']
    .filter((t) => !pendiente(t))
    .join('\n\n');
  return {
    id: integrante.id,
    nombre: integrante.nombre,
    colorLuz: integrante.colorLuz,
    colorPuerta: integrante.colorPuerta,
    href: integrante.href,
    info: `Le gusta: ${listaGustos(integrante, true)}.${texto ? `\n\n${texto}` : ''}`,
    pendiente: pendiente(integrante.rol),
    accion: `Entrar a la oficina de ${integrante.nombreCorto}`,
  };
}
