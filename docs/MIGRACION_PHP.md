# Plan de sustitución del backend por PHP + MariaDB

Estado: propuesta técnica; no autoriza implementación ni acredita compatibilidad con Hostinger Premium.
Base: inspección estática del código actual, sin ejecución, instalaciones ni acceso al alojamiento.
Se recomienda conservar React, los bloques JSON y la impresión del navegador; sustituir la persistencia y API por etapas.
La sustitución funcional y las funciones nuevas de usuarios, libros y concurrencia son alcances distintos.

## 1. Contrato que debe conservarse

Fuentes: `src/services/book.ts`, `src/types/schema.ts`, `server/index.ts` y `server/managePages.ts`.
Las rutas siguientes son las existentes, relativas al mismo origen; no identifican libro en la petición actual.
Las escrituras usan JSON con `Content-Type: application/json`, salvo la subida binaria.

| Método y ruta actual | Cuerpo | Respuesta correcta consumida |
| --- | --- | --- |
| GET /api/book | Sin cuerpo; cache no-store | `{book, design, pages}`; páginas en orden editorial |
| PUT /api/pages/:id | Objeto Page completo | `{page}` validada y normalizada |
| POST /api/pages | `{template}`: cover, lesson o blank | `{book, pages, selectedId?}` |
| POST /api/pages/:id/duplicate | `{}` | `{book, pages, selectedId?}` |
| DELETE /api/pages/:id | `{}` | `{book, pages, selectedId?}` |
| PUT /api/book/page-order | `{pageOrder: string[]}` | `{book, pages}` |
| PUT /api/book/numbering | `{pageNumbering, firstContentPageSide}` | `{book, pages}`; alternate/left/right y left/right, respectivamente |
| POST /api/images | Bytes del File, sin multipart; Content-Type image/png, image/jpeg o image/webp; X-File-Name = encodeURIComponent(nombre) | `{src}` relativo |
| POST /api/images/analyze | `{references: string[]}` | `{total, used, unused: [{src,size,hash}], recoverableBytes}` |
| POST /api/images/delete-unused | `{selected: [{src,size,hash}], references: string[]}` | Inventario anterior más `{deleted: string[], skipped: string[]}` |

Errores de API: JSON `{message, issues?: string[]}` y HTTP no satisfactorio; el cliente concatena issues, salvo subida, que usa message.
Estados actuales: 400 entrada/JSON inválido, 403 origen rechazado, 404 recurso/ruta ausente, 409 eliminación de la última página, 413 tamaño, 415 tipo y 422 validación; 500 fallo interno.
El filtro global de hostname local responde 403 en texto; es una restricción local actual, no autenticación trasladable a Internet.
Límites actuales: JSON 1 MB; imagen 10 × 1024 × 1024 bytes. Preservar errores controlados también ante límites del servidor web.
Los recursos se sirven mediante GET/HEAD bajo `/assets/*` y `/diagrams/*`, con extensiones permitidas, sin rutas arbitrarias.
No existen endpoints de Guardar global, restauración, autenticación ni selección de libro.

Ampliación propuesta, no existente: prefijar cada operación con `/api/books/:bookId`, adaptando `src/services/book.ts`.
El bookId explícito debe alcanzar páginas, recursos, revisiones y cada autorización; nunca depender de un libro activo global.
Conservar las formas de contenido y errores; añadir metadatos de versión fuera del JSON editorial y actualizar tipos/cliente de forma coordinada.
Para recursos, conservar src lógico y resolverlo mediante una ruta privada por libro; adaptar la resolución de URL del frontend.

## 2. Validación equivalente

