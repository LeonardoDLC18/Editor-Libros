# Modelo de datos — versión 1

Los archivos se guardan en UTF-8. No se incluye contenido del libro dentro de componentes React. La definición ejecutable está en `src/types/schema.ts` (Zod); el lector, el guardado y `npm run validate` comparten esa definición. Los campos conocidos siguen siendo validados. Desde la etapa 2, se conservan campos adicionales en páginas, bloques, theme y metadata para no perder información al editar textos; no son controles editables. book.json y design.json mantienen el esquema estricto y rechazan campos desconocidos.

## content/book.json

| Campo | Contenido |
| --- | --- |
| `schemaVersion` | Número `1`. |
| `book` | `id`, `title`, `subtitle`, `grade`, `author`, `language: "es"`. |
| `units` | Lista de unidades con `id`, `label` visible y `title`. |
| `pageOrder` | Lista ordenada de `{ "id": "page-001-portada", "file": "pages/page-001-portada.json" }`. |
| `pageNumbering` | Opcional: `alternate` (predeterminado), `left` o `right`; ubicación del número en el pie. |
| `firstContentPageSide` | Opcional: `left` (predeterminado) o `right`; lado físico de la primera página numerada. |

Las rutas de `pageOrder` se interpretan respecto a `content/`. Solo se permiten archivos `.json` directamente dentro de `pages/`. No hay un JSON gigante con todas las páginas. El número visible se calcula por la posición en la lista, comenzando en 1; no se guarda un número redundante.

El lado físico alterna desde `firstContentPageSide` según la posición en `pageOrder`; `pageNumbering` permite fijar únicamente la ubicación del número. Todas las plantillas actuales, incluida la portada, conservan su número. No se guarda el lado en cada página. Los controles «Numeración del libro» y «Primera página numerada», en Diseño del libro, guardan automáticamente ambos campos mediante `PUT /api/book/numbering`, con respaldo previo del índice. Editor, miniaturas, vista previa e impresión comparten el cálculo.

## content/design.json

`schemaVersion`, `name`, `colors`, `fonts`, `typeScale`, `page`, `spacing`, `borders` y `shadow`. Todos los valores son obligatorios; consulta `DESIGN_SYSTEM.md` y el archivo de ejemplo. Colores en hexadecimal de seis dígitos, medidas de página y espaciado en mm, tipografía en pt, bordes/sombra en px. A4 es fijo en esta etapa. Las fuentes son locales; no se admiten URLs CSS.

## content/pages/*.json

| Campo | Regla |
| --- | --- |
| `id` | Único, permanente, coincide con el `id` de `pageOrder`. |
| `template` | `cover`, `lesson` o `blank` (página en blanco). |
| `unitId` | Opcional; cuando se incluye debe existir en `book.units`. |
| `title` | Texto opcional; admite vacío. Si falta o solo tiene espacios, no se representa ni reserva altura. |
| `subtitle` | Texto opcional editable en todas las plantillas; admite vacío, sin sustitución automática ni altura reservada. |
| `titleStyle` | Opcional: `none`, `simple`, `split` o `existing`. Ausencia equivale a `existing`; `none` oculta el título sin borrar su contenido. |
| `titleSecondary` | Texto secundario opcional del estilo `split`; `title` es el principal. Se conserva al cambiar de estilo. |
| `eyebrow` | Rótulo superior opcional de portada. |
| `theme` | `{ label, title }`, obligatorio para `lesson`. |
| `blocks` | Lista de bloques en su orden de lectura; admite `[]` en todas las plantillas. |
| `metadata` | `status` (`demo`, `draft` o `ready`) y `description`. |

El grado procede de `book.book.grade`; la unidad de `unitId`. `blank` nace con `title: ""`, `subtitle: ""` y `blocks: []`, sin theme ni ejemplos: muestra únicamente encabezado y pie editorial con número. Admite todos los bloques y estilos desde Propiedades. La banda de tema de lesson aparece únicamente con título visible y estilo `existing`; sin título/subtítulo, el primer bloque ocupa el inicio del área de contenido. Una portada puede omitir la imagen eliminando su bloque `image`, conservando los otros bloques. Todas las páginas de `content/pages/` deben estar en `pageOrder`; una página huérfana produce un error explícito.

