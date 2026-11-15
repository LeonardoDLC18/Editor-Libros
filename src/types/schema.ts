import { z } from 'zod';
import { codeLanguages } from '../utils/codeLanguages';
import { maxContainerDepth, nestingMessage } from '../utils/blocks';
import { gridStructureError } from '../utils/grid';
export { maxContainerDepth, nestingMessage } from '../utils/blocks';

z.config(z.locales.es());

const text = z.string().trim().min(1, 'Escribe un texto no vacío.');
export const idSchema = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa letras minúsculas, números y guiones para el identificador.');
const id = idSchema;
const localAsset = text.regex(
  /^(?:assets|diagrams)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp|gif|svg)$/,
  'Usa una ruta relativa a assets/ o diagrams/, sin .., URL ni Base64.',
);
const tableSchema = z.looseObject({
  id, type: z.literal('table'), title: z.string().max(500).optional(),
  columns: z.array(z.string().max(10000)).min(1, 'La tabla necesita al menos una columna.').max(20),
  columnWidths: z.array(z.number().positive().max(100)).optional(),
  rows: z.array(z.array(z.string().max(10000))).max(200),
}).superRefine((table, context) => {
  if (table.columnWidths && (table.columnWidths.length !== table.columns.length || Math.abs(table.columnWidths.reduce((a, b) => a + b, 0) - 100) > 0.001))
    context.addIssue({ code: 'custom', path: ['columnWidths'], message: 'Los anchos deben corresponder a las columnas y sumar 100 %.' });
  table.rows.forEach((row, index) => {
    if (row.length !== table.columns.length) context.addIssue({ code: 'custom', path: ['rows', index], message: 'Cada fila debe tener una celda por columna.' });
  });
});

const embeddedImageSchema = z.looseObject({ src: localAsset, alt: text, caption: z.string().max(1000).optional() });
const editorialIcon = z.enum(['map-pin', 'book', 'info', 'check', 'page', 'chart', 'lightbulb', 'target', 'help']);
const stepSpanSchema = z.strictObject({
  text: z.string(), bold: z.boolean().optional(), italic: z.boolean().optional(), highlight: z.boolean().optional(),
});
const stepsSchema = z.looseObject({
  id, type: z.literal('steps'), title: z.string().optional(),
  items: z.array(z.looseObject({
    id, content: z.array(stepSpanSchema), image: embeddedImageSchema.optional(),
  })),
});
const questionsSchema = z.looseObject({
  id, type: z.literal('questions'), mode: z.enum(['mark', 'write']), title: z.string().max(500).optional(),
  options: z.array(z.looseObject({ id, label: z.string().max(500) })).min(2).max(4),
  columns: z.array(z.looseObject({ id, label: z.string().max(500) })).max(4),
  items: z.array(z.looseObject({ id, text: z.string().max(10000), cells: z.array(z.string().max(10000)), lines: z.union([z.literal(1), z.literal(2), z.literal(3)]) })).max(200),
  numbered: z.boolean(),
}).superRefine((block, context) => {
  block.items.forEach((item, index) => { if (item.cells.length !== block.columns.length) context.addIssue({ code: 'custom', path: ['items', index, 'cells'], message: 'Cada fila necesita una celda por columna.' }); });
});
export type QuestionsBlock = z.infer<typeof questionsSchema>;
export type StepSpan = z.infer<typeof stepSpanSchema>;
const textFormatsSchema = z.record(z.string().min(1), z.array(stepSpanSchema));
export type StepsBlock = z.infer<typeof stepsSchema>;

