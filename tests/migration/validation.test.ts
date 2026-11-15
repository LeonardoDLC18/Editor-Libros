import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cases, observe, referenceFile } from './cases';

// Read-only expectations: missing/stale references fail; never regenerate here.
const reference = JSON.parse(await readFile(referenceFile, 'utf8'));
test('Reference format and complete ordered case list', () => {
  assert.equal(reference.formatVersion, 1);
  assert.deepEqual(reference.records.map((record: any) => record.id), cases.map(item => item.id));
});
for (const [index, item] of cases.entries()) {
  test(`${item.id}: ${item.rule}`, async () => {
    assert.deepEqual(await observe(item), reference.records[index]);
  });
}
