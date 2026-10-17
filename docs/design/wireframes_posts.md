# Publicaciones `/posts/new`, `/posts/[id]/edit` y borrado — Red FaCyT
> **Pivot 2026-10-17**: esta pantalla fue **eliminada** con el dominio anterior (commit `9989b02`); el documento se conserva como referencia histórica. El nuevo dominio tendrá sus propios wireframes (Fase 2, `docs/pivot-project.md` §5).

Especificación de diseño del CRUD de publicaciones: los diálogos modales de
**creación** y **edición**, el diálogo de confirmación de **borrado**, la vista
de detalle que los dispara, y los cambios que el modelo de datos nuevo obliga en
el feed. El `developer` implementa este documento tal cual y el `qa-reviewer`
valida el resultado contra él.

- **Mapa de navegación y reglas de acceso:** [`wireframes.md`](wireframes.md) §1 y §3.2
- **Identidad visual y paleta:** [`brief.md`](brief.md)
- **Tokens de color (fuente de verdad):** `src/app/globals.css` — ver §8
- **Accesibilidad transversal:** [`accessibility.md`](accessibility.md)
- **Estándar de formato:** [`wireframes_feed.md`](wireframes_feed.md)
- **Patrón de formulario validado:** [`auth.md`](auth.md)
- **Requisitos del MVP:** [`../implementation/implementation_base.md`](../implementation/implementation_base.md) §Publicaciones
- **Arquitectura (inmutable):** [`../architecture/frontend-structure.md`](../architecture/frontend-structure.md)

> [!IMPORTANT]
> Este documento **redefine el modelo de datos de la publicación**. `PostCategory`
> y `PostType` intercambian sus conjuntos de valores y se añade `ResearchArea`.
> Es un cambio incompatible con lo implementado: afecta a `src/data/posts.ts`, a
> los filtros del feed ya construidos y a sus pruebas. El detalle está en §4 y en
> §9.3.

> [!IMPORTANT]
> El formulario es de **una sola columna**. Ningún campo va en rejilla ni en
> fila, a ningún breakpoint. Los botones de acción **sí** van en fila al pie (§3).

> [!NOTE]
> **Fase estructural.** Este documento fija la estructura, el modelo de datos y
> los contratos de accesibilidad, que son decisiones que conviene no deshacer.
> El acabado visual de cada vista —densidad, jerarquía tipográfica, tratamiento
> de la imagen, microcopia de los estados— se irá dando en iteraciones
> posteriores, cuando las pantallas existan y puedan verse renderizadas. Lo que
> aquí está decidido y lo que no, está marcado como tal en cada sección.

## 1. Propósito y dirección visual

El CRUD de publicaciones es la parte del sistema que **escribe**, mientras que
el feed es la parte que lee. La diferencia se nota en el tratamiento:

- **Diálogo sobre fondo, no página.** Crear y editar ocurren en un modal
  porque son tareas cortas y no quieren perder el feed que tenía abierto detrás:
  la persona viene del feed, publica y quiere seguir leyendo.
- **Una sola columna.** El formulario se lee de arriba abajo, como una ficha. La
  rejilla de dos campos obligaría a saltar la vista verticalmente entre etiqueta
  y valor, y en un formulario de escritura eso cuesta más de lo que ahorra
  espacio horizontal.
- **Botones en fila al pie.** Solo los botones se alinean en `sm`: la acción
  destructiva a la derecha, la de confirmar a la izquierda de ella, y `Cancelar`
  a la izquierda del conjunto. Es el orden que menos sorpresas da cuando el dedo
  busca "atrás" en una pantalla de móvil.
- **Un solo acento por pantalla.** El ámbar `--accent` aparece en **un**
  elemento: el botón de confirmar. Todo lo demás es neutro (`--bg` +
  `--surface`) salvo el borde `--danger` del diálogo de borrado y el fondo
  `--danger` de su botón. Igual que en el feed, el color no pinta superficies
  grandes (§8).
- **Sin widgets de autor.** No hay subir ficheros, ni selector de autor, ni preview
  enriquecido. El autor lo determina la sesión y la fecha la determina el
  sistema. Un campo que el usuario no puede cambiar en el momento de escribir no
  debe aparecer.

**Fuera de alcance por minimalismo:** editor Markdown con barra de herramientas,
vista previa con formato, guardado automático en borrador, historial de versiones,
programación de publicación, arrastrar y soltar para subir imagen, recorte de
imagen, moderación en cola, y borrado masivo.

## 2. Layout del diálogo

### 2.1 Anatomía del modal

El modal es un `Dialog` genérico (`src/components/ui/dialog.tsx`) con esta
estructura, que es la que comparten los tres diálogos:

```
┌─ backdrop ──────────────────────────────────┐
│  bg --bg con opacity 60%                    │
│  el contenido de (main) queda inert         │
├─ panel ─────────────────────────────────────┤
│  bg --surface, rounded-lg, shadow           │
│  borde --border                             │
│  w-full  →  max-w-xl (640px)  en sm+        │
│  max-h-[90dvh], flex flex-col               │
│  ├─ cabecera        shrink-0               │
│  │   h2  text-2xl font-semibold            │
│  │   p   text-sm text-text-muted           │
│  │   ✕  botón icono 44×44, esquina sup. d. │
│  ├─ cuerpo          overflow-y-auto        │
│  │   flex flex-col gap-4                   │
│  ├─ error           shrink-0 (FormAlert)   │
│  └─ pie             shrink-0               │
│      flex flex-col-reverse                 │
│           sm:flex-row sm:justify-end       │
│      gap-2, borde superior --border        │
└────────────────────────────────────────────┘
```

- **Ancho.** `max-w-xl` en escritorio, `w-full` en móvil. Es más ancho que la
  tarjeta de auth (`400px`, §5 de `wireframes.md`) porque tiene un `textarea` de
  6 filas que a 400px se vuelve ilegible. El margen a ambos lados en móvil es
  `p-4`.
- **Scroll.** El **cuerpo** scrollea, no el panel. Cabecera y pie quedan fijos
  para que `Cancelar` sea alcanzable sin desplazarse: un formulario largo cuyo
  botón de salida hay que buscar es un formulario que la gente abandona.
- **Cierre.** `✕` en la cabecera (44×44, esquina superior derecha), `Escape`, y
  `Cancelar`. Los tres hacen lo mismo y ninguno pide confirmación: perder un
  formulario a medio escribir es molesto, pero el contenido no es caro de
  reescribir (§10.6).

### 2.2 El modal vive sobre una ruta real

Los diálogos se montan en un slot `@modal` del layout `(main)`, no sobre la
página actual. Para que eso funcione hacen falta **dos** cosas: las rutas reales
y los interceptores `(.)`.

```
src/app/(main)/
├── layout.tsx                    → renderiza {children} + {modal}
├── @modal/
│   ├── default.tsx               → devuelve null
│   └── (.)posts/                 ← marcador de intercepción
│       ├── new/page.tsx          → <PostFormModal mode="create">
│       └── [id]/
│           ├── edit/page.tsx     → <PostFormModal mode="edit" postId>
│           └── delete/page.tsx   → <ConfirmDeleteModal postId>
└── posts/                        ← rutas reales, sin marcador
    ├── new/page.tsx              → misma UI, sin backdrop
    └── [id]/
        ├── page.tsx              → detalle (§6.7 de wireframes_post_detail.md)
        ├── edit/page.tsx         → misma UI, sin backdrop
        └── delete/page.tsx       → misma UI, sin backdrop
```

> [!IMPORTANT]
> **El `(.)` no es opcional.** Sin él, `@modal/posts/new/page.tsx` no intercepta
> nada: un slot paralelo se renderiza cuando la ruta del segmento implícito
> (`children`) resuelve, y `posts/new` solo resuelve si existe
> `posts/new/page.tsx`. Si falta ese archivo, `/posts/new` da **404** y el modal
> no llega a pintarse nunca.
>
> Con `(.)` el comportamiento es el que pide este documento: una navegación
> suave desde `/feed` a `/posts/new` muestra el diálogo con **el feed debajo, sin
> descargarse**; una carga directa de `/posts/new` —enlace compartido, pestaña
> nueva, `F5`— cae en `posts/new/page.tsx` y muestra la misma interfaz sin
> backdrop. Las dos rutas existen y las dos funcionan, y el botón atrás lleva al
> feed en ambos casos.

Cuando `@modal` devuelve `null`, `children` ocupa el ancho completo. Cuando hay
una página en `@modal`, `children` se renderiza **debajo y atenuado**, como
fondo. `src/app/(main)/layout.tsx` (ya existente) tiene que envolver el
contenido de `{children}` en el `div` del backdrop y renderizar `{modal}` como
hermano **dentro** del mismo contenedor, no fuera.

> [!IMPORTANT]
> Las rutas **existen** aunque el contenido sea un diálogo. `/posts/new` es el
> destino del `EmptyState` del feed (`wireframes_feed.md` §5.7), del CTA del
> navbar y de la bottom-nav; `/posts/[id]` es el destino del título de cada
> tarjeta. Si el modal fuera un estado en memoria habría que cambiar esos enlaces
> y se perdería el botón atrás (§10.1).

## 3. Wireframes

### 3.1 Crear — `/posts/new`

