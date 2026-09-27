# ChcStudio — sitio web

Andamiaje completo del sitio de ChcStudio: estructura, plantilla y componentes
listos, con **valores neutros de marcador** en vez de diseño final. Todo el
contenido real (marca, textos, proyectos, equipo, modelos 3D, videos, CVs) se
añade después sin tocar la lógica de la app.

## Requisitos

- Node.js 18+ y npm.

```bash
npm install
npm run dev
```

- `npm run dev` — servidor de desarrollo (Vite).
- `npm run build` — chequeo de tipos (`tsc --noEmit`) + build de producción.
- `npm run preview` — sirve el build de `dist/` en local.
- `npm run lint` / `npm run format` — ESLint / Prettier.
- `npm run optimizar-modelos` — comprime modelos `.glb`/`.gltf`.
- `npm run peso-build` — informa el peso inicial (JS+CSS) de cada página del build.

## Estructura de carpetas

```
index.html                  → entrada de "Inicio" (intro 3D + página informativa)
estudio.html                → entrada del estudio 3D (proyectos, puertas del equipo)
equipo/integrante-1..4.html → entradas de las 4 habitaciones del equipo
vite.config.ts              → Vite en modo multi-página (una entrada por HTML)

src/
  pages/            un componente raíz + main.tsx por página
    inicio/         Inicio.tsx (intro de la laptop + secciones informativas)
    estudio/        Estudio.tsx (estudio 3D: carga, HUD, paneles)
    equipo/         Integrante.tsx (ÚNICO componente para las 4 habitaciones)
  components/
    header/         Header (navbar + hero de Inicio), CSS Modules
    ui/             BotonPreview, secciones, Footer, PanelTexto,
                     SaltarIntro, TransicionPagina, PantallaCarga…
      estudio/      interfaz del estudio 3D (carga, HUD, panel, menú…)
    three/          LaptopIntro, Habitacion, CuadroProyecto, Puerta,
                     ObjetoInteractivo, ControlesCamara, ModeloGLTF,
                     y las "Escena*.tsx" que se cargan con import() dinámico
      estudio/      objetos, estado, cámara, audio y config del estudio 3D
      shaders/      un archivo por shader (intro y estudio)
  content/          empresa.ts, servicios.ts, proyectos.ts, equipo.ts, proceso.ts
                     (TODO el contenido, tipado, con textos de marcador)
  theme/            tokens.css (CSS) y theme.ts (espejo para Three.js)
  hooks/            reduced-motion, detección de WebGL, "intro ya vista"
  styles/           global.css (importa tokens.css)
  utils/            helpers de rendimiento (límite de devicePixelRatio)

public/
  models/   .glb reales (README con el formato esperado)
  textures/ imágenes de proyectos, luz horneada, og:image (placeholders ya generados)
  video/    video en bucle del botón "Explorar el estudio"
  cv/       PDFs de cada integrante (placeholders ya generados)

models-entrada/  carpeta de entrada para `npm run optimizar-modelos`
scripts/         optimizar-modelos.mjs, peso-build.mjs
```

> Notas de diseño 3D (cómo están hechas la intro y el estudio, problemas
> resueltos y plan para las habitaciones): [`docs/diseno-3d.md`](docs/diseno-3d.md).

## Header de Inicio (navbar + hero)

`src/components/header/` — `Header.tsx` (arma todo y la fila de servicios),
`Navbar.tsx` (en escritorio, pestaña oscura con esquinas invertidas hechas con
`radial-gradient` en `::before`/`::after`; en tablet y móvil, menú
hamburguesa), `Hero.tsx` (titular, botón, prueba social y parte visual),
`HeroVisual.tsx` (póster o escena 3D) y piezas pequeñas (`Logo`, `BotonPill`,
`useIndicadorNav`). Estilos con CSS Modules. Textos en
[`src/content/cabecera.ts`](src/content/cabecera.ts); tokens de marca
(`--bg-page`, `--accent-gradient`, `--font-heading`…) en `tokens.css` (espejo
para Three.js en `theme.ts` → `marca`). Sora e Inter van empaquetadas con
`@fontsource` (importadas en `src/pages/inicio/main.tsx`) y los iconos son de
`@phosphor-icons/react`, importados uno a uno por su ruta
(`@phosphor-icons/react/dist/csr/Nombre`) para no cargar toda la librería.

- **Indicador del nav**: una sola barra con el degradado que se desliza hasta
  la sección visible o el enlace señalado. En la parte alta de la página no hay
  sección activa y la barra se oculta.
- **Separación del nav**: compacta entre 1024 y 1279 px (para que quepa el
  botón Intro) y amplia desde 1280 px.
