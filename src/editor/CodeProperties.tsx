import { useEffect, useState } from 'react';
import type { Block } from '../types/schema';
import { codeLanguages, codeLanguageLabels } from '../utils/codeLanguages';

type Code = Extract<Block, { type: 'code' }>;
export function CodeProperties({ block, onChange }: { block: Code; onChange: (update: (block: Code) => Code) => void }) {
  const [copied, setCopied] = useState('');
  useEffect(() => setCopied(''), [block.content]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(block.content); setCopied('Código copiado.'); }
    catch { setCopied('No se pudo copiar. Selecciona el contenido y usa Ctrl+C.'); }
  };
  return <>
    <label className="property-field" htmlFor="code-title">Título del código (opcional)<input id="code-title" value={block.title ?? ''} onChange={event => onChange(code => ({ ...code, title: event.target.value }))} /></label>
    <label className="property-field" htmlFor="code-language">Lenguaje<select id="code-language" value={block.language} onChange={event => onChange(code => ({ ...code, language: event.target.value as Code['language'] }))}>{codeLanguages.map(language => <option key={language} value={language}>{codeLanguageLabels[language]}</option>)}</select></label>
    <label className="property-field" htmlFor="code-content">Contenido editable<textarea id="code-content" className="code-editor" rows={13} wrap="off" spellCheck={false} autoCapitalize="off" autoCorrect="off" value={block.content} onChange={event => onChange(code => ({ ...code, content: event.target.value }))} /></label>
    <div className="block-actions"><button id="copy-code" className="button" onClick={() => void copy()}>Copiar código</button></div>
    {copied && <p className="management-note" role="status">{copied}</p>}
  </>;
}
