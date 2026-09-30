import { formatSearchResultsResponse } from '../../src/tools/search-parser.js';
import type { SearchResult } from '../../src/tools/search-result-parser.js';

// WHY this file changed shape (issues #51, #43): developer.apple.com/search/ is
// now client-rendered, so there is no more `.search-result` HTML to scrape —
// search-parser.ts only formats an already-parsed SearchResult[] now (fetching +
// parsing moved to apple-search-api.test.ts / search-result-parser.test.ts).
// These tests cover the formatting behavior that used to be exercised indirectly
// through HTML fixtures.

// Mock the cache to prevent interference between tests
jest.mock('../../src/utils/cache.js', () => ({
  searchCache: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
  generateUrlCacheKey: jest.fn((url, params) => `${url}-${params.query}`),
}));

describe('formatSearchResultsResponse', () => {
  const mockSearchUrl = 'https://developer.apple.com/search/?q=test';

  const result = (overrides: Partial<SearchResult>): SearchResult => ({
    title: 'UIView',
    url: 'https://developer.apple.com/documentation/uikit/uiview',
    type: 'documentation',
    description: 'An object that manages the content for a rectangular area on the screen.',
    framework: 'UIKit',
    ...overrides,
  });

  it('formats results grouped with headers, description, and framework', () => {
    const response = formatSearchResultsResponse(
      [
        result({ title: 'UIView', url: 'https://developer.apple.com/documentation/uikit/uiview' }),
        result({ title: 'UIViewController', url: 'https://developer.apple.com/documentation/uikit/uiviewcontroller' }),
      ],
      'test',
      mockSearchUrl,
    );

    const text = response.content[0].text;
    expect(text).toContain('# Apple Documentation Search Results');
    expect(text).toContain('**Query:** "test"');
    expect(text).toContain('### 1. UIView');
    expect(text).toContain('### 2. UIViewController');
    expect(text).toContain('**Framework:** UIKit');
  });

  it('reports "No Results Found" for an empty results array', () => {
    const response = formatSearchResultsResponse([], 'test', mockSearchUrl);
    const text = response.content[0].text;

    expect(text).toContain('No Results Found');
    expect(text).toContain('No results found for "test"');
    expect(text).toContain('### Suggestions:');
  });

  it('escapes nothing and passes special characters in the query through verbatim', () => {
    const specialQuery = 'test & <special> "quoted"';
    const response = formatSearchResultsResponse([result({})], specialQuery, mockSearchUrl);

    expect(response.content[0].text).toContain(`**Query:** "${specialQuery}"`);
  });

  it('groups sample-code results under their own section', () => {
    const response = formatSearchResultsResponse(
      [result({ title: 'Fruta: Building a Feature-Rich App', type: 'sample-code' })],
      'fruta',
      mockSearchUrl,
      'sample',
    );

    expect(response.content[0].text).toContain('💻 Sample Code');
  });
});
