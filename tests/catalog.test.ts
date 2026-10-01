import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../worker/index';
import { buildCatalog } from '../worker/catalog';

const details = Array.from({ length: 500 }, (_, i) => ({ token: `app-${i}`, name: [`App ${i}`], homepage: 'https://example.com' }));
const analytics = { items: details.map((d, i) => ({ cask: d.token, number: i + 1, count: '1', percent: '1' })) };
const snapshot = buildCatalog(details, analytics, '2026-10-01T00:00:00Z');

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('d1/schema.sql', 'utf8'));
  const values = new Map([['catalog', JSON.stringify(snapshot)], ['updatedAt', snapshot.updatedAt]]);
  const counters = { sql: [] as string[], kvReads: 0, kvWrites: 0 };
  const cachedResponses = new Map<string, Response>();
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: {
    match: async (request: Request) => cachedResponses.get(request.url)?.clone(),
    put: async (request: Request, response: Response) => { cachedResponses.set(request.url, response.clone()); },
  } } });
  const env = {
    CATALOG: {
      get: async (key: string, options?: { type?: string }) => {
        counters.kvReads++;
        const value = values.get(key) ?? null;
        return value && options?.type === 'json' ? JSON.parse(value) : value;
      },
      put: async (key: string, value: string) => { counters.kvWrites++; values.set(key, value); },
    },
    DB: { prepare(sql: string) {
      counters.sql.push(sql);
      let args: any[] = [];
      const statement = {
        bind(...values: any[]) { args = values; return statement; },
        async first() { return db.prepare(sql).get(...args) ?? null; },
        async all() { return { results: db.prepare(sql).all(...args) }; },
        async run() { return db.prepare(sql).run(...args); },
      };
      return statement;
    } },
    ASSETS: { fetch: async () => new Response('asset') },
  };
  async function call(procedure: string, input?: unknown, method = 'GET') {
    const pending: Promise<unknown>[] = [];
    const ctx = { waitUntil: (promise: Promise<unknown>) => pending.push(promise) };
    const url = new URL(`https://example.com/api/trpc/${procedure}`);
    if (method === 'GET') url.searchParams.set('input', JSON.stringify(input ?? null));
    const request = new Request(url, { method, ...(method === 'POST' ? { body: JSON.stringify(input) } : {}) });
    const response = await worker.fetch(request, env as any, ctx as any);
    await Promise.all(pending);
    return { response, body: await response.json() as any };
  }
  return { env, counters, call, values, db };
}

test('cold browse, arbitrary searches and metadata read zero D1 rows; cache hits read no KV', async () => {
  const f = fixture();
  const first = await f.call('getCasks', { query: '' });
  assert.equal(first.body.result.data.length, 200);
  assert.equal(first.body.result.data[0].id, 'app-0');
  assert.equal(f.counters.kvReads, 1);
  for (const query of [' App 49 ', 'app-99', 'absent', '%', '_']) {
    const result = await f.call('getCasks', { query });
    assert.equal(result.response.status, 200);
    if (query === ' App 49 ') assert.equal(result.body.result.data[0].id, 'app-49');
    if (query === 'absent' || query === '%' || query === '_') assert.equal(result.body.result.data.length, 0);
  }
  assert.equal(f.counters.kvReads, 1, 'searches reuse the parsed snapshot');
  await f.call('getCasks', { query: 'app 49' });
  assert.equal(f.counters.kvReads, 1, 'normalized search hits cache');
  const updated = await f.call('getLastUpdated');
  assert.equal(updated.body.result.data, snapshot.updatedAt);
  await f.call('getLastUpdated');
  assert.equal(f.counters.kvReads, 2);
  assert.equal(f.counters.sql.length, 0, 'public paths must never call D1');
  assert.equal(f.counters.kvWrites, 0);
  const page = await f.call('getCasks', { skip: 200, take: 10 });
  assert.equal(page.body.result.data[0].id, 'app-200');
});

test('query limits prevent unbounded responses, wildcard scans and invalid pagination', async () => {
  const f = fixture();
  for (const input of [{ take: -1 }, { take: 201 }, { skip: -1 }, { skip: 10001 }, { take: 1.5 }, { query: 42 }, { query: 'x'.repeat(101) }]) {
    assert.equal((await f.call('getCasks', input)).response.status, 400);
  }
  assert.equal((await f.call('getCasks', {}, 'POST')).response.status, 405);
  assert.equal(f.counters.kvReads, 0);
  assert.equal(f.counters.sql.length, 0);
});

test('new casks persist only on selection; saved sessions and Brewfile remain functional', async () => {
  const f = fixture();
  const session = (await f.call('createNewSession', {}, 'POST')).body.result.data;
  const input = { sessionId: session.id, accessToken: session.accessToken, caskId: 'app-99' };
  assert.equal((await f.call('addCaskToSession', { ...input, accessToken: 'wrong' }, 'POST')).response.status, 401);
  assert.equal(f.counters.kvReads, 0);
  const added = (await f.call('addCaskToSession', input, 'POST')).body.result.data;
  assert.equal(added.casks[0].id, 'app-99');
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM Cask').get()?.n, 1);
  assert.equal((await f.call('getSession', { sessionId: session.id })).body.result.data.casks[0].id, 'app-99');
  const copied = (await f.call('createNewSession', {}, 'POST')).body.result.data;
  assert.equal((await f.call('copyCasksBetweenSessions', { sourceSessionId: session.id, destinationSessionId: copied.id, destinationSessionAccessToken: copied.accessToken }, 'POST')).response.status, 200);
  assert.equal((await f.call('getSession', { sessionId: copied.id })).body.result.data.casks[0].id, 'app-99');
  const download = await worker.fetch(new Request(`https://example.com/api/download?session=${copied.id}&file`), f.env as any, {} as any);
  assert.equal(await download.text(), 'cask "app-99"');
  assert.equal((await f.call('removeCaskFromSession', input, 'POST')).body.result.data.casks.length, 0);
});

test('daily refresh publishes two KV keys and never reads or writes D1', async () => {
  const f = fixture();
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => Response.json(String(input).includes('analytics') ? analytics : details);
  try {
    const pending: Promise<unknown>[] = [];
    await worker.scheduled({} as any, f.env as any, { waitUntil: (p: Promise<unknown>) => pending.push(p) } as any);
    await Promise.all(pending);
    assert.equal(f.counters.kvWrites, 2);
    assert.equal(f.counters.sql.length, 0);
    assert.equal(JSON.parse(f.values.get('catalog')!).casks.length, 500);
  } finally { globalThis.fetch = original; }
});

test('empty or failed upstream refresh preserves the previous snapshot', async () => {
  const f = fixture();
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => Response.json(String(input).includes('analytics') ? analytics : []);
  try {
    const pending: Promise<unknown>[] = [];
    await worker.scheduled({} as any, f.env as any, { waitUntil: (p: Promise<unknown>) => pending.push(p) } as any);
    await assert.rejects(Promise.all(pending), /empty snapshot/);
    assert.equal(f.counters.kvWrites, 0);
    assert.equal(f.values.get('catalog'), JSON.stringify(snapshot));
  } finally { globalThis.fetch = original; }
});
