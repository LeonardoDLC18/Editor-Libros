import type { Page } from '../types/schema';
import { BlockRenderer } from '../renderer/BlockRenderer';
import { PageHeading } from '../renderer/PageHeading';
import type { EditCell } from '../renderer/TableBlock';

export interface TemplateProps { page: Page; selectedBlock?: string; onSelectBlock?: (id: string) => void; onEditCell?: EditCell }

export function Cover({ page, selectedBlock, onSelectBlock, onEditCell }: TemplateProps) {
  return <div className="page-body cover-body">
    <PageHeading page={page} />
    <div className="blocks cover-blocks">
      {page.blocks.map((block) => <BlockRenderer key={block.id} block={block} selectedId={selectedBlock} onSelect={onSelectBlock} onEditCell={onEditCell} />)}
    </div>
  </div>;
}
