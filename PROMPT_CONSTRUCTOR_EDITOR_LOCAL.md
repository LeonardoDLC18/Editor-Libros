# PROYECTO: EDITOR LOCAL DE LIBROS EDUCATIVOS DE COMPUTACIÓN Y ROBÓTICA

Actúa como arquitecto de software, desarrollador full stack, diseñador editorial,
especialista en experiencia de usuario y especialista en maquetación para impresión.

Debes construir un proyecto completo y funcional. No me entregues solamente ejemplos,
fragmentos de código, explicaciones teóricas ni archivos incompletos.

Debes crear directamente todos los archivos del proyecto, instalar una arquitectura
coherente, verificar que el sistema funcione y dejarlo preparado para que otra IA
integrada en Visual Studio Code pueda agregar o modificar los contenidos del libro.

No hagas preguntas innecesarias. Cuando exista una decisión técnica razonable, toma la
decisión que favorezca la estabilidad, facilidad de edición y mantenimiento del proyecto.

======================================================================
1. OBJETIVO GENERAL
======================================================================

Quiero un sistema local para elaborar libros educativos de Computación y Robótica.

El sistema debe permitir dos formas de trabajo sobre el mismo proyecto:

A. EDICIÓN MEDIANTE IA EN VISUAL STUDIO CODE

Una IA integrada en Visual Studio Code podrá recibir instrucciones como:

- Agrega un tema sobre operadores lógicos en PSeInt.
- Crea cuatro páginas sobre sensores de Arduino.
- Cambia el contexto del ejercicio del huerto por una casa inteligente.
- Corrige la fórmula de Excel de la página 12.
- Reemplaza la imagen de un componente.
- Divide una página que tiene demasiado contenido.
- Agrega una actividad de comprensión.
- Cambia el orden de dos páginas.
- Elimina un ejercicio.
- Corrige una conexión electrónica.

La IA debe poder modificar directamente los archivos del proyecto sin entregar código
para copiar y pegar.

B. EDICIÓN VISUAL EN EL NAVEGADOR

Yo podré abrir el sistema en el navegador y realizar cambios sin programar:

- Editar textos haciendo clic sobre ellos.
- Cambiar títulos y subtítulos.
- Modificar preguntas, instrucciones y ejemplos.
- Editar tablas.
- Editar celdas.
- Agregar o eliminar filas y columnas.
- Reemplazar imágenes.
- Cambiar el tamaño y posición de una imagen.
- Editar el texto de diagramas SVG.
- Duplicar páginas.
- Eliminar páginas.
- Crear páginas nuevas.
- Cambiar el orden de páginas.
- Cambiar el tipo de plantilla de una página.
- Cambiar colores globales.
- Cambiar tamaños tipográficos globales.
- Revisar una vista previa A4.
- Imprimir o guardar el libro como PDF.

Los cambios realizados por la IA y los cambios realizados desde el navegador deben
trabajar sobre los mismos archivos locales.

======================================================================
2. RESTRICCIONES DEL PROYECTO
======================================================================

El proyecto debe funcionar completamente de forma local.

No utilizar:

- Base de datos.
- Firebase.
- Supabase.
- MySQL.
- PostgreSQL.
- MongoDB.
- Servicios en la nube.
- Inicio de sesión.
- Cuentas de usuario.
- Telemetría.
- Dependencias de una API de inteligencia artificial.
- Almacenamiento remoto.
- CDN obligatorios.
- Imágenes alojadas externamente.
- Fuentes que dependan permanentemente de Internet.

Todo el contenido debe guardarse dentro de la carpeta del proyecto.

El sistema no debe incluir una IA propia ni consumir una API de IA. La IA será un agente
externo integrado en Visual Studio Code. Ese agente modificará los archivos locales del
proyecto.

El servidor local debe escuchar solamente en 127.0.0.1 o localhost.

El proyecto debe poder ejecutarse con comandos simples:

npm install
npm run dev

También debe incluir:

npm run build
npm run validate
npm run qa

El sistema debe funcionar sin Internet después de instalar las dependencias.

