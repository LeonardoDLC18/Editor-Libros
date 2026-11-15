import { useEffect, useRef, useState } from 'react';
import { analyzeImages, deleteUnusedImages, type ImageInventory } from '../services/book';
import './imageManager.css';

const size = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function ImageManager({ references, onClose }: { references: string[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [inventory, setInventory] = useState<ImageInventory>();
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentReferences = useRef(references);
  currentReferences.current = references;
  useEffect(() => {
    dialog.current?.showModal();
    let active = true;
    void analyzeImages(currentReferences.current).then(result => { if (active) setInventory(result); })
      .catch(error => { if (active) setError(error instanceof Error ? error.message : 'No se pudieron analizar las imágenes.'); });
    return () => { active = false; };
  }, []);
  const remove = async () => {
    const files = inventory?.unused.filter(item => selected.includes(item.src)) ?? [];
    if (busy || !files.length || !window.confirm(`Se eliminarán ${files.length} imágenes no utilizadas. Esta acción eliminará los archivos del proyecto. ¿Continuar?`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await deleteUnusedImages(files, currentReferences.current);
      setInventory(result); setSelected([]);
      setMessage(`Imágenes eliminadas: ${result.deleted.length}.${result.skipped.length ? ` Omitidas por seguridad: ${result.skipped.length}.` : ''}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron eliminar las imágenes.');
      // Refresh after a possible partial filesystem failure; do not offer a stale list.
      setSelected([]);
      try { setInventory(await analyzeImages(currentReferences.current)); } catch { setInventory(undefined); }
    } finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="image-manager" aria-labelledby="image-manager-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onKeyDown={event => event.stopPropagation()} onPaste={event => event.stopPropagation()}>
    <h2 id="image-manager-title">Imágenes</h2>
    <p>Se revisa el libro guardado y se protegen también las imágenes de los borradores abiertos y los recursos globales.</p>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!inventory && !error && <p role="status">Analizando imágenes…</p>}
    {inventory && <>
      <dl><dt>Total</dt><dd>{inventory.total}</dd><dt>En uso / protegidas</dt><dd>{inventory.used}</dd><dt>Sin usar</dt><dd>{inventory.unused.length}</dd><dt>Espacio recuperable</dt><dd>{size(inventory.recoverableBytes)}</dd></dl>
      {!review && <button className="button" disabled={!inventory.unused.length} onClick={() => setReview(true)}>Revisar imágenes sin usar</button>}
      {review && <>
        <label><input type="checkbox" disabled={busy || !inventory.unused.length} checked={!!inventory.unused.length && selected.length === inventory.unused.length}
          onChange={event => setSelected(event.target.checked ? inventory.unused.map(item => item.src) : [])} /> Seleccionar todas</label>
        <ul className="image-manager-list">{inventory.unused.map(item => <li key={item.src}><label>
          <input type="checkbox" disabled={busy} checked={selected.includes(item.src)} onChange={event => setSelected(previous => event.target.checked ? [...previous, item.src] : previous.filter(src => src !== item.src))} />
          <img src={`/${item.src}`} alt="" loading="lazy" />
          <span>{item.src.replace(/^assets\/images\//, '')}<small>{size(item.size)}</small></span>
        </label></li>)}</ul>
        <button className="button" disabled={busy || !selected.length} onClick={() => void remove()}>{busy ? 'Eliminando…' : 'Eliminar seleccionadas'}</button>
      </>}
    </>}
    <div className="image-manager-actions"><button className="button" disabled={busy} onClick={onClose}>Cerrar</button></div>
  </dialog>;
}