```
┌────────────────────────────────────────────────┐
│ Crear publicación                            ✕ │
│ Los campos obligatorios están marcados con *.   │
├────────────────────────────────────────────────┤
│ Título *                                       │
│ ┌────────────────────────────────────────────┐ │
│ │ Ej. defensa de tesis — María Rivas        │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Descripción *                                  │
│ ┌────────────────────────────────────────────┐ │
│ │                                            │ │
│ │                                            │ │
│ └────────────────────────────────────────────┘ │
│ Incluye un #palabraclave para que tus          │
│ publicaciones se encuentren en el buscador.    │
│                                                │
│ Palabras clave                                 │
│ #defensa  #rii            ← solo lectura        │
│ Las palabras clave se toman automáticamente     │
│ de los # de la descripción.                    │
│                                                │
│ Imagen (opcional)                              │
│ ┌────────────────────────────────────────────┐ │
│ │ https://…                                  │ │
│ └────────────────────────────────────────────┘ │
│ Por ahora la imagen se referencia con una      │
│ dirección web. La subida de archivos llegará   │
│ con el almacenamiento.                         │
│                                                │
│ Tipo de publicación *                          │
│ ┌────────────────────────────────────────────┐ │
│ │ Elige un tipo…                          ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Categoría *                                    │
│ ┌────────────────────────────────────────────┐ │
│ │ Elige una categoría…                   ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Área de investigación *                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Elige primero una categoría…           ▾ │ │
│ └────────────────────────────────────────────┘ │
│ Elige primero una categoría.                   │
├────────────────────────────────────────────────┤
│           ┌─────────────┐  ┌────────────────┐ │
│           │  Cancelar   │  │    Publicar    │ │
│           └─────────────┘  └────────────────┘ │
└────────────────────────────────────────────────┘
```

### 3.2 Editar — `/posts/[id]/edit`

Mismo esqueleto. Cambian el título, el subtítulo, los valores iniciales, el
campo 9 deshabilitado y el botón de confirmar.

```
┌────────────────────────────────────────────────┐
│ Editar publicación                           ✕ │
│ María Rivas · 12 mar 2026                      │
├────────────────────────────────────────────────┤
│ Título *                                       │
│ ┌────────────────────────────────────────────┐ │
│ │ Defensa de tesis — María Rivas          │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Descripción *                                  │
│ ┌────────────────────────────────────────────┐ │
│ │ Defendí mi tesis sobre… #defensa #rii     │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Palabras clave                                 │
│ #defensa  #rii                                 │
│                                                │
│ Fecha de publicación                           │
│ ┌────────────────────────────────────────────┐ │
│ │ 12 mar 2026   ·  texto atenuado  ·       │ │  ← deshabilitado
│ └────────────────────────────────────────────┘ │
│ No se puede cambiar después de publicar.       │
│                                                │
│ Imagen (opcional)                              │
│ ┌────────────────────────────────────────────┐ │
│ │ https://…                                  │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Tipo de publicación *                          │
│ ┌────────────────────────────────────────────┐ │
│ │ Defensas                               ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Categoría *                                    │
│ ┌────────────────────────────────────────────┐ │
│ │ Computación                            ▾ │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Área de investigación *                        │
│ ┌────────────────────────────────────────────┐ │
│ │ Inteligencia Artificial               ▾ │ │
│ └────────────────────────────────────────────┘ │
│ El área se ajusta a la categoría elegida.      │
├────────────────────────────────────────────────┤
│           ┌─────────────────┐ ┌───────────────┐ │
│           │    Cancelar     │ │ Guardar       │ │
│           └─────────────────┘ └───────────────┘ │
└────────────────────────────────────────────────┘
```

### 3.3 Editar un borrador

Si el post está en `borrador`, el pie tiene **tres** botones y el de la derecha
sigue siendo el único `primary`:

```
┌────────────────────────────────────────────────┐
│           ┌──────────────┐ ┌──────────────┐ ┌─┐ │
│           │  Cancelar    │ │Guardar       │ │ │ │
│           │              │ │borrador      │ │ │ │
│           └──────────────┘ └──────────────┘ └─┘ │
└────────────────────────────────────────────────┘
   ghost       secondary                primary
                                        Publicar
```

`Publicar` pasa la publicación a `publicado` y le asigna `publishedAt` si no lo
tenía. `Guardar borrador` la deja en `borrador`. El motivo de los tres botones es
que publicar y guardar no son el mismoacto y el usuario casi siempre quiere
guardar sin exponer: forzarle a elegir entre "guardar" y "publicar" cuando quiere
guardar produce publicaciones publicadas por error (§10.7).

### 3.4 Confirmación de borrado — `/posts/[id]/delete`

`max-w-md`, centered, sin imagen ni metadatos: solo la advertencia.

```
┌────────────────────────────────────────────┐
│                                            │
│  ⚠   ¿Eliminar esta publicación?           │
│                                            │
│      «Defensa de tesis — María Rivas»     │
│      se eliminará de forma permanente      │
│      y no podrás recuperarla.              │
│                                            │
│  ┌────────────────┐  ┌──────────────┐    │
│  │    Cancelar    │  │  Eliminar    │    │
│  └────────────────┘  └──────────────┘    │
│   ↑ foco inicial           ↑ --danger     │
└────────────────────────────────────────────┘
```

El icono `⚠` es `AlertTriangleIcon` de `src/components/ui/icons.tsx`, a `--danger`,
`aria-hidden="true"`. El título lleva un `<span class="sr-only">` con
`Advertencia:` para que un lector de pantalla no anuncie solo el signo.

### 3.5 Estado de borrado en curso

El botón `Eliminar` pasa a `Eliminando…`, `disabled`, y el `Cancelar` también se
deshabilita: durante la operación ya no hay nada que cancelar sin dejar la vista
en un estado inconsistente. Si la operación falla, ambos vuelven a su estado
normal y el `FormAlert` muestra `No se pudo eliminar la publicación. Inténtalo de nuevo.`

### 3.6 Estado de error de validación

El `FormAlert` aparece entre el cuerpo y el pie (§2.1), no arriba del formulario:
está pegado al mensaje y el foco salta a él.

```
├────────────────────────────────────────────────┤
│ ⚠ Revisa 2 campos antes de continuar.         │  ← FormAlert, role="alert"
├────────────────────────────────────────────────┤
│ Título *                                       │
│ ┌────────────────────────────────────────────┐ │
│ │ Def                                        │ │
│ └────────────────────────────────────────────┘ │
│ El título debe tener entre 5 y 120 caracteres. │  ← --danger
```

## 4. Contratos de datos

### 4.1 El intercambio `PostCategory` ↔ `PostType`

`PostCategory` pasa a ser el **rubro de clasificación** y `PostType` pasa a ser
la **naturaleza institucional**. Los dos conjuntos de valores se han intercambiado.
Esto reescribe `src/lib/types.ts:42-53`:

```ts
/** Naturaleza institucional de la publicación. */
export type PostType =
  | "noticias" | "eventos" | "defensas" | "investigacion" | "convocatorias";

/**
 * Rubro de clasificación de la publicación.
 *
 * Son cinco disciplinas académicas de la FCT más un track de desarrollo
 * profesional, que no es una disciplina: existe porque el programa formativo
 * exige desarrollar habilidades blandas además de las técnicas. Ver §10.15.
 */
export type PostCategory =
  | "matematicas" | "biologia" | "quimica" | "fisica"
  | "computacion" | "crecimiento-profesional";
```

> [!NOTE]
> Los identificadores conservan el nombre `categoria` y `tipo` en la URL
> (`filters.ts:61-62`) pero **cambian de significado**: `?categoria=computacion`
> ahora es una disciplina y `?tipo=defensas` una naturaleza. Los enlaces
> compartidos con la semántica anterior degradan a `"todas"` por la tolerancia
> que ya existe en `fromSearchParams` (`wireframes_feed.md` §5.6), así que no
> rompen, pero devuelven la lista completa sin filtro.

### 4.2 `ResearchArea`

38 áreas más un valor `general` **por categoría** (44 en total). El valor
`general` se repite a propósito: cada categoría necesita un destino válido para
una publicación que no pertenezca a ninguna área concreta, y forzarla a elegir un
área para una noticia cualquiera sería pedirle a la persona que invente.

```ts
export type ResearchArea =
  // mathematicas
  | "general" | "estadistica" | "probabilidad" | "optimizacion"
  | "matematicas-aplicadas" | "modelado-matematico"
  // biologia
  | "biotecnologia" | "bioquimica" | "genetica" | "microbiologia"
  | "ecologia" | "bioinformatica"
  // quimica
  | "quimica-analitica" | "quimica-organica" | "quimica-inorganica"
  | "fisicoquimica" | "quimica-medioambiental"
  // fisica
  | "fisica-computacional" | "fisica-de-materiales" | "astronomia"
  | "fisica-nuclear" | "mecanica-de-fluidos"
  // computacion
  | "inteligencia-artificial" | "aprendizaje-automatico" | "ciencia-de-datos"
  | "desarrollo-web" | "ingenieria-software" | "redes-telecomunicaciones"
  | "seguridad-informatica" | "sistemas-distribuidos" | "bases-de-datos"
  | "computacion-grafica" | "robotica" | "arquitectura-computadores"
  // crecimiento-profesional
  | "gestion-proyectos" | "liderazgo" | "emprendimiento"
  | "comunicacion-profesional" | "etica-profesional";
```

#### Áreas por rubro

**Disciplinas de la FCT.** Las cinco tienen `General` como primera área, para que
una publicación de la disciplina no esté obligada a pertenecer a un grupo de
investigación concreto.

