interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const LOG_LEVEL_VALUES = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  private logLevel: string;

  constructor() {
    this.logLevel = process.env["LOG_LEVEL"] || 'info';
  }

  private shouldLog(level: string): boolean {
    return LOG_LEVEL_VALUES[level as keyof typeof LOG_LEVEL_VALUES] <= 
           LOG_LEVEL_VALUES[this.logLevel as keyof typeof LOG_LEVEL_VALUES];
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