- **Botón "Intro"** (junto al logo, y también en el menú móvil): borra la
  marca de "intro vista", vuelve a montar la laptop 3D y sube al principio.
  Solo aparece si hay WebGL. Por debajo de 480 px y entre 1024 y 1279 px va
  solo con icono.
- **Prueba social sin cifras**: "Todo el 3D de esta web lo programamos
  nosotros" + enlace al estudio 3D. No hay clientes reales todavía; cuando los
  haya, se puede sumar una fila de logos debajo del hero.
- **Núcleo CHC (3D del hero)**: `src/components/three/hero/`
  (`EscenaHeroNucleo.tsx`, `hero.config.ts`, `senalHero.ts`) y
  `shaders/nucleo.ts`. Núcleo con ruido simplex, dos arcos abiertos (las "C"
  del logo) y polvo. Se inclina hacia el mouse, se abomba hacia él y **crece**
  al señalar "Empecemos tu proyecto". Solo se carga en escritorio con mouse,
  sin movimiento reducido y con WebGL, cuando el hero está en pantalla y el
  navegador queda libre; solo pinta mientras se ve y la pestaña está activa.
  Chunk propio de 12.7 KB (4.9 KB gzip); comparte three con la intro.
- **Póster estático** `public/hero/nucleo.webp` (60 KB, 1306×1306 con
  transparencia): el mismo objeto renderizado. Se usa en móvil, tablet,
  movimiento reducido y mientras carga el 3D. Si cambiás la escena,
  regeneralo con el servidor de desarrollo levantado:
  `node scripts/capturar-poster-hero.mjs http://localhost:5173/`.
- `/logo-light.png` va en `public/`. Si falta, el logo se dibuja en texto.
- El enlace "Nosotros" apunta a `#nosotros`, que todavía no existe en la página.
- ADN de diseño de la referencia (con los colores de CHC) en
  [`design/dna.json`](design/dna.json).

Medido en RX 5500 XT a 1440×900 sin vsync: ~860 FPS con el Núcleo en pantalla.
El JS de Inicio pesa 44.8 KB (14 KB gzip); unos 26 KB son los 9 iconos de
Phosphor, porque cada uno trae los trazados de sus 6 pesos.

## Dónde cambiar cada cosa

### Colores, tipografía, espaciados, radios (identidad visual)

**Un solo lugar, dos archivos que deben tener los mismos valores:**

- [`src/theme/tokens.css`](src/theme/tokens.css) — variables CSS (`--color-*`,
  `--fuente-*`, `--tamano-texto-*`, `--espacio-*`, `--radio-*`…) usadas por
  todo el HTML/CSS del sitio.
- [`src/theme/theme.ts`](src/theme/theme.ts) — los mismos valores en JS/TS,
  para usarlos dentro de Three.js (materiales, luces), donde no se puede leer
  una variable CSS directamente.

Cambiar la marca (colores, tipografía) es editar solo esos dos archivos.

### Contenido (textos, servicios, proyectos, equipo)

Todo vive en `src/content/`, tipado con TypeScript:

- [`empresa.ts`](src/content/empresa.ts) — nombre, eslogan, descripciones, contacto, redes.
- [`servicios.ts`](src/content/servicios.ts) — lista de servicios.
- [`proyectos.ts`](src/content/proyectos.ts) — proyectos destacados (título, cliente,
  año, descripción, tecnologías, color del marcador, enlaces e imágenes opcionales).
- [`equipo.ts`](src/content/equipo.ts) — los 4 integrantes: nombre, rol, bio, frase,
  gustos, objetos de su habitación, experiencia, habilidades, CV, color de su
  puerta y de la luz que se escapa por ella en el estudio 3D.
- [`proceso.ts`](src/content/proceso.ts) — pasos de "cómo trabajamos" (pizarra del estudio).

Las **posiciones** en el estudio 3D no están en el contenido sino en
[`estudio.config.ts`](src/components/three/estudio/estudio.config.ts).

Todos los textos de marcador están escritos como "Texto de marcador: …" para
que sean fáciles de encontrar y reemplazar.

### Agregar un proyecto nuevo

1. Añade un objeto al array `proyectos` en `src/content/proyectos.ts`.
2. (Opcional) Pon sus imágenes en `public/textures/proyectos/` y rellena
   `imagenBaja`/`imagenAlta`; sin imágenes, el cuadro dibuja un marcador en
   canvas con su nombre y `colorMarcador`.
3. Añade un hueco en `cuadros` de `estudio.config.ts` (la pared del fondo
   tiene 5; un sexto puede ir en otra pared con su `rotY`).
