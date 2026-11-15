import { open, readdir, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import { bookSchema, idSchema, pageSchema, type Book, type Page, type PageOperationResult } from '../src/types/schema';
import { changeTemplate } from '../src/utils/pageTemplate';
import { identifiedItems, remapTextFormatIds } from '../src/utils/blocks';
import { loadBook, projectRoot } from './content';
import { atomicWrite, backupFile, contentOperation, exactFile, SaveError, writeLocations } from './storage';

function validId(id: string) {
  if (!idSchema.safeParse(id).success || id.trim() !== id) throw new SaveError(400, 'El identificador de página no es válido.');
}
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new SaveError(422, result.error.issues.map(issue => `${issue.path.join('.') || 'Solicitud'}: ${issue.message}`).join('\n'));
  return result.data;
}

async function newId(pages: Page[], locations: Awaited<ReturnType<typeof writeLocations>>, label: string) {
  // Include backups so deleting a page does not reuse its permanent identifier.
  const names = [...pages.map(page => page.id), ...await readdir(locations.pages), ...await readdir(locations.backups)];
  const numbers = names.map(name => Number(/^page-(\d+)-/.exec(name)?.[1] || 0)).filter(Number.isSafeInteger);
  const slug = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 55).replace(/-$/, '') || 'nueva-pagina';
  let number = Math.max(0, ...numbers) + 1;
  let id: string;
  do { id = `page-${String(number++).padStart(3, '0')}-${slug}`; }
  while (names.some(name => name.toLowerCase() === id || name.toLowerCase() === `${id}.json`));
  return id;
}

async function insertPage(book: Book, pages: Page[], page: Page, index: number, locations: Awaited<ReturnType<typeof writeLocations>>): Promise<PageOperationResult> {
  const valid = parse(pageSchema, page);
  const file = `${page.id}.json`;
  const entries = [...book.pageOrder];
  entries.splice(index, 0, { id: page.id, file: `pages/${file}` });
  const updated = parse(bookSchema, { ...book, pageOrder: entries });
  await backupFile(locations.book, locations.backups, 'book');
  const target = path.join(locations.pages, file);
  const handle = await open(target, 'wx');
  try {
    await handle.writeFile(`${JSON.stringify(valid, null, 2)}\n`, 'utf8');
    await handle.close();
    await atomicWrite(locations.book, updated);
  } catch (error) { await handle.close(); await unlink(target); throw error; }
  const ordered = [...pages]; ordered.splice(index, 0, valid);
  return { book: updated, pages: ordered, selectedId: page.id };
}

export function createPage(input: unknown, root = projectRoot) {
  return contentOperation(async () => {
    const { template } = parse(z.strictObject({ template: z.enum(['cover', 'lesson', 'blank']) }), input);
    const data = await loadBook(root);
    const locations = await writeLocations(root);
    const title = template === 'blank' ? '' : template === 'cover' ? 'Nueva portada' : 'Nueva página';
    const id = await newId(data.pages, locations, template === 'blank' ? 'pagina-en-blanco' : title);
    const used = new Set(data.pages.flatMap(page => identifiedItems(page.blocks).map(item => item.id)));
    const blockId = (label: string) => {
      let value = `${id}-${label}`;
      while (used.has(value)) value += '-nuevo';
      used.add(value); return value;
    };
    const coverBlocks: Page['blocks'] = [
      {
        id: blockId('imagen-principal'), type: 'image', src: 'assets/images/preset-image.svg',
        alt: 'Imagen principal de la portada', heightMm: 92, fit: 'contain', widthPercent: 100,
      },
      {
        id: blockId('contenido-destacado'), type: 'framedColumns', title: 'Contenido destacado',
        icon: 'target', headerStyle: 'band', background: 'white', layout: '2-60-40',
        columns: [
          {
            id: blockId('columna-objetivo'),
            blocks: [{
              id: blockId('objetivo'), type: 'infoCard', label: 'OBJETIVO', title: 'Lo que aprenderás',
              content: 'Describe aquí el aprendizaje principal de la unidad.', icon: 'target',
            }],
          },
          {
            id: blockId('columna-recurso'),
            blocks: [{
              id: blockId('imagen-complementaria'), type: 'image', src: 'assets/images/preset-image.svg',
              alt: 'Recurso gráfico complementario', heightMm: 42, fit: 'contain', widthPercent: 100,
            }],
          },
        ],
      },
    ];
    const page = changeTemplate({
      id, template,
      title: template === 'cover' ? 'Título de la unidad' : title,
      subtitle: template === 'cover' ? 'Escribe aquí una breve descripción del contenido.' : '',
      blocks: template === 'blank' ? [] : template === 'cover' ? coverBlocks : [
        { id: blockId('titulo'), type: 'heading', level: 2, text: title },
        { id: blockId('texto'), type: 'paragraph', text: 'Escribe aquí el contenido.' },
      ],
      metadata: { status: 'draft', description: 'Página creada desde el editor.' },
    }, template);
    return insertPage(data.book, data.pages, page, data.pages.length, locations);
  });
}

