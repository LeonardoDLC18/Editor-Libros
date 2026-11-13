import type { Book, Page } from '../types/schema';
import { Cover } from '../templates/Cover';
import { Lesson } from '../templates/Lesson';
import type { EditCell } from './TableBlock';
import { useLayoutEffect, useRef } from 'react';
import { pageNumbering } from '../utils/pageNumbering';

export function PageRenderer({ page, book, selectedBlock, onSelectBlock, onEditCell, onOverflow }: {
  page: Page; book: Book; selectedBlock?: string; onSelectBlock?: (id: string) => void; onEditCell?: EditCell; onOverflow?: (overflow: boolean) => void;
}) {
  const { number, side, numberSide } = pageNumbering(book, page.id);
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !onOverflow) return;
    const measure = () => onOverflow(element.offsetHeight > parseFloat(getComputedStyle(element).minHeight) + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [page, onOverflow]);
  const unit = book.units.find((item) => item.id === page.unitId);
  const Template = page.template === 'cover' ? Cover : Lesson;
  return <article ref={ref} className={`book-page template-${page.template}`} data-page-side={side} aria-label={`Página ${number}${page.title?.trim() ? `: ${page.title}` : ''}`}>
    <header className="page-header">
      <div className="editorial-brand"><span className="code-mark" aria-hidden="true">{'</>'}</span><strong>{book.book.title}</strong></div>
      <span className="editorial-grade">{book.book.grade}</span>
      {unit && <span className="unit-label">{unit.label}</span>}
    </header>
    <Template page={page} selectedBlock={selectedBlock} onSelectBlock={onSelectBlock} onEditCell={onEditCell} />
    <footer className="page-footer" data-number-side={numberSide}><span>{unit?.title || book.book.title}</span><span>{book.book.grade}</span><strong className="page-number">{String(number).padStart(2, '0')}</strong></footer>
  </article>;
}
