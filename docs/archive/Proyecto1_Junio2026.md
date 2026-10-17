## Proyecto 1

## Red FaCyT: Aplicación Web para Publicaciones Académicas y Vida Universitaria

## 1. Presentación del proyecto

Durante el desarrollo de la asignatura Desarrollo de Aplicaciones Web, los estudiantes deberán planificar, diseñar, construir, probar y presentar una aplicación Web funcional, organizada bajo un esquema de trabajo incremental.

El proyecto integrador consistirá en el desarrollo de una red web institucional para la Facultad Experimental de Ciencias y Tecnología, denominada provisionalmente Red FaCyT. Esta aplicación tendrá como propósito simular una plataforma digital donde miembros de la comunidad universitaria puedan publicar, consultar y organizar información relacionada con la vida académica, estudiantil e institucional de la facultad.

La intención del proyecto no es copiar visualmente una red social comercial, sino comprender cómo se estructura y desarrolla una aplicación Web moderna, aplicando arquitectura cliente- servidor, diseño de interfaces, consumo de APIs, persistencia de datos, autenticación,

autorización básica, control de versiones, trabajo colaborativo y documentación técnica.

## 2. Propósito formativo

El proyecto busca que los estudiantes integren los conocimientos de la asignatura mediante la construcción progresiva de una aplicación Web funcional, poniendo en práctica:

- planificación inicial de una solución Web;

- levantamiento y organización de requerimientos;

- diseño de navegación e interfaz;

- modelado de datos;

- desarrollo frontend;

- desarrollo backend;

- diseño y consumo de APIs;

- conexión con base de datos;

- autenticación y control básico de acceso;

- pruebas funcionales;

- documentación técnica;


- gestión del trabajo mediante Kanban;

- defensa técnica del producto desarrollado.

- 3. Organización de los equipos

La sección estará organizada en dos equipos de trabajo.

Cada equipo deberá distribuir internamente sus responsabilidades, procurando que todos los integrantes participen en actividades de análisis, diseño, desarrollo, prueba, documentación y defensa.

Aunque el trabajo será grupal, la evaluación incluirá defensas individuales. Por tanto, cada estudiante deberá estar en capacidad de explicar no solo la parte que desarrolló, sino también la lógica general de la aplicación, las decisiones técnicas tomadas por el equipo y la forma en que se integran los distintos componentes del sistema.

- 4. Descripción general de la aplicación

Red FaCyT será una aplicación Web orientada a la publicación y consulta de contenidos institucionales, académicos y estudiantiles de la Facultad Experimental de Ciencias y Tecnología.

La aplicación podrá incluir publicaciones relacionadas con:

- eventos académicos;

- actividades de la facultad;

- proyectos estudiantiles;

- defensas de trabajos especiales de grado;

- talleres, charlas o jornadas;

- avisos de interés;

- logros de estudiantes o profesores;

- iniciativas de investigación;

- vida estudiantil;

- información de departamentos, laboratorios o grupos académicos.


El equipo deberá definir el alcance exacto de su versión MVP, justificando qué funcionalidades serán desarrolladas durante el período de la asignatura y cuáles quedarán fuera del alcance.

- 5. Alcance mínimo obligatorio del MVP

Cada equipo deberá desarrollar una aplicación Web funcional que incluya, como mínimo, las siguientes capacidades:

- a. Gestión de usuarios

La aplicación deberá permitir el registro e inicio de sesión de usuarios. Cada usuario deberá tener una identificación básica dentro del sistema.

El equipo deberá definir los tipos de usuario o roles necesarios para su propuesta. Como mínimo, se espera diferenciar entre usuarios comunes y usuarios con funciones de administración o moderación.

La contraseña de los usuarios no podrá almacenarse en texto plano.

## b. Publicaciones

La aplicación deberá permitir crear, consultar, editar y eliminar publicaciones, de acuerdo con los permisos definidos por el equipo.

Cada publicación deberá contener, como mínimo:

- título;

- contenido o descripción;

- autor;

- fecha de publicación;

- categoría o tipo de publicación;

- estado visible o no visible.

El equipo podrá proponer otros campos si lo considera necesario, siempre que justifique su incorporación.

- c. Feed o muro principal

La aplicación deberá mostrar un muro o feed principal donde se visualicen las publicaciones registradas.


Como mínimo, las publicaciones deberán mostrarse ordenadas por fecha. Además, la aplicación deberá permitir algún mecanismo de organización o filtrado, por ejemplo:

- por categoría;

- por tipo de publicación;

- por autor;

- por fecha;

- por estado;

- por palabra clave.

El equipo deberá justificar cuál mecanismo de organización resulta más adecuado para una red institucional de la facultad.

## d. Administración o moderación básica

La aplicación deberá contemplar alguna funcionalidad de administración o moderación, de manera que ciertos usuarios puedan revisar, ocultar, eliminar o gestionar publicaciones.

El equipo deberá definir claramente qué puede hacer cada tipo de usuario y qué restricciones tendrá dentro de la aplicación.

## e. Diseño de interfaz

