import type { StepsBlock } from '../types/schema';
import { LocalImage } from './LocalImage';
import { FormattedText } from './FormattedText';

export function Steps({ block }: { block: StepsBlock }) {
  return <section className="steps-block">
    {block.title?.trim() && <h3 className="steps-title">{block.title}</h3>}
    <ol className="steps-list">
      {block.items.map((item, index) => <li key={item.id} className="steps-item" data-step-id={item.id}>
        <span className="steps-number" aria-hidden="true">{index + 1}</span>
        <div className="steps-copy"><p><FormattedText content={item.content} /></p>
          {item.image && <LocalImage block={{ ...item.image, id: item.id, type: 'image', fit: 'contain', heightMm: 32 }} />}
        </div>
      </li>)}
    </ol>
  </section>;
}