4. Aparecerá en la sección "Proyectos" de Inicio y como cuadro en el estudio 3D.

### Agregar o editar un integrante

1. Edita/añade su objeto en el array `equipo` de `src/content/equipo.ts`
   (nombre, rol, bio, gustos, `objetosHabitacion`, experiencia, habilidades, `cvUrl`).
2. Pon su CV en `public/cv/`.
3. Las 4 páginas HTML (`equipo/integrante-1..4.html`) ya están creadas y usan
   el mismo componente `Integrante.tsx`, configurado por `data-miembro` en el
   HTML — **no hay que crear ni duplicar componentes** para un integrante nuevo,
   solo sus datos. (Si algún día hay un 5º integrante, se necesitaría un
   `equipo/integrante-5.html` nuevo + su entrada en `vite.config.ts`, siguiendo
   el mismo patrón que los otros 4.)

## Intro 3D de la laptop

Secuencia ligada al scroll (una sección de `alturaScrollVh` de alto, con el
canvas en `position: sticky`): cerrada vista desde arriba → se abre → se
enciende → gira de lado mientras aparece la información → se pone de frente →
la cámara entra en la pantalla → la pantalla se funde con el color de la
página y el canvas se desvanece, dejando el HTML real.

Antes de hacer scroll la laptop flota, gira unos grados y su sombra se
agranda y achica con la altura; la cámara "respira" y sigue al mouse (o al
giroscopio en móvil, si el navegador lo permite). Al cargar, Anime.js
enciende el estudio, sube la laptop y hace entrar el título palabra a
palabra. Todo eso se desvanece con suavidad en cuanto empieza el scroll.

### Archivos

```
src/components/three/
  laptop.config.ts      ← TODOS los tiempos e intensidades (ver abajo)
  EscenaIntroLaptop.tsx Canvas, niveles de calidad, bucle de reposo, pausas
  LaptopIntro.tsx       secuencia: laptop, cámara y uniforms (en useFrame)
  LaptopModelo.tsx      geometría y materiales de la laptop
  Ciclorama.tsx         fondo curvo piso→pared
  EntornoEstudio.tsx    reflejos (softboxes prefiltrados con PMREM)
  PostprocesoIntro.tsx  bloom, DoF, transición, SMAA, grano (import dinámico)
  DepuracionIntro.tsx   panel leva (solo desarrollo)
  texturaPagina.ts      miniatura de la página que muestra la pantalla
  shaders/
    ciclorama.ts        degradado, viñeta, grano, charco de luz, sombra de
                        contacto, reflejo de la pantalla y de la ranura
    pantalla.ts         encendido, luminancia central, vidrio, subpíxeles
    brilloRanura.ts     línea de luz de la tapa cerrada
    transicion.ts       distorsión de barril + desfase cromático (+ curva de tonos)
    aluminio.ts         cepillado direccional + fresnel (onBeforeCompile)
    tonos.ts            curva de tonos común a todos los niveles
src/components/ui/TextoIntro.tsx  título inicial y panel de información (HTML)
```

Todos los colores salen de `tokens.css`/`theme.ts` (`--estudio-*` y
`--laptop-*`, espejados en `estudio` y `laptop`) y llegan a los shaders
como uniforms; no hay colores fijos en GLSL.

### `laptop.config.ts`

Un único objeto exportado, `laptopConfig`, con todo lo ajustable:

- `alturaScrollVh`: cuánto scroll dura la intro.
- `secuencia`: en qué punto del progreso (0 → 1) pasa cada cosa. Los pares
  `[inicio, fin]` son tramos (`tapa`, `giro`, `frente`, `zoom`, `corte`…);
  `info` y `desenfoque` son mesetas `[entra, pleno, sale, fuera]`;
  `distorsion` es `[empieza, pico, termina]`, y `encendido` es un umbral: al
  cruzarlo se dispara la animación temporal de encendido de la pantalla.
- `suavizadoScroll`: cuánto se suaviza el progreso (evita saltos con la rueda).
- `reposo` y `entrada`: flotación, giro, respiración, parallax y animación
  de entrada.
- `pantalla`, `ranura`, `estudio`, `aluminio` y `postproceso`:
  intensidades de cada efecto.
- `camara`: FOV, poses fijas de la primera mitad y distancias del zoom. En
  pantallas verticales la cámara se aleja sola (`aspectoReferencia`,
  `factorMaximoMovil`, `margenFrente`).
- `laptop`: ángulo de apertura, giro lateral y desplazamiento.
- `calidad.forzar` (`'auto'` o un nivel fijo) y `calidad.fpsMovil`.

La escena relee el objeto en cada frame, así que para ajustar la secuencia no
hace falta tocar la lógica.

