/**
 * Jev semantic selection: narrow a large candidate list to the 1-5 rows that best match a query.
 *
 * Ported in design from jgrep's `--rows` mode (https://github.com/kyu1204/jgrep, MIT, npm `jevgrep`):
 * rows batched 16 per System One request, one `noul` question per row, full-jitter retries.
 * Fail fast by design: any batch failure after its retries fails the whole selection, because a
 * partially scored candidate set makes top-k unsound. No unranked fallback.
 */

import { createHash } from 'node:crypto';
import { JEV_CONFIG } from './constants.js';
import { jevScoreCache } from './cache.js';
import { AppError, ErrorType } from '../types/error.js';

/** Explicit fields only: never spread a domain object, an `id` field would overwrite the Jev row id. */
export interface JevRow {
  title: string;
  summary?: string;
  url?: string;
  topics?: string;
  evidence?: string;
}

export interface JevSelection {
  /** Index into the candidate array passed in. */
  index: number;
  score: number;
}

export interface JevResult {
  /** Best first, 1..maxResults entries. */
  selected: JevSelection[];
  /** True when the best score is below NO_STRONG_MATCH: `selected` is then the single best row. */
  noStrongMatch: boolean;
  /** Candidates actually scored (after the MAX_CANDIDATES cut). */
  scored: number;
  /** Per-candidate score, same order as the input. */
  scores: number[];
  requests: number;
  inputTokens: number;
  costUsd: number;
  /** True when at least one batch reported no cost and it was estimated from inputTokens. */
  costEstimated: boolean;
}

export interface JevOptions {
  maxResults?: number;
  /** Which match statement to ask: Apple documentation results (default) or WWDC sessions. */
  source?: JevSource;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

type ProviderName = keyof typeof JEV_CONFIG.PROVIDERS;
interface Backend { name: ProviderName; url: string; model: string; apiKey: string }
interface BatchOutcome { scores: number[]; inputTokens: number; costUsd: number; costEstimated: boolean }

// One constant, measured on real rows (see TRDD-UM1PQWDB). postBatch adds jgrep's per-row
// "Look only at the row with id" prefix verbatim.
export type JevSource = 'docs' | 'wwdc';

// JSON.stringify quotes the query so a `"` inside it cannot break the instruction.
export const matchStatement = (query: string, source: JevSource = 'docs'): string =>
  source === 'wwdc'
    ? `This WWDC session is what a developer looking for ${JSON.stringify(query)} should watch.`
    : `This is the result a developer searching Apple developer documentation for ${JSON.stringify(query)} wants.`;

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504, 529]);
const NO_ESCAPE = 'Retry with select: false to get the unfiltered results.';

export function isJevEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[JEV_CONFIG.ENABLE_ENV] === '1';
}

/**
 * Resolves a tool's `select` argument: explicit true while Jev is not enabled is an error
 * (never a silent unranked result); undefined follows the env switch.
 */
export function resolveSelect(select: boolean | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const enabled = isJevEnabled(env);
  if (select === true && !enabled) {
    throw jevError(
      ErrorType.INVALID_INPUT,
      `select: true requires ${JEV_CONFIG.ENABLE_ENV}=1 and ${JEV_CONFIG.PROVIDER_ENV} to be set.`,
      ['Omit select, or set select: false.'],
    );
  }
  return select ?? enabled;
}

function jevError(type: ErrorType, message: string, suggestions: string[] = [NO_ESCAPE]): AppError {
  return new AppError({ type, message: `Jev selection failed: ${message}`, suggestions });
}

function resolveBackend(env: NodeJS.ProcessEnv): Backend {
  const name = env[JEV_CONFIG.PROVIDER_ENV]?.trim();
  if (!name || !(name in JEV_CONFIG.PROVIDERS)) {
    const choices = Object.keys(JEV_CONFIG.PROVIDERS).join('|');
    throw jevError(
      ErrorType.INVALID_INPUT,
      `${JEV_CONFIG.ENABLE_ENV}=1 requires ${JEV_CONFIG.PROVIDER_ENV} to be one of ${choices} ` +
        `(got ${name ? `"${name}"` : 'nothing'}).`,
    );
  }
  const provider = JEV_CONFIG.PROVIDERS[name as ProviderName];
  const apiKey = env[provider.keyEnv]?.trim();
  if (!apiKey) {
    throw jevError(ErrorType.INVALID_INPUT, `provider "${name}" needs ${provider.keyEnv} to be set.`);
  }
  let url: string = provider.url;
  if (name === 'gateway') {
    url = env[JEV_CONFIG.GATEWAY_URL_ENV]?.trim() ?? '';
    if (!url) {
      throw jevError(
        ErrorType.INVALID_INPUT,
        `provider "gateway" needs ${JEV_CONFIG.GATEWAY_URL_ENV} (the full System One endpoint).`,
      );
    }
  }
  return { name: name as ProviderName, url, model: provider.model, apiKey };
}

