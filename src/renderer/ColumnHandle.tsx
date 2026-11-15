import { useContext } from 'react';
import { BlockDragContext } from './BlockDrag';
export function ColumnHandle({ id }: { id: string }) {
  const drag = useContext(BlockDragContext);
  if (!drag) return null;
  return <><button className="column-drag-handle" draggable title="Arrastrar columna completa" aria-label="Arrastrar columna completa"
    onClick={e => e.stopPropagation()}
    onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); drag.start(id); }}
    onDragEnd={e => { e.stopPropagation(); drag.end(); }}>{"\u2630"}</button>
    {drag.marker?.id === id && <span className={`block-drop-marker ${drag.marker.after ? 'right' : 'left'}`} />}</>;
}
