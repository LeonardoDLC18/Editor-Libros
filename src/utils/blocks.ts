import type { Block, CardContainerBlock, ColumnsBlock, Column, GridContainer } from '../types/schema';
import { isGrid } from './grid';

export const maxContainerDepth = 3;
export const nestingMessage = 'Este bloque no puede anidarse a mayor profundidad.';

export const columnLayoutLabels: Record<ColumnsBlock['layout'], string> = {
  '1-full': '100 %', '2-equal': '50 / 50', '2-40-60': '40 / 60',
  '2-60-40': '60 / 40', '2-30-70': '30 / 70', '2-70-30': '70 / 30',
  '3-equal': '33 / 33 / 33', '3-25-50-25': '25 / 50 / 25', '4-equal': '25 / 25 / 25 / 25',
};
export const containerVariantLabels: Record<Exclude<CardContainerBlock['variant'], 'steps'>, string> = {
  gallery: 'Galería educativa', info: 'Tarjetas informativas', comparison: 'Comparación',
};
export function isColumns(block?: Block): block is ColumnsBlock { return block?.type === 'columns' || block?.type === 'framedColumns'; }
export function childSlots(block?: Block): Column[] { return isGrid(block) ? block.rows.flatMap(row => row.cells) : isColumns(block) ? block.columns : []; }
function mapSlots(block: Block, update: (column: Column) => Column): Block {
  if (isGrid(block)) return { ...block, rows: block.rows.map(row => ({ ...row, cells: row.cells.map(cell => ({ ...cell, ...update(cell) })) })) };
  return isColumns(block) ? { ...block, columns: block.columns.map(update) } : block;
}
export function isContainer(block: Block) { return isGrid(block) || isColumns(block) || block.type === 'cardContainer' || block.type === 'textImage'; }
export function containerDepth(block: Block): number {
  return isGrid(block) || isColumns(block) ? 1 + Math.max(0, ...childSlots(block).flatMap(column => column.blocks.map(containerDepth))) : isContainer(block) ? 1 : 0;
}
export function allBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap<Block>(block => [block, ...childSlots(block).flatMap(column => allBlocks(column.blocks))]);
}
export function identifiedItems(blocks: Block[]): { id: string }[] {
  return allBlocks(blocks).flatMap<{ id: string }>(block => isGrid(block) ? [block, ...block.rows, ...childSlots(block)] : isColumns(block) ? [block, ...block.columns] : block.type === 'questions' ? [block, ...block.options, ...block.columns, ...block.items] : block.type === 'cardContainer' || block.type === 'steps' ? [block, ...block.items] : [block]);
}
/** Independent editable copy, including column, card and step identifiers. */
export function cloneBlock(block: Block): Block {
  const copy = structuredClone(block);
  const ids = new Map<string, string>();
  for (const item of identifiedItems([copy])) {
    const next = `item-${crypto.randomUUID()}`; ids.set(item.id, next); item.id = next;
  }
  remapTextFormatIds([copy], ids);
  return copy;
}
export function remapTextFormatIds(blocks: Block[], ids: Map<string, string>) {
  for (const block of allBlocks(blocks)) if (block.richText) {
    block.richText = Object.fromEntries(Object.entries(block.richText).map(([key, spans]) =>
      [key.split('/').map(part => ids.get(part) ?? part).join('/'), spans]));
  }
}
export function imageSources(blocks: Block[]): string[] {
  return allBlocks(blocks).flatMap(block => block.type === 'image' ? [block.src]
    : block.type === 'textImage' && block.image ? [block.image.src]
    : block.type === 'cardContainer' || block.type === 'steps' ? block.items.flatMap(item => item.image ? [item.image.src] : []) : []);
}
interface BlockLocation { siblings: Block[]; index: number; depth: number; parent?: ColumnsBlock | GridContainer; column?: Column }
export function blockLocation(blocks: Block[], id?: string, depth = 0, parent?: ColumnsBlock | GridContainer, column?: Column): BlockLocation | undefined {
  for (const [index, block] of blocks.entries()) {
    if (block.id === id) return { siblings: blocks, index, depth, parent, column };
    if (isGrid(block) || isColumns(block)) for (const childColumn of childSlots(block)) {
      const location = blockLocation(childColumn.blocks, id, depth + 1, block, childColumn);
      if (location) return location;
    }
  }
}
export function updateBlock(blocks: Block[], id: string | undefined, update: (block: Block) => Block): Block[] {
  return blocks.map(block => block.id === id ? update(block) : mapSlots(block, column => ({ ...column, blocks: updateBlock(column.blocks, id, update) })));
}
export function updateSiblings(blocks: Block[], columnId: string | undefined, update: (items: Block[]) => Block[]): Block[] {
  if (!columnId) return update(blocks);
  return blocks.map(block => mapSlots(block, column => ({ ...column, blocks: column.id === columnId ? update(column.blocks) : updateSiblings(column.blocks, columnId, update) })));
}
export function reorderBlock(blocks: Block[], id: string, targetId: string, after: boolean): Block[] {
  const source = blockLocation(blocks, id), target = blockLocation(blocks, targetId);
  if (!source || !target || source.siblings !== target.siblings || id === targetId) return blocks;
  const destination = target.index + (after ? 1 : 0) - (source.index < target.index + (after ? 1 : 0) ? 1 : 0);
  if (destination === source.index) return blocks;
  return updateSiblings(blocks, source.column?.id, items => {
    const next = [...items];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination, 0, moved);
    return next;
  });
}
/** Move to a sibling position or an empty child slot, preserving the original block. */
export function moveBlock(blocks: Block[], id: string, targetId: string, after: boolean, slot = false): Block[] {
  const source = blockLocation(blocks, id);
  if (!source || id === targetId) return blocks;
  const moved = source.siblings[source.index];
  const target = slot ? undefined : blockLocation(blocks, targetId);
  const owner = slot ? allBlocks(blocks).find(block => childSlots(block).some(child => child.id === targetId)) : target?.parent;
  const column = slot ? childSlots(owner).find(child => child.id === targetId) : target?.column;
  if (slot && (!owner || !column)) return blocks;
  if (!slot && !target) return blocks;
  if (owner && allBlocks([moved]).some(block => block.id === owner.id)) return blocks;
  const depth = slot ? (blockLocation(blocks, owner!.id)?.depth ?? 0) + 1 : target!.depth;
  if (depth + containerDepth(moved) > maxContainerDepth) return blocks;
  if (!slot && source.siblings === target!.siblings) return reorderBlock(blocks, id, targetId, after);
  const index = slot ? column!.blocks.length : target!.index + (after ? 1 : 0);
  const removed = updateSiblings(blocks, source.column?.id, items => items.filter(item => item.id !== id));
  return updateSiblings(removed, column?.id, items => {
    const next = [...items]; next.splice(index, 0, moved); return next;
  });
}
export function changeColumns(block: ColumnsBlock, layout: ColumnsBlock['layout']): ColumnsBlock {
  const count = Number(layout[0]);
  const columns = block.columns.slice(0, count).map(column => ({ ...column, blocks: [...column.blocks] }));
  for (const column of block.columns.slice(count)) columns[count - 1].blocks.push(...column.blocks);
  while (columns.length < count) columns.push({ id: `col-${crypto.randomUUID()}`, blocks: [] });
  return { ...block, layout, columns };
}
