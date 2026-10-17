# Joyas de la Corona — Sistema de Control de Proyectos y Recursos

Documento rector de seguridad. Identifica los **activos críticos** de la plataforma (las "joyas de la corona") y define qué protecciones son **obligatorias** y **prioritarias** sobre cada uno. Cualquier decisión de seguridad (diseño, implementación, revisión o auditoría) se prioriza según este documento.

> **Regla**: si un cambio afecta a un activo de prioridad **P0/P1**, la revisión de seguridad es obligatoria antes de integrar. Los agentes `security-architect`, `blue-team`, `red-team` y `security-reviewer` operan sobre esta jerarquía.
>
> **Nota tras el pivot (2026-10-17)**: los activos del dominio de publicaciones (Red FaCyT) fueron eliminados y sustituidos por los del control de proyectos. Esta versión es una **actualización provisional**; el modelo de amenaza completo del nuevo dominio (proyectos, inventario, equipos, solicitudes, prorrateo, auditoría) lo revisa `security-architect` en la **Fase 2** del pivot. El modelo histórico está en [`docs/archive/`](../archive/) y el de la API en [`threat-model-api.md`](threat-model-api.md).

---

## 1. Modelo de amenaza (resumen)

| Actor | Motivación | Superficie principal |
| --- | --- | --- |
| Internet / atacante externo | Robo de credenciales, defacement, DoS, exfiltración de datos financieros | Login, registro, endpoints públicos, reportes |
| Usuario autenticado malicioso | Escalada de privilegios, IDOR sobre proyectos/solicitudes ajenas, manipulación de aprobaciones | Solicitudes de gasto, despachos, administración, perfiles |
| Insider (coordinador/aprobador/admin comprometido) | Manipulación de presupuestos, prioridades o bitácoras; desvío de recursos | Panel admin, prorrateo, auditoría |
| Bots automatizados | Fuerza bruta, creación masiva de cuentas | Registro, login |

---

## 2. Joyas de la corona (activos críticos)

Prioridad: **P0** = crítica (compromiso = daño grave/irreversible), **P1** = alta, **P2** = media.

### P0 — Credenciales y sesiones de usuarios
- Hash de contraseñas (Scrypt vía Better Auth) — **nunca** texto plano ni hash sin salt.
- Cookies de sesión con `HttpOnly`, `Secure`, `SameSite`, expiración.
- Regeneración de sesión en login/logout (anti session fixation).
- Rate limiting en login/registro.
- Protección contra enumeración de usuarios (mensajes de error no diferenciados).

### P0 — Cuentas y control de acceso por rol
- Roles: **Coordinador de Proyecto**, **Aprobador/Gestor de Inventario**, **Administrador del Sistema** (`coordinador`, `aprobador`, `admin_sistema`).
- **Enforcement en el servidor**: cada endpoint verifica rol/propiedad por petición (nunca confiar en el rol del cliente).
- Protección de rutas privadas (`(main)` requiere sesión; `/admin` requiere rol `admin_sistema`).
- Prevención de escalada vertical (IDOR en admin) y horizontal (un usuario no gestiona proyectos/solicitudes ajenos sin rol).
- El rol `admin_sistema` es **inmutable** vía API (el endpoint rechaza toda transición que salga de él).

### P0 — Datos del dominio (proyectos, recursos, solicitudes) *(provisional — Fase 2)*
- Integridad de proyectos: código único, estatus y prioridad; los cambios de prioridad exigen justificación registrada.
- Integridad del flujo de solicitudes de gasto: máquina de estados Borrador → Pendiente → Aprobado/Rechazado → Ejecutado; la aprobación solo la realiza un rol autorizado.
- Integridad de inventario y despachos: stock mínimo, lotes de compra y salidas de almacén veraces.
- Validación de entrada en frontend **y** backend; sanitización anti-XSS.

### P0 — Bitácora y auditoría (inmutabilidad) *(provisional — Fase 2)*
- Despachos y audit log **INSERT-only**: sin edición ni borrado ni siquiera por `admin_sistema`.
- Trazabilidad completa: timestamp, usuario, IP (vía reverse proxy con `X-Forwarded-For` confiable).
- El prorrateo (overhead) debe ser reproducible a partir de los datos registrados.

