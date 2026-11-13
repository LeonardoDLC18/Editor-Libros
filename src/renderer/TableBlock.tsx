import { useLayoutEffect, useRef, useState } from 'react';
import type { Block } from '../types/schema';

export type EditCell = (id: string, row: number, column: number, value: string) => void;

function Cell({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const resize = () => { element.style.height = '0'; element.style.height = `${element.scrollHeight}px`; };
    resize();
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width !== element.clientWidth) { width = element.clientWidth; resize(); }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);
  return <textarea ref={ref} className="table-cell-editor" aria-label={label} value={value} rows={1} onChange={event => onChange(event.target.value)} />;
}

export function TableBlock({ block, onEdit }: { block: Extract<Block, { type: 'table' }>; onEdit?: EditCell }) {
  const ref = useRef<HTMLTableElement>(null);
  const [large, setLarge] = useState(false);
  useLayoutEffect(() => {
    const table = ref.current;
    const page = table?.closest('.book-page');
    const footer = page?.querySelector('.page-footer');
    if (!table || !footer || !page) return;
    const measure = () => {
      if (!table.offsetWidth) return;
      setLarge(table.getBoundingClientRect().bottom > footer.getBoundingClientRect().top - 4
        || table.scrollWidth > table.clientWidth + 1 || table.offsetWidth / block.columns.length < 65);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(table); observer.observe(page); observer.observe(page.querySelector('.blocks')!);
    return () => observer.disconnect();
  }, [block, onEdit]);
  const cell = (value: string, row: number, column: number) => onEdit
    ? <Cell value={value} label={row < 0 ? `Encabezado ${column + 1}` : `Fila ${row + 1}, columna ${column + 1}`} onChange={value => onEdit(block.id, row, column, value)} />
    : <span className="table-cell-text">{value || '\u00a0'}</span>;
  return <div className="table-block">
    {large && <span className="table-warning" role="status">Tabla grande: reduce el contenido o divídelo en otra página.</span>}
    <table ref={ref}>
      {block.title && <caption>{block.title}</caption>}
      <thead><tr>{block.columns.map((value, column) => <th key={column} scope="col">{cell(value, -1, column)}</th>)}</tr></thead>
      <tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{cell(value, index, column)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