## Bloques

### Formato inline compartido

Los campos de texto siguen siendo strings. Solo al aplicar formato parcial, la página o el bloque puede incorporar `richText`, un mapa de campo a segmentos `{ text, bold?, italic?, highlight? }`, exactamente el modelo de Pasos. No se guarda HTML ni se migran páginas al leer. Ejemplo: `richText: { text: [{ text: "Microsoft " }, { text: "Excel", bold: true }] }` acompaña al `text` original. El esquema valida segmentos y marcas; al quitar todas las marcas se elimina esa entrada.

Las claves son `title`, `subtitle`, `titleSecondary`, `text`, `description`, `label`, `content` o `caption`, según el campo. Los campos internos usan rutas: `items/<id>/title`, `items/<id>/description`, `items/<id>/text`, `items/<id>/cells/<índice>`, `options/<id>/label`, `columns/<id>/label`, `image/caption` o `items/<id>/image/caption`. Tablas: `columns/<índice>` y `rows/<fila>/<columna>`; cada celda se formatea de forma independiente. Duplicar bloque/página renueva también los ids de las rutas de formato. Los cambios estructurales de filas/columnas de tabla no reasignan estas rutas de coordenadas.

Pasos conserva `items[].content`; las tarjetas informativas conservan `contentSpans`. Ambos comparten las mismas utilidades de división/fusión, marcas combinables y resaltado editorial. Los cambios desde Propiedades se concilian con los segmentos mediante `editStepText`; el string del campo sigue siendo el texto autoritativo. La barra ofrece únicamente B/I/Resaltar, aparece ante selección dentro de un campo inline y se oculta en impresión. No permite cambiar fuentes, tamaños, alineación ni colores.

Todos tienen `id` único en todo el libro y `type`. Los identificadores usan letras minúsculas, números y guiones. El tipo define sus campos adicionales:

| Tipo | Campos |
| --- | --- |
| `heading` | `text`, `level` (`2` o `3`). El título de página genera el h1. |
| `paragraph` | `text`. Se conservan saltos de línea y se muestra como texto, sin ejecutar HTML. |
| `separator` | `size`: small/normal/large (6/10/16 px; normal predeterminado). Solo espacio vertical, también dentro de columns/framedColumns; guía únicamente al seleccionar o pasar el cursor en edición. |
| `infoCard` | `title`, `content`, `label` opcional. `layout` opcional: stacked (actual), inline (horizontal compacta) o compact (etiqueta pequeña); `icon` opcional; `contentSpans` opcional con los mismos segmentos y formato que steps, cuyo texto concatenado debe coincidir con content (sin espacios exteriores). |
| `image` | `src`, `alt`, `heightMm` (10 a 150), `fit` (`contain` o `cover`), `caption` opcional; `widthPercent` opcional (10 a 100, ausencia equivale a 100 %). |
| `table` | `columns`: encabezados de texto (1 a 20); `rows`: filas (0 a 200), cada una con exactamente tantas celdas de texto como columnas; `title` opcional. Celdas vacías permitidas, máximo 10 000 caracteres por celda/encabezado. |
| `code` | `language`: `pseint`, `arduino`, `python`, `html`, `css`, `javascript`, `excel` o `text`; `content`: texto de hasta 300 000 caracteres, incluido vacío; `title` opcional. |
| `steps` | `title` opcional (vacío no reserva altura), `items`: lista de `{ id, content }`; cada `content` contiene segmentos `{ text, bold?, italic?, highlight? }` con marcas booleanas. Admite pasos y listas vacíos. Numeración automática por posición, ids únicos en todo el libro. Es contenido normal, también dentro de columns/framedColumns; no añade profundidad de contenedor. |
| `grid` | `rows`: filas con `id`, `layout` y `cells`; celdas con `id`, `column`, `blocks`, `rowSpan` y `verticalAlign` opcionales. `gap` opcional. Ver «Distribución con filas y celdas». |
| `columns` | `layout`: `1-full`, `2-equal`, `2-40-60`, `2-60-40`, `2-30-70`, `2-70-30`, `3-equal`, `3-25-50-25` o `4-equal`; `columns`: 1–4 objetos `{ id, blocks }`, coincidentes con layout. Hijos: cualquier bloque vigente; lista vacía permitida. |
| `framedColumns` | Mismos `layout` y `columns`, con `title` obligatorio (hasta 500 caracteres), `icon` opcional, `showIcon` opcional (true), `background`: white/ice (ice), `showBorder` opcional (true), `headerStyle`: tab/band (tab). Comparte modelo, renderizador, controles y validación con columns. |
| `textImage` | `title` opcional (hasta 500 caracteres), `text`, `image` opcional `{ src, alt, caption? }`, `layout`: `image-left`, `image-right`, `image-top` o `image-bottom`; `imageWidth`: 30, 40 o 50; `fit`: contain/cover. La proporción indica imagen/texto en posiciones laterales; se conserva al usar posiciones verticales. Imagen de 40 mm de alto sin deformación. |
| `cardContainer` | `title`, `icon` opcional, `variant`: gallery/info/comparison, `columns`: 2, 3 o 4 tarjetas por fila; `items`: tarjetas `{ id, title, description, image?, icon?, step? }`. Gallery/info admiten 2–4 tarjetas; comparison, 2–3. Imágenes de igual altura (32 mm), ajuste contain. |

