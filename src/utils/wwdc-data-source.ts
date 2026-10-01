/**
 * WWDC Data Source - Loads WWDC video data from JSON files
 *
 * The data is optional and not shipped with the plugin: it is downloaded once, on
 * first use of a WWDC tool, verified against WWDC_DATA.SHA256 and extracted into the
 * data directory (see wwdc-data-source-path.ts).
 */

import { execFile } from 'child_process';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { logger } from './logger.js';
import { wwdcDataCache } from './cache.js';
import { WWDC_CONFIG, WWDC_DATA } from './constants.js';
import { getWWDCDataDirectory } from './wwdc-data-source-path.js';
import { AppError, ErrorType } from '../types/error.js';
import type { WWDCVideo, GlobalMetadata, TopicIndex, YearIndex } from '../types/wwdc.js';

const execFileAsync = promisify(execFile);

// One shared install per data directory: concurrent first calls trigger a single download
const installs = new Map<string, Promise<string>>();

async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function installError(dir: string, url: string, reason: string, cause?: unknown): AppError {
  return new AppError({
    type: ErrorType.NETWORK_ERROR,
    message:
      `WWDC data is not installed and could not be installed: ${reason}. ` +
      `URL: ${url}; target directory: ${dir}. ` +
      `Offline: mkdir -p <dir> && curl -L ${url} | tar xz -C <dir>, then set ${WWDC_DATA.DIR_ENV}=<dir>.`,
    originalError: cause instanceof Error ? cause : undefined,
  });
}

/**
 * Download, verify and extract the WWDC data archive into <dir>. Extraction goes to a sibling
 * temp dir that is renamed into place, so <dir> either carries the marker file (complete) or is
 * absent. url and sha256 are parameters only so tests can serve a fixture archive locally.
 */
/**
 * Download, verify and extract the WWDC data archive into <dir>. Extraction goes to a sibling
 * temp dir that is renamed into place, so <dir> either carries the marker file (complete) or is
 * absent. url and sha256 are parameters only so tests can serve a fixture archive locally.
 */
export async function installWWDCData(
  dir: string,
  { url = WWDC_DATA.URL, sha256 = WWDC_DATA.SHA256 }: { url?: string; sha256?: string } = {},
): Promise<string> {
  const marker = path.join(dir, WWDC_DATA.MARKER_FILE);
  if (await pathExists(marker)) {
    return dir;
  }
  const fail = (reason: string, cause?: unknown): AppError => installError(dir, url, reason, cause);

  logger.info(`Downloading WWDC data from ${url}`);
  let archive: Buffer;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(WWDC_DATA.DOWNLOAD_TIMEOUT_MS) });
    if (!response.ok) {
      throw fail(`HTTP ${response.status}`);
    }
    archive = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw error instanceof AppError ? error : fail(error instanceof Error ? error.message : String(error), error);
  }

  const actual = createHash('sha256').update(archive).digest('hex');
  if (actual !== sha256) {
    throw fail(`sha256 mismatch (expected ${sha256}, got ${actual})`);
  }

  const tempDir = `${dir}.tmp-${process.pid}-${Date.now()}`;
  const archivePath = `${tempDir}.tar.gz`;
  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(archivePath, archive);
    try {
      // Only the exit code decides: execFile rejects on non-zero exit, stderr warnings on success are ignored.
      await execFileAsync('tar', ['-xzf', archivePath, '-C', tempDir]);
    } catch (error) {
      throw fail(`could not extract the archive with the system tar (${error instanceof Error ? error.message : String(error)})`, error);
    }
    if (!(await pathExists(path.join(tempDir, 'index.json')))) {
      throw fail('the archive has no index.json at its top level');
    }
    await fs.writeFile(path.join(tempDir, WWDC_DATA.MARKER_FILE), sha256, 'utf-8');
    // Never remove a directory that carries the marker: another process may have finished
    // the same install and be reading it. Only a markerless leftover is removed.
    if (!(await pathExists(marker))) {
      await fs.rm(dir, { recursive: true, force: true });
    }
    try {
      await fs.rename(tempDir, dir);
    } catch (error) {
      // The other process won the race; its copy is identical (same pinned sha256).
      if (!(await pathExists(marker))) {
        throw error;
      }
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.rm(archivePath, { force: true });
  }
  logger.info(`WWDC data installed in ${dir}`);
  return dir;
}

/**
 * Resolve the WWDC data directory, downloading the data on first use. Concurrent callers share
 * one in-flight install; a failed install is not cached, so the next call retries.
 */
