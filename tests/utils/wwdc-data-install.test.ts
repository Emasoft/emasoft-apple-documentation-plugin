/**
 * Real tests for the on-demand WWDC data install: a fixture archive is built with the system
 * tar and served by an in-process HTTP server on 127.0.0.1 (no network, no mocks of the module).
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  clearDataCache,
  ensureWWDCData,
  installWWDCData,
  loadVideoData,
  loadYearIndex,
} from '../../src/utils/wwdc-data-source';
import { AppError } from '../../src/types/error';
import { WWDC_DATA } from '../../src/utils/constants';

const execFileAsync = promisify(execFile);
const fixtureDir = path.resolve(__dirname, '..', 'fixtures', 'wwdc-data');

describe('WWDC data on-demand install', () => {
  let workDir: string;
  let server: Server;
  let baseUrl: string;
  let archiveSha256: string;
  let hits: number;
  const mockedFetch = global.fetch;
  const savedEnv = { ...process.env };

  beforeAll(async () => {
    // setup.ts replaces fetch with a mock; these tests need the real one to reach the local server.
    global.fetch = (global as any).realFetch;
    workDir = mkdtempSync(path.join(tmpdir(), 'wwdc-install-test-'));
    const archivePath = path.join(workDir, 'fixture.tar.gz');
    await execFileAsync('tar', ['-czf', archivePath, '-C', fixtureDir, '.']);
    const archive = readFileSync(archivePath);
    archiveSha256 = createHash('sha256').update(archive).digest('hex');

    server = createServer((request, response) => {
      if (request.url !== '/wwdc-data.tar.gz') {
        response.writeHead(404).end();
        return;
      }
      hits += 1;
      // Small delay so concurrent callers genuinely overlap while the download is in flight.
      setTimeout(() => response.writeHead(200, { 'content-type': 'application/gzip' }).end(archive), 100);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    global.fetch = mockedFetch;
    process.env = savedEnv;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(workDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    hits = 0;
    clearDataCache();
    process.env = { ...savedEnv };
    delete process.env[WWDC_DATA.DIR_ENV];
  });

  it('downloads, verifies and extracts the archive, writes the marker and leaves no temp files', async () => {
    const target = path.join(workDir, 'install-ok', 'v1');
    const dir = await installWWDCData(target, { url: `${baseUrl}/wwdc-data.tar.gz`, sha256: archiveSha256 });

    expect(dir).toBe(target);
    expect(existsSync(path.join(target, 'index.json'))).toBe(true);
    expect(existsSync(path.join(target, 'videos', '2024-90001.json'))).toBe(true);
    expect(readFileSync(path.join(target, WWDC_DATA.MARKER_FILE), 'utf8')).toBe(archiveSha256);
    expect(readdirSync(path.dirname(target))).toEqual(['v1']);
    expect(hits).toBe(1);
  });

  it('does not download again once the marker exists', async () => {
    const target = path.join(workDir, 'install-twice', 'v1');
    const source = { url: `${baseUrl}/wwdc-data.tar.gz`, sha256: archiveSha256 };
    await installWWDCData(target, source);
    await installWWDCData(target, source);

    expect(hits).toBe(1);
  });

  it('rejects a sha256 mismatch with an error naming the URL, directory and override variable, and installs nothing', async () => {
    const target = path.join(workDir, 'install-bad-sha', 'v1');
    const url = `${baseUrl}/wwdc-data.tar.gz`;

    const failure = installWWDCData(target, { url, sha256: '0'.repeat(64) });
    await expect(failure).rejects.toBeInstanceOf(AppError);
    await expect(failure).rejects.toThrow(/sha256 mismatch/);
    await expect(failure).rejects.toThrow(url);
    await expect(failure).rejects.toThrow(target);
    await expect(failure).rejects.toThrow(WWDC_DATA.DIR_ENV);
    expect(existsSync(target)).toBe(false);
  });

  it('rejects an HTTP 404 and installs nothing', async () => {
    const target = path.join(workDir, 'install-404', 'v1');

    await expect(installWWDCData(target, { url: `${baseUrl}/missing.tar.gz`, sha256: archiveSha256 })).rejects.toThrow(
      /HTTP 404/,
    );
    expect(existsSync(target)).toBe(false);
  });

  it('shares one download between concurrent first calls and retries after a failure', async () => {
    process.env.CLAUDE_PLUGIN_DATA = path.join(workDir, 'plugin-data');
    const source = { url: `${baseUrl}/wwdc-data.tar.gz`, sha256: archiveSha256 };

    const results = await Promise.all([ensureWWDCData(source), ensureWWDCData(source), ensureWWDCData(source)]);

    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(path.join(workDir, 'plugin-data', 'wwdc-data', WWDC_DATA.VERSION));
    expect(existsSync(path.join(results[0], 'index.json'))).toBe(true);
    expect(hits).toBe(1);

    process.env.CLAUDE_PLUGIN_DATA = path.join(workDir, 'plugin-data-retry');
    const failing = { url: `${baseUrl}/missing.tar.gz`, sha256: archiveSha256 };
    await expect(ensureWWDCData(failing)).rejects.toThrow(/HTTP 404/);
    // The failure is not cached: the next call downloads again and succeeds.
    await expect(ensureWWDCData(source)).resolves.toContain('plugin-data-retry');
    expect(hits).toBe(2);
  });

  it(`reads the data from ${WWDC_DATA.DIR_ENV} without any download`, async () => {
    process.env[WWDC_DATA.DIR_ENV] = fixtureDir;

    const yearIndex = await loadYearIndex('2024');
    const video = await loadVideoData('2024', '90001');

    expect(yearIndex.videoCount).toBe(3);
    expect(video.title).toBe('Fixture video one');
    expect(hits).toBe(0);
  });

  it(`fails fast when ${WWDC_DATA.DIR_ENV} points at a directory without index.json`, async () => {
    process.env[WWDC_DATA.DIR_ENV] = workDir;

    await expect(ensureWWDCData()).rejects.toThrow(/has no index\.json/);
  });
});