======================================================================
3. ARQUITECTURA RECOMENDADA
======================================================================

Construye el proyecto con una arquitectura moderna, estable y fácil de mantener.

Tecnologías recomendadas:

- React.
- TypeScript.
- Vite.
- Node.js.
- Un pequeño servidor local con Express o una integración equivalente.
- Zod o JSON Schema para validar los datos.
- CSS modular, CSS normal bien organizado o una solución equivalente.
- Playwright para pruebas visuales y validación de impresión.
- Una biblioteca ligera para edición enriquecida solamente si realmente es necesaria.

No utilices una arquitectura innecesariamente compleja.

El servidor local tendrá únicamente estas responsabilidades:

- Leer los archivos JSON del libro.
- Guardar cambios en los archivos JSON.
- Recibir y guardar imágenes dentro de assets.
- Recibir y guardar archivos SVG.
- Crear respaldos locales.
- Detectar cambios hechos desde Visual Studio Code.
- Informar al navegador cuando un archivo cambie externamente.
- Validar rutas para impedir acceso fuera de la carpeta del proyecto.

No debe existir una base de datos oculta.

======================================================================
4. PRINCIPIO FUNDAMENTAL DE DISEÑO
======================================================================

Separa completamente:

1. EL MOTOR DEL EDITOR.
2. EL DISEÑO VISUAL.
3. EL CONTENIDO DEL LIBRO.
4. LOS RECURSOS GRÁFICOS.

El contenido no debe quedar escrito directamente dentro de componentes React ni dentro
de archivos HTML gigantes.

El archivo principal del contenido debe ser JSON.

El sistema debe considerar el JSON como la fuente oficial del libro.

Ejemplo conceptual:

{
  "schemaVersion": 1,
  "book": {
    "id": "libro-computacion-1-sec",
    "title": "Computación y Robótica",
    "grade": "1.º de Secundaria",
    "subtitle": "",
    "author": "",
    "currentUnit": ""
  },
  "units": [],
  "pages": []
}

Cada página debe poseer un identificador permanente.

Cada bloque dentro de una página debe poseer un identificador permanente.

Ejemplo conceptual:

{
  "id": "page-operadores-logicos-01",
  "template": "lesson",
  "unitId": "unidad-2",
  "theme": {
    "label": "Tema 5",
    "title": "Operadores lógicos en PSeInt"
  },
  "blocks": [
    {
      "id": "block-definition",
      "type": "infoCard",
      "title": "¿Qué son?",
      "content": "..."
    },
    {
      "id": "block-table",
      "type": "table",
      "columns": [],
      "rows": []
    }
  ]
}

Crea un esquema de datos completo, validado y documentado.

No permitas que una IA deba modificar manualmente el HTML generado.

Para agregar contenido, la IA debe modificar principalmente:

- content/book.json
- content/design.json, solamente cuando se solicite un cambio global de diseño.
- assets/, cuando agregue o reemplace recursos.
- diagrams/, cuando agregue diagramas SVG.

El motor del editor no debe modificarse al agregar temas normales.

======================================================================
5. ESTRUCTURA DE CARPETAS
======================================================================

Crea una estructura clara y equivalente a esta:

/
├── AGENTS.md
├── AI_WORKFLOW.md
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── content/
│   ├── book.json
│   ├── design.json
│   ├── schemas/
│   │   ├── book.schema.json
│   │   └── design.schema.json
│   └── backups/
├── assets/
│   ├── images/
│   ├── icons/
│   ├── components/
│   └── screenshots/
├── diagrams/
│   └── svg/
├── reference/
│   └── aquí se podrá colocar el PDF del libro de referencia
├── exports/
├── src/
│   ├── editor/
│   ├── renderer/
│   ├── components/
│   ├── templates/
│   ├── styles/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── server/
├── scripts/
├── tests/
└── public/

Puedes ajustar la estructura cuando exista una razón técnica clara, pero debes conservar
la separación entre contenido, diseño, recursos y motor del editor.

