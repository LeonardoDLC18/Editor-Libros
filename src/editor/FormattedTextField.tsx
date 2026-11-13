import { useRef, useState } from 'react';
import type { StepSpan } from '../types/schema';
import { editStepText, formatStep, stepText, type StepMark } from '../utils/steps';

export function FormattedTextField({ id, label, content, onChange }: {
  id: string; label: string; content: StepSpan[];
  onChange: (content: StepSpan[]) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const format = (mark: StepMark, enabled?: boolean) => {
    const field = ref.current;
    if (!field) return;
    const { selectionStart: start, selectionEnd: end } = field;
    onChange(formatStep(content, start, end, mark, enabled));
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start, end); });
  };
  return <>
    <label className="property-field" htmlFor={id}>{label}
      <textarea ref={ref} id={id} rows={3} value={stepText(content)}
        onSelect={event => setHasSelection(event.currentTarget.selectionStart !== event.currentTarget.selectionEnd)}
        onChange={event => onChange(editStepText(content, event.target.value))} />
    </label>
    <div className="block-actions step-format" role="group" aria-label={`Formato de ${label.toLowerCase()}`}>
      <button className="button" data-mark="bold" disabled={!hasSelection} onMouseDown={event => event.preventDefault()} onClick={() => format('bold')}>Negrita</button>
      <button className="button" data-mark="italic" disabled={!hasSelection} onMouseDown={event => event.preventDefault()} onClick={() => format('italic')}>Cursiva</button>
      <button className="button" data-mark="highlight" disabled={!hasSelection} onMouseDown={event => event.preventDefault()} onClick={() => format('highlight', true)}>Resaltar</button>
      <button className="button" data-mark="clear-highlight" disabled={!hasSelection} onMouseDown={event => event.preventDefault()} onClick={() => format('highlight', false)}>Quitar resaltado</button>
    </div>
  </>;
}

