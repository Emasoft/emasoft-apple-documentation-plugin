import https from 'node:https';
import { selectWithJev, pickTop, isJevEnabled, type JevRow } from '../../src/utils/jev-select';
import { jevScoreCache } from '../../src/utils/cache';
import { AppError } from '../../src/types/error';
import fixture from '../fixtures/jev-apple-navigationstack.json';

interface Sent {
  model: string;
  state: { rows: Array<Record<string, unknown>> };
  questions: Record<string, { type: string; instructions: string }>;
}
type Handler = (body: Sent, call: number) => Response;

const OPENROUTER_ENV = { APPLE_DOCS_MCP_JEV_PROVIDER: 'openrouter', OPENROUTER_API_KEY: 'test-key' };
const noSleep = async (): Promise<void> => undefined;

/** Fake System One endpoint: records every request, answers via `handler`. */
function fakeFetch(handler: Handler): jest.Mock {
  let call = 0;
  return jest.fn(async (_url: string, init: RequestInit) => handler(JSON.parse(init.body as string) as Sent, call++));
}

const answerWith = (score: (row: Record<string, unknown>, i: number) => number): Handler => body => {
  const answers: Record<string, unknown> = {};
  body.state.rows.forEach((r, i) => {
    answers[`${String(r.id)}.match`] = { type: 'noul', noul: score(r, i) };
  });
  return new Response(JSON.stringify({ answers, usage: { input_tokens: 100 }, cost: 0.0001 }), { status: 200 });
};

const rows = (n: number): JevRow[] => Array.from({ length: n }, (_, i) => ({ title: `row ${i}`, summary: `s${i}` }));
// score decreasing with the row number, so the selection is predictable
const byNumber = answerWith(r => 1 - Number(String(r.title).split(' ')[1]) / 1000);

beforeEach(() => {
  jevScoreCache.clear();
});