/**
 * Resolve the WWDC data directory, downloading the data on first use. Concurrent callers share
 * one in-flight install; a failed install is not cached, so the next call retries.
 */
/**
 * Resolve the WWDC data directory, downloading the data on first use. Concurrent callers share
 * one in-flight install; a failed install is not cached, so the next call retries.
 * source is for tests (a local server); production callers pass nothing.
 */
export async function ensureWWDCData(source?: Parameters<typeof installWWDCData>[1]): Promise<string> {
  const dir = getWWDCDataDirectory();
  if (process.env[WWDC_DATA.DIR_ENV]) {
    if (!(await pathExists(path.join(dir, 'index.json')))) {
      throw new AppError({
        type: ErrorType.NOT_FOUND,
        message: `${WWDC_DATA.DIR_ENV}=${dir} has no index.json. Extract the WWDC data archive there: mkdir -p <dir> && curl -L ${WWDC_DATA.URL} | tar xz -C <dir>`,
      });
    }
    return dir;
  }
  let install = installs.get(dir);
  if (!install) {
    install = installWWDCData(dir, source);
    installs.set(dir, install);
    install.catch(() => installs.delete(dir));
  }
  return install;
}

/**
 * Read file from the WWDC data directory (downloading the data first if needed)
 */
async function readBundledFile(filePath: string): Promise<string> {
  const dir = await ensureWWDCData();
  const fullPath = path.join(dir, filePath);

  try {
    const content = await fs.readFile(fullPath, 'utf-8');
    logger.debug(`Loaded WWDC data: ${filePath}`);
    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to read WWDC data: ${filePath}`, error);
    throw new Error(`Failed to load WWDC data from ${filePath}: ${errorMessage}`, { cause: error });
  }
}

/**
 * Fetch data with caching support
 */
async function fetchData(filePath: string): Promise<string> {
  const cacheKey = `wwdc:${filePath}`;

  // Check cache first
  const cached = wwdcDataCache.get<string>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit: ${filePath}`);
    return cached;
  }

  const data = await readBundledFile(filePath);

  // Cache the data
  wwdcDataCache.set(cacheKey, data, WWDC_CONFIG.CACHE_TTL);

  return data;
}

// The install error names the URL, directory and offline recipe; wrapping it in a generic
// "not found" message would hide the real cause from the user.
function rethrowInstallError(error: unknown): void {
  if (error instanceof AppError) {
    throw error;
  }
}

/**
 * Load global metadata (index.json)
 */
export async function loadGlobalMetadata(): Promise<GlobalMetadata> {
  try {
    const data = await fetchData('index.json');
    return JSON.parse(data);
  } catch (error) {
    rethrowInstallError(error);
    logger.error('Failed to load global metadata', error);
    throw new Error('Failed to load WWDC metadata', { cause: error });
  }
}

/**
 * Load topic index
 */
export async function loadTopicIndex(topicId: string): Promise<TopicIndex> {
  try {
    const data = await fetchData(`by-topic/${topicId}/index.json`);
    return JSON.parse(data);
  } catch (error) {
    rethrowInstallError(error);
    logger.error(`Failed to load topic index: ${topicId}`, error);
    throw new Error(`Topic not found: ${topicId}`, { cause: error });
  }
}

/**
 * Load year index
 */
export async function loadYearIndex(year: string): Promise<YearIndex> {
  try {
    const data = await fetchData(`by-year/${year}/index.json`);
    return JSON.parse(data);
  } catch (error) {
    rethrowInstallError(error);
    logger.error(`Failed to load year index: ${year}`, error);
    throw new Error(`Year not found: ${year}`, { cause: error });
  }
}

/**
 * Load individual video data
 */
export async function loadVideoData(year: string, videoId: string): Promise<WWDCVideo> {
  try {
    const data = await fetchData(`videos/${year}-${videoId}.json`);
    return JSON.parse(data);
  } catch (error) {
    rethrowInstallError(error);
    logger.error(`Failed to load video: ${year}-${videoId}`, error);
    throw new Error(`Video not found: ${year}-${videoId}`, { cause: error });
  }
}

/**
 * Load all videos list
 */
export async function loadAllVideos(): Promise<WWDCVideo[]> {
  try {
    const data = await fetchData('all-videos.json');
    return JSON.parse(data);
  } catch (error) {
    rethrowInstallError(error);
    logger.error('Failed to load all videos', error);
    throw new Error('Failed to load WWDC video list', { cause: error });
  }
}

/**
 * Clear the WWDC data cache
 */
export function clearDataCache(): void {
  wwdcDataCache.clear();
  logger.info('WWDC data cache cleared');
}
