import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadBook, projectRoot } from '../server/content';
import { createPage, deletePage, duplicatePage, reorderPages } from '../server/managePages';
import { savePage } from '../server/savePage';
import { changeTemplate } from '../src/utils/pageTemplate';
import { identifiedItems } from '../src/utils/blocks';
import { writeTestBook } from './testBook';

async function fixture(run: (root: string) => Promise<void>) {
  const base = path.join(projectRoot, '.tmp');
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'pages-'));
  try {
    await writeTestBook(root);
    await run(root);
  } finally {
    const relative = path.relative(base, root);
    if (!relative.startsWith('pages-') || relative.includes(path.sep)) throw new Error('Limpieza fuera de la carpeta de prueba.');
    await rm(root, { recursive: true, force: true });
  }
}
const source = (root: string, file = 'book.json') => readFile(path.join(root, 'content', file), 'utf8');
async function backups(root: string) {
  const folder = path.join(root, 'content/backups');
  const names = await readdir(folder).catch(() => [] as string[]);
  return Promise.all(names.map(name => readFile(path.join(folder, name), 'utf8')));
}

test('Crear ambas plantillas en paralelo genera archivos e ids únicos y respalda cada índice anterior', () => fixture(async root => {
  const before = await source(root);
  const [lesson, cover] = await Promise.all([createPage({ template: 'lesson' }, root), createPage({ template: 'cover' }, root)]);
  const data = await loadBook(root);
  assert.equal(data.pages.length, 4);
  assert.notEqual(lesson.selectedId, cover.selectedId);
  assert.equal(data.pages[2].template, 'lesson'); assert.equal(data.pages[3].template, 'cover');
  assert.ok(data.pages[2].theme); assert.equal(data.pages[3].subtitle, 'Escribe aquí una breve descripción del contenido.');
  assert.equal(new Set(data.pages.flatMap(page => page.blocks.map(block => block.id))).size, data.pages.reduce((n, page) => n + page.blocks.length, 0));
  assert.ok((await backups(root)).includes(before));
  assert.equal((await backups(root)).length, 2);
}));

test('Una portada nueva usa bloques editables y no cambia las plantillas conceptual o en blanco', () => fixture(async root => {
  const coverResult = await createPage({ template: 'cover' }, root);
  const cover = coverResult.pages.find(page => page.id === coverResult.selectedId)!;
  assert.equal(cover.title, 'Título de la unidad');
  assert.equal(cover.subtitle, 'Escribe aquí una breve descripción del contenido.');
  assert.deepEqual(cover.blocks.map(block => block.type), ['image', 'framedColumns']);
  assert.equal(cover.blocks[0].type === 'image' && cover.blocks[0].src, 'assets/images/preset-image.svg');
  const featured = cover.blocks[1];
  assert.equal(featured.type, 'framedColumns');
  if (featured.type !== 'framedColumns') throw new Error('Se esperaba el contenedor inferior de la portada.');
  assert.equal(featured.layout, '2-60-40');
  assert.deepEqual(featured.columns.map(column => column.blocks[0]?.type), ['infoCard', 'image']);
  assert.equal(new Set(identifiedItems(cover.blocks).map(item => item.id)).size, identifiedItems(cover.blocks).length);
  const editedCover = structuredClone(cover);
  editedCover.title = 'Unidad editable'; editedCover.subtitle = 'Descripción editable';
  const editedFeatured = editedCover.blocks[1];
  if (editedFeatured.type !== 'framedColumns') throw new Error('Se esperaba el contenedor editable de la portada.');
  const objective = editedFeatured.columns[0].blocks[0], resource = editedFeatured.columns[1].blocks[0];
  if (objective.type !== 'infoCard' || resource.type !== 'image') throw new Error('Se esperaban objetivo e imagen editables.');
  objective.content = 'Objetivo editable.'; resource.src = 'assets/images/fixture.svg'; resource.alt = 'Recurso reemplazado';
  const savedCover = await savePage(cover.id, editedCover, root);
  assert.equal(savedCover.title, 'Unidad editable'); assert.equal(savedCover.subtitle, 'Descripción editable');
  assert.equal(objective.content, 'Objetivo editable.'); assert.equal(resource.src, 'assets/images/fixture.svg');

  const lessonResult = await createPage({ template: 'lesson' }, root);
  const lesson = lessonResult.pages.find(page => page.id === lessonResult.selectedId)!;
  assert.equal(lesson.title, 'Nueva página');
  assert.equal(lesson.subtitle, '');
  assert.deepEqual(lesson.blocks.map(block => block.type), ['heading', 'paragraph']);
  assert.deepEqual(lesson.blocks.map(block => block.type === 'heading' || block.type === 'paragraph' ? block.text : ''), ['Nueva página', 'Escribe aquí el contenido.']);

  const blankResult = await createPage({ template: 'blank' }, root);
  const blank = blankResult.pages.find(page => page.id === blankResult.selectedId)!;
  assert.equal(blank.title, ''); assert.equal(blank.subtitle, ''); assert.deepEqual(blank.blocks, []);
}));

