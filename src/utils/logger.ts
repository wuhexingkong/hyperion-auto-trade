export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;

  constructor(level: string = 'info') {
    this.level = this.parseLogLevel(level);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message));
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message));
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message));
    }
  }

  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      const errorMessage = error ? `${message}: ${error.message}` : message;
      console.error(this.formatMessage('ERROR', errorMessage));
      if (error && error.stack) {
        console.error(error.stack);
      }
    }
  }
}

export const logger = new Logger(); 