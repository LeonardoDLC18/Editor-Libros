import { ColumnHandle } from './ColumnHandle';
import { useContext } from 'react';
import { BlockDragContext } from './BlockDrag';
import type { GridContainer, GridRow } from '../types/schema';
import { gridTracks } from '../utils/grid';
import { BlockRenderer } from './BlockRenderer';
import type { EditCell } from './TableBlock';

export function Grid({ block, selectedId, onSelect, onEditCell }: {
  block: GridContainer; selectedId?: string; onSelect?: (id: string) => void; onEditCell?: EditCell;
}) {
  const drag = useContext(BlockDragContext);
  // Consecutive rows with the same layout share tracks and native CSS row spans.
  const bands: { start: number; rows: GridRow[] }[] = [];
  block.rows.forEach((row, index) => {
    const previous = bands.at(-1);
    if (previous?.rows[0].layout === row.layout) previous.rows.push(row);
    else bands.push({ start: index, rows: [row] });
  });
  return <div className={`editorial-grid grid-gap-${block.gap ?? 'small'}`}>
    {bands.map(band => <div className="grid-band" key={band.rows[0].id} style={{
      gridTemplateColumns: gridTracks[band.rows[0].layout].split(' ').map(track => `minmax(0, ${track})`).join(' '),
      gridTemplateRows: `repeat(${band.rows.length}, auto)`,
    }}>
      {band.rows.flatMap((row, r) => row.cells.map(cell => <div key={cell.id}
        className={`grid-cell column-blocks${selectedId === cell.id ? ' is-selected' : ''}${drag?.active && cell.blocks.length === 0 && drag.canSlot(cell.id) ? ' drag-empty' : ''}`}
        data-cell-id={cell.id} data-row-id={row.id}
        onDragOverCapture={drag ? event => { const rect = event.currentTarget.getBoundingClientRect(); if (drag.columnOver(cell.id, event.clientX >= rect.left + rect.width / 2)) { event.stopPropagation(); event.preventDefault(); } } : undefined}
        onDropCapture={drag ? event => { const rect = event.currentTarget.getBoundingClientRect(); const after = event.clientX >= rect.left + rect.width / 2; if (drag.columnOver(cell.id, after)) { event.stopPropagation(); event.preventDefault(); drag.columnDrop(cell.id, after); } } : undefined}
        onDragOver={drag ? event => { event.stopPropagation(); if (drag.overSlot(cell.id)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } } : undefined}
        onDrop={drag ? event => { event.stopPropagation(); event.preventDefault(); drag.dropSlot(cell.id); } : undefined}
        style={{ gridColumn: cell.column + 1, gridRow: `${r + 1} / span ${cell.rowSpan ?? 1}`, justifyContent: { top: 'flex-start', center: 'center', bottom: 'flex-end' }[cell.verticalAlign ?? 'top'] }}
        tabIndex={onSelect ? 0 : undefined} role={onSelect ? 'group' : undefined}
        aria-label={onSelect ? `Seleccionar celda ${cell.column + 1}, fila ${band.start + r + 1}` : undefined}
        onClick={onSelect ? event => { event.stopPropagation(); onSelect(cell.id); } : undefined}
        onKeyDown={onSelect ? event => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault(); event.stopPropagation(); onSelect(cell.id);
          }
        } : undefined}>
        <ColumnHandle id={cell.id} />
        {cell.blocks.map(child => <BlockRenderer key={child.id} block={child} inColumn selectedId={selectedId} onSelect={onSelect} onEditCell={onEditCell} />)}
      </div>))}
    </div>)}
  </div>;
}
