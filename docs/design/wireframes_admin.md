# Panel de administración `/admin` — Red FaCyT
> **Pivot 2026-10-17**: la identidad visual se rediseña en la Fase 2 (estilo Apple, `docs/pivot-project.md` §8); los tokens y el copy de este documento quedan **pendientes de rediseño**, mientras que estructura, estados y accesibilidad siguen vigentes.

> [!NOTE]
> Documento de **fase de diseño**. Fecha: 2026-10-09.
> **Formaliza y corrige** la vista `/admin`, que fue **implementada sin
> especificación previa** (desvío de pipeline registrado en
> `docs/architecture/progress.md`, registro 2026-10-09 y card Trello #13).
> Sustituye el esbozo mínimo de [`wireframes.md`](wireframes.md) §3.4, que pasa a
> puntero de este documento (mismo patrón que el feed con
> [`wireframes_feed.md`](wireframes_feed.md) y el perfil con
> [`wireframes_profile.md`](wireframes_profile.md)).
>
> **Revisión de seguridad realizada (2026-10-09).** La pantalla toca las joyas
> **P0 acceso** y **P0 publicaciones** ([`crown-jewels.md`](../security/crown-jewels.md)
> §2–§3); el `security-architect` revisó este documento. Veredicto: **aprueba con
> observaciones**. Quedan como **requisitos bloqueantes de backend** (§2.9) la
> inmutabilidad del rol `admin` (F-01), impedir publicar un `borrador` ajeno
> vía `PATCH visibility` (F-03) y la auditoría en logs (D5); deben resolverse al
> implementar. Los controles se derivan del modelo de amenaza
> ([`threat-model-api.md`](../security/threat-model-api.md) R16) y de las
> decisiones de producto del 2026-10-09 (§1.4, D1–D6).

---

## 1. Propósito y alcance

### 1.1 Qué especifica este documento

La página `/admin` (`src/app/(main)/admin/page.tsx`), única pantalla restringida
al rol **`admin`**. Cubre **dos secciones**, decididas en esta iteración (§1.4):

| Sección | Función | Estado hoy |
| ------- | ------- | ---------- |
| **Gestión de usuarios** | Listar usuarios y **asignar rol** (`estudiante` / `profesor` / `admin`) | Implementada (`admin-view.tsx`), sin spec |
| **Moderación de publicaciones** | Listar publicaciones y **alternar visibilidad** `publicado ⇄ oculto` | Implementada (`admin-view.tsx`), sin spec |

La asignación de rol es, además, el **único punto** por el que un usuario pasa de
`estudiante` a `profesor` o `admin`: el registro público no ofrece selector de
rol ([`auth.md`](auth.md) §10.2).

### 1.2 Qué se especifica en otro sitio y no se repite aquí

| Tema | Documento |
| ---- | --------- |
| Mapa de rutas y guardas de acceso | `frontend-structure.md` §3, `wireframes.md` §1 |
| Regla de visibilidad de publicaciones (`publicado`/`borrador`/`oculto`) | `wireframes_feed.md` §4.4, `packages/shared/src/domain/can-view-post.ts` |
| Contrato y diseño de `PostCard`, `Badge`, `SelectField`, `Field` | `wireframes_feed.md` §6, `components.md` |
| Patrones de formulario y de aviso (`Field`, `FormAlert`, envío) | `wireframes_auth.md` §4–§7 |
| Contrato `User` / `UserRole` y `Post` / `PostVisibility` | `packages/shared/src/types/user.ts`, `types/post.ts`, `taxonomy/post-visibility.ts` |
| Modelo de amenaza y requisitos R14/R16 | `docs/security/threat-model-api.md` |
| Joyas de la corona y su prioridad | `docs/security/crown-jewels.md` §2–§3 |
| Endpoints de admin ya implementados | `apps/api/src/routes/admin.routes.ts`, `docs/architecture/api-structure.md` §9.5–§9.6 |

Cuando este documento y otro parezcan discrepar, **manda el contrato de datos de
`@redfacyt/shared`** y la regla de visibilidad del feed.

### 1.3 Lo que este documento cambia respecto de lo ya escrito o implementado

| Cambio | Motivo |
| ------ | ------ |
| La tabla de moderación **deja de listar `borrador`**; solo lista `publicado` y `oculto` | Un borrador es material de trabajo privado: **el admin no ve borradores ajenos** (R15, `wireframes_feed.md` §4.4). Hoy `admin-view.tsx:31` lista **todos** `mockPosts`, borradores incluidos. |
| La acción de visibilidad es **binaria `publicado ⇄ oculto`**, no un selector de tres estados | El schema real es `AdminSetVisibilitySchema` = `enum(["publicado","oculto"])` (`packages/shared/src/schemas/post.ts:63`). `borrador` **no** es alcanzable desde admin. Hoy la UI insinúa tres estados en el badge (`admin-view.tsx:252-262`). |
| **Ningún `admin` puede cambiar de rol** (ni a sí mismo ni a otro) | Convierte en control lo que el modelo de amenaza asumía como riesgo (R16: *"Riesgo asumido (MVP): un admin puede cambiarse su propio rol (lock-out)"*). Decisión de producto 2026-10-09 (§1.4). Elimina de raíz el lock-out y la carrera por el "último admin", por lo que **no hace falta contar admins**. **Requiere actualizar R16** al implementar. |
| El **correo del usuario no se pinta** en la tabla | Minimización de PII (`crown-jewels.md` P1; R18 redacta correo ajeno). Hoy `admin-view.tsx:174` lo muestra. |
| Se **documenta el desvío** de que `admin-view.tsx` lee `mockUsers`/`mockPosts` directos, saltándose el patrón repositorio | Decisión 2026-10-09: se acepta la deuda por ahora y se define `AdminRepository` (§2.4) como requisito de la fase de integración con la API. |
| La guarda de acceso se especifica como **server-side** (con respaldo cliente en fase estática) | Hoy el guard es solo un `useEffect` cliente (`admin-view.tsx:37-41`), que no es autorización. El enforcement real es del servidor (R16). |
| `wireframes.md` §3.4 pasa a puntero | Este documento es la especificación de la pantalla. |

### 1.4 Decisiones confirmadas con el usuario (2026-10-09)

| # | Decisión |
| - | -------- |
| D1 | Alcance = **gestión de roles + moderación de publicaciones** (no se retira la moderación). |
| D2 | **Ningún `admin` puede cambiar de rol**: se bloquea toda salida de `admin`, tanto la propia (`admin → *`) como la de otro admin. El cliente deshabilita el control de esas filas; el servidor revalida. |
| D3 | **Sin correo** en la tabla (minimización de PII). |
| D4 | **Documentar y posponer** el refactor a `AdminRepository`; se aborda al integrar frontend ↔ API. |
| D5 | La **auditoría de cambios de rol persiste en los logs** (no en tabla propia por ahora), con campos definidos (§2.9). |
| D6 | El **alta/baja de administradores es operativa** (seed/ambiente), no de UI: con la regla D2 no hay vía en la pantalla para crear ni quitar el primer `admin`. |

---

## 2. Contratos y arquitectura de datos

### 2.1 Tipos existentes (sin cambios)

No se añaden tipos. Se consumen los de `@redfacyt/shared`:

```ts
// packages/shared/src/types/user.ts
export type UserRole = "estudiante" | "profesor" | "admin";

export type User = {
  id: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  createdAt: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

// packages/shared/src/taxonomy/post-visibility.ts
export type PostVisibility = "publicado" | "borrador" | "oculto";
```

### 2.2 Schemas Zod (ya existentes)

Los cuerpos de las dos mutaciones ya están definidos y **esta spec no los cambia**:

```ts
// packages/shared/src/schemas/auth.ts
/** Cuerpo de asignación de rol por admin. */
export const SetUserRoleSchema = z.object({
  role: z.enum(["estudiante", "profesor", "admin"] as const),
});

// packages/shared/src/schemas/post.ts
/** Moderación de visibilidad: única vía para `oculto`. */
export const AdminSetVisibilitySchema = z.object({
  visibility: z.enum(["publicado", "oculto"] as const),
});
```

> [!IMPORTANT]
> `AdminSetVisibilitySchema` **no admite `borrador`**. La moderación solo mueve una
> publicación entre visible e invisible al público; el estado de borrador es del
> autor y no se toca desde `/admin` (R15, `wireframes_feed.md` §4.4).

### 2.3 Endpoints del backend (ya implementados, a respetar sin rework)

El backend en memoria ya expone el contrato al que se conectará la pantalla:

| Método y ruta | Cuerpo | Respuesta | Middleware |
| ------------- | ------ | --------- | ---------- |
| `PATCH /api/v1/admin/users/:id/role` | `SetUserRoleSchema` | `204` (`404` id inexistente; `409`/`422` si la transición sale de `admin`, §2.9) | `requireSession` + `requireRole("admin")` + CSRF |
| `PATCH /api/v1/admin/posts/:id/visibility` | `AdminSetVisibilitySchema` | `200` con el `Post` actualizado (`404` id inexistente; `409`/`422` si está en `borrador`, §2.9) | `requireSession` + `requireRole("admin")` + CSRF |

Fuente: `apps/api/src/routes/admin.routes.ts`. La verificación de rol es **por
petición** (R14) y **en servidor** (R16); nunca se confía en el rol del cliente.

### 2.4 `AdminRepository` (contrato futuro — **pospuesto**, decisión D4)

**Desvío aceptado (documentado).** La implementación actual (`admin-view.tsx`)
importa `mockUsers`/`mockPosts` directamente (`admin-view.tsx:6-7`), saltándose el
**patrón repositorio** que exige `frontend-structure.md` §2, §6. Se acepta la
deuda por ahora y se registra en `progress.md`; el refactor se agenda con la
integración frontend ↔ API (card paraguas #27).

Cuando se aborde, el contrato hexagonal será:

```ts
// apps/web/src/lib/repositories/admin-repository.ts (a crear en fase de integración)
export interface AdminRepository {
  /** Lista todos los usuarios registrados (solo alcanzable por admin). */
  listUsers(): Promise<User[]>;
  /** Cambia el rol de un usuario. `null` si el id no existe. */
  setUserRole(id: string, role: UserRole): Promise<User | null>;
  /** Lista publicaciones moderables (`publicado` | `oculto`); nunca borradores ajenos. */
  listModerablePosts(): Promise<Post[]>;
  /** Modera la visibilidad. `null` si el id no existe. */
  setPostVisibility(id: string, visibility: "publicado" | "oculto"): Promise<Post | null>;
}
```

La implementación estática (`admin-repository.static.ts`) leería `src/data/` y la
futura leería la API, **sin cambiar el componente**.

### 2.5 Fuente de datos en la fase estática

- **Usuarios:** `mockUsers` (`apps/web/src/data/users.ts`, 5 usuarios: 1 admin,
  1 profesor, 3 estudiantes).
- **Publicaciones:** `mockPosts` (`apps/web/src/data/posts.ts`), **filtradas** a
  `publicado`/`oculto` para la tabla de moderación (§1.3). Los borradores no se
  listan.
- **Persistencia:** en memoria, igual que el resto de la fase estática. Los
  cambios se ven al instante en la app mientras dura la sesión y **no sobreviven
  a recargar la página** (no se usa `localStorage`; ver `wireframes_profile.md`
  §10.8). La persistencia real será la API.
- **`publishedAt`:** la moderación **no** lo toca; solo cambia `visibility`.

### 2.6 Guarda de acceso

| Capa | Fase estática (hoy) | Fase backend (futuro) |
| ---- | ------------------- | --------------------- |
| Autorización real | No existe enforcement real: la sesión vive en un `SessionProvider` **cliente** | `requireRole("admin")` en el servidor por petición (R16) |
| Guarda de UX | `useEffect` en cliente: `status === "authenticated" && role !== "admin"` → `router.replace("/feed")` | Server Component de la página resuelve la sesión de la cookie; sin rol → `redirect("/feed")` |
| Principio | **La guarda de cliente es UX, no seguridad** (idéntico a `wireframes_profile.md` §2.6) | El enforcement es del servidor; el cliente nunca es la autoridad |

En la fase estática se conserva la guarda de cliente (es lo único posible sin
cookie de servidor), pero se documenta explícitamente que **no** es autorización.
La Server Action / mutación **también** debe resolver el rol desde la sesión, no
desde el cliente.

### 2.7 Mutaciones

| Acción | Fase estática | Fase backend |
| ------ | ------------- | ------------ |
| Cambiar rol | Estado local en memoria (demo) | `PATCH /api/v1/admin/users/:id/role` con CSRF por doble envío |
| Moderar visibilidad | Estado local en memoria (demo) | `PATCH /api/v1/admin/posts/:id/visibility` con CSRF por doble envío |

### 2.8 Seguridad (security by design)

| Riesgo | Control (diseño) |
| ------ | ---------------- |
| Acceso de no-admin a `/admin` (escalada vertical) | Guarda de cliente para UX + **enforcement de servidor** por rol fresco (R14/R16). La presencia en la UI **no** autoriza. |
| **Cambio de rol de un `admin` (lock-out / escalada indebida)** | El control de rol de toda fila objetivo `admin` queda **deshabilitado** por completo; intentarlo (teclado o programático) no envía la mutación y muestra una advertencia (§3.4, §6). **Requisito de backend:** el endpoint **rechaza toda transición que salga de `admin`** en servidor (no basta el cliente). Al no permitirse ninguna democión de admin, **no se necesita contar admins** ni hay carrera por el "último admin". |
| IDOR sobre usuarios | La mutación opera sobre el `id` de la fila; el backend comprueba existencia (`404`) y autoriza por rol. No hay acceso a datos de terceros más allá de lo que la tabla pública. |
| Escalada de rol vía body | `SetUserRoleSchema` es el único canal; `role` no es aceptable desde ningún otro endpoint (R16). |
| CSRF en mutaciones | Hereda el doble envío ya implementado en la API (`facy.csrf_token`); ningún endpoint de esta pantalla queda exento. |
| Fuga de PII | El correo **no se pinta** (§1.3, decisión D3); la API ya redacta el correo ajeno (R18). |
| Falta de trazabilidad | **Requisito (backend):** registrar en **logs** quién cambió el rol de quién y cuándo (decisión D5), con los campos de §2.9 y **sin PII innecesaria** (sin correo; `crown-jewels.md` P2). |
| Borradores ajenos | La tabla de moderación **no** lista `borrador` (R15): el admin no lee material de trabajo privado. **Requisito de backend:** moderar la visibilidad no puede mover un borrador a `publicado` (F-03, §2.9). |

> [!IMPORTANT]
> `security-architect` **debe revisar este documento** (joya P0 acceso) antes de
> implementar. Los ítems marcados "Requisito de backend" se consolidan en §2.9.

### 2.9 Contrato de seguridad para el backend (checklist futuro)

> Este apartado **no bloquea** la fase estática (datos en memoria). Es el
> checklist que `developer`, `blue-team` y `red-team` deben exigir al conectar la
> pantalla con la API real.

| Ítem | Requisito |
| ---- | --------- |
| Inmutabilidad del rol `admin` | `PATCH /admin/users/:id/role` debe **rechazar** (p. ej. `409`/`422`) **cualquier transición que salga de `admin`** (tanto `admin → estudiante`/`profesor` como la auto-democión). Es una regla de autorización, no un conteo: **no se admiten demociones de admin**, así que no hace falta consultar cuántos admins quedan. El cliente solo anticipa la regla; el servidor la impone. Actualizar R16 (de "riesgo asumido" a control) en `threat-model-api.md`. |
| No publicar borradores ajenos | `PATCH /admin/posts/:id/visibility` debe **rechazar** la transición si la publicación está en `borrador`, aunque la lista de la UI no los muestre: el endpoint no puede ser una vía para publicar material privado ajeno (F-03). Devolver `409`/`422` sin exponer el contenido. |
| Auditoría de cambios de rol (en logs) | Emitir un registro estructurado por cada cambio de rol (**decisión D5: persiste en los logs**, no en tabla): `actorId`, `targetUserId`, `roleBefore`, `roleAfter`, `timestamp`, `requestId`. **Sin** correo ni IP; marcarlo como evento de seguridad para que no se redacte ni se muestre en logs de request ordinarios. |
| Confirmación de cambios | El backend no la necesita, pero el cliente exige un diálogo de confirmación (§3.4) para acciones sensibles; no es control de seguridad, es prevención de error. |
| CSRF | Ya cubierto por el middleware de la API. |
| Rate limit | Reutilizar el rate limit existente para mutaciones de admin (evita ráfagas de cambios de rol). |
| 404 sin enumeración | `id` inexistente → `404` genérico (sin distinguir "no existe" de "sin permiso"). |
| Visibilidad del feed tras moderar | Tras cambiar `visibility`, la revalidación/referencia del feed debe reflejar el cambio (ya previsto por el endpoint que devuelve el `Post`). |

---

## 3. Wireframes

El orden de regiones es el **mismo en móvil y escritorio**; solo cambia el ancho
(criterio de `wireframes_post_detail.md` §10.3).

### 3.1 Móvil (`< 768px`)

Las tablas se colapsan a **tarjetas apiladas**; cada tarjeta concentra la acción.

```
┌──────────────────────────────────────────┐
│ 🛡  Panel de Administración                │
│    Roles y moderación                     │
├──────────────────────────────────────────┤
│ Gestión de usuarios (5)                   │
│ [ Buscar por nombre o usuario…         ]  │
│ ┌──────────────────────────────────────┐  │
│ │ María Rivas  [profesor]               │  │
│ │ @m.rivas                              │  │
│ │ Cambiar rol: [ profesor        ▾ ]    │  │
│ └──────────────────────────────────────┘  │
│ ┌──────────────────────────────────────┐  │
│ │ Luis Rodríguez  [estudiante]          │  │
│ │ @l.rodriguez                          │  │
│ │ Cambiar rol: [ estudiante      ▾ ]    │  │
│ └──────────────────────────────────────┘  │
│ …                                          │
├──────────────────────────────────────────┤
│ Moderación de publicaciones (10)          │
│ ┌──────────────────────────────────────┐  │
│ │ Título de la publicación              │  │
│ │ Categoría · [publicado]               │  │
│ │                      [ Ocultar ]      │  │
│ └──────────────────────────────────────┘  │
│ ┌──────────────────────────────────────┐  │
│ │ Otra publicación                      │  │
│ │ Categoría · [oculto]                  │  │
│ │                      [ Mostrar ]      │  │
│ └──────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 3.2 Escritorio (`≥ 768px`)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 🛡  Panel de Administración                                              │
│    Gestión de usuarios, asignación de roles y moderación.   [aviso role] │
├────────────────────────────────────────────────────────────────────────┤
│ Gestión de usuarios (5)                    [ Buscar…                ]   │
│ ┌───────────────┬──────────────┬──────────────┬──────────────────────┐ │
│ │ Usuario       │ Rol actual   │ Registro     │ Cambiar rol          │ │
│ ├───────────────┼──────────────┼──────────────┼──────────────────────┤ │
│ │ María Rivas   │ [profesor]   │ 1 sep 2026   │ [ profesor     ▾ ]   │ │
│ │ @m.rivas      │              │              │                      │ │
│ │ Luis Rodríguez│ [estudiante] │ 2 sep 2026   │ [ estudiante   ▾ ]   │ │
│ │ @l.rodriguez  │              │              │                      │ │
│ └───────────────┴──────────────┴──────────────┴──────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Moderación de publicaciones (10)                                        │
│ ┌───────────────────────────────┬──────────────┬──────────┬───────────┐ │
│ │ Título                        │ Categoría    │ Estado   │ Acción    │ │
│ ├───────────────────────────────┼──────────────┼──────────┼───────────┤ │
│ │ Título de la publicación      │ Investigación│[publicado]│[Ocultar] │ │
│ │ Otra publicación              │ Eventos      │[oculto]  │[Mostrar] │ │
│ └───────────────────────────────┴──────────────┴──────────┴───────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- La columna **Correo no existe** (decisión D3).
- La tabla de usuarios muestra **nombre completo**, `@username`, **rol actual**
  (badge) y **fecha de registro**.
- La tabla de moderación muestra **título**, **categoría**, **estado** (badge) y
  un **botón único** que alterna `Ocultar`/`Mostrar`.
- En las filas cuyo usuario es `admin`, el selector **Cambiar rol** aparece
  deshabilitado con el texto `Los administradores no pueden cambiar de rol.`
  (regla D2).

### 3.3 Estados

| Estado | Comportamiento |
| ------ | -------------- |
| Cargando | Contenedor `aria-busy="true"` con `aria-label="Cargando panel de administración"` (patrón ya implementado) |
| No autorizado | `status === "authenticated" && role !== "admin"` → `router.replace("/feed")`; la vista no pinta datos |
| Sin usuarios / sin resultados de búsqueda | `EmptyState` con copy propio (§4.3) |
| Sin publicaciones moderables | `EmptyState` con copy propio (§4.3) |
| Éxito de cambio de rol | Aviso `role="status"`: `Rol de @usuario actualizado a "profesor".` |
| Éxito de moderación | Aviso `role="status"`: `"Título" ahora es oculto/publicado.` |
| Objetivo es `admin` | El `<select>` de la fila queda `disabled` (no solo la opción `admin`); intentarlo (por teclado o programático) muestra `FormAlert`: `Los administradores no pueden cambiar de rol.` y no envía la mutación. |
| Fallo simulado | `FormAlert` (`role="alert"`): `No pudimos guardar el cambio. Intenta de nuevo.` |

### 3.4 Diálogo de confirmación de cambio de rol

Cambiar el rol es una acción sensible, así que se confirma. El diálogo reutiliza
el patrón de diálogo ya definido en `wireframes_posts.md` §7 (foco atrapado,
`Escape` cierra, `role="dialog"` + `aria-modal="true"`, foco devuelto al
disparador).

```
┌──────────────────────────────────────────┐
│  Confirmar cambio de rol           [ ✕ ]  │
│                                           │
│  ¿Cambiar el rol de @l.rodriguez de       │
│  "estudiante" a "profesor"?               │
│                                           │
│           [ Cancelar ]  [ Confirmar ]     │
└──────────────────────────────────────────┘
```

- Para **ascender** a `profesor`/`admin` y para mover entre `estudiante` y
  `profesor`: confirmación normal.
- **Ningún cambio que salga de `admin` es posible** (regla D2). La fila de un
  `admin` tiene el selector `disabled` con el mensaje explicativo y el diálogo
  **no llega a abrirse**.
- Confirmar → se aplica la mutación y se muestra el aviso de éxito.
- La **moderación de visibilidad** usa el botón directo, sin diálogo (es
  reversible y de bajo riesgo).

---

## 4. Inventario y copy

### 4.1 Gestión de usuarios

| Elemento | Control | Atributos clave |
| -------- | ------- | --------------- |
| Nombre completo | texto | — |
| `@username` | texto | — |
| Rol actual | `Badge` | tonos según §8 |
| Registro | texto (`formatDate`) | `whitespace-nowrap` |
| Buscador | `Field` | `placeholder="Buscar por nombre o usuario…"`, filtra por nombre, apellido y `@username` (no por correo, que no se conoce) |
| Cambiar rol | `SelectField` | `aria-label` = `Cambiar rol de @usuario`; opciones `estudiante`/`profesor`/`admin`; **deshabilitado por completo** cuando el usuario objetivo es `admin` (regla D2) |

### 4.2 Moderación de publicaciones

| Elemento | Control | Atributos clave |
| -------- | ------- | --------------- |
| Título | texto | truncado en una línea |
| Categoría | texto | capitalizada |
| Estado | `Badge` | `publicado` / `oculto` (nunca `borrador`, §2.5) |
| Acción | `button` (`buttonStyles`, `size: "sm"`) | `Ocultar` si `publicado`; `Mostrar` si `oculto`; `aria-label` incluye el título |

### 4.3 Copy de estados y confirmaciones

| Momento | Copy | Canal |
| ------- | ---- | ----- |
| Rol actualizado | `Rol de @{username} actualizado a "{rol}".` | `role="status"` |
| Visibilidad moderada | `"{título}" ahora es {publicado\|oculto}.` | `role="status"` |
| Confirmar cambio de rol | `¿Cambiar el rol de @{username} de "{rol actual}" a "{rol nuevo}"?` | `role="dialog"` |
| Cambio de rol de un admin bloqueado | `Los administradores no pueden cambiar de rol.` | `FormAlert` |
| Fallo genérico | `No pudimos guardar el cambio. Intenta de nuevo.` | `FormAlert` |
| Sin usuarios | `Aún no hay usuarios registrados.` | `EmptyState` |
| Sin resultados de búsqueda | `Ningún usuario coincide con «{q}».` | `EmptyState` |
| Sin publicaciones moderables | `No hay publicaciones para moderar.` | `EmptyState` |

Todo el copy visible va en español; los identificadores, en inglés.

---

## 5. Componentes

### 5.1 Árbol

```
src/app/(main)/admin/page.tsx              ← Server Component (futuro guard server-side)
└── AdminView ("use client")                ← ya existe, se refactoriza
    ├── AdminHeader                          ← cabecera + aviso role="status"
    ├── AdminUsersSection                    ← crear
    │   ├── Field (buscador)
    │   ├── AdminUserRow × n                 ← crear (fila/tarjeta)
    │   │   ├── Badge (rol)
    │   │   └── SelectField (cambiar rol)
    │   ├── EmptyState
    │   └── ConfirmRoleDialog                ← crear (reutiliza patrón de diálogo)
    └── AdminPostsSection                    ← crear
        ├── AdminPostRow × n                 ← crear (fila/tarjeta)
        │   ├── Badge (estado)
        │   └── buttonStyles (Ocultar/Mostrar)
        └── EmptyState
```

### 5.2 Responsabilidades

| Componente | Tipo | Responsabilidad |
| ---------- | ---- | --------------- |
| `admin-view.tsx` | cliente | Orquesta sesión, datos y avisos; delega las secciones |
| `AdminUsersSection` | cliente | Búsqueda, lista, disparo del diálogo de rol |
| `AdminUserRow` | cliente | Fila (desktop) / tarjeta (móvil); deshabilita el selector cuando el objetivo es `admin` (regla D2) |
| `AdminPostsSection` | cliente | Lista de publicaciones moderables y toggler de visibilidad |
| `AdminPostRow` | cliente | Fila/tarjeta de moderación |
| `ConfirmRoleDialog` | cliente | Confirmación accesible; reutiliza el patrón de `wireframes_posts.md` §7 |
| `admin/page.tsx` | servidor (futuro) | Resuelve sesión por cookie; redirige a `/feed` si no es admin |

> **Nota de desvío:** `src/components/admin/` no figura en la estructura objetivo
> de `frontend-structure.md` §2 (que lista `ui/`, `layout/`, `feed/`, `forms/`,
> `shared/`). La carpeta ya existe desde 2026-10-08; se registra como desvío ya
> ocurrido, junto con `profile/`.

### 5.3 Reutilizados sin cambios

`Badge` (tonos de rol y visibilidad), `SelectField`, `Field`, `buttonStyles`,
`ShieldIcon`, `EmptyState`, `formatDate`.

### 5.4 Iconos nuevos (`src/components/ui/icons.tsx`)

| Icono | Uso |
| ----- | --- |
| `EyeIcon` | Acción `Mostrar` |
| `EyeOffIcon` | Acción `Ocultar` |
| `UserIcon` | Fila de usuario (opcional) |

Mismo trazado que los iconos existentes: SVG inline decorativo, con el texto del
botón nombrando la acción.

---

## 6. Estados

| Estado | Comportamiento |
| ------ | -------------- |
| Cargando sesión | `aria-busy="true"` con `aria-label` de carga; sin parpadeo de datos |
| No autorizado | Redirección a `/feed`; no se pinta contenido |
| Cambiando rol | Botón/confirmación deshabilitados y `aria-busy="true"` en el diálogo; sin spinner (criterio `auth.md` §10.7) |
| Moderando | Botón de la fila deshabilitado mientras aplica |
| Usuario objetivo es `admin` | Selector de rol `disabled` por completo + mensaje `Los administradores no pueden cambiar de rol.` (regla D2) |
| Éxito | Aviso `role="status"` (§4.3) |
| Fallo simulado | `FormAlert` (`role="alert"`) y el estado previo se conserva |
| Sin usuarios / sin resultados | `EmptyState` (§4.3) |
| Sin publicaciones moderables | `EmptyState` (§4.3) |

---

## 7. Accesibilidad (WCAG 2.2 AA)

1. **Tablas semánticas.** En escritorio, `<table>` con `<thead>`, `<th scope="col">`
   y `<caption>` visualmente oculto; en móvil, una lista de tarjetas por fila. No
   se comunican datos solo por color (SC 1.4.1).
2. **Etiquetas.** El buscador usa `Field` con label visible; el `SelectField` de
   rol lleva `aria-label` que incluye el usuario (`Cambiar rol de @usuario`).
3. **Avisos.** Cambios con `role="status"` (`aria-live="polite"`); errores con
   `FormAlert` `role="alert"` y foco automático.
4. **Diálogo.** `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; foco
   atrapado, `Escape` cierra y el foco vuelve al disparador (§3.4).
5. **Jerarquía.** Un solo `<h1>` ("Panel de Administración"); `h2` por sección
   ("Gestión de usuarios", "Moderación de publicaciones"). El `<main>` lo aporta el
   layout `(main)`; no se anida otro.
6. **Objetivos táctiles.** Botones y controles con `min-h-11` (44 px), medida del
   proyecto (`buttonStyles`).
7. **Bloqueo anunciado.** La opción deshabilitada se acompaña de texto
   explicativo, no solo de `disabled` (SC 3.3.1).
8. **Contraste.** Solo tokens semánticos (§8).
9. **Zoom y reflujo.** El orden de regiones no cambia con el breakpoint; la tabla
   pasa a tarjetas sin pérdida de contenido al 200 %.
10. **Movimiento reducido.** Sin animaciones propias; la regla global de
    `globals.css` las congela con `prefers-reduced-motion`.

---

## 8. Tokens y contraste

Sin tokens nuevos. Se usan exclusivamente los semánticos de `globals.css`:

| Elemento | Token |
| -------- | ----- |
| Fondo de tarjeta/tabla | `--surface` |
| Contenedores secundarios | `--surface-muted` |
| Bordes | `--border` |
| Texto secundario | `--text-muted` |
| Badge `admin` | tono `warning` |
| Badge `profesor` | tono `category` |
| Badge `estudiante` | tono `neutral` |
| Badge `publicado` | tono `category` |
| Badge `oculto` | tono `warning` |
| Errores | `--danger` |
| Anillo de foco | `--accent` (ámbar) |

---

## 9. Guía de archivos para el `developer`

### 9.1 Archivos

| Archivo | Acción | Responsabilidad |
| ------- | ------ | --------------- |
| `apps/web/src/app/(main)/admin/page.tsx` | modificar | Guarda server-side (fase backend); hoy monta `AdminView` |
| `apps/web/src/components/admin/admin-view.tsx` | modificar | Orquesta; excluir borradores de la moderación; sin correo; regla de inmutabilidad del rol `admin` |
| `apps/web/src/components/admin/admin-users-section.tsx` | **crear** | Búsqueda + lista de usuarios (§3) |
| `apps/web/src/components/admin/admin-users-section.test.tsx` | **crear** | Tests colocated |
| `apps/web/src/components/admin/admin-user-row.tsx` | **crear** | Fila/tarjeta de usuario + `SelectField` |
| `apps/web/src/components/admin/admin-posts-section.tsx` | **crear** | Lista de publicaciones moderables |
| `apps/web/src/components/admin/admin-posts-section.test.tsx` | **crear** | Tests colocated |
| `apps/web/src/components/admin/admin-post-row.tsx` | **crear** | Fila/tarjeta de moderación |
| `apps/web/src/components/admin/confirm-role-dialog.tsx` | **crear** | Confirmación accesible (§3.4) |
| `apps/web/src/components/admin/confirm-role-dialog.test.tsx` | **crear** | Tests colocated |
| `apps/web/src/components/admin/admin-view.test.tsx` | **crear** | Hoy **no existe** test de la vista; se crea |
| `apps/web/src/components/ui/icons.tsx` | modificar | `EyeIcon`, `EyeOffIcon`, `UserIcon` (§5.4) |
| `apps/web/src/lib/admin/moderation.ts` | **crear** | Lógica pura: filtro de moderables + regla de rol (`canChangeRole`: bloquea si el objetivo es `admin`) |
| `apps/web/src/lib/admin/moderation.test.ts` | **crear** | Tests colocated (TDD, primero) |
| `docs/design/wireframes.md` | modificar | §3.4 pasa a puntero (hecho en esta entrega) |
| `docs/architecture/frontend-structure.md` | **no tocar** | Inmutable; los desvíos van a `progress.md` |

> El refactor a `AdminRepository` (§2.4) **no** forma parte de esta entrega
> (decisión D4); se agenda con la integración frontend ↔ API.

### 9.2 Tests (colocated, TDD, umbral ≥ 80% del gate)

| Test | Qué cubre |
| ---- | --------- |
| `moderation.test.ts` | `listModerablePosts` excluye `borrador`; `canChangeRole` bloquea si el objetivo es `admin` (incluido uno mismo) y permite `estudiante↔profesor` y ascender a `profesor`/`admin` |
| `admin-user-row.test.tsx` | El selector queda `disabled` cuando el objetivo es `admin`; el `aria-label` incluye `@usuario`; el badge refleja el rol |
| `admin-posts-section.test.tsx` | Solo lista `publicado`/`oculto`; el botón alterna `Ocultar`/`Mostrar`; `aria-label` incluye el título |
| `confirm-role-dialog.test.tsx` | `role="dialog"` + `aria-modal`; `Escape` cierra y devuelve foco; cancelar no muta; confirmar muta |
| `admin-view.test.tsx` | **No-admin** redirige a `/feed` y no pinta datos; **admin** ve las dos secciones; **sin correo** en ninguna fila; éxito muestra `role="status"`; cambiar el rol de un `admin` no muta y muestra el error |

### 9.3 Desvíos respecto de `frontend-structure.md` (para `progress.md`)

1. `src/components/admin/` no está en la estructura objetivo (§5.2); ya existía
   desde 2026-10-08.
2. `src/lib/admin/` es una carpeta de lógica de dominio nueva; alternativa válida
   es colocar `moderation.ts` en `src/lib/` directamente. Elegir una y
   documentarla.
3. `admin-view.tsx` mantiene la lectura directa de `mockUsers`/`mockPosts`
   (deuda aceptada, §2.4).

---

## 10. Decisiones de diseño y sus justificaciones

### 10.1 La moderación es binaria `publicado ⇄ oculto`

El schema real (`AdminSetVisibilitySchema`) solo acepta `publicado` y `oculto`.
Diseñar un selector de tres estados sería construir una acción que el backend
rechaza. `borrador` es del autor; el admin modera **lo publicado**, no el trabajo
en curso (R15).

### 10.2 El admin no lista borradores ajenos

La tabla de moderación lista solo `publicado`/`oculto`. Un borrador es material
privado: mostrarlo al admin contradice la regla de visibilidad que el propio
modelo de amenaza fija (R15, `wireframes_feed.md` §4.4). Es una corrección del
comportamiento actual, que lista todos los `mockPosts`.

### 10.3 Sin correo en la tabla

El correo es PII. La tabla no lo necesita para asignar roles (nombre + `@username`
bastan). La API ya redacta el correo ajeno (R18); la vista, además, **no lo pinta**
para no depender de que la redacción no se rompa.

### 10.4 El rol `admin` es inmutable desde la aplicación

El modelo de amenaza asumía el lock-out como riesgo aceptado (R16). La decisión de
producto del 2026-10-09 lo convierte en control, con la regla más fuerte posible:
**ningún `admin` puede cambiar de rol**, ni a sí mismo ni a otro. El cliente
deshabilita el selector de esas filas y avisa; **el servidor debe revalidar**
(un cliente no es autorización). Consecuencias:

- Se elimina de raíz el lock-out y la **carrera por el "último admin"**: al no
  existir ninguna democión de admin, no hay que contar admins ni aplicar bloqueo
  atómico.
- El **alta/baja de administradores es operativa** (decisión D6): al no haber vía
  en la UI, la provisión del primer `admin` (y el retiro de un admin) se hace por
  seed/ambiente, no por la pantalla.

Requiere actualizar R16 (de "riesgo asumido" a control) en `threat-model-api.md`.

### 10.5 Guarda de acceso: UX en cliente, seguridad en servidor

En fase estática la sesión es un contexto cliente, así que la guarda es un
`useEffect`. Se documenta explícitamente que **no es autorización**: el enforcement
real es `requireRole("admin")` por petición en la API (R14/R16). Al llegar la
cookie de servidor, la página resuelve la sesión y redirige antes de renderizar.

### 10.6 Tres modos de implementación (requisito de `OBJECTIVE.md`)

| Decisión | Recomendada | Más segura | Más óptima |
| -------- | ----------- | ---------- | ---------- |
| Guarda de acceso | Servidor + respaldo cliente (defensa en profundidad) | Solo servidor con cookie `HttpOnly` | Server Component con `redirect` temprano (sin flash) |
| Estado de los datos | En memoria (mock) con revalidación, como el resto de la fase estática | Mutaciones con CSRF + revalidación de rol en cada action | Carga única + actualización optimista con rollback |
| Inmutabilidad del rol `admin` | Cliente (aviso) **y** servidor (imposición) | Servidor obligatorio + auditoría en logs (D5) | Rechazo por regla directa en el caso de uso, sin consultas extra |

La **recomendada** es la que adopta esta spec: guarda en dos capas, estado en
memoria coherente con el resto del prototipo e inmutabilidad del rol `admin`
impuesta en servidor con aviso en cliente.

### 10.7 Diálogo de confirmación para el cambio de rol, no para la moderación

Cambiar un rol es difícil de revertir mentalmente y afecta el acceso de una
persona; moderar visibilidad es reversible con un clic. Confirmar solo lo primero
evita "fatiga de diálogos" sin perder seguridad en la acción sensible.

---

## 11. Qué queda fuera de este documento

- **`AdminRepository` / patrón repositorio en `/admin`** — deuda aceptada y
  pospuesta a la integración frontend ↔ API (D4, §2.4).
- **Paginación y orden de las tablas** — el volumen de la fase estática es mínimo;
  se decidirá con backend si el padrón de usuarios crece.
- **Historial de auditoría visible** — la auditoría persiste en **logs** (decisión
  D5, §2.9), no en tabla ni en esta pantalla.
- **Alta/baja de administradores** — operativa (decisión D6, §10.4), sin UI.
- **Borrar usuarios o publicaciones** — fuera del MVP (`implementation_base.md`).
- **Editar datos de un usuario desde `/admin`** — fuera de alcance; los datos
  personales se editan en `/profile/[username]`.
- **La UI de login/registro, feed, publicaciones y perfil** — tienen sus propios
  documentos.
