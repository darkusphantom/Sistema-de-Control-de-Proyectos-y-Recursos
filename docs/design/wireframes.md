# Wireframes — Red FaCyT (Mapa de navegación y esquemas)

> **Pivot 2026-10-17**: mapa **parcialmente obsoleto**: las pantallas de `/feed`, publicaciones y bienvenida editorial fueron eliminadas (commit `9989b02`). El mapa objetivo del nuevo dominio está en `docs/pivot-project.md` §6 y sus wireframes se diseñan en la Fase 2.

Documento **maestro**: contiene el mapa de navegación, los esquemas de las
pantallas autenticadas de `(main)` y las decisiones transversales. Los wireframes
por área viven en archivos propios:

| Área                          | Archivo                                    | Especificación detallada |
| ----------------------------- | ------------------------------------------ | ----------------------- |
| Bienvenida `/`                | [`wireframes_welcome.md`](wireframes_welcome.md) | [`welcome.md`](welcome.md)   |
| Autenticación `/login`, `/register` | [`wireframes_auth.md`](wireframes_auth.md)   | [`auth.md`](auth.md)         |
| Feed `/feed`                  | [`wireframes_feed.md`](wireframes_feed.md) | [`wireframes_feed.md`](wireframes_feed.md) (documento único) |
| Publicaciones `/posts/*`      | [`wireframes_posts.md`](wireframes_posts.md) | [`wireframes_posts.md`](wireframes_posts.md) (documento único) |
| Detalle `/posts/[id]`         | [`wireframes_post_detail.md`](wireframes_post_detail.md) | [`wireframes_post_detail.md`](wireframes_post_detail.md) (documento único) |
| Perfil `/profile/[username]`  | [`wireframes_profile.md`](wireframes_profile.md) | [`wireframes_profile.md`](wireframes_profile.md) (documento único) |
| Admin `/admin`                | [`wireframes_admin.md`](wireframes_admin.md) | [`wireframes_admin.md`](wireframes_admin.md) (documento único) |

> [!NOTE]
> Los wireframes de la bienvenida se movieron a `wireframes_welcome.md` y los de
> autenticación a `wireframes_auth.md` cuando el documento empezó a crecer. El
> esquema del deslizante (móvil y escritorio) reemplaza al del scroll parallax
> vertical anterior.

## 1. Mapa de navegación

```
/                          (landing) Bienvenida   [público]
├── /login                 (auth)  Autenticación [público]
├── /register              (auth)  Registro      [público]
│                               └── tras éxito → /feed
├── /feed                  (main)  Dashboard/Feed   [autenticado]
│   ├── /posts/new                 Crear publicación
│   ├── /posts/[id]                Detalle completo
│   │   └── (acción) → /posts/[id]/edit
│   ├── /profile/[username]        Perfil + publicaciones del usuario
│   └── /admin                     Gestión de roles/permisos (solo admin)
```

Reglas de acceso (a implementar como guardas en la fase de backend; simuladas en
estático):

- `(landing)` y `(auth)`: público.
- `(main)`: requiere sesión; si no hay, redirige a `/login`.
- `/admin`: solo rol `admin`; si no, redirige a `/feed`.

### 1.1 Guardas de las pantallas de autenticación

Definido en [`auth.md`](auth.md):

- `/` envía a `/login` a los visitantes recurrentes (flag `facy:onboarding`).
- Con sesión activa, `/login` y `/register` redirigen a `/feed`, de modo que no
  hay ciclos de redirección: `/login` nunca devuelve a `/`.
- Tras autenticarse o registrarse, el destino es `/feed`.

## 2. Pantallas públicas

Las pantallas de `(landing)` y `(auth)` están especificadas en
`wireframes_welcome.md` y `wireframes_auth.md` respectivamente.

## 3. Pantallas autenticadas de `(main)`

### 3.1 `/feed` Dashboard — vista principal

Especificación completa en [`wireframes_feed.md`](wireframes_feed.md): shell
`(main)` con `Navbar` y `BottomNav`, wireframes móvil y escritorio, contratos de
datos (`Post`, `PostFilters`), inventario de filtros con copy, componentes
(`PostCard`, `FilterBar`, `LoadMore`, `EmptyState`), estados, accesibilidad,
tokens y guía de archivos para el `developer`.

> [!NOTE]
> Este documento §3.1 pasó a ser un puntero cuando el feed encontró su propio
> archivo, siguiendo el mismo criterio que se aplicó con la bienvenida y la
> autenticación. El shell `(main)` se especifica allí porque el feed es su primera
> pantalla.

**Regla de visibilidad aplicada aquí (estático):** se filtran las publicaciones
con `visibility = publicado`; se incluyen `borrador` y `oculto` si `author_id`
coincide con la sesión ficticia, y `oculto` también para el rol `admin`. La regla
completa, con su tabla de las nueve combinaciones, está en
[`wireframes_feed.md`](wireframes_feed.md) §4.4.

### 3.2 `/posts/new`, `/posts/[id]`, `/posts/[id]/edit` y `/posts/[id]/delete`

Especificación completa en [`wireframes_posts.md`](wireframes_posts.md) —diálogos
de crear, editar y borrar sobre rutas reales, contratos de `Post` y
`PostFormValues`, taxonomía de 6 rubros y 39 áreas, inventario y copy del
formulario, accesibilidad, tokens y guía de archivos— y, para el detalle, en
[`wireframes_post_detail.md`](wireframes_post_detail.md).

