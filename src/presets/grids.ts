import type { Block, GridBlock } from '../types/schema';
import { changeGridSpan, newGridRow } from '../utils/grid';

export const gridPresets = [
  { id: 'two-columns', name: 'Dos columnas simples' },
  { id: 'text-image', name: 'Texto + imagen' },
  { id: 'two-rows', name: 'Dos filas' },
  { id: 'columns-bottom', name: 'Dos columnas + fila inferior' },
  { id: 'image-two-rows', name: 'Imagen izquierda + dos filas derecha' },
  { id: 'text-image-result', name: 'Texto izquierda + imagen derecha + resultado inferior' },
  { id: 'two-by-two', name: 'Dos columnas × dos filas' },
] as const;

export function createGridPreset(preset: typeof gridPresets[number]['id']): GridBlock {
  const paragraph = (text: string): Block => ({ id: `paragraph-${crypto.randomUUID()}`, type: 'paragraph', text });
  const image = (): Block => ({ id: `image-${crypto.randomUUID()}`, type: 'image', src: 'assets/images/preset-image.svg', alt: 'Imagen de ejemplo', fit: 'contain', heightMm: 28, widthPercent: 100 });
  let rows = [newGridRow(preset === 'text-image' ? '2-60-40' : preset === 'two-rows' ? '1-full' : '2-equal')];
  if (['two-rows', 'columns-bottom', 'text-image-result'].includes(preset)) rows.push(newGridRow());
  if (['image-two-rows', 'two-by-two'].includes(preset)) rows.push(newGridRow('2-equal'));
  if (preset === 'text-image' || preset === 'text-image-result') {
    rows[0].cells[0].blocks = [paragraph('Escribe aquí el texto.')]; rows[0].cells[1].blocks = [image()];
    if (rows[1]) rows[1].cells[0].blocks = [paragraph('Resultado: escribe aquí tu conclusión.')];
  }
  if (preset === 'image-two-rows') {
    rows[0].cells[0].blocks = [image()]; rows[0].cells[0].verticalAlign = 'center';
    rows[0].cells[1].blocks = [paragraph('Escribe aquí el texto.')]; rows[1].cells[1].blocks = [image()];
    rows = changeGridSpan(rows, rows[0].id, rows[0].cells[0].id, 2);
  }
  return { id: `grid-${crypto.randomUUID()}`, type: 'grid', gap: 'small', rows };
}