const leafBlockSchema = z.discriminatedUnion('type', [
  z.looseObject({ id, type: z.literal('separator'), size: z.enum(['small', 'normal', 'large']).default('normal') }),
  z.looseObject({ id, type: z.literal('heading'), text, level: z.union([z.literal(2), z.literal(3)]) }),
  z.looseObject({ id, type: z.literal('paragraph'), text }),
  z.looseObject({ id, type: z.literal('card'), title: z.string().max(500).optional(), description: z.string().max(10000) }),
  z.looseObject({
    id, type: z.literal('infoCard'), label: text.optional(), title: text, content: text,
    layout: z.enum(['stacked', 'inline', 'compact']).optional(), icon: editorialIcon.optional(),
    contentSpans: z.array(stepSpanSchema).optional(),
  }).superRefine((block, context) => {
    if (block.contentSpans && block.contentSpans.map(span => span.text).join('').trim() !== block.content) {
      context.addIssue({ code: 'custom', path: ['contentSpans'], message: 'El texto con formato debe coincidir con el contenido de la tarjeta.' });
    }
  }),
  z.looseObject({
    id, type: z.literal('image'), src: localAsset, alt: text, caption: text.optional(),
    heightMm: z.number().min(10).max(150), fit: z.enum(['contain', 'cover']),
    widthPercent: z.number().min(10).max(100).optional(),
  }),
  tableSchema,
  stepsSchema,
  questionsSchema,
  z.looseObject({
    id, type: z.literal('code'), title: z.string().max(500).optional(),
    language: z.enum(codeLanguages), content: z.string().max(300000),
  }),
  z.looseObject({
    id, type: z.literal('textImage'), title: z.string().max(500).optional(), text,
    image: embeddedImageSchema.optional(), layout: z.enum(['image-left', 'image-right', 'image-top', 'image-bottom']),
    imageWidth: z.union([z.literal(30), z.literal(40), z.literal(50)]), fit: z.enum(['contain', 'cover']),
  }),
]);

export const columnLayouts = ['1-full', '2-equal', '2-40-60', '2-60-40', '2-30-70', '2-70-30', '3-equal', '3-25-50-25', '4-equal'] as const;
const cardContainerSchema = z.looseObject({
  id, type: z.literal('cardContainer'), variant: z.enum(['gallery', 'info', 'comparison', 'steps']),
  title: text, icon: editorialIcon.optional(), columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  imageSize: z.enum(['compact', 'normal', 'large']).optional(),
  imageFit: z.enum(['cover', 'contain']).optional(),
  items: z.array(z.looseObject({
    id, title: text, description: text, image: embeddedImageSchema.optional(),
    icon: editorialIcon.optional(), step: z.number().int().min(1).max(999).optional(),
  })).min(2).max(4),
}).superRefine((block, context) => {
  if ((block.variant === 'comparison' || block.variant === 'steps') && block.items.length > 3) {
    context.addIssue({ code: 'custom', path: ['items'], message: 'Comparación y Pasos admiten 2 o 3 tarjetas.' });
  }
});
export type LeafBlock = z.infer<typeof leafBlockSchema>;
export type CardContainerBlock = z.infer<typeof cardContainerSchema>;
export interface Column { id: string; blocks: Block[]; [key: string]: unknown }
export interface GridCell extends Column { column: number; rowSpan?: 1 | 2 | 3; verticalAlign?: 'top' | 'center' | 'bottom' }
export interface GridRow { id: string; layout: typeof columnLayouts[number]; cells: GridCell[]; [key: string]: unknown }
export type GridGap = 'none' | 'small' | 'normal';
export interface GridBlock { id: string; type: 'grid'; rows: GridRow[]; gap?: GridGap; [key: string]: unknown }
interface ColumnsData {
  id: string; layout: typeof columnLayouts[number]; columns: Column[]; [key: string]: unknown;
}
export type ColumnsBlock = ColumnsData & ({ type: 'columns' } | {
  type: 'framedColumns'; title: string; icon?: z.infer<typeof editorialIcon>; showIcon?: boolean;
  background?: 'white' | 'ice'; showBorder?: boolean; headerStyle?: 'tab' | 'band';
  rows?: GridRow[]; gap?: GridGap;
});
export type GridContainer = GridBlock | (Extract<ColumnsBlock, { type: 'framedColumns' }> & { rows: GridRow[] });
export type Block = LeafBlock | CardContainerBlock | ColumnsBlock | GridBlock;

