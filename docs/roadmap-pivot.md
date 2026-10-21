# Roadmap de Vistas — Pivot Red FaCyT → Sistema de Control de Proyectos y Recursos

> **Documento generado:** 2026-10-18  
> **Basado en:** [`docs/pivot-project.md`](./pivot-project.md)  
> **Propósito:** Listado completo de vistas a diseñar (wireframes) para el nuevo sistema, con elementos a mostrar, recomendaciones y orden de priorización para su diseño.

## 1. Vistas de Autenticación

### 1.1 `/login` — Inicio de sesión

**Objetivo:** Permitir el acceso al sistema con control por rol.

**Qué debe mostrar:**

- Logo/título del sistema ("Sistema de Control de Proyectos y Recursos")
- Campo: Correo electrónico
- Campo: Contraseña
- Botón primario "Iniciar sesión"
- Enlace: "¿No tienes cuenta? Regístrate"
- Estado de error (credenciales inválidas)

**Recomendaciones:**

- Layout centrado (card centrada en viewport), con mucho espacio en blanco.
- Usar inputs limpios con labels flotantes o arriba.
- Mostrar/ocultar contraseña.
- Mantener diseño minimalista (estilo Apple). Evitar elementos decorativos innecesarios.
- Considerar mensaje genérico de error ("Credenciales incorrectas") para no filtrar información.

### 1.2 `/register` — Registro de usuario

**Objetivo:** Crear nuevos usuarios. Según el pivot, el registro crea por defecto un usuario con rol `coordinador`.

**Qué debe mostrar:**

- Título: "Crear cuenta"
- Campos: Nombre completo, Correo electrónico, Contraseña, Confirmar contraseña
- Indicador de fortaleza de contraseña (opcional pero útil)
- Botón "Registrarse"
- Enlace a `/login`
- Nota aclaratoria: "Al registrarte se te asignará el rol de Coordinador de Proyecto"

**Recomendaciones:**

- Validación en tiempo real (Zod) para reducir errores.
- Separar claramente secciones con espaciado vertical generoso.
- No mostrar selector de rol en registro (evitar escalación no intencionada). El rol lo asigna el sistema o `admin_sistema`.
- Incluir texto de ayuda bajo contraseña.

## 2. Dashboard — Núcleo Ejecutivo

### 2.1 `/dashboard` — Dashboard Ejecutivo (Prioritario)

**Objetivo:** Vista de alto nivel para toma de decisiones (KPIs + alertas críticas). Visible para **todos los roles**.

**Qué debe mostrar:**

- **Cabecera**: Título "Dashboard", fecha/hora actual, selector de período (Hoy/Semana/Mes/Trimestre) opcional
- **KPIs principales** (cards): Proyectos activos, Proyectos en ejecución, Presupuesto ejecutado vs. total, % Avance físico global, Alertas de stock (críticas)
- **Alertas críticas**: Recursos bajo stock mínimo, Equipos en mantenimiento, Reservas próximas a vencer, Solicitudes pendientes de aprobación
- **Gráficas/resúmenes**: Avance por proyecto (barras/progreso), Distribución de proyectos por estatus/prioridad
- **Actividad reciente**: Últimos despachos, últimos cambios de prioridad, solicitudes recientes
- **Acciones rápidas**: "Nuevo proyecto", "Nueva solicitud de gasto", "Registrar despacho"

**Recomendaciones:**

