import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageSchema } from '../../src/types/schema';
import { ContentError, loadBook } from '../../server/content';
import { savePage, SaveError } from '../../server/savePage';

// Import only library modules: no server entry point, CLI or real book fixtures.
const workspace = fileURLToPath(new URL('../../', import.meta.url));
export const referenceFile = new URL('./references.json', import.meta.url);
const json = (value: unknown) => JSON.parse(JSON.stringify(value));
const paragraph = { id: 'text-one', type: 'paragraph', text: 'Texto inventado.' };
const page = () => ({
  id: 'page-one', template: 'blank', title: 'Prueba',
  blocks: [structuredClone(paragraph)],
  metadata: { status: 'draft', description: 'Página sintética.' },
});
const design = {
  schemaVersion: 1, name: 'Diseño sintético',
  colors: Object.fromEntries(['navy', 'blue', 'cyan', 'paper', 'ice', 'ink', 'muted', 'line', 'workspace', 'surface', 'success', 'danger'].map(key => [key, '#112233'])),
  fonts: { body: 'Arial', heading: 'Arial', ui: 'Arial', mono: 'Consolas' },
  typeScale: { bodyPt: 12, smallPt: 10, headingPt: 18, titlePt: 24, coverPt: 30, lineHeight: 1.4 },
  page: { widthMm: 210, heightMm: 297, marginMm: 15, headerMm: 20, footerMm: 12 },
  spacing: { blockMm: 4, cardMm: 4 }, borders: { widthPx: 1, radiusMm: 2 },
  shadow: { yPx: 2, blurPx: 4, opacity: 0.1 },
};
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>';
function context(pages: unknown[]) {
  return {
    book: { schemaVersion: 1, book: { id: 'test-book', title: 'Libro inventado', subtitle: 'Prueba', grade: '1', author: 'Suite', language: 'es' },
      units: [], pageOrder: pages.map((p: any) => ({ id: p.id, file: `pages/${p.id}.json` })) },
    design, pages, resources: { 'assets/images/test.svg': svg },
  };
}
type Case = { id: string; rule: string; function: 'pageSchema.safeParse' | 'loadBook' | 'savePage'; input: unknown; context?: ReturnType<typeof context> };
function schemaCase(id: string, rule: string, blocks: unknown[], extra = {}): Case {
  return { id, rule, function: 'pageSchema.safeParse', input: { ...page(), blocks, ...extra } };
}
const table = { id: 'table-one', type: 'table', columns: ['A', 'B'], rows: [['1', '2']] };
const marks = [{ text: 'Negrita', bold: true }, { text: 'Cursiva', italic: true }, { text: 'Resaltado', highlight: true }];
function nested(depth: number): unknown {
  let block: unknown = structuredClone(paragraph);
  for (let i = 0; i < depth; i++) block = { id: `container-${i}`, type: 'columns', layout: '1-full', columns: [{ id: `column-${i}`, blocks: [block] }] };
  return block;
}
const grid = { id: 'grid-one', type: 'grid', rows: [{ id: 'row-one', layout: '2-equal', cells: [
  { id: 'cell-one', column: 0, blocks: [paragraph] }, { id: 'cell-two', column: 1, blocks: [] },
] }] };
const questions = (mode: string) => ({ id: 'questions-one', type: 'questions', mode,
  options: [{ id: 'option-one', label: 'Sí' }, { id: 'option-two', label: 'No' }],
  columns: [{ id: 'question-column', label: 'Respuesta' }],
  items: [{ id: 'question-item', text: '¿Ejemplo?', cells: [''], lines: 1 }], numbered: true,
});
const withImage = { ...page(), blocks: [paragraph, { id: 'image-one', type: 'image', src: 'assets/images/test.svg', alt: 'Cuadrado sintético', heightMm: 10, fit: 'contain' }] };
const previous = context([withImage]);
export const cases: Case[] = [
  schemaCase('page-valid', 'Página válida con heading y paragraph', [{ id: 'heading-one', type: 'heading', text: 'Título', level: 2 }, paragraph]),
  schemaCase('empty-title', 'El título opcional admite cadena vacía', [paragraph], { title: '' }),
  ...['mark', 'write'].map(mode => schemaCase(`questions-${mode}`, `Preguntas modo ${mode}`, [questions(mode)])),
  schemaCase('table-legacy', 'Tabla sin columnWidths', [table]),
  schemaCase('table-widths-valid', 'Anchos correspondientes que suman 100', [{ ...table, columnWidths: [40, 60] }]),
  schemaCase('table-widths-sum', 'Rechazo de suma distinta de 100', [{ ...table, columnWidths: [40, 50] }]),
  schemaCase('table-widths-count', 'Rechazo de cantidad de anchos distinta', [{ ...table, columnWidths: [100] }]),
  schemaCase('rich-text', 'Marcas estructuradas negrita, cursiva y resaltado', [{ ...paragraph, richText: { text: marks } }]),
  schemaCase('nested-three', 'Tres niveles de contenedor admitidos', [nested(3)]),
  schemaCase('nested-four', 'Cuarto nivel de contenedor rechazado', [nested(4)]),
  schemaCase('grid-valid', 'Distribución con cobertura completa', [grid]),
  schemaCase('grid-overlap', 'Rechazo de celdas superpuestas', [{ ...grid, rows: [{ ...grid.rows[0], cells: grid.rows[0].cells.map(cell => ({ ...cell, column: 0 })) }] }]),
  schemaCase('unknown-block', 'Rechazo de discriminante desconocido', [{ id: 'unknown-one', type: 'not-implemented' }]),
  schemaCase('trim-default', 'Normalización trim y default de separator', [{ ...paragraph, text: '  Texto normalizado.  ' }, { id: 'separator-one', type: 'separator' }]),
  schemaCase('legacy-steps', 'Conversión real de cardContainer steps a steps', [{ id: 'legacy-one', type: 'cardContainer', variant: 'steps', title: 'Pasos', columns: 2,
    items: [{ id: 'step-one', title: 'Primero', description: 'Preparar.' }, { id: 'step-two', title: 'Después', description: 'Revisar.' }] }]),
  { id: 'book-valid', rule: 'Carga contextual válida y recurso local sintético', function: 'loadBook', input: null, context: previous },
  { id: 'duplicate-block-book', rule: 'IDs de bloques duplicados entre páginas se comprueban en loadBook', function: 'loadBook', input: null,
    context: context([page(), { ...page(), id: 'page-two' }]) },
  { id: 'duplicate-block-save', rule: 'savePage comprueba IDs del nuevo contenido contra otras páginas', function: 'savePage',
    context: context([page(), { ...page(), id: 'page-two', blocks: [{ ...paragraph, id: 'other-text' }] }]),
    input: { ...page(), blocks: [{ ...paragraph, id: 'other-text' }] } },
  { id: 'editable-text', rule: 'Texto de paragraph editable con persistencia y respaldo aislados', function: 'savePage', context: previous,
    input: { ...withImage, blocks: [{ ...paragraph, text: 'Texto cambiado.' }, withImage.blocks[1]] } },
  { id: 'protected-metadata', rule: 'metadata válida por esquema pero protegida por conciliación', function: 'savePage', context: previous,
    input: { ...withImage, metadata: { status: 'ready', description: 'Cambio protegido.' } } },
];

