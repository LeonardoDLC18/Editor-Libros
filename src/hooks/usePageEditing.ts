import { useEffect, useRef, useState } from 'react';
import type { BookData, BookNumbering, Page, PageOperationResult } from '../types/schema';
import * as api from '../services/book';

interface Draft {
  page: Page;
  saved: Page;
  past: Page[];
  future: Page[];
  error: string;
}
const same = (a: Page, b: Page) => JSON.stringify(a) === JSON.stringify(b);
const draftFor = (page: Page): Draft => ({ page, saved: page, past: [], future: [], error: '' });
const limit = 30;

export function usePageEditing(initial: BookData, pageId: string, uploading = false) {
  const [book, setBook] = useState(initial.book);
  const [savedOrder, setSavedOrder] = useState(() => initial.book.pageOrder.map(entry => entry.id));
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(initial.pages.map(page => [page.id, draftFor(page)])));
  const [saving, setSaving] = useState<string>();
  const [structural, setStructural] = useState(false);
  const [structureError, setStructureError] = useState('');
  const [orderHistory, setOrderHistory] = useState<{ past: string[][]; future: string[][] }>({ past: [], future: [] });
  const inFlight = useRef(false);
  const structureFlight = useRef(false);
  const current = drafts[pageId] || drafts[book.pageOrder[0].id];
  const pages = book.pageOrder.map(({ id }) => drafts[id].page);
  const dirtyIds = pages.filter(({ id }) => !same(drafts[id].page, drafts[id].saved)).map(({ id }) => id);
  const orderDirty = JSON.stringify(book.pageOrder.map(entry => entry.id)) !== JSON.stringify(savedOrder);
  const dirty = dirtyIds.length > 0 || orderDirty;
  const change = (update: (page: Page) => Page) => {
    if (structureFlight.current) return;
    setDrafts((all) => {
      const draft = all[pageId];
      const page = update(draft.page);
      if (same(page, draft.page)) return all;
      return { ...all, [pageId]: { ...draft, page, past: [...draft.past, draft.page].slice(-limit), future: [], error: '' } };
    });
  };
  const travel = (direction: 'past' | 'future') => {
    if (structureFlight.current || uploading) return;
    setDrafts((all) => {
      const draft = all[pageId];
      const page = draft?.[direction].at(-1);
      if (!page) return all;
      const other = direction === 'past' ? 'future' : 'past';
      return { ...all, [pageId]: { ...draft, page, [direction]: draft[direction].slice(0, -1), [other]: [...draft[other], draft.page].slice(-limit), error: '' } };
    });
  };

  useEffect(() => {
    if (!dirty && !saving && !structural && !uploading) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving, structural, uploading]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.isComposing) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      event.preventDefault();
      travel(key === 'y' || event.shiftKey ? 'future' : 'past');
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [pageId, uploading]);

  const persist = async (id: string, globalSave = false) => {
    const snapshot = drafts[id].page;
    if (!globalSave) setSaving(id);
    setDrafts(all => ({ ...all, [id]: { ...all[id], error: '' } }));
    try {
      const saved = await api.savePage(snapshot);
      setDrafts(all => ({ ...all, [id]: {
        ...all[id], saved,
        // Edits made while a text save is in flight remain unsaved.
        page: same(all[id].page, snapshot) ? saved : all[id].page, error: '',
      } }));
    } catch (error) {
      setDrafts(all => ({ ...all, [id]: { ...all[id], error: error instanceof Error ? error.message : 'No se pudo guardar la página.' } }));
      throw error;
    } finally { if (!globalSave) setSaving(undefined); }
  };
  const save = async () => {
    if (inFlight.current || uploading || !dirty) return;
    inFlight.current = true;
    setSaving('all');
    try {
      if (orderDirty) {
        const ids = book.pageOrder.map(entry => entry.id);
        try { await api.reorderPages(ids); setSavedOrder(ids); setStructureError(''); }
        catch (error) { setStructureError(error instanceof Error ? error.message : 'No se pudo guardar el orden.'); }
      }
      for (const id of dirtyIds) {
        try { await persist(id, true); } catch { /* Keep failed drafts for retry. */ }
      }
    } finally { inFlight.current = false; setSaving(undefined); }
  };

  const structure = async (run: () => Promise<PageOperationResult>, resetsOrder = true) => {
    if (inFlight.current || uploading) return;
    inFlight.current = true; structureFlight.current = true;
    setStructural(true); setStructureError('');
    try {
      const result = await run();
      setDrafts(all => Object.fromEntries(result.pages.map(page => [page.id,
        all[page.id] || draftFor(page),
      ])));
      const serverOrder = result.book.pageOrder;
      const localOrder = book.pageOrder.filter(entry => serverOrder.some(saved => saved.id === entry.id));
      for (const [index, entry] of serverOrder.entries()) {
        if (localOrder.some(current => current.id === entry.id)) continue;
        const previous = serverOrder.slice(0, index).reverse().find(saved => localOrder.some(current => current.id === saved.id));
        const position = previous ? localOrder.findIndex(current => current.id === previous.id) + 1 : 0;
        localOrder.splice(position, 0, entry);
      }
      setBook({ ...result.book, pageOrder: localOrder });
      setSavedOrder(serverOrder.map(entry => entry.id));
      if (resetsOrder) setOrderHistory({ past: [], future: [] });
      return result;
    } catch (error) {
      setBook(book);
      setStructureError(error instanceof Error ? error.message : 'No se pudo guardar el cambio de páginas.');
    } finally {
      inFlight.current = false; structureFlight.current = false; setStructural(false);
    }
  };
  const order = (ids: string[], direction?: 'past' | 'future') => {
    if (inFlight.current || uploading) return;
    const previous = book.pageOrder.map(entry => entry.id);
    if (ids.length !== previous.length || new Set(ids).size !== previous.length || ids.some(id => !previous.includes(id)) || ids.every((id, i) => id === previous[i])) return;
    setBook({ ...book, pageOrder: ids.map(id => book.pageOrder.find(entry => entry.id === id)!) });
    setStructureError('');
    setOrderHistory(history => direction ? {
      ...history,
      [direction]: history[direction].slice(0, -1),
      [direction === 'past' ? 'future' : 'past']: [...history[direction === 'past' ? 'future' : 'past'], previous].slice(-limit),
    } : { past: [...history.past, previous].slice(-limit), future: [] });
  };
  const move = (delta: number) => {
    const ids = book.pageOrder.map(entry => entry.id);
    const index = ids.indexOf(pageId), next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    return order(ids);
  };
  const busy = !!saving || structural || uploading;
  const hasError = !!structureError || Object.values(drafts).some(draft => !!draft.error);
  const status = uploading ? 'Subiendo imagen...' : busy ? 'Guardando...' : hasError ? 'Error al guardar' : dirty ? 'Cambios sin guardar' : 'Guardado';
  return {
    book, pages, page: current.page, dirtyIds, status, saving, busy, structural,
    error: structureError || Object.entries(drafts).filter(([, draft]) => draft.error).map(([id, draft]) => `${draft.page.title || id} (${id}): ${draft.error}`).join('\n'), canSave: !busy && dirty,
    canUndo: !structural && !uploading && current.past.length > 0, canRedo: !structural && !uploading && current.future.length > 0,
    change, save, undo: () => travel('past'), redo: () => travel('future'),
    create: (template: Page['template']) => structure(() => api.createPage(template)),
    duplicate: (id = pageId) => structure(async () => {
      if (dirtyIds.includes(id)) await persist(id);
      return api.duplicatePage(id);
    }),
    remove: (id = pageId) => structure(() => api.deletePage(id)), move, reorder: order,
    setNumbering: (numbering: BookNumbering) => structure(() => api.saveBookNumbering(numbering), false),
    canUndoOrder: !busy && orderHistory.past.length > 0,
    canRedoOrder: !busy && orderHistory.future.length > 0,
    undoOrder: () => { const ids = orderHistory.past.at(-1); if (ids) void order(ids, 'past'); },
    redoOrder: () => { const ids = orderHistory.future.at(-1); if (ids) void order(ids, 'future'); },
  };
}
