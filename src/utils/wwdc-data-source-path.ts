/**
 * Separate module for handling data directory path resolution
 * This is isolated to avoid import.meta.url issues in tests
 */

import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the WWDC data directory path
 */
export function getWWDCDataDirectory(): string {
  // In test environment, use current working directory
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return path.resolve(process.cwd(), 'data/wwdc');
  }

  // In production, use import.meta.url
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirPath = path.dirname(currentFilePath);

  // The plugin ships ONE copy of the data, at the plugin root (data/wwdc).
  // The running file is the esbuild bundle servers/apple-docs/index.js, so the
  // plugin root is two levels up from its directory. The same expression also
  // resolves correctly when the server runs from source (src/utils/ -> repo
  // root), so there is no build-time copy of data/ to keep in sync.
  return path.resolve(currentDirPath, '../../data/wwdc');
}