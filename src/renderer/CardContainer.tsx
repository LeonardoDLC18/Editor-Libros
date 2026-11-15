import type { CSSProperties } from 'react';
import type { CardContainerBlock } from '../types/schema';
import { Icon } from '../components/Icon';
import { BlockText } from './InlineText';
import { LocalImage } from './LocalImage';

export function CardContainer({ block, selectedId, onSelect }: { block: CardContainerBlock; selectedId?: string; onSelect?: (id: string) => void }) {
  const gallery = block.variant === 'gallery';
  const hasGalleryImages = gallery && block.items.some(item => item.image);
  const imageHeight = { compact: 22, normal: 28, large: 36 }[block.imageSize ?? 'normal'];
  return <section className={`card-container variant-${block.variant}${hasGalleryImages ? ' has-gallery-images' : ''}`}>
    <header className="container-heading">{block.icon && <Icon name={block.icon} size={24} />}<h2><BlockText field="title" value={block.title} /></h2></header>
    <div className="container-items" style={{ '--card-columns': block.columns } as CSSProperties}>
      {block.items.map(item => <Card key={item.id} item={item} selectedId={selectedId} onSelect={onSelect} gallery={gallery} hasGalleryImages={hasGalleryImages} imageFit={block.imageFit} imageHeight={imageHeight} />)}
    </div>
  </section>;
}

export function Card({ item, selectedId, onSelect, gallery = false, hasGalleryImages = false, imageFit, imageHeight = 28, optionalTitle = false }: { item: CardContainerBlock['items'][number]; selectedId?: string; onSelect?: (id: string) => void; gallery?: boolean; hasGalleryImages?: boolean; imageFit?: CardContainerBlock['imageFit']; imageHeight?: number; optionalTitle?: boolean }) {
  const text = (field: 'title' | 'description', value: string) => <BlockText formatKey={optionalTitle ? field : `items/${item.id}/${field}`} value={value} multiline={field === 'description'} selectionId={item.id} update={(block, value) => block.type === 'cardContainer'
    ? { ...block, items: block.items.map(card => card.id === item.id ? { ...card, [field]: value } : card) }
    : block.type === 'card' ? { ...block, [field]: value } : block} />;
  return <section className={`container-card${selectedId === item.id ? ' is-selected' : ''}`} data-card-id={item.id}
        tabIndex={onSelect ? 0 : undefined} role={onSelect ? 'button' : undefined} aria-label={onSelect ? `Editar tarjeta: ${item.title}` : undefined}
        onClick={onSelect ? event => { event.stopPropagation(); onSelect(item.id); } : undefined}
        onKeyDown={onSelect ? event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); onSelect(item.id); } } : undefined}>
        {(!optionalTitle || item.title?.trim()) && <header className="container-card-heading">
          {item.icon && <Icon name={item.icon} size={22} />}<h3>{text("title", item.title)}</h3>
        </header>}
        {gallery ? <>
          {hasGalleryImages && <div className="container-card-media">
            {item.image && <LocalImage selectionId={item.id} key={item.image.src} block={{ ...item.image, id: item.id, type: 'image', fit: imageFit ?? 'cover', heightMm: imageHeight }} />}
          </div>}
          <p className="container-card-description">{text("description", item.description)}</p>
        </> : <div className="container-card-body">
          {item.image && <LocalImage selectionId={item.id} key={item.image.src} block={{ ...item.image, id: item.id, type: 'image', fit: 'contain', heightMm: 32 }} />}
          <p>{text("description", item.description)}</p>
        </div>}
      </section>;
}
