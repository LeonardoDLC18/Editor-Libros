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
import { formatStep, editStepText, stepText } from '../src/utils/steps';
import { fieldSpans, withFieldSpans } from '../src/utils/richText';
import { cloneBlock } from '../src/utils/blocks';
import { analyzeImages, deleteUnusedImages } from '../server/imageAssets';

test('Formato inline divide, combina, quita y fusiona marcas sin perder texto', () => {
  const plain = [{ text: 'Microsoft Excel permite calcular' }];
  const bold = formatStep(plain, 10, 15, 'bold');
  assert.deepEqual(bold, [{ text: 'Microsoft ' }, { text: 'Excel', bold: true }, { text: ' permite calcular' }]);
  const combined = formatStep(formatStep(bold, 10, 15, 'italic'), 10, 15, 'highlight');
  assert.deepEqual(combined[1], { text: 'Excel', bold: true, italic: true, highlight: true });
  const noBold = formatStep(combined, 10, 15, 'bold');
  assert.equal(noBold[1].bold, undefined);
  assert.equal(noBold[1].italic, true);
  assert.equal(noBold[1].highlight, true);
  assert.equal(stepText(combined), stepText(plain));
  assert.deepEqual(formatStep(bold, 10, 15, 'bold'), plain);
  assert.equal(stepText(editStepText(combined, 'Microsoft ExXcel permite calcular')), 'Microsoft ExXcel permite calcular');
  assert.deepEqual(withFieldSpans({ text: stepText(plain) }, 'text', plain), { text: stepText(plain) });
});

test('Formato inline persiste por campo y celda, conserva Pasos y admite quitar marcas', () => fixture(async root => {
  const data = await loadBook(root), source = data.pages[1];
  const spans = formatStep([{ text: 'Microsoft Excel' }], 10, 15, 'bold');
  const paragraph: Block = withFieldSpans({ id: 'rich-paragraph', type: 'paragraph', text: 'Microsoft Excel' }, 'text', spans);
  const table: Block = withFieldSpans({ id: 'rich-table', type: 'table', columns: ['Nombre'], rows: [['Microsoft Excel']] }, 'rows/0/0', spans);
  const steps: Block = { id: 'rich-steps', type: 'steps', items: [{ id: 'rich-step', content: [{ text: 'Insertar', highlight: true }] }] };
  const card: Block = withFieldSpans({ id: 'rich-cards', type: 'cardContainer', title: 'Tarjetas', variant: 'info', columns: 2,
    items: [{ id: 'rich-a', title: 'Uno', description: 'Microsoft Excel' }, { id: 'rich-b', title: 'Dos', description: 'Texto' }] }, 'items/rich-a/description', spans);
  const saved = await savePage(source.id, { ...source, blocks: [paragraph, table, steps, card] }, root);
  const reloaded = (await loadBook(root)).pages.find(page => page.id === source.id)!;
  assert.deepEqual(reloaded.blocks, saved.blocks);
  assert.deepEqual(fieldSpans(reloaded.blocks[0], 'text', 'Microsoft Excel'), spans);
  assert.deepEqual(reloaded.blocks[2], steps);
  const cloned = cloneBlock(card);
  assert.equal(cloned.type, 'cardContainer');
  if (cloned.type !== 'cardContainer') throw new Error('Tipo de tarjeta');
  assert.deepEqual(fieldSpans(cloned, `items/${cloned.items[0].id}/description`, 'Microsoft Excel'), spans);
  const duplicate = await duplicatePage(source.id, root);
  const copiedCard = duplicate.pages.find(page => page.id === duplicate.selectedId)!.blocks[3];
  if (copiedCard.type !== 'cardContainer') throw new Error('Tipo duplicado');
  assert.deepEqual(fieldSpans(copiedCard, `items/${copiedCard.items[0].id}/description`, 'Microsoft Excel'), spans);
  const cleared = withFieldSpans(reloaded.blocks[0], 'text', [{ text: 'Microsoft Excel' }]);
  await savePage(source.id, { ...reloaded, blocks: [cleared, ...reloaded.blocks.slice(1)] }, root);
  assert.equal((await loadBook(root)).pages.find(page => page.id === source.id)!.blocks[0].richText, undefined);
  assert.equal(blockSchema.safeParse({ ...paragraph, richText: { text: [{ text: 'Excel', html: '<b>Excel</b>' }] } }).success, false);
}));

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

test('A/B: Subidas simultáneas y bytes de pegado idénticos reutilizan una sola imagen', () => fixture(async root => {
  const before = await readdir(path.join(root, 'assets/images'));
  const results = await Promise.all([uploadImage('../../imagen.PNG', 'image/png', png, root), uploadImage('imagen.PNG', 'image/png', png, root)]);
  assert.equal(results[0].src, results[1].src);
  assert.equal((await uploadImage('imagen.png', 'image/png', png, root)).src, results[0].src);
  assert.equal((await readdir(path.join(root, 'assets/images'))).length, before.length + 1);
  for (const { src } of results) {
    assert.match(src, /^assets\/images\/imagen-[a-f0-9-]+\.png$/);
    assert.deepEqual(await readFile(path.join(root, src)), png);
  }
}));

test('A: Deduplicar conserva el nombre de una imagen previa, incluso en subcarpetas', () => fixture(async root => {
  await mkdir(path.join(root, 'assets/images/curso'));
  await writeFile(path.join(root, 'assets/images/curso/excel.png'), png);
  assert.equal((await uploadImage('otra.png', 'image/png', png, root)).src, 'assets/images/curso/excel.png');
}));

