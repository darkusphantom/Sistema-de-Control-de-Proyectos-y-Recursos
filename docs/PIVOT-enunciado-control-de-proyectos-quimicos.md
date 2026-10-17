## Universidad de Carabobo

## Escuela de Computación

Asignatura: Desarrollo de Aplicaciones web | Modalidad: 2 grupos equitativos de estudiantes

## Proyecto Final: Sistema de Control de Proyectos y Recursos

## 1. Descripción del Problema

Una organización académica y empresarial requiere un sistema integral para el control, estatus y manejo de información asociada a sus proyectos de física, química y biología.

Actualmente, se necesita dar seguimiento a múltiples proyectos simultáneos, controlando exhaustivamente la materia prima, el uso de maquinaria y los consumibles. Un desafío fundamental es que los consumibles compartidos (overhead) se compran en lotes y deben prorratearse entre distintos proyectos. El sistema debe gestionar estas asignaciones, el flujo de aprobación de gastos y la priorización de los proyectos, superando las limitaciones actuales del manejo en hojas de cálculo.

## 2. Requerimientos Funcionales

## 2.1. Gestión de Catálogos y Usuarios

## Matriz de Roles y Permisos

| Permisos y Funciones Rol Alcance de Operación Principales |
| --- |
| Administrador del Sistema Gestión integral de usuarios, Todo el sistema parámetros generales, catálogos (ubicaciones, consumibles, equipos) y auditoría global. |


| Permisos y Funciones Rol Alcance de Operación Principales |
| --- |
| Coordinador de Proyecto Carga de avances e hitos, Sus proyectos asignados registro de uso de materia prima y equipos, creación de solicitudes de gasto o retiro de insumos. |
| Aprobador / Gestor de Aprobación/rechazo de Inventario y Finanzas Inventario solicitudes de gasto, gestión de almacén (recepción y despacho de lotes), ajuste de prioridades. |

Nota: Los beneficiarios y el personal general de los laboratorios NO tendrán usuario en el sistema.

## Estructura de Proyectos

Los proyectos registrados en la plataforma deben contar obligatoriamente con los siguientes atributos:

- Código Único: Identificador alfanumérico institucional.

- Estatus Operativo: Propuesta, En ejecución, Suspendido, Finalizado.

- Nivel de Prioridad: Crítica, Alta, Media, Baja.

- Métricas: Porcentaje de avance físico y ejecución presupuestaria.

## 2.2. Control de Recursos e Inventario

- Materia Prima y Consumibles: Catálogo unificado con control de stock en tiempo real, alertas de stock mínimo configurable y registro detallado de lotes de compra (fecha de ingreso, costo unitario y proveedor).

- Equipos y Maquinaria: Catálogo de activos indicando estado operacional (Disponible, En uso, En mantenimiento). Módulo de reserva previa para prevenir conflictos de agendamiento entre proyectos.

- Bitácora de Despachos: Historial inalterable de salidas de almacén que registre fecha, hora, proyecto destino, insumo, cantidad despachada y usuario responsable del retiro.


## 2.3. Prorrateo de Consumibles Compartidos (Overhead)

Los consumibles de uso general (ej. guantes de nitrilo, papel absorbente, solventes multipropósito) no se asignan directamente a un solo proyecto durante la compra. Se adquieren por lotes institucionales y su costo debe distribuirse equitativamente o de forma proporcional.

El sistema debe permitir cerrar un período contable (mensual o trimestral) y ejecutar el cálculo automático para prorratear el costo de los lotes compartidos entre los proyectos activos durante dicho rango de tiempo, permitiendo criterios de reparto:

- 1. Proporcional al nivel de consumo registrado.

- 2. Reparto equitativo en partes iguales entre proyectos activos.

## 2.4. Ciclo de Solicitudes y Priorización

[Borrador] ──> [Pendiente de Aprobación] ──> [Aprobado / Rechazado] ──> [Ejecutado]

- Aprobación de Gastos: Toda adquisición o asignación de recursos debe seguir estrictamente el flujo de estados mostrado en el diagrama superior.

- Priorización de Proyectos: Módulo de ordenamiento dinámico de proyectos según su nivel de prioridad. Regla de negocio: Todo cambio en la prioridad de un proyecto requiere obligatoriamente una justificación textual que quedará asentada en la bitácora.

## 2.5. Reportes y Auditoría

- Dashboard Ejecutivo: Visualización interactiva con indicadores clave de rendimiento (KPIs) sobre proyectos activos, presupuesto global ejecutado y alertas críticas de stock.

- Exportación de Datos: Generación de reportes formalizados en formato PDF y Excel para análisis de gastos, resúmenes de prorrateo y hoja de vida/uso de equipos.

- Auditoría del Sistema: Registro inmutable (audit_log) que almacene la trazabilidad completa de acciones (creación, edición, eliminación, cambios de estado), incluyendo timestamp, user_id e ip_address.

## 3. Arquitectura y Stack Tecnológico

El sistema debe diseñarse e implementarse bajo un patrón de arquitectura cliente- servidor, garantizando modularidad y mantenibilidad.


- Tecnología Libre: Los equipos tienen total libertad para seleccionar la pila tecnológica (Frontend, Backend y Base de Datos Relacional) que mejor se adapte a sus capacidades técnicas.

- Diseño de Interfaz: Se requiere un diseño de interfaz de usuario (UI) moderno, limpio y responsive, alineado con las guías de diseño estilo Apple (uso de espacio en blanco, bordes redondeados, paleta de colores neutra y soporte nativo para modo claro/oscuro).

- Despliegue: La aplicación debe estar empaquetada o configurada para desplegarse en un entorno de servidor local o nube, simulando un ambiente de producción real.

## 4. Entregables del Proyecto

- 1. Código Fuente: Repositorio estructurado con la separación clara entre Frontend y Backend.

- 2. Base de Datos: Scripts SQL de creación de estructura y script de datos semilla (seeders) cargado con proyectos ficticios, inventario inicial y usuarios con roles preconfigurados para evaluación.

- 3. Documentación: Archivo README.md exhaustivo con la guía paso a paso para la instalación, configuración y ejecución del entorno local. Alcance y limitaciones.

- 4. Uso de Inteligencia Artificial: Se permite y fomenta el uso de herramientas de IA generativa como asistentes de desarrollo. Los integrantes del equipo deben estar capacitados para defender la lógica del código y las decisiones arquitectónicas adoptadas.

- Requisito Indispensable: Adjuntar el archivo de texto o historial con los PROMPTS principales utilizados durante el desarrollo.

- Canal Oficial: Mantenerse atentos a las especificaciones, fechas y lineamientos adicionales emitidos a través del canal oficial de Telegram de la asignatura.
