import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import type { Block, Page, StepSpan } from '../types/schema';
import { updateBlock } from '../utils/blocks';
import { FormattedText } from './FormattedText';
import { editStepText } from '../utils/steps';
import { fieldSpans, withFieldSpans } from '../utils/richText';
import { restoreTextSelection, textSelection, TextFormattingToolbar } from './TextFormattingToolbar';

export const InlineEditingContext = createContext<{
  change: (update: (page: Page) => Page) => void;
  select: (id?: string) => void;
} | undefined>(undefined);
export const InlineBlockContext = createContext<string | undefined>(undefined);
export const InlineContentContext = createContext<Block | undefined>(undefined);

// The DOM owns the caret while typing; React owns the same page draft as Properties.
// Only text and the existing structured marks enter the DOM, never stored HTML.
export function InlineText({ value, spans, multiline = false, onChange, onFormat, onSelect, label }: {
  value: string; spans?: StepSpan[]; multiline?: boolean; label?: string;
  onFormat?: (spans: StepSpan[]) => void;
  onChange?: (value: string, spans: StepSpan[]) => void; onSelect?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const emitted = useRef<string | undefined>(undefined);
  const content = useRef(spans ?? [{ text: value }]);
  const [focused, setFocused] = useState(false);
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
  const paint = (parts = spans ?? [{ text: value }]) => {
    const element = ref.current;
    if (!element) return;
    element.replaceChildren();
    content.current = parts;
    for (const part of parts) {
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
    if (document.activeElement === ref.current && emitted.current === value
      && JSON.stringify(content.current) === JSON.stringify(spans ?? [{ text: value }])) return;
    const selected = ref.current && document.activeElement === ref.current ? textSelection(ref.current, true) : undefined;
    paint();
    if (selected) restoreTextSelection(ref.current!, selected.start, selected.end);
  }, [value, spans, !!onChange]);
  useLayoutEffect(() => {
    if (!focused) return;
    const leave = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || ref.current?.contains(target)
        || target.closest('.text-formatting-toolbar')) return;
      // Finish before the next target handles the same click, including drag handles.
      ref.current?.blur();
    };
    document.addEventListener('pointerdown', leave, true);
    return () => document.removeEventListener('pointerdown', leave, true);
  }, [focused]);
  if (!onChange) return spans ? <FormattedText content={spans} /> : <>{value}</>;
  const publish = (repaint = true) => {
    const text = ref.current?.textContent ?? '';
    endLine();
    emitted.current = text;
    if (text !== content.current.map(span => span.text).join('')) {
      content.current = editStepText(content.current, text);
      onChange(text, content.current);
    }
    if (repaint && ref.current) {
      const selected = textSelection(ref.current, true);
      paint(content.current);
      if (selected) restoreTextSelection(ref.current, selected.start, selected.end);
    }
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
  return <><span ref={ref} className="inline-text" contentEditable="plaintext-only" suppressContentEditableWarning
    role="textbox" aria-label={label} aria-multiline={multiline} tabIndex={0}
    onFocus={() => { emitted.current = value; setFocused(true); onSelect?.(); }}
    onClick={event => { event.stopPropagation(); onSelect?.(); }}
    onInput={event => publish(!(event.nativeEvent as InputEvent).isComposing)}
    onCompositionEnd={() => publish()}
    onBlur={() => {
      // Restoring a range during blur focuses the old editable again in Chrome.
      const selected = ref.current && textSelection(ref.current, true);
      publish(false);
      if (selected) window.getSelection()?.removeAllRanges();
      paint(content.current); setFocused(false);
    }}
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
    }} />{focused && onFormat && ref.current && <TextFormattingToolbar element={ref.current} content={() => content.current}
      apply={(parts, start, end) => {
        emitted.current = value;
        paint(parts); restoreTextSelection(ref.current!, start, end); onFormat(parts);
      }} />}</>;
}

export function BlockText({ field, formatKey, value, multiline, spans, update, format, selectionId, label }: {
  field?: string; value: string; multiline?: boolean; spans?: StepSpan[]; label?: string;
  formatKey?: string; format?: (block: Block, spans: StepSpan[]) => Block;
  update?: (block: Block, value: string) => Block; selectionId?: string;
}) {
  const editing = useContext(InlineEditingContext);
  const id = useContext(InlineBlockContext);
  const block = useContext(InlineContentContext);
  const key = formatKey ?? field;
  return <InlineText label={label} value={value} spans={spans ?? (block && key ? fieldSpans(block, key, value) : undefined)} multiline={multiline}
    onFormat={editing && id && (key || format) ? spans => editing.change(page => ({ ...page,
      blocks: updateBlock(page.blocks, id, block => format ? format(block, spans) : withFieldSpans(block, key!, spans)),
    })) : undefined}
    onSelect={editing ? () => editing.select(selectionId ?? id) : undefined}
    onChange={editing && id ? (value, spans) => editing.change(page => ({ ...page,
      blocks: updateBlock(page.blocks, id, block => {
        const next = update ? update(block, value) : { ...block, [field!]: value } as Block;
        return format ? format(next, spans) : key ? withFieldSpans(next, key, spans) : next;
      }),
    })) : undefined} />;
}
