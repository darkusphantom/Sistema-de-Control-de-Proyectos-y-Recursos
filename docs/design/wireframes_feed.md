# Feed `/feed` — Red FaCyT
> **Pivot 2026-10-17**: esta pantalla fue **eliminada** con el dominio anterior (commit `9989b02`); el documento se conserva como referencia histórica. El nuevo dominio tendrá sus propios wireframes (Fase 2, `docs/pivot-project.md` §5).

Especificación de diseño de la pantalla principal de `(main)`: el feed de
publicaciones y el shell autenticado que la rodea. El `developer` implementa este
documento tal cual y el `qa-reviewer` valida el resultado contra él.

- **Mapa de navegación y reglas de acceso:** [`wireframes.md`](wireframes.md) §1
- **Identidad visual y paleta:** [`brief.md`](brief.md)
- **Tokens e inventario de la pantalla de bienvenida:** [`components.md`](components.md) (solo referencia; no se modifica)
- **Tokens de color (fuente de verdad):** `src/app/globals.css` — ver §8
- **Accesibilidad transversal:** [`accessibility.md`](accessibility.md)
- **Requisitos del MVP:** [`../implementation/implementation_base.md`](../implementation/implementation_base.md) §Publicaciones y §Feed
- **Antecedente de formato:** [`auth.md`](auth.md)
- **Modelo de datos, taxonomía y CRUD:** [`wireframes_posts.md`](wireframes_posts.md) §4

> [!IMPORTANT]
> `docs/design/components.md` describe **solo** la pantalla de bienvenida. Los
> componentes del feed se especifican aquí, en §6, sin tocar ese archivo.

### Revisión 2 — sincronización con `wireframes_posts.md`

Este documento se revisó para que el feed deje de contradecir al documento de
publicaciones. Los cambios no son cosméticos: **alteran el modelo de datos** y por
tanto invalidan parte de lo que se escribió aquí.

| Cambio | Dónde se detalla |
| --- | --- |
| `PostType` pasa a ser naturaleza institucional: `noticias`, `eventos`, `defensas`, `investigacion`, `convocatorias`. Se elimina `post`/`articulo`/`ensenanza` | §4.1, §5.3, §10.8 |
| `category` deja de ser la naturaleza y pasa a ser el rubro de clasificación: 5 disciplinas + track de desarrollo profesional | §4.1, §5.3, §10.1 |
| `researchArea` entra en `Post` y `?area=` entra en los filtros | §4.1, §4.2, §4.3 |
| 38 áreas específicas + `general`, agrupadas en `<optgroup>` por rubro | §5.3 |
| El filtro gana un control (`Área`): de 8 a 9 | §5.1, §6.3, §10.7 |
| `imageUrl` pasa a `string \| null` y la tarjeta renderiza banda 16:9 sin hueco cuando es `null` | §5.5, §6.4, §10.12 |
| Desaparecen `keywords`/`tags`: se derivan de hashtags del cuerpo | §5.5, §4.3 |
| La tarjeta muestra `Categoría · Área` en vez de dos badges | §1, §5.5, §6.4 |
| Los argumentos de §10.7, §10.8 y §10.12 se reescribieron porque sus cifras quedaron obsoletas | §10 |

> [!WARNING]
> **Alcance de esta revisión: fase estructural.** Fija modelo, filtros,
> contratos, rutas y accesibilidad. **No** fija el acabado visual de cada vista:
> tipografías exactas, tamaños en píxeles, espaciados y el comportamiento responsive
> se decidirían al renderizar, y lo que aquí dice sobre ellos es indicativo. No
> tomar estas cifras como píxeles exactos ni como cierre de diseño.

Precedencia entre documentos, cuando discrepen: `wireframes_posts.md` manda
sobre **modelo, CRUD, taxonomía y rutas**; este documento manda sobre **feed,
filtros, contador y shell**. Ninguno pisa al otro.

## 1. Propósito y dirección visual

El feed es la primera pantalla que ve un miembro de la facultad después de
iniciar sesión. Es una **gaceta**, no un panel de control: la prioridad es que
se pueda leer de un vistazo qué ha publicado la facultad, cuándo y por qué
categoría.

- **Retícula editorial, no tablero.** Las tarjetas se alinean a la izquierda
  (regla de `brief.md` §5), con el mismo ancho de línea cómodo que la pantalla de
  autenticación. Sin métricas, sin gráficos, sin porcentajes.
- **Un solo acento por pantalla.** El ámbar `--accent` aparece **únicamente** en
  el botón "Nueva publicación" de la `Navbar`. El feed en sí es neutro
  (`--bg` + `--surface`); el color lo ponen los badges de estado, que son texto
  pequeño, no superficies grandes (§8.2).
- **Jerarquía de la tarjeta:** tipo de publicación (insignia, 12px) → título
  (serif `--font-display`, 20px) → autor y fecha (sans, 14px, `--text-muted`) →
  categoría y área (sans, 14px, `--text-muted`) → extracto (sans, 16px,
  `--text-muted`, 3 líneas máximas). Con imagen, la banda 16:9 va arriba de todo.
- **Densidad.** Una tarjeta es un bloque compacto, `gap-4`, sin separadores
  horizontales entre tarjetas: el hueco hace ese trabajo.
- **Tipografía.** Títulos de tarjeta en serif editorial (`--font-display`);
  metacarpeta, badges y controles en la sans del preflight.

**Fuera de alcance por minimalismo:** miniaturas, ReactionBar de "me gusta",
compartir a redes, orden por relevancia o por título (§10.13), menú de acciones
en la tarjeta (§10.5), contador de lecturas y botón "suscribirse".

> [!IMPORTANT]
> La imagen de portada en la tarjeta **dejó de estar fuera de alcance**:
> `wireframes_posts.md` §6.8 y §10.11 la incluyen, con banda 16:9, `alt` vacío y
> **sin hueco ni caja de reserva** cuando `imageUrl` es `null`.

## 2. Layout del shell `(main)`

> [!IMPORTANT]
> `src/app/(main)/layout.tsx` **no existe todavía**: hay que crearlo. Es la
> primera pantalla de `(main)`, así que el shell se especifica aquí (§10.11). Si
> se dejara para más adelante, `/profile` y `/admin` terminarían definiendo
> `Navbar` y `BottomNav` por su cuenta.

```
┌────────────────────────────────────────────────────────┐
│ Red FaCyT   Publicaciones  Perfil   [＋ Nueva][🌙][👤] │ ← Navbar, sticky, --surface
├────────────────────────────────────────────────────────┤
│                                                        │
│                   <main id="contenido">                │
│                                                        │
├────────────────────────────────────────────────────────┤
│  Red FaCyT                                             │ ← Footer (ya existe)
│  © 2026 Facultad Experimental de Ciencias y Tecnología │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│   Feed      ＋ Crear      👤 Perfil      🛡 Admin      │ ← BottomNav, fijo, < 768px
└────────────────────────────────────────────────────────┘
```

### 2.1 Estructura

- `min-h-dvh flex flex-col bg-bg text-text`.
- Contenedor `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`, el mismo que ya
  usa `Footer`.
- Orden: enlace de salto → `Navbar` → `<main id="contenido">` → `BottomNav` →
  `Footer`.
- `<main>` lleva `flex-1` y `pb-24 md:pb-0`: el `pb` deja libre la `BottomNav`
  fija en móvil sin solapar la última tarjeta.

### 2.2 `Navbar` (`src/components/layout/navbar.tsx`)

- **Cliente**, porque necesita la sesión (enlace a `/admin` solo con rol `admin`)
  y `usePathname` para marcar la sección activa.
- `sticky top-0 z-30 bg-surface border-b border-border`. Es `sticky`, no `fixed`,
  para no tener que compensar el desplazamiento del contenido.
- Tres zonas en `max-w-7xl`, `min-h-16`:
  - **Izquierda:** marca "Red FaCyT" (serif, `--primary`) como enlace a `/feed`.
  - **Centro (≥ 768px):** enlaces "Publicaciones" (`/feed`), "Perfil"
    (`/profile/[username]` de la sesión) y "Administración" (`/admin`, solo rol
    `admin`). En móvil **no** hay enlaces en la navbar: los lleva la `BottomNav`.
  - **Derecha:** botón "Nueva publicación" (`/posts/new`, `buttonStyles` variant
    `primary`, size `sm`) → `ThemeToggle` ya existente → botón de cuenta (solo
    icono `UserIcon`, 44×44, `aria-label` con el `@username`) que despliega
    "Cerrar sesión".
- Enlaces de navegación: sans 15px, `--text`; activo en `--accent-teal` con
  `aria-current="page"` y `font-medium`. Sin subrayado permanente.
- El botón de cuenta **no** es un `<details>`: es un botón con `aria-expanded` y
  `aria-haspopup="menu"`, y el menú se cierra con `Escape` y al pulsar fuera.

### 2.3 `BottomNav` (`src/components/layout/bottom-nav.tsx`)

- **Cliente**, por `usePathname` y por la sesión.
- `fixed bottom-0 inset-x-0 z-30 md:hidden bg-surface border-t border-border
  pb-[env(safe-area-inset-bottom)]`.
- Cuatro destinos, en este orden: **Feed** (`/feed`, `HomeIcon`), **Crear**
  (`/posts/new`, `PlusIcon`), **Perfil** (`/profile/[username]`, `UserIcon`) y
  **Administración** (`/admin`, `ShieldIcon`, **solo rol `admin`**). Con un
  usuario `estudiante` o `profesor` quedan tres y el `Perfil` conserva su sitio.
- Cada destino: icono + etiqueta de 11px, `min-h-14` (56px), `flex-1`.
- El destino activo lleva `--accent-teal` y `aria-current="page"`; los inactivos
  `--text-muted`. El color nunca es el único indicio: el icono activo pasa a
  peso `fill-current` y la etiqueta a `font-medium`.
- `<nav aria-label="Navegación principal">`. Es la navegación principal de la
  pantalla en móvil, no un duplicado de la navbar: por eso lleva su propia etiqueta
  y `aria-label` distinto.

### 2.4 Sesión: `SessionProvider` (`src/lib/session/session-provider.tsx`)

> [!IMPORTANT]
> La sesión de la fase estática vive en `localStorage` (`StaticAuthGateway`), así
> que **ningún Server Component puede leerla**. El shell y el feed resuelven la
> sesión en el cliente. Es una limitación temporal, no un patrón: con backend la
> vista vuelve a ser Server Component sin que cambien `filters.ts` ni `visibility.ts`
> (§10.16).

Sigue el patrón de `src/lib/theme.ts`: la fuente de verdad es externa al estado
de React y el componente es solo la instantánea de cliente.

- `SessionProvider` es **cliente**, monta en `(main)/layout.tsx` y expone
  `useSession()` con `{ status, session, signOut }`.
- `status`: `"loading"` mientras resuelve · `"authenticated"` con `session` ·
  `"anonymous"`.
- Mientras `status === "loading"` **no renderiza `children`**: solo un contenedor
  `min-h-dvh` con `aria-busy="true"`. Sin ese corte, el feed se pintaría un
  instante antes de redirigir y el usuario vería contenido que no debe.
