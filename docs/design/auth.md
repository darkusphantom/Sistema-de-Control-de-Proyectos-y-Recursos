# Autenticación — Red FaCyT (`/login` y `/register`)

> **Nota tras el pivot (2026-10-17)**: se actualizaron los roles (`coordinador`/`aprobador`/`admin_sistema`) y el destino post-login (`/dashboard`). El registro público solo crea `coordinador`. El copy de bienvenida ("Accede a Red FaCyT…") y los tokens visuales se rediseñarán en la **Fase 2** del pivot (estilo Apple); el comportamiento y la accesibilidad de este documento siguen vigentes.

Especificación de diseño de las dos pantallas públicas del route group
`(auth)`. El `developer` implementa este documento tal cual y el
`qa-reviewer` valida el resultado contra él.

- **Wireframes:** [`wireframes_auth.md`](wireframes_auth.md)
- **Identidad visual y tokens:** [`brief.md`](brief.md), [`components.md`](components.md)
- **Tokens de color (fuente de verdad):** `src/app/globals.css` — ver §8.1
- **Accesibilidad transversal:** [`accessibility.md`](accessibility.md)
- **Mapa de navegación:** [`wireframes.md`](wireframes.md) §1
- **Alcance del MVP:** [`../implementation/implementation_base.md`](../implementation/implementation_base.md)

## 1. Propósito e identidad visual

Dos pantallas, un solo patrón. Autenticarse es un trámite, no una escena: la
identidad institucional entra por la marca y la tipografía, no por decoración.

- **Una tarjeta, un objetivo.** Centro de la pantalla, `max-width` 400px,
  `--surface`, borde `--border`, `--radius-lg` (12px), `shadow-sm`. Cero
  gradientes, cero ilustraciones, cero adornos.
- **Editorial dentro de la tarjeta.** Alineación a la izquierda (regla de
  `brief.md` §5): el bloque se centra en la página, el contenido se alinea a la
  izquierda.
- **Un solo acento por pantalla.** El botón de envío es la única superficie
  `--accent`, que es el ámbar de acción (regla de `components.md` §5). Los
  enlaces son texto `--accent-teal` sin subrayado permanente, subrayado en
  `hover` y `focus-visible`.
- **Jerarquía:** palabra de marca (serif, `--primary`) → H1 de la pantalla
  (serif, `--text`) → labels (sans, 16px) → ayuda y errores (sans, 14px,
  `--text-muted` / `--danger`).
- **Separador `--border`** entre el encabezado del formulario y los campos. Un
  solo corte, no varios.
- **Bordes:** el de la tarjeta y el del divisor usan `--border` (marco
  decorativo). El de los **campos de formulario** usa `--text-muted`, porque es
  la frontera que identifica el control y está sujeta a contraste mínimo (§8.2).

**Fuera de alcance por minimalismo:** logo animado, ilustración de fondo,
medidor de fuerza de contraseña, botón "mostrar contraseña", checkbox
"Recordarme", "¿Olvidaste tu contraseña?", login social. Si se agregan después,
se agregan sobre esta base sin replantear la pantalla.

## 2. Layout y aislamiento de `(auth)`

> [!IMPORTANT]
> `(auth)` **no tiene `layout.tsx`**: hay que crearlo. El layout es
> independiente del shell autenticado `(main)`.

```
┌────────────────────────────────────────┐
│  FaCyT                          [🌙]   │  ← marca + ThemeToggle (sin "Omitir")
├────────────────────────────────────────┤
│                                        │
│              [ tarjeta ]              │  ← <main>, flex-1, centrado
│                                        │
├────────────────────────────────────────┤
│  © 2026 Facultad Experimental de ...  │  ← reusar Footer de components/layout
└────────────────────────────────────────┘
```

- `min-h-dvh`, `flex flex-col`, `bg-bg text-text`.
- Reutiliza `ThemeToggle` (`src/components/layout/theme-toggle.tsx`) y `Footer`
  (`src/components/layout/footer.tsx`), que ya existen.
- **No** reutilizar `LandingTopBar`: su control "Omitir introducción" apunta a
  `/login` y llama `markOnboardingAsSeen()`. En `/login` sería un enlace a sí
  mismo que corrompe el flag de onboarding. En `(auth)` basta marca + tema.
