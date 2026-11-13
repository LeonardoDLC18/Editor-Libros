import { mkdir, realpath, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { projectRoot } from './content';
import { contentOperation, SaveError } from './storage';

export const maxImageBytes = 10 * 1024 * 1024;

export function uploadImage(name: string, mime: string, bytes: unknown, root = projectRoot) {
  return contentOperation(async () => {
    if (!Buffer.isBuffer(bytes) || !bytes.length) throw new SaveError(400, 'Selecciona un archivo de imagen.');
    if (bytes.length > maxImageBytes) throw new SaveError(413, 'La imagen supera el límite de 10 MB.');
    // The submitted name never becomes a filesystem path.
    const extension = /\.([a-z]+)$/i.exec(name)?.[1].toLowerCase();
    const png = bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
    const jpeg = bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
    const webp = bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF'
      && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))
      && bytes.readUInt32LE(4) === bytes.length - 8;
    const valid = extension === 'png' && mime === 'image/png' && png
      || (extension === 'jpg' || extension === 'jpeg') && mime === 'image/jpeg' && jpeg
      || extension === 'webp' && mime === 'image/webp' && webp;
    if (!valid) throw new SaveError(415, 'El archivo, su extensión y su tipo deben coincidir: PNG, JPG/JPEG o WebP.');
    const base = await realpath(root);
    const directory = async (relative: string) => {
      const expected = path.join(base, relative);
      await mkdir(expected, { recursive: true });
      const actual = await realpath(expected);
      if (actual !== expected) throw new SaveError(422, 'assets/images debe estar dentro del proyecto, sin enlaces a otras carpetas.');
      return actual;
    };
    await directory('assets');
    const images = await directory('assets/images');
    const filename = `imagen-${randomUUID()}.${extension === 'jpeg' ? 'jpg' : extension}`;
    await writeFile(path.join(images, filename), bytes, { flag: 'wx' });
    return { src: `assets/images/${filename}` };
  });
}
