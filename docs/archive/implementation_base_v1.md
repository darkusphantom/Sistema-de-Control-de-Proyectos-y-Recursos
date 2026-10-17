# Requisitos bases para construir la estructura principal

Para la fase 0 vamos a implementar la estructura basica del proyecto y el alcance minimo. Entre ello incluye las siguientes vistas:

- Login
- Dashboard, feed o Home
- Perfil de usuario


Todas estas implementaciones se van a realizar utilizando datos estaticos. No se va a implementar el backend hasta que tengamos la estructura principal lista.

## Auth

- Registro y Login de usuario
- Los usuarios seran: Estudiantes, Profesor y Admin
- La contrasena se guarda codificada
- Integrar la recuperacion de contrasena

## Publicaciones

Las publicaciones deben contener:

- titulo
- autor
- categoria
- Descripcion de la publciacion
- Imagen
- Tipo de visibilidad (Visible para ti o para todos)
- Tipo de publicacion (post, articulo, ensenanza)
- Fecha de publciacion

En la vista se muestran los detalles completos. En el Home se muestran como cards.

En la vista completa donde se muestran los detalles completo de la publicacion, el autor puede editarlo desde ahi. Puede editar todo menos la fecha de publicacion.

## Feed

En el feed o dashboard o pagina de inicio (home), debe mostrar:

- Publicaciones ordenadas por fecha de publicacion (desde la mas reciente a la mas antigua)
- Agregar buscador y filtros
- Los filtros pueden ser por categoria,, facultad, estado, palabra clave, tipo de publicacion, fecha de inicio y final, y autor
- Se deben mostrar todas las publicaciones, menos las publicaciones no visibles (salvo que seas el mismo usuario quien la creo). Es decir, el usuario no puede ver las publicaciones de los otros usuarios que hayan colocado que sea visible para el.

## Vista de Admin

Por el momento solo debe asignar roles y permisos a los usuarios creados