- Con `status === "anonymous"`: `router.replace("/login")`. Es `replace`, no
  `push`, por el mismo motivo que en `auth.md` §6: `/feed` no debe quedar en el
  historial.
- **No** se crea un `session-guard.tsx` aparte: la resolución y la redirección
  viven en el mismo componente. El `AuthGuard` existente (`auth.md` §9) resuelve el
  caso inverso —con sesión, salir de `/login`— y no se toca.

## 3. Wireframes

Los wireframes son **mobile-first**: el feed se lee en el teléfono y la
adaptación de escritorio es una rejilla, no un rediseño.

### 3.1 Móvil (`< 768px`)

```
┌────────────────────────────────┐
│ Red FaCyT     [🌙] [👤]        │ ← Navbar (sin enlaces de sección)
├────────────────────────────────┤
│ Publicaciones                  │ ← serif h1
│ Novedades, avisos y …          │ ← 14px text-muted
│                                │
│ [ Buscar publicaciones…    🔍] │ ← input type="search", label visible
│ [ ⚙ Filtros (2)                ] │ ← toggler, abre el panel
│ ┌────────────────────────────┐ │ ← panel colapsado / desplegado
│ │ Categoría      [ Todas ▾ ] │ │ ← con optgroup
│ │ Tipo           [ Todos  ▾ ] │ │
│ │ Área           [ Todas  ▾ ] │ │ ← 6 optgroup, no acoplado
│ │ Autor          [ Todos  ▾ ] │ │
│ │ Estado         [ Todos  ▾ ] │ │
│ │ Desde [2026-03-01]         │ │
│ │ Hasta [2026-03-31]         │ │
│ │ [ Limpiar filtros ]         │ ← ghost sm, solo si hay filtros
│ └────────────────────────────┘ │
│ 24 publicaciones               │ ← role="status"
│ ┌────────────────────────────┐ │
│ │ ▓▓▓ banda 16:9 de imagen ▓▓ │ │ ← solo si imageUrl; si no, no hay hueco
│ │ [Defensas] #defensa #rii  ✓ │ │ ← badge tipo · chips · estado
│ │ Cartelera de defensas de    │ │ ← serif, enlace (stretched)
│ │ grado, marzo 2026           │ │
│ │ María Rivas · 12 mar 2026   │ │
│ │ Matemáticas · Probabilidad  │ │ ← taxonomía
│ │ El cronograma de …          │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ [Borrador] #tesis   🔒 …   │ │ ← sin banda: sin imageUrl
│ │ Quédate con el otro…        │ │
│ │ María Rivas · 10 mar 2026   │ │
│ │ Solo tú ves esta …          │ ← nota de visibilidad
│ └────────────────────────────┘ │
│ [ Cargar más ]                 │ ← primary, ancho completo
└────────────────────────────────┘
│  Feed     ＋      👤           │ ← BottomNav fija (3 destinos)
└────────────────────────────────┘
```

### 3.2 Escritorio (`≥ 768px`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Red FaCyT   Publicaciones  Perfil  Administración  [＋ Nueva][🌙][👤]│
├──────────────────────────────────────────────────────────────────────┤
│ Publicaciones                                                        │
│ Novedades, avisos y convocatorias de la facultad.                    │
│ [ Buscar publicaciones                                    🔍        ] │
│ [ Categoría ▾ ] [ Tipo ▾ ] [ Área ▾ ]                               │
│ [ Autor ▾ ] [ Estado ▾ ] [ Desde ] [ Hasta ]                        │
│ [ Limpiar filtros ]                                                  │
│ 24 publicaciones                                                     │
│ ┌────────────────────────────┐ ┌────────────────────────────┐        │
│ │ ▓▓▓ banda 16:9 ▓▓▓         │ │ ▓▓▓ banda 16:9 ▓▓▓         │        │
│ │ [Defensas] #defensa #rii ✓ │ │ [Eventos] #taller #rii  ✓   │  2 col │
│ │ Cartelera de defensas de   │ │ Talleres de introducción   │        │
│ │ grado, marzo 2026           │ │ Juan Pérez · 11 mar 2026   │        │
│ │ María Rivas · 12 mar 2026  │ │ a la programación…        │        │
│ │ Matemáticas · Probabilidad  │ │ Computación · Redes        │        │
│ │ El cronograma de …         │ │                             │        │
│ └────────────────────────────┘ └────────────────────────────┘        │
│ ┌────────────────────────────┐ ┌────────────────────────────┐        │
│ │ [Investigación] #ensayo ✓  │ │ [Convocatorias] #becas  ✓  │        │
│ └────────────────────────────┘ └────────────────────────────┘        │
│ [ Cargar más ]                                                        │
├──────────────────────────────────────────────────────────────────────┤
│  Red FaCyT · © 2026 Facultad Experimental de Ciencias y Tecnología    │
└──────────────────────────────────────────────────────────────────────┘
```

- **2 columnas** de tarjetas en `≥ 768px` y **3** en `≥ 1280px`.
- Los filtros pasan a una **rejilla de 3 columnas**: buscador a ancho completo y
  los selectores en `md:grid-cols-3` debajo. **Sin sidebar** (§10.7).
- **Ocho** controles en total: buscador, `Categoría`, `Tipo`, `Área`, `Autor`,
  `Estado` *(condicional)*, `Desde`, `Hasta`, más `Limpiar filtros`.
- El `BottomNav` desaparece (`md:hidden`) y sus destinos ya están en la navbar.
- `main` sin `pb-24`: el `pb` móvil se anula con `md:pb-0`.

### 3.3 Estado vacío — el usuario no ha publicado nada

```
│ ┌────────────────────────────┐
│ │            📭              │ │ ← icono, --text-muted
│ │ Todavía no has publicado   │ │ ← serif, texto centrado
│ │ Tus publicaciones aparecerán│ │
│ │ aquí en cuanto publiques   │ │
│ │ la primera.                │ │
│ │ [ Crear publicación ]      │ │ ← primary
│ └────────────────────────────┘
```

Aparece solo cuando **no hay ningún filtro activo** y el usuario no tiene
publicaciones visibles. Los filtros se ocultan en este estado: sin
publicaciones que filtrar no hay nada que afinar.

### 3.4 Sin resultados de los filtros

```
│ ┌────────────────────────────┐
│ │            🔍              │
│ │ No hay publicaciones que   │
│ │ coincidan                  │
│ │ Prueba con menos filtros o │
│ │ con otras palabras.        │
│ │ [ Limpiar filtros ]        │ ← primary
│ └────────────────────────────┘
```

- Los **controles de filtro siguen visibles**: el usuario necesita ver qué está
  filtrando para poder deshacerlo.
- El mensaje nombra el rango activo cuando hay uno: "No hay publicaciones entre
  el 1 y el 31 de marzo de 2026."

### 3.5 Tarjeta con borrador y con publicación oculta

```
│ ┌────────────────────────────┐ │
│ │ [Investigación]   🔒 Borrador │ ← badge tipo + aviso, --text-muted
│ │ Quédate con el otro…        │ │
│ │ María Rivas · 10 mar 2026   │ │
│ │ Biología · Genética         │ │ ← taxonomía
│ │ #tesis #metodologia        │ │ ← chips
│ │ Solo tú ves esta            │  ← LockIcon + 14px --text-muted
│ │ publicación.                │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ [Convocatorias]   🚫 Oculto │ ← badge tipo + aviso, --warning
│ │ Convocatoria de beca 2026   │ │
│ │ María Rivas · 02 feb 2026   │ │
│ │ Desarrollo profesional      │ │
│ │ #beca #convocatoria        │ │
│ │ Oculta por un administrador.│ │
│ └────────────────────────────┘ │
```

Las dos llevan `LockIcon` antes del badge y una frase que explica el estado. La
tarjeta oculta **no** se atenúa con opacidad baja: bajaría el contraste del texto
por debajo de AA sin ganar nada (§8.3).

### 3.6 Rango de fechas incoherente

```
│ │ ⚠ La fecha inicial no puede │ ← role="alert", --danger
│ │   ser posterior a la final. │    recibe el foco
│ │ Desde [2026-03-31]          │
│ │ Hasta [2026-03-01]          │ ← aria-invalid en ambos
│ (no se muestra ninguna tarjeta)
```

## 4. Contratos de datos

Fijan lo que el `developer` implementa en `src/lib` y `src/data`. La lógica es
**pura y sin React** para que se pruebe sin DOM.

### 4.1 `Post` (`src/lib/types.ts`)

```ts
/** Naturaleza institucional de una publicación. */
export type PostType =
  | "noticias"
  | "eventos"
  | "defensas"
  | "investigacion"
  | "convocatorias";

/**
 * Rubro de clasificación: cinco disciplinas de la FCT más el track de
 * desarrollo profesional, que no es una disciplina. Ver
 * `wireframes_posts.md` §4.1 y §10.15.
 */
export type PostCategory =
  | "matematicas"
  | "biologia"
  | "quimica"
  | "fisica"
  | "computacion"
  | "crecimiento-profesional";

/**
 * Área de investigación: 38 áreas más `general`, que existe en los seis rubros.
 * Siempre pertenece al `category` de la publicación. Catálogo completo en
 * `wireframes_posts.md` §4.2.
 */
export type ResearchArea =
  | "general"
  | "estadistica" | "probabilidad" | "optimizacion"
  | "matematicas-aplicadas" | "modelado-matematico"
  | "biotecnologia" | "bioquimica" | "genetica" | "microbiologia"
  | "ecologia" | "bioinformatica"
  | "quimica-analitica" | "quimica-organica" | "quimica-inorganica"
  | "fisicoquimica" | "quimica-medioambiental"
  | "fisica-computacional" | "fisica-de-materiales" | "astronomia"
  | "fisica-nuclear" | "mecanica-de-fluidos"
  | "inteligencia-artificial" | "aprendizaje-automatico" | "ciencia-de-datos"
  | "desarrollo-web" | "ingenieria-software" | "redes-telecomunicaciones"
  | "seguridad-informatica" | "sistemas-distribuidos" | "bases-de-datos"
  | "computacion-grafica" | "robotica" | "arquitectura-computadores"
  | "gestion-proyectos" | "liderazgo" | "emprendimiento"
  | "comunicacion-profesional" | "etica-profesional";

/** Visibilidad y estado editorial de una publicación. */
export type PostVisibility = "publicado" | "borrador" | "oculto";

