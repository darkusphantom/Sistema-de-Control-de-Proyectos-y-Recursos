# Objetivo del Proyecto

El proyecto es el **Sistema de Control de Proyectos y Recursos** de la Facultad Experimental de Ciencias y Tecnología (FACYT):

- Enunciado original del pivot: [PIVOT-enunciado-control-de-proyectos-quimicos.md](/docs/PIVOT-enunciado-control-de-proyectos-quimicos.md)
- Plan de pivot (diagnóstico, mapa de rutas, roles y fases): [pivot-project.md](/docs/pivot-project.md)
- Alcance del MVP vigente: [implementation_base.md](/docs/implementation/implementation_base.md)

La especificación del proyecto académico anterior (Red FaCyT) está archivada en [docs/archive/Proyecto1_Junio2026.md](/docs/archive/Proyecto1_Junio2026.md).

## Fases de implementacion

Toda implementacion debe pasar por las siguientes fases:

- Diseno
- Implementacion
- Review
- Testing
- Documentacion
- Despliegue

No se puede saltar ningun paso y cada implementacion tiene que tener su fase de review, testing y documentacion.

## Datos a tener en encuentra a la hora de escribir codigo

- Se aplicaran patrones de diseno a la hora de implementar el codigo
- Analisis asintotico para mejorar la optimizacion del codigo
- El codigo debe ser en ingles y legible (nada de abreviatura)
- Se utilizara JSDocs en el codigo para documentar
- Se usara la estrategia TDD
- Toda documentacion debe integracion debe ser en formato markdown y van dentro de docs/
- Cuando estamos en la fase de diseno, pueden recomendar tres modos de implementacion: La recomendada, la mas segura, la mas optima.
- Mantener siempre la estructura del proyecto organizada. No coloques archivos en lugares donde no han sido asignado. Si lo vas hacer, pregunta.
- Las consultas directas a la base de dato solo son de lectura. Si se desea hacer una modificacion, deberas pasar el codigo (explicado con sus comentarios) para que uno mismo lo ejecute.
- Se usara Husky para cuidar el codigo y antes de hacer prepush

## Framework y Deployment Tools

- NextJS
- PostgreSQL
- Vercel
- Hono (API REST en `apps/api`)
- Husky
- PNPM
- Vitest
