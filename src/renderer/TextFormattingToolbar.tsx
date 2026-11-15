import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { StepSpan } from '../types/schema';
import { formatStep, type StepMark } from '../utils/steps';

export function textSelection(element: HTMLElement, allowCollapsed = false) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || (!allowCollapsed && selection.isCollapsed)) return;
  const range = selection.getRangeAt(0);
  if (!element.contains(range.startContainer) || !element.contains(range.endContainer) || (!allowCollapsed && !range.toString())) return;
  const before = range.cloneRange(); before.selectNodeContents(element); before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return { start, end: start + range.toString().length, rect: range.getBoundingClientRect() };
}

export function restoreTextSelection(element: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let offset = 0, found = false;
  while (walker.nextNode()) {
    const node = walker.currentNode, length = node.textContent?.length ?? 0;
    if (!found && start <= offset + length) { range.setStart(node, Math.max(0, start - offset)); found = true; }
    if (found && end <= offset + length) {
      range.setEnd(node, Math.max(0, end - offset));
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range); return;
    }
    offset += length;
  }
}

export function TextFormattingToolbar({ element, content, apply }: {
  element: HTMLElement; content: () => StepSpan[]; apply: (spans: StepSpan[], start: number, end: number) => void;
}) {
  const toolbar = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<ReturnType<typeof textSelection>>();
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    const update = () => setSelected(document.activeElement === element ? textSelection(element) : undefined);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(undefined); };
    document.addEventListener('selectionchange', update);
    document.addEventListener('keydown', escape);
    window.addEventListener('scroll', update, true); window.addEventListener('resize', update);
    update();
    return () => {
      document.removeEventListener('selectionchange', update); document.removeEventListener('keydown', escape);
      window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update);
    };
  }, [element]);
  useLayoutEffect(() => {
    if (!selected || !toolbar.current) return;
    const { width, height } = toolbar.current.getBoundingClientRect(), rect = selected.rect;
    setPosition({ left: Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + (rect.width - width) / 2)),
      top: Math.max(8, Math.min(window.innerHeight - height - 8, rect.top >= height + 16 ? rect.top - height - 8 : rect.bottom + 8)) });
  }, [selected]);
  if (!selected) return null;
  const spans = content();
  const active = (mark: StepMark) => {
    let offset = 0;
    return spans.filter(span => { const start = offset; offset += span.text.length; return offset > selected.start && start < selected.end; }).every(span => span[mark]);
  };
  return createPortal(<div ref={toolbar} className="text-formatting-toolbar" role="toolbar" aria-label="Formato de texto" style={position}
    onPointerDown={event => event.preventDefault()} onMouseDown={event => event.preventDefault()} onClick={event => event.stopPropagation()}>
    {(['bold', 'italic', 'highlight'] as const).map(mark => <button key={mark} type="button" tabIndex={-1}
      aria-label={{ bold: 'Negrita', italic: 'Cursiva', highlight: 'Resaltar' }[mark]} aria-pressed={active(mark)}
      onClick={() => {
        if (document.activeElement !== element || !textSelection(element)) return;
        apply(formatStep(content(), selected.start, selected.end, mark), selected.start, selected.end);
        setSelected(textSelection(element));
      }}>{mark === 'bold' ? <b>B</b> : mark === 'italic' ? <i>I</i> : 'Resaltar'}</button>)}
  </div>, document.body);
}