export type Post = {
  id: string;
  title: string;
  /** Cuerpo completo en Markdown. En fase estática se muestra como texto plano. */
  content: string;
  authorId: string;
  /** Naturaleza institucional. */
  type: PostType;
  /** Disciplina, o el track de desarrollo profesional. */
  category: PostCategory;
  /** Área de investigación; pertenece a `category`. */
  researchArea: ResearchArea;
  visibility: PostVisibility;
  /** ISO 8601. Es la clave de orden del feed: siempre descendente. */
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  /** `null` es un valor válido: la imagen es opcional. Ver `wireframes_posts.md` §10.11. */
  imageUrl: string | null;
};
```

> [!IMPORTANT]
> `PostCategory` y `PostType` **intercambian sus conjuntos de valores** respecto
> de la primera versión de este documento, y se añade `ResearchArea`. Es un
> cambio incompatible: afecta a `src/data/posts.ts`, a `src/lib/filters.ts` y a
> las pruebas del filtro. La especificación vigente del modelo y del CRUD está
> en [`wireframes_posts.md`](wireframes_posts.md) §4; este documento describe
> cómo se refleja en el feed.

Decisiones que **no** son campos:

- **No hay `excerpt`.** Se deriva con el `truncateText(content, 180)` que ya existe
  en `src/lib/format.ts`. Un campo duplicado puede desincronizarse del cuerpo.
- **No hay `facultad`** (§10.1).
- **No hay `keywords` ni `tags`.** Las palabras clave se derivan de los `#` del
  cuerpo con `extractKeywords` (`wireframes_posts.md` §6.10). Un campo aparte
  tendría dos fuentes de verdad y se desincronizaría del texto.
- El **autor** no se embebe en `Post`: se resuelve por `authorId` contra el
  repositorio de usuarios, igual que hará la consulta SQL con un `JOIN`.

### 4.2 `PostFilters` (`src/lib/types.ts`)

```ts
export type PostFilters = {
  /** Palabra clave; se busca en título y cuerpo. Máx. 80 tras `trim`. */
  keyword: string;
  /** Disciplina, o el track de desarrollo profesional. */
  category: PostCategory | "todas";
  /** Naturaleza institucional. */
  type: PostType | "todos";
  /** Área. `"general"` sí es un valor filtrable; no está acoplado a `category`. */
  researchArea: ResearchArea | "todas";
  authorId: string | "todos";
  status: PostVisibility | "todos";
  /** `YYYY-MM-DD` o `null`. Inclusivo. */
  dateFrom: string | null;
  /** `YYYY-MM-DD` o `null`. Inclusivo. */
  dateTo: string | null;
};

export const DEFAULT_POST_FILTERS: PostFilters = {
  keyword: "",
  category: "todas",
  type: "todos",
  researchArea: "todas",
  authorId: "todos",
  status: "todos",
  dateFrom: null,
  dateTo: null,
};

/** Tamaño de página de "Cargar más". */
export const POSTS_PAGE_SIZE = 6;
```

`POSTS_PAGE_SIZE = 6` porque es múltiplo de 2 y de 3: cuadra la retícula de 1, 2
y 3 columnas sin tarjetas huérfanas en el borde inferior.

`researchArea` es una dimensión **independiente** de `category` dentro del
filtro, aunque en el formulario sí sea dependiente: la razón está en
`wireframes_posts.md` §10.3. Filtrar por `robotica` sin elegir categoría es
legítimo, y por eso `general` es también un valor filtrable.

### 4.3 Correspondencia con la URL (`src/lib/filters.ts`)

Los parámetros van **en español** porque son parte de la interfaz y se comparten
por enlace.

| `PostFilters` | Parámetro | Valor inicial / vacío |
| --- | --- | --- |
| `keyword` | `q` | ausente si `""` |
| `category` | `categoria` | ausente si `"todas"` |
| `type` | `tipo` | ausente si `"todos"` |
| `researchArea` | `area` | ausente si `"todas"` |
| `authorId` | `autor` | ausente si `"todos"` |
| `status` | `estado` | ausente si `"todos"` |
| `dateFrom` | `desde` | ausente si `null` |
| `dateTo` | `hasta` | ausente si `null` |

> [!WARNING]
> `categoria` y `tipo` **conservan el nombre pero cambian de significado**:
> `?categoria=computacion` es ahora una disciplina y `?tipo=defensas` una
> naturaleza. Un enlace compartido con la semántica anterior
> (`?categoria=noticias`) degrada a `"todas"` por la tolerancia de `fromSearchParams`
> y devuelve la lista completa sin filtro: no rompe, pero tampoco filtra. Es
> aceptable en una fase estructural y hay que tenerlo presente al publicar por
> primera vez enlaces con la semántica nueva.

Funciones puras del módulo:

| Función | Firma | Nota |
| --- | --- | --- |
| `normalizeSearchText` | `(value: string) => string` | `trim`, minúsculas y **sin diacríticos** (§10.9). Además **quita una `#` inicial**, para que `#defensa` encuentre lo mismo que `defensa` |
| `fromSearchParams` | `(params: Record<string, string \| string[] \| undefined>) => PostFilters` | Descarta valores no válidos en vez de lanzar |
| `toSearchParams` | `(filters: PostFilters) => URLSearchParams` | Omite los vacíos (§5.6) |
| `applyFilters` | `(posts: Post[], filters: PostFilters) => Post[]` | Ordena por `publishedAt` **DESC** y filtra |
| `countActiveFilters` | `(filters: PostFilters) => number` | Alimenta "Filtros (2)" y "Limpiar filtros" |
| `isDateRangeValid` | `(filters: PostFilters) => boolean` | `dateFrom <= dateTo` |
| `describeActiveFilters` | `(filters: PostFilters, authors: AuthorOption[]) => string` |(copy de §5.7) |

`normalizeSearchText` quita la `#` inicial **después** de normalizar, y solo si
es el primer carácter: `#defensa` → `defensa`, pero `c#` y `# 1` se dejan como
están. Motivo en §10.9.

### 4.4 Visibilidad (`src/lib/visibility.ts`)

`frontend-structure.md` §6 enuncia la regla en dos frases que conviven:
`visible = publicado OR author_id === session`, y "`oculto` (admin): nadie
excepto autor y admin". La regla completa que se implementa es:

```
canViewPost(post, session) =
     post.visibility === "publicado"
  OR post.authorId === session.user.id
  OR (post.visibility === "oculto" AND session.user.role === "admin")
```

| Estado | Autor | `profesor` / `estudiante` | `admin` |
| --- | --- | --- | --- |
| `publicado` | ve | ve | ve |
| `borrador` | ve | no ve | **no ve** (salvo que sea suyo) |
| `oculto` | ve | no ve | ve |

Exporta `canViewPost(post, session)` y `filterVisiblePosts(posts, session)`, que
aplica `canViewPost` con cortocircuito. Ambas puras y con `session: Session`.

> [!NOTE]
> `borrador` **no** lo ve un admin ajeno. Un borrador es material de trabajo
> personal; el rol de admin cubre la moderación de lo ya publicado (`oculto`), no
> la lectura de lo que alguien no ha terminado. Es la lectura conservadora de
> §10.1 de `auth.md`: sin selector de rol público, el admin no es un superusuario.

### 4.5 Repositorios (`src/lib/repositories/`)

```ts
export type PostPage = { items: Post[]; total: number };

export interface PostRepository {
  /** Aplica visibilidad y filtros, ordena por fecha DESC y pagina. */
  findVisible(
    filters: PostFilters,
    page: { limit: number; offset: number },
    session: Session,
  ): Promise<PostPage>;
  findById(id: string): Promise<Post | null>;
}

export type AuthorOption = {
  id: string;
  username: string;
  /** "María Rivas" — para el `<option>` del filtro. */
  fullName: string;
};

export interface UserRepository {
  listAuthors(): Promise<AuthorOption[]>;
}
```

- **Desvío de `findAll` a `findVisible`.** `frontend-structure.md` §2 nombra
  `findAll`; con "Cargar más" la consulta necesita `limit`/`offset` y necesita
  la sesión para la visibilidad, así que la firma cambia. `frontend-structure.md`
  es inmutable: el desvío queda registrado en `progress.md` (§9), no se edita el
  documento de arquitectura.
- **Paginar con `limit` creciente y `offset: 0`.** `FeedView` llama a
  `findVisible(filters, { limit: visibleCount, offset: 0 })` en vez de acumular
  páginas. Es trivialmente correcto si dos elementos cambian de posición entre
  llamadas, y en SQL es el mismo `LIMIT n` sin ventaneo.
- `listAuthors()` devuelve solo los autores que **tienen al menos una publicación
  visible para la sesión**; se calcula en el cliente con
  `filterVisiblePosts`, no en el repositorio.
- Orden de las opciones de autor: alfabético por `fullName`, con `localeCompare`
  y `"es"`, para que el orden no cambie con el locale del sistema.

### 4.6 Datos estáticos (`src/data/`)

- `src/data/posts.ts` exporta `mockPosts: Post[]` con **12 publicaciones**:
  suficiente para que "Cargar más" tenga dos pulsaciones (6 + 6 de 12) y para que
  los filtros combinables se puedan demostrar.
  - Reparto: 6 `publicado` de autores distintos, 2 `borrador` de la autora de la
    sesión, 1 `publicado` del propio autor para que el perfil tenga contenido, 1
    `oculto` de otro autor (para probar el alcance de `admin`), 2 más de autores
    con `publishedAt` dentro y fuera del rango de marzo de 2026.
  - Todos los autores referidos existen en `src/data/users.ts`, que hoy tiene 2
    usuarios: **hay que ampliar `users.ts`** a 5 (1 admin, 1 profesor, 3
    estudiantes) para que los filtros de autor y rol tengan datos.
  - Al menos un `publishedAt` con hora distinta de medianoche, para que el orden
    DESC se compruebe con precisión y no solo por día.
- `src/data/session.ts` se mantiene; `mockInitialSession` sigue siendo `null`
  porque la sesión real la resuelve `SessionProvider` desde `localStorage`.

## 5. Inventario de filtros y copy

### 5.1 Controles

Regla transversal heredada de `auth.md` §4: **el placeholder nunca es la
etiqueta**. Todos los controles tienen label visible.

| Control | Label visible | Tipo | `name` | Valores | Ayuda |
| --- | --- | --- | --- | --- | --- |
| Buscador | `Buscar publicaciones` | `search` + `enterKeyHint="search"` | `q` | texto libre, `maxLength={80}` | acepta `#etiqueta` |
| Categoría | `Categoría` | `select` nativo con `optgroup` | `categoria` | `Todas las categorías` + 2 grupos: 5 disciplinas y 1 track | — |
| Tipo | `Tipo de publicación` | `select` nativo | `tipo` | `Todos los tipos` + 5 naturalezas | — |
| Área | `Área de investigación` | `select` nativo con `optgroup` | `area` | `Todas las áreas` + 6 grupos (uno por rubro) | — |
| Autor | `Autor` | `select` nativo | `autor` | `Todos los autores` + `fullName` | — |
| Estado | `Estado` | `select` nativo | `estado` | `Todos los estados` + 3 estados | **condicional** (§5.2) |
| Desde | `Desde` | `date` | `desde` | `YYYY-MM-DD` | — |
| Hasta | `Hasta` | `date` | `hasta` | `YYYY-MM-DD` | — |
| Limpiar | — | `button` ghost `sm` | — | — | visible solo si `countActiveFilters > 0` |

Son **9 controles**, no 8: `Área` entra como dimensión propia. `Categoría` y
`Área` **no** se acoplan en el filtro, a diferencia del formulario, y la razón
está en `wireframes_posts.md` §10.3.

