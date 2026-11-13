import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { z } from 'zod';
import { bookSchema, designSchema, pageSchema, type BookData, type Page } from '../src/types/schema';
import { identifiedItems, imageSources } from '../src/utils/blocks';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export class ContentError extends Error {
  constructor(public readonly issues: string[]) {
    super(`El libro contiene ${issues.length} error(es).`);
  }
}

// Resolve both the lexical path and real filesystem path, including junctions/symlinks.
export async function safeFile(root: string, relative: string): Promise<string> {
  const base = await realpath(root);
  const candidate = path.resolve(base, relative);
  const inside = (target: string) => {
    const rel = path.relative(base, target);
    return rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
  };
  if (!inside(candidate)) throw new Error('La ruta sale de la carpeta permitida.');
  const actual = await realpath(candidate);
  if (!inside(actual)) throw new Error('El enlace apunta fuera de la carpeta permitida.');
  if (!(await stat(actual)).isFile()) throw new Error('La ruta no corresponde a un archivo.');
  return actual;
}

export async function loadBook(root = projectRoot): Promise<BookData> {
  const issues: string[] = [];
  const parse = async <T>(relative: string, schema: z.ZodType<T>): Promise<T | undefined> => {
    let raw: unknown;
    try {
      const source = await readFile(await safeFile(root, relative), 'utf8');
      raw = JSON.parse(source.replace(/^\uFEFF/, ''));
    } catch (error) {
      const detail = error instanceof SyntaxError ? 'JSON inválido; revisa comas, comillas y llaves.'
        : (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'El archivo no existe.'
        : error instanceof Error ? error.message : 'No se pudo leer el archivo.';
      issues.push(`${relative}: ${detail}`);
      return;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const message = issue.code === 'invalid_union' && issue.path.at(-1) === 'type'
          ? 'Tipo de bloque desconocido; usa un tipo documentado en DATA_MODEL.md.' : issue.message;
        issues.push(`${relative} → ${issue.path.join('.') || 'documento'}: ${message}`);
      }
      return;
    }
    return result.data;
  };

  const book = await parse('content/book.json', bookSchema);
  const design = await parse('content/design.json', designSchema);
  let files: string[] = [];
  try {
    files = (await readdir(path.join(root, 'content/pages'), { withFileTypes: true }))
      .filter((entry) => entry.name.toLowerCase().endsWith('.json'))
      .map((entry) => `pages/${entry.name}`).sort();
  } catch {
    issues.push('content/pages/: no se pudo leer la carpeta de páginas.');
  }
  const pages = new Map<string, Page>();
  const pageIds = new Set<string>();
  const blockIds = new Set<string>();
  for (const file of files) {
    const page = await parse(`content/${file}`, pageSchema);
    if (!page) continue;
    if (pageIds.has(page.id)) issues.push(`content/${file}: identificador de página duplicado «${page.id}».`);
    pageIds.add(page.id);
    pages.set(file, page);
    if (book && page.unitId && !book.units.some((unit) => unit.id === page.unitId)) {
      issues.push(`content/${file}: la unidad «${page.unitId}» no existe en book.json.`);
    }
    for (const block of identifiedItems(page.blocks)) {
      if (blockIds.has(block.id)) issues.push(`content/${file}: identificador de bloque duplicado «${block.id}».`);
      blockIds.add(block.id);
    }
    for (const src of imageSources(page.blocks)) {
        try {
          const [folder, ...parts] = src.split('/');
          await safeFile(path.join(root, folder), parts.join('/'));
        } catch {
          issues.push(`content/${file}: recurso inexistente o fuera de su carpeta: ${src}.`);
        }
    }
  }
  if (book) {
    for (const [label, ids] of [
      ['unidad', book.units.map((unit) => unit.id)],
      ['página en pageOrder', book.pageOrder.map((entry) => entry.id)],
      ['archivo en pageOrder', book.pageOrder.map((entry) => entry.file)],
    ] as const) {
      const seen = new Set<string>();
      for (const value of ids) {
        if (seen.has(value)) issues.push(`content/book.json: ${label} duplicado «${value}».`);
        seen.add(value);
      }
    }
    for (const entry of book.pageOrder) {
      if (!files.includes(entry.file)) issues.push(`content/book.json: falta el archivo content/${entry.file} indicado en pageOrder.`);
      const page = pages.get(entry.file);
      if (page && page.id !== entry.id) issues.push(`content/${entry.file}: id «${page.id}» no coincide con «${entry.id}» en pageOrder.`);
    }
    for (const file of files) {
      if (!book.pageOrder.some((entry) => entry.file === file)) issues.push(`content/${file}: agrega esta página a pageOrder o retírala de content/pages/.`);
    }
  }
  if (issues.length || !book || !design) throw new ContentError(issues);
  return { book, design, pages: book.pageOrder.map((entry) => pages.get(entry.file)!) };
}