Zod instalado: **4.6.7**, comprobado en `node_modules/zod/package.json` y coincidente con `package-lock.json`.
La fuente ejecutable es `src/types/schema.ts`; contiene también tipos card y questions. No limitarse a la lista documental de AGENTS.md.
Conservar schemaVersion 1, estructura de bloques, propiedades adicionales admitidas por looseObject y rechazo de extras en strictObject.
La versión instalada expone conversión JSON Schema; conviene evaluar una exportación parcial y versionada para restricciones declarativas.
Son candidatas: tipos, campos obligatorios/opcionales, enumeraciones, patrones, límites numéricos/de longitud y estructuras de arrays/uniones.
No se ha ejecutado la exportación: los preprocess impiden asumir que el esquema completo se convierta directamente.
No usar una salida permisiva para tipos no representables ni considerar JSON Schema sustituto de toda la validación.
Implementar y probar en PHP por separado:
- Normalización trim, valores predeterminados y conversión de cardContainer/steps legado a steps; distinguir entrada normalizada de salida.
- Recorrido acotado a tres niveles de contenedores, sin contar filas/celdas/columnas como nivel, conforme al código.
- Reglas superRefine: tablas y anchos, questions/celdas, texto con formato, tarjetas por variante, banda theme de lesson y richText.
- Distribuciones de columnas y grids: cobertura, límites, spans y solapamientos (`src/utils/grid.ts`).
- IDs permanentes y únicos de páginas/unidades y de elementos anidados en todo el libro; duplicación con remapeo de IDs y formatos.
- Concordancia de pageOrder con páginas, pertenencia de unitId y existencia segura de recursos (`server/content.ts`, `src/utils/blocks.ts`).
- Lista de campos editables y conciliación por tipo de `server/savePage.ts`: conservar campos ajenos, tipos e IDs existentes; rechazar diferencias no autorizadas.
Replicar su comparación final, reglas de eliminación de opcionales y excepciones de valores mínimos de plantilla; no aceptar cualquier JSON válido.
Las utilidades compartidas de bloques, grid y plantilla deberán tener equivalentes PHP o reglas verificables comunes; React conserva sus utilidades.

## 3. Diseño de datos propuesto

Entidades nuevas; no describen tablas existentes. Usar claves y relaciones que impidan referencias entre libros.
- Usuarios autorizados: identidad, correo único, hash de contraseña, estado y fechas; sin registro público.
- Invitaciones: destinatario, emisor, libro/rol autorizados, hash de token aleatorio, caducidad y uso único/revocación.
- Libros y miembros: metadatos actuales y relación usuario/libro con rol lector, editor o administrador del libro.
- Páginas: clave interna, book_id, id editorial permanente, contenido JSON actual, versión y estado de eliminación recuperable.
- Estado por libro: unidades, diseño, configuración, encabezado/pie y orden; versionado. Importar solo los campos existentes; no inventar campos actuales de encabezado/pie.
- Orden: posiciones y páginas del mismo libro, sin duplicados; conservar `{id,file}` como contrato lógico de intercambio, no como ruta SQL.
- Recursos: book_id, clave interna de almacenamiento, src lógico, hash, tipo, tamaño y estado; bytes en almacenamiento privado persistente.
- Revisiones: instantáneas de página y estado del libro, autor/fecha/versión y referencias a recursos; restauración crea una nueva revisión.
Mantener JSON sin rediseñar cada bloque como tablas. Confirmar soporte y validación JSON de la versión real de MariaDB.

## 4. Seguridad y guardado

Autenticar y autorizar en PHP cada lectura/escritura, incluidas imágenes, revisiones e invitaciones; SQL parametrizado y mínimo privilegio.
Alta solo mediante invitación aceptada; hash de contraseña seguro, limitación de intentos y respuestas que no filtren datos sensibles.
Sesiones con HTTPS, cookies Secure/HttpOnly/SameSite, regeneración al autenticar, caducidad y cierre de sesión.
Proteger mutaciones con token CSRF ligado a sesión, incluida subida binaria, y comprobar origen; evitar CORS permisivo.
La extensión propuesta enviará versión esperada por cabecera, también en orden/configuración, y devolverá versión nueva en respuesta.
En transacción: comprobar autorización y versión, actualizar solo si coincide y registrar revisión; un guardado obsoleto devuelve 409 sin sobrescribir.
Bloquear/versionar el estado del libro para crear, duplicar, borrar y reordenar; verificar todas las páginas exactamente una vez y mantener al menos una.
Evitar carreras de IDs y referencias con coordinación por libro dentro de la transacción, además de restricciones SQL aplicables.
El cliente debe conservar borradores y ofrecer recarga/comparación ante conflicto; no prometer edición colaborativa en tiempo real.
Guardar global hoy guarda orden y después páginas individualmente (`src/hooks/usePageEditing.ts`); puede completar solo una parte.
Mantener resultado explícito por operación: confirmar solo éxitos, retener fallos y mostrar resumen; reintentar con versiones actualizadas, nunca repetir a ciegas.
Un futuro lote atómico sería un contrato nuevo; no presentar las solicitudes actuales como una única transacción.

