/**
 * Simple logger utility for consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private enabled: boolean = process.env.MCP_DEBUG === 'true';
  private level: LogLevel = LogLevel.INFO;

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled && this.shouldLog(LogLevel.DEBUG)) {
      // This server speaks JSON-RPC over stdout; any non-protocol byte on
      // stdout corrupts the stream and makes MCP clients drop the connection.
      // stdout is reserved for the MCP JSON-RPC stream — log to stderr instead.
      console.error(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.enabled && this.shouldLog(LogLevel.INFO)) {
      // stdout is reserved for the MCP JSON-RPC stream — log to stderr instead.
      console.error(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] ${message}`);
      if (error) {
        console.error(error);
      }
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const logger = new Logger();