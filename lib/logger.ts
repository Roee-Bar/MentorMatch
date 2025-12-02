/**
 * Enhanced Logger for Better Debugging
 * Provides colored, timestamped, and contextualized logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LogOptions {
  context?: string;
  data?: any;
  timestamp?: boolean;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    options?: LogOptions
  ): string {
    const parts: string[] = [];
    
    // Add timestamp if enabled (default in development)
    if (options?.timestamp !== false && this.isDevelopment) {
      parts.push(`[${this.getTimestamp()}]`);
    }
    
    // Add level
    const levelMap = {
      info: 'INFO',
      warn: 'WARN',
      error: 'ERROR',
      debug: 'DEBUG',
      success: 'SUCCESS'
    };
    parts.push(levelMap[level]);
    
    // Add context if provided
    if (options?.context) {
      parts.push(`[${options.context}]`);
    }
    
    // Add message
    parts.push(message);
    
    return parts.join(' ');
  }

  info(message: string, options?: LogOptions) {
    const formatted = this.formatMessage('info', message, options);
    console.log(formatted);
    if (options?.data) {
      console.log('  Data:', JSON.stringify(options.data, null, 2));
    }
  }

  warn(message: string, options?: LogOptions) {
    const formatted = this.formatMessage('warn', message, options);
    console.warn(formatted);
    if (options?.data) {
      console.warn('  Data:', JSON.stringify(options.data, null, 2));
    }
  }

  error(message: string, error?: Error | unknown, options?: LogOptions) {
    const formatted = this.formatMessage('error', message, options);
    console.error(formatted);
    
    if (error instanceof Error) {
      console.error('  Error Name:', error.name);
      console.error('  Error Message:', error.message);
      if (this.isDevelopment && error.stack) {
        console.error('  Stack Trace:\n', error.stack);
      }
    } else if (error) {
      console.error('  Error Details:', JSON.stringify(error, null, 2));
    }
    
    if (options?.data) {
      console.error('  Additional Data:', JSON.stringify(options.data, null, 2));
    }
  }

  debug(message: string, options?: LogOptions) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, options);
      console.debug(formatted);
      if (options?.data) {
        console.debug('  Data:', JSON.stringify(options.data, null, 2));
      }
    }
  }

  success(message: string, options?: LogOptions) {
    const formatted = this.formatMessage('success', message, options);
    console.log(formatted);
    if (options?.data) {
      console.log('  Data:', JSON.stringify(options.data, null, 2));
    }
  }

  // API-specific logging
  api = {
    request: (method: string, path: string, options?: { userId?: string; body?: any }) => {
      this.info(`${method} ${path}`, {
        context: 'API',
        data: options
      });
    },
    
    response: (method: string, path: string, status: number, duration?: number) => {
      const message = duration 
        ? `${method} ${path} - ${status} (${duration}ms)`
        : `${method} ${path} - ${status}`;
      
      if (status >= 200 && status < 300) {
        this.success(message, { context: 'API' });
      } else if (status >= 400) {
        this.error(message, undefined, { context: 'API' });
      } else {
        this.info(message, { context: 'API' });
      }
    },
    
    error: (method: string, path: string, error: Error | unknown) => {
      this.error(`${method} ${path} - Request failed`, error, { context: 'API' });
    }
  };

  // Firebase-specific logging
  firebase = {
    init: () => {
      this.success('Firebase Admin SDK initialized', { context: 'Firebase' });
    },
    
    query: (collection: string, operation: string) => {
      this.debug(`${operation} on collection: ${collection}`, { context: 'Firebase' });
    },
    
    error: (operation: string, error: Error | unknown) => {
      this.error(`Firebase operation failed: ${operation}`, error, { context: 'Firebase' });
    }
  };

  // Webpack/Build-specific logging
  build = {
    cache: (message: string, error?: Error) => {
      if (error) {
        this.warn(`Cache issue: ${message}`, {
          context: 'Webpack',
          data: { error: error.message }
        });
      } else {
        this.debug(message, { context: 'Webpack' });
      }
    },
    
    error: (message: string, error: Error | unknown) => {
      this.error(message, error, { context: 'Build' });
    }
  };
}

// Export singleton instance
export const logger = new Logger();