La aplicación deberá contar con una interfaz clara, organizada y usable.

No se evaluará la copia estética de redes sociales comerciales. Se evaluará que la interfaz sea coherente, funcional, comprensible y adecuada para el contexto universitario.

La aplicación deberá tener, como mínimo:

- pantalla de inicio o bienvenida;

- pantalla de registro o inicio de sesión;

- pantalla principal o feed;

- formulario de creación de publicaciones;

- vista de detalle o edición de publicación;

- vista o sección de administración, si aplica.

## f. Backend y API


La aplicación deberá contar con un backend que permita procesar solicitudes, aplicar reglas de negocio, validar datos, conectarse con la base de datos y responder a la interfaz mediante servicios o endpoints.

El equipo deberá definir, documentar y justificar las rutas o servicios necesarios para el

funcionamiento de la aplicación.

## g. Base de datos

Cada equipo deberá diseñar su propio modelo de base de datos de acuerdo con los requerimientos de su aplicación.

No se entregará un modelo de tablas predefinido, ya que el diseño de la base de datos forma parte de la evaluación del proyecto.

El equipo deberá presentar y defender:

- entidades identificadas;

- relaciones entre entidades;

- claves primarias y foráneas;

- restricciones básicas;

- normalización;

- decisiones de diseño;

- correspondencia entre la base de datos y las funcionalidades de la aplicación.

## h. Seguridad básica

La aplicación deberá considerar medidas mínimas de seguridad, tales como:

- validación de datos en frontend y backend;

- protección de rutas privadas;

- manejo seguro de contraseñas;

- control de acceso según el rol del usuario;

- manejo básico de errores;

- prevención de exposición innecesaria de información sensible.

## i. Repositorio y documentación


Cada equipo deberá trabajar con un repositorio de control de versiones.

El repositorio deberá mantenerse organizado y contener, como mínimo:

- estructura clara de carpetas;

- historial de commits;

- archivo README;

- instrucciones de instalación o ejecución;

- descripción del proyecto;

- tecnologías utilizadas;

- integrantes del equipo;

- funcionalidades implementadas;

- funcionalidades pendientes o futuras mejoras.

## 6. Gestión del proyecto con Kanban

Cada equipo deberá gestionar el desarrollo del proyecto mediante un tablero Kanban.

El tablero deberá permitir visualizar el avance real del trabajo durante las semanas de desarrollo. No será aceptado un tablero creado únicamente al final para simular organización.

Como mínimo, el tablero deberá contener las siguientes columnas:

- Pendiente;

- En análisis;

- En desarrollo;

- En prueba;

- En revisión;

- Terminado.

Cada tarea del tablero deberá estar redactada de forma clara y concreta. Se recomienda que las tareas estén vinculadas con historias de usuario, funcionalidades, correcciones, pruebas o documentación.

Cada tarjeta deberá indicar, al menos:


- nombre de la tarea;

- responsable;

- estado actual;

- prioridad;

- fecha estimada o semana de trabajo;

- breve descripción;

- evidencia o enlace cuando aplique.

Durante las defensas parciales, el equipo deberá mostrar el tablero Kanban y explicar:

- qué tareas fueron completadas;

- qué tareas están en proceso;

- qué dificultades se presentaron;

- qué decisiones se tomaron;

- qué ajustes se hicieron al alcance;

- cómo se distribuyó el trabajo;

- qué evidencias respaldan el avance presentado.

El uso de Kanban será parte de la evaluación del proyecto, no solo como herramienta administrativa, sino como evidencia del proceso de desarrollo seguido por el equipo.

## 7. Entregas parciales del proyecto

El proyecto se desarrollará mediante entregas incrementales. Cada entrega será revisada y defendida.

## Entrega 1: Definición del proyecto y alcance

El equipo deberá presentar:

- nombre de la aplicación;

- propósito de la aplicación;

- usuarios previstos;

- funcionalidades del MVP;


- funcionalidades fuera del alcance;

- historias de usuario;

- criterios de aceptación;

- riesgos iniciales;

- tablero Kanban inicial.

## Entrega 2: Diseño funcional y arquitectura

El equipo deberá presentar:

- flujo de navegación;

- prototipo inicial de pantallas;

- arquitectura propuesta;

- estructura general del proyecto;

- tecnologías seleccionadas;

- justificación de las decisiones técnicas;

- avance del tablero Kanban.

## Entrega 3: Modelo de datos y backend inicial

El equipo deberá presentar:

- modelo entidad-relación;

- explicación de las entidades y relaciones;

- scripts o migraciones iniciales;

- configuración del backend;

- primeros servicios o endpoints;

- pruebas iniciales de funcionamiento;

- avance del tablero Kanban.

## Entrega 4: Autenticación, autorización y CRUD principal

El equipo deberá presentar:


- registro de usuarios;

- inicio de sesión;

- manejo seguro de contraseñas;

- protección de rutas;

- permisos según tipo de usuario;

- creación, consulta, edición y eliminación de publicaciones;

- avance del tablero Kanban.

## Entrega 5: Integración frontend-backend

