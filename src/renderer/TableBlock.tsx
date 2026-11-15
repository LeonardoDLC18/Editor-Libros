import { BlockText } from './InlineText';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Block } from '../types/schema';

export type EditCell = (id: string, row: number, column: number, value: string) => void;

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
  const cell = (value: string, row: number, column: number) => <span className="table-cell-text"><BlockText formatKey={row < 0 ? `columns/${column}` : `rows/${row}/${column}`} value={value} multiline
    label={row < 0 ? `Encabezado ${column + 1}` : `Fila ${row + 1}, columna ${column + 1}`}
    update={(current, value) => current.type === 'table' ? row < 0
      ? { ...current, columns: current.columns.map((cell, c) => c === column ? value : cell) }
      : { ...current, rows: current.rows.map((cells, r) => r === row ? cells.map((cell, c) => c === column ? value : cell) : cells) } : current} /></span>;
  return <div className="table-block">
    {large && <span className="table-warning" role="status">Tabla grande: reduce el contenido o divídelo en otra página.</span>}
    <table ref={ref}>
      {block.title && <caption><BlockText field="title" value={block.title} /></caption>}
      <thead><tr>{block.columns.map((value, column) => <th key={column} scope="col">{cell(value, -1, column)}</th>)}</tr></thead>
      <tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{cell(value, index, column)}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}
