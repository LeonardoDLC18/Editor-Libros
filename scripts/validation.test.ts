import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadBook, projectRoot, ContentError } from '../server/content';
import { writeTestBook } from './testBook';

async function fixture(run: (root: string) => Promise<void>) {
  const base = path.join(projectRoot, '.tmp');
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'validation-'));
  try {
    await writeTestBook(root);
    await run(root);
  } finally {
    const rel = path.relative(base, root);
    if (!rel.startsWith('validation-') || rel.includes(path.sep)) throw new Error('Ruta de limpieza inesperada.');
    await rm(root, { recursive: true, force: true });
  }
}

async function edit(root: string, file: string, mutate: (data: any) => void) {
  const target = path.join(root, 'content', file);
  const data = JSON.parse(await readFile(target, 'utf8'));
  mutate(data);
  await writeFile(target, JSON.stringify(data), 'utf8');
}
async function rejects(root: string, pattern: RegExp) {
  await assert.rejects(loadBook(root), (error: unknown) => error instanceof ContentError && pattern.test(error.issues.join('\n')));
}

test('El libro se carga en el orden declarado', () => fixture(async (root) => {
  const data = await loadBook(root);
  assert.deepEqual(data.pages.map((page) => page.id), data.book.pageOrder.map((entry) => entry.id));
  assert.deepEqual(data.pages.map((page) => page.template), ['cover', 'lesson']);
}));

for (const filename of ['book.json', 'design.json']) {
  test(`Rechaza la ausencia de ${filename}`, () => fixture(async (root) => {
    await rm(path.join(root, 'content', filename));
    await rejects(root, /El archivo no existe/);
  }));
}
test('Rechaza JSON mal formado incluso en una página fuera de pageOrder', () => fixture(async (root) => {
  await writeFile(path.join(root, 'content/pages/extra.json'), '{"id":');
  await rejects(root, /JSON inválido/);
}));
test('Rechaza archivos inexistentes en pageOrder', () => fixture(async (root) => {
  await edit(root, 'book.json', (book) => { book.pageOrder[0].file = 'pages/ausente.json'; });
  await rejects(root, /falta el archivo.*ausente/);
}));
test('Rechaza páginas válidas no referenciadas', () => fixture(async (root) => {
  await edit(root, 'book.json', (book) => { book.pageOrder.pop(); });
  await rejects(root, /agrega esta página a pageOrder/);
}));
test('Rechaza un libro sin páginas y plantillas desconocidas', () => fixture(async (root) => {
  await edit(root, 'book.json', (book) => { book.pageOrder = []; });
  await edit(root, 'pages/page-002-concepto.json', (page) => { page.template = 'unknown'; });
  await rejects(root, /al menos una página/);
  await rejects(root, /Plantilla desconocida/);
}));
test('Rechaza identificadores de página duplicados', () => fixture(async (root) => {
  await edit(root, 'pages/page-002-concepto.json', (page) => { page.id = 'page-001-portada'; });
  await rejects(root, /identificador de página duplicado/);
}));
test('Rechaza identificadores de bloque duplicados entre páginas', () => fixture(async (root) => {
  await edit(root, 'pages/page-002-concepto.json', (page) => { page.blocks[0].id = 'cover-image'; });
  await rejects(root, /identificador de bloque duplicado/);
}));
for (const field of ['page', 'block']) {
  test(`Rechaza un id ausente en ${field}`, () => fixture(async (root) => {
    await edit(root, 'pages/page-002-concepto.json', (page) => { delete (field === 'page' ? page : page.blocks[0]).id; });
    await rejects(root, /id:/);
  }));
}
test('Rechaza bloques no implementados', () => fixture(async (root) => {
  await edit(root, 'pages/page-002-concepto.json', (page) => { page.blocks[0].type = 'unknown'; });
  await rejects(root, /Tipo de bloque desconocido/);
}));
test('Rechaza referencias a imágenes inexistentes', () => fixture(async (root) => {
  await edit(root, 'pages/page-001-portada.json', (page) => { page.blocks[0].src = 'assets/images/ausente.png'; });
  await rejects(root, /recurso inexistente/);
}));
test('Rechaza rutas que saldrían de content/', () => fixture(async (root) => {
  await edit(root, 'book.json', (book) => { book.pageOrder[0].file = '../fuera.json'; });
  await rejects(root, /pages\/nombre-de-pagina/);
}));
test('Rechaza imágenes remotas y Base64', () => fixture(async (root) => {
  for (const src of ['https://ejemplo.com/imagen.png', 'data:image/png;base64,abc']) {
    await edit(root, 'pages/page-001-portada.json', (page) => { page.blocks[0].src = src; });
    await rejects(root, /ruta relativa/);
  }
}));
test('La CLI devuelve código 1 y un mensaje comprensible cuando hay errores', () => fixture(async (root) => {
  for (const file of ['scripts/validate.ts', 'server/content.ts', 'src/types/schema.ts', 'src/utils/codeLanguages.ts', 'src/utils/blocks.ts', 'src/utils/grid.ts']) {
    const destination = path.join(root, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(path.join(projectRoot, file), destination);
  }
  const entry = path.join(root, 'scripts/validate.ts');
  await edit(root, 'pages/page-002-concepto.json', (page) => { page.blocks[0].type = 'unknown'; });
  const result = spawnSync(process.execPath, ['--import', 'tsx', entry], { cwd: projectRoot, encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /Tipo de bloque desconocido/);
}));
