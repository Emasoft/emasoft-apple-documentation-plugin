/**
 * Tests for fetchAppleDocsSearch (issues #51, #43).
 *
 * Fixtures under tests/fixtures/apple-search-*.jsonl are REAL responses captured
 * from https://devintserv.msc.sbz.apple.com/api/v1/query while fixing this bug
 * (the endpoint developer.apple.com/search/ itself calls client-side) — not
 * hand-written, so the diff-stream reconstruction is exercised against the
 * actual wire format, including its removeLast/append semantics.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { fetchAppleDocsSearch } from '../../src/tools/apple-search-api.js';

const fixturesDir = join(__dirname, '..', 'fixtures');
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), 'utf-8');

const mockFetch = global.fetch as jest.Mock;
const searchUrl = 'https://developer.apple.com/search/?q=test';

function mockJsonlResponse(jsonl: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(jsonl),
  });
}

describe('fetchAppleDocsSearch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('finds an exact-match symbol (NavigationStack)', async () => {
    mockJsonlResponse(loadFixture('apple-search-navigationstack.jsonl'));

    const results = await fetchAppleDocsSearch('NavigationStack', 'all', searchUrl);

    expect(results.length).toBeGreaterThan(0);
    const exact = results.find(r => r.title === 'NavigationStack');
    expect(exact).toBeDefined();
    expect(exact?.url).toBe('https://developer.apple.com/documentation/swiftui/navigationstack');
    expect(exact?.type).toBe('documentation');
  });

  it('finds UICornerCurve', async () => {
    mockJsonlResponse(loadFixture('apple-search-uicornercurve.jsonl'));

    const results = await fetchAppleDocsSearch('UICornerCurve', 'all', searchUrl);

    const exact = results.find(r => r.title === 'UICornerCurve');
    expect(exact).toBeDefined();
    expect(exact?.url).toBe('https://developer.apple.com/documentation/uikit/uicornercurve');
    expect(exact?.framework).toBe('UIKit');
  });

  it('returns an empty array (not a throw) for a no-match query', async () => {
    mockJsonlResponse(loadFixture('apple-search-nomatch.jsonl'));

    const results = await fetchAppleDocsSearch('zzzznonexistentqueryxyz123', 'all', searchUrl);

    expect(results).toEqual([]);
  });

  it('surfaces a fetch error instead of silently returning 0 results', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(fetchAppleDocsSearch('NavigationStack', 'all', searchUrl)).rejects.toBeDefined();
  });

  it('excludes sample-code results when filterType is "documentation"', async () => {
    mockJsonlResponse(loadFixture('apple-search-navigationstack.jsonl'));

    const results = await fetchAppleDocsSearch('NavigationStack', 'documentation', searchUrl);

    expect(results.every(r => r.type !== 'sample-code')).toBe(true);
  });

  it('throws instead of silently returning 0 results when Apple renames metadata.permalink', async () => {
    // Fixture derived from a real captured response (apple-search-navigationstack.jsonl)
    // with metadata.permalink renamed to metadata.permalinkRenamed on every item, simulating
    // the API's undocumented shape drifting: 20 raw result items exist, but none of them
    // survive parseSearchResult (it requires metadata.permalink). That must surface as an
    // error, not look identical to a genuine no-match query.
    mockJsonlResponse(loadFixture('apple-search-permalink-renamed.jsonl'));

    // fetchAppleDocsSearch rethrows through handleFetchError, which wraps the thrown Error
    // in a plain AppError object (not itself an Error instance) — so assert on its .message
    // rather than jest's toThrow(), which expects a real Error.
    await expect(fetchAppleDocsSearch('NavigationStack', 'all', searchUrl)).rejects.toMatchObject(
      { message: expect.stringMatching(/format changed/) },
    );
  });
});
