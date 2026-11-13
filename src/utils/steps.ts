import type { StepSpan } from '../types/schema';

export type StepMark = 'bold' | 'italic' | 'highlight';
export const stepText = (content: StepSpan[]) => content.map(span => span.text).join('');

function slice(content: StepSpan[], start: number, end: number): StepSpan[] {
  let offset = 0;
  return content.flatMap(span => {
    const from = Math.max(0, start - offset), to = Math.min(span.text.length, end - offset);
    offset += span.text.length;
    return to > from ? [{ ...span, text: span.text.slice(from, to) }] : [];
  });
}

function compact(content: StepSpan[]): StepSpan[] {
  const result: StepSpan[] = [];
  for (const span of content) {
    if (!span.text) continue;
    const last = result.at(-1);
    if (last && !!last.bold === !!span.bold && !!last.italic === !!span.italic && !!last.highlight === !!span.highlight) last.text += span.text;
    else result.push({ ...span });
  }
  return result;
}

export function formatStep(content: StepSpan[], start: number, end: number, mark: StepMark, enabled?: boolean): StepSpan[] {
  if (start === end) return content;
  const selected = slice(content, start, end);
  const apply = enabled ?? !selected.every(span => span[mark]);
  return compact([...slice(content, 0, start), ...selected.map(span => {
    const next = { ...span };
    if (apply) next[mark] = true;
    else delete next[mark];
    return next;
  }), ...slice(content, end, Infinity)]);
}

// Preserve marks on unchanged text when editing the plain textarea.
export function editStepText(content: StepSpan[], next: string): StepSpan[] {
  const previous = stepText(content);
  let start = 0, oldEnd = previous.length, newEnd = next.length;
  while (start < oldEnd && start < newEnd && previous[start] === next[start]) start++;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd--; }
  const style = slice(content, start, start + 1)[0] ?? slice(content, Math.max(0, start - 1), start)[0];
  return compact([...slice(content, 0, start), { ...style, text: next.slice(start, newEnd) }, ...slice(content, oldEnd, Infinity)]);
}