| Disciplina         | Áreas                                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `matematicas`      | `General` · `Estadística` · `Probabilidad` · `Optimización` · `Matemáticas Aplicadas` · `Modelado Matemático`                                                                                                                                                                |
| `biologia`         | `General` · `Biotecnología` · `Bioquímica` · `Genética` · `Microbiología` · `Ecología` · `Bioinformática`                                                                                                                                                                 |
| `quimica`          | `General` · `Química Analítica` · `Química Orgánica` · `Química Inorgánica` · `Fisicoquímica` · `Química Medioambiental`                                                                                                                                                   |
| `fisica`           | `General` · `Física Computacional` · `Física de Materiales` · `Astronomía` · `Física Nuclear` · `Mecánica de Fluidos`                                                                                                                                                    |
| `computacion`      | `General` · `Inteligencia Artificial` · `Aprendizaje Automático` · `Ciencia de Datos` · `Desarrollo Web` · `Ingeniería de Software` · `Redes y Telecomunicaciones` · `Seguridad Informática` · `Sistemas Distribuidos` · `Bases de Datos` · `Computación Gráfica` · `Robótica` · `Arquitectura de Computadores` |

**Track de desarrollo profesional.** No es una disciplina y no se mezcla con
ellas en ningún listado; sus áreas son Competencias Blandas.

| Track                    | Áreas                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crecimiento-profesional` | `General` · `Liderazgo y Gestión de Equipos` · `Comunicación Profesional` · `Ética Profesional` · `Emprendimiento` · `Gestión de Proyectos` |

`General` se mantiene también en el track, aunque sus áreas ya sean concretas,
por uniformidad: la validación `researchArea === "general" || pertenece a la
categoría` no admite excepciones, y el valor por defecto del selector dependent
es el mismo en los seis rubros (§10.16).

`Bioinformática` y `Física Computacional` son áreas puente: se colocan bajo su
disciplina dominante, no bajo `Computación`, porque el área describe a qué
grupo se adscribe la publicación (§10.4).

### 4.3 `Post` y `PostFormValues`

```ts
export type Post = {
  id: string;
  title: string;
  /** Cuerpo completo en Markdown. Mostrado como texto plano en la fase estática. */
  content: string;
  authorId: string;
  /** Naturaleza institucional. */
  type: PostType;
  /** Disciplina. */
  category: PostCategory;
  /** Área de investigación; siempre pertenece a `category`. */
  researchArea: ResearchArea;
  visibility: PostVisibility;
  /** ISO 8601. Clave de orden del feed (siempre descendente). */
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  /** `null` es un valor válido: la imagen es opcional. */
  imageUrl: string | null;
};

/** Valores del formulario. Sin `visibility`: la fija el botón pulsado (§5.1.1). */
export type PostFormValues = {
  title: string;
  content: string;
  imageUrl: string;
  type: PostType;
  category: PostCategory;
  researchArea: ResearchArea;
};
```

Dos campos que se esperan y **no** están, y el motivo de cada uno:

- `publishedAt` no está porque `implementation_base.md` §Publicaciones prohíbe
  editar la fecha de publicación. Es la razón por la que no hay un `Field` que la
  envíe (§5.2).
- `visibility` no está porque la lleva el botón pulsado, no el formulario
  (§5.1.1, §10.7). El tipo que la expresa es el del botón:

```ts
/** Discrimina el botón pulsado, no un campo del formulario. */
export type PostSubmitIntent = "publicar" | "guardar-borrador";
```

`PostVisibility` sigue en `Post` porque `Oculto` lo administra un administrador
desde el detalle (§5.6) y ese estado no se escribe desde aquí.

### 4.4 `PostFilters`

```ts
export type PostFilters = {
  keyword: string;
  /** Disciplina. */
  category: PostCategory | "todas";
  /** Naturaleza institucional. */
  type: PostType | "todos";
  /** Área. La URL acepta "todas" o el slug; "general" sí es un valor filtrable. */
  researchArea: ResearchArea | "todas";
  authorId: string | "todos";
  status: PostVisibility | "todos";
  dateFrom: string | null;
  dateTo: string | null;
};
```

Parámetros de URL: `q`, `categoria`, `tipo`, `area`, `autor`, `estado`, `desde`,
`hasta`. Se añade `area`; los otros dos cambian de significado (§4.1). Todo lo
demás de `src/lib/filters.ts` sigue igual: `router.replace`, tolerancia a valores
inválidos, y cuenta de filtros activos.

### 4.5 Repositorios

`src/lib/repositories/post-repository.ts` tiene hoy `findVisible` y `findById`
(`:51-64`). Añade:

```ts
export type CreatePostInput = {
  title: string; content: string; imageUrl: string | null;
  type: PostType; category: PostCategory; researchArea: ResearchArea;
  /** Derivada del botón pulsado, no de un campo del formulario (§5.1.1). */
  visibility: Extract<PostVisibility, "publicado" | "borrador">;
};

export type UpdatePostInput = Partial<Omit<CreatePostInput, "visibility">>;

export interface PostRepository {
  // … findVisible y findById sin cambios …

  /** Crea una publicación. Fija `authorId` desde la sesión, nunca desde el formulario. */
  create(input: CreatePostInput, session: Session): Promise<Post>;

  /** Actualiza. Lanza si la publicación no existe o si la sesión no es su autor. */
  update(id: string, patch: UpdatePostInput, session: Session): Promise<Post>;

  /** Borrado definitivo. Ver §10.5. */
  remove(id: string, session: Session): Promise<void>;

  /** Solo `admin`. Único camino hacia "oculto" (§10.5). */
  setVisibility(
    id: string,
    visibility: PostVisibility,
    session: Session,
  ): Promise<Post>;
}
```

> [!IMPORTANT]
> `authorId` y `publishedAt` **no** viajan en `CreatePostInput`. Si el
> formulario los enviara, un cliente manipulado podría publicar como otra
> persona o con una fecha arbitraria. Los fija el repositorio a partir de la
> sesión.

### 4.6 Validación

`src/lib/validation/post.ts`, con la misma forma que `src/lib/validation/auth.ts`:
funciones por campo que devuelven `string | null`, y un validador de formulario
que devuelve `{ success, errors }`.

| Campo       | Regla                                                                 |
| ----------- | --------------------------------------------------------------------- |
| `title`     | 5–120 caracteres tras `trim`                                          |
| `content`   | 30–4000 caracteres tras `trim`                                        |
| `imageUrl`  | Vacío, o URL `http`/`https` válida                                   |
| `type`      | Uno de los 5 valores                                                  |
| `category`  | Uno de los 6 rubros: 5 disciplinas + 1 track                           |
| `researchArea` | Pertenece a `category`, o es `general`                              |
| `visibility`| `publicado` o `borrador`                                             |

Las reglas de tipo de enumeración se validan en el servidor también, no solo en
el cliente: un `FormData` manipulado puede traer cualquier string.

## 5. Inventario y copy

### 5.1 Controles del formulario

Todos a ancho completo, en una columna, `gap-4`. En este orden.

| #   | Etiqueta                  | Control              | Regla                                             | Texto de ayuda                                                                                                  | Mensaje de error                                     |
| --- | ------------------------- | -------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `Título` + `*`            | `Field`              | obligatorio, `maxLength={120}`, `autoFocus`         | —                                                                                                                | `El título debe tener entre 5 y 120 caracteres.`      |
| 2   | `Descripción` + `*`       | `Textarea`           | obligatorio, 30–4000, `rows={6}`, `maxLength={4000}`| `Incluye un #palabraclave para que tus publicaciones se encuentren en el buscador.`                             | `La descripción debe tener al menos 30 caracteres.`    |
| 3   | `Palabras clave`          | chips de solo lectura | derivadas, no es un `input`                        | `Las palabras clave se toman automáticamente de los # de la descripción.`                                         | —                                                     |
| 4   | `Imagen (opcional)`       | `Field type="url"`   | opcional, `maxLength={500}`                         | `Por ahora la imagen se referencia con una dirección web. La subida de archivos llegará con el almacenamiento.`   | `Escribe una dirección web válida.`                    |
| 5   | `Tipo de publicación` + `*` | `SelectField`      | obligatorio, sin preselección, 5 opciones           | —                                                                                                                | `Elige un tipo de publicación.`                       |
| 6   | `Categoría` + `*`         | `SelectField` con `optgroup` | obligatorio, sin preselección, 2 grupos: 5 disciplinas + 1 track | `Las cinco primeras son disciplinas de la facultad. La última agrupa habilidades blandas.` | `Elige una categoría.`                                 |
| 7   | `Área de investigación` + `*` | `SelectField`   | obligatorio, **dependiente** de 6, `disabled`        | `Elige primero una categoría.` → `El área se ajusta a la categoría elegida.`                                     | `Elige un área de investigación.`                      |

Son **7 controles**, no 8: no hay campo `Visibilidad` (§5.1.1).

El asterisco va dentro del `<label>` como `<span aria-hidden="true">*</span>` y el
campo lleva `required`. Los campos 1, 2, 5, 6 y 7 son obligatorios; el 4 es el
único opcional. La cabecera dice `Los campos obligatorios están marcados con *.`
para que el asterisco no sea el único aviso.

#### 5.1.1 Por qué no hay campo `Visibilidad`

La visibilidad **no es un campo del formulario**: la llevan los botones del pie
(§5.5). Poner un selector `Publicado / Borrador` y además un botón `Publicar` es
pedir la misma decisión dos veces, y el usuario que yerre la yerra dos veces: si
elige `Borrador` en el selector y pulsa `Publicar`, gana el botón y el selector
queda mintiendo en la pantalla.

El botón es mejor que el selector por una razón concreta: **el botón dice lo que
hace**. `Publicar` publica; `Guardar borrador` deja en borrador. Un selector obliga
a leer la etiqueta del campo y el valor elegido para saber qué va a pasar, y con
un valor por defecto (`publicado`) es fácil no mirar nada y publicar sin querer.

