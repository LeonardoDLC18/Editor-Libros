import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadBook, projectRoot, ContentError } from '../server/content';
import { savePage } from '../server/savePage';
import { uploadImage, maxImageBytes } from '../server/uploadImage';
import { duplicatePage } from '../server/managePages';
import { blockSchema, type Block } from '../src/types/schema';
import { writeTestBook } from './testBook';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=', 'base64');
const program = 'Algoritmo MiPrograma\n    Definir edad Como Entero\n    Escribir "Ingresa tu edad:"\n    Leer edad\n\n    Si edad >= 18 Entonces\n        Escribir "Mayor de edad"\n    SiNo\n        Escribir "Menor de edad"\n    FinSi\nFinAlgoritmo\n';
const table: Block = { id: 'table-prueba', type: 'table', title: 'Datos', columns: ['Nombre', 'Valor'], rows: [['Sensor', '10'], ['', '  espacios  ']] };
const code: Block = { id: 'code-prueba', type: 'code', language: 'pseint', content: program };

async function fixture(run: (root: string) => Promise<void>) {
  const base = path.join(projectRoot, '.tmp');
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'blocks-'));
  try { await writeTestBook(root); await run(root); }
  finally {
    const relative = path.relative(base, root);
    if (!relative.startsWith('blocks-') || relative.includes(path.sep)) throw new Error('Limpieza fuera de la carpeta de prueba.');
    await rm(root, { recursive: true, force: true });
  }
}

test('Subir imágenes crea nombres únicos y bytes persistentes dentro de assets/images', () => fixture(async root => {
  const results = await Promise.all([uploadImage('../../imagen.PNG', 'image/png', png, root), uploadImage('imagen.PNG', 'image/png', png, root)]);
  assert.notEqual(results[0].src, results[1].src);
  for (const { src } of results) {
    assert.match(src, /^assets\/images\/imagen-[a-f0-9-]+\.png$/);
    assert.deepEqual(await readFile(path.join(root, src)), png);
  }
}));

test('Subida rechaza extensión, MIME, firma, vacío y tamaño sin crear archivos', () => fixture(async root => {
  const before = await readdir(path.join(root, 'assets/images'));
  for (const [name, mime, bytes] of [
    ['x.svg', 'image/svg+xml', png], ['x.jpg', 'image/jpeg', png], ['x.png', 'text/html', png],
    ['x.png', 'image/png', Buffer.from('<script>alert(1)</script>')], ['x.png', 'image/png', Buffer.alloc(0)],
    ['x.png', 'image/png', Buffer.alloc(maxImageBytes + 1)], ['x.png', 'image/png', png.subarray(0, 20)],
  ] as const) await assert.rejects(uploadImage(name, mime, bytes, root));
  assert.deepEqual(await readdir(path.join(root, 'assets/images')), before);
}));

test('Subida rechaza una carpeta images enlazada a otro destino', () => fixture(async root => {
  const target = path.join(root, 'otro-destino');
  await mkdir(target);
  const images = path.join(root, 'assets/images');
  await rm(path.join(images, 'fixture.svg'));
  await rm(images, { recursive: true });
  await symlink(target, images, 'junction');
  await assert.rejects(uploadImage('x.png', 'image/png', png, root), /sin enlaces/);
  assert.deepEqual(await readdir(target), []);
}));

test('Guardar nuevos bloques conserva textos, extras, otras páginas, índice y respaldo exacto', () => fixture(async root => {
  const data = await loadBook(root), page = data.pages[1];
  const file = path.join(root, 'content', data.book.pageOrder[1].file);
  page.blocks[0].nota = { conservar: true };
  await writeFile(file, JSON.stringify(page));
  const before = await readFile(file, 'utf8');
  const bookBefore = await readFile(path.join(root, 'content/book.json'), 'utf8');
  const otherBefore = await readFile(path.join(root, 'content', data.book.pageOrder[0].file), 'utf8');
  const { src } = await uploadImage('x.png', 'image/png', png, root);
  const image: Block = { id: 'image-prueba', type: 'image', src, alt: 'Prueba', fit: 'contain', heightMm: 35, widthPercent: 80, caption: 'Pie' };
  const next = { ...page, blocks: [...page.blocks, image, table, code] };
  assert.deepEqual(await savePage(page.id, next, root), next);
  assert.deepEqual((await loadBook(root)).pages[1], next);
  const backups = await readdir(path.join(root, 'content/backups'));
  assert.equal(await readFile(path.join(root, 'content/backups', backups[0]), 'utf8'), before);
  assert.equal(await readFile(path.join(root, 'content/book.json'), 'utf8'), bookBefore);
  assert.equal(await readFile(path.join(root, 'content', data.book.pageOrder[0].file), 'utf8'), otherBefore);
  const copy = await duplicatePage(page.id, root);
  assert.deepEqual(copy.pages[2].blocks.map(({ id: _id, ...rest }) => rest), next.blocks.map(({ id: _id, ...rest }) => rest));
}));

