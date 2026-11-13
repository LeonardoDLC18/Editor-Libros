import type { CSSProperties } from 'react';
import type { Design } from '../types/schema';

export function designTokens(design: Design): CSSProperties {
  const vars: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(design.colors)) vars[`--color-${key}`] = value;
  for (const [key, value] of Object.entries(design.fonts)) vars[`--font-${key}`] = value;
  for (const [key, value] of Object.entries(design.typeScale)) {
    vars[`--type-${key}`] = key === 'lineHeight' ? value : `${value}pt`;
  }
  for (const [key, value] of Object.entries(design.page)) vars[`--page-${key}`] = `${value}mm`;
  for (const [key, value] of Object.entries(design.spacing)) vars[`--space-${key}`] = `${value}mm`;
  vars['--border-width'] = `${design.borders.widthPx}px`;
  vars['--border-radius'] = `${design.borders.radiusMm}mm`;
  vars['--paper-shadow'] = `0 ${design.shadow.yPx}px ${design.shadow.blurPx}px color-mix(in srgb, ${design.colors.navy} ${design.shadow.opacity * 100}%, transparent)`;
  return vars as CSSProperties;
}