async function fixture<T>(data: NonNullable<Case['context']>, run: (root: string) => Promise<T>) {
  const base = path.join(workspace, '.tmp');
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'migration-validation-'));
  try {
    await mkdir(path.join(root, 'content/pages'), { recursive: true });
    await mkdir(path.join(root, 'assets/images'), { recursive: true });
    await writeFile(path.join(root, 'content/book.json'), JSON.stringify(data.book));
    await writeFile(path.join(root, 'content/design.json'), JSON.stringify(data.design));
    for (const p of data.pages as any[]) await writeFile(path.join(root, `content/pages/${p.id}.json`), JSON.stringify(p));
    for (const [relative, bytes] of Object.entries(data.resources)) await writeFile(path.join(root, relative), bytes);
    return await run(root);
  } finally {
    const relative = path.relative(base, root);
    if (!path.isAbsolute(root) || !relative.startsWith('migration-validation-') || relative.includes(path.sep)) throw new Error('Unsafe fixture cleanup');
    await rm(root, { recursive: true, force: true });
  }
}
function failure(error: unknown) {
  // These functions expose no structured paths/codes for contextual errors.
  // Do not reinterpret SaveError.status as an observed HTTP response.
  if (error instanceof ContentError) return { accepted: false, error: { kind: 'ContentError', issues: error.issues } };
  if (error instanceof SaveError) return { accepted: false, error: { kind: 'SaveError', message: error.message } };
  throw error; // Infrastructure errors must fail generation, never become expectations.
}
export async function observe(item: Case) {
  const record = json(item);
  if (item.function === 'pageSchema.safeParse') {
    const result = pageSchema.safeParse(structuredClone(item.input));
    return { ...record, observed: result.success ? { accepted: true, normalized: json(result.data) } : {
      accepted: false, issues: result.error.issues.map(issue => ({ path: issue.path, code: issue.code, message: issue.message })),
    } };
  }
  assert.ok(item.context);
  return fixture(item.context, async root => {
    if (item.function === 'loadBook') {
      try { return { ...record, observed: { accepted: true, normalized: json(await loadBook(root)) } }; }
      catch (error) { return { ...record, observed: failure(error) }; }
    }
    const input = item.input as ReturnType<typeof page>;
    const target = path.join(root, `content/pages/${input.id}.json`);
    const before = await readFile(target, 'utf8');
    let result;
    try { result = { accepted: true, normalized: json(await savePage(input.id, structuredClone(input), root)) }; }
    catch (error) { result = failure(error); }
    const persisted = JSON.parse(await readFile(target, 'utf8'));
    const backupFolder = path.join(root, 'content/backups');
    const names = await readdir(backupFolder).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
    const backups = await Promise.all(names.sort().map(async name => JSON.parse(await readFile(path.join(backupFolder, name), 'utf8'))));
    if (result.accepted) { assert.deepEqual(persisted, (result as any).normalized); assert.deepEqual(backups, [JSON.parse(before)]); }
    else { assert.equal(await readFile(target, 'utf8'), before); assert.deepEqual(backups, []); }
    return { ...record, observed: { ...result, persisted, backups } };
  });
}
