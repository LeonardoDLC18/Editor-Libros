import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collector, httpGroups, httpReferenceFile, runHttpGroup } from './http-scenarios';

test('Etapa 1B: contratos HTTP reales en almacenamiento sintético', async t => {
  const expected = JSON.parse(await readFile(httpReferenceFile, 'utf8'));
  const observed = collector();
  for (const group of httpGroups) await t.test(group.name, () => runHttpGroup(group, observed.record));
  await t.test('referencias HTTP inmutables', () => {
    assert.deepEqual({ formatVersion: 1, records: observed.records }, expected);
  });
});