const cacheKey = (model: string, statement: string, row: JevRow): string =>
  createHash('sha1').update(`${model}\0${statement}\0${JSON.stringify(row)}`).digest('hex');

/** Retry-After in ms: delta-seconds or an HTTP date; undefined when absent or unparsable. */
function parseRetryAfter(raw: string | null): number | undefined {
  if (!raw) {
    return undefined;
  }
  const secs = Number(raw);
  if (Number.isFinite(secs)) {
    return Math.max(0, secs * 1000);
  }
  const at = Date.parse(raw);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
}

function parseBatch(text: string, n: number, backend: Backend): BatchOutcome {
  const malformed = (why: string): AppError =>
    jevError(ErrorType.API_ERROR, `${backend.name} returned a malformed response (${why}): ${text.slice(0, 300)}`);
  let parsed: {
    answers?: Record<string, { noul?: unknown } | undefined>;
    usage?: { input_tokens?: number; cost?: number };
    cost?: number;
    cost_usd?: number;
  };
  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    throw malformed('not JSON');
  }
  if (parsed === null || typeof parsed !== 'object' || typeof parsed.answers !== 'object' || parsed.answers === null) {
    throw malformed('no answers object');
  }
  const scores: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = parsed.answers[`r${i}.match`]?.noul;
    if (typeof p !== 'number' || Number.isNaN(p)) {
      throw malformed(`answer r${i}.match missing`);
    }
    scores.push(p);
  }
  const inputTokens = parsed.usage?.input_tokens ?? 0;
  const reported = [parsed.cost, parsed.usage?.cost, parsed.cost_usd].find((c): c is number => typeof c === 'number');
  // Never report 0 as if free: with no provider cost, estimate from tokens at jgrep's default price.
  const costUsd = reported ?? (inputTokens * JEV_CONFIG.DEFAULT_PRICE_PER_MTOK) / 1e6;
  return { scores, inputTokens, costUsd, costEstimated: reported === undefined };
}

async function postBatch(
  rows: JevRow[],
  statement: string,
  backend: Backend,
  fetchImpl: typeof fetch,
  sleep: (ms: number) => Promise<void>,
): Promise<BatchOutcome> {
  const questions: Record<string, unknown> = {};
  rows.forEach((_, i) => {
    questions[`r${i}.match`] = { type: 'noul', instructions: `Look only at the row with id "r${i}". ${statement}` };
  });
  const body = JSON.stringify({
    model: backend.model,
    // id LAST: a stray `id` field on a row must never replace the Jev row id (answers would come back keyed wrongly).
    state: { rows: rows.map((r, i) => ({ ...r, id: `r${i}` })) },
    questions,
  });
  // Not httpClient: its Safari headers, 5-slot global limiter and Apple rate budget are for Apple endpoints.
  const headers = {
    Authorization: `Bearer ${backend.apiKey}`,
    'Content-Type': 'application/json',
    'X-Title': JEV_CONFIG.APP_TITLE,
  };
  const deadline = Date.now() + JEV_CONFIG.BATCH_DEADLINE_MS;
  const timedOut = (why: string): AppError =>
    jevError(
      ErrorType.TIMEOUT,
      `${backend.name} batch deadline (${JEV_CONFIG.BATCH_DEADLINE_MS} ms, retries included) exceeded: ${why}`,
    );

  for (let attempt = 0; ; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw timedOut(`before attempt ${attempt + 1}`);
    }
    let detail: string;
    let retryAfterMs: number | undefined;
    try {
      const res = await fetchImpl(backend.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(Math.max(1, Math.floor(Math.min(JEV_CONFIG.ATTEMPT_TIMEOUT_MS, remaining)))),
      });
      const text = await res.text();
      if (res.ok) {
        return parseBatch(text, rows.length, backend);
      }
      detail = `HTTP ${res.status}: ${text.slice(0, 300)}`;
      if (!RETRYABLE.has(res.status)) {
        const authHint = res.status === 401 || res.status === 403;
        throw jevError(ErrorType.API_ERROR, `${backend.name} ${detail}`, [
          authHint ? `Check ${JEV_CONFIG.PROVIDERS[backend.name].keyEnv}.` : 'Check the provider account and request.',
          NO_ESCAPE,
        ]);
      }
      retryAfterMs = parseRetryAfter(res.headers.get('retry-after'));
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      detail = err instanceof Error ? err.message : String(err); // network error or per-attempt abort: retryable
    }
    if (attempt >= JEV_CONFIG.MAX_RETRIES) {
      throw jevError(ErrorType.API_ERROR, `${backend.name} ${detail} (after ${attempt + 1} attempts)`);
    }
    const jitter = Math.random() * Math.min(JEV_CONFIG.RETRY_CAP_MS, JEV_CONFIG.RETRY_BASE_MS * 2 ** attempt);
    const delay = retryAfterMs ?? jitter;
    // A wait that cannot fit in the deadline is a failure now, not a sleep to the deadline and then a failure.
    if (delay >= deadline - Date.now()) {
      throw timedOut(`next retry in ${Math.round(delay)} ms does not fit (${detail})`);
    }
    await sleep(delay);
  }
}