- **No** renderiza `Navbar`, `Sidebar` ni `BottomNav`.
- Ambas pantallas comparten layout; solo cambia la tarjeta.
- "Volver a la bienvenida" (`/`) debajo de la tarjeta: variante `ghost`,
  tamaño `sm`, solo texto.

## 3. Wireframes

Ver [`wireframes_auth.md`](wireframes_auth.md): `/login` (§2), `/login` con
credenciales inválidas (§2.1), estado enviando (§2.2), `/register` (§3) y notas
de escritorio (§4).

## 4. Inventario de campos

Regla transversal: **el placeholder nunca es la etiqueta**. Todos los campos
tienen label visible; el placeholder es solo un ejemplo complementario.

### 4.1 `/login`

| Campo      | `type`     | Label         | Placeholder | `autocomplete`     | `name`     | Validación                           | Mensaje de error exacto |
| ---------- | ---------- | ------------- | ----------- | ------------------ | ---------- | ------------------------------------ | ----------------------- |
| Usuario    | `text`     | `Usuario`     | `j.rivas`   | `username`         | `username` | requerido; `trim` no vacío; máx. 50 | `Escribe tu usuario.`     |
| Contraseña | `password` | `Contraseña`  | *(ninguno)* | `current-password` | `password` | requerido; máx. 128                  | `Escribe tu contraseña.`  |

El campo de contraseña **no lleva placeholder**: un placeholder de puntos
sugiere una longitud y no aporta información.

### 4.2 `/register`

| Campo                | `type`                         | Label                 | Placeholder        | `autocomplete` | `name`         | Validación                                                     | Mensaje de error exacto                                                                                                        | Texto de ayuda        |
| -------------------- | ------------------------------ | --------------------- | ------------------ | -------------- | -------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Nombre               | `text`                         | `Nombre`               | `María`              | `given-name`   | `given-name`   | requerido; 2–60; letras con acentos, espacio, `-` y `'`        | `Escribe tu nombre.` / `El nombre debe tener entre 2 y 60 caracteres.`                                                         | —                     |
| Apellido             | `text`                         | `Apellido`             | `Rivas`              | `family-name`  | `family-name`  | requerido; 2–60; mismas reglas                                 | `Escribe tu apellido.` / `El apellido debe tener entre 2 y 60 caracteres.`                                                     | —                     |
| Correo               | `email` + `inputMode="email"`  | `Correo`               | `nombre@correo.com` | `email`        | `email`        | requerido; formato válido; máx. 254; normalizar a minúsculas   | `Escribe tu correo.` / `Escribe un correo válido, por ejemplo nombre@correo.com.` / `Ya existe una cuenta con ese correo.`       | —                     |
| Contraseña           | `password`                     | `Contraseña`           | *(ninguno)*         | `new-password` | `new-password` | requerido; 8–128                                              | `La contraseña debe tener al menos 8 caracteres.`                                                                              | `Mínimo 8 caracteres.` |
| Confirmar contraseña | `password`                     | `Confirmar contraseña` | *(ninguno)*         | `new-password` | `new-password` | requerido; debe coincidir                                     | `Escribe la contraseña otra vez.` / `Las contraseñas no coinciden.`                                                              | —                     |

Ambos campos de contraseña comparten `autocomplete="new-password"`, que es lo
que espera un gestor de contraseñas para el par de alta.

**Política de contraseña: mínimo 8 caracteres, sin reglas de composición** (ni
mayúscula, ni dígito, ni símbolo). Las reglas de composición no aumentan la
entropía real y empujan a patrones predecibles (`Password1!`); la longitud es la
medida que sí importa y cabe en una línea de ayuda. El máximo de 128 protege el
hasheo futuro (ver §11).

**Normalización:** `trim` en usuario, nombre, apellido y correo. **Nunca** en la
contraseña: los espacios son válidos. El correo se compara en minúsculas, de
modo que `Ana@Correo.com` y `ana@correo.com` son la misma cuenta.

**Correo sin dominio institucional:** no hay dominio institucional definido en el
proyecto, así que la validación es de **formato**, no de dominio. El placeholder
es deliberadamente genérico para que no se lea como una regla.

## 5. Copy completo