======================================================================
6. DISEÑO VISUAL DEL LIBRO
======================================================================

Usa como referencia visual el PDF del libro proporcionado.

No conviertas sus páginas en imágenes de fondo.

Analiza su lenguaje editorial y conviértelo en un sistema reutilizable de componentes.

El sistema visual debe incluir:

- Página en formato A4.
- Encabezado editorial uniforme.
- Nombre del área: Computación y Robótica.
- Grado académico.
- Indicador de unidad.
- Banda de tema o proyecto.
- Títulos principales.
- Subtítulos.
- Tarjetas informativas.
- Tarjetas de definición.
- Tarjetas de práctica.
- Pasos numerados.
- Tablas.
- Bloques de código.
- Fórmulas.
- Preguntas de comprensión.
- Listas de comprobación.
- Cuadros de misión.
- Cuadros de contexto.
- Cuadros de reflexión.
- Secciones de proyecto.
- Numeración inferior de página.
- Espacios para imágenes.
- Diagramas.
- Comparaciones.
- Actividades de experimentación.

Paleta inicial:

- Azul marino como color estructural.
- Azul medio.
- Cian como acento.
- Blanco como fondo principal.
- Celeste claro para paneles.
- Verde, amarillo, naranja o violeta solamente como colores funcionales secundarios.

La paleta debe definirse mediante variables o tokens globales.

No utilices colores escritos repetidamente dentro de cada componente.

Define en content/design.json o un archivo equivalente:

- Colores.
- Tipografías.
- Escala tipográfica.
- Espaciado.
- Bordes.
- Radios.
- Sombras.
- Márgenes.
- Tamaño A4.
- Encabezado.
- Pie de página.
- Estilos de tablas.
- Estilos de código.
- Estilos de tarjetas.

El usuario debe poder modificar los valores globales desde una sección denominada
“Diseño del libro”.

El diseño debe estar protegido contra inconsistencias. No permitas cambiar arbitrariamente
la fuente de cada párrafo desde el editor normal.

Los cambios individuales avanzados pueden estar disponibles en una sección separada,
pero el flujo principal debe conservar la uniformidad del libro.

======================================================================
7. PLANTILLAS DE PÁGINA
======================================================================

Crea una biblioteca de plantillas editables.

Debe incluir como mínimo:

1. Portada.
2. Apertura de unidad.
3. Presentación de tema.
4. Explicación conceptual.
5. Comparación.
6. Tabla explicativa.
7. Procedimiento paso a paso.
8. Práctica guiada.
9. Aplicación guiada.
10. Ejercicio individual.
11. Página de preguntas.
12. Proyecto.
13. Evaluación.
14. Página de código o algoritmo.
15. Página de diagrama técnico.
16. Página mixta de texto e imagen.
17. Página de dos columnas.
18. Página de cierre o reflexión.

Cada plantilla debe:

- Mantener las dimensiones de impresión.
- Usar componentes reutilizables.
- Tener zonas editables.
- Respetar márgenes seguros.
- Tener restricciones de contenido.
- Mostrar advertencias cuando el contenido no quepa.
- Poder duplicarse.
- Poder cambiarse por otra plantilla sin perder toda la información.

No crees páginas completamente libres como un programa de diseño gráfico.

El sistema debe ser flexible, pero guiado. El objetivo principal es mantener consistencia
editorial.

======================================================================
8. BLOQUES DE CONTENIDO
======================================================================

Crea componentes o bloques reutilizables para:

- Texto.
- Título.
- Subtítulo.
- Párrafo.
- Lista.
- Lista numerada.
- Cita o definición.
- Tarjeta.
- Nota.
- Advertencia.
- Consejo.
- Misión.
- Contexto.
- Pregunta.
- Respuesta.
- Actividad.
- Pasos.
- Tabla.
- Código.
- Pseudocódigo.
- Fórmula.
- Imagen.
- Galería.
- Comparación.
- Diagrama.
- Línea de tiempo.
- Lista de comprobación.
- Opciones verdadero o falso.
- Campos para completar.
- Encabezado de tema.
- Pie de página.