## 5. Imágenes y respaldos

Preservar extensión/MIME/firma coherentes, límite de 10 MB, nombres internos aleatorios, escritura exclusiva y deduplicación SHA-256.
Subir una sustitución y cambiar su referencia; no sobrescribir bytes de una imagen usada por revisiones.
Almacenar originales, temporales y copias fuera del acceso público directo; servir bytes solo tras permiso sobre el libro.
Mantener validaciones contra traversal y enlaces, Content-Type correcto, nosniff y manejo seguro de SVG importado; no habilitar nuevas subidas SVG implícitamente.
Deduplicar dentro del libro para evitar filtraciones entre usuarios. Conservar referencias de borradores declaradas por el cliente sin confiar en ellas para autorizar.
Ampliar el análisis de uso para incluir revisiones recuperables: los respaldos actuales están excluidos y esa conducta no basta para recuperación completa.
La eliminación revalida hash, pertenencia y ausencia de referencias activas/recuperables; coordinarla con guardados del libro.
SQL no revierte archivos: preparar bytes privados, verificar su persistencia antes de referenciarlos y registrar estados/reintentos para limpieza de huérfanos.
No borrar un archivo tras un commit fallido sin comprobar otras referencias. Ensayar fallos entre escritura, commit y limpieza.
Definir retención y recuperación conjunta de base de datos y archivos; restaurar una página exige recuperar también sus recursos y referencias válidas.

## 6. Migración y pruebas propuestas

No ejecutadas. Mantener Node y JSON originales intactos; usar copias en un entorno aislado con almacenamiento y base propios.
1. Congelar contratos y preparar casos sintéticos de equivalencia. Aceptación: cubrir rutas, respuestas y reglas personalizadas con resultados esperados de Node.
2. Probar validación PHP y posible JSON Schema parcial, sin persistencia activa. Aceptación: mismo rechazo/aceptación y JSON normalizado que Node, incluidos extras y límites.
3. Crear persistencia privada e importar una copia del libro y recursos. Aceptación: IDs, orden, metadatos, bloques y hashes coinciden; original intacto y reimportación controlada sin duplicados.
4. Incorporar invitaciones, sesiones, permisos y lectura React en pruebas. Aceptación: dos usuarios/libros aislados, sin acceso cruzado ni recursos públicos.
5. Habilitar escrituras, versiones, imágenes y revisiones en la copia. Aceptación: contratos equivalentes, conflicto concurrente rechazado y recuperación con recursos íntegros.
6. Ensayar Guardar global, fallos parciales y corte definitivo. Aceptación: estados visibles correctos, reintentos seguros, copia recuperable y procedimiento de reversión probado.
Comparar respuestas y persistencia con casos válidos/inválidos de cada bloque, anidamiento, IDs duplicados, campos protegidos, referencias y borrado de última página.
Incluir pruebas de autorización/CSRF, carga binaria, deduplicación, fallos de disco/SQL, carreras de versión y orden/configuración, y revisión manual de impresión React.
Durante el corte, detener escrituras de Node, tomar copia final e importar/verificar antes de habilitar PHP; nunca ambos escribiendo sobre el mismo contenido activo.
La reversión debe preservar/exportar cambios nuevos de PHP y reconciliarlos antes de reabrir Node; no descartar trabajo posterior al corte.
Requisito futuro: importación/exportación autorizada de libro o páginas JSON y recursos con manifiesto, versiones y validación; sin acceso administrativo de Codex a MariaDB.
Codex preparará archivos de intercambio; el flujo validará permisos, IDs, recursos y conflictos antes de confirmar la importación. Este flujo es nuevo, no un endpoint actual.

## 7. Requisitos pendientes de confirmar

- Versiones disponibles de PHP y MariaDB y soporte efectivo de JSON/transacciones.
- Extensiones: PDO MySQL, fileinfo, mbstring y soporte JSON, hash y sesiones; disponibilidad de un validador JSON Schema compatible si se adopta.
- Límites de cuerpo/solicitud, memoria y tiempo de ejecución del servidor web/PHP para JSON, bytes binarios e importación.
- Ubicación, permisos, capacidad y persistencia del almacenamiento privado y sus copias de recuperación.
- Mecanismo y configuración para enviar invitaciones.
- Entorno de pruebas aislado con HTTPS, base y recursos separados.