| Elemento                    | `/login`                                                                    | `/register`                                                       |
| --------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| H1                          | `Iniciar sesión`                                                            | `Crear cuenta`                                                    |
| Subtítulo                   | `Accede a Red FaCyT para publicar y consultar información de la facultad.`  | `Regístrate para publicar y consultar información de la facultad.` |
| Botón                       | `Iniciar sesión`                                                            | `Crear cuenta`                                                    |
| Botón (enviando)            | `Iniciando sesión…`                                                         | `Creando cuenta…`                                                 |
| Enlace de la tarjeta        | `¿No tienes cuenta?` + `Regístrate`                                         | `¿Ya tienes cuenta?` + `Inicia sesión`                            |
| Enlace inferior             | `Volver a la bienvenida`                                                    | `Volver a la bienvenida`                                          |
| Error de servidor (login)   | `El usuario o la contraseña no coinciden.`                                  | —                                                                 |
| Error de servidor (registro)| —                                                                           | `No pudimos crear la cuenta. Intenta de nuevo.`                   |
| Éxito                       | redirige a `/dashboard`                                                    | redirige a `/dashboard` (con sesión iniciada)                      |

Voz de la interfaz (`brief.md` §6): frases cortas, sin disculpas, sin
"Ha ocurrido un error". El mensaje de credenciales **no** distingue usuario
inexistente de contraseña incorrecta, para no permitir enumerar cuentas.

**Sin "Recordarme":** la sesión con expiración es el comportamiento por defecto
correcto; una sesión persistente sin explicación explícita sería un riesgo.

## 6. Estados

| Estado                                 | Comportamiento                                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vacío                                  | Tarjeta con placeholders de ejemplo, sin errores visibles. El botón está habilitado: **se valida al enviar**, no al escribir.                                                                                                        |
| Focus                                  | Anillo `2px --accent` con `2px offset` (global en `globals.css`, `accessibility.md` §2). El campo toma borde `--text-muted` (§8.3).                                                                                                      |
| Error inline                           | Borde `--danger` + `AlertTriangleIcon` + mensaje `--danger` de 14px debajo del campo, y `aria-invalid="true"`.                                                                                                                          |
| Resumen de errores                     | Con **2 o más** errores: caja encima del primer campo, `role="alert"`, `tabIndex={-1}`, recibe el foco, y cada ítem es un botón que enfoca su campo. Con **un** error, solo el inline.                                          |
| Enviando                               | `<form aria-busy="true">`, botón `disabled` (opacity 60), `enterKeyHint` desactivado y guarda anti doble envío en el handler. **Sin spinner**: el cambio de etiqueta más `aria-busy` comunican el estado y funcionan con `prefers-reduced-motion` (la regla global de `globals.css` congela cualquier animación). |
| Credenciales inválidas                 | Caja `role="alert"` encima, foco movido a ella, `aria-invalid` en los campos, **usuario conservado y contraseña vaciada** (§11.1).                                                                                                      |
| Error de validación en registro        | Se conservan **todos** los valores escritos: reescribir cinco campos por un error de tecleo es más costoso que el riesgo de que queden a la vista.                                                                                    |
| Éxito                                  | `router.replace("/dashboard")` — `replace`, no `push`: `/login` no debe quedar en el historial del navegador.                                                                                                                        |
| Navegación `/login` ↔ `/register`      | Enlace `<a>` real con `prefetch`. El formulario se desmonta al navegar, así que **no** se conserva lo escrito; el copy no promete lo contrario.                                                                                        |

**Momento de la validación:** al enviar. Después del primer envío fallido, cada
campo revalida en `blur`; nunca en cada tecla.

## 7. Accesibilidad (WCAG 2.2 AA)

Detalle en [`accessibility.md`](accessibility.md); lo específico de estas
pantallas:

- `<form noValidate>`: los mensajes nativos del navegador dependen del locale y
  no se pueden estilar. Los errores los produce la aplicación.
- Cada `<label for>` visible y asociado a su input.
- `aria-describedby` apunta a la ayuda de contraseña (`Mínimo 8 caracteres.`) y
  al mensaje de error cuando existe; ids únicos y estables.
- El error es texto más icono, **nunca** solo color (SC 1.4.1).
- Orden de tabulación = orden visual. Un solo botón de envío; los enlaces van
  después del botón.
- Objetivo táctil ≥ 44px: campos `min-h-11`, botones lo garantizan con
  `BUTTON_BASE_CLASSES` de `components/ui/button.tsx`.
- El resumen de errores es el primer elemento enfocable tras el H1 y recibe el
  foco al enviar.
