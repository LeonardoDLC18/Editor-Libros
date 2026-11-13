import type { StepsBlock } from '../types/schema';
import { FormattedTextField } from './FormattedTextField';

export function StepsProperties({ block, onChange }: {
  block: StepsBlock; onChange: (update: (block: StepsBlock) => StepsBlock) => void;
}) {
  const move = (id: string, delta: number) => onChange(current => {
    const items = [...current.items], from = items.findIndex(item => item.id === id), to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return current;
    [items[from], items[to]] = [items[to], items[from]];
    return { ...current, items };
  });
  return <div className="steps-properties">
    <label className="property-field" htmlFor="steps-title">Título (opcional)
      <input id="steps-title" value={block.title ?? ''} onChange={event => onChange(current => ({ ...current, title: event.target.value }))} />
    </label>
    <p className="management-note">Selecciona palabras en un paso y aplica formato. Negrita y Cursiva también permiten quitarlo.</p>
    {block.items.map((item, index) => <div key={item.id} className="step-editor" data-step-editor={item.id}>
      <FormattedTextField id={`text-${item.id}`} label={`Paso ${index + 1}`} content={item.content} onChange={content => onChange(current => ({ ...current, items: current.items.map(step => step.id === item.id ? { ...step, content } : step) }))} />
      <div className="block-actions">
        <button className="button" data-step-action="up" aria-label={`Subir paso ${index + 1}`} disabled={index === 0} onClick={() => move(item.id, -1)}>↑ Subir</button>
        <button className="button" data-step-action="down" aria-label={`Bajar paso ${index + 1}`} disabled={index === block.items.length - 1} onClick={() => move(item.id, 1)}>↓ Bajar</button>
        <button className="button" data-step-action="duplicate" aria-label={`Duplicar paso ${index + 1}`} onClick={() => onChange(current => {
          const items = [...current.items], at = items.findIndex(step => step.id === item.id);
          items.splice(at + 1, 0, { ...structuredClone(items[at]), id: `step-${crypto.randomUUID()}` });
          return { ...current, items };
        })}>Duplicar</button>
        <button className="button" data-step-action="delete" aria-label={`Eliminar paso ${index + 1}`} onClick={() => onChange(current => ({ ...current, items: current.items.filter(step => step.id !== item.id) }))}>Eliminar</button>
      </div>
    </div>)}
    <button id="add-step" className="button" onClick={() => onChange(current => ({ ...current, items: [...current.items, { id: `step-${crypto.randomUUID()}`, content: [] }] }))}>+ Agregar paso</button>
  </div>;
}
