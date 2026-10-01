/**
 * Jev selection wiring in search_wwdc_content and search_apple_docs.
 * The Jev endpoint is faked at global.fetch (the seam tests/setup.ts already uses); the Apple search
 * response is the REAL captured jsonl fixture. WWDC data goes through the same data-source mock the
 * other WWDC handler tests use.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

jest.mock('../../src/utils/wwdc-data-source', () => ({
  loadGlobalMetadata: jest.fn(),
  loadYearIndex: jest.fn(),
  loadVideoData: jest.fn(),
}));

import AppleDeveloperDocsMCPServer from '../../src/index';
import { handleSearchWWDCContent } from '../../src/tools/wwdc/wwdc-handlers';
import { loadGlobalMetadata, loadYearIndex, loadVideoData } from '../../src/utils/wwdc-data-source';
import { jevScoreCache, searchCache } from '../../src/utils/cache';

const mockFetch = global.fetch as jest.Mock;
const ENV_KEYS = ['APPLE_DOCS_MCP_JEV_RERANK', 'APPLE_DOCS_MCP_JEV_PROVIDER', 'OPENROUTER_API_KEY'];
const savedEnv: Record<string, string | undefined> = {};

const enableJev = (): void => {
  process.env.APPLE_DOCS_MCP_JEV_RERANK = '1';
  process.env.APPLE_DOCS_MCP_JEV_PROVIDER = 'openrouter';
  process.env.OPENROUTER_API_KEY = 'test-key';
};

interface Sent {
  state: { rows: Array<Record<string, unknown>> };
  questions: Record<string, { instructions: string }>;
}
const sentBodies: Sent[] = [];

/** Fake System One endpoint: answers each row with score(row). */
const jevResponse = (score: (row: Record<string, unknown>) => number, init: { status?: number } = {}) =>
  (_url: string, req: RequestInit): Response => {
    const body = JSON.parse(req.body as string) as Sent;
    sentBodies.push(body);
    if (init.status) {
      return new Response('upstream said no', { status: init.status });
    }
    const answers: Record<string, unknown> = {};
    body.state.rows.forEach(r => {
      answers[String(r.id) + '.match'] = { type: 'noul', noul: score(r) };
    });
    return new Response(JSON.stringify({ answers, usage: { input_tokens: 10 }, cost: 0.0001 }), { status: 200 });
  };

const VIDEO_COUNT = 12;
const videoNo = (title: unknown): number => Number(String(title).replace('Video ', ''));

function mockWwdcCorpus(count: number = VIDEO_COUNT): void {
  (loadGlobalMetadata as jest.Mock).mockResolvedValue({ years: ['2025'] });
  (loadYearIndex as jest.Mock).mockResolvedValue({
    videos: Array.from({ length: count }, (_, i) => ({
      id: String(i), title: 'Video ' + i, topics: ['Swift'], hasCode: false, hasTranscript: true,
      dataFile: 'videos/2025-' + i + '.json',
    })),
  });
  (loadVideoData as jest.Mock).mockImplementation((year: string, id: string) => Promise.resolve({
    id, year, url: 'https://developer.apple.com/videos/play/wwdc2025/' + id + '/', title: 'Video ' + id,
    topics: ['Swift'], hasTranscript: true, hasCode: false, resources: {},
    transcript: { fullText: 'About concurrency in video ' + id, segments: [] },
  }));
}

