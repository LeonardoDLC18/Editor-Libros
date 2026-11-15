import { BlockText, InlineEditingContext } from './InlineText';
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import type { Block } from '../types/schema';
import { updateBlock } from '../utils/blocks';

export type EditCell = (id: string, row: number, column: number, value: string) => void;

export function TableBlock({ block, onEdit }: { block: Extract<Block, { type: 'table' }>; onEdit?: EditCell }) {
  const ref = useRef<HTMLTableElement>(null);
  const editing = useContext(InlineEditingContext);
  const drag = useRef<{ pointer: number; x: number; width: number; index: number; widths: number[] } | null>(null);
  const widths = block.columnWidths ?? block.columns.map(() => 100 / block.columns.length);
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
      <colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
      <thead><tr>{block.columns.map((value, column) => <th key={column} scope="col">{cell(value, -1, column)}</th>)}</tr></thead>
      <tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{cell(value, index, column)}</td>)}</tr>)}</tbody>
    </table>
    {editing && widths.slice(0, -1).map((_, index) => <span key={index} className="table-resize-handle" role="separator" aria-label={`Ajustar columnas ${index + 1} y ${index + 2}`} aria-orientation="vertical"
      style={{ left: `${widths.slice(0, index + 1).reduce((a, b) => a + b, 0)}%` }}
      onPointerDown={event => {
        if (event.button !== 0 || !ref.current) return;
        event.preventDefault(); event.stopPropagation(); editing.select(block.id);
        drag.current = { pointer: event.pointerId, x: event.clientX, width: ref.current.getBoundingClientRect().width, index, widths: [...widths] };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || start.pointer !== event.pointerId || !start.width) return;
        event.preventDefault(); event.stopPropagation();
        const minimum = Math.min(8, 50 / start.widths.length, start.widths[index], start.widths[index + 1]);
        const total = start.widths[index] + start.widths[index + 1];
        const left = Math.max(minimum, Math.min(total - minimum, start.widths[index] + (event.clientX - start.x) * 100 / start.width));
        const next = [...start.widths]; next[index] = left; next[index + 1] = total - left;
        editing.change(page => ({ ...page, blocks: updateBlock(page.blocks, block.id, current => current.type === 'table' ? { ...current, columnWidths: next } : current) }));
      }}
      onPointerUp={event => { if (drag.current?.pointer === event.pointerId) drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} />)}
  </div>;
}