Las imágenes internas usan las mismas rutas locales y comprobaciones que `image`; `alt` es obligatorio y `caption` opcional admite hasta 1000 caracteres. Se permite omitir `image` al insertar el bloque y añadirla luego mediante la subida existente. Los iconos admitidos son `map-pin`, `book`, `info`, `check`, `page` y `chart`. `step` se conserva únicamente como dato heredado, sin controlar la numeración. Todo el texto sigue siendo HTML editable mediante datos, sin imágenes de página completa. En galerías, `imageSize` opcional compact/normal/large determina 22/28/36 mm (normal), e `imageFit` cover/contain (cover) controla el ajuste; ambas opciones persisten también en galerías anidadas.

Pasos se inserta desde Contenido. Su panel permite añadir, eliminar, duplicar, ordenar y editar; seleccionar texto permite aplicar/quitar negrita, cursiva y resaltado sin guardar HTML. La lectura convierte `cardContainer` con `variant: steps` a `steps`, incluso anidado: cada título de tarjeta pasa a texto en negrita seguido de su descripción; conserva ids, campos heredados e imágenes (campo opcional `image` del paso, visible y validado). No escribe al leer. Guardar persiste el nuevo modelo con el respaldo exacto anterior; los campos heredados se conservan como datos y el texto visible se edita en `content`.

Los contenedores amplían schemaVersion 1 sin migración. Máximo 3 niveles de contenedores: columns/framedColumns, cardContainer y textImage cuentan como nivel; los objetos columna/tarjeta no. Interfaz y esquema rechazan una inserción más profunda con «Este bloque no puede anidarse a mayor profundidad.», sin descartar contenido. Todos los ids de bloques, columnas, tarjetas y pasos son únicos en el libro; duplicar una página reemplaza también sus ids internos. El guardado conserva orden, hijos, campos adicionales, rutas, variantes y proporciones. Selección, edición, movimiento y guardado recorren el árbol completo; las tarjetas se seleccionan individualmente. Reducir columnas añade todos los hijos retirados al final de la última conservada; ampliar crea columnas vacías. El menú global «+ Agregar bloque» indica el destino: la columna seleccionada (o la del bloque seleccionado), o el nivel principal si no hay destino interno. Las columnas se seleccionan en el lienzo o desde Propiedades; «+ Bloque de página» vuelve al nivel principal. No hay botones internos en A4. Cambiar una galería de cuatro tarjetas a comparison exige retirar explícitamente una tarjeta; no se elimina contenido automáticamente. Eliminar un contenedor requiere confirmación y participa en deshacer/rehacer.

Los títulos opcionales de tabla/código admiten hasta 500 caracteres. El contenido de código y de las celdas conserva espacios y saltos de línea sin recortar ni transformar sintaxis. Todo se representa como texto seguro. `table` y `code` son ampliaciones compatibles de schemaVersion 1; los JSON anteriores no requieren migración.