describe('selectWithJev batching', () => {
  it('sends 120 rows as 8 requests of at most 16 rows and keeps at most 5', async () => {
    const fetchImpl = fakeFetch(byNumber);
    const res = await selectWithJev('q', rows(120), { env: OPENROUTER_ENV, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(8);
    expect(res.requests).toBe(8);
    expect(res.scored).toBe(120);
    expect(res.selected.length).toBeLessThanOrEqual(5);
    expect(res.selected[0].index).toBe(0);
    expect(res.inputTokens).toBe(800);
    expect(res.costUsd).toBeCloseTo(0.0008);
  });

  it('caps candidates at 256 (16 requests)', async () => {
    const fetchImpl = fakeFetch(byNumber);
    const res = await selectWithJev('q', rows(300), { env: OPENROUTER_ENV, fetchImpl });
    expect(res.scored).toBe(256);
    expect(fetchImpl).toHaveBeenCalledTimes(16);
  });

  it('builds the request from explicit row fields, with row ids that a row id field cannot overwrite', async () => {
    const fetchImpl = fakeFetch(answerWith(() => 0.9));
    const withId = { title: 'T', id: 'evil', url: 'https://x' } as JevRow;
    await selectWithJev('my query', [withId], { env: OPENROUTER_ENV, fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Sent;
    expect(url).toBe('https://openrouter.ai/api/v1/systemone');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    expect(body.model).toBe('~typesafe/jev-latest');
    expect(Object.keys(body.questions)).toEqual(['r0.match']);
    expect(body.questions['r0.match'].type).toBe('noul');
    expect(body.questions['r0.match'].instructions).toMatch(/^Look only at the row with id "r0"\. .*"my query"/);
    expect(body.state.rows[0].title).toBe('T');
  });
});

describe('pickTop selection rules', () => {
  it('drops scores below 50 percent of the top', () => {
    const r = pickTop([0.9, 0.8, 0.44, 0.7], 5);
    expect(r.selected.map(s => s.index)).toEqual([0, 1, 3]);
    expect(r.noStrongMatch).toBe(false);
  });

  it('stops at a gap larger than 0.25 between consecutive scores', () => {
    const r = pickTop([0.95, 0.9, 0.6, 0.55], 5); // 0.9 -> 0.6 is a 0.30 gap, 0.6 is still above 50 percent
    expect(r.selected.map(s => s.index)).toEqual([0, 1]);
  });

  it('returns only the best row, labelled, when the top score is below 0.3', () => {
    const r = pickTop([0.21, 0.2, 0.1], 5);
    expect(r.selected).toEqual([{ index: 0, score: 0.21 }]);
    expect(r.noStrongMatch).toBe(true);
  });

  it('honours maxResults', () => {
    expect(pickTop([0.9, 0.89, 0.88, 0.87], 2).selected).toHaveLength(2);
  });
});

describe('selectWithJev failures', () => {
  it('retries a 429 honouring Retry-After, then succeeds', async () => {
    const sleep = jest.fn(noSleep);
    const fetchImpl = fakeFetch((body, call) =>
      call === 0
        ? new Response('slow down', { status: 429, headers: { 'retry-after': '2' } })
        : answerWith(() => 0.9)(body, call));
    const res = await selectWithJev('q', rows(3), { env: OPENROUTER_ENV, fetchImpl, sleep });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
    expect(res.selected.length).toBe(3);
  });

  it('fails immediately on 401 with the status, the key variable and the select:false hint', async () => {
    const fetchImpl = fakeFetch(() => new Response('bad key', { status: 401 }));
    const err = await selectWithJev('q', rows(3), { env: OPENROUTER_ENV, fetchImpl, sleep: noSleep }).catch((e: unknown) => e);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(err).toBeInstanceOf(AppError);
    const e = err as AppError;
    expect(e.message).toContain('HTTP 401');
    expect(e.suggestions?.join(' ')).toContain('OPENROUTER_API_KEY');
    expect(e.suggestions?.join(' ')).toContain('select: false');
  });

  it('fails after the retries are exhausted on a persistent 503', async () => {
    const fetchImpl = fakeFetch(() => new Response('down', { status: 503 }));
    await expect(selectWithJev('q', rows(2), { env: OPENROUTER_ENV, fetchImpl, sleep: noSleep })).rejects.toThrow(/after 5 attempts/);
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });

  it('fails with the deadline error when Retry-After does not fit the batch deadline', async () => {
    const fetchImpl = fakeFetch(() => new Response('busy', { status: 429, headers: { 'retry-after': '60' } }));
    await expect(selectWithJev('q', rows(2), { env: OPENROUTER_ENV, fetchImpl, sleep: noSleep })).rejects.toThrow(/batch deadline/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('fails on a response that lacks an answer for a row', async () => {
    const fetchImpl = fakeFetch(() => new Response(JSON.stringify({ answers: {} }), { status: 200 }));
    await expect(selectWithJev('q', rows(2), { env: OPENROUTER_ENV, fetchImpl })).rejects.toThrow(/malformed/);
  });

  it('fails the whole selection when one batch fails, with no partial result', async () => {
    const fetchImpl = fakeFetch((body, call) =>
      call === 1 ? new Response('nope', { status: 400 }) : answerWith(() => 0.9)(body, call));
    await expect(selectWithJev('q', rows(40), { env: OPENROUTER_ENV, fetchImpl, sleep: noSleep })).rejects.toThrow(/HTTP 400/);
  });
});

describe('selectWithJev configuration', () => {
  const fetchImpl = fakeFetch(answerWith(() => 0.9));

  it('names the provider variable when none is chosen', async () => {
    await expect(selectWithJev('q', rows(1), { env: { OPENROUTER_API_KEY: 'k' }, fetchImpl })).rejects.toThrow(/APPLE_DOCS_MCP_JEV_PROVIDER/);
  });

  it('names the key variable when the chosen provider has no key', async () => {
    await expect(selectWithJev('q', rows(1), { env: { APPLE_DOCS_MCP_JEV_PROVIDER: 'typesafe' }, fetchImpl })).rejects.toThrow(/TYPESAFE_API_KEY/);
  });

  it('requires JEV_GATEWAY_URL for the gateway provider', async () => {
    const env = { APPLE_DOCS_MCP_JEV_PROVIDER: 'gateway', JEV_GATEWAY_API_KEY: 'k' };
    await expect(selectWithJev('q', rows(1), { env, fetchImpl })).rejects.toThrow(/JEV_GATEWAY_URL/);
  });

  it('never auto-picks a provider from a key that happens to be set', async () => {
    await expect(selectWithJev('q', rows(1), { env: { TYPESAFE_API_KEY: 'k', OPENROUTER_API_KEY: 'k' }, fetchImpl })).rejects.toThrow(/APPLE_DOCS_MCP_JEV_PROVIDER/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('is enabled only by APPLE_DOCS_MCP_JEV_RERANK=1', () => {
    expect(isJevEnabled({ OPENROUTER_API_KEY: 'k' })).toBe(false);
    expect(isJevEnabled({ APPLE_DOCS_MCP_JEV_RERANK: '1' })).toBe(true);
  });
});

describe('selectWithJev cache', () => {
  it('scores a row once: a second identical call sends no request', async () => {
    const fetchImpl = fakeFetch(byNumber);
    const first = await selectWithJev('q', rows(20), { env: OPENROUTER_ENV, fetchImpl });
    const second = await selectWithJev('q', rows(20), { env: OPENROUTER_ENV, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // 20 rows = 2 batches, first call only
    expect(second.requests).toBe(0);
    expect(second.selected).toEqual(first.selected);
  });

  it('keys the cache on the query', async () => {
    const fetchImpl = fakeFetch(byNumber);
    await selectWithJev('one', rows(3), { env: OPENROUTER_ENV, fetchImpl });
    await selectWithJev('two', rows(3), { env: OPENROUTER_ENV, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe('recorded real Jev scores (offline fixture)', () => {
  it('replays the real SwiftUI NavigationStack rows and selects the recorded winner', async () => {
    const recorded = new Map(fixture.rows.map((r, i) => [JSON.stringify(r), fixture.scores[i]]));
    const fetchImpl = fakeFetch(answerWith(r => {
      const fields = { ...r };
      delete fields.id; // the request row carries the Jev row id; the recorded rows do not
      return recorded.get(JSON.stringify(fields)) as number;
    }));
    const res = await selectWithJev(fixture.query, fixture.rows, { env: OPENROUTER_ENV, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(2); // 17 rows
    expect(res.selected.map(s => fixture.rows[s.index].title)).toEqual(fixture.expectedTitles);
  });
});

// Real provider call, run by hand: APPLE_DOCS_MCP_JEV_LIVE=1 OPENROUTER_API_KEY=... npx jest tests/utils/jev-select.test.ts
// tests/setup.ts replaces global.fetch with a mock, so the live call goes through node:https.
const httpsFetch = ((url: string, init: RequestInit) =>
  new Promise<Response>((resolve, reject) => {
    const req = https.request(url, { method: 'POST', headers: init.headers as Record<string, string> }, res => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(new Response(Buffer.concat(chunks).toString('utf8'), {
        status: res.statusCode,
        headers: res.headers as Record<string, string>,
      })));
    });
    req.on('error', reject);
    req.end(init.body as string);
  })) as unknown as typeof fetch;

(process.env.APPLE_DOCS_MCP_JEV_LIVE === '1' ? it : it.skip)('live smoke: the real provider ranks NavigationStack first', async () => {
  const env = { ...process.env, APPLE_DOCS_MCP_JEV_PROVIDER: process.env.APPLE_DOCS_MCP_JEV_PROVIDER ?? 'openrouter' };
  const res = await selectWithJev(fixture.query, fixture.rows, { env, fetchImpl: httpsFetch });
  expect(fixture.rows[res.selected[0].index].title).toBe('NavigationStack');
  expect(res.inputTokens).toBeGreaterThan(0);
}, 60000);
