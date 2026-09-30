/**
 * The shipped bundle redirects 'cheerio' to cheerio's load-parse.js (see
 * scripts/build-bundle.mjs), which exports only `load`. tsc and ts-jest resolve the full cheerio
 * package, so any other runtime member (cheerio.contains, cheerio.merge, cheerio.html, a default
 * import, ...) compiles and passes every test, then is undefined in the shipped bundle. This guard
 * fails the build of such code in src/.
 *
 * Known gaps, deliberately not detected: aliasing the namespace (`const c = cheerio; c.contains`),
 * bracket access (`cheerio['contains']`). Type members (PascalCase: CheerioAPI, Cheerio, ...) are
 * erased at compile time and allowed.
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const srcDir = path.resolve(__dirname, '..', 'src');

const WHY =
  "The shipped bundle redirects 'cheerio' to cheerio's load-parse.js (scripts/build-bundle.mjs), " +
  'which exports only `load`; every other runtime member is undefined in the bundle while tsc and ' +
  'ts-jest see full cheerio. Use only cheerio.load (types such as cheerio.CheerioAPI are fine).';

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function isLoadOnly(name: string): boolean {
  return /^load(\s+as\s+\w+)?$/.test(name);
}

export function scanSource(source: string): string[] {
  const code = stripComments(source);
  const found: string[] = [];
  const aliases: string[] = [];

  for (const match of code.matchAll(/import\s+(type\s+)?([^;]*?)\s+from\s+['"]cheerio['"]/g)) {
    if (match[1]) continue; // `import type` is erased at compile time
    const clause = match[2].trim();
    const namespace = /^\*\s+as\s+([\w$]+)$/.exec(clause);
    if (namespace) {
      aliases.push(namespace[1]);
      continue;
    }
    const named = /^\{([^}]*)\}$/.exec(clause);
    if (named) {
      for (const item of named[1].split(',').map((part) => part.trim()).filter(Boolean)) {
        if (!item.startsWith('type ') && !isLoadOnly(item)) found.push(`named import '${item}' from 'cheerio'`);
      }
      continue;
    }
    found.push(`import '${clause}' from 'cheerio' (default/mixed imports are undefined in the bundle)`);
  }
  if (/\b(?:require|import)\(\s*['"]cheerio['"]\s*\)|\bexport\b[^;]*\bfrom\s+['"]cheerio['"]/.test(code)) {
    found.push("require/dynamic import/re-export of 'cheerio'");
  }

  for (const alias of aliases) {
    const escaped = alias.replace(/\$/g, '\\$');
    for (const match of code.matchAll(new RegExp(`(?<![\\w$.])${escaped}\\.([a-z_$][\\w$]*)`, 'g'))) {
      if (match[1] !== 'load') found.push(`${alias}.${match[1]}`);
    }
    for (const match of code.matchAll(new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${escaped}\\b`, 'g'))) {
      for (const item of match[1].split(',').map((part) => part.trim()).filter(Boolean)) {
        const name = item.split(/[:=]/)[0].trim();
        if (name !== 'load') found.push(`destructured '${name}' from ${alias}`);
      }
    }
  }
  return found;
}

function listTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listTsFiles(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

export function scanDir(dir: string): string[] {
  return listTsFiles(dir).flatMap((file) =>
    scanSource(readFileSync(file, 'utf8')).map((hit) => `${path.relative(dir, file)}: ${hit}`));
}

describe('cheerio usage guard', () => {
  it('src uses only cheerio.load', () => {
    const hits = scanDir(srcDir);
    if (hits.length > 0) {
      throw new Error(`${hits.join('\n')}\n${WHY}`);
    }
  });

  describe('scanner detects forbidden usage (fixtures in a temp dir, never src)', () => {
    let tmp: string;
    beforeAll(() => {
      tmp = mkdtempSync(path.join(os.tmpdir(), 'cheerio-guard-'));
      mkdirSync(path.join(tmp, 'nested'));
    });
    afterAll(() => rmSync(tmp, { recursive: true, force: true }));

    const cases: Array<[string, string, string]> = [
      ['namespace member', "import * as cheerio from 'cheerio';\ncheerio.contains(a, b);", 'cheerio.contains'],
      ['named import', "import { load, merge } from 'cheerio';", "named import 'merge'"],
      ['default import', "import cheerio from 'cheerio';", 'default/mixed'],
      ['default plus named import', "import c, { load } from 'cheerio';", 'default/mixed'],
      ['destructuring', "import * as cheerio from 'cheerio';\nconst { load, html } = cheerio;", "destructured 'html'"],
      ['require', "const c = require('cheerio');", 'require/dynamic'],
    ];

    it.each(cases)('flags %s', (_name, source, expected) => {
      writeFileSync(path.join(tmp, 'nested', 'fixture.ts'), source);
      const hits = scanDir(tmp);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.join('\n')).toContain(expected);
      expect(hits[0]).toContain(path.join('nested', 'fixture.ts'));
    });

    it('accepts load, types, and forbidden names inside comments', () => {
      writeFileSync(
        path.join(tmp, 'nested', 'fixture.ts'),
        [
          "import * as cheerio from 'cheerio';",
          "import type { Element } from 'cheerio';",
          '// cheerio.contains is not allowed',
          '/* cheerio.merge neither */',
          'const $: cheerio.CheerioAPI = cheerio.load(html);',
        ].join('\n'),
      );
      expect(scanDir(tmp)).toEqual([]);
    });
  });
});