Ejemplo de ruta de imagen: `assets/images/portada-laptop.png`. Se permiten `assets/` y `diagrams/`, subcarpetas con nombres simples y extensiones PNG, JPG, JPEG, WebP, GIF o SVG en minúscula. No se permiten espacios, rutas absolutas, `..`, enlaces externos ni Base64. El archivo debe existir dentro de la carpeta correspondiente, incluso al resolver enlaces simbólicos. Usa `/` aunque trabajes en Windows.

## Bloques prediseñados

### Distribución con filas y celdas

`grid` amplía schemaVersion 1 sin modificar páginas anteriores. Campos: `id`, `type: "grid"`, `gap` opcional (`none`, `small`, `normal`; predeterminado `small`) y `rows` (al menos una fila). Cada fila tiene `id`, `layout` y `cells`; layout reutiliza las nueve distribuciones de columns: `1-full`, `2-equal`, `2-60-40`, `2-40-60`, `2-70-30`, `2-30-70`, `3-equal`, `3-25-50-25`, `4-equal`. No hay porcentajes libres.

Cada celda tiene `id`, `column` (posición desde cero), `blocks`, `rowSpan` opcional (1, 2 o 3; predeterminado 1) y `verticalAlign` opcional (`top`, `center`, `bottom`; predeterminado top). Las posiciones cubiertas por un span no tienen otra celda en las filas posteriores. Todas las posiciones deben quedar cubiertas exactamente una vez. Un span solo puede atravesar filas consecutivas con el mismo layout, sin solapamientos ni salir del grid. El esquema compartido rechaza estructuras incompatibles.

Las celdas admiten todos los bloques vigentes. Grid cuenta como un nivel de contenedor; filas/celdas no añaden niveles. Ids de filas y celdas son únicos en todo el libro y se renuevan al duplicar. Seleccionar una celda desde A4 o el panel fija el destino de «+ Agregar bloque»; seleccionar un hijo conserva ese destino. No hay controles permanentes dentro de A4.

Propiedades permite añadir/eliminar/reordenar filas, elegir distribución, seleccionar celdas, alinear verticalmente y ocupar filas cuando es válido. Unir celdas conserva sus bloques concatenándolos en la celda inicial; separarlas deja los bloques allí y crea celdas vacías. Cambiar distribución, mover o eliminar filas separa previamente los spans, conservando todos los bloques. Reducir columnas añade los bloques retirados a la última celda conservada. Eliminar una fila con bloques pide confirmación; todas estas operaciones participan en deshacer/rehacer. Siempre queda al menos una fila.

`framedColumns` conserva sus campos anteriores. «Usar filas y columnas» transforma explícitamente sus columnas en una primera fila, manteniendo ids y contenido. En este modo incorpora `rows` y `gap`, usa `columns: []` y conserva `layout` por compatibilidad. El marco y el grid comparten renderizador, selección, validación y guardado; no añaden un nivel extra de anidamiento. Deshacer puede recuperar la forma anterior incluso después de guardar. No se convierten marcos existentes al leerlos.

Las alturas son automáticas por contenido; gap none/small/normal reutiliza 0 y los tokens S/M existentes. Editor, vista previa e impresión usan las mismas proporciones, spans y alineaciones. El contenido demasiado estrecho conserva las advertencias actuales y nunca reduce globalmente la tipografía.

«+ Agregar bloque → Distribución» ofrece exactamente siete presets de grid en `src/presets/grids.ts`: dos columnas, texto + imagen 60/40, dos filas completas, dos columnas + fila inferior, imagen izquierda + dos filas derecha, texto/imagen + resultado inferior y 2×2. Sus bloques son editables e independientes, con ids nuevos y la imagen inicial local reemplazable.

### Recetas editoriales

`src/presets/index.ts` centraliza diez recetas con id, nombre, descripción, categoría, icono y estructura inicial. El menú las clona con ids nuevos para bloques, columnas, tarjetas y pasos; no guarda un tipo nuevo, HTML ni referencia al preset. La inserción usa el destino e historial existentes, selecciona el bloque principal y respeta los tres niveles. El aviso de ancho existente no impide insertar.