- Los `<select>` son **nativos** (`<select><option>`), sin listbox propio (§10.8).
  El borde usa `--text-muted` por el mismo motivo que los campos de
  `auth.md` §8.3: es la frontera que identifica el control.
- Los `<input type="date">` son nativos también: el selector de calendario del
  sistema es más usable que un `datepicker` propio y es accesible sin trabajo
  extra.
- Todos los controles: `min-h-11` (44px), `text-base`, `bg-surface`,
  `border border-text-muted`, `rounded-md`, foco con el anillo global.

### 5.2 El filtro "Estado" es condicional

> [!IMPORTANT]
> El selector "Estado" **solo se renderiza** cuando la sesión puede ver
> publicaciones que no están publicadas: es decir, cuando el usuario es autor de
> al menos un `borrador` u `oculto`, o cuando su rol es `admin`. Para el resto de
> usuarios el filtro se oculta y `status` queda forzado a `"publicado"`.

Motivo: ofrecer "Borrador" a alguien que jamás podrá ver un borrador ajeno produce
un estado vacío sin explicación, que se lee como bug. Es el mismo criterio que
`wireframes_auth.md` §1 aplicó al selector de rol del registro.

### 5.3 Copy de los valores

**Naturaleza institucional** — el `<select>` `Tipo de publicación`:

| Grupo | Etiquetas |
| --- | --- |
| Tipos | `Noticias` · `Eventos` · `Defensas` · `Investigación` · `Convocatorias` |

**Rubro de clasificación** — el `<select>` `Categoría`, con dos `<optgroup>`:

| `<optgroup label>` | Etiquetas |
| --- | --- |
| `Disciplinas` | `Matemáticas` · `Biología` · `Química` · `Física` · `Computación` |
| `Desarrollo profesional` | `Desarrollo profesional` |

El último valor es el único de su grupo, y esa asimetría es intencionada: el
`optgroup` existe para que se lea como track y no como departamento
(`wireframes_posts.md` §10.15).

**Área de investigación** — el `<select>` `Área`, con un `<optgroup>` por rubro y
las áreas de §4.2 de `wireframes_posts.md`:

| `<optgroup label>` | Etiquetas |
| --- | --- |
| `Matemáticas` | `General` · `Estadística` · `Probabilidad` · `Optimización` · `Matemáticas Aplicadas` · `Modelado Matemático` |
| `Biología` | `General` · `Biotecnología` · `Bioquímica` · `Genética` · `Microbiología` · `Ecología` · `Bioinformática` |
| `Química` | `General` · `Química Analítica` · `Química Orgánica` · `Química Inorgánica` · `Fisicoquímica` · `Química Medioambiental` |
| `Física` | `General` · `Física Computacional` · `Física de Materiales` · `Astronomía` · `Física Nuclear` · `Mecánica de Fluidos` |
| `Computación` | `General` · `Inteligencia Artificial` · `Aprendizaje Automático` · `Ciencia de Datos` · `Desarrollo Web` · `Ingeniería de Software` · `Redes y Telecomunicaciones` · `Seguridad Informática` · `Sistemas Distribuidos` · `Bases de Datos` · `Computación Gráfica` · `Robótica` · `Arquitectura de Computadores` |
| `Desarrollo profesional` | `General` · `Liderazgo y Gestión de Equipos` · `Comunicación Profesional` · `Ética Profesional` · `Emprendimiento` · `Gestión de Proyectos` |

Aquí los rótulos de `optgroup` **sí** coinciden con los valores del `select` de
`Categoría`, para que quien tenga los dos desplegables abiertos relacione un
grupo con el otro sin traducir de un vocabulario a otro.

**Visibilidad**:

| Grupo | Etiquetas |
| --- | --- |
| Estados | `Publicado` · `Borrador` · `Oculto` |

**Opciones de "todo"**:

| Grupo | Etiquetas |
| --- | --- |
| Estados (bis) | `Todos los estados` · `Todas las categorías` · `Todos los tipos` · `Todas las áreas` · `Todos los autores` |

Las etiquetas llevan **mayúscula inicial** en `<option>` y los valores internos van
en minúsculas sin acentos (`noticias`, `defensas`, `computacion`): son claves de
dominio, no texto. El valor legible de `crecimiento-profesional` es
`Desarrollo profesional`, no el slug.

### 5.4 Copy del buscador y de los togglers

| Elemento | Copy |
| --- | --- |
| Placeholder del buscador | `defensas, #rii, inteligencia artificial…` |
| Toggler móvil | `Filtros` · `Filtros (2)` cuando hay filtros activos |
| Botón limpiar | `Limpiar filtros` |

El placeholder no promete nada: es un ejemplo de lo que la red publica, no una
descripción de la función (esa está en el label). Incluye un `#` a propósito,
porque las palabras clave son etiquetas en el cuerpo (`wireframes_posts.md`
§6.10) y quien busca por hashtag es el caso de uso que no encuentra el título. La
`#` inicial se ignora al buscar (§4.3), así que `#rii` y `rii` dan el mismo
resultado.

El contador del toggler cuenta `Categoría` y `Área` por separado: son dos
dimensiones y limpiar una no limpia la otra.

### 5.5 Copy de la `PostCard`

| Elemento | Copy |
| --- | --- |
| Título (enlace) | `{post.title}` |
| Autor | `{givenName} {familyName}` + ` · @` + `{username}` |
| Fecha | `formatDate(publishedAt)` → `12 mar 2026` |
| Línea de taxonomía | `{Categoría}` + ` · ` + `{Área}` |
| Extracto | `truncateText(content, 180)` |
| Palabras clave | `#defensa` · `#rii` + `+{n}` |
| Nota `borrador` | `Solo tú ves esta publicación.` |
| Nota `oculto` | `Oculta por un administrador.` |

Las dos notas van precedidas de `LockIcon` y son **texto**, no solo color (SC 1.4.1).

**Badge de tipo.** El único badge es el de `type` (naturaleza): `Defensas`,
`Eventos`, `Convocatorias`… El rótulo legible de `computacion` **no** va en
badge, porque en la línea de taxonomía ya aparece y dos veces lo mismo es ruido.

**Línea de taxonomía.** Es `Categoría · Área` con las etiquetas legibles, nunca
los slugs: `Matemáticas · Modelado Matemático`. Para el track de desarrollo
profesional se lee `Desarrollo profesional · Liderazgo`, que no finge que exista
un departamento detrás (`wireframes_posts.md` §10.15).

**Palabras clave.** Hasta 3 chips con la forma normalizada —sin tilde, en
minúsculas, `#defensa`— y `+{n}` si sobran. Se muestran junto al badge, no en la
línea de taxonomía: son más accionables que el área y quien busca por `#rii` las
reconoce de un vistazo.

### 5.6 Reglas de la URL

- `router.replace(pathname + "?" + toSearchParams(next))`, nunca `push`: filtrar
  no debe llenar el historial de entradas (§10.3).
- Si `toSearchParams` queda vacío, se navega a `pathname` **sin `?`** para no
  dejar una URL con la query vacía.
- `fromSearchParams` es **tolerante**: un `?categoria=inventada` devuelve
  `"todas"`; `?area=robotica` con un valor inexistente también; una fecha mal
  formada devuelve `null`. Compartir un enlace corrupto degrada a "sin filtro",
  nunca a una pantalla en blanco.
- Se omite `scroll: false`: al cambiar los filtros la lista cambia de contenido y
  el usuario debe volver arriba a ver el H1 y el nuevo contador.

### 5.7 Copy de los estados de la lista

| Situación | Título | Cuerpo | Acción |
| --- | --- | --- | --- |
| Sin publicaciones y sin filtros | `Todavía no has publicado nada` | `Tus publicaciones aparecerán aquí en cuanto publiques la primera.` | `Crear publicación` → `/posts/new` |
| Sin resultados con filtros | `No hay publicaciones que coincidan` | `Prueba con menos filtros o con otras palabras.` | `Limpiar filtros` |
| Sin resultados con rango de fechas | `No hay publicaciones en ese rango` | `No hay publicaciones publicadas entre el {desde} y el {hasta}.` | `Limpiar filtros` |
| Rango incoherente | `La fecha inicial no puede ser posterior a la final.` | — | `Limpiar filtros` |

Contador (`role="status"`, `aria-live="polite"`):

| Situación | Copy |
| --- | --- |
| Sin filtros | `24 publicaciones` · `1 publicación` |
| Con filtros | `24 publicaciones encontradas` · `1 publicación encontrada` |
| Con página parcial | `Mostrando 6 de 24 publicaciones` |

Botón de paginación: **`Cargar más`**. Cuando quedan resultados por mostrar se
anticipa el texto: `Cargar más (6)`.

## 6. Componentes

Inventario de lo que hay que crear. Todos llevan `*.test.*` colocated (§9.2).

### 6.1 `src/components/layout/navbar.tsx` — cliente

`min-h-16`, `sticky top-0 z-30 bg-surface border-b border-border`, contenido en
`max-w-7xl`. Ver §2.2 para zonas y comportamiento. Reutiliza `buttonStyles`,
`ThemeToggle` (`src/components/layout/theme-toggle.tsx`) y los iconos de
`src/components/ui/icons.tsx`.

### 6.2 `src/components/layout/bottom-nav.tsx` — cliente

Ver §2.3. `md:hidden`, `fixed`, `bg-surface` **opaco** (§8.4), cuatro destinos,
`aria-current="page"`, `min-h-14`.

### 6.3 `src/components/feed/filter-bar.tsx` — cliente

```ts
export type FilterBarProps = {
  filters: PostFilters;
  authors: AuthorOption[];
  /** `false` oculta el filtro de estado y fuerza `status: "publicado"`. */
  showStatusFilter: boolean;
  dateRangeError: string | null;
  /** Aplica el cambio escribiendo la URL; la lista se vuelve a renderizar. */
  onChange: (next: PostFilters) => void;
  onClear: () => void;
};
```

- **No** lee la URL: recibe `filters` por props desde la página (que ya la parseó
  del `searchParams` del servidor) y **escribe** con `onChange`. Así no hace falta
  `useSearchParams` y por tanto ningún `Suspense` alrededor de la pantalla.
- Búsqueda con rebote de **300 ms** (`useEffect` + `setTimeout`, limpiado en el
  cleanup). El `<select>` y las fechas se aplican **de inmediato**, sin rebote: son
  elecciones cerradas y el usuario espera un resultado, no teclea.
- **9 controles**: buscador, `Categoría`, `Tipo`, `Área`, `Autor`, `Estado`
  *(condicional)*, `Desde`, `Hasta`, `Limpiar filtros`.
- `Categoría` y `Área` llevan `<optgroup>` (§5.3). `Área` **no** se deshabilita
  ni se puebla según `Categoría`: son dimensiones independientes en el filtro,
  aunque el formulario sí las acople (`wireframes_posts.md` §10.3).
- Escritorio: los `<select>` en rejilla de 3 columnas con `size="sm"`. Con cinco
  desplegables el ancho es el recurso escaso y la rejilla lo reparte mejor que
  una fila.
