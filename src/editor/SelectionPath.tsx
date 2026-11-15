import type { Block } from '../types/schema';
import { childSlots } from '../utils/blocks';
import { isGrid } from '../utils/grid';
import { blockLabels } from '../renderer/BlockRenderer';
type Entry = { id: string; label: string };
function path(blocks: Block[], id?: string): Entry[] | undefined {
  for (const block of blocks) {
    const head = { id: block.id, label: blockLabels[block.type] };
    if (block.id === id) return [head];
    for (const [i,slot] of childSlots(block).entries()) {
      const row = isGrid(block) ? block.rows.find(r => r.cells.some(c => c.id === slot.id)) : undefined;
      const trail = row ? [{ id: row.cells[0].id, label: `Fila ${(isGrid(block) ? block.rows.indexOf(row) : 0) + 1}` }] : [];
      const column = { id: slot.id, label: `Columna ${row ? row.cells.indexOf(slot as typeof row.cells[number]) + 1 : i + 1}` };
      if (slot.id === id) return [head, ...trail, column];
      const child = path(slot.blocks, id);
      if (child) return [head, ...trail, column, ...child];
    }
    if (block.type === 'cardContainer' && block.items.some(c => c.id === id)) return [head, { id: id!, label: 'Tarjeta' }];
  }
}
export function SelectionPath({ blocks, selectedId, onSelect }: { blocks: Block[]; selectedId?: string; onSelect: (id?: string) => void }) {
  return <nav className="selection-path" aria-label={"Ruta de selecci\u00f3n"}><button onClick={() => onSelect(undefined)}>{"P\u00e1gina"}</button>{(path(blocks, selectedId) ?? []).map((item,i) => <span key={`${item.id}-${i}`}> &gt; <button onClick={() => onSelect(item.id)}>{item.label}</button></span>)}</nav>;
}

