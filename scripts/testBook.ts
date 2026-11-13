import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from '../server/content';
import type { Book, Page } from '../src/types/schema';

// A fixed book keeps regression tests independent of pages edited by the user.
export async function writeTestBook(root: string) {
  await mkdir(path.join(root, 'content/pages'), { recursive: true });
  await mkdir(path.join(root, 'assets/images'), { recursive: true });
  await cp(path.join(projectRoot, 'content/design.json'), path.join(root, 'content/design.json'));
  await cp(path.join(projectRoot, 'assets/images/preset-image.svg'), path.join(root, 'assets/images/preset-image.svg'));
  await writeFile(path.join(root, 'assets/images/fixture.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="blue"/></svg>');
  const pages: Page[] = [
    {
      id: 'page-001-portada', template: 'cover', title: 'Portada de prueba', subtitle: 'Libro de prueba',
      blocks: [
        { id: 'cover-image', type: 'image', src: 'assets/images/fixture.svg', alt: 'Cuadrado azul', heightMm: 30, fit: 'contain' },
        { id: 'cover-card', type: 'infoCard', title: 'Propósito', content: 'Contenido de prueba.' },
      ],
      metadata: { status: 'draft', description: 'Portada de la prueba.' },
    },
    {
      id: 'page-002-concepto', template: 'lesson', title: 'Concepto de prueba', theme: { label: 'TEMA', title: 'Concepto' },
      blocks: [
        { id: 'concept-heading', type: 'heading', level: 2, text: 'Título de prueba' },
        { id: 'concept-text', type: 'paragraph', text: 'Texto de prueba.' },
      ],
      metadata: { status: 'draft', description: 'Concepto de la prueba.' },
    },
  ];
  const book: Book = {
    schemaVersion: 1,
    book: { id: 'libro-prueba', title: 'Libro de prueba', subtitle: 'Contenido aislado', grade: '1.º', author: 'Pruebas', language: 'es' },
    units: [], pageOrder: pages.map(page => ({ id: page.id, file: `pages/${page.id}.json` })),
  };
  await writeFile(path.join(root, 'content/book.json'), JSON.stringify(book));
  for (const page of pages) await writeFile(path.join(root, `content/pages/${page.id}.json`), JSON.stringify(page));
}