test('Duplicar conserva datos completos, cambia todos los ids e inserta inmediatamente después', () => fixture(async root => {
  const initial = await loadBook(root);
  const original = initial.pages[0];
  // Unknown authored data remains present, including on image blocks.
  original.blocks[0].nota = { conservar: true };
  await writeFile(path.join(root, 'content', initial.book.pageOrder[0].file), JSON.stringify(original));
  const originalBytes = await source(root, initial.book.pageOrder[0].file);
  const result = await duplicatePage(original.id, root);
  const copied = result.pages[1];
  assert.equal(copied.id, result.selectedId); assert.notEqual(copied.id, original.id);
  assert.equal(copied.title, `Copia de ${original.title}`);
  for (let i = 0; i < copied.blocks.length; i++) {
    assert.notEqual(copied.blocks[i].id, original.blocks[i].id);
    assert.deepEqual({ ...copied.blocks[i], id: original.blocks[i].id }, original.blocks[i]);
  }
  assert.equal(await source(root, initial.book.pageOrder[0].file), originalBytes);
  await loadBook(root);
}));

test('Mover solo escribe book.json, respalda el orden y permite restaurarlo', () => fixture(async root => {
  const data = await loadBook(root);
  const ids = data.pages.map(page => page.id);
  const before = await source(root);
  const files = await Promise.all(data.book.pageOrder.map(entry => source(root, entry.file)));
  await reorderPages({ pageOrder: [...ids].reverse() }, root);
  assert.deepEqual((await loadBook(root)).pages.map(page => page.id), [...ids].reverse());
  assert.deepEqual(await Promise.all(data.book.pageOrder.map(entry => source(root, entry.file))), files);
  assert.ok((await backups(root)).includes(before));
  await reorderPages({ pageOrder: ids }, root);
  assert.deepEqual((await loadBook(root)).pages.map(page => page.id), ids);
}));

test('Título y plantilla se guardan sin cambiar ids o bloques y admiten deshacer después de guardar', () => fixture(async root => {
  const initial = await loadBook(root);
  for (const original of initial.pages) {
    const updated = changeTemplate({ ...original, title: 'Título nuevo' }, original.template === 'cover' ? 'lesson' : 'cover');
    const saved = await savePage(original.id, updated, root);
    assert.equal(saved.id, original.id); assert.deepEqual(saved.blocks, original.blocks);
    assert.equal((await loadBook(root)).pages.find(page => page.id === original.id)?.template, updated.template);
    const restored = await savePage(original.id, original, root);
    assert.deepEqual(restored, original);
  }
}));

test('Eliminar conserva respaldos exactos, selecciona una página cercana y protege la última', () => fixture(async root => {
  const initial = await loadBook(root);
  const pageFile = initial.book.pageOrder[1].file;
  const bookBytes = await source(root), pageBytes = await source(root, pageFile);
  const result = await deletePage(initial.pages[1].id, root);
  assert.equal(result.selectedId, initial.pages[0].id);
  await assert.rejects(source(root, pageFile), { code: 'ENOENT' });
  assert.equal((await loadBook(root)).pages.length, 1);
  const copies = await backups(root);
  assert.ok(copies.includes(bookBytes)); assert.ok(copies.includes(pageBytes));
  await assert.rejects(deletePage(initial.pages[0].id, root), /al menos una página/);
  const created = await createPage({ template: 'lesson' }, root);
  assert.notEqual(created.selectedId, initial.pages[1].id);
}));

test('Datos inválidos, ids desconocidos y traversal no modifican el libro', () => fixture(async root => {
  const initial = await loadBook(root);
  const before = await source(root);
  for (const ids of [[], [initial.pages[0].id], [initial.pages[0].id, initial.pages[0].id], [initial.pages[0].id, 'ausente']]) {
    await assert.rejects(reorderPages({ pageOrder: ids }, root));
  }
  await assert.rejects(createPage({ template: 'table' }, root));
  await assert.rejects(createPage({ template: 'lesson', file: '../fuera.json' }, root));
  await assert.rejects(duplicatePage('../book', root), /identificador/);
  await assert.rejects(deletePage('%2e%2e', root), /identificador/);
  await assert.rejects(duplicatePage('ausente', root), /no existe/);
  await assert.rejects(savePage(initial.pages[0].id, { ...initial.pages[0], metadata: { ...initial.pages[0].metadata, description: 'Pérdida de datos' } }, root), /Conserva los demás/);
  assert.equal(await source(root), before); assert.deepEqual(await backups(root), []);
  await loadBook(root);
}));

test('Un respaldo imposible detiene crear, duplicar, eliminar y mover sin cambiar contenido', () => fixture(async root => {
  const initial = await loadBook(root);
  const before = await source(root);
  await writeFile(path.join(root, 'content/backups'), 'impedimento de prueba');
  await assert.rejects(createPage({ template: 'lesson' }, root));
  await assert.rejects(duplicatePage(initial.pages[0].id, root));
  await assert.rejects(deletePage(initial.pages[0].id, root));
  await assert.rejects(reorderPages({ pageOrder: initial.pages.map(page => page.id).reverse() }, root));
  assert.equal(await source(root), before);
  assert.deepEqual(await loadBook(root), initial);
}));

test('Rechaza respaldos enlazados fuera de content/backups', () => fixture(async root => {
  const other = path.join(root, 'destino');
  await mkdir(other);
  await symlink(other, path.join(root, 'content/backups'), 'junction');
  await assert.rejects(createPage({ template: 'lesson' }, root), /sin enlaces/);
  assert.deepEqual(await readdir(other), []);
  await loadBook(root);
}));