Como el botón ya fija la visibilidad, **crear y editar solo necesitan los mismos
7 campos**. Lo que cambia entre publicar y guardar es el botón que se pulsa, no
el formulario. Consecuencias:

- No hay `defaultValue` de visibilidad que mantener sincronizada con el estado real.
- `PostFormValues` no lleva `visibility`: lo fija el botón pulsado (§5.5).
- El estado de una publicación en edición se lee del post, no de un campo del
  formulario. Por eso editar un borrador muestra tres botones y no dos (§3.3).
- El enum `PostVisibility` sigue existiendo en el modelo, porque `Oculto` lo
  administra un administrador y no se edita desde aquí (§5.6).

### 5.2 El campo de fecha en modo edición

En editar, entre los campos 2 y 3, aparece un `Field` deshabilitado con el valor
de `formatDate(publishedAt)` y esta ayuda:

> `No se puede cambiar después de publicar.`

Se muestra **deshabilitado y visible**, no oculto (§10.8).

### 5.3 Copy de los valores

| Grupo       | Etiquetas                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Tipo        | `Noticias` · `Eventos` · `Defensas` · `Investigación` · `Convocatorias`                                  |
| Categoría   | `Matemáticas` · `Biología` · `Química` · `Física` · `Computación` · `Desarrollo profesional`             |
| Área        | `General` primero, después las áreas del rubro elegido, según §4.2                                       |

La visibilidad no aparece en esta tabla porque no es un campo. Sus dos
etiquetas —`Publicado` y `Borrador`— son las de los botones del pie (§5.5).

La `Categoría` es el **único `select` con `<optgroup>`**, porque mezcla dos cosas
que el lector no debe confundir (§10.15):

| `<optgroup label>`  | Valores                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `Disciplinas`       | `Matemáticas` · `Biología` · `Química` · `Física` · `Computación`                                     |
| `Desarrollo profesional` | `Desarrollo profesional` (un solo valor, el track de habilidades blandas)                         |

El `helpText` del control lo dice sin rodeos: `Las cinco primeras son
disciplinas de la facultad. La última agrupa habilidades blandas.` Quien
selecciona la última sabe que no está eligiendo un departamento, y quien
selecciona una disciplina no espera encontrar una sexta.

Texto de apoyo de cada opción de visibilidad:

| Valor         | Texto                                                  |
| ------------- | ------------------------------------------------------ |
| `Publicado`   | `Todos los usuarios de la red podrán verla.`           |
| `Borrador`   | `Solo tú podrás verla.`                                |

`Oculto` **no aparece** en el formulario: solo un administrador lo establece, con
`Ocultar` en el detalle (§3.4 y §5.6). El enum completo sigue siendo el de
`Post`; lo que no se escribe desde el formulario.

Primera opción de cada `SelectField` sin preselección:

| Campo       | `<option>` inicial                            |
| ----------- | ---------------------------------------------- |
| Tipo        | `Elige un tipo…` (deshabilitada, `value=""`)  |
| Categoría   | `Elige una categoría…` (deshabilitada, `value=""`) |
| Área        | `Elige primero una categoría…` (deshabilitada) |

La etiqueta del control sigue siendo `Categoría` y no `Rubro`, porque `Categoría`
es la palabra que el proyecto ya usa en la URL (`?categoria=`) y en el filtro del
feed. Renombrarla obligaría a tocar las tres cosas a la vez para ganar precisión
que el `optgroup` ya aporta.

### 5.4 Copy de los estados

| Situación                        | Título                                        | Cuerpo                                                            |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Envío en curso (crear)           | —                                             | `Publicando…` en el botón                                        |
| Envío en curso (editar)          | —                                             | `Guardando…` en el botón                                         |
| Envío en curso (borrador)        | —                                             | `Guardando…` en `Guardar borrador`                               |
| Envío en curso (publicar)        | —                                             | `Publicando…` en `Publicar`                                       |
| Error de validación              | `Revisa {n} campos antes de continuar.`        | `{n}` en singular o plural según `auth.md`                        |
| Error de servidor (crear/editar) | `No se pudo guardar la publicación.`          | `Inténtalo de nuevo.`                                             |
| Error de servidor (borrar)       | `No se pudo eliminar la publicación.`         | `Inténtalo de nuevo.`                                             |
| Error de permisos                | `No tienes permiso para editar esta publicación.` | —                                                            |
| Borrado correcto                 | —                                             | `Publicación eliminada.` en región `aria-live="polite"`, luego navegar a `/feed` |

Con un solo campo con error, el `FormAlert` dice `Revisa este campo antes de
continuar.`

### 5.5 Copy de los botones

| Contexto                          | Botones (izquierda → derecha)                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| Crear                             | `Cancelar` (secondary) · `Publicar` (primary)                                          |
| Editar publicación publicada      | `Cancelar` (secondary) · `Guardar cambios` (primary)                                   |
| Editar borrador                   | `Cancelar` (ghost) · `Guardar borrador` (secondary) · `Publicar` (primary)            |
| Confirmar borrado                 | `Cancelar` (secondary) · `Eliminar` (danger)                                           |

La etiqueta del botón de confirmar sigue al verbo que hizo la persona: `Publicar`
cuando va a publicar, `Guardar cambios` cuando va a guardar lo que ya era visible.
Decir `Aceptar` obligaría a mirar el contexto para saber qué hace el botón (§10.9).

### 5.6 Copy de los botones de la vista de detalle

| Rol              | Acciones                                                         |
| ---------------- | ---------------------------------------------------------------- |
| Autor            | `Editar` (secondary) · `Eliminar` (ghost con texto `--danger`)   |
| Admin sobre otro | `Ocultar` / `Mostrar` (ghost) · `Eliminar` (ghost con texto `--danger`) |
| Resto            | ninguna                                                          |

Ningún botón de icono: las tres acciones caben con texto, y un icono solo obligaría
a un `aria-label` para todo el mundo que ya sabe leer.

## 6. Componentes

### 6.1 `src/components/ui/dialog.tsx` — cliente

Shell modal reutilizable. Es el único componente de `ui/` que necesita `"use
client"` por gestión de foco.

```tsx
type DialogProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;   // id del h2
  describedBy?: string; // id del subtítulo o del cuerpo
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "xl";  // max-w-md | max-w-xl
};
```

Responsabilidades: `role="dialog"`, `aria-modal="true"`, foco atrapado,
`inert` en el fondo, scroll lock, `Escape`, restauración del foco. No conoce nada
del dominio. La lógica de UI está en §7.

### 6.2 `src/components/ui/confirm-dialog.tsx` — cliente

Envoltorio de `Dialog` con el patrón destructivo. Propiedades: `open`, `onClose`,
`onConfirm`, `title`, `body`, `confirmLabel`, `isPending`. Poner el foco en
`Cancelar` es comportamiento suyo, no del `Dialog` (§7.3).

### 6.3 `src/components/ui/textarea.tsx` — servidor

Espejo de `Field` (`src/components/ui/field.tsx`): `<label>` real, `useId`,
`aria-describedby` compuesto, `aria-invalid`, `border-danger` en error,
`min-h-11`. Añade contador opcional de caracteres y el helper `showCount` para
el campo 2. No necesita `"use client"`.

### 6.4 `src/components/ui/radio-group.tsx` — servidor

`fieldset` + `legend` con `RadioHTMLAttributes` nativos. Cada opción es un
`<label>` que envuelve su `<input type="radio">` y su texto de apoyo, de modo que
el área de toque cubre la fila entera. `name`, `required` y `error` como en
`SelectField`.

### 6.5 `src/components/ui/button.tsx` — modificar

`ButtonVariant` pasa de `primary | secondary | ghost` (`:11`) a
`primary | secondary | ghost | danger`:

```ts
danger: "bg-danger text-accent-foreground hover:bg-danger/90",
```

`BUTTON_BASE_CLASSES` no cambia: el `min-h-11` de la zona táctil se hereda
gratis.

### 6.6 `src/components/forms/post-form.tsx` — cliente

El formulario completo, en los dos modos. Ruta ya reservada en
`frontend-structure.md:68`.

```tsx
type PostFormProps = { mode: "create" } | { mode: "edit"; postId: string };
```

Estado: los siete valores del formulario, el borrador de la categoría (para
poblar el `SelectField` de área), y los errores de campo. El servidor le pasa los
valores iniciales del post cuando `mode === "edit"`.

Reglas:

- Al cambiar `category`, `researchArea` pasa a `"general"` y el `SelectField` de
  área se vuelve a poblar desde `AREAS_BY_CATEGORY`.
- El campo de área se renderiza `disabled` mientras `category === ""`.
- En `edit`, `publishedAt` se muestra pero no se envía.
- Al enviar: valida con `validatePostForm`, si falla pone los errores y mueve el
  foco al primero; si pasa, llama al repositorio y cierra con `router.replace`
  al detalle en modo crear, y a `/feed` en modo borrador.
- `imageUrl` vacío se envía como `null`, nunca como `""`.

### 6.7 `src/components/feed/post-detail.tsx` — cliente

La vista `/posts/[id]`. Ruta ya reservada en `frontend-structure.md:63`.

**El cuerpo de esta vista está especificado en
[`wireframes_post_detail.md`](wireframes_post_detail.md)**, que existe porque
este documento dejaba el cuerpo abierto. Este documento manda sobre la cabecera,
los botones de acción (§5.6) y la imagen principal (§8.3).

Corrección de este documento: **no es un Server Component.** La sesión vive en
`localStorage` y la resuelve `SessionProvider`, que es `"use client"`
(`StaticAuthGateway.getSession()` devuelve `null` en servidor). Como §5.6 exige
botones que dependen del rol, un componente de servidor no puede decidir qué
pintar. El reparto es: `posts/[id]/page.tsx` es servidor y hace `findById` +
`notFound()` + resuelve el autor; `post-detail.tsx` es cliente y aplica
`canViewPost`. Es el mismo reparto que ya usa el feed.