El equipo deberá presentar:

interfaz conectada con la API;

visualización real de publicaciones desde la base de datos;

formularios funcionales;

validaciones;

manejo de errores;

flujo completo de uso;

avance del tablero Kanban.

## Entrega 6: Proyecto final y defensa técnica

El equipo deberá presentar:

- aplicación funcional;

- repositorio actualizado;

- documentación técnica;

- pruebas realizadas;

- explicación de la arquitectura;

- explicación del modelo de datos;

- demostración del flujo completo;


- tablero Kanban final;

- reflexión sobre dificultades, decisiones y mejoras futuras.

## 8. Funcionalidades de bonificación

Además del alcance mínimo obligatorio, los equipos podrán incorporar funcionalidades adicionales. Estas funcionalidades no sustituyen los requisitos básicos del proyecto, pero podrán sumar bonificación si están correctamente implementadas, integradas y defendidas.

Algunas posibles bonificaciones son:

- carga de imágenes en publicaciones;

- comentarios en publicaciones;

- reacciones o 
me interesa
;

- búsqueda avanzada;

- etiquetas o hashtags;

- seguimiento de usuarios o secciones;

- publicaciones destacadas;

- notificaciones internas;

- panel de estadísticas;

- modo oscuro;

- diseño responsivo avanzado;

- integración con un servicio externo;

- consumo de una API pública;

- uso de inteligencia artificial para sugerir categorías, mejorar redacción o resumir publicaciones;

- pruebas automatizadas básicas;

- despliegue en un servidor o plataforma gratuita;

- documentación técnica ampliada.

La bonificación solo será considerada cuando la funcionalidad esté operativa, tenga sentido dentro del proyecto y el equipo pueda explicar cómo fue implementada.


No se otorgará bonificación por funcionalidades copiadas, incompletas o que afecten la

estabilidad del sistema principal.

- 9. Uso permitido de inteligencia artificial generativa

El uso de herramientas de inteligencia artificial generativa estará permitido como apoyo al proceso de aprendizaje y desarrollo, siempre que el estudiante mantenga el control intelectual y técnico sobre el trabajo realizado.

La IA podrá ser utilizada para:

- explorar ideas;

- revisar requerimientos;

- proponer alternativas de diseño;

- explicar errores;

- sugerir mejoras de código;

- generar datos de prueba;

- revisar documentación;

- apoyar la elaboración de casos de prueba;

- comparar soluciones técnicas.

No estará permitido entregar código, diagramas, explicaciones o documentación que el estudiante no pueda comprender, modificar y defender.

Cada equipo deberá incluir en sus entregas una sección denominada Uso declarado de IA, donde indique:

- herramienta utilizada;

- propósito de uso;

- resultado obtenido;

- modificaciones realizadas por el equipo;

- decisiones aceptadas o descartadas;

- aprendizaje obtenido.


Durante la defensa, se podrá solicitar explicación de cualquier fragmento de código, decisión de diseño, consulta de base de datos, estructura de API o componente de interfaz,

independientemente de que haya sido apoyado por IA.

## 10. Criterios generales de evaluación

La evaluación considerará tanto el producto final como el proceso de desarrollo.

Se valorarán los siguientes aspectos:

- claridad del alcance definido;

- pertinencia de las funcionalidades;

- calidad del diseño de la base de datos;

- coherencia de la arquitectura;

- funcionamiento del backend;

- funcionamiento del frontend;

- integración entre frontend, backend y base de datos;

- seguridad básica;

- uso correcto del repositorio;

- gestión del proyecto mediante Kanban;

- documentación técnica;

- calidad de la interfaz;

- pruebas realizadas;

- participación de los integrantes;

- defensa individual y grupal;

- capacidad para justificar decisiones;

- capacidad para reconocer errores y plantear mejoras.

## 11. Condiciones importantes

El proyecto debe ser desarrollado de manera progresiva durante el período de la asignatura. No se aceptarán entregas finales que no hayan sido acompañadas de avances parciales.


Cada equipo deberá conservar evidencias del proceso de trabajo, incluyendo repositorio, tablero Kanban, documentación, pruebas y versiones parciales.

Durante la defensa del proyecto, se podrán realizar preguntas individuales a cualquier integrante del equipo sobre el funcionamiento de la aplicación, la estructura del código, el modelo de datos, las rutas del backend, la interfaz, las validaciones, el uso de IA o las decisiones tomadas durante el desarrollo.

El objetivo final no es entregar una aplicación perfecta, sino demostrar que el equipo comprende el proceso de construcción de una aplicación Web funcional, desde su planificación inicial hasta su integración, prueba, documentación y defensa técnica.

## 12. Producto esperado

Al finalizar el proyecto, cada equipo deberá entregar y defender una aplicación Web funcional denominada Red FaCyT o con el nombre específico que el equipo decida asignarle.

La aplicación deberá evidenciar que el estudiante es capaz de analizar, diseñar, desarrollar, integrar, probar y presentar una solución Web coherente con el contexto institucional de la Facultad Experimental de Ciencias y Tecnología.
