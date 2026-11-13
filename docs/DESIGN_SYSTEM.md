# Sistema visual inicial

## Referencias consultadas

Se inspeccionaron `reference/libro-referencia.pdf` y todos los archivos del ZIP `reference/libro_computacion_editable.zip`: HTML, CSS, JavaScript, textos, imágenes y PDF de vista previa. Ambos PDF contienen 21 páginas A4. El PDF original contiene buena parte de su composición en imágenes incrustadas; el ZIP proporciona una reconstrucción con encabezados, bandas, tarjetas y pies expresados en HTML/CSS.

Se tomó la organización editorial y la paleta de esa referencia: azul marino estructural, azul medio, cian, blanco y celeste claro. Los valores iniciales `#062b5f`, `#005ec7`, `#00d8ee` y `#eaf7ff` coinciden con el CSS del ZIP. No se rasterizaron páginas ni se usaron capturas completas como fondos.

La única ilustración reutilizada es `assets/images/portada-laptop.png`, copiada del recurso del mismo nombre dentro del ZIP proporcionado. Es una ilustración de una computadora, no una página del libro. Los originales de `reference/` permanecen intactos.

## Tokens y reglas

La fuente de verdad es `content/design.json`; `src/utils/designTokens.ts` la convierte en variables CSS en la raíz del editor. `book.css` define la composición editorial, `editor.css` la interfaz y `print.css` el comportamiento básico de impresión.

| Grupo | Uso |
| --- | --- |
| `colors` | Marina, azul, cian, papel, celeste, tinta, texto secundario, líneas, superficies y estados. |
| `fonts` | Títulos Trebuchet MS, cuerpo Aptos/Calibri, interfaz Segoe UI y código Consolas; todos con alternativas locales. |
| `typeScale` | Cuerpo 12 pt, notas 9 pt, secciones 19 pt, título 30 pt, portada 43 pt, interlineado 1.5. |
| `page` | A4 fijo 210 × 297 mm, márgenes 17 mm, encabezado 23 mm, pie 14 mm. |
| `spacing` | Separación de bloques y espacio interior de las tarjetas. |
| `borders` | Grosor y radio compartidos de tarjetas e imágenes. |
| `shadow` | Sombra de la página solo en pantalla. |

- Encabezado editorial azul marino, nombre del área, grado y etiqueta de unidad.
- Banda de tema: etiqueta cian y título sobre marino.
- Tarjetas celestes con borde azul y rótulo opcional.
- Pie de página con unidad, grado y número, derivado de `pageOrder`. La portada también se numera en esta demostración.
- Textos reales en HTML, sin dibujar palabras dentro de imágenes de página.
- La escala del lienzo transforma la página completa; no cambia los tamaños de impresión.
- Estados de selección visibles y navegación por teclado. Los paneles se adaptan al ancho; el editor completo está pensado para escritorio.

## Límites

Se usa CSS básico de impresión para ocultar controles y mostrar todas las páginas con saltos A4. El resultado depende de las opciones del navegador. La detección de desbordamientos, evaluación de contraste, control de resolución de imágenes y QA de PDF son parte de la etapa 6. El contenido debe mantenerse breve hasta entonces.