Los tres botones no son `<button onClick>`: cada uno es un `<Link>` a la ruta del
diálogo en `@modal`, de modo que funcionan con teclado, con el botón atrás y con
abrir en pestaña nueva. `Eliminar` es un `Link` a `/posts/[id]/delete` con
`text-danger`, **no** un `button` con `onClick`.

### 6.8 `src/components/feed/post-card.tsx` — modificar

`imageUrl` existe en `src/lib/types.ts:82` y vale `null` en los 9 fixtures, pero
**la tarjeta no lo renderiza**: `grep -rn imageUrl src/` solo devuelve la
declaración del tipo y los `null` de `posts.ts`. Hay que añadir:

1. **Banda de imagen** si `imageUrl` no es `null`: `<div class="aspect-video">`
   con `<Image fill sizes="..." alt="" />`. El `alt` va vacío a propósito: la
   imagen es decorativa y el título, justo debajo, ya nombra la publicación
   (§10.11).
2. **Sin banda si `imageUrl` es `null`**, y sin caja de reserva. Un tinte vacío
   por cada tarjeta sin imagen produce un mar de rectángulos sin contenido
   (§10.11).
3. **Línea de taxonomía** bajo la fecha: `Categoría · Área` en
   `--text-muted`, 14px, con la etiqueta legible y no solo el slug. Para el track
   de desarrollo profesional se lee `Desarrollo profesional · Liderazgo`, que no
   finge que exista un departamento detrás (§10.15).
4. **Chips de palabras clave**: hasta 3, con la forma normalizada (`#defensa`),
   y `+{n}` si sobran. Van junto al badge de `type`.

El badge de `type` pasa de "Tipo de publicación" a la naturaleza, y el texto del
extracto no cambia.

### 6.9 `src/components/feed/filter-bar.tsx` — modificar

Añade un `SelectField` labeled `Área de investigación`. Pasa a 5 desplegables:
buscador + `Tipo` + `Categoría` + `Área` + `Autor` + `Estado` *(condicional)*.

- **`Área` es independiente de `Categoría`** en el filtro, y muestra las 44
  opciones agrupadas por `<optgroup label="Matemáticas">`… más `Todas las áreas`
  como primera opción. Acoplar dos filtros en el mismo panel hace que
  "Limpiar filtros" y una URL compartida caigan en estados imposibles de razonar
  (§10.3).
- Escritorio: los `SelectField` en una rejilla de 3 columnas, con `size="sm"`.
- Móvil: dentro del panel plegable que ya existe, sin cambios de estructura.
- `Estado` sigue siendo condicional (`wireframes_feed.md` §5.2).

> [!WARNING]
> Con 5 desplegables más el buscador y el rango de fechas, el layout de escritorio
> queda justo. Hay que comprobarlo renderizado. Si desborda, el plan B es un
> único `SelectField` que combina `Tipo` y `Área` en un solo desplegable con
> `optgroup`, dejando 4.

### 6.10 `src/lib/keywords.ts` — nuevo

Extracción de palabras clave. Reutiliza `normalizeSearchText` de
`src/lib/filters.ts` (§10.2 de `wireframes_feed.md`) en vez de duplicarlo.

```ts
/** Una etiqueta empieza en frontera de palabra, exige 2 caracteres y admite
 *  letras, dígitos, `_` y `-` internos. */
const TAG = /(?:^|\s)#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu;

export function extractKeywords(content: string): string[];
// trim → extract con TAG → filtrar longitud ≥ 2 → normalizar con
// normalizeSearchText → deduplicar por forma normalizada → conservar orden de
// aparición → cortar a 12
```

Falsos positivos que la regla de frontera evita: `palabra#etiqueta` no cuenta
porque no hay espacio delante, y `https://ejemplo.com#seccion` tampoco.

### 6.11 `src/components/ui/icons.tsx` — modificar

Añade `TagIcon` siguiendo el patrón de los ocho existentes: SVG propio, 24×24,
`stroke="currentColor"`, `stroke-width={1.75}`, `aria-hidden="true"`,
`focusable="false"`. Sin emoji, tampoco en los wireframes de este documento.
`AlertTriangleIcon` y `XIcon` ya existen y son los que usan §3.4 y §2.1.

`ArrowLeftIcon` lo añade el detalle (`wireframes_post_detail.md` §4.1) para el
enlace de vuelta. No reutilizar `ChevronLeftIcon` ni `ChevronRightIcon`: esos dos
son los controles del carrusel de `wireframes_welcome.md` y un chevron aquí se
leería como "anterior" dentro de una secuencia, no como "salir a la lista".

**`ImageIcon` no se crea.** No hay ninguna acción sobre la imagen: la banda es
decorativa con `alt=""` y el título ya la nombra (§10.11). Un icono sin consumidor
es una decisión que dentro de seis meses nadie recuerda haber tomado.

## 7. Accesibilidad (WCAG 2.2 AA)

Transversal en [`accessibility.md`](accessibility.md). Lo específico de estos
diálogos:

### 7.1 Patrón WAI-ARIA Dialog

`role="dialog"`, `aria-modal="true"`, `aria-labelledby` apuntando al `h2` de la
cabecera y `aria-describedby` al subtítulo. Es el patrón oficial, no una
adaptación.

- **Foco atrapado.** `Tab` y `Shift+Tab` ciclan entre los controles del diálogo.
  El foco no puede salir a la página de detrás mientras el modal está abierto.
- **Fondo inerte.** El contenido de `(main)` recibe `inert` y `aria-hidden="true"`
  mientras hay un modal abierto, para que ni la navegación por enlace ni el
  árbol de accesibilidad lo alcancen.
- **Scroll lock.** `overflow: hidden` en `<body>`.
- **`Escape`** cierra el diálogo. En el de borrado, `Escape` equivale a
  `Cancelar`: nunca a `Eliminar`.
- **Restauración.** Al cerrar, el foco vuelve al elemento que abrió el diálogo.
  Si ese elemento ya no existe (el post se borró), va al `h1` de la página.

### 7.2 Formulario en una columna

Una sola columna evita el problema de tabulación cruzado: el orden de tabulación
es el orden visual, porque solo hay una dirección. Cada control `min-h-11`
(44px, WCAG 2.5.8). El `textarea` admite `rows={6}` pero crece hasta 12 filas y
luego scrollea internamente, para no empujar el pie fuera de la pantalla.

### 7.3 Diálogo destructivo

- El foco inicial va a **`Cancelar`**, nunca al botón destructivo. Enfocar
  "Eliminar" deja a un refinement de un segundo de pulsar `Enter` sobre la acción
  irreversible: es la bakery de datos y no tiene excusa.
- `Escape` y clic en el backdrop cancelan.
- El icono `⚠` lleva `<span class="sr-only">Advertencia:</span>` antes del
  título, para que un lector de pantalla no anuncie solo un signo.
- Durante el borrado los dos botones están `disabled` (§3.5).

### 7.4 Errores de validación

Se reutiliza el patrón ya resuelto y construido en `auth.md`:

- `FormAlert` con `role="alert"`, **texto + icono**, nunca solo color.
- `aria-invalid` en el campo con error y `aria-describedby` apuntando a su
  mensaje.
- El foco se mueve al `FormAlert`, que está entre el cuerpo y el pie (§3.6), no
  al primer campo: así el lector de pantalla oye el recuento antes que un
  etiqueta suelta.
- La validación se dispara al salir del campo (`onBlur`) y de nuevo al enviar,
  nunca en cada pulsación de tecla.

### 7.5 Palabras clave

El contenedor de chips va con `aria-live="polite"`: cambia mientras la persona
escribe, y sin anuncio el cambio sería invisible para quien no ve la pantalla.
El `textarea` **no** lleva `aria-live`, por el mismo motivo que el buscador del
feed: el anuncio de los chips ya cubre la información.

### 7.6 Selectores dependientes

`SelectField` ya compone `aria-describedby` con el nodo de ayuda
(`src/components/ui/select-field.tsx:62`), así que el `Área` deshabilitado
conserva su texto. El atributo es `disabled` real, no `aria-disabled`, porque un
control deshabilitado no debe ser tabulable: leerlo con `Tab` para descubrir que
no hace nada es una trampa.

El texto de ayuda **cambia** entre `Elige primero una categoría.` y `El área se
ajusta a la categoría elegida.`, y el `id` del nodo se mantiene, así que el
`aria-describedby` del mismo `select` sigue válido en ambos estados.

### 7.7 Movimiento y foco visible

El anillo global de `globals.css` (`outline: 2px solid var(--accent)`) no se
elimina en ningún control, incluidos los del modal. La apertura del diálogo no
tiene animación propia: `prefers-reduced-motion` ya está cubierto globalmente y
un modal que aparece con transición se siente más lento que uno que aparece.

## 8. Tokens y contraste

### 8.1 Sin tokens nuevos

No se define ningún token. `--danger` ya existe
(`src/app/globals.css:32` claro `#b91c1c`, `:48` oscuro `#f87171`) y está en uso
en `Field` y `SelectField` para los bordes de error. Aquí pasa también a ser
superficie de botón, y para eso basta.

### 8.2 La variante `danger` no necesita token nuevo

`bg-danger text-accent-foreground`: `--danger` `#b91c1c` con `--accent-foreground`
`#0b1220` da un ratio muy por encima de 4.5:1 en modo claro, y `#f87171` sobre
`#0b1220` también en modo oscuro. El texto sobre el ámbar del botón `primary` usa
el mismo `--accent-foreground`, así que un botón destructivo y uno primario se
leen como el mismo tipo de objeto con distinto color, que es lo que queremos.

