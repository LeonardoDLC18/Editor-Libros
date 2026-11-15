import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import type { Block, Page, StepSpan } from '../types/schema';
import { updateBlock } from '../utils/blocks';
import { FormattedText } from './FormattedText';

export const InlineEditingContext = createContext<{
  change: (update: (page: Page) => Page) => void;
  select: (id?: string) => void;
} | undefined>(undefined);
export const InlineBlockContext = createContext<string | undefined>(undefined);

// The DOM owns the caret while typing; React owns the same page draft as Properties.
// Only text and the existing structured marks enter the DOM, never stored HTML.
export function InlineText({ value, spans, multiline = false, onChange, onSelect, label }: {
  value: string; spans?: StepSpan[]; multiline?: boolean; label?: string;
  onChange?: (value: string) => void; onSelect?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const emitted = useRef<string | undefined>(undefined);
  const endLine = () => {
    const element = ref.current;
    if (!element) return;
    const sentinel = element.querySelector('br[data-inline-end]');
    if (element.textContent?.endsWith('\n')) {
      if (!sentinel) {
        const br = document.createElement('br'); br.dataset.inlineEnd = '';
        element.append(br);
      }
    } else sentinel?.remove();
  };
  const paint = () => {
    const element = ref.current;
    if (!element) return;
    element.replaceChildren();
    for (const part of spans ?? [{ text: value }]) {
      let node: Node = document.createTextNode(part.text);
      for (const tag of [part.bold && 'strong', part.italic && 'em', part.highlight && 'mark']) {
        if (!tag) continue;
        const wrapper = document.createElement(tag);
        if (tag === 'mark') wrapper.className = 'step-highlight';
        wrapper.append(node); node = wrapper;
      }
      element.append(node);
    }
    endLine();
  };
  useLayoutEffect(() => {
    if (document.activeElement === ref.current && emitted.current === value) return;
    paint();
  }, [value, spans, !!onChange]);
  if (!onChange) return spans ? <FormattedText content={spans} /> : <>{value}</>;
  const publish = () => {
    const text = ref.current?.textContent ?? '';
    endLine();
    emitted.current = text;
    if (text !== value) onChange(text);
  };
  const insert = (text: string) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !ref.current?.contains(selection.anchorNode)) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node); endLine(); range.setStartAfter(node); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    publish();
  };
  return <span ref={ref} className="inline-text" contentEditable="plaintext-only" suppressContentEditableWarning
    role="textbox" aria-label={label} aria-multiline={multiline} tabIndex={0}
    onFocus={() => { emitted.current = value; onSelect?.(); }}
    onClick={event => { event.stopPropagation(); onSelect?.(); }}
    onInput={publish}
    onBlur={() => { publish(); paint(); }}
    onPaste={event => { event.preventDefault(); insert(multiline ? event.clipboardData.getData('text/plain') : event.clipboardData.getData('text/plain').replace(/[\r\n]+/g, ' ')); }}
    onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}
    onDragOver={event => { event.stopPropagation(); event.preventDefault(); }}
    onDrop={event => { event.stopPropagation(); event.preventDefault(); }}
    onKeyDown={event => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === 'Escape' || (event.key === 'Enter' && !multiline)) {
        event.preventDefault(); event.stopPropagation(); event.currentTarget.blur();
      } else if (event.key === 'Enter') {
        event.preventDefault(); insert('\n');
      }
    }} />;
}

export function BlockText({ field, value, multiline, spans, update, selectionId }: {
  field?: string; value: string; multiline?: boolean; spans?: StepSpan[];
  update?: (block: Block, value: string) => Block; selectionId?: string;
}) {
  const editing = useContext(InlineEditingContext);
  const id = useContext(InlineBlockContext);
  return <InlineText value={value} spans={spans} multiline={multiline}
    onSelect={editing ? () => editing.select(selectionId ?? id) : undefined}
    onChange={editing && id ? value => editing.change(page => ({ ...page,
      blocks: updateBlock(page.blocks, id, block => update ? update(block, value) : { ...block, [field!]: value } as Block),
    })) : undefined} />;
}
