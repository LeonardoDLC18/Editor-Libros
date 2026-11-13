import type { Page } from '../types/schema';

export function PageHeading({ page }: { page: Page }) {
  const style = page.titleStyle ?? 'existing';
  const showTitle = style !== 'none' && !!page.title?.trim();
  const showSubtitle = !!page.subtitle?.trim();
  const cover = page.template === 'cover';
  const showEyebrow = cover && !!page.eyebrow?.trim();
  if (!showTitle && !showSubtitle && !showEyebrow) return null;

  const heading = <>
    {showEyebrow && <span className="eyebrow">{page.eyebrow}</span>}
    {showTitle && page.template === 'lesson' && style === 'existing' && page.theme &&
      <div className="topic-band"><span>{page.theme.label}</span><strong>{page.theme.title}</strong></div>}
    {showTitle && (style === 'split'
      ? <h1 className="page-title-split"><span className="title-primary">{page.title}</span>{page.titleSecondary?.trim() && <span className="title-secondary">{page.titleSecondary}</span>}</h1>
      : <h1 className={style === 'simple' ? 'page-title-simple' : undefined}>{page.title}</h1>)}
    {showSubtitle && <p className={cover ? 'cover-subtitle' : 'lesson-subtitle'}>{page.subtitle}</p>}
  </>;
  return cover ? <div className="cover-heading">{heading}</div> : heading;
}
