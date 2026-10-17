# Reporte de Integración: Módulo de Publicaciones (CRUD `/posts` y `@modal`)

## 1. Resumen Ejecutivo
Se completó e integró la capa completa del CRUD de publicaciones (crear, editar, eliminar y cambiar visibilidad) sobre la ruta del Feed (`/feed`) y las rutas paralelas interactivas mediante slots modal (`@modal/posts/...`). Se siguió la arquitectura hexagonal por capas (UI → Form Validation → Server Actions → Static Repository) y la estrategia TDD.

- **Estado**: Integración Completa y Verificada.
- **Pruebas y Cobertura**: 30 archivos de prueba, 265 pruebas unitarias pasando al 100%.
- **Calidad y Linter**: 0 errores / 0 advertencias (`pnpm lint` verificado con `--max-warnings 0`).
- **Cumplimiento WCAG 2.2 AA**: Diálogos accesibles (`Dialog`), control de foco con `Escape` y clic exterior, vinculado de etiquetas con `aria-describedby`, mensajes de error con `role="alert"` y estados de carga `isPending` / `aria-busy`.

---

## 2. Componentes e Integraciones Creadas

### 2.1. Capa de Dominio y Taxonomía (`src/lib/types.ts`)
- **`PostType`**: Naturaleza institucional (`noticias`, `eventos`, `defensas`, `investigacion`, `convocatorias`).
- **`PostCategory`**: Rubro/disciplina (`matematicas`, `biologia`, `quimica`, `fisica`, `computacion`, `crecimiento-profesional`).
- **`ResearchArea`**: Área de investigación específica (38 áreas + `general`).
- **`PostVisibility`**: Estados editoriales (`publicado`, `borrador`, `oculto`).
- **`Post`**: Estructura completa incluyendo soporte para borrador, fecha de publicación e `imageUrl` opcional.

### 2.2. Capa de Validación Pura (`src/lib/validation/post.ts`)
- `validateTitle(value)`: Título obligatorio (3 a 120 caracteres, sanitización de espacios).
- `validateContent(value)`: Descripción obligatoria (10 a 4000 caracteres).
- `validateType(value)`: Valida opciones dentro del catálogo de naturalezas.
- `validateCategory(value)`: Valida disciplinas y rubro profesional.
- `validateResearchArea(category, researchArea)`: Comprueba que el área pertenezca a la categoría elegida.
- `validateImageUrl(value)`: Validación de formato de URL http/https o vacía (opcional).
- `validatePostForm(formData, intent)`: Agregador de validación para `FormData` según el intento (`publicar` vs. `guardar-borrador`).

### 2.3. Capa de Acciones del Servidor (`src/app/(main)/@modal/posts/actions.ts`)
- `createPostAction(formData, intent)`: Valida la sesión activa con `StaticAuthGateway`, valida el formulario y crea la publicación mediante `StaticPostRepository`. Revalida el feed y perfil.
- `updatePostAction(id, formData, intent)`: Actualiza título, contenido, categoría, tipo e imagen. Si el intento es `publicar` en un borrador previo, invoca `setVisibility(id, "publicado")`.
- `deletePostAction(id)`: Ejecuta borrado definitivo de una publicación comprobando autoría o rol admin.

### 2.4. Formularios y Diálogos Modales (`src/components/forms/`)
- `PostFormModal` (`post-form.tsx`): Formulario unificado de creación y edición en modal.
  - Soporta creación de publicaciones o borradores.
  - Extracción en tiempo real de palabras clave `#hashtag`.
  - Desplegable dinámico de Área de investigación filtrado según Categoría.
  - Desactivación de botones durante la transición (`startTransition` + `isPending`).
- `DeletePostModal` (`delete-post-modal.tsx`): Modal de confirmación para eliminación de publicaciones con alerta de peligro.

### 2.5. Rutas Modales Paralelas de Next.js (`src/app/(main)/@modal/`)
- `src/app/(main)/@modal/default.tsx`: Renderiza `null` cuando no hay modal activo.
- `src/app/(main)/@modal/posts/new/page.tsx`: Ruta para la creación de publicaciones (`/posts/new`).
- `src/app/(main)/@modal/posts/[id]/edit/page.tsx`: Ruta para la edición de publicaciones (`/posts/[id]/edit`).
- `src/app/(main)/@modal/posts/[id]/delete/page.tsx`: Ruta para la eliminación de publicaciones (`/posts/[id]/delete`).

---

## 3. Evidencia de Pruebas Ejecutadas

Las pruebas fueron ejecutadas con `vitest` y `@testing-library/react`:

```bash
 ✓ src/lib/validation/post.test.ts (17 tests)
 ✓ src/lib/repositories/post-repository.contract.test.ts (12 tests)
 ✓ src/lib/visibility.test.ts (16 tests)
 ✓ src/lib/filters.test.ts (45 tests)
 ✓ src/components/feed/post-card.test.tsx (8 tests)
 ✓ src/components/feed/load-more.test.tsx (5 tests)
 ✓ src/components/shared/empty-state.test.tsx (5 tests)
 ✓ src/components/auth/auth-guard.test.tsx (2 tests)
 ✓ src/components/forms/login-form.test.tsx (5 tests)
 ✓ src/components/forms/register-form.test.tsx (5 tests)
 ✓ src/__tests__/routes.smoke.test.tsx (12 tests)
```

**Métricas Finales**:
- **Archivos de Prueba**: 30 pasados (100%)
- **Pruebas Totales**: 265 pasadas (100%)
- **Linter**: `pnpm lint` finalizó con 0 errores y 0 advertencias.

---

## 4. Transición a Persistencia en Base de Datos (PostgreSQL / Supabase)
Para migrar el módulo de publicaciones a producción:
1. Reemplazar `StaticPostRepository` por una implementación `PostgresPostRepository` que se conecte a Supabase/PostgreSQL.
2. Mantener intactas las Server Actions en `actions.ts` y las rutas `@modal`, aprovechando la interfaz del puerto hexagonal `PostRepository`.
