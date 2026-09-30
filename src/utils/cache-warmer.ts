/**
 * Cache warming strategies for improved performance
 */

import { handleListTechnologies } from '../tools/list-technologies.js';
import { handleGetDocumentationUpdates } from '../tools/get-documentation-updates.js';
import { handleGetTechnologyOverviews } from '../tools/get-technology-overviews.js';
import { apiCache, technologiesCache, updatesCache, technologyOverviewsCache } from './cache.js';
import { logger } from './logger.js';

// Tracks the AbortController for whichever warmUpCaches() run is currently in flight, so
// abortWarmUp() can cancel it. A fresh controller per run (not a single module-level one)
// because AbortController is single-use: reusing one across the periodic 30-minute refresh
// (schedulePeriodicCacheRefresh) would leave every later run pre-aborted after the first cancel.
let currentWarmUpController: AbortController | null = null;

/**
 * Cancel whichever warmUpCaches() run is currently in flight. Called on client disconnect
 * (stdin 'end' in src/index.ts) so background cache warming — and, critically, the retry
 * backoff sleeps inside httpClient — stop holding the event loop open waiting on a network
 * that may be unreachable (offline/sandboxed), instead of running to completion or hitting
 * the stdin-EOF forced-exit backstop. A no-op if no run is in flight.
 */
export function abortWarmUp(): void {
  currentWarmUpController?.abort();
}

/**
 * True when `error` is the result of an aborted fetch/AbortController (the DOMException/Error
 * thrown by fetch, AbortSignal.throwIfAborted, etc.), regardless of the message text.
 */
/**
 * Warm up frequently accessed caches
 */
export async function warmUpCaches(): Promise<void> {
  logger.info('Starting cache warm-up...');

  const controller = new AbortController();
  currentWarmUpController = controller;
  const { signal } = controller;

  const warmUpTasks = [
    warmUpTechnologiesCache(signal),
    warmUpUpdatesCache(signal),
    warmUpOverviewsCache(signal),
  ];

  await Promise.allSettled(warmUpTasks);
  logger.info('Cache warm-up completed');
}

/**
 * Warm up technologies list cache
 */
async function warmUpTechnologiesCache(signal: AbortSignal): Promise<void> {
  try {
    logger.info('Warming up technologies cache...');

    // Load all technologies
    await handleListTechnologies(undefined, undefined, true, undefined, signal);

    // Load popular categories
    const popularCategories = [
      'app-frameworks',
      'graphics-and-games',
      'app-services',
      'system',
    ];

    for (const category of popularCategories) {
      await handleListTechnologies(category, undefined, true, undefined, signal);
    }

    const stats = technologiesCache.getStats();
    logger.info(`Technologies cache warmed up: ${stats.size} entries`);
  } catch (error) {
    // Classify by OUR OWN controller's signal.aborted, not by error name: a per-request
    // AbortSignal.timeout() inside httpClient also throws an abort-shaped TimeoutError, and
    // that is a real failure that must still be logged. signal.aborted is only true when
    // abortWarmUp() ran (client disconnect via stdin 'end') — expected shutdown, not a failure.
    if (signal.aborted) {
      logger.debug('Technologies cache warm-up aborted: client disconnected');
      return;
    }
    logger.error('Failed to warm up technologies cache:', error);
  }
}

/**
 * Warm up documentation updates cache
 */
async function warmUpUpdatesCache(signal: AbortSignal): Promise<void> {
  try {
    logger.info('Warming up updates cache...');

    // Load recent updates
    await handleGetDocumentationUpdates('all', undefined, undefined, undefined, true, 50, signal);

    // Load WWDC updates — warm the two newest years, not a fixed pair that goes stale each WWDC
    await handleGetDocumentationUpdates('wwdc', undefined, '2026', undefined, true, 20, signal);
    await handleGetDocumentationUpdates('wwdc', undefined, '2025', undefined, true, 20, signal);

    const stats = updatesCache.getStats();
    logger.info(`Updates cache warmed up: ${stats.size} entries`);
  } catch (error) {
    // See warmUpTechnologiesCache: classify by signal.aborted, not error name.
    if (signal.aborted) {
      logger.debug('Updates cache warm-up aborted: client disconnected');
      return;
    }
    logger.error('Failed to warm up updates cache:', error);
  }
}

/**
 * Warm up technology overviews cache
 */
async function warmUpOverviewsCache(signal: AbortSignal): Promise<void> {
  try {
    logger.info('Warming up technology overviews cache...');

    // Load popular categories
    const categories = [
      'swiftui',
      'uikit',
      'app-design-and-ui',
      'ai-machine-learning',
      'augmented-reality',
    ];

    for (const category of categories) {
      await handleGetTechnologyOverviews(category, 'all', undefined, true, 20, signal);
    }

    const stats = technologyOverviewsCache.getStats();
    logger.info(`Technology overviews cache warmed up: ${stats.size} entries`);
  } catch (error) {
    // See warmUpTechnologiesCache: classify by signal.aborted, not error name.
    if (signal.aborted) {
      logger.debug('Technology overviews cache warm-up aborted: client disconnected');
      return;
    }
    logger.error('Failed to warm up overviews cache:', error);
  }
}

/**
 * Get cache warm-up status
 */
export function getCacheWarmUpStatus(): {
  technologiesCacheSize: number;
  updatesCacheSize: number;
  overviewsCacheSize: number;
  apiCacheSize: number;
  totalCacheEntries: number;
  } {
  const techStats = technologiesCache.getStats();
  const updatesStats = updatesCache.getStats();
  const overviewsStats = technologyOverviewsCache.getStats();
  const apiStats = apiCache.getStats();

  return {
    technologiesCacheSize: techStats.size,
    updatesCacheSize: updatesStats.size,
    overviewsCacheSize: overviewsStats.size,
    apiCacheSize: apiStats.size,
    totalCacheEntries: techStats.size + updatesStats.size + overviewsStats.size + apiStats.size,
  };
}

/**
 * Schedule periodic cache refresh
 */
export function schedulePeriodicCacheRefresh(intervalMs: number = 30 * 60 * 1000): void {
  logger.info(`Scheduling cache refresh every ${intervalMs / 1000 / 60} minutes`);

  // unref() so this timer never keeps the stdio server alive after the client closes stdin.
  setInterval(() => {
    logger.info('Running periodic cache refresh...');
    void warmUpCaches();
  }, intervalMs).unref();
}