test('Reemplazar, mover, eliminar y restaurar bloques no elimina archivos compartidos', () => fixture(async root => {
  const original = (await loadBook(root)).pages[0];
  const first = original.blocks[0];
  assert.equal(first.type, 'image');
  const { src } = await uploadImage('x.png', 'image/png', png, root);
  const next = { ...original, blocks: [original.blocks[1], { ...first, src, caption: 'Nuevo pie', widthPercent: 65, fit: 'cover' as const }] };
  await savePage(original.id, next, root);
  await savePage(original.id, { ...next, blocks: [next.blocks[1]] }, root);
  await savePage(original.id, next, root); // Undo a saved deletion of a text block.
  await savePage(original.id, original, root); // Remove new optional fields too.
  assert.deepEqual((await loadBook(root)).pages[0], original);
  assert.deepEqual(await readFile(path.join(root, src)), png);
  assert.ok(await readFile(path.join(root, 'assets/images/fixture.svg')));
}));

test('Guardado rechaza ids duplicados y recursos inexistentes antes del respaldo', () => fixture(async root => {
  const data = await loadBook(root), page = data.pages[1];
  for (const block of [
    { ...table, id: data.pages[0].blocks[0].id }, { ...table, id: page.blocks[0].id },
    { ...data.pages[0].blocks[0], id: 'image-nueva', src: 'assets/images/ausente.png' },
    { ...data.pages[0].blocks[0], id: 'image-nueva', src: '../fuera.png' },
  ]) await assert.rejects(savePage(page.id, { ...page, blocks: [...page.blocks, block] }, root));
  assert.deepEqual(await loadBook(root), data);
  await assert.rejects(readdir(path.join(root, 'content/backups')), { code: 'ENOENT' });
}));

test('Tablas inválidas y código no textual fallan en guardado y lector compartido', () => fixture(async root => {
  const data = await loadBook(root), page = data.pages[1];
  const file = path.join(root, 'content', data.book.pageOrder[1].file);
  const before = await readFile(file);
  for (const block of [
    { ...table, columns: [] }, { ...table, rows: [['Falta celda']] }, { ...table, rows: [[1, 'x']] },
    { ...code, content: null }, { ...code, content: 123 }, { ...code, language: 'ejecutable' }, { ...code, type: 'script' },
  ]) {
    await assert.rejects(savePage(page.id, { ...page, blocks: [...page.blocks, block] }, root));
    assert.deepEqual(await readFile(file), before);
    await writeFile(file, JSON.stringify({ ...page, blocks: [...page.blocks, block] }));
    await assert.rejects(loadBook(root), ContentError);
    await writeFile(file, before);
  }
}));

test('Código conserva exactamente indentación, saltos, HTML literal y todos los lenguajes', () => {
  for (const language of ['pseint', 'arduino', 'python', 'html', 'css', 'javascript', 'excel', 'text']) {
    const content = `\n  ${program}\t<script>window.ejecutado = true</script>\n  `;
    assert.equal(blockSchema.parse({ ...code, language, content }).content, content);
  }
});

test('Compatibilidad de imágenes antiguas y límites de ancho', () => {
  const image = { id: 'image-prueba', type: 'image', src: 'assets/images/x.png', alt: 'Prueba', heightMm: 30, fit: 'contain' };
  assert.deepEqual(blockSchema.parse(image), image);
  for (const widthPercent of [0, 101, '50']) assert.equal(blockSchema.safeParse({ ...image, widthPercent }).success, false);
});