Cada bloque debe poder:

- Editarse.
- Duplicarse.
- Eliminarse.
- Moverse hacia arriba o abajo.
- Cambiarse de columna cuando la plantilla lo permita.
- Mostrar propiedades en el panel lateral.
- Validar su contenido.

======================================================================
9. EDITOR VISUAL
======================================================================

La interfaz debe estar en español.

Diseña una interfaz de escritorio similar a un editor editorial:

BARRA SUPERIOR

- Nombre del libro.
- Estado de guardado.
- Deshacer.
- Rehacer.
- Vista de edición.
- Vista previa.
- Zoom.
- Validar.
- Imprimir / PDF.
- Guardar proyecto.
- Exportar respaldo.

PANEL IZQUIERDO

- Miniaturas de páginas.
- Número de página.
- Tipo de plantilla.
- Unidad.
- Tema.
- Botón Nueva página.
- Duplicar.
- Eliminar.
- Mover arriba.
- Mover abajo.
- Filtro por unidad.
- Buscador.

ÁREA CENTRAL

- Página A4.
- Edición directa.
- Selección visual de bloques.
- Márgenes visibles opcionales.
- Guías.
- Indicadores de desbordamiento.
- Vista de una página o páginas continuas.

PANEL DERECHO

- Propiedades de la página.
- Propiedades del bloque seleccionado.
- Plantilla.
- Título.
- Contenido.
- Imagen.
- Alineación.
- Tamaño.
- Distribución.
- Accesibilidad.
- Texto alternativo.
- Configuración de tabla.
- Configuración de código.
- Configuración de impresión.

El usuario debe poder hacer clic sobre un texto y modificarlo directamente.

Incluye como mínimo:

- Negrita.
- Cursiva.
- Subrayado.
- Listas.
- Alineación.
- Superíndice.
- Subíndice.
- Enlaces internos cuando sean necesarios.
- Deshacer y rehacer.
- Atajos de teclado.
- Selección de texto sencilla.

No incluyas opciones innecesarias que puedan destruir la consistencia visual.

======================================================================
10. EDICIÓN DE IMÁGENES
======================================================================

El usuario debe poder:

- Subir una imagen desde su computadora.
- Reemplazar una imagen existente.
- Guardarla dentro de assets/images.
- Cambiar el encuadre.
- Seleccionar contener, cubrir o ajustar.
- Cambiar ancho y alto dentro de límites razonables.
- Mover el punto focal.
- Agregar texto alternativo.
- Agregar pie de imagen.
- Eliminar la imagen.
- Ver la ruta del archivo local.

No guardes imágenes en Base64 dentro del JSON.

Guarda una ruta relativa.

Ejemplo:

"src": "assets/images/tema-arduino/sensor-ultrasonico.webp"

Optimiza imágenes grandes sin perder calidad visible.

Nunca incrustes textos importantes dentro de una imagen cuando puedan ser texto HTML.

======================================================================
11. DIAGRAMAS TÉCNICOS, ROBÓTICA Y ELECTRÓNICA
======================================================================

Para diagramas de componentes, circuitos y conexiones:

- Prioriza SVG.
- Conserva textos como texto editable.
- Conserva cables como líneas o rutas editables.
- Conserva componentes como elementos separados cuando sea posible.
- Permite reemplazar el SVG completo.
- Permite modificar etiquetas y pies desde el panel de propiedades.
- No rasterices automáticamente el diagrama.
- No inventes conexiones eléctricas.
- No uses imágenes generadas por IA como única fuente de verdad técnica.
- Permite asociar una nota técnica o fuente al diagrama.
- Permite mostrar advertencias de revisión técnica.

Para capturas de Word, Excel o PSeInt:

- Permite usar capturas reales cuando sean necesarias.
- Mantén las explicaciones, títulos, flechas y etiquetas fuera de la captura siempre que
  sea posible.
- No incrustes una página completa dentro de una sola imagen.

======================================================================
12. TABLAS
======================================================================

Implementa un editor de tablas sencillo.