- Zoom al 400% y reflow a 320px sin scroll horizontal.

## 8. Tokens y contraste

### 8.1 Tokens: `globals.css` es la fuente de verdad

Estas pantallas **no introducen tokens nuevos para el formulario**. Todo lo que
necesitan ya está definido en `src/app/globals.css`: nada de hex sueltos en los
componentes y nada que haya que propagar a otras vistas, porque los tokens ya
son globales.

La jerarquía de color, tal como está definida en `docs/design/brief.md` §3 y
respetada por `globals.css`:

| Rol            | Token         | Significado                                        |
| -------------- | ------------- | -------------------------------------------------- |
| Identidad      | `--primary`     | Azul institucional. Encabezados, insignias, marca     |
| **Acción**     | `--accent`      | **Ámbar. CTA principal y estados activos**            |
| Enlaces        | `--accent-teal` | Cian. Enlaces y texto resaltado                      |
| Texto          | `--text` / `--text-muted` | Contenido y contenido secundario         |
| Error          | `--danger`      | Mensajes de validación                               |

> [!IMPORTANT]
> **El ámbar no es el color primario.** Lo primario es `--primary` (azul
> institucional). El ámbar es el acento de acción, y por eso vive en el botón de
> envío, nunca en el fondo ni en el marco de la tarjeta. Confundir ambos es lo
> que dejó `--accent` con un valor azul en `globals.css` mientras la pantalla de
> bienvenida lo pintaba de ámbar a mano.

### 8.2 Contraste verificado

Ratios calculados sobre los valores reales de `globals.css`.

| Elemento                      | Token                                                     | Ratio   | Cumple         |
| ----------------------------- | --------------------------------------------------------- | ------- | -------------- |
| H1 y labels sobre la tarjeta  | `--text` #172033 sobre `--surface` #FFFFFF                | 16.27:1 | AAA            |
| Subtítulo, ayuda, placeholder | `--text-muted` #51607A sobre #FFFFFF                      | 6.36:1  | AA             |
| Texto del botón de envío      | `--accent-foreground` #0B1220 sobre `--accent` #D97706     | 5.88:1  | AA             |
| Enlaces                       | `--accent-teal` #0369A1 sobre `--surface` #FFFFFF         | 5.93:1  | AA             |
| Mensajes de error             | `--danger` #B91C1C sobre `#FFFFFF`                         | 6.47:1  | AA             |
| Anillo de foco                | `--accent` #D97706 sobre `--surface` #FFFFFF               | 3.19:1  | AA (SC 2.4.11) |
| **Borde de campo**            | `--text-muted` #51607A sobre `--surface` #FFFFFF            | 6.36:1  | AA (SC 1.4.11) |
| Borde de campo, modo oscuro   | `--text-muted` #93A1BC sobre `--surface` #131C31            | 6.51:1  | AA (SC 1.4.11) |
| Borde de tarjeta y divisor    | `--border` #D8DEEA sobre `--surface` #FFFFFF                | 1.35:1  | Decorativo, exento |

Dos ratios que conviene no dar por buenos sin comprobarlos:

- **El texto del botón es oscuro, nunca blanco.** El ámbar es un tono medio en
  ambos temas, así que `#FFFFFF` sobre `--accent` #D97706 da **3.19:1** y
  fallaría. De ahí que `--accent-foreground` sea `#0B1220` en claro y en oscuro.
- **El anillo de foco queda justo.** 3.19:1 cumple el 3:1 de SC 2.4.11, pero sin
  margen. Por eso el anillo no se apoya solo en `--accent`: el botón y los
  enlaces además cambian de tono al recibir foco, de modo que el estado es
  perceptible más allá del color del contorno.

Modo oscuro: `--text` #E6EAF2 sobre `--surface` #131C31 da 14.07:1,
`--accent-foreground` #0B1220 sobre `--accent` #F59E0B da 8.72:1 y
`--accent-teal` #38BDF8 sobre #131C31 da 7.92:1. Todos AA.

### 8.3 Por qué el borde de campo no usa `--border`

`--border` da **1.35:1** contra `--surface`, muy por debajo del 3:1 que SC 1.4.11
exige a la frontera que permite identificar un control. El borde de un input no
es decorativo: sin él no se sabe dónde termina el campo.

La solución **no es un token nuevo** (la paleta está cerrada y ya es global),
sino reutilizar `--text-muted`, que en ambos temas cumple con holgadura:

