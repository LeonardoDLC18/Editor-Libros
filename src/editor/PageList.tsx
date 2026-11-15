import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BookData, Page } from '../types/schema';
import { PageRenderer } from '../renderer/PageRenderer';
import { Icon } from '../components/Icon';
import { templateLabels } from '../utils/pageTemplate';

interface PageListProps {
  data: BookData; selectedId: string; dirtyIds: string[]; onSelect: (id: string) => void;
  busy: boolean; onCreate: (template: Page['template']) => Promise<boolean>;
  onDuplicate: (id: string) => void; onDelete: (id: string) => void; onMove: (delta: number) => void;
  onReorder: (ids: string[]) => void;
  canUndoOrder: boolean; canRedoOrder: boolean; onUndoOrder: () => void; onRedoOrder: () => void;
}
export function PageList({ data, selectedId, dirtyIds, onSelect, busy, onCreate, onDuplicate, onDelete, onMove, onReorder, canUndoOrder, canRedoOrder, onUndoOrder, onRedoOrder }: PageListProps) {
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState<Page['template']>('lesson');
  const [menu, setMenu] = useState<{ id: string; x: number; y: number }>();
  const menuRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const element = menuRef.current, rect = element.getBoundingClientRect();
    element.style.left = `${Math.max(0, Math.min(menu.x, window.innerWidth - rect.width))}px`;
    element.style.top = `${Math.max(0, Math.min(menu.y, window.innerHeight - rect.height))}px`;
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const outside = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(undefined); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(undefined); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', key); };
  }, [menu]);
  const sidebar = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLElement>(null);
  const revealCreated = useRef(false);
  useEffect(() => {
    if (!revealCreated.current) return;
    revealCreated.current = false;
    const panel = sidebar.current, item = list.current?.querySelector<HTMLElement>('.page-option.active');
    if (!panel || !item) return;
    const a = item.getBoundingClientRect(), b = panel.getBoundingClientRect();
    if (a.top < b.top || a.bottom > b.bottom) panel.scrollTo({ top: panel.scrollTop + (a.top < b.top ? a.top - b.top : a.bottom - b.bottom), behavior: 'smooth' });
  }, [selectedId]);
  const source = useRef<string | undefined>(undefined);
  const point = useRef({ x: 0, y: 0 });
  const [dragged, setDragged] = useState<string>();
  const [slot, setSlot] = useState<number>();
  const updateSlot = () => {
    const nav = list.current, panel = sidebar.current;
    if (!nav || !panel) return;
    const { x, y } = point.current, bounds = panel.getBoundingClientRect(), listBounds = nav.getBoundingClientRect();
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom || y < listBounds.top || y > listBounds.bottom) { setSlot(undefined); return; }
    const items = Array.from(nav.querySelectorAll<HTMLElement>('.page-option'));
    const target = items.findIndex(item => y < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2);
    setSlot(target < 0 ? items.length : target);
  };
  useEffect(() => {
    const panel = sidebar.current;
    if (!panel) return;
    let frame = 0, speed = 0;
    const stop = () => { speed = 0; cancelAnimationFrame(frame); frame = 0; };
    const tick = () => { if (!source.current || !speed) { stop(); return; } panel.scrollTop += speed; updateSlot(); frame = requestAnimationFrame(tick); };
    const over = (event: DragEvent) => {
      if (!source.current) return;
      point.current = { x: event.clientX, y: event.clientY };
      const rect = panel.getBoundingClientRect();
      speed = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
        ? event.clientY < rect.top + 50 ? -8 : event.clientY > rect.bottom - 50 ? 8 : 0 : 0;
      if (speed && !frame) frame = requestAnimationFrame(tick); else if (!speed) stop();
      updateSlot();
    };
    const scroll = () => { setMenu(undefined); if (source.current) updateSlot(); };
    document.addEventListener('dragover', over, true);
    document.addEventListener('dragend', stop, true);
    document.addEventListener('drop', stop, true);
    panel.addEventListener('scroll', scroll);
    return () => { stop(); document.removeEventListener('dragover', over, true); document.removeEventListener('dragend', stop, true); document.removeEventListener('drop', stop, true); panel.removeEventListener('scroll', scroll); };
  }, []);
  const index = data.book.pageOrder.findIndex(entry => entry.id === selectedId);
  return <aside className="page-sidebar" aria-label="Páginas del libro">
    <div ref={sidebar} className="page-sidebar-scroll">
    <div className="panel-heading"><h2>Páginas</h2><span className="count-badge">{data.pages.length}</span></div>
    <p className="panel-caption">Tu libro, página a página</p>
    <div className="page-management">
      <span className="section-label">Página seleccionada</span>
      <div className="page-actions">
        <button className="button" id="duplicate-page" disabled={busy} onClick={() => onDuplicate(selectedId)} title="Guarda los cambios pendientes de esta página y crea una copia">Duplicar</button>
        <button className="button" id="delete-page" disabled={busy || data.pages.length === 1} onClick={() => onDelete(selectedId)} title={data.pages.length === 1 ? 'Crea otra página antes de eliminar la última.' : 'Eliminar con respaldo'}>Eliminar</button>
        <button className="button" id="move-page-up" disabled={busy || index === 0} onClick={() => onMove(-1)}>↑ Subir</button>
        <button className="button" id="move-page-down" disabled={busy || index === data.pages.length - 1} onClick={() => onMove(1)}>↓ Bajar</button>
      </div>
      <div className="page-actions order-history"><button className="button" disabled={!canUndoOrder} onClick={onUndoOrder}>Deshacer orden</button><button className="button" disabled={!canRedoOrder} onClick={onRedoOrder}>Rehacer orden</button></div>
      <p className="management-note">Crear, duplicar y eliminar se guardan al ejecutarse; los cambios de orden se guardan con Guardar.{data.pages.length === 1 ? ' El libro necesita al menos una página.' : ''}</p>
    </div>
    <nav ref={list} className="page-list" onDragOver={event => { if (source.current) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }} onDrop={event => {
      if (!source.current) return;
      event.preventDefault();
      const ids = data.pages.map(page => page.id), from = ids.indexOf(source.current);
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('.page-option'));
      const found = items.findIndex(item => event.clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2);
      const target = found < 0 ? items.length : found;
      if (from >= 0) { const [id] = ids.splice(from, 1); ids.splice(target > from ? target - 1 : target, 0, id); onReorder(ids); }
      source.current = undefined; setDragged(undefined); setSlot(undefined);
    }} aria-label="Seleccionar página">
      {data.pages.map((page, index) => <button key={page.id} data-page-id={page.id} disabled={busy} draggable={!busy} className={`page-option${selectedId === page.id ? ' active' : ''}${dragged === page.id ? ' page-dragging' : ''}${slot === index ? ' page-insert-before' : ''}${slot === data.pages.length && index === data.pages.length - 1 ? ' page-insert-after' : ''}`}
        onContextMenu={event => { event.preventDefault(); setMenu({ id: page.id, x: event.clientX, y: event.clientY }); }}
        onDragStart={event => { setMenu(undefined); source.current = page.id; setDragged(page.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-editor-page', page.id); }}
        onDragEnd={() => { source.current = undefined; setDragged(undefined); setSlot(undefined); }} onClick={() => onSelect(page.id)} aria-current={selectedId === page.id ? 'page' : undefined}>
        <div className="thumbnail" aria-hidden="true"><div className="thumbnail-inner"><PageRenderer page={page} book={data.book} /></div></div>
        <div className="page-option-label"><span className="page-index">{String(index + 1).padStart(2, '0')}</span><div>{page.title?.trim() && <strong>{page.title}</strong>}<span>{templateLabels[page.template]}{dirtyIds.includes(page.id) ? ' · Sin guardar' : ''}</span></div></div>
      </button>)}
    </nav>
    <div className="sidebar-note"><Icon name="book" /><div><strong>Un libro local</strong><p>El contenido se carga desde los archivos de tu proyecto.</p></div></div>
    </div>
    <div className="page-create-sticky">
      <button className="button" id="new-page" disabled={busy} aria-expanded={creating} onClick={() => setCreating(!creating)}>+ Nueva página</button>
      {creating && <form className="new-page-form" onSubmit={async event => { event.preventDefault(); revealCreated.current = true; if (await onCreate(template)) setCreating(false); else revealCreated.current = false; }}>
        <label className="property-field" htmlFor="new-template">Plantilla inicial<select id="new-template" autoFocus value={template} disabled={busy} onChange={event => setTemplate(event.target.value as Page['template'])}>{(Object.keys(templateLabels) as Page['template'][]).map(value => <option key={value} value={value}>{templateLabels[value]}</option>)}</select></label>
        <div className="page-actions"><button className="button primary" type="submit" disabled={busy}>Crear</button><button className="button" type="button" disabled={busy} onClick={() => setCreating(false)}>Cancelar</button></div>
      </form>}
    </div>
    {menu && createPortal(<div ref={menuRef} className="page-context-menu" role="menu" style={{ left: menu.x, top: menu.y }}>
      <button role="menuitem" disabled={busy} onClick={() => { setMenu(undefined); onDuplicate(menu.id); }}>Duplicar</button>
      <button role="menuitem" disabled={busy || data.pages.length === 1} onClick={() => { setMenu(undefined); onDelete(menu.id); }}>Eliminar</button>
    </div>, document.body)}
  </aside>;
}