- Móvil: dentro del panel plegable que ya existe, sin cambios de estructura.
- Panel móvil colapsado con `useState`:
  `button aria-expanded aria-controls="feed-filters-panel"` y
  `<div id="feed-filters-panel" hidden={!open}>`. **No** es un modal: no hay foco
  que atrapar ni `Escape` que cerrar, y el contenido sigue en el flujo para el
  zoom y la lectura por teclado.
- "Limpiar filtros" es `buttonStyles({ variant: "ghost", size: "sm" })` y solo se
  monta si `countActiveFilters(filters) > 0`.
- Orden de tabulación = orden visual: buscador, toggler, (panel), limpiar.
- El `<form>` que envuelve los controles lleva `onSubmit` con
  `event.preventDefault()` y `role="search"`: pulsar Intro en el buscador **filtra**
  en lugar de recargar, y un `<form role="search">` da a los lectores de pantalla
  un punto de entrada reconocible.

> [!WARNING]
> El ancho de escritorio está **justo** con cinco desplegables más el buscador y
> el rango de fechas. Hay que comprobarlo renderizado. Si desborda, el plan B
> declarado es un único `<select>` que combine `Tipo` y `Área` en un desplegable
> con `optgroup`, dejando cuatro (`wireframes_posts.md` §6.9).

### 6.4 `src/components/feed/post-card.tsx` — servidor

```ts
export type PostCardProps = {
  post: Post;
  author: AuthorOption | null;
};
```

- `<article>` con `border border-border rounded-lg bg-surface`, `flex flex-col
  gap-3`, `p-5`, `hover:border-primary focus-within:border-primary
  transition-colors`: el borde cambia con `:hover` **y** con `:focus-within`, así
  que el estado de " pulsable" también aparece al tabular. Con imagen el `p-5` se
  sustituye por `p-0` arriba y `p-5` en el bloque de texto, para que la imagen
  llegue al borde.
- **Banda de imagen**, solo si `post.imageUrl !== null`:
  `<div class="aspect-video overflow-hidden rounded-t-lg">` con
  `<Image fill sizes="(max-width: 768px) 100vw, 33vw" alt="" />`. Es la **única**
  banda de imagen que la tarjeta tiene; el `alt` va vacío porque es decorativa y
  el título, justo debajo, ya nombra la publicación. Si `imageUrl` es `null`
  **no se renderiza ningún hueco ni caja de reserva** (§10.12).
- Fila de badges (izquierda) y, si el estado no es `publicado`, el aviso de
  visibilidad (derecha, `ml-auto`). El único badge es el de `type`.
- **Línea de taxonomía** `Categoría · Área` en 14px `--text-muted`, con etiquetas
  legibles y nunca los slugs (§5.5).
- **Chips de palabras clave**, hasta 3 con la forma normalizada y `+{n}` si
  sobran, junto al badge. Salen de `extractKeywords(post.content)`
  (`wireframes_posts.md` §6.10).
- **Título = enlace.** `<h3 class="font-display text-h3 text-text">` con un
  `<Link href={`/posts/${post.id}`}>` dentro, y el anclaje estirado con un
  pseudoelemento `after:absolute after:inset-0`, de modo que toda la tarjeta es
  zona clicable pero el texto del enlace sigue siendo el título. Es el patrón del
  enlace estirado: un solo enlace por tarjeta, con nombre accesible descriptivo
  (§10.6).
- El `article` es `relative` para que el `after` se posicione contra él.
- Fecha con `formatDate` de `src/lib/format.ts`; extracto con `truncateText`.
- Extracto con `line-clamp-3` para que las tarjetas tengan altura homogénea.
- **Sin menú `⋯`** en esta fase (§10.5). `Eliminar` vive en el detalle
  (`wireframes_posts.md` §5.6).
- `author === null` (referencia rota en el mock) degrada a mostrar solo la fecha,
  sin `undefined` en pantalla.

### 6.5 `src/components/feed/load-more.tsx` — cliente

```ts
export type LoadMoreProps = {
  shown: number;
  total: number;
  pageSize: number;
  onLoadMore: () => void;
};
```

- `buttonStyles({ variant: "secondary" })`, ancho `w-full sm:w-auto`.
- Visible solo si `shown < total`; copy `Cargar más` o `Cargar más ({restantes})`.
- No es `pagination.tsx`: la paginación numerada se descartó (§10.4).

### 6.6 `src/components/feed/feed-view.tsx` — cliente

Orquestador. **No** figura en `frontend-structure.md` §2; se añade y el desvío
queda registrado en `progress.md`.

```ts
export type FeedViewProps = {
  filters: PostFilters;
  authors: AuthorOption[];
};
```

- Toma la sesión de `useSession()`. Con `status !== "authenticated"` renderiza
  `null` (el `SessionProvider` ya está redirigiendo).
- Estado propio: `visibleCount`, inicial `POSTS_PAGE_SIZE`.
- **`visibleCount` se reinicia a `POSTS_PAGE_SIZE` en cuanto cambian los
  filtros**, porque si no "Cargar más" heredaría el límite de la consulta
  anterior. La página lo resuelve sin `useEffect`: monta
  `<FeedView key={JSON.stringify(filters)} … />`, de modo que un cambio de filtro
  remonta el componente y el estado vuelve a su valor inicial.
- Llama a `postRepository.findVisible(filters, { limit: visibleCount, offset: 0 }, session)`
  dentro de un `useEffect` con `AbortController` para ignorar respuestas tardías,
  y guarda `items` y `total` en estado. `error` inesperado muestra un `EmptyState`
  con `No pudimos cargar las publicaciones.` y acción `Reintentar`.
- Calcula `showStatusFilter` (§5.2) y `dateRangeError` (§3.6), y **deshabilita**
  el botón de resultados mientras `dateRangeError` no sea `null`, sin ocultar los
  filtros.
- Orden de render: `FilterBar` → contador (`role="status"`) → error de rango
  (`role="alert"`) → rejilla de `PostCard` → `LoadMore` / `EmptyState`.
- Rejilla: `grid gap-4 md:grid-cols-2 xl:grid-cols-3`.
- **Sin esqueleto de carga** (§10.15).

### 6.7 `src/components/shared/empty-state.tsx` — servidor

```ts
export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
};
```

`border border-border rounded-lg bg-surface p-10 text-center flex flex-col
items-center gap-3`. Si `action.href` existe usa `<Link>`; si no, `<button>`. Es
la primera versión de este componente y la reutilizarán `/profile` y `/admin`.

### 6.8 `src/components/ui/badge.tsx` — servidor

```ts
export type BadgeTone = "neutral" | "category" | "success" | "muted" | "warning";

export type BadgeProps = {
  tone: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
};
```

- `inline-flex items-center gap-1 rounded-sm bg-surface-muted px-2 py-0.5
  text-xs font-medium` + el color de texto del tono.
- Tonos: `category`→`text-primary` · `success`→`text-success` · `muted`→
  `text-text-muted` · `warning`→`text-warning` · `neutral`→`text-text-muted`.
- Fondo **siempre** `--surface-muted`, sin tintes: los cinco tonos sobre un fondo
  común son legibles y solo cambian el color del texto (§8.2).
- El badge **nunca** es el único portador del estado: siempre acompaña a su
  etiqueta textual ("Publicado", "Borrador"), lo que además cumple SC 1.4.1.

### 6.9 `src/components/ui/select-field.tsx` — servidor

Como `Field`, pero para `<select>`: label visible, `id` con `useId`, slots de
ayuda y error, `aria-describedby` cableado, borde `--text-muted`. Se crea porque
`Field` está tipado sobre `InputHTMLAttributes<HTMLInputElement>` y no admite
`<select>`; extenderlo obligaría a relajar ese tipo.

Acepta `<optgroup>` como `children`, que es lo que permite los dos selectores
nuevos del filtro y el `Categoría` del formulario (`wireframes_posts.md` §5.3).
El `optgroup` es nativo y no necesita código propio: llega en el `children` del
`<select>` y el resto del contrato no cambia.

También admite `disabled` nativo, que es lo que hace el `Área` del formulario
mientras no haya categoría elegida (`wireframes_posts.md` §7.6). `disabled` real y
no `aria-disabled`, porque un control deshabilitado no debe ser tabulable.

### 6.10 Iconos a añadir (`src/components/ui/icons.tsx` — modificar)

SVG propios, 24×24, `stroke="currentColor"`, `stroke-width={1.75}`,
`aria-hidden="true"` y `focusable="false"`, siguiendo el patrón de los seis
existentes: `HomeIcon`, `PlusIcon`, `UserIcon`, `ShieldIcon`, `SearchIcon`,
`SlidersIcon` (toggler de filtros), `LockIcon`, `CalendarIcon`. **Sin emoji** en
el código, también en los wireframes de este documento.

## 7. Accesibilidad (WCAG 2.2 AA)

Transversal en [`accessibility.md`](accessibility.md). Lo específico de esta
pantalla:

- **Enlace de salto** `<a href="#contenido" class="sr-only focus:not-sr-only">Saltar al contenido</a>` como primer elemento enfocable de `(main)`.
- **Landmarks**: `banner` (`<header>` de la navbar), `main`, `navigation` con
  `aria-label="Navegación principal"` (la `BottomNav`; la de la navbar usa
  `aria-label="Secciones"`), `contentinfo` (`Footer`, ya lo tiene).
- **`aria-current="page"`** en el destino activo de `Navbar` y `BottomNav`. Es un
  enlace de navegación, no un simple botón con estado visual.
- **Contador de resultados** con `role="status"` + `aria-live="polite"`:
  filtrar cambia el número de resultados y quien navega por lector de pantalla
  tiene que oírlo. El texto announced es el `Copy` de §5.7.
- **Error de rango** con `role="alert"` y foco movido, reutilizando el patrón de
  `FormAlert` que ya existe: mensaje **texto + icono**, nunca solo color.
- **`type="search"`** con `enterKeyHint="search"`, `maxLength={80}` y label
  visible. Sin `aria-live` en el input: el contador ya anuncia el resultado, y
  anunciarlo dos veces es ruido.
- **`<select>` nativos**: con hasta 39 áreas y 6 categorías, un listbox propio
  añadiría `aria-activedescendant` y navegación por flechas que reinventar mal.
  El nativo ya cumple, en móvil da el selector del sistema y de paso expone los
  `<optgroup>` a los lectores de pantalla.
- **Badge de tipo**: nunca solo color; la etiqueta textual siempre presente.
- **Taxonomía y chips**: `Categoría · Área` y los chips `#defensa` son texto real,
  no iconos ni color, para que se lean al leerlos y se puedan copiar.
- **Contraste del badge de tipo**: `--primary` sobre `--surface-muted` da
  10.16:1 (AAA), verificado en §8.2.
- **Objetivos táctiles ≥ 44px**: `min-h-11` en todos los controles,
  `min-h-14` en los destinos de la `BottomNav`, `44×44` en los botones de icono.
- **Orden de tabulación** = orden visual, también dentro de la tarjeta: la
  tarjeta tiene **un solo** elemento enfocable (el título). Las notas de
  visibilidad no son texto enfocable.