- `border-color: var(--text-muted)` en los campos.
- En error, `border-color: var(--danger)` (6.47:1) más `AlertTriangleIcon` y el
  texto de error, para que el estado no dependa solo del color.
- `--border` se reserva para el marco de la tarjeta y el divisor, que sí son
  decorativos y están exentos.

### 8.4 Los únicos dos tokens añadidos, y por qué

`globals.css` ya traía `--accent-foreground`; en este trabajo se ajustan sus
valores y se añade `--accent-teal`. Ninguno de los dos es una invención para
este par de pantallas: los dos están en la paleta de `brief.md` §3 y en
`components.md` §1.

- `--accent-foreground` #0B1220 en ambos temas, porque el ámbar es tono medio en
  ambos y el blanco no llega a 4.5:1 (§8.2).
- `--accent-teal` #0369A1 / #38BDF8 para los enlaces. El valor claro del brief es
  `#0284C7`, que da 4.10:1 sobre blanco; se oscurece a `#0369A1` (5.93:1)
  conservando el tono. El oscuro del brief se usa tal cual.

**No** se crea `--border-strong` ni ningún token para el borde de los campos: eso
se resuelve reutilizando `--text-muted` (§8.3).

## 9. Guía de archivos para el developer

> [!NOTE]
> `src/app/globals.css` **ya está corregido**: `--accent` es ámbar,
> `--accent-foreground` es oscuro en ambos temas y `--accent-teal` existe. El
> developer no debe volver a tocarlo; solo consumir los tokens.

| Archivo                                                | Acción                 | Responsabilidad                                                                                     |
| ------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------- |
| `src/app/(auth)/layout.tsx`                             | crear                  | Shell aislado: marca + `ThemeToggle` + `<main>` centrado + `Footer`                                   |
| `src/app/(auth)/login/page.tsx`                         | reemplazar placeholder | Metadata + `<LoginForm/>`; Server Component                                                            |
| `src/app/(auth)/register/page.tsx`                      | reemplazar placeholder | Metadata + `<RegisterForm/>`; Server Component                                                         |
| `src/components/ui/field.tsx`                           | crear                  | `Field`: label + input + slots de ayuda y error, con `aria-describedby` cableado                      |
| `src/components/ui/form-alert.tsx`                      | crear                  | Caja de error y resumen: `role="alert"`, `tabIndex={-1}`, ítems que enfocan su campo                 |
| `src/components/forms/login-form.tsx`                   | crear                  | Cliente: estado, validación, envío, `noValidate`, guarda anti doble envío                              |
| `src/components/forms/register-form.tsx`                | crear                  | Cliente: lo anterior más la coincidencia de contraseñas                                               |
| `src/components/auth/auth-guard.tsx`                    | crear                  | Cliente: si hay sesión, `router.replace("/dashboard")`                |
| `src/components/ui/icons.tsx`                           | modificar              | Añadir `AlertTriangleIcon` con el patrón existente (SVG propio, sin emoji)                             |
| `src/lib/validation/auth.ts`                            | crear                  | Validadores **puros** por campo y `validateLogin` / `validateRegister`, con los mensajes de §4         |
| `src/lib/auth/auth-gateway.ts`                          | crear                  | Interfaz: `signIn`, `signUp`, `getSession`, `signOut`                                                 |
| `src/lib/auth/auth-gateway.static.ts`                   | crear                  | Adaptador de fase estática sobre `src/data/users.ts`; persiste la sesión en `localStorage`            |
| `src/data/users.ts`, `src/data/session.ts`               | crear                  | Mock con la forma del modelo futuro                                                                  |
| `src/app/globals.css`                                    | ya corregido          | `--accent` ámbar, `--accent-foreground` oscuro en ambos temas y `--accent-teal` añadido. **No volver a tocarlo** (§8.4) |
| `src/__tests__/routes.smoke.test.tsx`                    | modificar              | Hoy afirma que `/login` y `/register` son placeholders                                                |
| `docs/design/wireframes.md` §2.1 y §2.2                  | ya aplicado            | Punteros a `wireframes_welcome.md` y `wireframes_auth.md`                                             |
| `docs/architecture/frontend-structure.md` L117           | pendiente de OK        | La tabla de rutas lista el rol en el registro (§10.2)                                                  |
| `docs/architecture/progress.md`                          | al cerrar              | Marcar el avance de la fase de diseño                                                                  |

