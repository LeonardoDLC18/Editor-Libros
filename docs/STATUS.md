# Estado del proyecto

## Formato inline global — 14 de noviembre de 2026

- Implementado B/I/Resaltar en la infraestructura inline existente, reutilizando `formatStep`, `editStepText`, `StepSpan`, `FormattedText` y el estilo `step-highlight`. Barra compacta en portal fixed, situada según el Range en coordenadas del viewport; conserva selección/foco, refleja marcas activas y permite combinarlas/quitarlas. Sin dependencias, fuentes, tamaños ni otros formatos nuevos.
- Integrado en los campos editables existentes: títulos/subtítulos de página, heading/paragraph, tarjetas e infoCards, pasos, preguntas/etiquetas/celdas, contenedores/marcos/grids, captions y código. Encabezado, pie, numeración y controles siguen excluidos. Pasos y contentSpans conservan sus modelos; el resto usa el mapa opcional richText con los mismos segmentos, sin migración masiva ni HTML almacenado. Guardado/dirty/historial existentes; duplicar conserva las rutas con ids nuevos.
- Archivos: InlineText y renderizadores asociados; nuevos `utils/richText.ts` y `renderer/TextFormattingToolbar.tsx`; ajustes puntuales en schema, savePage, duplicación de bloques/páginas y editor.css. Pruebas en blocks.test y documentación DATA_MODEL/STATUS. Contenido original, design.json, reference y dependencias intactos.
- Verificación: build correcto; validate correcto (13 páginas, 139 bloques); npm test 36/36. Build necesitó salir del sandbox por acceso de esbuild; test por uv_os_get_passwd. Chrome sobre libro temporal: 28 comprobaciones correctas, incluidos formatos parciales/combinados, toggles, selección/foco, edición posterior, tarjetas, preguntas, celdas, títulos, Pasos heredados, zoom 75/100/125, Ctrl+S y recarga, vista previa y exclusión de la barra al imprimir. PDF generado; sin excepciones JavaScript.
- Arrastre: los eventos de los tiradores reordenaron contenido con formato conservando marcas. El gesto nativo no pudo confirmarse: headless no inició drag y la instancia oculta no completó el auxiliar. No se afirma verificación física de ese gesto ni impresión física. Las rutas de formato de tablas usan coordenadas: insertar/reordenar filas o columnas desde Propiedades no reasigna sus formatos; queda fuera de la selección y edición de celda comprobadas.
- Evidencias: `.tmp/format-check.mjs`, `.tmp/format-results.json`, `.tmp/format-drag-events-results.json`, `.tmp/format-print.pdf`; libro temporal indicado en `.tmp/format-root.txt`. Se cerraron los procesos de prueba. Servidor habitual reiniciado con el código actualizado en 127.0.0.1:5173, sin escrituras de prueba al libro original.
- Siguiente acción exacta: guardar cualquier borrador abierto, recargar http://127.0.0.1:5173, seleccionar un fragmento del contenido A4 y usar B/I/Resaltar; Ctrl+S persiste las marcas. Confirmar manualmente el gesto nativo de arrastre. No iniciar otras etapas.

## Edición inline de textos — 14 de noviembre de 2026

- Infraestructura reutilizable `renderer/InlineText.tsx`, conectada a `usePageEditing.change` y `utils/blocks.updateBlock`, como Propiedades. Las celdas conservan el callback `editCell`. Actualización inmediata del borrador y del panel, dirty y guardado global existentes; sin autosave nuevo.
- Integrada en títulos/subtítulos/texto secundario de página, headings, párrafos, tarjetas, rótulos, títulos de contenedores y marcos con filas, pasos, preguntas y etiquetas/celdas informativas, tablas, código y captions editables. Funciona dentro de columns/grids/presets. Pasos y tarjetas informativas reutilizan `editStepText` para conservar segmentos y marcas; no se almacena HTML.
- Un clic enfoca el campo y selecciona su bloque/tarjeta; bordes y tiradores mantienen su selección. Enter confirma campos de una línea e inserta salto en los multilínea. Escape confirma y sale (no restaura el valor anterior); salir de foco confirma. Pegar admite solo texto. El foco sin cambios no marca dirty. Arrastrar texto no mueve bloques; los tiradores mantienen el drag existente.
- Encabezado/pie, numeración, controles y texto administrativo siguen sin edición inline. Theme/eyebrow y captions de imágenes heredadas de Pasos permanecen de solo lectura porque el panel/guardado actual no permite editarlos. Vista previa e impresión renderizan texto sin controles inline.
- Archivos: nuevo InlineText; ajustes en Editor, BlockRenderer, PageHeading, CardContainer, Steps, Questions, TableBlock y LocalImage; reglas puntuales en editor.css. Sin cambios de esquema, JSON del libro, dependencias, diseño global, servidor, sistema de atajos ni operaciones de drag.
- Verificación final: `npm.cmd run build` correcto; `npm.cmd run validate` correcto (13 páginas, 139 bloques); `npm.cmd test` 34/34. Los intentos restringidos fallaron por `uv_os_get_passwd` y acceso de esbuild; los tres comandos finalizaron correctamente fuera del sandbox. `git diff --check` correcto.
- Chrome con copia temporal del libro y servidor real en 5176: edición/selección, multilínea, tarjetas, resaltado de Pasos, preguntas, celda, marco con grid y texto anidado; sincronización con Propiedades en ambos sentidos; Ctrl+C/X/V, pegado literal, Delete sin eliminar bloque, Enter/Escape, salida de foco, Ctrl+S y recarga persistente. También título/subtítulo de página, captions editables y exclusión de captions heredados, selección de padre y reordenamiento real con mouse desde el tirador. Cero excepciones JavaScript. PDF generado sin contenteditable en las páginas de impresión. Sin impresión física ni recorrido exhaustivo de todas las combinaciones de contenedores.
- Evidencias y auxiliares en `.tmp/inline-*.mjs`, `.tmp/inline-*-results.json`, `.tmp/inline-results.json` y `.tmp/inline-print.pdf`; libro de prueba en `.tmp/inline-book/`. El libro original no recibió escrituras de prueba.
- Siguiente acción exacta: guardar cualquier borrador abierto, recargar **http://127.0.0.1:5173** y hacer clic sobre un texto del contenido A4 para editarlo; guardar con Ctrl+S. Las siguientes etapas siguen fuera de alcance.

## Drag & Drop, fase 3 ? 14 de noviembre de 2026

