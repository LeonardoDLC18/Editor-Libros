import { writeFile } from 'node:fs/promises';
import { collector, httpGroups, httpReferenceFile, runHttpGroup } from './http-scenarios';

if (process.argv.length !== 3 || process.argv[2] !== '--update') throw new Error('Explicit --update required');
const observed = collector();
for (const group of httpGroups) await runHttpGroup(group, observed.record);
await writeFile(httpReferenceFile, `${JSON.stringify({ formatVersion: 1, records: observed.records }, null, 2)}\n`, 'utf8');
console.log(`Generated ${observed.records.length} observed HTTP exchanges in ${httpGroups.length} isolated groups.`);
