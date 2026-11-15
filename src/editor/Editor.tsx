import { reorderColumn, sideDrop } from '../utils/structuralDrag';
import { SelectionPath } from './SelectionPath';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Block, BookData, Page, PageOperationResult } from '../types/schema';
import { Icon } from '../components/Icon';
import { PageRenderer } from '../renderer/PageRenderer';
import { usePageScale } from '../hooks/usePageScale';
import { usePageEditing } from '../hooks/usePageEditing';
import { designTokens } from '../utils/designTokens';
import { PageList } from './PageList';
import { Properties } from './Properties';
import { allBlocks, blockLocation, childSlots, moveBlock, updateBlock } from '../utils/blocks';
import { InlineEditingContext } from '../renderer/InlineText';
import { BlockDragContext } from '../renderer/BlockDrag';
import { ImageManager } from './ImageManager';
import { imageSources } from '../utils/blocks';

export function Editor({ data }: { data: BookData }) {
  const [pageId, setPageId] = useState(data.pages[0].id);
  const [clipboard, setClipboard] = useState<Block>();
  const [blockId, setBlockId] = useState<string>();
  const [preview, setPreview] = useState(false);
  const [zoom, setZoom] = useState('1');
  const [uploading, setUploading] = useState(false);
  const [managingImages, setManagingImages] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const editing = usePageEditing(data, pageId, uploading);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && !event.isComposing && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (editing.canSave) void editing.save();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing.canSave, editing.save]);
  const liveData = { ...data, book: editing.book, pages: editing.pages };
  const { ref, fit } = usePageScale(data.design.page.widthMm, data.design.page.heightMm);
  const scale = zoom === 'fit' ? fit : Number(zoom);
  const zoomAnchor = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const dragSource = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    const canvas = ref.current;
    const anchor = zoomAnchor.current;
    const stage = canvas?.querySelector('.page-stage');
    if (!canvas || !anchor || !stage) return;
    const rect = stage.getBoundingClientRect();
    canvas.scrollLeft += rect.left + anchor.x * scale - anchor.clientX;
    canvas.scrollTop += rect.top + anchor.y * scale - anchor.clientY;
    zoomAnchor.current = null;
  }, [ref, scale]);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      if (dragSource.current && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        canvas.scrollTop += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
        return;
      }
      if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) return;
      event.preventDefault();
      const percent = Math.round(scale * 100 / 5) * 5;
      const next = Math.max(50, Math.min(150, percent + (event.deltaY < 0 ? 5 : -5))) / 100;
      if (next === scale) return;
      const stage = canvas.querySelector('.page-stage');
      if (stage) {
        const rect = stage.getBoundingClientRect();
        zoomAnchor.current = { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale, clientX: event.clientX, clientY: event.clientY };
      }
      setZoom(String(next));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [ref, scale]);
  const index = Math.max(0, editing.book.pageOrder.findIndex((entry) => entry.id === pageId));
  const page = editing.page;
  const [dragMarker, setDragMarker] = useState<{ id: string; after: boolean; side?: boolean }>();
  const [dragging, setDragging] = useState(false);
  const structuralMove = (id: string, after: boolean, column: boolean, commit: boolean) => {
    const source = dragSource.current;
    const operation = column ? reorderColumn : sideDrop;
    const valid = !!source && operation(page.blocks, source, id, after) !== page.blocks;
    if (commit) {
      if (source) editing.change(current => { const blocks = operation(current.blocks, source, id, after); return blocks === current.blocks ? current : { ...current, blocks }; });
      dragSource.current = undefined; setDragging(false); setDragMarker(undefined);
    } else setDragMarker(valid ? { id, after, side: true } : undefined);
    return valid;
  };
  const drag = {
    sideOver: (id: string, after: boolean) => structuralMove(id, after, false, false),
    sideDrop: (id: string, after: boolean) => { structuralMove(id, after, false, true); },
    columnOver: (id: string, after: boolean) => structuralMove(id, after, true, false),
    columnDrop: (id: string, after: boolean) => { structuralMove(id, after, true, true); },
    active: dragging,
    marker: dragMarker,
    start: (id: string) => { dragSource.current = id; setDragging(true); setBlockId(id); },
    over: (id: string, after: boolean) => {
      const source = blockLocation(page.blocks, dragSource.current), target = blockLocation(page.blocks, id);
      const valid = !!dragSource.current && !!source && !!target && moveBlock(page.blocks, dragSource.current, id, after) !== page.blocks;
      setDragMarker(previous => valid ? previous?.id === id && previous.after === after ? previous : { id, after } : undefined);
      return valid;
    },
    drop: (id: string, after: boolean) => {
      const source = dragSource.current;
      if (source) editing.change(current => {
        const blocks = moveBlock(current.blocks, source, id, after);
        return blocks === current.blocks ? current : { ...current, blocks };
      });
      dragSource.current = undefined; setDragging(false); setDragMarker(undefined);
    },
    canSlot: (id: string) => !!dragSource.current && moveBlock(page.blocks, dragSource.current, id, false, true) !== page.blocks,
    overSlot: (id: string) => {
      const valid = !!dragSource.current && moveBlock(page.blocks, dragSource.current, id, false, true) !== page.blocks;
      setDragMarker(undefined);
      return valid;
    },
    dropSlot: (id: string) => {
      const source = dragSource.current;
      if (source) editing.change(current => {
        const blocks = moveBlock(current.blocks, source, id, false, true);
        return blocks === current.blocks ? current : { ...current, blocks };
      });
      dragSource.current = undefined; setDragging(false); setDragMarker(undefined);
    },
    end: () => { dragSource.current = undefined; setDragging(false); setDragMarker(undefined); },
  };
  const dragOver = useRef(drag.over);
  dragOver.current = drag.over;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let frame = 0;
    let x = 0, y = 0, speed = 0;
    const stop = () => { speed = 0; cancelAnimationFrame(frame); frame = 0; };
    const updateMarker = () => {
      const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('.content-block[data-block-id]');
      if (!element || !canvas.contains(element)) { setDragMarker(undefined); return; }
      const rect = element.getBoundingClientRect();
      dragOver.current(element.dataset.blockId!, y >= rect.top + rect.height / 2);
    };
    const tick = () => {
      if (!dragSource.current || !speed) { stop(); return; }
      canvas.scrollTop += speed;
      updateMarker();
      frame = requestAnimationFrame(tick);
    };
    const onDragOver = (event: DragEvent) => {
      if (!dragSource.current) return;
      x = event.clientX; y = event.clientY;
      const rect = canvas.getBoundingClientRect();
      speed = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
        ? y < rect.top + 50 ? -8 : y > rect.bottom - 50 ? 8 : 0 : 0;
      if (speed && !frame) frame = requestAnimationFrame(tick);
      else if (!speed) stop();
    };
    const onScroll = () => { if (dragSource.current) updateMarker(); };
    const onDragLeave = (event: DragEvent) => { if (!event.relatedTarget) stop(); };
    document.addEventListener('dragover', onDragOver, true);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragend', stop, true);
    document.addEventListener('drop', stop, true);
    canvas.addEventListener('scroll', onScroll);
    return () => {
      stop();
      document.removeEventListener('dragover', onDragOver, true);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragend', stop, true);
      document.removeEventListener('drop', stop, true);
      canvas.removeEventListener('scroll', onScroll);
    };
  }, [ref]);

  console.table(
  data.pages.map((page, index) => ({
    numero: index + 1,
    id: page.id,
    titulo: page.title
  }))
);

  const block = allBlocks(page.blocks).find((item) => item.id === blockId || childSlots(item).some(column => column.id === blockId) || (item.type === 'cardContainer' && item.items.some(card => card.id === blockId)));
  const selectPage = (id: string) => { if (!uploading) { setPageId(id); setBlockId(undefined); } };
  const selectResult = (result?: PageOperationResult) => { if (result?.selectedId) selectPage(result.selectedId); };
  const createPage = async (template: Page['template']) => {
    const result = await editing.create(template); selectResult(result); return !!result;
  };
  const removePage = async (id = pageId) => {
    const target = editing.pages.find(item => item.id === id);
    if (!target) return;
    const pending = editing.dirtyIds.includes(id) ? ' Los cambios sin guardar de esta página se descartarán; el respaldo contiene su última versión guardada.' : '';
    if (window.confirm(`¿Seguro que deseas eliminar «${page.title}»? Esta acción puede recuperarse desde el respaldo.${pending}`)) selectResult(await editing.remove());
  };
  const editCell = (id: string, row: number, column: number, value: string) => editing.change(current => ({
    ...current, blocks: updateBlock(current.blocks, id, block => block.type === 'table' ? {
      ...block,
      columns: row < 0 ? block.columns.map((cell, index) => index === column ? value : cell) : block.columns,
      rows: row < 0 ? block.rows : block.rows.map((cells, index) => index === row ? cells.map((cell, c) => c === column ? value : cell) : cells),
    } : block),
  }));
  return <div className={`editor-shell${preview ? ' preview-mode' : ''}`} style={designTokens(data.design)}>
    <header className="topbar">
      <div className="app-brand"><span className="app-logo"><Icon name="book" size={23} /></span><div><h1>{data.book.book.title}</h1><span>Editor de libros <span className="brand-separator">/</span> {data.book.book.grade}</span></div></div>
      <div className="topbar-actions">
        <span className={`local-state${editing.error ? ' save-error' : ''}`} role="status" aria-live="polite"><span className="status-dot" />{editing.status}</span>
        <button className="button history-button" aria-label="Deshacer" title="Deshacer (Ctrl+Z)" disabled={!editing.canUndo} onClick={editing.undo}><Icon name="undo" /></button>
        <button className="button history-button" aria-label="Rehacer" title="Rehacer (Ctrl+Y / Ctrl+Mayús+Z)" disabled={!editing.canRedo} onClick={editing.redo}><Icon name="redo" /></button>
        <button className="button save-button" disabled={!editing.canSave} title="Guardar todos los cambios" onClick={editing.save}><Icon name="save" />{editing.saving ? 'Guardando...' : 'Guardar'}</button>
        {!preview && <button className="button" disabled={editing.busy} onClick={() => setManagingImages(true)}>Administrar imágenes</button>}
        <button className={`button${preview ? ' selected' : ''}`} aria-pressed={preview} onClick={() => setPreview(!preview)}><Icon name={preview ? 'close' : 'eye'} />{preview ? 'Volver al editor' : 'Vista previa'}</button>
        <button className="button primary" onClick={() => window.print()} title="Imprimir el libro completo o guardar como PDF"><Icon name="print" />Imprimir</button>
      </div>
    </header>
    <div className="workspace">
      {!preview && <PageList data={liveData} selectedId={page.id} dirtyIds={editing.dirtyIds} onSelect={selectPage}
        busy={editing.busy} onCreate={createPage} onDuplicate={async id => selectResult(await editing.duplicate(id))} onDelete={removePage}
        onMove={editing.move} onReorder={editing.reorder} canUndoOrder={editing.canUndoOrder} canRedoOrder={editing.canRedoOrder} onUndoOrder={editing.undoOrder} onRedoOrder={editing.redoOrder} />}
      <main className="work-area" aria-label={preview ? 'Vista previa del libro' : 'Lienzo del editor'}>
        <div className="canvas-toolbar"><div className="canvas-context"><Icon name={preview ? 'eye' : 'page'} /><span>{preview ? 'Vista previa' : 'Lienzo'} <span className="toolbar-slash">/</span> <strong>{page.title}</strong></span></div>
          <div className="zoom-control"><label htmlFor="zoom">Zoom</label><select id="zoom" value={zoom} onChange={(event) => setZoom(event.target.value)}><option value="fit">Ajustar · {Math.round(fit * 100)} %</option>{Array.from({ length: 21 }, (_, i) => 50 + i * 5).map(percent => <option key={percent} value={String(percent / 100)}>{percent} %</option>)}</select></div>
        </div>
        {!preview && <SelectionPath blocks={page.blocks} selectedId={blockId} onSelect={setBlockId} />}
        {editing.error && <div className="notice save-error" role="alert"><Icon name="info" /><span>{editing.error}</span></div>}
        {overflow && <div className="notice" role="status"><Icon name="info" /><span>El contenido excede una página A4. Abrevia o divide el contenido antes de imprimir; todo el texto permanece visible.</span></div>}
        <div className="canvas" ref={ref} onClick={preview || uploading ? undefined : () => setBlockId(undefined)}>
          <div className="page-stage" style={{ '--page-scale': scale } as CSSProperties}>
            <div className="page-transform"><BlockDragContext.Provider value={preview || uploading || editing.structural ? undefined : drag}><InlineEditingContext.Provider value={preview || uploading || editing.structural ? undefined : { change: editing.change, select: setBlockId }}><PageRenderer page={page} book={editing.book} selectedBlock={preview ? undefined : blockId} onSelectBlock={preview || uploading ? undefined : setBlockId} onEditCell={preview || editing.busy ? undefined : editCell} onOverflow={setOverflow} /></InlineEditingContext.Provider></BlockDragContext.Provider></div>
          </div>
        </div>
        <div className="canvas-bottom"><span>{preview ? 'Vista de lectura' : 'Selecciona un bloque para editarlo'}</span><div className="page-navigation">
          <button aria-label="Página anterior" disabled={index === 0 || editing.structural} onClick={() => selectPage(editing.pages[index - 1].id)}><Icon name="left" /></button>
          <span>Página <strong>{index + 1}</strong> de {editing.pages.length}</span>
          <button aria-label="Página siguiente" disabled={index === editing.pages.length - 1 || editing.structural} onClick={() => selectPage(editing.pages[index + 1].id)}><Icon name="right" /></button>
        </div></div>
      </main>
      {!preview && <Properties key={page.id} clipboard={clipboard} onCopy={setClipboard} selectedId={blockId} page={page} block={block} onChange={editing.change} disabled={editing.structural || uploading} onSelectBlock={setBlockId} onUploadBusy={setUploading} book={editing.book} onNumberingChange={editing.setNumbering} numberingDisabled={editing.busy} />}
    </div>
    <footer className="editor-status"><span><Icon name="check" size={14} />{editing.status}{editing.dirtyIds.length > 0 ? ` · ${editing.dirtyIds.length} página(s) pendiente(s)` : ''}</span><span>Columnas, mixtos y tarjetas<span className="status-divider">|</span>A4 vertical</span></footer>
    <div className="print-book">{editing.pages.map(item => <PageRenderer key={item.id} page={item} book={editing.book} />)}</div>
    {managingImages && <ImageManager references={[...editing.pages.flatMap(item => imageSources(item.blocks)), ...(clipboard ? imageSources([clipboard]) : [])]} onClose={() => setManagingImages(false)} />}
  </div>;
}