- Zonas laterales crean columns de dos columnas o ampl?an la fila existente hasta cuatro; arriba/abajo mantienen moveBlock. Tirador overlay para ordenar columnas/celdas completas dentro de su fila, con proporciones de fila conservadas. Ruta de selecci?n clickeable en el editor; encabezados y bordes conservan la selecci?n directa existente.
- Cambios limitados a Editor, BlockDrag/BlockRenderer/Grid, nuevos ColumnHandle/SelectionPath y utils/structuralDrag, y estilos de controles. Sin cambios de esquema, dependencias, guardado ni contenido del libro.
- Verificaci?n: build correcto fuera del sandbox (Vite encontr? acceso denegado dentro), validate correcto (12 p?ginas, 129 bloques), suite existente 34/34. Comprobaciones en memoria en `.tmp/structural-check.ts`: composici?n lateral, orden e ids, rechazo de quinta columna y ciclos, cambio aislado de fila grid.
- L?mite conservador: no se transforman ni reordenan celdas de grids con rowSpan mayor que uno; se rechaza el drop. Columnas completas se reordenan dentro de su propia fila. La entrada Fila de la ruta lleva a su primera celda, que es el destino seleccionable existente.
- Siguiente acci?n exacta: comprobar A?J en navegador, incluidos tiradores, ruta, encabezado, scroll, zoom y guardar/F5. Estas interacciones y la persistencia del nuevo flujo no se verificaron en esta sesi?n.


## Drag & Drop, fase 2 ? 14 de noviembre de 2026

- Movimiento entre listas de bloques de la misma p?gina, con destinos vac?os, conservaci?n de ids y contenido, y rechazo de ciclos y profundidad excesiva. Usa el historial y guardado existentes; sin cambios de esquema ni dependencias.
- Verificaci?n: `npm.cmd run build` y `npm.cmd run validate` correctos (12 p?ginas, 129 bloques); `npm.cmd test` 34/34 fuera del sandbox tras el fallo conocido de `uv_os_get_passwd`. No se verificaron a?n los arrastres, el desplazamiento ni guardar/F5 en navegador.
- Siguiente acci?n exacta: probar los movimientos entre ra?z, columnas y celdas, destinos vac?os y rechazos de ciclos; comprobar scroll y guardar/F5 en el editor.


## Drag & Drop, fase 1 — 14 de noviembre de 2026

- Reordenamiento vertical mediante un tirador discreto y un indicador, limitado a bloques hermanos de la página, columnas y celdas. Conserva los bloques e identificadores y usa el historial y guardado existentes; no modifica el esquema ni incorpora dependencias.
- Verificación: `npm.cmd run build` y `npm.cmd run validate` correctos (12 páginas, 126 bloques); `npm.cmd test` 34/34 fuera del sandbox, tras un fallo de `uv_os_get_passwd` dentro de él. No se comprobó el arrastre ni la persistencia en navegador en esta sesión.
- Siguiente acción exacta: probar arrastre y cancelación en página, columna y celda, mover un contenedor completo, comprobar ids, edición de texto y guardar/recargar.

- Fecha: 12 de noviembre de 2026 (America/Lima).
- Etapa actual: **4 ampliada — distribución guiada con filas y celdas**.

## Plantilla inicial de Portada — 12 de noviembre de 2026

- La creación de una página «Portada» genera ahora una composición editable con el encabezado y pie A4 existentes, título y subtítulo genéricos, imagen principal reemplazable y un contenedor inferior 60/40 con objetivo e imagen complementaria. Ambos espacios visuales reutilizan `assets/images/preset-image.svg`, cuyo propio diseño indica cómo reemplazarlo desde Propiedades.
- El cambio está limitado a `createPage` en `server/managePages.ts`. No modifica esquema, componentes, CSS, datos existentes ni la creación de Página conceptual/Página en blanco. Las portadas guardadas conservan su estructura.
- Prueba añadida en `scripts/pages.test.ts`, con el recurso copiado por `scripts/testBook.ts`: estructura e ids internos, edición/guardado de título, subtítulo, objetivo e imagen, y regresión de las otras dos plantillas. `npm.cmd run build`: correcto (68 módulos); `npm.cmd run validate`: correcto (3 páginas, 41 bloques); `npm.cmd test`: 34/34.
- Siguiente acción exacta: reiniciar el servidor si ya estaba abierto, crear «+ Nueva página → Portada», editar los campos y bloques desde Propiedades, reemplazar ambos marcadores y guardar/recargar.

## Grid con filas y celdas — 12 de noviembre de 2026

- Implementado `grid`: varias filas, nueve distribuciones predefinidas de 1–4 columnas, celdas con bloques existentes, altura automática, gaps compactos y alineación arriba/centro/abajo. Siete presets en «+ Agregar bloque → Distribución». Selección discreta y destino global de inserción; sin controles permanentes dentro de A4.
- `rowSpan` de 1–3 solo sobre filas consecutivas con igual layout, sin solapamientos. Unir conserva bloques en la celda inicial; reducir columnas los traslada a la última conservada. Cambiar distribución, mover o eliminar filas separa los spans conservando contenido. Eliminación de filas con bloques requiere confirmación y admite deshacer. El panel explica estas reglas.
- `framedColumns` incorpora el mismo grid mediante «Usar filas y columnas», conserva encabezado, ids y contenido, sin nuevo motor ni nivel extra. Conversión explícita y reversible incluso tras guardar. Esquema v1, recorridos recursivos, duplicación de ids, recursos, validación y guardado ampliados; no se migraron páginas existentes ni se cambiaron dependencias o tokens globales.
- Archivos: nuevos `utils/grid`, `renderer/Grid`, `editor/GridProperties`, `presets/grids`; ajustes en schema, utils/blocks, BlockRenderer, Editor/Properties/BlockPicker, savePage, book.css/editor.css, copia de dependencia de la prueba CLI, AGENTS/DATA_MODEL/STATUS. Copia previa en `.tmp/grid-source-68e0a3f987b548979e1a7f00cba44612` (sin Git).
- Verificación: `npm.cmd run build` correcto (68 módulos); `npm.cmd run validate` correcto (4 páginas, 21 bloques); `npm.cmd test` 33/33. Chrome sobre libro temporal completó A–F: texto/imagen, resultado a ancho completo, imagen ocupando dos filas, 2×2, steps insertado desde el botón global, guardar/F5 y reinicio real. También se verificaron operaciones de filas, spans 1/2/3, conservación de texto, confirmación/deshacer y conversión/deshacer/rehacer de un marco ya guardado.
- Vista previa y CSS de impresión: medidas de grid iguales; cuatro páginas A4 de 794 × 1123 px, sin controles, selección ni overflow horizontal. Cero excepciones JavaScript. Captura `.tmp/grid-span.png` inspeccionada; resultados `.tmp/grid-check.json`, auxiliar `.tools/grid-check.mjs` reutiliza el servidor temporal/CDP existentes. Índice, diseño y páginas originales conservados byte a byte. Sin impresión física.
- Incidencias resueltas: tsx necesitó ejecución autorizada fuera del sandbox por `uv_os_get_passwd`. La primera comparación de vista previa usaba coordenadas absolutas; se corrigió para comparar geometría relativa a la hoja centrada y el recorrido completo pasó. Instancia habitual reiniciada con el nuevo esquema en 5173, API HTTP 200.
- Siguiente acción exacta: guardar cualquier borrador abierto, recargar **http://127.0.0.1:5173** y usar **+ Agregar bloque → Distribución**. Para un marco existente: seleccionarlo y pulsar **Usar filas y columnas**. Sin pendientes funcionales detectados en los casos solicitados; la etapa 5 sigue fuera del alcance.

