export interface Servicio {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
}

// TODO(contenido real): servicios de marcador, sustituir por los servicios
// reales que ofrece ChcStudio.
export const servicios: Servicio[] = [
  {
    id: 'servicio-1',
    titulo: 'Texto de marcador: Servicio 1',
    descripcion: 'Descripción de marcador del servicio 1.',
    icono: '◆',
  },
  {
    id: 'servicio-2',
    titulo: 'Texto de marcador: Servicio 2',
    descripcion: 'Descripción de marcador del servicio 2.',
    icono: '◆',
  },
  {
    id: 'servicio-3',
    titulo: 'Texto de marcador: Servicio 3',
    descripcion: 'Descripción de marcador del servicio 3.',
    icono: '◆',
  },
  {
    id: 'servicio-4',
    titulo: 'Texto de marcador: Servicio 4',
    descripcion: 'Descripción de marcador del servicio 4.',
    icono: '◆',
  },
];
