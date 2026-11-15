# Etapa 1A: referencias de validación Node

Ejecutar desde la raíz, con las herramientas ya instaladas:

- Verificar: `node --import tsx --test tests/migration/validation.test.ts`
- Generar/actualizar explícitamente: `node --import tsx tests/migration/generate.ts --update`

La verificación nunca escribe references.json. Falta de referencia, cambio de entrada,
contexto, resultado normalizado, error o persistencia hace fallar la comparación.
Revisar cualquier regeneración: no utilizarla para ocultar cambios de comportamiento.
references.json contiene entradas/contextos y resultados observados, no expectativas manuales.

Se importan pageSchema.safeParse, loadBook y savePage reales; no index.ts ni endpoints.
Cada llamada contextual usa root explícito en un directorio nuevo .tmp/migration-validation-*;
se elimina únicamente ese directorio, tras comprobar su ubicación. No se leen datos reales.
El diseño y SVG se inventan aquí; no se utiliza scripts/testBook.ts porque copia datos reales.
savePage escribe y respalda únicamente la página sintética: se comprueba persistencia en
aceptación y ausencia de cambios/respaldos en rechazo. Nombres aleatorios de respaldo y
rutas temporales no se incorporan a referencias; sí se conserva su contenido.
Errores Zod registran path/code/message. ContentError solo expone issues de texto;
SaveError solo se registra por clase/mensaje, sin atribuir respuestas HTTP.
Errores inesperados de infraestructura abortan: no se convierten en rechazos esperados.

Cobertura inicial acotada: los doce grupos pedidos, con variantes positivas/negativas
de tablas, profundidad y grid; IDs en contexto real de libro y guardado; edición protegida.
Pendiente para etapas posteriores: contratos HTTP, resto de bloques/reglas y casos de
archivos hostiles/concurrencia. No se prueba PHP, hosting, autenticación ni equivalencia PHP.

## Etapa 1B: contratos HTTP reales

- Verificar HTTP y 1A: `node --import tsx --test tests/migration/http.test.ts tests/migration/validation.test.ts`
- Solo HTTP: `node --import tsx --test tests/migration/http.test.ts`
- Generar/actualizar únicamente referencias HTTP: `node --import tsx tests/migration/generate-http.ts --update`
- Comprobación TypeScript del proyecto: `node node_modules/typescript/bin/tsc --noEmit`

`server/app.ts` extrae las mismas rutas/middleware en `createApp(root = projectRoot)`;
`server/index.ts` conserva el arranque, puerto, frontend y raíz predeterminados.
No se importa index.ts en pruebas: no se inicia Vite ni se utiliza dist o el servidor habitual.
Cada uno de ocho grupos inicia su propio listener en 127.0.0.1 con puerto 0 (asignación
del sistema) y almacenamiento nuevo `migration-http-*` dentro de os.tmpdir().
El contexto inventado se reutiliza en memoria desde 1A, sin cambiar sus casos/referencias.
Todas las operaciones reciben root explícito; antes de cada petición y limpieza se
comprueban pertenencia y realpath. finally cierra conexiones/listener y elimina solo
su directorio, también si falla una aserción. No hay escrituras al libro real.

Cobertura: lectura/orden; guardado/persistencia/respaldo/rechazo sin escritura;
creación/duplicación/eliminación y última página; orden/numeración y entradas inválidas;
subida binaria PNG con MIME/X-File-Name, deduplicación y MIME incorrecto; análisis/borrado
con referencias guardadas y de borradores; GET/HEAD de assets/diagrams y traversal;
JSON malformado, rutas/páginas/recursos ausentes, validación, origen y media type.
Los efectos en disco se verifican además de las respuestas; se comprueban IDs únicos y
las referencias de orden, selección y duplicación, no solo códigos satisfactorios.

`http-references.json` registra 36 intercambios observados: método, ruta, entrada,
status, Content-Type y cuerpo. Solo se reemplaza el UUID variable del nombre de imagen;
se comprueban antes el formato, bytes y deduplicación. No se registran cabeceras variables
Date/ETag ni puerto. Verificar nunca actualiza expectativas ni las referencias de 1A.
La generación ejecuta las mismas aserciones y solo escribe al completarse todos los grupos.
Un fallo inesperado aborta; no se almacena como un resultado esperado.

Ejecución inicial: recursos fallaron 404 al ubicar la copia en .tmp, porque sendFile
rechaza carpetas ocultas. Se corrigió solo la ubicación de la fixture a os.tmpdir(),
conservando esa protección. No se observaron discrepancias con el contrato documentado
en los casos finales. No se cambió una respuesta del servidor para pasar las pruebas.
Pendientes fuera de esta cobertura acotada: límites 413, errores internos 500, restantes
variantes de archivos/validación y método 405. Sin rendimiento, concurrencia ni interfaz.
Las pruebas generales existentes y validate no se ejecutan aquí: sus helpers/CLI leen
archivos del libro real; esta etapa exige que toda lectura de contenido sea sintética.
Ante `uv_os_get_passwd ENOMEM` de tsx en un sandbox, ejecutar localmente los mismos
comandos; nunca sustituir la raíz temporal por el libro real.
