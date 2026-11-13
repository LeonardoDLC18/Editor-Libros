import { mkdir, readFile, realpath, rename, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { safeFile } from './content';

export class SaveError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

// All reads through the API and all writes share this queue. A reader never sees
// the short interval between a page-file change and its book.json change.
let queue: Promise<unknown> = Promise.resolve();
export function contentOperation<T>(run: () => Promise<T>): Promise<T> {
  const operation = queue.then(run);
  queue = operation.catch(() => {});
  return operation;
}

export async function writeLocations(root: string) {
  const actualRoot = await realpath(root);
  const directory = async (relative: string) => {
    const actual = await realpath(path.join(actualRoot, relative));
    if (path.relative(actualRoot, actual) !== path.normalize(relative)) {
      throw new SaveError(422, `La carpeta ${relative} debe estar dentro del proyecto, sin enlaces a otras carpetas.`);
    }
    return actual;
  };
  const content = await directory('content');
  const pages = await directory('content/pages');
  await mkdir(path.join(content, 'backups'), { recursive: true });
  const backups = await directory('content/backups');
  const book = await exactFile(content, 'book.json');
  return { content, pages, backups, book };
}

export async function exactFile(folder: string, name: string) {
  const file = await safeFile(folder, name);
  if (file !== path.join(folder, name)) throw new SaveError(422, 'No se pueden sobrescribir páginas ni índices que sean enlaces a otros archivos.');
  return file;
}

export async function backupFile(file: string, folder: string, id: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(folder, `${id}_${stamp}_${randomUUID()}.json`);
  await writeFile(backup, await readFile(file), { flag: 'wx' });
  return backup;
}

export async function atomicWrite(file: string, value: unknown) {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') console.error('No se pudo retirar el temporal de guardado.', error);
    });
  }
}