- Jerarquizar KPIs con cards grandes, bordes redondeados, íconos sutiles y colores neutros + acento azul (#0071E3).
- Usar mucho espacio en blanco. Agrupar KPIs en grid 2-4 columnas (responsive).
- Resaltar alertas con badges (warning/error) y permitir hacer clic para ir al detalle.
- Priorizar información crítica arriba-izquierda. Evitar sobrecargar (menos densidad, más legibilidad).
- Incluir estado vacío ("No hay alertas críticas" / "No hay proyectos activos") con ilustración/ícono sutil.

**Estado de implementación (2026-10-20) — Spec: [`docs/design/wireframes_dashboard.md`](design/wireframes_dashboard.md)**

- ✅ Cabecera, KPIs, alertas, avance/distribución, actividad y acciones rápidas implementadas (Fase 2b, adapter estático `DashboardRepository`).
- ✅ Selector de período (Hoy/Semana/Mes/Trimestre) incluido: filtra KPIs, alertas y actividad.
- ⏳ **Deuda registrada — Acciones rápidas deshabilitadas**: "Nuevo proyecto", "Nueva solicitud de gasto" y "Registrar despacho" se muestran **deshabilitadas con badge "Próximamente"** porque sus destinos `/projects/new`, `/expenses/new` y `/dispatches/new` **no existen todavía**. Se habilitan al implementar `§3.2`, `§5.1` y `§4.3` respectivamente; al hacerlo hay que retirar el badge y convertirlos en enlaces aprobados por rol.
- ⏳ **Deuda registrada — Alertas y enlaces "Ver todo"/"Ver bitácora"**: las filas de alerta y los enlaces de pie de sección quedan **no clicables** hasta que existan las rutas de detalle (`/inventory`, `/equipment`, `/expenses`, `/dispatches`, `/logs`). Misma regla: habilitar al crear la vista destino.
- ⏳ **Acento azul Apple `#0071E3`**: el roadmap lo recomienda para los KPIs, pero **la migración de tokens es la Fase 4** del pivot (`pivot-project.md` §8). El dashboard usa el token `--accent` actual (ámbar `#d97706`) y cambiará de forma automática al migrar los tokens.
- ⏳ **Datos reales**: hoy el dashboard lee un adapter estático; la conexión a PostgreSQL/API corresponde a la Fase 5.

## 3. Módulo de Proyectos

### 3.1 `/projects` — Lista de Proyectos

**Objetivo:** Listado centralizado con filtros y acciones por rol.

**Qué debe mostrar:**

- **Cabecera**: Título "Proyectos", botón "Nuevo Proyecto" (visible para `admin_sistema` / `coordinador`)
- **Filtros**: Búsqueda por código/nombre, Filtro por Estatus (Propuesta/En ejecución/Suspendido/Finalizado), Filtro por Prioridad (Crítica/Alta/Media/Baja), Filtro por responsable
- **Tabla/listado**: Código único, Nombre, Estatus (badge), Prioridad (badge con color), % Avance físico, % Presupuesto ejecutado, Responsable, Fecha inicio/fin estimada
- **Acciones por fila**: Ver detalle, Editar (`admin/coordinador`), Cambiar prioridad (`admin/aprobador`)

**Recomendaciones:**

- Preferir **tabla limpia** en desktop y **cards** en mobile (responsive).
- Usar badges de estado con colores semánticos (Crítica=rojo, Alta=ámbar, Baja=gris).
- Columna de progreso visual (barra o porcentaje con color).
- Mantener filtros arriba, siempre visibles y colapsables en móvil.
- Mostrar conteo de resultados ("X proyectos encontrados").

### 3.2 `/projects/new` — Nuevo Proyecto

**Objetivo:** Crear proyecto con métricas base.

**Qué debe mostrar:**

- **Cabecera**: Título "Nuevo Proyecto", Breadcrumbs (`Proyectos > Nuevo`)
- **Formulario**: Código único (alfanumérico), Nombre, Descripción, Estatus inicial (Propuesta por defecto), Prioridad (Media por defecto), Responsable/Coordinador, Fecha inicio estimada, Fecha fin estimada, Presupuesto estimado (opcional)
- **Sección métricas**: % Avance físico inicial (0% por defecto), % Presupuesto ejecutado (0% por defecto)
- **Acciones**: "Cancelar", "Guardar Proyecto"

**Recomendaciones:**

- Dividir en secciones ("Información general", "Planificación y métricas") con espaciado claro.
- Código único: sugerir autogeneración o validar unicidad on-blur.
- Usar campos numéricos con validación (0-100) para porcentajes.
- Botón primario destacado, secundario sutil. Confirmar solo si hay cambios no guardados (al salir).

### 3.3 `/projects/[id]` — Detalle de Proyecto

**Objetivo:** Vista 360° del proyecto (métricas, recursos, solicitudes, hitos).

**Qué debe mostrar:**

- **Cabecera**: Código + Nombre, Badges (Estatus/Prioridad), Acciones (Editar, Cambiar prioridad, Volver)
- **Resumen**: Descripción, Fechas, Responsable, Presupuesto estimado vs. ejecutado
- **Métricas**: % Avance físico (barra de progreso grande), % Ejecución presupuestaria (barra), Progreso general
- **Recursos utilizados**: Listado de consumibles/materia prima asignados (con cantidad), Despachos asociados
- **Solicitudes de gasto**: Tabla con estado (Pendientes/Aprobadas/Rechazadas)
- **Equipos reservados**: Reservas activas/vencidas del proyecto
- **Historial**: Cambios de prioridad (con justificación), actividad reciente
- **Notas/observaciones**: Espacio para comentarios

**Recomendaciones:**

- Diseño en **tabs** ("Resumen", "Recursos", "Solicitudes", "Equipos", "Historial") para evitar scroll excesivo.
- Usar tarjetas para cada bloque (separación visual clara).
- Mostrar barras de progreso grandes y legibles (estilo Apple).
- Priorizar KPIs del proyecto arriba.
- Enlace cruzado a despachos, solicitudes y reservas para navegación fluida.

### 3.4 `/projects/[id]/edit` — Editar Proyecto

**Objetivo:** Modificar datos del proyecto (con restricciones por rol).

**Qué debe mostrar:**

- **Cabecera**: Título "Editar Proyecto", Breadcrumbs
- **Formulario idéntico a New** pero con datos precargados
- **Advertencia**: Cambios que afecten métricas o fechas (texto de ayuda)
- **Acciones**: "Cancelar", "Guardar cambios"

**Recomendaciones:**

- Mostrar indicador de "Cambios sin guardar".
- Deshabilitar edición de campos críticos si no corresponde al rol (ej. código único no editable).
- Mantener coherencia visual con `/projects/new`.

### 3.5 `/projects/[id]/priority` — Cambiar Prioridad + Justificación

**Objetivo:** Cambio controlado. **Requiere justificación obligatoria** (bitácora).

**Qué debe mostrar:**

- **Cabecera**: Proyecto (código+nombre), Prioridad actual
- **Formulario**: Selector de nueva prioridad (Crítica/Alta/Media/Baja), Campo obligatorio "Justificación del cambio" (textarea, mínimo caracteres sugerido), Checkbox/aviso: "Se registrará en bitácora inmutable"
- **Vista previa**: Cambio (Actual → Nueva) con colores
- **Acciones**: "Cancelar", "Confirmar cambio"

**Recomendaciones:**

- **Modal o página dedicada**. Modal recomendado para flujo rápido sin perder contexto.
- Resaltar criticidad (si pasa a Crítica, usar borde/alerta rojo).
- Campo obligatorio con contador de caracteres.
- Texto claro: "Este cambio quedará registrado en la bitácora de auditoría (no se puede eliminar)".
- Botón de confirmación con color acorde a criticidad (destructivo sutil si Crítica).

## 4. Módulo de Inventario (Recursos)

### 4.1 `/inventory` — Catálogo unificado (Materia Prima + Consumibles)

**Objetivo:** Vista central con alertas de stock en tiempo real.

**Qué debe mostrar:**

- **Cabecera**: Título "Inventario", Botón "Nuevo Recurso" (`admin_sistema`/`aprobador`), Botón "Registrar Lote de Compra" (`aprobador`)
- **Filtros**: Búsqueda (nombre/código), Tipo (Materia prima / Consumible), Estado de stock (Suficiente / Bajo mínimo / Sin stock), Unidad de medida
- **Listado**: Código, Nombre, Tipo (badge), Stock actual, Stock mínimo (alerta), Unidad, Último ingreso, Alertas
- **Indicadores visuales**: Fila resaltada en rojo (sin stock), ámbar (bajo mínimo), verde/neutral (suficiente)
- **Acciones**: Ver detalle, Registrar lote, Editar

**Recomendaciones:**

- Usar **chips/Badges** para tipo y estado. Colorear fila sutilmente por severidad de alerta (no invasivo).
- Mostrar ícono de alerta junto a stock cuando < mínimo.
- Tabla con ordenamiento por stock (ascendente) útil para priorizar reposición.
- Estado vacío con CTA "Crear primer recurso".

### 4.2 `/inventory/new` — Alta de Recurso

**Objetivo:** Crear nuevo recurso en el catálogo.

**Qué debe mostrar:**

- **Cabecera**: Breadcrumbs `Inventario > Nuevo Recurso`
- **Formulario**: Código, Nombre, Tipo (Materia prima/Consumible), Unidad de medida, Stock mínimo configurable, Stock inicial (0 sugerido), Descripción, Proveedor habitual (opcional), Observaciones
- **Acciones**: "Cancelar", "Guardar"

**Recomendaciones:**

- Separar "Datos del catálogo" vs "Parámetros de alerta".
- Explicar utilidad de stock mínimo ("Genera alerta cuando el stock esté por debajo de este valor").
- Validar stock mínimo >= 0. Stock inicial >= 0.

### 4.3 `/inventory/[id]` — Detalle de Recurso

**Objetivo:** Historial completo + estado actual.

**Qué debe mostrar:**

- **Cabecera**: Nombre + Código, Tipo, Badge de estado de stock, Acciones (Editar, Registrar lote)
- **Resumen**: Stock actual, Stock mínimo, Unidad, Tipo, Último movimiento
- **Historial de lotes**: Tabla (N° Lote, Fecha ingreso, Cantidad, Costo unitario, Proveedor, Tipo lote: Directo/Overhead)
- **Historial de despachos**: Tabla (Fecha, Cantidad despachada, Proyecto, Solicitado por, Responsable despacho)
- **Gráfica**: Evolución de stock (opcional pero muy útil)
- **Alertas**: Configuración y estado actual

**Recomendaciones:**

- Tabs ("Resumen", "Lotes de compra", "Despachos").
- Destacar stock con número grande + barra visual.
- Ordenar historial descendente (más reciente primero).
- Mostrar totales (cantidad total ingresada, consumida) si útil.
- Enlaces cruzados a proyecto/dispatch.

### 4.4 `/inventory/lots/new` — Registrar Lote de Compra

**Objetivo:** Ingreso de stock (directo u overhead). Afecta stock en tiempo real.

**Qué debe mostrar:**

- **Cabecera**: Breadcrumbs `Inventario > Registrar Lote`
- **Formulario**: Recurso (selector con búsqueda + stock actual visible), Tipo de lote (Directo / Overhead), Fecha de ingreso (hoy por defecto), Cantidad a ingresar, Costo unitario (moneda), Proveedor, N° de factura/orden (opcional), Observaciones
- **Vista previa**: Incremento de stock ("Stock actual: X → Nuevo stock: X + Y")
- **Acciones**: "Cancelar", "Registrar Ingreso"

**Recomendaciones:**

- **Crítico**: Mostrar preview del cambio de stock antes de guardar.
- Tipo de lote claramente explicado (Directo vs Overhead) — útil para prorrateo.
- Fecha por defecto hoy, no editable a futuro muy lejano sin motivo.
- Validaciones: cantidad > 0, costo >= 0.
- Usar selector de recurso con búsqueda (evita scroll largo).

## 5. Módulo de Equipos

### 5.1 `/equipment` — Catálogo de Equipos

**Qué debe mostrar:**

- **Cabecera**: Título "Equipos", Botón "Nuevo Equipo" (`admin_sistema`)
- **Filtros**: Búsqueda (nombre/código/inventario), Estado operacional (Disponible / En uso / En mantenimiento / Fuera de servicio), Ubicación/laboratorio (opcional)
- **Listado**: Código de inventario, Nombre, Estado (badge con color), Ubicación, Responsable, Reservas activas
- **Acciones**: Ver detalle, Reservar (`coordinador`), Cambiar estado

**Recomendaciones:**

- Colores semánticos: Disponible (verde), En uso (azul), En mantenimiento (ámbar), Fuera de servicio (gris/rojo).
- Mostrar contador de reservas activas por equipo.
- Vista tipo cards o tabla. Cards funcionan bien para activos físicos.
- Filtros prominentes (estado suele ser el más usado).

### 5.2 `/equipment/new` — Alta de Equipo

**Qué debe mostrar:**

- **Formulario**: Código de inventario, Nombre, Descripción, Marca/modelo, Nº serie (opcional), Estado inicial (Disponible), Ubicación/laboratorio, Fecha de adquisición (opcional), Valor/costo (opcional), Observaciones
- **Acciones**: "Cancelar", "Guardar"

**Recomendaciones:**

- Enfatizar campos identificadores (Código inventario único).
- Estado inicial razonable (Disponible).

### 5.3 `/equipment/[id]` — Detalle de Equipo

**Qué debe mostrar:**

- **Cabecera**: Nombre + Código, Estado actual, Botón "Reservar" (`coordinador`) si Disponible/condicional
- **Ficha técnica**: Marca/modelo, Nº serie, Ubicación, Fecha adquisición, Estado, Observaciones
- **Reservas**: Activas, Próximas, Históricas (tabla con Proyecto, Fecha inicio/fin, Solicitante, Estado)
- **Historial de uso/mantenimiento**: Fechas, Motivo, Responsable
- **Disponibilidad**: Vista calendario mensual (muy útil para evitar conflictos)

**Recomendaciones:**

- **Calendario de disponibilidad** (mini calendario o timeline) es clave para UX de reservas.
- Tabs ("Ficha", "Reservas", "Historial", "Disponibilidad").
- Mostrar estado claramente con badge grande.

### 5.4 `/equipment/[id]/reserve` — Reservar Equipo (Validación de Conflictos)

**Objetivo:** Reserva con verificación de conflictos. Crítico para evitar solapes.

**Qué debe mostrar:**

- **Cabecera**: Equipo + Estado actual + Disponibilidad
- **Formulario**: Proyecto (selector obligatorio, proyectos del coordinador o todos según rol), Fecha/hora inicio, Fecha/hora fin, Motivo de reserva (obligatorio), Observaciones
- **Validación de conflictos**: Panel en tiempo real "Disponibilidad" — muestra conflictos detectados (rojo) o disponible (verde). Bloquea envío si hay conflicto
- **Resumen**: Duración calculada automáticamente
- **Acciones**: "Cancelar", "Solicitar/Crear Reserva"

**Recomendaciones:**

- **Validación en tiempo real** (onChange de fechas) mostrando conflictos con reservas existentes.
- Usar **selector de rango de fechas/horas** claro. Incluir zona horaria si aplica.
- Mensaje explícito: "Existe un conflicto con reserva existente (Proyecto X, 14:00–16:00)".
- No permitir enviar mientras exista conflicto. Botón deshabilitado con explicación.
- Prevenir reservas pasadas. Validar fin > inicio.

## 6. Módulo de Despachos (Almacén)

### 6.1 `/dispatch` — Formulario de Despacho

**Objetivo:** Registrar salida de almacén. **Bitácora inmutable**.

**Qué debe mostrar:**

- **Cabecera**: Título "Registrar Despacho", Breadcrumbs
- **Formulario**: Proyecto destino (obligatorio), Recurso/Consumible (selector con stock actual visible + unidad), Cantidad a despachar, Solicitante (opcional/prellenado), Responsable de despacho (usuario logueado), Motivo/Justificación (opcional), Fecha/hora (auto = ahora)
- **Validación en tiempo real**: Stock disponible ("Stock: X disponible"). Advertencia si cantidad > stock (rojo). Bloquea envío si insuficiente
- **Vista previa**: "Stock actual: X → Después del despacho: X – Y"
- **Checkbox confirmación**: "Confirmo que el despacho es correcto y quedará registrado en bitácora inmutable"
- **Acciones**: "Cancelar", "Registrar Despacho"

**Recomendaciones:**

- **Altamente crítico**: Preview + validación estricta (nunca permitir stock negativo).
- Mostrar stock restante destacado.
- Usar confirmación explícita (checkbox) para operación irreversible desde lógica de bitácora.
- Deshabilitar recurso si stock == 0.
- Agrupar ítems si se permite despacho múltiple (líneas de despacho) — recomendado para futuro, pero MVP: un ítem por despacho o múltiple claro.

### 6.2 `/dispatch/history` — Bitácora Inmutable de Despachos

**Objetivo:** Trazabilidad completa. **Solo lectura** (inmutable).

**Qué debe mostrar:**

- **Cabecera**: Título "Bitácora de Despachos (Inmutable)"
- **Filtros**: Rango de fechas, Proyecto, Recurso, Responsable de despacho
- **Tabla (solo lectura)**: Fecha/Hora, Recurso, Cantidad despachada, Unidad, Proyecto destino, Solicitante, Responsable de despacho, Motivo
- **Totales**: Despachos del período (conteo)
- **Nota**: "Esta bitácora no permite edición ni eliminación (registro inmutable)"

**Recomendaciones:**

- **Clarificar inmutabilidad** con badge/leyenda visible (transmite cumplimiento de auditoría).
- Tabla densa pero legible. Orden descendente por fecha/hora.
- Exportar a Excel/PDF desde aquí o desde Reportes (ver sección 8).
- Sin acciones de edición/eliminación (ocultarlas por completo).

## 7. Módulo de Solicitudes de Gasto

### 7.1 `/requests` — Lista de Solicitudes de Gasto

**Objetivo:** Seguimiento del flujo por estados.

**Qué debe mostrar:**

- **Cabecera**: Título "Solicitudes de Gasto", Botón "Nueva Solicitud" (`coordinador`)
- **Filtros**: Estado (Borrador / Pendiente / Aprobado / Rechazado / Ejecutado), Proyecto, Solicitante, Rango fechas
- **Tabla**: Nº Solicitud, Proyecto, Concepto, Monto estimado/solicitado, Estado (badge con color), Solicitante, Fecha creación, Fecha actualización
- **Acciones**: Ver detalle, Aprobar/Rechazar (`aprobador`) según estado, Continuar borrador (`coordinador`)

**Recomendaciones:**

- Colores por estado: Borrador (gris), Pendiente (ámbar), Aprobado (azul), Rechazado (rojo), Ejecutado (verde).
- Agrupar por estado o permitir filtro activo.
- Mostrar solicitudes pendientes de aprobación con resaltado (badge contador en navbar/sidebar opcional).
- Estado vacío con CTA.

### 7.2 `/requests/new` — Nueva Solicitud (Borrador)

**Objetivo:** Crear solicitud en estado **Borrador**.

**Qué debe mostrar:**

- **Cabecera**: Breadcrumbs `Solicitudes > Nueva`
- **Formulario**: Proyecto (obligatorio), Concepto/Título, Descripción detallada, Ítems (líneas): Recurso/Servicio, Cantidad, Precio unitario, Subtotal (auto), Total (auto), Justificación, Fecha requerida (opcional), Adjuntos (opcional MVP)
- **Estado**: Badge "Borrador" visible
- **Acciones**: "Guardar Borrador", "Enviar a Aprobación" (cambia a Pendiente), "Cancelar"

**Recomendaciones:**

- **Líneas de ítems dinámicas** (+ Agregar ítem) con cálculo automático de subtotales/totales.
- Separar claramente cabecera vs. detalle de ítems.
- Botón "Enviar a Aprobación" secundario/primario con confirmación ("¿Enviar a aprobación? No podrás editarlo mientras esté Pendiente").
- Guardado automático como borrador (UX amable) opcional.

### 7.3 `/requests/[id]` — Detalle + Acciones de Aprobación

**Objetivo:** Gestionar flujo de estados con trazabilidad.

**Qué debe mostrar:**

- **Cabecera**: Nº Solicitud, Concepto, Estado (badge grande), Proyecto
- **Datos generales**: Solicitante, Fecha creación, Fecha actualización, Fecha requerida, Descripción, Justificación
- **Detalle de ítems**: Tabla con recurso/servicio, cantidad, precio unitario, subtotal, Total general
- **Historial de estados**: Timeline (Borrador → Pendiente → Aprobado/Rechazado → Ejecutado) con fechas, usuario y comentarios
- **Acciones según rol/estado**:
  - `aprobador`: Si Pendiente → Botones "Aprobar", "Rechazar" (comentario obligatorio al rechazar)
  - `aprobador/admin`: Si Aprobado → Botón "Marcar como Ejecutado"
  - `coordinador`: Si Borrador → "Continuar edición" / "Enviar a aprobación"
- **Comentarios**: Campo para observaciones al aprobar/rechazar

**Recomendaciones:**

- **Timeline de flujo** muy importante (visualiza máquina de estados).
- Al rechazar: **comentario obligatorio** con validación.
- Al aprobar: opcional comentario. Al marcar Ejecutado: opcional.
- Usar modales de confirmación para acciones críticas (Rechazar/Aprobar/Marcar Ejecutado).
- Mostrar quién cambió cada estado + fecha/hora.
- Deshabilitar acciones si no cumple rol/estado.

## 8. Módulo de Prorrateo (Overhead)

### 8.1 `/overhead` — Panel de Prorrateo

**Objetivo:** Cierre de período y cálculo de prorrateo (proporcional/equitativo). Solo `aprobador` / `admin_sistema`.

**Qué debe mostrar:**

- **Cabecera**: Título "Prorrateo de Consumibles Compartidos", Selector de Período Contable (Mes/Año)
- **Resumen del período**: Estado (Abierto/Cerrado), Fecha apertura/cierre, Total consumibles overhead del período
- **Parámetros de cálculo**: Selector de criterio (Proporcional al consumo / Equitativo) + explicación breve de cada uno
- **Consumibles overhead**: Listado de recursos tipo Overhead con consumo total del período
- **Proyectos participantes**: Tabla con Proyecto, Consumo/criterio base, % Asignación calculada, Monto asignado (si aplica)
- **Vista previa de prorrateo**: Tabla calculada antes de cerrar período (solo lectura, editable no)
- **Acciones**: "Calcular Prorrateo", "Cerrar Período" (irreversible), "Ver Historial de Períodos"

**Recomendaciones:**

- **Explicar algoritmos** brevemente ("Proporcional: según consumo real del proyecto" / "Equitativo: distribución uniforme entre proyectos participantes").
- **Preview obligatoria** antes de "Cerrar Período".
- Advertencia fuerte: "Cerrar período es irreversible. Las asignaciones quedarán registradas y el período no podrá recalcularse".
- Deshabilitar "Cerrar Período" hasta tener cálculo válido.
- Mostrar totales que sumen 100% (validación de cierre).
- Separar cálculo (preview) de cierre (acción definitiva).

## 9. Módulo de Reportes

### 9.1 `/reports` — Generación de Reportes PDF/Excel

**Objetivo:** Exportación para auditoría y reporte ejecutivo (`admin_sistema` / `aprobador`).

**Qué debe mostrar:**

- **Cabecera**: Título "Reportes"
- **Tipos de reporte** (cards seleccionables):
  - "Gastos por Proyecto" (PDF/Excel)
  - "Prorrateo por Período" (PDF/Excel)
  - "Hoja de Vida de Equipos" (PDF/Excel)
  - "Inventario Actual" (Stock + alertas) (PDF/Excel)
  - "Bitácora de Despachos" (PDF/Excel)
  - "Solicitudes de Gasto" (por estado/período) (PDF/Excel)
  - "Resumen Ejecutivo (Dashboard)" (PDF)
- **Parámetros por reporte**: Rango de fechas, Proyecto(s), Período contable, Incluir alertas (toggle), Formato (PDF/Excel)
- **Vista previa/descarga**: Botón "Generar Reporte", Zona de descargas recientes
- **Historial**: Reportes generados recientemente (usuario, tipo, fecha, formato)

**Recomendaciones:**

- Usar **cards** con ícono + descripción breve para cada tipo de reporte.
- Mostrar parámetros dinámicos según tipo seleccionado.
- Feedback claro: "Generando reporte..." + notificación de descarga exitosa/error.
- Nombrado automático de archivos (`reporte-gastos-20261018.pdf`).
- Mantener historial de descargas del usuario.

## 10. Módulo de Auditoría

### 10.1 `/audit` — Log de Auditoría Inmutable (Solo Admin)

**Objetivo:** Trazabilidad global. **Acceso restringido a `admin_sistema`**. **INSERT-only, solo lectura**.

**Qué debe mostrar:**

- **Cabecera**: Título "Log de Auditoría (Inmutable)", Badge "Solo Administrador del Sistema"
- **Advertencia visible**: "Registro inmutable. No admite edición ni eliminación."
- **Filtros**: Rango de fechas, Usuario (user_id), Acción (crear/editar/eliminar/cambiar_estado/cambiar_prioridad/login), Entidad (Project/Resource/Equipment/Request/Dispatch/Overhead/Audit), IP address (búsqueda)
- **Tabla (solo lectura)**: Timestamp (fecha+hora con precisión), Usuario, Acción, Entidad + ID, IP Address, Estado anterior → Estado nuevo (diff), Detalles/Justificación
- **Paginación**: Importante (logs crecen). Incluir "Cargar más" o paginación clásica
- **Exportar**: Botón "Exportar a CSV/Excel" (para auditoría externa)

**Recomendaciones:**

- **Máxima claridad de inmutabilidad** (badge + leyenda roja/sutil). No mostrar ningún botón de acción.
- Mostrar diff de cambios (`campo: valor_anterior → valor_nuevo`) legible (resumido con tooltip completo).
- Enfatizar justificación cuando exista (cambio de prioridad).
- Timestamp con zona horaria visible.
- Orden descendente (más reciente primero) por defecto.
- Considerar truncado con tooltip expandible para objetos JSON grandes.

## 11. Panel de Administración

### 11.1 `/admin` — Gestión Integral (Solo Admin)

**Objetivo:** Gestión de usuarios, catálogos y parámetros del sistema (`admin_sistema`).

**Qué debe mostrar:**

- **Cabecera**: Título "Administración del Sistema"
- **Tabs principales**:
  - **Usuarios**: Listado, Buscar, Filtrar por rol, Asignar/cambiar rol, Activar/Desactivar usuario, Crear usuario (opcional)
  - **Catálogos**: Gestión de unidades de medida, proveedores, ubicaciones/laboratorios (parámetros del sistema)
  - **Parámetros**: Stock mínimo global (opcional), Configuración de alertas, Parámetros de prorrateo
  - **Auditoría**: Acceso directo a `/audit` (o embed)
  - **Sistema**: Información general, estado

**Qué mostrar por tab:**

**Usuarios:**
- Tabla: Nombre, Email, Rol (select editable con permisos), Estado (Activo/Inactivo), Fecha creación, Último acceso
- Acciones: Cambiar rol, Desactivar/Activar

**Catálogos:**
- Listas editables (CRUD ligero): Unidades de medida, Proveedores, Laboratorios/Ubicaciones

**Parámetros:**
- Configuraciones globales con guardado explícito.

**Recomendaciones:**

- Diseño por **tabs** claro. Separar gestión operativa vs. configuración.
- Al cambiar rol de usuario: mostrar confirmación + advertencia.
- No permitir auto-desactivarse o quitarse rol `admin_sistema` a sí mismo (protección de cuenta crítica).
- Validaciones y confirmaciones en acciones destructivas (desactivar usuario).
- Layout limpio, espaciado generoso (estilo Apple).

## 12. Perfil de Usuario

### 12.1 `/profile/[username]` — Perfil de Usuario

**Objetivo:** Perfil básico (conservado del sistema original, adaptado).

**Qué debe mostrar:**

- **Cabecera**: Avatar, Nombre completo, Username, Rol (badge), Email
- **Información**: Fecha de registro, Último acceso
- **Acciones**: Editar perfil (si propio), Cambiar contraseña
- **Actividad**: Resumen ligero (proyectos asignados, solicitudes creadas) — opcional MVP

**Recomendaciones:**

- Simplificar (quitar referencias a publicaciones). Enfatizar rol y pertenencia al sistema.
- Diseño centrado, limpio y profesional.

## 13. Recomendaciones Generales para los Wireframes

### Estilo y UX (Apple Design Language)

- **Espacio en blanco**: Usar padding/margin generosos (16, 24, 32, 48px). Priorizar respiración visual.
- **Tipografía**: Sistema (`-apple-system, BlinkMacSystemFont, Inter, sans-serif`). Jerarquía clara (H1–H6). Peso 400–600.
- **Colores**: Fondo base `#FFFFFF`, Superficies `#F5F5F7`, Bordes `#E5E5EA`, Texto primario `#1D1D1F`, Acento `#0071E3`, Estados semánticos (verde/ámbar/rojo/gris).
- **Bordes y radios**: `16–20px` para cards/modales, `12px` para inputs/botones, `999px` para pills/badges.
- **Sombras**: Muy sutiles (`0 1px 2px rgba(0,0,0,0.03), 0 4px 8px rgba(0,0,0,0.05)`) para dar profundidad sin romper minimalismo.
- **Modo oscuro**: Planificar desde wireframes (tokens CSS ya existen). Mantener espaciado y legibilidad.

### Arquitectura de información

- **Jerarquía F-pattern/Z-pattern** según vista. KPIs arriba, tablas abajo.
- **Breadcrumbs** en todas las vistas anidadas (New/Edit/Detail/Subvistas).
- **Estados vacíos**: Siempre incluir (sin datos + CTA claro).
- **Estados de carga/error/éxito**: Representarlos en wireframes (skeletons, toasts, banners).
- **Responsive**: Mobile-first. Navegación bottom-nav (ya existe) vs. topbar desktop. Usar grids fluidos.

### UX de seguridad y auditoría

- **Acciones por rol**: Solo mostrar botones/acciones permitidos al rol (reflejarlo visualmente en wireframes).
- **Confirmaciones críticas**: Cambio de prioridad + justificación, Cerrar período (overhead), Registrar despacho, Rechazar solicitud. Usar modales con texto explícito.
- **Inmutabilidad visible**: `/dispatch/history` y `/audit` deben transmitir "solo lectura + inmutable" (badge, leyenda, sin iconos de acción).
- **Validación preventiva**: Mostrar errores inline, validación en tiempo real donde evita conflictos (reservas, stock).

### Patrones de reutilización

- Establecer **sistema de grids, espaciados y patrones base** (cards, tablas, badges, tabs, formularios, modales) desde las primeras vistas.
- Reutilizar estos patrones sistemáticamente en el resto de módulos para garantizar **consistencia visual** y acelerar el trabajo de diseño.

## 14. Priorización para Diseño de Wireframes

Se recomienda ordenar el diseño por **criticidad de flujo**:

| Orden | Módulo/Vistas | Razón |
|---|---|---|
| **1.** | **Dashboard** (`/dashboard`) | Visión global, establece jerarquía de información y patrones base. |
| **2.** | **Proyectos** (`/projects`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit`, `/projects/[id]/priority`) | Núcleo del dominio. Define grids, cards, tabs, formularios y flujos críticos. |
| **3.** | **Inventario + Despachos** (`/inventory/*`, `/dispatch`, `/dispatch/history`) | Control de stock en tiempo real. Requiere validaciones estrictas (alto riesgo si falla). |
| **4.** | **Solicitudes de Gasto** (`/requests`, `/requests/new`, `/requests/[id]`) | Flujo de aprobaciones con máquina de estados. Fundamental para trazabilidad. |
| **5.** | **Equipos + Reservas** (`/equipment/*`, `/equipment/[id]/reserve`) | Gestión de activos físicos y detección de conflictos de agenda. |
| **6.** | **Prorrateo** (`/overhead`) | Lógica de negocio compleja. Requiere máxima claridad en cálculos, preview y advertencias de irreversibilidad. |
| **7.** | **Reportes + Auditoría + Administración** (`/reports`, `/audit`, `/admin`, `/profile/[username]`) | Vistas operativas, de auditoría y configuración. Menor criticidad de flujo pero necesarias para cumplimiento. |

## 15. Conclusión

Con este roadmap se cubren todas las vistas necesarias para dar soporte a los requisitos del nuevo enunciado. La recomendación es **empezar por Dashboard + Proyectos** para establecer el sistema de diseño base, y reutilizarlo sistemáticamente en el resto de módulos. Esto asegura **consistencia visual, UX sólida y acelera drásticamente** la generación de los wireframes low-fi/med-fi.