## Biblioteca de bloques prediseñados — 12 de noviembre de 2026

- Diez recetas centralizadas en `src/presets/index.ts`, en «+ Agregar bloque → Prediseñados», con nombre, icono y descripción. Inserción normal en página/columna, selección del bloque principal, cambios pendientes e ids nuevos para bloques, columnas, tarjetas y pasos. Sin vínculo posterior a la receta, nuevos tipos de bloque ni dependencias.
- Composiciones diferenciadas: definición con imagen 60/40; Recuerda horizontal compacto; Misión de una columna; Aplicación guiada con steps e imagen; Ejemplo con título/texto/resultado; Pregunta compacta sin columnas; Comparación de dos tarjetas; Experimento con instrucción y tabla/observación; tres Conceptos clave; Código + explicación 60/40. Imagen inicial local reemplazable.
- `infoCard` incorpora presentación opcional, icono y segmentos con formato, reutilizando el control y renderizado de Pasos. Modelo, validación y guardado mantienen schemaVersion 1 y tarjetas anteriores. Iconos compartidos de idea, objetivo y pregunta; duplicación de bloques internos e intercambio de lados con ids/contenido conservados. Estilos puntuales con los tokens existentes; sin cambios de tipografía, colores o espaciado global.
- Archivos: registro; `utils/blocks`, BlockPicker/Properties, control FormattedTextField extraído de StepsProperties y renderizador FormattedText compartido con Steps/BlockRenderer; Icon/CardContainerProperties; schema/savePage; book.css/editor.css; `assets/images/preset-image.svg`; AGENTS/DATA_MODEL/STATUS. Copia previa del código en `.tmp/presets-source-bf8e3ecdc98345dc88bd37bd8ffdee24` (sin Git).
- Verificación: build correcto (64 módulos); validate correcto (4 páginas, 21 bloques); npm test 33/33. Chrome sobre libro temporal: A Recuerda editado, negrita/resaltado/icono persistentes y altura 42 px; B pasos e imagen reemplazada con guardado/recarga; C tres tarjetas horizontales; D código y explicación editados, lados intercambiados; E copias con todos los ids diferentes. También duplicar/deshacer/rehacer e inserción en columna estrecha permitida con aviso. Las diez recetas pasan el esquema y generan copias independientes.
- Vista previa inspeccionada y CSS de impresión comprobado: cuatro páginas de prueba A4 (794 × 1123 px), sin controles ni overflow horizontal; cero excepciones JavaScript. Índice, diseño y páginas originales intactos byte a byte. Sin impresión física. Evidencias `.tmp/presets-check.json`, `.tmp/presets-remember.png`; auxiliares `.tools/presets-{check,server}.mjs`.
- Incidencias resueltas: suite/Chrome requirieron ejecución fuera del sandbox por `uv_os_get_passwd`; el auxiliar de selección de texto necesitó un evento de teclado real de Chrome para activar el formato. Servidor habitual reiniciado para cargar esquema/guardado; menú de diez opciones comprobado en 5173 sin editar contenido (`.tmp/presets-live-check.json`).
- Siguiente acción exacta: guardar cualquier borrador abierto, recargar **http://127.0.0.1:5173** y elegir **+ Agregar bloque → Prediseñados**. Servidor funcionando; si se detiene, ejecutar `npm.cmd run dev`. Sin pendientes funcionales detectados; la etapa 5 sigue fuera del alcance.

## Corrección puntual: lienzo limpio y Separador — 12 de noviembre de 2026

- Retirados botones internos y avisos de columnas vacías; destino explícito desde el menú global y selección de columna sin ocupar altura. `separator` con tamaños 6/10/16 px, panel mínimo y guía solo al seleccionar/pasar el cursor. Cambios en renderizador/plantillas, Editor/Properties/BlockPicker, CSS, esquema y campo editable de guardado; DATA_MODEL/AGENTS actualizados.
- Chrome sobre copia temporal: páginas existentes, inserción global en columns/framedColumns, tamaños, mover/eliminar, guardar/recargar y vista previa/impresión A4 sin controles ni overflow. Originales intactos; evidencia `.tmp/separator-check.json` y `.tmp/separator-preview.png`, auxiliar `.tools/separator-check.mjs`. Build y validate correctos (4 páginas, 18 bloques); npm test 33/33. Pruebas/Chrome requirieron salir del sandbox por `uv_os_get_passwd`; sin impresión física.
- Siguiente acción: recargar http://127.0.0.1:5173 y usar «+ Agregar bloque → Distribución → Separador»; seleccionar una columna para insertar dentro. Guardar antes de recargar. Sin pendientes funcionales detectados.

## Pasos como lista editorial — 12 de noviembre de 2026

- `steps` independiente en Contenido: título opcional, numeración automática, edición/orden/duplicado y negrita/cursiva/resaltado por selección; estilos compactos e impresión. Ajustados esquema, guardado, ids, selector, panel y renderizador; documentado en DATA_MODEL/AGENTS. Datos anteriores compatibles, con textos, imágenes e ids conservados y respaldo al guardar; páginas/diseño/índice originales intactos.
- A–E comprobadas en Chrome sobre libro temporal, incluidas columns/framedColumns, quitar resaltado, F5 y reinicio real; PDF generado y estilos de impresión verificados. Build y validate correctos (4 páginas, 16 bloques), suite obligatoria 33/33. tsx/Chrome necesitaron ejecución fuera del sandbox; resuelto bloqueo del watcher temporal. Sin imagen de referencia adjunta ni impresión física.
- Evidencias: `.tmp/steps-check.json`, `steps-list.png`, `steps-columns.png`, `steps-print.pdf`; auxiliares `.tools/steps-{check,server}.mjs`. Siguiente acción: recargar http://127.0.0.1:5173 (instancia reiniciada) y usar «+ Agregar bloque → Contenido → Pasos»; guardar antes de F5. Sin pendientes funcionales detectados.

## Bloques componibles y marco editorial — 11 de noviembre de 2026