/** Relative cutoff, gap stop and no-strong-match rule over scores (see TRDD-UM1PQWDB). */
export function pickTop(scores: number[], maxResults: number): { selected: JevSelection[]; noStrongMatch: boolean } {
  const sorted = scores
    .map((score, index) => ({ index, score }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const best = sorted[0];
  if (!best) {
    return { selected: [], noStrongMatch: false };
  }
  if (best.score < JEV_CONFIG.NO_STRONG_MATCH) {
    return { selected: [best], noStrongMatch: true };
  }
  const selected = [best];
  for (const cand of sorted.slice(1, maxResults)) {
    const prev = selected[selected.length - 1];
    const tooLow = cand.score < best.score * JEV_CONFIG.RELATIVE_CUTOFF;
    const bigGap = prev !== undefined && prev.score - cand.score > JEV_CONFIG.MAX_GAP;
    if (tooLow || bigGap) {
      break;
    }
    selected.push(cand);
  }
  return { selected, noStrongMatch: false };
}

export async function selectWithJev(query: string, candidates: JevRow[], opts: JevOptions = {}): Promise<JevResult> {
  const maxResults = Math.min(Math.max(opts.maxResults ?? JEV_CONFIG.MAX_RESULTS, 1), JEV_CONFIG.MAX_RESULTS);
  const backend = resolveBackend(opts.env ?? process.env);
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch; // resolved per call: tests replace global.fetch
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const statement = matchStatement(query, opts.source);
  // Recall cut, not a selection fallback: the caller's own ranking decides which 256 survive.
  const rows = candidates.slice(0, JEV_CONFIG.MAX_CANDIDATES);

  const scores: number[] = new Array<number>(rows.length).fill(NaN);
  const misses: number[] = [];
  rows.forEach((row, i) => {
    const hit = jevScoreCache.get<number>(cacheKey(backend.model, statement, row));
    if (hit === undefined) {
      misses.push(i);
    } else {
      scores[i] = hit;
    }
  });

  const batches: number[][] = [];
  for (let i = 0; i < misses.length; i += JEV_CONFIG.BATCH_SIZE) {
    batches.push(misses.slice(i, i + JEV_CONFIG.BATCH_SIZE));
  }
  // ponytail: one wave (<=16 batches); add a semaphore if MAX_CANDIDATES ever exceeds BATCH_SIZE x 16.
  const outcomes = await Promise.all(batches.map(async idx => {
    const out = await postBatch(idx.map(i => rows[i]), statement, backend, fetchImpl, sleep);
    idx.forEach((rowIdx, j) => {
      scores[rowIdx] = out.scores[j];
      jevScoreCache.set(cacheKey(backend.model, statement, rows[rowIdx]), out.scores[j]);
    });
    return out;
  }));

  return {
    ...pickTop(scores, maxResults),
    scored: rows.length,
    scores,
    requests: batches.length,
    inputTokens: outcomes.reduce((a, o) => a + o.inputTokens, 0),
    costUsd: outcomes.reduce((a, o) => a + o.costUsd, 0),
    costEstimated: outcomes.some(o => o.costEstimated),
  };
}
