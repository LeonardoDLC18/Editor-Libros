import type { BookData, BookNumbering, Page, PageOperationResult } from '../types/schema';

export async function fetchBook(signal: AbortSignal): Promise<BookData> {
  const response = await fetch('/api/book', { signal, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) {
    throw new Error([data.message || 'No se pudo cargar el libro.', ...(data.issues || [])].join('\n'));
  }
  return data as BookData;
}

export async function savePage(page: Page): Promise<Page> {
  const data = await writeRequest(`/api/pages/${encodeURIComponent(page.id)}`, 'PUT', page);
  return data.page as Page;
}

async function writeRequest(url: string, method: string, body: unknown) {
  let response: Response;
  try {
    response = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor local. Tus cambios siguen en el editor; comprueba que esté iniciado y vuelve a guardar.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error([data.message || 'No se pudo guardar la página.', ...(data.issues || [])].join('\n'));
  return data;
}

export const createPage = (template: Page['template']): Promise<PageOperationResult> => writeRequest('/api/pages', 'POST', { template });
export const duplicatePage = (id: string): Promise<PageOperationResult> => writeRequest(`/api/pages/${encodeURIComponent(id)}/duplicate`, 'POST', {});
export const deletePage = (id: string): Promise<PageOperationResult> => writeRequest(`/api/pages/${encodeURIComponent(id)}`, 'DELETE', {});
export const reorderPages = (pageOrder: string[]): Promise<PageOperationResult> => writeRequest('/api/book/page-order', 'PUT', { pageOrder });
export const saveBookNumbering = (numbering: BookNumbering): Promise<PageOperationResult> => writeRequest('/api/book/numbering', 'PUT', numbering);

export interface UnusedImage { src: string; size: number; hash: string }
export interface ImageInventory { total: number; used: number; unused: UnusedImage[]; recoverableBytes: number }
export const analyzeImages = (references: string[]): Promise<ImageInventory> => writeRequest('/api/images/analyze', 'POST', { references });
export const deleteUnusedImages = (selected: UnusedImage[], references: string[]): Promise<ImageInventory & { deleted: string[]; skipped: string[] }> =>
  writeRequest('/api/images/delete-unused', 'POST', { selected, references });

export async function uploadImage(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024) throw new Error('La imagen supera el límite de 10 MB.');
  if (!/\.(png|jpe?g|webp)$/i.test(file.name) || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Selecciona una imagen PNG, JPG/JPEG o WebP.');
  }
  const response = await fetch('/api/images', {
    method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'No se pudo subir la imagen.');
  return data.src;
}