- Columnas de 1–4, nueve distribuciones, contenedores anidados hasta 3 niveles y recorridos recursivos de selección, edición, ids, imágenes, guardado y duplicación. Reducir columnas conserva todos los bloques en la última; mover conserva id y propiedades. Selector compartido y botón por columna; tarjetas seleccionables y adaptables al ancho, sin apilar las columnas exteriores.
- Nuevo `framedColumns`: encabezado compacto con icono/título, marco, fondo blanco/celeste, pestaña/banda y opciones de icono/borde. Reutiliza modelo, controles, renderizador y validación de columns; referencia reconstruida en HTML/CSS. Sin dependencias ni cambios de tipografía/espaciado global. Corregida también la persistencia de imageSize/imageFit de galerías existentes.
- Archivos: esquema, utils/blocks, savePage, BlockPicker/Properties/Editor/CardContainerProperties, BlockRenderer/CardContainer, callbacks en PageRenderer/Cover/Lesson, Icon y estilos puntuales; AGENTS/DATA_MODEL/STATUS. Copia previa del código en `.tmp/blocks-source-f789256435aa41ce952bc7e4cb03db93` (no había Git).
- Build y validate correctos (4 páginas, 16 bloques); npm test 33/33. A–F en Chrome sobre libro temporal: cuatro columnas, cardContainer + textImage, marco de dos/tres columnas, edición individual, movimiento sin pérdida, límite de profundidad, guardado, F5, reinicio real y respaldo anterior exacto. PDF generado y geometría de impresión comprobada: columnas horizontales, marcos, sin botones/outlines ni overflow horizontal; sin impresión física. Índice, diseño y páginas originales idénticos byte a byte.
- Evidencias: `.tmp/composable-check.json`, capturas `.tmp/composable-a.png`, `composable-b.png`, `composable-c.png` inspeccionadas y `.tmp/composable-print.pdf`; auxiliares locales `.tools/composable-check.mjs` y `.tools/composable-server.mjs`. La prueba detectó y permitió corregir un selector que quedaba abierto al cambiar de página. Build/tsx/Chrome requirieron ejecución fuera del sandbox; compilación final de 58 módulos sin errores ni avisos, con el validador fuera del bundle del navegador.
- Instancia habitual reiniciada y funcionando en 5173; esquema y menú actuales comprobados allí sin modificar páginas. Siguiente acción: recargar http://127.0.0.1:5173 y usar «+ Agregar bloque» → Distribución/Contenedores, o el botón dentro de una columna; Guardar conserva los cambios. Sin pendientes funcionales detectados en A–F; se mantienen los límites de altura A4 y paginación manual.

## Numeración alternada del libro — 11 de noviembre de 2026

- Pie compartido con lado físico calculado desde `pageOrder`; controles en Diseño del libro para alternar/fijar izquierda/fijar derecha y elegir el lado inicial. Configuración opcional `pageNumbering` y `firstContentPageSide` en book.json, predeterminados alternate/left, guardado con respaldo. Se conserva la numeración de portada y demás páginas; sin cambios en contenidos, fuentes ni colores.
- Archivos: PageRenderer, cálculo nuevo utils/pageNumbering, estilos puntuales del pie, esquema, conexión de controles en Properties/Editor/PageList, hook/servicio y endpoint de guardado en managePages/index. Documentado en DATA_MODEL; comprobación reproducible en `.tools/numbering-check.mjs`.
- `npm.cmd run build` y `npm.cmd run validate` correctos (4 páginas, 16 bloques); `npm.cmd test`: 33/33. La suite necesitó ejecución fuera del sandbox por `uv_os_get_passwd`. Chrome comprobó seis páginas temporales en un libro separado: A izquierda/B derecha/C izquierda/D derecha/E izquierda/F derecha, inversión, ambos modos fijos, persistencia al recargar, mover/restaurar, vista previa y geometría de impresión en ambos sentidos. Respaldo exacto y páginas sin modificaciones comprobados. Sin lectura ni generación de PDF; sin impresión física.
- Capturas inspeccionadas: `.tmp/numbering-editor.png`, `.tmp/numbering-print-left.png` y `.tmp/numbering-print-right.png`; resultados en `.tmp/numbering-check.json`. Siguiente acción: recargar el editor y usar Propiedades → Diseño del libro → Numeración del libro / Primera página numerada.

## Ajuste de densidad editorial — 11 de noviembre de 2026

- `src/styles/book.css`: espaciado XS/S/M/L (1/2/3/5 mm), cuerpo de 12 pt conservado, interlineado 1,30 y 1,25 en tarjetas; encabezados, márgenes, padding y gaps compactados. Se mantienen fuentes, azul/cian, A4 y contenido excedente visible. Galería con zonas compartidas de título, imagen/pie y descripción, sin cortar texto.
- `src/renderer/CardContainer.tsx`, `src/editor/CardContainerProperties.tsx` y `src/types/schema.ts`: opciones de galería `imageSize` (compact/normal/large: 22/28/36 mm) e `imageFit` (cover predeterminado o contain), opcionales y compatibles con JSON anteriores. Sin cambios de endpoints, gestión de páginas ni contenido del libro.
- Chrome: página temporal en memoria con título, texto + imagen, tres tarjetas y otro contenedor; altura de bloques reducida de 1202 a 889 px (26 %), cabe en A4 con cuerpo sin reducir. Comprobados tamaños, contain/cover, títulos de una/dos líneas y pies desiguales. Editor, vista previa y PDF coinciden; PDF de una página inspeccionado, sin desbordamiento horizontal ni excepciones. Evidencias: `.tmp/density-after.json`, `.tmp/density-preview.png`, `.tmp/density-print.pdf`; no se añadieron páginas al libro ni se modificó `reference/`.
- `npm.cmd run build` y `npm.cmd run validate` correctos (3 páginas, 11 bloques); `npm.cmd test`: 33/33. Comprobación adicional del esquema: valores anteriores, seis combinaciones y rechazo de opciones inválidas. Chrome y tsx requirieron ejecución fuera del sandbox por restricción de arranque/`uv_os_get_passwd`. Sin impresión física. Servidor reiniciado con el esquema actual; siguiente acción: recargar **http://127.0.0.1:5173**, seleccionar una galería y elegir «Tamaño de imagen» y «Ajuste de imágenes».

## Corrección puntual de páginas y títulos — 11 de noviembre de 2026

- Añadida `blank` con `blocks: []`; título/subtítulo opcionales y editables, sin relleno ni huecos; estilos Ninguno, Simple, Dividido y Actual (predeterminado compatible). Ajustados esquema/guardado, creación, plantillas/encabezado, paneles, estilos, DATA_MODEL y dos expectativas anteriores de pruebas.
- A–E comprobadas en Chrome: contenedor al inicio, edición/borrado, estilos, JSON, recarga y dos reinicios de `npm.cmd run dev`. Páginas temporales retiradas; originales e índice intactos byte a byte. Build y validate correctos; sin dependencias. Chrome requirió ejecución fuera del sandbox tras timeout CDP. Evidencia: `.tmp/page-titles-check.json`. Siguiente acción: recargar **http://127.0.0.1:5173** y usar «+ Nueva página → Página en blanco»; servidor funcionando.

## Corrección puntual de columnas y galería — 11 de noviembre de 2026