| Elemento                    | Modo claro  | Modo oscuro |
| --------------------------- | ----------- | ----------- |
| Botón `Eliminar`            | `#b91c1c` sobre `#ffffff` | `#f87171` sobre `#131c31` |
| Texto del botón             | `#0b1220` sobre `#b91c1c` | `#0b1220` sobre `#f87171` |
| Texto `Eliminar` del detalle | `#b91c1c` sobre `#ffffff` | `#f87171` sobre `#131c31` |
| Borde de campo con error    | `#b91c1c` sobre `#ffffff` | `#f87171` sobre `#131c31` |

Todos cumplen 4.5:1. Ningún dato de contraste es nuevo respecto a `Field`; lo que
se añade es el fondo sólido, y hay que verificarlo con la herramienta, no de
memoria.

### 8.3 Imagen

`aspect-video` (`16:9`) con `object-cover`. Se elige 16:9 y no `1:1` porque las
fotos de clustering y de defendencia son horizontales, y recortarlas a cuadrado
cortaría justamente la banda de personas que las hace legibles.

Cuando hay imagen, la cabecera del modal del detalle (`max-w-xl`) muestra la
misma banda 16:9 sobre el `--surface`. Cuando no hay, no hay hueco.

### 8.4 Un acento por diálogo

`--accent` ámbar aparece en **un** elemento por diálogo: el botón de confirmar.
En el de borrar no hay ningún `primary`, así que el único color saturado es
`--danger`. En el de editar con borrador hay un `primary` y un `secondary`, y el
`secondary` es neutro.

## 9. Guía de archivos para el `developer`

### 9.1 Archivos

| Archivo                                            | Acción                   | Responsabilidad                                                                    |
| -------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `src/lib/types.ts`                                 | modificar                | §4.1–§4.4: intercambio `PostCategory`/`PostType`, `ResearchArea`, `PostFormValues`, `PostFilters` |
| `src/lib/filters.ts`                               | modificar                | `researchArea` en `PostFilters`, `?area=`, `?categoria=`/`?tipo=` con la semántica de §4.1, y `strip` de la `#` inicial (§4.5) |
| `src/lib/keywords.ts`                              | crear                    | `extractKeywords` (§6.10)                                                          |
| `src/lib/validation/post.ts`                       | crear                    | Validadores por campo y `validatePostForm` (§4.6)                                   |
| `src/lib/repositories/post-repository.ts`           | modificar                | `CreatePostInput`, `UpdatePostInput`, `create`, `update`, `remove`, `setVisibility` (§4.5) |
| `src/lib/repositories/post-repository.static.ts`   | modificar                | Filtrar por `category`, `type` y `researchArea` con los valores nuevos              |
| `src/lib/repositories/user-repository.ts`          | sin cambios              | No lo necesita este documento                                                      |
| `src/data/posts.ts`                                | modificar                | 9 fixtures reescritos con `category`/`researchArea`/`type` nuevos (§9.3)           |
| `src/data/posts.test.ts`                           | modificar                | Dominios de valores e integridad de `researchArea` ↔ `category`                    |
| `src/app/(main)/layout.tsx`                        | modificar                | Contenedor del backdrop y `{modal}` junto a `{children}` (§2.2)                     |
| `src/app/(main)/@modal/default.tsx`                | crear                    | Devuelve `null`                                                                     |
| `src/app/(main)/@modal/posts/new/page.tsx`         | crear                    | `mode="create"` (§6.6)                                                              |
| `src/app/(main)/@modal/posts/[id]/edit/page.tsx`   | crear                    | `mode="edit" postId`                                                                |
| `src/app/(main)/@modal/posts/[id]/delete/page.tsx` | crear                    | Confirmación (§3.4)                                                                 |
| `src/app/(main)/posts/[id]/page.tsx`               | crear                    | Monta `PostDetail` (§6.7)                                                            |
| `src/components/ui/dialog.tsx`                     | crear                    | Cliente. §6.1 y §7.1                                                                 |
| `src/components/ui/confirm-dialog.tsx`             | crear                    | Cliente. §6.2 y §7.3                                                                 |
| `src/components/ui/textarea.tsx`                   | crear                    | Servidor. §6.3                                                                       |
| `src/components/ui/radio-group.tsx`                | crear                    | Servidor. §6.4                                                                       |
| `src/components/ui/button.tsx`                     | modificar                | Variante `danger` (§6.5)                                                            |
| `src/components/ui/icons.tsx`                      | modificar                | `ImageIcon` y `TagIcon` (§6.11)                                                      |
| `src/components/forms/post-form.tsx`               | crear                    | Cliente. §6.6, §5.1                                                                   |
| `src/components/feed/post-detail.tsx`              | crear                    | Servidor. §6.7. Ruta ya reservada en `frontend-structure.md:63`                     |
| `src/components/feed/post-card.tsx`                | modificar                | Banda de imagen, línea de taxonomía, chips de keywords (§6.8)                       |
| `src/components/feed/filter-bar.tsx`               | modificar                | `SelectField` de Área, rejilla de 3 columnas (§6.9)                                 |
| `src/components/feed/feed-view.tsx`                | sin cambios              | Sigue leyendo `filters` y no conoce los campos individually                         |
| `docs/design/wireframes_feed.md`                   | modificar                | §5.1, §5.3, §6.3, §6.4, §10.1, §10.8 (ver §9.4)                                    |
| `docs/architecture/frontend-structure.md`          | **no tocar**             | Es inmutable. Los desvíos se registran en `progress.md`                              |
| `docs/architecture/progress.md`                    | al cerrar                | Registrar los desvíos de §9.3                                                        |

### 9.2 Tests (TDD, colocated, umbral ≥ 80% del gate de Husky)

| Test                                       | Qué cubre                                                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/keywords.test.ts`                 | Extracción de `#alfa`, `#alfa` repetida (dedup), `#a` demasiado corta, `#álgebra` y `#ñ` con acentos y `ñ`, `#con-guion` y `#con_guion` admitidos, `palabra#etiqueta` **no** cuenta, `https://x.com#y` **no** cuenta, `#` al inicio de línea, límite de 12 y orden de aparición preservado |
| `src/lib/validation/post.test.ts`          | Límites de `title` (4, 5, 120, 121), de `content` (29, 30, 4000, 4001), `imageUrl` vacía válida, `imageUrl` no-URL inválida, `http` y `https` válidos, cada enumeración válida, `researchArea` que no pertenece a `category` rechazada, `general` aceptada en cualquier categoría, `visibility` fuera del conjunto rechazada |
| `src/lib/filters.test.ts`                  | Lo de `wireframes_feed.md` §9.2 **más**: `?area=computacion-grafica` filtra, `?area=general` filtra solo los `general`, `?area=inventada` degrada a `"todas"`, `#defensa` en `q` encuentra la publicación, `filters → params → filters` ida y vuelta con las 8 dimensiones |
| `src/data/posts.test.ts`                   | Lo de `wireframes_feed.md` §9.2 **más**: las 38 áreas específicas son de su `category`, ningún `authorId` inexistente, ningún `visibility` inválido |
| `src/lib/repositories/post-repository.contract.test.ts` | Las mismas aserciones contra la estática y la in-memory, **más** las de `create`/`update`/`remove`/`setVisibility`: `create` fija `authorId` desde la sesión ignorando lo que se le pase, `update` de un post ajeno lanza, `remove` de un post ajeno lanza, `setVisibility` sin rol `admin` lanza, la colección crece y mengua en los dos adaptadores |
| `src/components/ui/dialog.test.tsx`        | `role="dialog"` y `aria-modal`; foco atrapado en `Tab` y `Shift+Tab`; `Escape` llama `onClose`; el fondo queda `inert`; el foco se restaura al elemento que abrió; clic en el backdrop cierra; el cuerpo scrollea con el pie fijo |
| `src/components/ui/confirm-dialog.test.tsx` | El foco inicial está en `Cancelar` y **no** en el botón destructivo; `Escape` llama a cancelar y no a confirmar; con `isPending` los dos botones están deshabilitados |
| `src/components/ui/textarea.test.tsx`      | `label` real con `htmlFor`; `aria-describedby` con ayuda y con error; `aria-invalid`; contador de caracteres |
| `src/components/ui/radio-group.test.tsx`   | `fieldset`/`legend`; el área de toque cubre la fila; `name` compartido; `error` pinta el mensaje con `role="alert"` |
| `src/components/forms/post-form.test.tsx`   | Los **7** controles con su label y **ningún** campo `Visibilidad`; `Área` deshabilitada sin categoría y habilitada con ella; cambiar `Categoría` repuebla `Área` y la reinicia a `general`; cambiar de categoría descarta un área que ya no pertenece; la vista previa de keywords se actualiza al escribir; el `FormAlert` con el recuento en singular y plural; el foco va al `FormAlert` al fallar; en `edit` el campo de fecha está deshabilitado y **no** se envía; `imageUrl` vacía se envía como `null`; en borrador el pie tiene tres botones |
| `src/components/feed/post-detail.test.tsx`  | `Editar` solo para el autor; `Ocultar`/`Mostrar` y `Eliminar` solo para `admin`; ningún botón para el resto; `Eliminar` es un `Link` a `/posts/[id]/delete`, no un `button`; banda de imagen si hay `imageUrl`, y **sin hueco** si no lo hay |
| `src/components/feed/post-card.test.tsx`    | Lo de `wireframes_feed.md` §9.2 **más**: banda 16:9 con `alt=""` si hay imagen; sin banda ni hueco si no hay; línea `Categoría · Área`; hasta 3 chips de keywords y `+n`; el slug no se muestra en crudo |
| `src/components/feed/filter-bar.test.tsx`  | Lo de `wireframes_feed.md` §9.2 **más**: 9 controles con su label; el de `Área` tiene 6 `optgroup` más `Todas las áreas`; `Área` escribe `?area=` con `replace`; `Área` no se deshabilita al elegir `Categoría`; `Filtros (n)` cuenta `Área` |

