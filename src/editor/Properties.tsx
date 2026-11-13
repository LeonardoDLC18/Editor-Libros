import { useState } from 'react';
import type { Block, Book, BookNumbering, ColumnsBlock, Page } from '../types/schema';
import { maxContainerDepth, nestingMessage } from '../utils/blocks';
import { BlockPicker } from './BlockPicker';
import { blockLabels } from '../renderer/BlockRenderer';
import { Icon } from '../components/Icon';
import { changeTemplate, templateLabels } from '../utils/pageTemplate';
import { uploadImage } from '../services/book';
import { TableProperties } from './TableProperties';
import { CodeProperties } from './CodeProperties';
import { QuestionsProperties } from './QuestionsProperties';
import { StepsProperties } from './StepsProperties';
import { FormattedTextField } from './FormattedTextField';
import { stepText } from '../utils/steps';
import { cloneBlock } from '../utils/blocks';
import { childSlots } from '../utils/blocks';
import { isGrid, newGridRow } from '../utils/grid';
import { GridProperties } from './GridProperties';
import { TextImageProperties } from './TextImageProperties';
import { CardContainerProperties, IconField } from './CardContainerProperties';
import { allBlocks, blockLocation, changeColumns, columnLayoutLabels, containerDepth, isColumns, isContainer, updateBlock as updateTreeBlock, updateSiblings } from '../utils/blocks';

const columnLayouts = Object.keys(columnLayoutLabels) as ColumnsBlock['layout'][];

