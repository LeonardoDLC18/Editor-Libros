# Editor local de libros de Computación y Robótica

Primera base funcional de un editor editorial en español. El libro se lee desde archivos JSON en esta carpeta y se muestra en páginas A4. Funciona localmente, sin cuentas, base de datos ni servicios en la nube.

**Estado: etapa 1.** Puedes seleccionar páginas y bloques, consultar propiedades, abrir la vista previa e imprimir. La edición de texto y el guardado desde el navegador se implementarán en la etapa 2. El botón **Guardar** informa de esta limitación; no simula un guardado.

## Requisitos

- Node.js 22.12 o superior, con npm. Comprueba la instalación con `node --version`. Si falta, instala una versión LTS desde [Node.js](https://nodejs.org/) y vuelve a abrir Visual Studio Code.
- Chrome o Edge de escritorio. Se recomienda una ventana de al menos 1100 píxeles de ancho para ver los tres paneles.
- Internet solo para la instalación de las dependencias. Después, el editor y sus recursos funcionan sin conexión.

## Iniciar en Windows

1. Abre esta carpeta en Visual Studio Code.
2. Ve a **Terminal → Nueva terminal**. Debe mostrar la ruta de esta carpeta.
3. Instala las dependencias:

   ```sh
   npm install
   ```

4. Inicia el editor:

   ```sh
   npm run dev
   ```

5. Deja esa terminal abierta y entra en **http://127.0.0.1:5173**. La terminal también muestra la dirección. No necesitas abrir dos terminales ni iniciar otro servidor.
6. Para detenerlo, vuelve a la terminal y pulsa **Ctrl+C**. Si Windows pide terminar el trabajo, responde `S`.

**Si PowerShell dice que `npm.ps1` está bloqueado**, utiliza `npm.cmd install` y `npm.cmd run dev`. También puedes elegir **Command Prompt / Símbolo del sistema** en el menú de terminales de VS Code y usar los comandos habituales. No hace falta cambiar la política de seguridad de Windows.

## Usar esta primera versión

- Selecciona la portada o la página conceptual en el panel **Páginas**.
- Haz clic sobre un párrafo, título, tarjeta o imagen para consultar sus propiedades. También puedes seleccionarlos con Tab y Enter.
- Cambia el zoom o usa **Ajustar** para que la página completa quepa en el lienzo.
- **Vista previa** oculta los paneles. Las flechas inferiores permiten recorrer las páginas; **Volver al editor** recupera los paneles.
- **Imprimir** abre el diálogo del navegador para todo el libro. Elige A4, escala 100 %, márgenes ninguno, gráficos de fondo activados y encabezados/pies del navegador desactivados. Puedes elegir «Guardar como PDF» en ese diálogo. La impresión de esta etapa es básica; su QA avanzado está pendiente.
- En pantallas estrechas se ocultan paneles; las flechas de página siguen disponibles. El uso principal es de escritorio.

## Comprobar el proyecto

```sh
npm run build
npm run validate
npm test
```

`build` comprueba TypeScript y genera la interfaz en `dist/`. `validate` comprueba los JSON, las referencias, los identificadores y los recursos; devuelve un código de error si encuentra problemas. `test` ejecuta pruebas del validador con copias temporales, sin modificar el contenido original.

Para probar la compilación: ejecuta `npm run build` y después `npm start`. Detén primero el servidor de desarrollo. Abre la misma dirección local. No abras `dist/index.html` con doble clic: el libro necesita el servidor Express para leer sus archivos.

En PowerShell también puedes usar `npm.cmd run build`, `npm.cmd run validate`, `npm.cmd test` y `npm.cmd start`.

## Dónde está cada cosa

| Ruta | Uso |
| --- | --- |
| `content/book.json` | Datos del libro, grado, unidades y orden de páginas. |
| `content/pages/*.json` | Una página por archivo, con sus bloques de contenido. |
| `content/design.json` | Colores, fuentes locales, medidas y estilos globales. |
| `assets/` | Imágenes e iconos locales. La portada procede del ZIP de referencia. |
| `diagrams/svg/` | Carpeta preparada para futuros diagramas. |
| `src/` | Interfaz React, plantillas y renderizador. |
| `server/` | Servidor Express y lector/validador del libro. |
| `scripts/` | Validación y pruebas. |
| `docs/` | Alcance, modelo de datos, diseño, hoja de ruta y estado real. |
| `reference/` | Referencias originales conservadas sin modificaciones. |

## Trabajar con una IA en Visual Studio Code

Pídele que lea `AGENTS.md`, `AI_WORKFLOW.md` y `docs/DATA_MODEL.md`. Por ejemplo: «Reescribe el párrafo introductorio de la página conceptual con palabras más sencillas. Conserva los identificadores y el diseño».

La IA debe modificar directamente `content/pages/`, guardar los archivos y ejecutar `npm run validate`. Para añadir páginas manualmente debe crear otro JSON y registrarlo en `content/book.json`. Los cambios globales de diseño se hacen en `content/design.json` solo cuando los solicites.

Después de guardar un cambio en VS Code, **recarga el navegador**. Esta etapa no detecta cambios externos automáticamente. El servidor vuelve a leer los archivos en cada carga. Todavía no hay guardado desde el navegador, gestión visual de páginas ni respaldos automáticos.

## Problemas habituales

- **Puerto ocupado:** detén la otra instancia con Ctrl+C. Para otro puerto en PowerShell, escribe `$env:PORT=5174` y luego `npm.cmd run dev`; abre la dirección que indique la terminal.
- **No se pudo abrir el libro:** corrige el archivo y campo indicados por el mensaje, ejecuta `npm run validate` y pulsa «Volver a cargar».
- **Imagen ausente:** comprueba que exista en `assets/` o `diagrams/`, y que la ruta relativa coincida, incluyendo mayúsculas. No se admiten URLs ni Base64.
- **Cambios que no aparecen:** guarda el JSON y recarga el navegador. Si modificas el servidor, reinícialo.
- **Contenido demasiado largo:** acorta el texto o distribúyelo en más páginas. La detección automática de desbordamientos pertenece a la etapa 6.

El resultado de las verificaciones de esta sesión está en [docs/STATUS.md](docs/STATUS.md).
