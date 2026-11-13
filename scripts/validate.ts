import { ContentError, loadBook } from '../server/content';
import { allBlocks } from '../src/utils/blocks';

try {
  const data = await loadBook();
  const blocks = data.pages.reduce((sum, page) => sum + allBlocks(page.blocks).length, 0);
  console.log(`Validación exitosa: ${data.pages.length} páginas, ${blocks} bloques y recursos locales correctos.`);
} catch (error) {
  console.error('Validación fallida:');
  if (error instanceof ContentError) for (const issue of error.issues) console.error(`  • ${issue}`);
  else console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