export function duplicatePage(id: string, root = projectRoot) {
  return contentOperation(async () => {
    validId(id);
    const data = await loadBook(root);
    const index = data.pages.findIndex(page => page.id === id);
    if (index < 0) throw new SaveError(404, 'La página que deseas duplicar no existe.');
    const source = data.pages[index];
    const locations = await writeLocations(root);
    const title = source.title?.trim() ? `Copia de ${source.title}` : source.title;
    const nextId = await newId(data.pages, locations, title || 'copia-de-pagina');
    const used = new Set(data.pages.flatMap(page => identifiedItems(page.blocks).map(item => item.id)));
    const page: Page = {
      ...source, id: nextId, title,
      blocks: structuredClone(source.blocks),
    };
    const ids = new Map<string, string>();
    identifiedItems(page.blocks).forEach((item, i) => {
      let value = `${nextId}-bloque-${i + 1}`;
      while (used.has(value)) value += '-nuevo';
      used.add(value); ids.set(item.id, value); item.id = value;
    });
    remapTextFormatIds(page.blocks, ids);
    return insertPage(data.book, data.pages, page, index + 1, locations);
  });
}

export function deletePage(id: string, root = projectRoot) {
  return contentOperation(async (): Promise<PageOperationResult> => {
    validId(id);
    const data = await loadBook(root);
    const index = data.book.pageOrder.findIndex(entry => entry.id === id);
    if (index < 0) throw new SaveError(404, 'La página que deseas eliminar no existe.');
    if (data.pages.length === 1) throw new SaveError(409, 'El libro necesita al menos una página. Crea otra antes de eliminar esta.');
    const locations = await writeLocations(root);
    const entry = data.book.pageOrder[index];
    const file = await exactFile(locations.pages, entry.file.slice('pages/'.length));
    const updated = parse(bookSchema, { ...data.book, pageOrder: data.book.pageOrder.filter(item => item.id !== id) });
    await backupFile(file, locations.backups, id);
    await backupFile(locations.book, locations.backups, 'book');
    const temporary = path.join(locations.pages, `.${id}-${randomUUID()}.tmp`);
    await rename(file, temporary);
    try { await atomicWrite(locations.book, updated); }
    catch (error) { await rename(temporary, file); throw error; }
    // The exact deleted file already has its permanent backup. Cleanup failure
    // leaves only an inactive .tmp file and must not report a failed deletion.
    await unlink(temporary).catch(error => console.error('No se pudo retirar el temporal de la página eliminada.', error));
    return { book: updated, pages: data.pages.filter(page => page.id !== id), selectedId: updated.pageOrder[Math.min(index, updated.pageOrder.length - 1)].id };
  });
}

export function reorderPages(input: unknown, root = projectRoot) {
  return contentOperation(async (): Promise<PageOperationResult> => {
    const { pageOrder } = parse(z.strictObject({ pageOrder: z.array(idSchema).min(1) }), input);
    const data = await loadBook(root);
    const entries = new Map(data.book.pageOrder.map(entry => [entry.id, entry]));
    if (pageOrder.length !== entries.size || new Set(pageOrder).size !== entries.size || pageOrder.some(id => !entries.has(id))) {
      throw new SaveError(422, 'El orden debe contener todas las páginas actuales, una sola vez y sin ids desconocidos.');
    }
    const updated = parse(bookSchema, { ...data.book, pageOrder: pageOrder.map(id => entries.get(id)!) });
    if (pageOrder.every((id, i) => id === data.book.pageOrder[i].id)) return { book: data.book, pages: data.pages };
    const locations = await writeLocations(root);
    await backupFile(locations.book, locations.backups, 'book');
    await atomicWrite(locations.book, updated);
    return { book: updated, pages: pageOrder.map(id => data.pages.find(page => page.id === id)!) };
  });
}

export function saveBookNumbering(input: unknown, root = projectRoot) {
  return contentOperation(async (): Promise<PageOperationResult> => {
    const numbering = parse(bookSchema.pick({ pageNumbering: true, firstContentPageSide: true }).required(), input);
    const data = await loadBook(root);
    const updated = parse(bookSchema, { ...data.book, ...numbering });
    const locations = await writeLocations(root);
    await backupFile(locations.book, locations.backups, 'book');
    await atomicWrite(locations.book, updated);
    return { book: updated, pages: data.pages };
  });
}
