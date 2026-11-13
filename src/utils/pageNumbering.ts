import type { Book } from '../types/schema';

export function pageNumbering(book: Book, pageId: string) {
  const index = book.pageOrder.findIndex(entry => entry.id === pageId);
  const firstSide = book.firstContentPageSide ?? 'left';
  const side = index % 2 === 0 ? firstSide : firstSide === 'left' ? 'right' : 'left';
  const mode = book.pageNumbering ?? 'alternate';
  return { number: index + 1, side, numberSide: mode === 'alternate' ? side : mode };
}
