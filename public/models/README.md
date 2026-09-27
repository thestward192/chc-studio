# public/models/

Aquí van los modelos 3D reales en formato **.glb** (glTF binario).

- Un archivo por objeto o mueble (ej. `laptop.glb`, `escritorio.glb`, `objeto-guitarra.glb`).
- Los archivos deben estar ya comprimidos: geometría con **Draco** y texturas en **KTX2**.
  Usa `npm run optimizar-modelos` (ver `scripts/optimizar-modelos.mjs`) para generar estas
  versiones a partir de tus `.glb`/`.gltf` originales — no subas los originales sin comprimir aquí.
- Mientras esta carpeta solo tenga este README, todas las salas usan geometría simple
  (cajas, esferas, etc.) definida en código. Para conectar un modelo real, envuelve la
  geometría simple con `<ModeloGLTF url="/models/tu-archivo.glb" fallback={<GeometriaSimple />} />`
  (ver `src/components/three/ModeloGLTF.tsx`).
- Presupuesto orientativo por modelo: mantente por debajo de los presupuestos de página
  descritos en el README principal (inicio < 1 MB, sala de proyectos < 5 MB, cada
  habitación del equipo < 4 MB).

TODO(modelos): añadir aquí los modelos reales cuando estén exportados desde Blender.