### P0 — Base de datos PostgreSQL
- Parametrización de consultas (anti SQL injection), incl. `ORDER BY`, filtros y búsquedas.
- Principio de menor privilegio en roles BD; credenciales en variables de entorno, nunca en el repo.
- RLS/policies si se usa Supabase; revisión por `security-reviewer`.
- Migraciones versionadas; consultas directas solo lectura.

### P1 — Secretos y configuración
- `.env*`, claves de API, tokens, `DATABASE_URL` **nunca** en el repositorio (solo `.env.example`).
- No exponer claves de servicio en bundles (nada `NEXT_PUBLIC_*` con secretos).
- Bloquear `/docs`, `/openapi.json`, `/admin`, `/.env`, `/.git` en producción; desactivar sourcemaps.

### P1 — API (endpoints y datos expuestos)
- Validación estricta de entrada en cada ruta (tipos, longitudes, formato email/UUID).
- Respuestas de error sin fuga de detalle interno.
- CORS con whitelist estricta (sin reflejo de `Origin` ni `null`).
- Límites de tamaño de cuerpo y profundidad JSON (anti DoS).

### P2 — Disponibilidad y hardening general
- Cabeceras de seguridad: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`.
- Protección CSRF (token + `SameSite`); `SameSite` solo no basta.
- Manejo básico de errores sin volcar stack traces.
- Logging seguro: sin contraseñas/tokens/PII; alertas de ráfagas de 401/403.

---

## 3. Prioridades de seguridad por funcionalidad

| Funcionalidad | Joyas implicadas | Controles obligatorios |
| --- | --- | --- |
| Registro | P0 credenciales, P0 acceso | Hash, validación, rate limit, no enumerar; solo crea `coordinador` |
| Login | P0 credenciales, P0 sesión | Rate limit, cookies seguras, mensajes no diferenciados |
| Proyectos y prioridades *(Fase 3)* | P0 datos del dominio, P0 bitácora | Autorización por rol, validación front+back, justificación obligatoria registrada |
| Solicitudes de gasto *(Fase 3)* | P0 datos del dominio, P0 acceso | Máquina de estados en servidor, aprobación solo por rol autorizado, anti-IDOR |
| Inventario, equipos y despachos *(Fase 3)* | P0 datos del dominio, P0 bitácora | Validación, registro inmutable de movimientos, control de conflictos de reserva |
| Prorrateo y reportes *(Fase 3)* | P0 bitácora, P1 API | Cálculo en dominio puro reproducible, exportación sin fuga de datos |
| Panel admin | P0 acceso | Enforcement servidor por rol `admin_sistema`, rol inmutable, IDOR prevention |
| Auditoría *(Fase 3)* | P0 bitácora | INSERT-only, acceso solo `admin_sistema` |
| Perfil de usuario | P0 credenciales, P0 acceso | Propietario puede ver/editar el propio, no datos sensibles ajenos (email redactado) |

---

## 4. Proceso para los agentes

1. **security-architect**: en fase de diseño, valida que el diseño de la feature proteja las joyas P0/P1 correspondientes y documenta el modelo de amenaza en `docs/security/`.
2. **blue-team**: implementa/verifica los controles de la tabla §3 (skill `seguridad`) y mitiga hallazgos del red-team.
3. **red-team**: audita la app/API contra estas joyas (skill `pentesting`); cualquier hallazgo se clasifica con la severidad que indica el impacto sobre P0/P1/P2.
4. **security-reviewer**: audita código y PostgreSQL antes de integrar features que tocan P0/P1.

## 5. Regla de severidad

- 🔴 **Crítico**: compromete una joya P0 (credenciales, sesión, acceso por rol, integridad de los datos del dominio, bitácora/auditoría, BD).
- 🟡 **Advertencia**: compromete una joya P1 (secretos, API, hardening) o condición de P0 con mitigación.
- 🔵 **Sugerencia**: P2 (disponibilidad, hardening menor, buenas prácticas).

> Los hallazgos **críticos** bloquean la integración hasta su corrección.