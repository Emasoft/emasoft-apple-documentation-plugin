/**
 * Tests for the logger utility.
 *
 * MCP speaks JSON-RPC over stdout; any byte logger writes to stdout corrupts
 * the protocol stream and makes clients drop the connection (upstream
 * issues #33/#40/#41). debug()/info() must therefore go to stderr only.
 */
import { logger, LogLevel } from '../../src/utils/logger';

describe('logger', () => {
  const originalLog = console.log;
  const originalError = console.error;

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    logger.setEnabled(false);
    logger.setLevel(LogLevel.INFO);
  });

  it('never writes debug/info to stdout, even when MCP_DEBUG is enabled', () => {
    const logSpy = jest.fn();
    const errorSpy = jest.fn();
    console.log = logSpy;
    console.error = errorSpy;

    // `enabled` is normally fixed at construction from MCP_DEBUG; setEnabled
    // lets the test flip it at runtime without re-importing the module.
    // Level also defaults to INFO, which filters DEBUG out via shouldLog().
    logger.setEnabled(true);
    logger.setLevel(LogLevel.DEBUG);
    logger.debug('debug message');
    logger.info('info message');

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('[DEBUG] debug message');
    expect(errorSpy).toHaveBeenCalledWith('[INFO] info message');
  });
});
