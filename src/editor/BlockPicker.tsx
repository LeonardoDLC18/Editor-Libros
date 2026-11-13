import type { Block, CardContainerBlock, ColumnsBlock } from '../types/schema';
import { containerVariantLabels } from '../utils/blocks';
import { Icon } from '../components/Icon';
import { createPreset, presetMenu } from '../presets';
import { createGridPreset, gridPresets } from '../presets/grids';

export function BlockPicker({ onInsert, onImage }: { onInsert: (block: Block) => void; onImage: (file?: File) => void }) {
  const columns = (count: number) => Array.from({ length: count }, () => ({ id: `col-${crypto.randomUUID()}`, blocks: [] }));
  return <div className="add-block-options">
    <details className="preset-library">
      <summary className="section-label">Prediseñados</summary>
      <div role="group" aria-label="Bloques prediseñados">
        {presetMenu.map(preset => <button key={preset.id} id={`new-preset-${preset.id}`} className="button preset-option" onClick={() => onInsert(createPreset(preset))}>
          <Icon name={preset.icon} /><span><strong>{preset.name}</strong><small>{preset.description}</small></span>
        </button>)}
      </div>
    </details>
    <span className="section-label">Distribución</span>
    {gridPresets.map(preset => <button key={preset.id} id={`new-grid-${preset.id}`} className="button" onClick={() => onInsert(createGridPreset(preset.id))}>{preset.name}</button>)}
    <button id="new-separator" className="button" onClick={() => onInsert({ id: `separator-${crypto.randomUUID()}`, type: 'separator', size: 'normal' })}>Separador</button>
    {([1, 2, 3, 4] as const).map(count => {
      const layout: ColumnsBlock['layout'] = count === 1 ? '1-full' : `${count}-equal`;
      return <button key={count} id={`new-columns-${layout}`} className="button" onClick={() => onInsert({ id: `columns-${crypto.randomUUID()}`, type: 'columns', layout, columns: columns(count) })}>{count} {count === 1 ? 'columna' : 'columnas'}</button>;
    })}
    <span className="section-label">Contenedores</span>
    <button id="new-framedColumns" className="button" onClick={() => onInsert({ id: `framed-columns-${crypto.randomUUID()}`, type: 'framedColumns', title: 'Nuevo título', icon: 'chart', layout: '2-40-60', columns: columns(2) })}>Contenedor con columnas y encabezado</button>
    {(Object.keys(containerVariantLabels) as Exclude<CardContainerBlock['variant'], 'steps'>[]).map(variant => <button key={variant} id={`new-container-${variant}`} className="button" onClick={() => onInsert({
      id: `container-${crypto.randomUUID()}`, type: 'cardContainer', variant, title: containerVariantLabels[variant], icon: variant === 'gallery' ? 'map-pin' : 'info', columns: 3,
      items: Array.from({ length: 3 }, (_, index) => ({ id: `card-${crypto.randomUUID()}`, title: `Tarjeta ${index + 1}`, description: 'Escribe aquí el texto.' })),
    })}>{containerVariantLabels[variant]}</button>)}
    <span className="section-label">Contenido</span>
    <button id="new-heading" className="button" onClick={() => onInsert({ id: `heading-${crypto.randomUUID()}`, type: 'heading', level: 2, text: 'Nuevo título' })}>Título</button>
    <button id="new-paragraph" className="button" onClick={() => onInsert({ id: `paragraph-${crypto.randomUUID()}`, type: 'paragraph', text: 'Escribe aquí el texto.' })}>Texto</button>
    <button id="new-card" className="button" onClick={() => onInsert({ id: `card-${crypto.randomUUID()}`, type: 'card', title: 'Opci?n A', description: 'Describe sus caracter?sticas y cu?ndo usarla.' })}>Tarjeta</button>
    <button id="new-infoCard" className="button" onClick={() => onInsert({ id: `info-${crypto.randomUUID()}`, type: 'infoCard', title: 'Título', content: 'Escribe aquí el contenido.' })}>Tarjeta informativa</button>
    <label className="property-field" htmlFor="new-image">Imagen<input id="new-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { onImage(event.target.files?.[0]); event.target.value = ''; }} /></label>
    <button id="new-textImage" className="button" onClick={() => onInsert({ id: `text-image-${crypto.randomUUID()}`, type: 'textImage', title: 'Texto e imagen', text: 'Escribe aquí el texto.', layout: 'image-right', imageWidth: 40, fit: 'contain' })}>Texto + imagen</button>
    <button id="new-table" className="button" onClick={() => onInsert({ id: `table-${crypto.randomUUID()}`, type: 'table', columns: ['Columna 1', 'Columna 2'], rows: [['', ''], ['', '']] })}>Tabla</button>
    <button id="new-code" className="button" onClick={() => onInsert({ id: `code-${crypto.randomUUID()}`, type: 'code', language: 'pseint', content: '' })}>Código</button>
    <button id="new-questions" className="button" onClick={() => onInsert({ id: `questions-${crypto.randomUUID()}`, type: 'questions', mode: 'mark', title: '', numbered: true, options: ['Verdadero', 'Falso'].map(label => ({ id: `option-${crypto.randomUUID()}`, label })), columns: [], items: [{ id: `question-${crypto.randomUUID()}`, text: '', cells: [], lines: 1 }] })}>Preguntas</button>
    <button id="new-steps" className="button" onClick={() => onInsert({ id: `steps-${crypto.randomUUID()}`, type: 'steps', title: 'Pasos:', items: [{ id: `step-${crypto.randomUUID()}`, content: [] }] })}>Pasos</button>
  </div>;
}
