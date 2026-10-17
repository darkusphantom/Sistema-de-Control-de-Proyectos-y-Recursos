# Vista de perfil `/profile/[username]` — Red FaCyT
> **Pivot 2026-10-17**: la identidad visual se rediseña en la Fase 2 (estilo Apple, `docs/pivot-project.md` §8); los tokens y el copy de este documento quedan **pendientes de rediseño**, mientras que estructura, estados y accesibilidad siguen vigentes.

> [!NOTE]
> Documento de fase de diseño. Fecha: 2026-10-08. Revisado por `security-architect` el 2026-10-08 (mejoras de seguridad aplicadas).
> Sustituye el esquema mínimo de [`wireframes.md`](wireframes.md) §3.3, que pasa a
> puntero de este documento (mismo patrón que siguió el feed con
> [`wireframes_feed.md`](wireframes_feed.md)). Amplía la vista de solo lectura
> ya implementada (`src/components/profile/user-profile-view.tsx`) con edición
> inline, foto de perfil y cambio de contraseña.

---

## 1. Propósito y alcance

### 1.1 Qué especifica este documento

La página `/profile/[username]`: cabecera del usuario, edición de datos personales
en la misma página (inline), subida y retirada de foto de perfil, cambio de
contraseña y el listado de publicaciones del usuario. Cubre dos personas y una
variante:

| Persona                       | Variante   | Alcance                                                                  |
| ----------------------------- | ---------- | ------------------------------------------------------------------------ |
|Perfil ajeno                  | solo lectura | Sin correo, sin botones de edición                                       |
|Perfil propio (`isOwnProfile`) | vista      | Cabecera + datos + botones `Editar perfil` / `Nueva publicación`         |
|Perfil propio                 | edición    | La cabecera se convierte en formulario; debajo, las secciones Seguridad y Publicaciones |

`/profile` (sin username) **no cambia**: sigue redirigiendo a
`/profile/{username}` de la sesión (`src/app/(main)/profile/page.tsx`).

### 1.2 Qué se especifica en otro sitio y no se repite aquí

| Tema                                                        | Documento                                            |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| Política de contraseña (8–128, sin composición, sin medidor) | `auth.md` §4.2, §10.5                                |
| Sin recuperación de contraseña                              | `auth.md` §10.4                                      |
| Regla de visibilidad de las publicaciones                    | `wireframes_feed.md` §4.4                            |
| Contrato y diseño de `PostCard`                              | `wireframes_feed.md` §6.4, §6.8                      |
| Patrones de formulario (`Field`, `FormAlert`, envío)         | `wireframes_auth.md` §4–§7, `wireframes_posts.md` §5  |
| Contrato `Post`, taxonomía                                   | `wireframes_posts.md` §4, `src/lib/taxonomy.ts`      |
| Joyas de la corona y prioridad de seguridad                  | `docs/security/crown-jewels.md` §2–§3                |
| Endpoint futuro de subida (`POST /api/v1/uploads`)            | `docs/architecture/api-structure.md` §Mapa endpoints |
| Anti-enumeración y redacción de correo (R18)                  | `docs/security/threat-model-api.md` R18              |

Cuando este documento y otro parezcan discrepar, **manda el contrato de datos de
§2** y la política de contraseña de `auth.md`.

### 1.3 Lo que este documento cambia respecto de lo ya escrito

| Cambio                                                                                  | Motivo                                                                                          |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| El correo **desaparece del perfil ajeno** (hoy se pinta para todo el mundo)             | Es PII privada. La API ya lo redacta (R18); la vista no lo pinta **nunca**, ni vacío (§10.1)  |
| Las publicaciones pasan de `grid md:grid-cols-2` a **cascada vertical** (`grid-cols-1`) | El perfil es una página de lectura, no un feed denso (§10.2)                                    |
| `User` gana `bio?: string \| null` y `avatarUrl?: string \| null`                         | El esquema §3.3 original ya prometía "Bio breve"; la foto es requisito nuevo                    |
| La cabecera del perfil propio se convierte en formulario inline                        | Requisito: modificar datos desde el perfil (§10.3)                                              |
| Nueva sección "Cambiar contraseña"                                                      | Requisito nuevo; toca la joya P0 credenciales → revisión obligatoria de `security-architect`   |
| `wireframes.md` §3.3 pasa a puntero                                                     | Este documento es la especificación de la pantalla                                              |

---

## 2. Contratos y arquitectura de datos

### 2.1 Extensión del contrato `User`

El tipo vive en `@redfacyt/shared` (única fuente de verdad desde la Ola 2 del
monorepo). Se amplía **sin romper** nada: los dos campos nuevos son opcionales y
con `null` como valor "sin datos", igual que `imageUrl` en `Post`.

```ts
// packages/shared/src/types/user.ts
export type User = {
  id: string;
  username: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  createdAt: string;
  /** Breve presentación personal, máx. 160 caracteres. `null` = sin bio. */
  bio?: string | null;
  /**
   * Foto de perfil. `null` = sin foto (se usan las iniciales).
   * Solo admite data URL validado (fase estática) o ruta relativa `/uploads/…`
   * (futuro). Nunca una URL absoluta externa (§2.9).
   */
  avatarUrl?: string | null;
};
```

Los mocks de `src/data/users.ts` **no necesitan cambiar**: un usuario sin
`bio`/`avatarUrl` es un usuario válido, y la vista degrada a iniciales y a "sin
bio" (§3.1). Los fixtures de test que quieran cubrir bio/foto los añaden los
tests con `makeUser()` (`src/test/factories.ts`).

### 2.2 Schemas Zod (`@redfacyt/shared`)

Nuevos esquemas, junto a los de `schemas/auth.ts`, re-exportados por
`schemas/user.ts`:

