# Alcance de la primera versión útil

## Entrega de esta sesión: etapa 1

- Aplicación local React, TypeScript y Vite, con un servidor Express ligado a `127.0.0.1`.
- Un solo comando para arrancar todo: `npm run dev`.
- Interfaz en español: barra superior, lista de páginas, lienzo A4 y propiedades.
- Lectura de un libro definido por JSON separados, con portada y página conceptual.
- Plantillas `cover` y `lesson`; bloques `heading`, `paragraph`, `infoCard` e `image`.
- Recursos por rutas relativas; tokens globales de diseño; fuentes instaladas localmente.
- Selección de página y bloque, zoom, vista previa e impresión básica mediante el navegador.
- Validación de esquemas, identificadores y referencias; compilación comprobable.
- Documentación para que una IA de VS Code modifique el contenido directamente.

Esta entrega es una base funcional de lectura e inspección. El botón Guardar muestra el estado real de la etapa; no escribe archivos. No se usa localStorage como fuente de datos.

## MVP editable futuro

La primera versión útil para autoría desde el navegador necesitará las etapas 2 a 6: texto y guardado real, gestión de páginas, imágenes/tablas/código, respaldos y cambios externos, e impresión y validación avanzada.

## Fuera de esta entrega

Edición enriquecida, tablas, carga o reemplazo de imágenes, edición SVG, alta/baja/reordenación de páginas por interfaz, restauración, respaldos automáticos, conflictos, vigilancia del contenido, ZIP, 18 plantillas, Electron, Git integrado, Playwright y generación avanzada de PDF. Tampoco se reconstruyen las 21 páginas del libro de referencia.