Debe permitir:

- Editar cualquier celda.
- Agregar filas.
- Eliminar filas.
- Agregar columnas.
- Eliminar columnas.
- Cambiar el ancho de columnas.
- Combinar celdas cuando sea necesario.
- Alinear contenido.
- Definir encabezados.
- Aplicar estilos del sistema.
- Copiar y pegar contenido tabular.
- Evitar que la tabla salga fuera de la página.
- Dividir una tabla en dos páginas cuando resulte necesario.

No uses una imagen para representar una tabla editable.

======================================================================
13. CÓDIGO, FÓRMULAS Y PSEUDOCÓDIGO
======================================================================

Crea bloques especiales para:

- PSeInt.
- Fórmulas de Excel.
- Código de Arduino.
- Python.
- HTML y CSS.
- Texto de consola.
- Algoritmos generales.

El código debe ser texto real.

Debe poder copiarse y editarse.

Usa fuente monoespaciada.

Incluye resaltado ligero, pero asegúrate de que la impresión sea clara.

Para PSeInt, conserva correctamente palabras como:

Algoritmo
Definir
Como
Leer
Escribir
Si
Entonces
Sino
FinSi
Para
Mientras
FinAlgoritmo

No reemplaces automáticamente términos válidos.

======================================================================
14. GUARDADO LOCAL
======================================================================

El navegador debe guardar directamente en la carpeta del proyecto mediante el servidor
local.

No dependas únicamente de localStorage.

localStorage puede utilizarse como respaldo temporal, pero no como almacenamiento
principal.

Al pulsar Guardar:

- Actualiza content/book.json.
- Actualiza content/design.json cuando corresponda.
- Guarda las imágenes nuevas.
- Mantiene rutas relativas.
- Crea un respaldo previo.
- Actualiza el estado de guardado.

Crea respaldos automáticos en content/backups.

Conserva una cantidad limitada, por ejemplo los últimos 20 respaldos.

Agrega una opción para restaurar un respaldo.

Implementa guardado automático configurable.

Muestra claramente:

- Guardado.
- Cambios sin guardar.
- Guardando.
- Error al guardar.
- Cambio externo detectado.

======================================================================
15. CAMBIOS REALIZADOS DESDE VISUAL STUDIO CODE
======================================================================

Este punto es obligatorio.

El servidor local debe vigilar:

- content/book.json
- content/design.json
- assets/
- diagrams/

Cuando la IA integrada en Visual Studio Code modifique alguno de esos archivos:

- El navegador debe detectar el cambio.
- Debe mostrar un aviso: “Se detectaron cambios externos”.
- Debe permitir recargar inmediatamente.
- Puede actualizar automáticamente cuando no existan cambios sin guardar.
- No debe sobrescribir cambios pendientes del usuario.
- Debe mostrar un conflicto cuando el navegador y Visual Studio Code hayan modificado la
  misma versión.
- Debe ofrecer guardar una copia antes de recargar.

Utiliza un hash, número de versión o marca de modificación para detectar conflictos.

No implementes una sincronización compleja innecesaria, pero evita pérdida de información.

======================================================================
16. AGENTS.MD Y FLUJO PARA LA IA
======================================================================

Crea un archivo AGENTS.md en la raíz.

Este archivo debe explicar a cualquier IA integrada en Visual Studio Code:

1. Qué es el proyecto.
2. Cuáles son los archivos que puede modificar.
3. Cuáles son los archivos que no debe modificar durante una tarea de contenido.
4. Cómo funciona el esquema JSON.
5. Cómo agregar una unidad.
6. Cómo agregar un tema.
7. Cómo agregar páginas.
8. Cómo agregar imágenes.
9. Cómo crear diagramas SVG.
10. Cómo mantener identificadores únicos.
11. Cómo ejecutar la validación.
12. Cómo ejecutar las pruebas.
13. Cómo detectar contenido demasiado extenso.
14. Cómo conservar el estilo.
15. Cómo realizar respaldos.
16. Cómo informar de sus cambios.

Incluye una regla principal:

“Para tareas normales de contenido, no modifiques el motor del editor, los componentes
React ni los estilos estructurales. Modifica content/book.json y agrega recursos dentro
de assets o diagrams. Solo modifica el motor cuando el usuario lo solicite expresamente.”

Incluye otra regla:

“No entregues fragmentos para copiar y pegar. Realiza directamente los cambios en la
carpeta del proyecto.”

Incluye otra regla:

“No conviertas una página completa en una imagen.”

Incluye otra regla:

“No cambies colores, fuentes o tamaños globales cuando el usuario solamente haya pedido
agregar contenido.”

Crea también AI_WORKFLOW.md con ejemplos concretos.

Ejemplo:

Solicitud:
“Agrega un tema de cuatro páginas sobre operadores lógicos en PSeInt.”

Flujo de la IA:

1. Leer AGENTS.md.
2. Leer el esquema.
3. Leer las páginas cercanas para conservar el nivel pedagógico.
4. Crear identificadores únicos.
5. Agregar las cuatro páginas en content/book.json.
6. Agregar recursos locales cuando sean necesarios.
7. Ejecutar npm run validate.
8. Ejecutar npm run qa.
9. Corregir errores.
10. Resumir qué archivos modificó.

======================================================================
17. VALIDACIÓN
======================================================================

Crea un sistema de validación que compruebe:

- JSON válido.
- Esquema correcto.
- Identificadores únicos.
- Páginas sin identificador.
- Bloques sin identificador.
- Recursos inexistentes.
- Rutas absolutas no permitidas.
- Imágenes faltantes.
- Campos obligatorios.
- Tablas vacías.
- Plantillas desconocidas.
- Texto excesivamente largo.
- Bloques fuera de la página.
- Contenido desbordado.
- Página sin título cuando la plantilla lo requiere.
- Contraste visual insuficiente.
- Tamaños tipográficos demasiado pequeños.
- Imágenes con resolución insuficiente para impresión.
- Texto alternativo faltante.
- Numeración inconsistente.

Los errores deben aparecer:

- En una pantalla de validación.
- En la miniatura de la página afectada.
- En el panel derecho.
- En la consola de npm run validate.

Diferencia claramente:

- Error.
- Advertencia.
- Recomendación.

======================================================================
18. VISTA PREVIA E IMPRESIÓN
======================================================================

La vista previa debe representar fielmente el resultado final.

Formato:

- A4 vertical.
- 210 mm x 297 mm.
- Márgenes seguros.
- Fondos impresos.
- Colores conservados.
- Saltos de página exactos.
- Una página del editor equivale a una página del PDF.

Crea CSS específico para impresión.

Al imprimir:

- Oculta la interfaz del editor.
- Muestra solamente las páginas.
- Conserva imágenes.
- Conserva colores de fondo.
- Conserva encabezados.
- Conserva pies.
- Conserva numeración.
- Evita cortes entre componentes.
- Evita páginas en blanco innecesarias.
- Evita que un bloque aparezca parcialmente en otra página.

Agrega un botón visible:

“Imprimir / Guardar como PDF”

Este botón puede abrir la función de impresión del navegador.

Incluye instrucciones para seleccionar:

- Tamaño A4.
- Márgenes: ninguno o según configuración.
- Gráficos de fondo activados.
- Escala 100 %.

También puedes incluir un comando local opcional que genere PDF mediante Playwright:

npm run export:pdf

El PDF debe guardarse en exports/.

La función principal seguirá siendo Imprimir / Guardar como PDF.

======================================================================
19. CONTROL DE DESBORDAMIENTO
======================================================================

El sistema no debe reducir automáticamente todos los textos hasta volverlos ilegibles.

Cuando una página tenga demasiado contenido:

1. Muestra una advertencia.
2. Señala el bloque problemático.
3. Sugiere:
   - Acortar texto.
   - Dividir la página.
   - Cambiar a una plantilla apropiada.
   - Mover un bloque a la página siguiente.
4. Permite crear una continuación.
5. Conserva un tamaño mínimo de letra legible.