export function Properties({ page, block, onChange, disabled, onSelectBlock, onUploadBusy, book, onNumberingChange, numberingDisabled, selectedId, clipboard, onCopy }: {
  clipboard?: Block; onCopy: (block: Block) => void;
  selectedId?: string;
  page: Page; block?: Block; onChange: (update: (page: Page) => Page) => void; disabled: boolean;
  onSelectBlock: (id?: string) => void; onUploadBusy: (busy: boolean) => void;
  book: Book; onNumberingChange: (numbering: BookNumbering) => void; numberingDisabled: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const location = blockLocation(page.blocks, block?.id);
  const selectedCard = block?.type === 'cardContainer' ? block.items.find(item => item.id === selectedId) : undefined;
  const selectedColumn = childSlots(block).find(column => column.id === selectedId);
  const insertColumn = selectedColumn ?? location?.column;
  const insertParent = selectedColumn ? block : location?.parent;
  const updateBlock = (update: (item: Block) => Block) => {
    onChange(current => ({ ...current, blocks: updateTreeBlock(current.blocks, block?.id, update) }));
  };
  const editBlock = (field: string, value: string | number | boolean | undefined) => {
    updateBlock(item => { const next = { ...item, [field]: value }; if (value === undefined) delete next[field]; return next; });
  };
  const insert = (next: Block) => {
    const depth = insertColumn ? (location?.depth ?? 0) + (selectedColumn ? 1 : 0) : 0;
    if (depth + containerDepth(next) > maxContainerDepth) { setUploadError(nestingMessage); return; }
    setUploadError('');
    onChange(current => ({ ...current, blocks: updateSiblings(current.blocks, insertColumn?.id, items => {
      const blocks = [...items];
      const index = blocks.findIndex(item => item.id === block?.id);
      blocks.splice(index < 0 ? blocks.length : index + 1, 0, next);
      return blocks;
    }) }));
    onSelectBlock(next.id); setAdding(false);
  };
  const imageFile = async (file: File | undefined, replace: boolean | ((src: string, alt: string) => void)) => {
    if (!file || uploading) return;
    setUploading(true); onUploadBusy(true); setUploadError('');
    try {
      const src = await uploadImage(file);
      if (typeof replace === 'function') replace(src, file.name.replace(/\.[^.]+$/, '') || 'Imagen');
      else if (replace) editBlock('src', src);
      else insert({ id: `image-${crypto.randomUUID()}`, type: 'image', src, alt: file.name.replace(/\.[^.]+$/, '') || 'Imagen', heightMm: 55, widthPercent: 100, fit: 'contain' });
    } catch (error) { setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.'); }
    finally { setUploading(false); onUploadBusy(false); }
  };
  const move = (delta: number) => {
    onChange(current => {
      return { ...current, blocks: updateSiblings(current.blocks, location?.column?.id, items => {
        const blocks = [...items], index = blocks.findIndex(item => item.id === block?.id), next = index + delta;
        if (index < 0 || next < 0 || next >= blocks.length) return items;
        [blocks[index], blocks[next]] = [blocks[next], blocks[index]];
        return blocks;
      }) };
    });
  };
  const moveColumn = (delta: number) => {
    const parent = location?.parent, column = location?.column;
    if (!parent || !column || !block) return;
    const slots = childSlots(parent), target = slots[slots.indexOf(column) + delta];
    if (!target) return;
    onChange(current => {
      const blocks = updateSiblings(current.blocks, column.id, items => items.filter(item => item.id !== block.id));
      return { ...current, blocks: updateSiblings(blocks, target.id, items => [...items, block]) };
    });
  };
  return <aside className="properties-panel" aria-label="Propiedades">
    <div className="panel-heading"><h2>Propiedades</h2><Icon name="page" /></div>
    <fieldset className="property-controls" disabled={disabled}>
    <section className="property-section"><span className="section-label">Página seleccionada</span>
      <label className="property-field" htmlFor="page-title">{page.titleStyle === 'split' ? 'Título · texto principal' : 'Título'}<input id="page-title" value={page.title ?? ''} onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))} /></label>
      <label className="property-field" htmlFor="page-subtitle">Subtítulo<input id="page-subtitle" value={page.subtitle ?? ''} onChange={event => onChange(current => ({ ...current, subtitle: event.target.value }))} /></label>
      <label className="property-field" htmlFor="page-title-style">Estilo de título<select id="page-title-style" value={page.titleStyle ?? 'existing'} onChange={event => onChange(current => ({ ...current, titleStyle: event.target.value as Page['titleStyle'] }))}><option value="none">Ninguno</option><option value="simple">Simple</option><option value="split">Dividido</option><option value="existing">Actual</option></select></label>
      {page.titleStyle === 'split' && <label className="property-field" htmlFor="page-title-secondary">Texto secundario (opcional)<input id="page-title-secondary" value={page.titleSecondary ?? ''} onChange={event => onChange(current => ({ ...current, titleSecondary: event.target.value }))} /></label>}
      <label className="property-field" htmlFor="page-template">Plantilla<select id="page-template" value={page.template} onChange={event => onChange(current => changeTemplate(current, event.target.value as Page['template']))}>{(Object.keys(templateLabels) as Page['template'][]).map(template => <option key={template} value={template}>{templateLabels[template]}</option>)}</select></label>
      <p className="management-note">Las plantillas conservan todos los bloques. Guarda para conservar los cambios de página.</p>
      {page.template === 'cover' && page.theme && <p className="management-note">La banda de tema se conserva; vuelve a mostrarse con lesson.</p>}
      {page.template === 'lesson' && page.eyebrow && <p className="management-note">El rótulo de portada se conserva; vuelve a mostrarse con cover.</p>}
      <dl><dt>Identificador</dt><dd><code>{page.id}</code></dd><dt>Bloques</dt><dd>{allBlocks(page.blocks).length} elementos</dd></dl>
    </section>
    <section className="property-section">
      <button id="add-block" className="button" aria-expanded={adding} onClick={() => setAdding(!adding)}>+ Agregar bloque</button>
      {insertColumn && <button id="add-page-block" className="button" onClick={() => { onSelectBlock(undefined); setAdding(true); setUploadError(''); }}>+ Bloque de página</button>}
      <p className="management-note" role="status">Destino: {insertColumn && isGrid(insertParent) ? `fila ${insertParent.rows.findIndex(row => row.cells.some(cell => cell.id === insertColumn.id)) + 1} · celda ${Number(insertColumn.column) + 1}` : insertColumn && isColumns(insertParent) ? `columna ${insertParent.columns.findIndex(column => column.id === insertColumn.id) + 1} · ${insertParent.type === 'framedColumns' ? insertParent.title : blockLabels[insertParent.type]}` : 'nivel principal de la página'}.</p>
      {clipboard && <button id="paste-block" className="button" onClick={() => {
        if (selectedId && !selectedColumn) { setUploadError('Selecciona una p?gina, columna o celda como destino.'); return; }
        insert(cloneBlock(clipboard));
      }}>Pegar</button>}
      {adding && <BlockPicker onInsert={insert} onImage={file => { void imageFile(file, false); }} />}
      {uploading && <p role="status" className="management-note">Subiendo imagen...</p>}
      {uploadError && <p role="alert" className="upload-error">{uploadError}</p>}
    </section>
    <section className="property-section"><span className="section-label">Bloque seleccionado</span>
      {block ? <><h3>{selectedCard ? 'Tarjeta' : blockLabels[block.type]}</h3>{block.type !== 'separator' && <dl><dt>Identificador</dt><dd><code>{selectedCard?.id ?? block.id}</code></dd><dt>Tipo</dt><dd><code>{selectedCard ? 'card' : block.type}</code></dd>
        {block.type === 'image' ? <><dt>Archivo</dt><dd><code>{block.src}</code></dd></>
          : null}
      </dl>}
      {!selectedCard && !(selectedColumn && isGrid(block)) && <div className="block-actions">
        {selectedId === block.id && <button id="copy-block" className="button" onClick={() => { onCopy(structuredClone(block)); setUploadError(''); }}>Copiar</button>}
        <button id="duplicate-block" className="button" onClick={() => {
          const copy = cloneBlock(block);
          onChange(current => ({ ...current, blocks: updateSiblings(current.blocks, location?.column?.id, items => {
            const next = [...items]; next.splice(next.findIndex(item => item.id === block.id) + 1, 0, copy); return next;
          }) }));
          onSelectBlock(copy.id);
        }}>Duplicar bloque</button>
        <button id="move-block-up" className="button" disabled={location?.index === 0} onClick={() => move(-1)}>↑ Subir</button>
        <button id="move-block-down" className="button" disabled={location?.siblings.at(-1)?.id === block.id} onClick={() => move(1)}>↓ Bajar</button>
        <button id="delete-block" className="button danger-button" onClick={() => {
          if (isContainer(block) && !window.confirm('¿Eliminar el contenedor y todo su contenido? Puedes deshacer esta acción.')) return;
          onChange(current => ({ ...current, blocks: updateSiblings(current.blocks, location?.column?.id, items => items.filter(item => item.id !== block.id)) })); onSelectBlock(location?.parent?.id);
        }}>Eliminar bloque</button>
      </div>}
      {!selectedCard && block.type !== 'separator' && location?.parent && <div className="block-actions">
        <button className="button" onClick={() => onSelectBlock(location.parent?.id)}>Seleccionar contenedor</button>
        <button className="button" onClick={() => onSelectBlock(location.column?.id)}>Seleccionar {isGrid(location.parent) ? 'celda' : 'columna'}</button>
        <button id="move-column-left" className="button" disabled={childSlots(location.parent)[0]?.id === location.column?.id} onClick={() => moveColumn(-1)}>← {isGrid(location.parent) ? 'Celda' : 'Columna'}</button>
        <button id="move-column-right" className="button" disabled={childSlots(location.parent).at(-1)?.id === location.column?.id} onClick={() => moveColumn(1)}>{isGrid(location.parent) ? 'Celda' : 'Columna'} →</button>
      </div>}
      {isColumns(block) && <>
        {block.type === 'framedColumns' && <>
          <label className="property-field" htmlFor="frame-title">Título del contenedor<input id="frame-title" value={block.title} onChange={event => editBlock('title', event.target.value)} /></label>
          <IconField id="frame-icon" label="Icono" value={block.icon} onChange={icon => editBlock('icon', icon)} />
          <label className="property-field" htmlFor="frame-show-icon">Mostrar icono<select id="frame-show-icon" value={String(block.showIcon ?? true)} onChange={event => editBlock('showIcon', event.target.value === 'true')}><option value="true">Sí</option><option value="false">No</option></select></label>
          <label className="property-field" htmlFor="frame-background">Fondo<select id="frame-background" value={block.background ?? 'ice'} onChange={event => editBlock('background', event.target.value)}><option value="white">Blanco</option><option value="ice">Celeste claro</option></select></label>
          <label className="property-field" htmlFor="frame-border">Mostrar borde<select id="frame-border" value={String(block.showBorder ?? true)} onChange={event => editBlock('showBorder', event.target.value === 'true')}><option value="true">Sí</option><option value="false">No</option></select></label>
          <label className="property-field" htmlFor="frame-header">Estilo de encabezado<select id="frame-header" value={block.headerStyle ?? 'tab'} onChange={event => editBlock('headerStyle', event.target.value)}><option value="tab">Pestaña editorial</option><option value="band">Banda compacta</option></select></label>
        </>}
        {!isGrid(block) && <>
        {block.type === 'framedColumns' && <button id="frame-use-grid" className="button" onClick={() => updateBlock(item => item.type === 'framedColumns' ? {
          ...item, columns: [], gap: 'small', rows: [{ ...newGridRow(item.layout), cells: item.columns.map((column, index) => ({ ...column, column: index })) }],
        } : item)}>Usar filas y columnas</button>}
        <label className="property-field" htmlFor="columns-count">Cantidad de columnas<select id="columns-count" value={block.columns.length} onChange={event => updateBlock(item => isColumns(item) ? changeColumns(item, event.target.value === '1' ? '1-full' : (event.target.value + '-equal') as ColumnsBlock['layout']) : item)}>{[1, 2, 3, 4].map(count => <option key={count} value={count}>{count}</option>)}</select></label>
        <label className="property-field" htmlFor="columns-layout">Distribución<select id="columns-layout" value={block.layout} onChange={event => updateBlock(item => isColumns(item) ? changeColumns(item, event.target.value as ColumnsBlock['layout']) : item)}>{columnLayouts.filter(layout => Number(layout[0]) === block.columns.length).map(layout => <option key={layout} value={layout}>{columnLayoutLabels[layout]}</option>)}</select></label>
        <p className="management-note">Al reducir columnas, su contenido pasa al final de la última columna conservada.</p>
        {block.columns.length > 1 && <button id="reverse-columns" className="button" onClick={() => updateBlock(item => {
          if (!isColumns(item)) return item;
          const reversed: Partial<Record<ColumnsBlock['layout'], ColumnsBlock['layout']>> = { '2-60-40': '2-40-60', '2-40-60': '2-60-40', '2-30-70': '2-70-30', '2-70-30': '2-30-70' };
          return { ...item, layout: reversed[item.layout] ?? item.layout, columns: [...item.columns].reverse() };
        })}>Intercambiar lados</button>}
        <label className="property-field" htmlFor="column-target">Agregar bloques en<select id="column-target" value={selectedColumn?.id ?? ''} onChange={event => onSelectBlock(event.target.value || block.id)}><option value="">Selecciona una columna</option>{block.columns.map((column, index) => <option key={column.id} value={column.id}>Columna {index + 1}</option>)}</select></label>
        {block.columns.map((column, index) => <div key={column.id} className="column-outline"><strong>Columna {index + 1}</strong>{column.blocks.map(child => <button key={child.id} className="button" onClick={() => onSelectBlock(child.id)}>{blockLabels[child.type]}</button>)}</div>)}
        </>}
      </>}
      {isGrid(block) && <GridProperties block={block} selectedId={selectedId} onSelect={onSelectBlock} onChange={next => updateBlock(() => next)} />}
      {block.type === 'image' && <>
        <label className="property-field" htmlFor="replace-image">Reemplazar<input id="replace-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void imageFile(event.target.files?.[0], true); event.target.value = ''; }} /></label>
        <p className="management-note">PNG, JPG/JPEG o WebP · máximo 10 MB. Guarda la página después de subir. Eliminar el bloque conserva el archivo.</p>
        <label className="property-field" htmlFor="image-width">Ancho: {block.widthPercent ?? 100} %<input id="image-width" type="range" min="10" max="100" value={block.widthPercent ?? 100} onChange={event => editBlock('widthPercent', Number(event.target.value))} /></label>
        <label className="property-field" htmlFor="image-height">Alto: {block.heightMm} mm<input id="image-height" type="range" min="10" max="150" value={block.heightMm} onChange={event => editBlock('heightMm', Number(event.target.value))} /></label>
        <label className="property-field" htmlFor="image-fit">Ajuste<select id="image-fit" value={block.fit} onChange={event => editBlock('fit', event.target.value)}><option value="contain">Contener (contain)</option><option value="cover">Cubrir (cover)</option></select></label>
        <label className="property-field" htmlFor="image-alt">Texto alternativo<input id="image-alt" value={block.alt} onChange={event => editBlock('alt', event.target.value)} /></label>
        <label className="property-field" htmlFor="image-caption">Pie de imagen<input id="image-caption" value={block.caption ?? ''} onChange={event => editBlock('caption', event.target.value || undefined)} /></label>
      </>}
      {block.type === 'separator' && <label className="property-field" htmlFor="separator-size">Tamaño<select id="separator-size" value={block.size} onChange={event => editBlock('size', event.target.value)}><option value="small">Pequeño</option><option value="normal">Normal</option><option value="large">Amplio</option></select></label>}
      {block.type === 'heading' && <label className="property-field" htmlFor="block-text">Texto del título<input id="block-text" value={block.text} onChange={(event) => editBlock('text', event.target.value)} /></label>}
      {block.type === 'table' && <TableProperties key={block.id} block={block} onChange={update => updateBlock(item => item.type === 'table' ? update(item) : item)} />}
      {block.type === 'code' && <CodeProperties key={block.id} block={block} onChange={update => updateBlock(item => item.type === 'code' ? update(item) : item)} />}
      {block.type === 'questions' && <QuestionsProperties key={block.id} block={block} onChange={update => updateBlock(item => item.type === 'questions' ? update(item) : item)} />}
      {block.type === 'steps' && <StepsProperties key={block.id} block={block} onChange={update => updateBlock(item => item.type === 'steps' ? update(item) : item)} />}
      {block.type === 'textImage' && <TextImageProperties key={block.id} block={block} onChange={update => updateBlock(item => item.type === 'textImage' ? update(item) : item)} onUpload={file => { void imageFile(file, (src, alt) => updateBlock(item => item.type === 'textImage' ? { ...item, image: { ...item.image, src, alt: item.image?.alt ?? alt } } : item)); }} />}
      {block.type === 'cardContainer' && <CardContainerProperties key={block.id} block={block} selectedItemId={selectedId} onSelectItem={onSelectBlock} onChange={update => updateBlock(item => item.type === 'cardContainer' ? update(item) : item)} onUpload={(file, itemId) => { void imageFile(file, (src, alt) => updateBlock(item => item.type === 'cardContainer' ? { ...item, items: item.items.map(card => card.id === itemId ? { ...card, image: { ...card.image, src, alt: card.image?.alt ?? alt } } : card) } : item)); }} />}
      {block.type === 'paragraph' && <label className="property-field" htmlFor="block-text">Contenido<textarea id="block-text" rows={7} value={block.text} onChange={(event) => editBlock('text', event.target.value)} /></label>}
      {block.type === 'card' && <>
        <label className="property-field" htmlFor="block-card-title">T?tulo (opcional)<input id="block-card-title" value={block.title ?? ''} onChange={event => editBlock('title', event.target.value)} /></label>
        <label className="property-field" htmlFor="block-card-description">Texto<textarea id="block-card-description" rows={7} value={block.description} onChange={event => editBlock('description', event.target.value)} /></label>
      </>}
      {block.type === 'infoCard' && <>
        {block.label !== undefined && <label className="property-field" htmlFor="block-label">Rótulo<input id="block-label" value={block.label} onChange={(event) => editBlock('label', event.target.value)} /></label>}
        <label className="property-field" htmlFor="block-title">Título de la tarjeta<input id="block-title" value={block.title} onChange={(event) => editBlock('title', event.target.value)} /></label>
        <IconField id="info-icon" label="Icono" value={block.icon} onChange={icon => editBlock('icon', icon)} />
        <label className="property-field" htmlFor="info-layout">Presentación<select id="info-layout" value={block.layout ?? 'stacked'} onChange={event => editBlock('layout', event.target.value)}><option value="stacked">Actual</option><option value="inline">Horizontal compacta</option><option value="compact">Etiqueta compacta</option></select></label>
        <FormattedTextField key={block.id} id="block-content" label="Contenido" content={block.contentSpans ?? [{ text: block.content }]} onChange={contentSpans => updateBlock(item => item.type === 'infoCard' ? { ...item, content: stepText(contentSpans), contentSpans } : item)} />
      </>}
      </> : <div className="empty-selection"><span><Icon name="cursor" size={24} /></span><p>Haz clic en un bloque de la página para editarlo.</p></div>}
    </section>
    <section className="property-section format-note"><span className="section-label">Diseño del libro</span><div className="format-row"><Icon name="page" size={28} /><div><strong>A4 vertical</strong><span>210 × 297 mm</span></div></div>
      <label className="property-field" htmlFor="book-numbering">Numeración del libro
        <select id="book-numbering" disabled={numberingDisabled} value={book.pageNumbering ?? 'alternate'} onChange={event => onNumberingChange({ pageNumbering: event.target.value as BookNumbering['pageNumbering'], firstContentPageSide: book.firstContentPageSide ?? 'left' })}>
          <option value="alternate">Alternada</option><option value="left">Siempre izquierda</option><option value="right">Siempre derecha</option>
        </select>
      </label>
      <label className="property-field" htmlFor="book-first-side">Primera página numerada
        <select id="book-first-side" disabled={numberingDisabled} value={book.firstContentPageSide ?? 'left'} onChange={event => onNumberingChange({ pageNumbering: book.pageNumbering ?? 'alternate', firstContentPageSide: event.target.value as BookNumbering['firstContentPageSide'] })}>
          <option value="left">Página izquierda</option><option value="right">Página derecha</option>
        </select>
      </label>
      <p>Se guarda automáticamente para todo el libro.</p>
    </section>
    </fieldset>
  </aside>;
}