- Columnas horizontales reforzadas: Grid de ancho completo y apilamiento vertical delimitado a los hijos de cada columna. Galería horizontal corregida en su alineación: los encabezados comparten altura por fila y las imágenes comienzan juntas, sin recortar descripciones. El apilamiento informado no se reprodujo en la instancia actual antes del ajuste.
- Comprobados en Chrome: 2/3 columnas, 50/50, 40/60 y 60/40, galería de 2/3/4 columnas, ventana de 390 px, controles de tarjetas, guardar, recargar y reiniciar `npm.cmd run dev`. Impresión horizontal comprobada mediante CSS/PDF; no se abrió el diálogo nativo de impresión. `npm.cmd run build` y `npm.cmd run validate` correctos (1 página, 5 bloques al finalizar).
- Archivos: `src/renderer/BlockRenderer.tsx` y `src/styles/book.css`; evidencia local en `.tmp/horizontal-check.json` y `.tmp/horizontal-print.pdf`. Páginas temporales retiradas y cambios ajenos conservados. Siguiente acción: recargar **http://127.0.0.1:5173**; servidor reiniciado y funcionando.

## Ampliación solicitada — 11 de noviembre de 2026

- Implementado en el orden solicitado y comprobado antes de continuar: `columns` (50/50, 40/60, 60/40 y tres iguales), `textImage` (cuatro posiciones, 30/70–50/50 y contain/cover) y `cardContainer` (gallery, info, comparison y steps en un único componente).
- Edición desde Propiedades, inserción agrupada, selección de hijos, movimientos entre columnas, orden y edición individual de tarjetas, subida/reemplazo local de imágenes y confirmación al eliminar contenedores. Reducir columnas conserva todos los bloques; las variantes con máximo tres tarjetas no eliminan una cuarta automáticamente.
- Esquema v1, lector, guardado, duplicación y CLI recorren ids y recursos internos. Se mantienen JSON por página, respaldos previos y deshacer/rehacer. Sin dependencias, servicios remotos ni cambios en tokens o tipografías globales.
- A4: cuadrículas con anchos acotados, texto real e imágenes sin deformación; aviso general de altura excedida, contenido visible y pie debajo. Abreviar/dividir antes de imprimir; no se añadió paginación editorial automática. Contenedores solo al nivel de página; columnas admiten los siete tipos de contenido.
- Pruebas A–C en Chrome local mediante CDP existente: texto/imagen/infoCard en tres columnas, movimientos y 3→2→3 sin pérdida; mixto derecha→izquierda, proporción medida y alt/pie; galería de tres tarjetas con títulos, descripciones, imágenes y reemplazo WebP. Guardado y recarga correctos en cada parte; cuatro variantes, iconos, pasos y límites de tarjetas comprobados.
- Integridad: tabla/código/textImage dentro de columnas, aviso de altura con texto largo, duplicar con ids internos nuevos y datos conservados, reordenar y eliminar páginas. Impresión comprobada mediante CSS y `.tmp/layout-print.pdf`: las tres páginas de prueba miden 794 × 1123 px, columnas y tarjetas horizontales, imágenes cargadas, sin controles ni desbordamiento horizontal. Sin impresión física.
- Prueba D: `npm.cmd run dev` detenido y reiniciado en 127.0.0.1:5173; los tres JSON y su representación en Chrome permanecieron. Cero excepciones JavaScript en los recorridos. La instancia actual quedó funcionando.
- Prueba E: `npm.cmd run build` correcto (55 módulos), `npm.cmd run validate` correcto (2 páginas, 5 bloques originales) y `npm.cmd test` **33/33 correctas**. Se corrigió la copia de la nueva dependencia `src/utils/blocks.ts` en la prueba existente de CLI. Chrome y la suite necesitaron ejecución fuera del sandbox; dentro aparecieron timeout CDP y `uv_os_get_passwd`, respectivamente.
- Las páginas temporales se retiraron mediante el editor; índice y páginas originales quedaron idénticos byte a byte. Se conservaron respaldos y recursos de prueba. `reference/contenedor-galeria.png` no existía; se reutilizó el sistema visual actual. No se leyeron PDF, ZIP ni prompt constructor.
- Archivos: esquema y utilidades de bloques; content/savePage/managePages y CLI; Editor/Properties, propiedades de mixtos/tarjetas/imágenes, renderizadores y plantillas, Icon, estilos puntuales; ajuste de la prueba CLI y AGENTS/DATA_MODEL/STATUS. Evidencias y auxiliar: `.tmp/layout-check.json`, `.tmp/layout-gallery.png`, `.tmp/layout-print.pdf`, `.tools/layout-check.mjs`.
- Pendientes funcionales detectados en esta ampliación: ninguno. Siguiente acción exacta: abrir **http://127.0.0.1:5173**, seleccionar página, usar **+ Agregar bloque** y Guardar. Si está detenido, ejecutar `npm.cmd run dev`. La etapa 5 de respaldos/cambios externos sigue sin iniciarse.

## Etapa 4 — resultados y verificación

