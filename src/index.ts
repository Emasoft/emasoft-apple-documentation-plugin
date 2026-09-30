#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { formatSearchResultsResponse } from './tools/search-parser.js';
import { fetchAppleDocsSearch } from './tools/apple-search-api.js';
import { fetchAppleDocJson } from './tools/doc-fetcher.js';
import { handleListTechnologies } from './tools/list-technologies.js';
import { searchFrameworkSymbols } from './tools/search-framework-symbols.js';
import { toolDefinitions } from './tools/definitions.js';
import { handleToolCall } from './tools/handlers.js';
import { handleGetRelatedApis } from './tools/get-related-apis.js';
import { handleResolveReferencesBatch } from './tools/resolve-references-batch.js';
import { handleGetPlatformCompatibility } from './tools/get-platform-compatibility.js';
import { handleFindSimilarApis } from './tools/find-similar-apis.js';
import { handleGetDocumentationUpdates } from './tools/get-documentation-updates.js';
import { handleGetTechnologyOverviews } from './tools/get-technology-overviews.js';
import { handleGetSampleCode } from './tools/get-sample-code.js';
import {
  handleDownloadAppleDesignResource,
  handleGetAppleDesignContent,
  handleGetAppleDesignExamples,
  handleListAppleDesignResources,
  handleSearchAppleDesignDocs,
  listCachedDesignResources,
  readCachedDesignResource,
} from './tools/design-docs.js';
import { APPLE_URLS } from './utils/constants.js';
import type { AppError } from './types/error.js';
import { isAppleDesignUrl, isValidAppleDeveloperUrl } from './utils/url-converter.js';
import { validateInput, ErrorType, createStandardErrorResponse, createToolErrorResponse } from './utils/error-handler.js';
import { preloadPopularFrameworks, abortPreload } from './utils/preloader.js';
import { warmUpCaches, schedulePeriodicCacheRefresh, abortWarmUp } from './utils/cache-warmer.js';
import { logger } from './utils/logger.js';
import { API_LIMITS, STDIN_EOF_BACKSTOP_MS } from './utils/constants.js';

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object'
    && error !== null
    && 'type' in error
    && 'message' in error
  );
}

// Module-level (not instance-level) shutdown state and process-handler registration.
// A bound `this.shutdown`/`this.isShuttingDown` on the class would tie process-level
// SIGINT/SIGTERM/stdin/unhandledRejection/uncaughtException handlers to whichever server
// instance happened to construct first — wrong for a library whose default export may be
// instantiated more than once (tests construct many instances; an embedder may too). Process
// lifecycle is inherently a singleton concern, so it lives here instead.
let isShuttingDown = false;
let errorHandlersRegistered = false;

function shutdown(exitCode: number = 0, reason?: string): void {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  if (reason) {
    logger.info(`Shutting down MCP server: ${reason}`);
  }
  process.exit(exitCode);
}

/**
 * Registers process-level signal/error handlers exactly once per process. `process.on()` has
 * no "already registered" check of its own — every call adds a NEW listener — so calling this
 * from the constructor unconditionally meant N server instances (routine under jest, which
 * constructs one per test) produced N sets of listeners, tripping Node's MaxListenersExceeded
 * warning. The module-level guard keeps the first registration authoritative; every later call
 * (more instances constructed) is a no-op, so embedders and tests alike still get working
 * SIGINT/SIGTERM/error handling without the listener count growing per instance.
 */