```ts
/** Bio: trim, 1–160. Vacío → se guarda `null`. */
export const bioSchema = z.string().trim().max(160);

/** Tope de imagen de perfil: 5 MB = 5 * 1024 * 1024 bytes. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/** Únicos formatos aceptados (requisito del producto; §10.6). */
export const AVATAR_MIME_TYPES = ["image/png", "image/jpeg"] as const;

/** Validación de archivo (cliente y, en el futuro, servidor). */
export const avatarFileSchema = z
  .custom<File>((file) => file instanceof File && file.size > 0, {
    message: "empty_file",
  })
  .refine((file) => (AVATAR_MIME_TYPES as readonly string[]).includes(file.type), {
    message: "invalid_type",
  })
  .refine((file) => file.size <= AVATAR_MAX_BYTES, { message: "too_large" });

/**
 * Tope del data URL que viaja en `avatarUrl` (fase estática).
 * Base64 infla ~33%: `ceil(AVATAR_MAX_BYTES * 4 / 3)`.
 */
export const AVATAR_DATA_URL_MAX_CHARS = Math.ceil((AVATAR_MAX_BYTES * 4) / 3);

/** Prefijos de data URL admitidos en `avatarUrl` (§2.1, §2.9). */
const AVATAR_DATA_URL_PREFIXES = ["data:image/png;base64,", "data:image/jpeg;base64,"];

/** `avatarUrl` como data URL validado: prefijo blanco + tope de longitud. */
export const avatarDataUrlSchema = z
  .string()
  .max(AVATAR_DATA_URL_MAX_CHARS, { message: "too_large" })
  .refine(
    (value) => AVATAR_DATA_URL_PREFIXES.some((prefix) => value.startsWith(prefix)),
    { message: "invalid_type" },
  );

/** Cuerpo de edición de perfil: solo campos personales, todo opcional. */
export const UpdateProfileSchema = z
  .object({
    givenName: nameSchema.optional(),
    familyName: nameSchema.optional(),
    email: emailSchema.optional(),
    bio: bioSchema.nullish(),
    avatarUrl: avatarDataUrlSchema.nullish(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "empty_patch" });

/** Cambio de contraseña: la actual nunca viaja sin trim, la nueva 8–128. */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordRegisterSchema, // 8–128, sin trim (auth.md §4.2)
    confirmPassword: z.string().min(1).max(128),
  })
  .strict()
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "password_same",
    path: ["newPassword"],
  });
```

> [!IMPORTANT]
> `username`, `role`, `id` y `createdAt` **no son editables por el cliente**.
> `UpdateProfileSchema` es `.strict()`: un payload que lleve `role` (o cualquier
> clave desconocida) se rechaza en validación, no se "ignora silenciosamente".
> El rol lo asigna exclusivamente `/admin` (`auth.md` §10.2) y el username es el
> identificador de login (`auth.md` §10.1, decisión §10.4).

### 2.3 `UserRepository.update`

`UserRepository` (hoy en `src/lib/repositories/post-repository.ts`) gana un
método. El contrato es **idéntico** para la fase estática y para el backend
futuro, como exige el patrón hexagonal:

```ts
export type UpdateProfilePatch = Partial<
  Pick<User, "givenName" | "familyName" | "email" | "bio" | "avatarUrl">
>;

export interface UserRepository {
  listAuthors(): Promise<AuthorOption[]>;
  /** Devuelve un usuario por username, o `null`. */
  findByUsername(username: string): Promise<User | null>;
  /**
   * Aplica un parche de datos personales. Devuelve el usuario actualizado
   * o `null` si el id no existe. Los campos fuera del parche no cambian.
   */
  update(id: string, patch: UpdateProfilePatch): Promise<User | null>;
}
```

`findByUsername` se añade porque hoy `UserProfileView` hace
`mockUsers.find(...)` a mano (§9.1): el componente no debe conocer los mocks.

### 2.4 Cambio de contraseña: `AuthGateway.changePassword`

La contraseña **no vive en `UserRepository`** (no es un dato del perfil, es una
credencial — joya P0). Se amplía el gateway:

```ts
export interface AuthGateway {
  // …existentes…
  /**
   * Cambia la contraseña del usuario de la sesión actual.
   * `currentPassword` debe verificar contra el hash guardado.
   */
  changePassword(currentPassword: string, newPassword: string): Promise<AuthResult>;
}
```