const headingCount = (text: string): number => (text.match(/^## \[/gm) ?? []).length;

beforeEach(() => {
  ENV_KEYS.forEach(k => {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  });
  jevScoreCache.clear();
  searchCache.clear();
  sentBodies.length = 0;
  mockFetch.mockReset();
  mockWwdcCorpus();
});

afterEach(() => {
  ENV_KEYS.forEach(k => {
    if (savedEnv[k] === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = savedEnv[k];
    }
  });
});

describe('search_wwdc_content with Jev selection', () => {
  it('narrows 12 candidates to at most 5 and prints each score', async () => {
    enableJev();
    mockFetch.mockImplementation(jevResponse(r => 0.95 - videoNo(r.title) * 0.02));

    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20);

    expect(headingCount(text)).toBeGreaterThan(0);
    expect(headingCount(text)).toBeLessThanOrEqual(5);
    expect(text).toContain('relevance score 0.95');
    expect(text).toContain('Video 0');
    expect(sentBodies[0].questions['r0.match'].instructions).toContain('This WWDC session is what a developer looking for');
    // explicit row fields only, with the evidence snippet
    expect(Object.keys(sentBodies[0].state.rows[0]).sort()).toEqual(['evidence', 'id', 'title', 'topics', 'url']);
  });

  it('honours maxResults', async () => {
    enableJev();
    mockFetch.mockImplementation(jevResponse(() => 0.9));

    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20, undefined, 2);

    expect(headingCount(text)).toBe(2);
  });

  it('says so explicitly, with the best score, when nothing matches strongly', async () => {
    enableJev();
    mockFetch.mockImplementation(jevResponse(() => 0.12));

    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20);

    expect(headingCount(text)).toBe(1);
    expect(text).toContain('No strong match');
    expect(text).toContain('0.12');
  });

  it('leaves the output unchanged and never calls Jev when selection is off', async () => {
    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20);

    expect(headingCount(text)).toBe(VIDEO_COUNT);
    expect(text).not.toContain('relevance score');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('select: false stays off even when Jev is enabled', async () => {
    enableJev();

    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20, false);

    expect(headingCount(text)).toBe(VIDEO_COUNT);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('select: true while Jev is not enabled is an error naming APPLE_DOCS_MCP_JEV_RERANK', async () => {
    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20, true);

    expect(text).toMatch(/^Error:/);
    expect(text).toContain('APPLE_DOCS_MCP_JEV_RERANK');
    expect(headingCount(text)).toBe(0);
  });

  it('enabled but misconfigured is an error, not an unranked list', async () => {
    process.env.APPLE_DOCS_MCP_JEV_RERANK = '1';

    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20);

    expect(text).toMatch(/^Error:/);
    expect(text).toContain('APPLE_DOCS_MCP_JEV_PROVIDER');
    expect(headingCount(text)).toBe(0);
  });

  it('a Jev failure is an error, not an unranked fallback', async () => {
    enableJev();
    mockFetch.mockImplementation(jevResponse(() => 0, { status: 401 }));

    const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 20);

    expect(text).toMatch(/^Error:/);
    expect(text).toContain('401');
    expect(headingCount(text)).toBe(0);
  });

  describe('recall width', () => {
    const scoredRows = (): number => sentBodies.reduce((n, b) => n + b.state.rows.length, 0);

    it('select on without limit scores every candidate, more than the old default of 20', async () => {
      mockWwdcCorpus(30);
      enableJev();
      mockFetch.mockImplementation(jevResponse(() => 0.5));

      const text = await handleSearchWWDCContent('concurrency', 'transcript');

      expect(scoredRows()).toBe(30);
      expect(text).toContain('Selected 5 of 30 candidates by relevance (Jev)');
    });

    it('select on with an explicit limit caps the recall width', async () => {
      mockWwdcCorpus(30);
      enableJev();
      mockFetch.mockImplementation(jevResponse(() => 0.5));

      const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 10);

      expect(scoredRows()).toBe(10);
      // limit cut the 30 matching videos to 10 scored: the header must not pass 10 off as the whole match set
      expect(text).toContain('Selected 5 of 10 scored (of 30 matching) by relevance (Jev)');
    });

    it('select off without limit returns exactly 20 results and never calls Jev', async () => {
      mockWwdcCorpus(30);

      const text = await handleSearchWWDCContent('concurrency', 'transcript');

      expect(headingCount(text)).toBe(20);
      expect(text).not.toContain('Jev');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('select off rejects a limit above 100 with the cap named in the message', async () => {
      const text = await handleSearchWWDCContent('concurrency', 'transcript', undefined, undefined, 101);

      expect(text).toBe('Error: Failed to search WWDC content: limit above 100 needs select on (Jev); with select off the maximum is 100');
    });
  });
});

describe('search_apple_docs with Jev selection', () => {
  const jsonl = readFileSync(join(__dirname, '..', 'fixtures', 'apple-search-navigationstack.jsonl'), 'utf-8');
  const routeFetch = (jev: (url: string, req: RequestInit) => Response): void => {
    mockFetch.mockImplementation((url: string, req: RequestInit) =>
      Promise.resolve(url.includes('systemone') ? jev(url, req) : { ok: true, status: 200, text: () => Promise.resolve(jsonl) }));
  };
  const server = new AppleDeveloperDocsMCPServer();

  it('keeps only the best results and prints scores', async () => {
    enableJev();
    routeFetch(jevResponse(r => (r.title === 'NavigationStack' ? 0.9 : 0.1)));

    const res = await server.searchAppleDocs('SwiftUI NavigationStack', 'all', undefined, 3);
    const text = res.content[0].text;

    expect(text).toContain('**Results found:** 1');
    expect(text).toContain('NavigationStack');
    expect(text).toContain('**Relevance score:** 0.90');
    expect(sentBodies[0].questions['r0.match'].instructions).toContain('searching Apple developer documentation');
  });

  it('select off leaves the unscored list', async () => {
    routeFetch(jevResponse(() => 0.9));

    const res = await server.searchAppleDocs('SwiftUI NavigationStack', 'all');

    expect(res.content[0].text).not.toContain('Relevance score');
    expect(sentBodies).toHaveLength(0);
  });

  it('select: true while Jev is not enabled is a tool error', async () => {
    routeFetch(jevResponse(() => 0.9));

    const res = await server.searchAppleDocs('SwiftUI NavigationStack', 'all', true);

    expect(res).toHaveProperty('isError', true);
    expect(res.content[0].text).toContain('APPLE_DOCS_MCP_JEV_RERANK');
  });

  it('a Jev failure is a tool error, not an unranked list', async () => {
    enableJev();
    routeFetch(jevResponse(() => 0, { status: 401 }));

    const res = await server.searchAppleDocs('SwiftUI NavigationStack', 'all');

    expect(res).toHaveProperty('isError', true);
    expect(res.content[0].text).toContain('401');
    expect(res.content[0].text).not.toContain('Apple Documentation Search Results');
  });
});