function setupProcessErrorHandling(): void {
  if (errorHandlersRegistered) {
    return;
  }
  errorHandlersRegistered = true;

  process.on('SIGINT', () => {
    shutdown(0, 'SIGINT');
  });

  process.on('SIGTERM', () => {
    shutdown(0, 'SIGTERM');
  });

  // After EOF the event loop drains on its own once in-flight requests finish and
  // responses flush (the cache/cache-warmer timers are unref'd, so they no longer
  // hold the process open). This unref'd timer only fires as a backstop if some
  // unknown ref'd handle keeps the process alive after stdin EOF — a clean drain
  // exits immediately without waiting for it.
  // WHY STDIN_EOF_BACKSTOP_MS (2x TIMEOUT): the backstop must stay strictly
  // longer than REQUEST_CONFIG.TIMEOUT, the per-request deadline that covers the whole
  // httpClient retry sequence and the search call (src/tools/apple-search-api.ts:153). The
  // extra timeout of slack absorbs a CPU peak delaying timers/flushes. The deadline is per
  // HTTP request, so a tool issuing several sequential requests can still outlive it;
  // acceptable because the backstop only arms after the client has disconnected.
  // ponytail: fixed ceiling rather than tracking in-flight requests; track them if a tool
  // ever needs to exceed REQUEST_CONFIG.TIMEOUT.
  process.stdin.on('end', () => {
    // The client disconnected: background cache warm-up/framework preload (and their
    // httpClient retry backoff sleeps) no longer serve anyone and must not hold the
    // event loop open waiting on a network that may be unreachable offline — abort them
    // immediately. This never touches in-flight CLIENT tool requests (no signal reaches
    // them), so a response already being computed when the client disconnects still gets
    // flushed — see tests/stdio-shutdown.test.ts (the #44 dropped-response regression).
    abortWarmUp();
    abortPreload();
    setTimeout(() => {
      shutdown(0, 'stdin end: forced exit after grace period');
    }, STDIN_EOF_BACKSTOP_MS).unref();
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection, reason:', reason);
    shutdown(1, 'unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown(1, 'uncaughtException');
  });
}

export default class AppleDeveloperDocsMCPServer {
  private server: Server;

  /**
   * Helper method to handle async operations with consistent error handling
   */
  private async handleAsyncOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<CallToolResult> {
    try {
      const result = await operation();
      return {
        content: [
          {
            type: 'text' as const,
            text: result as string,
          },
        ],
      };
    } catch (error) {
      // If error is already an AppError, use tool-specific suggestions
      if (error && typeof error === 'object' && 'type' in error) {
        return createToolErrorResponse(error as any, operationName) as CallToolResult;
      }
      return createStandardErrorResponse(error, operationName) as CallToolResult;
    }
  }

  private async handleToolResultOperation(
    operation: () => Promise<CallToolResult>,
    operationName: string,
  ): Promise<CallToolResult> {
    try {
      return await operation();
    } catch (error) {
      if (isAppError(error)) {
        return createToolErrorResponse(error, operationName) as CallToolResult;
      }
      return createStandardErrorResponse(error, operationName) as CallToolResult;
    }
  }

  constructor() {
    this.server = new Server(
      {
        name: 'apple-docs-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.setupTools();
    this.setupResources();
    setupProcessErrorHandling();
  }

  private setupTools() {
    // const cacheStatsSchema = z.object({});

    // 处理工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: toolDefinitions,
      };
    });

    // 处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await handleToolCall(name, args, this);
      } catch (error) {
        const appError = error instanceof Error
          ? { type: 'UNKNOWN' as const, message: error.message, originalError: error }
          : { type: 'UNKNOWN' as const, message: 'An unknown error occurred' };

        logger.error(`Tool ${name} failed:`, appError);

        return {
          content: [
            {
              type: 'text',
              text: `Error: ${appError.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupResources() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return await listCachedDesignResources();
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return await readCachedDesignResource(request.params.uri);
    });
  }

  public async searchAppleDocs(query: string, type: string = 'all') {
    try {
      // 输入验证
      const queryValidation = validateInput(query, 'Search query');
      if (queryValidation) {
        return createToolErrorResponse(queryValidation, 'search_apple_docs');
      }

      // 创建 Apple Developer Documentation 搜索 URL（仅用于展示/回退链接，实际请求走 JSON API）
      const searchUrl = `${APPLE_URLS.SEARCH}?q=${encodeURIComponent(query)}`;

      logger.info(`Searching Apple docs for: ${query}`);

      // 获取搜索结果：developer.apple.com/search 现在是客户端渲染的，HTML 里不再包含结果
      // (issue #51, #43)，改为直接调用该页面自己使用的内部 JSON 搜索接口。
      const results = await fetchAppleDocsSearch(query, type, searchUrl);

      // 格式化并返回搜索结果
      return formatSearchResultsResponse(results, query, searchUrl, type);
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        return createToolErrorResponse(error as any, 'search_apple_docs');
      }
      return createStandardErrorResponse(error, 'search_apple_docs');
    }
  }

  public async getAppleDocContent(
    url: string,
    includeRelatedApis: boolean = false,
    includeReferences: boolean = false,
    includeSimilarApis: boolean = false,
    includePlatformAnalysis: boolean = false,
  ) {
    try {
      // 输入验证
      const urlValidation = validateInput(url, 'URL');
      if (urlValidation) {
        return createToolErrorResponse(urlValidation, 'get_apple_doc_content');
      }

      // 验证是否为有效的Apple Developer URL
      if (!isValidAppleDeveloperUrl(url)) {
        return createToolErrorResponse({
          type: ErrorType.INVALID_INPUT,
          message: 'URL must be from developer.apple.com',
        }, 'get_apple_doc_content');
      }

      if (isAppleDesignUrl(url)) {
        return await this.getAppleDesignContent(url);
      }

      // fetchAppleDocJson 已经返回正确的MCP响应格式，直接返回
      return await fetchAppleDocJson(url, {
        includeRelatedApis,
        includeReferences,
        includeSimilarApis,
        includePlatformAnalysis,
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        return createToolErrorResponse(error as any, 'get_apple_doc_content');
      }
      return createStandardErrorResponse(error, 'get_apple_doc_content');
    }
  }

  public async listTechnologies(
    category?: string,
    language?: string,
    includeBeta: boolean = true,
    limit: number = API_LIMITS.DEFAULT_TECHNOLOGIES_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () => handleListTechnologies(category, language, includeBeta, limit),
      'listTechnologies',
    );
  }

  public async searchAppleDesignDocs(
    query: string,
    contentType: 'all' | 'hig' | 'resource' | 'page' = 'all',
    platform: string = 'all',
    limit: number = 20,
  ) {
    return this.handleToolResultOperation(
      () => handleSearchAppleDesignDocs({
        query,
        contentType,
        platform,
        limit,
      }),
      'search_apple_design_docs',
    );
  }

  public async getAppleDesignContent(url: string) {
    return this.handleToolResultOperation(
      () => handleGetAppleDesignContent({ url }),
      'get_apple_design_content',
    );
  }

  public async listAppleDesignResources(
    category?: string,
    platform?: string,
    format?: string,
    searchQuery?: string,
    limit: number = 50,
  ) {
    return this.handleToolResultOperation(
      () => handleListAppleDesignResources({
        category,
        platform,
        format,
        searchQuery,
        limit,
      }),
      'list_apple_design_resources',
    );
  }

  public async downloadAppleDesignResource(
    resourceId?: string,
    url?: string,
    maxBytes?: number,
  ) {
    return this.handleToolResultOperation(
      () => handleDownloadAppleDesignResource({
        resourceId,
        url,
        maxBytes,
      }),
      'download_apple_design_resource',
    );
  }

  public async getAppleDesignExamples(
    url?: string,
    resourceId?: string,
    query?: string,
    limit: number = 3,
  ) {
    return this.handleToolResultOperation(
      () => handleGetAppleDesignExamples({
        url,
        resourceId,
        query,
        limit,
      }),
      'get_apple_design_examples',
    );
  }

  public async searchFrameworkSymbols(framework: string, symbolType: string = 'all', namePattern?: string, language: string = 'swift', limit: number = API_LIMITS.DEFAULT_FRAMEWORK_SYMBOLS_LIMIT) {
    return this.handleAsyncOperation(
      () => searchFrameworkSymbols(framework, symbolType, namePattern, language, limit),
      'searchFrameworkSymbols',
    );
  }

  public async getRelatedApis(
    apiUrl: string,
    includeInherited: boolean = true,
    includeConformance: boolean = true,
    includeSeeAlso: boolean = true,
  ) {
    return this.handleAsyncOperation(
      () => handleGetRelatedApis(apiUrl, includeInherited, includeConformance, includeSeeAlso),
      'getRelatedApis',
    );
  }

  public async resolveReferencesBatch(sourceUrl: string, maxReferences: number = API_LIMITS.DEFAULT_REFERENCES_LIMIT, filterByType: string = 'all') {
    return this.handleAsyncOperation(
      () => handleResolveReferencesBatch(sourceUrl, maxReferences, filterByType),
      'resolveReferencesBatch',
    );
  }

  public async getPlatformCompatibility(apiUrl: string, compareMode: string = 'single', includeRelated: boolean = false) {
    return this.handleAsyncOperation(
      () => handleGetPlatformCompatibility(apiUrl, compareMode, includeRelated),
      'getPlatformCompatibility',
    );
  }

  public async findSimilarApis(
    apiUrl: string,
    searchDepth: string = 'medium',
    filterByCategory?: string,
    includeAlternatives: boolean = true,
  ) {
    return this.handleAsyncOperation(
      () => handleFindSimilarApis(apiUrl, searchDepth, filterByCategory, includeAlternatives),
      'findSimilarApis',
    );
  }

  public async getDocumentationUpdates(
    category: string = 'all',
    technology?: string,
    year?: string,
    searchQuery?: string,
    includeBeta: boolean = true,
    limit: number = API_LIMITS.DEFAULT_DOCUMENTATION_UPDATES_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () => handleGetDocumentationUpdates(category, technology, year, searchQuery, includeBeta, limit),
      'getDocumentationUpdates',
    );
  }

  public async getTechnologyOverviews(
    category?: string,
    platform: string = 'all',
    searchQuery?: string,
    includeSubcategories: boolean = true,
    limit: number = API_LIMITS.DEFAULT_TECHNOLOGY_OVERVIEWS_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () => handleGetTechnologyOverviews(category, platform, searchQuery, includeSubcategories, limit),
      'getTechnologyOverviews',
    );
  }

  public async getSampleCode(
    framework?: string,
    beta: 'include' | 'exclude' | 'only' = 'include',
    searchQuery?: string,
    limit: number = API_LIMITS.DEFAULT_SAMPLE_CODE_LIMIT,
  ) {
    return this.handleAsyncOperation(
      () => handleGetSampleCode(framework, beta, searchQuery, limit),
      'getSampleCode',
    );
  }

  async run() {
    const transport = new StdioServerTransport();

    await this.server.connect(transport);

    logger.info('Apple Developer Docs MCP server running on stdio');
    logger.info('WWDC Data: Using bundled data from npm package');
    logger.info('Cache system initialized with TTL: API(30m), Index(1h), Technologies(2h)');
    logger.info('Note: Search results are not cached to ensure real-time accuracy');

    // Start framework preloading and cache warming in background
    Promise.all([
      preloadPopularFrameworks(),
      warmUpCaches(),
    ]).catch(error => {
      logger.error('Background initialization failed:', error);
    });

    // Schedule periodic cache refresh (every 30 minutes)
    schedulePeriodicCacheRefresh();
  }
}

// Run server (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
  const server = new AppleDeveloperDocsMCPServer();
  void server.run().catch((error) => {
    logger.error('Fatal error in main():', error);
    process.exit(1);
  });
}
