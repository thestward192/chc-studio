/**
 * Textos de la interfaz de una sala 3D. Por defecto son los del taller
 * (estudio.html); cada oficina del equipo los cambia al arrancar su página
 * (ver pages/equipo/Oficina.tsx). No es estado de React: se fija una vez.
 */
export const textosSala = {
  /** Línea bajo el logo en la pantalla de carga. */
  subCarga: 'Taller 3D',
  /** Título grande de la pantalla de carga. */
  tituloCarga: 'El taller',
  /** Color de la luz de la sala (tiñe la pantalla de carga). */
  colorCarga: '#1ec8d8',
  /** Línea bajo el logo en el HUD. */
  subHud: (proyectos: number, puertas: number) =>
    `Taller 3D: ${proyectos} proyectos y ${puertas} puertas`,
  etiquetaCarga: 'Cargando el taller',
  /** Consejos para moverse (pantalla de carga). */
  consejos: ['Arrastra para mirar', 'Rueda para acercarte', 'Toca los objetos y a la mascota'],
  mensajesCarga: [
    'Compilando shaders…',
    'Sirviendo café…',
    'Despertando al servidor…',
    'Ordenando la estantería…',
    'Encendiendo el neón…',
    'Regando las plantas…',
  ],
  listo: 'Todo listo. Pasá, estás en tu casa.',
  entrar: 'Entrar al taller',
  /** Botón secundario del HUD (abajo a la izquierda). */
  volver: 'Volver al inicio',
  /** Títulos de los grupos del menú de pausa. */
  grupos: { proyecto: 'Proyectos', puerta: 'Puertas del equipo', objeto: 'Objetos' },
};
