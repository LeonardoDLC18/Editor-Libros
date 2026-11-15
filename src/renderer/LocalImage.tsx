import { useContext, useState } from 'react';
import type { Block } from '../types/schema';
import { BlockText, InlineContentContext } from './InlineText';

export function LocalImage({ block, selectionId, captionEditable = true }: { block: Extract<Block, { type: 'image' }>; selectionId?: string; captionEditable?: boolean }) {
  const owner = useContext(InlineContentContext);
  const captionKey = owner?.type === 'textImage' ? 'image/caption' : owner?.type === 'cardContainer' ? `items/${block.id}/image/caption` : 'caption';
  const [failed, setFailed] = useState(false);
  return <figure className="image-block" style={{ width: `${block.widthPercent ?? 100}%`, maxWidth: '100%' }}>
    {failed ? <div className="image-fallback" style={{ height: `${block.heightMm}mm` }}>No se pudo mostrar la imagen: {block.alt}</div>
      : <img src={`/${block.src}`} alt={block.alt} style={{ height: `${block.heightMm}mm`, objectFit: block.fit }} onError={() => setFailed(true)} />}
    {block.caption && <figcaption>{captionEditable ? <BlockText formatKey={captionKey} value={block.caption} selectionId={selectionId} update={(current, caption) => {
      if (current.type === 'image') return { ...current, caption };
      if (current.type === 'textImage' && current.image) return { ...current, image: { ...current.image, caption } };
      if (current.type === 'cardContainer') return { ...current, items: current.items.map(item => item.id === block.id && item.image ? { ...item, image: { ...item.image, caption } } : item) };
      return current;
    }} /> : block.caption}</figcaption>}
  </figure>;
}
