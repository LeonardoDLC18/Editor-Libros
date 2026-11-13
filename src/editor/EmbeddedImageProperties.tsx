import type { EmbeddedImage } from '../types/schema';

export function EmbeddedImageProperties({ image, prefix, onChange, onUpload }: {
  image?: EmbeddedImage; prefix: string; onChange: (image: EmbeddedImage) => void; onUpload: (file?: File) => void;
}) {
  return <>
    <label className="property-field" htmlFor={`${prefix}-file`}>{image ? 'Reemplazar imagen' : 'Agregar imagen'}<input id={`${prefix}-file`} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { onUpload(event.target.files?.[0]); event.target.value = ''; }} /></label>
    {image && <>
      <label className="property-field" htmlFor={`${prefix}-alt`}>Texto alternativo<input id={`${prefix}-alt`} value={image.alt} onChange={event => onChange({ ...image, alt: event.target.value })} /></label>
      <label className="property-field" htmlFor={`${prefix}-caption`}>Pie de imagen<input id={`${prefix}-caption`} value={image.caption ?? ''} onChange={event => {
        const next = { ...image }; if (event.target.value) next.caption = event.target.value; else delete next.caption; onChange(next);
      }} /></label>
    </>}
  </>;
}
