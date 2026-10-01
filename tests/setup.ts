/**
 * Jest test setup file
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;

// plugin-version.ts reads the plugin version through import.meta, which ts-jest (CommonJS) cannot parse.
// The mock returns the REAL package.json version (the one source of truth), never a
// literal that could go stale; tests/index.test.ts asserts the same value and
// tests/standalone-bundle.test.ts exercises the real read against the real bundle.
jest.mock('../src/utils/plugin-version.js', () => ({
  getPluginVersion: () => (JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')) as { version: string }).version,
}));

beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Global test timeout: single source is jest.config.cjs testTimeout.

// Mock fetch for tests. The real one stays reachable as global.realFetch for the few tests
// that talk to a local in-process HTTP server (tests/utils/wwdc-data-install.test.ts).
(global as any).realFetch = global.fetch;
global.fetch = jest.fn();

// Helper to create mock fetch responses
(global as any).createMockResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  } as Response);
};

// Helper to create mock fetch error
(global as any).createMockError = (message: string) => {
  return Promise.reject(new Error(message));
};