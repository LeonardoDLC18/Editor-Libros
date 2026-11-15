import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import { loadBook, projectRoot, safeFile } from './content';
import { contentOperation, SaveError } from './storage';

const managedPath = /^assets\/images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp|gif|svg)$/;
const key = (value: string) => process.platform === 'win32' ? value.toLowerCase() : value;
export const imageHash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

// Check every directory component, including Windows junctions. Never follow links.
export async function imageDirectory(root: string, create = false) {
  const base = await realpath(root);
  for (const relative of ['assets', 'assets/images']) {
    const expected = path.join(base, relative);
    if (create) await mkdir(expected, { recursive: true });
    if ((await lstat(expected)).isSymbolicLink() || await realpath(expected) !== expected) {
      throw new SaveError(422, 'assets/images debe estar dentro del proyecto, sin enlaces a otras carpetas.');
    }
  }
  return path.join(base, 'assets/images');
}

export async function managedImages(root: string) {
  const directory = await imageDirectory(root);
  const base = await realpath(root);
  const files: { src: string; file: string; size: number }[] = [];
  const visit = async (folder: string) => {
    if ((await lstat(folder)).isSymbolicLink() || await realpath(folder) !== folder) throw new SaveError(422, 'La carpeta de imágenes cambió; vuelve a analizarla.');
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory() && /^[a-zA-Z0-9_-]+$/.test(entry.name)) await visit(file);
      else if (entry.isFile()) {
        const src = path.relative(base, file).split(path.sep).join('/');
        if (!managedPath.test(src)) continue;
        const info = await lstat(file);
        if (info.isFile() && !info.isSymbolicLink() && await realpath(file) === file) files.push({ src, file, size: info.size });
      }
    }
  };
  await visit(directory);
  return files.sort((a, b) => a.src.localeCompare(b.src));
}

function references(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    const relative = value.replace(/\\/g, '/').replace(/^\.\//, '');
    if (/^(assets|diagrams)\//.test(relative)) found.add(relative);
  } else if (Array.isArray(value)) value.forEach(item => references(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => references(item, found));
  return found;
}

// Read raw JSON as well as validating: retain references in existing extra fields,
// every nested shape and all pages (even unregistered ones). Backups are excluded.
export async function usedImagePaths(root = projectRoot, additional: string[] = []) {
  await loadBook(root); // Fail closed if the current book cannot be read completely.
  const base = await realpath(root);
  const used = references(additional);
  used.add('assets/images/preset-image.svg'); // Required by new pages and presets.
  const files = ['content/book.json', 'content/design.json', ...(await readdir(path.join(base, 'content/pages')))
    .filter(name => name.toLowerCase().endsWith('.json')).map(name => `content/pages/${name}`)];
  for (const relative of files) {
    references(JSON.parse((await readFile(await safeFile(base, relative), 'utf8')).replace(/^\uFEFF/, '')), used);
  }
  const result = new Set<string>();
  for (const src of used) {
    result.add(key(path.resolve(base, src)));
    // Protect a managed target also when content refers to it through an alias.
    try { result.add(key(await realpath(path.resolve(base, src)))); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return result;
}

function additionalReferences(body: unknown): string[] {
  const value = (body as { references?: unknown } | null)?.references;
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(src => typeof src !== 'string' || src.length > 2000)) throw new SaveError(400, 'Referencias de imágenes inválidas.');
  return value;
}

async function inventory(root: string, additional: string[]) {
  const used = await usedImagePaths(root, additional);
  const files = await managedImages(root);
  const unused = await Promise.all(files.filter(item => !used.has(key(item.file))).map(async ({ src, file, size }) => ({
    src, size, hash: imageHash(await readFile(file)),
  })));
  return { total: files.length, used: files.length - unused.length, unused, recoverableBytes: unused.reduce((sum, item) => sum + item.size, 0) };
}

export function analyzeImages(body: unknown = {}, root = projectRoot) {
  return contentOperation(() => inventory(root, additionalReferences(body)));
}

export function deleteUnusedImages(body: unknown, root = projectRoot) {
  return contentOperation(async () => {
    const additional = additionalReferences(body);
    const selected = (body as { selected?: unknown } | null)?.selected;
    if (!Array.isArray(selected) || !selected.length || selected.length > 10000 || selected.some(item =>
      !item || typeof item.src !== 'string' || !managedPath.test(item.src) || typeof item.hash !== 'string' || !/^[a-f0-9]{64}$/.test(item.hash))) {
      throw new SaveError(400, 'Selecciona imágenes válidas de assets/images.');
    }
    const deleted: string[] = [], skipped: string[] = [];
    const base = await realpath(root);
    for (const { src, hash } of new Map(selected.map(item => [item.src, item])).values()) {
      const candidate = (await managedImages(root)).find(item => item.src === src);
      if (!candidate || imageHash(await readFile(candidate.file)) !== hash) { skipped.push(src); continue; }
      // Recheck containment, parents and file type after reading the bytes.
      await imageDirectory(base);
      const parts = src.split('/').slice(2);
      let parent = path.join(base, 'assets/images');
      for (const part of parts.slice(0, -1)) {
        parent = path.join(parent, part);
        if ((await lstat(parent)).isSymbolicLink() || await realpath(parent) !== parent) throw new SaveError(422, 'La ruta de imagen cambió.');
      }
      const info = await lstat(candidate.file);
      if (!info.isFile() || info.isSymbolicLink() || await realpath(candidate.file) !== candidate.file) { skipped.push(src); continue; }
      // Serialized with uploads/saves; reread all active references immediately before unlink.
      const used = await usedImagePaths(root, additional);
      if (used.has(key(candidate.file))) { skipped.push(src); continue; }
      await unlink(candidate.file);
      deleted.push(src);
    }
    return { deleted, skipped, ...await inventory(root, additional) };
  });
}
