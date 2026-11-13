import type { Block } from '../types/schema';
import { EmbeddedImageProperties } from './EmbeddedImageProperties';

type TextImage = Extract<Block, { type: 'textImage' }>;
export function TextImageProperties({ block, onChange, onUpload }: {
  block: TextImage; onChange: (update: (block: TextImage) => TextImage) => void; onUpload: (file?: File) => void;
}) {
  const edit = (values: Partial<TextImage>) => onChange(current => ({ ...current, ...values }));
  return <>
    <label className="property-field" htmlFor="mixed-title">Título opcional<input id="mixed-title" value={block.title ?? ''} onChange={event => edit({ title: event.target.value || undefined })} /></label>
    <label className="property-field" htmlFor="mixed-text">Texto<textarea id="mixed-text" rows={7} value={block.text} onChange={event => edit({ text: event.target.value })} /></label>
    <EmbeddedImageProperties image={block.image} prefix="mixed-image" onChange={image => edit({ image })} onUpload={onUpload} />
    <label className="property-field" htmlFor="mixed-layout">Posición<select id="mixed-layout" value={block.layout} onChange={event => edit({ layout: event.target.value as TextImage['layout'] })}>
      <option value="image-left">Imagen izquierda</option><option value="image-right">Imagen derecha</option><option value="image-top">Imagen arriba</option><option value="image-bottom">Imagen abajo</option>
    </select></label>
    <label className="property-field" htmlFor="mixed-width">Proporción imagen / texto<select id="mixed-width" disabled={block.layout === 'image-top' || block.layout === 'image-bottom'} value={block.imageWidth} onChange={event => edit({ imageWidth: Number(event.target.value) as TextImage['imageWidth'] })}>
      <option value="30">30/70</option><option value="40">40/60</option><option value="50">50/50</option>
    </select></label>
    <label className="property-field" htmlFor="mixed-fit">Ajuste<select id="mixed-fit" value={block.fit} onChange={event => edit({ fit: event.target.value as TextImage['fit'] })}><option value="contain">Contener (contain)</option><option value="cover">Cubrir (cover)</option></select></label>
  </>;
}
