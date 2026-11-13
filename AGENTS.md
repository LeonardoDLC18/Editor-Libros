# Instrucciones para futuras sesiones de IA

Este repositorio es un editor local de libros educativos de Computación y Robótica. Lee primero `docs/STATUS.md` para conocer la etapa real y `docs/DATA_MODEL.md` antes de editar JSON. El prompt constructor describe el proyecto futuro; no implica autorización para implementar todas sus etapas en cada sesión.

## Reglas obligatorias

- Para tareas normales de contenido, no modificar el motor del editor, los componentes React ni los estilos estructurales. Modificar el motor solo cuando el usuario lo solicite.
- Las páginas se modifican principalmente en `content/pages/`: un archivo por página.
- El orden general se gestiona en `content/book.json`, mediante `pageOrder`.
- Los cambios de diseño global se realizan en `content/design.json`.
- Las imágenes se guardan en `assets/`. Los diagramas editables se guardan en `diagrams/svg/`.
- No convertir una página completa en imagen. Mantener títulos, párrafos y tarjetas como datos y HTML.
- No cambiar fuentes, colores o tamaños globales cuando el usuario solamente solicita contenido.
- No entregar fragmentos para copiar y pegar. Trabajar directamente sobre los archivos del proyecto.
- Ejecutar `npm run validate` después de modificar contenido. En PowerShell restringido usar `npm.cmd`.
- Actualizar `docs/STATUS.md` cuando se complete una etapa de desarrollo, con resultados reales y la siguiente acción exacta.
- Conservar los archivos de `reference/` y el prompt constructor sin modificarlos.
- No añadir servicios remotos, telemetría, CDN, bases de datos, autenticación o APIs externas.

## Modelo vigente

`schemaVersion: 1`. El esquema ejecutable es `src/types/schema.ts`, compartido por el lector del servidor y el validador. Se admiten las plantillas `cover`, `lesson` y `blank`, y los bloques `heading`, `paragraph`, `separator`, `infoCard`, `image`, `table`, `code`, `steps`, `columns`, `framedColumns`, `grid`, `textImage` y `cardContainer`. La IA puede usar estos bloques al generar futuras páginas, según `docs/DATA_MODEL.md`. No introducir otros bloques futuros hasta implementar y documentar la etapa correspondiente.

Cada página tiene un `id` único y permanente, idéntico al de su entrada en `pageOrder`. Cada bloque tiene un `id` único en todo el libro. Usar minúsculas, números y guiones. No renombrar identificadores al corregir un texto.

Los ids de bloques hijos, columnas, tarjetas y pasos también son únicos en todo el libro. `columns` y `framedColumns` admiten 1–4 columnas horizontales y cualquier bloque vigente, incluidos `cardContainer`, `textImage` y otros contenedores. Máximo 3 niveles de contenedores: columns/framedColumns, cardContainer y textImage cuentan como nivel; los objetos columna/tarjeta no. Al reducir columnas, trasladar todos sus bloques a la última conservada. Las tarjetas internas se adaptan al ancho; las columnas exteriores no se apilan. `cardContainer` comparte las variantes gallery/info (2–4 tarjetas) y comparison (2–3); no descartar tarjetas al cambiar de variante. `steps` es una lista numerada independiente, no un contenedor; los antiguos cardContainer/steps se adaptan al leer, conservando ids y contenido.

## Selección de bloques prediseñados

`grid` permite filas con 1–4 celdas y las mismas distribuciones predefinidas de columns. Filas y celdas tienen ids únicos; grid cuenta como un nivel, filas/celdas no. `rowSpan` admite 1–3 filas consecutivas con igual layout, sin solapamientos. Unir/reducir conserva bloques; eliminar una fila con contenido pide confirmación. Reordenar/cambiar distribución separa los spans conservando contenido. `framedColumns` puede usar `rows`/`gap` con `columns: []`, mediante conversión explícita desde Propiedades; no migrar marcos existentes. Los siete presets de grid están en `src/presets/grids.ts`, en Distribución. Detalles en DATA_MODEL.

Recetas en `src/presets/index.ts`, disponibles en «+ Agregar bloque → Prediseñados». Se insertan como bloques normales independientes, con ids nuevos en todos sus elementos.

- Definición breve + imagen → `¿Qué es...?`; regla o dato importante → `Recuerda`.
- Objetivo de actividad → `Misión`; actividad paso a paso → `Aplicación guiada`.
- Demostración → `Ejemplo`; reflexión → `Pregunta de comprensión`.
- Dos o tres alternativas → `Comparación`; prueba con datos/resultados → `Experimento`.
- Varios conceptos breves → `Conceptos clave`; programa acompañado por explicación → `Código + explicación`.

Variar las composiciones según el contenido; no usar siempre el mismo preset ni llenar una página de contenedores innecesarios. Se mantiene el límite de 3 niveles y la advertencia de ancho.

## Operaciones de contenido

1. Leer la página y las páginas cercanas para conservar el nivel pedagógico.
2. Para agregar una unidad, registrarla en `book.json.units` con `id`, `label` y `title`.
3. Para agregar un tema, crear uno o más JSON en `content/pages/` con una plantilla admitida; registrar cada `{ id, file }` en `pageOrder` y asignar `unitId` existente cuando corresponda.
4. Para agregar imágenes, guardarlas en `assets/images/`, usar rutas relativas con `/` y texto alternativo. No usar Base64 ni URLs externas.
5. Para agregar diagramas, conservar textos y trazos SVG editables. Un bloque `image` puede referenciar un SVG local; editar el SVG desde la interfaz todavía no está implementado. No inventar conexiones técnicas.
6. Ejecutar la validación, corregir errores y revisar las páginas en el navegador. Recargar para ver los cambios externos.
7. Si el contenido excede A4, abreviarlo o dividirlo; no encoger globalmente la tipografía. Hay advertencia visual general de altura y advertencias específicas de tablas. El contenido excedente permanece visible, con el pie debajo; no hay paginación editorial automática. Corregir la advertencia antes de imprimir.

## Verificación y cuidado de archivos

- Después de cambios en el motor, ejecutar `npm run build`, `npm run validate` y `npm test`. Comprobar el arranque y las interacciones afectadas.
- No implementar Playwright ni QA visual avanzado dentro de la etapa 1.
- No afirmar que se probó algo que no se ejecutó. Documentar las limitaciones del entorno.
- El guardado desde la interfaz crea un respaldo previo de esa página en `content/backups/`. Las modificaciones externas no generan respaldo automático: antes de una sustitución amplia del contenido, conservar una copia local de los archivos afectados en `content/backups/` o usar el control de versiones disponible; nunca sobrescribir una copia anterior silenciosamente.
- No borrar cambios ajenos ni inicializar/sincronizar Git sin una solicitud correspondiente.
- Resumir los archivos cambiados, los comandos probados, los errores y los pendientes.