- Imágenes: completo. Insertar/subir y reemplazar PNG, JPG/JPEG y WebP; ancho 10–100 %, alto, contain/cover, texto alternativo y pie. Archivos físicos en assets/images con UUID, máximo 10 MB, comprobación de extensión/MIME/firma, mismo origen y protección de rutas/enlaces. Eliminar un bloque conserva el recurso compartido. Las imágenes antiguas, incluidos SVG locales, siguen funcionando.
- Tablas: completo. Celdas y encabezados editables directamente en A4; título opcional y controles para añadir/eliminar filas o columnas específicas. Todas las filas conservan la misma cantidad de celdas y queda al menos una columna. Diseño azul existente; advertencias por columnas estrechas o invasión del pie, sin reducir tipografía.
- Código: completo. Textarea monoespaciado, título opcional, PSeInt, Arduino/C++, Python, HTML, CSS, JavaScript, Excel y texto general. Conserva indentación y saltos; copia al portapapeles y renderizado como texto seguro. Líneas largas ajustadas al ancho. Sin ejecución, resaltador pesado ni dependencias nuevas.
- Inserción de bloques: completa. «+ Agregar bloque» en Propiedades, selección automática, UUID, inserción después del seleccionado o al final; subir/bajar y eliminar con deshacer/rehacer. Se conserva el mínimo vigente de un bloque por página y los controles de texto/páginas.
- Guardado: completo. Se amplió PUT de página con validación de ids globales, tipos, referencias y estructura. Respaldos previos exactos; solo escribe la página seleccionada, conserva campos adicionales y admite restaurar bloques eliminados mediante deshacer. Mantiene los cuatro estados de guardado y añade «Subiendo imagen...» mientras transfiere el archivo.
- Persistencia: completa. Comprobada en disco, al recargar Chrome y después de detener/reiniciar npm run dev en **http://127.0.0.1:5173**. La instancia actual quedó funcionando con etapa 4. El JSON sigue siendo la fuente oficial.
- Validación: completa. Esquema compartido ampliado sin cambiar schemaVersion 1. Detecta ids duplicados, imágenes inexistentes, tablas sin columnas o con filas incorrectas, código no textual/lenguaje inválido y tipos desconocidos.
- Impresión: comprobada con CSS de impresión de Chrome y PDF real generado en `.tmp/stage4-print.pdf`: páginas de 794 × 1123 px CSS (A4), imágenes visibles, encabezados azules, fondos y saltos/indentación conservados, sin controles ni desbordamiento horizontal en las páginas probadas. Sin nuevo motor PDF; no se realizó impresión física.
- Pruebas A–D: realizadas en Chrome local sin ventana visible mediante CDP existente, sin Playwright. Incluyen subida PNG y reemplazos JPG/WebP, pie y dimensiones, edición de tres celdas, filas/columnas y su mínimo, PSeInt multilínea, ocho lenguajes, HTML literal no ejecutado, copia, mover/eliminar/restaurar los tres tipos, y crear/duplicar/eliminar páginas. Cero excepciones JavaScript. Capturas de tabla y código inspeccionadas.
- `npm.cmd run build`: correcto tras cada bloque A, B y C; compilación final correcta, 49 módulos. `npm.cmd run validate`: correcto, 2 páginas y 5 bloques originales. `npm.cmd test`: **33/33 correctas** (9 nuevas de bloques/subida y 24 regresiones).
- Siete rechazos HTTP comprobados sin crear archivos: origen ajeno, MIME, extensión y firma incorrectos, archivo vacío, más de 10 MB y nombre mal codificado. Pruebas automatizadas adicionales de destino enlazado, colisiones, recursos inexistentes, estructuras inválidas, respaldo exacto y conservación de otros archivos.
- Las páginas temporales se retiraron; book.json, design.json y todas las páginas originales quedaron idénticas byte a byte. Se conservaron respaldos y recursos de prueba; no se implementó eliminación automática. No se modificaron reference/ ni el prompt constructor.
- Incidencias de pruebas: tsx requirió ejecución fuera del sandbox por uv_os_get_passwd, como en etapas previas. El auxiliar de Chrome se ajustó para dar foco al portapapeles y comparar sus saltos CRLF de Windows; el código en JSON conserva sus saltos originales. Tras esos ajustes pasó el recorrido completo.
- Evidencias: `.tmp/stage4-edit.json`, `.tmp/stage4-restart.json`, `.tmp/stage4-api.json`, `.tmp/stage4-table.png`, `.tmp/stage4-code.png` y el PDF. Auxiliares locales `.tools/stage4-*.mjs`; pruebas mantenidas en `scripts/blocks.test.ts` y las suites anteriores.
- Archivos: esquema, guardado/lector/rutas de Express y nuevo uploadImage; Editor/Properties, TableProperties/CodeProperties, renderizadores/plantillas, hook y servicio existentes, estilos puntuales, idiomas de código; pruebas, package.json, DATA_MODEL/AGENTS/STATUS. Sin cambios de arquitectura ni tokens globales.
- Pendientes de etapa 4: ninguno funcional detectado. Límites: tablas hasta 20 columnas/200 filas, sin combinación o partición automática; advertencia de tamaño específica de tablas, sin detección general del desbordamiento A4; sin recorte avanzado, ejecución de código, limpieza de recursos ni edición interna SVG.

## Corrección de la instancia activa — 11 de noviembre de 2026

- Incidencia reproducida en la dirección habitual `http://127.0.0.1:5173`: crear, reordenar y eliminar devolvían HTTP 404 con «Ruta de API no disponible en esta etapa». La interfaz tenía los controles nuevos, pero el proceso del servidor seguía ejecutando las rutas anteriores. Las pruebas previas en 5174 no habían sustituido esta instancia.
- Se verificó la línea de ejecución del proceso que escuchaba en 5173 y se reinició únicamente ese servidor del proyecto con el código actual. Se dejó funcionando en **127.0.0.1:5173**; no hace falta iniciar una segunda instancia.
- Comprobación real en Chrome en 5173: crear lesson y cover, duplicar, subir, bajar, cambiar título y plantilla, eliminar con confirmación y recargar. Archivos, ids, orden y numeración correctos; cero excepciones JavaScript. Las páginas de prueba se retiraron y el contenido del usuario, incluidas sus ediciones posteriores a la implementación inicial, quedó idéntico byte a byte.
- Evidencia: `.tmp/stage3-live-check.json`; auxiliar `.tools/stage3-live-check.mjs`. Se conservaron los respaldos. No fue necesario modificar el motor ni las rutas implementadas: la corrección fue activar el servidor actualizado en el puerto utilizado por el usuario.
- Durante la verificación posterior, el libro activo ya tenía una nueva página creada fuera de la prueba. Esto reveló tres pruebas que suponían que siempre existirían exactamente las dos páginas originales. Se corrigieron `scripts/pages.test.ts` y `scripts/validation.test.ts` para usar un libro temporal fijo definido en `scripts/testBook.ts`, independiente del contenido del usuario. Resultado final: **24/24 pruebas correctas**, build correcto y validate correcto (3 páginas, 12 bloques en esa ejecución). Las ediciones y páginas nuevas del usuario se conservaron.
- Cuando se actualice código del servidor, reiniciar la instancia que atiende la URL del usuario y comprobar allí las acciones. La actualización automática de componentes React no reinicia Express.

## Etapa 3 — resultados

- Crear página: completo. Botón «+ Nueva página», selector lesson/cover, contenido mínimo editable, archivo independiente, registro en pageOrder y selección automática. Identificadores legibles y permanentes; la secuencia considera respaldos para no reutilizar ids eliminados.
- Duplicar página: completo. Copia todos los datos, cambia el id de página y todos los ids de bloques, crea un JSON y lo inserta inmediatamente después. Guarda primero el borrador de la página seleccionada y conserva los borradores de las demás.
- Eliminar página: completo. Confirmación en español, aviso de cambios pendientes, respaldos exactos de página e índice, retirada del archivo activo y selección cercana. La última página queda protegida en interfaz y servidor, conservando el requisito de al menos una página del esquema vigente.
- Reordenar: completo mediante «↑ Subir» y «↓ Bajar», con actualización inmediata y guardado automático de book.json. No reescribe páginas. Ante un error recupera el orden visual anterior y permite reintentar.
- Numeración automática: completa a partir de pageOrder en panel izquierdo, A4, navegación e impresión; no se escriben números manuales en cada página.
- Cambiar título: completo desde Propiedades, actualización de lista y A4, persistencia al pulsar Guardar; conserva id y nombre del archivo.
- Cambiar plantilla: completo con cover/lesson; conserva todos los bloques y datos adicionales. Añade únicamente subtitle/theme mínimos si hacen falta. El panel avisa cuando una plantilla conserva pero no muestra la banda de tema o el rótulo de portada.
- Respaldos: completos antes de sustituir book.json, sobrescribir una página o eliminarla. Copias exactas en content/backups/, con nombres únicos, sin sobrescribir respaldos anteriores. Validación compartida, protección de rutas y escrituras serializadas dentro del proceso. Reversión de operaciones con varios archivos ante errores de escritura manejables.
- Estados: Guardado, Cambios sin guardar, Guardando... y Error al guardar, incluidos los cambios estructurales. beforeunload cubre operaciones en curso y borradores.
- Deshacer/rehacer: título y plantilla en el historial existente; orden con botones separados y hasta 30 estados en memoria. El historial del orden se reinicia al crear, duplicar, eliminar o recargar. Crear, duplicar y eliminar no tienen deshacer; recuperación manual desde respaldos.
- Se mantuvieron schemaVersion 1, las dos plantillas, los cuatro bloques, los tokens de diseño y A4. Sin dependencias nuevas ni funciones de etapas posteriores.

