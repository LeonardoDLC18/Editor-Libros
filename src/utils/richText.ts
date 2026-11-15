import type { StepSpan } from '../types/schema';
import { editStepText } from './steps';

// Plain fields remain authoritative, including edits made in Properties.
export type TextFormats = Record<string, StepSpan[]>;
export function textFormats(owner: { [key: string]: unknown }): TextFormats {
  return (owner.richText ?? {}) as TextFormats;
}
export function fieldSpans(owner: { [key: string]: unknown }, key: string, value: string) {
  const spans = textFormats(owner)[key];
  return spans ? editStepText(spans, value) : undefined;
}
export function withFieldSpans<T extends { [key: string]: unknown }>(owner: T, key: string, spans: StepSpan[]): T {
  const richText = { ...textFormats(owner) };
  if (spans.some(span => span.bold || span.italic || span.highlight)) richText[key] = spans;
  else delete richText[key];
  const next: T & { richText?: TextFormats } = { ...owner, richText };
  if (!Object.keys(richText).length) delete next.richText;
  return next;
}
