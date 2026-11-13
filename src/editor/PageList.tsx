import { useState } from 'react';
import type { BookData, Page } from '../types/schema';
import { PageRenderer } from '../renderer/PageRenderer';
import { Icon } from '../components/Icon';
import { templateLabels } from '../utils/pageTemplate';

interface PageListProps {
  data: BookData; selectedId: string; dirtyIds: string[]; onSelect: (id: string) => void;
  busy: boolean; onCreate: (template: Page['template']) => Promise<boolean>;
  onDuplicate: () => void; onDelete: () => void; onMove: (delta: number) => void;
  canUndoOrder: boolean; canRedoOrder: boolean; onUndoOrder: () => void; onRedoOrder: () => void;
}
export function PageList({ data, selectedId, dirtyIds, onSelect, busy, onCreate, onDuplicate, onDelete, onMove, canUndoOrder, canRedoOrder, onUndoOrder, onRedoOrder }: PageListProps) {
  const [creating, setCreating] = useState(false);
  const [template, setTemplate] = useState<Page['template']>('lesson');
  const index = data.book.pageOrder.findIndex(entry => entry.id === selectedId);
  return <aside className="page-sidebar" aria-label="Páginas del libro">
    <div className="panel-heading"><h2>Páginas</h2><span className="count-badge">{data.pages.length}</span></div>
    <p className="panel-caption">Tu libro, página a página</p>
    <div className="page-management">
      <button className="button" id="new-page" disabled={busy} aria-expanded={creating} onClick={() => setCreating(!creating)}>+ Nueva página</button>
      {creating && <form className="new-page-form" onSubmit={async event => { event.preventDefault(); if (await onCreate(template)) setCreating(false); }}>
        <label className="property-field" htmlFor="new-template">Plantilla inicial<select id="new-template" autoFocus value={template} disabled={busy} onChange={event => setTemplate(event.target.value as Page['template'])}>{(Object.keys(templateLabels) as Page['template'][]).map(value => <option key={value} value={value}>{templateLabels[value]}</option>)}</select></label>
        <div className="page-actions"><button className="button primary" type="submit" disabled={busy}>Crear</button><button className="button" type="button" disabled={busy} onClick={() => setCreating(false)}>Cancelar</button></div>
      </form>}
      <span className="section-label">Página seleccionada</span>
      <div className="page-actions">
        <button className="button" id="duplicate-page" disabled={busy} onClick={onDuplicate} title="Guarda los cambios pendientes de esta página y crea una copia">Duplicar</button>
        <button className="button" id="delete-page" disabled={busy || data.pages.length === 1} onClick={onDelete} title={data.pages.length === 1 ? 'Crea otra página antes de eliminar la última.' : 'Eliminar con respaldo'}>Eliminar</button>
        <button className="button" id="move-page-up" disabled={busy || index === 0} onClick={() => onMove(-1)}>↑ Subir</button>
        <button className="button" id="move-page-down" disabled={busy || index === data.pages.length - 1} onClick={() => onMove(1)}>↓ Bajar</button>
      </div>
      <div className="page-actions order-history"><button className="button" disabled={!canUndoOrder} onClick={onUndoOrder}>Deshacer orden</button><button className="button" disabled={!canRedoOrder} onClick={onRedoOrder}>Rehacer orden</button></div>
      <p className="management-note">Estas acciones se guardan al ejecutarse.{data.pages.length === 1 ? ' El libro necesita al menos una página.' : ''}</p>
    </div>
    <nav className="page-list" aria-label="Seleccionar página">
      {data.pages.map((page, index) => <button key={page.id} data-page-id={page.id} disabled={busy} className={`page-option${selectedId === page.id ? ' active' : ''}`} onClick={() => onSelect(page.id)} aria-current={selectedId === page.id ? 'page' : undefined}>
        <div className="thumbnail" aria-hidden="true"><div className="thumbnail-inner"><PageRenderer page={page} book={data.book} /></div></div>
        <div className="page-option-label"><span className="page-index">{String(index + 1).padStart(2, '0')}</span><div>{page.title?.trim() && <strong>{page.title}</strong>}<span>{templateLabels[page.template]}{dirtyIds.includes(page.id) ? ' · Sin guardar' : ''}</span></div></div>
      </button>)}
    </nav>
    <div className="sidebar-note"><Icon name="book" /><div><strong>Un libro local</strong><p>El contenido se carga desde los archivos de tu proyecto.</p></div></div>
  </aside>;
}
