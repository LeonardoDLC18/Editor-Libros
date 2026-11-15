import type { StepsBlock } from '../types/schema';
import { LocalImage } from './LocalImage';
import { BlockText } from './InlineText';
import { editStepText } from '../utils/steps';

export function Steps({ block }: { block: StepsBlock }) {
  return <section className="steps-block">
    {block.title?.trim() && <h3 className="steps-title"><BlockText field="title" value={block.title} /></h3>}
    <ol className="steps-list">
      {block.items.map((item, index) => <li key={item.id} className="steps-item" data-step-id={item.id}>
        <span className="steps-number" aria-hidden="true">{index + 1}</span>
        <div className="steps-copy"><p><BlockText format={(block, spans) => block.type === 'steps' ? { ...block, items: block.items.map(step => step.id === item.id ? { ...step, content: spans } : step) } : block} value={item.content.map(span => span.text).join('')} spans={item.content} multiline update={(block, value) => block.type === 'steps' ? { ...block, items: block.items.map(step => step.id === item.id ? { ...step, content: editStepText(step.content, value) } : step) } : block} /></p>
          {item.image && <LocalImage captionEditable={false} block={{ ...item.image, id: item.id, type: 'image', fit: 'contain', heightMm: 32 }} />}
        </div>
      </li>)}
    </ol>
  </section>;
}