Crea una opción:

“Dividir contenido en una nueva página”

La IA también debe poder leer estas advertencias mediante npm run validate.

======================================================================
20. HISTORIAL Y SEGURIDAD
======================================================================

Incluye:

- Deshacer.
- Rehacer.
- Respaldo antes de guardar.
- Restaurar respaldo.
- Confirmación antes de eliminar una página.
- Confirmación antes de eliminar un recurso utilizado.
- Indicador de cambios sin guardar.
- Manejo de errores.
- Mensajes comprensibles en español.

Protege el servidor local contra rutas como:

../../archivo-del-sistema

Solamente debe leer y escribir dentro de la carpeta autorizada del proyecto.

======================================================================
21. IMPORTACIÓN Y EXPORTACIÓN
======================================================================

Incluye:

- Exportar contenido JSON.
- Importar contenido JSON validado.
- Exportar un respaldo completo del proyecto cuando sea razonable.
- Copiar una página como JSON.
- Pegar una página desde JSON.
- Exportar PDF.
- Exportar una versión HTML de lectura cuando sea técnicamente viable.

La importación nunca debe reemplazar silenciosamente el proyecto.

Debe crear un respaldo antes.

======================================================================
22. CONTENIDO DE DEMOSTRACIÓN
======================================================================

No es necesario reconstruir todo el libro de referencia para demostrar el sistema.

Incluye un libro de ejemplo pequeño pero suficiente para probarlo.

Debe contener como mínimo:

1. Una portada.
2. Una página conceptual.
3. Una página de procedimiento.
4. Una página de tabla.
5. Una página de código PSeInt.
6. Una página de proyecto.

Usa contenidos educativos breves relacionados con Computación y Robótica.

El contenido de demostración debe probar:

- Edición de texto.
- Edición de imagen.
- Edición de tabla.
- Edición de código.
- Duplicación de páginas.
- Impresión.
- Validación.
- Cambio de diseño global.

======================================================================
23. EXPERIENCIA DEL USUARIO
======================================================================

El sistema será utilizado por una persona que no desea programar.

Por eso:

- La interfaz debe ser clara.
- Los botones deben tener nombres comprensibles.
- No muestres JSON al usuario normal.
- No obligues al usuario a escribir código.
- No obligues al usuario a buscar rutas manualmente.
- No obligues al usuario a copiar archivos de un lugar a otro.
- Usa mensajes en español.
- Usa iconos acompañados de texto.
- Incluye ayudas breves.
- Incluye un recorrido inicial opcional.
- Incluye estados vacíos claros.
- Incluye mensajes de error útiles.

El editor debe funcionar principalmente en Chrome y Edge de escritorio.

======================================================================
24. README
======================================================================

Crea un README.md completo en español.

Debe explicar:

- Qué es el sistema.
- Qué requisitos necesita.
- Cómo instalar Node.js.
- Cómo abrir la carpeta en Visual Studio Code.
- Cómo ejecutar npm install.
- Cómo ejecutar npm run dev.
- Cómo abrir el navegador.
- Cómo editar una página.
- Cómo reemplazar una imagen.
- Cómo agregar una página.
- Cómo guardar.
- Cómo imprimir como PDF.
- Cómo trabajar con una IA integrada en Visual Studio Code.
- Cómo restaurar un respaldo.
- Cómo validar el libro.
- Cómo solucionar errores comunes.

Incluye instrucciones para Windows.

Evita asumir conocimientos avanzados de programación.

======================================================================
25. PRUEBAS OBLIGATORIAS
======================================================================

Crea pruebas que verifiquen como mínimo:

1. El proyecto inicia correctamente.
2. El libro se carga.
3. Una página puede editarse.
4. El contenido se guarda en disco.
5. El cambio permanece después de reiniciar el servidor.
6. Una imagen puede reemplazarse.
7. Una tabla puede modificarse.
8. Una página puede duplicarse.
9. Las páginas pueden reordenarse.
10. Una página puede eliminarse.
11. Un cambio externo es detectado.
12. No se pierde un cambio sin guardar.
13. El JSON inválido es rechazado.
14. Un recurso inexistente genera advertencia.
15. La impresión produce páginas A4.
16. La interfaz desaparece al imprimir.
17. Los fondos aparecen en la impresión.
18. No existe desbordamiento en el contenido de demostración.
19. npm run validate funciona.
20. npm run build termina sin errores.

