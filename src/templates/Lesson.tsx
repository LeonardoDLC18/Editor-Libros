import { BlockRenderer } from '../renderer/BlockRenderer';
import { PageHeading } from '../renderer/PageHeading';
import type { TemplateProps } from './Cover';

export function Lesson({ page, selectedBlock, onSelectBlock, onEditCell }: TemplateProps) {
  return <div className="page-body lesson-body">
    <PageHeading page={page} />
    <div className="blocks">
      {page.blocks.map((block) => <BlockRenderer key={block.id} block={block} selectedId={selectedBlock} onSelect={onSelectBlock} onEditCell={onEditCell} />)}
    </div>
  </div>;
}