## Verificación de etapa 3

- Comprobación inicial breve de etapa 2: Chrome local, edición de heading, deshacer/rehacer, guardado real, respaldo exacto y recarga correctos. Se restauró el contenido inicial.
- `npm.cmd run build`: correcto, TypeScript sin errores y 45 módulos compilados por Vite.
- `npm.cmd run validate`: correcto, 2 páginas y 10 bloques tras restaurar la demostración. No fue necesario modificar el validador: ya comprobaba referencias, huérfanos, duplicados, plantillas, JSON y mínimo de una página.
- `npm.cmd test`: **24/24 correctas**. Incluye creación concurrente de ambas plantillas, duplicación sin pérdida de campos adicionales, reordenamiento sin reescribir páginas, título/plantilla y su reversión, eliminación y respaldo exacto, protección de última página, entradas inválidas, fallo de respaldo y rechazo de carpeta de respaldos enlazada fuera de su ubicación.
- Pruebas A–F realizadas en Chrome sin ventana visible, usando el protocolo de depuración existente y sin Playwright: creación lesson/cover, copia con nuevos ids y archivo, subir/bajar, numeración, título, cambio de plantilla, cancelación/confirmación de eliminación y respaldo exacto. También duplicación de portada con imagen y de un borrador pendiente, conservación de borradores ajenos e historial de orden.
- Persistencia comprobada en disco, tras recargar y después de detener y volver a iniciar `npm.cmd run dev` en 127.0.0.1:5174: páginas, copia, título, plantilla, contenido y orden permanecieron.
- Fallo de red simulado al mover: estado de error, orden anterior conservado en disco y recuperado en pantalla; reintento correcto. Advertencia real beforeunload durante una operación estructural. Cero excepciones JavaScript en las pruebas completas. Captura inspeccionada.
- Nueve rechazos HTTP comprobados sin modificar contenido ni crear respaldos: JSON inválido, plantilla desconocida, origen ajeno, tipo de contenido incorrecto, límite de tamaño, id ausente, traversal en duplicar/eliminar y orden inválido.
- Evidencias: `.tmp/stage3-edit.json`, `.tmp/stage3-restart.json` y `.tmp/stage3-edit.png`. Auxiliares locales en `.tools/stage3-*.mjs` y `.tools/cdp-session.mjs`. El primer intento detectó un selector incorrecto en la prueba del título; se corrigió y se ejecutó el flujo completo correctamente.
- El libro de demostración quedó restaurado byte a byte (book.json y ambas páginas); se conservaron los respaldos de las comprobaciones. No se modificaron reference/, el prompt constructor ni archivos de diseño global.

## Archivos de etapa 3

`server/managePages.ts` y `server/storage.ts`; rutas en `server/index.ts` y adaptación de `server/savePage.ts`; servicio de libro, hook de edición, Editor, PageList y Properties; controles puntuales en editor.css; helper de plantilla y tipo de respuesta compartido. Pruebas en `scripts/pages.test.ts` y ampliación puntual de `scripts/validation.test.ts`; package.json y documentación DATA_MODEL/ROADMAP/STATUS. Sin cambios de dependencias.

## Límites de etapa 3

No hay restauración visual, vigilancia ni detección de conflictos entre pestañas/procesos. La cola protege una sola instancia; no iniciar varios servidores que escriban simultáneamente el mismo libro. Los respaldos y la reversión de errores no equivalen a una transacción resistente a un corte de energía entre dos archivos. No se implementaron detección de desbordamiento, drag and drop ni funciones de etapa 4.

## Etapa 2 — resultados

- Edición de heading: completa desde input en el panel derecho, con selección visual y actualización inmediata de A4.
- Edición de paragraph: completa desde textarea; conserva los saltos de línea.
- Edición de infoCard: completa para título, contenido y rótulo existente.
- Título de página: editable desde el panel derecho. Plantilla, id y propiedades de imagen continúan visibles como información.
- Guardado real: completo mediante `PUT /api/pages/:id`; valida JSON, ids, tipos, estructura y rutas. Solo modifica el archivo registrado de la página seleccionada. Escritura mediante temporal y renombrado; peticiones del navegador limitadas al mismo origen. Los errores se muestran en español y conservan el borrador.
- Persistencia: comprobada en disco, después de recargar el navegador y después de detener y reiniciar `npm.cmd run dev`. No se usa localStorage.
- Respaldo: completo; copia exacta anterior en `content/backups/`, con fecha UTC y sufijo único. No hay restauración visual ni límite automático.
- Deshacer/rehacer: completo, hasta 30 estados por página en memoria. Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z y botones; cambiar de página conserva sus borradores e historial. No se guarda el historial en disco.
- beforeunload: completo; advertencia estándar si hay cambios sin guardar o un guardado en curso. Se comprobó el diálogo real al recargar y su ausencia después de guardar.
- Estados: Guardado, Cambios sin guardar, Guardando... y Error al guardar, comprobados en navegador. Guardar actúa sobre la página seleccionada; las miniaturas y el pie indican pendientes.
- Se conserva la paleta, A4, estructura, plantillas, book.json y design.json. Edición desde el panel, sin contentEditable ni nuevas dependencias. No se implementaron funciones de etapas posteriores.

## Verificación de etapa 2

- `npm.cmd run build`: correcto, TypeScript sin errores y 44 módulos compilados por Vite.
- `npm.cmd run validate`: correcto, 2 páginas y 10 bloques.
- `npm.cmd test`: las 14 pruebas existentes pasan. No se añadió una suite extensa ni Playwright.
- Pruebas A–E: Chrome en segundo plano, mediante el protocolo de depuración existente. Selección y edición de heading; cambio real del JSON; recarga; reinicio del servidor; respaldo previo comparado byte a byte. El archivo de la otra página permaneció intacto.
- Se comprobó también la edición del título, paragraph e infoCard; historial por página y atajos; los cuatro estados; rechazo de título vacío con mensaje en español, sin sobrescribir el archivo ni crear respaldo. Cero excepciones JavaScript en las comprobaciones.
- Captura del editor inspeccionada. Se restauró el contenido original de demostración, incluida su representación exacta en disco; se conservaron los dos respaldos de la prueba.
- Evidencias temporales: `.tmp/stage2-edit.json`, `.tmp/stage2-restart.json` y sus capturas PNG. El auxiliar temporal reutiliza `.tools/browser-check.mjs` y `.tools/stage2-check.mjs`.
- Se utilizó el puerto 5174 porque 5173 ya estaba ocupado. La instancia que ocupaba 5173 no se detuvo; debe reiniciarse para cargar la nueva ruta del servidor. La instancia de prueba se detuvo al finalizar.