**Por qué `auth-gateway`:** hoy es un mock y mañana será Better Auth. Si el
formulario llama a `signIn` a través de una interfaz, el día del backend solo
cambia la implementación, que es la forma que ya exige el patrón repositorio de
`frontend-structure.md`. Sin esta capa, la lógica de autenticación queda
incrustada en el componente y el cambio es una reescritura.

**Tests (TDD, colocated, umbral ≥ 80% del gate de Husky):**
`src/lib/validation/auth.test.ts` cubriendo cada campo y cada mensaje; su
cobertura debe llegar al 100% por ser lógica pura. `login-form.test.tsx` y
`register-form.test.tsx` para render, error inline, resumen con dos o más
errores, estado enviando y recorrido de teclado. `auth-guard.test.tsx` para la
redirección.

## 10. Decisiones de diseño y sus justificaciones

### 10.1 Login por `usuario`, no por correo

Requisito acordado. El correo queda como identidad de contacto y campo de
registro; el identificador de acceso es el nombre de usuario. En el backend
ambos deben ser únicos e independientes entre sí.

### 10.2 El registro no ofrece selector de rol

El registro público crea usuarios con rol `coordinador` (por defecto en Better
Auth); `aprobador` y `admin_sistema` los asigna un administrador del sistema
desde `/admin`, cuya única función es precisamente asignar roles
(`implementation_base.md` §3).

Justificación: el enunciado exige diferenciar roles con responsabilidades
distintas (`docs/PIVOT-enunciado-control-de-proyectos-quimicos.md`), y un
selector abierto en el registro público permite autoasignarse permisos. Es
además menos superficie de UI y de validación.

**Consecuencia:** la tabla de rutas de `frontend-structure.md` L117 ya no lista
"rol Estudiante/Profesor" en `/register`; se corrigió a nombre, apellido, correo
y contraseña. El `wireframes.md` §2.2 anterior, que preveía el selector, está
reemplazado por `wireframes_auth.md`.

### 10.3 Sin "Recordarme"

Requisito acordado. La sesión con expiración es el comportamiento correcto por
defecto.

### 10.4 Sin "¿Olvidaste tu contraseña?"

`wireframes.md` §2.2 ya lo declaraba fuera del MVP: sin backend de email el
enlace es un callejón sin salida. `implementation_base.md` §Auth sí lo pide, así
que queda **registrado como pendiente de backend**, no como descartado.

### 10.5 Confirmar contraseña, no medidor de fuerza

El requisito fue explícito, y un medidor es exactamente el tipo de ornamento que
este diseño rechaza. La ayuda de longitud hace el trabajo.

### 10.6 El borde de campo reutiliza `--text-muted`

`--border` se queda en 1.35:1 y no identifica un control (SC 1.4.11), así que
los campos usan `--text-muted`, que ya existe y cumple en ambos temas. Es una
corrección de cumplimiento hecha sin tocar la paleta ni añadir tokens (§8.3).

### 10.7 Sin spinner en el estado enviando

La etiqueta cambia a `Iniciando sesión…` y el formulario pasa a `aria-busy`.
Comunica igual de bien, no se rompe con `prefers-reduced-motion` y no añade ni
un icono ni una animación permanente.

### 10.8 Correo sin dominio institucional

`brief.md` no define dominio y el proyecto todavía no tiene correo
institucional. La validación es de formato; el placeholder `nombre@correo.com`
es deliberadamente genérico para que no se lea como regla.

### 10.9 Navegación entre pantallas sin conservar el formulario

Al ser enlaces que desmontan el componente, lo escrito no sobrevive. Se acepta:
evita estado global y pasar datos por la URL, que es donde sería peligroso.

### 10.10 `--accent` vuelve a ser ámbar (colisión de nombres)

`globals.css` tenía `--accent: #2563EB`, un azul, mientras `brief.md` §3 define
`--accent` como el **ámbar** de los CTA y la pantalla de bienvenida lo pintaba a
mano con `bg-amber-500`. El nombre del token y su valor no coinciden. Dos
superficies pintadas a mano y un token con el nombre correcto y el valor
equivocado: el resultado era que el botón de auth habría salido azul y la
portada ámbar.