> [!WARNING]
> **Limitación honesta de la fase estática — y requisito de release.**
> `StaticAuthGateway` no guarda contraseñas (`src/data/users.ts`: *"Credentials
> are strictly NOT stored here"*) y su `signIn` acepta cualquier contraseña no
> vacía si el usuario existe. En consecuencia, la implementación estática de
> `changePassword` valida los **formatos** (§2.2) y simula éxito; **no puede
> verificar la contraseña actual**.
>
> **Requisito de release:** la implementación **real** de `changePassword`
> (tanto `AuthGateway` como el endpoint `PATCH /api/v1/…`) **queda deshabilitada**
> hasta que un backend verifique `currentPassword` contra el hash argon2id
> (`api-structure.md` §8.2). La simulación de la fase estática es **solo
> demostración** y no debe promocionarse a producción. El formulario sí pide la
> contraseña actual desde el primer día (la experiencia no cambia al pasar a
> backend); lo diferido es únicamente la verificación. Ver también §2.9.

### 2.5 Persistencia en la fase estática

- **Datos personales:** la implementación estática de `update` muta el
  `mockUsers` en memoria. Los cambios se ven **al instante** en toda la app
  (navbar, feed, detalle) porque todos leen el mismo array, y sobreviven a la
  navegación. **No sobreviven a recargar la página**, igual que el resto de los
  datos estáticos. La persistencia real será `PATCH /api/v1/users/:id`
  (previsto en `api-structure.md`).
- **Foto de perfil:** tras validar (§2.2), el archivo se convierte a **data URL**
  con `FileReader` y se guarda en `avatarUrl` en memoria. Es un data URL de
  ≤ 5 MB, así que la memoria es acotada y acorde a una demo; el almacenamiento
  real será `POST /api/v1/uploads` (multipart → `{ imageUrl }`, ya en el mapa de
  endpoints de `api-structure.md`).
- **Nada de `localStorage`:** introduciría una segunda fuente de verdad paralela
  a los mocks (§10.8). El único uso legítimo de `localStorage` en el proyecto es
  el guard de onboarding.

### 2.6 Sesión y detección de perfil propio

`useSession()` (`src/lib/session/session-provider.tsx`) expone
`{ user: { id, username, role } }`. El perfil es propio cuando:

```ts
const isOwnProfile =
  status === "authenticated" &&
  session.user.username.toLowerCase() === targetUsername.toLowerCase();
```

Mismo criterio que ya usa `UserProfileView`. Toda acción de edición **exige**
además sesión en la Server Action (§2.7): `isOwnProfile` decide qué se **pinta**,
la action decide qué se **ejecuta**. Pintar el botón no es autorización.

### 2.7 Server Actions

Se colocalan en `src/app/(main)/profile/actions.ts` (siguiendo el patrón de
`@modal/posts/actions.ts`, aunque aquí no hay ruta modal porque la edición es
inline):

| Action                    | Flujo                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `updateProfileAction`     | Sesión activa → `UpdateProfileSchema` → `userRepo.update(session.user.id, patch)` → `revalidatePath("/profile/…")` → `User` actualizado |
| `changePasswordAction`    | Sesión activa → `ChangePasswordSchema` → `authGateway.changePassword(...)` → resultado                  |
| `removeAvatarAction`      | Sesión activa → `userRepo.update(id, { avatarUrl: null })` → `revalidatePath`                           |

La **subida** de archivo no pasa por la action en fase estática: el `AvatarUploader`
convierte a data URL en el cliente y la incluye en el mismo
`updateProfileAction` como `avatarUrl` (el schema de servidor futuro validará el
tamaño de nuevo; §2.8).

### 2.8 Seguridad (security by design)

| Riesgo                          | Control (diseño)                                                                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editar el perfil de otro (IDOR) | Las actions resuelven el id **desde la sesión**, nunca desde el cuerpo del formulario. El `username` de la URL no entra en el patch.                |
| Escalada de rol                 | `UpdateProfileSchema.strict()` rechaza `role`; el backend futuro hace lo propio y jamás persiste campos fuera del patch.                            |
| Imagen maliciosa (SVG/script)   | Solo `image/png` y `image/jpeg` (raster). El SVG queda excluido por diseño: vectorial = ejecutable = XSS. El backend revalida **magic bytes**, no solo el `Content-Type`. |
| Imagen gigante (DoS)            | 5 MB en cliente y servidor; el body-limit global de la API (100 KB) se abre **solo** para la ruta de uploads.                                        |
| Fuga de PII ajena               | El perfil ajeno no pinta correo (§3.1, §10.1); la API futura sigue redactando además (R18).                                                          |
| Contraseña robada/mal gestionada| Política `auth.md` (8–128, sin composición), `autocomplete` correcto, sin loguear valores. **`security-architect` debe revisar esta sección antes de implementar** (joya P0 credenciales, `crown-jewels.md` §3). |

### 2.9 Contrato de seguridad para el backend (pendiente — no aplica en fase estática)

> [!IMPORTANT]
> Este apartado **no bloquea** la implementación de la fase estática (datos en
> memoria, sin backend). Es el checklist que el `developer` (fase backend),
> `blue-team` y `red-team` **deben exigir** al migrar esta pantalla a la API
> real. Cada ítem procede de un hallazgo de la revisión de `security-architect`
> (2026-10-08); ninguno se ha implementado aún porque no existe backend al que
> aplicarlo.

| Ítem | Requisito | Hallazgo |
| ---- | --------- | -------- |
| Rate limit en cambio de contraseña | El endpoint real de `changePassword` debe aplicar rate limit (reutilizar el mecanismo ya existente en la API). Motivo: con una sesión robada, un atacante puede fuerza-brutear la "contraseña actual" para escalar a credencial completa. | PR-4 |
| Rate limit en subida de uploads | El futuro `POST /api/v1/uploads` debe limitar tasa y tamaño por usuario (además del body-limit global), para evitar subida masiva o denegación por almacenamiento. | PR-4 |
| Magic bytes + re-codificación de imagen | El servidor **no** confía en el `Content-Type` ni en el `File.type`: valida los magic bytes del archivo y, preferiblemente, lo re-codifica (p. ej. con `sharp`), lo que elimina a la vez payloads maliciosos ocultos y los metadatos EXIF (GPS, dispositivo) por privacidad. | PR-5 |
| Restricción de `avatarUrl` | El backend solo persiste `avatarUrl` como **ruta relativa** `/uploads/…` (o `null`). Nunca una URL absoluta externa: prevenir SSRF (si el servidor la proxyea) y fuentes de contenido no controladas en el `<img>`. | PR-3 |
| CSP `img-src 'self'` | Cuando existan uploads reales, la Content-Security-Policy global debe servir imágenes **solo** del propio origen (más `data:` mientras se usen data URLs). Reforzar `X-Content-Type-Options: nosniff` (ya global). | PR-8 |
| Unicidad de correo | Un `PATCH` que cambie el email a uno ya registrado debe devolver `409` **genérico** (sin revelar a quién pertenece, anti-enumeración R18). Verificación del correo nuevo: fuera de MVP, anotada como futuro. | PR-7 |
| CSRF | Las mutaciones de perfil heredan el CSRF por doble envío ya implementado en la API (`facy.csrf_token`); ningún endpoint de esta pantalla queda exento. | (ya existente) |

---

## 3. Wireframes

El orden de regiones es el **mismo en móvil y escritorio** (criterio ya fijado en
`wireframes_post_detail.md` §10.3). Solo cambia el ancho.

### 3.1 Perfil ajeno

```
┌──────────────────────────────────────────────────────────────┐
│ ┌────────┐                                                    │
│ │ Avatar │  Nombre Apellido  [estudiante]                     │
│ │ 80px   │  @username                                         │
│ └────────┘  Bio breve opcional, máximo dos líneas.            │
│              Miembro desde 1 de septiembre de 2026.           │
├──────────────────────────────────────────────────────────────┤
│ Publicaciones (3)                                             │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ PostCard — cascada vertical, ancho completo               │  │
│ └──────────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ PostCard                                                  │  │
│ └──────────────────────────────────────────────────────────┘  │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ PostCard                                                  │  │
│ └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- **No hay línea de correo.** No en vacío, no enmascarada, no con botón de
  copiar: la vista no conoce el correo de otra persona (§10.1).
- **No hay botones de acción.** Ni editar, ni nueva publicación.
- El avatar es la **foto** si existe y, si no, las iniciales sobre
  `--surface-muted` (patrón ya implementado).

### 3.2 Perfil propio — modo vista

```
┌──────────────────────────────────────────────────────────────┐
│ ┌────────┐                                                    │
│ │ Avatar │  Nombre Apellido  [estudiante]        [✎ Editar]   │
│ │ 80px   │  @username                          [＋ Nueva]     │
│ └────────┘  Bio breve opcional…                              │
│              correo@ejemplo.com                               │
│              Miembro desde 1 de septiembre de 2026.           │
├──────────────────────────────────────────────────────────────┤
│ Datos personales                            [✎ Editar perfil] │
│   Nombre     Nombre Apellido                                 │
│   Usuario    @username                          [⧉ copiar]    │
│   Correo     correo@ejemplo.com                              │
│   Bio        Bio breve… o  «Sin biografía.»                   │
├──────────────────────────────────────────────────────────────┤
│ Cambiar contraseña                                           │
│   [Contraseña actual] [Nueva contraseña] [Confirmar]          │
│                                            [Cambiar contraseña]│
├──────────────────────────────────────────────────────────────┤
│ Publicaciones (5)  [publicado 3 · borrador 2]                 │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ PostCard — cascada vertical                               │  │
│ └──────────────────────────────────────────────────────────┘  │
│ …                                                             │
└──────────────────────────────────────────────────────────────┘
```

- El **correo solo aparece en el perfil propio**, en la cabecera y en la sección
  Datos personales.
- La sección **Datos personales** en modo vista es una lista de solo lectura
  (`<dl>`), pensada para que el modo edición sustituya exactamente ese bloque.
- El **contador por estado** (`publicado · borrador · oculto`) se muestra **solo
  en perfil propio**: el visitante ajeno no debe inferir que existen borradores
  ajenos. Se pinta con la misma regla de visibilidad de siempre
  (`filterVisiblePosts`), que ya hace visibles los borradores **solo a su autor**.
- El heading de Publicaciones sigue mostrando el total visible para quien mira.

### 3.3 Perfil propio — modo edición

La cabecera **se convierte en el formulario**; no es un diálogo ni una ruta
nueva. Al entrar en edición, el scroll se mantiene y el foco salta al primer
campo.

```
┌──────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────┐                │
│ │  📷  Foto de perfil                        │                │
│ │  ┌──────┐   [Cambiar foto]  [Quitar foto]   │                │
│ │  │actual│   PNG o JPG, máximo 5 MB.        │                │
│ │  └──────┘                                   │                │
│ ├────────────────────────────────────────────┤                │
│ │ Nombre *      [María_______________]       │                │
│ │ Apellido *    [Rivas_______________]       │                │
│ │ Correo *      [maria@correo.com____]       │                │
│ │ Bio           [____________________] 0/160 │                │
│ │ Usuario       @m.rivas            [⧉ copiar]│               │
│ ├────────────────────────────────────────────┤                │
│ │           [Guardar cambios]  [Cancelar]     │                │
│ └────────────────────────────────────────────┘                │
│                                                               │
│ (Las secciones Cambiar contraseña y Publicaciones permanecen) │
└──────────────────────────────────────────────────────────────┘
```

- `[Cambiar foto]` es un `<label>` estilado como botón de un
  `<input type="file" class="sr-only">`: el input sigue recibiendo foco y el
  label dibuja el anillo (`peer-focus-visible`).
- Elegir un archivo **válido** muestra la previsualización en el avatar al
  instante (aún sin guardar). Elegir uno **inválido** no sustituye la imagen
  actual: muestra el error y limpia el input (§6).
- `[Quitar foto]` solo aparece si hay foto; restablece las iniciales en la
  previsualización.
- `[Cancelar]` descarta **todos** los cambios (incluida la foto pendiente) y
  vuelve al modo vista con los datos originales.
- `@username` se muestra **no editable** con su botón de copiar (§10.4).

### 3.4 Sección "Cambiar contraseña"

Independiente del modo edición: siempre visible en el perfil propio, con su
propio `<form>` y su propio envío. Dos columnas en `sm+`, una en móvil.

- Sin medidor de fuerza (decisión `auth.md` §10.5).
- Sin enlace "¿Olvidaste tu contraseña?" (fuera de MVP, `auth.md` §10.4).
- Éxito → los tres campos se vacían y un `role="status"` anuncia el cambio.

### 3.5 Sin publicaciones / usuario inexistente

Los dos estados **no cambian** en estructura: `EmptyState` con copy propio (ya
implementado) y `EmptyState` de perfil inexistente con CTA "Volver al feed".

> [!IMPORTANT]
> El copy del perfil inexistente **cambia** por anti-enumeración (R18). La
> implementación actual pinta *"No existe ningún usuario registrado con el
> nombre @X"*, que **confirma** que el username no existe y convierte el perfil
> en un oráculo de enumeración para scraping de cuentas. El copy nuevo es
> genérico y **no distingue** entre "usuario no existe" y "usuario existe pero
> sin permiso para verlo": **"No pudimos encontrar ese perfil."**
> Ver hallazgo PR-6 de la revisión de `security-architect` (§2.9).

---

## 4. Inventario de campos y copy

### 4.1 Formulario de datos personales

| Campo      | Tipo / control  | Atributos clave                                        | Validación                 | Ayuda                                      | Error                                              |
| ---------- | --------------- | ------------------------------------------------------ | -------------------------- | ------------------------------------------ | -------------------------------------------------- |
| Foto       | `input file`    | `accept="image/png,image/jpeg"`                        | mime ∈ {png, jpeg}; ≤ 5 MB | `PNG o JPG, máximo 5 MB.`                  | `La foto debe ser un archivo PNG o JPG.` / `La foto no puede superar los 5 MB.` |
| Nombre     | `Field text`    | `required`, `autoComplete="given-name"`                | `nameSchema` (2–60)        | —                                          | `Escribe tu nombre.` / `El nombre debe tener entre 2 y 60 caracteres.` |
| Apellido   | `Field text`    | `required`, `autoComplete="family-name"`               | `nameSchema`               | —                                          | `Escribe tu apellido.` / `El apellido debe tener entre 2 y 60 caracteres.` |
| Correo     | `Field email`   | `required`, `autoComplete="email"`                     | `emailSchema`              | —                                          | `Escribe tu correo.` / `Escribe un correo válido.`   |
| Bio        | `Textarea`      | `maxLength={160}`, filas 3, `resize-y`                 | `bioSchema`                | `Cuéntale a la comunidad quién eres (máx. 160 caracteres).` | `La bio no puede superar los 160 caracteres.` |
| Usuario    | texto + botón   | solo lectura, `aria-readonly`                          | —                          | —                                          | —                                                  |

- Botones: **`Guardar cambios`** (primario) y **`Cancelar`** (secundario).
- El contador `0/160` va junto al textarea con `aria-hidden="true"`: es
  informativo visual, el lector de pantalla no necesita un anuncio en cada
  tecla (`maxlength` ya impone el tope).
- Correo duplicado: la fase estática no puede comprobar unicidad (no hay
  backend); la acción simula éxito. El backend futuro devolverá `409`.

### 4.2 Cambio de contraseña

| Campo                 | Tipo / control | Atributos clave                                        | Validación                          | Ayuda                          | Error                                        |
| --------------------- | -------------- | ------------------------------------------------------ | ----------------------------------- | ------------------------------ | -------------------------------------------- |
| Contraseña actual     | `Field password` | `required`, `autoComplete="current-password"`          | 1–128, **sin trim**                 | —                              | `Escribe tu contraseña actual.`              |
| Nueva contraseña      | `Field password` | `required`, `autoComplete="new-password"`              | `passwordRegisterSchema` (8–128)    | `Mínimo 8 caracteres.`         | `La contraseña debe tener al menos 8 caracteres.` |
| Confirmar contraseña  | `Field password` | `required`, `autoComplete="new-password"`              | debe coincidir; ≠ actual            | —                              | `Las contraseñas no coinciden.` / `La nueva contraseña debe ser distinta de la actual.` |

Botón: **`Cambiar contraseña`**.

### 4.3 Copy de confirmaciones y estados

| Momento                      | Copy                                    | Canal                       |
| ---------------------------- | --------------------------------------- | --------------------------- |
| Perfil actualizado           | `Perfil actualizado.`                   | `role="status"`             |
| Foto retirada                | `Foto de perfil eliminada.`             | `role="status"`             |
| Contraseña cambiada          | `Contraseña actualizada.`               | `role="status"`             |
| Username copiado             | `Usuario copiado.`                      | `role="status"`             |
| Fallo de guardado (genérico) | `No pudimos guardar los cambios. Intenta de nuevo.` | `FormAlert` (`role="alert"`) |
| Perfil inexistente o no visible | `No pudimos encontrar ese perfil.` | `EmptyState` (§3.5, anti-enumeración) |
| Sin biografía                | `Sin biografía.`                        | texto muted en modo vista   |

Todo el copy visible va en español; los identificadores, en inglés (regla del
proyecto).

---

## 5. Componentes

### 5.1 Árbol de componentes

```
UserProfileView ("use client")                 ← ya existe, se modifica
├── Avatar                                      ← crear (ui/)
│     foto si avatarUrl, si no iniciales
├── [modo vista]
│     ├── section Datos personales (<dl>)
│     ├── PasswordForm                          ← crear (profile/)
│     └── PostCard × n  (cascada, grid-cols-1)
└── [modo edición] (isOwnProfile && editing)
      ├── AvatarUploader                        ← crear (profile/)
      └── ProfileForm                           ← crear (profile/)
            ├── Field × 3, Textarea × 1
            └── FormAlert
```

### 5.2 Responsabilidades

| Componente                | Tipo     | Responsabilidad                                                                              |
| ------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `Avatar`                  | servidor | Dibuja foto (`<img alt="">`) o iniciales. Recibe `user`; sin estado propio.                 |
| `AvatarUploader`          | cliente  | Input file oculto + label-botón + previsualización + validación de archivo + `Quitar foto`.  |
| `ProfileForm`             | cliente  | Formulario de datos personales; precarga desde `User`; cancelar/Guardar; contador de bio.    |
| `PasswordForm`            | cliente  | Los tres campos y su envío; limpia campos y anuncia éxito.                                  |
| `user-profile-view.tsx`   | cliente  | Orquesta: sesión, repositorio, modo vista/edición, lista de publicaciones en cascada.        |
| `src/app/(main)/profile/actions.ts` | servidor | Las tres Server Actions de §2.7.                                                   |

### 5.3 Componentes reutilizados sin cambios

`Field`, `Textarea`, `FormAlert`, `Badge` (tono de rol: `warning` admin,
`category` profesor, `neutral` estudiante — criterio ya implementado),
`EmptyState`, `PostCard`, `buttonStyles`, `formatDate`, `filterVisiblePosts`.

### 5.4 Iconos nuevos (`src/components/ui/icons.tsx`)

| Icono         | Uso                       |
| ------------- | ------------------------- |
| `PencilIcon`  | `Editar perfil`           |
| `CopyIcon`    | Copiar `@username`        |
| `CameraIcon`  | `Cambiar foto`            |
| `TrashIcon`   | `Quitar foto`             |

Mismo trazado que los 17 iconos existentes: SVG inline, `aria-hidden` implícito
por ser decorativos (el texto del botón nombra la acción).

---

## 6. Estados

| Estado                       | Comportamiento                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Guardando datos              | `<form aria-busy="true">`, botones `disabled` (opacity 60). **Sin spinner** (criterio `auth.md` §10.7).                                    |
| Guardando contraseña         | Igual que arriba, solo en `PasswordForm`.                                                                                                  |
| Error de validación          | `FormAlert` (`role="alert"`, foco automático, cada error enfoca su campo) + `aria-invalid` en los campos. Patrón de `wireframes_auth.md`. |
| Archivo inválido             | `FormAlert` **dentro del bloque de foto** con el error de §4.1; la imagen anterior se conserva; el input file se limpia para poder reintentar. |
| Éxito                        | Vuelta al modo vista con los datos nuevos + `role="status"` con el copy de §4.3.                                                            |
| Fallo simulado (gateway)     | `FormAlert` con `No pudimos guardar los cambios. Intenta de nuevo.`; el formulario conserva lo escrito.                                     |
| Bio ausente                  | Modo vista: línea `Sin biografía.` en muted. No se pinta un `Bio:` vacío.                                                                  |
| Foto ausente                 | Iniciales (`givenName[0] + familyName[0]`) sobre `--surface-muted`, misma métrica que hoy.                                                  |
| Imagen rota (`onError`)      | Vuelve a iniciales: no se queda un hueco ni un icono de imagen rota.                                                                        |
| Usuario inexistente          | `EmptyState` con copy genérico "No pudimos encontrar ese perfil." (§3.5, anti-enumeración).                                                          |
| Sin sesión                   | `SessionProvider` ya redirige a `/login`; no se duplica aquí.                                                                               |

---

## 7. Accesibilidad (WCAG 2.2 AA)

1. **Etiquetas visibles.** Todos los campos llevan `<label>` visible vinculado
   (`Field` ya lo garantiza). El input de archivo se asocia a un `<label>`
   visible estilado como botón; el input real es `sr-only` pero **recibe foco**
   y el anillo se dibuja en el label (`peer-focus-visible`), de modo que
   teclado y lector de pantalla llegan igual que con un botón normal.
2. **Errores.** `FormAlert` con `role="alert"` y foco automático (ya implementado
   así en auth). `aria-describedby` apunta a ayuda y error; `aria-invalid="true"`
   en campo fallido. Nunca se comunica un error solo por color (SC 1.4.1).
3. **Contador de bio.** `aria-hidden="true"`: anunciar el recuento en cada tecla
   es ruido (SC 4.1.3 mal aplicado). El tope real lo impone `maxlength`.
4. **Anuncios de éxito.** Contenedores `role="status"` (`aria-live="polite"`):
   "Perfil actualizado.", "Usuario copiado.", "Contraseña actualizada.".
5. **Avatar.** La foto es **decorativa** (`alt=""`): el nombre propio está a
   centímetros y duplicarlo es ruido. Las iniciales también son `aria-hidden`.
6. **Jerarquía.** Un solo `<h1>`: el nombre completo. `h2` por sección:
   "Datos personales", "Cambiar contraseña", "Publicaciones". El `<main>` lo
   aporta el layout de `(main)`; **no** se anida otro (error que ya corrigió
   `wireframes_post_detail.md` §10.6 y que este rediseño corrige de paso en
   `UserProfileView`).
7. **Objetivos táctiles.** Todos los botones con `min-h-11` (44 px), ya la
   medida del proyecto (`buttonStyles`).
8. **Contraste.** Solo tokens semánticos existentes; nada de `hex` suelto
   (§8).
9. **Zoom y reflujo.** El orden de regiones no cambia con el breakpoint; el
   formulario es de una columna en móvil y dos filas en `sm+`, sin pérdida de
   contenido al 200 %.
10. **Movimiento reducido.** La transición vista→edición es un intercambio de
    bloques sin animación; la regla global de `globals.css` ya congela
    animaciones con `prefers-reduced-motion`.

---

## 8. Tokens y contraste

Sin tokens nuevos. La vista usa exclusivamente los semánticos ya definidos en
`globals.css` y tabulados en `brief.md`:

| Elemento                        | Token                |
| ------------------------------- | -------------------- |
| Fondo de tarjeta                | `--surface`          |
| Bordes de tarjeta y campos     | `--border`           |
| Texto secundario y ayuda       | `--text-muted`       |
| Iniciales del avatar            | `--primary` sobre `--surface-muted` |
| Errores                         | `--danger`           |
| Anillo de foco                  | `--accent` (ámbar)   |
| Badge de rol                    | `--warning` / `--primary` / `--text-muted` sobre `--surface-muted` |

---

## 9. Guía de archivos para el `developer`

### 9.1 Archivos

| Archivo                                          | Acción    | Responsabilidad                                                                     |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------------------ |
| `packages/shared/src/types/user.ts`              | modificar | `bio?: string \| null`, `avatarUrl?: string \| null` (§2.1)                          |
| `packages/shared/src/schemas/user.ts`            | modificar | Re-exporta los nuevos esquemas (§2.2)                                                |
| `packages/shared/src/schemas/profile.ts`         | **crear** | `bioSchema`, `avatarFileSchema`, `UpdateProfileSchema`, `ChangePasswordSchema`, constantes |
| `apps/web/src/lib/validation/profile.ts`         | **crear** | Validación pura de los formularios (errores en copy español, §4)                     |
| `apps/web/src/lib/validation/profile.test.ts`    | **crear** | Tests colocated (TDD, primero)                                                        |
| `apps/web/src/lib/repositories/post-repository.ts` | modificar | `UserRepository`: `findByUsername`, `update`, tipo `UpdateProfilePatch` (§2.3)     |
| `apps/web/src/lib/repositories/post-repository.static.ts` | modificar | Implementación sobre `mockUsers` en memoria (§2.5)                       |
| `apps/web/src/lib/repositories/post-repository.contract.test.ts` | modificar | Contract tests de `update`/`findByUsername`                          |
| `apps/web/src/lib/auth/auth-gateway.ts`          | modificar | `changePassword` en la interfaz (§2.4)                                               |
| `apps/web/src/lib/auth/auth-gateway.static.ts`   | modificar | Implementación estática (simula éxito tras validar formatos, §2.4 WARNING)            |
| `apps/web/src/components/ui/avatar.tsx`          | **crear** | Avatar foto/iniciales (§5.2)                                                         |
| `apps/web/src/components/ui/avatar.test.tsx`     | **crear** | Tests colocated                                                                       |
| `apps/web/src/components/ui/icons.tsx`           | modificar | `PencilIcon`, `CopyIcon`, `CameraIcon`, `TrashIcon` (§5.4)                          |
| `apps/web/src/components/profile/profile-form.tsx`        | **crear** | Formulario de datos personales (§3.3, §4.1)                            |
| `apps/web/src/components/profile/profile-form.test.tsx`   | **crear** | Tests colocated                                                              |
| `apps/web/src/components/profile/password-form.tsx`       | **crear** | Cambio de contraseña (§3.4, §4.2)                                       |
| `apps/web/src/components/profile/password-form.test.tsx`  | **crear** | Tests colocated                                                              |
| `apps/web/src/components/profile/avatar-uploader.tsx`     | **crear** | Subida/previsualización/retirada de foto (§3.3)                   |
| `apps/web/src/components/profile/avatar-uploader.test.tsx`| **crear** | Tests colocated                                                              |
| `apps/web/src/components/profile/user-profile-view.tsx`   | modificar | Correo solo propio (§10.1); cascada vertical (§10.2); orquesta edición |
| `apps/web/src/components/profile/user-profile-view.test.tsx` | **crear** | Hoy **no existe** test de esta vista; se crea (§9.2)              |
| `apps/web/src/app/(main)/profile/actions.ts`             | **crear** | Server Actions de §2.7                                                 |
| `apps/web/src/data/users.ts`                     | modificar | Solo si se quieren fixtures con bio/avatarUrl; **no** es obligatorio (§2.1)         |
| `apps/web/src/test/factories.ts`                 | modificar | `makeUser()` acepta overrides de `bio`/`avatarUrl`                                    |
| `docs/design/wireframes.md`                      | modificar | §3.3 ya quedó como puntero (hecho en esta entrega)                                   |
| `docs/architecture/frontend-structure.md`        | **no tocar** | Inmutable. Los desvíos van a `progress.md`                                        |

### 9.2 Tests (colocated, TDD, umbral ≥ 80% del gate)

| Test                                 | Qué cubre                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `validation/profile.test.ts`         | Bio vacía → `null`; 160 car. pasa, 161 falla; trim; archivo: tipo inválido, > 5 MB, vacío, PNG y JPEG válidos; **data URL: prefijo correcto pasa, prefijo `data:image/svg+xml` rechazado, longitud > `AVATAR_DATA_URL_MAX_CHARS` rechazada**; patch sin campos → `empty_patch`; patch con `role` **rechazado** por `.strict()`; contraseña: corta, mismatch, igual a la actual, espacios preservados en la actual |
| `avatar.test.tsx`                    | Con `avatarUrl` → `<img alt="">`; sin él → iniciales; `onError` → iniciales; iniciales `aria-hidden`                                                    |
| `avatar-uploader.test.tsx`           | Archivo válido → previsualización; inválido → error y **la imagen anterior se conserva**; `Quitar foto` solo con foto; `accept` correcto; contador/label copy |
| `profile-form.test.tsx`              | Precarga; guardar deshabilitado sin cambios; errores con `aria-invalid` y `FormAlert`; contador 0/160 y `aria-hidden`; `Cancelar` descarta; `autoComplete` correctos; `@username` no editable |
| `password-form.test.tsx`             | Mismatch y corta → errores; éxito → campos limpios + `role="status"`; `current-password`/`new-password`; sin medidor de fuerza                          |
| `user-profile-view.test.tsx`         | **Ajeno**: sin correo en ningún sitio, sin botones de edición; **propio**: correo visible, `Editar perfil` conmuta el formulario, contador por estado solo propio; publicaciones en **un solo** contenedor de columna (sin `md:grid-cols-2`); usuario inexistente → copy genérico "No pudimos encontrar ese perfil." y **sin** el texto enumerador "No existe ningún usuario registrado"; un solo `h1` |
| `post-repository.contract.test.ts`   | `findByUsername` encuentra y devuelve `null`; `update` aplica el parche, ignora campos no incluidos, no toca `role`/`id`/`createdAt`, id inexistente → `null` |
| `auth-gateway.test.ts`               | `changePassword` valida formatos y simula éxito; no rompe con sesión inexistente                                                                        |

### 9.3 Desvíos respecto de `frontend-structure.md` (para `progress.md`)

1. `src/components/profile/` **no está** en la estructura objetivo (que solo
   lista `ui/`, `layout/`, `feed/`, `forms/`, `shared/`). La vista ya vive ahí
   desde 2026-10-08 y este diseño la consolida: se registra como desvío ya
   ocurrido, con los nuevos hermanos.
2. `src/app/(main)/profile/actions.ts` es una ruta de acciones que la
   estructura no lista (las de posts viven en `@modal/posts/actions.ts`). Es la
   misma técnica, distinto emplazamiento.
3. `packages/shared/src/schemas/profile.ts` es un módulo nuevo del paquete
   compartido; el shared ya está declarado en la arquitectura de monorepo.
4. `Avatar` se propone en `ui/` porque no arrastra dominio (solo dibuja),
   igual que `badge.tsx`; **si el equipo prefiere coherencia estricta de
   dominio**, va en `profile/avatar.tsx` sin efectos secundarios. Cualquiera de
   las dos es válida; elegir una y documentarla.

---

## 10. Decisiones de diseño y sus justificaciones

### 10.1 El correo no se pinta en el perfil ajeno

La implementación actual muestra `@username · correo` a todo el mundo. El correo
es **dato privado** (decisión del producto confirmada en esta iteración) y la
API ya lo trata como tal: R18 lo redacta a `""` salvo para el propio usuario o
un admin. Pero la vista no debe depender de eso: si la redacción se rompe, la
pantalla sería el punto de fuga. Por eso el componente **no recibe ni renderiza**
el correo de otra persona — es imposible pintar lo que no se tiene. Esto
superaría incluso el contrato wire de R18, que sí mantiene la forma `User` con un
`""`; en UI la forma no se conserva: no hay línea de correo.

### 10.2 Publicaciones en cascada vertical

Era un `grid md:grid-cols-2`. El perfil no compite por densidad: es la carta de
presentación de una persona y sus trabajos, y las tarjetas `PostCard` ya están
diseñadas a ancho completo con `stretched-link` (un enlace gigante por tarjeta;
en dos columnas el área de clic es más probable que se pise con el foco
secuencial). La cascada además iguala la lectura en móvil y escritorio, y hace
que la jerarquía "cabecera → trabajos" se lea sin esfuerzo.

### 10.3 Edición inline, no modal ni ruta propia

Un diálogo encaja mal con un formulario que incluye previsualización de imagen y
un textarea de bio: en móvil el scroll atrapado del patrón de diálogo
(`wireframes_posts.md` §7) deja poco espacio a la foto que se acaba de subir. Una
ruta `/profile/edit` separa "ver" de "editar" sin ningún beneficio de contexto
(y añade una ruta al mapa de navegación). Inline: el usuario ve el resultado de
sus cambios en la misma tarjeta que los refleja, y `Cancelar` es volver a mirar.

### 10.4 `@username` no es editable

Es el identificador de login (`auth.md` §10.1). Cambiarlo implica: unicidad en
tiempo real (la carrera TOCTOU de username está **pendiente de red-team** en
`progress.md`), migración de todos los enlaces `/profile/[username]` ya
publicados en el feed y en las publicaciones, y una decisión de backend sobre
historiales de login. Ninguna de esas piezas existe hoy. Se muestra con botón de
copiar, que es lo que un usuario quiere decir cuando dice "¿cuál es mi usuario?".

### 10.5 Bio de 160 caracteres, texto plano

El esquema original de la pantalla (`wireframes.md` §3.3) prometía "Bio breve" y
el tipo nunca la recibió: este diseño la cierra. 160 es la medida de una o dos
líneas — suficiente para una línea de investigación o un cargo, insuficiente para
un CV, que es justo el espíritu de "breve". Texto plano, sin Markdown: el perfil
no es una publicación, y un renderer en la bio sería superficie de XSS sin
necesidad.

### 10.6 Foto: PNG y JPG, 5 MB, raster

Requisito del producto. Los dos formatos pedidos cubren cámara y exportación de
diseño; el SVG queda fuera **por seguridad** (vectorial = ejecutable), y el GIF
por no aportar (animación accidental en una red académica). La previsualización
con `URL.createObjectURL`/data URL es instantánea y no necesita subida previa.
El corte de 5 MB es generoso para un retrato y evita un payload absurdo en la
futura ruta de uploads.

### 10.7 Cambiar contraseña, sí; revisada por `security-architect`

Toca la joya **P0 credenciales** (`crown-jewels.md` §2), así que la regla del
proyecto es clara: `security-architect` revisa este diseño antes de escribir la
implementación. **La revisión se hizo el 2026-10-08** (hallazgos PR-1..PR-8):
la limitación de la fase estática (no puede verificar la contraseña actual) se
convirtió en **requisito de release** (§2.4) y los controles de backend
pendientes (rate limit, verificación argon2id) quedaron en §2.9. `blue-team`
verificará esos controles al llegar la implementación. Se incluye la sección
porque un perfil sin gestión de contraseña deja la P0 a medio camino, y porque
la política ya está escrita (`auth.md` §4.2, §10.5): no hay que inventar nada,
solo exponerla. El formulario se diseña igual que funcionará con backend.

### 10.8 Persistencia en memoria, no `localStorage`

`update` muta el mismo `mockUsers` que leen navbar, feed y detalle: la demo
parece real mientras dura la sesión. `localStorage` sobreviviría a recargas,
pero crearía una fuente de verdad paralela que nadie más leería y lógica de
custom sync que después hay que borrar. La regla del proyecto es que los datos
estáticos viven en `src/data/` y los mock no persisten; el perfil no es la
excepción.

### 10.9 El contador por estado solo en el perfil propio

Mostrarle a un visitante "borrador 2" le dice que existen borradores ajenos, y
aunque la regla de visibilidad garantiza que nunca los verá, el número es una
fuga de metadatos. En el perfil propio es información de productividad
("¿me quedó algo sin publicar?"), que es exactamente para lo que sirve.

### 10.10 Lo que este documento no arregla

El guard de sesión sigue siendo cliente (limitación ya asumida en
`wireframes_post_detail.md` §10.9). Las Server Actions de §2.7 validan sesión,
pero en la fase estática eso se ejecuta en el cliente igual que el resto del
patrón; el enforcement real llega con la cookie de servidor y las rutas de la
API.

---

## 11. Qué queda fuera de este documento

- **Recuperación de contraseña** — fuera del MVP (`auth.md` §10.4).
- **Eliminar cuenta** — no está en el alcance del MVP ni en el mapa de rutas.
- **Recorte/ajuste de imagen** — listado como no-MVP en `wireframes_posts.md` §1;
  la foto se usa tal cual se sube.
- **Editar `@username`** — §10.4.
- **Cambiar rol** — exclusivo de `/admin` (`wireframes.md` §3.4).
- **Seguir/seguidores, favoritos, historial de actividad, redes sociales** — no
  existen en la especificación del proyecto.
- **La pantalla `/admin`** — su propio diseño, aún pendiente.
- **Almacenamiento real de la imagen** — `POST /api/v1/uploads` (futuro,
  `api-structure.md`).