> [!NOTE]
> Este apartado pasó a ser un puntero por el mismo motivo que §3.1: el esbozo
> ASCII que había aquí quedó contradicho por los documentos de detalle y habría
> servido de guía al `developer` para construir lo equivocado.
>
> Lo que el esbozo tenía mal, para que no vuelva a colarse:
>
> | En el esbozo                                | Por qué ya no vale                                                                                     |
> | ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
> | `Visibilidad [● Público] [○ Borrador]`       | No hay campo de visibilidad. La llevan dos botones, `Publicar` y `Guardar borrador` (`wireframes_posts.md` §5.1.1, §10.7) |
> | `Imagen: (bloqueo hasta backend)`             | La imagen es opcional y **sí** se muestra, en la tarjeta y en el detalle (`wireframes_posts.md` §8.3, §10.12) |
> | `[Categoría] [Artículo] [Publicado]` en el detalle | El badge es **solo el de tipo**; categoría y área van como línea de texto (`wireframes_posts.md` §9.4) |
> | `[⋮]` en el detalle y en la tarjeta          | No hay menú de acciones: en la tarjeta porque no habría backend que ejecutar, y en el detalle porque las acciones viven ya en `/posts/[id]` (`wireframes_feed.md` §10.5) |
> | `Categoría` y `Tipo` en la misma fila del formulario | Son dimensiones distintas y su semántica de URL es distinta (`wireframes_posts.md` §10.2); además entra `Área`, y son 7 controles |
> | `Desglose → Portapapeles`                    | No hay campo de texto en el formulario; el contenido es un único campo de 30 a 4000 caracteres |
>
> **Edición** (`/posts/[id]/edit`): mismo formulario de 7 controles, con la fecha de
> publicación visible y **deshabilitada** (`wireframes_posts.md` §5.2, §10.8).
> El detalle vive en su propio documento porque es una página de lectura, no un
> diálogo.

### 3.3 `/profile/[username]`

Especificación completa en [`wireframes_profile.md`](wireframes_profile.md):
cabecera con avatar (foto o iniciales) y bio, edición **inline** de datos
personales (nombre, apellido, correo, bio), subida y retirada de foto de perfil
(PNG/JPG, máximo 5 MB), cambio de contraseña, y publicaciones del usuario en
cascada vertical con las mismas reglas de visibilidad.

> [!NOTE]
> Este apartado pasó a ser un puntero por el mismo motivo que §3.1 y §3.2: el
> esbozo ASCII que había aquí (con el correo del usuario a la vista en perfiles
> ajenos y las publicaciones en dos columnas) fue contradicho por el diseño
> final, que trata el correo como dato privado y prioriza la lectura vertical.
> Ver `wireframes_profile.md` §1.3 y §10.1–§10.2 para el detalle de los cambios.

### 3.4 `/admin` (solo rol admin)

Especificación completa en [`wireframes_admin.md`](wireframes_admin.md): gestión
de usuarios con asignación de rol, moderación de visibilidad de publicaciones
(`publicado ⇄ oculto`), bloqueo de auto-democión y del último admin,
accesibilidad, tokens y contrato de seguridad para el backend.

> [!NOTE]
> Este apartado pasó a ser un puntero por el mismo motivo que §3.1, §3.2 y §3.3:
> el esbozo ASCII que había aquí quedó corto ante la spec real. La pantalla se
> implementó el 2026-10-08 **sin** especificación previa (desvío registrado en
> [`progress.md`](../architecture/progress.md)); `wireframes_admin.md`
> (2026-10-09) formaliza y corrige ese diseño. Asignar roles es el único punto
> por el que un usuario pasa de `estudiante` a `profesor` o `admin`, porque el
> registro público no ofrece selector de rol ([`auth.md`](auth.md) §10.2).

## 4. Decisión del mecanismo de filtrado (justificación)

El enunciado pide justificar el mecanismo más adecuado para una red
**institucional** de facultad.

- **Elegido:** filtros de lista **combinables** sobre una **búsqueda por palabra
  clave**, más **orden por fecha DESC** por defecto.
- **Por qué:** en una facultad el volumen de publicaciones es moderado pero
  heterogéneo (eventos, avisos, defensas, talleres). Un usuario autenticado
  busca típicamente *"defensas esta semana"* o *"talleres de mi facultad"*, que
  exige combinar categoría, tipo y rango de fechas con palabras clave. Las
  pestañas únicas (solo por categoría) obligan a perder contexto.
- **Descartado:** filtro por estado visible en el feed público (solo útil para
  admin); búsqueda avanzada full-text (bonificación, fuera del MVP).
- **Relación con el backend futuro:** estos filtros se traducen a cláusulas
  `WHERE` con índices en `category`, `type` y `published_at`. En fase estática
  son funciones de filtrado sobre `src/data`, con análisis asintótico O(n) y
  `short-circuit` evaluable en los tests.

## 5. Navegación responsive

| Breakpoint     | Comportamiento                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| < 768px        | Navbar colapsada a logo + hamburguesa; `BottomNav` con 4 destinos (Feed, Crear, Perfil, Admin si aplica)                                              |
| 768–1024px     | Navbar completa, sin sidebar                                                                                                                           |
| ≥ 1024px       | Navbar y layout de 2–3 columnas en el feed, sidebar opcional                                                                                           |
| Login y registro | Tarjeta de 400px centrada en los tres breakpoints; sin cambios por ancho de pantalla (ver `wireframes_auth.md` §4)                                      |
