import type { Block, ColumnsBlock, Column } from '../types/schema';
import { allBlocks, blockLocation, childSlots, containerDepth, maxContainerDepth, updateBlock, updateSiblings } from './blocks';
import { isGrid } from './grid';

function slotOwner(blocks: Block[], id: string) { return allBlocks(blocks).find(b => childSlots(b).some(c => c.id === id)); }
const layout = (count: number): ColumnsBlock['layout'] => count === 1 ? '1-full' : count === 2 ? '2-equal' : count === 3 ? '3-equal' : '4-equal';
/** Only reorder within one existing row; never discard cells or split spans. */
export function reorderColumn(blocks: Block[], id: string, targetId: string, after: boolean): Block[] {
  const owner = slotOwner(blocks, id);
  if (!owner || id === targetId || owner !== slotOwner(blocks, targetId)) return blocks;
  if (isGrid(owner) && owner.rows.some(r => r.cells.some(c => (c.rowSpan ?? 1) > 1))) return blocks;
  const row = isGrid(owner) ? owner.rows.find(r => r.cells.some(c => c.id === id)) : undefined;
  const slots = row ? row.cells : childSlots(owner);
  if (!slots.some(c => c.id === targetId)) return blocks;
  const next = [...slots], from = next.findIndex(c => c.id === id);
  const [moved] = next.splice(from, 1); next.splice(next.findIndex(c => c.id === targetId) + Number(after), 0, moved);
  if (next.every((c,i) => c === slots[i])) return blocks;
  return updateBlock(blocks, owner.id, b => isGrid(b) ? { ...b, rows: b.rows.map(r => r.id === row!.id ? { ...r, cells: next.map((c,column) => ({ ...c, column })) } : r) } : { ...b, columns: next } as Block);
}
export function sideDrop(blocks: Block[], id: string, targetId: string, after: boolean): Block[] {
  const source = blockLocation(blocks, id), target = blockLocation(blocks, targetId);
  if (!source || !target || id === targetId) return blocks;
  const moved = source.siblings[source.index], anchor = target.siblings[target.index];
  if (allBlocks([anchor]).some(b => b.id === id)) return blocks;
  if (allBlocks([moved]).some(b => b.id === targetId || b.id === target.parent?.id)) return blocks;
  const owner = target.parent;
  if (owner && isGrid(owner) && owner.rows.some(r => r.cells.some(c => (c.rowSpan ?? 1) > 1))) return blocks;
  const row = owner && isGrid(owner) ? owner.rows.find(r => r.cells.some(c => c.id === target.column?.id)) : undefined;
  const slots = row ? row.cells : childSlots(owner);
  if (owner && slots.length >= 4) return blocks;
  if ((owner ? target.depth : target.depth + 1) + containerDepth(moved) > maxContainerDepth || (!owner && target.depth + 1 + containerDepth(anchor) > maxContainerDepth)) return blocks;
  const removed = updateSiblings(blocks, source.column?.id, items => items.filter(b => b.id !== id));
  const fresh: Column = { id: `col-${crypto.randomUUID()}`, blocks: [moved] };
  if (owner) return updateBlock(removed, owner.id, b => {
    const insert = (items: Column[]) => { const next = [...items]; next.splice(next.findIndex(c => c.id === target.column?.id) + Number(after), 0, fresh); return next; };
    return isGrid(b) ? { ...b, rows: b.rows.map(r => r.id === row!.id ? { ...r, layout: layout(r.cells.length + 1), cells: insert(r.cells).map((c,column) => ({ ...c, column })) } : r) } : { ...b, layout: layout(slots.length + 1), columns: insert(childSlots(b)) } as Block;
  });
  const original = { id: `col-${crypto.randomUUID()}`, blocks: [anchor] };
  return updateBlock(removed, targetId, () => ({ id: `columns-${crypto.randomUUID()}`, type: 'columns', layout: '2-equal', columns: after ? [original, fresh] : [fresh, original] }));
}