Recuerda usa infoCard horizontal, Pregunta una tarjeta compacta, Misión un marco de una columna y Aplicación guiada un marco 60/40 con steps e imagen. Los demás combinan los bloques documentados. Las imágenes iniciales referencian `assets/images/preset-image.svg`, reemplazable desde Propiedades. Los iconos compartidos incorporan `lightbulb`, `target` y `help`.

Las tarjetas reutilizan el control de formato de Pasos; content conserva el texto y contentSpans sus marcas. Los campos opcionales se validan y guardan sin alterar tarjetas anteriores. Duplicar bloque renueva todos los ids internos; Intercambiar lados invierte columnas y proporciones conservando su contenido.

## Lectura y validación

`GET /api/book` devuelve `{ book, design, pages }`, con las páginas ordenadas. Express lee los archivos en cada petición y responde con estado 422 y mensajes en español si el contenido es inválido.

`PUT /api/pages/:id` recibe la página completa en JSON (máximo 1 MB) y devuelve `{ page }` con el contenido guardado. Permite modificar título, subtítulo, estilo y texto secundario del título de página, la plantilla, text de heading/paragraph, title/content de infoCard (y label si ya existe), las propiedades de image y los campos de table/code/steps documentados arriba. Permite insertar, eliminar y reordenar bloques, incluido eliminar el último para dejar `blocks: []`. Los bloques conservados se comparan por id, mantienen su tipo y sus campos adicionales; los ids deben ser únicos en todo el libro. Se comprueba la existencia de cada imagen antes del respaldo. El editor inserta imagen, tabla o código después del bloque seleccionado, o al final si no hay selección, con un UUID. La API admite restaurar bloques de texto conocidos al deshacer una eliminación ya guardada. Eliminar o reemplazar imágenes no elimina recursos del disco.

El id de página debe existir en pageOrder. Cambiar de plantilla nunca rellena título ni subtítulo; al cambiar a lesson, si falta theme se añade `{ label: "TEMA", title: "Nuevo tema" }`. Este valor inicial puede añadirse o retirarse para permitir deshacer; no se reemplazan datos escritos previamente. Los tres diseños admiten todos los tipos de bloque vigentes. La banda de tema se conserva aunque cover/blank no la muestren, y el rótulo eyebrow se conserva aunque lesson/blank no lo muestren.

El destino se obtiene de pageOrder y se comprueba que permanezca dentro de content/pages/. Las escrituras rechazan archivos o carpetas enlazados a otros destinos. Las peticiones del navegador deben proceder del mismo origen del editor; las operaciones de páginas envían JSON y no superan 1 MB.

`POST /api/images` recibe los bytes del archivo, `Content-Type` (`image/png`, `image/jpeg` o `image/webp`) y `X-File-Name` con el nombre codificado mediante encodeURIComponent; devuelve `{ src }`. Comprueba extensión, MIME, firma/formato y máximo 10 MB. No acepta SVG/GIF por subida (los recursos locales anteriores siguen permitidos). El nombre recibido no se usa como ruta. Antes de escribir, compara tamaño y SHA-256 con las imágenes gestionadas existentes en `assets/images/`, incluidas subcarpetas: si los bytes coinciden, devuelve la ruta existente sin crear una copia. En otro caso usa `assets/images/imagen-<uuid>.<ext>`, escritura exclusiva y comprobación de carpetas sin enlaces. Subida, pegado y reemplazo comparten este endpoint; duplicar/copiar bloques conserva sus rutas sin copiar archivos. Guardar persiste la referencia en la página; reemplazar o retirar un bloque nunca elimina el archivo anterior.

«Administrar imágenes» muestra total, imágenes en uso/protegidas, no utilizadas y bytes recuperables; permite revisar miniaturas, nombres y tamaños, seleccionar todas o algunas y confirmar «Eliminar seleccionadas». `POST /api/images/analyze` recibe `{ references?: string[] }` y devuelve `{ total, used, unused: [{ src, size, hash }], recoverableBytes }`. `POST /api/images/delete-unused` recibe `{ selected: [{ src, hash }], references?: string[] }` y devuelve el inventario actualizado con `deleted` y `skipped`. Son peticiones JSON del mismo origen, en la cola existente de lectura/escritura. El editor aporta también rutas de sus borradores actuales y del bloque copiado para proteger imágenes aún no guardadas.