## Archivos de etapa 2

Editor, Properties, PageList, Icon y estilos de controles; nuevo hook `usePageEditing`; servicio `src/services/book.ts`; esquema compartido; ruta en `server/index.ts` y nuevo `server/savePage.ts`; documentación DATA_MODEL/STATUS/AGENTS y descripción de package.json. Los JSON de demostración quedaron como estaban; solo se añadieron los respaldos de comprobación. No se tocaron reference/, el prompt constructor ni el ZIP inicial.

## Terminado

Estructura local React/TypeScript/Vite y Express; un único comando de desarrollo; lectura validada de JSON separados; tokens de diseño; portada y página conceptual; bloques heading, paragraph, infoCard, image, table y code; miniaturas; selección y edición de páginas y bloques; subida local de imágenes; propiedades; vista previa; zoom; impresión A4; validación y 33 pruebas automatizadas.

Servidor ligado exclusivamente a 127.0.0.1. Imágenes locales y fuentes del sistema, sin servicios externos. La compilación usa `dist/app-assets/`, separado de los recursos del libro en `assets/`. Se comprobó físicamente la existencia de la estructura requerida, incluido `package-lock.json`.

El PDF, ZIP y prompt original se conservaron intactos: sus hashes SHA-256 coinciden con los registrados antes del trabajo. No se creó ningún ZIP de entrega ni se convirtió una página del PDF en imagen.

## Parcial

- Impresión física no comprobada. En etapa 4 se verificaron estilos A4 y se generó un PDF mediante Chrome; el QA avanzado sigue fuera de esta etapa.
- Adaptación a pantallas estrechas: navegación disponible, paneles ocultos según el ancho; experiencia completa pensada para escritorio.

## Pendiente

Etapas 5–7, solo cuando se soliciten. Todavía no hay restauración visual de respaldos, vigilancia, conflictos ni validación visual avanzada. La edición sigue pensada para escritorio; celdas en A4 y demás controles en el panel derecho. Hay advertencia de tamaño de tablas y altura general A4; no hay paginación editorial automática.

## Pruebas de etapa 1 (histórico)

- `npm.cmd install`: correcta, 145 paquetes instalados, auditoría sin vulnerabilidades en esa ejecución; npm avisó sobre el script de instalación de esbuild. La compilación posterior ejecutó esbuild correctamente.
- `npm.cmd run build`: correcto en la versión final, TypeScript sin errores y Vite 7.3.8; 43 módulos transformados.
- `npm.cmd run validate`: correcto, 2 páginas y 10 bloques.
- `npm.cmd test`: **14/14 correctas**. Carga ordenada; ausencia de book/design; JSON mal formado; archivo ausente en pageOrder; IDs duplicados de página/bloque; IDs ausentes; tipo no admitido; imagen inexistente; ruta fuera del proyecto; imagen remota/Base64; código de error 1 de la CLI real.
- `npm.cmd run dev`: servidor iniciado en 127.0.0.1:5173, frontend y `/api/book` con HTTP 200.
- `npm.cmd start` con PORT=5174: servidor compilado iniciado y probado, incluidos JS, CSS, icono e imagen de portada.
- Chrome en segundo plano, mediante su protocolo de depuración y sin Playwright: comprobaciones completadas tanto en desarrollo como en compilación. Portada visible, dos páginas en el panel, selección de la página conceptual, selección de tarjeta y propiedades correctas, vista previa y regreso, navegación, aviso de Guardar, zoom y llamada del botón a `window.print()`.
- En ambas páginas: dimensiones de 794 × 1123 píxeles CSS (A4 a 96 dpi), sin bloques invadiendo el pie de página y sin imágenes rotas. Capturas de ambas vistas inspeccionadas.
- CSS de impresión emulado: barra de herramientas oculta, las dos páginas visibles y medidas A4. Esto no sustituye una prueba de PDF o impresora.
- Ventana de 390 px: sin desbordamiento horizontal del documento, navegación presente. Vista de escritorio verificada a 1440 × 1000.
- Navegador: cero excepciones, mensajes de consola de nivel error o respuestas HTTP de error durante las comprobaciones de la interfaz.
- Recursos locales: HTTP 200 para API, imagen e icono; HTTP 404 para API inexistente, imagen inexistente e intento de ruta `..` codificada en `/assets/`.

Las evidencias temporales de navegador están en `.tmp/` (ignorada por Git). Las pruebas mantenidas del proyecto son `scripts/validation.test.ts`; no se incorporaron Playwright ni una infraestructura de pruebas visuales avanzadas. Se eliminaron la herramienta temporal de lectura de PDF y el perfil temporal de Chrome. Los servidores de prueba quedaron detenidos al finalizar; inicia el editor con `npm run dev` o `npm.cmd run dev` en PowerShell.

## Incidencias del entorno

PowerShell bloquea `npm.ps1`; se usó `npm.cmd`, equivalente para estos comandos, sin cambiar la política de Windows. Las primeras ejecuciones en el sandbox fallaron por acceso a red/archivos y por `uv_os_get_passwd` al consultar el usuario de Windows; las ejecuciones autorizadas fuera del sandbox completaron correctamente. No quedan errores de compilación, validación o ejecución detectados. Los comandos de arranque funcionan en una sola terminal.

## Siguiente acción exacta

Guardar cualquier borrador abierto y recargar **http://127.0.0.1:5173** (servidor actualizado y funcionando). Usar «+ Agregar bloque → Distribución» para un grid, o «Usar filas y columnas» en un marco existente. Seleccionar la celda de destino y usar el botón global para añadir contenido. Si el servidor está detenido, iniciar con `npm.cmd run dev`.

**SIGUIENTE ETAPA: Etapa 5 — Respaldos, detección de cambios externos y comunicación entre VS Code y el navegador.** Implementarla únicamente tras una nueva solicitud; no se inició en esta sesión.

## Bloque Preguntas ? 12 de noviembre de 2026

- A?adido `questions` con dos modos y edici?n de filas, opciones, columnas, numeraci?n y l?neas; integrado con identificadores y guardado. P?ginas existentes intactas.
- `npm.cmd run validate` y `npm.cmd run build` correctos; `npm.cmd test` 34/34 fuera del entorno restringido (dentro fall? `uv_os_get_passwd`). No se verificaron las interacciones en navegador, guardar/F5 ni copiar/pegar.
- Siguiente acci?n exacta: comprobar los cuatro ejemplos solicitados en el editor, guardar/recargar y copiar/pegar, incluidos contenedores estrechos.
