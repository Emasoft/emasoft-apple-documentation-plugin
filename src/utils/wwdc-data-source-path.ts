/**
 * Resolves where the WWDC data lives. The data is NOT shipped with the plugin:
 * it is downloaded once, on first use of a WWDC tool (see wwdc-data-source.ts).
 */

import os from 'os';
import path from 'path';
import { WWDC_DATA } from './constants.js';

/**
 * Get the WWDC data directory path.
 * Order: APPLE_DOCS_MCP_WWDC_DATA_DIR (a local extracted copy, never downloaded into),
 * else <base>/wwdc-data/<version> with base = CLAUDE_PLUGIN_DATA, else
 * APPLE_DOCS_MCP_CACHE_DIR, else ~/.cache/apple-docs-mcp.
 */
export function getWWDCDataDirectory(): string {
  const override = process.env[WWDC_DATA.DIR_ENV];
  if (override) {
    return path.resolve(override);
  }
  const base =
    process.env.CLAUDE_PLUGIN_DATA || process.env.APPLE_DOCS_MCP_CACHE_DIR || path.join(os.homedir(), '.cache', 'apple-docs-mcp');
  return path.resolve(base, 'wwdc-data', WWDC_DATA.VERSION);
}