- **Foco siempre visible**: el anillo global de `globals.css`
  (`outline: 2px solid var(--accent)`) no se elimina en ningún control. `Field`
  lo sustituye por `focus-visible:ring-2`; `select-field.tsx` replica ese patrón
  para que el anillo se vea igual en campos y en selectores.
- **Reflow a 320px** y **zoom al 400%** sin scroll horizontal: una columna de
  tarjetas, `FilterBar` en una columna, `Navbar` sin enlaces de sección.
- **`prefers-reduced-motion`**: la regla global de `globals.css` ya congela las
  transiciones; el panel de filtros aparece y desaparece sin animación propia.
- El enlace estirado de la tarjeta **no** oculta texto al lector de pantalla: el
  `<Link>` contiene el título completo, así que la lista de enlaces de la página
  es una lista de títulos de publicaciones.

## 8. Tokens y contraste

### 8.1 Sin tokens nuevos

Todo lo que la pantalla necesita ya está en `src/app/globals.css`. No se crea
ningún token: ni para categorías, ni para el badge, ni para el panel de filtros.
Un color por significado (estado), no un color por elemento.

Jerarquía heredada de `auth.md` §8.1: `--primary` identidad · `--accent` ámbar de
acción (una sola superficie en toda la pantalla: "Nueva publicación") ·
`--accent-teal` enlaces y elementos activos en la navegación · `--text` /
`--text-muted` contenido · `--success` / `--warning` / `--danger` estado ·
`--surface-muted` fondo de insignias y de controles densos.

### 8.2 Los badges sobre `--surface-muted`

`--success` y `--warning` existían en la paleta pero **no los usaba nadie**: se
define aquí su primer consumidor y, al hacerlo, aparece un problema de contraste.

Con el fondo real del badge (`--surface-muted`) los valores del brief fallan por
dos centésimas:

| Texto | Fondo | Ratio actual | Cumple |
| --- | --- | --- | --- |
| `--success` `#15803d` | `#eef1f6` | **4.43:1** | ❌ (SC 1.4.4 pide 4.5:1) |
| `--warning` `#b45309` | `#eef1f6` | **4.44:1** | ❌ |
| `--text-muted` `#51607a` | `#eef1f6` | 5.61:1 | ✅ AA |

**Ajuste requerido: oscurecer los dos valores claros**, conservando el tono
(verde `green-800` y ámbar `amber-800`). Los oscuros no se tocan:

| Token | Claro | Nuevo claro | Ratio en `#eef1f6` | Ratio en `#ffffff` |
| --- | --- | --- | --- | --- |
| `--success` | `#15803d` | **`#166534`** | 6.30:1 ✅ | 7.13:1 |
| `--warning` | `#b45309` | **`#92400e`** | 6.26:1 ✅ | 7.09:1 |

Es el mismo tipo de desviación documentada en `auth.md` §8.1 y §8.4: la paleta se
corrige para cumplir AA en el uso real. Los valores oscuros `#4ade80` y `#fbbf24`
se quedan porque sobre `#1c2740` dan 8.53:1 y 8.90:1.

### 8.3 Contraste verificado del resto de la pantalla

Ratios calculados sobre los valores reales de `globals.css`.

| Elemento | Claro | Ratio | Cumple |
| --- | --- | --- | --- |
| Título de tarjeta `--text` sobre `--surface` | `#172033` / `#ffffff` | 16.27:1 | AAA |
| Extracto y metacarpeta `--text-muted` sobre `--surface` | `#51607a` / `#ffffff` | 6.36:1 | AA |
| Contador `--text-muted` sobre `--bg` | `#51607a` / `#f5f7fa` | 5.92:1 | AA |
| Badge de tipo `--primary` sobre `--surface-muted` | `#1e3a5f` / `#eef1f6` | 10.16:1 | AAA |
| Texto del CTA `--accent-foreground` sobre `--accent` | `#0b1220` / `#d97706` | 5.88:1 | AA |
| Enlaces activos y "Cargar más" `--accent-teal` sobre `--surface` | `#0369a1` / `#ffffff` | 5.93:1 | AA |
| Mensaje de error `--danger` sobre `--surface` | `#b91c1c` / `#ffffff` | 6.47:1 | AA |
| Borde de los controles `--text-muted` sobre `--surface` | `#51607a` / `#ffffff` | 6.36:1 | AA (SC 1.4.11) |
| Anillo de foco `--accent` sobre `--surface` | `#d97706` / `#ffffff` | 3.19:1 | AA (SC 2.4.11) |
| Marco de tarjeta `--border` sobre `--surface` | `#d8deea` / `#ffffff` | 1.35:1 | Decorativo, exento |

Modo oscuro:

| Elemento | Ratio | Cumple |
| --- | --- | --- |
| `--text` `#e6eaf2` sobre `--surface` `#131c31` | 14.07:1 | AAA |
| `--text-muted` sobre `--surface` | 6.51:1 | AA |
| `--primary` `#7fa8e8` sobre `--surface-muted` `#1c2740` | 6.13:1 | AA |
| `--success` `#4ade80` sobre `#surface-muted` | 8.53:1 | AAA |
| `--warning` `#fbbf24` sobre `--surface-muted` | 8.90:1 | AAA |
| `--accent-teal` `#38bdf8` sobre `--surface` | 7.92:1 | AAA |
| Texto del CTA `#0b1220` sobre `--accent` `#f59e0b` | 8.72:1 | AAA |

Cuatro ratios que conviene no dar por buenos sin comprobarlos:

1. **`--accent` nunca es color de texto.** Como texto sobre `--surface-muted`
   da 2.81:1 y sobre `--bg` 2.97:1: ambos fallan. El ámbar es **superficie** con
   texto `--accent-foreground`, nunca letra. Igual que en `auth.md` §8.1.
2. **El anillo de foco queda justo**: 3.19:1 cumple el 3:1 de SC 2.4.11 sin
   margen. Por eso los enlaces cambian además de tono al recibir foco, igual que
   se resolvió en `auth.md` §8.2.
3. **El marco de la tarjeta es decorativo y está exento.** `--surface` sobre
   `--bg` da 1.07:1, así que la separación de la tarjeta la hace el borde
   `--border` más las insignias. SC 1.4.11 solo exige 3:1 en la frontera que
   *identifica un control*, y aquí esa frontera es la del buscador y la de los
   `<select>`, que usan `--text-muted` (6.36:1).
4. **La tarjeta no se atenúa.** `opacity` sobre un `borrador` bajaría el texto
   por debajo de AA sin comunicar nada que el badge y la nota no comuniquen ya.

### 8.4 Regla que impone `--accent`

> [!IMPORTANT]
> `--accent` da **2.97:1** sobre `--bg`, así que **ningún elemento interactivo
> de `(main)` puede ser transparente sobre `--bg`**. El anillo de foco global se
> mide contra el color adyacente, y si ese color es `--bg` la pantalla falla SC
> 2.4.11.

De ahí dos requisitos:

- `Navbar` y `BottomNav` usan `bg-surface` **opaco**, no translúcido.
- El `variant: "ghost"` de `buttonStyles` (`bg-transparent`) solo puede usarse
  **dentro** de un contenedor `--surface`, nunca suelto sobre `--bg`. Por eso
  "Limpiar filtros" va sobre la tarjeta de filtros (`--surface`), no sobre el
  fondo de la página.

## 9. Guía de archivos para el `developer`

> [!WARNING]
> **Revisado contra `wireframes_posts.md`.** Este capítulo se escribió cuando el
> feed era la única pantalla de publicaciones y el modelo de `Post` era el de
> `wireframes.md`. Desde entonces `wireframes_posts.md` es la **fuente autoritativa**
> del modelo y del CRUD, y este documento lo es solo de la pantalla del feed.
>
> Las filas marcadas con `⚠︎` **ya no son la referencia**: su contenido cambió y
> la versión buena está en `wireframes_posts.md` §9. Se conservan aquí, sin
> reescribir, como registro de lo que se decidió en su día; quien implemente debe
> leer la tabla nueva primero y esta después.
>
> Precedencia, cuando los dos documentos discrepen:
> `wireframes_posts.md` manda sobre el **modelo, el CRUD, la taxonomía y las
> rutas**; `wireframes_feed.md` manda sobre el **feed, los filtros, el contador y
> el shell**. Ninguno pisa al otro.

### 9.1 Archivos

| Archivo                                              | Acción                  | Responsabilidad                                                                                             |
| ---------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/app/globals.css`                                | modificar               | `--success` `#15803d`→`#166534` y `--warning` `#b45309`→`#92400e` (solo modo claro). Nada más                 |
| `src/app/(main)/layout.tsx`                          | crear                  | Shell: enlace de salto, `SessionProvider`, `Navbar`, `<main id="contenido">`, `BottomNav`, `Footer`            |
| `src/app/(main)/feed/page.tsx`                       | reemplazar placeholder | Metadata, H1, subtítulo y `<FeedView filters authors>`; parsea `searchParams` con `fromSearchParams`          |
| `src/lib/session/session-provider.tsx`               | crear                  | Contexto de sesión: `loading`/`authenticated`/`anonymous`, `useSession`, `signOut`, corte en `loading`        |
| `src/components/layout/navbar.tsx`                   | crear                  | Cliente. §2.2 y §6.1                                                                                           |
| `src/components/layout/bottom-nav.tsx`               | crear                  | Cliente. §2.3 y §6.2                                                                                           |
| `src/components/feed/feed-view.tsx`                  | crear                  | Cliente. §6.6: sesión, consulta, `visibleCount`, contador, estados                                             |
| `src/components/feed/filter-bar.tsx`                 | crear                  | Cliente. §6.3 ⚠︎ **9 controles**: Taxonomía, rótulos y `optgroup` los fija `wireframes_posts.md` §5.3          |
| `src/components/feed/post-card.tsx`                  | crear                  | Servidor. §6.4 ⚠︎ **Banda 16:9**, taxonomía y chips: los fija `wireframes_posts.md` §6.8                       |
| `src/components/feed/load-more.tsx`                  | crear                  | Cliente. §6.5                                                                                                  |
| `src/components/shared/empty-state.tsx`              | crear                  | Servidor. §6.7. Lo reutilizarán `/profile` y `/admin`                                                          |
| `src/components/ui/badge.tsx`                        | crear                  | Servidor. §6.8                                                                                                  |
| `src/components/ui/select-field.tsx`                 | crear                  | Servidor. §6.9 ⚠︎ Admite `<optgroup>` y `disabled`: `wireframes_posts.md` §6.9                                   |
| `src/components/ui/icons.tsx`                        | modificar              | Añadir los 8 iconos de §6.10 con el patrón existente                                                          |
| `src/lib/types.ts`                                   | modificar              | ⚠︎ **Modelo completo reescrito** en `wireframes_posts.md` §4.1: `PostType` pasa a ser naturaleza, `category` a rubro, entra `researchArea` |
| `src/lib/visibility.ts`                              | crear                  | `canViewPost`, `filterVisiblePosts` (§4.4)                                                                     |
| `src/lib/filters.ts`                                 | crear                  | Las 7 funciones puras de §4.3 ⚠︎ `normalizeSearchText` quita además la `#` inicial                           |
| `src/lib/repositories/post-repository.ts`            | crear                  | Interfaz `PostRepository` + `PostPage` (§4.5)                                                                  |
| `src/lib/repositories/post-repository.static.ts`     | crear                  | Implementación sobre `src/data/posts.ts`                                                                      |
| `src/lib/repositories/user-repository.ts`            | crear                  | Interfaz `UserRepository` + `AuthorOption`                                                                     |
| `src/lib/repositories/user-repository.static.ts`     | crear                  | Implementación sobre `src/data/users.ts`                                                                      |
| `src/data/posts.ts`                                  | crear                  | 12 publicaciones (§4.6) ⚠︎ Fixtures según el modelo nuevo: `wireframes_posts.md` §4.6                            |
| `src/data/users.ts`                                  | modificar              | Ampliar a 5 usuarios: 1 admin, 1 profesor, 3 estudiantes                                                      |
| `src/lib/keywords.ts`                                | crear                  | ⚠︎ **Nuevo**: `extractKeywords`, normalización y tope de 12. `wireframes_posts.md` §6.10                        |
| `src/lib/taxonomy.ts`                                | crear                  | ⚠︎ **Nuevo**: las 6 categorías, 39 áreas y sus etiquetas legibles. `wireframes_posts.md` §4.2                   |
| `src/test/factories.ts`                              | crear                  | `makePost(overrides)` y `makeAuthor()`                                                                         |
| `src/test/fixtures.ts`                               | crear                  | Datasets: feed mixto, escenario de filtros, escenario de visibilidad por rol                                   |
| `src/test/render.tsx`                                | crear                  | `renderWithProviders(ui, { session })` envolviendo `SessionProvider` y los repositorios in-memory               |
| `src/test/in-memory-repositories.ts`                 | crear                  | Adaptadores de `PostRepository` y `UserRepository` sobre los fixtures                                           |
| `src/__tests__/routes.smoke.test.tsx`                | modificar              | Hoy afirma que `/feed` muestra el heading `Feed`; pasa a montar la pantalla real                               |
| `docs/design/components.md`                          | **no tocar**           | Los componentes del feed viven en `wireframes_feed.md` §6                                                       |
| `docs/architecture/frontend-structure.md`            | **no tocar**           | Es inmutable. Los desvíos se registran en `progress.md`                                                        |
| `docs/architecture/progress.md`                       | al cerrar              | Registrar los desvíos de §9.3 y el avance de la implementación                                               |

