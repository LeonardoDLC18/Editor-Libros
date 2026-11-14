import { useContext, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Block } from '../types/schema';
import { TableBlock, type EditCell } from './TableBlock';
import { codeLanguageLabels } from '../utils/codeLanguages';
import { Icon } from '../components/Icon';
import { columnLayoutLabels, isColumns } from '../utils/blocks';
import { LocalImage } from './LocalImage';
import { Card, CardContainer } from './CardContainer';
import { Questions } from './Questions';
import { Steps } from './Steps';
import { FormattedText } from './FormattedText';
import { Grid } from './Grid';
import { isGrid } from '../utils/grid';
import { BlockDragContext } from './BlockDrag';

export const blockLabels: Record<Block['type'], string> = {
  card: 'Tarjeta',
  grid: 'Filas y columnas',
  separator: 'Separador',
  steps: 'Pasos', questions: 'Preguntas',
  heading: 'Título', paragraph: 'Párrafo', infoCard: 'Tarjeta informativa', image: 'Imagen', table: 'Tabla', code: 'Código', columns: 'Columnas', framedColumns: 'Contenedor con columnas y encabezado', textImage: 'Texto + imagen', cardContainer: 'Contenedor de tarjetas',
};

export function BlockRenderer({ block, selectedId, onSelect, onEditCell, inColumn = false }: {
  inColumn?: boolean; block: Block; selectedId?: string; onSelect?: (id: string) => void; onEditCell?: EditCell;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useContext(BlockDragContext);
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !onSelect || !inColumn || block.type === 'separator') { setNarrow(false); return; }
    const measure = () => {
      const minimum = block.type === 'table' ? block.columns.length * 65 : ['grid', 'textImage', 'cardContainer', 'columns', 'framedColumns'].includes(block.type) ? 230 : block.type === 'image' ? 70 : 110;
      setNarrow(element.clientWidth < minimum || element.scrollWidth > element.clientWidth + 1);
    };
    measure(); const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [block, inColumn, onSelect]);
  const selected = selectedId === block.id;
  let content;
  switch (block.type) {
    case 'separator': content = onSelect ? <span className="separator-guide" aria-hidden="true">··· Separador ···</span> : null; break;
    case 'questions': content = <Questions block={block} />; break;
    case 'steps': content = <Steps block={block} />; break;
    case 'card': content = <Card item={{ id: block.id, title: block.title ?? '', description: block.description }} optionalTitle />; break;
    case 'cardContainer': content = <CardContainer block={block} selectedId={selectedId} onSelect={onSelect} />; break;
    case 'textImage': content = <section className={`text-image layout-${block.layout}`} style={{ '--image-part': `${block.imageWidth}fr`, '--text-part': `${100 - block.imageWidth}fr` } as CSSProperties}>
      <div className="text-image-copy">{block.title && <h3>{block.title}</h3>}<p>{block.text}</p></div>
      <div className="text-image-media">{block.image ? <LocalImage key={block.image.src} block={{ ...block.image, id: block.id, type: 'image', heightMm: 40, fit: block.fit }} /> : <div className="image-placeholder">Agrega una imagen desde Propiedades</div>}</div>
    </section>; break;
    case 'grid':
    case 'framedColumns':
    case 'columns': content = isGrid(block) ? <Grid block={block} selectedId={selectedId} onSelect={onSelect} onEditCell={onEditCell} /> : <div className={`columns-block layout-${block.layout}`}>
      {block.columns.map((column, index) => <div className={`column-blocks${selectedId === column.id ? ' is-selected' : ''}`}
        onClick={onSelect ? event => { event.stopPropagation(); onSelect(column.id); } : undefined}
        tabIndex={onSelect ? 0 : undefined} role={onSelect ? 'group' : undefined} aria-label={onSelect ? `Seleccionar columna ${index + 1}` : undefined}
        onKeyDown={onSelect ? event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); onSelect(column.id); } } : undefined}
        key={column.id} data-column-id={column.id}>
        {column.blocks.map(child => <BlockRenderer key={child.id} block={child} inColumn selectedId={selectedId} onSelect={onSelect} onEditCell={onEditCell} />)}
      </div>)}
    </div>;
      if (block.type === 'framedColumns') content = <section className={`framed-columns frame-${block.headerStyle ?? 'tab'} frame-bg-${block.background ?? 'ice'}${block.showBorder === false ? ' frame-no-border' : ''}`}>
        <header className="frame-heading">{block.icon && block.showIcon !== false && <span className="frame-icon"><Icon name={block.icon} size={24} /></span>}<h2>{block.title}</h2></header>
        <div className="frame-body">{content}</div>
      </section>;
      break;
    case 'heading': content = block.level === 2 ? <h2>{block.text}</h2> : <h3>{block.text}</h3>; break;
    case 'paragraph': content = <p>{block.text}</p>; break;
    case 'infoCard': content = <section className={`info-card info-card-${block.layout ?? 'stacked'}`}>
      {block.label && <div className="card-label">{block.label}</div>}
      <h3>{block.icon && <Icon name={block.icon} size={20} />}{block.title}</h3><p>{block.contentSpans ? <FormattedText content={block.contentSpans} /> : block.content}</p>
    </section>; break;
    case 'image': content = <LocalImage key={block.src} block={block} />; break;
    case 'table': content = <TableBlock block={block} onEdit={selected ? onEditCell : undefined} />; break;
    case 'code': content = <section className="code-block">
      <div className="code-heading">{block.title && <strong>{block.title}</strong>}<span>{codeLanguageLabels[block.language]}</span></div>
      <pre><code>{block.content}</code></pre>
    </section>; break;
  }
  return <div ref={ref}
    className={`content-block block-${block.type}${onSelect ? ' selectable' : ''}${selected ? ' is-selected' : ''}`}
    data-block-id={block.id}
    onDragOver={drag ? event => {
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      if (drag.over(block.id, event.clientY >= rect.top + rect.height / 2)) {
        event.preventDefault(); event.dataTransfer.dropEffect = 'move';
      }
    } : undefined}
    onDrop={drag ? event => {
      event.stopPropagation(); event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      drag.drop(block.id, event.clientY >= rect.top + rect.height / 2);
    } : undefined}
    style={block.type === 'separator' ? { height: { small: 6, normal: 10, large: 16 }[block.size] } : undefined}
    role={onSelect ? block.type === 'table' || isColumns(block) || isGrid(block) ? 'group' : 'button' : undefined}
    tabIndex={onSelect ? 0 : undefined}
    aria-label={onSelect ? `Seleccionar ${blockLabels[block.type].toLowerCase()}: ${isGrid(block) ? `${block.rows.length} filas` : isColumns(block) ? columnLayoutLabels[block.layout] : block.type === 'separator' ? ({ small: 'Pequeño', normal: 'Normal', large: 'Amplio' }[block.size]) : block.type === 'image' ? block.alt : block.type === 'card' || block.type === 'infoCard' || block.type === 'table' || block.type === 'code' || block.type === 'cardContainer' || block.type === 'textImage' || block.type === 'steps' || block.type === 'questions' ? block.title ?? '' : block.text}` : undefined}
    aria-pressed={onSelect && block.type !== 'table' && !isColumns(block) && !isGrid(block) ? !!selected : undefined}
    onClick={onSelect ? (event) => { event.stopPropagation(); onSelect(block.id); } : undefined}
    onKeyDown={onSelect ? (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(block.id); }
    } : undefined}
  >{drag && onSelect && <><button type="button" className="block-drag-handle" draggable aria-label={`Arrastrar ${blockLabels[block.type].toLowerCase()}`} title="Arrastrar para reordenar"
    onClick={event => event.stopPropagation()}
    onDragStart={event => { event.stopPropagation(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', block.id); drag.start(block.id); }}
    onDragEnd={event => { event.stopPropagation(); drag.end(); }}>⋮⋮</button>
    {drag.marker?.id === block.id && <span className={`block-drop-marker ${drag.marker.after ? 'after' : 'before'}`} aria-hidden="true" />}</>}
    {content}{onSelect && narrow && <div className="column-width-warning" role="status">Este bloque puede resultar demasiado ancho para esta columna.</div>}</div>;
}