`lib/` y `data/` deben llegar al **90%**: son lógica pura y baratos de cubrir.
`post-form.test.tsx` necesita `vi.mock` del repositorio y de `next/navigation`.
`dialog.test.tsx` necesita `userEvent` para el ciclo de foco.

### 9.3 Desvíos respecto de `frontend-structure.md` (para `progress.md`)

1. `PostCategory` y `PostType` **intercambian su conjunto de valores** y se añade
   `ResearchArea` con 39 valores (38 áreas + `general`). Cambio incompatible (§4.1).
2. La tabla de rutas de `frontend-structure.md` declara `/posts/[id]/edit`, pero
   su árbol de directorios no lo incluye; se implementa en
   `src/app/(main)/@modal/posts/[id]/edit/page.tsx` (§2.2).
3. `src/components/ui/` suma `Dialog`, `ConfirmDialog` y `Textarea` como
   primitivos propios. La lista de shadcn de `frontend-structure.md:54` está
   oficialmente desviada desde la fase 0. No se crea `RadioGroup`: al no haber
   campo `Visibilidad` ni ningún otro grupo de opciones excluyentes en el
   formulario, no hay consumidor (§5.1.1).
4. `ButtonVariant` suma `danger` a los tres valores existentes (§6.5).
5. El diálogo de borrado es una **ruta** (`/posts/[id]/delete`), no un `alert()`
   ni un `confirm()` del navegador.
6. `src/app/(main)/layout.tsx` recibe un tercer hueco, `{modal}`, además de
   `{children}`.

### 9.4 Cambios que este documento obliga en `wireframes_feed.md`

**Estado: aplicados.** La revisión 2 de `wireframes_feed.md` los incorporó todos.
Esta tabla queda como el índice de qué se tocó y dónde, no como una lista de
pendientes. Si una cifra de aquí no coincide con la del otro documento,
**manda `wireframes_feed.md` §4.1–§4.3**, que es donde vive el contrato
ejecutable.

| Sección         | Cambio                                                                                                  | Estado  |
| --------------- | ------------------------------------------------------------------------------------------------------- | ------- |
| §1              | La tarjeta lleva banda 16:9, línea `Categoría · Área` y chips; el badge único es el de tipo            | aplicado |
| §3.1, §3.2      | Los wireframes de móvil y escritorio llevan los 9 controles, la banda y la taxonomía                  | aplicado |
| §3.5            | Los ejemplos de borrador y oculto pasan a badge de tipo + taxonomía + chips                             | aplicado |
| §4.1            | `PostType` a naturaleza institucional (5), `category` a rubro (6), entra `researchArea`, `imageUrl` a `string \| null`, sin `keywords`/`tags` | aplicado |
| §4.2            | `researchArea` en `PostFilters` y en `DEFAULT_POST_FILTERS`; `q` documentado como `keyword`             | aplicado |
| §4.3            | `?area=` en la tabla de parámetros; `normalizeSearchText` quita la `#` inicial; degradación tolerante de `categoria`/`tipo` viejos | aplicado |
| §5.1            | El inventario de controles suma `Área de investigación`; son 9 controles, no 8                          | aplicado |
| §5.3            | Copy nuevo de `Categoría` (5 disciplinas + track, en `optgroup`) y de `Tipo` (5 naturalezas)             | aplicado |
| §5.4            | Placeholder con un hashtag; el contador cuenta `Categoría` y `Área` por separado                       | aplicado |
| §5.5            | Copy de la tarjeta: taxonomía, chips, badge único de tipo, nota de la imagen                             | aplicado |
| §5.6            | `fromSearchParams` tolera también un `area` inexistente                                                | aplicado |
| §6.3            | `FilterBar` pasa a 5 desplegables en rejilla de 3 columnas, con `optgroup` en `Categoría` y `Área`, y plan B declarado si desborda | aplicado |
| §6.4            | `PostCard` suma banda de imagen, línea de taxonomía y chips de palabras clave                           | aplicado |
| §6.9            | `SelectField` documentado como capaz de `optgroup` y `disabled`                                         | aplicado |
| §7              | El argumento de `<select>` nativo se actualiza a 39 áreas; badge de tipo, taxonomía y chips como texto | aplicado |
| §8.3            | La fila de contraste del badge pasa de "categoría" a "tipo"                                            | aplicado |
| §10.1           | **Su justificación queda revertida.** "Facultad no es un filtro" se decidió porque hay una sola facultad; ahora `Categoría` es el **rubro** y sí es un filtro, porque hay 6 rubros que devuelven resultados distintos (§10.2) | aplicado |
| §10.3           | Se documenta `?area=` y la asimetría filtro/formulario de `Categoría` con `Área`                        | aplicado |
| §10.7           | El argumento de "los controles caben en una fila" **deja de ser cierto**; se conserva la conclusión —nada de sidebar— y se cambia la razón a la rejilla de 3 columnas | aplicado |
| §10.8           | El argumento del `<select>` nativo se apoya en el número de opciones ("seis categorías, tres tipos"). Ahora son 39 áreas agrupadas en `optgroup`: la conclusión se mantiene, el argumento cambia, y se reescribe | aplicado |
| §10.12          | **Cambia de postura**: la imagen entra en la tarjeta. Se mantiene el tratamiento del `null`: sin hueco ni caja de reserva | aplicado |
| §9.1, §9.2      | Filas marcadas con `⚠︎` que remiten a este documento; desviaciones 6–11 añadidas                        | aplicado |

> [!NOTE]
> Nota sobre las cifras: **39** es el número de valores del enum `ResearchArea`
> (38 áreas específicas + `general`, que se reutiliza en los seis rubros).
> **44** es el número de *opciones* que ve quien abre el `select` de Área, porque
> `general` aparece una vez por rubro. Cuando ambos documentos hablen de áreas,
> hay que decir cuál de las dos cifras se está usando.

## 10. Decisiones de diseño y sus justificaciones

### 10.1 El modal vive sobre una ruta, no sobre la página actual

Hay dos formas de abrir un formulario: como un estado en memoria de la pantalla
actual, o como una ruta propia que renderiza un modal.

Se elige la **ruta**, porque `/posts/new` ya es el destino del `EmptyState` del
feed (`wireframes_feed.md` §5.7) y `/posts/[id]/edit` va a ser el destino del
botón `Editar`. Si el formulario fuera un estado, esos dos lugares necesitarían un
`onClick` que montara un componente, y habría que cambiar sus enlaces por
`button`. Con la ruta se conserva lo que ya está construido: los `<Link>`
funcionan, el botón atrás cierra el modal, `F5` no pierde nada, y el enlace es
compartible.

Se elige el **slot `@modal`** del layout en vez de una página con backdrop propio
porque reutiliza el mismo componente `Dialog` para los tres diálogos y porque el
feed, que es la página de fondo, no necesita saber nada de formularios.

### 10.2 El rubro es un filtro, y por qué `wireframes.md` §10.1 ya no aplica

`wireframes_feed.md` §10.1 descartó `facultad` como filtro con este argumento: la
plataforma es de una sola facultad, así que el filtro tendría siempre una opción y
devolvería los mismos resultados.

Ese argumento **sigue siendo correcto** para `facultad` y la entidad sigue sin
existir. Lo que cambia es que ahora `Categoría` es el **rubro de clasificación**, y
ahí el argumento se da la vuelta: hay seis valores que devuelven conjuntos
distintos —filtrar por `Química` y por `Computación` no es lo mismo—, así que el
filtro justifica su casilla. Una casilla que parece filtrar y no filtra es un
defecto; un `select` que ofrece seis conjuntos distintos es una herramienta.

De los seis rubros, cinco son disciplinas y uno es un track (§10.15). El
argumento del filtro no depende de esa diferencia: los seis devuelven conjuntos
distintos, y eso es lo que hace falta para que la casilla exista.

Lo mismo aplica a `Área`, con una advertencia: el `select` de área tiene 44
opciones, y por eso se agrupa en `optgroup` y por eso **no** se acopla a la
categoría (§10.3).

### 10.3 `Área` se acopla a `Categoría` en el formulario y no en el filtro

Es el mismo par de selectores con dos comportamientos, y conviene explicar por
qué.

**En el formulario se acoplan** porque hay una invariante de datos: el área de
una publicación tiene que pertenecer a su categoría. Sin acoplar, se podría
guardar una publicación de `Física` con área `Bases de Datos`, que no significa
nada. El área nace deshabilitada con `Elige primero una categoría.` y al elegir
categoría se puebla con `[General, ...áreas de esa categoría]`. Cambiar de
categoría reinicia el área a `general`, que por §4.2 siempre es válido.

**En el filtro no se acoplan.** Un filtro no escribe datos, así que no hay nada
que haya que cumplir; y acoplar dos controles dentro del mismo panel rompe dos
cosas que ya funcionan:

- **"Limpiar filtros"** tendría que decidir si "limpiar" significa vaciar los dos
  o solo el que quedó sin opciones. No hay respuesta evidente.
- **Una URL compartida** con `?categoria=quimica&area=robotica` —posible si el
  panel no acopla— degradaría a un estado imposible si acopla, y quien la abriera
  vería una lista vacía sin explicación.

