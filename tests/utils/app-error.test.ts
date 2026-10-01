/**
 * AppError is a real Error subclass (so it can be thrown / used as a rejection reason) and the
 * MCP text the client receives for a failing tool is unchanged: "Error: <message>" plus suggestions.
 */
import {
  AppError,
  ErrorType,
  createToolErrorResponse,
  handleFetchError,
  withErrorHandling,
} from '../../src/utils/error-handler.js';

describe('AppError', () => {
  it('is an Error carrying type, message, suggestions and cause', () => {
    const cause = new Error('boom');
    const error = new AppError({ type: ErrorType.API_ERROR, message: 'failed', originalError: cause, suggestions: ['retry'] });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('failed');
    expect(error.type).toBe(ErrorType.API_ERROR);
    expect(error.originalError).toBe(cause);
    expect(error.cause).toBe(cause);
    expect(error.suggestions).toEqual(['retry']);
  });

  it('keeps the client-visible MCP error text (message, own suggestions, tool suggestions)', () => {
    const response = createToolErrorResponse(
      new AppError({ type: ErrorType.NOT_FOUND, message: 'Nothing here', suggestions: ['own hint'] }),
      'search_apple_docs',
    );

    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain('Error: Nothing here');
    expect(response.content[0].text).toContain('• own hint');
    expect(response.content[0].text).toContain('• Try broader search terms');
  });

  it('is what handleFetchError returns and what withErrorHandling throws', async () => {
    const fetchError = handleFetchError(new Error('HTTP 404: Not Found'), 'https://example.com/x');
    expect(fetchError).toBeInstanceOf(AppError);
    expect(fetchError.type).toBe(ErrorType.NOT_FOUND);

    await expect(withErrorHandling(() => Promise.reject(new Error('request timeout')), 'ctx')).rejects.toMatchObject({
      name: 'AppError',
      type: ErrorType.TIMEOUT,
    });
  });
});
