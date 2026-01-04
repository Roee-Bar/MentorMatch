/**
 * Enhanced Logger for Better Debugging
 * Provides colored, timestamped, and contextualized logging
 */

import { getCorrelationId } from './middleware/correlation-id';

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
    
    // Add correlation ID if available
    const correlationId = getCorrelationId();
    if (correlationId) {
      parts.push(`[${correlationId.substring(0, 8)}]`);
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

  private enrichData(options?: LogOptions): LogOptions | undefined {
    if (!options) return undefined;
    
    const correlationId = getCorrelationId();
    if (correlationId) {
      return {
        ...options,
        data: {
          ...options.data,
          correlationId,
        },
      };
    }
    
    return options;
  }

  info(message: string, options?: LogOptions) {
    const enrichedOptions = this.enrichData(options);
    const formatted = this.formatMessage('info', message, enrichedOptions);
    console.log(formatted);
    if (enrichedOptions?.data) {
      console.log('  Data:', JSON.stringify(enrichedOptions.data, null, 2));
    }
  }

  warn(message: string, options?: LogOptions) {
    const enrichedOptions = this.enrichData(options);
    const formatted = this.formatMessage('warn', message, enrichedOptions);
    console.warn(formatted);
    if (enrichedOptions?.data) {
      console.warn('  Data:', JSON.stringify(enrichedOptions.data, null, 2));
    }
  }

  error(message: string, error?: Error | unknown, options?: LogOptions) {
    const enrichedOptions = this.enrichData(options);
    const formatted = this.formatMessage('error', message, enrichedOptions);
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
    
    if (enrichedOptions?.data) {
      console.error('  Additional Data:', JSON.stringify(enrichedOptions.data, null, 2));
    }
  }

  debug(message: string, options?: LogOptions) {
    if (this.isDevelopment) {
      const enrichedOptions = this.enrichData(options);
      const formatted = this.formatMessage('debug', message, enrichedOptions);
      console.debug(formatted);
      if (enrichedOptions?.data) {
        console.debug('  Data:', JSON.stringify(enrichedOptions.data, null, 2));
      }
    }
  }

  success(message: string, options?: LogOptions) {
    const enrichedOptions = this.enrichData(options);
    const formatted = this.formatMessage('success', message, enrichedOptions);
    console.log(formatted);
    if (enrichedOptions?.data) {
      console.log('  Data:', JSON.stringify(enrichedOptions.data, null, 2));
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

  // Service-specific logging
  service = {
    /**
     * Log a service operation starting (debug level)
     * @param serviceName - Name of the service (e.g., 'StudentService')
     * @param operation - Operation name (e.g., 'getStudentById')
     * @param data - Optional data to log
     */
    operation: (serviceName: string, operation: string, data?: Record<string, unknown>) => {
      this.debug(`${serviceName}.${operation}`, {
        context: 'Service',
        data
      });
    },
    
    /**
     * Log a successful service operation
     * @param serviceName - Name of the service
     * @param operation - Operation name
     * @param data - Optional data to log
     */
    success: (serviceName: string, operation: string, data?: Record<string, unknown>) => {
      this.success(`${serviceName}.${operation} completed`, {
        context: 'Service',
        data
      });
    },
    
    /**
     * Log a failed service operation
     * @param serviceName - Name of the service
     * @param operation - Operation name
     * @param error - The error that occurred
     * @param data - Optional additional data to log
     */
    error: (serviceName: string, operation: string, error: Error | unknown, data?: Record<string, unknown>) => {
      this.error(`${serviceName}.${operation} failed`, error, {
        context: 'Service',
        data
      });
    },

    /**
     * Log a warning in a service operation
     * @param serviceName - Name of the service
     * @param operation - Operation name
     * @param message - Warning message
     * @param data - Optional data to log
     */
    warn: (serviceName: string, operation: string, message: string, data?: Record<string, unknown>) => {
      this.warn(`${serviceName}.${operation}: ${message}`, {
        context: 'Service',
        data
      });
    }
  };
}

// Export singleton instance
export const logger = new Logger();

