/**
 * Framework preloader for performance optimization
 */

import { searchFrameworkSymbols } from '../tools/search-framework-symbols.js';
import { indexCache } from './cache.js';
import { logger } from './logger.js';
import { normalizeFrameworkName, getFrameworksByCategory } from './framework-mapper.js';

/**
 * Popular frameworks to preload (using normalized names)
 */
const POPULAR_FRAMEWORKS = [
  ...getFrameworksByCategory('UI'), // SwiftUI, UIKit, etc.
  ...getFrameworksByCategory('Foundation'), // Foundation, Combine, Swift
  ...getFrameworksByCategory('Data').slice(0, 2), // Core Data, CloudKit
  ...getFrameworksByCategory('Graphics').slice(0, 2), // Core Graphics, Metal
  ...getFrameworksByCategory('Games').slice(0, 3), // ARKit, SceneKit, SpriteKit
].map(f => f.toLowerCase());

// Tracks the AbortController for whichever preloadPopularFrameworks() run is in flight, so
// abortPreload() can cancel it. Fresh controller per run — see cache-warmer.ts for why a
// single reused controller would be wrong (it's single-use).
let currentPreloadController: AbortController | null = null;

/**
 * Cancel whichever preloadPopularFrameworks() run is currently in flight. Called on client
 * disconnect (stdin 'end' in src/index.ts) alongside abortWarmUp() so background framework
 * preloading stops holding the event loop open on an unreachable network. No-op if none in
 * flight.
 */
export function abortPreload(): void {
  currentPreloadController?.abort();
}

/**
 * True when `error` is the result of an aborted fetch/AbortController (the DOMException/Error
 * thrown by fetch, AbortSignal.throwIfAborted, etc.), regardless of the message text.
 */
/**
 * Preload popular framework indexes
 */
export async function preloadPopularFrameworks(): Promise<void> {
  logger.info('Starting framework preload...');

  const controller = new AbortController();
  currentPreloadController = controller;
  const { signal } = controller;

  const preloadPromises = POPULAR_FRAMEWORKS.map(async (framework) => {
    try {
      // Check if already cached
      const cacheKey = `framework-index-${framework}`;
      if (indexCache.has(cacheKey)) {
        logger.debug(`Framework ${framework} already cached, skipping...`);
        return;
      }

      // Load framework index with minimal results
      logger.info(`Preloading framework: ${framework}`);
      await searchFrameworkSymbols(framework, 'all', undefined, 'swift', 1, signal);

      logger.info(`Successfully preloaded: ${framework}`);
    } catch (error) {
      // Classify by OUR OWN controller's signal.aborted, not by error name: a per-request
      // AbortSignal.timeout() inside httpClient also throws an abort-shaped TimeoutError, and
      // that is a real failure that must still be logged. signal.aborted is only true when
      // abortPreload() ran (client disconnect via stdin 'end') — expected shutdown, not a failure.
      if (signal.aborted) {
        logger.debug(`Preload of ${framework} aborted: client disconnected`);
        return;
      }
      logger.error(`Failed to preload ${framework}:`, error);
    }
  });

  await Promise.all(preloadPromises);
  logger.info('Framework preload completed');
}

/**
 * Preload specific frameworks based on user patterns
 */
export async function preloadFrameworksByUsage(
  recentFrameworks: string[],
): Promise<void> {
  // Normalize framework names and filter out popular ones
  const frameworksToPreload = recentFrameworks
    .map(f => normalizeFrameworkName(f))
    .filter(f => f && !POPULAR_FRAMEWORKS.includes(f.toLowerCase()))
    .map(f => f.toLowerCase());

  if (frameworksToPreload.length === 0) {
    return;
  }

  logger.info(`Preloading ${frameworksToPreload.length} user-specific frameworks...`);

  const preloadPromises = frameworksToPreload.map(async (framework) => {
    try {
      await searchFrameworkSymbols(framework, 'all', undefined, 'swift', 1);
      logger.info(`Preloaded user framework: ${framework}`);
    } catch (error) {
      logger.error(`Failed to preload user framework ${framework}:`, error);
    }
  });

  await Promise.all(preloadPromises);
}

/**
 * Get preload statistics
 */
export function getPreloadStats(): {
  preloadedFrameworks: string[];
  totalCached: number;
  cacheHitRate: string;
  } {
  const stats = indexCache.getStats();
  const preloadedFrameworks = POPULAR_FRAMEWORKS.filter(framework => {
    const cacheKey = `framework-index-${framework}`;
    return indexCache.has(cacheKey);
  });

  return {
    preloadedFrameworks,
    totalCached: stats.size,
    cacheHitRate: stats.hitRate,
  };
}