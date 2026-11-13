# Trabajo de una IA sobre el libro

## Corregir un texto

Solicitud: «Explica con palabras más sencillas qué es un documento digital».

1. Leer `AGENTS.md`, `docs/STATUS.md` y `docs/DATA_MODEL.md`.
2. Leer `content/pages/page-002-concepto.json` y el contexto de la portada.
3. Modificar el texto de `concept-intro`, conservando su identificador, tipo y los demás bloques.
4. Guardar el JSON en UTF-8 y ejecutar `npm run validate`.
5. Recargar el navegador, seleccionar la página 2 y revisar que el texto quepa.
6. Informar del cambio y del resultado real de la validación. No cambiar el motor o el diseño global.

## Agregar un tema con las plantillas actuales

Solicitud: «Agrega dos páginas conceptuales sobre instrucciones y algoritmos».

1. Leer el modelo y las páginas vecinas. Comprobar que el usuario solicita contenido compatible con `lesson`.
2. Si hace falta, añadir una unidad a `content/book.json` con un identificador nuevo.
3. Crear `content/pages/page-003-algoritmos.json` y `page-004-instrucciones.json`, con `template: lesson`, `theme`, título, metadata y bloques admitidos. Mantener los identificadores de páginas y bloques únicos.
4. Añadir sus entradas `{ id, file }` en el lugar deseado de `pageOrder`.
5. Añadir recursos locales si son necesarios; no copiar páginas del PDF como imágenes.
6. Ejecutar `npm run validate`, corregir y revisar ambas páginas recargando el navegador.

La gestión de páginas desde la interfaz pertenece a la etapa 3; los archivos sí pueden editarse directamente desde ahora. No hay comando `npm run qa` ni editor de código/tablas en esta etapa. Si la solicitud necesita bloques nuevos, informar del límite y aplicar la etapa correspondiente solo si está autorizada.

## Cambiar el diseño por solicitud expresa

Modificar únicamente los tokens necesarios en `content/design.json`, validar y revisar todas las páginas. Las variables CSS se generan al cargar el libro. Para una tarea normal de contenido, conservar colores, fuentes y tamaños.

## Continuar el desarrollo

Consultar la siguiente acción de `docs/STATUS.md`. Implementar la etapa autorizada, probar los comandos documentados y registrar qué se ejecutó realmente. Conservar `reference/` intacto y mantener separados motor, contenido, diseño y recursos.
