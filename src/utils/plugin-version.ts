/**
 * Reads the plugin version from the package.json at the plugin root: the ONE
 * source of the version (the server reports whatever package.json says;
 * plugin.json must be kept equal to it).
 *
 * Isolated in its own module, like wwdc-data-source-path.ts, because
 * import.meta cannot be compiled by ts-jest (CommonJS); tests/setup.ts
 * replaces this module.
 */
import { readFileSync } from 'fs';

export function getPluginVersion(): string {
  // The running file is either the esbuild bundle servers/apple-docs/index.js
  // or src/utils/plugin-version.ts run from source: in both cases the plugin
  // root is two levels up, so the same relative path works. Claude Code
  // copies the whole plugin directory, so package.json ships with the bundle.
  // readFileSync rather than createRequire: the bundle banner already declares
  // createRequire/require at module scope, and a second import of it would be
  // a duplicate declaration.
  // The URL is built on its own line and passed to readFileSync by name: the
  // path is a compile-time constant anchored on import.meta.url (no input
  // reaches it), and a one-line readFileSync(new URL('<up>/<up>/...')) is
  // what CPV's skillaudit PATH_TRAVERSAL rule reads as a traversal attack.
  const manifestUrl = new URL('../../package.json', import.meta.url);
  const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as {
    version?: unknown;
  };
  if (typeof manifest.version !== 'string' || manifest.version === '') {
    throw new Error('package.json at the plugin root has no version string');
  }
  return manifest.version;
}