### 9.2 Tests (TDD, colocated, umbral ≥ 80% del gate de Husky)

Primero la lógica pura, luego los componentes:

| Test | Qué cubre |
| --- | --- |
| `src/lib/filters.test.ts` | Los 7 valores por defecto incluido `researchArea`; `fromSearchParams` con parámetro ausente, repetido, inválido y con acentos; ida y vuelta `filters → params → filters` con `?area=`; `q` encuentra en título y en cuerpo; `#defensa` y `defensa` dan el mismo resultado; `categoria` y `tipo` inválidos degradan a `"todas"`/`"todos"` sin lanzar; orden DESC estable para fechas del mismo día; `countActiveFilters`; `isDateRangeValid` en los tres casos límite (igual, invertido, ausente) |
| `src/lib/keywords.test.ts` | ⚠︎ **Nuevo**: extracción de hashtags del cuerpo, normalización sin tildes, deduplicado, descarte de `#` sueltos y de 1 carácter, tope de 12, cuerpo sin hashtags devuelve `[]` |
| `src/lib/visibility.test.ts` | Las 9 combinaciones de §4.4; `borrador` de otro autor invisible para `admin`; autor visible en sus tres estados |
| `src/data/posts.test.ts` | Todo `authorId` existe en `users.ts`; todo `category`/`type`/`visibility` es del dominio; todo `researchArea` **pertenece a la categoría de su publicación**; ninguna combinación nueva es inválida (`investigacion` sin `investigacion` en la categoría); fechas ISO parseables y ordenables |
| `src/lib/repositories/post-repository.contract.test.ts` | El mismo conjunto de aserciones contra la implementación estática y contra la in-memory: mismos `total`, mismo orden, mismas incidencias |
| `src/components/feed/post-card.test.tsx` | Título como enlace a `/posts/[id]`; badge de **tipo** correcto; banda 16:9 solo con `imageUrl` y **sin hueco cuando es `null`**; línea `Categoría · Área` con etiquetas legibles; chips `#defensa` y `+{n}`; notas "Solo tú ves…" y "Oculta por un administrador…"; autor ausente degrada sin `undefined` |
| `src/components/feed/filter-bar.test.tsx` | Los **9** controles con su label; `<optgroup>` de `Categoría` y `Área`; `Área` **no** se acopla a `Categoría`; escribe en la URL con `replace` incluyendo `?area=`; debote de 300ms de la búsqueda con cleanup; selects sin debote; "Limpiar filtros" solo con filtros activos; "Filtros (2)"; `Estado` oculto cuando `showStatusFilter` es `false`; `hidden` y `aria-expanded` del panel |
| `src/components/feed/feed-view.test.tsx` | `visibleCount` vuelve a `POSTS_PAGE_SIZE` al cambiar `filters`; "Cargar más" incrementa el `limit` de la consulta; contador en singular y plural; los 4 `EmptyState`; `role="alert"` del rango inválido |
| `src/components/layout/navbar.test.tsx` | Enlaces de sección; `/admin` solo con rol `admin`; `aria-current="page"` en la sección activa; cerrar sesión |
| `src/components/layout/bottom-nav.test.tsx` | 4 destinos con `admin`, 3 sin él; `aria-current`; `md:hidden` en la clase |
| `src/lib/session/session-provider.test.tsx` | `loading` no renderiza `children`; `anonymous` redirige con `replace`; `authenticated` renderiza |
| `src/components/ui/badge.test.tsx`, `select-field.test.tsx`, `src/components/shared/empty-state.test.tsx` | Render y contrato de props |

`lib/` y `data/` deben llegar al **90%**: son lógica pura y baratos de cubrir
(`progress.md`, umbral §"Ajustar umbrales" pendiente). `feed-view.test.tsx` necesita
`vi.mock` del repositorio y de `next/navigation`.

### 9.3 Desvíos respecto de `frontend-structure.md` (para `progress.md`)

1. `PostRepository.findAll` → **`findVisible`**, con `limit`/`offset` y sesión (§4.5).
2. `src/components/shared/pagination.tsx` → **`src/components/feed/load-more.tsx`**: la paginación numerada se descartó (§10.4).
3. `src/components/feed/feed-view.tsx` es un archivo **nuevo** no previsto: el orquestador cliente del feed.
4. La **sesión se resuelve en cliente** porque `StaticAuthGateway` usa `localStorage` (§10.16).
5. Dos **valores de token** ajustados en modo claro (§8.2).
6. `wireframes_posts.md` **reescribe el modelo de `Post`** (§4.1) respecto a `wireframes.md`:
   `PostType` pasa de *formato* (`post`/`articulo`/`ensenanza`) a *naturaleza
   institucional* (`noticias`/`eventos`/`defensas`/`investigacion`/`convocatorias`),
   y `category` pasa de *naturaleza* a *rubro de clasificación*. Es un cambio de
   modelo, no de interfaz, y es la razón de que las filas marcadas con `⚠︎` en
   §9.1 apunten al documento nuevo.
7. `wireframes_posts.md` **añade `researchArea`** a `Post` y `?area=` a los
   filtros del feed (§4.3), más el parámetro derivado `research_area` que
   `PostFilters` ya serializa (§4.2).
8. `wireframes_posts.md` **cambia `imageUrl` de obligatorio a `string | null`**
   (§10.12) y añade la banda 16:9 en `PostCard`.
9. `wireframes_posts.md` **elimina los campos `keywords`/`tags`** del modelo y
   deriva las palabras clave del cuerpo con hashtags (§6.10). No hay columna en
   base de datos que mantener sincronizada.
10. El feed **gana un noveno control** (`Área`): el argumento de §10.7 que lo
    justificaba con "siete controles caben en una fila" dejó de ser cierto y se
    reescribió el apartado en vez de dejar el argumento viejo.
11. Se conservan los **nombres de los parámetros** `?categoria=` y `?tipo=` pese
    al cambio de semántica, para no invalidar enlaces ya compartidos; un enlace
    viejo degrada a "sin filtro" en lugar de romper (§4.3).

## 10. Decisiones de diseño y sus justificaciones

### 10.1 `facultad` no es un filtro, pero `Categoría` sí

`implementation_base.md` §Feed lo lista entre los filtros. Se descarta: la
plataforma es de **una sola facultad**, así que el filtro tendría siempre una
opción y devolvería los mismos resultados. Añadirlo sería una casilla que parece
filtrar y no filtra. Si la red crece a varias facultades, `facultad` deja de ser un
`select` y pasa a ser una entidad con clave foránea en `Post`, que es un cambio de
modelo, no de interfaz.

> [!IMPORTANT]
> Este apartado no cambió de postura, pero **el elemento que lo sobrevive sí**:
> `Categoría` pasó de ser la naturaleza institucional (`Noticias`, `Eventos`) a
> ser el **rubro de clasificación** (`Matemáticas`, `Biología`, `Computación`,
> `Desarrollo profesional`), que **sí varía por publicación** y por tanto sí es
> un filtro legítimo con columna e índice en `Post`. La razón por la que se
> descartó `facultad` —"una sola opción, no filtra nada"— no aplica ya a
> `Categoría`. El nombre del parámetro se conserva; su semántica no
> (`wireframes_posts.md` §10.1).

El esbozo de `/posts/[id]` (`wireframes.md` §3.2) muestra una línea "Facultad" en
el detalle: esa línea puede seguir ahí como rótulo institucional **estático**
("Facultad Experimental de Ciencias y Tecnología"), porque no varía ni filtra
nada. Lo que no existe es el campo `facultad` en `Post` ni su filtro.

### 10.2 El filtro "Estado" es condicional

Ver §5.2. Ofrecer un estado que el usuario jamás puede ver produce un vacío sin
explicación, que se lee como fallo. Se aplica el mismo criterio de
`wireframes_auth.md` §1.

### 10.3 El estado de los filtros vive en la URL

Elegido: **query params** (`?q=&categoria=&tipo=&area=&autor=&estado=&desde=&hasta=`).
`area` entra en la revisión de `wireframes_posts.md`: sin él no se puede filtrar
por área ni compartir un enlace que la fije.

- Un filtro en la URL es **compartible**: "mira estas defensas de marzo" es un
  enlace que se manda por correo o se pega en un chat.
- El botón "atrás" del navegador deshace el filtro, como espera cualquiera.
- Se traduce **1:1** a cláusulas `WHERE` con índices en `category`, `type`,
  `research_area` y `published_at` (`wireframes.md` §4), sin capa de traducción
  adicional.