La función central `server/imageAssets.ts:usedImagePaths` valida el libro y recorre recursivamente los JSON originales de todas las páginas, `book.json` y `design.json`, incluidos campos adicionales; excluye `content/backups/`. Protege siempre `preset-image.svg`, usado por páginas nuevas/prediseñados. Si hay contenido inválido o ilegible, no permite limpiar. Solo se gestionan PNG/JPG/JPEG/WebP/GIF/SVG con rutas admitidas dentro de `assets/images/`; se excluyen enlaces, directorios y otros archivos. Antes de cada borrado se comprueban ruta, tipo y hash de los bytes revisados y se releen las referencias activas; una imagen reutilizada se omite. No hay limpieza automática ni cambios de respaldos o historial Git. Los respaldos y el historial de deshacer no retienen assets: restaurar contenido histórico tras una limpieza puede requerir recuperar su imagen. Las garantías de serialización corresponden a una instancia del servidor; no se coordinan borradores de otras pestañas ni escrituras externas simultáneas.

Antes de escribir, el servidor valida la página y el libro actual. Crea una copia exacta del archivo anterior en content/backups/ con id, fecha UTC (Z) y sufijo único, sin sobrescribir copias previas. Después escribe un temporal y lo renombra sobre el JSON de esa única página. Si falla la validación o el respaldo, no sustituye el original. No existe interfaz de restauración ni eliminación automática de respaldos.

El editor mantiene borradores por página, actualiza la vista A4 inmediatamente y guarda únicamente la página seleccionada. Los indicadores distinguen Guardado, Cambios sin guardar, Guardando... y Error al guardar; las miniaturas señalan las páginas pendientes. El JSON en disco es la fuente oficial, sin localStorage. Deshacer/rehacer conserva hasta 30 estados por página en memoria durante la sesión, con botones y Ctrl+Z, Ctrl+Y o Ctrl+Shift+Z. beforeunload solicita la advertencia estándar al salir con cambios o un guardado en curso. No se detectan conflictos con otras pestañas o modificaciones externas.

## Gestión de páginas — etapa 3

| Endpoint | Entrada JSON | Efecto |
| --- | --- | --- |
| `POST /api/pages` | `{ "template": "lesson" }`, `cover` o `blank` | Crea un JSON válido, lo agrega al final de pageOrder y selecciona la nueva página. `blank` inicia sin bloques ni títulos; cover/lesson conservan sus bloques iniciales. |
| `POST /api/pages/:id/duplicate` | `{}` | Copia todos los datos, genera nuevos ids para la página y cada bloque, y la inserta inmediatamente después del original. |
| `DELETE /api/pages/:id` | `{}` | Respalda página e índice, retira el archivo activo y su referencia, y selecciona la siguiente página o la anterior si se eliminó la última posición. |
| `PUT /api/book/page-order` | `{ "pageOrder": ["id-1", "id-2"] }` | Acepta exactamente todos los ids actuales una vez; modifica únicamente book.json y su respaldo. |

Las operaciones devuelven `{ book, pages, selectedId? }` con el orden guardado. Los nombres nuevos usan `page-NNN-descripcion.json`; la secuencia considera páginas activas y respaldos para no reutilizar identificadores eliminados. Renombrar una página no cambia su id ni su archivo. No hay numeración editorial persistida dentro de las páginas: lista, lienzo, navegación e impresión la calculan a partir de pageOrder.

Crear, duplicar, eliminar, mover y deshacer/rehacer el orden se guardan al ejecutarse. Duplicar guarda primero el borrador de la página seleccionada; si es inválido, no crea la copia. Las demás páginas conservan borradores e historial. Eliminar requiere confirmación en español y advierte si se descartan cambios pendientes: el respaldo contiene la última versión guardada. La última página no se puede eliminar, tanto en la interfaz como en la API, porque el esquema requiere al menos una.

