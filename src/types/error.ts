/**
 * Error handling types
 */

/**
 * Application error types
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Application error. A real Error subclass so it can be thrown and used as a
 * Promise rejection reason (only-throw-error / prefer-promise-reject-errors).
 */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly originalError?: Error;
  // mutable: createToolErrorResponse appends tool-specific suggestions
  suggestions?: string[];

  constructor(init: { type: ErrorType; message: string; originalError?: Error; suggestions?: string[] }) {
    super(init.message, init.originalError ? { cause: init.originalError } : undefined);
    this.name = 'AppError';
    this.type = init.type;
    this.originalError = init.originalError;
    this.suggestions = init.suggestions;
  }
}

/**
 * MCP Error response structure
 */
export interface ErrorResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError: boolean;
}