- Se escribe con `router.replace`, no con `push`: filtrar no es navegar a una
  página nueva, y con `push` el historial se llenaría de entradas idénticas.
- La página recibe los filtros ya parseados por props, así que **no** hace falta
  `useSearchParams` y por tanto ningún `Suspense` alrededor de la pantalla.

Descartado: estado local de React. Es más simple de escribir y perecioso de
compartir, de recargar y de probar con el botón atrás.

> [!IMPORTANT]
> `categoria` y `tipo` **conservan el nombre y cambian de significado**: antes
> `categoria` era la naturaleza (`noticias`) y `type` el formato (`post`); ahora
> `tipo` es la naturaleza y `categoria` el rubro de clasificación. Un enlace
> guardado con la semántica vieja degrada a "sin filtro" en vez de romper (§4.3).
> No es motivo para renombrar los parámetros: se costuma compartir más un enlace
> viejo que no funciona del todo que un enlace renombrado que hay que reenviar.

**`Categoría` y `Área` no se acoplan en el filtro, pero sí en el formulario.** Es
la asimetría más importante de esta pantalla:

| Contexto | Comportamiento | Razón |
| --- | --- | --- |
| Filtro del feed | Independientes: se pueden combinar `?categoria=matematicas&area=probabilidad` | En una lista que ya está filtrada, cualquiera de las dos dimensiones puede pinsar por separado, y obligar a elegir la otra primero esconde combinaciones válidas |
| Formulario de publicación | `Área` se habilita solo tras elegir `Categoría` y se puebla con las áreas de ese rubro | Al **crear**, las 39 áreas en un desplegable son ruido y es fácil guardar un área que no pertenece a la categoría; el orden elimina el error en origen |

Escribirlo al revés no funciona: si el filtro acoplara, no se podría buscar "solo
probabilidad" sin fijar antes la disciplina, que es exactamente lo que se quiere
poder hacer.

### 10.4 "Cargar más" en vez de paginación numerada

- El volumen de una facultad es moderado (decenas, no miles). "Cargar más"
  evita la sensación deScroll infinito **manteniendo el scroll donde estaba**, que
  es lo que más molesta al paginar.
- Encaja con el modelo de datos estático: el total se conoce de una vez, así que
  el contador puede decir "Mostrando 6 de 24".
- Deja fuera un problema que la paginación numerada sí trae: páginas que se
  vacían cuando una publicación cambia de fecha.

Coste: **descarta el enlace profundo** a "la página 3". Para un feed de noticias
institucionales no compensa. Se implementa como `load-more.tsx`, no como el
`pagination.tsx` que preveía `frontend-structure.md` §2 (desvío §9.3.2).

### 10.5 Sin menú de acciones en la tarjeta

`wireframes.md` §3.1 dibujaba un `⋯` en la tarjeta. Se quita: en fase estática no
hay backend donde ejecutar editar, eliminar ni ocultar, así que el menú sería un
botón que no hace nada. Las acciones por rol viven en `/posts/[id]`, que es donde
`implementation_base.md` §Publicaciones sitúa la edición. Cuando llegue el backend,
el `⋯` cabe en la tarjeta sin tocar el resto del diseño.

### 10.6 El enlace es el título, sin "Leer más"

- Un `Leer más` por tarjeta añade un enlace cuyo texto no dice a dónde lleva; el
  lector de pantalla recibiría una lista de "Leer más" idénticos. Con el
  enlace estirado, el texto del enlace **es** el título y la lista de enlaces de
  la página es una lista de títulos de publicaciones.
- Un enlace por tarjeta (no tres: título, categoría, autor) mantiene la
  navegación por teclado predecible y hace que `Tab` recorra las publicaciones en
  orden de lectura.
- La zona clicable completa se compensa con dos señales de estado: el borde
  cambia a `--primary` en `:hover` **y** en `:focus-within`, y el título pasa a
  `--accent-teal` al recibir foco.

### 10.7 Sin sidebar de filtros, ni en escritorio

`wireframes.md` §5 contempla "sidebar opcional" a partir de 1024px. Se descarta:
ocho filtros en una columna lateral robaría el ancho que la columna de tarjetas
usa, y obligaría a duplicar la lógica del panel móvil en un segundo componente.
Con una rejilla de controles, la misma lista funciona en los tres breakpoints y
solo se pliega en móvil.

> [!WARNING]
> Este argumento **ya no cierra** tal como estaba escrito. Cuando se decidió el
> sidebar se justificaba con "siete controles en una fila de escritorio caben sin
> comprimir los targets"; `Área` sube el recuento a ocho, y con el buscador a ancho
> completo y dos fechas, una sola fila se pasa del límite de `1280px`. La
> conclusión sigue siendo la misma —nada de sidebar— pero la **razón cambia**: ya
> no es que la fila quepa sin tocar, sino que la rejilla de 3 columnas reparte
> mejor el ancho y mantiene `min-h-11` en todos los controles. Si al renderizar se
> desborda, el plan B declarado está en §6.3, no en volver al sidebar.

### 10.8 `<select>` nativos, no listbox propio

Con seis rubros, cinco naturalezas, tres estados, tres autores y hasta 39 áreas,
un listbox propio significa implementar `role="listbox"`,
`aria-activedescendant`, navegación por flechas, `Home`/`End`, `Escape` y anuncio
del valor seleccionado. El nativo ya lo cumple, es mejor en móvil (selector del
sistema, suena cada opción con `aria-label`) y no depende de JS para abrirse. Se
paga con algo de libertad estética; el diseño lo resuelve con borde
`--text-muted` y alto de 44px.

> [!NOTE]
> El argumento original ("seis opciones no justifican un listbox propio") era
> débil y ya no aplica: con **39 áreas**, un `<select>` nativo se recorre con
> teclado sin problema, y un listbox propio que las recorriera mal sería un
> retroceso de accesibilidad, no una mejora. Los `<optgroup>` de §5.3 acotan la
> lista a seis grupos legibles sin reimplementar nada. Los valores siguen siendo
> claves de dominio en minúsculas sin acentos.

### 10.9 La búsqueda ignora mayúsculas y acentos

`normalizeSearchText` aplica `trim`, `toLowerCase` y quita diacríticos con
`NFD` + `/[\u0300-\u036f]/g`. Quien escribe "defensas" tiene que encontrar
"Defensas" y también "DEFENSAS"; quien escribe sin tilde "ingles" debería
encontrar "inglés". En una gaceta institucional los textos tienen mayúscula
inicial en cada palabra, así que el problema no es hipotético. Es una función
 pura de 4 líneas, con su propio test.

### 10.10 Dos tokens ajustados, ninguno nuevo

Ver §8.2. `--success` y `--warning` estaban definidos y sin usar; su primer
consumidor revela que fallan por dos centésimas sobre el fondo real del badge. Se
oscurecen conservando el tono en vez de buscar otro color o de subir el peso de
la fuente: subir el peso no arregla un ratio, y buscar otro color rompería la
paleta cerrada de `brief.md` §3.

### 10.11 El shell `(main)` va en este documento

`Navbar` y `BottomNav` no son adorno: son la mitad de lo que hace utilizable un
feed. Definirlos aquí evita que `/profile` y `/admin` los definan cada uno por su
cuenta y que acabemos con dos navegaciones distintas. Cuando se especifique
`/profile` solo habrá que aportar sus contenidos, no re-litigar la navegación.

### 10.12 La imagen entra, pero sin marcador de posición

> [!IMPORTANT]
> Este apartado **cambia de postura** respecto a la primera versión del
> documento, que declaraba la imagen fuera de alcance. La decisión ahora es la
> inversa: la imagen sí se renderiza. Lo que **no** cambia es el tratamiento del
> `null`.

`implementation_base.md` §Publicaciones pide imagen en la publicación, y
`wireframes.md` §3.2 anticipaba "Imagen: (bloqueo hasta backend)". Ese bloqueo
ya no aplica: el formulario de creación y edición acepta la URL de la imagen
como campo opcional (`wireframes_posts.md` §5.8), de modo que `imageUrl` puede
ser `null` **o** tener valor desde el primer día.

Lo que se mantiene sin cambios es lo importante: la tarjeta **no reserva hueco**
ni muestra un rectángulo gris cuando `imageUrl` es `null`. Un marcador de
posición es contenido falso que el lector de pantalla anuncia y que no aporta
nada. Con imagen, la banda va **encima de los badges**, en 16:9, con `alt`
vacío porque es decorativa y el título ya nombra la publicación
(`wireframes_posts.md` §10.11).

> [!WARNING]
> `imageUrl` era obligatorio en el modelo original y ahora es
> `string | null`. Cualquier código que asuma `post.imageUrl.length` o que lo
> concatene sin comprobar `null` romperá. Hay que buscar los tres usos
> planificados —tarjeta, detalle y formulario— y ninguno puede asumir que
> existe.

### 10.13 Un solo orden: fecha descendente

Solo `publishedAt` DESC. Ordenar por relevancia es imposible sin un índice de
búsqueda, y el orden por título o por autor es un gusto personal que no responde
a "lo último de la facultad". Es además el orden que exige el MVP. Si algún día
hace falta, un `<select>` de orden se añade junto a los filtros sin tocar la
tarjeta.

### 10.14 Un rango incoherente es un error visible, no un vacío

`dateFrom > dateTo` muestra un `role="alert"` con el mensaje exacto y **no**
muestra tarjetas. La alternativa —devolver cero resultados— produce una pantalla
vacía que parece un fallo de datos. El error también lleva los dos campos a
`aria-invalid`, y el copy nombra el rango cuando no hay resultados pero el rango sí
es válido.

### 10.15 Sin esqueleto de carga

La página es un Server Component y el repositorio estático resuelve de inmediato:
el primer pintado ya trae las tarjetas. Un esqueleto de carga solo se vería en un
`useEffect` de un frame, y durante ese frame el `aria-busy` y un contador en cero
molestarían más que no pintar nada. Cuando el repositorio sea remoto, el esqueleto
entra en `FeedView` en el mismo hueco donde hoy se decide no renderizar nada.

### 10.16 El feed se renderiza en cliente, y es temporal

`StaticAuthGateway` guarda la sesión en `localStorage`, así que la regla de
visibilidad **no se puede evaluar en el servidor**. De ahí que `FeedView` sea un
componente cliente que consulta el repositorio y filtra en el navegador.

Es una limitación de la fase estática, no un patrón: con backend la sesión llega
por cookie, la vista vuelve a ser Server Component, `filters.ts` y
`visibility.ts` se ejecutan en el servidor **sin cambiar una línea**, y
`findVisible` se convierte en la consulta real. La separación de §4 es exactamente
la que hace posible ese cambio: si el filtrado estuviera dentro del componente,
el día del backend habría que reescribirlo.

### 10.17 El contador se anuncia, el buscador no

El resultado de filtrar cambia sin que cambie el foco, así que el contador lleva
`role="status"` y es la única región `aria-live` de la pantalla. El buscador no
anuncia nada: el contador ya dice cuántas publicaciones hay, y duplicar el
anuncio en cada tecla convertiría la búsqueda en un ruido intermitente.