A cambio se pierde algo: con `Categoría = Química` el filtro de área sigue
ofreciendo las 44 áreas, y quien filtre por `robotica` obtendrá cero resultados
aunque dentro de `Química` no haya ninguna. Se acepta a cambio de que el panel
sea predecible, y la agrupación por `optgroup` mitiga la orientación.

### 10.4 Las áreas puente van bajo su disciplina dominante

`Bioinformática` y `Física Computacional` ejercen en dos departamentos. Se
colocan bajo `biologia` y `fisica` respectivamente porque el área responde a
"¿a qué grupo de investigación se asks la publicación?", y en la FCT esa
pregunta tiene más de una respuesta que de dos. Quien considere que la
bioinformática pertenece a `computacion` no tiene más que moverla en `AREAS_BY_CATEGORY`:
la tabla de §4.2 es la única fuente y el resto del código la consume.

### 10.5 El borrado es definitivo, no una ocultación

`PostVisibility` ya tiene `oculto`, y `PostCard` ya lo comunica con el texto
`Oculta por un administrador.` (`wireframes_feed.md` §5.5). Reutilizar `oculto`
para que el autor borrara su propia publicación dejaría al autor leyendo un
enunciado falso sobre un contenido que él mismo decidió retirar. Por eso el autor
borra de verdad (`remove`) y solo el administrador oculta (`setVisibility`), que
es la razón de ser de ese valor.

El diálogo de confirmación lo dice con esas palabras: `se eliminará de forma
permanente y no podrás recuperarla.` Sin "permanente" el botón `Eliminar` invita a
pensar que hay un equivalente a la papelera.

No hay deshacer. Una papelera exigiría un estado más en `PostVisibility`, una
vista para listarla y una política de purga, y el enunciado no la pide (§10.7).

### 10.6 `Escape` y el botón `✕` cierran sin preguntar

Un formulario a medio escribir no pide confirmación al cerrarse: el contenido es
barato de rehacer, y el diálogo "¿Seguro que quieres descartar?" encima de un
diálogo añade un nivel de interrupts para proteger algo que no cuesta nada. El
caso caro, borrar, sí tiene su propia confirmación (§3.4) porque ahí lo que se
protege es irrecuperable.

### 10.7 Borrador y publicación son dos botones, no un campo

`implementation_base.md` pide que la visibilidad sea "visible para ti o para
todos". Con un solo campo y el valor por defecto `publicado`, el camino más
probable es publicar sin querer: la opción que aparece preseleccionada es la que
se ejecuta, y publicar por error es la consecuencia cara. Con dos botones, quien
quiere guardar sin exponer tiene un botón con su propio nombre.

> [!IMPORTANT]
> **El campo `Visibilidad` no existe en el formulario.** Se evaluó
> mantenerlo y se descartó (§5.1.1): junto a un botón `Publicar`, un selector
> `Publicado / Borrador` duplica la misma decisión, y si el usuario elige
> `Borrador` y pulsa `Publicar` el botón gana, dejando el selector mintiendo en
> pantalla. La visibilidad la fija el botón pulsado, no un valor del formulario.
>
> `PostFormValues` por tanto **no** lleva `visibility`. El enum
> `PostVisibility` sí existe en `Post`, porque `Oculto` lo administra un
> administrador desde el detalle (§5.6) y no se edita desde el formulario.
>
> La consecuencia que cuesta aceptar: **crear y editar usan los mismos 7
> controles**, y lo único que las diferencia es qué botones hay en el pie. Si
> mañana hiciera falta más control sobre la visibilidad, el sitio natural para
> añadirlo sería el botón —un `Publicar` con desplegable— y no un campo nuevo.

### 10.8 La fecha deshabilitada, no oculta

`publishedAt` no se edita (`implementation_base.md` §Publicaciones), pero se
**muestra**, deshabilitada, con `No se puede cambiar después de publicar.` Si se
ocultara, quien edita su publicación de marzo y ve el feed ordenado de otra
manera no sabría si la fecha se perdió o si nunca se tocó. Un campo deshabilitado
con su explicación responde a las dos preguntas; un campo ausente solo deja la duda.

Es el único campo deshabilitado del formulario. El footer del diálogo lo
distingue con opacidad reducida, coherente con el `disabled:` que ya usan `Field`
y `SelectField`.

### 10.9 Los botones dicen lo que hacen

`Publicar`, `Guardar cambios`, `Guardar borrador`, `Eliminar`, `Ocultar`,
`Mostrar`. Un botón `Aceptar` o `Confirmar` obliga a mirar el contexto para saber
qué va a pasar, y en un formulario con dos acciones decommit distintas es un
error esperando a ocurrir.

### 10.10 Los botones en fila, los campos en columna

Los ocho campos van en una sola columna, sin excepción a ningún breakpoint: en
escritura, escribir en el campo de la derecha obliga a apartar la vista del
campo de la izquierda, y en un formulario de escritura eso cuesta más de lo que
gana el espacio horizontal.

Los botones del pie **sí** van en fila (`flex-col-reverse sm:flex-row
sm:justify-end`). No son campos: no hay dato que escribir, la acción es puntual,
y en una fila se comparan las dos opciones de un vistazo, que es exactamente lo
que necesita una decisión binaria. En móvil se apilan a ancho completo, que es lo
mismo que hacen los formularios de `auth.md`.

### 10.11 La imagen es opcional y no tiene caja de reserva

`imageUrl` es `null` en los 9 fixtures actuales y lo seguirá siendo en muchos
casos: una convocatoria no lleva imagen y sigue siendo una publicación válida.

Por eso una publicación sin imagen **no deja hueco**. Un tinte o un icono de
imagen en cada tarjeta sin foto produce un mar de rectángulos vacíos que compiten
visualmente con las tarjetas que sí tienen contenido, y la pantalla se lee como
incompleta. Es mejor que la banda no exista: el ritmo lo marca el `gap-4` entre
tarjetas, no una imagen de reserva.

El `alt` de la imagen es vacío. Es decorativa: el título, justo debajo, nombra
la publicación, y un `alt` que lo repitiera sería leído dos veces por quien usa
lector de pantalla.

### 10.12 Sin editor Markdown

`Post.content` es texto plano en la fase estática y lo sigue siendo. Un editor
con barra de herramientas, vista previa y botones de negrita es un proyecto en sí
mismo, con su propio modelo de sanitización en el servidor y su superficie de
XSS. El enunciado no pide formato.

Si en la fase backend hace falta, se añade `react-markdown` con sanitización en
servidor, no antes. El texto de ayuda del campo 2 ya prepara el terreno para el
caso más común —buscar por hashtag— sin prometer formato.

### 10.13 `general` existe en cada categoría

Sin él, publicar una noticia cualquiera exigiría elegir un área de investigación
para una publicación que no trata de investigación. La categoría tiene `General`
como primer valor, marcada por defecto al elegir categoría, y el filtro de área
la trata como un valor más, porque **filtrar por las publicaciones sin área
específica** es una consulta legítima.

### 10.14 La cabecera dice qué es obligatorio

`*` en cada etiqueta obligatoria más una línea en la cabecera:
`Los campos obligatorios están marcados con *.` El asterisco solo no es un aviso
suficiente para quien no conoce la convención, y en un formulario con un campo
opcional —la imagen— la ambigüedad es real: no se sabe si el asterisco indica lo
contrario.

### 10.15 `Desarrollo profesional` no es una sexta disciplina

La FCT tiene cinco disciplinas. La enumeración de seis valores no viene de que
haya seis departamentos: `crecimiento-profesional` existe porque el programa
formativo exige desarrollar habilidades blandas además de las técnicas, y sin un
rubro propio esas publicaciones no tendrían dónde clasificarse.

Mezclado en la misma lista, el problema es de lectura: una etiqueta que dice
`Crecimiento profesional` junto a `Computación` invita a compararlas, y no son
comparables —la primera no es un departamento. De ahí tres decisiones:

- El selector usa **dos `<optgroup>`** —`Disciplinas` y `Desarrollo
  profesional`— para que la diferencia sea visible antes de elegir, no después
  (§5.3).
- El `helpText` lo dice con palabras: `Las cinco primeras son disciplinas de la
  facultad. La última agrupa habilidades blandas.`
- En `PostCard` la línea se rotula `Desarrollo profesional`, no
  `Crecimiento profesional`: el rótulo legible nombra el track, mientras que el
  slug `crecimiento-profesional` se queda por compatibilidad con la URL.

No se creó un campo aparte (`track`) porque obligaría a que `category` fuera
condicional cuando el track está activo, y una validación condicional en un
formulario es una fuente de estados imposibles (§10.3).

### 10.16 `General` existe en los seis rubros, también en el track

En el track de desarrollo profesional las áreas ya son concretas —`Liderazgo`,
`Comunicación`, `Ética`, `Emprendimiento`, `Gestión de Proyectos`—, así que
"sin área específica" parece no significar nada ahí.

Se mantiene, por uniformidad. La validación del área es
`researchArea === "general" || AREAS_BY_CATEGORY[rubro].includes(researchArea)`,
sin excepciones; el valor por defecto del selector dependiente es `general` en
los seis rubros; y el filtro de área trata a `general` como un valor más, porque
filtrar por las publicaciones sin área concreta es una consulta legítima. Meter
una excepción por rubro obligaría a los tres sitios a conocer la excepción.

Quien prefiera que el track no ofrezca `General` solo tiene que quitarlo de su
fila en `AREAS_BY_CATEGORY` y cambiar el default de ese rubro; el resto del
sistema no se entera.