test('C–G: Bloques compartidos y anidados conservan el asset hasta retirar su última referencia', () => fixture(async root => {
  const { src } = await uploadImage('x.png', 'image/png', png, root);
  const data = await loadBook(root), first = data.pages[0], second = data.pages[1];
  const image: Block = { id: 'shared-image', type: 'image', src, alt: 'Compartida', heightMm: 30, fit: 'contain' };
  const copy = cloneBlock(image);
  assert.equal(copy.type === 'image' && copy.src, src);
  await savePage(first.id, { ...first, blocks: [image, copy] }, root);
  const nested: Block = { id: 'shared-frame', type: 'framedColumns', title: 'Marco', layout: '1-full', columns: [], rows: [{ id: 'shared-row', layout: '1-full', cells: [{ id: 'shared-cell', column: 0, blocks: [{ id: 'shared-text-image', type: 'textImage', text: 'Texto', layout: 'image-left', imageWidth: 40, fit: 'contain', image: { src, alt: 'Anidada' } }] }] }] };
  await savePage(second.id, { ...second, blocks: [nested] }, root);
  assert.equal((await analyzeImages({}, root)).unused.some(item => item.src === src), false);
  await savePage(first.id, { ...first, blocks: [] }, root);
  assert.equal((await analyzeImages({}, root)).unused.some(item => item.src === src), false);
  await savePage(second.id, { ...second, blocks: [] }, root);
  const unused = (await analyzeImages({}, root)).unused;
  assert.ok(unused.some(item => item.src === src)); // Historical backups do not protect the image.
  const result = await deleteUnusedImages({ selected: unused.filter(item => item.src === src) }, root);
  assert.deepEqual(result.deleted, [src]);
  await assert.rejects(readFile(path.join(root, src)), { code: 'ENOENT' });
}));

test('G: Limpieza revalida referencias, recursos globales, borradores y bytes revisados', () => fixture(async root => {
  const { src } = await uploadImage('x.png', 'image/png', png, root);
  const reviewed = (await analyzeImages({}, root)).unused.find(item => item.src === src)!;
  const page = (await loadBook(root)).pages[1];
  await savePage(page.id, { ...page, blocks: [{ id: 'new-use', type: 'image', src, alt: 'Uso posterior', fit: 'contain', heightMm: 30 }] }, root);
  assert.deepEqual((await deleteUnusedImages({ selected: [reviewed] }, root)).skipped, [src]);
  await savePage(page.id, { ...page, blocks: [] }, root);
  assert.deepEqual((await deleteUnusedImages({ selected: [reviewed], references: [src] }, root)).skipped, [src]);
  assert.equal((await analyzeImages({ references: [src] }, root)).unused.some(item => item.src === src), false);
  await writeFile(path.join(root, src), Buffer.concat([png, Buffer.from('nuevo archivo')]));
  assert.deepEqual((await deleteUnusedImages({ selected: [reviewed] }, root)).skipped, [src]);
  const preset = { src: 'assets/images/preset-image.svg', hash: '0'.repeat(64) };
  assert.deepEqual((await deleteUnusedImages({ selected: [preset] }, root)).skipped, [preset.src]);
  const designPath = path.join(root, 'content/design.json');
  const design = JSON.parse(await readFile(designPath, 'utf8'));
  await writeFile(designPath, JSON.stringify({ ...design, globalImage: src }));
  await assert.rejects(analyzeImages({}, root)); // Unknown design fields fail closed as well.
}));

test('G/H: Rutas externas, traversal, directorios y enlaces nunca se eliminan; JSON ilegible bloquea la limpieza', () => fixture(async root => {
  const { src } = await uploadImage('x.png', 'image/png', png, root);
  const reviewed = (await analyzeImages({}, root)).unused.find(item => item.src === src)!;
  const outside = path.join(root, 'assets/outside.png');
  await writeFile(outside, png);
  await mkdir(path.join(root, 'assets/images/directory.png'));
  for (const invalid of ['assets/outside.png', '../outside.png', 'assets/images/../outside.png', 'assets/images/../../content/book.json', outside, 'assets\\images\\x.png']) {
    await assert.rejects(deleteUnusedImages({ selected: [{ ...reviewed, src: invalid }] }, root));
  }
  assert.deepEqual(await readFile(outside), png);
  assert.deepEqual((await deleteUnusedImages({ selected: [{ ...reviewed, src: 'assets/images/directory.png' }] }, root)).deleted, []);
  const target = path.join(root, 'assets/other-images');
  await mkdir(target); await writeFile(path.join(target, 'linked.png'), png);
  await symlink(target, path.join(root, 'assets/images/linked'), 'junction');
  assert.equal((await analyzeImages({}, root)).unused.some(item => item.src.includes('/linked/')), false);
  assert.deepEqual((await deleteUnusedImages({ selected: [{ ...reviewed, src: 'assets/images/linked/linked.png' }] }, root)).deleted, []);
  assert.deepEqual(await readFile(path.join(target, 'linked.png')), png);
  await writeFile(path.join(root, 'content/pages/broken.json'), '{');
  await assert.rejects(deleteUnusedImages({ selected: [reviewed] }, root));
  assert.deepEqual(await readFile(path.join(root, src)), png);
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