Decisión: `--accent` vuelve a ser ámbar (`#D97706` / `#F59E0B`) y `--primary`
recupera su papel real de azul institucional. Beneficio adicional: el anillo de
foco global de `globals.css` pasa a ámbar y deja de discrepar del
`focus-visible:ring-amber-500` que la portada sí usa.

**Pendiente de otro commit:** la portada sigue pintando `amber-500` y `slate-*` a
mano en lugar de usar los tokens. El resultado visual es equivalente (la portada
es siempre oscura y `amber-500` es exactamente el valor oscuro del token), pero
es duplicación que conviene eliminar.

## 11. Seguridad

### 11.1 Medidas de la fase estática (las implementa el developer)

- **La contraseña nunca se almacena en texto plano.** `src/data/users.ts` guarda
  credenciales **ficticias** y el archivo se rotula como mock. El enunciado lo
  exige (`docs/PIVOT-enunciado-control-de-proyectos-quimicos.md`) y se cumple de
  verdad cuando llegue el backend (§11.2).
- **Ningún registro de credenciales.** Ni `console.log` del formulario, ni volcado
  de props en un error boundary, ni trazas de Server Actions con el cuerpo de la
  petición.
- **Los mensajes de error se renderizan como texto**, nunca con
  `dangerouslySetInnerHTML`: un mensaje de validación es contenido, no HTML.
- **La contraseña no viaja a la URL ni al almacenamiento del navegador.** El
  envío es por `POST`; en `localStorage` solo se guarda la sesión.
- **Tras un intento fallido en `/login` el campo de contraseña se vacía** y el
  de usuario se conserva: no queda escrita a la vista en un equipo compartido,
  y el usuario solo tiene que recargar el campo sensible. En `/register` se
  conservan todos los valores, porque el error suele ser de tecleo y obligar a
  reescribir cinco campos es más costoso (§6).
- **Máximo de 128 caracteres** en la contraseña, para que un envío enorme no
  pueda usarse para denegar servicio contra el hasheo.
- **`trim` en los campos no secretos y nunca en la contraseña.**
- **Correo normalizado a minúsculas y unicidad sin distinguir mayúsculas**, para
  que dos registros visualmente distintos no creen cuentas duplicadas.
- **Mensaje de credenciales genérico**, que no permite enumerar usuarios
  existentes.
- **`autocomplete` y `name` correctos** en todos los campos: los gestores de
  contraseñas dependen de ellos y, mal puestos, ofrecen guardar una contraseña
  en el sitio equivocado.
- **Cero peticiones a terceros** en las pantallas de auth: sin fuentes, scripts
  ni analítica externas que puedan capturar credenciales por referrer o por red.
  red.
- **La sesión mock contiene solo `{ id, username, role }`**, nunca la contraseña.

### 11.2 Transición de seguridad al backend (contrato, no implementado)

Cuando llegue Better Auth y PostgreSQL, el mismo `auth-gateway` debe cumplir:

- **Hashing:** argon2id (o bcrypt con coste ≥ 12) con sal por usuario;
  almacenamiento no reversible.
- **Comparación en tiempo constante**, y un hash señuelo cuando el usuario no
  existe, para que el tiempo de respuesta no revele si la cuenta está
  registrada.
- **Rate limiting** por IP y por usuario, con backoff exponencial y bloqueo tras
  varios intentos fallidos.
- **Cookie de sesión `httpOnly` + `Secure` + `SameSite`**, con rotación del
  identificador al iniciar sesión e invalidación al cerrar sesión.
- **Protección CSRF** en las peticiones que cambien estado.
- **Revalidación en el servidor de todas las reglas** de §4: la validación del
  cliente es experiencia de usuario, nunca control de acceso.
- **Índices únicos** sobre `lower(username)` y `lower(email)`.
- **Cero credenciales en los logs**, con redacción explícita de los campos
  sensibles en cualquier middleware de observabilidad.

### 11.3 Nota honesta sobre la sesión de la fase estática

La sesión ficticia vive en `localStorage` (`facy:session`) porque es lo único
disponible sin backend. **No es un modelo de seguridad**: es legible por
JavaScript, es persistente entre cierres de navegador y se puede manipular desde
la consola. Sirve para poder navegar por `(main)` durante el desarrollo, y nada
más. Toda lectura pasa por `auth-gateway`, que es la misma interfaz que usará
Better Auth, de modo que el cambio al modelo real no toque las pantallas.