// Read legacy cards as editorial steps. Disk changes only on the normal backed-up save.
function migrateSteps(value: unknown): unknown {
  if (!value || typeof value !== 'object' || !('type' in value) || value.type !== 'cardContainer' || !('variant' in value) || value.variant !== 'steps') return value;
  const legacy = cardContainerSchema.safeParse(value);
  if (!legacy.success) return value;
  return { ...legacy.data, type: 'steps', items: legacy.data.items.map(item => ({
    ...item, content: [{ text: item.title, bold: true }, { text: `\n${item.description}` }],
  })) };
}

// Bounded construction also rejects excessive depth before recursively parsing it.
function blocksAtDepth(depth: number): z.ZodType<Block> {
  return blocksAtDepthBase(depth).superRefine((block, context) => {
    if (block.richText === undefined) return;
    const result = textFormatsSchema.safeParse(block.richText);
    if (!result.success) context.addIssue({ code: 'custom', path: ['richText'], message: 'Segmentos de formato no válidos.' });
  });
}
function blocksAtDepthBase(depth: number): z.ZodType<Block> {
  if (depth === maxContainerDepth) return z.preprocess((value, context) => {
    value = migrateSteps(value);
    if (value && typeof value === 'object' && 'type' in value && ['grid', 'columns', 'framedColumns', 'cardContainer', 'textImage'].includes(String(value.type))) {
      context.addIssue({ code: 'custom', message: nestingMessage });
      return z.NEVER;
    }
    return value;
  }, leafBlockSchema);
  const children = z.array(blocksAtDepth(depth + 1));
  const gridFields = {
    gap: z.enum(['none', 'small', 'normal']).optional(),
    rows: z.array(z.looseObject({ id, layout: z.enum(columnLayouts), cells: z.array(z.looseObject({
      id, column: z.number().int().min(0).max(3), rowSpan: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      verticalAlign: z.enum(['top', 'center', 'bottom']).optional(), blocks: children,
    })).max(4) })).min(1),
  };
  const checkGrid = (block: { rows: GridRow[] }, context: z.RefinementCtx) => {
    const message = gridStructureError(block.rows);
    if (message) context.addIssue({ code: 'custom', path: ['rows'], message });
  };
  const gridSchema = z.looseObject({ id, type: z.literal('grid'), ...gridFields }).superRefine(checkGrid);
  const columnFields = z.looseObject({
    id, layout: z.enum(columnLayouts),
    columns: z.array(z.looseObject({ id, blocks: children })).max(4),
  });
  const checkColumns = (block: ColumnsData, context: z.RefinementCtx) => {
    if (block.columns.length !== Number(block.layout[0])) context.addIssue({ code: 'custom', path: ['columns'], message: 'La cantidad de columnas debe coincidir con la distribución.' });
  };
  const columnsSchema = columnFields.extend({ type: z.literal('columns') }).superRefine(checkColumns);
  const framedColumnsSchema = columnFields.extend({
    type: z.literal('framedColumns'), title: text.max(500), icon: editorialIcon.optional(), showIcon: z.boolean().optional(),
    background: z.enum(['white', 'ice']).optional(), showBorder: z.boolean().optional(), headerStyle: z.enum(['tab', 'band']).optional(),
    rows: gridFields.rows.optional(), gap: gridFields.gap,
  }).superRefine((block, context) => {
    if (block.rows) {
      checkGrid({ rows: block.rows }, context);
      if (block.columns.length) context.addIssue({ code: 'custom', path: ['columns'], message: 'Un marco con filas debe tener columns vacío.' });
    } else checkColumns(block, context);
  });
  return z.preprocess(migrateSteps, z.discriminatedUnion('type', [...leafBlockSchema.options, columnsSchema, framedColumnsSchema, gridSchema, cardContainerSchema]));
}
export const blockSchema = blocksAtDepth(0);

