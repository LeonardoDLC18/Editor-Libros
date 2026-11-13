# Hoja de ruta

| Etapa | Alcance | Criterio de cierre |
| --- | --- | --- |
| 1. Base funcional | Estructura, servidor local, JSON separados, dos plantillas, cuatro bloques, interfaz, validación y documentación. | Instalar, iniciar, compilar y validar; visualizar y seleccionar ambas páginas. |
| 2. Edición de texto y guardado real | Cambiar títulos, párrafos y tarjetas; estado de cambios; endpoint de escritura validada y atómica. | Guardar en los mismos JSON y conservar el cambio tras reiniciar; rechazar datos inválidos sin dañar originales. |
| 3. Gestión de páginas | Crear, duplicar, eliminar y reordenar desde la interfaz. | Actualizar archivos e índices de forma coherente, con identificadores únicos. |
| 4. Imágenes, tablas y código | Carga/reemplazo local, nuevos bloques de tablas y código, controles adecuados. | Recursos relativos y datos editables, sin rasterizar contenido. |
| 5. Respaldos y cambios externos | Copias previas, restauración, vigilancia, conflictos y protección de cambios pendientes. | Recuperar una versión y detectar cambios de VS Code sin sobrescribir trabajo. |
| 6. Impresión A4, validación avanzada y QA | Desbordamiento, resolución, contraste, numeración, comprobaciones de impresión y PDF; introducir Playwright si se autoriza. | Todas las plantillas verificadas en pantalla e impresión, sin cortes o páginas vacías. |
| 7. Funciones avanzadas | Más plantillas hasta cubrir el catálogo, edición SVG, importación/exportación y otras mejoras solicitadas. | Funciones incorporadas por incrementos, documentadas y verificadas. |

Las etapas 1–3 están completas; las etapas 4–7 están pendientes y solo se implementarán tras una solicitud. La impresión básica de la etapa 1 no reemplaza la verificación editorial de la etapa 6. No incorporar servicios en la nube, bases de datos o APIs externas durante las siguientes etapas.