Ejecuta las pruebas antes de dar por terminado el proyecto.

======================================================================
26. CRITERIOS DE ACEPTACIÓN
======================================================================

El proyecto solamente se considera terminado cuando se cumpla todo lo siguiente:

- Puedo abrir la carpeta en Visual Studio Code.
- Puedo ejecutar npm install.
- Puedo ejecutar npm run dev.
- El navegador abre el editor local.
- Veo miniaturas de las páginas.
- Puedo seleccionar una página.
- Puedo editar texto directamente.
- Puedo reemplazar una imagen.
- Puedo modificar una tabla.
- Puedo agregar una página.
- Puedo duplicar una página.
- Puedo eliminar una página.
- Puedo cambiar el orden de páginas.
- Puedo cambiar una plantilla.
- Puedo guardar.
- El cambio se escribe en la carpeta.
- El cambio permanece después de cerrar y volver a abrir.
- Una IA de Visual Studio Code puede agregar páginas modificando book.json.
- El navegador detecta esos cambios.
- Los cambios externos no eliminan silenciosamente cambios sin guardar.
- Puedo imprimir el libro en A4.
- El PDF conserva colores, imágenes y numeración.
- No existe base de datos.
- No se utiliza almacenamiento remoto.
- No se requiere una API de IA.
- Todo queda dentro de la carpeta del proyecto.
- Existe documentación suficiente.
- Existen archivos AGENTS.md y AI_WORKFLOW.md.
- Existen validaciones y pruebas.
- El diseño es coherente entre todas las páginas.
- Los textos continúan siendo texto editable.
- Las tablas continúan siendo tablas editables.
- Los códigos continúan siendo texto editable.
- Los diagramas no se convierten innecesariamente en imágenes planas.

======================================================================
27. PROCESO DE CONSTRUCCIÓN
======================================================================

Sigue este orden:

1. Analiza los archivos de referencia.
2. Define la arquitectura.
3. Define el esquema de datos.
4. Crea el servidor local.
5. Crea el renderizador de páginas.
6. Crea las plantillas.
7. Crea el editor visual.
8. Implementa guardado local.
9. Implementa vigilancia de archivos.
10. Implementa validación.
11. Implementa impresión.
12. Implementa respaldos.
13. Crea AGENTS.md.
14. Crea AI_WORKFLOW.md.
15. Crea README.md.
16. Agrega contenido de demostración.
17. Ejecuta pruebas.
18. Corrige errores.
19. Verifica visualmente cada plantilla.
20. Entrega el proyecto completo.

No detengas la construcción después de crear una maqueta visual.

No consideres terminado el proyecto si los botones no funcionan.

No dejes funciones simuladas.

No uses datos falsos para aparentar que se guarda.

No uses localStorage como única persistencia.

No me entregues instrucciones para que yo complete el proyecto manualmente.

======================================================================
28. ENTREGA FINAL
======================================================================

Al terminar:

- Entrega la carpeta completa del proyecto.
- Incluye todos los archivos fuente.
- Incluye package.json.
- Incluye el contenido de demostración.
- Incluye las pruebas.
- Incluye README.md.
- Incluye AGENTS.md.
- Incluye AI_WORKFLOW.md.
- Incluye una lista de los comandos disponibles.
- Incluye un resumen breve de la arquitectura.
- Indica qué archivos modificará normalmente la IA.
- Indica dónde se guardan las imágenes.
- Indica dónde se guardan los respaldos.
- Indica cómo imprimir el PDF.
- Informa los resultados reales de las pruebas ejecutadas.
- No afirmes que una prueba pasó si no fue ejecutada.

Construye ahora el proyecto completo.