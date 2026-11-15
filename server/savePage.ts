import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { idSchema, pageSchema, type Block, type EmbeddedImage, type Page } from '../src/types/schema';
import { allBlocks, identifiedItems, imageSources, isColumns } from '../src/utils/blocks';
import { defaultTheme } from '../src/utils/pageTemplate';
import { isGrid } from '../src/utils/grid';
import { ContentError, loadBook, projectRoot, safeFile } from './content';
import { atomicWrite, backupFile, contentOperation, exactFile, SaveError, writeLocations } from './storage';
export { SaveError } from './storage';

function mergeImage(current: EmbeddedImage | undefined, next: EmbeddedImage | undefined) {
  if (!next) return undefined;
  const image = { ...(current ?? next), src: next.src, alt: next.alt, caption: next.caption };
  if (image.caption === undefined) delete image.caption;
  return image;
}

export function savePage(id: string, input: unknown, root = projectRoot): Promise<Page> {
  return contentOperation(() => writePage(id, input, root));
}

async function writePage(id: string, input: unknown, root: string): Promise<Page> {
  if (!idSchema.safeParse(id).success || id.trim() !== id) {
    throw new SaveError(400, 'El identificador de página no es válido.');
  }
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) {
    throw new SaveError(422, parsed.error.issues.map((issue) =>
      `${issue.path.join('.') || 'Página'}: ${issue.code === 'invalid_union' ? 'Tipo de bloque o valor no admitido.' : issue.message}`,
    ).join('\n'));
  }
  const incoming = parsed.data;
  if (incoming.id !== id) throw new SaveError(422, 'El id del contenido no coincide con la página seleccionada.');
  const data = await loadBook(root);
  const entry = data.book.pageOrder.find((item) => item.id === id);
  const current = data.pages.find((page) => page.id === id);
  if (!entry || !current) throw new SaveError(404, 'La página no existe en el libro.');
  const usedIds = new Set(data.pages.filter(page => page.id !== id).flatMap(page => identifiedItems(page.blocks).map(item => item.id)));
  for (const block of identifiedItems(incoming.blocks)) {
    if (usedIds.has(block.id)) throw new SaveError(422, `Identificador de bloque duplicado: ${block.id}.`);
    usedIds.add(block.id);
  }
  for (const src of imageSources(incoming.blocks)) {
      try {
        const [folder, ...parts] = src.split('/');
        await safeFile(path.join(root, folder), parts.join('/'));
      } catch { throw new SaveError(422, `Imagen inexistente o fuera de su carpeta: ${src}.`); }
  }

  const previous = new Map(allBlocks(current.blocks).map(block => [block.id, block]));
  const reconcile = (next: Block): Block => {
      const block = previous.get(next.id);
      if (isGrid(next)) {
        if (block && block.type !== next.type) throw new SaveError(422, 'Conserva el tipo de los bloques existentes.');
        const oldRows = isGrid(block) ? block.rows : [];
        const oldCells = isGrid(block) ? block.rows.flatMap(row => row.cells) : isColumns(block) ? block.columns : [];
        return { ...(block ?? next), gap: next.gap, rows: next.rows.map(row => ({
          ...(oldRows.find(old => old.id === row.id) ?? row), layout: row.layout,
          cells: row.cells.map(cell => {
            const merged = { ...(oldCells.find(old => old.id === cell.id) ?? cell), column: cell.column,
              rowSpan: cell.rowSpan, verticalAlign: cell.verticalAlign, blocks: cell.blocks.map(reconcile) };
            if (merged.rowSpan === undefined) delete merged.rowSpan;
            if (merged.verticalAlign === undefined) delete merged.verticalAlign;
            return merged;
          }),
        })), ...(next.type === 'framedColumns' ? {
          columns: [], layout: next.layout, title: next.title, icon: next.icon, showIcon: next.showIcon,
          background: next.background, showBorder: next.showBorder, headerStyle: next.headerStyle,
        } : {}) } as Block;
      }
      if (isColumns(next)) {
        if (block && (!isColumns(block) || block.type !== next.type)) throw new SaveError(422, 'Conserva el tipo de los bloques existentes.');
        const merged = { ...(block ?? next), ...(next.type === 'framedColumns' ? {
          title: next.title, icon: next.icon, showIcon: next.showIcon, background: next.background,
          showBorder: next.showBorder, headerStyle: next.headerStyle,
        } : {}), layout: next.layout, columns: next.columns.map(column => {
          const old = block?.columns.find(item => item.id === column.id);
          return { ...(old ?? column), blocks: column.blocks.map(reconcile) };
        }) } as Block;
        // Undo can restore the legacy column form after a saved conversion.
        if (merged.type === 'framedColumns') { delete merged.rows; delete merged.gap; }
        return merged;
      }
      if (!block) {
        // Accept known, validated blocks, including text restored by undo after deletion.
        return next;
      }
      if (block.type !== next.type) throw new SaveError(422, 'Conserva el tipo de los bloques existentes.');
      if (block.type === 'separator' && next.type === 'separator') {
        return { ...block, size: next.size };
      }
      if ((block.type === 'heading' && next.type === 'heading') || (block.type === 'paragraph' && next.type === 'paragraph')) {
        return { ...block, text: next.text };
      }
      if (block.type === 'card' && next.type === 'card') {
        return { ...block, title: next.title, description: next.description };
      }
      if (block.type === 'infoCard' && next.type === 'infoCard') {
        return { ...block, title: next.title, content: next.content, layout: next.layout, icon: next.icon, contentSpans: next.contentSpans, ...(block.label !== undefined ? { label: next.label } : {}) };
      }
      if (block.type === 'image' && next.type === 'image') {
        return { ...block, src: next.src, alt: next.alt, heightMm: next.heightMm, fit: next.fit,
          caption: next.caption, widthPercent: next.widthPercent };
      }
      if (block.type === 'table' && next.type === 'table') {
        return { ...block, title: next.title, columns: next.columns, rows: next.rows };
      }
      if (block.type === 'code' && next.type === 'code') {
        return { ...block, title: next.title, language: next.language, content: next.content };
      }
      if (block.type === 'questions' && next.type === 'questions') return { ...block, mode: next.mode, title: next.title, options: next.options, columns: next.columns, items: next.items, numbered: next.numbered };
      if (block.type === 'steps' && next.type === 'steps') {
        return { ...block, title: next.title, items: next.items.map(item => ({
          ...(block.items.find(old => old.id === item.id) ?? item), content: item.content,
        })) };
      }
      if (block.type === 'textImage' && next.type === 'textImage') {
        return { ...block, title: next.title, text: next.text, layout: next.layout, imageWidth: next.imageWidth, fit: next.fit,
          image: mergeImage(block.image, next.image) };
      }
      if (block.type === 'cardContainer' && next.type === 'cardContainer') {
        return { ...block, title: next.title, icon: next.icon, variant: next.variant, columns: next.columns, imageSize: next.imageSize, imageFit: next.imageFit,
          items: next.items.map(item => {
            const old = block.items.find(previous => previous.id === item.id);
            const updated = { ...(old ?? item), title: item.title, description: item.description, icon: item.icon, step: item.step, image: mergeImage(old?.image, item.image) };
            for (const key of ['icon', 'step', 'image'] as const) if (updated[key] === undefined) delete updated[key];
            return updated;
          }) };
      }
      return block;
  };
  const updated: Page = {
    ...current, title: incoming.title, template: incoming.template,
    subtitle: incoming.subtitle, titleStyle: incoming.titleStyle, titleSecondary: incoming.titleSecondary,
    richText: incoming.richText,
    blocks: incoming.blocks.map(reconcile),
  };
  for (const key of ['title', 'subtitle', 'titleStyle', 'titleSecondary', 'richText'] as const) {
    if (updated[key] === undefined) delete updated[key];
  }
  // Only structured inline marks are editable in addition to the existing fields.
  for (const block of allBlocks(updated.blocks)) {
    const next = allBlocks(incoming.blocks).find(item => item.id === block.id)!;
    if (next.richText === undefined) delete block.richText;
    else block.richText = next.richText;
  }
  // Only the minimal template defaults may be added/removed. Removing a default
  // supports undo after saving a template change; authored fields stay intact.
  for (const [field, fallback] of [['theme', defaultTheme]] as const) {
    if (isDeepStrictEqual(current[field] ?? fallback, incoming[field] ?? fallback)) {
      if (incoming[field] === undefined) delete updated[field];
      else Object.assign(updated, { [field]: incoming[field] });
    }
  }
  // Optional fields removed in the editor must also disappear on disk.
  for (const block of allBlocks(updated.blocks)) for (const key of Object.keys(block)) if (block[key] === undefined) delete block[key];
  if (!isDeepStrictEqual(updated, incoming)) {
    throw new SaveError(422, 'Solo se pueden modificar los campos editables de página y bloques. Conserva los demás campos.');
  }
  // Validating against the current book above also preserves global block ids and references.
  const valid = pageSchema.safeParse(updated);
  if (!valid.success) throw new ContentError(valid.error.issues.map((issue) => issue.message));
  const locations = await writeLocations(root);
  const file = await exactFile(locations.pages, entry.file.slice('pages/'.length));
  await backupFile(file, locations.backups, id);
  await atomicWrite(file, valid.data);
  return valid.data;
}
