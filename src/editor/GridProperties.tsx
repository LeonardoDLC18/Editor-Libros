import type { GridContainer, GridGap, GridRow } from '../types/schema';
import { columnLayoutLabels } from '../utils/blocks';
import { changeGridLayout, changeGridSpan, gridSpanOptions, newGridRow, separateGridRows } from '../utils/grid';
import { blockLabels } from '../renderer/BlockRenderer';

export function GridProperties({ block, selectedId, onChange, onSelect }: {
  block: GridContainer; selectedId?: string; onChange: (block: GridContainer) => void; onSelect: (id: string) => void;
}) {
  const selectedRow = block.rows.find(row => row.cells.some(cell => cell.id === selectedId));
  const cell = selectedRow?.cells.find(item => item.id === selectedId);
  const spans = cell && selectedRow ? gridSpanOptions(block.rows, selectedRow.id, cell) : [];
  const rowsChange = (rows: GridRow[]) => onChange({ ...block, rows });
  return <>
    <label className="property-field" htmlFor="grid-gap">Separación<select id="grid-gap" value={block.gap ?? 'small'} onChange={event => onChange({ ...block, gap: event.target.value as GridGap })}>
      <option value="none">Sin separación</option><option value="small">Pequeña</option><option value="normal">Normal</option>
    </select></label>
    <p className="management-note">Altura automática por contenido. Al cambiar la distribución o el orden de filas se separan las celdas unidas. Reducir columnas conserva sus bloques en la última celda.</p>
    <label className="property-field" htmlFor="grid-cell-target">Agregar bloques en<select id="grid-cell-target" value={cell?.id ?? ''} onChange={event => onSelect(event.target.value || block.id)}>
      <option value="">Selecciona una celda</option>{block.rows.flatMap((row, r) => row.cells.map(item => <option key={item.id} value={item.id}>Fila {r + 1} · Celda {item.column + 1}</option>))}
    </select></label>
    {cell && selectedRow && <div className="grid-cell-properties">
      <span className="section-label">Celda seleccionada</span>
      <button className="button" onClick={() => onSelect(block.id)}>Seleccionar contenedor</button>
      <label className="property-field" htmlFor="grid-cell-align">Alineación vertical<select id="grid-cell-align" value={cell.verticalAlign ?? 'top'} onChange={event => rowsChange(block.rows.map(row => ({ ...row, cells: row.cells.map(item => item.id === cell.id ? { ...item, verticalAlign: event.target.value as 'top' | 'center' | 'bottom' } : item) })))}>
        <option value="top">Arriba</option><option value="center">Centro</option><option value="bottom">Abajo</option>
      </select></label>
      {spans.length > 1 && <label className="property-field" htmlFor="grid-cell-span">Ocupar filas<select id="grid-cell-span" value={cell.rowSpan ?? 1} onChange={event => rowsChange(changeGridSpan(block.rows, selectedRow.id, cell.id, Number(event.target.value) as 1 | 2 | 3))}>
        {spans.map(span => <option key={span} value={span}>{span}</option>)}
      </select></label>}
      {spans.length > 1 && <p className="management-note">Solo se unen filas con la misma distribución. El contenido de las celdas unidas se agrega a esta celda. Al separarlas, permanece aquí.</p>}
    </div>}
    {block.rows.map((row, index) => <fieldset className="grid-row-properties" key={row.id} data-grid-row={row.id}>
      <legend>Fila {index + 1}</legend>
      <label className="property-field" htmlFor={`grid-layout-${row.id}`}>Distribución<select id={`grid-layout-${row.id}`} value={row.layout} onChange={event => rowsChange(changeGridLayout(block.rows, row.id, event.target.value as GridRow['layout']))}>
        {(Object.keys(columnLayoutLabels) as GridRow['layout'][]).map(layout => <option key={layout} value={layout}>{columnLayoutLabels[layout]}</option>)}
      </select></label>
      <div className="block-actions">
        {([-1, 1] as const).map(delta => <button key={delta} data-row-move={delta} className="button" disabled={index + delta < 0 || index + delta >= block.rows.length} onClick={() => {
          const rows = separateGridRows(block.rows); [rows[index], rows[index + delta]] = [rows[index + delta], rows[index]]; rowsChange(rows);
        }}>{delta < 0 ? '↑ Subir fila' : '↓ Bajar fila'}</button>)}
        <button data-row-delete className="button danger-button" disabled={block.rows.length === 1} onClick={() => {
          if (row.cells.some(item => item.blocks.length) && !window.confirm('¿Eliminar esta fila y sus bloques? Puedes deshacer esta acción.')) return;
          rowsChange(separateGridRows(block.rows).filter(item => item.id !== row.id));
          if (row.id === selectedRow?.id) onSelect(block.id);
        }}>Eliminar fila</button>
      </div>
      {row.cells.map(item => <div className="column-outline" key={item.id}>
        <button className="button" aria-pressed={item.id === selectedId} onClick={() => onSelect(item.id)}>Celda {item.column + 1}{(item.rowSpan ?? 1) > 1 ? ` · ocupa ${item.rowSpan} filas` : ''}</button>
        {item.blocks.map(child => <button className="button" key={child.id} onClick={() => onSelect(child.id)}>{blockLabels[child.type]}</button>)}
      </div>)}
    </fieldset>)}
    <button id="grid-add-row" className="button" onClick={() => rowsChange([...block.rows, newGridRow()])}>Agregar fila</button>
  </>;
}
