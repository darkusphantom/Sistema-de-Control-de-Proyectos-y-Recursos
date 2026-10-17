# Wireframes — Autenticación `/login` y `/register` (Red FaCyT)
> **Pivot 2026-10-17**: la identidad visual se rediseña en la Fase 2 (estilo Apple, `docs/pivot-project.md` §8); los tokens y el copy de este documento quedan **pendientes de rediseño**, mientras que estructura, estados y accesibilidad siguen vigentes.

Esquemas de las dos pantallas públicas del route group `(auth)`. El mapa de
navegación y los esquemas de las demás pantallas viven en
[`wireframes.md`](wireframes.md); los de la bienvenida, en
[`wireframes_welcome.md`](wireframes_welcome.md).

Especificación completa (campos, copy, estados, accesibilidad, seguridad) en
[`auth.md`](auth.md).

## 1. Decisión de alcance: el registro no ofrece selector de rol

> [!IMPORTANT]
> `/register` **no** muestra un selector de rol. El registro público crea
> usuarios con rol `estudiante`; los roles `profesor` y `admin` los asigna un
> administrador desde `/admin`.
>
> Sustituye al selector Estudiante/Profesor que figuraba en el
> `wireframes.md` §2.2 anterior. Justificación: el enunciado solo exige
> diferenciar usuario común de usuario con funciones de administración
> (`Proyecto1_Junio2026.md` §a), y un selector abierto en el registro público
> permite autoasignarse permisos.

Los wireframes de ambas pantallas son **mobile-first**: el bloque de formulario
va centrado con `max-width` 400px y los campos en una sola columna.

## 2. `/login` — Iniciar sesión (público)

```
┌───────────────────────────────┐
│  FaCyT                  [🌙]  │  ← marca + ThemeToggle (sin "Omitir")
├───────────────────────────────┤
│                               │
│   ┌───────────────────────┐   │
│   │ Iniciar sesión        │   │  ← serif h2
│   │ Accede a Red FaCyT    │   │  ← text-muted
│   │ ───────────────────── │   │  ← divider --border
│   │ Usuario               │   │  ← label visible
│   │ [                  ]  │   │
│   │ Contraseña            │   │
│   │ [                  ]  │   │
│   │ [ Iniciar sesión ]    │   │  ← accent (ámbar), ancho completo
│   │ ¿No tienes cuenta?    │   │
│   │ Regístrate            │   │  ← link accent-teal (cian)
│   └───────────────────────┘   │
│                               │
│   Volver a la bienvenida      │  ← link ghost, → /
│                               │
├───────────────────────────────┤
│  © 2026 FaCyT                 │  ← Footer
└───────────────────────────────┘
```

### 2.1 Con credenciales inválidas

La tarjeta crece hacia arriba: el aviso aparece **entre el divisor y el primer
campo**, y el campo de contraseña queda vacío (el usuario se conserva).

```
│   ┌───────────────────────┐
│   │ Iniciar sesión        │
│   │ Accede a Red FaCyT    │
│   │ ───────────────────── │
│   │ ⚠ El usuario o la     │   ← role="alert", borde --danger
│   │   contraseña no       │   ← texto --danger, 14px
│   │   coinciden.          │
│   │ ───────────────────── │
│   │ Usuario               │
│   │ [j.rivas           ]  │
│   │ Contraseña            │
│   │ [                  ]  │  ← campo vacío tras el error
│   │ [ Iniciar sesión ]    │
```

### 2.2 Enviando

```
│   │ [ Iniciando sesión… ] │   ← botón disabled, opacity-60, sin spinner
```

## 3. `/register` — Crear cuenta (público)

```
│   ┌───────────────────────┐
│   │ Crear cuenta          │
│   │ Regístrate para       │
│   │ publicar y consultar  │
│   │ información de la     │
│   │ facultad.             │
│   │ ───────────────────── │
│   │ ⚠ Revisa 2 campos:    │   ← resumen, solo con 2+ errores
│   │ • Escribe tu correo   │   ← cada ítem enfoca su campo
│   │ • Las contraseñas     │
│   │   no coinciden        │
│   │ Nombre                │
│   │ [                  ]  │
│   │ Apellido              │
│   │ [                  ]  │
│   │ Correo                │
│   │ [                  ]  │
│   │ Contraseña            │
│   │ [                  ]  │
│   │ Mínimo 8 caracteres.  │  ← ayuda, siempre visible
│   │ Confirmar contraseña  │
│   │ [                  ]  │
│   │ [ Crear cuenta ]      │
│   │ ¿Ya tienes cuenta?    │
│   │ Inicia sesión         │
│   └───────────────────────┘
```

Con un único error, el resumen **no** aparece: el mensaje va inline bajo su
campo. Tras un error de validación se conservan todos los valores escritos.

## 4. Notas de escritorio

- **≥ 768px:** tarjeta de 400px centrada en la pantalla; el resto idéntico al
  móvil. **No** se ponen nombre y apellido en dos columnas: mantiene un ancho de
  línea cómodo y evita saltos de tabulación entre campos contiguos.
- **≥ 1024px:** sin cambios. La pantalla no gana nada con más espacio; se
  aprovecha el vertical.
- El layout de `(auth)` es independiente del shell `(main)`: marca + tema
  arriba, `<main>` centrado, `Footer` abajo. Sin `Navbar`, `Sidebar` ni
  `BottomNav`.