Las lecturas de la API y todas las escrituras comparten una cola dentro del proceso. Antes de sustituir book.json se crea un respaldo exacto con nombre único en content/backups/. Si falla la actualización del índice al crear o duplicar, se retira el archivo recién creado; si falla al eliminar, se devuelve la página a su ubicación. Cada sustitución de JSON usa un temporal y renombrado. Esto no es una transacción resistente a un corte de energía o terminación forzada entre escrituras; los respaldos permiten recuperación manual. No ejecutar varias instancias que escriban el mismo libro simultáneamente.

Título y plantilla usan el historial por página. El orden tiene botones separados «Deshacer orden» y «Rehacer orden», hasta 30 estados en memoria, y cada paso se guarda inmediatamente. Este historial se reinicia al crear, duplicar o eliminar y al recargar. Crear, duplicar y eliminar no tienen deshacer visual; no se implementó restauración de respaldos en esta etapa. Si falla mover, el editor recupera el orden anterior y muestra «Error al guardar» para poder reintentar.

El validador lee `book.json`, `design.json` y todos los `.json` directamente dentro de `content/pages/`, incluidos los no registrados. Comprueba estructura, campos obligatorios, tipos, plantillas, identificadores duplicados, unidades, orden y existencia de recursos. `content/backups/` queda fuera del contenido activo. No introducir otros JSON activos fuera del modelo documentado.

La validación por CLI es de datos y referencias, incluidas tablas rectangulares, código textual/lenguaje admitido e imágenes existentes. No mide desbordamiento, contraste ni resolución para impresión. El navegador advierte si una tabla invade el pie, desborda su ancho o deja menos de 65 px de ancho por columna a escala natural; no cambia la tipografía ni divide páginas. El código se ajusta visualmente con pre-wrap y conserva intacto el texto guardado y copiado. La impresión usa los mismos estilos A4, sin controles ni advertencias. Los errores de CLI producen salida de proceso `1`; el éxito, `0`.

La validación recorre también hijos, columnas y tarjetas: ids únicos, correspondencia layout/cantidad, límites de tarjetas e imágenes internas existentes. El navegador avisa cuando la altura total supera A4. La hoja conserva 210 mm de ancho y un mínimo de 297 mm de alto; si se excede, muestra todo el contenido y desplaza el pie debajo, sin encoger fuentes. Abreviar o dividir manualmente antes de imprimir: no hay paginación editorial automática. Las columnas permanecen en una fila horizontal en editor, vista previa e impresión. Dentro de una columna, las tarjetas ajustan su cantidad por fila al ancho disponible sin alterar la distribución exterior. Los bloques demasiado estrechos muestran una advertencia, sin bloquear la inserción ni ocultar contenido. La impresión conserva marco/encabezado y oculta controles, selección y advertencias.

## Arquitectura de ejecución

`npm run dev` ejecuta `server/index.ts` con `tsx`. Express sirve la API y los recursos y monta Vite como middleware en el mismo servidor HTTP, ligado a `127.0.0.1:5173`. El frontend solicita la API con una ruta del mismo origen; no se necesita CORS ni un segundo proceso.

`npm run build` comprueba el código TypeScript y compila la interfaz a `dist/`. Los archivos compilados van a `dist/app-assets/` para no mezclarlos con `assets/`, que pertenece al libro. `npm start` sirve esa compilación con la misma API local; el contenido permanece fuera de `dist/` y sigue siendo editable en sus JSON.

Referencias técnicas: [Vite, integración con un servidor mediante middleware](https://vite.dev/guide/ssr.html#setting-up-the-dev-server), [Express 5](https://expressjs.com/en/5x/api/) y [validación con Zod](https://zod.dev/basics).

## Preguntas

`questions` contiene `mode` (mark/write), `title` opcional, `numbered`, `options` (2?4 objetos con id y label), `columns` (0?4 objetos con id y label) e `items` (id, text, cells y lines de 1 a 3). Cada fila tiene una celda por columna. Los identificadores internos se regeneran al duplicar. Los datos se conservan al cambiar de modo. Las casillas son gr?ficas para impresi?n.
