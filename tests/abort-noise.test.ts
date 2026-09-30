/**
 * Unit coverage for the abort-noise fix (TRDD-IHLAOB2W follow-up): warmUpCaches()/
 * preloadPopularFrameworks() must not log at error level when a run is cancelled by
 * abortWarmUp()/abortPreload() (client disconnect) — that is expected shutdown, not a
 * failure. Classification is by the run's own `signal.aborted`, not by error name/message,
 * because a per-request timeout also throws an abort-shaped error and that IS a real
 * failure that must still be logged (see src/utils/http-client.ts createFetchSignal).
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { logger } from '../src/utils/logger.js';

jest.mock('../src/tools/list-technologies.js', () => ({
  handleListTechnologies: jest.fn(),
}));
jest.mock('../src/tools/get-documentation-updates.js', () => ({
  handleGetDocumentationUpdates: jest.fn(),
}));
jest.mock('../src/tools/get-technology-overviews.js', () => ({
  handleGetTechnologyOverviews: jest.fn(),
}));
jest.mock('../src/tools/search-framework-symbols.js', () => ({
  searchFrameworkSymbols: jest.fn(),
}));
jest.mock('../src/utils/cache.js', () => ({
  apiCache: { getStats: () => ({ size: 0 }) },
  technologiesCache: { getStats: () => ({ size: 0 }) },
  updatesCache: { getStats: () => ({ size: 0 }) },
  technologyOverviewsCache: { getStats: () => ({ size: 0 }) },
  indexCache: { has: () => false, getStats: () => ({ size: 0, hitRate: '0%' }) },
}));

import { handleListTechnologies } from '../src/tools/list-technologies.js';
import { handleGetDocumentationUpdates } from '../src/tools/get-documentation-updates.js';
import { handleGetTechnologyOverviews } from '../src/tools/get-technology-overviews.js';
import { searchFrameworkSymbols } from '../src/tools/search-framework-symbols.js';
import { warmUpCaches, abortWarmUp } from '../src/utils/cache-warmer.js';
import { preloadPopularFrameworks, abortPreload } from '../src/utils/preloader.js';

const mockList = handleListTechnologies as jest.Mock;
const mockUpdates = handleGetDocumentationUpdates as jest.Mock;
const mockOverviews = handleGetTechnologyOverviews as jest.Mock;
const mockSearch = searchFrameworkSymbols as jest.Mock;

describe('abort noise (TRDD-IHLAOB2W)', () => {
  let errorSpy: jest.SpiedFunction<typeof logger.error>;
  let debugSpy: jest.SpiedFunction<typeof logger.debug>;

  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('warmUpCaches does not log at error level when the run is aborted (client disconnect)', async () => {
    // Every handler aborts the shared warm-up controller and then rejects, simulating the
    // in-flight fetches all being cut off by abortWarmUp() at once.
    const abortReject = async () => {
      abortWarmUp();
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };
    mockList.mockImplementation(abortReject);
    mockUpdates.mockImplementation(abortReject);
    mockOverviews.mockImplementation(abortReject);

    await warmUpCaches();

    expect(errorSpy).not.toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
  });

  it('warmUpCaches still logs at error level for a genuine (non-abort) failure', async () => {
    const realFailure = async () => {
      throw new Error('network is down');
    };
    mockList.mockImplementation(realFailure);
    mockUpdates.mockImplementation(realFailure);
    mockOverviews.mockImplementation(realFailure);

    await warmUpCaches();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('preloadPopularFrameworks does not log at error level when the run is aborted', async () => {
    mockSearch.mockImplementation(async () => {
      abortPreload();
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    });

    await preloadPopularFrameworks();

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('preloadPopularFrameworks still logs at error level for a genuine (non-abort) failure', async () => {
    mockSearch.mockImplementation(async () => {
      throw new Error('network is down');
    });

    await preloadPopularFrameworks();

    expect(errorSpy).toHaveBeenCalled();
  });
});
