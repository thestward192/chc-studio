# public/textures/

Texturas e imágenes usadas en las escenas 3D y en meta etiquetas Open Graph.

Los archivos que ya existen aquí (`.png`) son **placeholders generados
automáticamente** (rectángulos de color liso), solo para que la app cargue algo
mientras no hay fotos/renders reales. Sustitúyelos por imágenes reales conservando
el mismo nombre y ruta, o actualiza las rutas en `src/content/proyectos.ts` y en los
`.html` si usas otros nombres.

- `proyectos/`: imágenes de cada proyecto para los cuadros de la sala 3D. Cada proyecto
  necesita DOS versiones (ver `src/content/proyectos.ts` → `imagenBaja` / `imagenAlta`):
  - `*-baja.*`: pequeña (ej. 320×213px, calidad ~60), se carga primero.
  - `*-alta.*`: nítida (ej. 1600×1066px), sustituye a la baja cuando la cámara se acerca.
  - Formato recomendado para las definitivas: `.jpg` (fotos) o `.webp`.
- Texturas de **luz horneada desde Blender** (si las usas en vez de solo color plano):
  formato `.ktx2` (comprimido). Se aplican como `lightMap` o `map` en los materiales de
  `Habitacion.tsx` y los demás componentes 3D.
- `og-inicio.png`, `og-estudio.png`, etc.: imágenes para las meta etiquetas Open Graph de
  cada página (1200×630px recomendado).
- `marcador-sin-webgl.png`: imagen fija que se muestra cuando el navegador no soporta WebGL.

TODO(imágenes): sustituir los placeholders por fotografías/renders reales de proyectos y marca.
