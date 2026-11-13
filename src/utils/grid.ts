import type { Block, GridCell, GridContainer, GridRow } from '../types/schema';

export function isGrid(block?: Block): block is GridContainer {
  return block?.type === 'grid' || (block?.type === 'framedColumns' && Array.isArray(block.rows));
}
export const gridTracks: Record<GridRow['layout'], string> = {
  '1-full': '1fr', '2-equal': '1fr 1fr', '2-60-40': '3fr 2fr', '2-40-60': '2fr 3fr',
  '2-70-30': '7fr 3fr', '2-30-70': '3fr 7fr', '3-equal': '1fr 1fr 1fr',
  '3-25-50-25': '1fr 2fr 1fr', '4-equal': '1fr 1fr 1fr 1fr',
};
export function gridStructureError(rows: GridRow[]): string | undefined {
  const occupied = rows.map(row => Array<boolean>(Number(row.layout[0])).fill(false));
  for (const [r, row] of rows.entries()) for (const cell of row.cells) {
    const span = cell.rowSpan ?? 1;
    if (r + span > rows.length) return 'La celda ocupa filas fuera del grid.';
    for (let i = r; i < r + span; i++) {
      if (rows[i].layout !== row.layout) return 'Las filas unidas deben tener la misma distribución.';
      if (cell.column >= occupied[i].length || occupied[i][cell.column]) return 'Las celdas no pueden superponerse ni salir de la fila.';
      occupied[i][cell.column] = true;
    }
  }
  if (occupied.some(row => row.some(value => !value))) return 'Cada posición debe tener una celda o estar cubierta por Ocupar filas.';
}
export function newGridCell(column: number): GridCell { return { id: `cell-${crypto.randomUUID()}`, column, blocks: [] }; }
export function newGridRow(layout: GridRow['layout'] = '1-full'): GridRow {
  return { id: `row-${crypto.randomUUID()}`, layout, cells: Array.from({ length: Number(layout[0]) }, (_, i) => newGridCell(i)) };
}
/** Split spans before structural edits, keeping every block in its original cell. */
export function separateGridRows(rows: GridRow[]): GridRow[] {
  return rows.map(row => ({ ...row, cells: Array.from({ length: Number(row.layout[0]) }, (_, column) => {
    const cell = row.cells.find(item => item.column === column);
    return cell ? { ...cell, rowSpan: 1, blocks: [...cell.blocks] } : newGridCell(column);
  }) }));
}
export function changeGridLayout(rows: GridRow[], rowId: string, layout: GridRow['layout']): GridRow[] {
  return separateGridRows(rows).map(row => {
    if (row.id !== rowId) return row;
    const count = Number(layout[0]), cells = row.cells.slice(0, count);
    for (const cell of row.cells.slice(count)) cells[count - 1].blocks.push(...cell.blocks);
    while (cells.length < count) cells.push(newGridCell(cells.length));
    return { ...row, layout, cells };
  });
}
export function gridSpanOptions(rows: GridRow[], rowId: string, cell: GridCell): (1 | 2 | 3)[] {
  const r = rows.findIndex(row => row.id === rowId), current = cell.rowSpan ?? 1;
  return ([1, 2, 3] as const).filter(span => {
    if (r < 0 || r + span > rows.length) return false;
    for (let i = r + 1; i < r + span; i++) {
      if (rows[i].layout !== rows[r].layout) return false;
      if (i < r + current) continue;
      const target = rows[i].cells.find(item => item.column === cell.column);
      if (!target || (target.rowSpan ?? 1) !== 1) return false;
    }
    return true;
  });
}
export function changeGridSpan(rows: GridRow[], rowId: string, cellId: string, span: 1 | 2 | 3): GridRow[] {
  const r = rows.findIndex(row => row.id === rowId), cell = rows[r]?.cells.find(item => item.id === cellId);
  if (!cell || !gridSpanOptions(rows, rowId, cell).includes(span)) return rows;
  const next = rows.map(row => ({ ...row, cells: row.cells.map(item => ({ ...item, blocks: [...item.blocks] })) }));
  const anchor = next[r].cells.find(item => item.id === cellId)!;
  for (let i = r + 1; i < r + Math.max(span, cell.rowSpan ?? 1); i++) {
    if (i < r + span) {
      const target = next[i].cells.find(item => item.column === cell.column);
      if (target) anchor.blocks.push(...target.blocks);
      next[i].cells = next[i].cells.filter(item => item.column !== cell.column);
    } else next[i].cells.push(newGridCell(cell.column));
    next[i].cells.sort((a, b) => a.column - b.column);
  }
  anchor.rowSpan = span;
  return next;
}