### Panel de depuración

En desarrollo (`npm run dev`), abre la página con `?debug` en la URL (por
ejemplo `http://localhost:5173/?debug`). Aparece un panel
[leva](https://github.com/pmndrs/leva) con un control por cada número de
`laptop.config.ts`, agrupados por sección, y un selector para forzar el nivel
de calidad. Los cambios se ven en vivo pero no se guardan: el botón **Copiar
config** copia el objeto actual como JSON para pegarlo en `laptop.config.ts`.
Con `?debug` la intro se muestra aunque ya se haya visto. En producción el
panel y leva no existen (la rama se elimina en el build).

### Niveles de calidad

El nivel inicial se elige según el dispositivo (móvil, memoria, núcleos y
nombre de la GPU). Después, `PerformanceMonitor` de drei lo baja (o lo sube,
como mucho hasta el inicial) según los FPS medidos mientras corre la
animación de reposo.

| | Alto | Medio | Bajo |
|---|---|---|---|
| Postproceso | bloom, DoF en el giro, distorsión de entrada, SMAA, grano | igual, sin DoF y con bloom a media resolución | ninguno (ni se descarga) |
| Aluminio | anisotropía + cepillado + fresnel | igual | sin anisotropía |
| Sombras | contacto (shader) + sombra real de la laptop sobre sí misma | igual | solo contacto (shader) |
| DPR | hasta 2 (1.5 en móvil) | hasta 1.5 | 1 |

Rendimiento:

- `frameloop="demand"`: el render continuo solo corre arriba del todo
  (animación de reposo), limitado a 30 FPS en móvil. Durante el scroll y
  después se dibuja bajo demanda.
- Pausa total si la sección sale de la vista (IntersectionObserver) o si la
  pestaña está oculta (`document.hidden`).
- `prefers-reduced-motion`: se mantiene la secuencia de scroll, pero sin
  flotación, parallax, distorsión ni postproceso.
- Todo lo creado a mano (geometrías, materiales, texturas, entorno PMREM,
  efectos) se libera al desmontar.

Peso de la intro en el build (minificado / gzip):

| Qué | Cuándo se descarga | Peso |
|---|---|---|
| Texto, config y utilidades de la intro | con la página de inicio | ≈ 5 KB / 2 KB |
| `EscenaIntroLaptop` (escena, shaders, modelo) | al montar la intro | 36.9 KB / 13.7 KB |
| `PostprocesoIntro` (postprocessing) | solo en niveles medio y alto | 177.2 KB / 78.5 KB |
| three + R3F (ya existía, compartido con las otras salas) | al montar la intro | 818.9 KB / 220.5 KB |

## Estudio 3D (estudio.html)

Sala de 12 × 8 m y 3,2 m de alto: 5 cuadros de proyecto en la pared del
fondo, 4 puertas (una por integrante) en las laterales, dos escritorios,
rack de servidores, pizarra, cafetera, estantería, plantas, alfombra,
letrero de neón y una ventana a la ciudad. Todo es geometría procedural
(InstancedMesh para teclas, libros, hojas y LEDs) con texturas dibujadas
en canvas.

- **Carga**: pantalla temática con progreso real (fuentes → descarga de la
  escena → construcción → compilación de shaders con `compileAsync` → primer
  fotograma). "Entrar" funde la pantalla y la cámara vuela a la vista general.
- **Interacción**: hover (un raycast como máximo por fotograma) con outline y
  tooltip; clic corto (< 8 px, < 450 ms) → vuelo de cámara (easeInOutCubic,
  1,3 s) y panel. Puertas: "Entrar" abre la puerta, la luz inunda la pantalla y
  se navega con `TransicionPagina`; la página se precarga al pasar el ratón.
- **Atajos**: Esc cierra, N día/noche, H vista general, M sonido, ←/→ proyecto
  anterior/siguiente con un cuadro enfocado.
- **Sonido**: todo sintetizado con Web Audio (efectos y música lo-fi de la
  radio), apagado hasta que el usuario lo activa, con volumen bajo.

### Archivos

```
src/pages/estudio/Estudio.tsx         raíz de la página (carga, HUD, paneles, atajos, limpieza)
src/components/three/
  EscenaSalaProyectos.tsx             Canvas del estudio (import dinámico), calidad, frameloop
  Habitacion, CuadroProyecto, Puerta, ObjetoInteractivo, ControlesCamara, ModeloGLTF
                                      componentes existentes, reutilizados y mejorados
  estudio/
    estudio.config.ts                 ← posiciones, luces, posprocesado, shaders, calidad
    estadoEstudio.ts                  estado de la escena (zustand)
    useInteractivo.ts                 registro de objetos interactivos
    camara.ts · Seleccion.tsx         vuelos de cámara · hover y clic
    Iluminacion.tsx · RelojAmbiente   luces día/noche · tiempo, transición y FPS
    Posproceso.tsx                    Outline → Bloom → viñeta/tinte → salida → SMAA
    audio.ts                          Web Audio (efectos + lo-fi)
    texturas.ts · materiales.ts       canvas procedurales · materiales compartidos
    recursos.ts                       registro para liberar todo al salir
    puente.ts                         la interfaz habla con la escena sin importar three.js
    Sala, Escritorio, Monitor, Teclado, Taza, Silla, Lampara, Radio, RackServidores,
    Pizarra, Cafetera, Estanteria, Planta, Alfombra, LetreroNeon, Ventana, Particulas
                                      un archivo por objeto
    DepuracionEstudio.tsx             panel leva (?debug, solo desarrollo)
  shaders/  monitor · cuadro · puerta · ventana · neon · particulas · vinetaTinte
src/components/ui/estudio/            CargaEstudio, Hud, PanelInfo, MenuPausa,
                                      VersionSimple, InundacionLuz, acciones, useAtajos
```

### `estudio.config.ts`

Un único objeto, `estudioConfig`, para mover y ajustar la sala sin tocar la
lógica. Coordenadas en metros: X a la derecha, Y arriba, Z hacia la entrada
(la cámara empieza cerca de z = +4 mirando a la pared del fondo, z = −4).

- `sala`: medidas.
- `cuadros`, `puertas`: una `{ pos, rotY }` por proyecto / integrante, en el
  orden de `proyectos.ts` / `equipo.ts`. `cuadro` y `puerta` traen tamaño y
  distancia del foco de cámara.
- `objetos`: escritorios, rack, estantería, ventana, pizarra, cafetera,
  plantas, alfombra y neón.
- `camara`: FOV, vista general, punto de entrada, duración de los vuelos,
  límites de distancia y de ángulo, y la caja de la que nunca sale.
- `luces`: valores de día y de noche (sol, hemisférica, rebote, entorno,
  exposición, neón) y la duración del cambio (2 s).
- `posproceso`: outline (edgeStrength 3.2, edgeGlow 0.35, edgeThickness 1.2),
  bloom (fuerza 0.5, radio 0.45, umbral 0.88), viñeta y tinte.
- `shaders`: intensidades y velocidades de monitor, cuadro, puerta, ventana y
  partículas.
- `calidad.particulas`: cuántas partículas hay en cada nivel.

### Agregar un objeto interactivo nuevo

1. Crea `src/components/three/estudio/MiObjeto.tsx` y envuelve su geometría
   en `ObjetoInteractivo`, que lo registra con `useInteractivo`:

   ```tsx
   export function MiObjeto() {
     const colocacion = cfg.objetos.miObjeto; // { pos, rotY } en estudio.config.ts
     return (
       <ObjetoInteractivo
         id="mi-objeto"
         nombre="Mi objeto"
         etiqueta="Tipo"                       // aparece en mayúsculas en el panel
         posicion={colocacion.pos}
         rotY={colocacion.rotY}
         foco={focoFrontal(colocacion, 1.8)}    // o { pos, objetivo } a mano
         info={() => `Texto que se reevalúa cada 0,5 s`}
         acciones={[{ label: () => 'Hacer algo', run: () => { /* … */ } }]}
         preview={(ctx, t, ancho, alto) => { /* canvas opcional del panel */ }}
         ancho={false}                          // true = panel de 640 px
       >
         <mesh>…geometría procedural…</mesh>
       </ObjetoInteractivo>
     );
   }
   ```

2. Añade su colocación en `estudio.config.ts` y el componente en
   `EscenaSalaProyectos.tsx`. Con eso ya tiene hover con outline, tooltip,
   clic con vuelo de cámara, panel, entrada en el menú de pausa y liberación
   de recursos.
3. Si necesitas `useInteractivo` directamente (por ejemplo, un objeto dentro de
   otro componente, como el monitor principal), pásale un `ref` a su grupo raíz
   y la misma definición. `label()` e `info()` son funciones para que el texto
   cambie con el estado (`useEstudio.getState()`).
4. Las mallas decorativas (halos, luces aditivas) llevan
   `userData={DECORATIVA}` y `raycast={sinRaycast}` para que no reciban el
   outline ni el clic.

### Reemplazar un objeto procedural por un modelo .glb

Todos los objetos aceptan una prop `modelo`, que usa `ConModelo` de
`ModeloGLTF.tsx`:

```tsx
<RackServidores modelo="/models/rack.glb" />
<Silla posicion={…} modelo="/models/silla.glb" />
```

Mientras el `.glb` carga, o si falla, se sigue viendo la geometría
procedural. El registro interactivo (hover, clic, panel) no cambia porque
vive en el grupo raíz, no en las mallas. Prepara el modelo con
`npm run optimizar-modelos` y colócalo con el origen en la base del objeto
y mirando hacia +Z.

### Panel de depuración

En desarrollo, abre `http://localhost:5173/estudio.html?debug`. El panel leva
(arriba a la derecha, se puede arrastrar) tiene día/noche, calidad y un
control por cada número de `estudio.config.ts`: luces, outline, bloom,
viñeta, shaders, cámara y posiciones. Las luces, el bloom y los shaders se
ven en el siguiente fotograma; al mover posiciones se remontan los objetos.
**Copiar config** deja el objeto en el portapapeles como JSON.

Para medir, `?calidad=alto|medio|bajo` fija el nivel desde la URL.

### Calidad y rendimiento

| | Alto | Medio | Bajo |
|---|---|---|---|
| MSAA (render target HalfFloat) | 4 muestras (escritorio) | no | no |
| Outline / Bloom | sí / resolución completa | sí / media resolución | no / no |
| Viñeta + tinte, SMAA | sí | sí | viñeta sí, SMAA no |
| Sombras | PCFSoft de la luz principal (2048) | PCFSoft (1024) | solo de contacto |
| DPR | hasta 2 (1.5 en móvil) | hasta 1.5 | 1 |
| Partículas (polvo / vapor) | 900 / 180 | 380 / 90 | 60 / 24 |

- El nivel inicial se estima por la GPU y `PerformanceMonitor` de drei lo
  ajusta con los FPS. El menú de pausa muestra el nivel y los FPS, y permite
  fijarlo a mano.
- Render continuo solo cuando hace falta: bajo demanda en pausa, con el menú
  abierto o con un panel abierto y la cámara quieta; detenido con la pestaña oculta.
- Texturas de los cuadros: 256 px al inicio, 1024 px al acercarse.
- Al salir (`pagehide` o desmontaje) se liberan geometrías, materiales,
  texturas, render targets y composer, y se cierra el AudioContext. Los
  eventos usan AbortController.
- `prefers-reduced-motion`: vuelos de 250 ms, sin partículas ni parpadeo del neón.

Medido en una AMD RX 5500 XT (escritorio medio), 1280×800, vista general,
sin límite de vsync: **alto ≈ 260 FPS, medio ≈ 350 FPS, bajo ≈ 490 FPS**
(con vsync, 60 FPS en los tres). Peso total de la página: **≈ 1,5 MB** sin
comprimir (≈ 0,6 MB transferidos con gzip), incluidas las fuentes.

## Cómo agregar un modelo 3D real

Mientras no hay modelos, todas las salas usan geometría simple (cajas,
esferas…) generada en código — ver `Habitacion.tsx`, `CuadroProyecto.tsx`,
`Puerta.tsx`, `ObjetoInteractivo.tsx`, `LaptopIntro.tsx`.

1. Pon tu `.glb`/`.gltf` original (sin comprimir) en `models-entrada/`.
2. Corre `npm run optimizar-modelos` — comprime la geometría con Draco y las
   texturas con KTX2, y deja el resultado en `public/models/`.
3. Reemplaza la geometría simple por el modelo real envolviéndola así:

   ```tsx
   <ModeloGLTF url="/models/tu-archivo.glb" fallback={<TuGeometriaSimpleDeAntes />} />
   ```

   (ver `src/components/three/ModeloGLTF.tsx`). Mientras el modelo carga, o si
   falla, se sigue viendo el fallback — nunca una pantalla vacía. En el estudio
   basta la prop `modelo` (ver "Reemplazar un objeto procedural por un modelo .glb").

La iluminación está pensada para luz horneada desde Blender (texturas con la
luz ya incluida) en vez de sombras en tiempo real: cuando tengas esas
texturas, aplícalas como `map`/`lightMap` en los materiales de `Habitacion.tsx`.

## Cómo usar `npm run optimizar-modelos`

```bash
npm run optimizar-modelos
# o con carpetas personalizadas:
npm run optimizar-modelos -- --entrada=otra-carpeta --salida=public/models
```

Recorre `models-entrada/` (o `--entrada`), comprime cada `.glb`/`.gltf` con
`@gltf-transform/cli` (Draco + KTX2) y deja el resultado en `public/models/`
(o `--salida`).

## Decisiones que tomé por mi cuenta (revísalas)

- **`referencia/laptop-scroll.html` tampoco existía al mejorar la intro** (ni en
  el proyecto ni en Escritorio/Descargas). Rehice la laptop y la secuencia a
  partir de la descripción: aluminio gris espacial, teclas negras
  individuales, trackpad pulido, marco de vidrio negro y logo en la tapa. Si
  aparece el archivo, los tiempos se ajustan solo en `laptop.config.ts`.
- **Bloom "selectivo"**: en vez de `SelectiveBloom` (que exige capas de luces y
  vuelve a renderizar la escena), la pantalla y la línea de la ranura emiten
  valores HDR (>1) y el bloom tiene umbral 1.0. Nada más en la escena llega ahí.
- **Curva de tonos propia** (`shaders/tonos.ts`): ACES, AgX y Neutral alteran
  los tonos oscuros (Neutral tiñe de azul un gris oscuro) y eso rompía los
  colores del tema y el empalme con el color de la página. La curva es lineal
  hasta 0.8, solo comprime los brillos y es la misma en los tres niveles.
- **Entorno de reflejos propio** (`EntornoEstudio.tsx`) en lugar de
  `<Environment>` de drei: mismo resultado, pero ahorra ~50 KB de cargadores
  HDR/EXR que no se usan.
- **Modo claro/oscuro**: solo afecta al estudio de la intro (`--estudio-*`),
  que sigue a `prefers-color-scheme` o a `data-tema="claro|oscuro"` en
  `<html>`. El resto del sitio conserva su paleta oscura.
- **Movimiento reducido**: antes se saltaba la intro; ahora se muestra la
  secuencia de scroll sin reposo, parallax ni postproceso, como pedía el brief.
- **Giroscopio**: en Android se usa si el navegador envía `deviceorientation`.
  En iOS no se pide permiso (haría falta un gesto del usuario), así que allí
  el parallax queda quieto.
- **Subpíxeles**: la rejilla simula 320×200 píxeles (no la resolución real)
  para que se lea como textura de pantalla sin producir moiré; `fwidth` la
  apaga si los subpíxeles quedan demasiado pequeños.
- **Duración del scroll**: la intro pasó de 260vh a 520vh (`alturaScrollVh`),
  porque la secuencia ahora tiene siete fases.
- **Anime.js v4**: confirmé que la API cambió a exports nombrados
  (`import { animate } from 'animejs'`, sin el `anime()` por defecto de v3).
  La uso en `TransicionPagina.tsx` para el fundido de entrada/salida entre
  páginas. La animación ligada al scroll de la laptop la resolví con estado de
  React + `invalidate()` de R3F (más directo que `ScrollObserver` para un
  progreso 0–1 ya calculado a mano), no con el módulo de scroll de Anime.js.
- **"Al terminar, la pantalla se convierte en la página informativa"**: lo
  implementé como una sección "intro" de altura fija (260vh) con el `<Canvas>`
  en `position: sticky`; en el último tramo del scroll el canvas se desvanece
  (opacity) revelando el contenido HTML real que ya está debajo. Es una
  aproximación razonable sin tener el archivo de referencia original.
- **Detalle de proyecto al hacer clic en un cuadro**: se muestra como un panel
  flotante sobre el propio estudio 3D (no navega a otra página), para no romper
  el "una sola escena 3D cargada a la vez".
- **Controles de teclado**: en las habitaciones del equipo, las flechas desplazan
  la cámara (`OrbitControls.listenToKeyEvents`). En el estudio están
  desactivadas (`teclado={false}`) porque las flechas cambian de proyecto.

### Estudio 3D

- **Raíz de la página**: el brief pedía `src/pages/Estudio.tsx`; la dejé en
  `src/pages/estudio/Estudio.tsx` para seguir el patrón multipágina del proyecto
  (una carpeta con `main.tsx` por página).
- **Posprocesado con los passes de three** (`three/examples`) en vez de
  `@react-three/postprocessing`: los parámetros pedidos (edgeStrength,
  **edgeGlow**, **edgeThickness**; fuerza/radio/umbral del bloom) son los del
  `OutlinePass` y el `UnrealBloomPass` de three, y el Outline de
  pmndrs no los tiene. `@react-three/postprocessing` se sigue usando en la intro.
- **Reflejos del entorno**: con `scene.environment`, three r169 ignora
  `envMapIntensity` por material. La intensidad general va en
  `scene.environmentIntensity` y los metales llevan su propio `envMap` para
  poder darles más intensidad.
- **La interfaz no importa three.js**: habla con la escena a través de
  `puente.ts`, así la pantalla de carga aparece antes de descargar three.
- **Posiciones fuera del contenido**: `posicionSala`/`rotacionSala` y
  `posicionPuertaSala`/`rotacionPuertaSala` salieron de `proyectos.ts` y
  `equipo.ts` y pasaron a `estudio.config.ts`, como pedía el brief.
- **Quinto proyecto y campos nuevos**: `proyectos.ts` tenía 4 proyectos; añadí
  un quinto de marcador y los campos `cliente`, `anio`, `colorMarcador` y
  `urlCaso`. `equipo.ts` ganó `colorLuz` y `frase`, y `proceso.ts` es nuevo.
- **`ObjetoInteractivo`** pasó a ser el envoltorio genérico de los objetos
  interactivos del estudio. Su antigua lógica (objetos de gustos con etiqueta
  flotante) se movió tal cual a `EscenaHabitacionPersonal.tsx`, su único uso.
- **Fuentes autoalojadas** con `@fontsource` (solo el subconjunto latino y los
  pesos usados), para no depender de Google Fonts ni esperar a otro dominio.
- **Luz de la ventana**: las paredes son planos sin hueco y no proyectan
  sombra, así que la luz principal ilumina toda la sala desde el lado de la
  ventana (no solo el haz). El polvo se ve solo dentro del haz, calculado en
  el shader.
- **Neón en letra manuscrita** (Caveat): el contorno de Space Grotesk dejaba
  la "S" deformada; la letra rellena se lee como tubo doblado a mano.
- **Pausa y Menú**: "Pausa" congela la escena (con un aviso); "Menú" abre el
  menú de pausa (proyectos, puertas, objetos, ambiente y calidad).
- **Encuadre con el panel abierto**: la vista se desplaza (`setViewOffset`)
  para que el objeto no quede detrás del panel.
- **Extras**: la ventana también es interactiva (día/noche). La radio activa
  el sonido al darle a reproducir, porque pulsar ese botón ya es pedir sonido.
- **Blanco y negro en los canvas**: algunas texturas usan blanco/negro como
  máscara de luminancia (lomos de libros, máscara del neón, halos). No son
  colores de marca: el color final lo pone el material o el uniform.
- **Peso por página** (`npm run peso-build`): reporta el peso de lo enlazado
  directamente en el `<head>` de cada `.html` (JS+CSS eager). Confirmé que
  Three.js/R3F/drei NO se cargan ahí — solo se descargan cuando el usuario
  entra a una sala 3D, vía `import()` dinámico (ver `EscenaIntroLaptop.tsx`,
  `EscenaSalaProyectos.tsx`, `EscenaHabitacionPersonal.tsx`).
- **Placeholders binarios**: generé imágenes `.png` (rectángulos de color
  liso) para los cuadros de proyecto, `og:image` y la imagen de "sin WebGL", y
  PDFs mínimos válidos para los 4 CVs, para que la app cargue algo real sin
  errores 404 mientras no tengas los archivos definitivos. El video del botón
  "Explorar el estudio" (`public/video/preview-estudio.mp4`) NO se generó
  (no hay forma razonable de crear un video de marcador útil) — el botón
  simplemente no mostrará video hasta que agregues ese archivo.
- **Vista previa del botón "Explorar el estudio"**: es un `<video>` en bucle,
  tal como pediste (no una escena 3D en vivo), para que sea barato de renderizar.

## Notas de accesibilidad y rendimiento ya implementadas

- Todo lo que existe en 3D (proyectos, gustos, CV) también existe como texto
  real: `PanelTexto` en las habitaciones y "Versión simple" en el estudio.
- `prefers-reduced-motion` se respeta: la intro mantiene la secuencia de scroll
  sin efectos de movimiento ni postproceso, y las cámaras 3D de las salas
  quedan estáticas por defecto (los controles orbitales igual permiten mirar).
- Si no hay soporte WebGL, se muestra la versión en texto con una imagen fija.
- "Saltar intro" recuerda la elección en `localStorage` (con `try/catch`).
- Three.js/R3F se cargan con `import()` dinámico en las 3 páginas con 3D.
- `frameloop="demand"` en las 3 escenas: sin scroll/interacción, no se renderiza.
- `devicePixelRatio` limitado (2 en escritorio, 1.5 en móvil) vía
  `src/utils/rendimiento.ts`, con `AdaptiveDpr` + `PerformanceMonitor` de drei
  bajando la calidad si caen los FPS.
- Prefetch (`<link rel="prefetch">`) de la página destino al pasar el mouse
  sobre una puerta o sobre el botón "Explorar el estudio".
- Carga progresiva de las texturas de proyecto: baja resolución primero, alta
  al acercar la cámara (`CuadroProyecto.tsx`).
#   c h c - s t u d i o  
 