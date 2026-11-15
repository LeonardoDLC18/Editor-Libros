import { writeFile } from 'node:fs/promises';
import { cases, observe, referenceFile } from './cases';

if (process.argv.length !== 3 || process.argv[2] !== '--update') throw new Error('Explicit --update required');
const records = [];
for (const item of cases) records.push(await observe(item));
await writeFile(referenceFile, `${JSON.stringify({ formatVersion: 1, records }, null, 2)}\n`, 'utf8');
console.log(`Generated ${records.length} observed reference cases. Review changes before accepting them.`);
