import type { CardContainerBlock } from '../types/schema';
import { containerVariantLabels } from '../utils/blocks';
import { EmbeddedImageProperties } from './EmbeddedImageProperties';

const icons = { 'map-pin': 'Lugar', book: 'Libro', info: 'Información', check: 'Comprobación', page: 'Página', chart: 'Gráfico', lightbulb: 'Idea', target: 'Objetivo', help: 'Pregunta' };
export function IconField({ value, id, label, onChange }: { value?: CardContainerBlock['icon']; id: string; label: string; onChange: (value: CardContainerBlock['icon']) => void }) {
  return <label className="property-field" htmlFor={id}>{label}<select id={id} value={value ?? ''} onChange={event => onChange((event.target.value || undefined) as CardContainerBlock['icon'])}><option value="">Sin icono</option>{Object.entries(icons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>;
}
export function CardContainerProperties({ block, onChange, onUpload, selectedItemId, onSelectItem }: {
  selectedItemId?: string; onSelectItem: (id: string) => void;
  block: CardContainerBlock; onChange: (update: (block: CardContainerBlock) => CardContainerBlock) => void;
  onUpload: (file: File | undefined, itemId: string) => void;
}) {
  const item = block.items.find(item => item.id === selectedItemId) ?? block.items[0];
  const index = block.items.indexOf(item);
  const maximum = block.variant === 'comparison' ? 3 : 4;
  const edit = (values: Partial<CardContainerBlock>) => onChange(current => ({ ...current, ...values }));
  const editItem = (values: Partial<CardContainerBlock['items'][number]>) => onChange(current => ({ ...current, items: current.items.map(card => card.id === item.id ? { ...card, ...values } : card) }));
  const move = (delta: number) => onChange(current => {
    const items = [...current.items], index = items.findIndex(card => card.id === item.id), target = index + delta;
    if (target < 0 || target >= items.length) return current;
    [items[index], items[target]] = [items[target], items[index]]; return { ...current, items };
  });
  return <>
    {!block.items.some(card => card.id === selectedItemId) ? <>
    <label className="property-field" htmlFor="container-title">Título principal<input id="container-title" value={block.title} onChange={event => edit({ title: event.target.value })} /></label>
    <IconField id="container-icon" label="Icono principal" value={block.icon} onChange={icon => edit({ icon })} />
    <label className="property-field" htmlFor="container-variant">Variante<select id="container-variant" value={block.variant} onChange={event => edit({ variant: event.target.value as CardContainerBlock['variant'] })}>
      {Object.entries(containerVariantLabels).map(([value, label]) => <option key={value} value={value} disabled={block.items.length > 3 && value === 'comparison'}>{label}</option>)}
    </select></label>
    {block.items.length > 3 && <p className="management-note">Comparación admite hasta 3 tarjetas. Retira una tarjeta para elegir esa variante.</p>}
    <label className="property-field" htmlFor="container-columns">Tarjetas por fila<select id="container-columns" value={block.columns} onChange={event => edit({ columns: Number(event.target.value) as CardContainerBlock['columns'] })}>{[2, 3, 4].map(count => <option key={count} value={count}>{count}</option>)}</select></label>
    {block.variant === 'gallery' && <>
      <label className="property-field" htmlFor="container-image-size">Tamaño de imagen<select id="container-image-size" value={block.imageSize ?? 'normal'} onChange={event => edit({ imageSize: event.target.value as CardContainerBlock['imageSize'] })}>
        <option value="compact">Compacta</option><option value="normal">Normal</option><option value="large">Grande</option>
      </select></label>
      <label className="property-field" htmlFor="container-image-fit">Ajuste de imágenes<select id="container-image-fit" value={block.imageFit ?? 'cover'} onChange={event => edit({ imageFit: event.target.value as CardContainerBlock['imageFit'] })}>
        <option value="cover">Cubrir (cover)</option><option value="contain">Contener (contain)</option>
      </select></label>
    </>}
    </> : <button className="button" onClick={() => onSelectItem(block.id)}>Seleccionar contenedor de tarjetas</button>}
    <label className="property-field" htmlFor="container-item">Tarjeta seleccionada<select id="container-item" value={item.id} onChange={event => onSelectItem(event.target.value)}>{block.items.map((card, i) => <option key={card.id} value={card.id}>{i + 1}. {card.title}</option>)}</select></label>
    <div className="block-actions">
      <button id="add-card" className="button" disabled={block.items.length >= maximum} onClick={() => {
        const card = { id: `card-${crypto.randomUUID()}`, title: 'Nueva tarjeta', description: 'Escribe aquí el texto.' };
        onChange(current => ({ ...current, items: [...current.items, card] })); onSelectItem(card.id);
      }}>+ Tarjeta</button>
      <button id="delete-card" className="button" disabled={block.items.length <= 2} onClick={() => {
        if (window.confirm('¿Eliminar esta tarjeta y su contenido? Puedes deshacer esta acción.')) edit({ items: block.items.filter(card => card.id !== item.id) });
      }}>Eliminar tarjeta</button>
      <button id="move-card-left" className="button" disabled={index === 0} onClick={() => move(-1)}>← Tarjeta</button>
      <button id="move-card-right" className="button" disabled={index === block.items.length - 1} onClick={() => move(1)}>Tarjeta →</button>
    </div>
    <label className="property-field" htmlFor="card-title">Título de tarjeta<input id="card-title" value={item.title} onChange={event => editItem({ title: event.target.value })} /></label>
    <label className="property-field" htmlFor="card-description">Descripción<textarea id="card-description" value={item.description} rows={5} onChange={event => editItem({ description: event.target.value })} /></label>
    <IconField id="card-icon" label="Icono de tarjeta" value={item.icon} onChange={icon => editItem({ icon })} />
    <EmbeddedImageProperties image={item.image} prefix="card-image" onChange={image => editItem({ image })} onUpload={file => onUpload(file, item.id)} />
  </>;
}
