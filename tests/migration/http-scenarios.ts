import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../../server/app';
import { cases } from './cases';

export const httpReferenceFile = new URL('./http-references.json', import.meta.url);
// sendFile denies dot directories by default; keep that protection unchanged.
const base = tmpdir();
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=', 'base64');
const sha = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const keys = (value: object, expected: string[]) => assert.deepEqual(Object.keys(value).sort(), expected.sort());
const clone = <T>(value: T): T => structuredClone(value);

async function guard(root: string) {
  const relative = path.relative(base, root);
  assert.ok(path.isAbsolute(root) && relative.startsWith('migration-http-') && !relative.includes(path.sep));
  assert.equal(await realpath(root), path.join(await realpath(base), relative));
}
type RecordHttp = (name: string, request: unknown, response: unknown) => void;
async function fixture(group: string, record: RecordHttp, run: (f: any) => Promise<void>) {
  await mkdir(base, { recursive: true });
  const root = await mkdtemp(path.join(base, 'migration-http-'));
  let server: Server | undefined;
  try {
    await guard(root);
    // Reuse only the synthetic in-memory context from 1A, never its references or real data.
    const initial = clone(cases.find(item => item.id === 'book-valid')!.context!);
    const first = initial.pages[0] as any;
    const second = { ...clone(first), id: 'page-two', title: 'Segunda sintética', blocks: [{ id: 'text-two', type: 'paragraph', text: 'Dos.' }] };
    initial.pages.push(second);
    initial.book.pageOrder = [second, first].map(p => ({ id: p.id, file: `pages/${p.id}.json` }));
    for (const folder of ['content/pages', 'assets/images', 'diagrams/svg']) await mkdir(path.join(root, folder), { recursive: true });
    await writeFile(path.join(root, 'content/book.json'), JSON.stringify(initial.book));
    await writeFile(path.join(root, 'content/design.json'), JSON.stringify(initial.design));
    for (const page of initial.pages as any[]) await writeFile(path.join(root, `content/pages/${page.id}.json`), JSON.stringify(page));
    for (const [src, bytes] of Object.entries(initial.resources)) await writeFile(path.join(root, src), bytes);
    await writeFile(path.join(root, 'assets/images/preset-image.svg'), svg);
    await writeFile(path.join(root, 'diagrams/svg/test.svg'), svg);
    // A recognizable file outside each permitted resource folder, still inside the fixture.
    await writeFile(path.join(root, 'outside.svg'), 'PRIVATE-SYNTHETIC');
    server = createServer(createApp(root));
    await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    assert.ok(address && typeof address !== 'string' && address.address === '127.0.0.1');
    const origin = `http://127.0.0.1:${address.port}`;
    const request = async (name: string, method: string, route: string, body?: unknown, headers: Record<string, string> = {}) => {
      // Validate destination before every HTTP operation, including deletes/uploads.
      await guard(root);
      assert.ok(route.startsWith('/') && !route.startsWith('//'));
      const binary = Buffer.isBuffer(body);
      const raw = typeof body === 'string';
      const payload = body === undefined ? undefined : binary || raw ? body : JSON.stringify(body);
      const sentHeaders = body === undefined ? headers : { 'Content-Type': 'application/json', ...headers };
      const response = await fetch(origin + route, { method, headers: sentHeaders, body: payload as any, signal: AbortSignal.timeout(10000), redirect: 'error' });
      const bytes = Buffer.from(await response.arrayBuffer());
      const type = response.headers.get('content-type');
      const result = { status: response.status, contentType: type,
        body: type?.startsWith('application/json') && method !== 'HEAD' ? JSON.parse(bytes.toString('utf8')) : bytes.toString('utf8') };
      record(`${group}/${name}`, { method, route, headers: sentHeaders, body: binary ? { hex: body.toString('hex') } : body ?? null }, result);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      return result;
    };
    const json = async (name: string, method: string, route: string, body?: unknown, status = 200) => {
      const result = await request(name, method, route, body);
      assert.equal(result.status, status, `${name}: ${JSON.stringify(result.body)}`);
      assert.match(result.contentType ?? '', /^application\/json; charset=utf-8$/);
      if (status >= 400) assert.equal(typeof result.body.message, 'string');
      return result.body;
    };
    const diskPage = (id: string) => readFile(path.join(root, `content/pages/${id}.json`), 'utf8');
    await run({ root, initial, first, second, request, json, diskPage });
  } finally {
    // Closing the listener and removing only this run's directory also happens after failures.
    try {
      if (server) {
        server.closeAllConnections();
        if (server.listening) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
      }
    } finally {
      await guard(root);
      await rm(root, { recursive: true, force: true });
    }
  }
}
type Group = { name: string; run: (f: any) => Promise<void> };
export const httpGroups: Group[] = [
  { name: 'book', run: async ({ json, initial, second, first }) => {
    const data = await json('read', 'GET', '/api/book');
    keys(data, ['book', 'design', 'pages']);
    assert.deepEqual(data, { book: initial.book, design: initial.design, pages: [second, first] });
  } },
  { name: 'save', run: async ({ root, json, first, diskPage }) => {
    const before = await diskPage(first.id);
    const next = clone(first); next.blocks[0].text = 'Editado por HTTP.';
    const result = await json('valid', 'PUT', `/api/pages/${first.id}`, next);
    keys(result, ['page']); assert.deepEqual(result.page, next);
    assert.deepEqual(JSON.parse(await diskPage(first.id)), next);
    assert.deepEqual((await json('reread', 'GET', '/api/book')).pages.find((p: any) => p.id === first.id), next);
    const backups = await readdir(path.join(root, 'content/backups'));
    assert.equal(backups.length, 1);
    assert.equal(await readFile(path.join(root, 'content/backups', backups[0]), 'utf8'), before);
    for (const [name, invalid] of [['protected', { ...next, metadata: { ...next.metadata, status: 'ready' } }], ['invalid', { ...next, template: 'unknown' }]] as const) {
      const saved = await diskPage(first.id);
      await json(name, 'PUT', `/api/pages/${first.id}`, invalid, 422);
      assert.equal(await diskPage(first.id), saved);
      assert.deepEqual(await readdir(path.join(root, 'content/backups')), backups);
    }
  } },
  { name: 'pages', run: async ({ root, json, first, second, diskPage }) => {
    const original = await diskPage(first.id);
    const created = await json('create', 'POST', '/api/pages', { template: 'cover' });
    keys(created, ['book', 'pages', 'selectedId']);
    const added = created.pages.at(-1);
    assert.equal(added.id, created.selectedId); assert.equal(added.template, 'cover');
    assert.deepEqual(JSON.parse(await diskPage(added.id)), added);
    assert.deepEqual(created.pages.map((p: any) => p.id), [second.id, first.id, added.id]);
    assert.deepEqual(created.book.pageOrder.map((p: any) => p.id), created.pages.map((p: any) => p.id));
    const copy = await json('duplicate', 'POST', `/api/pages/${first.id}/duplicate`, {});
    const duplicate = copy.pages.find((p: any) => p.id === copy.selectedId);
    const ids = copy.pages.map((p: any) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.indexOf(duplicate.id), ids.indexOf(first.id) + 1);
    assert.equal(duplicate.blocks[0].text, first.blocks[0].text);
    assert.notEqual(duplicate.blocks[0].id, first.blocks[0].id);
    assert.deepEqual(JSON.parse(await diskPage(duplicate.id)), duplicate);
    assert.deepEqual(copy.book.pageOrder.map((p: any) => p.id), ids);
    assert.equal(await diskPage(first.id), original);
    for (const id of [added.id, duplicate.id, second.id]) {
      const removed = await json(`delete-${id}`, 'DELETE', `/api/pages/${id}`, {});
      keys(removed, ['book', 'pages', 'selectedId']);
      assert.ok(!removed.pages.some((p: any) => p.id === id));
      assert.deepEqual(removed.book.pageOrder.map((p: any) => p.id), removed.pages.map((p: any) => p.id));
      assert.ok(removed.pages.some((p: any) => p.id === removed.selectedId));
      await assert.rejects(diskPage(id), { code: 'ENOENT' });
    }
    await json('last-page', 'DELETE', `/api/pages/${first.id}`, {}, 409);
    assert.equal(await diskPage(first.id), original);
    assert.equal(JSON.parse(await readFile(path.join(root, 'content/book.json'), 'utf8')).pageOrder.length, 1);
    assert.deepEqual((await json('reread', 'GET', '/api/book')).pages.map((p: any) => p.id), [first.id]);
  } },
  { name: 'book-settings', run: async ({ root, json, first, second }) => {
    const ordered = await json('order', 'PUT', '/api/book/page-order', { pageOrder: [first.id, second.id] });
    keys(ordered, ['book', 'pages']);
    assert.deepEqual(ordered.pages.map((p: any) => p.id), [first.id, second.id]);
    const numbering = { pageNumbering: 'alternate', firstContentPageSide: 'left' };
    const result = await json('numbering', 'PUT', '/api/book/numbering', numbering);
    keys(result, ['book', 'pages']);
    for (const [key, value] of Object.entries(numbering)) assert.equal(result.book[key], value);
    const file = path.join(root, 'content/book.json'); const saved = await readFile(file, 'utf8');
    assert.deepEqual(JSON.parse(saved), result.book);
    await json('bad-order', 'PUT', '/api/book/page-order', { pageOrder: [first.id, first.id] }, 422);
    await json('bad-numbering', 'PUT', '/api/book/numbering', { ...numbering, pageNumbering: 'invalid' }, 422);
    assert.equal(await readFile(file, 'utf8'), saved);
    assert.deepEqual((await json('reread', 'GET', '/api/book')).book, result.book);
  } },
  { name: 'upload', run: async ({ root, request }) => {
    const headers = { 'Content-Type': 'image/png', 'X-File-Name': encodeURIComponent('píxel de prueba.png') };
    const first = await request('binary', 'POST', '/api/images', png, headers);
    assert.equal(first.status, 200); assert.match(first.contentType, /^application\/json/);
    keys(first.body, ['src']);
    assert.match(first.body.src, /^assets\/images\/imagen-[a-f0-9-]{36}\.png$/);
    assert.deepEqual(await readFile(path.join(root, first.body.src)), png);
    const second = await request('deduplicate', 'POST', '/api/images', png, headers);
    assert.equal(second.status, 200); assert.deepEqual(second.body, first.body);
    assert.equal((await readdir(path.join(root, 'assets/images'))).filter((name: string) => name.endsWith('.png')).length, 1);
    const rejected = await request('mismatch', 'POST', '/api/images', png, { ...headers, 'Content-Type': 'image/jpeg' });
    assert.equal(rejected.status, 415);
  } },
  { name: 'image-cleanup', run: async ({ root, json }) => {
    await guard(root);
    for (const name of ['orphan', 'draft']) await writeFile(path.join(root, `assets/images/${name}.svg`), svg + `<!--${name}-->`);
    const inventory = await json('analyze', 'POST', '/api/images/analyze', { references: [] });
    keys(inventory, ['total', 'used', 'unused', 'recoverableBytes']);
    assert.equal(inventory.total, 4); assert.equal(inventory.used, 2);
    assert.deepEqual(inventory.unused.map((i: any) => i.src).sort(), ['assets/images/draft.svg', 'assets/images/orphan.svg']);
    const draftRefs = ['assets/images/draft.svg'];
    const draft = await json('draft', 'POST', '/api/images/analyze', { references: draftRefs });
    assert.deepEqual(draft.unused.map((i: any) => i.src), ['assets/images/orphan.svg']);
    const used = { src: 'assets/images/test.svg', size: Buffer.byteLength(svg), hash: sha(svg) };
    const selected = [...inventory.unused, used];
    for (const item of selected) { assert.equal(item.hash, sha(await readFile(path.join(root, item.src)))); }
    const removed = await json('delete-unused', 'POST', '/api/images/delete-unused', { selected, references: draftRefs });
    keys(removed, ['deleted', 'skipped', 'total', 'used', 'unused', 'recoverableBytes']);
    assert.deepEqual(removed.deleted, ['assets/images/orphan.svg']);
    assert.deepEqual([...removed.skipped].sort(), ['assets/images/draft.svg', 'assets/images/test.svg']);
    await assert.rejects(readFile(path.join(root, 'assets/images/orphan.svg')), { code: 'ENOENT' });
    assert.equal(await readFile(path.join(root, used.src), 'utf8'), svg);
    assert.equal(await readFile(path.join(root, draftRefs[0]), 'utf8'), svg + '<!--draft-->');
  } },
  { name: 'resources', run: async ({ request }) => {
    for (const route of ['/assets/images/test.svg', '/diagrams/svg/test.svg']) {
      const get = await request(`get-${route}`, 'GET', route);
      assert.equal(get.status, 200); assert.match(get.contentType, /^image\/svg\+xml/); assert.equal(get.body, svg);
      const head = await request(`head-${route}`, 'HEAD', route);
      assert.equal(head.status, 200); assert.equal(head.contentType, get.contentType); assert.equal(head.body, '');
    }
    for (const route of ['/assets/%2e%2e%2foutside.svg', '/diagrams/%2e%2e%2foutside.svg', '/assets/images/missing.svg']) {
      const result = await request(`reject-${route}`, 'GET', route);
      assert.equal(result.status, 404); assert.ok(!result.body.includes('PRIVATE-SYNTHETIC'));
    }
  } },
  { name: 'errors', run: async ({ json, request, first, diskPage }) => {
    const before = await diskPage(first.id);
    await json('malformed', 'PUT', `/api/pages/${first.id}`, '{', 400);
    await json('unknown-route', 'GET', '/api/not-existing', undefined, 404);
    await json('unknown-page', 'PUT', '/api/pages/missing', { ...first, id: 'missing' }, 404);
    await json('validation', 'PUT', `/api/pages/${first.id}`, { ...first, blocks: [{ id: 'x', type: 'unknown' }] }, 422);
    const wrongType = await request('media-type', 'PUT', `/api/pages/${first.id}`, '{}', { 'Content-Type': 'text/plain' });
    assert.equal(wrongType.status, 415);
    const crossSite = await request('origin', 'PUT', `/api/pages/${first.id}`, first, { Origin: 'https://other.invalid' });
    assert.equal(crossSite.status, 403);
    assert.equal(await diskPage(first.id), before);
  } },
];

export function collector() {
  const records: unknown[] = [];
  const aliases = new Map<string, string>();
  function normalize(value: unknown): unknown {
    if (typeof value === 'string') return value.replace(/assets\/images\/imagen-[a-f0-9-]{36}\.png/g, src => {
      if (!aliases.has(src)) aliases.set(src, `assets/images/imagen-<uuid-${aliases.size + 1}>.png`);
      return aliases.get(src)!;
    });
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]));
    return value;
  }
  return { records, record: (name: string, request: unknown, response: unknown) => records.push(normalize({ name, request, response })) };
}
export const runHttpGroup = (group: Group, record: RecordHttp) => fixture(group.name, record, group.run);
