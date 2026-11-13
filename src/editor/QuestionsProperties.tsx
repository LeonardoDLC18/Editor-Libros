import type { QuestionsBlock } from '../types/schema';

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export function QuestionsProperties({ block, onChange }: { block: QuestionsBlock; onChange: (update: (block: QuestionsBlock) => QuestionsBlock) => void }) {
  const move = (index: number, delta: number) => onChange(current => { const items = [...current.items], target = index + delta; if (target < 0 || target >= items.length) return current; [items[index], items[target]] = [items[target], items[index]]; return { ...current, items }; });
  return <div>
    <label className="property-field">Modo<select value={block.mode} onChange={e => onChange(current => ({ ...current, mode: e.target.value as QuestionsBlock['mode'] }))}><option value="mark">Marcar</option><option value="write">Escribir</option></select></label>
    <label className="property-field">Título/instrucción (opcional)<input value={block.title ?? ''} onChange={e => onChange(current => ({ ...current, title: e.target.value }))} /></label>
    <label className="property-field"><span><input type="checkbox" checked={block.numbered} onChange={e => onChange(current => ({ ...current, numbered: e.target.checked }))} /> Mostrar numeración</span></label>
    {block.mode === 'mark' && <>
      <h4>Opciones</h4>{block.options.map((option, i) => <div key={option.id}><label className="property-field">Opción {i + 1}<input value={option.label} onChange={e => onChange(current => ({ ...current, options: current.options.map(o => o.id === option.id ? { ...o, label: e.target.value } : o) }))} /></label><button className="button" disabled={block.options.length <= 2} onClick={() => onChange(current => ({ ...current, options: current.options.filter(o => o.id !== option.id) }))}>Eliminar opción</button></div>)}
      <button className="button" disabled={block.options.length >= 4} onClick={() => onChange(current => ({ ...current, options: [...current.options, { id: makeId('option'), label: '' }] }))}>+ Agregar opción</button>
      <h4>Columnas de información</h4>{block.columns.map((col, i) => <div key={col.id}><label className="property-field">Columna {i + 1}<input value={col.label} onChange={e => onChange(current => ({ ...current, columns: current.columns.map(c => c.id === col.id ? { ...c, label: e.target.value } : c) }))} /></label><button className="button" onClick={() => onChange(current => ({ ...current, columns: current.columns.filter(c => c.id !== col.id), items: current.items.map(item => ({ ...item, cells: item.cells.filter((_, j) => j !== i) })) }))}>Eliminar columna</button></div>)}
      <button className="button" disabled={block.columns.length >= 4} onClick={() => onChange(current => ({ ...current, columns: [...current.columns, { id: makeId('column'), label: '' }], items: current.items.map(item => ({ ...item, cells: [...item.cells, ''] })) }))}>+ Agregar columna</button>
    </>}
    <h4>{block.mode === 'mark' ? 'Filas' : 'Preguntas'}</h4>
    {block.items.map((item, i) => <div className="step-editor" key={item.id}>
      {block.mode === 'mark' && block.columns.map((col, j) => <label className="property-field" key={col.id}>{col.label || `Columna ${j + 1}`}<input value={item.cells[j]} onChange={e => onChange(current => ({ ...current, items: current.items.map(x => x.id === item.id ? { ...x, cells: x.cells.map((cell, k) => k === j ? e.target.value : cell) } : x) }))} /></label>)}
      <label className="property-field">Texto {i + 1}<textarea rows={2} value={item.text} onChange={e => onChange(current => ({ ...current, items: current.items.map(x => x.id === item.id ? { ...x, text: e.target.value } : x) }))} /></label>
      {block.mode === 'write' && <label className="property-field">Líneas<select value={item.lines} onChange={e => onChange(current => ({ ...current, items: current.items.map(x => x.id === item.id ? { ...x, lines: Number(e.target.value) as 1 | 2 | 3 } : x) }))}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>}
      <div className="block-actions"><button className="button" disabled={i === 0} onClick={() => move(i, -1)}>↑ Subir</button><button className="button" disabled={i === block.items.length - 1} onClick={() => move(i, 1)}>↓ Bajar</button><button className="button" onClick={() => onChange(current => ({ ...current, items: current.items.filter(x => x.id !== item.id) }))}>Eliminar</button></div>
    </div>)}
    <button className="button" onClick={() => onChange(current => ({ ...current, items: [...current.items, { id: makeId('question'), text: '', cells: current.columns.map(() => ''), lines: 1 }] }))}>+ Agregar {block.mode === 'mark' ? 'fila' : 'pregunta'}</button>
  </div>;
}
