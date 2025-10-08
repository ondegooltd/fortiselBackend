import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor(private configService: ConfigService) {
    this.logger = winston.createLogger({
      level: this.configService.get('logging.level') || 'info',
      format:
        this.configService.get('logging.format') === 'json'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(
                ({ timestamp, level, message, context, ...meta }) => {
                  return `${timestamp} [${level}] ${message} ${context ? JSON.stringify(context) : ''} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                },
              ),
            ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  log(message: string, context?: string | LogContext) {
    this.logger.info(message, this.formatContext(context));
  }

  error(message: string, trace?: string, context?: string | LogContext) {
    this.logger.error(message, trace, this.formatContext(context));
  }

  warn(message: string, context?: string | LogContext) {
    this.logger.warn(message, this.formatContext(context));
  }

  debug(message: string, context?: string | LogContext) {
    if (this.logger.debug) {
      this.logger.debug(message, this.formatContext(context));
    }
  }

  verbose(message: string, context?: string | LogContext) {
    if (this.logger.verbose) {
      this.logger.verbose(message, this.formatContext(context));
    }
  }

  // Custom logging methods for application-specific events
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext,
  ) {
    this.log('HTTP Request', {
      ...context,
      method,
      url,
      statusCode,
      responseTime,
      type: 'http_request',
    });
  }

  logError(error: Error, context?: LogContext) {
    this.error('Application Error', error.stack, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      type: 'application_error',
    });
  }

  logSecurity(event: string, context?: LogContext) {
    this.warn(`Security Event: ${event}`, {
      ...context,
      type: 'security_event',
      event,
    });
  }

  logPerformance(operation: string, duration: number, context?: LogContext) {
    this.log(`Performance: ${operation}`, {
      ...context,
      operation,
      duration,
      type: 'performance',
    });
  }

  logDatabase(
    operation: string,
    collection: string,
    duration: number,
    context?: LogContext,
  ) {
    this.log(`Database: ${operation}`, {
      ...context,
      operation,
      collection,
      duration,
      type: 'database',
    });
  }

  private formatContext(context?: string | LogContext): string | LogContext {
    if (typeof context === 'string') {
      return context;
    }

    if (context) {
      return {
        ...context,
        timestamp: new Date().toISOString(),
        service: 'fortisel-backend',
        version: process.env.npm_package_version || '1.0.0',
      };
    }

    return {
      timestamp: new Date().toISOString(),
      service: 'fortisel-backend',
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}