export const pageSchema = z.looseObject({
  id,
  template: z.enum(['cover', 'lesson', 'blank'], { error: 'Plantilla desconocida. Usa cover, lesson o blank.' }),
  unitId: id.optional(),
  title: z.string().optional(),
  titleStyle: z.enum(['none', 'simple', 'split', 'existing']).optional(),
  titleSecondary: z.string().optional(),
  eyebrow: text.optional(),
  subtitle: z.string().optional(),
  richText: textFormatsSchema.optional(),
  theme: z.looseObject({ label: text, title: text }).optional(),
  blocks: z.array(blockSchema),
  metadata: z.looseObject({ status: z.enum(['demo', 'draft', 'ready']), description: text }),
}).superRefine((page, context) => {
  if (page.template === 'lesson' && !page.theme) {
    context.addIssue({ code: 'custom', path: ['theme'], message: 'La página conceptual necesita una banda de tema.' });
  }
});

export const bookSchema = z.strictObject({
  schemaVersion: z.literal(1),
  pageNumbering: z.enum(['alternate', 'left', 'right']).optional(),
  firstContentPageSide: z.enum(['left', 'right']).optional(),
  book: z.strictObject({ id, title: text, subtitle: text, grade: text, author: text, language: z.literal('es') }),
  units: z.array(z.strictObject({ id, label: text, title: text })),
  pageOrder: z.array(z.strictObject({
    id,
    file: text.regex(/^pages\/[a-zA-Z0-9_-]+\.json$/, 'Usa pages/nombre-de-pagina.json, sin subcarpetas ni .. .'),
  })).min(1, 'El libro necesita al menos una página.'),
});

const color = z.string().regex(/^#[a-fA-F0-9]{6}$/, 'Usa un color hexadecimal de seis dígitos.');
const font = text.regex(/^[a-zA-Z0-9 ,'-]+$/, 'Usa nombres de fuentes locales separados por comas.');
export const designSchema = z.strictObject({
  schemaVersion: z.literal(1),
  name: text,
  colors: z.strictObject({
    navy: color, blue: color, cyan: color, paper: color, ice: color, ink: color,
    muted: color, line: color, workspace: color, surface: color, success: color, danger: color,
  }),
  fonts: z.strictObject({ body: font, heading: font, ui: font, mono: font }),
  typeScale: z.strictObject({
    bodyPt: z.number().min(10).max(18), smallPt: z.number().min(8).max(14),
    headingPt: z.number().min(14).max(30), titlePt: z.number().min(20).max(45),
    coverPt: z.number().min(28).max(60), lineHeight: z.number().min(1.2).max(1.8),
  }),
  page: z.strictObject({
    widthMm: z.literal(210), heightMm: z.literal(297), marginMm: z.number().min(10).max(25),
    headerMm: z.number().min(18).max(30), footerMm: z.number().min(10).max(20),
  }),
  spacing: z.strictObject({ blockMm: z.number().min(2).max(10), cardMm: z.number().min(2).max(10) }),
  borders: z.strictObject({ widthPx: z.number().min(0).max(3), radiusMm: z.number().min(0).max(8) }),
  shadow: z.strictObject({ yPx: z.number().min(0).max(20), blurPx: z.number().min(0).max(60), opacity: z.number().min(0).max(0.4) }),
});

export type EmbeddedImage = z.infer<typeof embeddedImageSchema>;
export type Page = z.infer<typeof pageSchema>;
export type Book = z.infer<typeof bookSchema>;
export type BookNumbering = Required<Pick<Book, 'pageNumbering' | 'firstContentPageSide'>>;
export type Design = z.infer<typeof designSchema>;
export interface BookData { book: Book; design: Design; pages: Page[] }
export interface PageOperationResult { book: Book; pages: Page[]; selectedId?: string }
