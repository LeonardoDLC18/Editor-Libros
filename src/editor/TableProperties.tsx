import { useState } from 'react';
import type { Block } from '../types/schema';

type Table = Extract<Block, { type: 'table' }>;
export function TableProperties({ block, onChange }: { block: Table; onChange: (update: (block: Table) => Table) => void }) {
  const [row, setRow] = useState(0);
  const [column, setColumn] = useState(0);
  const selectedRow = Math.min(row, Math.max(0, block.rows.length - 1));
  const selectedColumn = Math.min(column, block.columns.length - 1);
  return <>
    <label className="property-field" htmlFor="table-title">Título de tabla (opcional)<input id="table-title" value={block.title ?? ''} onChange={event => onChange(table => ({ ...table, title: event.target.value }))} /></label>
    <p className="management-note">Edita encabezados y celdas directamente en la página. {block.rows.length} filas · {block.columns.length} columnas.</p>
    <div className="block-actions"><button id="add-row" className="button" disabled={block.rows.length >= 200} onClick={() => onChange(table => ({ ...table, rows: [...table.rows, table.columns.map(() => '')] }))}>Agregar fila</button></div>
    <label className="property-field" htmlFor="table-row">Fila que eliminar<select id="table-row" value={selectedRow} disabled={!block.rows.length} onChange={event => setRow(Number(event.target.value))}>{block.rows.map((_, index) => <option key={index} value={index}>Fila {index + 1}</option>)}</select></label>
    <div className="block-actions"><button id="delete-row" className="button" disabled={!block.rows.length} onClick={() => onChange(table => ({ ...table, rows: table.rows.filter((_, index) => index !== selectedRow) }))}>Eliminar fila</button></div>
    <div className="block-actions"><button id="add-column" className="button" disabled={block.columns.length >= 20} onClick={() => onChange(table => ({ ...table, columns: [...table.columns, `Columna ${table.columns.length + 1}`], rows: table.rows.map(row => [...row, '']), columnWidths: table.columnWidths ? [...table.columnWidths.map(width => width * table.columns.length / (table.columns.length + 1)), 100 / (table.columns.length + 1)] : undefined }))}>Agregar columna</button></div>
    <label className="property-field" htmlFor="table-column">Columna que eliminar<select id="table-column" value={selectedColumn} onChange={event => setColumn(Number(event.target.value))}>{block.columns.map((name, index) => <option key={index} value={index}>{index + 1}: {name || 'Sin encabezado'}</option>)}</select></label>
    <div className="block-actions"><button id="delete-column" className="button" disabled={block.columns.length === 1} onClick={() => onChange(table => { const widths = table.columnWidths?.filter((_, index) => index !== selectedColumn); const sum = widths?.reduce((a, b) => a + b, 0) ?? 100; return { ...table, columns: table.columns.filter((_, index) => index !== selectedColumn), rows: table.rows.map(row => row.filter((_, index) => index !== selectedColumn)), columnWidths: widths?.map(width => width * 100 / sum) }; })}>Eliminar columna</button></div>
    {block.columns.length === 1 && <p className="management-note">La tabla necesita al menos una columna.</p>}
  </>;
}
