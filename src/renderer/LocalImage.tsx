import { useState } from 'react';
import type { Block } from '../types/schema';

export function LocalImage({ block }: { block: Extract<Block, { type: 'image' }> }) {
  const [failed, setFailed] = useState(false);
  return <figure className="image-block" style={{ width: `${block.widthPercent ?? 100}%`, maxWidth: '100%' }}>
    {failed ? <div className="image-fallback" style={{ height: `${block.heightMm}mm` }}>No se pudo mostrar la imagen: {block.alt}</div>
      : <img src={`/${block.src}`} alt={block.alt} style={{ height: `${block.heightMm}mm`, objectFit: block.fit }} onError={() => setFailed(true)} />}
    {block.caption && <figcaption>{block.caption}</figcaption>}
  </figure>;
}
