import type { Page } from '../types/schema';

export const defaultTheme = { label: 'TEMA', title: 'Nuevo tema' };
export const templateLabels = { cover: 'Portada', lesson: 'Página conceptual', blank: 'Página en blanco' };

export function changeTemplate(page: Page, template: Page['template']): Page {
  return {
    ...page, template,
    ...(template === 'lesson' && !page.theme ? { theme: { ...defaultTheme } } : {}),
  };
}
