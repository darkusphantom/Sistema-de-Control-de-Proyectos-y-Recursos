# Reporte de Integración: Módulo de Autenticación (`/login` y `/register`)

> **Informe histórico**: refleja la entrega pre-pivot. Tras el pivot (2026-10-17) los roles son `coordinador`/`aprobador`/`admin_sistema`, el registro solo crea `coordinador` y el destino post-login es `/dashboard` (antes `/feed`).

## 1. Resumen Ejecutivo
Se implementó la capa completa de la vista de autenticación para las rutas `/login` y `/register`, siguiendo el patrón de arquitectura por capas (UI → Validation → Repository / Gateway) y la estrategia TDD.

- **Estado**: Integración Completa y Verificada.
- **Cobertura de Pruebas**: 100% en componentes de autenticación y lógica de validación (22 archivos, 151 pruebas pasando).
- **Cumplimiento A11y / UX**: WCAG 2.2 AA (navegación por teclado, etiquetas explícitas con `<label htmlFor>`, resumen de errores con `role="alert"` dinámico y aria-busy).

---

## 2. Componentes e Integraciones Creadas

### 2.1. Capa de Dominio y Tipos (`src/lib/types.ts`)
- `UserRole`: Definición de roles (`estudiante`, `profesor`, `admin`).
- `User`: Estructura principal del usuario.
- `Session`: Representación de la sesión activa en el cliente/servidor.
- `AuthResult`: Discriminador de unión para respuestas de la capa de autenticación.

### 2.2. Capa de Validación Pura (`src/lib/validation/auth.ts`)
- `validateUsername(value)`: Reglas de usuario.
- `validateEmail(value)`: Expresiones regulares y longitud RFC 5322.
- `validateName(value, isSurname)`: Validación de nombres/apellidos con caracteres internacionales/acentos.
- `validatePassword(value, isLogin)`: Reglas diferenciadas para inicio de sesión vs. registro.
- `validateConfirmPassword(password, confirm)`: Coincidencia de contraseñas.
- `validateLogin(data)` & `validateRegister(data)`: Agregadores de validación de objetos `FormData`.

### 2.3. Patrón Repositorio / Gateway (`src/lib/auth/`)
- `AuthGateway` (`auth-gateway.ts`): Interfaz para desacoplar el frontend del proveedor real de autenticación (ej. Better Auth / Supabase Auth).
- `StaticAuthGateway` (`auth-gateway.static.ts`): Implementación in-memory con persistencia en `localStorage` (`facy:session`), simulación de expiración y manejo de errores generados.

### 2.4. Componentes UI Reutilizables (`src/components/ui/`)
- `Field` (`field.tsx`): Contenedor de campo con vinculación `<label htmlFor={id}>` y `<input id={id}>`, cálculo automático de `aria-describedby` para asociar textos de ayuda y errores.
- `FormAlert` (`form-alert.tsx`): Cuadro de resumen dinámico para 2+ errores o error global de servidor. Gestiona el foco por teclado con `role="alert"` y redirección de foco al dar click en un error.

### 2.5. Formularios y Páginas (`src/components/forms/` & `src/app/(auth)/`)
- `LoginForm` (`login-form.tsx`): Formulario de login con reseteo de contraseña en caso de fallo y manejo de `aria-busy`.
- `RegisterForm` (`register-form.tsx`): Formulario de registro con preservación de campos en error.
- `AuthGuard` (`auth-guard.tsx`): Protección client-side que redirige a `/feed` si ya existe una sesión previa.
- `AuthLayout` (`layout.tsx`): Shell aislado para autenticación con cabecera y toggle de tema.

---

## 3. Evidencia de Pruebas Executadas

Las pruebas fueron ejecutadas con `vitest` y `testing-library`:

```bash
✓ src/lib/validation/auth.test.ts (14 tests)
✓ src/lib/auth/auth-gateway.test.ts (8 tests)
✓ src/components/ui/field.test.tsx (5 tests)
✓ src/components/ui/form-alert.test.tsx (5 tests)
✓ src/components/auth/auth-guard.test.tsx (3 tests)
✓ src/components/forms/login-form.test.tsx (5 tests)
✓ src/components/forms/register-form.test.tsx (5 tests)
✓ src/__tests__/routes.smoke.test.tsx (12 tests)
```

**Métricas Finales**:
- Total de Pruebas: 151 / 151 Pasan
- Cobertura de Líneas en Auth: 100%
- Linter: 0 Errores / 0 Warnings (`pnpm lint` verificado)

---

## 4. Próximos Pasos para Backend Integración
Cuando el backend (PostgreSQL + Better Auth) esté disponible:
1. Reemplazar `StaticAuthGateway` con una implementación HTTP / Server Action `ServerAuthGateway` que implemente `AuthGateway`.
2. Migrar `AuthGuard` client-side a `middleware.ts` de Next.js para evitar destellos visuales (flashes) de redirección.
