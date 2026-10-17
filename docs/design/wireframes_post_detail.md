# Vista de detalle `/posts/[id]` — Red FaCyT
> **Pivot 2026-10-17**: esta pantalla fue **eliminada** con el dominio anterior (commit `9989b02`); el documento se conserva como referencia histórica. El nuevo dominio tendrá sus propios wireframes (Fase 2, `docs/pivot-project.md` §5).

> [!NOTE]
> Documento de fase de diseño. Fecha: 2026-10-04.
> Complementa a [`wireframes_posts.md`](wireframes_posts.md), que especifica los
> diálogos de `/posts/new`, `/posts/[id]/edit` y `/posts/[id]/delete` y **delega
> explícitamente el cuerpo del detalle** (§6.7 de ese documento: *"el resto del
> cuerpo no se especifica aquí"*). Este documento llena ese hueco.

---

## 1. Propósito y alcance

### 1.1 Qué especifica este documento

La página `/posts/[id]`: su cabecera, su imagen, su cuerpo, sus estados y sus
acciones por rol. Es la página de lectura de la plataforma.

### 1.2 Qué se especifica en otro sitio y no se repite aquí

| Tema                                             | Documento                          |
| ------------------------------------------------ | ---------------------------------- |
| Diálogos de crear / editar / borrar              | `wireframes_posts.md` §3, §5.1–§5.5 |
| Copy de los botones de acción del detalle        | `wireframes_posts.md` §5.6         |
| Contrato `Post`, `ResearchArea`, `PostFormValues` | `wireframes_posts.md` §4           |
| Contrato del repositorio                        | `wireframes_posts.md` §4.5         |
| Patrón de diálogo, foco atrapado, scroll lock    | `wireframes_posts.md` §7           |
| Regla de visibilidad                             | `wireframes_feed.md` §4.4          |
| Etiquetas y taxonomía de la tarjeta             | `wireframes_feed.md` §6.4          |
| Copy de los estados de envío                     | `wireframes_posts.md` §5.4         |

Cuando este documento y otro parezcan discrepar, **manda
`wireframes_feed.md` §4.1–§4.3** para el contrato de datos y
`wireframes_posts.md` §5.6 para el copy de los botones.

### 1.3 Lo que este documento cambia respecto de lo ya escrito

| Cambio                                                        | Motivo                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `post-detail.tsx` **deja de ser Server Component**             | §2.3: la sesión solo existe en el navegador y §5.6 depende del rol   |
| Se define el cuerpo, que `wireframes_posts.md` §6.7 dejó abierto | Era un hueco explícito                                               |
| Se exige `src/lib/taxonomy.ts`                                 | §2.5: la taxonomía ya está escrita en cuatro sitios distintos        |
| `Ocultar` / `Mostrar` se especifica como formulario, no diálogo  | §4.9: es reversible, no necesita confirmación                       |

---

## 2. Contratos y arquitectura de datos

### 2.1 El repositorio no cambia

`PostRepository` (`src/lib/repositories/post-repository.ts`) **no necesita un solo
cambio**. El detalle usa lo que ya existe:

```ts
findById(id: string): Promise<Post | null>;
```

`findById` devuelve la publicación **sin filtrar por visibilidad** (§4.5). Quien
decide si se muestra es el guard de §2.3, no el repositorio. Mantenerlo así evita
un segundo método que solo usaría esta página.

### 2.2 El autor se resuelve con `listAuthors()`

`UserRepository` solo expone `listAuthors(): Promise<AuthorOption[]>`. No hay un
`findAuthorById`, y **no se añade**: con cinco usuarios en la fase estática, una
búsqueda lineal sobre la lista ya está resuelta y un método más sería una
interfaz que nadie necesita todavía.

```ts
const author = (await userRepo.listAuthors()).find(a => a.id === post.authorId) ?? null;
```

Cuando no hay autor (`null`, referencia rota en los datos) el detalle degrada a
la fecha y el enlace al perfil desaparece, en vez de imprimir `undefined`
(criterio ya fijado en `wireframes_feed.md` §6.4).

### 2.3 La sesión solo existe en el navegador

> [!IMPORTANT]
> **Esta es la restricción que dicta la arquitectura de la página.**
>
> `StaticAuthGateway.getSession()` devuelve `null` cuando
> `typeof window === "undefined"` (`src/lib/auth/auth-gateway.static.ts:63`). La
> sesión vive en `localStorage` y la resuelve `SessionProvider`, que es `"use client"`.
>
> Consecuencia directa: **una Server Component no sabe quién mira.** Y §5.6 de
> `wireframes_posts.md` exige botones que dependen del rol.

Por eso `post-detail.tsx` **no puede ser un Server Component**, contra lo que dice
`wireframes_posts.md` §6.7. Se reparte así:

```
src/app/(main)/posts/[id]/page.tsx   → Server Component
                                         findById → si no existe, notFound()
                                         resuelve el autor
                                         pasa <post> y <author> a PostDetail

src/components/feed/post-detail.tsx  → "use client"
                                         lee useSession()
                                         aplica canViewPost
                                         y pinta la vista
```

Es el mismo reparto que ya usa el feed: `feed/page.tsx` es servidor y no sabe
nada de la sesión, y `FeedView` es el cliente que la consulta.

**Lo que sí se conserva del Server Component:** la búsqueda del post y el 404. La
página llama a `findById` en servidor, así que una URL con un id inexistente
devuelve un 404 de verdad y no una pantalla vacía.

### 2.4 El guard de visibilidad

```ts
const { status, session } = useSession();

if (status === "loading")  return <ArticleSkeleton />;
if (!session)              return <PostUnavailable />;
if (!canViewPost(post, session)) return <PostUnavailable />;
```

`SessionProvider` ya sustituye el shell entero por un `aria-busy` mientras
resuelve, así que `status === "loading"` **no llega a pintarse** en la práctica.
Se cubre igualmente, porque el componente debe ser correcto por sí mismo y no
porque hoy el padre lo tape.

`canViewPost` (`src/lib/visibility.ts`) se reutiliza tal cual. **No se
reimplementa la matriz de visibilidad aquí**: duplicarla sería crear una segunda
fuente de verdad para una regla que ya tiene 16 tests.

> [!WARNING]
> **Limitación conocida y asumida.** El cuerpo de la publicación viaja en el
> payload de RSC antes de que el guard decida. En esta fase la visibilidad se
> aplica en el cliente, igual que en el feed. Se corrige solo cuando la sesión
> pase a ser una cookie de servidor, y ese cambio toca `canViewPost` y no esta
> página. Está anotado en §10.9.

### 2.5 La taxonomía se extrae a un módulo único

> [!IMPORTANT]
> La taxonomía está escrita hoy **en cuatro sitios**, cada uno con su propia copia:
>
> | Sitio                                          | Qué contiene                                        |
> | ---------------------------------------------- | --------------------------------------------------- |
> | `src/components/feed/post-card.tsx:20-97`      | `CATEGORY_LABELS`, `TYPE_LABELS`, `AREA_LABELS`, `VISIBILITY_LABELS`, `VISIBILITY_NOTES` |
> | `src/components/forms/post-form.tsx:28`        | `RESEARCH_AREAS` (su propio formato)                 |
> | `src/lib/validation/post.ts:74`                | `AREAS_BY_CATEGORY` (basado en `Set`)                |
> | `src/lib/filters.ts:31`                        | `VALID_RESEARCH_AREAS`                              |
>
> Un quinto copia para el detalle es exactamente el tipo de drift que después
> rompe: se añade un área en el enum y una tarjeta muestra el slug mientras el
> formulario muestra la etiqueta.

`src/lib/taxonomy.ts` pasa a ser la **única fuente**:

```ts
export const CATEGORY_LABELS: Record<PostCategory, string>;
export const TYPE_LABELS: Record<PostType, string>;
export const AREA_LABELS: Record<ResearchArea, string>;
export const AREAS_BY_CATEGORY: Record<PostCategory, ResearchArea[]>;
export const VISIBILITY_LABELS: Record<PostVisibility, string | null>;
export const VISIBILITY_NOTES: Record<PostVisibility, string | null>;

/** "Computación · General" — la misma cadena en la tarjeta y en el detalle. */
export function taxonomyLabel(post: Post): string;
```

`AREAS_BY_CATEGORY` pasa a ser el origen de las otras dos: `VALID_RESEARCH_AREAS`
se deriva con `Object.values(...).flat()`, y el validador reutiliza el array en vez
del `Set`. Los tres archivos existentes **importan** de aquí; no se reescriben a
mano.

### 2.6 `extractKeywords` se mueve, no se reescribe

`wireframes_posts.md` §6.10 pide `src/lib/keywords.ts`. La función **ya existe**
en `src/lib/format.ts:68` y la usan la tarjeta y el formulario. Se **mueve** a
`src/lib/keywords.ts` tal cual, sin cambiar su comportamiento, para que el
detalle la importe del sitio que dice el documento.

> [!WARNING]
> La implementación actual **no cumple** el contrato de §6.10: su expresión es
> `#[a-zA-Z0-9_À-ſ]+`, que no exige frontera de palabra, no filtra por longitud
> mínima y no corta a 12. Consecuencias: `palabra#etiqueta` sí cuenta,
> `https://ejemplo.com#seccion` sí cuenta, y `#a` pasa.
>
> `wireframes_posts.md` §6.10 es la especificación correcta y se mantiene. El
> movimiento a `keywords.ts` **debe** ir acompañado de la corrección a la
> expresión `TAG` de §6.10, en el mismo cambio, o los tests de §9.2 fallarán.

---

## 3. Layout

### 3.1 Orden de las regiones

El orden es **idéntico en móvil y escritorio**. Cambiarlo según el ancho hace que
la vistaza con zoom alto no se parezca a la que ve quien no lo usa.

```
1.  Volver al feed
2.  Badges (tipo + visibilidad)
3.  Título                        ← h1
4.  Metadatos (autor · fecha · Facultad)
5.  Taxonomía (Categoría · Área)
6.  Separador
7.  Imagen principal              ← solo si imageUrl !== null
8.  Cuerpo                        ← texto plano
9.  Palabras clave                ← todas, sin truncar
10. Separador
11. Acciones                      ← según el rol
```

### 3.2 Móvil — 375px

```
┌──────────────────────────────────────┐
│ ← Volver al feed                     │
│                                      │
│ [Defensas] [Borrador]                │
│                                      │
│ Cartelera de defensas de grado de    │
│ marzo 2026                           │
│                                      │
│ Por María Rivas                      │
│ @m.rivas · 12 mar 2026               │
│ Facultad Experimental de Ciencias    │
│ y Tecnología                          │
│                                      │
│ Computación · General                │
│ ────────────────────────────────     │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │         imagen 16:9              │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ El cronograma de defensas de grado   │
│ para el mes de marzo de 2026 ya      │
│ está disponible. Los estudiantes que │
│ presenten sus proyectos deben         │
│ confirmar su asistencia con 48 horas │
│ de anticipación ante la coordinación │
│ de la facultad.                      │
│                                      │
│ 🏷 #cartelera #defensa               │
│ ────────────────────────────────     │
│ [ Editar ]   Eliminar                │
└──────────────────────────────────────┘
```

### 3.3 Escritorio — `md` (≥768px)

```
┌────────────────────────────────────────────────────────────┐
│ ← Volver al feed                                           │
│                                                            │
│ Cartelera de defensas de grado de marzo 2026               │
│                                                            │
│ Por María Rivas · @m.rivas · 12 mar 2026                   │
│ Facultad Experimental de Ciencias y Tecnología             │
│                                                            │
│ [Defensas]                                                 │
│ Computación · General                                      │
│ ──────────────────────────────────────────────────────     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │                                                      │   │
│ │                    imagen 16:9                       │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ El cronograma de defensas de grado para el mes de marzo    │
│ de 2026 ya está disponible. Los estudiantes que presenten   │
│ sus proyectos deben confirmar su asistencia con 48 horas    │
│ de anticipación ante la coordinación de la facultad.        │
│                                                            │
│ 🏷 #cartelera #defensa                                    │
│ ──────────────────────────────────────────────────────     │
│                                     [ Editar ]   Eliminar  │
└────────────────────────────────────────────────────────────┘
```

### 3.4 Medidas

| Región      | Móvil      | Escritorio                          |
| ----------- | ---------- | ----------------------------------- |
| Contenedor  | `px-4`     | `max-w-3xl mx-auto px-6`            |
| Título      | `text-h1`  | `text-h1` (no crece)                |
| Metadatos   | `text-sm`  | `text-sm`                           |
| Cuerpo      | `text-base leading-relaxed` | `text-lg leading-relaxed` |
| Ancho de medida del cuerpo | — | `max-w-[68ch]`           |
| Espaciado vertical entre regiones | `gap-6` | `gap-8`             |

> [!NOTE]
> El título **no cambia de tamaño** con el breakpoint. Un `h1` de lectura que se
> reduce en escritorio parece un error de maquetado; lo que se ensancha es el
> contenedor, no la letra.

---

## 4. Anatomía

### 4.1 Volver al feed

```tsx
<Link href="/feed" className="…">
  <ArrowLeftIcon />          {/* aria-hidden */}
  Volver al feed
</Link>
```

Es el **primer elemento enfocable** de la página, antes del `h1`. Quien navega con
teclado o lector de pantalla se salta la navegación del shell y sale de aquí sin
recorrer los cinco enlaces de la navbar.

Es un `Link` a `/feed`, **no** un `router.back()`. Un "volver" que depende del
historial es una trampa: en un enlace compartido por correo, o abierto en una
pestaña nueva, no hay a qué volver y el botón no hace nada. La etiqueta dice el
destino, no la dirección.

### 4.2 Badges

Fila de badges, `flex flex-wrap gap-2`:

| Badge       | Tono        | Cuándo                                        |
| ----------- | ----------- | --------------------------------------------- |
| Tipo        | `category`  | Siempre. Es el único badge de taxonomía (§4.5) |
| Visibilidad | `muted` / `warning` | Solo si `visibility !== "publicado"` |

El texto sale de `TYPE_LABELS` y `VISIBILITY_LABELS` de `taxonomy.ts` (§2.5). Sin
`+n`: aquí caben todos los valores.

### 4.3 Título

```tsx
<h1 id="titulo-publicacion" className="font-display text-h1 text-text …">
  {post.title}
</h1>
```

Un solo `h1` en la página. **No** se anida otro `main`: el `layout.tsx` de `(main)`
ya aporta el `<main id="contenido">`, y el placeholder de `/profile` se equivoca
al meter uno dentro (§10.6).

### 4.4 Metadatos

Tres párrafos en `text-sm text-text-muted`, en este orden:

```tsx
<p>
  Por{" "}
  <Link href={`/profile/${author.username}`} className="underline …">
    {author.fullName}
  </Link>
</p>
<p>
  @{author.username} ·{" "}
  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
</p>
<p>Facultad Experimental de Ciencias y Tecnología</p>
```

- El autor **enlaza a su perfil** cuando existe. `/profile/[username]` es un
  placeholder en esta fase (§10.7), pero es una ruta real y el enlace prepara el
  camino.
- Con `author === null` el primer párrafo y el segundo se fusionan y solo queda la
  fecha. Nunca `undefined`.
- `<time>` con `dateTime` en ISO 8601: es lo que permite a un lector de pantalla
  decir la fecha completa.
- **Facultad** es un texto fijo, no un campo de `Post`. `wireframes_feed.md` §10.1
  lo autoriza como rótulo institucional estático, y en un enlace compartido es
  lo que identifica de dónde viene el contenido.

### 4.5 Taxonomía

```tsx
<p className="text-sm text-text-muted">{taxonomyLabel(post)}</p>
```

Produce `Computación · General`. **Etiquetas legibles, nunca el slug**
(`wireframes_posts.md` §9.4: el slug no se muestra en crudo). Para el track se lee
`Desarrollo profesional · Liderazgo`.

### 4.6 Imagen principal

```tsx
{post.imageUrl && (
  <div className="w-full aspect-video overflow-hidden rounded-lg border border-border bg-surface-alt relative">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={post.imageUrl} alt="" className="object-cover w-full h-full" />
  </div>
)}
```

- `aspect-video` con `object-cover`, por §8.3.
- **`alt=""` a propósito**: la imagen es decorativa y el `h1` está justo debajo
  nombrando la publicación.
- Con `imageUrl === null` no hay banda **ni hueco de reserva** (§10.11). Un
  `div` vacío con altura fija es un rectángulo sin contenido, y multiplicado por
  doce en el feed es un mar de rectángulos.

> [!NOTE]
> Se usa `<img>`, no `next/image`, porque `next.config.ts` no declara
> `images.remotePatterns` y `imageUrl` es una URL externa libre: con `next/image`
> el servidor lanzaría en la primera publicación con imagen.
> `wireframes_posts.md` §6.8 pedía `<Image fill sizes>`; esta línea lo corrige
> para el detalle y para la tarjeta, que ya usa `<img>`.

### 4.7 Cuerpo

```ts
// Bloques separados por línea en blanco; dentro de un bloque los saltos de
// línea simple se conservan.
const blocks = post.content.split(/\n{2,}/).filter(b => b.trim().length > 0);
```

Un `<p>` por bloque. Los saltos simples se respetan con `whitespace-pre-wrap`.

- **Sin Markdown.** §10.12 de `wireframes_posts.md` lo decide así y no hay
  renderer en el proyecto. El texto se pinta literal: si alguien escribe `**negrita**`
  se ven los asteriscos. Es el comportamiento correcto para ahora y es reversible
  cuando llegue el renderer, porque `Post.content` ya guarda Markdown.
- **Sin `truncateText`.** Aquí el texto completo es el producto. Si un día el
  cuerpo llega truncado desde el repositorio, se trunca allí y no en la vista.
- Un solo bloque en los fixtures actuales; la regla del `split` existe para que
  grow sin que haya que tocar el componente.

### 4.8 Palabras clave

```tsx
<ul className="flex flex-wrap gap-2 list-none" aria-label="Palabras clave">
  <li aria-hidden="true"><TagIcon /></li>
  {keywords.map(kw => (
    <li key={kw}><Badge tone="neutral">{kw}</Badge></li>
  ))}
</ul>
```

- **Todas**, sin truncar. La tarjeta enseña 3 y `+n` porque compite por el espacio;
  aquí no hay tarjetas que compitan y el tope de 12 de §6.10 ya acota.
- `<ul>`/`<li>` de verdad: una lista de chips es una lista, y el lector de pantalla
  debe poder contarla.
- El `TagIcon` es decorativo y lleva `aria-hidden`; el nombre accesible lo da el
  `aria-label` de la lista.

### 4.9 Acciones

> [!NOTE]
> El copy literal de los tres botones es de `wireframes_posts.md` §5.6 y **no se
> repite aquí**. Lo que se define es el contenedor, la regla de aparición y el
> caso de visibilidad.

```tsx
<div role="group" aria-label="Acciones sobre la publicación" className="flex gap-3 justify-end">
```

- `role="group"` con nombre accesible: quien oye la lista de controles oye de
  qué son, sin necesidad de un encabezado visible que ocupe una línea para decir
  tres palabras.
- `justify-end` en escritorio, `justify-start` en móvil. A la derecha porque el
  orden visual y el orden de tabulación coinciden, y porque es donde cae la mano
  una vez leído el texto.
- **Al final del artículo**, no en la cabecera. Las acciones llegan después de
  leer, que es cuando se toman. En cabecera obligarían a decidir antes de saber de
  qué publicación se trata, y en móvil empujan el contenido fuera de la pantalla.

**Regla de aparición.** Una sola fila por persona:

| Condición                              | Fila                                          |
| -------------------------------------- | --------------------------------------------- |
| `session.user.id === post.authorId`    | `Editar` · `Eliminar`                         |
| si no, `role === "admin"`               | `Mostrar`/`Ocultar` · `Eliminar`              |
| en cualquier otro caso                  | ninguna                                       |

El admin que es el autor entra por la primera fila y **no** ve `Ocultar`: no tiene
sentido que esconda su propia publicación. Es la primera fila la que manda, no las
dos.

- `Editar` y `Eliminar` son `<Link>` a `/posts/{id}/edit` y `/posts/{id}/delete`
  (§6.7 de `wireframes_posts.md`): funcionan con teclado, con el botón atrás y al
  abrirlos en pestaña nueva.
- `Eliminar` es `ghost` con `text-danger`, nunca `danger`. Un botón rojo sólido
  junto a un enlace de texto rojo duplica la misma acción con dos pesos visuales, y
  la única acción destructiva de la fila no necesita más que la palabra en rojo.
- **`Ocultar`/`Mostrar` es un `<form>` con Server Action, no un diálogo.** La
  acción es reversible con un clic y no destructiva: un diálogo de confirmación
  para algo que se deshace con el botón de al lado es un obstáculo. La etiqueta
  sigue al estado: si está `publicado` ofrece `Ocultar`, si está `oculto` ofrece
  `Mostrar`.
- El resultado se anuncia en `role="status"` con `Publicación oculta.` o
  `Publicación visible.`, siguiendo §5.4.

---

## 5. Estados

| Estado                        | Qué se pinta                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| El post no existe             | `notFound()` desde el Server Component → 404 de Next. No hay pantalla propia.            |
| No hay sesión                 | `PostUnavailable`. No llega a pintarse: `SessionProvider` redirige antes (§2.3).           |
| La sesión no puede verlo      | `PostUnavailable`                                                                         |
| `borrador` propio             | Badge `Borrador` (tono `muted`) + `Solo tú ves esta publicación.`                          |
| `oculto`, autor o admin       | Badge `Oculto` (tono `warning`) + `Oculta por un administrador.`                            |
| `publicado`                   | Sin badge de visibilidad                                                                  |

`PostUnavailable` reutiliza `EmptyState` (`src/components/shared/empty-state.tsx`):

| Elemento | Copy                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------- |
| Título   | `No encontramos esta publicación`                                                                 |
| Cuerpo   | `Puede que se haya eliminado o que no tengas permiso para verla.`                                  |
| Acción   | `Volver al feed` → `/feed`                                                                          |

> [!IMPORTANT]
> "No existe" y "no tienes permiso" **son la misma pantalla**, con el mismo texto.
> Distinguirlas confirmaría a quien no debería saber que la publicación existe. El
> 404 de §5 para un id inexistente no filtra nada porque no hay nada que filtrar;
> la falta de permiso sí, y por eso comparte pantalla.

---

## 6. Copy

| Elemento             | Copy                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Volver               | `Volver al feed`                                                        |
| Prefijo de autor     | `Por ` + nombre completo                                                 |
| Facultad             | `Facultad Experimental de Ciencias y Tecnología`                        |
| Lista de keywords    | `aria-label="Palabras clave"`                                           |
| Grupo de acciones    | `aria-label="Acciones sobre la publicación"`                            |
| Aviso de borrador    | `Solo tú ves esta publicación.`                                         |
| Aviso de oculto      | `Oculta por un administrador.`                                           |
| Confirmación de ocultar | `Publicación oculta.`                                                |
| Confirmación de mostrar | `Publicación visible.`                                                |
| No disponible (título) | `No encontramos esta publicación`                                    |
| No disponible (cuerpo) | `Puede que se haya eliminado o que no tengas permiso para verla.`      |

> [!NOTE]
> El prefijo `Por ` va **fuera** del enlace, para que el nombre accesible del
> enlace sea el nombre de la persona y no `Por María Rivas`. El lector de pantalla
> oye `Por, enlace, María Rivas`.

---

## 7. Accesibilidad (WCAG 2.2 AA)

Transversal en [`accessibility.md`](accessibility.md). Lo específico de esta página:

### 7.1 Estructura de encabezados

Un único `h1`, que es el título de la publicación. No hay `h2` antes de él. Los
badges, los metadatos y la taxonomía **no son encabezados**: son texto que describe
el `h1` que ya está, y marcarlos como `h2` pondría en el esquema del documento
niveles que no estructuran nada.

### 7.2 Landmarks

Un solo `<main>`, el del `layout.tsx` de `(main)`. La página **no** añade otro
(§10.6). El contenido va en `<article aria-labelledby="titulo-publicacion">`, que
apunta al `h1`.

### 7.3 Foco y orden de tabulación

El orden es el orden visual, en una sola columna, así que no hay problema de
tabulación cruzado (§7.2 de `wireframes_posts.md`). Los tres enlaces o botones de
la fila de acciones son contiguos: quien llega desde `Editar` llega a `Eliminar`
sin pasar por el contenido.

### 7.4 Listas y metadatos

- Las keywords son una `<ul>`: se anuncian como lista y se pueden contar.
- La fecha es un `<time dateTime>`: el valor ISO es legible por máquina aunque el
  texto sea `12 mar 2026`.
- La fila de metadatos es texto, no una lista: son tres datos de una misma persona
  y fecha, y una lista de tres elementos invenciblemente dan la impresión de que
  son opciones.

### 7.5 Movimiento

Ninguno. Sin transiciones de entrada, sin `animate-*`. Una página de lectura que
se desliza hacia arriba es más lenta de leer que una que aparece.

### 7.6 Contraste

No hay token nuevo. Se reutilizan las filas ya verificadas de §8.2 de
`wireframes_posts.md` para `--danger` sobre `--surface`, y la fila de `--text-muted`
sobre `--surface` que `wireframes_feed.md` §8.2 ya midió.

> [!IMPORTANT]
> Igual que en §8.2, **verificar con herramienta antes de dar por bueno**. El
> detalle añade `--surface` como fondo de un bloque largo de texto, que es el peor
> caso para texto secundario: hay más superficie donde el contraste puede fallar
> del que había en una tarjeta.

---

## 8. Tokens

**Ninguno nuevo.** Los que intervienen, todos existentes:

| Token           | Uso en el detalle                                          |
| --------------- | ---------------------------------------------------------- |
| `--surface`     | Fondo del artículo                                          |
| `--surface-alt` | Fondo de la banda de imagen mientras carga                   |
| `--border`      | Borde del artículo y de la imagen                            |
| `--text`        | Título y cuerpo                                              |
| `--text-muted`  | Metadatos, taxonomía, separating                            |
| `--danger`      | Texto de `Eliminar`                                          |
| `--accent`      | Anillo de foco global (`globals.css`)                        |

El artículo es una superficie elevada, no un modal: **no lleva el acento ámbar**.
§8.4 reserva `--accent` a un elemento por diálogo, y esta página no es un diálogo.

---

## 9. Guía de archivos para el `developer`

### 9.1 Archivos

| Archivo                                          | Acción    | Responsabilidad                                                            |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------- |
| `src/lib/taxonomy.ts`                            | **crear** | Fuente única de etiquetas y áreas (§2.5)                                   |
| `src/lib/keywords.ts`                            | **crear** | `extractKeywords`, movida de `format.ts` y corregida a la `TAG` de §6.10    |
| `src/lib/format.ts`                              | modificar | Quita `extractKeywords`; conserva `formatDate` y `truncateText`            |
| `src/components/feed/post-card.tsx`              | modificar | Importa las etiquetas de `taxonomy.ts` en vez de las suyas                  |
| `src/components/forms/post-form.tsx`             | modificar | Importa `AREAS_BY_CATEGORY` en vez de `RESEARCH_AREAS`                     |
| `src/lib/validation/post.ts`                     | modificar | Importa `AREAS_BY_CATEGORY` en vez de su copia                             |
| `src/lib/filters.ts`                             | modificar | `VALID_RESEARCH_AREAS` se deriva de `AREAS_BY_CATEGORY`                     |
| `src/app/(main)/posts/[id]/page.tsx`             | **crear** | `findById` + `notFound()` + autor; pasa los datos a `PostDetail`            |
| `src/components/feed/post-detail.tsx`            | **crear** | **Cliente.** Guard de visibilidad + vista completa (§2.3)                  |
| `src/components/ui/post-actions.tsx`             | **crear** | Cliente. Fila de acciones por rol (§4.9)                                   |
| `src/components/ui/icons.tsx`                   | modificar | `ArrowLeftIcon` y `TagIcon`                                                |
| `src/app/(main)/@modal/posts/actions.ts`         | modificar | Añade `setVisibilityAction` (§4.9)                                          |
| `docs/design/wireframes_posts.md`                | modificar | §2.2 con interceptores; §6.7 remite aquí; §6.11 sin `ImageIcon`             |
| `docs/architecture/frontend-structure.md`        | **no tocar** | Es inmutable. Los desvíos van a `progress.md`                           |

### 9.2 Tests (colocated, TDD, umbral ≥ 80% del gate)

| Test                                    | Qué cubre                                                                                                                                                             |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/taxonomy.test.ts`              | Las 6 etiquetas de categoría, las 5 de tipo, las 39 de área sin vacíos; `taxonomyLabel` da `Computación · General` y `Desarrollo profesional · Liderazgo y Gestión de Equipos`; `AREAS_BY_CATEGORY` tiene `general` **primero** en los seis rubros; todas las áreas de un rubro pertenecen a ese rubro; los tres `TYPE_LABELS` legacy salen vacíos |
| `src/lib/keywords.test.ts`              | Lo de `wireframes_posts.md` §9.2 para `keywords.test.ts`: `#alfa`, dedup, `#a` demasiado corta, acentos y `ñ`, `-` y `_`, `palabra#etiqueta` **no** cuenta, `https://x.com#y` **no** cuenta, `#` a inicio de línea, tope de 12, orden preservado |
| `src/components/feed/post-detail.test.tsx` | Un solo `h1` con el título; `<article aria-labelledby>` apunta a ese `h1`; `<time dateTime>` con el ISO; `author === null` → solo la fecha y ningún `@undefined`; `taxonomyLabel` visible, sin slugs; banda 16:9 con `alt=""` si hay imagen y **sin hueco** si no hay; **todos** los keywords, sin `+n`; cuerpo partido en un `<p>` por bloque de línea en blanco y `**negrita**` literal; `Volver al feed` es `Link` a `/feed`; autor como `Link` a `/profile/{username}` y ausente sin autor; fila `role="group"` con nombre accesible |
| `src/components/feed/post-detail.test.tsx` (acciones) | `Editar` solo para el autor, `Eliminar` solo para el autor; los dos son `<a>` y **no** `<button>`; `Editar` apunta a `/posts/{id}/edit` y `Eliminar` a `/posts/{id}/delete`; admin sobre otro: `Ocultar` si está `publicado` y `Mostrar` si está `oculto`; admin que es autor **no** ve `Ocultar`; tercera persona sin acciones; `Eliminar` con `text-danger` y no `bg-danger` |
| `src/components/feed/post-detail.test.tsx` (estados) | `borrador` → badge `Borrador` + `Solo tú ves esta publicación.`; `oculto` → `Oculto` + `Oculta por un administrador.`; `publicado` → sin badge; `canViewPost === false` → `No encontramos esta publicación` y **el título no se pinta** |
| `src/components/ui/post-actions.test.tsx` | El `<form>` de visibilidad lleva la action; el `role="status"` anuncia `Publicación oculta.` tras resolver |
| `src/app/(main)/posts/[id]/page.test.tsx` | `findById` devuelve `null` → `notFound()`; devuelve post → `PostDetail` con post y autor resueltos |
| `src/__tests__/routes.smoke.test.tsx`   | **Añade `/posts/[id]`**, `/posts/new`, `/posts/[id]/edit` y `/posts/[id]/delete` (§10.2)                     |

`post-detail.test.tsx` necesita `vi.mock` de `next/navigation` y del
repositorio, igual que `feed-view`.

### 9.3 Desvíos respecto de `frontend-structure.md` (para `progress.md`)

1. `post-detail.tsx` es **cliente**, no servidor como dice su línea en
   `frontend-structure.md`. Motivo en §2.3. La tabla de rutas no lo declara, así que
   solo hay que registrar la desviación en la nota del archivo.
2. `src/lib/taxonomy.ts` es un módulo nuevo en `lib/` que la arquitectura no
   lista. Se registra como desviación.
3. `src/components/ui/post-actions.tsx` es un componente nuevo en `ui/`. `ui/` está
   declarado como "shadcn/ui primitivos" y esto es dominio. **Alternativa
   preferida:** ponerlo en `src/components/feed/post-actions.tsx`, que sí es capa de
   dominio. Se deja en `ui/` solo si se prefieren menos archivos; `feed/` es lo
   correcto.
4. El 404 real lo da `notFound()` de Next sin un `not-found.tsx` propio.

---

## 10. Decisiones de diseño y sus justificaciones

### 10.1 El detalle es cliente, y es una consecuencia, no una preferencia

`wireframes_posts.md` §6.7 dice que `post-detail.tsx` es un Server Component. No
puede serlo: la sesión está en `localStorage` (`auth-gateway.static.ts:63`) y §5.6
pide botones que dependen del rol. Un servidor que no sabe quién mira solo puede
pintar la vista entera o no pintar nada.

Se conserva la parte que sí es de servidor —leer el post, resolver el autor, dar el
404— porque esa no necesita la sesión. El reparto es el mismo que ya usa el feed,
así que no introduce un patrón nuevo en el proyecto.

### 10.2 El smoke test de rutas se amplía, y era un agujero

`src/__tests__/routes.smoke.test.tsx` probaba `/`, `/login`, `/register`, `/feed` y
`/profile`. **No probaba ninguna ruta de `/posts`.** Por eso 265 pruebas en verde
convivieron con cinco enlaces que dan 404: la suite no miraba donde estaba el
agujero.

Añadir `/posts/[id]` al smoke no es opcional. Es la prueba que habría detenido el
problema la primera vez.

### 10.3 El orden de las regiones no cambia con el breakpoint

Podría haberse movido la taxonomía arriba en escritorio, o los metadatos al pie.
No se hace: la vistaza con zoom al 200 % rompe el `md` y quien lee así vería un
orden que el diseño nunca describió. El orden es el mismo siempre; lo único que
cambia es el ancho disponible.

### 10.4 El título no crece en escritorio

`text-h1` en los dos. Una jerarquía que se estrecha al ensanchar la pantalla se lee
como contenido menos importante en un monitor, que es justo lo contrario de lo que
se quiere. Lo que crece es la medida del cuerpo, con `max-w-[68ch]`: más de 68
caracteres por línea y el ojo pierde el retorno.

### 10.5 Los keywords no se truncan

En la tarjeta se cortan a tres con `+n` porque hay cuatro o cinco tarjetas
compitiendo por la misma altura. Aquí no compite nadie y hay una regla de 12. La
misma lista mostrada de forma distinta en dos sitios hace que alguien se pregunte si
faltan palabras clave, y la respuesta sería que no.

### 10.6 Un solo `<main>` en la página

El `layout.tsx` de `(main)` ya aporta `<main id="contenido">`. El placeholder de
`/profile/[username]` mete un `<main>` dentro, lo que produce dos landmarks
principales anidados y rompe el punto de salto del `skip link`. El detalle **no**
replica ese error. Corregir el placeholder es trabajo de la tarjeta de perfil, no
de esta.

### 10.7 El autor enlaza a un perfil que es un placeholder

`/profile/[username]` existe y devuelve un placeholder. Enlazar a él es correcto: la
ruta es real, el destino se está construyendo (Trello, tarjeta de perfil), y un
enlace a la página de la persona que escribió lo que se está leyendo es lo que hace
una red académica. Lo que **no** se hace es ocultar el enlace hasta que el perfil
esté listo, porque entonces el nombre no sería clicable nunca.

### 10.8 `Ocultar` es un formulario, no un diálogo

`Eliminar` pide confirmación porque es irreversible (§10.5 de `wireframes_posts.md`).
`Ocultar` se deshace con el botón contiguo de la misma fila. Poner un diálogo para
eso pone una barrera donde no hay riesgo y enseña a la gente a confirmar sin
leer. Además, un `<form>` con Server Action funciona sin JavaScript.

### 10.9 Lo que este documento no arregla

El guard de §2.4 decide en el cliente, así que el cuerpo viaja en el payload de RSC
antes de decidir. En un sistema con datos reales esto sería una fuga de
información: un borrador es contenido privado y no debería estar en una respuesta
que se sirve a cualquiera que conozca el id.

Se acepta en la fase estática porque es exactamente como funciona ya el feed, y
porque arreglarlo requiere mover la sesión a una cookie de servidor, que es trabajo
de backend. **No se arregla con un `if` en el componente**, y este documento no
debe leerse como que sí.

### 10.10 La taxonomía en un módulo, no en cinco sitios

Ver §2.5. La razón no es elegancia: es que `PostCard` y `post-form` **ya** tienen
copias distintas, y las dos muestran la taxonomía. La próxima área nueva aparecerá
en el enum, en los tests y en dos de las tres copias, y una de las dos se olvidará.
El detalle es la cuarta oportunidad de hacerlo bien y la última barata.

---

## 11. Qué queda fuera de este documento

- La pantalla `/profile/[username]`, que tiene su propio diseño pendiente.
- La pantalla `/admin`, que tiene su propio diseño pendiente.
- El renderizado de Markdown, cuando haya backend y renderer (§4.7).
- El `not-found.tsx` propio del grupo `(main)`, hoy se usa el 404 por defecto.
- El menu de acciones `⋯` en la tarjeta, descartado en `wireframes_feed.md` §10.5.