import type { Block, ColumnsBlock } from '../types/schema';
import { cloneBlock } from '../utils/blocks';

export interface BlockPreset {
  id: string;
  name: string;
  description: string;
  category: 'Prediseñados';
  icon: NonNullable<Extract<ColumnsBlock, { type: 'framedColumns' }>['icon']>;
  initial: Block;
}

const paragraph = (text: string): Block => ({ id: 'text', type: 'paragraph', text });
const heading = (text: string): Block => ({ id: 'heading', type: 'heading', level: 3, text });
const image = (): Block => ({ id: 'image', type: 'image', src: 'assets/images/preset-image.svg', alt: 'Espacio para una imagen: reemplázala desde Propiedades', heightMm: 28, fit: 'contain' });
const columns = (groups: Block[][]) => groups.map(blocks => ({ id: 'column', blocks }));
const frame = (title: string, icon: BlockPreset['icon'], groups: Block[][], layout: ColumnsBlock['layout'] = '1-full', headerStyle: 'tab' | 'band' = 'tab'): Block => ({
  id: 'frame', type: 'framedColumns', title, icon, headerStyle, background: 'white', layout, columns: columns(groups),
});
const preset = (id: string, name: string, description: string, icon: BlockPreset['icon'], initial: Block): BlockPreset => ({ id, name, description, category: 'Prediseñados', icon, initial });

// Recipes only: no preset metadata is written into the inserted content.
export const blockPresets: readonly BlockPreset[] = [
  preset('recuerda', 'Recuerda', 'Destaca una regla o conocimiento importante.', 'lightbulb', {
    id: 'remember', type: 'infoCard', layout: 'inline', icon: 'lightbulb', title: 'Recuerda:',
    content: 'Antes de utilizar una variable, debes declararla indicando su nombre y tipo de dato.',
  }),
  preset('mision', 'Misión', 'Presenta el objetivo de una actividad.', 'target',
    frame('Tu misión', 'target', [[paragraph('Crea un algoritmo que solicite un dato y muestre un mensaje.'), paragraph('Resultado esperado: un mensaje que incluya el dato ingresado.')]])),
  preset('aplicacion-guiada', 'Aplicación guiada', 'Combina instrucciones, pasos y apoyo visual.', 'page',
    frame('Aplicación guiada', 'page', [[paragraph('Construye una solución siguiendo estos pasos.'), { id: 'space', type: 'separator', size: 'small' }, {
      id: 'steps', type: 'steps', items: [
        { id: 'step', content: [{ text: 'Identifica los datos que necesitas.' }] },
        { id: 'step', content: [{ text: 'Ordena las instrucciones.' }] },
        { id: 'step', content: [{ text: 'Prueba y revisa el resultado.' }] },
      ],
    }], [image()]], '2-60-40')),
  preset('pregunta-comprension', 'Pregunta de comprensión', 'Invita a relacionar y explicar lo aprendido.', 'help', {
    id: 'question', type: 'infoCard', layout: 'compact', icon: 'help', title: 'Pregunta de comprensión', content: '¿Cómo se relaciona lo aprendido con una situación de tu vida diaria?',
  }),
  preset('que-es', '¿Qué es...?', 'Introduce un concepto con texto e imagen.', 'info',
    frame('¿Qué es un algoritmo?', 'info', [[paragraph('Un algoritmo es una secuencia ordenada de instrucciones para resolver un problema o realizar una tarea.')], [image()]], '2-60-40', 'band')),
  preset('ejemplo', 'Ejemplo', 'Muestra una situación y su resultado.', 'check', {
    id: 'example', type: 'columns', layout: '1-full', columns: columns([[heading('Ejemplo'), paragraph('Un programa suma los valores 3 y 2.'), { id: 'result', type: 'infoCard', layout: 'inline', title: 'Resultado:', content: '3 + 2 = 5' }]]),
  }),
  preset('comparacion', 'Comparación', 'Contrasta dos o tres alternativas.', 'chart', {
    id: 'comparison', type: 'cardContainer', variant: 'comparison', title: 'Comparación', icon: 'chart', columns: 2,
    items: [{ id: 'card', title: 'Opción A', description: 'Describe sus características y cuándo usarla.' }, { id: 'card', title: 'Opción B', description: 'Explica sus diferencias y cuándo elegirla.' }],
  }),
  preset('experimento', 'Experimento', 'Organiza pruebas, datos y observaciones.', 'chart',
    frame('Experimenta y descubre', 'chart', [[paragraph('Cambia un valor, repite la prueba y observa qué ocurre.'), {
      id: 'experiment', type: 'columns', layout: '2-equal', columns: columns([[{
        id: 'table', type: 'table', columns: ['Prueba', 'Valor'], rows: [['1', '10'], ['2', '20']],
      }], [{ id: 'observation', type: 'infoCard', layout: 'compact', title: '¿Qué cambió?', content: 'Anota el resultado y explica qué relación encuentras.' }]]),
    }]])),
  preset('conceptos-clave', 'Conceptos clave', 'Reúne varios conceptos breves en tarjetas.', 'book', {
    id: 'concepts', type: 'cardContainer', variant: 'info', title: 'Conceptos clave', icon: 'book', columns: 3,
    items: [
      { id: 'card', title: 'Entrada', description: 'Datos que recibe el programa.', icon: 'page' },
      { id: 'card', title: 'Proceso', description: 'Instrucciones que transforman los datos.', icon: 'chart' },
      { id: 'card', title: 'Salida', description: 'Resultado que muestra el programa.', icon: 'check' },
    ],
  }),
  preset('codigo-explicacion', 'Código + explicación', 'Acompaña un programa con explicación y notas.', 'page', {
    id: 'code-explanation', type: 'columns', layout: '2-60-40', columns: columns([[{
      id: 'code', type: 'code', language: 'pseint', content: 'Algoritmo MiEdad\n  Definir edad Como Entero\n  Leer edad\n  Escribir edad\nFinAlgoritmo',
    }], [heading('¿Qué ocurre?'), paragraph('El programa recibe una edad y la muestra en pantalla.'), { id: 'note', type: 'infoCard', layout: 'compact', title: 'Observa', content: 'La variable edad almacena un número entero.' }]]),
  }),
];

const menuOrder = ['que-es', 'recuerda', 'mision', 'aplicacion-guiada', 'ejemplo', 'pregunta-comprension', 'comparacion', 'experimento', 'conceptos-clave', 'codigo-explicacion'];
export const presetMenu = menuOrder.map(id => blockPresets.find(preset => preset.id === id)!);
export const createPreset = (preset: BlockPreset): Block => cloneBlock(preset.initial);
