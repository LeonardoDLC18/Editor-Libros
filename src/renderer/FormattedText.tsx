import type { StepSpan } from '../types/schema';

export function FormattedText({ content }: { content: StepSpan[] }) {
  return content.map((span, part) => {
    let text = <>{span.text}</>;
    if (span.bold) text = <strong>{text}</strong>;
    if (span.italic) text = <em>{text}</em>;
    return span.highlight ? <mark key={part} className="step-highlight">{text}</mark> : <span key={part}>{text}</span>;
  });
}
